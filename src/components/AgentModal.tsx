import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2 } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { useAgenTickStatus } from '../hooks/useAgentrickStatus';
import { generateAgentResponse } from '../utils/agentrickUtils';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentModal({ open, onOpenChange }: AgentModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { status: agentStatus } = useAgenTickStatus();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Reset state when modal state changes
  useEffect(() => {
    if (!open) {
      // If there's an ongoing request, abort it
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      
      // Immediately set processing to false to avoid UI getting stuck
      setIsProcessing(false);
      
      // We'll delay clearing messages so they don't flash if modal reopens quickly
      const timer = setTimeout(() => {
        if (!open) { // Double check it's still closed
          setMessages([]);
          setInput('');
        }
      }, 300);
      
      // Enable AgenTick mode when modal is closed
      localStorage.setItem('AgenTick', JSON.stringify(true));
      
      return () => clearTimeout(timer);
    } else if (open && messages.length === 0) {
      // Add welcome message when modal is opened and no messages exist
      const initialMessage: Message = {
        id: Date.now().toString(),
        content: "Welcome to Agent Mode! How can I assist you today?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, [open]);

  // Clean up any ongoing operations when component unmounts
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    // Clean up any previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    
    // Create a new AbortController for this request
    controllerRef.current = new AbortController();

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Create placeholder for agent response
    const agentResponseId = (Date.now() + 1).toString();
    const initialAgentResponse: Message = {
      id: agentResponseId,
      content: "",
      isUser: false,
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, initialAgentResponse]);

    try {
      // Convert message history for context
      const history = messages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      // Get agent response
      await generateAgentResponse(
        input,
        (token, isDone) => {
          // Check if modal was closed or request was aborted
          if (controllerRef.current?.signal.aborted) return;
          
          if (!isDone) {
            setMessages(prev => {
              const updated = [...prev];
              const messageIndex = updated.findIndex(msg => msg.id === agentResponseId);
              if (messageIndex !== -1) {
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  content: updated[messageIndex].content + token,
                };
              }
              return updated;
            });
          } else {
            setMessages(prev => {
              const updated = [...prev];
              const messageIndex = updated.findIndex(msg => msg.id === agentResponseId);
              if (messageIndex !== -1) {
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  isStreaming: false,
                };
              }
              return updated;
            });
            setIsProcessing(false);
            controllerRef.current = null;
          }
        },
        history
      );
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Error getting agent response:', error);
      setMessages(prev => {
        const updated = [...prev];
        const messageIndex = updated.findIndex(msg => msg.id === agentResponseId);
        if (messageIndex !== -1) {
          updated[messageIndex] = {
            ...updated[messageIndex],
            content: `Error: ${error.message || 'Failed to generate response'}`,
            isStreaming: false,
          };
        }
        return updated;
      });
      setIsProcessing(false);
      controllerRef.current = null;
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    // Immediately set processing to false to ensure the UI isn't frozen
    if (!open) {
      setIsProcessing(false);
      
      // If there's an ongoing request, abort it
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    }
    
    // Then notify parent component about the change
    onOpenChange(open);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Agent Mode
            <div className="ml-2">
              <StatusIndicator status={agentStatus} name="Agent" />
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow px-4">
          <div className="space-y-4 mb-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans">
                    {message.content}
                    {message.isStreaming && (
                      <Loader2 className="h-4 w-4 animate-spin inline ml-2" />
                    )}
                  </pre>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-4 border-t">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the agent anything..."
            disabled={isProcessing || agentStatus === 'offline'}
            className="flex-grow"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing || agentStatus === 'offline'}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
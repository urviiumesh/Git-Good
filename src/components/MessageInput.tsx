import React, { useState, useRef, RefObject, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MicOff, Mic, Settings, Sparkles, Trash2, ListOrdered, BrainCircuit, Bot, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useServerStatus } from "../hooks/useServerStatus";
import { useAgenTickStatus } from "../hooks/useAgentrickStatus";
import { AgentModal } from './AgentModal';
import { SpeechRecognitionService } from '@/utils/speechUtils';
import VoiceCommandButton from './VoiceCommandButton';
import { VoiceCommand } from '@/utils/voiceService';

interface MessageInputProps {
  onSendMessage: (message: string, options: { sequentialThinking: boolean, selfDestruct: boolean, AgenTick: boolean }) => void;
  isProcessing: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  onSequentialThinkingChange?: (enabled: boolean) => void;
  onSelfDestructChange?: (enabled: boolean) => void;
  selfDestructEnabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isProcessing,
  inputRef,
  onSequentialThinkingChange,
  onSelfDestructChange,
  selfDestructEnabled = false
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [recognitionStatus, setRecognitionStatus] = useState<string | null>(null);
  const defaultInputRef = useRef<HTMLTextAreaElement>(null);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const speechRecognition = useRef<SpeechRecognitionService | null>(null);
  
  // AI options state
  const [selfDestructing, setSelfDestructing] = useState(selfDestructEnabled);
  const [sequentialThinking, setSequentialThinking] = useState(false);
  const [AgenTick, setAgenTick] = useState(false);
  
  // Update self-destructing state when prop changes
  useEffect(() => {
    setSelfDestructing(selfDestructEnabled);
  }, [selfDestructEnabled]);
  
  // Server status state
  const { mcpStatus, checkMcpStatus } = useServerStatus();
  const { status: AgenTickStatus } = useAgenTickStatus();
  
  // Use provided inputRef or fallback to local defaultInputRef
  const resolvedInputRef = inputRef || defaultInputRef;

  // Handle attempt to toggle AgenTick
  const handleAgenTickChange = () => {
    setAgentModalOpen(true);
  };
  
  // Update AgenTick in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('AgenTick', JSON.stringify(AgenTick));
  }, [AgenTick]);
  
  // Set AgenTick mode when agent modal is closed
  const handleAgentModalChange = (open: boolean) => {
    setAgentModalOpen(open);
    
    if (!open) {
      // When modal is closed, enable AgenTick mode
      setAgenTick(true);
      
      // Set a small timeout to allow any pending operations to complete
      setTimeout(() => {
        // Re-focus the input field when the modal is closed
        if (resolvedInputRef && resolvedInputRef.current) {
          resolvedInputRef.current.focus();
        }
        // Refresh the page after a short delay
        window.location.reload();
      }, 100);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    speechRecognition.current = new SpeechRecognitionService();
    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stopListening();
      }
    };
  }, []);

  const handleVoiceToggle = () => {
    if (!speechRecognition.current) return;

    if (isRecording) {
      speechRecognition.current.stopListening();
      setIsRecording(false);
      setRecognitionError(null);
      setRecognitionStatus(null);
    } else {
      speechRecognition.current.startListening(
        (text) => {
          setInput(prev => prev + (prev ? ' ' : '') + text);
          setRecognitionError(null);
        },
        (error) => {
          setRecognitionError(error);
          setIsRecording(false);
        },
        (status) => {
          setRecognitionStatus(status);
        }
      );
      setIsRecording(true);
    }
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    onSendMessage(input, { sequentialThinking, selfDestruct: selfDestructing, AgenTick: AgenTick });
    setInput('');
  };

  const handleSequentialThinkingToggle = (enabled: boolean) => {
    setSequentialThinking(enabled);
    onSequentialThinkingChange?.(enabled);
  };

  const handleSelfDestructToggle = (enabled: boolean) => {
    setSelfDestructing(enabled);
    onSelfDestructChange?.(enabled);
  };

  // Handle pressing Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Define voice commands
  const voiceCommands: VoiceCommand[] = [
    {
      command: 'new conversation',
      action: () => {
        setInput('');
        // Add any additional new conversation logic here
      },
      aliases: ['start new', 'new chat', 'clear chat']
    },
    {
      command: 'change theme',
      action: () => {
        // Toggle theme logic here
        document.documentElement.classList.toggle('dark');
      },
      aliases: ['toggle theme', 'switch theme', 'dark mode', 'light mode']
    },
    {
      command: 'sequential thinking',
      action: () => {
        handleSequentialThinkingToggle(!sequentialThinking);
      },
      aliases: ['toggle sequential', 'step by step', 'sequential mode']
    },
    {
      command: 'self destruct',
      action: () => {
        handleSelfDestructToggle(!selfDestructing);
      },
      aliases: ['toggle self destruct', 'destruct mode', 'self destruct mode']
    },
    {
      command: 'send message',
      action: () => {
        if (input.trim() && !isProcessing) {
          handleSendMessage();
        }
      },
      aliases: ['send', 'submit', 'post message']
    }
  ];

  const handleVoiceStatusChange = (status: string) => {
    // You can add additional handling for voice command status changes here
    console.log('Voice command status:', status);
  };

  return (
    <>
      <div className="flex flex-col w-full bg-background">
        <div className="relative flex w-full items-center">
          <textarea
            ref={resolvedInputRef as RefObject<HTMLTextAreaElement>}
            className={cn(
              "flex min-h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pr-10 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
            placeholder={isProcessing ? "Processing..." : "Type a message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            rows={1}
            style={{ maxHeight: '150px', overflowY: 'auto' }}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 mr-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-8 w-8",
                      isRecording && "text-destructive",
                      recognitionError && "text-destructive"
                    )}
                    onClick={handleVoiceToggle}
                    disabled={isProcessing}
                  >
                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {recognitionError 
                      ? recognitionError 
                      : isRecording 
                        ? "Stop dictation" 
                        : "Voice dictation"}
                  </p>
                  {recognitionStatus && (
                    <p className="text-xs text-muted-foreground mt-1">{recognitionStatus}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Sparkles size={16} />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuCheckboxItem
                  checked={selfDestructing}
                  onCheckedChange={handleSelfDestructToggle}
                  className={selfDestructing ? "text-destructive" : ""}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Self-destructing conversation</span>
                </DropdownMenuCheckboxItem>
                
                <div className="flex items-center justify-between px-2 py-1.5">
                  <DropdownMenuCheckboxItem
                    checked={sequentialThinking}
                    onCheckedChange={handleSequentialThinkingToggle}
                    disabled={mcpStatus === 'offline'}
                  >
                    <BrainCircuit className="h-4 w-4 mr-2" />
                    <span>Sequential thinking</span>
                  </DropdownMenuCheckboxItem>
                  
                  <StatusIndicator 
                    status={mcpStatus} 
                    name="MCP" 
                    className="ml-2"
                  />
                </div>

                <DropdownMenuCheckboxItem
                  checked={AgenTick}
                  onClick={handleAgenTickChange}
                  className="cursor-pointer"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Agent Mode</span>
                      <StatusIndicator status={AgenTickStatus} name="Agent" />
                    </div>
                    <span className="text-xs text-muted-foreground">Click to open agent interface</span>
                  </div>
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-xs" 
                    onClick={() => {
                      checkMcpStatus();
                      // Force status refresh by fetching again
                      fetch('http://localhost:5000/api/agents/health');
                    }}
                  >
                    Refresh server status
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <VoiceCommandButton 
              commands={voiceCommands}
              onStatusChange={handleVoiceStatusChange}
              className="h-8 w-8"
            />
          </div>
          
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isProcessing}
            className={cn(
              "flex-shrink-0 h-8 sm:h-10 px-3 sm:px-4",
              isProcessing ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
              selfDestructing && !isProcessing && "bg-destructive hover:bg-destructive/90"
            )}
          >
            <Send size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </div>
      
      <AgentModal 
        open={agentModalOpen} 
        onOpenChange={handleAgentModalChange} 
      />
    </>
  );
};

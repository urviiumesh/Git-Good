import React, { useState, useEffect, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { SuggestionsGrid } from './SuggestionsGrid';
import { generateStreamingResponse, testStreamingConnection } from '@/utils/modelService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useServerStatus } from '../hooks/useServerStatus';
import { AlertTriangle, BrainCircuit, FastForward } from 'lucide-react';
import { checkSequentialThinkingServer, resetSequentialThinkingServer, forceCompleteThinking } from '../utils/serverUtils';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
};

const exampleSuggestions = [
  "What are the best practices for secure API design?",
  "How can I improve database query performance?",
  "Explain the concepts of authentication vs authorization",
  "What are the key principles of responsive design?",
];

interface ChatInterfaceProps {
  activeConversationId?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeConversationId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { mcpStatus, checkMcpStatus } = useServerStatus();
  const [sequentialThinkingEnabled, setSequentialThinkingEnabled] = useState(false);
  const [thinkingTooLong, setThinkingTooLong] = useState(false);

  // Reset messages when switching conversations
  useEffect(() => {
    // If we have an active conversation, we'd load its messages from the server
    // For now, we'll just simulate this with a basic reset and dummy message
    if (activeConversationId) {
      // This would be replaced with an API call to get conversation history
      setMessages([
        {
          id: 'prev-1',
          content: `This is a continuation of conversation ${activeConversationId}. How can I help you further?`,
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    } else {
      // New conversation
      setMessages([]);
    }
  }, [activeConversationId]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Format text by replacing escape sequences with actual line breaks
  const formatText = (text: string): string => {
    // Replace escaped newlines with actual line breaks
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  };

  const handleSendMessage = async (inputText: string) => {
    console.log("Sending message:", inputText);
    
    if (!inputText.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    // Create placeholder for streaming bot response
    const botResponseId = (Date.now() + 1).toString();
    console.log(`Creating bot response with ID: ${botResponseId}`);
    
    const initialBotResponse: Message = {
      id: botResponseId,
      content: "",
      isUser: false,
      timestamp: new Date(),
      isStreaming: true,
    };
    
    setMessages(prev => [...prev, initialBotResponse]);
    
    try {
      console.log("Fetching streaming response from model...");
      
      // Debug variable to track tokens
      let tokenCount = 0;
      
      // Use streaming response
      await generateStreamingResponse(
        inputText,
        (token, isDone) => {
          if (!isDone) {
            // Increment token counter
            tokenCount++;
            console.log(`Received token #${tokenCount}: "${token}"`);
            
            // Update the bot message with new token
            setMessages(prev => {
              const updated = [...prev];
              const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
              
              if (messageIndex !== -1) {
                const formattedToken = formatText(token);
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  content: updated[messageIndex].content + formattedToken,
                };
                console.log(`Updated message content, new length: ${updated[messageIndex].content.length}`);
              } else {
                console.warn(`Message with ID ${botResponseId} not found!`);
              }
              
              return updated;
            });
            
            // Force scroll on each new token
            setTimeout(() => {
              const messagesContainer = document.querySelector('.overflow-auto');
              if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
            }, 0);
          } else {
            // Stream complete
            console.log(`Stream complete, received ${tokenCount} tokens total`);
            
            // Update message to remove streaming flag
            setMessages(prev => {
              const updated = [...prev];
              const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
              
              if (messageIndex !== -1) {
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  isStreaming: false,
                };
                console.log(`Final message length: ${updated[messageIndex].content.length}`);
              } else {
                console.warn(`Unable to find message with ID ${botResponseId} to mark as complete`);
              }
              
              return updated;
            });
            
            // End processing state
            setIsProcessing(false);
          }
        },
        50
      );
    } catch (error) {
      console.error('Error generating response:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to generate response from the local model. Please ensure the model server is running.',
        variant: 'destructive',
      });
      
      // Update the streaming message with error
      setMessages(prev => {
        const updated = [...prev];
        const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
        
        if (messageIndex !== -1) {
          updated[messageIndex] = {
            ...updated[messageIndex],
            content: `Sorry, I encountered an error: ${error.message}. Please ensure the local model server is running.`,
            isStreaming: false,
          };
        }
        
        return updated;
      });
      
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };
  
  // Test function for debugging streaming
  const testStreaming = async () => {
    console.log("Testing streaming connection...");
    
    // Create a test message in the chat
    const testMessageId = Date.now().toString();
    
    const testMessage: Message = {
      id: testMessageId,
      content: "Testing streaming connection...",
      isUser: false,
      timestamp: new Date(),
      isStreaming: true,
    };
    
    setMessages(prev => [...prev, testMessage]);
    setIsProcessing(true);
    
    try {
      await testStreamingConnection((message, isDone) => {
        if (!isDone) {
          // Update message with streamed content
          setMessages(prev => {
            const updated = [...prev];
            const messageIndex = updated.findIndex(msg => msg.id === testMessageId);
            
            if (messageIndex !== -1) {
              updated[messageIndex] = {
                ...updated[messageIndex],
                content: updated[messageIndex].content + "\n" + message,
              };
            }
            
            return updated;
          });
        } else {
          // End streaming
          setMessages(prev => {
            const updated = [...prev];
            const messageIndex = updated.findIndex(msg => msg.id === testMessageId);
            
            if (messageIndex !== -1) {
              updated[messageIndex] = {
                ...updated[messageIndex],
                content: updated[messageIndex].content + "\nStreaming test complete!",
                isStreaming: false,
              };
            }
            
            return updated;
          });
          
          setIsProcessing(false);
        }
      });
    } catch (error) {
      console.error("Streaming test error:", error);
      toast({
        title: 'Test Error',
        description: `Streaming test failed: ${error.message}`,
        variant: 'destructive',
      });
      
      setIsProcessing(false);
    }
  };

  // Show warning if sequential thinking is enabled but server is offline
  const showServerWarning = sequentialThinkingEnabled && mcpStatus === 'offline';
  
  // Add handler for sequential thinking state
  const handleSequentialThinkingChange = (enabled: boolean) => {
    setSequentialThinkingEnabled(enabled);
  };

  // Add a useEffect hook to detect when thinking is taking too long
  useEffect(() => {
    let thinkingTimer: NodeJS.Timeout | null = null;
    
    if (isProcessing && sequentialThinkingEnabled && mcpStatus === 'online') {
      // Set a timer to check if thinking is taking too long (30 seconds)
      thinkingTimer = setTimeout(() => {
        setThinkingTooLong(true);
      }, 30000); // 30 seconds
    } else {
      setThinkingTooLong(false);
    }
    
    return () => {
      if (thinkingTimer) {
        clearTimeout(thinkingTimer);
      }
    };
  }, [isProcessing, sequentialThinkingEnabled, mcpStatus]);

  return (
    <div className="flex flex-col h-full max-w-4xl w-full mx-auto p-4 md:p-6">
      <ChatHeader />
      
      {showServerWarning && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 px-4 py-2 mb-4 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm">Sequential thinking server is offline but the feature is enabled. Responses will fall back to standard mode.</p>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="ml-4 bg-amber-200/50 dark:bg-amber-800/50 border-amber-300 dark:border-amber-700"
            onClick={() => checkMcpStatus()}
          >
            Refresh Status
          </Button>
        </div>
      )}
      
      {sequentialThinkingEnabled && mcpStatus === 'online' && isProcessing && thinkingTooLong && (
        <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400 px-4 py-2 mb-4 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <BrainCircuit className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm">Sequential thinking seems to be taking a while. The process might be stuck.</p>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="ml-4 bg-blue-200/50 dark:bg-blue-800/50 border-blue-300 dark:border-blue-700"
            onClick={async () => {
              const success = await forceCompleteThinking();
              if (success) {
                toast({
                  title: 'Thinking Completed',
                  description: 'Sequential thinking process was manually completed.',
                });
                setThinkingTooLong(false);
              } else {
                toast({
                  title: 'Error',
                  description: 'Failed to force completion. Please try resetting the server.',
                  variant: 'destructive',
                });
              }
            }}
          >
            <FastForward className="h-4 w-4 mr-1" />
            Force Complete
          </Button>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-2">
        <div></div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testStreaming}
          disabled={isProcessing}
        >
          Test Streaming
        </Button>
      </div>
      
      <MessageList messages={messages} isProcessing={isProcessing} />

      {messages.length === 0 && (
        <SuggestionsGrid 
          suggestions={exampleSuggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      )}

      <MessageInput 
        onSendMessage={handleSendMessage} 
        isProcessing={isProcessing}
        inputRef={inputRef}
      />
    </div>
  );
};

export default ChatInterface;

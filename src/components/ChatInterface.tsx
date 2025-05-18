import React, { useState, useEffect, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { SuggestionsGrid } from './SuggestionsGrid';
import { generateStreamingResponse, testStreamingConnection } from '@/utils/modelService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useServerStatus } from '../hooks/useServerStatus';
import { AlertTriangle, BrainCircuit, FastForward, Bot, UserIcon } from 'lucide-react';
import { checkSequentialThinkingServer, resetSequentialThinkingServer, forceCompleteThinking } from '../utils/serverUtils';
import { generateAgentResponse, generateFallbackResponse, getUpdatedUserProfile, checkAgentServer } from '../utils/agentrickUtils';
import { 
  addMessageToConversation, 
  updateMessageInConversation, 
  createConversation,
  markConversationSelfDestruct,
  isConversationSelfDestruct
} from '@/utils/conversationUtils';
import { 
  isMcpResourceUri, 
  parseMcpToolCall,
  callMcpToolWithStreaming,
  handleMcpContentStreaming
} from '@/utils/mcpUtils';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
  agentRole?: string;
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
  const [selfDestructEnabled, setSelfDestructEnabled] = useState(false);
  const [agentServerStatus, setAgentServerStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [messageHistory, setMessageHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [userPrompted, setUserPrompted] = useState<boolean>(false);
  const UPDATE_INTERVAL = 300; // Update storage every 300ms

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

  // Check agent server status
  useEffect(() => {
    const checkStatus = async () => {
      const isAvailable = await checkAgentServer();
      setAgentServerStatus(isAvailable ? 'online' : 'offline');
      
      // If agent server is online and user hasn't been prompted yet, ask for their role
      if (isAvailable && !userPrompted && messages.length === 0) {
        setTimeout(() => {
          promptForUserRole();
        }, 1000);
      }
    };
    
    checkStatus();
    
    // Set up a periodic check
    const intervalId = setInterval(checkStatus, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [userPrompted, messages.length]);

  // Prompt the user for their role information
  const promptForUserRole = () => {
    const botMessage: Message = {
      id: Date.now().toString(),
      content: "To provide more personalized responses, I'd like to know more about you. What's your role in your team? (e.g., developer, designer, architect, etc.)",
      isUser: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, botMessage]);
    setUserPrompted(true);
  };

  // Detect if user is responding to role prompt
  useEffect(() => {
    if (userPrompted && messages.length >= 2) {
      const lastMsg = messages[messages.length - 1];
      const prevMsg = messages[messages.length - 2];
      
      // Check if the previous message was our prompt and the last message is from the user
      if (lastMsg.isUser && prevMsg && !prevMsg.isUser && 
          prevMsg.content.includes("what's your role") && 
          lastMsg.content.trim().length > 0) {
        // Parse user role from their response
        const userRole = lastMsg.content.toLowerCase().trim();
        console.log("Detected user role:", userRole);
        
        // Store the role in the user profile
        const updatedProfile = getUpdatedUserProfile({ role: userRole });
        
        // Acknowledge the role in a new message
        const botMessage: Message = {
          id: Date.now().toString(),
          content: `Thanks! I'll tailor my responses to your role as a ${userRole}.`,
          isUser: false,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
    }
  }, [messages, userPrompted]);

  // Update message history when messages change
  useEffect(() => {
    const history = messages.map(msg => ({
      role: msg.isUser ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
    
    setMessageHistory(history);
  }, [messages]);

  // Handle self-destruct change
  const handleSelfDestructChange = (enabled: boolean) => {
    setSelfDestructEnabled(enabled);
  };

  // Add event listener for agent status changes
  useEffect(() => {
    const handleAgentStatusChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.status === 'offline') {
        // If agent server went offline, reset processing state
        setIsProcessing(false);
        toast({
          title: 'Agent Server Offline',
          description: 'The agent server is no longer available. Your conversation will continue in standard mode.',
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('agentStatusChanged', handleAgentStatusChange);
    return () => window.removeEventListener('agentStatusChanged', handleAgentStatusChange);
  }, [toast]);
  
  // Add useEffect to check for AgenTick state in localStorage on mount and when it changes
  useEffect(() => {
    // Check if AgenTick is enabled in localStorage
    const savedAgenTick = localStorage.getItem('AgenTick');
    if (savedAgenTick) {
      const isAgenTickEnabled = JSON.parse(savedAgenTick);
      console.log(`AgenTick mode is ${isAgenTickEnabled ? 'enabled' : 'disabled'} from localStorage`);
      
      // Reset processing state if needed to prevent UI from being stuck
      if (isProcessing) {
        setIsProcessing(false);
      }
    }
    
    // Set up listener for storage changes to detect when AgenTick is toggled
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'AgenTick') {
        console.log('AgenTick state changed in localStorage');
        // Reset processing state to ensure UI isn't stuck
        setIsProcessing(false);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isProcessing]);

  const handleSendMessage = async (inputText: string, options: { sequentialThinking: boolean, selfDestruct: boolean, AgenTick: boolean }) => {
    console.log("Sending message:", inputText, "with options:", options);
    
    if (!inputText.trim()) return;
    
    // Make sure we have an active conversation
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      const newConvo = await createConversation('New Conversation', options.selfDestruct);
      currentConversationId = newConvo.id;
      // Update self-destruct state for new conversation
      setSelfDestructEnabled(options.selfDestruct);
    } else if (options.selfDestruct && !isConversationSelfDestruct(currentConversationId)) {
      // If existing conversation needs to be marked as self-destructing
      markConversationSelfDestruct(currentConversationId)
        .then(success => {
          if (success) {
            console.log(`Marked conversation ${currentConversationId} for self-destruct`);
          } else {
            console.warn(`Failed to mark conversation ${currentConversationId} for self-destruct`);
          }
        });
      setSelfDestructEnabled(true);
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      isUser: true,
      timestamp: new Date(),
    };
    
    // Add to state and storage
    setMessages(prev => [...prev, userMessage]);
    await addMessageToConversation(currentConversationId, userMessage);
    
    setIsProcessing(true);
    
    // Create placeholder for bot response
    const botResponseId = (Date.now() + 1).toString();
    console.log(`Creating bot response with ID: ${botResponseId}`);
    
    const initialBotResponse: Message = {
      id: botResponseId,
      content: "",
      isUser: false,
      timestamp: new Date(),
      isStreaming: true,
    };
    
    // Add to state and storage
    setMessages(prev => [...prev, initialBotResponse]);
    await addMessageToConversation(currentConversationId, initialBotResponse);
    
    try {
      // Check if this is an MCP resource URI
      if (isMcpResourceUri(inputText)) {
        console.log("Detected MCP resource URI:", inputText);
        await handleMcpContentStreaming(inputText.trim(), botResponseId, currentConversationId);
        return;
      }
      
      // Check if this is an MCP tool call
      const toolCall = parseMcpToolCall(inputText);
      if (toolCall) {
        console.log("Detected MCP tool call:", toolCall);
        await callMcpTool(toolCall.toolName, toolCall.args, botResponseId, currentConversationId);
        return;
      }
      
      // Check if we should use sequential thinking
      if (options.sequentialThinking) {
        await processSequentialThinking(inputText, botResponseId, currentConversationId);
        return;
      }

      // Check if AgenTick is enabled from localStorage
      const savedAgenTick = localStorage.getItem('AgenTick');
      const isAgenTickEnabled = savedAgenTick ? JSON.parse(savedAgenTick) : false;
      
      // Check if AgenTick is enabled
      if (options.AgenTick || isAgenTickEnabled) {
        // Check if agent server is available
        const agentAvailable = await checkAgentServer();
        if (!agentAvailable) {
          throw new Error('Agent server is not available. Please ensure it is running to use AgenTick mode.');
        }
        await processAgenTick(inputText, botResponseId, currentConversationId);
      } else {
        throw new Error('Please click on the Agent Mode option in the settings menu (sparkles icon) to enable AgenTick mode.');
      }
    } catch (error) {
      console.error("Error processing message:", error);
      handleError(error, botResponseId, currentConversationId);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion, { sequentialThinking: false, selfDestruct: selfDestructEnabled, AgenTick: false });
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
  
  // Show warning if AgenTick is enabled but server is offline
  const showAgentServerWarning = agentServerStatus === 'offline' && messages.some(m => m.agentRole);
  
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

  // Process message with AgenTick mode
  const processAgenTick = async (inputText: string, botResponseId: string, conversationId: string) => {
    console.log("Processing with AgenTick mode");
    setIsProcessing(true);
    
    // Convert message history for agent context
    const agentHistory = messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // For batching UI updates without too many API calls
    const pendingUpdates = { content: '' };
    const lastUpdateTime = { value: Date.now() };
    
    try {
      // Check if agent server is available
      const agentAvailable = await checkAgentServer();
      if (!agentAvailable) {
        throw new Error('Agent server is not available. Please ensure it is running.');
      }
      
      // Use agent-based response with conversation history
      await generateAgentResponse(
        inputText,
        (token, isDone) => handleTokenUpdate(token, isDone, botResponseId, conversationId, pendingUpdates, lastUpdateTime),
        agentHistory // Pass the full message history for context
      );
    } catch (error) {
      console.error("Error in AgenTick processing:", error);
      handleError(error, botResponseId, conversationId);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle token updates from streaming responses
  const handleTokenUpdate = (
    token: string, 
    isDone: boolean,
    botResponseId: string, 
    conversationId: string,
    pendingUpdates: { content: string },
    lastUpdateTime: { value: number }
  ) => {
    if (!isDone) {
      // Accumulate tokens
      pendingUpdates.content += token;
      
      // Only update the state periodically to avoid too many rerenders
      const now = Date.now();
      if (now - lastUpdateTime.value > UPDATE_INTERVAL) {
        updateMessage(botResponseId, pendingUpdates.content, conversationId);
        lastUpdateTime.value = now;
      }
    } else {
      // Final update with all accumulated content
      updateMessage(botResponseId, pendingUpdates.content, conversationId);
      setIsProcessing(false);
    }
  };
  
  // Handle error in processing
  const handleError = (error: any, botResponseId: string, conversationId: string) => {
    console.error('Error generating response:', error);
    
    toast({
      title: 'Error',
      description: 'Failed to generate response. Please ensure the required servers are running.',
      variant: 'destructive',
    });
    
    // Update the streaming message with error
    setMessages(prev => {
      const updated = [...prev];
      const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
      
      if (messageIndex !== -1) {
        const errorMsg = `Sorry, I encountered an error: ${error.message}. Please ensure the servers are running.`;
        updated[messageIndex] = {
          ...updated[messageIndex],
          content: errorMsg,
          isStreaming: false,
        };
        
        // Update in storage
        updateMessageInConversation(
          conversationId, 
          botResponseId, 
          { 
            content: errorMsg,
            isStreaming: false 
          }
        );
      }
      
      return updated;
    });
    
    setIsProcessing(false);
  };

  // Add a button to set user role in the chat interface
  const addRoleSettingsButton = () => {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          promptForUserRole();
        }}
        className="mr-2"
      >
        <UserIcon className="h-4 w-4 mr-1" />
        Set Your Role
      </Button>
    );
  };

  // Function declarations for missing functions
  const callMcpTool = async (toolName: string, toolArgs: Record<string, any>, botResponseId: string, conversationId: string) => {
    // Implementation of calling MCP tool
    await callMcpToolWithStreaming(
      toolName,
      toolArgs,
      (token, isDone) => {
        // Handle token updates
        console.log("MCP tool token:", token, isDone);
      }
    );
  };

  const processSequentialThinking = async (inputText: string, botResponseId: string, conversationId: string) => {
    // Implementation of sequential thinking processing
    console.log("Processing sequential thinking:", inputText);
    // Add implementation details as needed
  };

  const updateMessage = (messageId: string, content: string, conversationId: string) => {
    setMessages(prev => {
      const updated = [...prev];
      const messageIndex = updated.findIndex(msg => msg.id === messageId);
      
      if (messageIndex !== -1) {
        updated[messageIndex] = {
          ...updated[messageIndex],
          content: content,
        };
      }
      
      return updated;
    });
    
    // Update in storage
    updateMessageInConversation(
      conversationId, 
      messageId, 
      { content }
    );
  };

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
      
      {showAgentServerWarning && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 px-4 py-2 mb-4 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm">Agent server is offline. Responses will use the fallback Mistral model.</p>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="ml-4 bg-amber-200/50 dark:bg-amber-800/50 border-amber-300 dark:border-amber-700"
            onClick={async () => {
              const available = await checkAgentServer();
              setAgentServerStatus(available ? 'online' : 'offline');
              
              toast({
                title: `Agent Server ${available ? 'Online' : 'Offline'}`,
                description: available 
                  ? 'Agent server is available for role-based responses.'
                  : 'Agent server is offline. Check server status and restart if needed.',
                variant: available ? 'default' : 'destructive',
              });
            }}
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
        <div>
          {addRoleSettingsButton()}
        </div>
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
        onSequentialThinkingChange={handleSequentialThinkingChange}
        onSelfDestructChange={handleSelfDestructChange}
        selfDestructEnabled={selfDestructEnabled}
      />
    </div>
  );
};

export default ChatInterface;

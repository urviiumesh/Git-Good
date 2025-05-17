import React, { useState, useEffect, useRef } from 'react';
import { ChatHeader } from './src/components/ChatHeader';
import { MessageList } from './src/components/MessageList';
import { MessageInput } from './src/components/MessageInput';
import { SuggestionsGrid } from './src/components/SuggestionsGrid';
import { generateStreamingResponse, streamMcpContent, callMcpToolWithStreaming } from './modelService';
import { useToast } from './src/components/ui/use-toast';
import { 
  getConversation, 
  addMessageToConversation,
  updateMessageInConversation,
  createConversation,
  deleteSelfDestructConversations,
  isConversationSelfDestruct,
  markConversationSelfDestruct,
  getSelfDestructConversations,
  type ChatMessage,
  type Conversation,
  getAllConversations
} from './src/utils/storageService';
import { checkSequentialThinkingServer, resetSequentialThinkingServer, forceCompleteThinking } from './src/utils/serverUtils';
import { cn } from '@/lib/utils';
import { useServerStatus } from './src/hooks/useServerStatus';
import { useMcpStatus } from '@/hooks/useMcpStatus';
import { Button } from './src/components/ui/button';

const exampleSuggestions = [
  "What are the best practices for secure API design?",
  "How can I improve database query performance?",
  "Explain the concepts of authentication vs authorization",
  "What are the key principles of responsive design?",
];

interface ChatInterfaceProps {
  activeConversationId?: string | null;
}

// Add formatText function since it's not in messageUtils.ts
const formatText = (text: string): string => {
  return text.replace(/\\n/g, '\n');
};

// Constants
const API_BASE_URL = 'http://localhost:8000';
const SELF_DESTRUCT_KEY = 'self_destruct_conversations';
const SEQUENTIAL_THINKING_SERVER_URL = 'http://localhost:8001';
const SEQUENTIAL_THINKING_TIMEOUT = 200000; // Increased timeout to 200 seconds
const DEFAULT_WORD_COUNT = 300; // Default word count for responses

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeConversationId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(activeConversationId);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { toast } = useToast();
  
  // Sequential thinking state
  const [currentThoughtNumber, setCurrentThoughtNumber] = useState(1);
  const [totalThoughts, setTotalThoughts] = useState(3);
  const [sequentialThinkingInProgress, setSequentialThinkingInProgress] = useState(false);
  const [sequentialThinkingEnabled, setSequentialThinkingEnabled] = useState(false);
  const [thinkingTooLong, setThinkingTooLong] = useState(false);
  
  // MCP state
  const [mcpEnabled, setMcpEnabled] = useState(false);
  
  // Self-destruct state
  const [selfDestructEnabled, setSelfDestructEnabled] = useState(false);
  
  // MCP status
  const { status: mcpStatus } = useMcpStatus();

  // Load messages when switching conversations
  useEffect(() => {
    const loadConversation = async () => {
      setIsProcessing(true);
      if (activeConversationId) {
        const conversation = await getConversation(activeConversationId);
        if (conversation) {
          setMessages(conversation.messages);
          // Set self-destruct state based on conversation
          setSelfDestructEnabled(Boolean(conversation.selfDestruct));
        } else {
          // If conversation doesn't exist, create a new one
          const newConvo = await createConversation();
          setMessages([]);
          setSelfDestructEnabled(false);
        }
      } else {
        // No active conversation
        setMessages([]);
        setSelfDestructEnabled(false);
      }
      setIsProcessing(false);
    };
    
    loadConversation();
  }, [activeConversationId]);

  // Set up beforeunload event to delete self-destructing conversations
  useEffect(() => {
    const handleUnload = () => {
      // Get the current self-destruct IDs before doing anything
      const selfDestructIds = getSelfDestructConversations();
      
      if (selfDestructIds.length === 0) {
        console.log('No self-destruct conversations to clean up');
        return;
      }
      
      console.log(`Cleaning up ${selfDestructIds.length} self-destructing conversations on unload`);
      
      // Use a sync XHR to ensure this completes before unload
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/cleanup-self-destruct`, false); // false for synchronous
      xhr.setRequestHeader('Content-Type', 'application/json');
      try {
        xhr.send(JSON.stringify({ selfDestructIds }));
        console.log('Self-destruct cleanup request sent synchronously before unload');
        
        // Also clear localStorage
        localStorage.removeItem(SELF_DESTRUCT_KEY);
      } catch (e) {
        console.error('Error sending cleanup request:', e);
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    // Also run cleanup on component mount to catch any leftover conversations
    const mountCleanup = async () => {
      const selfDestructIds = getSelfDestructConversations();
      if (selfDestructIds.length === 0) {
        console.log('No self-destruct conversations to clean up on mount');
        return;
      }
      
      console.log(`Found ${selfDestructIds.length} self-destruct conversations to clean up on mount`);
      const deletedIds = await deleteSelfDestructConversations();
      
      if (deletedIds.length > 0) {
        // Force reload all conversations after deletion
        const conversations = await getAllConversations();
        // Dispatch a custom event that ChatLayout will listen for
        window.dispatchEvent(new CustomEvent('conversations-updated', { 
          detail: { conversations }
        }));
      }
    };
    
    mountCleanup().catch(err => console.error('Error running cleanup on mount:', err));
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      // Also delete self-destructing conversations when component unmounts
      const unmountCleanup = async () => {
        try {
          const selfDestructIds = getSelfDestructConversations();
          if (selfDestructIds.length === 0) {
            console.log('No self-destruct conversations to clean up on unmount');
            return;
          }
          
          console.log(`Cleaning up ${selfDestructIds.length} self-destruct conversations on unmount`);
          const deletedIds = await deleteSelfDestructConversations();
          
          if (deletedIds.length > 0) {
            // Force reload all conversations after deletion
            const conversations = await getAllConversations();
            // Dispatch a custom event that ChatLayout will listen for
            window.dispatchEvent(new CustomEvent('conversations-updated', { 
              detail: { conversations }
            }));
          }
        } catch (err) {
          console.error('Error in unmount cleanup:', err);
        }
      };
      unmountCleanup();
    };
  }, []);
  
  // If this is a self-destructing conversation, mark it
  useEffect(() => {
    if (activeConversationId && selfDestructEnabled) {
      markConversationSelfDestruct(activeConversationId)
        .then(success => {
          if (!success) {
            console.warn(`Failed to mark conversation ${activeConversationId} for self-destruct`);
          }
        });
    }
  }, [activeConversationId, selfDestructEnabled]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle thinking timeout
  useEffect(() => {
    let thinkingTimer: NodeJS.Timeout | null = null;
    
    if (isProcessing && sequentialThinkingEnabled && mcpStatus === 'online') {
      // Set a timeout to show the force complete button after 15 seconds
      thinkingTimer = setTimeout(() => {
        setThinkingTooLong(true);
      }, 15000);
    } else {
      setThinkingTooLong(false);
    }
    
    return () => {
      if (thinkingTimer) clearTimeout(thinkingTimer);
    };
  }, [isProcessing, sequentialThinkingEnabled, mcpStatus]);
  
  // Force complete handler
  const handleForceComplete = async () => {
    try {
      const success = await forceCompleteThinking();
      if (success) {
        toast({
          title: 'Thinking Completed',
          description: 'Moving to final response generation.',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to force complete thinking. Please try again.',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error forcing thinking completion:', error);
    }
  };

  // Function to process a sequential thinking request
  const processSequentialThinking = async (
    prompt: string, 
    thoughtNumber: number, 
    totalThoughts: number, 
    botResponseId: string,
    conversationId: string,
    isRevision = false,
    revisesThought?: number,
    branchFromThought?: number,
    branchId?: string
  ) => {
    try {
      // Create the thought data with better prompt
      const thoughtData = {
        thought: thoughtNumber === 1 
          ? `Step-by-step thinking about: ${prompt}`
          : `Continue analysis on: ${prompt}`,
        thoughtNumber,
        totalThoughts: Math.max(3, Math.min(totalThoughts, 5)), // Limit to 3-5 thoughts
        nextThoughtNeeded: thoughtNumber < totalThoughts,
        isRevision,
        revisesThought,
        branchFromThought,
        branchId
      };

      // Add first step thinking indicator to the message immediately
      if (thoughtNumber === 1) {
        setMessages(prev => {
          const updated = [...prev];
          const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
          
          if (messageIndex !== -1) {
            updated[messageIndex] = {
              ...updated[messageIndex],
              content: `💭 Starting to analyze the problem...\n\n`,
            };
            
            // Update in storage
            updateMessageInConversation(
              conversationId, 
              botResponseId, 
              { content: updated[messageIndex].content }
            );
          }
          
          return updated;
        });
      }

      // Set a timeout to ensure we don't wait too long
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Sequential thinking timed out")), SEQUENTIAL_THINKING_TIMEOUT);
      });

      // Call the sequential thinking server with timeout
      const responsePromise = fetch(`${SEQUENTIAL_THINKING_SERVER_URL}/call-tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          params: {
            name: "sequentialthinking",
            arguments: thoughtData
          }
        }),
      });

      // Race the fetch against the timeout
      const response = await Promise.race([responsePromise, timeoutPromise]) as Response;

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Parse the server response
      let result;
      try {
        const contentText = responseData.content[0]?.text || '{}';
        result = JSON.parse(contentText);
        
        // If there's an error in the result, handle it
        if (result.error) {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Error parsing sequential thinking response:', error);
        throw new Error('Invalid response from sequential thinking server');
      }

      // Update the message with the thought
      setMessages(prev => {
        const updated = [...prev];
        const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
        
        if (messageIndex !== -1) {
          // Extract the actual thought content (removing any repeated prompts)
          let thoughtContent = result.thought || "Analyzing...";
          
          // Remove the initial prompt if it's repeated
          const promptPrefix = `Step-by-step thinking about: ${prompt}`;
          if (thoughtContent.includes(promptPrefix)) {
            thoughtContent = thoughtContent.replace(promptPrefix, "").trim();
          }
          
          // Check if the thought content is valid
          const isValidThought = thoughtContent.length >= 20 && !/^\d+$/.test(thoughtContent.trim());
          
          // Use a fallback message if the thought content is invalid
          if (!isValidThought) {
            console.warn('Invalid thought content detected, using fallback');
            thoughtContent = `Analyzing ${prompt} from different perspectives to provide a comprehensive response...`;
          }
          
          const formattedThought = `💭 Thought ${thoughtNumber}/${result.totalThoughts || totalThoughts}\n${thoughtContent}\n\n`;
          
          // Add to existing content
          updated[messageIndex] = {
            ...updated[messageIndex],
            content: updated[messageIndex].content + formattedThought,
          };
          
          // Update in storage
          updateMessageInConversation(
            conversationId, 
            botResponseId, 
            { content: updated[messageIndex].content }
          );
        }
        
        return updated;
      });

      // Check if we need more thoughts and if we haven't exceeded the maximum number of thoughts
      const shouldContinueThinking = result.nextThoughtNeeded && 
        thoughtNumber < result.totalThoughts && 
        thoughtNumber < 5; // Hard limit to prevent infinite loops
      
      if (shouldContinueThinking) {
        // Increment thought number for next round
        setCurrentThoughtNumber(prevNum => prevNum + 1);
        setTotalThoughts(result.totalThoughts);

        // Process next thought with a shorter delay
        setTimeout(() => {
          processSequentialThinking(
            prompt, 
            thoughtNumber + 1, 
            result.totalThoughts, 
            botResponseId,
            conversationId
          );
        }, 600); // Reduced delay to 600ms for faster thinking
      } else {
        // Final step - generate the actual response using the model service
        console.log('Sequential thinking complete or limit reached, generating final response');
        await generateFinalResponse(prompt, botResponseId, conversationId);
      }
    } catch (error) {
      console.error('Error in sequential thinking:', error);
      
      // Check if it's a timeout or server error and provide appropriate feedback
      const errorMessage = error.message.includes('timed out') 
        ? 'Sequential thinking timed out. Moving to final response.'
        : `Error in sequential thinking: ${error.message}`;
      
      console.log(errorMessage);
      
      // Update the message with error info
      setMessages(prev => {
        const updated = [...prev];
        const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
        
        if (messageIndex !== -1) {
          updated[messageIndex] = {
            ...updated[messageIndex],
            content: updated[messageIndex].content + `\n\n⚠️ ${errorMessage}\n\n`,
          };
          
          // Update in storage
          updateMessageInConversation(
            conversationId, 
            botResponseId, 
            { content: updated[messageIndex].content }
          );
        }
        
        return updated;
      });
      
      // Even if sequential thinking fails, still try to generate a final response
      try {
        await generateFinalResponse(prompt, botResponseId, conversationId);
      } catch (finalError) {
        console.error('Error generating final response:', finalError);
        
        // Update message with final error
        setMessages(prev => {
          const updated = [...prev];
          const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
          
          if (messageIndex !== -1) {
            updated[messageIndex] = {
              ...updated[messageIndex],
              content: updated[messageIndex].content + `Failed to generate response. Please try again.`,
              isStreaming: false,
            };
            
            // Update in storage
            updateMessageInConversation(
              conversationId, 
              botResponseId, 
              { 
                content: updated[messageIndex].content,
                isStreaming: false 
              }
            );
          }
          
          return updated;
        });
      }
    }
  };

  // Helper function to generate the final response after sequential thinking
  const generateFinalResponse = async (prompt: string, botResponseId: string, conversationId: string) => {
    // Generate the actual response using the model service
    await generateStreamingResponse(
      `${prompt} (Respond based on previous analysis)`,
      async (token, isDone) => {
        if (!isDone) {
          if (token === "Stream started") return;
          
          // Update the bot message with new token
          setMessages(prev => {
            const updated = [...prev];
            const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
            
            if (messageIndex !== -1) {
              const formattedToken = formatText(token);
              
              // Add a separator before the final answer if this is the first token
              let prefix = '';
              if (!updated[messageIndex].content.includes('\n\n📝 Final Answer:')) {
                prefix = '\n\n📝 Final Answer:\n';
              }
              
              updated[messageIndex] = {
                ...updated[messageIndex],
                content: updated[messageIndex].content + (prefix ? prefix : '') + formattedToken,
              };
              
              // Update in storage
              updateMessageInConversation(
                conversationId, 
                botResponseId, 
                { content: updated[messageIndex].content }
              );
            }
            
            return updated;
          });
        } else {
          // Stream complete
          setMessages(prev => {
            const updated = [...prev];
            const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
            
            if (messageIndex !== -1) {
              updated[messageIndex] = {
                ...updated[messageIndex],
                isStreaming: false,
              };
              
              // Update in storage
              updateMessageInConversation(
                conversationId, 
                botResponseId, 
                { isStreaming: false }
              );
            }
            
            return updated;
          });
          
          // Reset sequential thinking state
          setSequentialThinkingInProgress(false);
          setCurrentThoughtNumber(1);
          setTotalThoughts(5);
          setIsProcessing(false);
        }
      }
    );
  };

  // Update handleMcpContentStreaming to use batching
  const handleMcpContentStreaming = async (resourceUri: string, botResponseId: string, conversationId: string) => {
    console.log(`Fetching MCP content from: ${resourceUri}`);
    
    // For batching UI updates without too many API calls
    const pendingUpdates = { content: '' };
    let isDone = false;
    
    try {
      // Set a prefix for MCP content
      setMessages(prev => {
        const updated = [...prev];
        const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
        
        if (messageIndex !== -1) {
          updated[messageIndex] = {
            ...updated[messageIndex],
            content: `📑 Loading MCP content from: ${resourceUri}\n\n`,
          };
          
          // Store first update, but don't send to API yet
          pendingUpdates.content = updated[messageIndex].content;
        }
        
        return updated;
      });
      
      // Stream the MCP content
      await streamMcpContent(
        resourceUri,
        (token, tokenIsDone) => {
          if (!tokenIsDone) {
            // Update the bot message with new token
            setMessages(prev => {
              const updated = [...prev];
              const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
              
              if (messageIndex !== -1) {
                // Format the token
                const formattedToken = formatText(token);
                
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  content: updated[messageIndex].content + formattedToken,
                };
                
                // Update pending content
                pendingUpdates.content = updated[messageIndex].content;
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
            isDone = true;
            // Final update to the message when done
            setMessages(prev => {
              const updated = [...prev];
              const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
              
              if (messageIndex !== -1) {
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  isStreaming: false,
                };
                
                // Save final update to database only once at the end
                updateMessageInConversation(
                  conversationId, 
                  botResponseId, 
                  { 
                    content: pendingUpdates.content,
                    isStreaming: false 
                  }
                );
              }
              
              return updated;
            });
          }
        }
      );
      
      // If we didn't get a done signal for some reason, make sure we update database
      if (!isDone) {
        updateMessageInConversation(
          conversationId, 
          botResponseId, 
          { 
            content: pendingUpdates.content,
            isStreaming: false 
          }
        );
      }
    } catch (error) {
      console.error("Error in MCP content streaming:", error);
      
      // Update message with error
      setMessages(prev => {
        const updated = [...prev];
        const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
        
        if (messageIndex !== -1) {
          const errorMessage = `Error fetching MCP content: ${error.message}`;
          
          updated[messageIndex] = {
            ...updated[messageIndex],
            content: errorMessage,
            isStreaming: false,
          };
          
          // Final update with error
          updateMessageInConversation(
            conversationId, 
            botResponseId, 
            { 
              content: errorMessage,
              isStreaming: false 
            }
          );
        }
        
        return updated;
      });
    }
  };
  
  // New function to handle MCP tool streaming
  const callMcpTool = async (toolName: string, toolArgs: Record<string, any>, botResponseId: string, conversationId: string) => {
    console.log(`Calling MCP tool: ${toolName} with args:`, toolArgs);
    
    let lastUpdateTime = Date.now();
    const UPDATE_INTERVAL = 500; // Update storage only every 500ms
    let requestCompleted = false;
    
    try {
      // Set a prefix for MCP tool call
      setMessages(prev => {
        const updated = [...prev];
        const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
        
        if (messageIndex !== -1) {
          updated[messageIndex] = {
            ...updated[messageIndex],
            content: `🔧 Executing MCP tool: ${toolName}\n\n`,
          };
          
          // Update in storage
          updateMessageInConversation(
            conversationId, 
            botResponseId, 
            { content: updated[messageIndex].content }
          );
        }
        
        return updated;
      });
      
      // Call the MCP tool with streaming
      await callMcpToolWithStreaming(
        toolName,
        toolArgs,
        (token, isDone) => {
          if (!isDone) {
            // Update the bot message with new token
            setMessages(prev => {
              const updated = [...prev];
              const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
              
              if (messageIndex !== -1) {
                // Format the token
                const formattedToken = formatText(token);
                
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  content: updated[messageIndex].content + formattedToken,
                };
                
                // Only update in storage periodically to reduce API calls
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime >= UPDATE_INTERVAL || isDone) {
                  lastUpdateTime = currentTime;
                  // Update in storage less frequently
                  updateMessageInConversation(
                    conversationId, 
                    botResponseId, 
                    { content: updated[messageIndex].content }
                  );
                }
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
            console.log('MCP tool stream complete');
            requestCompleted = true;
            
            // Update message to remove streaming flag
            setMessages(prev => {
              const updated = [...prev];
              const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
              
              if (messageIndex !== -1) {
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  isStreaming: false,
                };
                
                // Update in storage
                updateMessageInConversation(
                  conversationId, 
                  botResponseId, 
                  { isStreaming: false }
                );
              }
              
              return updated;
            });
            
            // End processing state
            setIsProcessing(false);
          }
        }
      );
      
      // Double-check completion in case the isDone callback was missed
      if (!requestCompleted) {
        console.log('Ensuring MCP tool request is marked as complete');
        setMessages(prev => {
          const updated = [...prev];
          const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
          
          if (messageIndex !== -1 && updated[messageIndex].isStreaming) {
            updated[messageIndex] = {
              ...updated[messageIndex],
              isStreaming: false,
            };
            
            // Update in storage
            updateMessageInConversation(
              conversationId, 
              botResponseId, 
              { isStreaming: false }
            );
          }
          
          return updated;
        });
        
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error streaming MCP tool response:', error);
      
      // Update the message with error
      setMessages(prev => {
        const updated = [...prev];
        const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
        
        if (messageIndex !== -1) {
          const errorMsg = `Sorry, I encountered an error executing MCP tool: ${error.message}.`;
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
    }
  };
  
  // Helper function to detect if input is an MCP resource URI
  const isMcpResourceUri = (input: string): boolean => {
    // Match common MCP URI schemes
    const mcpUriPatterns = [
      /^file:\/\//, // filesystem resources
      /^memo:\/\//, // memo resources
      /^test:\/\//, // test resources
      /^github:\/\//, // github resources
      /^google:\/\//, // google resources
      /^spotify:\/\//, // spotify resources 
      /^http:\/\/mcp\./, // http based MCP resources
    ];
    
    return mcpUriPatterns.some(pattern => pattern.test(input.trim()));
  };
  
  // Helper function to detect if input is an MCP tool call
  const parseMcpToolCall = (input: string): { toolName: string, args: Record<string, any> } | null => {
    // Try to match: tool_name(arg1=value1, arg2=value2)
    const toolCallPattern = /^([a-zA-Z0-9_]+)\s*\(\s*(.+?)\s*\)$/;
    const match = input.trim().match(toolCallPattern);
    
    if (match) {
      const toolName = match[1];
      const argsString = match[2];
      
      // Parse arguments 
      const args: Record<string, any> = {};
      const argPairs = argsString.split(',');
      
      for (const pair of argPairs) {
        const [key, ...valueParts] = pair.split('=');
        const value = valueParts.join('=').trim();
        
        if (key && value) {
          // Try to parse as JSON if it looks like it
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'")) ||
              value === 'true' || value === 'false' || 
              !isNaN(Number(value)) ||
              (value.startsWith('{') && value.endsWith('}')) ||
              (value.startsWith('[') && value.endsWith(']'))) {
            try {
              args[key.trim()] = JSON.parse(value);
            } catch (e) {
              args[key.trim()] = value;
            }
          } else {
            args[key.trim()] = value;
          }
        }
      }
      
      return { toolName, args };
    }
    
    return null;
  };
  
  // Update handleSendMessage to support MCP operations
  const handleSendMessage = async (inputText: string, options: { sequentialThinking: boolean, selfDestruct: boolean }) => {
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
    const userMessage: ChatMessage = {
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
    
    const initialBotResponse: ChatMessage = {
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
        console.log("Checking if sequential thinking server is running...");
        
        // Check if the sequential thinking server is running
        const isServerRunning = await checkSequentialThinkingServer();
        
        if (isServerRunning) {
          console.log("Using sequential thinking mode");
          setSequentialThinkingInProgress(true);
          
          // Reset thought number and start sequential thinking
          setCurrentThoughtNumber(1);
          
          // Start the sequential thinking process
          processSequentialThinking(
            inputText, 
            1, // First thought
            totalThoughts, 
            botResponseId,
            currentConversationId
          );
        } else {
          // Server not running, show error and fallback to standard response
          console.error("Sequential thinking server is not running");
          toast({
            title: 'Server Unavailable',
            description: 'Sequential thinking server is not running. Falling back to standard response.',
            variant: 'destructive',
          });
          
          // Fall back to standard response
          console.log("Falling back to standard response mode");
          standardResponse();
        }
      } else {
        standardResponse();
      }
      
      // Function for standard response handling
      async function standardResponse() {
        console.log("Fetching standard streaming response from model...");
        
        // For batching UI updates without too many API calls
        const pendingUpdates = { content: '' };
        let isDone = false;
        
        await generateStreamingResponse(
          inputText,
          async (token, tokenIsDone) => {
            if (!tokenIsDone) {
              // Update the bot message with new token
              setMessages(prev => {
                const updated = [...prev];
                const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
                
                if (messageIndex !== -1) {
                  // Format the token but don't filter out any content
                  const formattedToken = formatText(token);
                  
                  updated[messageIndex] = {
                    ...updated[messageIndex],
                    content: updated[messageIndex].content + formattedToken,
                  };
                  
                  console.log(`Updated message content, new length: ${updated[messageIndex].content.length}`);
                  
                  // Update pending content
                  pendingUpdates.content = updated[messageIndex].content;
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
              // When the streaming is complete, update one final time
              isDone = true;
              setMessages(prev => {
                const updated = [...prev];
                const messageIndex = updated.findIndex(msg => msg.id === botResponseId);
                
                if (messageIndex !== -1) {
                  // Final update in storage
                  updateMessageInConversation(
                    currentConversationId, 
                    botResponseId, 
                    { 
                      content: pendingUpdates.content,
                      isStreaming: false 
                    }
                  );
                }
                
                return updated.map(msg => 
                  msg.id === botResponseId ? {...msg, isStreaming: false} : msg
                );
              });
              
              setIsProcessing(false);
            }
          },
          DEFAULT_WORD_COUNT,
        );
        
        // If we didn't get a done signal for some reason, make sure we update database
        if (!isDone) {
          updateMessageInConversation(
            currentConversationId, 
            botResponseId, 
            { 
              content: pendingUpdates.content,
              isStreaming: false 
            }
          );
          setIsProcessing(false);
        }
      }
    } catch (error) {
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
            currentConversationId, 
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
      setSequentialThinkingInProgress(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion, { sequentialThinking: false, selfDestruct: selfDestructEnabled });
  };

  const handleSequentialThinkingChange = (enabled: boolean) => {
    setSequentialThinkingEnabled(enabled);
  };

  const handleSelfDestructChange = (enabled: boolean) => {
    setSelfDestructEnabled(enabled);
    
    // If turning on self-destruct for an existing conversation
    if (enabled && activeConversationId) {
      markConversationSelfDestruct(activeConversationId)
        .then(success => {
          if (success) {
            console.log(`Marked conversation ${activeConversationId} for self-destruct`);
          } else {
            console.warn(`Failed to mark conversation ${activeConversationId} for self-destruct`);
          }
        });
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full w-full relative",
      "px-2 sm:px-4 lg:px-6 py-4",
      "bg-gradient-to-b from-background to-background/90"
    )}>
      <div className="hidden lg:block">
        <ChatHeader />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageList messages={messages} isProcessing={isProcessing} />

        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <SuggestionsGrid 
              suggestions={exampleSuggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>
        )}
        
        {sequentialThinkingEnabled && mcpStatus === 'online' && isProcessing && thinkingTooLong && (
          <div className="absolute bottom-24 right-6">
            <Button
              onClick={handleForceComplete}
              variant="outline"
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Complete Thinking
            </Button>
          </div>
        )}
      </div>

      <div className="mt-2 sm:mt-4 pb-2">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          isProcessing={isProcessing}
          inputRef={inputRef}
          onSequentialThinkingChange={handleSequentialThinkingChange}
          onSelfDestructChange={handleSelfDestructChange}
          selfDestructEnabled={selfDestructEnabled}
        />
      </div>
    </div>
  );
};

export default ChatInterface; 
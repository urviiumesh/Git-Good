import React, { useState, useEffect, useRef } from 'react';
import { ChatHeader } from './src/components/ChatHeader';
import { MessageList } from './src/components/MessageList';
import { MessageInput } from './src/components/MessageInput';
import { SuggestionsGrid } from './src/components/SuggestionsGrid';
import { generateStreamingResponse } from './src/utils/modelService';
import { useToast } from './src/components/ui/use-toast';
import { 
  getConversation, 
  addMessageToConversation,
  updateMessageInConversation,
  createConversation,
  type ChatMessage
} from './src/utils/storageService';
import { cn } from '@/lib/utils';

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

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeConversationId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load messages when switching conversations
  useEffect(() => {
    const loadConversation = async () => {
      setIsLoading(true);
      if (activeConversationId) {
        const conversation = await getConversation(activeConversationId);
        if (conversation) {
          setMessages(conversation.messages);
        } else {
          // If conversation doesn't exist, create a new one
          const newConvo = await createConversation();
          setMessages([]);
        }
      } else {
        // No active conversation
        setMessages([]);
      }
      setIsLoading(false);
    };
    
    loadConversation();
  }, [activeConversationId]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (inputText: string) => {
    console.log("Sending message:", inputText);
    
    if (!inputText.trim()) return;
    
    // Make sure we have an active conversation
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      const newConvo = await createConversation();
      currentConversationId = newConvo.id;
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
    
    // Create placeholder for streaming bot response
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
      console.log("Fetching streaming response from model...");
      
      // Debug variable to track tokens
      let tokenCount = 0;
      let lastUpdateTime = Date.now();
      const UPDATE_INTERVAL = 500; // Update storage only every 500ms
      
      // Use streaming response
      await generateStreamingResponse(
        inputText,
        async (token, isDone) => {
          if (!isDone) {
            // Only skip if the token is EXACTLY "Stream started" and nothing else
            if (token === "Stream started") {
              console.log("Skipping 'Stream started' message");
              return;
            }
            
            // Increment token counter
            tokenCount++;
            console.log(`Received token #${tokenCount}: "${token}"`);
            
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
                
                // Only update in storage periodically to reduce API calls
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime >= UPDATE_INTERVAL || isDone) {
                  lastUpdateTime = currentTime;
                  // Update in storage less frequently
                  updateMessageInConversation(
                    currentConversationId, 
                    botResponseId, 
                    { content: updated[messageIndex].content }
                  );
                }
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
                const content = updated[messageIndex].content;
                
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  content: content,
                  isStreaming: false,
                };
                
                console.log(`Final message length: ${updated[messageIndex].content.length}`);
                
                // Update in storage
                updateMessageInConversation(
                  currentConversationId, 
                  botResponseId, 
                  { 
                    content: content,
                    isStreaming: false 
                  }
                );
              } else {
                console.warn(`Unable to find message with ID ${botResponseId} to mark as complete`);
              }
              
              return updated;
            });
            
            // End processing state
            setIsProcessing(false);
          }
        },
        300
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
          const errorMsg = `Sorry, I encountered an error: ${error.message}. Please ensure the local model server is running.`;
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
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
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
      </div>

      <div className="mt-2 sm:mt-4 pb-2">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          isProcessing={isProcessing}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
};

export default ChatInterface; 
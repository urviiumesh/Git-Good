import React, { useState, useEffect, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { SuggestionsGrid } from './SuggestionsGrid';
import { generateStreamingResponse } from '@/utils/modelService';
import { useToast } from '@/components/ui/use-toast';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
            // Skip "Stream started" message
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
                // Remove "Stream started" from token if it's the first token
                const formattedToken = formatText(token);
                const cleanToken = messageIndex === 0 && formattedToken.startsWith("Stream started") 
                  ? formattedToken.substring("Stream started".length) 
                  : formattedToken;
                
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  content: updated[messageIndex].content + cleanToken,
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
                // Remove any "Stream started" text from the beginning of the content
                const content = updated[messageIndex].content;
                const cleanContent = content.startsWith("Stream started") 
                  ? content.substring("Stream started".length) 
                  : content;
                
                updated[messageIndex] = {
                  ...updated[messageIndex],
                  content: cleanContent,
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

  return (
    <div className="flex flex-col h-full max-w-4xl w-full mx-auto p-4 md:p-6">
      <ChatHeader />
      
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
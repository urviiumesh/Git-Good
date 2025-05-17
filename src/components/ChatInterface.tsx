
import React, { useState, useEffect, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { SuggestionsGrid } from './SuggestionsGrid';
import { generateResponse } from '@/utils/messageUtils';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
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

  const handleSendMessage = (inputText: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(inputText),
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsProcessing(false);
    }, 1500);
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
      />
    </div>
  );
};

export default ChatInterface;


import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatWelcome } from './ChatWelcome';
import { StatusIndicator } from './StatusIndicator';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

interface MessageListProps {
  messages: Message[];
  isProcessing: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isProcessing }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-auto rounded-lg p-4 mb-4 bg-muted/30 min-h-[65vh] max-h-[65vh]">
      {messages.length === 0 ? (
        <ChatWelcome />
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isProcessing && (
            <div className="flex items-center space-x-2 p-4">
              <StatusIndicator status="loading" showLabel={false} />
              <span className="text-sm">EdgeGPT is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

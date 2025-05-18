import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ChatWelcome } from './ChatWelcome';
import { StatusIndicator } from './StatusIndicator';
import { type ChatMessage } from '../utils/storageService';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: ChatMessage[];
  isProcessing: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isProcessing }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={cn(
      "flex-1 overflow-auto",
      "rounded-lg mb-2",
      "bg-muted/20 dark:bg-muted/10",
      "border border-border/30 dark:border-border/20",
      "h-full",
      "scrollbar-thin scrollbar-thumb-muted-foreground/10 scrollbar-track-transparent"
    )}>
      {messages.length === 0 ? (
        <ChatWelcome />
      ) : (
        <div className="space-y-4 p-3 sm:p-5 message-list-container">
          {messages.map((msg) => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}
          
          {isProcessing && !messages.some(msg => msg.isStreaming) && (
            <div className="flex items-center p-3 space-x-2 bg-muted/20 dark:bg-muted/10 rounded-lg animate-pulse">
              <StatusIndicator status="loading" showLabel={false} />
              <span className="text-sm text-muted-foreground">EdgeGPT is thinking...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

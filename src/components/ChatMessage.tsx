
import React from 'react';
import { cn } from '@/lib/utils';
import { CircleUser } from 'lucide-react';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        message.isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div 
        className={cn(
          "flex flex-shrink-0 h-8 w-8 rounded-full items-center justify-center",
          message.isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {message.isUser ? (
          <CircleUser className="h-5 w-5" />
        ) : (
          <span className="font-semibold text-sm">AI</span>
        )}
      </div>
      <div className="flex flex-col max-w-[80%]">
        <div
          className={cn(
            "rounded-lg p-4",
            message.isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-card border border-border"
          )}
        >
          <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1 self-start">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

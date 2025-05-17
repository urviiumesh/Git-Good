import React from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface ChatSuggestionProps {
  text: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export const ChatSuggestion: React.FC<ChatSuggestionProps> = ({ 
  text, 
  onClick,
  icon
}) => {
  return (
    <Button 
      variant="outline" 
      className={cn(
        "justify-start h-auto py-2 sm:py-3 px-3 sm:px-4",
        "overflow-hidden text-left",
        "whitespace-normal transition-all",
        "border border-border/50 hover:border-primary/50",
        "dark:bg-muted/10 dark:hover:bg-muted/20",
        "hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2 sm:gap-3 w-full">
        {icon && (
          <div className="flex-shrink-0 text-base sm:text-lg pt-0.5">{icon}</div>
        )}
        <span className="line-clamp-2 text-xs sm:text-sm">{text}</span>
      </div>
    </Button>
  );
};

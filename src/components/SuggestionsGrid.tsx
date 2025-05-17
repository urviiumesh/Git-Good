import React from 'react';
import { ChatSuggestion } from './ChatSuggestion';
import { cn } from '@/lib/utils';

interface SuggestionsGridProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export const SuggestionsGrid: React.FC<SuggestionsGridProps> = ({ 
  suggestions, 
  onSuggestionClick 
}) => {
  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl mx-auto px-2">
      <div className="mb-3 sm:mb-4 mt-1 text-center">
        <h3 className="text-base sm:text-lg font-medium text-foreground mb-1">Try asking about</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Select from popular questions or type your own
        </p>
      </div>
      
      <div className={cn(
        "grid gap-2 sm:gap-3",
        suggestions.length > 2 ? "grid-cols-2" : "grid-cols-1", 
        "w-full mx-auto"
      )}>
        {suggestions.map((suggestion, index) => (
          <ChatSuggestion 
            key={index} 
            text={suggestion} 
            onClick={() => onSuggestionClick(suggestion)}
            icon={getSuggestionIcon(index)}
          />
        ))}
      </div>
    </div>
  );
};

// Helper function to get different icons for suggestions
const getSuggestionIcon = (index: number): React.ReactNode => {
  const icons = [
    "🔍", // Search/discovery
    "🛠️", // Tools/performance
    "🔐", // Security
    "📱", // UI/design
  ];
  
  return icons[index % icons.length];
};


import React from 'react';
import { ChatSuggestion } from './ChatSuggestion';

interface SuggestionsGridProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export const SuggestionsGrid: React.FC<SuggestionsGridProps> = ({ 
  suggestions, 
  onSuggestionClick 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
      {suggestions.map((suggestion, index) => (
        <ChatSuggestion 
          key={index} 
          text={suggestion} 
          onClick={() => onSuggestionClick(suggestion)}
        />
      ))}
    </div>
  );
};

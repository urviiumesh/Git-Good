
import React from 'react';
import { Button } from './ui/button';

interface ChatSuggestionProps {
  text: string;
  onClick: () => void;
}

export const ChatSuggestion: React.FC<ChatSuggestionProps> = ({ text, onClick }) => {
  return (
    <Button 
      variant="outline" 
      className="justify-start h-auto py-3 px-4 overflow-hidden text-left whitespace-normal"
      onClick={onClick}
    >
      <span className="line-clamp-2 text-sm">{text}</span>
    </Button>
  );
};

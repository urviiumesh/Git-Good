
import React, { useState, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MicOff, Mic, Settings } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would trigger voice recognition
  };

  return (
    <div className="flex gap-2 items-center">
      <Button
        variant="outline"
        size="icon"
        onClick={handleVoiceToggle}
        className="flex-shrink-0"
      >
        {isRecording ? <Mic className="h-5 w-5 text-destructive" /> : <MicOff className="h-5 w-5" />}
      </Button>
      
      <Input
        placeholder="Ask me anything..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        className="flex-1"
        ref={inputRef}
      />
      
      <Button 
        onClick={handleSendMessage} 
        disabled={!input.trim() || isProcessing} 
        className="flex-shrink-0"
      >
        <Send size={18} />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="flex-shrink-0 ml-1"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );
};

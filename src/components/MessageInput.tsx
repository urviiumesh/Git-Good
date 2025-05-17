import React, { useState, useRef, RefObject } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MicOff, Mic, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  inputRef?: RefObject<HTMLInputElement>;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isProcessing,
  inputRef
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const defaultInputRef = useRef<HTMLInputElement>(null);
  
  // Use provided inputRef or fallback to local defaultInputRef
  const resolvedInputRef = inputRef || defaultInputRef;

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
    <div className={cn(
      "flex gap-2 items-center",
      "p-2 px-3 sm:p-3 rounded-lg",
      "bg-background dark:bg-background/80",
      "border border-border/50 dark:border-border/30",
      "shadow-sm backdrop-blur-sm",
      "mx-2 sm:mx-4"
    )}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoiceToggle}
              className={cn(
                "flex-shrink-0 rounded-full h-8 w-8 sm:h-9 sm:w-9",
                isRecording && "text-destructive bg-destructive/10"
              )}
            >
              {isRecording ? <Mic className="h-4 w-4 sm:h-5 sm:w-5" /> : <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isRecording ? "Stop recording" : "Start voice input"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Input
        placeholder="Ask me anything..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
        className={cn(
          "flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0",
          "bg-transparent placeholder:text-muted-foreground/60",
          "h-8 sm:h-10"
        )}
        ref={resolvedInputRef}
      />
      
      <div className="flex gap-1 sm:gap-1.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0 bg-transparent h-8 w-8 sm:h-9 sm:w-9"
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>AI Options</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button 
          onClick={handleSendMessage} 
          disabled={!input.trim() || isProcessing}
          className={cn(
            "flex-shrink-0 h-8 sm:h-10 px-3 sm:px-4",
            isProcessing ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
          )}
        >
          <Send size={16} className="sm:mr-2" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
    </div>
  );
};

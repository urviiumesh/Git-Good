import React, { useState, useRef, RefObject } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MicOff, Mic, Settings, Sparkles, Trash2, ListOrdered, BrainCircuit, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useServerStatus } from "../hooks/useServerStatus";
import { useAgenTickStatus } from "../hooks/useAgentrickStatus";
import { AgentModal } from './AgentModal';

interface MessageInputProps {
  onSendMessage: (message: string, options: { sequentialThinking: boolean, selfDestruct: boolean, AgenTick: boolean }) => void;
  isProcessing: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  onSequentialThinkingChange?: (enabled: boolean) => void;
  onSelfDestructChange?: (enabled: boolean) => void;
  selfDestructEnabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isProcessing,
  inputRef,
  onSequentialThinkingChange,
  onSelfDestructChange,
  selfDestructEnabled = false
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const defaultInputRef = useRef<HTMLTextAreaElement>(null);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  
  // AI options state
  const [selfDestructing, setSelfDestructing] = useState(selfDestructEnabled);
  const [sequentialThinking, setSequentialThinking] = useState(false);
  const [AgenTick, setAgenTick] = useState(false);
  
  // Update self-destructing state when prop changes
  React.useEffect(() => {
    setSelfDestructing(selfDestructEnabled);
  }, [selfDestructEnabled]);
  
  // Server status state
  const { mcpStatus, checkMcpStatus } = useServerStatus();
  const { status: AgenTickStatus } = useAgenTickStatus();
  
  // Use provided inputRef or fallback to local defaultInputRef
  const resolvedInputRef = inputRef || defaultInputRef;

  // Handle attempt to disable AgenTick
  const handleAgenTickChange = () => {
    setAgentModalOpen(true);
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    onSendMessage(input, { sequentialThinking, selfDestruct: selfDestructing, AgenTick: AgenTick });
    setInput('');
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would trigger voice recognition
  };
  
  const handleSequentialThinkingToggle = async (checked: boolean) => {
    // If enabling, check server status first
    if (checked && mcpStatus !== 'online') {
      // Re-check server status
      const isRunning = await checkMcpStatus();
      if (!isRunning) {
        alert("Sequential thinking server is not available. Please start the server first.");
        return;
      }
    }
    
    setSequentialThinking(checked);
    if (onSequentialThinkingChange) {
      onSequentialThinkingChange(checked);
    }
  };
  
  const handleSelfDestructToggle = (checked: boolean) => {
    setSelfDestructing(checked);
    if (onSelfDestructChange) {
      onSelfDestructChange(checked);
    }
  };

  return (
    <>
      <div className={cn(
        "relative flex flex-col w-full max-w-4xl mx-auto", 
        "border rounded-lg shadow-sm",
        selfDestructing && "border-destructive/30 shadow-destructive/20",
        "bg-background"
      )}>
        <div className="px-3 py-2 w-full">
          <div className="relative flex items-center w-full">
            <textarea
              ref={resolvedInputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isProcessing}
              placeholder="Ask me anything..."
              className={cn(
                "w-full px-3 py-2 min-h-[48px] max-h-[300px] resize-y pr-10",
                "font-normal text-base placeholder:text-muted-foreground",
                "bg-transparent shadow-none outline-none border-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
                selfDestructing && !isProcessing && "text-destructive"
              )}
            />
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
          </div>
        </div>
        <div className="flex gap-1 sm:gap-1.5">
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "flex-shrink-0 bg-transparent h-8 w-8 sm:h-9 sm:w-9",
                        selfDestructing && "text-destructive border-destructive/30"
                      )}
                    >
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>AI Options</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuCheckboxItem
                checked={selfDestructing}
                onCheckedChange={handleSelfDestructToggle}
                className={selfDestructing ? "text-destructive" : ""}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Self-destructing conversation</span>
              </DropdownMenuCheckboxItem>
              
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuCheckboxItem
                  checked={sequentialThinking}
                  onCheckedChange={handleSequentialThinkingToggle}
                  disabled={mcpStatus === 'offline'}
                >
                  <BrainCircuit className="h-4 w-4 mr-2" />
                  <span>Sequential thinking</span>
                </DropdownMenuCheckboxItem>
                
                <StatusIndicator 
                  status={mcpStatus} 
                  name="MCP" 
                  className="ml-2"
                />
              </div>

              <DropdownMenuCheckboxItem
                checked={AgenTick}
                onClick={handleAgenTickChange}
                className="cursor-pointer"
              >
                <Bot className="mr-2 h-4 w-4 text-primary" />
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary">Agent Mode</span>
                    <StatusIndicator status={AgenTickStatus} name="Agent" />
                  </div>
                  <span className="text-xs text-muted-foreground">Click to open agent interface</span>
                </div>
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-xs" 
                  onClick={() => {
                    checkMcpStatus();
                    // Force status refresh by fetching again
                    fetch('http://localhost:5000/api/agents/health');
                  }}
                >
                  Refresh server status
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isProcessing}
            className={cn(
              "flex-shrink-0 h-8 sm:h-10 px-3 sm:px-4",
              isProcessing ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
              selfDestructing && !isProcessing && "bg-destructive hover:bg-destructive/90"
            )}
          >
            <Send size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </div>
      
      <AgentModal 
        open={agentModalOpen} 
        onOpenChange={setAgentModalOpen} 
      />
    </>
  );
};

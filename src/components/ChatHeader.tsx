import React, { useState, useEffect } from 'react';
import { StatusIndicator } from './StatusIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Share2, MoreHorizontal, Copy, DownloadCloud, MessageSquare, Code, SwitchCamera } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCurrentModel, switchModel, type ModelType } from '../utils/modelService';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ChatHeaderProps {
  title?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  title = 'EdgeGPT' 
}) => {
  const [currentModel, setCurrentModel] = useState<ModelType>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const { toast } = useToast();

  // Fetch current model on component mount
  useEffect(() => {
    const fetchCurrentModel = async () => {
      try {
        const { currentModel } = await getCurrentModel();
        setCurrentModel(currentModel);
      } catch (error) {
        console.error('Failed to get current model:', error);
      }
    };
    
    fetchCurrentModel();
  }, []);

  const handleModelChange = async (value: string) => {
    if (value === currentModel || !value) return;
    
    const newModel = value as ModelType;
    setIsLoading(true);
    
    try {
      await switchModel(newModel);
      setCurrentModel(newModel);
      toast({
        title: 'Model switched',
        description: `Switched to ${newModel === 'text' ? 'Mistral-7B (Text)' : 'CodeLlama-7B (Code)'} model`,
      });
    } catch (error) {
      console.error('Failed to switch model:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch models. Please ensure the model server is running.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchModel = async () => {
    if (isSwitching) return;
    
    setIsSwitching(true);
    const newModelType: ModelType = currentModel === 'text' ? 'code' : 'text';
    
    try {
      await switchModel(newModelType);
      setCurrentModel(newModelType);
      
      toast({
        title: `Switched to ${newModelType} mode`,
        description: newModelType === 'text' 
          ? 'EdgeGPT will now respond with standard text responses.' 
          : 'EdgeGPT will now focus on generating clean, well-formatted code.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error switching model:', error);
      
      toast({
        title: 'Failed to switch model',
        description: 'An error occurred when trying to switch the model mode.',
        variant: 'destructive',
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const modelDisplayName = currentModel === 'text' ? 'Mistral-7B (Text)' : 'CodeLlama-7B (Code)';

  return (
    <div className="flex items-center justify-between pt-1 pb-4">
      <div className="flex items-center gap-2">
        {currentModel === 'text' ? (
          <MessageSquare className="h-5 w-5 text-primary" />
        ) : (
          <Code className="h-5 w-5 text-amber-500" />
        )}
        
        <h1 className="text-xl font-semibold">
          EdgeGPT
          <span className={cn(
            "ml-2 text-sm px-2 py-0.5 rounded-full font-medium",
            currentModel === 'text' 
              ? "bg-primary/10 text-primary" 
              : "bg-amber-500/10 text-amber-500"
          )}>
            {currentModel === 'text' ? 'Text Mode' : 'Code Mode'}
          </span>
        </h1>
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center mr-2">
          <span className="text-xs text-muted-foreground mr-2">Model:</span>
          <ToggleGroup type="single" value={currentModel} onValueChange={handleModelChange} disabled={isLoading}>
            <ToggleGroupItem value="text" aria-label="Text Model" className="text-xs">
              Text
            </ToggleGroupItem>
            <ToggleGroupItem value="code" aria-label="Code Model" className="text-xs">
              Code
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div className="flex items-center">
          {/* <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Share conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> */}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                <span>Copy conversation</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DownloadCloud className="h-4 w-4 mr-2" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Button 
        variant="outline" 
        size="sm"
        className="gap-2"
        onClick={handleSwitchModel}
        disabled={isSwitching}
      >
        <SwitchCamera className="h-4 w-4" />
        Switch to {currentModel === 'text' ? 'Code' : 'Text'} Mode
      </Button>
    </div>
  );
};

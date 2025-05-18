import React, { useState, useEffect } from 'react';
import { StatusIndicator } from './StatusIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Share2, MoreHorizontal, Copy, DownloadCloud, MessageSquare, Code, SwitchCamera, BrainCircuit, Bot } from 'lucide-react';
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
import { useServerStatus } from '@/hooks/useServerStatus';
import { useAgenTickStatus } from '../hooks/useAgentrickStatus';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const { mcpStatus, checkMcpStatus } = useServerStatus();
  const { status: AgenTickStatus } = useAgenTickStatus();

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

  const downloadPdf = async () => {
    try {
      // Show toast to inform user the PDF is being generated
      toast({
        title: 'Generating PDF',
        description: 'Please wait while we prepare your chat for download...',
      });
      
      // Find the message list container
      const element = document.querySelector('.message-list-container') as HTMLElement;
      
      if (!element) {
        throw new Error('Could not find message container element');
      }
      
      // Create canvas from the message list
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Initialize PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(18);
      pdf.text('EdgeGPT Chat Export', 105, 15, { align: 'center' });
      pdf.setFontSize(12);
      const timestamp = new Date().toLocaleString();
      pdf.text(`Generated: ${timestamp}`, 105, 22, { align: 'center' });
      
      // Add separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 25, 190, 25);
      
      // Calculate the number of pages
      let heightLeft = imgHeight;
      let position = 30; // Start position after title
      
      // Add image content of the first page
      pdf.addImage(canvas, 'PNG', 10, position, imgWidth - 20, imgHeight);
      heightLeft -= (pageHeight - position);
      
      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = 10; // Reset position for new page
        pdf.addPage();
        pdf.addImage(
          canvas,
          'PNG',
          10,
          -(pageHeight - position - imgHeight),
          imgWidth - 20,
          imgHeight
        );
        heightLeft -= (pageHeight - position);
      }
      
      // Save PDF
      pdf.save('edgegpt-chat-export.pdf');
      
      // Show success toast
      toast({
        title: 'PDF Downloaded',
        description: 'Your chat has been exported as a PDF file.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      toast({
        title: 'PDF Generation Failed',
        description: 'There was an error creating your PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const modelDisplayName = currentModel === 'text' ? 'Mistral-7B (Text)' : 'CodeLlama-7B (Code)';
  
  // Convert our status type to the existing component status type
  const convertStatus = (mcpStatus: 'online' | 'offline' | 'checking'): 'online' | 'offline' | 'loading' => {
    switch (mcpStatus) {
      case 'online': return 'online';
      case 'offline': return 'offline';
      case 'checking': return 'loading';
      default: return 'offline';
    }
  };

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
        {/* MCP Server Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center gap-1 cursor-pointer" 
                onClick={checkMcpStatus}
              >
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                <StatusIndicator 
                  status={convertStatus(mcpStatus)} 
                  label="MCP Server" 
                  className="ml-1" 
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Sequential Thinking Server: {mcpStatus}</p>
              <p className="text-xs text-muted-foreground">(Click to refresh)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* AgenTick Server Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <StatusIndicator 
                  status={AgenTickStatus} 
                  label="AgenTick" 
                  className="ml-1" 
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>AgenTick Server: {AgenTickStatus}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
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
              <DropdownMenuItem onClick={downloadPdf}>
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

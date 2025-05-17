import React from 'react';
import { StatusIndicator } from './StatusIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Share2, MoreHorizontal, Copy, DownloadCloud } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatHeaderProps {
  title?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  title = 'EdgeGPT' 
}) => {
  // Model is fixed to Mistral-7B since that's the only one available
  const modelDisplayName = 'Mistral-7B (Text)';

  return (
    <div className={cn(
      "flex items-center justify-between", 
      "mb-4 pb-3",
      "border-b border-border/30"
    )}>
      <div className="flex items-center">
        <h1 className="text-xl font-semibold truncate mr-2">
          {title}
        </h1>
        <StatusIndicator 
          status="online"
          label="Ready" 
        />
      </div>

      <div className="flex items-center space-x-1">
        <div className="hidden md:flex items-center mr-2">
          <span className="text-xs text-muted-foreground mr-1">Model:</span>
          <span className="text-xs font-medium">{modelDisplayName}</span>
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
    </div>
  );
};

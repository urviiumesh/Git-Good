import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ServerIcon, XCircleIcon, CheckCircleIcon, LoaderCircleIcon } from 'lucide-react';

type ServerStatus = 'online' | 'offline' | 'checking';

interface StatusIndicatorProps {
  status: ServerStatus;
  name: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  name,
  className 
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "inline-flex items-center gap-1.5",
            "text-xs font-medium px-2 py-1 rounded-full",
            status === 'online' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : 
            status === 'offline' ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            className
          )}>
            {status === 'online' && <CheckCircleIcon className="h-3.5 w-3.5" />}
            {status === 'offline' && <XCircleIcon className="h-3.5 w-3.5" />}
            {status === 'checking' && <LoaderCircleIcon className="h-3.5 w-3.5 animate-spin" />}
            <span className="hidden sm:inline">{name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{name} server is {status}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 
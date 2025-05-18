import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'loading';
  name?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  name,
  className 
}) => {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "h-2 w-2 rounded-full",
          status === 'online' && "bg-green-500",
          status === 'offline' && "bg-red-500",
          status === 'loading' && "bg-yellow-500 animate-pulse"
        )}
      />
      {name && (
        <span className="text-xs text-muted-foreground">{name}</span>
      )}
    </div>
  );
};

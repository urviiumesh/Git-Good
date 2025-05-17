
import React from 'react';
import { cn } from '@/lib/utils';

type Status = 'online' | 'offline' | 'degraded' | 'loading';

interface StatusIndicatorProps {
  status: Status;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

const statusClasses = {
  online: "bg-green-500",
  offline: "bg-red-500",
  degraded: "bg-yellow-500",
  loading: "bg-blue-500 animate-pulse-subtle"
};

const statusLabels = {
  online: "Online",
  offline: "Offline",
  degraded: "Degraded",
  loading: "Loading"
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showLabel = true,
  className
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          statusClasses[status]
        )}
      />
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground">
          {label || statusLabels[status]}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;

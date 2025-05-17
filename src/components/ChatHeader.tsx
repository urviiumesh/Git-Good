import React, { useEffect, useState } from 'react';
import { StatusIndicator } from './StatusIndicator';
import { useToast } from '@/components/ui/use-toast';

export const ChatHeader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Model is fixed to Mistral-7B since that's the only one available
  const modelDisplayName = 'Mistral-7B (Text)';

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">EdgeGPT</h1>
        <div className="h-4 w-px bg-border mx-3"></div>
        <StatusIndicator 
          status="online"
          label="Ready" 
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Model:</span>
        <span className="text-sm font-medium">{modelDisplayName}</span>
      </div>
    </div>
  );
};

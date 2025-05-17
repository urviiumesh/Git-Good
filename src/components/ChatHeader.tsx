
import React from 'react';
import { StatusIndicator } from './StatusIndicator';

export const ChatHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">EdgeGPT</h1>
        <div className="h-4 w-px bg-border mx-3"></div>
        <StatusIndicator status="online" label="Ready" />
      </div>
      <div className="text-sm text-muted-foreground">
        Model: Edge-2024
      </div>
    </div>
  );
};

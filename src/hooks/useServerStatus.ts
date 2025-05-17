import { useState, useEffect } from 'react';
import { checkSequentialThinkingServer } from '@/utils/serverUtils';

type ServerStatus = 'online' | 'offline' | 'checking';

export function useServerStatus(checkInterval = 30000) {
  const [mcpStatus, setMcpStatus] = useState<ServerStatus>('checking');
  
  // Check MCP server status on load and periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setMcpStatus('checking');
        const isRunning = await checkSequentialThinkingServer();
        setMcpStatus(isRunning ? 'online' : 'offline');
      } catch (error) {
        console.error('Error checking server status:', error);
        setMcpStatus('offline');
      }
    };
    
    // Initial check
    checkStatus();
    
    // Set up periodic checks
    const intervalId = setInterval(checkStatus, checkInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [checkInterval]);
  
  return {
    mcpStatus,
    checkMcpStatus: async () => {
      setMcpStatus('checking');
      try {
        const isRunning = await checkSequentialThinkingServer();
        setMcpStatus(isRunning ? 'online' : 'offline');
        return isRunning;
      } catch (error) {
        console.error('Error checking server status:', error);
        setMcpStatus('offline');
        return false;
      }
    }
  };
} 
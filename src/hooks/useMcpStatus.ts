import { useState, useEffect } from 'react';

/**
 * Hook to check MCP server status
 */
export const useMcpStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        setStatus(response.ok ? 'online' : 'offline');
      } catch (error) {
        console.error('Error checking MCP server:', error);
        setStatus('offline');
      } finally {
        setIsLoading(false);
      }
    };

    // Check status immediately and then every 30 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { status, isLoading };
}; 
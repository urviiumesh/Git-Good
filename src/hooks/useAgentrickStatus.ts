import { useState, useEffect } from 'react';

/**
 * Hook to check AgenTick server status
 */
export const useAgenTickStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/agents/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status === 'ok' ? 'online' : 'offline');
        } else {
          setStatus('offline');
        }
      } catch (error) {
        console.error('Error checking AgenTick server:', error);
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
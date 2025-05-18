import { useState, useEffect } from 'react';

/**
 * Hook to check AgenTick server status
 */
export const useAgenTickStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');
  const [isLoading, setIsLoading] = useState(true);
  const [lastStatusChange, setLastStatusChange] = useState<Date | null>(null);

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
          const newStatus = data.status === 'ok' ? 'online' : 'offline';
          
          // Only update the state if the status has changed
          if (newStatus !== status) {
            setStatus(newStatus);
            setLastStatusChange(new Date());
            
            // If server went offline, ensure AgenTick mode is reset
            if (newStatus === 'offline') {
              localStorage.setItem('AgenTick', JSON.stringify(false));
              // Dispatch event to notify other components
              window.dispatchEvent(new CustomEvent('agentStatusChanged', {
                detail: { status: newStatus }
              }));
            }
          }
        } else {
          if (status !== 'offline') {
            setStatus('offline');
            setLastStatusChange(new Date());
            
            // Reset AgenTick mode if server is unreachable
            localStorage.setItem('AgenTick', JSON.stringify(false));
            window.dispatchEvent(new CustomEvent('agentStatusChanged', {
              detail: { status: 'offline' }
            }));
          }
        }
      } catch (error) {
        console.error('Error checking AgenTick server:', error);
        if (status !== 'offline') {
          setStatus('offline');
          setLastStatusChange(new Date());
          
          // Reset AgenTick mode if server is unreachable
          localStorage.setItem('AgenTick', JSON.stringify(false));
          window.dispatchEvent(new CustomEvent('agentStatusChanged', {
            detail: { status: 'offline' }
          }));
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Check status immediately and then every 30 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [status]);

  return { status, isLoading, lastStatusChange };
}; 
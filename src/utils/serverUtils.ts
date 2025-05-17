/**
 * Server utility functions
 */

const MODEL_SERVER_URL = 'http://localhost:8000';
const SEQUENTIAL_THINKING_SERVER_URL = 'http://localhost:8001';

/**
 * Check if the model server is running
 */
export const checkModelServer = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${MODEL_SERVER_URL}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error checking model server:', error);
    return false;
  }
};

/**
 * Check if the sequential thinking server is running
 */
export const checkSequentialThinkingServer = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${SEQUENTIAL_THINKING_SERVER_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Sequential thinking server health check failed:', response.statusText);
      return false;
    }
    
    const data = await response.json();
    
    // If server reports it needed a reset, warn the user
    if (data.status === 'reset_required') {
      console.warn('Sequential thinking server was stuck and has been reset');
    }
    
    return true;
  } catch (error) {
    console.error('Error checking sequential thinking server:', error);
    return false;
  }
};

/**
 * Reset the sequential thinking server state
 */
export const resetSequentialThinkingServer = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${SEQUENTIAL_THINKING_SERVER_URL}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error resetting sequential thinking server:', error);
    return false;
  }
};

/**
 * Force complete the current thinking process
 */
export const forceCompleteThinking = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${SEQUENTIAL_THINKING_SERVER_URL}/force-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to force complete thinking:', response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('Force complete result:', data);
    
    // Add a retry mechanism in case the server doesn't respond properly
    if (!data.success) {
      console.warn('Force complete was not successful, retrying...');
      
      // Reset the server and try again
      const resetSuccess = await resetSequentialThinkingServer();
      if (resetSuccess) {
        console.log('Server reset successful after failed force complete');
      }
      
      return resetSuccess;
    }
    
    return data.success;
  } catch (error) {
    console.error('Error forcing thinking completion:', error);
    
    // Attempt to reset server on error
    try {
      return await resetSequentialThinkingServer();
    } catch {
      return false;
    }
  }
}; 
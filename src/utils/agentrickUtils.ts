import axios from 'axios';

// Define agent roles based on gitgoodbackend repository structure
type AgentRole = 'software' | 'marketing' | 'cpo' | 'accounts' | 'intern';

interface AgentRequest {
  userMessage: string;
  userContext?: string;
  role: AgentRole;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// Server endpoints
const MODEL_SERVER_URL = 'http://localhost:8000';
const AgenTick_SERVER_URL = 'http://localhost:5000/api/agents';

// User profile information
interface UserProfile {
  role?: string;
  team?: string;
  expertise?: string[];
  department?: string;
}

// Keep track of user profile
let userProfile: UserProfile = {};

// Function to update user profile
export const getUpdatedUserProfile = (updates: Partial<UserProfile>): UserProfile => {
  userProfile = { ...userProfile, ...updates };
  return userProfile;
};

// Function to switch between text and code models
export const switchModel = async (modelType: 'text' | 'code'): Promise<void> => {
  try {
    const response = await fetch(`${MODEL_SERVER_URL}/switch_model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_type: modelType
      })
    });
    
    if (!response.ok) {
      console.error(`Failed to switch model: ${response.status}`);
    }
  } catch (error) {
    console.error('Error switching model:', error);
  }
};

// Function to detect the appropriate role based on message content and user profile
export const detectRole = (message: string): AgentRole => {
  // If user has a predefined role in their profile, prioritize it
  if (userProfile.department) {
    const department = userProfile.department.toLowerCase();
    
    if (department === 'engineering' || department === 'development' || department === 'tech') {
      return 'software';
    } else if (department === 'marketing' || department === 'sales' || department === 'growth') {
      return 'marketing';
    } else if (department === 'executive' || department === 'leadership' || department === 'management') {
      return 'cpo';
    } else if (department === 'finance' || department === 'accounting') {
      return 'accounts';
    } else if (department === 'hr' || department === 'training' || department === 'learning') {
      return 'intern';
    }
  }
  
  // Otherwise detect role from message content
  message = message.toLowerCase();
  
  // Software engineer related topics
  if (message.includes('code') || message.includes('bug') || message.includes('programming') || 
      message.includes('software') || message.includes('algorithm') || message.includes('develop')) {
    return 'software';
  }
  
  // Marketing related topics
  if (message.includes('marketing') || message.includes('campaign') || message.includes('advertis') || 
      message.includes('brand') || message.includes('customer') || message.includes('user acquisition')) {
    return 'marketing';
  }
  
  // CPO (Chief Product Officer) related topics
  if (message.includes('product') || message.includes('strategy') || message.includes('roadmap') || 
      message.includes('vision') || message.includes('executive') || message.includes('leadership')) {
    return 'cpo';
  }
  
  // Accounts related topics
  if (message.includes('finance') || message.includes('account') || message.includes('budget') || 
      message.includes('revenue') || message.includes('cost') || message.includes('expense')) {
    return 'accounts';
  }
  
  // Default to intern for general queries
  return 'intern';
};

// Function to generate a response using the appropriate agent
export const generateAgentResponse = async (
  message: string,
  onToken: (token: string, isDone: boolean) => void,
  history: Array<{ role: 'user' | 'assistant', content: string }> = []
): Promise<void> => {
  try {
    // Detect the appropriate role based on message content and user profile
    const role = detectRole(message);
    
    console.log(`Using agent role: ${role} for message: ${message.substring(0, 50)}...`);
    
    // Make request to the AgenTick server with the detected role
    const agentRequest: AgentRequest = {
      userMessage: message,
      role: role,
      conversationHistory: history
    };
    
    console.log('Sending request to AgenTick server:', agentRequest);
    
    // Create an AbortController to allow cancellation
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Make the fetch request to the AgenTick server
    const response = await fetch(AgenTick_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agentRequest),
      signal: signal
    });
    
    if (!response.ok) {
      throw new Error(`AgenTick server responded with ${response.status}: ${response.statusText}`);
    }
    
    // Handle the streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }
    
    const decoder = new TextDecoder();
    let isDone = false;
    
    while (!isDone) {
      // Check if operation has been aborted before continuing
      if (signal.aborted) {
        console.log('Agent response generation aborted');
        reader.cancel();
        throw new DOMException('Aborted', 'AbortError');
      }
      
      const { value, done } = await reader.read();
      isDone = done;
      
      if (value) {
        const text = decoder.decode(value);
        onToken(text, false);
      }
    }
    
    // Signal completion
    onToken('', true);
    
  } catch (error) {
    // Check if this is an abort error and re-throw it
    if (error.name === 'AbortError') {
      throw error;
    }
    
    console.error('Error generating agent response:', error);
    onToken(`Error: Failed to generate agent response. ${error.message || 'Unknown error'}`, true);
    throw error;
  }
};

// Function to check if the agent server is available
export const checkAgentServer = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${AgenTick_SERVER_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('AgenTick server is not available:', error);
    return false;
  }
};

// Fallback to standard response if model server is not available
export const generateFallbackResponse = async (
  message: string,
  onToken: (token: string, isDone: boolean) => void
): Promise<void> => {
  try {
    onToken("I'm sorry, I can't process your request right now as the AgenTick server is not available. Please make sure the server is running by executing the start-AgenTick-server script in the root folder.", true);
  } catch (error) {
    console.error('Error generating fallback response:', error);
    onToken(`Error: Failed to generate fallback response. ${error.message}`, true);
    throw error;
  }
}; 
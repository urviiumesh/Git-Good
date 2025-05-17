// Types for chat storage
export type ChatMessage = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
};

// API base URL - matches the model service URL
const API_BASE_URL = 'http://localhost:8000';

// Helper to convert date strings to Date objects when parsing API responses
const parseDates = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => parseDates(item));
  }
  
  const result: any = {};
  
  for (const key in data) {
    if (key === 'timestamp' || key === 'createdAt' || key === 'updatedAt') {
      result[key] = new Date(data[key]);
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      result[key] = parseDates(data[key]);
    } else {
      result[key] = data[key];
    }
  }
  
  return result;
};

// Get all conversations
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations`);
    
    if (!response.ok) {
      console.error('Failed to fetch conversations:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    return parseDates(data.conversations) || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

// Get a specific conversation by ID
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversation/${conversationId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Conversation with ID ${conversationId} not found`);
        return null;
      }
      
      console.error('Failed to fetch conversation:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    return parseDates(data);
  } catch (error) {
    console.error(`Error fetching conversation ${conversationId}:`, error);
    return null;
  }
};

// Get the active conversation ID
export const getActiveConversationId = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/active-conversation`);
    
    if (!response.ok) {
      console.error('Failed to fetch active conversation ID:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error fetching active conversation ID:', error);
    return null;
  }
};

// Save a conversation
export const saveConversation = async (conversation: Conversation): Promise<void> => {
  try {
    // Ensure updated date is set
    conversation.updatedAt = new Date();
    
    const response = await fetch(`${API_BASE_URL}/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(conversation)
    });
    
    if (!response.ok) {
      console.error('Failed to save conversation:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
};

// Create a new conversation
export const createConversation = async (title: string = 'New Conversation'): Promise<Conversation> => {
  const newConversation: Conversation = {
    id: Date.now().toString(),
    title,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await saveConversation(newConversation);
  await setActiveConversation(newConversation.id);
  
  return newConversation;
};

// Set the active conversation
export const setActiveConversation = async (conversationId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/active-conversation/${conversationId}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      console.error('Failed to set active conversation:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error setting active conversation:', error);
  }
};

// Add a message to a conversation
export const addMessageToConversation = async (
  conversationId: string, 
  message: ChatMessage
): Promise<Conversation | null> => {
  try {
    const conversation = await getConversation(conversationId);
    
    if (!conversation) {
      console.error(`Could not find conversation ${conversationId} to add message`);
      return null;
    }
    
    conversation.messages.push(message);
    conversation.updatedAt = new Date();
    
    // Generate a title from the first user message if this is the first message
    if (conversation.title === 'New Conversation' && message.isUser && conversation.messages.length <= 2) {
      conversation.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
    }
    
    await saveConversation(conversation);
    return conversation;
  } catch (error) {
    console.error('Error adding message to conversation:', error);
    return null;
  }
};

// Update a message in a conversation
export const updateMessageInConversation = async (
  conversationId: string,
  messageId: string,
  updatedMessage: Partial<ChatMessage>
): Promise<Conversation | null> => {
  try {
    const conversation = await getConversation(conversationId);
    
    if (!conversation) {
      console.error(`Could not find conversation ${conversationId} to update message`);
      return null;
    }
    
    const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex === -1) {
      console.error(`Could not find message ${messageId} in conversation ${conversationId}`);
      return null;
    }
    
    conversation.messages[messageIndex] = {
      ...conversation.messages[messageIndex],
      ...updatedMessage
    };
    
    conversation.updatedAt = new Date();
    await saveConversation(conversation);
    return conversation;
  } catch (error) {
    console.error('Error updating message in conversation:', error);
    return null;
  }
};

// Delete a conversation
export const deleteConversation = async (conversationId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      console.error('Failed to delete conversation:', response.status, response.statusText);
    }
  } catch (error) {
    console.error(`Error deleting conversation ${conversationId}:`, error);
  }
};

// Clear all conversations
export const clearAllConversations = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      console.error('Failed to clear all conversations:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error clearing all conversations:', error);
  }
}; 
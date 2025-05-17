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
  selfDestruct?: boolean;
};

// API base URL - matches the model service URL
const API_BASE_URL = 'http://localhost:8000';

// Local storage key for self-destructing conversations
const SELF_DESTRUCT_KEY = 'self_destruct_conversations';

// Helper to get list of self-destructing conversation IDs
export const getSelfDestructConversations = (): string[] => {
  const stored = localStorage.getItem(SELF_DESTRUCT_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error parsing self-destruct conversations:', e);
    return [];
  }
};

// Helper to mark a conversation as self-destructing
export const markConversationSelfDestruct = async (conversationId: string): Promise<boolean> => {
  // First verify that this conversation exists
  try {
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      console.error(`Cannot mark non-existent conversation ${conversationId} for self-destruct`);
      return false;
    }
    
    // Now mark it for self-destruct
    const existing = getSelfDestructConversations();
    if (!existing.includes(conversationId)) {
      const updated = [...existing, conversationId];
      localStorage.setItem(SELF_DESTRUCT_KEY, JSON.stringify(updated));
      console.log(`Marked conversation ${conversationId} for self-destruct`);
    }
    return true;
  } catch (error) {
    console.error(`Error marking conversation ${conversationId} for self-destruct:`, error);
    return false;
  }
};

// Helper to check if a conversation is self-destructing
export const isConversationSelfDestruct = (conversationId: string): boolean => {
  if (!conversationId) return false;
  const selfDestructConversations = getSelfDestructConversations();
  return selfDestructConversations.includes(conversationId);
};

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

// Get all conversations from storage
export const getAllConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations`);
    
    if (!response.ok) {
      console.error('Failed to fetch conversations:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log('Received conversations from server:', data);
    
    // Check if the data is in the expected format (with conversations property)
    const conversationsData = data.conversations || [];
    console.log(`Processing ${conversationsData.length} conversations`);
    
    // Parse dates in the conversation objects
    const conversations = parseDates(conversationsData) as Conversation[];
    
    // Apply self-destruct status from local storage
    const selfDestructIds = getSelfDestructConversations();
    return conversations.map(conversation => ({
      ...conversation,
      selfDestruct: selfDestructIds.includes(conversation.id)
    }));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

// Get a specific conversation by ID
export const getConversation = async (id: string): Promise<Conversation | null> => {
  try {
    console.log(`Fetching conversation with ID: ${id}`);
    const response = await fetch(`${API_BASE_URL}/conversation/${id}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch conversation ${id}:`, response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log(`Received conversation data:`, data);
    
    // Make sure we have valid data
    if (!data || !data.id) {
      console.error(`Received invalid conversation data for ID ${id}:`, data);
      return null;
    }
    
    // Parse dates in the conversation object
    const conversation = parseDates(data) as Conversation;
    console.log(`Parsed conversation with ${conversation.messages?.length || 0} messages`);
    
    // Apply self-destruct status from local storage
    const selfDestructIds = getSelfDestructConversations();
    return {
      ...conversation,
      selfDestruct: selfDestructIds.includes(conversation.id)
    };
  } catch (error) {
    console.error(`Error fetching conversation ${id}:`, error);
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
    
    // Store self-destruct status in local storage
    if (conversation.selfDestruct) {
      markConversationSelfDestruct(conversation.id);
    }
    
    // Clone the conversation to remove selfDestruct flag before sending to API
    const apiConversation = { ...conversation };
    delete apiConversation.selfDestruct;
    
    const response = await fetch(`${API_BASE_URL}/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiConversation)
    });
    
    if (!response.ok) {
      console.error('Failed to save conversation:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
};

// Create a new conversation
export const createConversation = async (title: string = 'New Conversation', selfDestruct: boolean = false): Promise<Conversation> => {
  const newConversation: Conversation = {
    id: Date.now().toString(),
    title,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    selfDestruct
  };
  
  // First save it so it exists in the system
  await saveConversation(newConversation);
  await setActiveConversation(newConversation.id);
  
  // Then mark it as self-destruct if needed
  if (selfDestruct) {
    await markConversationSelfDestruct(newConversation.id);
  }
  
  return newConversation;
};

// Delete all self-destructing conversations
export const deleteSelfDestructConversations = async (): Promise<string[]> => {
  try {
    const selfDestructIds = getSelfDestructConversations();
    
    if (selfDestructIds.length === 0) return [];
    
    console.log(`Deleting ${selfDestructIds.length} self-destructing conversations`);
    
    // Create a copy of the IDs we're about to delete
    const deletedIds = [...selfDestructIds];
    
    // Clear the self-destruct list from localStorage AFTER we saved the IDs
    localStorage.removeItem(SELF_DESTRUCT_KEY);
    
    // Use Promise.all to delete all conversations in parallel for better performance
    await Promise.all(selfDestructIds.map(async (id) => {
      try {
        const response = await fetch(`${API_BASE_URL}/conversation/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          console.error(`Failed to delete self-destructing conversation ${id}:`, response.status, response.statusText);
        } else {
          console.log(`Successfully deleted self-destructing conversation ${id}`);
        }
      } catch (error) {
        console.error(`Error deleting self-destructing conversation ${id}:`, error);
      }
    }));
    
    // Double-check all conversations were removed from the server
    // If there are any leftover conversations, attempt to clear them all
    try {
      const allConversations = await getAllConversations();
      const remainingSelfDestruct = allConversations.filter(conv => deletedIds.includes(conv.id));
      
      if (remainingSelfDestruct.length > 0) {
        console.warn(`Found ${remainingSelfDestruct.length} self-destruct conversations that weren't properly deleted. Clearing them now.`);
        for (const conv of remainingSelfDestruct) {
          await deleteConversation(conv.id);
        }
      }
    } catch (e) {
      console.error('Error checking for remaining self-destruct conversations:', e);
    }
    
    // Return the deleted IDs so the UI can be updated
    return deletedIds;
  } catch (error) {
    console.error('Error in deleteSelfDestructConversations:', error);
    
    // Even if there's an error, make sure the localStorage is cleared
    localStorage.removeItem(SELF_DESTRUCT_KEY);
    
    return [];
  }
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
  updates: Partial<ChatMessage>
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
      ...updates
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
    
    // Also remove from self-destruct list if present
    const selfDestructIds = getSelfDestructConversations();
    if (selfDestructIds.includes(conversationId)) {
      const updated = selfDestructIds.filter(id => id !== conversationId);
      localStorage.setItem(SELF_DESTRUCT_KEY, JSON.stringify(updated));
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
    
    // Clear the self-destruct list
    localStorage.removeItem(SELF_DESTRUCT_KEY);
  } catch (error) {
    console.error('Error clearing all conversations:', error);
  }
}; 
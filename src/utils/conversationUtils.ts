// Conversation related utilities

import { v4 as uuidv4 } from 'uuid';

// Type definitions
interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
  agentRole?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isSelfDestruct: boolean;
}

// In-memory conversation storage (in a real app, this would be a database)
const conversations: Map<string, Conversation> = new Map();

/**
 * Create a new conversation
 * @param title Initial title for the conversation
 * @param isSelfDestruct Whether this conversation should self-destruct
 * @returns The newly created conversation
 */
export const createConversation = async (title: string, isSelfDestruct: boolean = false): Promise<Conversation> => {
  const id = uuidv4();
  const conversation: Conversation = {
    id,
    title,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isSelfDestruct
  };
  
  conversations.set(id, conversation);
  console.log(`Created new conversation: ${id} (${title})`);
  
  return conversation;
};

/**
 * Add a message to a conversation
 * @param conversationId The conversation ID
 * @param message The message to add
 * @returns Success status
 */
export const addMessageToConversation = async (conversationId: string, message: ChatMessage): Promise<boolean> => {
  const conversation = conversations.get(conversationId);
  
  if (!conversation) {
    console.error(`Conversation ${conversationId} not found`);
    return false;
  }
  
  conversation.messages.push(message);
  conversation.updatedAt = new Date();
  
  return true;
};

/**
 * Update a message in a conversation
 * @param conversationId The conversation ID
 * @param messageId The message ID to update
 * @param updates The updates to apply
 * @returns Success status
 */
export const updateMessageInConversation = async (
  conversationId: string, 
  messageId: string, 
  updates: Partial<ChatMessage>
): Promise<boolean> => {
  const conversation = conversations.get(conversationId);
  
  if (!conversation) {
    console.error(`Conversation ${conversationId} not found`);
    return false;
  }
  
  const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId);
  
  if (messageIndex === -1) {
    console.error(`Message ${messageId} not found in conversation ${conversationId}`);
    return false;
  }
  
  conversation.messages[messageIndex] = {
    ...conversation.messages[messageIndex],
    ...updates
  };
  
  conversation.updatedAt = new Date();
  
  return true;
};

/**
 * Mark a conversation for self-destruction
 * @param conversationId The conversation ID
 * @returns Success status
 */
export const markConversationSelfDestruct = async (conversationId: string): Promise<boolean> => {
  const conversation = conversations.get(conversationId);
  
  if (!conversation) {
    console.error(`Conversation ${conversationId} not found`);
    return false;
  }
  
  conversation.isSelfDestruct = true;
  
  return true;
};

/**
 * Check if a conversation is marked for self-destruction
 * @param conversationId The conversation ID
 * @returns Whether the conversation is marked for self-destruction
 */
export const isConversationSelfDestruct = (conversationId: string): boolean => {
  const conversation = conversations.get(conversationId);
  
  if (!conversation) {
    console.error(`Conversation ${conversationId} not found`);
    return false;
  }
  
  return conversation.isSelfDestruct;
};

/**
 * Get all conversations
 * @returns Array of conversations
 */
export const getConversations = async (): Promise<Conversation[]> => {
  return Array.from(conversations.values());
};

/**
 * Get a specific conversation
 * @param conversationId The conversation ID
 * @returns The conversation or null if not found
 */
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  return conversations.get(conversationId) || null;
}; 
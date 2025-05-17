# Chat History Feature Implementation

This feature allows EdgeGPT to save chat conversations locally on the system, making the application more robust and user-friendly.

## Key Components

1. **Storage Service** (`storageService.ts`)
   - Provides a comprehensive API for managing chat conversations
   - Handles saving/loading conversations to/from the local filesystem via API endpoints
   - Handles proper date serialization/deserialization
   - Auto-generates conversation titles from first user messages

2. **Server-Side Storage** (`run.py`)
   - FastAPI endpoints for persisting conversations to local filesystem 
   - Saves data in JSON format in the `chat_history` directory
   - Handles proper timestamp conversion between frontend and backend

3. **ConversationList Component** (`ConversationList.tsx`)
   - Displays all saved conversations
   - Allows creating new conversations
   - Supports selecting and deleting existing conversations

4. **ChatLayout Component** (`ChatLayout.tsx`)
   - Main layout component that integrates the conversation list with the chat interface
   - Manages conversation state and handles conversation operations
   - Provides a responsive mobile-friendly layout

5. **Updated ChatInterface** (`ChatInterface.tsx`)
   - Modified to work with the async storage service
   - Loads messages from filesystem when a conversation is selected
   - Saves new messages as they are sent/received

## Local Storage Schema

The implementation stores the following data in the filesystem:

- `conversations.json`: Contains array of all conversation objects
- `active_conversation.txt`: Contains ID of the currently active conversation

Each conversation object has the following structure:
```typescript
{
  id: string;              // Unique identifier
  title: string;           // Conversation title
  messages: ChatMessage[]; // Array of messages
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

Each message has this structure:
```typescript
{
  id: string;           // Unique identifier
  content: string;      // Message text
  isUser: boolean;      // Whether from user or AI
  timestamp: Date;      // Message timestamp
  isStreaming?: boolean; // Whether message is currently streaming
}
```

## Features

- **Persistent Storage**: Conversations are automatically saved to the filesystem and survive even browser clearing
- **Dynamic Titles**: Titles are auto-generated from the first user message
- **Responsive Design**: Works on both desktop and mobile
- **Multiple Conversations**: Support for multiple named conversations
- **Auto-resume**: Remembers the last active conversation when returning to the app 
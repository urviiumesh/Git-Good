
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from 'lucide-react';

type ConversationItem = {
  id: string;
  title: string;
  date: Date;
  preview: string;
};

// Mock data for chat history
const mockConversations: ConversationItem[] = [
  {
    id: '1',
    title: 'API Security Best Practices',
    date: new Date('2025-05-15'),
    preview: 'What are the best practices for secure API design?'
  },
  {
    id: '2',
    title: 'Database Query Optimization',
    date: new Date('2025-05-14'),
    preview: 'How can I improve database query performance?'
  },
  {
    id: '3',
    title: 'Authentication vs Authorization',
    date: new Date('2025-05-13'),
    preview: 'Explain the concepts of authentication vs authorization'
  },
  {
    id: '4',
    title: 'Responsive Design Principles',
    date: new Date('2025-05-12'),
    preview: 'What are the key principles of responsive design?'
  },
  {
    id: '5',
    title: 'State Management Patterns',
    date: new Date('2025-05-11'),
    preview: 'What are the best state management patterns for React?'
  }
];

interface ChatHistoryProps {
  onSelectConversation?: (id: string) => void;
  activeConversationId?: string;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  onSelectConversation = () => {}, 
  activeConversationId 
}) => {
  // Format date to be more readable
  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="px-2 py-4">
        <h2 className="text-sm font-medium mb-4 px-2">Recent Conversations</h2>
        
        <div className="space-y-1">
          {mockConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-start group ${
                activeConversationId === conversation.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
              }`}
            >
              <MessageSquare size={16} className="mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium truncate">{conversation.title}</h3>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatDate(conversation.date)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {conversation.preview}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};

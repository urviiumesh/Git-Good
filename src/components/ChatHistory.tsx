import React, { useEffect, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Check if sidebar is collapsed from localStorage
  useEffect(() => {
    const checkSidebarState = () => {
      const storedCollapseState = localStorage.getItem('sidebar-collapsed');
      if (storedCollapseState) {
        setIsSidebarCollapsed(JSON.parse(storedCollapseState));
      }
    };
    
    // Check on load
    checkSidebarState();
    
    // Listen for storage events to detect changes
    window.addEventListener('storage', checkSidebarState);
    
    return () => {
      window.removeEventListener('storage', checkSidebarState);
    };
  }, []);

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

  const renderConversationButton = (conversation: ConversationItem) => {
    const isActive = activeConversationId === conversation.id;
    
    const button = (
      <button
        key={conversation.id}
        onClick={() => onSelectConversation(conversation.id)}
        className={cn(
          "w-full text-left rounded-md transition-all duration-300 ease-in-out flex items-start",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isSidebarCollapsed ? "justify-center py-3 px-1" : "justify-start py-2.5 px-3",
          isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
        )}
      >
        <MessageSquare 
          size={isSidebarCollapsed ? 18 : 16} 
          className={cn(
            "flex-shrink-0 transition-all duration-300",
            isSidebarCollapsed ? "mx-auto" : "mt-0.5 mr-3"
          )} 
        />
        
        <div className={cn(
          "flex-1 min-w-0 overflow-hidden transition-all duration-300",
          isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium truncate">{conversation.title}</h3>
            <span className="text-xs text-muted-foreground ml-2 shrink-0">
              {formatDate(conversation.date)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-1">
            {conversation.preview}
          </p>
        </div>
      </button>
    );

    return isSidebarCollapsed ? (
      <TooltipProvider key={conversation.id} delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="max-w-xs p-3">
            <div className="space-y-1">
              <div className="font-medium">{conversation.title}</div>
              <div className="text-xs text-muted-foreground">{formatDate(conversation.date)}</div>
              <div className="text-xs">{conversation.preview}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : button;
  };

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="px-2 py-2">
        {!isSidebarCollapsed && (
          <h2 className={cn(
            "text-sm font-medium mb-4 px-2 transition-opacity duration-300",
            isSidebarCollapsed ? "opacity-0" : "opacity-100"
          )}>
            Recent Conversations
          </h2>
        )}
        
        <div className="space-y-1">
          {mockConversations.map((conversation) => (
            <div key={conversation.id}>
              {renderConversationButton(conversation)}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};

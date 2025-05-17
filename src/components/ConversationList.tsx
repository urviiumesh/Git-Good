import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Conversation } from '../utils/storageService';
import { PlusCircle, MessageSquare, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  isCollapsed?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  isCollapsed = false,
}) => {
  // Sort conversations by updated date (newest first)
  const sortedConversations = [...conversations].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  return (
    <div className="flex flex-col h-full">
      <div className={cn(
        "p-4 border-b border-border",
        isCollapsed && "flex justify-center items-center p-2"
      )}>
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={onNewConversation}
                  className="h-10 w-10"
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>New Chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={onNewConversation}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className={cn("p-2", isCollapsed && "px-0")}>
          {sortedConversations.length === 0 ? (
            <div className={cn(
              "text-center p-4 text-muted-foreground",
              isCollapsed && "p-2 text-xs"
            )}>
              {isCollapsed ? "No chats" : "No conversations yet"}
            </div>
          ) : (
            sortedConversations.map((convo) => (
              <ConversationItem
                key={convo.id}
                conversation={convo}
                isActive={activeConversationId === convo.id}
                onSelect={() => onSelectConversation(convo.id)}
                onDelete={() => onDeleteConversation(convo.id)}
                isCollapsed={isCollapsed}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Extracted to a separate component for better organization
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isCollapsed: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  isCollapsed
}) => {
  const timeAgo = formatDistanceToNow(conversation.updatedAt, { addSuffix: true });
  
  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "flex justify-center py-3 mx-1 my-1 rounded-md cursor-pointer",
                isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/80 text-muted-foreground"
              )}
              onClick={onSelect}
            >
              <MessageSquare className="h-5 w-5" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[200px]">
            <p className="font-medium">{conversation.title}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div 
      className={cn(
        "group flex items-center justify-between rounded-lg p-3 text-sm mb-1 cursor-pointer",
        isActive ? "bg-muted text-foreground" : "hover:bg-muted/50 text-muted-foreground"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center overflow-hidden">
        <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
        <div className="truncate">
          <div className="font-medium truncate">{conversation.title}</div>
          <div className="text-xs text-muted-foreground">
            {timeAgo}
          </div>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-7 w-7"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}; 
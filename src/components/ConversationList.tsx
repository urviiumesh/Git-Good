import React from 'react';
import { Button } from "@/components/ui/button";
import { type Conversation } from '../utils/storageService';
import { PlusCircle, MessageSquare, Trash2, LayoutDashboard } from 'lucide-react';
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

  const navigateToDashboard = () => {
    window.location.href = '/Dashboard';
  };

  return (
    <div className="relative flex flex-col h-full bg-sidebar-background">
      {/* Fixed Header - Always visible at top */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-10 border-b border-sidebar-border p-4 bg-sidebar-background",
        isCollapsed && "p-2 flex justify-center"
      )}>
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={onNewConversation}
                  className="h-10 w-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
            className="w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
            onClick={onNewConversation}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        )}
      </div>
      
      {/* Fixed Footer - Always visible at bottom */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 z-10 border-t border-sidebar-border p-4 bg-sidebar-background",
        isCollapsed && "p-2 flex justify-center"
      )}>
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={navigateToDashboard}
                  className="h-10 w-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LayoutDashboard className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Dashboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button 
            variant="outline" 
            className="w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
            onClick={navigateToDashboard}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        )}
      </div>
      
      {/* Scrollable Area - With padding to avoid overlap with fixed elements */}
      <div className="overflow-y-auto h-full w-full">
        {/* Top padding to avoid header overlap */}
        <div className="pt-16"></div>
        
        {/* Conversation list */}
        <div className={cn(
          "p-2 space-y-1 pb-20", // Reduced padding to ensure footer is visible
          isCollapsed && "px-0"
        )}>
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
      </div>
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
  const isSelfDestruct = Boolean(conversation.selfDestruct);
  
  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "flex justify-center py-2.5 mx-1 my-1 rounded-md cursor-pointer transition-colors",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 text-muted-foreground",
                isSelfDestruct && "border-l-2 border-destructive"
              )}
              onClick={onSelect}
            >
              <MessageSquare className={cn("h-5 w-5", isSelfDestruct && "text-destructive")} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[200px]">
            <p className={cn("font-medium", isSelfDestruct && "text-destructive")}>
              {conversation.title} {isSelfDestruct && "(Self-Destruct)"}
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div 
      className={cn(
        "group flex items-center justify-between rounded-md p-2 text-sm cursor-pointer transition-colors",
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 text-muted-foreground",
        isSelfDestruct && "border-l-2 border-destructive"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 min-w-0">
        <MessageSquare className={cn("h-4 w-4 flex-shrink-0", isSelfDestruct && "text-destructive")} />
        <div className="flex flex-col min-w-0">
          <div className={cn("font-medium truncate", isSelfDestruct && "text-destructive")}>
            {conversation.title} {isSelfDestruct && "(Self-Destruct)"}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {timeAgo}
          </div>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 hover:bg-sidebar-accent/80"
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
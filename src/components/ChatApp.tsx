
import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChatInterface } from '@/components/ChatInterface';
import { ChatHistory } from '@/components/ChatHistory';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeProvider } from '@/providers/ThemeProvider';

const ChatApp = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNewChat = () => {
    setActiveConversationId(undefined);
    // In a real app, we would create a new conversation here
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <ThemeProvider>
      <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
        {/* Mobile sidebar toggle */}
        <div className="md:hidden flex items-center p-4 border-b">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mr-4"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
          </Button>
          <h1 className="text-xl font-semibold">EdgeGPT</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Sidebar - desktop is always visible, mobile is conditional */}
        <div 
          className={`${isMobileMenuOpen ? 'fixed inset-0 z-50 block' : 'hidden'} md:relative md:block md:w-72 lg:w-80 border-r border-sidebar-border bg-sidebar text-sidebar-foreground`}
        >
          <div className="p-4 flex flex-col h-full">
            <div className="hidden md:flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold">EdgeGPT</h1>
              <ThemeToggle />
            </div>
            
            <Button 
              className="mb-6 w-full" 
              size="sm" 
              onClick={handleNewChat}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Chat
            </Button>
            
            <ChatHistory 
              onSelectConversation={handleSelectConversation} 
              activeConversationId={activeConversationId} 
            />
            
            <div className="mt-auto pt-4 border-t border-sidebar-border">
              <div className="flex items-center p-2">
                <div className="h-8 w-8 rounded-full bg-sidebar-accent/20 flex items-center justify-center text-sidebar-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">Premium Plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile overlay backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          <ChatInterface activeConversationId={activeConversationId} />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default ChatApp;

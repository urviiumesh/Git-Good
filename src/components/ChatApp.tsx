import React, { useState, useEffect } from 'react';
import { PlusCircle, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ChatInterface';
import { ChatHistory } from '@/components/ChatHistory';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { cn } from '@/lib/utils';

const COLLAPSED_WIDTH = 'w-16'; // 64px
const EXPANDED_WIDTH = 'w-72 lg:w-80';

const ChatApp = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check local storage for sidebar state on load
  useEffect(() => {
    const storedCollapseState = localStorage.getItem('sidebar-collapsed');
    if (storedCollapseState) {
      setIsSidebarCollapsed(JSON.parse(storedCollapseState));
    }
  }, []);

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    // Trigger storage event for other components to detect change
    window.dispatchEvent(new Event('storage'));
  };

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
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">EdgeGPT</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Sidebar - desktop collapsed/expanded state, mobile is conditional */}
        <div className="relative">
          <div 
            className={cn(
              "transition-all duration-300 ease-in-out",
              isMobileMenuOpen ? 'fixed inset-0 z-50 block' : 'hidden',
              'md:relative md:block',
              isSidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
              'border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-screen overflow-hidden'
            )}
          >
            <div className={cn(
              'flex flex-col h-full',
              isSidebarCollapsed ? 'items-center px-2 py-4 gap-2' : 'p-4'
            )}>
              {/* Logo and theme toggle */}
              <div className={cn(
                'mb-6 flex items-center w-full',
                isSidebarCollapsed ? 'flex-col gap-2 mb-2' : 'justify-between'
              )}>
                {!isSidebarCollapsed ? (
                  <h1 className="text-xl font-semibold transition-opacity duration-300">EdgeGPT</h1>
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-1">
                    E
                  </div>
                )}
                <ThemeToggle />
              </div>
              {/* New Chat button */}
              <Button 
                className={cn(
                  'transition-all duration-300 ease-in-out mb-6',
                  isSidebarCollapsed ? 'rounded-full p-0 h-10 w-10 flex items-center justify-center mb-2' : 'w-full'
                )}
                size={isSidebarCollapsed ? 'icon' : 'sm'}
                onClick={handleNewChat}
                title="New Chat"
              >
                <PlusCircle className={cn('h-5 w-5', isSidebarCollapsed ? '' : 'mr-2')} />
                <span className={cn(
                  'transition-opacity duration-300', 
                  isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                )}>
                  New Chat
                </span>
              </Button>
              {/* Chat history */}
              <div className="flex-1 w-full flex flex-col">
                <ChatHistory 
                  onSelectConversation={handleSelectConversation} 
                  activeConversationId={activeConversationId} 
                />
              </div>
              {/* Desktop sidebar toggle button, vertically centered and inside sidebar */}
              <button 
                onClick={toggleSidebar}
                className={cn(
                  'absolute hidden md:flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground shadow-md z-20 hover:scale-110 transition-transform border-2 border-sidebar top-1/2 right-2 -translate-y-1/2',
                )}
                aria-label="Toggle sidebar"
              >
                {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
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

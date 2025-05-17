import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ChatInterface';
import { ChatHistory } from '@/components/ChatHistory';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    // Redirect to login page or show toast notification
    window.location.href = '/auth/login';
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden flex items-center p-4 border-b">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mr-4"
        >
          <Icons.alignJustify className="h-5 w-5" />
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
                <h1 className="text-xl font-semibold transition-opacity duration-300 text-sidebar-foreground">EdgeGPT</h1>
              ) : (
                <div className="h-9 w-9 rounded-full bg-sidebar-primary/10 flex items-center justify-center text-sidebar-primary font-bold mb-1">
                  E
                </div>
              )}
              <ThemeToggle variant="sidebar" />
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

            {/* Account Profile Box */}
            <div className={cn(
              "mt-auto border-t border-sidebar-border pt-2 pb-2 px-2",
              isSidebarCollapsed ? "w-full" : ""
            )}>
              <div className={cn(
                "flex items-center gap-2 p-2 rounded-lg",
                "bg-transparent text-sidebar-foreground hover:bg-sidebar-accent/10 transition-colors",
                isSidebarCollapsed ? "justify-center" : ""
              )}>
                <Avatar className={cn(
                  "border border-sidebar-border/30",
                  isSidebarCollapsed ? "h-8 w-8" : "h-10 w-10"
                )}>
                  <AvatarImage src="/avatars/01.png" alt="User" />
                  <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary">JD</AvatarFallback>
                </Avatar>
                
                {!isSidebarCollapsed ? (
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-sidebar-foreground truncate">John Doe</span>
                    <span className="text-xs text-sidebar-foreground/60 truncate">john@example.com</span>
                    <div className="flex gap-1 mt-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/15" asChild>
                        <Link to="/profile">Profile</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                        <Icons.logOut className="h-3 w-3 mr-1" />
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 absolute right-1 top-1 text-sidebar-foreground hover:bg-sidebar-accent/10 bg-transparent">
                        <Icons.menu className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">John Doe</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            john@example.com
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer w-full">
                          <Icons.user className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="cursor-pointer w-full">
                          <Icons.settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive hover:text-destructive">
                        <Icons.logOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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
  );
};

export default ChatApp;

import React, { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatInterface } from '../../ChatInterface';
import { 
  getAllConversations, 
  getActiveConversationId, 
  setActiveConversation, 
  createConversation, 
  deleteConversation,
  type Conversation
} from '../utils/storageService';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from './ThemeToggle';
import VoiceCommandButton from './VoiceCommandButton';
import { VoiceCommand } from '@/utils/voiceCommands';
import { UserAccount } from './UserAccount';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

export const ChatLayout: React.FC = () => {
  const { logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load conversations from storage on component mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoading(true);
        
        const loadedConversations = await getAllConversations();
        const activeId = await getActiveConversationId();
        
        setConversations(loadedConversations);
        setActiveConversationId(activeId);
        
        // If there's no active conversation but we have conversations, activate the first one
        if (!activeId && loadedConversations.length > 0) {
          await setActiveConversation(loadedConversations[0].id);
          setActiveConversationId(loadedConversations[0].id);
        }
        
        // If there are no conversations at all, create a new one
        if (loadedConversations.length === 0) {
          const newConvo = await createConversation();
          setConversations([newConvo]);
          setActiveConversationId(newConvo.id);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversations();
    
    // Check localStorage for sidebar collapsed state
    const storedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (storedCollapsed) {
      setSidebarCollapsed(JSON.parse(storedCollapsed));
    }
    
    // Automatically collapse sidebar on mobile
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Initialize sidebar state based on screen size
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Listen for self-destruct conversation deletion events
  useEffect(() => {
    const handleConversationsUpdated = (event: CustomEvent) => {
      if (event.detail && event.detail.conversations) {
        console.log('Received updated conversations list:', event.detail.conversations);
        setConversations(event.detail.conversations);
        
        // If the active conversation was deleted, select a new one
        if (activeConversationId && !event.detail.conversations.some(c => c.id === activeConversationId)) {
          const remainingConvos = event.detail.conversations;
          
          if (remainingConvos.length > 0) {
            setActiveConversation(remainingConvos[0].id).then(() => {
              setActiveConversationId(remainingConvos[0].id);
            });
          } else {
            createConversation().then(newConvo => {
              setConversations([newConvo]);
              setActiveConversationId(newConvo.id);
            });
          }
        }
      }
    };
    
    // Add event listener for custom event
    window.addEventListener('conversations-updated', handleConversationsUpdated as EventListener);
    return () => {
      window.removeEventListener('conversations-updated', handleConversationsUpdated as EventListener);
    };
  }, [activeConversationId]);
  
  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);
  
  // Handle creating a new conversation
  const handleNewConversation = async () => {
    try {
      const newConvo = await createConversation();
      setConversations(prev => [newConvo, ...prev]);
      setActiveConversationId(newConvo.id);
      
      // Auto-close sidebar on mobile after selecting
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  };
  
  // Handle selecting a conversation
  const handleSelectConversation = async (id: string) => {
    try {
      await setActiveConversation(id);
      setActiveConversationId(id);
      
      // Auto-close sidebar on mobile after selecting
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error selecting conversation:', error);
    }
  };
  
  // Handle deleting a conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      
      // Get fresh list of conversations
      const updatedConversations = await getAllConversations();
      setConversations(updatedConversations);
      
      // If we deleted the active conversation, activate another one or create a new one
      if (activeConversationId === id) {
        if (updatedConversations.length > 0) {
          await setActiveConversation(updatedConversations[0].id);
          setActiveConversationId(updatedConversations[0].id);
        } else {
          const newConvo = await createConversation();
          setConversations([newConvo]);
          setActiveConversationId(newConvo.id);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    // Use the logout function from AuthProvider
    logout();
  };
  
  // Toggle sidebar collapsed state
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Define voice commands for sidebar/header
  const voiceCommands: VoiceCommand[] = [
    {
      command: "new conversation",
      action: handleNewConversation,
      aliases: ["start new", "clear chat", "reset conversation"]
    },
    {
      command: "change theme",
      action: () => {
        document.documentElement.classList.toggle('dark');
      },
      aliases: ["toggle theme", "switch theme", "dark mode", "light mode"]
    }
  ];
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Mobile header with menu toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center p-4 h-16 border-b bg-background">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="mr-4"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="font-semibold text-lg flex-1 truncate">Vantrix </div>
        <VoiceCommandButton commands={voiceCommands} className="ml-2" />
        <ThemeToggle className="ml-2" />
      </div>
      
      {/* Sidebar - desktop always visible, mobile is conditional */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out border-r border-border bg-background",
          sidebarCollapsed ? "w-20" : "w-80",
          "lg:relative lg:block overflow-hidden",
          // Mobile positioning
          sidebarOpen 
            ? "fixed inset-y-0 left-0 z-40 pt-16 lg:pt-0" 
            : "fixed inset-y-0 -left-80 z-40 pt-16 lg:pt-0 lg:left-0",
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "hidden lg:flex items-center p-4 border-b border-border",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!sidebarCollapsed && <h1 className="font-semibold text-lg">Vantrix </h1>}
          {sidebarCollapsed && (
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              E
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <VoiceCommandButton commands={voiceCommands} />
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex"
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Conversation List */}
        <div className="flex-1 h-full">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onNewConversation={handleNewConversation}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            isCollapsed={sidebarCollapsed}
          />
        </div>
        
        {/* User Account - fixed at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border z-10">
          <UserAccount isCollapsed={sidebarCollapsed} onLogout={handleLogout} />
        </div>
      </div>
      
      {/* Main chat area */}
      <div className={cn(
        "flex-1 flex flex-col h-full overflow-hidden",
        "lg:mt-0 mt-16" // Add top margin on mobile to account for header
      )}>
        <ChatInterface activeConversationId={activeConversationId} />
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}; 
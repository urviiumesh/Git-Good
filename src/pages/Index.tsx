import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { Chat } from '@/components/Chat';
import { CodeGeneration } from '@/components/CodeGeneration';
import { HRAnalytics } from '@/components/HRAnalytics';
import { Settings } from '@/components/Settings';
import { AuditLogs } from '@/components/AuditLogs';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const path = location.pathname;

  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate, toast]);

  const getComponent = () => {
    switch (path) {
      case '/chat':
        return <Chat />;
      case '/code':
        return <CodeGeneration />;
      case '/hr-analytics':
        return <HRAnalytics />;
      case '/audit':
        return <AuditLogs />;
      case '/settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:block" />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {getComponent()}
        </main>
      </div>
    </div>
  );
};

export default Index;


import React from 'react';
import { ChatInterface } from '@/components/ChatInterface';

const ChatApp = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main chat area */}
      <ChatInterface />
    </div>
  );
};

export default ChatApp;

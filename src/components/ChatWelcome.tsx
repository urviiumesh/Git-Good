
import React from 'react';

export const ChatWelcome: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center px-4 py-12">
      <div className="bg-primary/10 p-3 rounded-full">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="36" 
          height="36" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-primary"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Welcome to EdgeGPT</h2>
      <p className="text-muted-foreground max-w-md">
        Your advanced AI assistant for development, security, and enterprise tasks. 
        Ask me about code, architecture, best practices, or any technical questions.
      </p>
    </div>
  );
};

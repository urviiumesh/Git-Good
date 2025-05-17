import React from 'react';

export const ChatWelcome: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 sm:space-y-6 text-center p-3 sm:p-6 md:p-8">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/40 rounded-full blur-md"></div>
        <div className="bg-background dark:bg-background/80 p-3 sm:p-4 rounded-full relative">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="30" 
            height="30" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-primary sm:w-8 sm:h-8"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
      </div>
      
      <div className="space-y-1 sm:space-y-2">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">Welcome to EdgeGPT</h2>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-xs sm:max-w-sm md:max-w-md mx-auto px-2">
          Your advanced AI assistant for development, security, and enterprise tasks. 
          Ask me about code, architecture, best practices, or any technical questions.
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-1.5 sm:gap-2 w-full max-w-xs sm:max-w-sm md:max-w-md">
        {/* <FeatureBadge icon="💻" text="Code Assistant" /> */}
        <FeatureBadge icon="🔒" text="Security Analysis" />
        <FeatureBadge icon="📊" text="Data Insights" />
        <FeatureBadge icon="📚" text="Documentation" />
      </div>
    </div>
  );
};

interface FeatureBadgeProps {
  icon: string;
  text: string;
}

const FeatureBadge: React.FC<FeatureBadgeProps> = ({ icon, text }) => (
  <div className="flex items-center justify-center sm:justify-start space-x-1 bg-muted/50 dark:bg-muted/20 py-1 px-2 rounded-full text-xs sm:text-sm w-full sm:w-auto">
    <span>{icon}</span>
    <span className="font-medium whitespace-nowrap">{text}</span>
  </div>
);

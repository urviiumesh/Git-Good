import React from 'react';
import { cn } from '@/lib/utils';
import { CircleUser, Code } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { parseMessageContent, isCodeContent } from '@/utils/codeFormatter';
import { CodeBlock } from './CodeBlock';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
};

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  // Parse message content to find code blocks
  const blocks = parseMessageContent(message.content);
  const isCodeMode = !message.isUser && isCodeContent(message.content);

  // Render the message avatar/icon
  const renderAvatar = () => {
    if (message.isUser) {
      return (
        <div className={cn(
          "flex flex-shrink-0 h-8 w-8 rounded-full items-center justify-center",
          "bg-primary text-primary-foreground"
        )}>
          <CircleUser className="h-5 w-5" />
        </div>
      );
    } else {
      return (
        <div className={cn(
          "flex flex-shrink-0 h-8 w-8 rounded-full items-center justify-center",
          isCodeMode ? "bg-amber-600" : "bg-muted"
        )}>
          {isCodeMode ? (
            <Code className="h-4 w-4 text-white" />
          ) : (
            <span className="font-semibold text-sm">AI</span>
          )}
        </div>
      );
    }
  };

  // Render message content with code blocks
  const renderContent = () => {
    // If we're streaming, just show the raw content
    if (message.isStreaming) {
      return <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>;
    }

    // If there's only one block and it's not a code block, and we're not in code mode
    if (blocks.length === 1 && !blocks[0].isCodeBlock && !isCodeMode) {
      return <p className="text-sm md:text-base whitespace-pre-wrap">{blocks[0].code}</p>;
    }

    // If we're in code mode and there's only one block and it doesn't have code markers,
    // format the whole thing as a code block
    if (isCodeMode && blocks.length === 1 && !blocks[0].isCodeBlock) {
      return (
        <CodeBlock 
          code={blocks[0].code} 
          language="typescript" 
          showLineNumbers={true}
        />
      );
    }

    // Otherwise, render a mix of text and code blocks
    return blocks.map((block, index) => {
      if (block.isCodeBlock) {
        return (
          <CodeBlock 
            key={index}
            code={block.code}
            language={block.language || 'plaintext'}
            showLineNumbers={true}
          />
        );
      } else {
        return (
          <p key={index} className="text-sm md:text-base whitespace-pre-wrap mb-4">
            {block.code}
          </p>
        );
      }
    });
  };

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        message.isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {renderAvatar()}
      
      <div className="flex flex-col max-w-[80%]">
        <div
          className={cn(
            "rounded-lg p-4",
            message.isUser 
              ? "bg-primary text-primary-foreground" 
              : isCodeMode
                ? "bg-zinc-900 border border-zinc-800 text-zinc-100"
                : "bg-card border border-border"
          )}
        >
          {renderContent()}
          
          {message.isStreaming && (
            <div className="flex items-center mt-2">
              <StatusIndicator status="loading" showLabel={false} />
              <span className="text-xs text-muted-foreground ml-2">generating...</span>
            </div>
          )}
        </div>
        
        <span className="text-xs text-muted-foreground mt-1 self-start">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

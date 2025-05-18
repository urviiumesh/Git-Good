import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CircleUser, Code, MessageSquare } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { parseMessageContent, isCodeContent, detectCodeLanguage, processInlineCode } from '@/utils/codeFormatter';
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
  const [isHovered, setIsHovered] = useState(false);

  // Clean problematic content before processing
  const cleanContent = (content: string): string => {
    return content
      // Handle duplicate requirements sections
      .replace(/(\#{3,}\s+Requirements.*?)(\#{3,}\s+Requirements)/s, '$1')
      // Handle duplicate solution sections
      .replace(/(\#{3,}\s+Solution.*?)(\#{3,}\s+Solution)/s, '$1')
      // Fix malformed code blocks
      .replace(/```{2,}/g, '```')
      // Fix broken line breaks
      .replace(/\\n/g, '\n');
  };

  // Parse message content to find code blocks with cleaned content
  const blocks = parseMessageContent(cleanContent(message.content));
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
            <MessageSquare className="h-4 w-4 text-primary" />
          )}
        </div>
      );
    }
  };

  // Check if text contains HTML code patterns
  const containsHTML = (text: string): boolean => {
    return /<!DOCTYPE|<html|<head|<body|<script|<style|<link|<meta/i.test(text);
  };

  // Handle HTML in a streaming message - convert it to a code block
  const processStreamingContent = (content: string): React.ReactNode => {
    // If the content looks like raw HTML, treat it as a code block
    if (containsHTML(content)) {
      return (
        <CodeBlock
          code={content}
          language="html"
          showLineNumbers={true}
        />
      );
    }
    
    // Default text rendering - process inline code
    const processedContent = processInlineCode(content);
    return <p className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: processedContent }} />;
  };

  // Render message content with code blocks
  const renderContent = () => {
    // If we're streaming, check for HTML content
    if (message.isStreaming) {
      return processStreamingContent(message.content);
    }

    // If there's only one block and it's not a code block, and we're not in code mode
    if (blocks.length === 1 && !blocks[0].isCodeBlock && !isCodeMode) {
      const processedContent = processInlineCode(blocks[0].code);
      return <p className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: processedContent }} />;
    }

    // If we're in code mode and there's only one block and it doesn't have code markers,
    // treat it as a single code block
    if (isCodeMode && blocks.length === 1 && !blocks[0].isCodeBlock) {
      const content = blocks[0].code;
      // Use enhanced language detection
      const detectedLang = detectCodeLanguage(content) || 'plaintext';

      return (
        <div className="w-full max-w-full overflow-hidden">
          <CodeBlock 
            code={content} 
            language={detectedLang} 
            showLineNumbers={true}
          />
        </div>
      );
    }

    // Otherwise, render a mix of text and code blocks
    return blocks.map((block, index) => {
      if (block.isCodeBlock) {
        return (
          <div key={index} className="w-full max-w-full overflow-hidden rounded-md shadow-md">
            <CodeBlock 
              code={block.code}
              language={block.language || 'plaintext'}
              showLineNumbers={true}
            />
          </div>
        );
      } else {
        const processedContent = processInlineCode(block.code);
        return (
          <div key={index} className="mb-4">
            <p className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: processedContent }} />
          </div>
        );
      }
    });
  };

  const formattedTime = message.timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in group",
        message.isUser ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderAvatar()}
      
      <div className="flex flex-col max-w-[85%] w-full">
        <div
          className={cn(
            "rounded-lg p-4 w-full transition-all duration-200",
            message.isUser 
              ? "bg-primary text-primary-foreground" 
              : isCodeMode
                ? "bg-zinc-900 border border-zinc-800 text-zinc-100"
                : "bg-card border border-border",
            isHovered && !message.isUser && !isCodeMode && "shadow-sm border-border/50",
          )}
        >
          <div className="max-w-full overflow-x-auto">
            {renderContent()}
          </div>
          
          {message.isStreaming && (
            <div className="flex items-center mt-2">
              <StatusIndicator status="loading" />
              <span className="text-xs text-muted-foreground ml-2">generating...</span>
            </div>
          )}
        </div>
        
        <span className={cn(
          "text-xs text-muted-foreground mt-1",
          message.isUser ? "self-end" : "self-start",
          "opacity-60 transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-60"
        )}>
          {formattedTime}
        </span>
      </div>
    </div>
  );
};

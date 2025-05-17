import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CopyIcon, CopyCheckIcon } from 'lucide-react';
import { SyntaxHighlighter, atomOneDark } from '@/utils/codeFormatter';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  showLineNumbers = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative my-4 rounded-md overflow-hidden bg-zinc-950 border border-zinc-800">
      {/* Language badge */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <span className="text-xs text-zinc-400 font-mono">
          {language}
        </span>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
          onClick={handleCopy}
        >
          {copied ? (
            <CopyCheckIcon className="h-4 w-4 text-green-500" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Code content */}
      <div className="p-0">
        <SyntaxHighlighter
          language={language}
          style={atomOneDark}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            backgroundColor: 'transparent',
            borderRadius: 0,
          }}
          lineNumberStyle={{
            color: '#666',
            fontSize: '0.75rem',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}; 
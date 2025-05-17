import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CopyIcon, CopyCheckIcon, Download, Code2, ArrowUpRightSquare, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { normalizeLanguage } from '@/utils/codeFormatter';
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
  const [codeLines, setCodeLines] = useState(0);
  const [copyTooltip, setCopyTooltip] = useState("Copy code");
  const normalizedLanguage = normalizeLanguage(language);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  
  // Clean the code by removing repeated line breaks and trimming
  const cleanCode = (input: string): string => {
    return input
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Replace excessive line breaks with double line breaks
      .trim();
  };
  
  // Pre-process code
  const processedCode = cleanCode(code);

  // Calculate number of lines in code for UI display
  useEffect(() => {
    setCodeLines(processedCode.split('\n').length);
  }, [processedCode]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);
  
  // Get display name for the language (more user-friendly)
  const getLanguageDisplayName = (lang: string): string => {
    const displayNames: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'csharp': 'C#',
      'cpp': 'C++',
      'c': 'C',
      'go': 'Go',
      'rust': 'Rust',
      'php': 'PHP',
      'ruby': 'Ruby',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'scala': 'Scala',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'Sass',
      'less': 'Less',
      'sql': 'SQL',
      'json': 'JSON',
      'yaml': 'YAML',
      'bash': 'Bash',
      'shell': 'Shell',
      'powershell': 'PowerShell',
      'dockerfile': 'Dockerfile',
      'plaintext': 'Plain Text',
      'markup': 'HTML/XML',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
    };
    
    return displayNames[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const handleCopy = () => {
    // Use the Clipboard API to copy text
    navigator.clipboard.writeText(processedCode).then(() => {
      // Update state for UI feedback
      setCopied(true);
      setCopyTooltip("Copied!");
      
      // Add a class to the document body for any global animation
      document.body.classList.add('copy-success-active');
      
      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      // Set timeout to reset state
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        setCopyTooltip("Copy code");
        document.body.classList.remove('copy-success-active');
        copyTimeoutRef.current = null;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      setCopyTooltip("Copy failed!");
      
      // Reset after error
      setTimeout(() => {
        setCopyTooltip("Copy code");
      }, 2000);
    });
  };

  const handleDownload = () => {
    // Create file extension based on language
    const getFileExtension = (lang: string): string => {
      const extensions: Record<string, string> = {
        'javascript': 'js',
        'typescript': 'ts',
        'python': 'py',
        'java': 'java',
        'csharp': 'cs',
        'cpp': 'cpp',
        'c': 'c',
        'go': 'go',
        'rust': 'rs',
        'php': 'php',
        'ruby': 'rb',
        'swift': 'swift',
        'kotlin': 'kt',
        'scala': 'scala',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'less': 'less',
        'sass': 'sass',
        'sql': 'sql',
        'json': 'json',
        'yaml': 'yml',
        'bash': 'sh',
        'shell': 'sh',
        'powershell': 'ps1',
        'dockerfile': 'Dockerfile',
        'markup': 'html',
        'jsx': 'jsx',
        'tsx': 'tsx',
      };
      
      return extensions[lang] || 'txt';
    };
    
    const fileName = `code-snippet.${getFileExtension(normalizedLanguage)}`;
    const blob = new Blob([processedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Open code in a new tab
  const handleOpenInNewTab = () => {
    // Create appropriate HTML for different languages
    const getFormattedHTML = (code: string, language: string): string => {
      if (language === 'html' || language === 'markup') {
        // For HTML, we can just display the code directly
        return code;
      } else {
        // For other languages, create a pre-formatted HTML page with syntax highlighting
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Snippet - ${getLanguageDisplayName(language)}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.25.0/themes/prism-tomorrow.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.25.0/plugins/line-numbers/prism-line-numbers.min.css">
  <style>
    body { 
      background-color: #282c34; 
      margin: 0; 
      padding: 20px; 
      font-family: system-ui, -apple-system, sans-serif;
    }
    pre { margin: 0; border-radius: 8px; }
    .code-container { 
      max-width: 900px; 
      margin: 0 auto; 
      border-radius: 8px; 
      overflow: hidden;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
    }
    .code-header {
      background: #1e222a;
      color: #abb2bf;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #3e4451;
    }
    .copy-button {
      background: rgba(255,255,255,0.1);
      border: none;
      color: #abb2bf;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }
    .copy-button:hover {
      background: rgba(255,255,255,0.2);
    }
    .line-numbers .line-numbers-rows {
      padding: 1em 0;
    }
  </style>
</head>
<body>
  <div class="code-container">
    <div class="code-header">
      <span>${getLanguageDisplayName(language)}</span>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span>${codeLines} line${codeLines !== 1 ? 's' : ''}</span>
        <button class="copy-button" id="copyBtn">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy code
        </button>
      </div>
    </div>
    <pre class="line-numbers"><code class="language-${language}">${escapeHTML(code)}</code></pre>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.25.0/components/prism-core.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.25.0/plugins/autoloader/prism-autoloader.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.25.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
  <script>
    document.getElementById('copyBtn').addEventListener('click', function() {
      const codeText = \`${escapeHTML(code)}\`;
      navigator.clipboard.writeText(codeText).then(function() {
        const btn = document.getElementById('copyBtn');
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
        btn.style.background = 'rgba(39, 203, 124, 0.2)';
        btn.style.color = '#4ade80';
        setTimeout(function() {
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy code';
          btn.style.background = 'rgba(255,255,255,0.1)';
          btn.style.color = '#abb2bf';
        }, 2000);
      });
    });
  </script>
</body>
</html>
        `;
      }
    };

    // Escape HTML special characters
    const escapeHTML = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Create the HTML content
    const htmlContent = getFormattedHTML(processedCode, normalizedLanguage);
    
    // Create a blob and open it in a new tab
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Clean up the URL object after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Custom renderer for HTML content to prevent malformed displays
  const renderCustomCode = () => {
    return (
      <div className="overflow-auto">
        <pre className="font-mono text-sm p-4 whitespace-pre text-white">
          {processedCode.split('\n').map((line, i) => (
            <div key={i} className="relative flex">
              {showLineNumbers && (
                <span className="inline-block text-gray-500 mr-4 text-right w-8 select-none flex-shrink-0">
                  {i + 1}
                </span>
              )}
              <span className="inline">{line}</span>
            </div>
          ))}
        </pre>
      </div>
    );
  };

  // Determine if we should use custom renderer
  const shouldUseCustomRenderer = (): boolean => {
    // Use custom renderer for HTML/XML content or if the code is very long
    return (
      normalizedLanguage === 'markup' || 
      normalizedLanguage === 'html' || 
      normalizedLanguage === 'xml' ||
      code.length > 5000 ||
      // Check for specific patterns that might cause rendering issues
      code.includes('<!DOCTYPE') ||
      code.includes('<html') ||
      code.includes('###') ||
      code.includes('```')
    );
  };

  // Render code with syntax highlighting
  const renderHighlightedCode = () => {
    return (
      <SyntaxHighlighter
        language={normalizedLanguage}
        style={oneDark}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.875rem',
          backgroundColor: 'transparent',
          borderRadius: 0,
          overflow: 'auto',
        }}
        lineNumberStyle={{
          color: '#666',
          fontSize: '0.75rem',
          minWidth: '2.5em',
        }}
        wrapLines={true}
        PreTag="div"
        CodeTag="code"
        codeTagProps={{
          className: `language-${normalizedLanguage}`,
        }}
      >
        {processedCode}
      </SyntaxHighlighter>
    );
  };

  // Floating copy button that appears when hovering over code
  const renderFloatingCopyButton = () => {
    return (
      <div 
        className="absolute right-3 top-[52px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        title={copyTooltip}
      >
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-md bg-zinc-800/90 text-zinc-100 hover:bg-zinc-700/90 shadow-md",
            copied && "bg-green-700/90 hover:bg-green-600/90"
          )}
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
        </Button>
      </div>
    );
  };

  // Double-click to copy functionality
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only apply if clicking inside the code area
    if (codeRef.current && codeRef.current.contains(e.target as Node)) {
      handleCopy();
    }
  };

  return (
    <div 
      className="relative my-4 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shadow-lg transition-shadow hover:shadow-xl group"
      ref={codeRef}
      onDoubleClick={handleDoubleClick}
    >
      {/* Floating copy button */}
      {renderFloatingCopyButton()}
      
      {/* Language badge and actions */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-300 font-mono font-medium">
            {getLanguageDisplayName(normalizedLanguage)}
          </span>
          <span className="text-xs text-zinc-500 ml-2 hidden sm:inline-block">
            {codeLines} line{codeLines !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-md transition-colors"
            onClick={handleOpenInNewTab}
            title="Open in new tab"
          >
            <ArrowUpRightSquare className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-md transition-colors"
            onClick={handleDownload}
            title="Download code"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className={cn(
              "h-8 w-8 hover:bg-zinc-800/60 rounded-md transition-all duration-200",
              copied 
                ? "text-green-500 hover:text-green-400" 
                : "text-zinc-400 hover:text-zinc-100"
            )}
            onClick={handleCopy}
            title={copyTooltip}
          >
            {copied ? (
              <CopyCheckIcon className="h-4 w-4" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Code content */}
      <div className="prism-code-container max-w-full overflow-auto code-highlight-content">
        {shouldUseCustomRenderer() ? renderCustomCode() : renderHighlightedCode()}
      </div>

      {/* Double-click to copy hint */}
      <div className="absolute bottom-2 right-3 text-xs text-zinc-500 code-double-click-hint">
        Double-click to copy
      </div>
    </div>
  );
}; 
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import html from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/hljs/csharp';

// Register popular languages
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('html', html);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('csharp', csharp);

// Interface for code blocks
export interface CodeBlock {
  code: string;
  language?: string;
  isCodeBlock: boolean;
}

// Regular expression to detect code blocks
const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

/**
 * Detects if message content contains code blocks and parses them
 * @param content Message content to parse
 * @returns Array of text and code blocks
 */
export const parseMessageContent = (content: string): CodeBlock[] => {
  const blocks: CodeBlock[] = [];
  let lastIndex = 0;
  let match;

  // Reset the regex
  codeBlockRegex.lastIndex = 0;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add any text before this code block
    if (match.index > lastIndex) {
      blocks.push({
        code: content.substring(lastIndex, match.index),
        isCodeBlock: false
      });
    }
    
    // Extract language and code
    const language = match[1] ? match[1].toLowerCase() : 'plaintext';
    const code = match[2];
    
    // Add the code block
    blocks.push({
      code,
      language,
      isCodeBlock: true
    });
    
    // Update last index
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text after the last code block
  if (lastIndex < content.length) {
    blocks.push({
      code: content.substring(lastIndex),
      isCodeBlock: false
    });
  }
  
  // If no code blocks were found, return the entire content as a text block
  if (blocks.length === 0) {
    blocks.push({
      code: content,
      isCodeBlock: false
    });
  }
  
  return blocks;
};

/**
 * Checks if the message is from the code mode
 * @param content Message content to check
 * @returns True if the content appears to be code (contains code blocks or code-like syntax)
 */
export const isCodeContent = (content: string): boolean => {
  // If it has code blocks, it's code content
  if (content.includes('```')) {
    return true;
  }
  
  // More heuristics to detect if the content is likely code:
  // Check for common code patterns
  const codePatterns = [
    /^import\s+.+\s+from\s+['"](.+)['"];?$/m, // ES6 imports
    /^const|let|var\s+\w+\s*=.*/m, // Variable declarations
    /^function\s+\w+\s*\(.*/m, // Function declarations
    /^class\s+\w+(\s+extends\s+\w+)?\s*\{.*/m, // Class declarations
    /^\s*if\s*\(.+\)\s*\{.*/m, // If statements
    /^\s*for\s*\(.+\)\s*\{.*/m, // For loops
    /^\s*while\s*\(.+\)\s*\{.*/m, // While loops
    /^\s*<\w+.*>.+<\/\w+>$/m, // HTML/XML tags
    /\bdef\s+\w+\s*\(.*/m, // Python function declarations
    /\bpackage\s+.+;$/m, // Java/Kotlin package declarations
    /\bpublic\s+(static\s+)?(void|class|interface)\b/m, // Java declarations
    /\bfunc\s+\w+\s*\(.*/m, // Go functions
    /\[\s*[\w\s,]+\s*\]\s*=.*/m, // Array assignments
    /^\s*#include\s+<.+>$/m // C/C++ includes
  ];
  
  return codePatterns.some(pattern => pattern.test(content));
};

// Export the syntax highlighter component and style
export { SyntaxHighlighter, atomOneDark }; 
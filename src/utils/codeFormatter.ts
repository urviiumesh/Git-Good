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
import rust from 'react-syntax-highlighter/dist/esm/languages/hljs/rust';
import go from 'react-syntax-highlighter/dist/esm/languages/hljs/go';
import php from 'react-syntax-highlighter/dist/esm/languages/hljs/php';
import ruby from 'react-syntax-highlighter/dist/esm/languages/hljs/ruby';
import swift from 'react-syntax-highlighter/dist/esm/languages/hljs/swift';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/hljs/kotlin';
import scala from 'react-syntax-highlighter/dist/esm/languages/hljs/scala';
import objectivec from 'react-syntax-highlighter/dist/esm/languages/hljs/objectivec';
import dockerfile from 'react-syntax-highlighter/dist/esm/languages/hljs/dockerfile';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import dart from 'react-syntax-highlighter/dist/esm/languages/hljs/dart';
import shell from 'react-syntax-highlighter/dist/esm/languages/hljs/shell';
import powershell from 'react-syntax-highlighter/dist/esm/languages/hljs/powershell';
import r from 'react-syntax-highlighter/dist/esm/languages/hljs/r';
import haskell from 'react-syntax-highlighter/dist/esm/languages/hljs/haskell';
import perl from 'react-syntax-highlighter/dist/esm/languages/hljs/perl';
import clojure from 'react-syntax-highlighter/dist/esm/languages/hljs/clojure';
import plaintext from 'react-syntax-highlighter/dist/esm/languages/hljs/plaintext';

// Register highlight.js languages
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
SyntaxHighlighter.registerLanguage('rust', rust);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('php', php);
SyntaxHighlighter.registerLanguage('ruby', ruby);
SyntaxHighlighter.registerLanguage('swift', swift);
SyntaxHighlighter.registerLanguage('kotlin', kotlin);
SyntaxHighlighter.registerLanguage('scala', scala);
SyntaxHighlighter.registerLanguage('objectivec', objectivec);
SyntaxHighlighter.registerLanguage('dockerfile', dockerfile);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('dart', dart);
SyntaxHighlighter.registerLanguage('shell', shell);
SyntaxHighlighter.registerLanguage('powershell', powershell);
SyntaxHighlighter.registerLanguage('r', r);
SyntaxHighlighter.registerLanguage('haskell', haskell);
SyntaxHighlighter.registerLanguage('perl', perl);
SyntaxHighlighter.registerLanguage('clojure', clojure);
SyntaxHighlighter.registerLanguage('plaintext', plaintext);

// Language aliases for common formatting
const languageAliases: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'sh': 'bash',
  'zsh': 'bash',
  'c': 'cpp',
  'c++': 'cpp',
  'cs': 'csharp',
  'jsx': 'jsx',
  'tsx': 'tsx',
  'yml': 'yaml',
  'md': 'markdown',
  'rs': 'rust',
  'kt': 'kotlin',
  'sc': 'scala',
  'pl': 'perl',
  'hs': 'haskell',
  'fs': 'fsharp',
  'vb': 'vbnet',
  'ps': 'powershell',
  'ps1': 'powershell',
  'bat': 'batch',
  'cmd': 'batch',
  'dockerfile': 'docker',
  'objc': 'objectivec',
  'xml': 'markup',
  'html': 'markup',
  'text': 'plaintext',
  'txt': 'plaintext',
  '': 'plaintext',
  'react': 'jsx',
  'reactjs': 'jsx',
  'react-native': 'jsx',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  'stylus': 'stylus',
  'postcss': 'css',
};

// Interface for code blocks
export interface CodeBlock {
  code: string;
  language?: string;
  isCodeBlock: boolean;
}

// Regular expression to detect code blocks - enhanced to handle language with optional parameters
// and to better capture HTML blocks that might have special characters
// This regex matches both standard ```language and ```language (filename.ext) formats
const codeBlockRegex = /```([\w\-+\.]*)?(?:\s+(?:\([^)]+\)|\[[^\]]+\]|[^`\n]+))?\n([\s\S]*?)```/g;

/**
 * Normalizes the language identifier to match supported Prism languages
 * @param language The language identifier from the code block
 * @returns Normalized language identifier
 */
export const normalizeLanguage = (language?: string): string => {
  if (!language) return 'plaintext';
  
  const normalizedLang = language.toLowerCase().trim();
  
  // Special case for HTML detection - use 'markup' for Prism
  if (normalizedLang === 'html' || normalizedLang === 'xml') {
    return 'markup';
  }
  
  return languageAliases[normalizedLang] || normalizedLang;
};

/**
 * Detects the language of code content based on patterns
 * @param code The code content to analyze
 * @returns The detected language or undefined if not detected
 */
export const detectCodeLanguage = (code: string): string | undefined => {
  // Prevent detection on empty or very short strings
  if (!code || code.trim().length < 3) {
    return 'plaintext';
  }
  
  // Check for React/JSX pattern first as it's most specific
  if (/<\w+\s+.*\{.*\}.*>|<\w+Component|import\s+React|from\s+['"]react['"]|extends\s+React\.Component|React\.useState|useState\(|useEffect\(|<>\s*<\/>/i.test(code)) {
    // Check if it has TypeScript features to determine if it's TSX or JSX
    if (/:\s*\w+Type|<\w+>\s*=|interface\s+\w+|type\s+\w+\s+=|<.*?:\s*.*?>|React\.\s*FC\s*<.*?>/i.test(code)) {
      return 'tsx';
    }
    return 'jsx';
  }
  
  // Check for HTML pattern with better regex that handles attributes
  if (/<[a-z][\s\S]*?(class|style|href|src|id)=["'][\s\S]*?>|<!DOCTYPE html>|<html|<head|<body/i.test(code)) {
    return 'html';
  }
  
  // Check for CSS with improved patterns
  if (
    /(@media|@keyframes|@import|@font-face|@supports|@layer)/i.test(code) ||
    /(body|html|div|span|p|\.[\w-]+|#[\w-]+)\s*\{[^}]*\}/i.test(code) ||
    /(margin|padding|font-size|color|display|flex|grid|gap):\s*[^;]+;/i.test(code) ||
    /(animation|transition|transform|box-shadow):/i.test(code) ||
    /\s+\{[\s\n]*[\w-]+:\s*[^;]+;/i.test(code)
  ) {
    // Check for SCSS or SASS specific features
    if (/@include\s+\w+|@extend\s+\.|@mixin\s+\w+|\$\w+:\s*[^;]+;/i.test(code)) {
      return 'scss';
    }
    
    // Check for Less specific features
    if (/@\w+:\s*[^;]+;|\.[\w-]+\(.*\)|@import\s+\(.*\)/i.test(code)) {
      return 'less';
    }
    
    return 'css';
  }
  
  // Check for JSON
  if (/^\s*\{\s*"[^"]+"\s*:/.test(code) || /^\s*\[\s*\{\s*"[^"]+"\s*:/.test(code)) {
    return 'json';
  }
  
  // Check for SQL
  if (/(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s+(INTO|FROM|TABLE|DATABASE|VIEW)/i.test(code)) {
    return 'sql';
  }
  
  // Check for YAML
  if (/^---\n|\w+:\s*\n\s+-\s+/.test(code)) {
    return 'yaml';
  }
  
  // Check for Docker
  if (/^FROM\s+\w+/.test(code) || /^(RUN|CMD|ENTRYPOINT|COPY|ADD|ENV)\s+/.test(code)) {
    return 'dockerfile';
  }
  
  // Other language detection rules
  if (/def\s+\w+\s*\(.*\):\s*(\n|$)/.test(code) || /import\s+\w+\s*(as\s+\w+)?(\n|$)/.test(code)) {
    return 'python';
  } else if (/public\s+(static\s+)?(class|void|interface)\s+\w+/.test(code) || /import\s+java\.\w+/.test(code)) {
    return 'java';
  } else if (/func\s+\w+\s*\(.*\)\s*(->\s*\w+)?\s*\{/.test(code) || /^import\s+.*Swift.*/.test(code)) {
    return 'swift';
  } else if (/using\s+namespace\s+\w+;/.test(code) || /#include\s+[<"][\w\.]+[>"]/i.test(code)) {
    return 'cpp';
  } else if (/package\s+main\s*(\n|$)/.test(code) || /func\s+\w+\s*\(.*\)\s*\{/.test(code)) {
    return 'go';
  } else if (/fn\s+\w+\s*\(.*\)\s*->\s*\w+/.test(code) || /use\s+std::\w+/.test(code)) {
    return 'rust';
  } else if (/<?php/.test(code) || /namespace\s+\w+\\/.test(code)) {
    return 'php';
  } else if (/\brequire\s+["']\w+["']/.test(code) || /^module\.exports\s+=/.test(code)) {
    return 'javascript';
  } else if (/^const|let|var|async|function|import\s+\{/.test(code)) {
    return 'javascript';
  } else if (/^interface\s+\w+|type\s+\w+\s+=|export\s+type/.test(code) || /:\s*(string|number|boolean|any)\b/.test(code)) {
    return 'typescript';
  } else if (/#!/.test(code) && /apt-get|yum|dnf|pacman/.test(code)) {
    return 'bash';
  }
  
  return 'plaintext';
};

/**
 * Clean up repeated markdown code markers
 * @param content Content to clean
 * @returns Cleaned content
 */
const cleanRepeatedCodeMarkers = (content: string): string => {
  // Handle malformed code blocks with repeated backticks or markers
  return content
    .replace(/`{3,}/g, '```') // Replace more than 3 backticks with exactly 3
    .replace(/#{3,}/g, '###') // Replace more than 3 hashtags with exactly 3
    .replace(/```\s*```/g, '```\n```') // Add newline between empty code blocks
    .replace(/```(\w+)\s*```/g, '```$1\n```'); // Add newline for language-only code blocks
};

/**
 * Detects if message content contains code blocks and parses them
 * @param content Message content to parse
 * @returns Array of text and code blocks
 */
export const parseMessageContent = (content: string): CodeBlock[] => {
  const blocks: CodeBlock[] = [];
  let lastIndex = 0;
  let match;

  // Skip processing if content is empty
  if (!content || content.trim() === '') {
    return [{ code: content || '', isCodeBlock: false }];
  }

  // Normalize line endings and clean up repeated markers
  const normalizedContent = cleanRepeatedCodeMarkers(content.replace(/\r\n/g, '\n'));
  
  // Reset the regex
  codeBlockRegex.lastIndex = 0;
  
  // Handle repeated code requirements section
  if (normalizedContent.includes('### Requirement') || 
      normalizedContent.includes('### Solution') ||
      normalizedContent.includes('#####')) {
    // Split by headers and process each section
    const sections = normalizedContent.split(/(?=#{2,5}\s)/);
    
    for (const section of sections) {
      if (section.trim() === '') continue;
      
      const titleMatch = section.match(/^(#{2,5}\s.*?)\n/);
      const title = titleMatch ? titleMatch[1] : '';
      const sectionContent = titleMatch ? section.substring(titleMatch[0].length) : section;
      
      // Check if section contains a code block
      if (sectionContent.includes('```')) {
        // Try to extract any code block
        const codeMatch = sectionContent.match(/```(\w*)\n([\s\S]*?)```/);
        if (codeMatch) {
          // Add the title as text
          if (title) {
            blocks.push({
              code: title,
              isCodeBlock: false
            });
          }
          
          // Add content before code block
          const beforeCode = sectionContent.substring(0, sectionContent.indexOf('```')).trim();
          if (beforeCode) {
            blocks.push({
              code: beforeCode,
              isCodeBlock: false
            });
          }
          
          // Add the code block
          blocks.push({
            code: codeMatch[2],
            language: codeMatch[1] || detectCodeLanguage(codeMatch[2]) || 'plaintext',
            isCodeBlock: true
          });
          
          // Add content after code block
          const afterCodeIndex = sectionContent.indexOf('```', sectionContent.indexOf('```') + 3) + 3;
          const afterCode = sectionContent.substring(afterCodeIndex).trim();
          if (afterCode) {
            blocks.push({
              code: afterCode,
              isCodeBlock: false
            });
          }
        } else {
          // If no code block found, add as regular text
          blocks.push({
            code: section,
            isCodeBlock: false
          });
        }
      } else {
        // No code block, add as regular text
        blocks.push({
          code: section,
          isCodeBlock: false
        });
      }
    }
    
    // If we've processed the content by sections, return the blocks
    if (blocks.length > 0) {
      return blocks;
    }
  }
  
  // Standard code block parsing with regex
  while ((match = codeBlockRegex.exec(normalizedContent)) !== null) {
    // Add any text before this code block
    if (match.index > lastIndex) {
      blocks.push({
        code: normalizedContent.substring(lastIndex, match.index),
        isCodeBlock: false
      });
    }
    
    // Extract language and code
    const rawLanguage = match[1] ? match[1].toLowerCase() : '';
    const code = match[2];
    
    // If no language specified, try to detect it from content
    let finalLanguage = 'plaintext';
    if (rawLanguage) {
      finalLanguage = normalizeLanguage(rawLanguage);
    } else {
      // Auto-detect language based on code content
      const detectedLang = detectCodeLanguage(code);
      if (detectedLang) {
        finalLanguage = detectedLang;
      }
    }
    
    // Add the code block - preserve line breaks
    blocks.push({
      code,
      language: finalLanguage,
      isCodeBlock: true
    });
    
    // Update last index
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text after the last code block
  if (lastIndex < normalizedContent.length) {
    blocks.push({
      code: normalizedContent.substring(lastIndex),
      isCodeBlock: false
    });
  }
  
  // If no code blocks were found, return the entire content as a text block
  if (blocks.length === 0) {
    blocks.push({
      code: normalizedContent,
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
  // If empty or too short, it's not code
  if (!content || content.trim().length < 5) {
    return false;
  }
  
  // If it has code blocks, it's code content
  if (content.includes('```')) {
    return true;
  }
  
  // Check for specific HTML document patterns
  if (content.includes('<!DOCTYPE') || 
      content.includes('<html') || 
      content.includes('</html>') ||
      content.includes('<head') ||
      content.includes('<body')) {
    return true;
  }
  
  // Check for HTML patterns first (more specific to avoid false positives)
  // Common HTML patterns
  const htmlPatterns = [
    /<\/?[a-z][\s\S]*?(class|href|src|id|style|data-\w+)=["'][\s\S]*?>/i,
    /<\/?(?:div|span|nav|a|button|ul|li|html|body|head|header|footer|p|h[1-6]|img|form|input)(?:\s[^>]*)?>/i,
    /<!DOCTYPE html>|<html/i,
    /<meta\s+charset=/i,
    /<link\s+rel=/i,
  ];

  // Test for HTML patterns
  for (const pattern of htmlPatterns) {
    if (pattern.test(content)) {
      return true;
    }
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
    /^\s*#include\s+<.+>$/m, // C/C++ includes
    /\bfn\s+\w+\s*\(.*/m, // Rust functions
    /\busing\s+namespace\s+.+;$/m, // C++ namespace
    /\bimport\s+.+;$/m, // Java imports
    /\bfrom\s+.+\s+import\s+.+$/m, // Python imports
    /\brequire\s*\(.+\)$/m, // Node.js requires
    /\bdata\s+class\b/m, // Kotlin data class
    /\bgo\s+func\b/m, // Go goroutines
    /\bstruct\s+\w+\s*\{/m, // C/Rust structs
    /^\s*<\!DOCTYPE html>/im, // HTML doctype
    /^[\s\n]*<html/im, // HTML root element
    /^[\s\n]*<nav/im, // HTML navigation
    /^[\s\n]*<div/im, // HTML div element
  ];
  
  return codePatterns.some(pattern => pattern.test(content));
};

/**
 * Process inline code blocks in text (surrounded by backticks)
 * @param text The text to process for inline code
 * @returns HTML with inline code blocks wrapped in spans
 */
export const processInlineCode = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  // Regex to match inline code but avoid matching triple backticks (code blocks)
  const inlineCodeRegex = /(?<!`)`([^`]+)`(?!`)/g;
  
  // Process text for markdown-style links - convert to HTML links
  let processed = text
    // Process links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-link">$1</a>')
    // Process bold: **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Process italic: *text*
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Replace inline code with styled spans
  return processed.replace(inlineCodeRegex, '<code class="inline-code">$1</code>');
};

// We no longer need to export the SyntaxHighlighter component
// as we're using Prism directly in the CodeBlock component 
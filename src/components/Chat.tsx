
import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Send, FileText, ArrowRight } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

type SearchResult = {
  id: string;
  title: string;
  excerpt: string;
  confidence: number;
  tags: string[];
};

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    title: 'Employee Handbook 2023',
    excerpt: 'The annual leave policy allows for 25 days per year, with an additional day for every year of service up to a maximum of 30 days.',
    confidence: 0.92,
    tags: ['HR', 'Policy'],
  },
  {
    id: '2',
    title: 'Security Protocol Document',
    excerpt: 'Two-factor authentication is required for all users accessing sensitive data systems. Mobile authenticators are preferred over SMS methods.',
    confidence: 0.88,
    tags: ['Security', 'Protocol'],
  },
  {
    id: '3',
    title: 'Q4 Financial Report',
    excerpt: 'Revenue increased by 12% compared to the previous quarter, primarily driven by the new product line launched in September.',
    confidence: 0.76,
    tags: ['Finance', 'Quarterly'],
  },
];

const recentSearches = [
  'annual leave policy',
  'authentication methods',
  'revenue growth Q4',
  'employee benefits',
];

export const Chat: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm EdgeGPT. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `I've processed your query about "${input}". Here's what I found: The information you're looking for relates to our system architecture, which includes secure API endpoints, data encryption at rest and in transit, and role-based access controls.`,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsProcessing(false);
    }, 1500);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Simulate search delay
    setIsProcessing(true);
    setTimeout(() => {
      setSearchResults(mockSearchResults);
      setIsProcessing(false);
      setShowRecentSearches(false);
    }, 1000);
  };

  const handleSearchInputFocus = () => {
    setShowRecentSearches(true);
  };

  const handleSearchInputBlur = () => {
    // Delay hiding to allow clicking on suggestions
    setTimeout(() => setShowRecentSearches(false), 200);
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    setShowRecentSearches(false);
    // Automatically search
    setIsProcessing(true);
    setTimeout(() => {
      setSearchResults(mockSearchResults);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="chat">Chat & Assistant</TabsTrigger>
          <TabsTrigger value="documents">Document Search</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="h-full flex flex-col space-y-4">
          <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
            <div className="chat-container">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.isUser ? 'user-message' : 'bot-message'}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {msg.isUser ? 'You' : 'EdgeGPT'}
                    </span>
                    <p className="mt-1">{msg.content}</p>
                    <span className="text-xs text-muted-foreground mt-2">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="chat-message bot-message">
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status="loading" showLabel={false} />
                    <span className="text-sm">EdgeGPT is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!input.trim() || isProcessing}>
              <Send size={18} />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="h-full space-y-4">
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={handleSearchInputFocus}
                  onBlur={handleSearchInputBlur}
                  className="pr-10"
                />
                {showRecentSearches && recentSearches.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1">
                    <CardContent className="p-2">
                      <p className="text-xs text-muted-foreground mb-2">Recent searches</p>
                      <ul className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <li
                            key={index}
                            onClick={() => handleRecentSearchClick(search)}
                            className="text-sm p-1.5 hover:bg-muted rounded cursor-pointer flex items-center"
                          >
                            <Search size={14} className="mr-2 text-muted-foreground" />
                            {search}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
              <Button onClick={handleSearch} disabled={!searchQuery.trim() || isProcessing}>
                <Search size={18} />
              </Button>
            </div>
          </div>

          {isProcessing ? (
            <div className="flex items-center justify-center h-64">
              <StatusIndicator status="loading" label="Searching documents..." />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Search Results</h3>
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <Card key={result.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium flex items-center">
                          <FileText size={16} className="mr-2 text-muted-foreground" />
                          {result.title}
                        </h4>
                        <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span 
                            className={result.confidence > 0.8 ? 'text-green-500' : 'text-yellow-500'}
                          >
                            {Math.round(result.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <p className="mt-2 text-muted-foreground">{result.excerpt}</p>
                      
                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex gap-1 flex-wrap">
                          {result.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="bg-primary/10 text-primary text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs gap-1">
                          View document
                          <ArrowRight size={12} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground">No documents found matching "{searchQuery}"</p>
              <p className="text-sm mt-2">Try using different keywords or check your filters</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Search size={48} className="text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-medium mb-2">Search Documents</h3>
              <p className="text-muted-foreground max-w-md">
                Search through your documents, policies, and knowledge base using natural language queries
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Chat;

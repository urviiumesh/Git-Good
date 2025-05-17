
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusIndicator } from './StatusIndicator';

const mockGeneratedCode = `
// User authentication middleware
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token, access denied' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};
`;

export const CodeGeneration: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('prompt');
  
  const languages = [
    { label: "JavaScript", value: "javascript" },
    { label: "TypeScript", value: "typescript" },
    { label: "Python", value: "python" },
    { label: "Java", value: "java" },
    { label: "C#", value: "csharp" },
    { label: "PHP", value: "php" },
    { label: "Go", value: "go" },
    { label: "Ruby", value: "ruby" },
    { label: "Rust", value: "rust" },
    { label: "SQL", value: "sql" }
  ];

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setActiveTab('results');
    
    // Simulate code generation delay
    setTimeout(() => {
      setGeneratedCode(mockGeneratedCode);
      setIsGenerating(false);
    }, 2000);
  };

  // Predefined templates
  const templates = [
    {
      title: "Authentication Middleware",
      description: "Create a secure authentication middleware",
      prompt: "Create a middleware function for user authentication that verifies JWT tokens and handles errors appropriately.",
    },
    {
      title: "API Error Handler",
      description: "Generate a comprehensive error handling module",
      prompt: "Generate a reusable error handling module that can be used across an Express.js API, with proper logging and response formatting.",
    },
    {
      title: "Data Validation",
      description: "Create input validation schemas",
      prompt: "Create validation schemas for user registration and profile update using Joi or Zod.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Code Generation</h1>
        <p className="text-muted-foreground">
          Generate secure, optimized code based on your requirements.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="md:col-span-3 space-y-6">
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Code Generator</CardTitle>
                  <TabsList>
                    <TabsTrigger value="prompt">Prompt</TabsTrigger>
                    <TabsTrigger value="results">Results</TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>
                  Describe what you want to build and EdgeGPT will generate the code for you
                </CardDescription>
              </CardHeader>
              
              <TabsContent value="prompt">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Language</label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prompt</label>
                    <Textarea 
                      placeholder="Describe what you want to build in detail..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={8}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Be specific about functionality, edge cases, error handling, and security requirements.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full md:w-auto"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Code'}
                  </Button>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="results">
                <CardContent className="pt-6">
                  {isGenerating ? (
                    <div className="flex items-center justify-center py-16">
                      <StatusIndicator status="loading" label="Generating secure code..." />
                    </div>
                  ) : generatedCode ? (
                    <div className="space-y-4">
                      <div className="code-block">
                        <div className="code-header">
                          <span>Generated Code</span>
                          <Button variant="ghost" size="sm">Copy</Button>
                        </div>
                        <pre className="hljs p-4 rounded-b-md bg-secondary/50 overflow-x-auto text-sm">
                          <code>{generatedCode}</code>
                        </pre>
                      </div>
                      
                      <div className="bg-muted/30 p-4 rounded-md">
                        <h4 className="font-medium mb-2">Code Explanation</h4>
                        <p className="text-sm text-muted-foreground">
                          This code implements a secure authentication middleware that verifies JWT tokens from request headers. 
                          It performs several security checks including token existence, validity, and user validation from the database. 
                          All errors are properly handled with appropriate HTTP status codes and consistent response formats.
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">Download Code</Button>
                        <Button variant="outline" size="sm">Regenerate</Button>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('prompt')}>
                          Edit Prompt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center py-16 text-muted-foreground">
                      No code generated yet. Go to the Prompt tab to get started.
                    </p>
                  )}
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar with templates */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Quick start with predefined templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template, index) => (
                  <div 
                    key={index}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setPrompt(template.prompt);
                      setActiveTab('prompt');
                    }}
                  >
                    <h4 className="font-medium text-sm">{template.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security Scanner</CardTitle>
              <CardDescription>Automatic security checks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">SQL Injection</span>
                  <StatusIndicator status="online" label="Protected" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">XSS Vulnerabilities</span>
                  <StatusIndicator status="online" label="Protected" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Access Control</span>
                  <StatusIndicator status="online" label="Protected" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Data Validation</span>
                  <StatusIndicator status="online" label="Protected" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CodeGeneration;

// MCP (Model Control Protocol) related utilities

/**
 * Check if a text is an MCP resource URI
 * @param text Text to check
 * @returns Whether the text is an MCP resource URI
 */
export const isMcpResourceUri = (text: string): boolean => {
  // Example: Check if text matches MCP resource URI pattern
  // For example: mcp://resource/12345
  return text.trim().startsWith('mcp://');
};

/**
 * Parse an MCP tool call
 * @param text Text to parse
 * @returns Parsed tool call or null if not a tool call
 */
export const parseMcpToolCall = (text: string): { toolName: string, args: Record<string, any> } | null => {
  // Example: Check if text is a tool call
  // Format: !tool_name(arg1=val1, arg2=val2)
  const match = text.trim().match(/^!(\w+)\((.*)\)$/);
  
  if (!match) {
    return null;
  }
  
  const toolName = match[1];
  const argsString = match[2];
  
  // Parse args string to object
  const args: Record<string, any> = {};
  
  argsString.split(',').forEach(argPair => {
    const [key, value] = argPair.split('=').map(s => s.trim());
    
    if (key && value) {
      // Try to parse as number or boolean
      if (value === 'true') args[key] = true;
      else if (value === 'false') args[key] = false;
      else if (!isNaN(Number(value))) args[key] = Number(value);
      else args[key] = value.replace(/^["'](.*)["']$/, '$1'); // Remove quotes
    }
  });
  
  return { toolName, args };
};

/**
 * Call an MCP tool with streaming response
 * @param toolName The name of the tool to call
 * @param toolArgs The arguments for the tool
 * @param onToken Callback for token streaming
 * @returns Promise resolving when streaming is complete
 */
export const callMcpToolWithStreaming = async (
  toolName: string,
  toolArgs: Record<string, any>,
  onToken: (token: string, isDone: boolean) => void
): Promise<void> => {
  try {
    console.log(`Calling MCP tool: ${toolName} with args:`, toolArgs);
    
    // In a real implementation, this would call the MCP server
    // For now, we'll just simulate a response
    
    // Simulate streaming
    const responseText = `Result from ${toolName}: Operation completed successfully.`;
    
    for (let i = 0; i < responseText.length; i++) {
      const char = responseText[i];
      onToken(char, false);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Signal completion
    onToken('', true);
  } catch (error) {
    console.error(`Error calling MCP tool ${toolName}:`, error);
    onToken(`Error: ${error.message}`, true);
  }
};

/**
 * Handle streaming content from an MCP resource
 * @param resourceUri The MCP resource URI
 * @param botResponseId The bot response ID to update
 * @param conversationId The conversation ID
 * @returns Promise resolving when streaming is complete
 */
export const handleMcpContentStreaming = async (
  resourceUri: string,
  botResponseId: string,
  conversationId: string
): Promise<void> => {
  try {
    console.log(`Streaming content from MCP resource: ${resourceUri}`);
    
    // In a real implementation, this would fetch the content from the MCP server
    // For now, we'll just simulate a response
    
    // Example implementation would fetch the resource and update the message
    const content = `Content from MCP resource: ${resourceUri}\n\nThis is a placeholder for actual content that would be streamed from the MCP server.`;
    
    // In a real implementation, you would update the message with the streamed content
    console.log(`Would update message ${botResponseId} with content from ${resourceUri}`);
    
    return;
  } catch (error) {
    console.error(`Error streaming MCP content from ${resourceUri}:`, error);
    throw error;
  }
}; 
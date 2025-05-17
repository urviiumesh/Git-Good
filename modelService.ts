// Remove toast import as it's causing a module resolution error// Types
export type ModelType = 'text' | 'code';
export type ModelResponse = string;
export type StreamingCallback = (token: string, isDone: boolean) => void;

// API base URL - assumes FastAPI server is running locally on port 8000
const API_BASE_URL = 'http://localhost:8000';

// Default configuration
const DEFAULT_WORD_COUNT = 300; // Increased from 50 for more detailed responses
const TIMEOUT_MS = 30000; // 30 second timeout

/**
 * Generate a response from the local model with streaming support
 * @param prompt The user prompt to send to the model
 * @param onStream Callback that receives each token as it arrives
 * @param wordCount The maximum word count for the response
 * @returns A promise that resolves when the stream is complete
 */
export const generateStreamingResponse = async (
  prompt: string,
  onStream: StreamingCallback,
  wordCount: number = DEFAULT_WORD_COUNT
): Promise<void> => {
  // AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log("Request timed out");
    controller.abort();
  }, TIMEOUT_MS);

  try {
    console.log(`Sending streaming request to ${API_BASE_URL}/generate with prompt: ${prompt.substring(0, 30)}...`);
    
    // Test if server is responsive first
    try {
      const testResponse = await fetch(`${API_BASE_URL}/test`);
      if (!testResponse.ok) {
        throw new Error("Test endpoint failed");
      }
      console.log("Test endpoint is working");
    } catch (error) {
      console.error("Test endpoint failed:", error);
      throw new Error("Server is not responding");
    }
    
    console.log("Sending request for streaming response");
    
    // Use the fetch API to get a streaming response
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      },
      body: JSON.stringify({
        prompt,
        word_count: wordCount,
      }),
      signal: controller.signal,
    });
    
    // Clear the timeout since we got a response
    clearTimeout(timeoutId);

    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    console.log("Response received:", response.status, response.statusText);
    
    // Set up streaming response handling
    if (!response.body) {
      throw new Error('Response body is not available');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    console.log("Starting to process the stream");
    
    let buffer = '';
    let hasReceivedFirstToken = false;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // If there's any remaining text in the buffer, send it
          if (buffer) {
            onStream(buffer, false);
          }
          
          console.log("Stream complete");
          onStream("", true);
          break;
        }
        
        // Decode this chunk and add to our buffer
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          console.log(`Received chunk (${chunk.length} bytes)`);
          
          // Process the SSE format
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6); // Remove 'data: ' prefix
              
              // Skip empty data or [DONE] marker
              if (data === '' || data === '[DONE]') {
                if (data === '[DONE]') {
                  console.log("Received [DONE] marker");
                  onStream("", true);
                }
                continue;
              }
              
              // Handle first token specially to ensure it's displayed
              if (!hasReceivedFirstToken) {
                console.log("Received first token");
                hasReceivedFirstToken = true;
              }
              
              buffer += data;
              
              // Send the chunk to client
              onStream(data, false);
            }
          }
        }
      }
    } catch (streamError) {
      console.error("Error reading stream:", streamError);
      onStream(`Error reading stream: ${streamError.message}`, true);
    }
  } catch (error) {
    // Clear timeout if there was an error
    clearTimeout(timeoutId);
    
    console.error('Error in streaming response:', error);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      console.error('Request Timeout: The model is taking too long to respond. This could be due to high demand or complexity of the question.');
      onStream('The request timed out. The model is taking too long to respond. Please try a simpler question or try again later.', true);
      return;
    }
    
    // Handle server not responding
    if (error.message === 'Server is not responding') {
      console.error('Server Error: The local model server is not responding. Please ensure it is running properly.');
      onStream('The local model server is not responding. Please make sure it is running properly.', true);
      return;
    }
    
    console.error('Error: Failed to connect to local model service. Please ensure the model server is running.');
    onStream(`Sorry, I encountered an error: ${error.message}. Please ensure the model server is running.`, true);
  }
};

/**
 * Generate a response from the local model (non-streaming version)
 * @param prompt The user prompt to send to the model
 * @param wordCount The maximum word count for the response
 * @returns A promise that resolves to the model response
 */
export const generateModelResponse = async (
  prompt: string,
  wordCount: number = DEFAULT_WORD_COUNT
): Promise<ModelResponse> => {
  // For backward compatibility
  return new Promise((resolve) => {
    let fullResponse = '';
    
    generateStreamingResponse(
      prompt,
      (token, isDone) => {
        if (!isDone) {
          fullResponse += token;
        } else {
          resolve(fullResponse || 'I apologize, but I could not generate a response at this time. Please try again with a different query.');
        }
      },
      wordCount
    ).catch(error => {
      console.error('Error in generateModelResponse:', error);
      resolve(`Sorry, I encountered an error: ${error.message}. Please ensure the model server is running.`);
    });
  });
};

/**
 * Get current model information
 * @returns A promise that resolves to the current model information
 */
export const getCurrentModel = async (): Promise<{ currentModel: ModelType }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return { 
      currentModel: data.current_model || 'text'
    };
  } catch (error) {
    console.error('Error getting current model:', error);
    return { currentModel: 'text' };
  }
};

/**
 * Switch between text and code models
 * @param modelType The type of model to switch to ('text' or 'code')
 * @returns A promise that resolves to a success message or error
 */
export const switchModel = async (modelType: ModelType): Promise<{ message: string }> => {
  try {
    console.log(`Switching to ${modelType} model`);
    
    const response = await fetch(`${API_BASE_URL}/switch-model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_type: modelType,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Model switched successfully: ${data.message}`);
    return data;
  } catch (error) {
    console.error('Error switching model:', error);
    throw error;
  }
}; 
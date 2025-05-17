import { toast } from '@/components/ui/use-toast';

// Types
export type ModelType = 'text' | 'code';
export type ModelResponse = string;
export type StreamingCallback = (token: string, isDone: boolean) => void;

// API base URL - assumes FastAPI server is running locally on port 8000
const API_BASE_URL = 'http://localhost:8000';

// Default configuration
const DEFAULT_WORD_COUNT = 50;
const TIMEOUT_MS = 60000; // 60 seconds timeout

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
  console.log(`Initiating streaming request with prompt: ${prompt.substring(0, 30)}...`);
  
  // First check if server is running
  try {
    const testResponse = await fetch(`${API_BASE_URL}/test`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!testResponse.ok) {
      throw new Error('Model server is not responding properly');
    }
  } catch (error) {
    console.error('Server connection test failed:', error);
    onStream('The model server is not available. Please ensure it is running.', true);
    return;
  }
  
  // Create request body once
  const requestBody = JSON.stringify({
    prompt: prompt,
    word_count: wordCount,
  });
  
  // Try EventSource for streaming if available
  if (typeof EventSource !== 'undefined') {
    console.log('Using EventSource for streaming');
    
    // Create a custom EventSource for POST requests
    const eventSource = new EventSourcePolyfill(`${API_BASE_URL}/generate_stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });
    
    // Set up a timeout
    const timeoutId = setTimeout(() => {
      console.log('Streaming request timed out');
      eventSource.close();
      onStream('Request timed out. The model is taking too long to respond.', true);
    }, TIMEOUT_MS);
    
    eventSource.onopen = (event) => {
      console.log('SSE connection opened', event);
    };
    
    eventSource.onmessage = (event) => {
      const data = event.data;
      console.log(`Received SSE message: ${data.substring(0, 20)}...`);
      
      // Don't process "Stream started" messages
      if (data === 'Stream started') {
        console.log('Skipping "Stream started" message');
        return;
      }
      
      if (data === '[DONE]') {
        console.log('Received [DONE] event');
        clearTimeout(timeoutId);
        eventSource.close();
        onStream('', true);
      } else {
        onStream(data, false);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      clearTimeout(timeoutId);
      eventSource.close();
      onStream('Error in streaming connection. Please try again.', true);
    };
    
    // Return a promise that resolves when the eventSource is closed
    return new Promise((resolve) => {
      eventSource.addEventListener('close', () => {
        resolve();
      });
    });
  } else {
    // Fallback to fetch API if EventSource is not available
    console.log('EventSource not available, falling back to fetch API');
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Streaming request timed out');
      controller.abort();
      onStream('Request timed out. The model is taking too long to respond.', true);
    }, TIMEOUT_MS);

    try {  
      // Make the POST request to the streaming endpoint
      const response = await fetch(`${API_BASE_URL}/generate_stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: requestBody,
        signal: controller.signal,
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      console.log('Starting to process the stream:', response.status, response.headers.get('Content-Type'));
      
      // For debugging
      if (!response.body) {
        console.error('Response body is not available');
        onStream('Error: Stream response body not available', true);
        return;
      }
      
      // Process with fetch streaming API
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Process the stream
      let buffer = '';
      let lastEventDelimiter = 0;
      
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          console.log('Stream has ended');
          onStream('', true);
          break;
        }
        
        // Decode the received chunk
        const chunk = decoder.decode(value, { stream: true });
        console.log('Received chunk:', chunk);
        buffer += chunk;
        
        // Process any complete SSE events
        while (true) {
          const eventDelimiter = buffer.indexOf('\n\n', lastEventDelimiter);
          if (eventDelimiter === -1) break;
          
          const eventData = buffer.slice(lastEventDelimiter, eventDelimiter);
          lastEventDelimiter = eventDelimiter + 2;
          
          // Parse the data: prefix
          const dataPrefix = 'data: ';
          if (eventData.startsWith(dataPrefix)) {
            const data = eventData.slice(dataPrefix.length);
            console.log(`Received SSE data: ${data.substring(0, 20)}...`);
            
            // Skip "Stream started" messages
            if (data === 'Stream started') {
              console.log('Skipping "Stream started" message');
              continue;
            }
            
            if (data === '[DONE]') {
              // End of stream
              console.log('Received [DONE] event');
              onStream('', true);
              return; // Exit early
            } else {
              // Regular token
              onStream(data, false);
            }
          } else {
            console.log('Received non-data SSE event:', eventData);
          }
        }
        
        // Trim the processed part of the buffer
        if (lastEventDelimiter > 0) {
          buffer = buffer.slice(lastEventDelimiter);
          lastEventDelimiter = 0;
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error in streaming response:', error);
      
      // Handle specific errors
      if (error.name === 'AbortError') {
        onStream('The request was aborted. The model may be taking too long to respond.', true);
      } else {
        onStream(`Error in streaming connection: ${error.message}. Please try again.`, true);
      }
    }
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
  // Use streaming for better UI experience, but collect into a single response
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
 * Switch between available models (text or code)
 * @param modelType The type of model to switch to
 * @returns A promise that resolves to a success message
 */
export const switchModel = async (modelType: ModelType): Promise<string> => {
  try {
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
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error switching model:', error);
    toast({
      title: 'Error',
      description: 'Failed to switch models. Please ensure the model server is running.',
      variant: 'destructive',
    });
    return 'Failed to switch models';
  }
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
 * Test the streaming functionality with a simple endpoint that returns incremental messages
 * @param callback Function to call with each streamed message
 */
export const testStreamingConnection = async (
  callback: (message: string, isDone: boolean) => void
): Promise<void> => {
  console.log('Testing streaming connection...');
  
  try {
    // Make the GET request to the test streaming endpoint
    const response = await fetch(`${API_BASE_URL}/test_stream`, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    console.log('Test stream response received:', response.status, response.headers.get('Content-Type'));
    
    if (!response.body) {
      throw new Error('Response body is not available');
    }
    
    // Get the reader for streaming consumption
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Process the stream
    let buffer = '';
    let lastEventDelimiter = 0;
    
    while (true) {
      const { value, done } = await reader.read();
      
      if (done) {
        console.log('Test stream has ended');
        callback('', true);
        break;
      }
      
      // Decode the received chunk
      const chunk = decoder.decode(value, { stream: true });
      console.log('Test received chunk:', chunk);
      buffer += chunk;
      
      // Process any complete SSE events
      while (true) {
        const eventDelimiter = buffer.indexOf('\n\n', lastEventDelimiter);
        if (eventDelimiter === -1) break;
        
        const eventData = buffer.slice(lastEventDelimiter, eventDelimiter);
        lastEventDelimiter = eventDelimiter + 2;
        
        // Parse the data: prefix
        const dataPrefix = 'data: ';
        if (eventData.startsWith(dataPrefix)) {
          const data = eventData.slice(dataPrefix.length);
          console.log(`Test received SSE data: ${data}`);
          
          if (data === '[DONE]') {
            // End of stream
            console.log('Test received [DONE] event');
            callback('', true);
            return; // Exit early
          } else {
            // Regular message
            callback(data, false);
          }
        }
      }
      
      // Trim the processed part of the buffer
      if (lastEventDelimiter > 0) {
        buffer = buffer.slice(lastEventDelimiter);
        lastEventDelimiter = 0;
      }
    }
  } catch (error) {
    console.error('Error in test streaming:', error);
    callback(`Error: ${error.message}`, true);
  }
};

// EventSource Polyfill for POST requests
class EventSourcePolyfill {
  url: string;
  options: any;
  eventListeners: {[key: string]: ((event: any) => void)[]};
  readyState: number;
  
  constructor(url: string, options: any) {
    this.url = url;
    this.options = options;
    this.eventListeners = {
      open: [],
      message: [],
      error: [],
      close: []
    };
    this.readyState = 0; // CONNECTING
    
    // Start the connection
    this.connect();
  }
  
  connect() {
    const { method, headers, body } = this.options;
    
    // Make the fetch request
    fetch(this.url, {
      method: method || 'GET',
      headers: headers || {},
      body: body
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!response.body) {
        throw new Error('Response body is not available');
      }
      
      // Connection established
      this.readyState = 1; // OPEN
      this.dispatchEvent('open', {});
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      let lastEventDelimiter = 0;
      
      const processStream = () => {
        reader.read().then(({ value, done }) => {
          if (done) {
            this.close();
            return;
          }
          
          // Decode chunk and append to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process any complete SSE events
          while (true) {
            const eventDelimiter = buffer.indexOf('\n\n', lastEventDelimiter);
            if (eventDelimiter === -1) break;
            
            const eventData = buffer.slice(lastEventDelimiter, eventDelimiter);
            lastEventDelimiter = eventDelimiter + 2;
            
            // Parse the data: prefix
            const dataPrefix = 'data: ';
            if (eventData.startsWith(dataPrefix)) {
              const data = eventData.slice(dataPrefix.length);
              
              this.dispatchEvent('message', { 
                data,
                lastEventId: '',
                origin: this.url
              });
            }
          }
          
          // Trim the processed part of the buffer
          if (lastEventDelimiter > 0) {
            buffer = buffer.slice(lastEventDelimiter);
            lastEventDelimiter = 0;
          }
          
          // Continue processing the stream
          processStream();
        }).catch(error => {
          this.dispatchEvent('error', error);
          this.close();
        });
      };
      
      // Start processing the stream
      processStream();
    })
    .catch(error => {
      this.dispatchEvent('error', error);
      this.close();
    });
  }
  
  addEventListener(type: string, callback: (event: any) => void) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    this.eventListeners[type].push(callback);
  }
  
  removeEventListener(type: string, callback: (event: any) => void) {
    if (!this.eventListeners[type]) return;
    this.eventListeners[type] = this.eventListeners[type].filter(
      listener => listener !== callback
    );
  }
  
  dispatchEvent(type: string, event: any) {
    if (!this.eventListeners[type]) return;
    
    for (const callback of this.eventListeners[type]) {
      callback(event);
    }
    
    // Special case for onXXX callbacks
    if (type === 'message' && this.onmessage) {
      this.onmessage(event);
    } else if (type === 'open' && this.onopen) {
      this.onopen(event);
    } else if (type === 'error' && this.onerror) {
      this.onerror(event);
    } else if (type === 'close' && this.onclose) {
      this.onclose(event);
    }
  }
  
  close() {
    if (this.readyState === 2) return; // Already closed
    this.readyState = 2; // CLOSED
    this.dispatchEvent('close', {});
  }
  
  // Define handlers that can be set directly
  onopen?: (event: any) => void;
  onmessage?: (event: any) => void;
  onerror?: (event: any) => void;
  onclose?: (event: any) => void;
} 
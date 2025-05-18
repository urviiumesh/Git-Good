// Sequential Thinking Server - Local Implementation
// Adapted from github.com/smithery-ai/reference-servers

import chalk from 'chalk';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch, { Response } from 'node-fetch';

// Define the ThoughtData interface similar to the reference implementation
interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean;
}

/**
 * Sequential Thinking Server class
 * Handles the processing of sequential thinking requests locally
 */
class SequentialThinkingServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private creationTime: number = Date.now();
  private lastResetTime: number = Date.now();
  private lastActivityTime: number = Date.now();
  private processingTime: number[] = [];
  private isProcessing: boolean = false;

  // Add a constant for the model API URL
  private readonly MODEL_API_URL = 'http://localhost:8000';

  /**
   * Validates the thought data input
   */
  private validateThoughtData(input: unknown): ThoughtData {
    const data = input as Record<string, unknown>;

    if (!data.thought || typeof data.thought !== 'string') {
      throw new Error('Invalid thought: must be a string');
    }
    if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
      throw new Error('Invalid thoughtNumber: must be a number');
    }
    if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
      throw new Error('Invalid totalThoughts: must be a number');
    }
    if (typeof data.nextThoughtNeeded !== 'boolean') {
      throw new Error('Invalid nextThoughtNeeded: must be a boolean');
    }

    // Limit thought size for better performance
    let thought = data.thought as string;
    if (thought.length > 2000) {
      thought = thought.substring(0, 2000) + "... (truncated for performance)";
    }

    // Limit total thoughts to avoid excessive processing
    const totalThoughts = Math.min(data.totalThoughts as number, 5);

    return {
      thought: thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded && (data.thoughtNumber as number) < totalThoughts,
      isRevision: data.isRevision as boolean | undefined,
      revisesThought: data.revisesThought as number | undefined,
      branchFromThought: data.branchFromThought as number | undefined,
      branchId: data.branchId as string | undefined,
      needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
    };
  }

  /**
   * Formats a thought for console output
   */
  private formatThought(thoughtData: ThoughtData): string {
    const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId } = thoughtData;

    let prefix = '';
    let context = '';

    if (isRevision) {
      prefix = chalk.yellow('🔄 Revision');
      context = ` (revising thought ${revisesThought})`;
    } else if (branchFromThought) {
      prefix = chalk.green('🌿 Branch');
      context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
    } else {
      prefix = chalk.blue('💭 Thought');
      context = '';
    }

    const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
    const fixedWidth = 80;
    const border = '─'.repeat(fixedWidth);

    return `\n┌${border}┐\n│ ${header} │\n├${border}┤\n│\n${thought}\n   │\n└${border}┘\n`;
  }

  /**
   * Generate a new thought using the model
   */
  private async generateThought(prompt: string, previousThoughts: string[] = []): Promise<string> {
    try {
      console.log("Generating thought using model...");
      
      // Use abortable fetch with timeout (increased to 200 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 200000);
      
      // Construct a simplified context from previous thoughts
      let context = "";
      if (previousThoughts.length > 0) {
        // Only use the last thought for context to keep it simpler
        context = "Previous thought: " + previousThoughts[previousThoughts.length - 1] + "\n\n";
      }
      
      // Use a more direct prompt to get more focused thoughts
      const thoughtPrompt = prompt.includes("algorithm") || prompt.includes("code") ? 
        `${context}Think step by step about this problem: ${prompt}` :
        `${context}Analyze this problem: ${prompt}`;
      
      // Generate the actual thinking content
      const response = await fetch(`${this.MODEL_API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: thoughtPrompt,
          max_tokens: 150 // Use max_tokens instead for better control
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Model API error: ${response.status}`);
      }

      const data = await response.text();
      
      // Validate thought quality
      const trimmedData = data.trim();
      
      // Check if the response is just a number or too short
      if (/^\d+$/.test(trimmedData) || trimmedData.length < 20) {
        console.log("Generated thought is too short or just numeric. Retrying...");
        // Retry with a more explicit prompt
        return this.generateThought(`Please provide a detailed analysis of: ${prompt}`, previousThoughts);
      }
      
      // Check if the response contains word count markers
      if (trimmedData.match(/^\d+ words\./)) {
        console.log("Response contains word count markers. Stripping those out.");
        // Remove word count markers like "150 words."
        const cleanedText = trimmedData.replace(/\d+ words\.\s*/g, '');
        return cleanedText || `Analysis of ${prompt}: This requires careful consideration.`;
      }
      
      console.log("Generated thought:", trimmedData.substring(0, 50) + "...");
      return trimmedData;
    } catch (error) {
      console.error("Error generating thought:", error);
      if (error.name === 'AbortError') {
        return "Thought generation timed out. Using a simplified analysis approach for better performance.";
      }
      return `Error generating thought: ${error.message}. Continuing with basic analysis.`;
    }
  }

  /**
   * Process a thought and return the response
   */
  public async processThought(input: unknown): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    const startTime = performance.now();
    
    // Update activity time
    this.lastActivityTime = Date.now();
    
    // Check if already processing to prevent overlap
    if (this.isProcessing) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Already processing a thought. Please wait.",
            status: 'busy'
          })
        }],
        isError: true
      };
    }
    
    this.isProcessing = true;
    
    // Set a timeout to automatically release the lock if processing gets stuck
    const lockTimeoutId = setTimeout(() => {
      if (this.isProcessing) {
        console.log('Force releasing processing lock after timeout');
        this.isProcessing = false;
      }
    }, 60000); // 1 minute timeout
    
    try {
      const validatedInput = this.validateThoughtData(input);

      // Auto-adjust thought numbers and totals
      if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
        validatedInput.totalThoughts = validatedInput.thoughtNumber;
      }

      // Check for repetitive or low-quality thoughts
      let needsRegeneration = false;
      if (this.thoughtHistory.length > 0) {
        const lastThought = this.thoughtHistory[this.thoughtHistory.length - 1];
        
        // Consider a thought repetitive or low-quality if:
        // 1. It's very similar to the last thought
        // 2. It's too short (less than 20 chars)
        // 3. It's just a number or other simple response
        // 4. It contains the exact prompt format
        if ((lastThought.thought.substring(0, 100) === validatedInput.thought.substring(0, 100) && 
             !validatedInput.isRevision && 
             !validatedInput.branchFromThought) || 
            validatedInput.thought.trim().length < 20 ||
            /^\d+$/.test(validatedInput.thought.trim()) ||
            validatedInput.thought.includes("Step-by-step thinking about:") ||
            validatedInput.thought.includes("Continue analysis on:")) {
          
          console.log("Detected low-quality or repetitive thought, generating new content...");
          needsRegeneration = true;
        }
      }

      // Extract the actual prompt
      const promptMatch = validatedInput.thought.match(/(?:thinking about|analyze|problem|analysis on):?\s*(.*)/i);
      const prompt = promptMatch ? promptMatch[1].trim() : validatedInput.thought;
      
      // For first thought or repetitive/low-quality thoughts, generate fresh content
      if (validatedInput.thoughtNumber === 1 || needsRegeneration) {
        // Get previous thoughts for context
        const previousThoughts = this.thoughtHistory
          .filter(t => t.thoughtNumber < validatedInput.thoughtNumber)
          .map(t => `Thought ${t.thoughtNumber}: ${t.thought}`)
          .slice(-1);
        
        // Generate new thought content with retry logic
        let attempts = 0;
        let generatedThought = "";
        
        while (attempts < 3) {
          generatedThought = await this.generateThought(prompt, previousThoughts);
          
          // Check if the generated thought is valid
          if (generatedThought.length >= 20 && !/^\d+$/.test(generatedThought.trim())) {
            break;
          }
          
          console.log(`Attempt ${attempts+1}: Generated thought is too short or invalid. Retrying...`);
          attempts++;
        }
        
        validatedInput.thought = generatedThought;
      }
      
      // Ensure we have a valid thought before proceeding
      if (validatedInput.thought.trim().length < 20 || /^\d+$/.test(validatedInput.thought.trim())) {
        // If still not good enough, use a fallback thought
        validatedInput.thought = `Analysis of ${prompt}: This requires careful consideration of multiple factors including context, requirements, and constraints. The solution should address the key aspects of the problem while considering edge cases.`;
        console.log("Using fallback thought content due to generation issues.");
      }

      // Add thought to history
      this.thoughtHistory.push(validatedInput);

      // Handle branches
      if (validatedInput.branchFromThought && validatedInput.branchId) {
        if (!this.branches[validatedInput.branchId]) {
          this.branches[validatedInput.branchId] = [];
        }
        this.branches[validatedInput.branchId].push(validatedInput);
      }

      // Display formatted thought
      const formattedThought = this.formatThought(validatedInput);
      console.log(formattedThought);
      
      // Record performance metrics
      const endTime = performance.now();
      this.processingTime.push(endTime - startTime);

      // Update activity time again after processing
      this.lastActivityTime = Date.now();
      this.isProcessing = false;
      clearTimeout(lockTimeoutId);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            thoughtNumber: validatedInput.thoughtNumber,
            totalThoughts: validatedInput.totalThoughts,
            nextThoughtNeeded: validatedInput.nextThoughtNeeded,
            thought: validatedInput.thought,
            processedIn: `${(endTime - startTime).toFixed(2)}ms`
          })
        }]
      };
    } catch (error) {
      console.error('Error processing thought:', error);
      this.isProcessing = false;
      clearTimeout(lockTimeoutId);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: `Error: ${error.message}`,
            errorDetails: error.stack,
            status: 'error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Resets the thought history
   */
  public reset(): void {
    this.thoughtHistory = [];
    this.branches = {};
    this.lastResetTime = Date.now();
    this.processingTime = [];
    this.isProcessing = false;
    console.log(chalk.yellow('Sequential thinking reset. All thoughts cleared.'));
  }

  /**
   * Forces completion of the current thought process
   */
  public forceComplete(): { success: boolean, message: string } {
    if (this.thoughtHistory.length === 0) {
      return { success: false, message: 'No active thought process to complete.' };
    }
    
    // Mark the last thought as not needing more thoughts
    const lastThought = this.thoughtHistory[this.thoughtHistory.length - 1];
    lastThought.nextThoughtNeeded = false;
    
    console.log(chalk.yellow('Forced completion of thought process.'));
    return { success: true, message: 'Thought process marked as complete.' };
  }

  /**
   * Gets the current status of the sequential thinking server
   */
  public getStatus(): object {
    const avgProcessingTime = this.processingTime.length > 0
      ? this.processingTime.reduce((a, b) => a + b, 0) / this.processingTime.length
      : 0;
    
    return {
      uptime: Date.now() - this.creationTime,
      lastResetTime: this.lastResetTime,
      lastActivityTime: this.lastActivityTime,
      thoughtCount: this.thoughtHistory.length,
      branchCount: Object.keys(this.branches).length,
      processing: this.isProcessing,
      averageProcessingTimeMs: avgProcessingTime.toFixed(2),
      currentMemoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024
    };
  }

  /**
   * Gets the tool definition for the sequential thinking server
   */
  public getToolDefinition() {
    return {
      name: "sequentialthinking",
      description: "A tool for thinking through problems step by step, showing the intermediate thought process.",
      parameters: {
        type: "object",
        properties: {
          thought: {
            type: "string",
            description: "The current thought or thinking directive."
          },
          thoughtNumber: {
            type: "integer",
            description: "The current thought number in the sequence."
          },
          totalThoughts: {
            type: "integer",
            description: "The total number of thoughts expected in the sequence."
          },
          nextThoughtNeeded: {
            type: "boolean",
            description: "Whether another thought is needed after this one."
          },
          isRevision: {
            type: "boolean",
            description: "Whether this thought is a revision of a previous thought."
          },
          revisesThought: {
            type: "integer",
            description: "If this is a revision, which thought number it revises."
          },
          branchFromThought: {
            type: "integer",
            description: "If this is a branch, which thought number it branches from."
          },
          branchId: {
            type: "string",
            description: "If this is a branch, a unique identifier for the branch."
          }
        },
        required: ["thought", "thoughtNumber", "totalThoughts", "nextThoughtNeeded"]
      }
    };
  }
}

// Create an instance of the sequential thinking server
const sequentialThinking = new SequentialThinkingServer();

// Create Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Define routes
app.get('/', (req, res) => {
  res.json({
    name: 'Sequential Thinking Server',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      '/call-tool',
      '/reset',
      '/force-complete',
      '/status',
      '/tool-definition',
      '/health'
    ]
  });
});

app.post('/call-tool', async (req, res) => {
  try {
    const { params } = req.body;
    
    if (!params || params.name !== 'sequentialthinking') {
      return res.status(400).json({
        error: 'Invalid tool name. Expected "sequentialthinking".'
      });
    }
    
    const result = await sequentialThinking.processThought(params.arguments);
    res.json(result);
  } catch (error) {
    console.error('Error in /call-tool:', error);
    res.status(500).json({
      error: `Server error: ${error.message}`
    });
  }
});

app.post('/reset', (req, res) => {
  sequentialThinking.reset();
  res.json({ success: true, message: 'Sequential thinking reset.' });
});

app.post('/force-complete', (req, res) => {
  const result = sequentialThinking.forceComplete();
  res.json(result);
});

app.get('/status', (req, res) => {
  res.json(sequentialThinking.getStatus());
});

app.get('/tool-definition', (req, res) => {
  res.json(sequentialThinking.getToolDefinition());
});

// Add a fallback timeout endpoint for safety
app.get('/health', (req, res) => {
  const status = sequentialThinking.getStatus() as any;
  
  // If the server has been processing for too long (more than 2 minutes), force reset
  if (status.processing && (Date.now() - status.lastActivityTime > 120000)) {
    console.log('Processing stuck for too long, resetting server state');
    sequentialThinking.reset();
    res.status(503).json({
      status: 'reset_required',
      message: 'Server was stuck in processing state and has been reset'
    });
  } else {
    res.json({
      status: 'healthy',
      ...status
    });
  }
});

// Start the server
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(chalk.green(`Sequential Thinking Server running on port ${PORT}`));
  console.log(chalk.blue(`✓ Ready to process thoughts - http://localhost:${PORT}`));
}); 
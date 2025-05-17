# EdgeGPT with Local Models

EdgeGPT is a chat application that uses local LLM models for inference. This project combines a React frontend with a FastAPI Python backend to serve local AI models.

## Features

- Chat with local Mistral-7B and CodeLlama-7B models
- Switch between text and code generation models seamlessly
- Enhanced sequential thinking for step-by-step problem solving
- Responsive UI built with React, TypeScript, and Tailwind CSS
- Streaming responses for real-time interaction
- Conversation history management and persistence

## Codebase Structure

The project is structured as follows:

```
EdgeGPT/
├── src/                      # Frontend React code
│   ├── components/           # UI components
│   ├── utils/                # Utility functions
│   ├── hooks/                # React hooks
│   ├── lib/                  # Library code
│   ├── providers/            # React context providers
│   ├── pages/                # App pages
│   ├── App.tsx               # Main React application component
│   ├── ChatInterface.tsx     # Chat interface component (both in root and src)
│   ├── main.tsx              # Main entry point for React
│   ├── sequentialThinkingServer.ts # Sequential thinking server implementation
│   └── index.css             # Global CSS styles
├── public/                   # Static assets
├── models/                   # Local model files (not included in repo)
├── chat_history/             # Saved chat conversations
├── mcp/                      # Model Context Protocol related resources
│   └── thinking/             # Sequential thinking implementation resources
├── run.py                    # FastAPI backend server for model inference
├── server.js                 # Node.js server for additional features
├── modelService.ts           # TypeScript service for model interaction
├── start-servers.ps1         # PowerShell script to start all servers on Windows
├── start-servers.sh          # Shell script to start all servers on macOS/Linux
├── package.json              # Node.js dependencies
├── tailwind.config.ts        # Tailwind CSS configuration
├── vite.config.ts            # Vite build configuration
└── README.md                 # Project documentation
```

## Clean-up Information

The codebase has been cleaned up to:
- Remove duplicate files (ChatInterface.tsx, modelService.ts)
- Remove Python cache files (__pycache__/)
- Remove temporary installation files (get-pip.py)
- Update .gitignore to exclude appropriate files
- Organize the codebase structure for better maintainability

## Requirements

### Frontend
- Node.js 16+
- npm or yarn
- TypeScript
- Vite

### Backend (Local Models)
- Python 3.9+
- FastAPI
- uvicorn
- llama-cpp-python

## Installation

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

### Local Models Setup

1. Navigate to the models directory:
   ```bash
   cd models
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install required packages:
   ```bash
   pip install fastapi uvicorn pydantic psutil
   ```

5. Install llama-cpp-python:
   - Windows (with prebuilt wheel):
     ```bash
     pip install llama_cpp_python-0.2.90-cp312-cp312-win_amd64.whl
     ```
   - macOS/Linux:
     ```bash
     pip install llama-cpp-python
     ```

## Running the Application

### Starting All Servers at Once

You can start all servers at once using the provided scripts:

- Windows:
  ```bash
  ./start-servers.ps1
  ```

- macOS/Linux:
  ```bash
  ./start-servers.sh
  ```

### Start the Frontend

```bash
npm run dev
```

### Start the Local Models API Server

```bash
python run.py
```

Or with uvicorn directly:

```bash
python -m uvicorn run:app --host 0.0.0.0 --port 8000 --reload
```

### Start the Sequential Thinking Server

```bash
npm run thinking-server
```

## Model Information

The application uses two quantized models:

1. **Mistral-7B-Instruct** (Text generation)
   - Used for general text responses
   - Optimized for instruction following
   - File: `mistral-7b-instruct-v0.1.Q4_K_M.gguf`

2. **CodeLlama-7B-Instruct** (Code generation)
   - Specialized for generating code samples
   - Responds to programming-related queries
   - File: `codellama-7b-instruct.Q4_K_M.gguf`

## Switching Models

You can switch between the text and code models using the dropdown in the chat header. The application will automatically use the appropriate model based on your selection.

## API Endpoints

The FastAPI server provides the following endpoints:

- `GET /` - Check server status and current model
- `GET /status` - Get server status information including memory usage and uptime
- `POST /generate` - Generate text from the current model
- `POST /generate_stream` - Stream text generation token by token
- `GET /conversations` - Get all saved conversations
- `GET /conversation/{conversation_id}` - Get a specific conversation
- `POST /conversation` - Create a new conversation
- `DELETE /conversation/{conversation_id}` - Delete a conversation
- `POST /switch-model` - Switch between text and code models

# Sequential Thinking Server

This project includes an optimized implementation of the Model Context Protocol (MCP) sequential thinking server, allowing for step-by-step reasoning without requiring internet access.

## Features

- High-performance implementation of sequential thinking capability
- Works with existing local models
- Provides a visual representation of the thinking process
- Supports branching and revisions in the thinking process
- Automatic timeout handling and performance optimization

## Using Sequential Thinking

The sequential thinking feature allows the AI to break down complex problems into discrete steps, showing its reasoning process before providing a final answer. This is especially useful for:

- Mathematical or logical problems
- Algorithm design and analysis
- Multi-step reasoning tasks
- Complex decision-making scenarios

### How to Activate Sequential Thinking

1. Start a new conversation
2. Click the sparkle (✨) icon next to the send button
3. Check the "Sequential thinking" checkbox
4. Type your question and send it

### Best Practices for Sequential Thinking

For optimal results when using sequential thinking:

- Ask clear, well-defined questions
- For complex problems, provide all necessary information in one message
- Be patient as the system works through the thinking steps
- Limit to 3-5 thoughts for best performance
- Use shorter prompts for faster processing

### Troubleshooting

If sequential thinking is not working properly:

1. Ensure all servers are running (thinking server, model server, and web server)
2. Check the server console output for any errors
3. Try resetting the thinking server using:
   ```
   curl -X POST http://localhost:8001/reset
   ```
4. If thoughts seem repetitive, you can force completion with:
   ```
   curl -X POST http://localhost:8001/force-complete
   ```
5. Verify server status with:
   ```
   curl http://localhost:8001/health
   ```

## Performance Notes

The sequential thinking feature is optimized for performance but may still require more processing time than standard responses. Each thought typically takes 2-5 seconds to generate, so a complete sequence might take 10-30 seconds.

## How It Works

The sequential thinking feature allows the AI to break down complex problems into steps. When enabled:

1. The AI first processes the prompt through a series of thought steps
2. Each thought builds on previous ones
3. The AI can revise or branch from previous thoughts
4. After completing the thinking process, it provides a final answer

## License

MIT

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

6. Download the required model files:
   - Create a `models` directory in the project root if it doesn't exist
   - Download the following models from Hugging Face or other trusted sources:
     * Mistral-7B-Instruct: `mistral-7b-instruct-v0.1.Q4_K_M.gguf`
     * CodeLlama-7B-Instruct: `codellama-7b-instruct.Q4_K_M.gguf`
   - Place the downloaded model files in the `models` directory

   Example download commands (replace with actual URLs):
   ```bash
   # For Mistral-7B
   wget https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf -O models/mistral-7b-instruct-v0.1.Q4_K_M.gguf

   # For CodeLlama-7B
   wget https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_K_M.gguf -O models/codellama-7b-instruct.Q4_K_M.gguf
   ```

7. Verify model paths in `run.py`:
   - Open `run.py` in an editor
   - Ensure the model paths match your downloaded model filenames:
     ```python
     # Example paths in run.py
     TEXT_MODEL_PATH = "models/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
     CODE_MODEL_PATH = "models/codellama-7b-instruct.Q4_K_M.gguf"
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

### Manual Startup Process

If you prefer to start each component individually:

1. **Start the Local Models API Server**:
   ```bash
   python run.py
   ```
   The server will run on http://localhost:8000

2. **Start the Sequential Thinking Server**:
   ```bash
   npm run thinking-server
   ```
   The thinking server will run on http://localhost:8001

3. **Start the Frontend**:
   ```bash
   npm run dev
   ```
   The frontend will be available at http://localhost:5173

4. **Access the Application**:
   Open your browser and navigate to http://localhost:5173

npm run dev
cd models;python run.py
python -m uvicorn run:app --host 0.0.0.0 --port 8000 --reload
npm run thinking-server
.\start-AgenTick-server.ps1

### Configuration

By default, the application connects to the following endpoints:
- Model API: http://localhost:8000
- Thinking Server: http://localhost:8001

If you need to change these, you can modify the connection settings in:
- `src/lib/api.ts` for API endpoints
- `src/sequentialThinkingServer.ts` for thinking server configuration

### Troubleshooting Common Issues

1. **Model Loading Errors**:
   - Verify model files exist in the `models/` directory
   - Check that file paths in `run.py` match your actual model filenames
   - Ensure you have enough RAM (at least 8GB recommended for 7B models)

2. **Connection Errors**:
   - Verify all servers are running
   - Check console outputs for error messages
   - Ensure ports 8000, 8001, and 5173 are not in use by other applications

3. **Performance Issues**:
   - Close unnecessary applications to free up memory
   - Consider using smaller model quantizations if responses are too slow

### Verifying Full Installation

Once you have all components running, perform these checks to verify everything is working correctly:

1. **API Server Test**:
   ```bash
   curl http://localhost:8000/status
   ```
   You should receive a JSON response with server status information.

2. **Thinking Server Test**:
   ```bash
   curl http://localhost:8001/health
   ```
   You should receive a response indicating the thinking server is healthy.

3. **End-to-End Test**:
   - Open the web interface at http://localhost:5173
   - Start a new conversation
   - Type a simple query like "Hello, how are you?"
   - Verify you receive a response from the model
   - Try enabling sequential thinking for a more complex query

If all components are working correctly, you should be able to:
- Switch between text and code models
- Send messages and receive responses
- Use sequential thinking for complex queries
- Save and load conversations

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

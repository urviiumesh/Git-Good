# EdgeGPT with Local Models

EdgeGPT is a chat application that uses local LLM models for inference. This project combines a React frontend with a FastAPI Python backend to serve local AI models.

## Features

- Chat with local Mistral-7B and CodeLlama-7B models
- Switch between text and code generation models seamlessly
- Responsive UI for desktop and mobile devices
- Streaming responses for real-time interaction

## Requirements

### Frontend
- Node.js 16+
- npm or yarn

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
   pip install fastapi uvicorn pydantic
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

### Start the Frontend

```bash
npm run dev
```

### Start the Local Models API Server

1. Navigate to the models directory
2. Run the start script:
   - Windows: `start_server.bat`
   - macOS/Linux: `bash start_server.sh`

Or manually start the server:
```bash
uvicorn run:app --host 0.0.0.0 --port 8000 --reload
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
- `POST /generate` - Generate text from the current model
- `POST /generate_stream` - Stream text generation token by token
- `POST /switch-model` - Switch between text and code models

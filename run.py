from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_cpp import Llama
import threading, os
import time
import traceback
import asyncio
import json
from typing import List, Optional
from datetime import datetime

# ----------------------------
# MODEL LOADING
# ----------------------------
text_llm_path = r"models/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
code_llm_path = r"models/codellama-7b-instruct.Q4_K_M.gguf"

# Check if the model files exist
if not os.path.exists(text_llm_path):
    raise FileNotFoundError(f"Text model file not found: {text_llm_path}")
if not os.path.exists(code_llm_path):
    raise FileNotFoundError(f"Code model file not found: {code_llm_path}")

print(f"Text model path: {text_llm_path}")
print(f"Code model path: {code_llm_path}")

# Model configuration - reduce context size for faster responses
model_config = {
    "n_ctx": 2048,  # Reduced from 4096
    "n_threads": 4,  # Reduced from 8
    "n_batch": 512,
    "n_gpu_layers": 0,
    "use_mmap": True,
    "use_mlock": False,
    "verbose": False
}

# Create a lock for thread-safe model switching
model_lock = threading.Lock()

# Current active model type - only text is available
current_model_type = "text"

# Initialize with text model
try:
    llm = Llama(
        model_path=text_llm_path,
        **model_config
    )
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    raise

# ----------------------------
# FASTAPI APP
# ----------------------------
app = FastAPI()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["Content-Type", "Content-Length"],  # Expose these headers to the client
)

class PromptRequest(BaseModel):
    prompt: str
    word_count: int = 50  # Default to 50 words for faster responses

@app.get("/")
def root():
    return {"message": "LLaMA.cpp FastAPI is running", "current_model": current_model_type}

@app.get("/test")
def test_endpoint():
    """A simple test endpoint to check if the server is responding"""
    return {"message": "Test endpoint is working!"}

@app.get("/test_stream")
def test_streaming():
    """A simple test endpoint that streams data incrementally to verify SSE is working"""
    
    async def stream_test():
        # SSE requires specific headers and format
        for i in range(10):
            yield f"data: Test message {i}\n\n"
            await asyncio.sleep(0.5)  # Simulate slow response
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        content=stream_test(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )

def generate_stream(prompt, max_tokens, temperature, top_k, top_p, repeat_penalty):
    """Generator function for streaming model output token by token"""
    print("Starting generate_stream function")
    
    with model_lock:
        print(f"Streaming with params: max_tokens={max_tokens}, temp={temperature}")
        
        try:
            # Generate tokens one at a time 
            total_tokens = 0
            generated_text = ""
            batch_size = 5  # Send tokens in small batches to reduce HTTP requests
            token_batch = ""
            
            # Send an initial empty data message to establish connection
            yield "data: \n\n"
            
            while total_tokens < max_tokens:
                # Get a single token
                output = llm(
                    prompt=prompt + generated_text,
                    max_tokens=1,
                    temperature=temperature,
                    top_k=top_k,
                    top_p=top_p,
                    repeat_penalty=repeat_penalty,
                    stop=["</s>", "User:", "###"]
                )
                
                token = output["choices"][0]["text"]
                print(f"Generated token: {token!r}")
                
                # Check for stop tokens
                if any(stop in token for stop in ["</s>", "User:", "###"]):
                    print(f"Hit stop token: {token!r}")
                    break
                
                # Add to generated text
                generated_text += token
                token_batch += token
                total_tokens += 1
                
                # Send tokens in batches to reduce HTTP requests
                if total_tokens % batch_size == 0 or total_tokens == max_tokens:
                    # Send token batch to client with proper SSE format
                    yield f"data: {token_batch}\n\n"
                    token_batch = ""
                
                # Small delay to prevent overwhelming the client
                # but significantly reduced to improve responsiveness
                time.sleep(0.001)
            
            # Send any remaining tokens in the batch
            if token_batch:
                yield f"data: {token_batch}\n\n"
            
            # End of generation
            print(f"Generation complete: {total_tokens} tokens")
            print(f"Final text: {generated_text[:50]}...")
            
            # Signal the end of stream
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            print(f"Error during streaming: {e}")
            traceback_str = traceback.format_exc()
            print(traceback_str)
            # Send error message as SSE
            yield f"data: Error during generation: {str(e)}\n\n"
            yield "data: [DONE]\n\n"

@app.post("/generate")
def generate_text(request: PromptRequest):
    global llm, current_model_type
    
    print(f"Received prompt: {request.prompt[:50]}...")
    start_time = time.time()
    
    # Adjust prompt based on model type
    if current_model_type == "text":
        prompt = f"{request.prompt} Your answer should be no more or no less than {request.word_count} words. Answer: "
    else:  # code model
        prompt = f"""Write code to solve the following problem: {request.prompt}

Important: Output code in markdown format with triple backticks and language identifier like this:
```language
// code here
```

For example, for JavaScript use ```javascript, for Python use ```python, etc.
When explaining code, keep explanations brief and outside the code block.
For multiple code files, use separate code blocks with appropriate language tags.
Focus on clean, well-formatted, production-ready code.
"""
    
    estimated_tokens = int(request.word_count * 1.5)
    
    # For non-streaming requests, generate the full response at once
    with model_lock:
        print("Starting non-streaming generation...")
        
        output = llm(
            prompt=prompt,
            max_tokens=estimated_tokens,
            temperature=0.7,
            top_k=40,
            top_p=0.9,
            repeat_penalty=1.1,
            stop=["</s>", "User:", "###"]
        )
        
        full_text = output["choices"][0]["text"]
        print(f"Generated response in {time.time() - start_time:.2f} seconds")
        print(f"Answer: {full_text[:50]}...")
        
        return PlainTextResponse(content=full_text)

@app.post("/generate_stream")
def generate_text_stream(request: PromptRequest):
    global llm, current_model_type
    
    print(f"Received streaming prompt: {request.prompt[:50]}...")
    start_time = time.time()
    
    # Adjust prompt based on model type
    if current_model_type == "text":
        prompt = f"{request.prompt} Your answer should be no more or no less than {request.word_count} words. Answer: "
    else:  # code model
        prompt = f"""Write code to solve the following problem: {request.prompt}

Important: Output code in markdown format with triple backticks and language identifier like this:
```language
// code here
```

For example, for JavaScript use ```javascript, for Python use ```python, etc.
When explaining code, keep explanations brief and outside the code block.
For multiple code files, use separate code blocks with appropriate language tags.
Focus on clean, well-formatted, production-ready code.
"""
    
    estimated_tokens = int(request.word_count * 1.5)

    # Use the generate_stream function for SSE streaming
    return StreamingResponse(
        content=generate_stream(
            prompt=prompt,
            max_tokens=estimated_tokens,
            temperature=0.7,
            top_k=40,
            top_p=0.9,
            repeat_penalty=1.1
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )

# ----------------------------
# CHAT HISTORY STORAGE
# ----------------------------
# Define where to store chat history files
CHAT_HISTORY_DIR = "chat_history"

# Ensure the chat history directory exists
os.makedirs(CHAT_HISTORY_DIR, exist_ok=True)

# Also create a backups directory
BACKUPS_DIR = os.path.join(CHAT_HISTORY_DIR, "backups")
os.makedirs(BACKUPS_DIR, exist_ok=True)

# Define the Pydantic models for chat history
class ChatMessage(BaseModel):
    id: str
    content: str
    isUser: bool
    timestamp: datetime
    isStreaming: Optional[bool] = None

class Conversation(BaseModel):
    id: str
    title: str
    messages: List[ChatMessage]
    createdAt: datetime
    updatedAt: datetime

class ConversationList(BaseModel):
    conversations: List[Conversation]

# Storage key for active conversation
ACTIVE_CONVERSATION_FILE = os.path.join(CHAT_HISTORY_DIR, "active_conversation.txt")
# Storage file for all conversations
CONVERSATIONS_FILE = os.path.join(CHAT_HISTORY_DIR, "conversations.json")
# Lock file for preventing concurrent writes
CONVERSATIONS_LOCK_FILE = os.path.join(CHAT_HISTORY_DIR, "conversations.lock")

# Platform-independent file locking
import threading
file_lock = threading.Lock()
backup_counter = 0
MAX_BACKUPS = 10

def backup_conversations_file():
    """Create a backup of the conversations file"""
    global backup_counter
    
    if not os.path.exists(CONVERSATIONS_FILE):
        return
        
    try:
        # Use timestamp in backup filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(BACKUPS_DIR, f"conversations_{timestamp}_{backup_counter}.json.bak")
        backup_counter = (backup_counter + 1) % 100  # Cycle through 0-99
        
        # Make a copy of the file
        import shutil
        shutil.copy2(CONVERSATIONS_FILE, backup_file)
        
        # Remove old backups if we have too many
        backups = sorted([os.path.join(BACKUPS_DIR, f) for f in os.listdir(BACKUPS_DIR)
                         if f.endswith('.json.bak')])
        if len(backups) > MAX_BACKUPS:
            for old_backup in backups[:-MAX_BACKUPS]:
                try:
                    os.remove(old_backup)
                except:
                    pass
    except Exception as e:
        print(f"Warning: Failed to create backup: {e}")
        # Don't raise exception here - this is just a backup mechanism

# Helper functions for chat history management
def save_conversations(conversations: List[Conversation]) -> None:
    """Save conversations to a JSON file on disk with thread locking to prevent corruption"""
    # Create a temporary file for atomic write
    temp_file = f"{CONVERSATIONS_FILE}.tmp"
    
    try:
        # Acquire a lock before writing
        with file_lock:
            # Create a backup before making changes
            backup_conversations_file()
            
            # Convert to JSON serializable format and write to temp file first
            serializable_convos = [conversation.dict() for conversation in conversations]
            with open(temp_file, "w") as f:
                json.dump(serializable_convos, f, default=str)
            
            # Atomically replace the original file
            if os.path.exists(CONVERSATIONS_FILE):
                # On Windows, we need to remove the file first
                try:
                    os.remove(CONVERSATIONS_FILE)
                except:
                    pass
                    
            os.rename(temp_file, CONVERSATIONS_FILE)
            
    except Exception as e:
        print(f"Error saving conversations: {e}")
        # Clean up temp file if it exists
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to save conversations: {str(e)}")

def load_conversations() -> List[Conversation]:
    """Load conversations from disk with locking"""
    if not os.path.exists(CONVERSATIONS_FILE):
        return []
    
    try:
        # Acquire a lock for reading
        with file_lock:
            with open(CONVERSATIONS_FILE, "r") as f:
                data = json.load(f)
                # Convert timestamps from strings to datetime objects
                for convo in data:
                    convo["createdAt"] = datetime.fromisoformat(convo["createdAt"].replace('Z', '+00:00'))
                    convo["updatedAt"] = datetime.fromisoformat(convo["updatedAt"].replace('Z', '+00:00'))
                    for msg in convo["messages"]:
                        msg["timestamp"] = datetime.fromisoformat(msg["timestamp"].replace('Z', '+00:00'))
                
                return [Conversation(**convo) for convo in data]
    except Exception as e:
        print(f"Error loading conversations: {e}")
        # Try to load from a backup if available
        try:
            backups = sorted([os.path.join(BACKUPS_DIR, f) for f in os.listdir(BACKUPS_DIR)
                             if f.endswith('.json.bak')])
            if backups:
                print(f"Attempting to recover from latest backup: {backups[-1]}")
                with open(backups[-1], "r") as f:
                    data = json.load(f)
                    # Convert timestamps from strings to datetime objects
                    for convo in data:
                        convo["createdAt"] = datetime.fromisoformat(convo["createdAt"].replace('Z', '+00:00'))
                        convo["updatedAt"] = datetime.fromisoformat(convo["updatedAt"].replace('Z', '+00:00'))
                        for msg in convo["messages"]:
                            msg["timestamp"] = datetime.fromisoformat(msg["timestamp"].replace('Z', '+00:00'))
                    
                    # Save the recovered data back to the main file
                    recovered = [Conversation(**convo) for convo in data]
                    try:
                        save_conversations(recovered)
                    except:
                        pass  # Just a best-effort recovery
                    
                    return recovered
        except Exception as recovery_error:
            print(f"Recovery attempt failed: {recovery_error}")
        
        return []

def save_active_conversation(conversation_id: str) -> None:
    """Save the active conversation ID to disk"""
    try:
        with open(ACTIVE_CONVERSATION_FILE, "w") as f:
            f.write(conversation_id)
    except Exception as e:
        print(f"Error saving active conversation: {e}")

def load_active_conversation() -> Optional[str]:
    """Load the active conversation ID from disk"""
    if not os.path.exists(ACTIVE_CONVERSATION_FILE):
        return None
    
    try:
        with open(ACTIVE_CONVERSATION_FILE, "r") as f:
            return f.read().strip()
    except Exception as e:
        print(f"Error loading active conversation: {e}")
        return None

# Chat history API endpoints
@app.get("/conversations")
def get_conversations():
    """Get all conversations"""
    conversations = load_conversations()
    return {"conversations": [convo.dict() for convo in conversations]}

@app.get("/conversation/{conversation_id}")
def get_conversation(conversation_id: str):
    """Get a specific conversation by ID"""
    conversations = load_conversations()
    for convo in conversations:
        if convo.id == conversation_id:
            return convo.dict()
    
    raise HTTPException(status_code=404, detail="Conversation not found")

@app.post("/conversation")
def create_conversation(conversation: Conversation):
    """Create or update a conversation"""
    conversations = load_conversations()
    
    # Check if conversation already exists
    existing_index = -1
    for i, convo in enumerate(conversations):
        if convo.id == conversation.id:
            existing_index = i
            break
    
    if existing_index >= 0:
        # Update existing conversation
        conversations[existing_index] = conversation
    else:
        # Add new conversation
        conversations.append(conversation)
    
    save_conversations(conversations)
    return {"success": True, "id": conversation.id}

@app.delete("/conversation/{conversation_id}")
def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    conversations = load_conversations()
    conversations = [convo for convo in conversations if convo.id != conversation_id]
    save_conversations(conversations)
    
    # If we deleted the active conversation, clear it
    active_id = load_active_conversation()
    if active_id == conversation_id:
        os.remove(ACTIVE_CONVERSATION_FILE)
    
    return {"success": True}

@app.get("/active-conversation")
def get_active_conversation():
    """Get the active conversation ID"""
    active_id = load_active_conversation()
    return {"id": active_id}

@app.post("/active-conversation/{conversation_id}")
def set_active_conversation(conversation_id: str):
    """Set the active conversation ID"""
    save_active_conversation(conversation_id)
    return {"success": True}

@app.delete("/conversations")
def clear_all_conversations():
    """Delete all conversations"""
    if os.path.exists(CONVERSATIONS_FILE):
        os.remove(CONVERSATIONS_FILE)
    
    if os.path.exists(ACTIVE_CONVERSATION_FILE):
        os.remove(ACTIVE_CONVERSATION_FILE)
    
    return {"success": True}

# Model switch request model
class ModelSwitchRequest(BaseModel):
    model_type: str  # "text" or "code"

@app.post("/switch-model")
def switch_model(request: ModelSwitchRequest):
    global llm, current_model_type
    
    model_type = request.model_type.lower()
    
    # Validate model type
    if model_type not in ["text", "code"]:
        return JSONResponse(
            status_code=400, 
            content={"error": f"Invalid model type: {model_type}. Supported types are 'text' and 'code'."}
        )
    
    # If already using the requested model, just return
    if model_type == current_model_type:
        return {"message": f"Already using {model_type} model."}
    
    print(f"Switching from {current_model_type} model to {model_type} model")
    
    try:
        with model_lock:
            # Choose the appropriate model path
            if model_type == "text":
                model_path = text_llm_path
            else:  # code model
                model_path = r"models/codellama-7b-instruct.Q4_K_M.gguf"
            
            # Load the new model
            print(f"Loading {model_type} model from: {model_path}")
            llm = Llama(
                model_path=model_path,
                **model_config
            )
            
            # Update the current model type
            current_model_type = model_type
            
            print(f"Successfully switched to {model_type} model.")
            return {"message": f"Successfully switched to {model_type} model."}
            
    except Exception as e:
        print(f"Error switching model: {e}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to switch model: {str(e)}"}
        ) 
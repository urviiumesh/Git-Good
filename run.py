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
from typing import List, Optional, Dict
from datetime import datetime
import functools
import re
import psutil

# Add server start time for uptime tracking
server_start_time = time.time()

# Add simple in-memory caching for conversation data to reduce GET requests
# Cache will store conversation data and expire after 30 seconds
conversation_cache: Dict[str, dict] = {}
conversation_cache_timestamp: Dict[str, float] = {}
CACHE_EXPIRY_SECONDS = 30

# Cache decorator for conversation-related endpoints
def cache_response(expire_seconds: int = CACHE_EXPIRY_SECONDS):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Determine the cache key based on the function name and arguments
            # For conversation ID-specific endpoints
            cache_key = func.__name__
            if 'conversation_id' in kwargs:
                cache_key += f"_{kwargs['conversation_id']}"
            
            # Check if we have a valid cache entry
            current_time = time.time()
            if (cache_key in conversation_cache and 
                cache_key in conversation_cache_timestamp and
                current_time - conversation_cache_timestamp[cache_key] < expire_seconds):
                print(f"Cache hit for {cache_key}")
                return conversation_cache[cache_key]
            
            # Call the original function if no cache or expired
            result = await func(*args, **kwargs)
            
            # Cache the result
            conversation_cache[cache_key] = result
            conversation_cache_timestamp[cache_key] = current_time
            
            return result
        return wrapper
    return decorator

# Function to invalidate cache for a specific conversation
def invalidate_conversation_cache(conversation_id: str = None):
    global conversation_cache, conversation_cache_timestamp
    if conversation_id:
        # Remove specific conversation from cache
        keys_to_remove = [k for k in conversation_cache.keys() if conversation_id in k]
        for key in keys_to_remove:
            if key in conversation_cache:
                del conversation_cache[key]
            if key in conversation_cache_timestamp:
                del conversation_cache_timestamp[key]
    else:
        # Clear entire cache
        conversation_cache = {}
        conversation_cache_timestamp = {}
    print(f"Cache invalidated for {'all conversations' if conversation_id is None else f'conversation {conversation_id}'}")

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
    max_tokens: Optional[int] = None  # New parameter that takes precedence over word_count

@app.get("/")
def root():
    return {"message": "LLaMA.cpp FastAPI is running", "current_model": current_model_type}

@app.get("/test")
def test_endpoint():
    """A simple test endpoint to check if the server is responding"""
    return {"message": "Test endpoint is working!"}

@app.get("/status")
def status_endpoint():
    """Status endpoint for health checks"""
    current_process = psutil.Process()
    return {
        "status": "running",
        "current_model": current_model_type,
        "memory_usage_mb": round(current_process.memory_info().rss / (1024 * 1024), 2),
        "uptime_seconds": int(time.time() - server_start_time)
    }

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
            sent_tokens = 0  # Track tokens actually sent to client
            generated_text = ""
            
            # Instead of skipping tokens, we'll use a pattern matching approach
            # to detect and filter word count markers
            word_count_pattern = ""
            collecting_word_count = False
            
            # Track consecutive newlines to prevent too many empty lines
            consecutive_newlines = 0
            max_consecutive_newlines = 2
            
            # Add instruction to the prompt to avoid empty lines at the start
            if current_model_type == "text" and not prompt.endswith("Answer directly without preamble:"):
                prompt += "\nAnswer directly without preamble:"
            
            # Flag to indicate if we've hit max tokens
            max_tokens_reached = False
            
            # Track empty token streak
            empty_token_streak = 0
            max_empty_token_streak = 5  # Stop if we get too many empty tokens in a row
            
            while sent_tokens < max_tokens and not max_tokens_reached:
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
                
                # Check if we got a valid output
                if not output["choices"]:
                    print("No tokens generated, ending stream")
                    break
                    
                token = output["choices"][0]["text"]
                print(f"Generated token: {token!r}")
                
                # Add to generated text for context window
                generated_text += token
                total_tokens += 1
                
                # Handle empty tokens
                if token == "":
                    empty_token_streak += 1
                    if empty_token_streak >= max_empty_token_streak:
                        print(f"Too many empty tokens in a row ({empty_token_streak}), ending stream")
                        break
                    continue
                else:
                    empty_token_streak = 0  # Reset streak for non-empty tokens
                
                # Skip whitespace-only tokens (except controlled newlines)
                if token.isspace() and token != "\n":
                    continue
                    
                # Handle consecutive newlines
                if token == "\n":
                    consecutive_newlines += 1
                    if consecutive_newlines > max_consecutive_newlines:
                        continue  # Skip this newline
                else:
                    consecutive_newlines = 0  # Reset counter for non-newline tokens
                
                # Check for stop tokens
                if any(stop in token for stop in ["</s>", "User:", "###"]):
                    print(f"Hit stop token: {token!r}")
                    break
                
                # Skip excessive whitespace/newlines at the beginning
                if sent_tokens < 2 and (token.isspace() or token == "\n"):
                    continue
                
                # Check if we're potentially collecting a word count pattern
                if collecting_word_count:
                    word_count_pattern += token
                    
                    # If we've collected something that matches a word count pattern (e.g., "150 words.")
                    if re.search(r'^\d+\s+words\.', word_count_pattern):
                        print(f"Detected word count pattern: {word_count_pattern!r}")
                        collecting_word_count = False
                        word_count_pattern = ""
                        continue
                    
                    # If we've collected something that's not going to be a word count pattern
                    # or if we're done with the potential pattern
                    if (len(word_count_pattern) > 15 or  # Too long to be a word count
                        (token in ['.', '\n'] and word_count_pattern.endswith('words.')) or  # End of pattern
                        (not token.isdigit() and not token.isspace() and 'words' not in word_count_pattern)):  # Not part of pattern
                        
                        # Send the collected pattern if it's not a word count pattern
                        if not re.search(r'^\d+\s+words\.', word_count_pattern):
                            print(f"Not a word count pattern: {word_count_pattern!r}")
                            for char in word_count_pattern:
                                if sent_tokens < max_tokens:
                                    yield f"data: {char}\n\n"
                                    sent_tokens += 1
                                else:
                                    max_tokens_reached = True
                                    break
                        
                        collecting_word_count = False
                        word_count_pattern = ""
                
                # Start collecting a potential word count pattern if we see a digit at the start
                elif (sent_tokens < 3 and token.isdigit()) or token == "Answer:" or token == "Answer: ":
                    collecting_word_count = True
                    word_count_pattern = token
                    continue
                
                # Only send tokens if we're not collecting a word count pattern and haven't reached max
                if not collecting_word_count and not max_tokens_reached:
                    yield f"data: {token}\n\n"
                    sent_tokens += 1
                    
                    # Check if we've hit max tokens
                    if sent_tokens >= max_tokens:
                        max_tokens_reached = True
                        print(f"Reached max tokens ({max_tokens}), stopping generation")
                        break
                
                # Very small delay to prevent server overload
                # but small enough to maintain smooth streaming
                time.sleep(0.0005)
            
            # End of generation
            print(f"Generation complete: {total_tokens} tokens generated, {sent_tokens} tokens sent")
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
    
    # Use max_tokens if provided, otherwise calculate from word_count
    max_tokens = request.max_tokens if request.max_tokens else int(request.word_count * 3)
    
    # Adjust prompt based on model type without word count instructions
    if current_model_type == "text":
        prompt = f"{request.prompt}\nPlease provide a clear and concise answer: "
    else:  # code model
        prompt = f"""Write code to solve the following problem: {request.prompt}

Important: Output code in markdown format with triple backticks and appropriate language identifier like this:
```language
// code here
```

For HTML/XML code specifically, use ```html as the language identifier:
```html
<div class="example">
  <!-- Your HTML code here -->
</div>
```

Supported languages include:
- JavaScript (```javascript or ```js)
- TypeScript (```typescript or ```ts)
- Python (```python or ```py)
- Java (```java)
- C# (```csharp or ```cs)
- C/C++ (```cpp or ```c)
- Rust (```rust or ```rs)
- Go (```go)
- PHP (```php)
- Ruby (```ruby or ```rb)
- Swift (```swift)
- Kotlin (```kotlin or ```kt)
- SQL (```sql)
- HTML (```html)
- CSS (```css)
- Shell/Bash (```bash or ```sh)
- PowerShell (```powershell)
- And many others.

Use appropriate language identifier tags matching the code's language.
Ensure proper code indentation and formatting.
For multiple code files, use separate code blocks with appropriate language tags.
Provide brief explanations outside code blocks.
Focus on clean, well-formatted, production-ready code.
"""
    
    # For non-streaming requests, generate the full response at once
    with model_lock:
        print("Starting non-streaming generation...")
        
        output = llm(
            prompt=prompt,
            max_tokens=max_tokens,
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
    
    # Set default max_tokens to 50, use provided value if available
    max_tokens = request.max_tokens if request.max_tokens else 50
    
    # Adjust prompt based on model type without word count instructions
    if current_model_type == "text":
        prompt = f"{request.prompt}\nPlease provide a concise answer without preamble: "
    else:  # code model
        prompt = f"""Write code to solve the following problem: {request.prompt}

Important: Output code in markdown format with triple backticks and appropriate language identifier like this:
```language
// code here
```

For HTML/XML code specifically, use ```html as the language identifier:
```html
<div class="example">
  <!-- Your HTML code here -->
</div>
```

Supported languages include:
- JavaScript (```javascript or ```js)
- TypeScript (```typescript or ```ts)
- Python (```python or ```py)
- Java (```java)
- C# (```csharp or ```cs)
- C/C++ (```cpp or ```c)
- Rust (```rust or ```rs)
- Go (```go)
- PHP (```php)
- Ruby (```ruby or ```rb)
- Swift (```swift)
- Kotlin (```kotlin or ```kt)
- SQL (```sql)
- HTML (```html)
- CSS (```css)
- Shell/Bash (```bash or ```sh)
- PowerShell (```powershell)
- And many others.

Use appropriate language identifier tags matching the code's language.
Ensure proper code indentation and formatting.
For multiple code files, use separate code blocks with appropriate language tags.
Provide brief explanations outside code blocks.
Focus on clean, well-formatted, production-ready code.
"""
    
    # Use the generate_stream function for SSE streaming
    return StreamingResponse(
        content=generate_stream(
            prompt=prompt,
            max_tokens=max_tokens,
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

def load_conversations() -> List[dict]:
    """Load all conversations from the JSON file"""
    if not os.path.exists(CONVERSATIONS_FILE):
        print("Conversations file not found, returning empty list")
        return []
    
    try:
        with open(CONVERSATIONS_FILE, 'r') as f:
            print(f"Loading conversations from {CONVERSATIONS_FILE}")
            data = json.load(f)
            print(f"Loaded {len(data)} conversations from file")
            
            # Return the raw data - the frontend expects serialized date strings
            return data
    except Exception as e:
        print(f"Error loading conversations: {e}")
        traceback_str = traceback.format_exc()
        print(traceback_str)
        return []

def save_conversations(conversations: List[dict]) -> None:
    """Save conversations to the JSON file"""
    print(f"Saving {len(conversations)} conversations")
    try:
        # Create backup first
        backup_conversations_file()
        
        # Save the data directly
        with open(CONVERSATIONS_FILE, 'w') as f:
            json.dump(conversations, f, indent=2, default=str)
            
        print(f"Successfully saved {len(conversations)} conversations to {CONVERSATIONS_FILE}")
    except Exception as e:
        print(f"Error saving conversations: {e}")
        traceback_str = traceback.format_exc()
        print(traceback_str)

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

# Modify conversation endpoints to use caching
@app.get("/conversations")
@cache_response()
async def get_conversations():
    conversations = load_conversations()
    return {"conversations": conversations}

@app.get("/conversation/{conversation_id}")
@cache_response()
async def get_conversation(conversation_id: str):
    print(f"Getting conversation with ID: {conversation_id}")
    conversations = load_conversations()
    for conversation in conversations:
        if conversation["id"] == conversation_id:
            print(f"Found conversation {conversation_id} with {len(conversation.get('messages', []))} messages")
            return conversation
    
    print(f"Conversation {conversation_id} not found")
    raise HTTPException(status_code=404, detail="Conversation not found")

@app.post("/conversation")
async def create_conversation(conversation: Conversation):
    print(f"Creating/updating conversation with ID: {conversation.id}")
    conversations = load_conversations()
    
    # Convert the Pydantic model to a dict for json serialization
    conversation_dict = json.loads(json.dumps(conversation.dict(), default=str))
    print(f"Conversation has {len(conversation_dict.get('messages', []))} messages")
    
    # If conversation already exists, update it
    for i, existing_conversation in enumerate(conversations):
        if existing_conversation["id"] == conversation_dict["id"]:
            print(f"Updating existing conversation {conversation_dict['id']}")
            conversations[i] = conversation_dict
            save_conversations(conversations)
            
            # Invalidate cache for this conversation
            invalidate_conversation_cache(conversation_dict["id"])
            
            return {"message": f"Conversation {conversation_dict['id']} updated"}
    
    # Otherwise add as new conversation
    print(f"Adding new conversation {conversation_dict['id']}")
    conversations.append(conversation_dict)
    save_conversations(conversations)
    
    # Invalidate cache 
    invalidate_conversation_cache()
    
    return {"message": f"Conversation {conversation_dict['id']} created"}

@app.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str):
    conversations = load_conversations()
    initial_length = len(conversations)
    
    conversations = [conv for conv in conversations if conv["id"] != conversation_id]
    
    if len(conversations) < initial_length:
        save_conversations(conversations)
        
        # Invalidate cache for this conversation
        invalidate_conversation_cache(conversation_id)
        
        return {"message": f"Conversation {conversation_id} deleted"}
    else:
        raise HTTPException(status_code=404, detail="Conversation not found")

@app.get("/active-conversation")
@cache_response()
async def get_active_conversation():
    active_id = load_active_conversation()
    return {"id": active_id}

@app.post("/active-conversation/{conversation_id}")
async def set_active_conversation(conversation_id: str):
    save_active_conversation(conversation_id)
    
    # Invalidate cache
    invalidate_conversation_cache()
    
    return {"message": f"Active conversation set to {conversation_id}"}

@app.delete("/conversations")
async def clear_all_conversations():
    save_conversations([])
    save_active_conversation(None)
    
    # Invalidate entire cache
    invalidate_conversation_cache()
    
    return {"message": "All conversations cleared"}

# Add a new endpoint for self-destructing conversations
class SelfDestructRequest(BaseModel):
    selfDestructIds: List[str]

@app.post("/cleanup-self-destruct")
async def cleanup_self_destruct(request: SelfDestructRequest):
    if not request.selfDestructIds or len(request.selfDestructIds) == 0:
        return {"success": True, "message": "No conversations to delete"}
    
    print(f"Received cleanup request for {len(request.selfDestructIds)} self-destructing conversations")
    
    # Delete each conversation
    deleted_count = 0
    for conversation_id in request.selfDestructIds:
        try:
            # Get all conversations
            conversations = load_conversations()
            initial_length = len(conversations)
            
            # Filter out the conversation to delete
            conversations = [conv for conv in conversations if conv["id"] != conversation_id]
            
            if len(conversations) < initial_length:
                save_conversations(conversations)
                deleted_count += 1
                print(f"Deleted self-destructing conversation: {conversation_id}")
                
                # Invalidate cache for this conversation
                invalidate_conversation_cache(conversation_id)
        except Exception as e:
            print(f"Error deleting conversation {conversation_id}: {e}")
    
    # Also clear the active conversation if it was one of the deleted ones
    try:
        active_id = load_active_conversation()
        if active_id and active_id in request.selfDestructIds:
            save_active_conversation("")
            print("Reset active conversation since it was self-destructed")
    except Exception as e:
        print(f"Error clearing active conversation: {e}")
    
    return {
        "success": True,
        "message": f"Deleted {deleted_count} self-destructing conversations"
    }

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
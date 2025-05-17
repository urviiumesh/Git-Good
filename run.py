from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_cpp import Llama
import threading, os
import time
import traceback
import asyncio

# ----------------------------
# MODEL LOADING
# ----------------------------
text_llm_path = r"models/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
# Check if the file exists
if not os.path.exists(text_llm_path):
    raise FileNotFoundError(f"Model file not found: {text_llm_path}")

print(f"Loading model from: {text_llm_path}")

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
                total_tokens += 1
                
                # Send token to client with proper SSE format
                yield f"data: {token}\n\n"
                
                # Add a small delay to help with client-side rendering
                time.sleep(0.01)
            
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
        prompt = f"{request.prompt}\n The output should only be in elaborate and accurate code \n"
    
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
        prompt = f"{request.prompt}\n The output should only be in elaborate and accurate code \n"
    
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

class ModelSwitchRequest(BaseModel):
    model_type: str  # "text" or "code"

@app.post("/switch-model")
def switch_model(request: ModelSwitchRequest):
    # Since we only have the text model, just return a message
    return {"message": "Only text model is available currently"} 
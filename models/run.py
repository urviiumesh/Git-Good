from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_cpp import Llama
import threading, os
import time
import traceback

# ----------------------------
# MODEL LOADING
# ----------------------------
text_llm_path = r"mistral-7b-instruct-v0.1.Q4_K_M.gguf"
code_llm_path = r"codellama-7b-instruct.Q4_K_M.gguf"

# Check if the model files exist
if not os.path.exists(text_llm_path):
    raise FileNotFoundError(f"Text model file not found: {text_llm_path}")
if not os.path.exists(code_llm_path):
    raise FileNotFoundError(f"Code model file not found: {code_llm_path}")

print(f"Text model path: {text_llm_path}")
print(f"Code model path: {code_llm_path}")

# Model configuration - balanced for performance and response time
model_config = {
    "n_ctx": 4096,
    "n_threads": 6,  # Increased from 4 to provide more processing power
    "n_batch": 512,
    "n_gpu_layers": 0,
    "use_mmap": True,
    "use_mlock": False,
    "verbose": False
}

# Create a lock for thread-safe model switching
model_lock = threading.Lock()

# Current active model type - initialized as text
current_model_type = "text"

# Initialize with text model
try:
    print(f"Loading text model from: {text_llm_path}")
    llm = Llama(
        model_path=text_llm_path,
        **model_config
    )
    print("Text model loaded successfully!")
except Exception as e:
    print(f"Error loading text model: {e}")
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

@app.post("/generate")
async def generate_text(request: PromptRequest):
    global llm, current_model_type
    
    print(f"Received prompt: {request.prompt[:50]}...")
    start_time = time.time()
    
    # Make sure word count is reasonable
    word_count = min(request.word_count, 100)
    
    # Use different prompt formats based on model type
    if current_model_type == "text":
        prompt = f"Answer the following question in a direct, concise manner using about {word_count} words: {request.prompt}"
    else:  # code model
        prompt = f"Write code to solve the following problem: {request.prompt}\nProvide only code, no explanations."
    
    estimated_tokens = int(word_count * 2)  # Increased token limit for more complex questions
    
    try:
        print(f"Starting inference with {current_model_type} model...")
        # Non-streaming approach for reliability
        with model_lock:
            result = llm(
                prompt=prompt,
                max_tokens=estimated_tokens,
                temperature=0.5,  # Reduced from 0.7 for more focused responses
                top_k=40,
                top_p=0.9,
                repeat_penalty=1.1,
                stop=["</s>", "User:", "###"],
                echo=False
            )
        
        response_text = result["choices"][0]["text"]
        end_time = time.time()
        print(f"Generated response in {end_time - start_time:.2f} seconds: {response_text[:50]}...")
        
        # Return plain text response
        return PlainTextResponse(content=response_text)
        
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        print(f"Error type: {type(e)}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": f"Model inference failed: {str(e)}"}
        )

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
            model_path = text_llm_path if model_type == "text" else code_llm_path
            
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

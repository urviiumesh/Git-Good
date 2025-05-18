from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Union
import asyncio
import sys
import os
import logging
from pathlib import Path
import json
import importlib.util
import subprocess
import threading

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("server_debug.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Add gitgoodbackend folder to Python path
sys.path.append(str(Path("gitgoodbackend").absolute()))

# Import agent module functions
try:
    # Import the agent classes directly
    from aventus.agent_software.agent_software import SoftwareEngineerAgent
    from aventus.agent_marketing.agent_marketing import MarketingAgent
    from aventus.agent_cpo.cpo_agent import CPOAgent
    from aventus.agent_accounts.agent_accounts import AccountsAgent
    from aventus.agent_intern.agent_intern import InternAgent
    
    # Initialize agents with correct file paths
    software_agent = SoftwareEngineerAgent(bug_reports_path="gitgoodbackend/aventus/Data/software_engineer_bug_reports.json")
    marketing_agent = MarketingAgent()
    cpo_agent = CPOAgent()
    accounts_agent = AccountsAgent()
    intern_agent = InternAgent()
    
    logger.info("Successfully imported and initialized all agents")
except ImportError as e:
    logger.error(f"Error importing agent modules: {e}")
    logger.error("Make sure gitgoodbackend folder is properly set up with the required agent modules")
    sys.exit(1)

# Set paths to model server
MODEL_SERVER_DIR = Path("models").absolute()
MODEL_SERVER_SCRIPT = "start_server.sh" if os.name != "nt" else "start_server.bat"

# Start the model server if not already running
def start_model_server():
    """Start the model server in the background if not already running"""
    try:
        # Check if the model server is running (simple connection test)
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1)
        result = s.connect_ex(('localhost', 8000))
        s.close()
        
        if result == 0:
            print("Model server is already running")
            return True
        
        # Model server is not running, start it
        print("Starting model server...")
        model_server_path = MODEL_SERVER_DIR / MODEL_SERVER_SCRIPT
        
        if not model_server_path.exists():
            print(f"Model server script not found at {model_server_path}")
            return False
        
        if os.name == "nt":  # Windows
            subprocess.Popen(
                ["cmd", "/c", str(model_server_path)],
                cwd=str(MODEL_SERVER_DIR),
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:  # Unix
            subprocess.Popen(
                ["bash", str(model_server_path)],
                cwd=str(MODEL_SERVER_DIR),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                start_new_session=True
            )
            
        print("Waiting for model server to start...")
        for _ in range(10):  # Try for 10 seconds
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(1)
            result = s.connect_ex(('localhost', 8000))
            s.close()
            if result == 0:
                print("Model server started successfully")
                return True
            asyncio.sleep(1)
        
        print("Timed out waiting for model server to start")
        return False
    except Exception as e:
        print(f"Error starting model server: {e}")
        return False

# Start model server in background thread
threading.Thread(target=start_model_server, daemon=True).start()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Map role names to agent objects
role_to_agent = {
    "software": software_agent,
    "marketing": marketing_agent,
    "cpo": cpo_agent,
    "accounts": accounts_agent,
    "intern": intern_agent,
}

class AgentRequest(BaseModel):
    userMessage: str
    role: str
    userContext: Optional[str] = None
    conversationHistory: Optional[List[Dict[str, str]]] = None

class HealthCheck(BaseModel):
    status: str

@app.get("/api/agents/health", response_model=HealthCheck)
async def health_check():
    try:
        # Check if all agents are initialized
        if all([software_agent, marketing_agent, cpo_agent, accounts_agent, intern_agent]):
            # Test the software agent with a query to debug
            test_result = software_agent.process_query("Show me bugs in the Payment Gateway module")
            print("[HEALTH CHECK DEBUG] Test query result:", test_result[:50] + "..." if len(test_result) > 50 else test_result)
            return {"status": "ok"}
        else:
            return {"status": "agent_initialization_error"}
    except Exception as e:
        return {"status": f"error: {str(e)}"}

@app.post("/api/agents")
async def process_agent_request(request: AgentRequest):
    # Validate role
    if request.role not in role_to_agent:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid role: {request.role}. Valid roles are: {', '.join(role_to_agent.keys())}"
        )

    # Get agent instance
    agent = role_to_agent[request.role]

    # Process conversation history
    history_context = ""
    if request.conversationHistory and len(request.conversationHistory) > 0:
        for msg in request.conversationHistory[-5:]:  # Use last 5 messages for context
            if msg["role"] == "user":
                history_context += f"User: {msg['content']}\n"
            else:
                history_context += f"Assistant: {msg['content']}\n"

    # Combine user context and history
    full_context = ""
    if request.userContext:
        full_context += f"Context: {request.userContext}\n\n"
    if history_context:
        full_context += f"Previous conversation:\n{history_context}\n"

    logger.info(f"Processing request for role '{request.role}' with message: {request.userMessage}")

    async def stream_response():
        try:
            # Use the agent to generate a response
            logger.info(f"Generating response with {request.role} agent...")
            response_text = agent.process_query(request.userMessage)
            logger.info(f"Response generated: {response_text[:100]}...")
            
            # Stream the response token by token
            for char in response_text:
                yield char
                await asyncio.sleep(0.01)  # Small delay to simulate streaming
                
        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            logger.error(error_msg)
            for char in error_msg:
                yield char
                await asyncio.sleep(0.01)

    return StreamingResponse(stream_response(), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 
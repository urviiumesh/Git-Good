import requests
import json
import time

def test_AgenTick_server():
    print("Testing AgenTick Server...")
    
    # First check health endpoint
    try:
        health_response = requests.get("http://localhost:5000/api/agents/health")
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"Health check: {health_data}")
        else:
            print(f"Health check failed with status code: {health_response.status_code}")
            return
    except Exception as e:
        print(f"Error connecting to AgenTick server: {e}")
        return
    
    # Now test a request to the agent
    test_message = "Compare engineer_1@zepto.com and engineer_2@zepto.com"
    
    request_data = {
        "userMessage": test_message,
        "role": "software",
        "conversationHistory": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi, how can I help you?"}
        ]
    }
    
    try:
        print(f"Sending request to agent: {test_message}")
        response = requests.post(
            "http://localhost:5000/api/agents", 
            json=request_data,
            stream=True
        )
        
        if response.status_code == 200:
            print("Response:")
            for chunk in response.iter_content(chunk_size=1):
                if chunk:
                    print(chunk.decode('utf-8'), end='', flush=True)
            print("\n")
        else:
            print(f"Request failed with status code: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error during agent request: {e}")

if __name__ == "__main__":
    test_AgenTick_server() 
#!/bin/bash

echo "Starting LLaMA.cpp FastAPI server..."
echo
echo "Make sure you have Python and required packages installed:"
echo "- fastapi"
echo "- uvicorn"
echo "- llama_cpp_python"
echo
echo "The server will be available at http://localhost:8000"
echo

# Activate the virtual environment if it exists
if [ -f venv/bin/activate ]; then
    source venv/bin/activate
    echo "Activated virtual environment"
else
    echo "No virtual environment found, using system Python"
fi

# Start the server
uvicorn run:app --host 0.0.0.0 --port 8000 --reload

# The script will stop here until the server is terminated
# The following will run after the server is stopped

# Deactivate virtual environment if it was activated
if [ -n "$VIRTUAL_ENV" ]; then
    deactivate
fi 
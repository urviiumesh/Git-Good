#!/bin/bash

# Variables
AgenTick_SERVER_SCRIPT="AgenTick_server.py"

# Create a virtual environment if it doesn't exist
if [ ! -d "AgenTick-env" ]; then
    echo "Creating virtual environment for AgenTick server..."
    python -m venv AgenTick-env
fi

# Activate the virtual environment
source AgenTick-env/bin/activate

# Install required packages
echo "Installing required packages..."
pip install fastapi uvicorn pydantic

# Start the AgenTick server
echo "Starting AgenTick server on port 5000..."
echo "The server will automatically launch the model server if needed."
python $AgenTick_SERVER_SCRIPT 
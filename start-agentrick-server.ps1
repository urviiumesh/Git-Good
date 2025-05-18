# Variables
$AgenTick_SERVER_SCRIPT = "AgenTick_server.py"

# Create a virtual environment if it doesn't exist
if (-not (Test-Path -Path "AgenTick-env")) {
    Write-Host "Creating virtual environment for AgenTick server..."
    python -m venv AgenTick-env
}

# Activate the virtual environment
Write-Host "Activating virtual environment..."
& .\AgenTick-env\Scripts\Activate.ps1

# Install required packages
Write-Host "Installing required packages..."
pip install fastapi uvicorn pydantic

# Start the AgenTick server
Write-Host "Starting AgenTick server on port 5000..."
Write-Host "The server will automatically launch the model server if needed."
python $AgenTick_SERVER_SCRIPT 
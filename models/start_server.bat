@echo off
echo Starting LLaMA.cpp FastAPI server...
echo.
echo Make sure you have Python and required packages installed:
echo - fastapi
echo - uvicorn
echo - llama_cpp_python
echo.
echo The server will be available at http://localhost:8000
echo.

REM Activate the virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo Activated virtual environment
) else (
    echo No virtual environment found, using system Python
)

REM Start the server
uvicorn run:app --host 0.0.0.0 --port 8000 --reload

REM Deactivate the virtual environment when done
if exist venv\Scripts\deactivate.bat (
    call venv\Scripts\deactivate.bat
) 
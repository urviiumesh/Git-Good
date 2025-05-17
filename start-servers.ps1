# PowerShell script to start both the model server and the sequential thinking server

Write-Host "=======================================================" -ForegroundColor Yellow
Write-Host "Starting Sequential Thinking Server..." -ForegroundColor Cyan
Write-Host "This server handles step-by-step problem solving." -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command npm run thinking-server"

Write-Host "Waiting for Sequential Thinking Server to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host "=======================================================" -ForegroundColor Yellow
Write-Host "Starting Model Server..." -ForegroundColor Green
Write-Host "This server handles the core language model processing." -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command python run.py"

Write-Host "Waiting for Model Server to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host "=======================================================" -ForegroundColor Yellow
Write-Host "Starting development server..." -ForegroundColor Magenta
Write-Host "This will start the web interface." -ForegroundColor Magenta
Write-Host "=======================================================" -ForegroundColor Yellow
npm run dev 
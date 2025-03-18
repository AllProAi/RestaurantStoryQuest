# PowerShell script to start the Restaurant Story Quest application
# This script sets environment variables and runs the application

# Set environment variables
$env:NODE_ENV = "production"

# Verify the dist folder exists
if (-not (Test-Path -Path "dist")) {
    Write-Host "dist folder not found. Running build first..." -ForegroundColor Yellow
    npm run build
}

# Check if dist/index.js exists
if (-not (Test-Path -Path "dist/index.js")) {
    Write-Host "dist/index.js not found even after build. There might be a build error." -ForegroundColor Red
    exit 1
}

# Start the application
Write-Host "Starting application in production mode..." -ForegroundColor Green
node dist/index.js 
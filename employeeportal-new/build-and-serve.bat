@echo off
echo Building and serving EdgeTech Employee Portal...
cd /d "%~dp0"

REM Set environment variables

REM Build the app
echo Building React app...
npm run build

REM Run the server
echo Starting server...
node simple-server.js 
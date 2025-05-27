@echo off
echo Building and serving EdgeTech Employee Portal...
cd /d "%~dp0"

REM Set environment variables
set PATH=D:\node;%PATH%

REM Build the app
echo Building React app...
D:\node\node.exe D:\node\node_modules\npm\bin\npm-cli.js run build

REM Run the server
echo Starting server...
D:\node\node.exe simple-server.js 
@echo off
echo Starting EdgeTech Employee Portal directly...
cd /d "%~dp0"

REM Set environment variables
set PORT=3003
set BROWSER=none
set NODE_PATH=D:\node

REM Launch react-scripts directly
D:\node\node.exe "%~dp0\node_modules\react-scripts\bin\react-scripts.js" start 
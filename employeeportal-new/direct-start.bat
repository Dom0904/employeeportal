@echo off
echo Starting EdgeTech Employee Portal (Direct mode)...
cd /d "%~dp0"

REM Set environment variables
set PORT=3003
set BROWSER=none

node "%~dp0\node_modules\react-scripts\bin\react-scripts.js" start 
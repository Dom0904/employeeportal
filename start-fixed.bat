@echo off
echo Starting EdgeTech Employee Portal...
cd /d "%~dp0"

REM Set node directory in PATH environment variable
set PATH=%~dp0;D:\node;%PATH%

REM Set NODE_SKIP_PLATFORM_CHECK to bypass any platform issues
set NODE_SKIP_PLATFORM_CHECK=1

REM Set a fixed port
set PORT=3003

REM Define node and npm paths
set NODE_EXE=D:\node\node.exe
set NPM_CLI=D:\node\node_modules\npm\bin\npm-cli.js

echo Running React application...
call %NODE_EXE% %NPM_CLI% start 
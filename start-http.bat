@echo off
echo Starting EdgeTech Employee Portal (HTTP mode)...
cd /d "%~dp0"
set PATH=D:\node;%PATH%
set HTTPS=false
set PORT=3002
D:\node\node.exe D:\node\node_modules\npm\bin\npm-cli.js start 
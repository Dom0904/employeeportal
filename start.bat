@echo off
echo Starting EdgeTech Employee Portal...
cd /d "%~dp0"
set PATH=D:\node;%PATH%
D:\node\node.exe D:\node\node_modules\npm\bin\npm-cli.js start 
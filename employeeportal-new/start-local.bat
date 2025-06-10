@echo off
echo Starting EdgeTech Employee Portal...
cd /d "%~dp0"
set PORT=3002
npm run dev -- --hostname localhost 
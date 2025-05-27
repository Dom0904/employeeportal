@echo off
REM Kill any process on port 3003
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do taskkill /F /PID %%a

REM Show local IP
ipconfig | findstr /i "IPv4"
echo.
echo Access the application at: http://[YOUR-IP-ADDRESS]:3003
cd /d "%~dp0"
set PATH=%PATH%;D:\node\
D:\node\node.exe D:\node\node_modules\npm\bin\npm-cli.js start || pause
pause 
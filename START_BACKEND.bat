@echo off
echo Stopping any existing backend...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *main.py*" 2>nul

timeout /t 2 /nobreak > nul

echo Starting MiniView Backend...
cd backend
python main.py
pause

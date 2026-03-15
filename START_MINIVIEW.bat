@echo off
echo ========================================
echo    Starting MiniView Platform
echo ========================================
echo.

echo [1/3] Killing any existing processes...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo [2/3] Starting Backend Server (with Dukascopy data)...
start "MiniView Backend" cmd /k "cd /d %~dp0backend && python setup_and_start.py"

timeout /t 5 /nobreak > nul

echo.
echo [3/3] Starting Frontend...
start "MiniView Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   MiniView is starting!
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo.
echo   Two windows will open.
echo   Keep them running.
echo ========================================
echo.
pause

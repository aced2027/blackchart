@echo off
echo ========================================
echo    MiniView - Trading Platform
echo ========================================
echo.
echo Starting Backend Server...
echo.

start "MiniView Backend" cmd /k "cd backend && python main.py"

timeout /t 3 /nobreak > nul

echo.
echo Backend started! Opening frontend...
echo.

start "MiniView Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo Both servers are starting!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Close this window when done.
echo ========================================
pause

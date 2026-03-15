@echo off
echo Setting up Mini Trading Platform...
echo.

echo [1/4] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Backend installation failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Creating .env file...
if not exist .env (
    copy .env.example .env
    echo Please edit backend\.env with your OANDA API credentials
)

cd ..

echo.
echo [3/4] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Frontend installation failed!
    pause
    exit /b 1
)

cd ..

echo.
echo [4/4] Setup complete!
echo.
echo To run the platform:
echo   1. Start backend:  cd backend ^&^& python main.py
echo   2. Start frontend: cd frontend ^&^& npm start
echo.
pause

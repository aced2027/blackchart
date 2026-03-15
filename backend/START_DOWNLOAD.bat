@echo off
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║         ORGANIZED TICK DATA DOWNLOAD                             ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo Choose download option:
echo.
echo 1. Download ALL years (2020-2026) - 10-15 hours
echo 2. Download single year (specify year)
echo 3. Check current status
echo 4. Exit
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Starting download of ALL years...
    python download_organized_by_year.py
) else if "%choice%"=="2" (
    set /p year="Enter year (2020-2026): "
    echo.
    echo Downloading year %year%...
    python download_single_year.py %year%
) else if "%choice%"=="3" (
    python check_organized_status.py
    pause
) else (
    echo Exiting...
)

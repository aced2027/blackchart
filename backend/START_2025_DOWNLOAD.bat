@echo off
echo ================================================================================
echo                          2025 TICK DATA DOWNLOADER
echo ================================================================================
echo.
echo This will download all 12 months of 2025 EURUSD tick data from Dukascopy
echo Data will be stored in: data/ticks/2025/
echo.
echo Press any key to start download, or Ctrl+C to cancel...
pause >nul
echo.

python download_2025_complete.py

echo.
echo ================================================================================
echo                               DOWNLOAD COMPLETE
echo ================================================================================
echo.
echo Next steps:
echo 1. Run: python generate_from_organized_ticks.py
echo 2. Restart the backend server
echo 3. Refresh the frontend to see 2025 data
echo.
pause
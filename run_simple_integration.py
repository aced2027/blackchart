#!/usr/bin/env python3
"""
Master Integration Script - Simple Version
Complete setup for tick data -> candlestick chart system
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path

def print_banner():
    print("=" * 80)
    print("MASTER TICK DATA -> JAPANESE CANDLESTICK CHART")
    print("   Complete Integration Setup (2021-2026 Historical Data)")
    print("=" * 80)

def check_dependencies():
    """Check if required Python packages are installed"""
    required = ["requests", "pandas", "fastapi", "uvicorn"]
    missing = []
    
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"Missing packages: {', '.join(missing)}")
        print("Installing missing packages...")
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing)
        print("Dependencies installed")
    else:
        print("All dependencies satisfied")

def start_backend_server():
    """Start the FastAPI backend server"""
    print("\nSTEP 2: Starting Backend Server")
    print("-" * 50)
    
    try:
        # Change to backend directory
        os.chdir("backend")
        
        print("Starting FastAPI server on http://localhost:8001...")
        
        # Start server in background
        process = subprocess.Popen([
            sys.executable, "-m", "uvicorn", "main:app", 
            "--host", "0.0.0.0", "--port", "8001", "--reload"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a moment for server to start
        time.sleep(3)
        
        # Check if server is running
        if process.poll() is None:
            print("Backend server started successfully")
            print("API available at: http://localhost:8001")
            print("API docs at: http://localhost:8001/docs")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"Server failed to start: {stderr.decode()}")
            return None
            
    except Exception as e:
        print(f"Error starting backend: {e}")
        return None
    finally:
        # Return to original directory
        os.chdir("..")

def open_chart():
    """Open the master candlestick chart in browser"""
    print("\nSTEP 3: Opening Master Chart")
    print("-" * 50)
    
    chart_file = Path("master_tick_candlestick_chart.html").absolute()
    
    if chart_file.exists():
        print(f"Opening chart: {chart_file}")
        webbrowser.open(f"file://{chart_file}")
        print("Chart opened in browser")
        return True
    else:
        print(f"Chart file not found: {chart_file}")
        return False

def print_usage_instructions():
    """Print usage instructions"""
    print("\nUSAGE INSTRUCTIONS")
    print("=" * 80)
    print("1. Chart is now open in your browser")
    print("2. Click 'Backend Integration' button")
    print("3. Change backend URL to: http://localhost:8001")
    print("4. Click 'Test Connection' (should show Connected)")
    print("5. Click 'Load Data' to fetch historical data")
    print("6. Select different symbols: EURUSD, BTCUSDT, ETHUSDT, etc.")
    print("7. Switch timeframes: 1m, 5m, 15m, 1h, 4h, 1d")
    print("8. Interact with chart:")
    print("   • Mouse wheel: Zoom in/out")
    print("   • Click + drag: Pan left/right")
    print("   • Hover: See OHLCV tooltip")
    print("\nFEATURES:")
    print("   • 60fps Canvas rendering")
    print("   • Multiple data sources (Binance, Alpha Vantage, Yahoo, CSV)")
    print("   • Real-time tick aggregation")
    print("   • TradingView-style interface")
    print("   • Zero external dependencies")

def main():
    print_banner()
    
    # Step 0: Check dependencies
    print("\nSTEP 0: Checking Dependencies")
    print("-" * 50)
    check_dependencies()
    
    # Step 2: Start backend server
    server_process = start_backend_server()
    
    if server_process is None:
        print("Backend failed to start, chart will use simulation mode")
    
    # Step 3: Open chart
    if not open_chart():
        print("Failed to open chart")
        return
    
    # Print instructions
    print_usage_instructions()
    
    # Keep script running
    try:
        print("\nSystem running... Press Ctrl+C to stop")
        print("Backend logs:")
        print("-" * 30)
        
        if server_process:
            # Stream server output
            while True:
                output = server_process.stdout.readline()
                if output:
                    print(output.decode().strip())
                elif server_process.poll() is not None:
                    break
                time.sleep(0.1)
        else:
            # Just wait if no server
            while True:
                time.sleep(1)
                
    except KeyboardInterrupt:
        print("\n\nShutting down...")
        if server_process:
            server_process.terminate()
            server_process.wait()
        print("Shutdown complete")

if __name__ == "__main__":
    main()
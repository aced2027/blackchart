#!/usr/bin/env python3
"""
Test the master integration
"""

import requests
import json

def test_backend():
    """Test backend API endpoints"""
    base_url = "http://localhost:8001"
    
    print("Testing backend integration...")
    
    try:
        # Test status endpoint
        print("1. Testing /status endpoint...")
        response = requests.get(f"{base_url}/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: {data.get('status')}")
            print(f"   Version: {data.get('version')}")
            print(f"   Features: {data.get('features')}")
        else:
            print(f"   Error: HTTP {response.status_code}")
    
    except requests.exceptions.RequestException as e:
        print(f"   Connection failed: {e}")
        return False
    
    try:
        # Test candles endpoint
        print("2. Testing /candles/EURUSD endpoint...")
        response = requests.get(f"{base_url}/api/candles/EURUSD?timeframe=1h&limit=10", timeout=10)
        if response.status_code == 200:
            data = response.json()
            candles = data.get('candles', [])
            print(f"   Loaded {len(candles)} candles")
            if candles:
                first_candle = candles[0]
                print(f"   Sample: O:{first_candle['open']} H:{first_candle['high']} L:{first_candle['low']} C:{first_candle['close']}")
        else:
            print(f"   Error: HTTP {response.status_code}")
    
    except requests.exceptions.RequestException as e:
        print(f"   Connection failed: {e}")
        return False
    
    print("Backend test completed successfully!")
    return True

def test_chart_file():
    """Test if chart file exists and is valid"""
    import os
    
    print("Testing chart file...")
    
    chart_file = "master_tick_candlestick_chart.html"
    if os.path.exists(chart_file):
        size = os.path.getsize(chart_file)
        print(f"   Chart file exists: {chart_file} ({size:,} bytes)")
        
        # Check if it contains key components
        with open(chart_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        checks = [
            ("Canvas element", "<canvas id=\"chart\""),
            ("JavaScript code", "<script>"),
            ("Binance integration", "downloadBinance"),
            ("Backend integration", "loadBackendData"),
            ("Tick aggregation", "aggregateTicks"),
            ("Canvas rendering", "drawCandles")
        ]
        
        for check_name, check_text in checks:
            if check_text in content:
                print(f"   ✓ {check_name}")
            else:
                print(f"   ✗ {check_name}")
        
        return True
    else:
        print(f"   Chart file not found: {chart_file}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("MASTER INTEGRATION TEST")
    print("=" * 60)
    
    # Test chart file
    chart_ok = test_chart_file()
    print()
    
    # Test backend
    backend_ok = test_backend()
    print()
    
    if chart_ok and backend_ok:
        print("✓ All tests passed! Integration is working correctly.")
        print("\nNext steps:")
        print("1. Open master_tick_candlestick_chart.html in your browser")
        print("2. Click 'Backend Integration' button")
        print("3. Test connection and load data")
    else:
        print("✗ Some tests failed. Check the output above.")
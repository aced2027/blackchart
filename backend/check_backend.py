"""
Quick Backend Health Check
Run this to verify everything is working
"""
import requests
import json

print("=" * 50)
print("MiniView Backend Health Check")
print("=" * 50)

# Test 1: Backend is running
print("\n1. Testing backend connection...")
try:
    response = requests.get("http://localhost:8000", timeout=5)
    if response.status_code == 200:
        print("✓ Backend is running!")
        data = response.json()
        print(f"  Service: {data.get('service')}")
        print(f"  Status: {data.get('status')}")
    else:
        print(f"✗ Backend returned status {response.status_code}")
except requests.exceptions.ConnectionError:
    print("✗ Backend is NOT running!")
    print("  Start it with: python main.py")
    exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

# Test 2: Can fetch candles
print("\n2. Testing candle data endpoint...")
try:
    response = requests.get(
        "http://localhost:8000/api/candles/EUR_USD?timeframe=1h&limit=10",
        timeout=10
    )
    if response.status_code == 200:
        data = response.json()
        candles = data.get('data', [])
        print(f"✓ Received {len(candles)} candles")
        if candles:
            latest = candles[-1]
            print(f"  Latest candle:")
            print(f"    Time: {latest['time']}")
            print(f"    Open: {latest['open']}")
            print(f"    Close: {latest['close']}")
    else:
        print(f"✗ Failed with status {response.status_code}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 3: WebSocket
print("\n3. Testing WebSocket...")
print("  WebSocket endpoint: ws://localhost:8000/ws/prices/EUR_USD")
print("  (Can't test from Python easily, check browser console)")

print("\n" + "=" * 50)
print("Health Check Complete!")
print("=" * 50)
print("\nIf all tests passed, your backend is ready!")
print("Start frontend with: cd ../frontend && npm start")

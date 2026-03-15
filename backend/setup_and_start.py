"""
Setup Dukascopy data and start the backend server
"""
import os
import sys

print("="*60)
print("MINIVIEW - DUKASCOPY SETUP & START")
print("="*60)

# Step 1: Check if data exists
print("\n1️⃣ Checking for existing data...")
data_exists = os.path.exists("data/eurusd_ticks.csv")

if data_exists:
    print("✅ Tick data found")
    print("✅ Candle data will be generated on-demand")
else:
    print("📥 No data found - downloading from Dukascopy...")
    print("   This will take about 30-60 seconds...")
    
    from data_downloader.download_ticks import download_dukascopy_ticks
    from data_downloader.generate_candles import generate_candles_from_ticks
    
    # Download ticks
    tick_df = download_dukascopy_ticks("EURUSD", days_back=7)
    
    if tick_df is not None and len(tick_df) > 0:
        print(f"✅ Downloaded {len(tick_df)} ticks")
        
        # Generate common timeframes
        print("\n2️⃣ Generating candles...")
        for tf in ['1min', '5min', '15min', '1h']:
            candles_df = generate_candles_from_ticks("data/eurusd_ticks.csv", timeframe=tf)
            if candles_df is not None:
                print(f"✅ Generated {len(candles_df)} {tf} candles")
    else:
        print("❌ Failed to download data")
        print("⚠️  Backend will use mock data")

print("\n" + "="*60)
print("3️⃣ Starting FastAPI backend...")
print("="*60)
print("\n📌 Backend will be available at: http://localhost:8000")
print("📌 API docs at: http://localhost:8000/docs")
print("📌 Press CTRL+C to stop\n")

# Start the server
import uvicorn
uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

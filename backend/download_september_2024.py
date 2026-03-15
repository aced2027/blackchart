"""
Download September 2024 specifically
"""
import asyncio
from datetime import datetime
import os

try:
    from tick_vault import download_range, read_tick_data
    import pandas as pd
except ImportError:
    print("❌ tick-vault not installed")
    exit(1)

os.makedirs("data", exist_ok=True)

async def download_september_2024():
    """Download September 2024 tick data"""
    print("="*70)
    print("DOWNLOADING SEPTEMBER 2024")
    print("="*70)
    
    symbol = "EURUSD"
    start = datetime(2024, 9, 1)
    end = datetime(2024, 10, 1)
    
    print(f"\n📥 Downloading {symbol} September 2024...")
    print(f"   From: {start}")
    print(f"   To: {end}\n")
    
    try:
        # Download
        await download_range(symbol, start, end)
        
        # Read
        df = read_tick_data(symbol, start=start, end=end, strict=False)
        
        if df is not None and len(df) > 0:
            # Save
            filename = "data/eurusd_ticks_2024-09.csv"
            df.to_csv(filename, index=False)
            
            size_mb = os.path.getsize(filename) / (1024 * 1024)
            
            print(f"\n✅ SUCCESS!")
            print(f"   File: {filename}")
            print(f"   Ticks: {len(df):,}")
            print(f"   Size: {size_mb:.2f} MB")
            print("="*70)
        else:
            print("\n⚠️  No data available for September 2024")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(download_september_2024())

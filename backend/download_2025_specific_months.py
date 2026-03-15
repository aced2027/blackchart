"""
Download specific months of 2025
Usage: python download_2025_specific_months.py 1 2 3 9
"""
import asyncio
from datetime import datetime
import sys
import os

try:
    from tick_vault import download_range, read_tick_data
    import pandas as pd
except ImportError:
    print("❌ tick-vault not installed")
    sys.exit(1)

os.makedirs("data", exist_ok=True)

async def download_month(symbol, year, month):
    """Download one month"""
    if month == 12:
        start = datetime(year, month, 1)
        end = datetime(year + 1, 1, 1)
    else:
        start = datetime(year, month, 1)
        end = datetime(year, month + 1, 1)
    
    month_str = f"{year}-{month:02d}"
    month_name = start.strftime("%B")
    
    print(f"\n📥 Downloading {month_name} {year}...")
    
    try:
        await download_range(symbol, start, end)
        df = read_tick_data(symbol, start=start, end=end, strict=False)
        
        if df is not None and len(df) > 0:
            filename = f"data/{symbol.lower()}_ticks_{month_str}.csv"
            df.to_csv(filename, index=False)
            size_mb = os.path.getsize(filename) / (1024 * 1024)
            
            print(f"✅ {month_name}: {len(df):,} ticks ({size_mb:.2f} MB)")
            return True
        else:
            print(f"⚠️  {month_name}: No data")
            return False
    except Exception as e:
        print(f"❌ {month_name}: Error - {e}")
        return False

async def main():
    """Download specific months"""
    symbol = "EURUSD"
    year = 2025
    
    # Get months from command line or use all
    if len(sys.argv) > 1:
        months = [int(m) for m in sys.argv[1:]]
    else:
        months = list(range(1, 13))
    
    print(f"\n{'='*70}")
    print(f"DOWNLOADING {year} - SPECIFIC MONTHS")
    print(f"{'='*70}")
    print(f"Months to download: {months}")
    print(f"{'='*70}\n")
    
    success = 0
    for month in months:
        if await download_month(symbol, year, month):
            success += 1
        await asyncio.sleep(0.5)
    
    print(f"\n{'='*70}")
    print(f"✅ Complete: {success}/{len(months)} months")
    print(f"{'='*70}")

if __name__ == "__main__":
    asyncio.run(main())

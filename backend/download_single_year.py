"""
Download a single year of tick data
Usage: python download_single_year.py 2025
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

async def download_month(symbol, year, month):
    """Download one month"""
    year_folder = f"data/ticks/{year}"
    os.makedirs(year_folder, exist_ok=True)
    
    if month == 12:
        start = datetime(year, month, 1)
        end = datetime(year + 1, 1, 1)
    else:
        start = datetime(year, month, 1)
        end = datetime(year, month + 1, 1)
    
    month_str = f"{year}-{month:02d}"
    month_name = start.strftime("%B")
    
    print(f"\n📥 {month_name} {year} (Month {month}/12)")
    
    try:
        await download_range(symbol, start, end)
        df = read_tick_data(symbol, start=start, end=end, strict=False)
        
        if df is not None and len(df) > 0:
            filename = f"{year_folder}/{symbol.lower()}_ticks_{month_str}.csv"
            df.to_csv(filename, index=False)
            size_mb = os.path.getsize(filename) / (1024 * 1024)
            
            print(f"   ✅ {len(df):,} ticks ({size_mb:.2f} MB)")
            return len(df), size_mb
        else:
            print(f"   ⚠️  No data")
            return 0, 0
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return 0, 0

async def main():
    """Download single year"""
    if len(sys.argv) < 2:
        print("Usage: python download_single_year.py YEAR")
        print("Example: python download_single_year.py 2025")
        sys.exit(1)
    
    year = int(sys.argv[1])
    symbol = "EURUSD"
    
    print(f"\n{'='*70}")
    print(f"DOWNLOADING {year}")
    print(f"{'='*70}\n")
    
    total_ticks = 0
    total_size = 0
    
    for month in range(1, 13):
        ticks, size = await download_month(symbol, year, month)
        total_ticks += ticks
        total_size += size
        await asyncio.sleep(0.5)
    
    print(f"\n{'='*70}")
    print(f"✅ {year} COMPLETE")
    print(f"   Ticks: {total_ticks:,}")
    print(f"   Size: {total_size:.2f} MB")
    print(f"   Folder: data/ticks/{year}/")
    print(f"{'='*70}")

if __name__ == "__main__":
    asyncio.run(main())

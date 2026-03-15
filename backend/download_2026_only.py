"""
Download 2026 tick data - First 3 months only
January, February, March 2026
Saves to: data/ticks/2026/
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

async def download_month(symbol, year, month):
    """Download one month and save to year folder"""
    year_folder = f"data/ticks/{year}"
    os.makedirs(year_folder, exist_ok=True)
    
    # Date range
    if month == 12:
        start = datetime(year, month, 1)
        end = datetime(year + 1, 1, 1)
    else:
        start = datetime(year, month, 1)
        end = datetime(year, month + 1, 1)
    
    month_str = f"{year}-{month:02d}"
    month_name = start.strftime("%B")
    
    print(f"\n{'='*70}")
    print(f"📥 DOWNLOADING {month_name} {year}")
    print(f"{'='*70}")
    print(f"Date range: {start.strftime('%Y-%m-%d')} to {end.strftime('%Y-%m-%d')}")
    
    try:
        # Download from Dukascopy
        print(f"⏳ Downloading from Dukascopy...")
        await download_range(symbol, start, end)
        
        # Read the downloaded data
        print(f"📖 Reading data...")
        df = read_tick_data(symbol, start=start, end=end, strict=False)
        
        if df is not None and len(df) > 0:
            # Save to year folder
            filename = f"{year_folder}/{symbol.lower()}_ticks_{month_str}.csv"
            df.to_csv(filename, index=False)
            
            size_mb = os.path.getsize(filename) / (1024 * 1024)
            
            print(f"\n✅ SUCCESS!")
            print(f"   File: {filename}")
            print(f"   Ticks: {len(df):,}")
            print(f"   Size: {size_mb:.2f} MB")
            print(f"{'='*70}")
            
            return len(df), size_mb, True
        else:
            print(f"\n⚠️  No data available")
            print(f"{'='*70}")
            return 0, 0, False
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print(f"{'='*70}")
        return 0, 0, False

async def download_2026():
    """Download 2026 data - First 3 months only"""
    symbol = "EURUSD"
    year = 2026
    months = [1, 2, 3]  # January, February, March only
    
    print(f"\n{'='*70}")
    print(f"🚀 DOWNLOADING 2026 - FIRST 3 MONTHS")
    print(f"{'='*70}")
    print(f"Symbol: {symbol}")
    print(f"Year: {year}")
    print(f"Months: January, February, March")
    print(f"Folder: data/ticks/2026/")
    print(f"Estimated time: 20-30 minutes")
    print(f"{'='*70}\n")
    
    start_time = datetime.now()
    
    total_ticks = 0
    total_size = 0
    success_count = 0
    failed_months = []
    
    # Download each month
    for month in months:
        ticks, size, success = await download_month(symbol, year, month)
        
        if success:
            total_ticks += ticks
            total_size += size
            success_count += 1
        else:
            failed_months.append(month)
        
        # Small delay between months
        await asyncio.sleep(0.5)
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds() / 60
    
    # Summary
    print(f"\n{'='*70}")
    print(f"🎉 2026 DOWNLOAD COMPLETE!")
    print(f"{'='*70}")
    print(f"Completed: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Success: {success_count}/3 months")
    print(f"Total ticks: {total_ticks:,}")
    print(f"Total size: {total_size:.2f} MB")
    print(f"Time taken: {duration:.1f} minutes")
    
    if failed_months:
        print(f"\n⚠️  Failed months: {failed_months}")
    
    print(f"\n📁 Files saved to: data/ticks/2026/")
    print(f"{'='*70}\n")
    
    # List files
    print("Files created:")
    for month in months:
        month_str = f"{year}-{month:02d}"
        filename = f"data/ticks/{year}/eurusd_ticks_{month_str}.csv"
        if os.path.exists(filename):
            size = os.path.getsize(filename) / (1024 * 1024)
            print(f"  ✅ {filename} ({size:.2f} MB)")
    
    print(f"\n✅ Next steps:")
    print("1. python check_organized_status.py  # Check status")
    print("2. python generate_candles_fast.py   # Generate candles")
    print("3. python main.py                    # Restart backend")

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════════╗
║         2026 TICK DATA DOWNLOADER                                ║
║         January, February, March 2026                            ║
╚══════════════════════════════════════════════════════════════════╝
""")
    
    asyncio.run(download_2026())

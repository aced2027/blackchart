"""
Download 2025 EURUSD tick data month by month
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
    print("Install with: pip install tick-vault")
    sys.exit(1)

os.makedirs("data", exist_ok=True)

async def download_month(symbol, year, month):
    """Download one month of tick data"""
    if month == 12:
        start = datetime(year, month, 1)
        end = datetime(year + 1, 1, 1)
    else:
        start = datetime(year, month, 1)
        end = datetime(year, month + 1, 1)
    
    month_str = f"{year}-{month:02d}"
    month_name = start.strftime("%B")
    
    print(f"\n{'='*70}")
    print(f"📥 DOWNLOADING {month_name} {year} (Month {month}/12)")
    print(f"{'='*70}")
    print(f"Date range: {start.strftime('%Y-%m-%d')} to {end.strftime('%Y-%m-%d')}")
    
    try:
        # Download from Dukascopy
        print(f"⏳ Downloading from Dukascopy...")
        await download_range(symbol, start, end)
        
        # Read the downloaded data
        print(f"📖 Reading downloaded data...")
        df = read_tick_data(symbol, start=start, end=end, strict=False)
        
        if df is not None and len(df) > 0:
            # Save to monthly file
            filename = f"data/{symbol.lower()}_ticks_{month_str}.csv"
            df.to_csv(filename, index=False)
            
            size_mb = os.path.getsize(filename) / (1024 * 1024)
            
            print(f"\n✅ SUCCESS!")
            print(f"   File: {filename}")
            print(f"   Ticks: {len(df):,}")
            print(f"   Size: {size_mb:.2f} MB")
            print(f"{'='*70}")
            
            return len(df), size_mb, True
        else:
            print(f"\n⚠️  No data available for {month_name} {year}")
            print(f"{'='*70}")
            return 0, 0, False
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print(f"{'='*70}")
        return 0, 0, False

async def download_2025():
    """Download all 12 months of 2025"""
    symbol = "EURUSD"
    year = 2025
    
    print(f"\n{'='*70}")
    print(f"🚀 DOWNLOADING {year} TICK DATA")
    print(f"{'='*70}")
    print(f"Symbol: {symbol}")
    print(f"Months: 12 (January - December)")
    print(f"Estimated time: 1.5-2.5 hours")
    print(f"{'='*70}\n")
    
    start_time = datetime.now()
    
    total_ticks = 0
    total_size = 0
    success_count = 0
    failed_months = []
    
    # Download each month
    for month in range(1, 13):
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
    print(f"🎉 {year} DOWNLOAD COMPLETE!")
    print(f"{'='*70}")
    print(f"Completed: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Success: {success_count}/12 months")
    print(f"Total ticks: {total_ticks:,}")
    print(f"Total size: {total_size:.2f} MB ({total_size/1024:.2f} GB)")
    print(f"Time taken: {duration:.1f} minutes ({duration/60:.1f} hours)")
    
    if failed_months:
        print(f"\n⚠️  Failed months: {failed_months}")
    
    print(f"{'='*70}\n")
    
    print("✅ Next steps:")
    print("1. python secure_data_manager.py  # Organize by year")
    print("2. python generate_candles_fast.py  # Generate candles")
    print("3. python main.py  # Restart backend")

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════════╗
║         2025 TICK DATA DOWNLOADER                                ║
║         Month by Month Download                                  ║
╚══════════════════════════════════════════════════════════════════╝
""")
    
    asyncio.run(download_2025())

"""
AUTO DOWNLOAD - No confirmation required
Downloads all missing years automatically
"""
import asyncio
from datetime import datetime
import sys
import os

try:
    from tick_vault import download_range, read_tick_data
    import pandas as pd
    TICK_VAULT_AVAILABLE = True
except ImportError:
    print("❌ tick-vault not installed")
    print("Install with: pip install tick-vault")
    sys.exit(1)

# Create data directory
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
    print(f"\n📥 [{datetime.now().strftime('%H:%M:%S')}] Downloading {month_str}...")
    
    try:
        # Download from Dukascopy
        await download_range(symbol, start, end)
        
        # Read the downloaded data
        df = read_tick_data(symbol, start=start, end=end, strict=False)
        
        if df is not None and len(df) > 0:
            # Save to monthly file
            filename = f"data/{symbol.lower()}_ticks_{month_str}.csv"
            df.to_csv(filename, index=False)
            
            size_mb = os.path.getsize(filename) / (1024 * 1024)
            print(f"✅ {month_str}: {len(df):,} ticks ({size_mb:.2f} MB)")
            return len(df), size_mb
        else:
            print(f"⚠️  {month_str}: No data available")
            return 0, 0
            
    except Exception as e:
        print(f"❌ {month_str}: Error - {e}")
        return 0, 0

async def download_year(symbol, year):
    """Download all 12 months for a year"""
    print(f"\n{'='*70}")
    print(f"📅 YEAR {year} - STARTING")
    print(f"{'='*70}")
    
    total_ticks = 0
    total_size = 0
    success_count = 0
    
    for month in range(1, 13):
        ticks, size = await download_month(symbol, year, month)
        if ticks > 0:
            total_ticks += ticks
            total_size += size
            success_count += 1
        
        await asyncio.sleep(0.5)
    
    print(f"\n{'='*70}")
    print(f"✅ {year} COMPLETE: {success_count}/12 months")
    print(f"   Total ticks: {total_ticks:,}")
    print(f"   Total size: {total_size:.2f} MB")
    print(f"{'='*70}")
    
    return total_ticks, total_size, success_count

async def main():
    """Main download function"""
    symbol = "EURUSD"
    years = [2020, 2021, 2022, 2023]
    
    print(f"\n{'='*70}")
    print(f"🚀 AUTO DOWNLOAD STARTED")
    print(f"{'='*70}")
    print(f"Symbol: {symbol}")
    print(f"Years: {years}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}\n")
    
    start_time = datetime.now()
    
    grand_total_ticks = 0
    grand_total_size = 0
    grand_total_months = 0
    
    for year in years:
        ticks, size, months = await download_year(symbol, year)
        grand_total_ticks += ticks
        grand_total_size += size
        grand_total_months += months
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds() / 60
    
    print(f"\n{'='*70}")
    print(f"🎉 ALL DOWNLOADS COMPLETE!")
    print(f"{'='*70}")
    print(f"Completed: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total months: {grand_total_months}/{len(years)*12}")
    print(f"Total ticks: {grand_total_ticks:,}")
    print(f"Total size: {grand_total_size:.2f} MB ({grand_total_size/1024:.2f} GB)")
    print(f"Time taken: {duration:.1f} minutes ({duration/60:.1f} hours)")
    print(f"{'='*70}\n")
    
    print("✅ Next steps:")
    print("1. python secure_data_manager.py")
    print("2. python generate_candles_fast.py")

if __name__ == "__main__":
    asyncio.run(main())

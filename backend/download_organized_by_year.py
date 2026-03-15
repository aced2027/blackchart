"""
Download tick data organized by year
Saves each month in its respective year folder
Structure: data/ticks/YYYY/eurusd_ticks_YYYY-MM.csv
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
    """Download one month and save to year folder"""
    # Create year folder
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
    print(f"📥 {year} - {month_name} (Month {month}/12)")
    print(f"{'='*70}")
    
    try:
        # Download
        print(f"⏳ Downloading from Dukascopy...")
        await download_range(symbol, start, end)
        
        # Read
        print(f"📖 Reading data...")
        df = read_tick_data(symbol, start=start, end=end, strict=False)
        
        if df is not None and len(df) > 0:
            # Save to year folder
            filename = f"{year_folder}/{symbol.lower()}_ticks_{month_str}.csv"
            df.to_csv(filename, index=False)
            
            size_mb = os.path.getsize(filename) / (1024 * 1024)
            
            print(f"✅ SUCCESS!")
            print(f"   File: {filename}")
            print(f"   Ticks: {len(df):,}")
            print(f"   Size: {size_mb:.2f} MB")
            
            return len(df), size_mb, True
        else:
            print(f"⚠️  No data available")
            return 0, 0, False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return 0, 0, False

async def download_year(symbol, year):
    """Download all 12 months for a year"""
    print(f"\n{'='*70}")
    print(f"🚀 DOWNLOADING YEAR {year}")
    print(f"{'='*70}\n")
    
    year_total_ticks = 0
    year_total_size = 0
    success_count = 0
    
    for month in range(1, 13):
        ticks, size, success = await download_month(symbol, year, month)
        
        if success:
            year_total_ticks += ticks
            year_total_size += size
            success_count += 1
        
        await asyncio.sleep(0.5)
    
    print(f"\n{'='*70}")
    print(f"✅ {year} COMPLETE")
    print(f"{'='*70}")
    print(f"Success: {success_count}/12 months")
    print(f"Total ticks: {year_total_ticks:,}")
    print(f"Total size: {year_total_size:.2f} MB")
    print(f"{'='*70}\n")
    
    return year_total_ticks, year_total_size, success_count

async def download_all_years(symbol, years):
    """Download multiple years"""
    print(f"\n{'='*70}")
    print(f"🚀 ORGANIZED DOWNLOAD - YEAR BY YEAR")
    print(f"{'='*70}")
    print(f"Symbol: {symbol}")
    print(f"Years: {years}")
    print(f"Structure: data/ticks/YYYY/eurusd_ticks_YYYY-MM.csv")
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
    print(f"Total years: {len(years)}")
    print(f"Total months: {grand_total_months}/{len(years)*12}")
    print(f"Total ticks: {grand_total_ticks:,}")
    print(f"Total size: {grand_total_size:.2f} MB ({grand_total_size/1024:.2f} GB)")
    print(f"Time: {duration:.1f} minutes ({duration/60:.1f} hours)")
    print(f"{'='*70}\n")
    
    print("✅ Data organized by year in: data/ticks/")
    print("✅ Next: python generate_candles_fast.py")

def main():
    """Main function"""
    symbol = "EURUSD"
    
    # Get years from command line or use default
    if len(sys.argv) > 1:
        years = [int(y) for y in sys.argv[1:]]
    else:
        # Default: all years
        years = [2020, 2021, 2022, 2023, 2024, 2025, 2026]
    
    print("""
╔══════════════════════════════════════════════════════════════════╗
║         ORGANIZED DOWNLOAD - YEAR BY YEAR                        ║
║         Each year in separate folder                             ║
╚══════════════════════════════════════════════════════════════════╝
""")
    
    print(f"Will download: {years}")
    print(f"Estimated time: {len(years)*1.5:.0f}-{len(years)*2.5:.0f} hours\n")
    
    confirm = input("Start download? (y/n): ").strip().lower()
    
    if confirm == 'y':
        asyncio.run(download_all_years(symbol, years))
    else:
        print("❌ Download cancelled")

if __name__ == "__main__":
    main()

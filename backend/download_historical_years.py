"""
Download historical EURUSD data for years 2020-2023
"""
import asyncio
from datetime import datetime
import sys
import os

try:
    from tick_vault import download_range, read_tick_data
    TICK_VAULT_AVAILABLE = True
except ImportError:
    print("❌ tick-vault not installed")
    print("Install with: pip install tick-vault")
    TICK_VAULT_AVAILABLE = False
    sys.exit(1)

async def download_year(year):
    """Download all months for a specific year"""
    print(f"\n{'='*70}")
    print(f"DOWNLOADING {year} EUR/USD DATA")
    print(f"{'='*70}\n")
    
    success_count = 0
    failed_months = []
    
    for month in range(1, 13):
        if month == 12:
            start = f"{year}-{month:02d}-01"
            end = f"{year+1}-01-01"
        else:
            start = f"{year}-{month:02d}-01"
            end = f"{year}-{month+1:02d}-01"
        
        print(f"📥 Downloading {year}-{month:02d}...")
        print(f"   From: {start} to {end}")
        
        try:
            await download_range('EURUSD', start, end)
            
            # Try to read and verify
            df = read_tick_data(
                'EURUSD',
                start=datetime.strptime(start, '%Y-%m-%d'),
                end=datetime.strptime(end, '%Y-%m-%d'),
                strict=False
            )
            
            if df is not None and len(df) > 0:
                print(f"✅ Completed {year}-{month:02d} - {len(df):,} ticks")
                success_count += 1
            else:
                print(f"⚠️  No data for {year}-{month:02d}")
                failed_months.append(f"{year}-{month:02d}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            failed_months.append(f"{year}-{month:02d}")
        
        # Small delay between months
        await asyncio.sleep(1)
    
    print(f"\n{'='*70}")
    print(f"YEAR {year} SUMMARY:")
    print(f"  Successfully downloaded: {success_count}/12 months")
    if failed_months:
        print(f"  Failed months: {', '.join(failed_months)}")
    print(f"{'='*70}\n")
    
    return success_count, failed_months

async def download_multiple_years(years):
    """Download data for multiple years"""
    print(f"\n{'='*70}")
    print(f"HISTORICAL DATA DOWNLOAD")
    print(f"{'='*70}")
    print(f"Years to download: {years}")
    print(f"Estimated time: 1-2 hours per year")
    print(f"{'='*70}\n")
    
    total_success = 0
    total_failed = []
    
    for year in years:
        success, failed = await download_year(year)
        total_success += success
        total_failed.extend(failed)
    
    print(f"\n{'='*70}")
    print(f"FINAL SUMMARY:")
    print(f"  Total months downloaded: {total_success}/{len(years)*12}")
    if total_failed:
        print(f"  Failed months: {', '.join(total_failed)}")
    print(f"{'='*70}\n")
    print("Next steps:")
    print("1. Run: python generate_candles_fast.py")
    print("2. Restart the backend to load new data")

def main():
    if not TICK_VAULT_AVAILABLE:
        return
    
    # Check command line arguments
    if len(sys.argv) > 1:
        # Specific years provided
        years = [int(y) for y in sys.argv[1:]]
    else:
        # Default: download 2020-2023
        years = [2020, 2021, 2022, 2023]
    
    print(f"Will download data for years: {years}")
    confirm = input("Continue? (y/n): ").strip().lower()
    
    if confirm == 'y':
        asyncio.run(download_multiple_years(years))
    else:
        print("Download cancelled")

if __name__ == "__main__":
    main()

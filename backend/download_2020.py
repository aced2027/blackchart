"""
Download 2020 EUR/USD tick data month by month
"""
import asyncio
from tick_vault import download_range
from datetime import datetime
import time

async def download_month(year, month):
    """Download one month of data"""
    if month == 12:
        start = f"{year}-{month:02d}-01"
        end = f"{year+1}-01-01"
    else:
        start = f"{year}-{month:02d}-01"
        end = f"{year}-{month+1:02d}-01"
    
    print(f"\n📥 Downloading {year}-{month:02d}...")
    print(f"   From: {start}")
    print(f"   To: {end}")
    
    try:
        await download_range(
            'EURUSD',
            start,
            end
        )
        print(f"✅ Completed {year}-{month:02d}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def main():
    print("="*70)
    print("DOWNLOADING 2020 EUR/USD DATA")
    print("="*70)
    print("\nDownloading all 12 months of 2020...")
    print("Estimated time: 2-3 hours")
    print()
    
    success_count = 0
    for month in range(1, 13):
        result = await download_month(2020, month)
        if result:
            success_count += 1
        time.sleep(2)  # Wait between months
    
    print()
    print("="*70)
    print(f"✅ DOWNLOAD COMPLETE!")
    print(f"   Successfully downloaded: {success_count}/12 months")
    print("="*70)
    print()
    print("Next step: Run combine_and_generate_all.py to regenerate candles")

if __name__ == "__main__":
    asyncio.run(main())

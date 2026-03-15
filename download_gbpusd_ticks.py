"""
Download GBPUSD tick data for 2021-2026
Similar to EURUSD but for GBP/USD pair
"""
import os
import requests
import pandas as pd
from datetime import datetime, timedelta
import time
from pathlib import Path

def download_gbpusd_month(year, month):
    """Download GBPUSD tick data for a specific month"""
    print(f"📥 Downloading GBPUSD {year}-{month:02d}...", end=' ')
    
    # Create directory structure
    data_dir = Path(f'backend/data/ticks/{year}')
    data_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f'gbpusd_ticks_{year}-{month:02d}.csv'
    filepath = data_dir / filename
    
    if filepath.exists():
        print("✓ Already exists")
        return True
    
    try:
        # Using tick_vault library (same as EURUSD)
        from tick_vault import TickVault
        
        # Download GBPUSD data
        tv = TickVault()
        start_date = f"{year}-{month:02d}-01"
        
        # Calculate end date (last day of month)
        if month == 12:
            end_date = f"{year+1}-01-01"
        else:
            end_date = f"{year}-{month+1:02d}-01"
        
        # Download tick data
        ticks = tv.get_ticks('GBPUSD', start_date, end_date)
        
        if ticks is None or len(ticks) == 0:
            print("❌ No data")
            return False
        
        # Save to CSV
        ticks.to_csv(filepath, index=False)
        print(f"✓ {len(ticks):,} ticks")
        return True
        
    except ImportError:
        print("❌ tick_vault not installed")
        print("   Run: pip install tick_vault")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def download_gbpusd_year(year):
    """Download GBPUSD data for entire year"""
    print(f"\n📅 Downloading GBPUSD {year}...")
    
    success_count = 0
    for month in range(1, 13):
        if download_gbpusd_month(year, month):
            success_count += 1
        time.sleep(1)  # Rate limiting
    
    print(f"   ✅ {success_count}/12 months downloaded")
    return success_count

def main():
    print("=" * 60)
    print("🚀 GBPUSD TICK DATA DOWNLOADER")
    print("   Years: 2021-2026")
    print("=" * 60)
    
    years = [2021, 2022, 2023, 2024, 2025, 2026]
    total_success = 0
    
    for year in years:
        success = download_gbpusd_year(year)
        total_success += success
    
    print("\n" + "=" * 60)
    print(f"✅ DOWNLOAD COMPLETE!")
    print(f"   Total months: {total_success}")
    print("=" * 60)
    
    # Check what we have
    print("\n📊 GBPUSD Data Summary:")
    ticks_dir = Path('backend/data/ticks')
    gbp_files = list(ticks_dir.glob('**/gbpusd_ticks_*.csv'))
    
    if gbp_files:
        print(f"   Files: {len(gbp_files)}")
        total_size = sum(f.stat().st_size for f in gbp_files) / (1024**3)
        print(f"   Size: {total_size:.2f} GB")
    else:
        print("   No GBPUSD files found")

if __name__ == '__main__':
    main()
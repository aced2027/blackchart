"""
Interactive Month-by-Month Tick Data Downloader
Downloads tick data from Dukascopy with user prompts
"""

import os
import sys
import asyncio
from datetime import datetime, timedelta
import pandas as pd

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_collector.dukascopy_client import DukascopyClient

def get_user_input():
    """Get download parameters from user input"""
    
    print("="*80)
    print("🚀 DUKASCOPY TICK DATA DOWNLOADER")
    print("="*80)
    print()
    
    # Get symbol
    symbol = input("Enter symbol (default: EURUSD): ").strip().upper()
    if not symbol:
        symbol = "EURUSD"
    
    print()
    print("Start date:")
    
    # Get start year
    while True:
        try:
            start_year = input("Year (e.g., 2024): ").strip()
            start_year = int(start_year)
            if 2020 <= start_year <= 2026:
                break
            else:
                print("Please enter a year between 2020 and 2026")
        except ValueError:
            print("Please enter a valid year")
    
    # Get start month
    while True:
        try:
            start_month = input("Month (1-12): ").strip()
            start_month = int(start_month)
            if 1 <= start_month <= 12:
                break
            else:
                print("Please enter a month between 1 and 12")
        except ValueError:
            print("Please enter a valid month")
    
    print()
    print("End date:")
    
    # Get end year
    while True:
        try:
            end_year_input = input(f"Year (default: {start_year}): ").strip()
            if not end_year_input:
                end_year = start_year
            else:
                end_year = int(end_year_input)
            
            if start_year <= end_year <= 2026:
                break
            else:
                print(f"Please enter a year between {start_year} and 2026")
        except ValueError:
            print("Please enter a valid year")
    
    # Get end month
    while True:
        try:
            end_month = input("Month (1-12): ").strip()
            end_month = int(end_month)
            if 1 <= end_month <= 12:
                break
            else:
                print("Please enter a month between 1 and 12")
        except ValueError:
            print("Please enter a valid month")
    
    return symbol, start_year, start_month, end_year, end_month

def generate_month_list(start_year, start_month, end_year, end_month):
    """Generate list of months to download"""
    months = []
    
    current_year = start_year
    current_month = start_month
    
    while True:
        months.append((current_year, current_month))
        
        # Check if we've reached the end
        if current_year == end_year and current_month == end_month:
            break
        
        # Move to next month
        current_month += 1
        if current_month > 12:
            current_month = 1
            current_year += 1
        
        # Safety check
        if current_year > end_year or (current_year == end_year and current_month > end_month):
            break
    
    return months

async def download_month_data(client, symbol, year, month):
    """Download data for a specific month"""
    
    month_name = datetime(year, month, 1).strftime("%B")
    print(f"📥 DOWNLOADING {month_name} {year}...")
    
    # Create year directory
    year_dir = f"data/ticks/{year}"
    os.makedirs(year_dir, exist_ok=True)
    
    # Output file
    output_file = f"{year_dir}/{symbol.lower()}_ticks_{year}-{month:02d}.csv"
    
    # Check if already exists
    if os.path.exists(output_file):
        file_size_mb = os.path.getsize(output_file) / (1024*1024)
        print(f"   ✅ Already exists: {output_file} ({file_size_mb:.1f} MB)")
        print(f"   ⏭️  Skipping download")
        return True, len(pd.read_csv(output_file)) if file_size_mb > 0 else 0
    
    try:
        # Calculate month date range
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
        
        print(f"   📊 Range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        
        # Collect all ticks for the month
        all_ticks = []
        current_date = start_date
        days_processed = 0
        
        while current_date <= end_date:
            # Download all 24 hours for each day
            day_ticks = 0
            
            for hour in range(24):
                hour_datetime = current_date.replace(hour=hour)
                
                # Skip future dates
                if hour_datetime > datetime.now():
                    break
                
                try:
                    ticks = await client.get_ticks(symbol, hour_datetime)
                    if ticks:
                        all_ticks.extend(ticks)
                        day_ticks += len(ticks)
                except Exception:
                    # Skip individual hour errors silently
                    pass
            
            days_processed += 1
            current_date += timedelta(days=1)
            
            # Progress update every 5 days
            if days_processed % 5 == 0:
                print(f"   📅 Day {days_processed}: {len(all_ticks):,} ticks total")
        
        if all_ticks and len(all_ticks) > 0:
            # Convert to DataFrame and save
            df = pd.DataFrame(all_ticks)
            df.to_csv(output_file, index=False)
            
            file_size_mb = os.path.getsize(output_file) / (1024*1024)
            
            print(f"   ✅ Downloaded: {len(all_ticks):,} ticks")
            print(f"   💾 Saved: {output_file}")
            print(f"   📏 Size: {file_size_mb:.1f} MB")
            
            return True, len(all_ticks)
        else:
            print(f"   ❌ No data received for {month_name} {year}")
            return False, 0
            
    except Exception as e:
        print(f"   ❌ Error downloading {month_name} {year}: {e}")
        return False, 0

async def main():
    """Main download function"""
    
    # Get user input
    symbol, start_year, start_month, end_year, end_month = get_user_input()
    
    # Generate month list
    months = generate_month_list(start_year, start_month, end_year, end_month)
    
    print()
    print("="*80)
    print("📋 DOWNLOAD PLAN")
    print("="*80)
    print()
    print(f"💱 Symbol: {symbol}")
    print(f"📅 Period: {start_year}-{start_month:02d} to {end_year}-{end_month:02d}")
    print(f"📊 Total months: {len(months)}")
    print()
    print("Months to download:")
    for i, (year, month) in enumerate(months, 1):
        month_name = datetime(year, month, 1).strftime("%B")
        print(f"   {i:2d}. {month_name} {year}")
    
    print()
    confirm = input("Continue with download? (y/N): ").strip().lower()
    if confirm not in ['y', 'yes']:
        print("Download cancelled.")
        return
    
    print()
    print("="*80)
    print("🚀 STARTING DOWNLOADS")
    print("="*80)
    print()
    
    # Initialize client with proper session management
    async with DukascopyClient() as client:
        # Download statistics
        total_months = len(months)
        completed_months = 0
        total_ticks = 0
        failed_months = []
        
        # Download each month
        for i, (year, month) in enumerate(months, 1):
            print(f"[{i}/{total_months}] ", end="")
            
            success, tick_count = await download_month_data(client, symbol, year, month)
            
            if success:
                completed_months += 1
                total_ticks += tick_count
            else:
                failed_months.append(f"{year}-{month:02d}")
            
            print()
            
            # Small delay between downloads
            if i < total_months:
                print("   ⏳ Waiting 2 seconds...")
                await asyncio.sleep(2)
    
    print("="*80)
    print("📊 DOWNLOAD SUMMARY")
    print("="*80)
    print()
    print(f"✅ Completed: {completed_months}/{total_months} months")
    print(f"📊 Total ticks: {total_ticks:,}")
    
    if failed_months:
        print(f"❌ Failed months: {', '.join(failed_months)}")
    
    print()
    
    if completed_months > 0:
        print("🎉 DOWNLOAD COMPLETED!")
        print()
        print("🔄 Next steps:")
        print("   1. Run: python generate_from_organized_ticks.py")
        print("   2. Restart backend server")
        print("   3. Refresh frontend to see new data")
    else:
        print("⚠️  No data was downloaded successfully")
        print("🔄 Check your internet connection and try again")
    
    print()
    print("="*80)

if __name__ == "__main__":
    print("🚀 Interactive Tick Data Downloader")
    print("💡 Downloads tick data from Dukascopy month by month")
    print()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Download cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("🔄 Please try again")
"""
DOWNLOAD 2025 SAMPLE DATA - First 3 months
Downloads January, February, March 2025 EURUSD tick data from Dukascopy
Quick start to get 2025 data integrated
"""

import os
import sys
import time
import asyncio
from datetime import datetime, timedelta
import pandas as pd

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_collector.dukascopy_client import DukascopyClient

async def download_2025_sample():
    """Download first 3 months of 2025 tick data"""
    
    print("="*80)
    print("🚀 DOWNLOADING 2025 SAMPLE DATA (Q1)")
    print("="*80)
    print()
    print("📅 Target: January, February, March 2025")
    print("💱 Symbol: EURUSD")
    print("📊 Data Type: Tick data (bid/ask/volume)")
    print("🗂️  Storage: data/ticks/2025/")
    print("🆓 Source: Dukascopy (FREE)")
    print()
    
    # Create 2025 directory
    os.makedirs("data/ticks/2025", exist_ok=True)
    
    # Initialize Dukascopy client with proper session management
    async with DukascopyClient() as client:
        
        # First 3 months of 2025
        months_2025 = [
            ("2025-01", "January"),
            ("2025-02", "February"), 
            ("2025-03", "March")
        ]
        
        total_months = len(months_2025)
        completed_months = 0
        total_ticks = 0
        total_size_mb = 0
        
        print("="*80)
        print("STARTING Q1 2025 DOWNLOADS")
        print("="*80)
        print()
        
        for i, (month_str, month_name) in enumerate(months_2025, 1):
            print(f"[{i}/{total_months}] 📥 DOWNLOADING {month_name} 2025...")
            print(f"    📅 Period: {month_str}")
            
            # Output file
            output_file = f"data/ticks/2025/eurusd_ticks_{month_str}.csv"
            
            # Check if already exists
            if os.path.exists(output_file):
                file_size_mb = os.path.getsize(output_file) / (1024*1024)
                print(f"    ✅ Already exists: {output_file} ({file_size_mb:.1f} MB)")
                print(f"    ⏭️  Skipping download")
                
                # Count existing ticks
                try:
                    df = pd.read_csv(output_file)
                    total_ticks += len(df)
                    total_size_mb += file_size_mb
                    completed_months += 1
                except:
                    pass
                print()
                continue
            
            try:
                # Parse month
                year = int(month_str.split('-')[0])
                month = int(month_str.split('-')[1])
                
                # Calculate date range for the month (first 5 days only for speed)
                start_date = datetime(year, month, 1)
                end_date = datetime(year, month, 5)  # Only first 5 days for sample
                
                print(f"    📊 Sample Range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')} (5 days)")
                
                # Download tick data for the sample period
                download_start = time.time()
                
                # Collect all ticks for the sample period
                all_ticks = []
                current_date = start_date
                
                print(f"    🔄 Downloading sample data...")
                
                while current_date <= end_date:
                    # Download key hours only (market hours)
                    key_hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]  # European/US market hours
                    
                    for hour in key_hours:
                        hour_datetime = current_date.replace(hour=hour)
                        
                        try:
                            ticks = await client.get_ticks("EURUSD", hour_datetime)
                            if ticks:
                                all_ticks.extend(ticks)
                        except Exception as e:
                            # Skip individual hour errors
                            pass
                    
                    current_date += timedelta(days=1)
                    print(f"    📅 {current_date.strftime('%Y-%m-%d')}: {len(all_ticks):,} ticks")
                
                download_time = time.time() - download_start
                
                if all_ticks and len(all_ticks) > 0:
                    # Convert to DataFrame
                    df = pd.DataFrame(all_ticks)
                    
                    # Save to CSV
                    df.to_csv(output_file, index=False)
                    
                    # Get file size
                    file_size_mb = os.path.getsize(output_file) / (1024*1024)
                    
                    print(f"    ✅ Downloaded: {len(all_ticks):,} ticks (sample)")
                    print(f"    💾 Saved: {output_file}")
                    print(f"    📏 Size: {file_size_mb:.1f} MB")
                    print(f"    ⏱️  Time: {download_time:.1f} seconds")
                    
                    total_ticks += len(all_ticks)
                    total_size_mb += file_size_mb
                    completed_months += 1
                    
                else:
                    print(f"    ❌ No data received for {month_name} 2025")
                    
            except Exception as e:
                print(f"    ❌ Error downloading {month_name} 2025: {e}")
                print(f"    🔄 You can retry this month later")
            
            print()
            
            # Small delay between downloads
            if i < total_months:
                print("    ⏳ Waiting 3 seconds before next download...")
                time.sleep(3)
                print()
    
    print("="*80)
    print("📊 2025 Q1 SAMPLE DOWNLOAD SUMMARY")
    print("="*80)
    print()
    print(f"✅ Completed months: {completed_months}/{total_months}")
    print(f"📊 Total ticks: {total_ticks:,}")
    print(f"💾 Total size: {total_size_mb:.1f} MB")
    print()
    
    if completed_months > 0:
        print("🎉 2025 SAMPLE DATA DOWNLOADED!")
        print()
        print("📁 Files created:")
        for month_str, month_name in months_2025:
            file_path = f"data/ticks/2025/eurusd_ticks_{month_str}.csv"
            if os.path.exists(file_path):
                size_mb = os.path.getsize(file_path) / (1024*1024)
                print(f"   ✅ {file_path} ({size_mb:.1f} MB)")
        print()
        print("🔄 Next steps:")
        print("   1. Run 'python generate_from_organized_ticks.py' to update candles")
        print("   2. Restart backend to serve the new data")
        print("   3. Refresh frontend to see 2025 data in charts")
        print()
        print("💡 To download full months, use 'python download_2025_complete.py'")
        
    else:
        print("⚠️  No data was downloaded")
        print("🔄 Check your internet connection and try again")
    
    print()
    print("="*80)

if __name__ == "__main__":
    print("🚀 Starting 2025 Q1 sample download...")
    print("💡 This downloads first 5 days of each month for quick testing")
    print()
    asyncio.run(download_2025_sample())
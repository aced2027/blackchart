"""
DOWNLOAD 2025 TICK DATA - Complete Year
Downloads all 12 months of 2025 EURUSD tick data from Dukascopy
Stores in organized structure: data/ticks/2025/eurusd_ticks_2025-MM.csv
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

async def download_2025_ticks():
    """Download all 2025 tick data month by month"""
    
    print("="*80)
    print("🚀 DOWNLOADING 2025 EURUSD TICK DATA")
    print("="*80)
    print()
    print("📅 Target Year: 2025")
    print("💱 Symbol: EURUSD")
    print("📊 Data Type: Tick data (bid/ask/volume)")
    print("🗂️  Storage: data/ticks/2025/")
    print("🆓 Source: Dukascopy (FREE)")
    print()
    
    # Create 2025 directory
    os.makedirs("data/ticks/2025", exist_ok=True)
    
    # Initialize Dukascopy client with proper session management
    async with DukascopyClient() as client:
        
        # 2025 months to download
        months_2025 = [
            ("2025-01", "January"),
            ("2025-02", "February"), 
            ("2025-03", "March"),
            ("2025-04", "April"),
            ("2025-05", "May"),
            ("2025-06", "June"),
            ("2025-07", "July"),
            ("2025-08", "August"),
            ("2025-09", "September"),
            ("2025-10", "October"),
            ("2025-11", "November"),
            ("2025-12", "December")
        ]
        
        total_months = len(months_2025)
        completed_months = 0
        total_ticks = 0
        total_size_mb = 0
        
        print("="*80)
        print("STARTING DOWNLOADS")
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
                
                # Calculate date range for the month
                start_date = datetime(year, month, 1)
                if month == 12:
                    end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
                else:
                    end_date = datetime(year, month + 1, 1) - timedelta(days=1)
                
                print(f"    📊 Range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
                
                # Download tick data for the entire month
                download_start = time.time()
                
                # Collect all ticks for the month
                all_ticks = []
                current_date = start_date
                
                print(f"    🔄 Downloading hour by hour...")
                
                while current_date <= end_date:
                    # Download each hour
                    for hour in range(24):
                        hour_datetime = current_date.replace(hour=hour)
                        
                        # Skip future dates
                        if hour_datetime > datetime.now():
                            break
                        
                        try:
                            ticks = await client.get_ticks("EURUSD", hour_datetime)
                            if ticks:
                                all_ticks.extend(ticks)
                        except Exception as e:
                            # Skip individual hour errors
                            pass
                    
                    current_date += timedelta(days=1)
                    
                    # Progress update every few days
                    if current_date.day % 5 == 0:
                        print(f"    📅 Progress: {current_date.strftime('%Y-%m-%d')} ({len(all_ticks):,} ticks so far)")
                
                download_time = time.time() - download_start
                
                if all_ticks and len(all_ticks) > 0:
                    # Convert to DataFrame
                    df = pd.DataFrame(all_ticks)
                    
                    # Save to CSV
                    df.to_csv(output_file, index=False)
                    
                    # Get file size
                    file_size_mb = os.path.getsize(output_file) / (1024*1024)
                    
                    print(f"    ✅ Downloaded: {len(all_ticks):,} ticks")
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
            
            # Small delay between downloads to be respectful
            if i < total_months:
                print("    ⏳ Waiting 2 seconds before next download...")
                time.sleep(2)
                print()
    
    print("="*80)
    print("📊 2025 DOWNLOAD SUMMARY")
    print("="*80)
    print()
    print(f"✅ Completed months: {completed_months}/{total_months}")
    print(f"📊 Total ticks: {total_ticks:,}")
    print(f"💾 Total size: {total_size_mb:.1f} MB ({total_size_mb/1024:.2f} GB)")
    print()
    
    if completed_months == total_months:
        print("🎉 ALL 2025 DATA DOWNLOADED SUCCESSFULLY!")
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
        
    else:
        missing_months = total_months - completed_months
        print(f"⚠️  {missing_months} months still need to be downloaded")
        print("🔄 Run this script again to retry failed downloads")
    
    print()
    print("="*80)

def check_2025_status():
    """Check current status of 2025 downloads"""
    
    print("="*80)
    print("📊 2025 TICK DATA STATUS")
    print("="*80)
    print()
    
    months_2025 = [
        ("2025-01", "January"),
        ("2025-02", "February"), 
        ("2025-03", "March"),
        ("2025-04", "April"),
        ("2025-05", "May"),
        ("2025-06", "June"),
        ("2025-07", "July"),
        ("2025-08", "August"),
        ("2025-09", "September"),
        ("2025-10", "October"),
        ("2025-11", "November"),
        ("2025-12", "December")
    ]
    
    total_files = 0
    total_size_mb = 0
    downloaded = []
    missing = []
    
    for month_str, month_name in months_2025:
        file_path = f"data/ticks/2025/eurusd_ticks_{month_str}.csv"
        
        if os.path.exists(file_path):
            size_mb = os.path.getsize(file_path) / (1024*1024)
            total_files += 1
            total_size_mb += size_mb
            downloaded.append(f"{month_name} ({size_mb:.1f} MB)")
        else:
            missing.append(month_name)
    
    if downloaded:
        print("✅ Downloaded months:")
        for month in downloaded:
            print(f"   📁 {month}")
        print()
    
    if missing:
        print("❌ Missing months:")
        for month in missing:
            print(f"   ⭕ {month}")
        print()
    
    print(f"📊 Progress: {total_files}/12 months ({total_files/12*100:.1f}%)")
    print(f"💾 Total size: {total_size_mb:.1f} MB ({total_size_mb/1024:.2f} GB)")
    print()
    print("="*80)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "status":
        check_2025_status()
    else:
        print("🚀 Starting 2025 tick data download...")
        print("💡 Tip: Run 'python download_2025_complete.py status' to check progress")
        print()
        asyncio.run(download_2025_ticks())
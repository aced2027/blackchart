"""
Monitor 2025 Download Progress
Real-time monitoring of 2025 tick data download progress
"""

import os
import time
from datetime import datetime

def monitor_2025_progress():
    """Monitor download progress in real-time"""
    
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
    
    print("="*80)
    print("📊 2025 TICK DATA DOWNLOAD MONITOR")
    print("="*80)
    print()
    print("🔄 Monitoring download progress...")
    print("💡 Press Ctrl+C to stop monitoring")
    print()
    
    try:
        while True:
            os.system('cls' if os.name == 'nt' else 'clear')  # Clear screen
            
            print("="*80)
            print(f"📊 2025 DOWNLOAD STATUS - {datetime.now().strftime('%H:%M:%S')}")
            print("="*80)
            print()
            
            total_files = 0
            total_size_mb = 0
            
            for i, (month_str, month_name) in enumerate(months_2025, 1):
                file_path = f"data/ticks/2025/eurusd_ticks_{month_str}.csv"
                
                if os.path.exists(file_path):
                    size_mb = os.path.getsize(file_path) / (1024*1024)
                    total_files += 1
                    total_size_mb += size_mb
                    status = f"✅ {size_mb:>6.1f} MB"
                else:
                    status = "⏳ Pending"
                
                print(f"[{i:2d}/12] {month_name:>9} 2025: {status}")
            
            print()
            print("="*80)
            print(f"📊 Progress: {total_files}/12 months ({total_files/12*100:.1f}%)")
            print(f"💾 Total size: {total_size_mb:.1f} MB ({total_size_mb/1024:.2f} GB)")
            
            if total_files == 12:
                print("🎉 ALL 2025 DATA DOWNLOADED!")
                print()
                print("🔄 Next steps:")
                print("   1. Run: python generate_from_organized_ticks.py")
                print("   2. Restart backend server")
                print("   3. Refresh frontend")
                break
            
            print()
            print("🔄 Refreshing in 10 seconds... (Ctrl+C to stop)")
            print("="*80)
            
            time.sleep(10)
            
    except KeyboardInterrupt:
        print()
        print("👋 Monitoring stopped by user")
        print()

if __name__ == "__main__":
    monitor_2025_progress()
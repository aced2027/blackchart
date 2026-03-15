"""
Live monitor for 2026 download
Updates every 5 seconds
"""
import os
import time
from datetime import datetime

def monitor_2026():
    """Monitor 2026 download progress"""
    print("\n" + "="*70)
    print("2026 DOWNLOAD MONITOR - Press Ctrl+C to stop")
    print("="*70)
    print("Refreshing every 5 seconds...\n")
    
    try:
        while True:
            os.system('cls' if os.name == 'nt' else 'clear')
            
            print("="*70)
            print(f"2026 DOWNLOAD STATUS - {datetime.now().strftime('%H:%M:%S')}")
            print("="*70)
            
            year_folder = "data/ticks/2026"
            months = [1, 2, 3]
            month_names = ["January", "February", "March"]
            
            if not os.path.exists(year_folder):
                print("\n⏳ Folder not created yet - download starting...")
                time.sleep(5)
                continue
            
            total_size = 0
            downloaded_count = 0
            
            for i, month in enumerate(months):
                month_str = f"2026-{month:02d}"
                filename = f"{year_folder}/eurusd_ticks_{month_str}.csv"
                month_name = month_names[i]
                
                if os.path.exists(filename):
                    size_mb = os.path.getsize(filename) / (1024 * 1024)
                    
                    try:
                        with open(filename, 'r') as f:
                            ticks = sum(1 for _ in f) - 1
                    except:
                        ticks = 0
                    
                    print(f"\n✅ {month_name}")
                    print(f"   Ticks: {ticks:,}")
                    print(f"   Size: {size_mb:.2f} MB")
                    
                    downloaded_count += 1
                    total_size += size_mb
                else:
                    print(f"\n⏳ {month_name}")
                    print(f"   Waiting...")
            
            print(f"\n{'='*70}")
            print(f"PROGRESS: {downloaded_count}/3 months ({downloaded_count/3*100:.1f}%)")
            print(f"Total size: {total_size:.2f} MB")
            print(f"{'='*70}")
            
            if downloaded_count >= 3:
                print("\n🎉 COMPLETE! All 3 months downloaded.")
                break
            
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n\nMonitoring stopped")
        print(f"Current progress: {downloaded_count}/3 months")

if __name__ == "__main__":
    monitor_2026()

"""
Monitor download progress
"""
import os
import glob
import time
from datetime import datetime

def monitor_progress():
    """Monitor download progress in real-time"""
    print("="*70)
    print("DOWNLOAD PROGRESS MONITOR")
    print("="*70)
    print("Press Ctrl+C to stop monitoring (download continues)\n")
    
    last_count = 0
    
    try:
        while True:
            # Count files
            files = glob.glob("data/eurusd_ticks_*.csv")
            files = [f for f in files if not f.endswith("eurusd_ticks.csv")]
            
            if len(files) != last_count:
                last_count = len(files)
                
                # Get total size
                total_size = sum(os.path.getsize(f) for f in files) / (1024 * 1024)
                
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Files: {len(files)}/48 | Size: {total_size:.2f} MB")
                
                # Show latest files
                if files:
                    latest = sorted(files)[-3:]
                    for f in latest:
                        name = os.path.basename(f)
                        size = os.path.getsize(f) / (1024 * 1024)
                        print(f"   ✓ {name} ({size:.2f} MB)")
            
            time.sleep(10)
            
    except KeyboardInterrupt:
        print("\n\nMonitoring stopped (download still running)")
        print(f"Final count: {last_count}/48 files")

if __name__ == "__main__":
    monitor_progress()

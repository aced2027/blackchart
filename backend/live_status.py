"""
Live download status - updates every 5 seconds
Shows year by year, month by month progress
"""
import os
import glob
import time
from datetime import datetime

def get_file_info(filepath):
    """Get file size and tick count"""
    try:
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        with open(filepath, 'r') as f:
            ticks = sum(1 for _ in f) - 1  # Subtract header
        return size_mb, ticks
    except:
        return 0, 0

def show_live_status():
    """Show live download status"""
    print("\n" + "="*70)
    print("LIVE DOWNLOAD STATUS - Press Ctrl+C to stop")
    print("="*70)
    print("Refreshing every 5 seconds...\n")
    
    try:
        while True:
            os.system('cls' if os.name == 'nt' else 'clear')
            
            print("="*70)
            print(f"DOWNLOAD STATUS - {datetime.now().strftime('%H:%M:%S')}")
            print("="*70)
            
            # Get all downloaded files
            monthly_files = glob.glob("data/eurusd_ticks_*.csv")
            monthly_files = [f for f in monthly_files if not f.endswith("eurusd_ticks.csv")]
            monthly_files.sort()
            
            # Group by year
            years_data = {}
            for filepath in monthly_files:
                filename = os.path.basename(filepath)
                try:
                    date_str = filename.replace("eurusd_ticks_", "").replace(".csv", "")
                    year = date_str.split("-")[0]
                    month = date_str.split("-")[1]
                    
                    if year not in years_data:
                        years_data[year] = {}
                    
                    size_mb, ticks = get_file_info(filepath)
                    years_data[year][month] = {
                        'file': filename,
                        'size_mb': size_mb,
                        'ticks': ticks
                    }
                except:
                    pass
            
            # Show status for each year
            total_files = 0
            total_size = 0
            
            for year in ['2020', '2021', '2022', '2023', '2024']:
                print(f"\n{year}:")
                
                if year in years_data:
                    months = years_data[year]
                    year_size = sum(m['size_mb'] for m in months.values())
                    year_ticks = sum(m['ticks'] for m in months.values())
                    
                    print(f"  ✅ {len(months)}/12 months | {year_size:.2f} MB | {year_ticks:,} ticks")
                    
                    # Show which months
                    downloaded_months = sorted([int(m) for m in months.keys()])
                    print(f"  Months: {', '.join(str(m) for m in downloaded_months)}")
                    
                    total_files += len(months)
                    total_size += year_size
                else:
                    print(f"  ❌ 0/12 months")
            
            # Summary
            print(f"\n{'='*70}")
            print(f"TOTAL: {total_files}/60 months | {total_size:.2f} MB ({total_size/1024:.2f} GB)")
            print(f"Progress: {total_files/60*100:.1f}%")
            print(f"{'='*70}")
            
            if total_files >= 60:
                print("\n🎉 ALL DOWNLOADS COMPLETE!")
                break
            
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n\nMonitoring stopped")
        print(f"Current progress: {total_files}/60 months")

if __name__ == "__main__":
    show_live_status()

"""
Show download status by year and month
Lists what's downloaded and what's missing
"""
import os
import glob
from datetime import datetime

def show_download_status():
    """Show detailed download status by year and month"""
    print("="*70)
    print("DOWNLOAD STATUS BY YEAR AND MONTH")
    print("="*70)
    
    # Get all downloaded monthly files
    monthly_files = glob.glob("data/eurusd_ticks_*.csv")
    monthly_files = [f for f in monthly_files if not f.endswith("eurusd_ticks.csv")]
    
    # Extract year-month from filenames
    downloaded = set()
    for filepath in monthly_files:
        filename = os.path.basename(filepath)
        try:
            date_str = filename.replace("eurusd_ticks_", "").replace(".csv", "")
            downloaded.add(date_str)
        except:
            pass
    
    # Define target years and months
    years = [2020, 2021, 2022, 2023, 2024]
    months = list(range(1, 13))
    
    # Show status for each year
    total_expected = 0
    total_downloaded = 0
    total_missing = 0
    
    for year in years:
        print(f"\n{'='*70}")
        print(f"YEAR {year}")
        print(f"{'='*70}")
        
        year_downloaded = []
        year_missing = []
        
        for month in months:
            month_str = f"{year}-{month:02d}"
            total_expected += 1
            
            if month_str in downloaded:
                year_downloaded.append(month)
                total_downloaded += 1
            else:
                year_missing.append(month)
                total_missing += 1
        
        # Show downloaded months
        if year_downloaded:
            print(f"\n✅ DOWNLOADED ({len(year_downloaded)}/12 months):")
            print(f"   Months: {', '.join(str(m) for m in year_downloaded)}")
        else:
            print(f"\n✅ DOWNLOADED: None")
        
        # Show missing months
        if year_missing:
            print(f"\n❌ MISSING ({len(year_missing)}/12 months):")
            print(f"   Months: {', '.join(str(m) for m in year_missing)}")
            
            # Show download command
            if len(year_missing) == 12:
                print(f"\n   Download command:")
                print(f"   python download_month_by_month.py EURUSD {year} 1 {year} 12")
            else:
                print(f"\n   Download commands:")
                for m in year_missing:
                    print(f"   python download_month_by_month.py EURUSD {year} {m} {year} {m}")
        else:
            print(f"\n✅ COMPLETE - All 12 months downloaded!")
    
    # Summary
    print(f"\n{'='*70}")
    print(f"SUMMARY")
    print(f"{'='*70}")
    print(f"Total expected: {total_expected} months")
    print(f"Downloaded: {total_downloaded} months ({total_downloaded/total_expected*100:.1f}%)")
    print(f"Missing: {total_missing} months ({total_missing/total_expected*100:.1f}%)")
    print(f"{'='*70}")
    
    # Return lists
    return {
        'downloaded': sorted(list(downloaded)),
        'missing': total_missing,
        'total': total_expected
    }

if __name__ == "__main__":
    show_download_status()

"""
Find missing data gaps and generate report
Identifies missing months and data gaps
"""
import os
import glob
import pandas as pd
from datetime import datetime, timedelta

def find_missing_months():
    """Find missing months in the data"""
    print("="*70)
    print("MISSING DATA ANALYSIS")
    print("="*70)
    
    # Get all monthly files
    monthly_files = glob.glob("data/eurusd_ticks_*.csv")
    monthly_files = [f for f in monthly_files if not f.endswith("eurusd_ticks.csv")]
    
    if not monthly_files:
        print("\n❌ No data files found")
        return
    
    # Extract year-month from filenames
    existing_months = set()
    for filepath in monthly_files:
        filename = os.path.basename(filepath)
        try:
            date_str = filename.replace("eurusd_ticks_", "").replace(".csv", "")
            existing_months.add(date_str)
        except:
            pass
    
    # Define target range: 2020-01 to 2026-03
    start_date = datetime(2020, 1, 1)
    end_date = datetime(2026, 3, 31)
    
    # Generate all expected months
    expected_months = []
    current = start_date
    while current <= end_date:
        expected_months.append(current.strftime("%Y-%m"))
        # Move to next month
        if current.month == 12:
            current = datetime(current.year + 1, 1, 1)
        else:
            current = datetime(current.year, current.month + 1, 1)
    
    # Find missing months
    missing_months = [m for m in expected_months if m not in existing_months]
    
    # Group by year
    missing_by_year = {}
    for month in missing_months:
        year = month.split("-")[0]
        if year not in missing_by_year:
            missing_by_year[year] = []
        missing_by_year[year].append(month)
    
    # Report
    print(f"\n📊 DATA COVERAGE:")
    print(f"   Expected months: {len(expected_months)}")
    print(f"   Existing months: {len(existing_months)}")
    print(f"   Missing months: {len(missing_months)}")
    print(f"   Coverage: {len(existing_months)/len(expected_months)*100:.1f}%")
    
    if missing_months:
        print(f"\n❌ MISSING MONTHS BY YEAR:")
        for year in sorted(missing_by_year.keys()):
            months = missing_by_year[year]
            print(f"\n   {year}: {len(months)} missing")
            print(f"      {', '.join(months)}")
        
        # Generate download commands
        print(f"\n{'='*70}")
        print(f"📥 DOWNLOAD COMMANDS FOR MISSING DATA:")
        print(f"{'='*70}\n")
        
        for year in sorted(missing_by_year.keys()):
            months = missing_by_year[year]
            if len(months) == 12:
                # Full year missing
                print(f"# Download full year {year}")
                print(f"python download_month_by_month.py EURUSD {year} 1 {year} 12\n")
            else:
                # Individual months
                for month in months:
                    y, m = month.split("-")
                    print(f"python download_month_by_month.py EURUSD {y} {int(m)} {y} {int(m)}")
    else:
        print(f"\n✅ NO MISSING MONTHS - Complete dataset!")
    
    print(f"\n{'='*70}")
    
    return missing_months

if __name__ == "__main__":
    find_missing_months()

"""
Check what years of EURUSD data are available
"""
import os
import glob
import pandas as pd
from datetime import datetime

def check_tick_files():
    """Check tick data files"""
    pattern = "data/eurusd_ticks_*.csv"
    files = glob.glob(pattern)
    files = [f for f in files if not f.endswith("eurusd_ticks.csv")]
    files.sort()
    
    years = set()
    months_by_year = {}
    
    for filepath in files:
        filename = os.path.basename(filepath)
        # Extract date from filename: eurusd_ticks_2024-01.csv
        date_str = filename.replace("eurusd_ticks_", "").replace(".csv", "")
        try:
            year = date_str.split("-")[0]
            years.add(year)
            if year not in months_by_year:
                months_by_year[year] = []
            months_by_year[year].append(date_str)
        except:
            pass
    
    return sorted(list(years)), months_by_year

def check_candle_files():
    """Check candle data files"""
    pattern = "data/eurusd_candles_*.csv"
    files = glob.glob(pattern)
    
    years = set()
    
    for filepath in files:
        if os.path.exists(filepath):
            try:
                # Read first and last rows to get date range
                df = pd.read_csv(filepath)
                if len(df) > 0:
                    first_date = pd.to_datetime(df['time'].iloc[0])
                    last_date = pd.to_datetime(df['time'].iloc[-1])
                    
                    # Extract years
                    for year in range(first_date.year, last_date.year + 1):
                        years.add(str(year))
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
    
    return sorted(list(years))

def main():
    print("=" * 70)
    print("EURUSD DATA AVAILABILITY CHECK")
    print("=" * 70)
    
    # Check tick files
    print("\n📊 TICK DATA:")
    tick_years, months_by_year = check_tick_files()
    
    if tick_years:
        print(f"Years available: {', '.join(tick_years)}")
        print("\nMonths by year:")
        for year in sorted(months_by_year.keys()):
            months = sorted(months_by_year[year])
            print(f"  {year}: {len(months)} months - {months[0]} to {months[-1]}")
    else:
        print("  No tick data files found")
    
    # Check candle files
    print("\n📈 CANDLE DATA:")
    candle_years = check_candle_files()
    
    if candle_years:
        print(f"Years available: {', '.join(candle_years)}")
    else:
        print("  No candle data files found")
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY:")
    all_years = sorted(list(set(tick_years + candle_years)))
    if all_years:
        print(f"✅ EURUSD data available for years: {all_years}")
    else:
        print("❌ No EURUSD data found")
    print("=" * 70)
    
    return all_years

if __name__ == "__main__":
    years = main()
    print(f"\nYears list: {years}")

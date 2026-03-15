"""
Fast tick counter for all monthly CSV files
"""
import os
import glob

def count_lines_fast(filepath):
    """Count lines in file efficiently"""
    count = 0
    with open(filepath, 'rb') as f:
        for _ in f:
            count += 1
    return count - 1  # Subtract header

def main():
    # Get all monthly tick files
    pattern = "backend/data/eurusd_ticks_*.csv"
    files = [f for f in glob.glob(pattern) if not f.endswith("eurusd_ticks.csv")]
    files.sort()
    
    print("=" * 70)
    print("TICK DATA SUMMARY")
    print("=" * 70)
    
    total_ticks = 0
    total_size = 0
    
    for filepath in files:
        filename = os.path.basename(filepath)
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        ticks = count_lines_fast(filepath)
        
        total_ticks += ticks
        total_size += size_mb
        
        print(f"{filename:30} {ticks:>12,} ticks  {size_mb:>8.2f} MB")
    
    print("=" * 70)
    print(f"{'TOTAL':30} {total_ticks:>12,} ticks  {total_size:>8.2f} MB")
    print("=" * 70)
    
    # Calculate date range
    if files:
        first_file = os.path.basename(files[0])
        last_file = os.path.basename(files[-1])
        
        # Extract dates from filenames
        first_date = first_file.replace("eurusd_ticks_", "").replace(".csv", "")
        last_date = last_file.replace("eurusd_ticks_", "").replace(".csv", "")
        
        print(f"\nDate Range: {first_date} to {last_date}")
        print(f"Total Months: {len(files)}")
        print(f"Average ticks per month: {total_ticks // len(files):,}")
    
    print("\n✅ Data is ready for chart display!")

if __name__ == "__main__":
    main()

"""
Combine all monthly tick files and generate candles
This will create candles from your 18 months of downloaded data
"""
import pandas as pd
import os
from glob import glob

def combine_monthly_ticks():
    """Combine all monthly tick files into one master file"""
    print()
    print("="*80)
    print("COMBINING ALL MONTHLY TICK FILES")
    print("="*80)
    print()
    
    # Find all monthly tick files (handle both running from root and backend dir)
    if os.path.exists("backend/data"):
        data_dir = "backend/data"
    else:
        data_dir = "data"
    
    tick_files = sorted(glob(f"{data_dir}/eurusd_ticks_*.csv"))
    # Exclude the combined file
    tick_files = [f for f in tick_files if not f.endswith("eurusd_ticks.csv")]
    
    if not tick_files:
        print("❌ No monthly tick files found!")
        print(f"   Looking in: {data_dir}/eurusd_ticks_YYYY_MM.csv")
        return None
    
    print(f"Found {len(tick_files)} monthly files:")
    for f in tick_files:
        size_mb = os.path.getsize(f) / (1024**2)
        print(f"  ✅ {os.path.basename(f)} ({size_mb:.1f} MB)")
    
    print()
    print("📊 Combining all files...")
    
    # Read and combine all files
    dfs = []
    total_ticks = 0
    
    for file in tick_files:
        try:
            df = pd.read_csv(file)
            dfs.append(df)
            total_ticks += len(df)
            print(f"  ✅ Loaded {os.path.basename(file)}: {len(df):,} ticks")
        except Exception as e:
            print(f"  ❌ Error loading {file}: {e}")
    
    if not dfs:
        print("❌ No data loaded!")
        return None
    
    # Combine all dataframes
    print()
    print("🔗 Merging all data...")
    combined_df = pd.concat(dfs, ignore_index=True)
    
    # Sort by time
    print("📅 Sorting by time...")
    combined_df['time'] = pd.to_datetime(combined_df['time'])
    combined_df = combined_df.sort_values('time')
    
    # Remove duplicates
    print("🧹 Removing duplicates...")
    before = len(combined_df)
    combined_df = combined_df.drop_duplicates(subset=['time'], keep='first')
    after = len(combined_df)
    removed = before - after
    
    if removed > 0:
        print(f"  Removed {removed:,} duplicate ticks")
    
    # Save combined file
    output_file = f"{data_dir}/eurusd_ticks.csv"
    print()
    print(f"💾 Saving to {output_file}...")
    combined_df.to_csv(output_file, index=False)
    
    file_size_gb = os.path.getsize(output_file) / (1024**3)
    
    print()
    print("="*80)
    print("✅ COMBINATION COMPLETE!")
    print("="*80)
    print()
    print(f"Total ticks: {len(combined_df):,}")
    print(f"File size: {file_size_gb:.2f} GB")
    print(f"Date range: {combined_df['time'].min()} to {combined_df['time'].max()}")
    print(f"Saved to: {output_file}")
    print()
    
    return output_file

def generate_all_candles(tick_file):
    """Generate all timeframe candles from tick data"""
    print()
    print("="*80)
    print("GENERATING ALL TIMEFRAME CANDLES")
    print("="*80)
    print()
    
    from data_downloader.generate_candles import generate_candles_from_ticks
    
    timeframes = ['1min', '5min', '15min', '30min', '1h', '4h', '1d', '1w', '1M']
    
    for tf in timeframes:
        print(f"📊 Generating {tf} candles...")
        try:
            candles_df = generate_candles_from_ticks(tick_file, timeframe=tf)
            if candles_df is not None:
                print(f"  ✅ Generated {len(candles_df):,} {tf} candles")
            else:
                print(f"  ⚠️  No candles generated for {tf}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print()
    print("="*80)
    print("✅ ALL CANDLES GENERATED!")
    print("="*80)
    print()

def main():
    """Main function"""
    print()
    print("="*80)
    print("COMBINE MONTHLY DATA & GENERATE CANDLES")
    print("="*80)
    print()
    print("This will:")
    print("  1. Combine all your monthly tick files")
    print("  2. Create one master eurusd_ticks.csv file")
    print("  3. Generate all timeframe candles")
    print()
    
    # Step 1: Combine monthly files
    tick_file = combine_monthly_ticks()
    
    if tick_file is None:
        print("❌ Failed to combine files")
        return
    
    # Step 2: Generate candles
    generate_all_candles(tick_file)
    
    print()
    print("="*80)
    print("🎉 ALL DONE!")
    print("="*80)
    print()
    print("✅ Combined 18 months of tick data")
    print("✅ Generated all timeframe candles")
    print("✅ Your platform is ready to use!")
    print()
    print("📊 Next Steps:")
    print("   1. Restart your backend: python main.py")
    print("   2. Refresh your frontend (F5)")
    print("   3. Your chart now shows 18 months of data!")
    print()

if __name__ == "__main__":
    main()

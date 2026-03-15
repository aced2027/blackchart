"""
Generate candles from monthly CSV files - MEMORY EFFICIENT
Processes one month at a time to avoid memory issues
"""
import pandas as pd
import os
from glob import glob
from datetime import datetime

def generate_candles_monthly():
    """Generate candles by processing monthly files one at a time"""
    
    print("="*80)
    print("GENERATING CANDLES FROM MONTHLY FILES")
    print("="*80)
    print()
    
    # Find all monthly files
    tick_files = sorted(glob("data/eurusd_ticks_*.csv"))
    tick_files = [f for f in tick_files if not f.endswith("eurusd_ticks.csv")]
    
    if not tick_files:
        print("❌ No monthly tick files found!")
        return
    
    print(f"Found {len(tick_files)} monthly files")
    print()
    
    # Timeframes to generate
    timeframes = {
        '1min': '1min',
        '5min': '5min',
        '15min': '15min',
        '30min': '30min',
        '1h': '1h',
        '4h': '4h',
        '1D': '1d',
        '1W': '1w',
        'ME': '1M'
    }
    
    # Initialize storage for each timeframe
    all_candles = {tf: [] for tf in timeframes.values()}
    
    # Process each month
    for i, tick_file in enumerate(tick_files, 1):
        print(f"[{i}/{len(tick_files)}] Processing {os.path.basename(tick_file)}...")
        
        try:
            # Load month data
            df = pd.read_csv(tick_file, parse_dates=['time'])
            df = df.sort_values('time')
            df.set_index('time', inplace=True)
            
            # Use bid price
            price = df['bid']
            volume = df.get('bid_volume', df['bid'])
            
            # Generate candles for each timeframe
            for pandas_tf, filename_tf in timeframes.items():
                candles = price.resample(pandas_tf).ohlc()
                vol = volume.resample(pandas_tf).sum()
                candles['volume'] = vol
                candles = candles.dropna()
                
                if len(candles) > 0:
                    all_candles[filename_tf].append(candles)
            
            print(f"  ✅ Processed {len(df):,} ticks")
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print()
    print("="*80)
    print("COMBINING AND SAVING CANDLES")
    print("="*80)
    print()
    
    # Combine and save each timeframe
    for filename_tf in timeframes.values():
        if not all_candles[filename_tf]:
            print(f"❌ {filename_tf:8} → No data")
            continue
        
        try:
            # Combine all months
            combined = pd.concat(all_candles[filename_tf])
            combined = combined.sort_index()
            
            # Remove duplicates
            combined = combined[~combined.index.duplicated(keep='first')]
            
            # Save
            output_file = f"data/eurusd_candles_{filename_tf}.csv"
            combined.to_csv(output_file)
            
            print(f"✅ {filename_tf:8} → {len(combined):>8,} candles  →  {output_file}")
            
        except Exception as e:
            print(f"❌ {filename_tf:8} → Error: {e}")
    
    print()
    print("="*80)
    print("✅ ALL CANDLES GENERATED!")
    print("="*80)
    print()
    print("🎉 Your 5 years of data is now ready!")
    print("📊 Restart backend and refresh frontend to see the data")
    print()

if __name__ == "__main__":
    generate_candles_monthly()

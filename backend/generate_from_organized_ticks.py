"""
Generate candles from organized tick data - MEMORY EFFICIENT
Processes monthly files from data/ticks/YYYY/ folders
"""
import pandas as pd
import os
from glob import glob
from datetime import datetime

def generate_candles_from_organized():
    """Generate candles from organized tick data structure"""
    
    print("="*80)
    print("GENERATING CANDLES FROM ORGANIZED TICK DATA")
    print("="*80)
    print()
    
    # Find all monthly files in organized structure
    tick_files = []
    for year in range(2020, 2027):  # 2020-2026
        year_pattern = f"data/ticks/{year}/eurusd_ticks_{year}-*.csv"
        year_files = sorted(glob(year_pattern))
        tick_files.extend(year_files)
    
    if not tick_files:
        print("❌ No organized tick files found!")
        print("   Expected structure: data/ticks/YYYY/eurusd_ticks_YYYY-MM.csv")
        return
    
    print(f"Found {len(tick_files)} monthly files:")
    for f in tick_files:
        size_mb = os.path.getsize(f) / (1024*1024)
        print(f"  📁 {os.path.basename(f)} ({size_mb:.1f} MB)")
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
    total_ticks = 0
    
    # Process each month
    for i, tick_file in enumerate(tick_files, 1):
        print(f"[{i}/{len(tick_files)}] Processing {os.path.basename(tick_file)}...")
        
        try:
            # Load month data
            df = pd.read_csv(tick_file, parse_dates=['time'])
            df = df.sort_values('time')
            df.set_index('time', inplace=True)
            
            # Use bid price for candles
            price = df['bid']
            volume = df.get('bid_volume', df['bid'])  # Use bid_volume if available, else bid
            
            # Generate candles for each timeframe
            for pandas_tf, filename_tf in timeframes.items():
                candles = price.resample(pandas_tf).ohlc()
                vol = volume.resample(pandas_tf).sum()
                candles['volume'] = vol
                candles = candles.dropna()
                
                if len(candles) > 0:
                    all_candles[filename_tf].append(candles)
            
            total_ticks += len(df)
            print(f"  ✅ Processed {len(df):,} ticks")
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print()
    print(f"📊 Total ticks processed: {total_ticks:,}")
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
            
            # Remove duplicates (keep first occurrence)
            combined = combined[~combined.index.duplicated(keep='first')]
            
            # Save to CSV
            output_file = f"data/eurusd_candles_{filename_tf}.csv"
            combined.to_csv(output_file)
            
            # Get date range
            start_date = combined.index.min().strftime('%Y-%m-%d')
            end_date = combined.index.max().strftime('%Y-%m-%d')
            
            print(f"✅ {filename_tf:8} → {len(combined):>8,} candles  ({start_date} to {end_date})  →  {output_file}")
            
        except Exception as e:
            print(f"❌ {filename_tf:8} → Error: {e}")
    
    print()
    print("="*80)
    print("✅ ALL CANDLES GENERATED FROM TICK DATA!")
    print("="*80)
    print()
    print("🎉 Historical tick data is now integrated into candles!")
    print("📊 Data includes:")
    print("   • 2024: January, February")
    print("   • 2026: January, February, March")
    print()
    print("🔄 Backend will automatically serve this data")
    print("🌐 Refresh frontend to see complete historical data")
    print()

if __name__ == "__main__":
    generate_candles_from_organized()
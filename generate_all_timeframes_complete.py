"""
Generate ALL timeframes from tick data (2021-2026)
Timeframes: 1min, 5min, 15min, 30min, 1h, 4h, 1d
"""
import pandas as pd
import json
import os
from pathlib import Path
from datetime import datetime

# Timeframe configurations
TIMEFRAMES = {
    '1min': '1min',
    '5min': '5min', 
    '15min': '15min',
    '30min': '30min',
    '1h': '1h',
    '4h': '4h',
    '1d': '1D'
}

def load_all_ticks():
    """Load all tick data from 2021-2026"""
    print("📊 Loading tick data from 2021-2026...")
    
    ticks_dir = Path('backend/data/ticks')
    all_files = sorted(ticks_dir.glob('**/eurusd_ticks_*.csv'))
    
    print(f"Found {len(all_files)} tick files")
    
    dfs = []
    for i, file in enumerate(all_files, 1):
        try:
            print(f"  [{i}/{len(all_files)}] Loading {file.name}...", end=' ')
            df = pd.read_csv(file)
            
            # Handle different column formats
            if 'timestamp' in df.columns:
                df['time'] = pd.to_datetime(df['timestamp'], unit='ms')
            elif 'time' in df.columns:
                df['time'] = pd.to_datetime(df['time'])
            else:
                print("❌ No time column found")
                continue
            
            # Get price column
            if 'price' in df.columns:
                df['price'] = df['price']
            elif 'bid' in df.columns and 'ask' in df.columns:
                df['price'] = (df['bid'] + df['ask']) / 2
            elif 'bid' in df.columns:
                df['price'] = df['bid']
            else:
                print("❌ No price column found")
                continue
            
            df = df[['time', 'price']].dropna()
            dfs.append(df)
            print(f"✓ {len(df):,} ticks")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            continue
    
    if not dfs:
        raise ValueError("No tick data loaded!")
    
    print("\n🔄 Combining all tick data...")
    all_ticks = pd.concat(dfs, ignore_index=True)
    all_ticks = all_ticks.sort_values('time').reset_index(drop=True)
    
    print(f"✅ Total ticks loaded: {len(all_ticks):,}")
    print(f"   Date range: {all_ticks['time'].min()} to {all_ticks['time'].max()}")
    
    return all_ticks

def generate_candles(ticks_df, timeframe_str, timeframe_name):
    """Generate OHLC candles from ticks for a specific timeframe"""
    print(f"\n🕯️  Generating {timeframe_name} candles...")
    
    # Set time as index
    df = ticks_df.copy()
    df.set_index('time', inplace=True)
    
    # Resample to create OHLC candles
    candles = df['price'].resample(timeframe_str).ohlc()
    
    # Remove candles with no data
    candles = candles.dropna()
    
    # Reset index to get time as column
    candles = candles.reset_index()
    
    # Format for JSON output
    result = []
    for _, row in candles.iterrows():
        result.append({
            't': int(row['time'].timestamp() * 1000),  # milliseconds
            'o': round(float(row['open']), 5),
            'h': round(float(row['high']), 5),
            'l': round(float(row['low']), 5),
            'c': round(float(row['close']), 5)
        })
    
    print(f"   ✓ Generated {len(result):,} candles")
    print(f"   Date range: {candles['time'].min()} to {candles['time'].max()}")
    
    return result

def save_candles(candles, filename):
    """Save candles to JSON file"""
    output = {'candles': candles}
    
    filepath = Path(filename)
    with open(filepath, 'w') as f:
        json.dump(output, f)
    
    file_size = filepath.stat().st_size / (1024 * 1024)  # MB
    print(f"   💾 Saved to {filename} ({file_size:.2f} MB)")

def main():
    print("=" * 60)
    print("🚀 COMPLETE TIMEFRAME GENERATOR")
    print("   Processing 2021-2026 tick data")
    print("   Timeframes: 1min, 5min, 15min, 30min, 1h, 4h, 1d")
    print("=" * 60)
    
    start_time = datetime.now()
    
    # Load all tick data
    ticks = load_all_ticks()
    
    # Generate each timeframe
    for tf_name, tf_str in TIMEFRAMES.items():
        try:
            candles = generate_candles(ticks, tf_str, tf_name)
            filename = f'candles_{tf_name}.json'
            save_candles(candles, filename)
        except Exception as e:
            print(f"   ❌ Error generating {tf_name}: {e}")
            continue
    
    elapsed = datetime.now() - start_time
    print("\n" + "=" * 60)
    print(f"✅ ALL TIMEFRAMES GENERATED!")
    print(f"   Total time: {elapsed}")
    print("=" * 60)
    
    # Summary
    print("\n📋 GENERATED FILES:")
    for tf_name in TIMEFRAMES.keys():
        filename = f'candles_{tf_name}.json'
        if os.path.exists(filename):
            size = os.path.getsize(filename) / (1024 * 1024)
            with open(filename) as f:
                data = json.load(f)
                count = len(data['candles'])
            print(f"   ✓ {filename:20s} - {count:,} candles ({size:.2f} MB)")

if __name__ == '__main__':
    main()

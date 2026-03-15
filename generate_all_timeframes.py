#!/usr/bin/env python3
"""Generate candles for all timeframes from tick data"""

import pandas as pd
import json
import glob
from pathlib import Path

print("🕐 Generating candles for all timeframes...")

# Find all tick files
tick_files = sorted(glob.glob("backend/data/ticks/**/*.csv", recursive=True))
print(f"Found {len(tick_files)} tick files")

if not tick_files:
    print("❌ No tick files found!")
    exit(1)

# Load all ticks
print("Loading tick data...")
dfs = []
for f in tick_files:
    try:
        df = pd.read_csv(f)
        # Check for either 'time' or 'timestamp' column
        if ('time' in df.columns or 'timestamp' in df.columns) and 'bid' in df.columns:
            # Rename 'time' to 'timestamp' if needed
            if 'time' in df.columns:
                df = df.rename(columns={'time': 'timestamp'})
            dfs.append(df)
            print(f"  ✓ {Path(f).name}: {len(df):,} ticks")
    except Exception as e:
        print(f"  ✗ {Path(f).name}: {e}")

if not dfs:
    print("❌ No valid tick data loaded!")
    exit(1)

# Combine all ticks
print("\nCombining tick data...")
df = pd.concat(dfs, ignore_index=True)
print(f"Total ticks: {len(df):,}")

# Convert timestamp to datetime (handle both string and numeric formats)
if df['timestamp'].dtype == 'object':
    df['timestamp'] = pd.to_datetime(df['timestamp'])
else:
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
df = df.sort_values('timestamp').reset_index(drop=True)

# Use bid price as close price
df['price'] = df['bid']

# Define timeframes
timeframes = {
    '1min': '1min',
    '5min': '5min', 
    '15min': '15min',
    '30min': '30min',
    '1h': '1h',
    '4h': '4h',
    '1d': '1D',
    '1w': '1W'
}

print(f"\nGenerating candles from {df['timestamp'].min()} to {df['timestamp'].max()}")

for name, freq in timeframes.items():
    print(f"\n📊 Generating {name} candles...")
    
    # Resample to OHLC
    ohlc = df.set_index('timestamp')['price'].resample(freq).ohlc()
    
    # Count ticks per candle
    volume = df.set_index('timestamp')['price'].resample(freq).count()
    
    # Combine
    candles_df = pd.DataFrame({
        'timestamp': ohlc.index,
        'open': ohlc['open'],
        'high': ohlc['high'],
        'low': ohlc['low'],
        'close': ohlc['close'],
        'volume': volume.values
    })
    
    # Remove NaN rows
    candles_df = candles_df.dropna()
    
    # Convert to JSON format
    candles = []
    for _, row in candles_df.iterrows():
        candles.append({
            't': int(row['timestamp'].timestamp() * 1000),
            'o': round(row['open'], 5),
            'h': round(row['high'], 5),
            'l': round(row['low'], 5),
            'c': round(row['close'], 5),
            'v': int(row['volume'])
        })
    
    # Save to file
    output = {
        'symbol': 'EURUSD',
        'timeframe': name,
        'candles': candles
    }
    
    filename = f"candles_{name}.json"
    with open(filename, 'w') as f:
        json.dump(output, f)
    
    file_size = Path(filename).stat().st_size / 1024 / 1024
    print(f"  ✓ {len(candles):,} candles saved to {filename} ({file_size:.2f} MB)")

print("\n✅ All timeframes generated!")
print("\nGenerated files:")
for name in timeframes.keys():
    filename = f"candles_{name}.json"
    if Path(filename).exists():
        size = Path(filename).stat().st_size / 1024 / 1024
        print(f"  • {filename} ({size:.2f} MB)")

#!/usr/bin/env python3
"""Generate only key timeframes: 1h, 4h, 1d"""

import pandas as pd
import json
from pathlib import Path
import glob

print("🚀 Generating key timeframes (1h, 4h, 1d)")

# Key timeframes only
timeframes = {
    '1h': '1h',
    '4h': '4h',
    '1d': '1D'
}

# Find tick files
tick_files = sorted(glob.glob("backend/data/ticks/**/*.csv", recursive=True))
print(f"Found {len(tick_files)} tick files\n")

# Process each timeframe
for tf_name, tf_freq in timeframes.items():
    print(f"📊 Generating {tf_name} candles...")
    
    all_candles = []
    
    # Process files one by one
    for i, tick_file in enumerate(tick_files):
        try:
            # Load tick file (only needed columns)
            df = pd.read_csv(tick_file, usecols=['time', 'bid'])
            df = df.rename(columns={'time': 'timestamp', 'bid': 'price'})
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Resample to OHLC
            ohlc = df.set_index('timestamp')['price'].resample(tf_freq).ohlc()
            volume = df.set_index('timestamp')['price'].resample(tf_freq).count()
            
            # Convert to list
            for ts, row in ohlc.iterrows():
                if pd.notna(row['open']):
                    all_candles.append({
                        't': int(ts.timestamp() * 1000),
                        'o': round(row['open'], 5),
                        'h': round(row['high'], 5),
                        'l': round(row['low'], 5),
                        'c': round(row['close'], 5),
                        'v': int(volume.loc[ts])
                    })
            
            if (i + 1) % 10 == 0:
                print(f"  {i+1}/{len(tick_files)} files processed...")
                
        except Exception as e:
            print(f"  ✗ Error: {e}")
    
    # Sort by timestamp
    all_candles.sort(key=lambda x: x['t'])
    
    # Save
    output = {
        'symbol': 'EURUSD',
        'timeframe': tf_name,
        'candles': all_candles
    }
    
    filename = f"candles_{tf_name}.json"
    with open(filename, 'w') as f:
        json.dump(output, f)
    
    size = Path(filename).stat().st_size / 1024 / 1024
    print(f"  ✓ {len(all_candles):,} candles → {filename} ({size:.2f} MB)\n")

print("✅ Key timeframes generated!")
print("\nYou can now switch between 1h, 4h, and 1d in the chart.")

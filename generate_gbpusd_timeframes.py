"""
Generate GBPUSD timeframes from tick data
Creates: gbpusd_candles_1min.json, gbpusd_candles_5min.json, etc.
"""
import pandas as pd
import json
import os
from pathlib import Path
from datetime import datetime

TIMEFRAMES = {
    '1min': '1min',
    '5min': '5min', 
    '15min': '15min',
    '30min': '30min',
    '1h': '1h',
    '4h': '4h',
    '1d': '1D'
}

def process_gbpusd_year_ticks(year):
    """Load GBPUSD tick data for a specific year"""
    print(f"  Loading GBPUSD {year} ticks...", end=' ')
    
    ticks_dir = Path(f'backend/data/ticks/{year}')
    if not ticks_dir.exists():
        print("❌ Not found")
        return None
    
    files = sorted(ticks_dir.glob('gbpusd_ticks_*.csv'))
    if not files:
        print("❌ No GBPUSD files")
        return None
    
    dfs = []
    for file in files:
        try:
            df = pd.read_csv(file)
            
            if 'timestamp' in df.columns:
                df['time'] = pd.to_datetime(df['timestamp'], unit='ms')
            elif 'time' in df.columns:
                df['time'] = pd.to_datetime(df['time'])
            else:
                continue
            
            if 'price' in df.columns:
                df['price'] = df['price']
            elif 'bid' in df.columns and 'ask' in df.columns:
                df['price'] = (df['bid'] + df['ask']) / 2
            elif 'bid' in df.columns:
                df['price'] = df['bid']
            else:
                continue
            
            df = df[['time', 'price']].dropna()
            dfs.append(df)
        except:
            continue
    
    if not dfs:
        return None
    
    year_ticks = pd.concat(dfs, ignore_index=True)
    year_ticks = year_ticks.sort_values('time').reset_index(drop=True)
    print(f"✓ {len(year_ticks):,} ticks")
    return year_ticks

def generate_candles_from_ticks(ticks_df, timeframe_str):
    """Generate OHLC candles from ticks"""
    df = ticks_df.copy()
    df.set_index('time', inplace=True)
    candles = df['price'].resample(timeframe_str).ohlc()
    candles = candles.dropna().reset_index()
    
    result = []
    for _, row in candles.iterrows():
        result.append({
            't': int(row['time'].timestamp() * 1000),
            'o': round(float(row['open']), 5),
            'h': round(float(row['high']), 5),
            'l': round(float(row['low']), 5),
            'c': round(float(row['close']), 5)
        })
    return result

def main():
    print("=" * 60)
    print("🚀 GBPUSD TIMEFRAME GENERATOR")
    print("=" * 60)
    
    years = [2021, 2022, 2023, 2024, 2025, 2026]
    
    # Initialize storage for each timeframe
    all_candles = {tf: [] for tf in TIMEFRAMES.keys()}
    
    # Process each year
    for year in years:
        print(f"\n📅 Processing GBPUSD {year}...")
        ticks = process_gbpusd_year_ticks(year)
        
        if ticks is None:
            continue
        
        # Generate candles for each timeframe
        for tf_name, tf_str in TIMEFRAMES.items():
            try:
                candles = generate_candles_from_ticks(ticks, tf_str)
                all_candles[tf_name].extend(candles)
                print(f"     {tf_name:6s}: +{len(candles):,} candles")
            except Exception as e:
                print(f"     {tf_name:6s}: ❌ {e}")
    
    # Save all timeframes
    print("\n💾 Saving GBPUSD timeframe files...")
    for tf_name, candles in all_candles.items():
        if candles:
            filename = f'gbpusd_candles_{tf_name}.json'
            with open(filename, 'w') as f:
                json.dump({'candles': candles}, f)
            size = os.path.getsize(filename) / (1024 * 1024)
            print(f"   ✓ {filename:25s} - {len(candles):,} candles ({size:.2f} MB)")
    
    print("\n" + "=" * 60)
    print("✅ GBPUSD TIMEFRAMES COMPLETE!")
    print("=" * 60)

if __name__ == '__main__':
    main()
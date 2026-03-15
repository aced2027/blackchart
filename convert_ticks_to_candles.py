"""
Convert tick data (2021-2026) to candlesticks for TradingView-style chart
"""
import pandas as pd
import json
from pathlib import Path
from datetime import datetime

def convert_ticks_to_candles(tick_file, timeframe='1h'):
    """Convert tick data to OHLC candles"""
    print(f"Loading ticks from {tick_file}...")
    
    # Read tick data
    df = pd.read_csv(tick_file)
    
    # Ensure we have the right columns
    if 'timestamp' in df.columns:
        df['time'] = pd.to_datetime(df['timestamp'], unit='ms')
    elif 'time' in df.columns:
        df['time'] = pd.to_datetime(df['time'], unit='ms')
    else:
        print(f"Error: No timestamp column found in {tick_file}")
        return None
    
    # Use bid or ask price (or average)
    if 'bid' in df.columns and 'ask' in df.columns:
        df['price'] = (df['bid'] + df['ask']) / 2
    elif 'price' in df.columns:
        df['price'] = df['price']
    elif 'close' in df.columns:
        df['price'] = df['close']
    else:
        print(f"Error: No price column found")
        return None
    
    df = df.set_index('time')
    
    # Resample to candles
    print(f"Resampling to {timeframe} candles...")
    candles = df['price'].resample(timeframe).ohlc()
    candles['volume'] = df['price'].resample(timeframe).count()
    
    # Remove NaN rows
    candles = candles.dropna()
    
    print(f"Generated {len(candles)} candles")
    return candles

def save_candles_json(candles, output_file):
    """Save candles to JSON format for chart"""
    data = {
        "symbol": "EURUSD",
        "timeframe": "1h",
        "candles": []
    }
    
    for timestamp, row in candles.iterrows():
        data["candles"].append({
            "t": int(timestamp.timestamp() * 1000),
            "o": round(row['open'], 5),
            "h": round(row['high'], 5),
            "l": round(row['low'], 5),
            "c": round(row['close'], 5),
            "v": int(row['volume'])
        })
    
    with open(output_file, 'w') as f:
        json.dump(data, f)
    
    print(f"Saved {len(data['candles'])} candles to {output_file}")

if __name__ == "__main__":
    # Find tick data files
    tick_dir = Path("backend/data/ticks")
    
    # Process ALL years 2021-2026
    years = ['2021', '2022', '2023', '2024', '2025', '2026']
    all_candles = []
    
    for year in years:
        year_dir = tick_dir / year
        if not year_dir.exists():
            print(f"Skipping {year} - directory not found")
            continue
            
        print(f"\n=== Processing {year} ===")
        
        # Get all CSV files for this year
        csv_files = sorted(year_dir.glob("*.csv"))
        
        print(f"Found {len(csv_files)} files for {year}")
        
        # Process ALL months
        for csv_file in csv_files:
            candles = convert_ticks_to_candles(csv_file, timeframe='1h')
            if candles is not None:
                all_candles.append(candles)
    
    if all_candles:
        # Combine all candles
        print("\n=== Combining all candles ===")
        combined = pd.concat(all_candles)
        combined = combined.sort_index()
        
        # Save to JSON
        output_file = "tradingview_candles.json"
        save_candles_json(combined, output_file)
        
        print(f"\n✓ Done! Created {output_file}")
        print(f"  Total candles: {len(combined)}")
        print(f"  Date range: {combined.index[0]} to {combined.index[-1]}")
    else:
        print("\n✗ No candles generated")

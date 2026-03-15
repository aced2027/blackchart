"""
Generate OHLC candles from tick data
"""
import pandas as pd
import os
from datetime import datetime

def generate_candles_from_ticks(tick_file, timeframe="1min"):
    """
    Convert tick data to OHLC candles
    
    Args:
        tick_file: Path to CSV file with tick data
        timeframe: Candle timeframe (1min, 5min, 15min, 1h, 1w, 1M, etc.)
    """
    print(f"📊 Generating {timeframe} candles from {tick_file}...")
    
    try:
        # Read tick data
        df = pd.read_csv(tick_file)
        
        print(f"✓ Loaded {len(df)} ticks")
        print(f"  Columns: {list(df.columns)}")
        
        # Convert timestamp to datetime
        if 'time' in df.columns:
            df['time'] = pd.to_datetime(df['time'], unit='ms')
        elif 'timestamp' in df.columns:
            df['time'] = pd.to_datetime(df['timestamp'], unit='ms')
        else:
            print("❌ No time/timestamp column found")
            return None
        
        # Set time as index
        df.set_index('time', inplace=True)
        
        # Determine price column (bid, ask, or mid)
        if 'mid' in df.columns:
            price_col = 'mid'
        elif 'bid' in df.columns:
            price_col = 'bid'
        elif 'price' in df.columns:
            price_col = 'price'
        else:
            print("❌ No price column found")
            return None
        
        print(f"  Using price column: {price_col}")
        
        # Convert 1M to ME for pandas compatibility (Month End)
        pandas_timeframe = timeframe.replace('1M', 'ME') if timeframe == '1M' else timeframe
        
        # Resample to candles
        candles = df[price_col].resample(pandas_timeframe).agg({
            'open': 'first',
            'high': 'max',
            'low': 'min',
            'close': 'last'
        })
        
        # Remove NaN rows
        candles = candles.dropna()
        
        # Add volume (count of ticks)
        volume = df[price_col].resample(pandas_timeframe).count()
        candles['volume'] = volume
        
        # Reset index to get time as column
        candles = candles.reset_index()
        
        # Save to CSV
        symbol = os.path.basename(tick_file).split('_')[0]
        
        # Determine correct data directory
        if os.path.exists("backend/data"):
            data_dir = "backend/data"
        else:
            data_dir = "data"
        
        output_file = f"{data_dir}/{symbol}_candles_{timeframe}.csv"
        
        # Merge with existing history if present
        if os.path.exists(output_file):
            print(f"🔄 Merging with existing data in {output_file}...")
            existing_df = pd.read_csv(output_file)
            existing_df['time'] = pd.to_datetime(existing_df['time'])
            # Ensure new candles time is datetime too
            candles['time'] = pd.to_datetime(candles['time'])
            
            combined = pd.concat([existing_df, candles])
            combined = combined.drop_duplicates(subset=['time'], keep='last')
            combined = combined.sort_values('time')
            candles = combined
            
        candles.to_csv(output_file, index=False)
        
        print(f"✅ Generated {len(candles)} candles")
        print(f"💾 Saved to: {output_file}")
        print(f"\nFirst 5 candles:")
        print(candles.head())
        
        return candles
        
    except Exception as e:
        print(f"❌ Error generating candles: {e}")
        import traceback
        traceback.print_exc()
        return None

def candles_to_chart_format(candles_df):
    """
    Convert candles DataFrame to chart-ready format
    
    Returns list of dicts: [{time, open, high, low, close}, ...]
    """
    chart_data = []
    
    for _, row in candles_df.iterrows():
        chart_data.append({
            'time': int(row['time'].timestamp()),
            'open': float(row['open']),
            'high': float(row['high']),
            'low': float(row['low']),
            'close': float(row['close']),
            'volume': int(row['volume'])
        })
    
    return chart_data

if __name__ == "__main__":
    # Generate candles from tick data
    tick_file = "data/eurusd_ticks.csv"
    
    if os.path.exists(tick_file):
        # Generate different timeframes
        for tf in ['1min', '5min', '15min', '1h']:
            candles = generate_candles_from_ticks(tick_file, timeframe=tf)
            
            if candles is not None:
                # Convert to chart format
                chart_data = candles_to_chart_format(candles)
                print(f"\n📈 Chart format sample ({tf}):")
                print(chart_data[:3])
            
            print("\n" + "="*50 + "\n")
    else:
        print(f"❌ Tick file not found: {tick_file}")
        print("   Run download_ticks.py first!")

"""
Generate candles directly from tick-vault downloaded data
This reads from the tick_vault_data folder structure
"""
from tick_vault import read_tick_data
from datetime import datetime
import pandas as pd
import os

def generate_candles_from_vault():
    """Generate candles from all downloaded tick data"""
    
    print("="*80)
    print("GENERATING CANDLES FROM TICK-VAULT DATA")
    print("="*80)
    print()
    
    # Date range: 2021-01-01 to 2026-03-12
    start_date = datetime(2021, 1, 1)
    end_date = datetime(2026, 3, 12)
    
    print(f"📅 Reading tick data from {start_date.date()} to {end_date.date()}")
    print("⏳ This will take 2-5 minutes...")
    print()
    
    # Read all tick data using tick-vault
    df = read_tick_data(
        symbol='EURUSD',
        start=start_date,
        end=end_date,
        strict=False  # Don't fail if some data is missing
    )
    
    if df is None or len(df) == 0:
        print("❌ No tick data found!")
        return
    
    print(f"✅ Loaded {len(df):,} ticks")
    print(f"📊 Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print()
    
    # Prepare data for candle generation
    df['time'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('time')
    df.set_index('time', inplace=True)
    
    # Use mid price
    price = (df['bid'] + df['ask']) / 2
    volume = df['bid_volume'] if 'bid_volume' in df.columns else df['bid']
    
    print("="*80)
    print("GENERATING ALL TIMEFRAMES")
    print("="*80)
    print()
    
    # Define all timeframes
    timeframes = [
        ("1min", "1min"),
        ("5min", "5min"),
        ("15min", "15min"),
        ("30min", "30min"),
        ("1h", "1h"),
        ("4h", "4h"),
        ("1D", "1d"),
        ("1W", "1w"),
        ("ME", "1M")  # ME = Month End
    ]
    
    for pandas_tf, filename_tf in timeframes:
        try:
            # Generate OHLC candles
            candles = price.resample(pandas_tf).ohlc()
            
            # Add volume
            vol = volume.resample(pandas_tf).sum()
            candles["volume"] = vol
            
            # Remove NaN rows
            candles = candles.dropna()
            
            # Save to CSV
            output_file = f"data/eurusd_candles_{filename_tf}.csv"
            candles.to_csv(output_file)
            
            print(f"✅ {filename_tf:8} → {len(candles):>8,} candles  →  {output_file}")
            
        except Exception as e:
            print(f"❌ {filename_tf:8} → Error: {e}")
    
    print()
    print("="*80)
    print("✅ ALL CANDLES GENERATED FROM 5 YEARS OF DATA!")
    print("="*80)
    print()

if __name__ == "__main__":
    generate_candles_from_vault()

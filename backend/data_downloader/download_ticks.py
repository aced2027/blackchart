"""
Download tick data from Dukascopy using tick-vault
"""
import pandas as pd
from datetime import datetime, timedelta
import os
import asyncio

try:
    from tick_vault import download_range, read_tick_data
    TICK_VAULT_AVAILABLE = True
except ImportError:
    print("⚠️  tick-vault not installed. Install with: pip install tick-vault")
    TICK_VAULT_AVAILABLE = False

async def _download_async(symbol, start_date, end_date):
    """Async wrapper for download_range"""
    await download_range(
        symbol=symbol,
        start=start_date,
        end=end_date
    )

def download_dukascopy_ticks(symbol="EURUSD", days_back=7):
    """
    Download tick data from Dukascopy
    
    Args:
        symbol: Currency pair (EURUSD, GBPUSD, etc.)
        days_back: How many days of data to download (default 7 to ensure we get weekday data)
    """
    if not TICK_VAULT_AVAILABLE:
        print("❌ tick-vault library not available")
        return None
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days_back)
    
    print(f"📥 Downloading {symbol} tick data...")
    print(f"   From: {start_date.strftime('%Y-%m-%d %H:%M')}")
    print(f"   To: {end_date.strftime('%Y-%m-%d %H:%M')}")
    
    try:
        # Create data directory if it doesn't exist
        os.makedirs("data", exist_ok=True)
        
        # Download tick data using tick-vault (async)
        # tick-vault downloads to ~/.tick_vault by default
        asyncio.run(_download_async(symbol, start_date, end_date))
        
        print(f"✅ Downloaded tick data from Dukascopy")
        
        # Read the downloaded data
        print(f"📖 Reading tick data...")
        df = read_tick_data(
            symbol=symbol,
            start=start_date,
            end=end_date,
            strict=False  # Clip to available range
        )
        
        if df is not None and len(df) > 0:
            # Save to CSV in our data directory
            filename = f"data/{symbol.lower()}_ticks.csv"
            df.to_csv(filename, index=False)
            
            print(f"✅ Processed {len(df)} ticks")
            print(f"💾 Saved to: {filename}")
            print(f"\nFirst 5 ticks:")
            print(df.head())
            print(f"\nColumns: {list(df.columns)}")
            
            return df
        else:
            print("❌ No data received")
            return None
            
    except Exception as e:
        print(f"❌ Error downloading data: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # Download EUR/USD tick data for the last 7 days (to ensure we get weekday data)
    df = download_dukascopy_ticks("EURUSD", days_back=7)
    
    if df is not None:
        print(f"\n📊 Data shape: {df.shape}")
        print(f"📊 Columns: {list(df.columns)}")

from datetime import datetime
from typing import List, Dict, Optional
import os
import json

# In-memory storage for now (replace with PostgreSQL later)
candles_storage = []

async def get_candles(
    symbol: str,
    timeframe: str,
    start: datetime = None,
    end: datetime = None,
    limit: int = 500
) -> List[Dict]:
    """Fetch historical candles from storage"""
    filtered = [c for c in candles_storage 
                if c["symbol"] == symbol and c["timeframe"] == timeframe]
    return filtered[-limit:]

async def get_symbols() -> List[str]:
    """Get available trading symbols"""
    return [
        "EUR_USD", "GBP_USD", "USD_JPY", "USD_CHF",
        "AUD_USD", "USD_CAD", "NZD_USD", "EUR_GBP",
        "EUR_JPY", "GBP_JPY"
    ]

async def save_candle(candle: Dict):
    """Save candle to storage"""
    candles_storage.append(candle)

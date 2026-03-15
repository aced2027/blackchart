import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict
import random
import os
from dotenv import load_dotenv

class CandleGenerator:
    """Real-time candle generator using Dukascopy data"""
    
    def __init__(self):
        self.current_candles: Dict[str, Dict] = defaultdict(dict)
        self.timeframes = {
            "1m": 60,
            "5m": 300,
            "15m": 900,
            "1h": 3600,
            "1d": 86400,
            "1w": 604800,
            "1M": 2592000
        }
        self.running = False
        self.base_price = 1.0850  # Starting EUR/USD price
        self.use_mock = not os.getenv("OANDA_API_KEY")  # Use mock if no API key
        self.client = None

    async def start(self):
        """Start collecting and generating candles"""
        self.running = True
        
        print("✓ Using Dukascopy (FREE tick data, no API key needed)")
        from .dukascopy_client import DukascopyClient
        self.client = DukascopyClient()
        await self.client.connect()
        asyncio.create_task(self._collect_dukascopy_data())

    async def stop(self):
        """Stop collection"""
        self.running = False
        if self.client and not self.client.session.closed:
            try:
                await self.client.close()
            except:
                pass

    async def _collect_dukascopy_data(self):
        """Collect data from Dukascopy (FREE)"""
        while self.running:
            
            
            try:
                now = datetime.utcnow()
                if now.weekday() in [5, 6]:
                    print(f"⏸️  Market closed (Weekend)")
                    await asyncio.sleep(3600)
                    continue
                
                # Fetch latest hour of ticks
                ticks = await self.client.get_ticks("EURUSD", now)
                
                if ticks:
                    # Use latest tick price
                    latest = ticks[-1]
                    price = latest['mid']
                    self.base_price = price
                    
                    for tf_name in self.timeframes.keys():
                        self._update_candle("EUR_USD", tf_name, price, now)
                    
                    print(f"✓ Updated EUR/USD: {price:.5f} ({len(ticks)} ticks)")
                else:
                    # No ticks, use mock
                    change = random.uniform(-0.0005, 0.0005)
                    self.base_price += change
                    for tf_name in self.timeframes.keys():
                        self._update_candle("EUR_USD", tf_name, self.base_price, now)
                
                # Update every 60 seconds
                await asyncio.sleep(60)
                
            except Exception as e:
                print(f"✗ Dukascopy error: {e}")
                # Use mock on error
                change = random.uniform(-0.0005, 0.0005)
                self.base_price += change
                for tf_name in self.timeframes.keys():
                    self._update_candle("EUR_USD", tf_name, self.base_price, now)
                await asyncio.sleep(30)

    async def _generate_mock_ticks(self):
        """Generate mock tick data"""
        symbol = "EUR_USD"
        
        while self.running:
            try:
                now = datetime.utcnow()
                if now.weekday() in [5, 6]:
                    print(f"⏸️  Market closed (Weekend)")
                    await asyncio.sleep(3600)
                    continue
                
                change = random.uniform(-0.0005, 0.0005)
                self.base_price += change
                self.base_price = max(1.0700, min(1.1000, self.base_price))
                
                for tf_name in self.timeframes.keys():
                    self._update_candle(symbol, tf_name, self.base_price, now)
                
                await asyncio.sleep(1)
            except Exception as e:
                print(f"Mock tick error: {e}")
                await asyncio.sleep(1)

    def _update_candle(self, symbol: str, timeframe: str, price: float, timestamp: datetime):
        """Update or create candle for timeframe"""
        tf_seconds = self.timeframes[timeframe]
        candle_start = timestamp.replace(second=0, microsecond=0)
        
        minutes = (candle_start.minute // (tf_seconds // 60)) * (tf_seconds // 60)
        candle_start = candle_start.replace(minute=minutes)
        
        key = f"{symbol}_{timeframe}"
        
        if key not in self.current_candles or self.current_candles[key].get("time") != candle_start.isoformat():
            self.current_candles[key] = {
                "symbol": symbol,
                "timeframe": timeframe,
                "time": candle_start.isoformat(),
                "open": price,
                "high": price,
                "low": price,
                "close": price,
                "volume": 1
            }
        else:
            candle = self.current_candles[key]
            candle["high"] = max(candle["high"], price)
            candle["low"] = min(candle["low"], price)
            candle["close"] = price
            candle["volume"] += 1

    async def get_latest_candle(self, symbol: str, timeframe: str = "1m") -> Optional[Dict]:
        """Get the latest candle for a symbol"""
        key = f"{symbol}_{timeframe}"
        return self.current_candles.get(key)

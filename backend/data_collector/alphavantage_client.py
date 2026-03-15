import aiohttp
import asyncio
from datetime import datetime
from typing import Optional, Dict, List
import os

class AlphaVantageClient:
    def __init__(self):
        self.api_key = os.getenv("ALPHAVANTAGE_API_KEY", "MWTL2AAN6FUIOQUE")
        self.base_url = "https://www.alphavantage.co/query"
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache = {}
        
    async def connect(self):
        self.session = aiohttp.ClientSession()
        print(f"✓ Alpha Vantage client connected (API Key: {self.api_key[:8]}...)")

    async def close(self):
        if self.session:
            await self.session.close()

    async def get_forex_daily(self, from_symbol: str = "EUR", to_symbol: str = "USD") -> Optional[Dict]:
        """Fetch forex daily data from Alpha Vantage"""
        if not self.session:
            await self.connect()
        
        try:
            params = {
                "function": "FX_DAILY",
                "from_symbol": from_symbol,
                "to_symbol": to_symbol,
                "apikey": self.api_key,
                "outputsize": "full"
            }
            
            async with self.session.get(self.base_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if "Error Message" in data:
                        print(f"✗ API Error: {data['Error Message']}")
                        return None
                    
                    if "Note" in data or "Information" in data:
                        print(f"⚠️  API Limit reached")
                        return None
                    
                    return data
                else:
                    print(f"✗ HTTP Error: {response.status}")
                    return None
                    
        except Exception as e:
            print(f"✗ Error fetching daily data: {e}")
            return None

    async def get_forex_intraday(self, from_symbol: str = "EUR", to_symbol: str = "USD", interval: str = "1min") -> Optional[Dict]:
        """Fetch forex intraday data from Alpha Vantage"""
        if not self.session:
            await self.connect()
        
        try:
            params = {
                "function": "FX_INTRADAY",
                "from_symbol": from_symbol,
                "to_symbol": to_symbol,
                "interval": interval,
                "apikey": self.api_key,
                "outputsize": "full"
            }
            
            async with self.session.get(self.base_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Check for error messages
                    if "Error Message" in data:
                        print(f"✗ API Error: {data['Error Message']}")
                        return None
                    
                    if "Note" in data:
                        print(f"⚠️  API Limit: {data['Note']}")
                        return None
                    
                    return data
                else:
                    print(f"✗ HTTP Error: {response.status}")
                    return None
                    
        except Exception as e:
            print(f"✗ Error fetching data: {e}")
            return None

    def parse_candles(self, data: Dict, limit: int = 200) -> List[Dict]:
        """Convert Alpha Vantage response to candle format"""
        if not data:
            return []
        
        # Find the time series key (works for both intraday and daily)
        time_series_key = None
        for key in data.keys():
            if "Time Series" in key:
                time_series_key = key
                break
        
        if not time_series_key:
            print("✗ No time series data found")
            return []
        
        time_series = data[time_series_key]
        candles = []
        
        # Sort by timestamp (newest first) and take limit
        sorted_times = sorted(time_series.keys(), reverse=True)[:limit]
        
        for timestamp in sorted_times:
            values = time_series[timestamp]
            try:
                candle = {
                    "time": timestamp,
                    "open": float(values.get("1. open", 0)),
                    "high": float(values.get("2. high", 0)),
                    "low": float(values.get("3. low", 0)),
                    "close": float(values.get("4. close", 0)),
                    "volume": 0
                }
                candles.append(candle)
            except (ValueError, KeyError) as e:
                print(f"✗ Error parsing candle: {e}")
                continue
        
        # Reverse to get chronological order (oldest to newest)
        candles.reverse()
        return candles

    async def get_latest_price(self, from_symbol: str = "EUR", to_symbol: str = "USD") -> Optional[Dict]:
        """Get latest forex price"""
        if not self.session:
            await self.connect()
        
        try:
            params = {
                "function": "CURRENCY_EXCHANGE_RATE",
                "from_currency": from_symbol,
                "to_currency": to_symbol,
                "apikey": self.api_key
            }
            
            async with self.session.get(self.base_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if "Realtime Currency Exchange Rate" in data:
                        rate_data = data["Realtime Currency Exchange Rate"]
                        return {
                            "symbol": f"{from_symbol}{to_symbol}",
                            "bid": float(rate_data.get("8. Bid Price", 0)),
                            "ask": float(rate_data.get("9. Ask Price", 0)),
                            "price": float(rate_data.get("5. Exchange Rate", 0)),
                            "timestamp": rate_data.get("6. Last Refreshed", "")
                        }
                    
        except Exception as e:
            print(f"✗ Error fetching latest price: {e}")
        
        return None

    def map_timeframe(self, tf: str) -> str:
        """Map our timeframe format to Alpha Vantage intervals"""
        mapping = {
            "1m": "1min",
            "5m": "5min",
            "15m": "15min",
            "30m": "30min",
            "1h": "60min"
        }
        return mapping.get(tf, "1min")

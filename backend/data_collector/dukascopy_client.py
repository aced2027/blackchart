"""
Dukascopy Data Client
FREE historical tick and candle data
No API key required!
"""
import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import struct
import lzma
import zlib

class DukascopyClient:
    def __init__(self):
        self.base_url = "https://datafeed.dukascopy.com/datafeed"
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
        
    async def connect(self):
        if not self.session or self.session.closed:
            self.session = aiohttp.ClientSession()
        print("✓ Dukascopy client connected (FREE data, no API key needed)")

    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()
            print("✓ Dukascopy client session closed")

    async def get_ticks(self, symbol: str, date: datetime) -> List[Dict]:
        """
        Fetch tick data from Dukascopy
        Symbol format: EURUSD, GBPUSD, etc.
        """
        if not self.session or self.session.closed:
            await self.connect()
        
        try:
            # Dukascopy URL format
            # https://datafeed.dukascopy.com/datafeed/{PAIR}/{YEAR}/{MONTH}/{DAY}/{HOUR}h_ticks.bi5
            pair = symbol.replace('_', '')
            year = date.year
            month = str(date.month - 1).zfill(2)  # Dukascopy uses 0-indexed months
            day = str(date.day).zfill(2)
            hour = str(date.hour).zfill(2)
            
            url = f"{self.base_url}/{pair}/{year}/{month}/{day}/{hour}h_ticks.bi5"
            
            # Add timeout and retry logic
            timeout = aiohttp.ClientTimeout(total=30)
            async with self.session.get(url, timeout=timeout) as response:
                if response.status == 200:
                    compressed_data = await response.read()
                    
                    # Skip empty responses
                    if not compressed_data:
                        return []
                    
                    # Decompress LZMA data with robust error handling
                    try:
                        # Try LZMA decompression with auto format detection
                        decompressed = lzma.decompress(compressed_data, format=lzma.FORMAT_AUTO)
                        ticks = self._parse_ticks(decompressed, date)
                        return ticks
                    except lzma.LZMAError as e:
                        # Try with different LZMA format
                        try:
                            decompressed = lzma.decompress(compressed_data, format=lzma.FORMAT_ALONE)
                            ticks = self._parse_ticks(decompressed, date)
                            return ticks
                        except lzma.LZMAError:
                            # Try zlib as fallback
                            try:
                                decompressed = zlib.decompress(compressed_data)
                                ticks = self._parse_ticks(decompressed, date)
                                return ticks
                            except zlib.error:
                                # Skip this chunk and log warning instead of crashing
                                print(f"⚠️  Warning: Could not decompress data for {url} - skipping chunk")
                                return []
                    except Exception as e:
                        print(f"✗ Error decompressing data: {e}")
                        return []
                elif response.status == 404:
                    # No data available for this hour (normal for weekends/holidays)
                    return []
                else:
                    print(f"✗ HTTP {response.status} for {url}")
                    return []
                    
        except asyncio.TimeoutError:
            print(f"⚠️  Timeout fetching {url}")
            return []
        except Exception as e:
            print(f"✗ Error fetching ticks: {e}")
            return []

    def _parse_ticks(self, data: bytes, base_time: datetime) -> List[Dict]:
        """Parse binary tick data"""
        ticks = []
        chunk_size = 20  # Each tick is 20 bytes
        
        for i in range(0, len(data), chunk_size):
            if i + chunk_size > len(data):
                break
                
            chunk = data[i:i + chunk_size]
            
            try:
                # Unpack binary data
                # Format: time_offset (int), ask (int), bid (int), ask_volume (float), bid_volume (float)
                time_offset, ask, bid, ask_vol, bid_vol = struct.unpack('>3i2f', chunk)
                
                # Calculate timestamp
                tick_time = base_time + timedelta(milliseconds=time_offset)
                
                # Convert prices (Dukascopy stores as integers, divide by 100000)
                ask_price = ask / 100000.0
                bid_price = bid / 100000.0
                mid_price = (ask_price + bid_price) / 2
                
                ticks.append({
                    'time': tick_time.isoformat(),
                    'bid': bid_price,
                    'ask': ask_price,
                    'mid': mid_price,
                    'ask_volume': ask_vol,
                    'bid_volume': bid_vol
                })
            except Exception as e:
                continue
        
        return ticks

    async def get_candles(self, symbol: str, timeframe: str, start: datetime, end: datetime) -> List[Dict]:
        """
        Generate candles from tick data
        Timeframe: 1m, 5m, 15m, 30m, 1h, 4h, 1d
        """
        candles = []
        current = start
        
        # Fetch ticks hour by hour
        while current < end:
            ticks = await self.get_ticks(symbol, current)
            
            if ticks:
                # Aggregate ticks into candles
                hour_candles = self._aggregate_to_candles(ticks, timeframe)
                candles.extend(hour_candles)
            
            current += timedelta(hours=1)
            await asyncio.sleep(0.1)  # Be nice to the server
        
        return candles

    def _aggregate_to_candles(self, ticks: List[Dict], timeframe: str) -> List[Dict]:
        """Aggregate ticks into OHLC candles"""
        if not ticks:
            return []
        
        # Timeframe in minutes
        tf_minutes = {
            '1m': 1, '5m': 5, '15m': 15, '30m': 30,
            '1h': 60, '4h': 240, '1d': 1440
        }
        minutes = tf_minutes.get(timeframe, 1)
        
        candles = {}
        
        for tick in ticks:
            tick_time = datetime.fromisoformat(tick['time'])
            
            # Round to candle start time
            candle_start = tick_time.replace(second=0, microsecond=0)
            candle_start = candle_start.replace(
                minute=(candle_start.minute // minutes) * minutes
            )
            
            key = candle_start.isoformat()
            
            if key not in candles:
                candles[key] = {
                    'time': key,
                    'open': tick['mid'],
                    'high': tick['mid'],
                    'low': tick['mid'],
                    'close': tick['mid'],
                    'volume': 1
                }
            else:
                candles[key]['high'] = max(candles[key]['high'], tick['mid'])
                candles[key]['low'] = min(candles[key]['low'], tick['mid'])
                candles[key]['close'] = tick['mid']
                candles[key]['volume'] += 1
        
        # Sort by time
        return sorted(candles.values(), key=lambda x: x['time'])

    async def get_latest_candles(self, symbol: str, timeframe: str, count: int = 200) -> List[Dict]:
        """Get latest N candles"""
        end = datetime.utcnow()
        
        # Calculate start time based on timeframe
        tf_hours = {
            '1m': count / 60,
            '5m': count * 5 / 60,
            '15m': count * 15 / 60,
            '30m': count * 30 / 60,
            '1h': count,
            '4h': count * 4,
            '1d': count * 24
        }
        hours = tf_hours.get(timeframe, count / 60)
        start = end - timedelta(hours=hours)
        
        candles = await self.get_candles(symbol, timeframe, start, end)
        return candles[-count:] if len(candles) > count else candles

    def map_symbol(self, symbol: str) -> str:
        """Convert EUR_USD to EURUSD format"""
        return symbol.replace('_', '')

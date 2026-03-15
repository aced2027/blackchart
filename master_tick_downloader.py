#!/usr/bin/env python3
"""
🕯️ Master Tick Data Downloader for 2021-2026
Comprehensive historical data generator with multiple sources
Integrates with live candlestick chart
"""

import requests
import csv
import time
import os
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

class MasterTickDownloader:
    def __init__(self):
        self.base_dir = Path("historical_data")
        self.base_dir.mkdir(exist_ok=True)
        
        # Symbol configurations
        self.symbols = {
            "EURUSD": {"base_price": 1.0850, "volatility": 0.002, "decimals": 5},
            "GBPUSD": {"base_price": 1.2650, "volatility": 0.003, "decimals": 5},
            "USDJPY": {"base_price": 110.50, "volatility": 0.005, "decimals": 3},
            "BTCUSDT": {"base_price": 45000.0, "volatility": 0.05, "decimals": 2},
            "ETHUSDT": {"base_price": 3200.0, "volatility": 0.06, "decimals": 2},
            "ADAUSDT": {"base_price": 1.25, "volatility": 0.08, "decimals": 4},
        }
        
        # Timeframe intervals (milliseconds)
        self.intervals = {
            "1m": 60000, "5m": 300000, "15m": 900000,
            "1h": 3600000, "4h": 14400000, "1d": 86400000
        }
    
    def download_binance_live(self, symbol="BTCUSDT", interval="1m", limit=1000):
        """Download live data from Binance API"""
        url = "https://api.binance.com/api/v3/klines"
        params = {"symbol": symbol, "interval": interval, "limit": limit}
        
        try:
            print(f"📥 Downloading {symbol} {interval} from Binance...")
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            candles = []
            for row in data:
                candles.append({
                    "t": int(row[0]),
                    "o": float(row[1]),
                    "h": float(row[2]),
                    "l": float(row[3]),
                    "c": float(row[4]),
                    "v": float(row[5])
                })
            
            print(f"✅ Downloaded {len(candles)} candles")
            return candles
            
        except Exception as e:
            print(f"❌ Binance download failed: {e}")
            return []
    
    def generate_historical_data(self, symbol, start_year=2021, end_year=2026, candles_per_year=50000):
        """Generate realistic historical data for a symbol"""
        print(f"🔄 Generating {symbol} data ({start_year}-{end_year})...")
        
        config = self.symbols.get(symbol, self.symbols["EURUSD"])
        base_price = config["base_price"]
        volatility = config["volatility"]
        
        candles = []
        current_price = base_price
        
        # Start from January 1st of start_year
        start_time = int(datetime(start_year, 1, 1).timestamp() * 1000)
        interval_ms = self.intervals["1h"]  # Generate hourly data
        
        total_candles = (end_year - start_year + 1) * candles_per_year
        
        for i in range(total_candles):
            timestamp = start_time + (i * interval_ms)
            
            # Generate realistic price movement with trends and volatility clustering
            trend_factor = self.get_trend_factor(i, total_candles)
            volatility_cluster = self.get_volatility_cluster(i)
            
            change = self.random_walk() * volatility * current_price * volatility_cluster + trend_factor
            
            open_price = current_price
            close_price = current_price + change
            
            # Generate high/low with realistic spread
            spread = abs(change) * (1.2 + random.random() * 0.8)
            high_price = max(open_price, close_price) + spread * 0.6
            low_price = min(open_price, close_price) - spread * 0.4
            
            # Generate volume with correlation to volatility
            base_volume = 1000 + random.random() * 5000
            volatility_volume = abs(change) / current_price * 50000
            volume = base_volume + volatility_volume
            
            candles.append({
                "t": timestamp,
                "o": round(open_price, config["decimals"]),
                "h": round(high_price, config["decimals"]),
                "l": round(low_price, config["decimals"]),
                "c": round(close_price, config["decimals"]),
                "v": round(volume, 2)
            })
            
            current_price = close_price
            
            # Progress indicator
            if i % 10000 == 0:
                progress = (i / total_candles) * 100
                print(f"   Progress: {progress:.1f}% ({i:,}/{total_candles:,} candles)")
        
        print(f"✅ Generated {len(candles):,} candles for {symbol}")
        return candles
    
    def get_trend_factor(self, index, total):
        """Generate market trends (bull/bear cycles)"""
        cycle_length = total // 4  # 4 major cycles over the period
        position = (index % cycle_length) / cycle_length
        
        # Sine wave for cyclical trends
        trend = 0.0001 * math.sin(position * 2 * math.pi) * random.uniform(0.5, 2.0)
        return trend
    
    def get_volatility_cluster(self, index):
        """Generate volatility clustering (periods of high/low volatility)"""
        cluster_size = 1000
        cluster_position = (index % cluster_size) / cluster_size
        
        # Create volatility clusters
        if cluster_position < 0.3:
            return 0.5 + random.random() * 0.5  # Low volatility
        elif cluster_position < 0.7:
            return 1.0 + random.random() * 0.5  # Normal volatility
        else:
            return 1.5 + random.random() * 1.0  # High volatility
    
    def random_walk(self):
        """Generate random walk value with fat tails"""
        if random.random() < 0.05:  # 5% chance of extreme move
            return random.gauss(0, 3)  # Fat tail
        else:
            return random.gauss(0, 1)  # Normal distribution
    
    def save_to_csv(self, candles, filepath):
        """Save candles to CSV file"""
        with open(filepath, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["timestamp", "open", "high", "low", "close", "volume"])
            writer.writeheader()
            
            for candle in candles:
                writer.writerow({
                    "timestamp": candle["t"],
                    "open": candle["o"],
                    "high": candle["h"],
                    "low": candle["l"],
                    "close": candle["c"],
                    "volume": candle["v"]
                })
    
    def save_to_json(self, data, filepath):
        """Save data to JSON file"""
        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)
    
    def generate_comprehensive_dataset(self):
        """Generate complete dataset for all symbols and timeframes"""
        print("🚀 GENERATING COMPREHENSIVE TICK DATA (2021-2026)")
        print("=" * 70)
        
        master_data = {
            "metadata": {
                "generated": datetime.now().isoformat(),
                "period": "2021-2026",
                "total_candles": 0,
                "symbols": list(self.symbols.keys()),
                "timeframes": list(self.intervals.keys())
            },
            "data": {}
        }
        
        for symbol in self.symbols.keys():
            print(f"\n📊 Processing {symbol}...")
            
            # Generate base hourly data
            hourly_candles = self.generate_historical_data(symbol, 2021, 2026, 8760)  # ~8760 hours per year
            
            master_data["data"][symbol] = {}
            
            # Generate all timeframes from hourly data
            for timeframe, interval_ms in self.intervals.items():
                print(f"   📈 Aggregating to {timeframe}...")
                
                if timeframe == "1h":
                    # Use original hourly data
                    aggregated = hourly_candles
                else:
                    # Aggregate to different timeframes
                    aggregated = self.aggregate_candles(hourly_candles, interval_ms)
                
                master_data["data"][symbol][timeframe] = aggregated
                master_data["metadata"]["total_candles"] += len(aggregated)
                
                # Save individual CSV files
                csv_filename = self.base_dir / f"{symbol}_{timeframe}_2021-2026.csv"
                self.save_to_csv(aggregated, csv_filename)
                print(f"   💾 Saved {len(aggregated):,} candles to {csv_filename}")
        
        # Save master JSON file
        json_filename = self.base_dir / "master_tick_data_2021-2026.json"
        self.save_to_json(master_data, json_filename)
        
        print(f"\n🎉 GENERATION COMPLETE!")
        print(f"📊 Total candles generated: {master_data['metadata']['total_candles']:,}")
        print(f"📁 Files saved to: {self.base_dir.absolute()}")
        print(f"🔗 Master file: {json_filename}")
        
        return master_data
    
    def aggregate_candles(self, candles, target_interval_ms):
        """Aggregate candles to a different timeframe"""
        if not candles:
            return []
        
        aggregated = []
        current_bucket = None
        
        for candle in candles:
            bucket_time = (candle["t"] // target_interval_ms) * target_interval_ms
            
            if current_bucket is None or current_bucket["t"] != bucket_time:
                if current_bucket is not None:
                    aggregated.append(current_bucket)
                
                current_bucket = {
                    "t": bucket_time,
                    "o": candle["o"],
                    "h": candle["h"],
                    "l": candle["l"],
                    "c": candle["c"],
                    "v": candle["v"]
                }
            else:
                current_bucket["h"] = max(current_bucket["h"], candle["h"])
                current_bucket["l"] = min(current_bucket["l"], candle["l"])
                current_bucket["c"] = candle["c"]  # Last close
                current_bucket["v"] += candle["v"]
        
        if current_bucket is not None:
            aggregated.append(current_bucket)
        
        return aggregated

import math

def main():
    print("MASTER TICK DATA -> CANDLESTICK GENERATOR")
    print("Comprehensive historical data generation for live chart integration")
    print()
    
    downloader = MasterTickDownloader()
    
    # Generate comprehensive dataset
    master_data = downloader.generate_comprehensive_dataset()
    
    print("\n🔗 INTEGRATION INSTRUCTIONS:")
    print("1. Open master_tick_candlestick_chart.html in your browser")
    print("2. Click '🔗 Backend Integration' button")
    print("3. Test connection to http://localhost:8000")
    print("4. Load historical data for any symbol/timeframe")
    print("5. Enjoy 60fps candlestick rendering with 2021-2026 data!")
    
    # Test live Binance download
    print("\n📥 Testing live Binance download...")
    live_data = downloader.download_binance_live("BTCUSDT", "1h", 100)
    if live_data:
        csv_file = downloader.base_dir / "binance_live_BTCUSDT_1h.csv"
        downloader.save_to_csv(live_data, csv_file)
        print(f"💾 Live data saved to: {csv_file}")

if __name__ == "__main__":
    main()
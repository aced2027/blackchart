#!/usr/bin/env python3
"""
⚡ Fast Parallel Dukascopy Tick Data Downloader
- Fetches .bi5 files directly from Dukascopy CDN
- Parallel downloads with smart rate limiting (no 503s)
- Auto-retry with backoff
- Saves to CSV

Install deps:
    pip install aiohttp lzma pandas

Run:
    python dukascopy_fast_parallel.py
"""

import asyncio
import aiohttp
import struct
import lzma
import csv
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ─── CONFIG ────────────────────────────────────────────────────────────────
CONCURRENT_WORKERS = 8      # Safe default — increase to 12 if no 503s
RETRY_LIMIT        = 5      # Retries per failed hour
RETRY_DELAY        = 2.0    # Base delay (seconds) between retries (exponential)
REQUEST_DELAY      = 0.05   # Small delay between each request (50ms) to be polite
OUTPUT_DIR         = "./data/ticks"
BASE_URL           = "https://datafeed.dukascopy.com/datafeed"

# ───────────────────────────────────────────────────────────────────────────

MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June",
               "July", "August", "September", "October", "November", "December"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

def pad(n: int) -> str:
    return str(n).zfill(2)

def get_days_in_month(year: int, month: int) -> int:
    if month == 12:
        return 31
    return (datetime(year, month + 1, 1) - timedelta(days=1)).day

def decode_bi5(data: bytes, timestamp_base_ms: int) -> list:
    """Decode Dukascopy .bi5 (LZMA-compressed binary tick data)."""
    if not data:
        return []
    
    try:
        raw = lzma.decompress(data)
    except Exception:
        return []
    
    ticks = []
    record_size = 20  # 4 bytes time_ms + 4 ask + 4 bid + 4 ask_vol + 4 bid_vol
    
    for i in range(0, len(raw) - record_size + 1, record_size):
        chunk = raw[i:i + record_size]
        if len(chunk) < record_size:
            break
        
        time_ms, ask_raw, bid_raw, ask_vol, bid_vol = struct.unpack(">IIIff", chunk)
        ts = timestamp_base_ms + time_ms
        
        ticks.append({
            "time": datetime.fromtimestamp(ts / 1000, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
            "bid": round(bid_raw / 100000, 5),
            "ask": round(ask_raw / 100000, 5),
            "mid": round((ask_raw + bid_raw) / 200000, 5),
            "ask_volume": round(ask_vol, 2),
            "bid_volume": round(bid_vol, 2),
        })
    
    return ticks
    
async def fetch_hour(session: aiohttp.ClientSession,
                    semaphore: asyncio.Semaphore,
                    symbol: str,
                    year: int,
                    month: int,   # 1-based
                    day: int,
                    hour: int,
                    ) -> list:
    """Fetch one hour of tick data from Dukascopy CDN."""
    # Dukascopy URL uses 0-based month
    url = f"{BASE_URL}/{symbol}/{year}/{pad(month - 1)}/{pad(day)}/{pad(hour)}h_ticks.bi5"
    ts_base = int(datetime(year, month, day, hour, 0, 0, tzinfo=timezone.utc).timestamp() * 1000)
    
    async with semaphore:
        await asyncio.sleep(REQUEST_DELAY)  # polite throttle
        
        for attempt in range(1, RETRY_LIMIT + 1):
            try:
                async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status == 200:
                        data = await resp.read()
                        return decode_bi5(data, ts_base)
                    elif resp.status == 404:
                        return []  # No data for this hour (weekend/holiday) — normal
                    elif resp.status == 503:
                        wait = RETRY_DELAY * (2 ** (attempt - 1))
                        await asyncio.sleep(wait)
                        continue
                    else:
                        return []
            except asyncio.TimeoutError:
                await asyncio.sleep(RETRY_DELAY * attempt)
            except aiohttp.ClientError:
                await asyncio.sleep(RETRY_DELAY * attempt)
        
        return []

async def download_month(symbol: str, year: int, month: int) -> list:
    days = get_days_in_month(year, month)
    total_slots = days * 24
    
    print(f"   ⚡ Fetching {total_slots} hour-slots ({days} days × 24h) with {CONCURRENT_WORKERS} workers...")
    
    semaphore = asyncio.Semaphore(CONCURRENT_WORKERS)
    connector = aiohttp.TCPConnector(limit=CONCURRENT_WORKERS + 4, limit_per_host=CONCURRENT_WORKERS)
    
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [fetch_hour(session, semaphore, symbol, year, month, d, h)
                for d in range(1, days + 1)
                for h in range(24)]
        
        all_ticks = []
        done = 0
        
        for coro in asyncio.as_completed(tasks):
            ticks = await coro
            all_ticks.extend(ticks)
            done += 1
            
            pct = done / total_slots * 100
            bar_len = 30
            filled = int(bar_len * done // total_slots)
            bar = "█" * filled + "░" * (bar_len - filled)
            print(f"\r   [{bar}] {pct:5.1f}%  {done}/{total_slots} hrs  {len(all_ticks):,} ticks", end="", flush=True)
        
        print()  # newline after progress bar
        
        # Sort by timestamp (parallel fetch = out of order)
        all_ticks.sort(key=lambda t: t["time"])
        return all_ticks

def save_csv(ticks: list, filepath: str):
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["time", "bid", "ask", "mid", "ask_volume", "bid_volume"])
        writer.writeheader()
        writer.writerows(ticks)

def ask_input(prompt: str, default=None) -> str:
    if default is not None:
        val = input(f"  {prompt} (default: {default}): ").strip()
        return val if val else str(default)
    return input(f"  {prompt}: ").strip()

def build_month_list(sy, sm, ey, em):
    months = []
    y, m = sy, sm
    while (y, m) <= (ey, em):
        months.append((y, m))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return months

async def main():
    print("=" * 72)
    print("  ⚡ FAST Dukascopy Tick Data Downloader (Parallel Edition)")
    print("=" * 72)
    
    symbol = ask_input("Enter symbol", "EURUSD").upper()
    
    print("\nStart date:")
    start_year  = int(ask_input("Year (e.g., 2025)", 2025))
    start_month = int(ask_input("Month (1-12)", 1))
    
    print("\nEnd date:")
    end_year  = int(ask_input("Year", start_year))
    end_month = int(ask_input("Month (1-12)", start_month))
    
    months = build_month_list(start_year, start_month, end_year, end_month)
    
    print("\n" + "=" * 72)
    print("📋 DOWNLOAD PLAN")
    print("=" * 72)
    print(f"💱 Symbol : {symbol}")
    print(f"📅 Period : {start_year}-{pad(start_month)} → {end_year}-{pad(end_month)}")
    print(f"📊 Months : {len(months)}")
    print(f"⚡ Workers: {CONCURRENT_WORKERS} parallel\n")
    
    for i, (y, m) in enumerate(months):
        print(f"   {i+1}. {MONTH_NAMES[m]} {y}")
    
    confirm = input("\nContinue with download? (y/N): ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return
    
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    
    print("\n" + "=" * 72)
    print("🚀 STARTING PARALLEL DOWNLOADS")
    print("=" * 72)
    
    for i, (year, month) in enumerate(months):
        label = f"{MONTH_NAMES[month]} {year}"
        print(f"\n[{i+1}/{len(months)}] 📥 DOWNLOADING {label}...")
        
        # Create year directory and check if file exists
        year_dir = f"{OUTPUT_DIR}/{year}"
        os.makedirs(year_dir, exist_ok=True)
        filename = f"{year_dir}/eurusd_ticks_{year}-{month:02d}.csv"
        
        if os.path.exists(filename):
            size_mb = os.path.getsize(filename) / 1024 / 1024
            print(f"   ✅ Already exists: {filename} ({size_mb:.2f} MB)")
            continue
        
        ticks = await download_month(symbol, year, month)
        
        if not ticks:
            print(f"   ⚠️  No ticks for {label} (weekend/holiday or no data).")
            continue
        
        save_csv(ticks, filename)
        size_mb = os.path.getsize(filename) / 1024 / 1024
        print(f"   ✅ {len(ticks):,} ticks → {filename}  ({size_mb:.2f} MB)")
    
    print("\n" + "=" * 72)
    print(f"✅ ALL DONE! Files saved to: {os.path.abspath(OUTPUT_DIR)}")
    print("=" * 72)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Download cancelled by user.")
        sys.exit(0)
"""
convert_dukascopy.py
====================
Converts Dukascopy tick CSV (timestamp, bid, ask) → OHLCV candles JSON

Usage:
    python convert_dukascopy.py

Edit the CONFIG section below to set your file path and timeframe.
"""
import csv
import json
from datetime import datetime
from collections import defaultdict

# ═══════════════════════════════════════════════════
# CONFIG — edit these
# ═══════════════════════════════════════════════════
INPUT_FILE  = "data/ticks/2024/eurusd_ticks_2024-01.csv"  # your Dukascopy file path
OUTPUT_FILE = "candles.json"     # output file for the chart
TIMEFRAME   = "1h"               # options: 1m 5m 15m 1h 4h 1d
SYMBOL      = "EURUSD"           # used as label in output
USE_MID     = True               # True = (bid+ask)/2, False = bid only

INTERVALS = {
    "1m":  60,
    "5m":  300,
    "15m": 900,
    "1h":  3600,
    "4h":  14400,
    "1d":  86400,
}

# ═══════════════════════════════════════════════════
# TIMESTAMP PARSER — handles all Dukascopy formats
# ═══════════════════════════════════════════════════
FORMATS = [
    "%d.%m.%Y %H:%M:%S.%f",   # 12.02.2021 13:00:01.234
    "%d.%m.%Y %H:%M:%S",      # 12.02.2021 13:00:01
    "%Y.%m.%d %H:%M:%S.%f",   # 2021.02.12 13:00:01.234
    "%Y.%m.%d %H:%M:%S",      # 2021.02.12 13:00:01
    "%Y-%m-%d %H:%M:%S.%f",   # 2021-02-12 13:00:01.234
    "%Y-%m-%d %H:%M:%S",      # 2021-02-12 13:00:01
    "%m/%d/%Y %H:%M:%S.%f",   # 02/12/2021 13:00:01.234
]

def parse_ts(s):
    s = s.strip().strip('"')
    # Unix timestamp in ms
    if s.replace('.','').replace('-','').isdigit():
        v = float(s)
        return v / 1000.0 if v > 1e12 else v
    for fmt in FORMATS:
        try:
            return datetime.strptime(s, fmt).timestamp()
        except:
            pass
    raise ValueError(f"Cannot parse: '{s}'")

# ═══════════════════════════════════════════════════
# MAIN CONVERTER
# ═══════════════════════════════════════════════════
def convert(input_path, output_path, interval_secs, symbol):
    print(f"\n{'='*50}")
    print(f"  Dukascopy Tick Converter")
    print(f"  File:      {input_path}")
    print(f"  Timeframe: {TIMEFRAME}")
    print(f"  Output:    {output_path}")
    print(f"{'='*50}\n")
    
    buckets   = defaultdict(list)   # bucket_ts -> [mid_prices]
    total     = 0
    skipped   = 0
    first_row = None
    
    with open(input_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        print(f"  Columns: {header}\n")
        
        # Detect column indices
        h_low = [x.lower().strip() for x in (header or [])]
        def col(names):
            for n in names:
                if n in h_low:
                    return h_low.index(n)
            return None
        
        ts_col  = col(['timestamp','time','date','datetime','gmt time']) or 0
        bid_col = col(['bid','bid_price','bidprice'])
        ask_col = col(['ask','ask_price','askprice'])
        
        # Fallback: assume timestamp=0, bid=1, ask=2
        if bid_col is None: bid_col = 1
        if ask_col is None: ask_col = 2
        
        print(f"  Mapping → ts:{ts_col}  bid:{bid_col}  ask:{ask_col}\n")
        
        for row in reader:
            try:
                if len(row) < 3:
                    skipped += 1; continue
                
                ts    = parse_ts(row[ts_col])
                bid   = float(row[bid_col])
                ask   = float(row[ask_col])
                price = (bid + ask) / 2.0 if USE_MID else bid
                
                if price <= 0 or price != price:   # NaN guard
                    skipped += 1; continue
                
                bk = int(ts // interval_secs) * interval_secs
                buckets[bk].append(price)
                total += 1
                
                if first_row is None:
                    first_row = row
                    print(f"  First row: {row}")
                    print(f"  → ts={datetime.fromtimestamp(ts)}  mid={price:.5f}\n")
                
                if total % 500000 == 0:
                    print(f"  Processed {total:,} ticks...")
                    
            except Exception as e:
                skipped += 1
                if skipped <= 3:
                    print(f"  Skip row {total+skipped}: {e}")
                continue
    
    print(f"\n  Total ticks read : {total:,}")
    print(f"  Skipped (bad)    : {skipped:,}")
    
    # Build candles
    candles = []
    for bts in sorted(buckets.keys()):
        prices = buckets[bts]
        if not prices:
            continue
        
        o = prices[0]
        c = prices[-1]
        h = max(prices)
        l = min(prices)
        
        # Sanity check
        if h < max(o,c) or l > min(o,c) or l <= 0:
            continue
        
        candles.append({
            "t": bts * 1000,        # ms for JavaScript
            "o": round(o, 5),
            "h": round(h, 5),
            "l": round(l, 5),
            "c": round(c, 5),
        })
    
    print(f"  Candles built    : {len(candles):,}")
    
    if candles:
        d0 = datetime.fromtimestamp(candles[0]['t']/1000).strftime('%Y-%m-%d')
        d1 = datetime.fromtimestamp(candles[-1]['t']/1000).strftime('%Y-%m-%d')
        print(f"  Date range       : {d0}  →  {d1}")
    
    # Write JSON
    out = {"symbol": symbol, "timeframe": TIMEFRAME, "candles": candles}
    with open(output_path, "w") as f:
        json.dump(out, f, separators=(',', ':'))
    
    size_mb = len(json.dumps(out)) / 1e6
    print(f"\n  Saved {output_path}  ({size_mb:.2f} MB)")
    print(f"  Done! Load candles.json into your chart.\n")
    return candles

# ═══════════════════════════════════════════════════
# RUN
# ═══════════════════════════════════════════════════
if __name__ == "__main__":
    import sys
    
    # Optional CLI: python convert_dukascopy.py myfile.csv 1h
    if len(sys.argv) >= 2:
        INPUT_FILE = sys.argv[1]
    if len(sys.argv) >= 3:
        TIMEFRAME  = sys.argv[2]
    if len(sys.argv) >= 4:
        OUTPUT_FILE = sys.argv[3]
    
    secs = INTERVALS.get(TIMEFRAME, 3600)
    convert(INPUT_FILE, OUTPUT_FILE, secs, SYMBOL)

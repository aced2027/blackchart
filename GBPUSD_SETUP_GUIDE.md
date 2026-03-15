# GBPUSD Tick Data Setup Guide

## Current Status
✅ **EURUSD**: Complete with all 7 timeframes (2021-2026)  
❌ **GBPUSD**: Not yet downloaded

## Option 1: Download GBPUSD Tick Data

### Step 1: Install Required Libraries
```bash
pip install tick_vault pandas
```

### Step 2: Download GBPUSD Ticks
```bash
python download_gbpusd_ticks.py
```

This will download GBPUSD tick data for 2021-2026 into:
```
backend/data/ticks/
├── 2021/
│   ├── gbpusd_ticks_2021-01.csv
│   ├── gbpusd_ticks_2021-02.csv
│   └── ...
├── 2022/
│   └── ...
└── ...
```

### Step 3: Generate GBPUSD Timeframes
```bash
python generate_gbpusd_timeframes.py
```

This creates:
- `gbpusd_candles_1min.json`
- `gbpusd_candles_5min.json`
- `gbpusd_candles_15min.json`
- `gbpusd_candles_30min.json`
- `gbpusd_candles_1h.json`
- `gbpusd_candles_4h.json`
- `gbpusd_candles_1d.json`

### Step 4: Use Multi-Currency Chart
Open `multi_currency_chart.html` to switch between:
- **EUR/USD** (already working)
- **GBP/USD** (after download)

## Option 2: Alternative Data Sources

If tick_vault doesn't have GBPUSD data, you can:

1. **Use Dukascopy API** (modify existing scripts)
2. **Use MetaTrader 5** with mt5 library
3. **Use Alpha Vantage API** for historical data
4. **Use Yahoo Finance** (less granular)

## Option 3: Demo with Sample Data

For testing, I can create sample GBPUSD data:

```bash
python create_sample_gbpusd.py
```

This generates realistic sample data for demonstration.

## File Structure After Setup

```
blackchart/
├── candles_1min.json          # EURUSD (via Git LFS)
├── candles_5min.json          # EURUSD
├── candles_15min.json         # EURUSD
├── candles_30min.json         # EURUSD
├── candles_1h.json            # EURUSD
├── candles_4h.json            # EURUSD
├── candles_1d.json            # EURUSD
├── gbpusd_candles_1min.json   # GBPUSD (new)
├── gbpusd_candles_5min.json   # GBPUSD (new)
├── gbpusd_candles_15min.json  # GBPUSD (new)
├── gbpusd_candles_30min.json  # GBPUSD (new)
├── gbpusd_candles_1h.json     # GBPUSD (new)
├── gbpusd_candles_4h.json     # GBPUSD (new)
├── gbpusd_candles_1d.json     # GBPUSD (new)
├── index.html                 # EURUSD only
└── multi_currency_chart.html  # Both currencies
```

## Next Steps

1. **Try downloading**: Run `python download_gbpusd_ticks.py`
2. **If successful**: Generate timeframes and use multi-currency chart
3. **If failed**: Let me know the error and I'll help with alternatives

The multi-currency chart is ready - it just needs the GBPUSD data files!
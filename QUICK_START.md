# Quick Start Guide - TradingView Chart

## 🚀 Start in 2 Steps

### Step 1: Start the Server
```bash
cd blackchart
python -m http.server 3000
```

### Step 2: Open the Chart
Open your browser and go to:
```
http://localhost:3000/tradingview_style_chart.html
```

---

## 📊 What You'll See

A professional TradingView-style chart with:
- **32,394 hourly candles** from real tick data
- **5+ years** of EURUSD data (2021-2026)
- **Interactive** zoom, pan, and tooltips
- **Professional** dark theme design

---

## 🎮 How to Use

| Action | How To |
|--------|--------|
| **Zoom In** | Scroll wheel up |
| **Zoom Out** | Scroll wheel down |
| **Pan** | Click and drag |
| **View Details** | Hover over candles |
| **See Price** | Move crosshair |

---

## 📁 Files

- `tradingview_style_chart.html` - The chart
- `tradingview_candles.json` - Data (32,394 candles)
- `convert_ticks_to_candles.py` - Data converter

---

## 🔄 Regenerate Data

To regenerate candles from tick data:
```bash
python convert_ticks_to_candles.py
```

This will process all tick files in `backend/data/ticks/` and create `tradingview_candles.json`.

---

## ✅ That's It!

Your chart is ready to use with real market data from 2021-2026.

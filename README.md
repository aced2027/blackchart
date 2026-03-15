# BlackChart - TradingView-Style Forex Chart

A professional TradingView-style candlestick chart built with real tick data from Dukascopy.

## 🚀 Features

- **Real Tick Data**: Uses actual EURUSD tick data from 2021-2026 (133M+ ticks)
- **Multiple Timeframes**: 1h, 4h, 1d candles generated from tick data
- **TradingView UI**: Exact replica of TradingView interface
- **Interactive**: Zoom, pan, crosshair, tooltips
- **Professional Design**: Dark theme, proper colors, responsive layout

## 📊 Data

- **Symbol**: EURUSD
- **Period**: January 2021 - March 2026
- **Source**: Dukascopy tick data
- **Timeframes**: 1h (32,394 candles), 4h (8,376 candles), 1d (1,625 candles)

## 🛠 Quick Start

1. **Start the server**:
   ```bash
   python -m http.server 3000
   ```

2. **Open the chart**:
   ```
   http://localhost:3000/index.html
   ```

3. **Switch timeframes**: Click 1H, 4H, or D buttons in the top bar

## 📁 Project Structure

```
blackchart/
├── index.html                    # Main TradingView-style chart
├── candles_1h.json              # Hourly candles (2.73 MB)
├── candles_4h.json              # 4-hour candles (0.71 MB)
├── candles_1d.json              # Daily candles (0.14 MB)
├── backend/
│   ├── data/ticks/              # Raw tick data (excluded from git)
│   └── *.py                     # Data processing scripts
└── generate_key_timeframes.py   # Generate candles from ticks
```

## 🔧 Scripts

- `generate_key_timeframes.py` - Generate 1h, 4h, 1d candles from tick data
- `convert_ticks_to_candles.py` - Convert tick data to OHLC candles
- `backend/download_*.py` - Download tick data from Dukascopy

## 💡 Technical Details

- **Frontend**: Pure HTML5 Canvas + JavaScript
- **Data Processing**: Python + Pandas
- **Styling**: Exact TradingView colors and layout
- **Performance**: Progressive loading with progress bars

## 🎯 Chart Features

- Left toolbar with drawing tools
- Top bar with symbol info and timeframe buttons
- Interactive crosshair and tooltips
- Price legend overlay
- Bottom status bar
- Zoom (mouse wheel) and pan (click & drag)

## 📈 Generated from Real Market Data

All candles are generated from actual tick-by-tick market data, providing authentic price movements and volume information.

---

Built with ❤️ for professional forex analysis
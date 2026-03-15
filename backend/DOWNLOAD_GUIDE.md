# 📥 INTERACTIVE DOWNLOAD GUIDE

## 🚀 COMMAND TO RUN

```bash
python download_month_by_month.py
```

## 📋 EXAMPLE USAGE

### For 2025 EURUSD Data:
```
Enter symbol (default: EURUSD): EURUSD
Start date:
Year (e.g., 2024): 2025
Month (1-12): 1
End date:
Year (default: 2025): 2025
Month (1-12): 12
```

### For GBPUSD Data:
```
Enter symbol (default: EURUSD): GBPUSD
Start date:
Year (e.g., 2024): 2025
Month (1-12): 1
End date:
Year (default: 2025): 2025
Month (1-12): 12
```

## 🎯 QUICK COMMANDS

### Download Full 2025 EURUSD:
1. Run: `python download_month_by_month.py`
2. Press Enter for EURUSD (default)
3. Enter: `2025` for start year
4. Enter: `1` for start month
5. Press Enter for end year (defaults to 2025)
6. Enter: `12` for end month
7. Type `y` to confirm

### Download Specific Period:
- **Q1 2025**: Start: 2025-1, End: 2025-3
- **H1 2025**: Start: 2025-1, End: 2025-6
- **Single Month**: Start: 2025-3, End: 2025-3

## 📊 SUPPORTED SYMBOLS

- **EURUSD** (default)
- **GBPUSD**
- **USDJPY**
- **USDCHF**
- **AUDUSD**
- **USDCAD**
- **NZDUSD**
- And more...

## 🗂️ FILE ORGANIZATION

Downloaded files are automatically organized:
```
data/ticks/
├── 2025/
│   ├── eurusd_ticks_2025-01.csv
│   ├── eurusd_ticks_2025-02.csv
│   └── ...
└── 2024/
    ├── eurusd_ticks_2024-01.csv
    └── ...
```

## ⚡ FEATURES

- **Interactive Prompts**: Easy step-by-step input
- **Smart Defaults**: Press Enter for common choices
- **Resume Support**: Skips already downloaded months
- **Progress Tracking**: Real-time download status
- **Error Handling**: Continues on individual failures
- **Multi-Symbol**: Download any Dukascopy symbol

## 🔄 AFTER DOWNLOAD

1. **Generate Candles**:
   ```bash
   python generate_from_organized_ticks.py
   ```

2. **Check Status**:
   ```bash
   python check_organized_status.py
   ```

3. **Restart Backend** to serve new data

4. **Refresh Frontend** to see charts

## 💡 TIPS

- **Start Small**: Try 1-2 months first
- **Check Space**: Each month ~100-150 MB
- **Be Patient**: Full year takes 1-2 hours
- **Resume Anytime**: Script skips existing files
- **Multiple Symbols**: Run script multiple times

## 🎉 READY TO USE

The interactive downloader is ready! Just run:
```bash
python download_month_by_month.py
```

And follow the prompts exactly as you specified!
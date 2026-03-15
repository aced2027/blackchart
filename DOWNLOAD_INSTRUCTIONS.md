# Download EURUSD Tick Data from Dukascopy

## Quick Start - One Command

To download all missing years (2020-2023) of tick data:

```bash
cd blackchart/backend
python download_all_missing_years.py
```

That's it! The script will:
- Download 2020, 2021, 2022, 2023 (48 months total)
- Save monthly tick files to `data/` directory
- Show progress for each month
- Take approximately 6-10 hours

## What You'll Get

- **2020**: 12 months of tick data
- **2021**: 12 months of tick data
- **2022**: 12 months of tick data
- **2023**: 12 months of tick data

Total: ~10 GB of professional-grade tick data from Dukascopy (FREE)

## After Download

Once download completes, generate candles:

```bash
python generate_candles_fast.py
```

Then restart the backend:

```bash
python main.py
```

## Alternative: Download Specific Years

If you want to download specific years only:

```bash
# Download just 2020
python download_month_by_month.py EURUSD 2020 1 2020 12

# Download just 2021
python download_month_by_month.py EURUSD 2021 1 2021 12

# Download just 2022
python download_month_by_month.py EURUSD 2022 1 2022 12

# Download just 2023
python download_month_by_month.py EURUSD 2023 1 2023 12
```

## Check Progress

While downloading, you can check what's been downloaded:

```bash
python check_all_years.py
```

## Requirements

- Internet connection
- ~10 GB free disk space
- 6-10 hours of time
- tick-vault library (already installed ✅)

## Data Source

- Provider: Dukascopy (Swiss bank)
- Cost: FREE
- Quality: Professional-grade
- No API key required

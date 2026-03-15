# EURUSD Data Summary

## Backend Status
✅ Backend is running on http://localhost:8000

## Available Data

### Years with EURUSD Data:
**[2024, 2025, 2026]**

### Detailed Breakdown:

#### 2024
- Months: October, November, December (3 months)
- Date range: 2024-10-29 to 2024-12-31

#### 2025
- Months: All 12 months (January to December)
- Date range: 2025-01-01 to 2025-12-31

#### 2026
- Months: January, February, March (3 months)
- Date range: 2026-01-01 to 2026-03-12

### Total Coverage
- **Years**: 2024, 2025, 2026
- **Total months**: 18 months
- **Date range**: October 29, 2024 to March 12, 2026

## Data Type
⚠️ **Note**: The current data appears to be mock/generated data since no actual tick data files were found in the backend/data directory.

To download real historical data:
1. Run: `python download_month_by_month.py` (requires tick-vault library)
2. Then: `python generate_candles_fast.py`

## API Endpoint
- URL: http://localhost:8000/api/candles/EUR_USD
- Timeframes: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M

## Quick Access Script
Run `python get_eurusd_years.py` to get the years list programmatically.

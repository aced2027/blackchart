from tick_vault import download_range
from datetime import datetime, timezone
import json, os

# STEP 1 — Download tick data
print("Downloading EURUSD ticks from Dukascopy...")
download_range(
    symbol="EURUSD",
    start=datetime(2024, 1, 1, tzinfo=timezone.utc),
    end=datetime(2024, 1, 31, tzinfo=timezone.utc)
)
print("Download done!")

# STEP 2 — Find downloaded files and convert to candles
import pandas as pd
import glob

# Find all CSV tick files
files = glob.glob("**/*.csv", recursive=True) + glob.glob("**/*.bi5", recursive=True)
print(f"Found files: {files}")

# Read tick data
all_dfs = []
for f in files:
    try:
        df = pd.read_csv(f)
        all_dfs.append(df)
        print(f"Loaded {len(df)} rows from {f}")
    except:
        pass

if not all_dfs:
    print("No CSV files found, checking what was downloaded...")
    for root, dirs, fnames in os.walk("."):
        for fname in fnames:
            print(os.path.join(root, fname))
else:
    # Combine all data
    df = pd.concat(all_dfs, ignore_index=True)
    print(f"Total ticks: {len(df)}")
    print(f"Columns: {df.columns.tolist()}")
    print(df.head())
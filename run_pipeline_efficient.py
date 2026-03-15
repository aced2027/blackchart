from tick_vault import download_range
from datetime import datetime, timezone
import json, os
import pandas as pd
import glob

# STEP 1 — Download tick data
print("Downloading EURUSD ticks from Dukascopy...")
download_range(
    symbol="EURUSD",
    start=datetime(2024, 1, 1, tzinfo=timezone.utc),
    end=datetime(2024, 1, 31, tzinfo=timezone.utc)
)
print("Download done!")

# STEP 2 — Find downloaded files and process efficiently
print("\nProcessing downloaded files...")

# Find all CSV tick files
files = glob.glob("**/*.csv", recursive=True) + glob.glob("**/*.bi5", recursive=True)
print(f"Found {len(files)} files")

# Process files in batches to avoid memory issues
batch_size = 10
total_rows = 0
sample_data = []

for i in range(0, min(len(files), 50), batch_size):  # Process first 50 files in batches
    batch_files = files[i:i+batch_size]
    print(f"\nProcessing batch {i//batch_size + 1}: files {i+1}-{min(i+batch_size, len(files))}")
    
    batch_dfs = []
    for f in batch_files:
        try:
            df = pd.read_csv(f)
            batch_dfs.append(df)
            total_rows += len(df)
            
            # Keep sample data from first few files
            if len(sample_data) < 1000 and not df.empty:
                sample_data.extend(df.head(10).to_dict('records'))
                
            print(f"  {f}: {len(df)} rows")
        except Exception as e:
            print(f"  Error reading {f}: {e}")
    
    if batch_dfs:
        # Process batch
        batch_df = pd.concat(batch_dfs, ignore_index=True)
        print(f"  Batch total: {len(batch_df)} rows")
        
        # Clear memory
        del batch_dfs, batch_df

print(f"\nSUMMARY:")
print(f"Total files processed: {min(len(files), 50)}")
print(f"Total rows: {total_rows:,}")

if sample_data:
    sample_df = pd.DataFrame(sample_data[:100])  # Show first 100 records
    print(f"\nSample data columns: {sample_df.columns.tolist()}")
    print(f"Sample data shape: {sample_df.shape}")
    print("\nFirst few records:")
    print(sample_df.head())
    
    # Check data types
    print(f"\nData types:")
    print(sample_df.dtypes)
else:
    print("No sample data available")

print(f"\nAll files found: {len(files)}")
print("Pipeline completed successfully!")
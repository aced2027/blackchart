"""
Organize tick data by year - separate files for each year
Ensures data integrity, confidentiality, and availability
"""
import os
import glob
import pandas as pd
from datetime import datetime
import hashlib

def calculate_file_hash(filepath):
    """Calculate SHA256 hash for data integrity verification"""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def organize_by_year():
    """Organize monthly tick files into yearly files"""
    print("="*70)
    print("ORGANIZING DATA BY YEAR")
    print("="*70)
    
    # Create organized directory
    os.makedirs("data/organized", exist_ok=True)
    os.makedirs("data/organized/yearly", exist_ok=True)
    os.makedirs("data/organized/integrity", exist_ok=True)
    
    # Get all monthly tick files
    monthly_files = glob.glob("data/eurusd_ticks_*.csv")
    monthly_files = [f for f in monthly_files if not f.endswith("eurusd_ticks.csv")]
    monthly_files.sort()
    
    if not monthly_files:
        print("\n❌ No monthly tick files found in data/")
        print("   Run download scripts first")
        return
    
    # Group by year
    years_data = {}
    
    print(f"\n📂 Found {len(monthly_files)} monthly files")
    print("\n📊 Processing monthly files...")
    
    for filepath in monthly_files:
        filename = os.path.basename(filepath)
        # Extract year from filename: eurusd_ticks_2024-09.csv
        try:
            date_str = filename.replace("eurusd_ticks_", "").replace(".csv", "")
            year = date_str.split("-")[0]
            
            print(f"   Reading {filename}...")
            df = pd.read_csv(filepath)
            
            if year not in years_data:
                years_data[year] = []
            
            years_data[year].append(df)
            
        except Exception as e:
            print(f"   ⚠️  Error reading {filename}: {e}")
    
    # Combine and save by year
    print(f"\n💾 Creating yearly files...")
    
    integrity_log = []
    
    for year in sorted(years_data.keys()):
        print(f"\n📅 Processing {year}...")
        
        # Combine all months for this year
        year_df = pd.concat(years_data[year], ignore_index=True)
        
        # Sort by timestamp
        time_col = 'time' if 'time' in year_df.columns else 'timestamp'
        year_df = year_df.sort_values(time_col).reset_index(drop=True)
        
        # Remove duplicates
        original_count = len(year_df)
        year_df = year_df.drop_duplicates(subset=[time_col])
        duplicates_removed = original_count - len(year_df)
        
        # Save yearly file
        yearly_file = f"data/organized/yearly/eurusd_ticks_{year}.csv"
        year_df.to_csv(yearly_file, index=False)
        
        # Calculate integrity hash
        file_hash = calculate_file_hash(yearly_file)
        
        # Get file info
        size_mb = os.path.getsize(yearly_file) / (1024 * 1024)
        
        print(f"   ✅ Saved: {yearly_file}")
        print(f"      Ticks: {len(year_df):,}")
        print(f"      Size: {size_mb:.2f} MB")
        print(f"      Duplicates removed: {duplicates_removed:,}")
        print(f"      SHA256: {file_hash[:16]}...")
        
        # Log integrity info
        integrity_log.append({
            'year': year,
            'file': yearly_file,
            'ticks': len(year_df),
            'size_mb': size_mb,
            'sha256': file_hash,
            'created': datetime.now().isoformat()
        })
    
    # Save integrity log
    integrity_file = "data/organized/integrity/data_integrity.csv"
    integrity_df = pd.DataFrame(integrity_log)
    integrity_df.to_csv(integrity_file, index=False)
    
    print(f"\n{'='*70}")
    print(f"✅ ORGANIZATION COMPLETE")
    print(f"{'='*70}")
    print(f"Yearly files: data/organized/yearly/")
    print(f"Integrity log: {integrity_file}")
    print(f"Total years: {len(years_data)}")
    print(f"{'='*70}")

if __name__ == "__main__":
    organize_by_year()

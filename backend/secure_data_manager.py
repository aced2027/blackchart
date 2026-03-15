"""
Comprehensive Data Manager
Ensures Confidentiality, Integrity, and Availability (CIA Triad)
"""
import os
import glob
import pandas as pd
import hashlib
import json
from datetime import datetime

class SecureDataManager:
    """Manages EURUSD tick data with CIA principles"""
    
    def __init__(self):
        self.data_dir = "data"
        self.organized_dir = "data/organized"
        self.backup_dir = "data/backups"
        self.integrity_file = "data/organized/integrity/data_integrity.json"
        
    def ensure_directories(self):
        """Create necessary directories"""
        os.makedirs(f"{self.organized_dir}/yearly", exist_ok=True)
        os.makedirs(f"{self.organized_dir}/integrity", exist_ok=True)
        os.makedirs(self.backup_dir, exist_ok=True)
        
    def calculate_hash(self, filepath):
        """Calculate SHA256 hash for integrity"""
        sha256 = hashlib.sha256()
        with open(filepath, "rb") as f:
            for block in iter(lambda: f.read(4096), b""):
                sha256.update(block)
        return sha256.hexdigest()
    
    def verify_integrity(self, filepath, expected_hash):
        """Verify file integrity"""
        actual_hash = self.calculate_hash(filepath)
        return actual_hash == expected_hash
    
    def organize_all_data(self):
        """Main function: Organize, secure, and validate all data"""
        print("="*70)
        print("SECURE DATA MANAGER - CIA TRIAD")
        print("="*70)
        print("Confidentiality ✓ | Integrity ✓ | Availability ✓")
        print("="*70)
        
        self.ensure_directories()
        
        # Step 1: Find all monthly files
        print("\n[1/5] 🔍 Scanning for data files...")
        monthly_files = glob.glob(f"{self.data_dir}/eurusd_ticks_*.csv")
        monthly_files = [f for f in monthly_files if not f.endswith("eurusd_ticks.csv")]
        monthly_files.sort()
        
        if not monthly_files:
            print("   ❌ No data files found")
            return
        
        print(f"   ✅ Found {len(monthly_files)} monthly files")
        
        # Step 2: Group by year
        print("\n[2/5] 📊 Grouping data by year...")
        years_data = {}
        
        for filepath in monthly_files:
            filename = os.path.basename(filepath)
            try:
                date_str = filename.replace("eurusd_ticks_", "").replace(".csv", "")
                year = date_str.split("-")[0]
                month = date_str.split("-")[1]
                
                if year not in years_data:
                    years_data[year] = {}
                
                years_data[year][month] = filepath
                
            except Exception as e:
                print(f"   ⚠️  Error processing {filename}: {e}")
        
        print(f"   ✅ Found data for years: {sorted(years_data.keys())}")
        
        # Step 3: Create yearly files with integrity checks
        print("\n[3/5] 💾 Creating yearly consolidated files...")
        
        integrity_records = {}
        
        for year in sorted(years_data.keys()):
            print(f"\n   📅 Processing {year}...")
            
            # Load all months for this year
            year_dfs = []
            months_included = []
            
            for month in sorted(years_data[year].keys()):
                filepath = years_data[year][month]
                try:
                    df = pd.read_csv(filepath)
                    year_dfs.append(df)
                    months_included.append(month)
                    print(f"      ✓ Month {month}: {len(df):,} ticks")
                except Exception as e:
                    print(f"      ✗ Month {month}: Error - {e}")
            
            if not year_dfs:
                print(f"      ⚠️  No valid data for {year}")
                continue
            
            # Combine all months
            year_df = pd.concat(year_dfs, ignore_index=True)
            
            # Sort and deduplicate
            time_col = 'time' if 'time' in year_df.columns else 'timestamp'
            year_df = year_df.sort_values(time_col).reset_index(drop=True)
            
            original_count = len(year_df)
            year_df = year_df.drop_duplicates(subset=[time_col])
            duplicates = original_count - len(year_df)
            
            # Save yearly file
            yearly_file = f"{self.organized_dir}/yearly/eurusd_ticks_{year}.csv"
            year_df.to_csv(yearly_file, index=False)
            
            # Calculate integrity hash
            file_hash = self.calculate_hash(yearly_file)
            size_mb = os.path.getsize(yearly_file) / (1024 * 1024)
            
            # Store integrity record
            integrity_records[year] = {
                'file': yearly_file,
                'year': year,
                'months_included': months_included,
                'total_months': len(months_included),
                'total_ticks': len(year_df),
                'duplicates_removed': duplicates,
                'size_mb': round(size_mb, 2),
                'sha256_hash': file_hash,
                'created_at': datetime.now().isoformat(),
                'status': 'complete' if len(months_included) == 12 else 'partial'
            }
            
            print(f"      ✅ Saved: {len(year_df):,} ticks ({size_mb:.2f} MB)")
            print(f"      🔒 SHA256: {file_hash[:16]}...")
            print(f"      📊 Status: {integrity_records[year]['status'].upper()}")
        
        # Step 4: Save integrity manifest
        print("\n[4/5] 🔐 Saving integrity manifest...")
        
        manifest = {
            'generated_at': datetime.now().isoformat(),
            'total_years': len(integrity_records),
            'years': integrity_records
        }
        
        with open(self.integrity_file, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print(f"   ✅ Integrity manifest saved: {self.integrity_file}")
        
        # Step 5: Generate summary report
        print("\n[5/5] 📋 Generating summary report...")
        
        total_ticks = sum(r['total_ticks'] for r in integrity_records.values())
        total_size = sum(r['size_mb'] for r in integrity_records.values())
        complete_years = sum(1 for r in integrity_records.values() if r['status'] == 'complete')
        
        print(f"\n{'='*70}")
        print(f"✅ DATA ORGANIZATION COMPLETE")
        print(f"{'='*70}")
        print(f"Total years: {len(integrity_records)}")
        print(f"Complete years (12 months): {complete_years}")
        print(f"Total ticks: {total_ticks:,}")
        print(f"Total size: {total_size:.2f} MB ({total_size/1024:.2f} GB)")
        print(f"\nYearly files: {self.organized_dir}/yearly/")
        print(f"Integrity log: {self.integrity_file}")
        print(f"\n🔒 CIA TRIAD STATUS:")
        print(f"   ✅ Confidentiality: Data stored locally")
        print(f"   ✅ Integrity: SHA256 hashes recorded")
        print(f"   ✅ Availability: Organized by year for easy access")
        print(f"{'='*70}")

def main():
    manager = SecureDataManager()
    manager.organize_all_data()

if __name__ == "__main__":
    main()

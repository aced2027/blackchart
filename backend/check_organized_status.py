"""
Check status of organized tick data
Shows what's downloaded year by year, month by month
"""
import os
import glob

def check_organized_status():
    """Check organized data status"""
    print("="*70)
    print("ORGANIZED TICK DATA STATUS")
    print("="*70)
    print("Structure: data/ticks/YYYY/eurusd_ticks_YYYY-MM.csv\n")
    
    years = [2020, 2021, 2022, 2023, 2024, 2025, 2026]
    
    total_files = 0
    total_size = 0
    
    for year in years:
        year_folder = f"data/ticks/{year}"
        
        print(f"{'='*70}")
        print(f"YEAR {year}")
        print(f"{'='*70}")
        
        if os.path.exists(year_folder):
            files = glob.glob(f"{year_folder}/eurusd_ticks_*.csv")
            files.sort()
            
            if files:
                year_size = sum(os.path.getsize(f) for f in files) / (1024 * 1024)
                
                print(f"✅ {len(files)}/12 months downloaded")
                print(f"   Size: {year_size:.2f} MB")
                print(f"   Folder: {year_folder}/\n")
                
                # Show which months
                months_downloaded = []
                months_missing = []
                
                for month in range(1, 13):
                    month_file = f"{year_folder}/eurusd_ticks_{year}-{month:02d}.csv"
                    if os.path.exists(month_file):
                        months_downloaded.append(month)
                    else:
                        months_missing.append(month)
                
                if months_downloaded:
                    print(f"   ✅ Downloaded: {months_downloaded}")
                
                if months_missing:
                    print(f"   ❌ Missing: {months_missing}")
                
                total_files += len(files)
                total_size += year_size
            else:
                print(f"❌ No files downloaded")
                print(f"   ❌ Missing: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]")
        else:
            print(f"❌ Folder not created")
            print(f"   ❌ Missing: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]")
        
        print()
    
    # Summary
    print("="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Total files: {total_files}")
    print(f"Total size: {total_size:.2f} MB ({total_size/1024:.2f} GB)")
    print(f"Progress: {total_files}/75 months ({total_files/75*100:.1f}%)")
    print("="*70)

if __name__ == "__main__":
    check_organized_status()

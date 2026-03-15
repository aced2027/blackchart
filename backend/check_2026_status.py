"""
Check 2026 download status
Shows progress for January, February, March
"""
import os
import glob

def check_2026_status():
    """Check 2026 data status"""
    print("="*70)
    print("2026 TICK DATA STATUS")
    print("="*70)
    print("Folder: data/ticks/2026/\n")
    
    year = 2026
    months = [1, 2, 3]  # Jan, Feb, Mar only
    month_names = ["January", "February", "March"]
    
    year_folder = f"data/ticks/{year}"
    
    if not os.path.exists(year_folder):
        print("❌ Folder not created yet")
        print("   Download not started\n")
        return
    
    total_ticks = 0
    total_size = 0
    downloaded = []
    missing = []
    
    for i, month in enumerate(months):
        month_str = f"{year}-{month:02d}"
        filename = f"{year_folder}/eurusd_ticks_{month_str}.csv"
        month_name = month_names[i]
        
        if os.path.exists(filename):
            size_mb = os.path.getsize(filename) / (1024 * 1024)
            
            # Count ticks
            try:
                with open(filename, 'r') as f:
                    ticks = sum(1 for _ in f) - 1  # Subtract header
            except:
                ticks = 0
            
            print(f"✅ {month_name} ({month:02d})")
            print(f"   File: {filename}")
            print(f"   Ticks: {ticks:,}")
            print(f"   Size: {size_mb:.2f} MB\n")
            
            downloaded.append(month)
            total_ticks += ticks
            total_size += size_mb
        else:
            print(f"❌ {month_name} ({month:02d})")
            print(f"   Not downloaded yet\n")
            missing.append(month)
    
    # Summary
    print("="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Downloaded: {len(downloaded)}/3 months")
    print(f"Missing: {len(missing)}/3 months")
    print(f"Total ticks: {total_ticks:,}")
    print(f"Total size: {total_size:.2f} MB")
    print(f"Progress: {len(downloaded)/3*100:.1f}%")
    print("="*70)
    
    if len(downloaded) == 3:
        print("\n🎉 2026 COMPLETE! All 3 months downloaded.")
    elif len(downloaded) > 0:
        print(f"\n🔄 In progress: {len(downloaded)}/3 months done")
    else:
        print("\n⏳ Download not started or in progress")

if __name__ == "__main__":
    check_2026_status()

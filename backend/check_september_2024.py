"""
Check if September 2024 data exists
"""
import os
import glob

def check_september_2024():
    """Check for September 2024 tick data"""
    print("="*70)
    print("CHECKING SEPTEMBER 2024 DATA")
    print("="*70)
    
    # Check for the file
    sep_file = "data/eurusd_ticks_2024-09.csv"
    
    if os.path.exists(sep_file):
        size_mb = os.path.getsize(sep_file) / (1024 * 1024)
        
        # Count lines
        with open(sep_file, 'r') as f:
            lines = sum(1 for _ in f) - 1  # Subtract header
        
        print(f"\n✅ September 2024 data EXISTS")
        print(f"   File: {sep_file}")
        print(f"   Ticks: {lines:,}")
        print(f"   Size: {size_mb:.2f} MB")
        return True
    else:
        print(f"\n❌ September 2024 data NOT FOUND")
        print(f"   Expected file: {sep_file}")
        print(f"\n   To download:")
        print(f"   python download_month_by_month.py EURUSD 2024 9 2024 9")
        return False

if __name__ == "__main__":
    check_september_2024()

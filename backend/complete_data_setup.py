"""
COMPLETE DATA SETUP WORKFLOW
Downloads, organizes, and secures all EURUSD data
"""
import asyncio
import os
import sys

print("""
╔══════════════════════════════════════════════════════════════════╗
║         EURUSD DATA MANAGEMENT SYSTEM                            ║
║         Confidentiality | Integrity | Availability               ║
╚══════════════════════════════════════════════════════════════════╝
""")

print("This will:")
print("  1. Download 2020-2023 tick data (6-10 hours)")
print("  2. Download 2024 September data")
print("  3. Organize data by year")
print("  4. Generate integrity hashes (SHA256)")
print("  5. Create missing data report")
print("  6. Generate candles")
print()

choice = input("Start complete setup? (y/n): ").strip().lower()

if choice != 'y':
    print("Setup cancelled")
    sys.exit(0)

print("\n" + "="*70)
print("STARTING COMPLETE DATA SETUP")
print("="*70)

# Import after confirmation
try:
    from tick_vault import download_range
    import subprocess
    
    print("\n✅ All dependencies available")
    print("\nStarting downloads...")
    print("This will take 6-10 hours. You can leave it running.")
    print()
    
    # Run download script
    subprocess.run([sys.executable, "download_all_missing_years.py"])
    
    print("\n" + "="*70)
    print("ORGANIZING DATA...")
    print("="*70)
    
    # Run organization script
    subprocess.run([sys.executable, "secure_data_manager.py"])
    
    print("\n" + "="*70)
    print("CHECKING FOR GAPS...")
    print("="*70)
    
    # Run missing data check
    subprocess.run([sys.executable, "find_missing_data.py"])
    
    print("\n" + "="*70)
    print("✅ SETUP COMPLETE!")
    print("="*70)
    print("\nNext step: Generate candles")
    print("  python generate_candles_fast.py")
    
except ImportError as e:
    print(f"\n❌ Missing dependency: {e}")
    print("Install with: pip install tick-vault")

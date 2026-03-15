"""
COMPLETE AUTOMATED WORKFLOW
Runs all steps after download completes
"""
import subprocess
import sys
import os

def run_step(step_name, script_name):
    """Run a step and report status"""
    print(f"\n{'='*70}")
    print(f"STEP: {step_name}")
    print(f"{'='*70}\n")
    
    try:
        result = subprocess.run([sys.executable, script_name], check=True)
        print(f"\n✅ {step_name} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {step_name} failed: {e}")
        return False

def main():
    """Run complete workflow"""
    print("""
╔══════════════════════════════════════════════════════════════════╗
║         POST-DOWNLOAD WORKFLOW                                   ║
║         Organize | Verify | Generate                             ║
╚══════════════════════════════════════════════════════════════════╝
""")
    
    steps = [
        ("Download September 2024", "download_september_2024.py"),
        ("Organize Data by Year (CIA)", "secure_data_manager.py"),
        ("Find Missing Data", "find_missing_data.py"),
        ("Generate Candles", "generate_candles_fast.py"),
    ]
    
    results = []
    
    for step_name, script in steps:
        success = run_step(step_name, script)
        results.append((step_name, success))
        
        if not success:
            print(f"\n⚠️  Stopping workflow due to failure")
            break
    
    # Summary
    print(f"\n{'='*70}")
    print(f"WORKFLOW SUMMARY")
    print(f"{'='*70}\n")
    
    for step_name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {step_name}")
    
    all_success = all(s for _, s in results)
    
    if all_success:
        print(f"\n{'='*70}")
        print(f"🎉 ALL STEPS COMPLETED!")
        print(f"{'='*70}\n")
        print("Final step: Restart backend")
        print("  python main.py")
    else:
        print(f"\n⚠️  Some steps failed. Check logs above.")

if __name__ == "__main__":
    main()

"""
Fix tick-vault concurrency to avoid 503 errors
This patches the tick-vault library to use fewer concurrent connections
"""
import os
import sys

def find_tick_vault_path():
    """Find where tick-vault is installed"""
    try:
        import tick_vault
        path = os.path.dirname(tick_vault.__file__)
        return path
    except ImportError:
        print("❌ tick-vault not installed")
        return None

def patch_downloader():
    """Patch the downloader to reduce concurrency"""
    tick_vault_path = find_tick_vault_path()
    if not tick_vault_path:
        return False
    
    downloader_file = os.path.join(tick_vault_path, 'downloader.py')
    
    if not os.path.exists(downloader_file):
        print(f"❌ Could not find {downloader_file}")
        return False
    
    print(f"📝 Reading {downloader_file}")
    
    with open(downloader_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already patched
    if 'PATCHED_MAX_WORKERS' in content:
        print("✅ Already patched!")
        return True
    
    # Find and replace max_workers
    original_content = content
    
    # Look for max_workers or similar patterns
    if 'max_workers' in content:
        # Replace max_workers value
        content = content.replace('max_workers=10', 'max_workers=2  # PATCHED_MAX_WORKERS')
        content = content.replace('max_workers=20', 'max_workers=2  # PATCHED_MAX_WORKERS')
        content = content.replace('max_workers = 10', 'max_workers = 2  # PATCHED_MAX_WORKERS')
        content = content.replace('max_workers = 20', 'max_workers = 2  # PATCHED_MAX_WORKERS')
    
    # Look for asyncio.gather patterns
    if 'asyncio.gather' in content:
        # Add semaphore before gather
        if 'semaphore = asyncio.Semaphore' not in content:
            # Find the function that uses gather
            lines = content.split('\n')
            new_lines = []
            for i, line in enumerate(lines):
                new_lines.append(line)
                if 'async def download_range' in line or 'async def download' in line:
                    # Add semaphore after function definition
                    indent = len(line) - len(line.lstrip())
                    new_lines.append(' ' * (indent + 4) + 'semaphore = asyncio.Semaphore(2)  # PATCHED_MAX_WORKERS')
            content = '\n'.join(new_lines)
    
    if content != original_content:
        # Backup original
        backup_file = downloader_file + '.backup'
        if not os.path.exists(backup_file):
            with open(backup_file, 'w', encoding='utf-8') as f:
                f.write(original_content)
            print(f"💾 Backed up original to {backup_file}")
        
        # Write patched version
        with open(downloader_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Patched downloader.py to use max 2 concurrent connections")
        return True
    else:
        print("⚠️  Could not find patterns to patch")
        print("   Manual patching may be required")
        return False

def show_manual_instructions():
    """Show manual patching instructions"""
    tick_vault_path = find_tick_vault_path()
    if not tick_vault_path:
        return
    
    print()
    print("="*80)
    print("MANUAL PATCHING INSTRUCTIONS")
    print("="*80)
    print()
    print(f"1. Open this file in a text editor:")
    print(f"   {os.path.join(tick_vault_path, 'downloader.py')}")
    print()
    print("2. Find lines with 'max_workers' or 'asyncio.gather'")
    print()
    print("3. Change max_workers to 2:")
    print("   max_workers = 2  # Reduced to avoid 503 errors")
    print()
    print("4. Or add a semaphore:")
    print("   semaphore = asyncio.Semaphore(2)")
    print()
    print("5. Save the file")
    print()

if __name__ == "__main__":
    print("="*80)
    print("TICK-VAULT CONCURRENCY PATCHER")
    print("="*80)
    print()
    print("This will reduce concurrent connections to avoid 503 errors")
    print()
    
    success = patch_downloader()
    
    if not success:
        show_manual_instructions()
    
    print()
    print("="*80)
    print("NEXT STEPS")
    print("="*80)
    print()
    print("Now you can download data without 503 errors:")
    print()
    print("  python download_max_history.py")
    print()
    print("Choose option 4 (2 years) or option 5 (custom)")
    print()
    print("Best times to download (from India):")
    print("  • 6:00 AM - 9:00 AM IST")
    print("  • 11:00 PM - 2:00 AM IST")
    print()

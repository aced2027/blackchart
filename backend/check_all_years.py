"""
Check what years of data are currently available (both files and API)
"""
import os
import glob
import requests
from datetime import datetime

def check_local_files():
    """Check what years exist in local files"""
    years = set()
    
    # Check tick files
    if os.path.exists('data'):
        tick_files = glob.glob('data/eurusd_ticks_*.csv')
        for f in tick_files:
            try:
                filename = os.path.basename(f)
                date_str = filename.replace('eurusd_ticks_', '').replace('.csv', '')
                year = date_str.split('-')[0]
                years.add(year)
            except:
                pass
    
    return sorted(list(years))

def check_api_data():
    """Check what years are available via API"""
    try:
        response = requests.get(
            'http://localhost:8000/api/candles/EUR_USD',
            params={'timeframe': '1d', 'limit': 10000},
            timeout=5
        )
        data = response.json()
        candles = data.get('candles', [])
        
        years = set()
        for candle in candles:
            dt = datetime.fromisoformat(candle['time'].replace('Z', '+00:00'))
            years.add(dt.year)
        
        return sorted(list(years))
    except:
        return []

def main():
    print("="*70)
    print("EURUSD DATA AVAILABILITY CHECK")
    print("="*70)
    
    print("\n📁 LOCAL FILES:")
    local_years = check_local_files()
    if local_years:
        print(f"   Years: {local_years}")
    else:
        print("   No local data files found")
    
    print("\n🌐 API DATA:")
    api_years = check_api_data()
    if api_years:
        print(f"   Years: {api_years}")
    else:
        print("   Backend not running or no data")
    
    print("\n" + "="*70)
    print("SUMMARY:")
    
    all_years = sorted(list(set(local_years + api_years)))
    if all_years:
        print(f"✅ Available years: {all_years}")
    else:
        print("❌ No data available")
    
    # Check what's missing
    target_years = [2020, 2021, 2022, 2023, 2024, 2025, 2026]
    missing = [y for y in target_years if y not in all_years]
    
    if missing:
        print(f"\n⚠️  Missing years: {missing}")
        print("\nTo download missing data:")
        print(f"   python download_historical_years.py {' '.join(map(str, missing))}")
    
    print("="*70)

if __name__ == "__main__":
    main()

"""
Generate list format of downloaded and missing data
Year by year, month by month
"""
import os
import glob
import json

def generate_list_format():
    """Generate structured list of data status"""
    print("="*70)
    print("DATA STATUS - LIST FORMAT")
    print("="*70)
    
    # Get downloaded files
    monthly_files = glob.glob("data/eurusd_ticks_*.csv")
    monthly_files = [f for f in monthly_files if not f.endswith("eurusd_ticks.csv")]
    
    downloaded = set()
    for filepath in monthly_files:
        filename = os.path.basename(filepath)
        try:
            date_str = filename.replace("eurusd_ticks_", "").replace(".csv", "")
            downloaded.add(date_str)
        except:
            pass
    
    # Generate status for each year
    years = [2020, 2021, 2022, 2023, 2024]
    months = list(range(1, 13))
    
    result = {
        'years': {},
        'summary': {
            'total_expected': 0,
            'total_downloaded': 0,
            'total_missing': 0
        }
    }
    
    for year in years:
        year_data = {
            'year': year,
            'downloaded': [],
            'missing': [],
            'status': 'incomplete'
        }
        
        for month in months:
            month_str = f"{year}-{month:02d}"
            result['summary']['total_expected'] += 1
            
            if month_str in downloaded:
                year_data['downloaded'].append(month)
                result['summary']['total_downloaded'] += 1
            else:
                year_data['missing'].append(month)
                result['summary']['total_missing'] += 1
        
        if len(year_data['downloaded']) == 12:
            year_data['status'] = 'complete'
        elif len(year_data['downloaded']) == 0:
            year_data['status'] = 'not_started'
        else:
            year_data['status'] = 'partial'
        
        result['years'][year] = year_data
    
    # Print formatted output
    print("\n📊 YEAR BY YEAR STATUS:\n")
    
    for year in years:
        data = result['years'][year]
        status_icon = {
            'complete': '✅',
            'partial': '🔄',
            'not_started': '❌'
        }[data['status']]
        
        print(f"{status_icon} {year}:")
        print(f"   Status: {data['status'].upper()}")
        print(f"   Downloaded: {len(data['downloaded'])}/12 months")
        
        if data['downloaded']:
            print(f"   ✅ Have: {data['downloaded']}")
        
        if data['missing']:
            print(f"   ❌ Missing: {data['missing']}")
        
        print()
    
    # Summary
    print("="*70)
    print("SUMMARY:")
    print(f"  Total months: {result['summary']['total_expected']}")
    print(f"  Downloaded: {result['summary']['total_downloaded']}")
    print(f"  Missing: {result['summary']['total_missing']}")
    print(f"  Progress: {result['summary']['total_downloaded']/result['summary']['total_expected']*100:.1f}%")
    print("="*70)
    
    # Save to JSON
    with open('data_status_list.json', 'w') as f:
        json.dump(result, f, indent=2)
    
    print("\n💾 Saved to: data_status_list.json")
    
    return result

if __name__ == "__main__":
    generate_list_format()

"""
Query the API to check what EURUSD data is available
"""
import requests
import json
from datetime import datetime

def query_candles(timeframe='1d', limit=10000):
    """Query the API for EURUSD candles"""
    url = f"http://localhost:8000/api/candles/EUR_USD"
    params = {
        'timeframe': timeframe,
        'limit': limit
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        candles = data.get('candles', [])
        
        if candles:
            # Extract years from the data
            years = set()
            months_by_year = {}
            
            for candle in candles:
                time_str = candle['time']
                # Parse the timestamp
                dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
                year = str(dt.year)
                month = dt.strftime('%Y-%m')
                
                years.add(year)
                if year not in months_by_year:
                    months_by_year[year] = set()
                months_by_year[year].add(month)
            
            return sorted(list(years)), months_by_year, candles
        else:
            return [], {}, []
            
    except Exception as e:
        print(f"Error querying API: {e}")
        return [], {}, []

def main():
    print("=" * 70)
    print("QUERYING BACKEND API FOR EURUSD DATA")
    print("=" * 70)
    
    # Query daily candles to get full date range
    print("\n📊 Fetching data from API...")
    years, months_by_year, candles = query_candles('1d', 10000)
    
    if years:
        print(f"\n✅ Data available for years: {years}")
        print(f"\nTotal candles received: {len(candles)}")
        
        if candles:
            first_candle = candles[0]
            last_candle = candles[-1]
            print(f"\nDate range:")
            print(f"  First: {first_candle['time']}")
            print(f"  Last: {last_candle['time']}")
        
        print(f"\nMonths by year:")
        for year in sorted(months_by_year.keys()):
            months = sorted(list(months_by_year[year]))
            print(f"  {year}: {len(months)} months")
            print(f"    {months[0]} to {months[-1]}")
    else:
        print("\n⚠️  No real data found - API is returning mock/generated data")
        print("   To get real data, you need to:")
        print("   1. Run: python download_month_by_month.py")
        print("   2. Then: python generate_candles_fast.py")
    
    print("\n" + "=" * 70)
    print(f"YEARS LIST: {years}")
    print("=" * 70)
    
    return years

if __name__ == "__main__":
    years = main()

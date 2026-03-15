"""
Get a list of years for which EURUSD data is available
"""
import requests
from datetime import datetime

def get_eurusd_years():
    """
    Query the backend API and return a list of years with EURUSD data
    """
    url = "http://localhost:8000/api/candles/EUR_USD"
    params = {
        'timeframe': '1d',
        'limit': 10000  # Get maximum data to see full range
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        candles = data.get('candles', [])
        
        if not candles:
            return []
        
        # Extract unique years
        years = set()
        for candle in candles:
            time_str = candle['time']
            dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
            years.add(dt.year)
        
        return sorted(list(years))
        
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    print("Fetching EURUSD data years from backend...")
    years = get_eurusd_years()
    
    if years:
        print(f"\n✅ EURUSD data available for years: {years}")
        print(f"\nYears list: {years}")
    else:
        print("\n❌ No data available or backend not running")
        print("Make sure the backend is running on http://localhost:8000")

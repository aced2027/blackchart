"""
Create sample GBPUSD data for testing the multi-currency chart
Generates realistic price movements based on EURUSD patterns
"""
import pandas as pd
import json
import numpy as np
from datetime import datetime, timedelta

def create_sample_gbpusd_candles():
    """Create sample GBPUSD candles based on EURUSD patterns"""
    print("🔄 Creating sample GBPUSD data...")
    
    # Load EURUSD 1h data as template
    try:
        with open('candles_1h.json', 'r') as f:
            eurusd_data = json.load(f)
        eurusd_candles = eurusd_data['candles']
        print(f"   Using {len(eurusd_candles)} EURUSD candles as template")
    except:
        print("❌ EURUSD data not found")
        return False
    
    # GBPUSD typically trades higher than EURUSD
    # Current ranges: EURUSD ~1.05-1.15, GBPUSD ~1.20-1.35
    gbpusd_candles = []
    
    for candle in eurusd_candles:
        # Convert EURUSD prices to GBPUSD range
        eur_o = candle['o']
        eur_h = candle['h'] 
        eur_l = candle['l']
        eur_c = candle['c']
        
        # Scale to GBPUSD range (roughly +0.15 to +0.25)
        offset = 0.20 + np.random.normal(0, 0.02)  # Random offset
        multiplier = 1.0 + np.random.normal(0, 0.05)  # Slight variation
        
        gbp_o = round((eur_o + offset) * multiplier, 5)
        gbp_h = round((eur_h + offset) * multiplier, 5)
        gbp_l = round((eur_l + offset) * multiplier, 5)
        gbp_c = round((eur_c + offset) * multiplier, 5)
        
        # Ensure H >= max(O,C) and L <= min(O,C)
        gbp_h = max(gbp_h, gbp_o, gbp_c)
        gbp_l = min(gbp_l, gbp_o, gbp_c)
        
        gbpusd_candles.append({
            't': candle['t'],
            'o': gbp_o,
            'h': gbp_h,
            'l': gbp_l,
            'c': gbp_c
        })
    
    # Save GBPUSD 1h data
    with open('gbpusd_candles_1h.json', 'w') as f:
        json.dump({'candles': gbpusd_candles}, f)
    
    print(f"   ✓ Created gbpusd_candles_1h.json with {len(gbpusd_candles)} candles")
    
    # Generate other timeframes from 1h data
    timeframes = {
        '5min': 12,    # 12 x 5min = 1h
        '15min': 4,    # 4 x 15min = 1h  
        '30min': 2,    # 2 x 30min = 1h
        '4h': 1/4,     # 1h / 4 = 4h
        '1d': 1/24     # 1h / 24 = 1d
    }
    
    for tf_name, ratio in timeframes.items():
        if ratio >= 1:
            # Higher frequency (split candles)
            split_candles = []
            for candle in gbpusd_candles:
                for i in range(int(ratio)):
                    # Create sub-candles with slight variations
                    variation = np.random.normal(0, 0.0001)
                    split_candles.append({
                        't': candle['t'] + i * (60000 * (60/ratio)),  # Adjust timestamp
                        'o': round(candle['o'] + variation, 5),
                        'h': round(candle['h'] + abs(variation), 5),
                        'l': round(candle['l'] - abs(variation), 5),
                        'c': round(candle['c'] + variation, 5)
                    })
            
            filename = f'gbpusd_candles_{tf_name}.json'
            with open(filename, 'w') as f:
                json.dump({'candles': split_candles}, f)
            print(f"   ✓ Created {filename} with {len(split_candles)} candles")
        
        else:
            # Lower frequency (combine candles)
            step = int(1/ratio)
            combined_candles = []
            
            for i in range(0, len(gbpusd_candles), step):
                chunk = gbpusd_candles[i:i+step]
                if len(chunk) == step:
                    combined_candles.append({
                        't': chunk[0]['t'],
                        'o': chunk[0]['o'],
                        'h': max(c['h'] for c in chunk),
                        'l': min(c['l'] for c in chunk),
                        'c': chunk[-1]['c']
                    })
            
            filename = f'gbpusd_candles_{tf_name}.json'
            with open(filename, 'w') as f:
                json.dump({'candles': combined_candles}, f)
            print(f"   ✓ Created {filename} with {len(combined_candles)} candles")
    
    return True

def main():
    print("=" * 60)
    print("🚀 SAMPLE GBPUSD DATA GENERATOR")
    print("   Creates realistic GBPUSD data for testing")
    print("=" * 60)
    
    if create_sample_gbpusd_candles():
        print("\n✅ Sample GBPUSD data created!")
        print("   You can now use multi_currency_chart.html")
        print("   Switch between EUR/USD and GBP/USD")
    else:
        print("\n❌ Failed to create sample data")
    
    print("=" * 60)

if __name__ == '__main__':
    main()
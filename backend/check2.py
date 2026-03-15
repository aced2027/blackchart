import json
c=json.load(open(r'X:\dep0project\blackchart\backend\candles.json'))['candles']
html=open(r'X:\dep0project\blackchart\master_tick_candlestick_chart.html',encoding='utf-8').read()
# Find the data variable name
import re
matches=re.findall(r'(const|let|var)\s+(\w+)\s*=\s*\[',html)
print('Array variables found:',matches)
# Also check for fetch or load patterns
if 'fetch' in html: print('has fetch')
if 'candles' in html: print('has candles variable')
if 'RAW' in html: print('has RAW variable')
if 'DATA' in html: print('has DATA variable')
if 'CANDLES' in html: print('has CANDLES variable')
if 'sampleData' in html: print('has sampleData')
if 'chartData' in html: print('has chartData')

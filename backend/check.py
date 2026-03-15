import json,os
c=json.load(open(r'X:\dep0project\blackchart\backend\candles.json'))['candles']
data=json.dumps(c,separators=(',',':'))
html=open(r'X:\dep0project\blackchart\master_tick_candlestick_chart.html',encoding='utf-8').read()
print('master chart size:',len(html))
print('first 200 chars:',html[:200])

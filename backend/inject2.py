import json,re
c=json.load(open(r'X:\dep0project\blackchart\backend\candles.json'))['candles']
data=json.dumps(c,separators=(',',':'))
html=open(r'X:\dep0project\blackchart\master_tick_candlestick_chart.html',encoding='utf-8').read()
idx=html.index('const rawData=')
end=html.index('];',idx)+2
new=html[:idx]+'const rawData='+data+';'+html[end:]
open(r'X:\dep0project\blackchart\master_tick_candlestick_chart.html','w',encoding='utf-8').write(new)
print('Done! Injected',len(c),'candles')

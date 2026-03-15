import json
c=json.load(open(r'X:\dep0project\blackchart\backend\candles.json'))['candles']
data=json.dumps(c,separators=(',',':'))
top=open(r'X:\dep0project\blackchart\OPEN_THIS_CHART.html').read()
idx=top.index('const RAW=')
end=top.index('];',idx)+2
new=top[:idx]+'const RAW='+data+';'+top[end:]
open(r'X:\dep0project\blackchart\OPEN_THIS_CHART.html','w',encoding='utf-8').write(new)
print('Done! Updated with',len(c),'candles')

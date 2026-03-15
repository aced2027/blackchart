import json,re
c=json.load(open(r'X:\dep0project\blackchart\backend\candles.json'))['candles']
data=json.dumps(c,separators=(',',':'))
html=open(r'X:\dep0project\blackchart\master_tick_candlestick_chart.html',encoding='utf-8').read()
inject='''
const REAL_DATA='''+data+''';
document.addEventListener('DOMContentLoaded',function(){
    setTimeout(function(){processRawData(REAL_DATA);},500);
},true);
'''
html=html.replace('</script>','</script><script>'+inject+'</script>',1)
open(r'X:\dep0project\blackchart\master_tick_candlestick_chart.html','w',encoding='utf-8').write(html)
print('Done! Injected',len(c),'candles into master chart')

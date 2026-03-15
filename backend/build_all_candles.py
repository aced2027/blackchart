import struct,lzma,os,json
from datetime import datetime,timezone
BI5_ROOT=r"X:\dep0project\blackchart\backend\tick_vault_data\downloads\EURUSD"
OUTPUT=r"X:\dep0project\blackchart\backend\candles.json"
POINT=0.00001
INTERVAL=3600000
bi5=[]
for root,dirs,files in os.walk(BI5_ROOT):
    for f in files:
        if f.lower().endswith(".bi5"):
            bi5.append(os.path.join(root,f))
bi5.sort()
print(f"Found {len(bi5)} files")
def getts(fp):
    p=fp.replace("\\","/").split("/")
    try:
        h=int(p[-1].lower().replace("h_ticks.bi5",""))
        d,m,y=int(p[-2]),int(p[-3])+1,int(p[-4])
        return int(datetime(y,m,d,h,tzinfo=timezone.utc).timestamp()*1000)
    except:
        return None
bk={}
tot=0
for i,fp in enumerate(bi5):
    bms=getts(fp)
    if not bms:
        continue
    try:
        data=lzma.decompress(open(fp,"rb").read())
    except:
        continue
    for j in range(len(data)//20):
        try:
            ms,ai,bi2,av,bv=struct.unpack_from(">IIIff",data,j*20)
            mid=((ai+bi2)/2)*POINT
            if 0.5<mid<5.0:
                k=(bms+ms)//INTERVAL*INTERVAL
                if k not in bk:
                    bk[k]=[mid,mid,mid,mid]
                else:
                    b=bk[k]
                    if mid>b[1]:b[1]=mid
                    if mid<b[2]:b[2]=mid
                    b[3]=mid
                tot+=1
        except:
            pass
    if (i+1)%500==0 or i+1==len(bi5):
        print(str(i+1)+"/"+str(len(bi5))+" ticks:"+str(tot),flush=True)
candles=[]
for k in sorted(bk):
    o,h,l,c=bk[k]
    if h>=max(o,c) and l<=min(o,c) and l>0:
        candles.append({"t":k,"o":round(o,5),"h":round(h,5),"l":round(l,5),"c":round(c,5)})
print("Candles:"+str(len(candles)))
if candles:
    d0=datetime.fromtimestamp(candles[0]["t"]/1000,tz=timezone.utc).strftime("%Y-%m-%d")
    d1=datetime.fromtimestamp(candles[-1]["t"]/1000,tz=timezone.utc).strftime("%Y-%m-%d")
    print("Range:"+d0+" to "+d1)
json.dump({"symbol":"EURUSD","timeframe":"1h","candles":candles},open(OUTPUT,"w"),separators=(",",":"))
print("Saved "+OUTPUT)

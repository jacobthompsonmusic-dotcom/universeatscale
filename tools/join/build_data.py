import pickle, math, re, json, struct, base64
rows,stars,out=pickle.load(open('m2.pkl','rb'))
SRC='/home/claude/universeatscale/milky-way/index.html'
s=open(SRC).read()
PC=3.26156
GX=(-0.0548755604,-0.8734370902,-0.4838350155)
GY=( 0.4941094279,-0.4448296300, 0.7469822445)
GZ=(-0.8676661490,-0.1980763734, 0.4559837762)
def gal(v): return tuple(sum(a*b for a,b in zip(G,v)) for G in (GX,GY,GZ))
for st in stars: st['gu']=gal(st['u'])
def fmt(v,d):
    dec = 2 if d<100 else 1 if d<1000 else 0
    t=f'{v:.{dec}f}'
    if '.' in t: t=t.rstrip('0').rstrip('.')
    if t in('-0',''): t='0'
    return t
# ---- A. map FIELD_RAW with precise positions
newrows=[]; mappos=[]; nfix=0; maxshift=0
for k,p in enumerate(rows):
    st=stars[out[k]]
    x,y,z=float(p[0]),float(p[1]),float(p[2]); n=math.hypot(x,y,z)
    q=list(p)
    if 'g' in st and math.dist(st['g'],(x,y,z))<(0.2 if '.' in p[0] else 1.8):
        g=st['g']
    else:   # distance overridden in the map (Hipparcos 2007): keep that distance, take the direction from the catalogue
        g=tuple(c*n for c in st['gu']); nfix+=1; q[9]='H'
    maxshift=max(maxshift,math.dist(g,(x,y,z)))
    d=math.hypot(*g)
    q[0],q[1],q[2]=fmt(g[0],d),fmt(g[1],d),fmt(g[2],d)
    newrows.append('|'.join(q)); mappos.append(tuple(float(v) for v in q[:3]))
print('map stars',len(newrows),'dist-kept',nfix,'max shift ly',round(maxshift,2))
field='\\n'.join(newrows)
open('field_raw.txt','w').write(field)
print('old len',len(re.search(r'const FIELD_RAW = "(.*?)";\n',s,re.S).group(1)),'new len',len(field))
# ---- named objects of the map (POS: d ly, l, b)
POS=json.loads(re.search(r'const POS = (\{.*?\});\n',s,re.S).group(1))
objs=re.findall(r"^  \['((?:[^'\\]|\\.)*)', '(star|planets)', ([\d.]+), ([\d.]+),",s,re.M)
named={}
for name,typ,d,l in objs:
    name=name.replace("\\'","'")
    if name in POS: d,l,b,_=POS[name]
    else: d,l,b=float(d),float(l),0.0
    named[name]=(float(d),float(l),float(b))
print('named star objects',len(named), 'with POS', sum(1 for n in named if n in POS))
def gvec(d,l,b):
    l=math.radians(l);b=math.radians(b);return (d*math.cos(b)*math.cos(l),d*math.cos(b)*math.sin(l),d*math.sin(b))
inmap={i:k for k,i in enumerate(out)}
# attach each named object to the brightest catalogue star within 0.35 deg that is not a map field star
objstar={}
for name,(d,l,b) in named.items():
    u=gvec(1,l,b); best=None
    for i,st in enumerate(stars):
        if i in inmap: continue
        c=sum(a*b_ for a,b_ in zip(u,st['gu']))
        if c>math.cos(math.radians(0.35)):
            if best is None or st['mag']<stars[best]['mag']: best=i
    objstar[name]=best
print('named without catalogue star:',[n for n,i in objstar.items() if i is None])
byidx={i:n for n,i in objstar.items() if i is not None}
# ---- B. the sky list for the Solar System view
sky=[]   # (x,y,z gal ly, M, ci, flag)  flag: 1 = drawn on the galaxy map too
skyidx={}
def absmag(mag,dly): return mag-5*math.log10(max(dly/PC,1e-3)/10)
def ci(st):
    try: return float(st['r']['ci'])
    except: return 0.65
for k,p in enumerate(rows):
    st=stars[out[k]]; g=mappos[k]; d=math.hypot(*g)
    M=float(p[4]) if p[4]!='' else absmag(float(p[3]),d)
    c=float(p[5]) if p[5]!='' else 0.65
    skyidx[out[k]]=len(sky); sky.append((g[0],g[1],g[2],M,c,1))
nob=0;nfar=0
for i,st in enumerate(stars):
    if i in inmap: continue
    if i in byidx:
        d,l,b=named[byidx[i]]; g=tuple(c*d for c in st['gu'])   # catalogue direction, the map's adopted distance
        skyidx[i]=len(sky); sky.append((g[0],g[1],g[2],absmag(st['mag'],d),ci(st),1)); nob+=1
    elif st['mag']<=6.5:
        if 'g' in st: g=st['g']; d=math.hypot(*g)
        else: d=3000.0; g=tuple(c*d for c in st['gu']); nfar+=1    # no usable parallax: far away, sky only
        skyidx[i]=len(sky); sky.append((g[0],g[1],g[2],absmag(st['mag'],d),ci(st),0))
print('sky stars',len(sky),'named-object stars',nob,'no-parallax',nfar)
buf=bytearray()
for x,y,z,M,c,f in sky:
    buf+=struct.pack('<fffhbB',x,y,z,int(round(max(-30,min(30,M))*100)),int(round(max(-0.6,min(2.5,c))*50)),f)
b64=base64.b64encode(bytes(buf)).decode()
open('sky_b64.txt','w').write(b64); print('sky bytes',len(buf),'b64',len(b64))
# ---- C. zodiac
Z=json.loads(re.search(r'const ZODIAC = (\[.*?\]);\n',open('/home/claude/universeatscale/solar-system/index.html').read(),re.S).group(1))
def vec(ra,de):
    ra=math.radians(ra);de=math.radians(de);return (math.cos(de)*math.cos(ra),math.cos(de)*math.sin(ra),math.sin(de))
cand=[i for i,st in enumerate(stars) if st['mag']<=6.6]
POLIS=3000.0
zs=[];zm=[];stats=[]
for c in Z:
    def find(ra,de):
        u=vec(ra,de);best=None
        for i in cand:
            if sum(a*b for a,b in zip(u,stars[i]['u']))>math.cos(math.radians(0.06)):
                if best is None or stars[i]['mag']<stars[best]['mag']: best=i
        assert best is not None,(c['n'],ra,de)
        return best
    ls=[];lm=[];ds=[]
    for l in c['p']:
        a=[];bm=[]
        for ra,de in l:
            i=find(ra,de)
            if i not in skyidx:   # mag 6.5–6.6 edge case
                raise SystemExit('not in sky '+str(stars[i]['r']))
            a.append(skyidx[i])
            x,y,z,M,cc,f=sky[skyidx[i]]
            if stars[i]['r']['proper']=='Polis':
                g=tuple(v*POLIS for v in stars[i]['gu']); sky[skyidx[i]]=(g[0],g[1],g[2],absmag(stars[i]['mag'],POLIS),cc,0); x,y,z=g
                bm.append([round(v,1) for v in g])
            elif i in inmap: bm.append(inmap[i])
            elif i in byidx: bm.append(byidx[i])
            else: bm.append([round(x,2),round(y,2),round(z,2)])
            ds.append(math.hypot(x,y,z))
        ls.append(a); lm.append(bm)
    ds.sort(); dmed=ds[len(ds)//2]
    lu=gal(vec(*c['l']))
    zs.append({'n':c['n'],'l':[round(v,5) for v in lu],'d':round(dmed,1),'p':ls})
    zm.append({'n':c['n'],'l':[round(v*dmed,1) for v in lu],'p':lm})
    stats.append((c['n'],round(min(ds)),round(dmed),round(max(ds))))
for t in stats: print(' ',t)
# re-pack (Polis changed)
buf=bytearray()
for x,y,z,M,c,f in sky:
    buf+=struct.pack('<fffhbB',x,y,z,int(round(max(-30,min(30,M))*100)),int(round(max(-0.6,min(2.5,c))*50)),f)
open('sky_b64.txt','w').write(base64.b64encode(bytes(buf)).decode())
json.dump(zs,open('zod_sky.json','w'),separators=(',',':'),ensure_ascii=False)
json.dump(zm,open('zod_map.json','w'),separators=(',',':'),ensure_ascii=False)
print(len(json.dumps(zs)),len(json.dumps(zm)))
print(json.dumps(zm[4],ensure_ascii=False)[:400])

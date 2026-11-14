import gzip, csv, math, re, json, sys
SRC='/home/claude/universeatscale/milky-way/index.html'
s=open(SRC).read()
m=re.search(r'const FIELD_RAW = "(.*?)";\n',s,re.S)
rows=[r.split('|') for r in m.group(1).split('\\n')]
print('map rows',len(rows))
# equatorial -> galactic (IAU 1958 / Hipparcos matrix)
GX=(-0.0548755604,-0.8734370902,-0.4838350155)
GY=( 0.4941094279,-0.4448296300, 0.7469822445)
GZ=(-0.8676661490,-0.1980763734, 0.4559837762)
PC=3.26156
stars=[]
with gzip.open('/tmp/dl/athyg/data/subsets/athyg_32_reduced_m10.csv.gz','rt',encoding='utf-8') as f:
    for r in csv.DictReader(f):
        if r['proper']=='Sol': continue
        try: mag=float(r['mag'])
        except: continue
        if r['dist']=='' : 
            if mag>6.5: continue
            d=None
        else: d=float(r['dist'])
        if d is not None and not (mag<=6.6 or d*PC<=52): continue
        ra=float(r['ra'])*15*math.pi/180; de=float(r['dec'])*math.pi/180
        u=(math.cos(de)*math.cos(ra),math.cos(de)*math.sin(ra),math.sin(de))
        if d is not None:
            e=(float(r['x0']),float(r['y0']),float(r['z0']))
        else: e=None
        stars.append(dict(r=r,mag=mag,d=d,u=u,e=e))
print('candidates',len(stars))
def gal(v): return tuple(sum(a*b for a,b in zip(G,v)) for G in (GX,GY,GZ))
for st in stars:
    if st['e']:
        g=gal(st['e']); st['g']=tuple(c*PC for c in g)
# index by mag string
from collections import defaultdict
idx=defaultdict(list)
for i,st in enumerate(stars):
    if 'g' in st: idx[round(st['mag']*100)].append(i)
out=[];miss=0;worst=0
used=set()
for k,p in enumerate(rows):
    x,y,z=float(p[0]),float(p[1]),float(p[2]); mg=round(float(p[3])*100)
    best=None;bd=1e9
    for dm in (0,-1,1):
        for i in idx.get(mg+dm,[]):
            if i in used: continue
            g=stars[i]['g']; dd=math.dist(g,(x,y,z))
            if dd<bd: bd=dd;best=i
    tol=0.09 if '.' in p[0] else 0.9
    if best is None or bd>tol*1.8:
        miss+=1; out.append(None)
        if miss<15: print('MISS',p,bd, stars[best]['r']['proper'] if best is not None else None)
    else:
        used.add(best); out.append(best); worst=max(worst,bd)
print('missing',miss,'worst',worst)
import pickle
pickle.dump((rows,stars,out),open('m.pkl','wb'))

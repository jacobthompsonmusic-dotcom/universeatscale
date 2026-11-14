import pickle, math
rows,stars,out=pickle.load(open('m.pkl','rb'))
GX=(-0.0548755604,-0.8734370902,-0.4838350155)
GY=( 0.4941094279,-0.4448296300, 0.7469822445)
GZ=(-0.8676661490,-0.1980763734, 0.4559837762)
def gal(v): return tuple(sum(a*b for a,b in zip(G,v)) for G in (GX,GY,GZ))
for st in stars: st['gu']=gal(st['u'])
used=set(i for i in out if i is not None)
from collections import defaultdict
idx=defaultdict(list)
for i,st in enumerate(stars): idx[round(st['mag']*100)].append(i)
fix=0
for k,p in enumerate(rows):
    if out[k] is not None: continue
    x,y,z=float(p[0]),float(p[1]),float(p[2]); n=math.hypot(x,y,z); u=(x/n,y/n,z/n); mg=round(float(p[3])*100)
    best=None;ba=9
    for dm in (0,-1,1):
        for i in idx.get(mg+dm,[]):
            if i in used: continue
            a=math.acos(max(-1,min(1,sum(a*b for a,b in zip(u,stars[i]['gu'])))))
            if a<ba: ba=a;best=i
    if best is not None and ba<math.radians(1.5)+0.6/n:
        out[k]=best; used.add(best); fix+=1
        r=stars[best]['r']
        print(p[6], '| map d=%.0f ly, athyg d=%s pc*3.26=%.0f src=%s | sep %.2f deg'%(n, r['dist'], (float(r['dist'])*3.26156 if r['dist'] else 0), r['dist_src'], math.degrees(ba)))
    else: print('STILL MISSING',p,ba)
print('fixed',fix,'left',sum(1 for o in out if o is None))
# how do bright stars compare (mag<3)?
import collections
c=collections.Counter()
for k,p in enumerate(rows):
    if float(p[3])<3 and out[k] is not None: c[(p[9],stars[out[k]]['r']['dist_src'])]+=1
print(c)
pickle.dump((rows,stars,out),open('m2.pkl','wb'))

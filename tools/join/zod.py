import pickle, math, re, json
rows,stars,out=pickle.load(open('m2.pkl','rb'))
s=open('/home/claude/universeatscale/solar-system/index.html').read()
m=re.search(r'const ZODIAC = (\[.*?\]);\n',s,re.S)
Z=json.loads(m.group(1))
inmap={i:k for k,i in enumerate(out)}
def vec(ra,de):
    ra=math.radians(ra);de=math.radians(de);return (math.cos(de)*math.cos(ra),math.cos(de)*math.sin(ra),math.sin(de))
cand=[i for i,st in enumerate(stars) if st['mag']<=6.6]
tot=0;nomap=[];far=[]
res=[]
for c in Z:
    verts={}
    for l in c['p']:
        for ra,de in l: verts[(ra,de)]=None
    for (ra,de) in verts:
        u=vec(ra,de);best=None;ba=9
        for i in cand:
            d=sum(a*b for a,b in zip(u,stars[i]['u']))
            a=math.acos(max(-1,min(1,d)))
            if a<ba: ba=a;best=i
        verts[(ra,de)]=(best,ba)
        tot+=1
        r=stars[best]['r']
        if math.degrees(ba)>0.05: far.append((c['n'],ra,de,r['proper'] or r['bayer']+' '+r['con'],round(math.degrees(ba),3),stars[best]['mag']))
        if best not in inmap: nomap.append((c['n'],r['proper'] or r['bayer']+' '+r['con'],stars[best]['mag'],r['dist'],r['dist_src']))
    res.append((c,verts))
print('verts',tot,'sep>0.05deg',len(far),'not in map set',len(nomap))
for f in far: print(' far',f)
for f in nomap: print(' nomap',f)
pickle.dump(res,open('zod.pkl','wb'))

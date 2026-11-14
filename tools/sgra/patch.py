def patch(P, pairs):
    s=open(P,encoding='utf-8').read()
    for old,new in pairs:
        assert s.count(old)==1,(P,s.count(old),old[:70]); s=s.replace(old,new)
    open(P,'w',encoding='utf-8').write(s)
B='/tmp/build/bh/'
js=open(B+'bh_js.js',encoding='utf-8').read(); fs=open(B+'bh_fs.glsl',encoding='utf-8').read()
patch('milky-way/index.html',[
("  #gc { position: fixed;","""  canvas#bh { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; display: none; }
  #bhnote { position: fixed; left: 50%; bottom: 64px; transform: translateX(-50%); display: none; max-width: min(620px, calc(100% - 32px)); text-align: center;
    font: 400 11.5px/1.45 Inter, sans-serif; color: rgba(214,218,232,0.78); text-shadow: 0 1px 3px #000; pointer-events: none; }
  #bhnote b { color: #ffd9a0; font-weight: 600; }
  #gc { position: fixed;"""),
('<canvas id="map"></canvas>','''<canvas id="map"></canvas>
<canvas id="bh"></canvas>
<div id="bhnote"><b>Sagittarius A*</b> · 4.3 million Suns · every pixel's light traced back through curved spacetime (non-spinning hole) · the gas is hot, thin and puffy, brighter on the side swinging toward us · false colour, after the Event Horizon Telescope · time ×120: the bright flare circles in about 50 minutes</div>
<script type="x-shader/x-fragment" id="bh-fs">'''+fs+'''</script>'''),
("OBJ.push(...GALAXIES);\n","OBJ.push(...GALAXIES);\nconst GCO = OBJ.find(o => o.name === 'Sagittarius A*');\n"),
("const maxScale = () => Math.min(Wd, Ht) / 6;",
 "// closest zoom: a 6-light-year view, except around Sagittarius A*, where you can go all the way down to the black hole\nconst maxScale = () => Math.min(Wd, Ht) / Math.max(4e-6, Math.min(6, 1.5 * Math.hypot(view.x - GCO.x, view.y - GCO.y, view.z - GCO.z)));"),
("function flyTo(x, y, z, span, dur = 1100, orient) {", js + "\nfunction flyTo(x, y, z, span, dur = 1100, orient) {"),
("  drawObjects();\n  updateScale();","  drawObjects();\n  const s2a = drawS2(), bhOn = drawBH();\n  if ((s2a > 0 || bhOn) && !anim) draw();   // keep S2 and the flow moving\n  updateScale();"),
("  if (sunDive(X, Y, f)) return;\n","  if (sunDive(X, Y, f)) return;\n  if (gcSteer(X, Y, f)) return;\n"),
("""  const ly = niceStep(130 / view.s), px = ly * view.s;
  document.getElementById('scale-bar').style.width = px + 'px';
  document.getElementById('scale-label').textContent = fmtLy(ly);""",
"""  let ly = niceStep(130 / view.s), label = fmtLy(ly);
  if (130 / view.s < 0.03) { const au = niceStep(130 / view.s * AU_PER_LY); ly = au / AU_PER_LY; label = (au < 1 ? +au.toPrecision(2) : au.toLocaleString('en-CA')) + ' AU'; }
  document.getElementById('scale-bar').style.width = ly * view.s + 'px';
  document.getElementById('scale-label').textContent = label;"""),
("  document.getElementById('info-go').style.display = EMBED && ssReady && o.type === 'sun' ? 'inline-block' : 'none';\n",
"""  { const go = document.getElementById('info-go'), bh = o === GCO, sun = EMBED && ssReady && o.type === 'sun';
    go.style.display = bh || sun ? 'inline-block' : 'none';
    go.textContent = bh ? 'Fly down to the black hole' : 'Dive into the Solar System';
    go.onclick = bh ? () => { select(null); anim = { from: { ...view }, to: { x: GCO.x, y: GCO.y, z: GCO.z, s: Math.min(Wd, Ht) / 1.4e-5, yaw: view.yaw, tilt: view.tilt }, t0: performance.now(), dur: 6500 }; draw(); } : diveToSun; }
"""),
])
patch('solar-system/index.html',[
("function updateGC() {\n  const W = innerWidth, H = innerHeight,",
 """function updateGC() {
  const ga = sstep(Math.log(camNom.distanceTo(controls.target) / AUS), Math.log(70000), Math.log(110000));   // only once you're out past the Oort cloud
  if (ga < 0.01) { gcEl.style.display = 'none'; return; }
  gcEl.style.opacity = ga.toFixed(2);
  const W = innerWidth, H = innerHeight,"""),
])
print('ok')

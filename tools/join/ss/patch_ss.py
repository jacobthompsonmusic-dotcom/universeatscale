import re, json
P='/home/claude/universeatscale/solar-system/index.html'
s=open(P,encoding='utf-8').read()
B='/tmp/build/'
def rep(old,new,cnt=1):
    global s
    n=s.count(old)
    assert n==cnt, (n, old[:90])
    s=s.replace(old,new)
def rd(f): return open(B+f,encoding='utf-8').read()
# 1 frames
old="const eqToScene = v => new THREE.Vector3(v.x, -v.y * Math.sin(EPS) + v.z * Math.cos(EPS), -(v.y * Math.cos(EPS) + v.z * Math.sin(EPS)));\n"
rep(old, old+rd('ss/A_frames.js'))
# 2 cameras
rep("skyCam = new THREE.PerspectiveCamera(40, 1, 1, 3e6);","skyCam = new THREE.PerspectiveCamera(40, 1, 0.01, 3e6);")
rep("controls.minDistance = 0.0002; const MAXD = 6e7; controls.maxDistance = MAXD;",
    "controls.minDistance = 0.0002; let MAXD = SPAN_MAX * LY / (2 * TAN20); controls.maxDistance = MAXD;   // out to where the galaxy map takes over")
# 4 sky
i0=s.index("{\n  const n = 5000, pos = new Float32Array(n * 3)")
i1=s.index("{\n  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.4e6")
sky=rd('ss/C_sky.js').replace('@@STARS@@',rd('sky_b64.txt')).replace('@@ZODIAC@@',rd('zod_sky.json'))
s=s[:i0]+sky+s[i1:]
rep("glow.renderOrder = -1; milky.add(glow);","glow.renderOrder = -1; milky.add(glow); milky.userData.glow = glow;")
rep("pts.renderOrder = -1; milky.add(pts);","pts.renderOrder = -1; milky.add(pts); milky.userData.pts = pts;")
# 6 far
rep("SUN.root.add(SUN.glare);\n","SUN.root.add(SUN.glare);\n"+rd('ss/D_far.js'))
# 7 relOf
rep("""function relOf(o, out = new THREE.Vector3()) {
  if (o.kind === 'moon') return o.mesh.getWorldPosition(out);
  return out.copy(o.abs).sub(origin);
}""","""const _qi = new THREE.Quaternion();
function relLocal(o, out = new THREE.Vector3()) {   // relative to the floating origin, in the scene's own axes (the plane of Earth's orbit)
  if (o.kind === 'moon') { o.mesh.getWorldPosition(out); return deep.t > 0 ? out.applyQuaternion(_qi.copy(scene.quaternion).invert()) : out; }
  return out.copy(o.abs).sub(origin);
}
function relOf(o, out = new THREE.Vector3()) {      // …and as the camera sees it: far from the Sun the whole scene is turned
  if (o.kind === 'moon') return o.mesh.getWorldPosition(out);
  out.copy(o.abs).sub(origin); return deep.t > 0 ? out.applyQuaternion(scene.quaternion) : out;
}""")
rep("origin.copy(relOf(focus).add(origin)); space.position.copy(origin).negate(); scene.updateMatrixWorld();","origin.copy(relLocal(focus).add(origin)); space.position.copy(origin).negate(); scene.updateMatrixWorld();")
rep("const fa = relOf(o).add(origin), delta = fa.clone().sub(origin);","const fa = relLocal(o).add(origin), delta = fa.clone().sub(origin).applyQuaternion(scene.quaternion);")
# 10 labels
rep("if (o.kind === 'moon') { const par = o.parent; if (Math.hypot(o.ax - par.ax, o.ay - par.ay) < 12 + par.px) o.onScreen = false; }",
    "if (o.kind === 'moon') { const par = o.parent; if (Math.hypot(o.ax - par.ax, o.ay - par.ay) < 12 + par.px) o.onScreen = false; }\n    else if (o.isPlanet && o !== selected && SUN.dist > 60 * AUS && Math.hypot(o.ax - SUN.ax, o.ay - SUN.ay) < 18) o.onScreen = false; // from far out the planets melt into the Sun")
rep("""    el.addEventListener('dblclick', ev => { ev.stopPropagation(); flyTo(o); });
  }
}""","""    el.addEventListener('dblclick', ev => { ev.stopPropagation(); flyTo(o); });
  }
  for (const m of MARKS) { const el = document.createElement('div'); el.className = 'lab mark'; el.textContent = m.name; el.style.display = 'none'; labelBox.appendChild(el); m.el = el; }
}
function updateMarks(camD) {   // distance rings and the names of the outskirts, each shown while it is a sensible size on screen
  const pxs0 = innerHeight / 2 / TAN20, p = new THREE.Vector3(), W = innerWidth, H = innerHeight;
  for (const m of MARKS) {
    const R = m.r / camD * pxs0, a = opts.labels ? sstep(R, 46, 80) * (1 - sstep(R, 1500, 2800)) : 0;
    if (m.line) { m.line.visible = opts.orbits && R > 20 && R < 6000; m.line.material.opacity = 0.2 * sstep(R, 20, 60) * (1 - sstep(R, 3000, 6000)); }
    if (a <= 0.01) { m.el.style.display = 'none'; continue; }
    p.copy(m.pos).sub(origin); if (deep.t > 0) p.applyQuaternion(scene.quaternion); p.project(camera);
    const on = p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1;
    m.el.style.display = on ? 'block' : 'none';
    if (on) { m.el.style.opacity = a.toFixed(2); m.el.style.transform = `translate(${((p.x + 1) / 2 * W + 6).toFixed(1)}px, ${((1 - p.y) / 2 * H).toFixed(1)}px) translateY(-50%)`; }
  }
}""")
rep("  .lab.big { font-weight:600; font-size:13px; color:#fff6e6; }","  .lab.big { font-weight:600; font-size:13px; color:#fff6e6; }\n  .lab.mark { color:rgba(190,206,236,0.72); font-size:10.5px; letter-spacing:0.09em; text-transform:uppercase; pointer-events:none; cursor:default; }\n  .lab.mark::before { display:none; }")
# 12 frame
i0=s.index("let lastFG = undefined;\nfunction frame(t) {")
i1=s.index("function init() {")
s=s[:i0]+rd('ss/F_frame.js')+"\n"+s[i1:]
# 13 scale
rep("""  if (want > AU * 0.05) { val = nice(want / AU);""","""  if (want > LYKM * 0.08) { val = nice(want / LYKM); txt = `${+val.toPrecision(2)} light-year${val === 1 ? '' : 's'}`; val *= LYKM; }
  else if (want > AU * 0.05) { val = nice(want / AU);""")
# 14 resize
rep("function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = skyCam.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); skyCam.updateProjectionMatrix(); }",
    "function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = skyCam.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); skyCam.updateProjectionMatrix();\n  MAXD = SPAN_MAX * LY / (2 * TAN20) / Math.min(1, camera.aspect); controls.maxDistance = MAXD; starMat.uniforms.uPR.value = renderer.getPixelRatio(); }")
# 15 toggles
rep("milky.visible = opts.milky; zodiac.visible = opts.zodiac; });","milky.visible = opts.milky; zodiac.visible = opts.zodiac;\n  if (EMBED && b.dataset.k === 'zodiac') parent.postMessage({ src: 'uas-ss', opt: 'zodiac', on: opts.zodiac }, '*'); });")
# 16 init ready + far button
rep("  requestAnimationFrame(frame);\n  setTimeout(() => { const l = document.getElementById('loading');","  requestAnimationFrame(frame);\n  if (EMBED) { parent.postMessage({ src: 'uas-ss', ready: true }, '*'); document.querySelectorAll('a.homelink').forEach(a => a.target = '_top'); }\n  setTimeout(() => { const l = document.getElementById('loading');")
rep("document.getElementById('p-top').onclick = () => preset(new THREE.Vector3(0.0001, 1, 0.0002));","document.getElementById('p-top').onclick = () => preset(new THREE.Vector3(0.0001, 1, 0.0002));\ndocument.getElementById('p-far').onclick = () => goFar(SPAN_MAX * 0.985);")
rep("""  <button class="txt" id="p-back" """,
    """  <button class="txt" id="p-far" title="Pull all the way back, past the Oort cloud, to where the nearest stars begin">STARS</button>\n  <button class="txt" id="p-back" """)
# 17 text
rep("<b>right-drag</b> to pan.</p>","<b>right-drag</b> to pan. Keep scrolling <b>out</b> past Neptune for the Kuiper belt, the Oort cloud and the way to the stars.</p>")
rep("""Double-click a name to fly there; click empty space to close a card.</div>""","""Double-click a name to fly there; click empty space to close a card. The stars behind are real, each at its measured distance.</div>""")
open(P,'w',encoding='utf-8').write(s)
print('ok',len(s))

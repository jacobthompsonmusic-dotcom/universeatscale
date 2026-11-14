def patch(P, pairs):
    s=open(P,encoding='utf-8').read()
    for old,new in pairs:
        assert s.count(old)==1,(P,s.count(old),old[:70]); s=s.replace(old,new)
    open(P,'w',encoding='utf-8').write(s)

# ---------- Solar System ----------
patch('solar-system/index.html',[
("  .lab .arr { display:inline-block; margin-right:6px; color:#ffe27a; }",
 """  .lab .arr { display:inline-block; margin-right:6px; color:#ffe27a; }
  .lab.gc { color:rgba(214,200,255,0.9); pointer-events:none; }
  .lab.gc::before { background:#c9b6ff; box-shadow:0 0 6px #c9b6ff; }
  .lab.gc.edge { background:rgba(16,14,24,0.72); border:1px solid rgba(201,182,255,0.45); border-radius:999px; padding:3px 10px 3px 8px; }
  .lab.gc.edge::before { display:none; }
  .lab.gc .arr { color:#c9b6ff; }
  body.embed .lab.gc { pointer-events:auto; cursor:pointer; }"""),
("function updateMarks(camD) {",
 """// the way to the centre of the Milky Way — Sagittarius A*, 26,990 light-years off (GRAVITY 2021) at l = 359.944°, b = −0.046°
const GC_LY = 26990, GC_DIR = (() => { const l = 359.944 * DEG, b = -0.046 * DEG; return galToScene(Math.cos(b) * Math.cos(l), Math.cos(b) * Math.sin(l), Math.sin(b)); })();
const gcEl = document.createElement('div'); gcEl.className = 'lab gc'; gcEl.title = 'Direction of the centre of the Milky Way, about 27,000 light-years away';
labelBox.appendChild(gcEl);
gcEl.addEventListener('click', ev => { ev.stopPropagation(); if (EMBED) parent.postMessage({ src: 'uas-ss', go: 'milky-way' }, '*'); });
function updateGC() {
  const W = innerWidth, H = innerHeight, v = GC_DIR.clone().multiplyScalar(GC_LY).applyQuaternion(skyRoot.quaternion).project(skyCam);
  if (v.z < 1 && Math.abs(v.x) < 0.97 && Math.abs(v.y) < 0.95) {   // in view: just name the spot
    gcEl.classList.remove('edge'); gcEl.textContent = 'Galactic centre'; gcEl.style.display = 'block';
    gcEl.style.transform = `translate(${((v.x + 1) / 2 * W + 10).toFixed(1)}px, ${((1 - v.y) / 2 * H).toFixed(1)}px) translateY(-50%)`; return;
  }
  let dx = v.x, dy = v.y; if (v.z > 1) { dx = -dx; dy = -dy; }   // behind you: point the other way
  const m = Math.max(Math.abs(dx) / 0.9, Math.abs(dy) / 0.86) || 1; dx /= m; dy /= m;
  const ex = (dx + 1) / 2 * W, ey = (1 - dy) / 2 * H, ang = Math.atan2(-dy, dx) / DEG, bw = 150;
  gcEl.innerHTML = `<span class="arr" style="transform:rotate(${ang.toFixed(0)}deg)">➜</span>Galactic centre`;
  gcEl.classList.add('edge'); gcEl.style.display = 'block';
  let lx = Math.min(W - bw - 8, Math.max(8, ex - bw / 2)), ly = ey;
  const rects = ['top', 'info', 'legend', 'controls', 'time'].map(id => document.getElementById(id)).filter(Boolean).map(e => e.getBoundingClientRect()).filter(r => r.width);
  if (EMBED) rects.push({ left: W - 140, right: W, top: 0, bottom: 270 });   // the scale ladder of the joined page
  for (const r of rects) if (lx + bw > r.left && lx < r.right && ly + 14 > r.top && ly - 14 < r.bottom) { if (Math.abs(dy) > Math.abs(dx) * 0.95) lx = (lx + bw / 2 < W / 2) ? r.right + 10 : r.left - bw - 10; else ly = (ly < H / 2) ? r.bottom + 18 : r.top - 18; }
  if (SUN.el.classList.contains('edge') && SUN.el.style.display !== 'none') {   // don't sit on top of the Sun's pointer
    const r = SUN.el.getBoundingClientRect(); if (lx + bw > r.left && lx < r.right && Math.abs(ly - (r.top + r.bottom) / 2) < 26) ly += ly < H / 2 ? 30 : -30;
  }
  gcEl.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px) translateY(-50%)`;
}
function updateMarks(camD) {"""),
("  updateLabels(); updateMarks(camD);","  updateLabels(); updateMarks(camD); updateGC();"),
])

# ---------- Milky Way map ----------
patch('milky-way/index.html',[
("  #info .go { display: none;",
 """  #gc { position: fixed; left: 0; top: 0; z-index: 4; display: none; padding: 3px 10px 3px 8px; border-radius: 999px; border: 1px solid rgba(201,182,255,0.45);
    background: rgba(16,14,24,0.72); color: rgba(214,200,255,0.92); font: 500 12px Inter, sans-serif; white-space: nowrap; cursor: pointer; text-shadow: 0 1px 2px #000; }
  #gc .arr { display: inline-block; margin-right: 6px; color: #c9b6ff; }
  #gc:hover { border-color: #c9b6ff; }
  #info .go { display: none;"""),
("<div id=\"tip\"></div>","<div id=\"tip\"></div>\n<button id=\"gc\" title=\"The centre of the Milky Way — click to go there\"></button>"),
("  updateScale();\n  const tb = document.getElementById('go3d')","  updateScale();\n  updateGC();\n  const tb = document.getElementById('go3d')"),
("function flyTo(x, y, z, span, dur = 1100, orient) {",
 """// While the centre of the galaxy is off screen, a pointer on the edge shows the way to it (hidden once you've pulled back out of the galaxy)
const GC = OBJ.find(o => o.name === 'Sagittarius A*'), gcEl = document.getElementById('gc');
gcEl.onclick = () => select(GC, true);
function updateGC() {
  if (following || viewSpan() > 250000) { gcEl.style.display = 'none'; return; }
  const [X, Y] = proj(GC.x, GC.y, GC.z);
  if (X > Wd * 0.03 && X < Wd * 0.97 && Y > Ht * 0.04 && Y < Ht * 0.96) { gcEl.style.display = 'none'; return; }   // in view: its own label marks it
  let dx = (X - Wd / 2) / (Wd / 2), dy = (Y - Ht / 2) / (Ht / 2);
  const m = Math.max(Math.abs(dx) / 0.9, Math.abs(dy) / 0.86) || 1; dx /= m; dy /= m;
  const ex = (dx + 1) / 2 * Wd, ey = (dy + 1) / 2 * Ht, bw = 150;
  gcEl.innerHTML = `<span class="arr" style="transform:rotate(${(Math.atan2(dy, dx) / DEG).toFixed(0)}deg)">➜</span>Galactic centre`;
  gcEl.style.display = 'block';
  let lx = Math.min(Wd - bw - 8, Math.max(8, ex - bw / 2)), ly = ey;
  const rects = ['top', 'info', 'legend', 'controls', 'readout'].map(id => document.getElementById(id)).filter(Boolean).map(e => e.getBoundingClientRect()).filter(r => r.width);
  if (EMBED) rects.push({ left: Wd - 140, right: Wd, top: 0, bottom: 270 });   // the scale ladder of the joined page
  for (const r of rects) if (lx + bw > r.left && lx < r.right && ly + 14 > r.top && ly - 14 < r.bottom) { if (Math.abs(dy) > Math.abs(dx) * 0.95) lx = (lx + bw / 2 < Wd / 2) ? r.right + 10 : r.left - bw - 10; else ly = (ly < Ht / 2) ? r.bottom + 18 : r.top - 18; }
  gcEl.style.transform = `translate(${lx.toFixed(1)}px, ${(ly - 12).toFixed(1)}px)`;
}
function flyTo(x, y, z, span, dur = 1100, orient) {"""),
])

# ---------- joined page: clicking the pointer in the Solar System heads for the galaxy ----------
patch('universe/index.html',[
("    if (m.opt) { toMW({ cmd: 'opt', k: m.opt, on: m.on }); return; }",
 "    if (m.opt) { toMW({ cmd: 'opt', k: m.opt, on: m.on }); return; }\n    if (m.go) { go(m.go); return; }"),
])
print('ok')

import re, json
P='/home/claude/universeatscale/milky-way/index.html'
s=open(P,encoding='utf-8').read()
B='/tmp/build/'
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:90]); s=s.replace(old,new)
def rd(f): return open(B+f,encoding='utf-8').read()
# 1. full-precision star positions
m=re.search(r'const FIELD_RAW = "(.*?)";\n',s,re.S)
s=s[:m.start(1)]+rd('field_raw.txt')+s[m.end(1):]
# 2. constants
rep("const EZ = W / 4;                       // half-height of the edge-on image, in ly\n",
"""const EZ = W / 4;                       // half-height of the edge-on image, in ly
// When this map is layered with the Solar System map (the joined "Earth to the edge of the universe" page), zooming into the Sun hands over to it.
const EMBED = window.name === 'uas-embed' || /[?&]embed=1/.test(location.search);
const DIVE = 6;                         // the view width, in ly, at which the Solar System map takes over
const OORT = 100000 / 63241.077;        // outer edge of the Oort cloud, ~100,000 AU, in ly
let ssReady = false, following = false;
""")
# 3. zodiac data
rep("const fieldCache = new Map();","""// the 12 zodiac constellations as stick figures between the real stars, each at its measured distance (figures after d3-celestial)
const ZODIAC = """+rd('zod_map.json')+""";
const fieldCache = new Map();""")
# 4. opts + oort + zodiac drawing
rep("const opts = { arms: true, grid: true, labels: true, stars: true, stalks: true, voids: true, web: true };",
    "const opts = { arms: true, grid: true, labels: true, stars: true, stalks: true, voids: true, web: true, zodiac: false };")
rep("""  drawBubble();
  drawField();
""","""  drawBubble();
  drawOort();
  drawField();
  if (opts.zodiac) drawZodiac();
""")
rep("let fieldPts = [];\n","""// the Oort cloud: the Sun's outermost family of comets, reaching about 1.6 light-years (predicted from comet orbits; never seen directly)
function drawOort() {
  const [X, Y] = proj(SUNW.x, SUNW.y, SUNW.z), R = OORT * view.s;
  if (R < 9 || X + R < 0 || X - R > Wd || Y + R < 0 || Y - R > Ht) return;
  const a = Math.min(1, (R - 9) / 14);
  const gr = ctx.createRadialGradient(X, Y, 0, X, Y, R);
  gr.addColorStop(0, `rgba(190,212,245,${0.34 * a})`); gr.addColorStop(0.25, `rgba(170,198,236,${0.13 * a})`); gr.addColorStop(1, 'rgba(160,190,230,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X, Y, R, 0, 7); ctx.fill();
  ctx.strokeStyle = `rgba(169,196,230,${0.38 * a})`; ctx.setLineDash([2, 5]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(X, Y, R, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  if (R > 34 && opts.labels) {
    ctx.fillStyle = `rgba(190,206,236,${0.72 * a})`; ctx.font = '500 10.5px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('OORT CLOUD (PREDICTED)'.split('').join('\\u200A'), X, Y - R - 7);
  }
}
let zodPts = null;
function drawZodiac() {
  const span = viewSpan(); if (span > 14000) return;
  if (!zodPts) zodPts = ZODIAC.map(c => ({ n: c.n, l: helioToWorld(...c.l), p: c.p.map(line => line.map(v => {
    if (typeof v === 'number') return { x: fx[v], y: fy[v], z: fz[v] };
    if (typeof v === 'string') return OBJ.find(o => o.name === v);
    return helioToWorld(...v); })) }));
  const g = span < 2500 ? 1 : Math.max(0, 1 - Math.log(span / 2500) / Math.log(5.6));
  ctx.strokeStyle = `rgba(159,188,255,${0.42 * g})`; ctx.lineWidth = 1; ctx.beginPath();
  for (const c of zodPts) for (const line of c.p) line.forEach((v, i) => { const [X, Y] = proj(v.x, v.y, v.z); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.stroke();
  if (!opts.labels || span < 30) return;
  ctx.font = '500 11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(170,195,255,${0.7 * g})`;
  for (const c of zodPts) { const [X, Y] = proj(c.l.x, c.l.y, c.l.z); if (X > -60 && X < Wd + 60 && Y > -20 && Y < Ht + 20) ctx.fillText(c.n.toUpperCase().split('').join('\\u200A'), X, Y); }
}
let fieldPts = [];
""")
# 5. render: anim done callback + state post
rep("    if (k >= 1) anim = null; else draw();\n  }\n  setupView();",
    "    if (k >= 1) { const done = anim.done; anim = null; if (done) done(); } else draw();\n  }\n  setupView();")
rep("""  const td = Math.round(view.tilt / DEG); document.getElementById('r-tilt').textContent = Math.abs(td) > 90 ? `${td}° (from below)` : td + '°';
}""","""  const td = Math.round(view.tilt / DEG); document.getElementById('r-tilt').textContent = Math.abs(td) > 90 ? `${td}° (from below)` : td + '°';
  if (EMBED && !following) { const sp = Ht / view.s; if (sp !== render.sp) { render.sp = sp; parent.postMessage({ src: 'uas-mw', span: viewSpan() }, '*'); } }
}""")
# 6. dive
rep("""const zoomTo = (X, Y, f) => { const [ax, ay] = zoomAnchor(X, Y); zoomAt(ax, ay, f); };
function zoomAt(X, Y, f) {
  setupView();""","""// Joined with the Solar System map: zooming in on the Sun eases it to the middle of the screen, then hands over at the same scale and angle.
function handOver(s) {
  if (view.tilt < 0) { view.tilt = -view.tilt; view.yaw += Math.PI; }   // the same line of sight, the right way up
  view.x = SUNW.x; view.y = SUNW.y; view.z = SUNW.z; view.s = s; anim = null; following = true; draw();
  parent.postMessage({ src: 'uas-mw', dive: true, s, yaw: view.yaw, tilt: view.tilt }, '*');
}
function sunDive(X, Y, f) {
  if (!EMBED || !ssReady || f <= 1 || viewSpan() > 60) return false;
  setupView();
  const [sx, sy] = proj(SUNW.x, SUNW.y, SUNW.z), M = Math.min(Wd, Ht);
  if (sx < 0 || sx > Wd || sy < 0 || sy > Ht || (Math.hypot(sx - X, sy - Y) > 130 && !(selected && selected.type === 'sun'))) return false;
  const sNew = view.s * f, spanNew = M / sNew;
  if (spanNew <= DIVE) { handOver(Math.min(sNew, M / 3.4)); return true; }
  const k = Math.min(1, Math.log(spanNew / DIVE) / Math.log(60 / DIVE));
  let ox = sx - Wd / 2, oy = sy - Ht / 2; const m = Math.hypot(ox, oy), cap = 0.5 * M * k;
  if (m > cap) { ox *= cap / m; oy *= cap / m; }
  const u = ox / sNew, v = oy / sNew;
  view.s = sNew; view.x = SUNW.x - (CY * u + SY * CT * v); view.y = SUNW.y - (-SY * u + CY * CT * v); view.z = SUNW.z + ST * v;
  anim = null; draw(); return true;
}
function diveToSun() {   // fly to the Sun, then hand over
  if (!EMBED || !ssReady) return;
  const M = Math.min(Wd, Ht); select(null);
  anim = { from: { ...view }, to: { x: SUNW.x, y: SUNW.y, z: SUNW.z, s: M / (DIVE * 1.05), yaw: view.yaw, tilt: view.tilt }, t0: performance.now(), dur: viewSpan() > 3000 ? 2200 : 1300, done: () => handOver(M / 5.4) };
  draw();
}
const zoomTo = (X, Y, f) => { const [ax, ay] = zoomAnchor(X, Y); zoomAt(ax, ay, f); };
function zoomAt(X, Y, f) {
  if (sunDive(X, Y, f)) return;
  setupView();""")
# 7. toggles
rep("document.querySelectorAll('.tg').forEach(b => b.onclick = () => { opts[b.dataset.k] = !opts[b.dataset.k]; b.classList.toggle('on', opts[b.dataset.k]); draw(); });",
"""document.querySelectorAll('.tg').forEach(b => b.onclick = () => { opts[b.dataset.k] = !opts[b.dataset.k]; b.classList.toggle('on', opts[b.dataset.k]); draw();
  if (EMBED && b.dataset.k === 'zodiac') parent.postMessage({ src: 'uas-mw', opt: 'zodiac', on: opts.zodiac }, '*'); });
if (EMBED) {
  document.body.classList.add('embed'); document.querySelectorAll('a.homelink').forEach(a => a.target = '_top');
  document.getElementById('info-go').onclick = diveToSun;
  addEventListener('message', e => {
    const m = e.data; if (!m || m.to !== 'uas-mw') return;
    if (m.cmd === 'ssready') ssReady = true;
    else if (m.cmd === 'follow') { following = true; anim = null; view.x = SUNW.x; view.y = SUNW.y; view.z = SUNW.z; view.s = m.s; view.yaw = m.yaw; view.tilt = m.tilt; draw(); }
    else if (m.cmd === 'release') { following = false; render.sp = 0; draw(); }
    else if (m.cmd === 'dive') diveToSun();
    else if (m.cmd === 'go') { following = false; select(null);
      if (m.key === 'stars') flyTo(SUNW.x, SUNW.y, SUNW.z, 60, 1500);
      else document.getElementById({ milkyway: 'goall', lg: 'golg', lan: 'golan', obs: 'goobs' }[m.key]).onclick(); }
    else if (m.cmd === 'opt') { opts[m.k] = m.on; document.querySelector(`.tg[data-k="${m.k}"]`).classList.toggle('on', m.on); draw(); }
  });
  parent.postMessage({ src: 'uas-mw', ready: true }, '*');
}""")
# 8. html
rep("""    <button class="tg on" data-k="web">Cosmic web</button>""","""    <button class="tg on" data-k="web">Cosmic web</button>
    <button class="tg" data-k="zodiac">Zodiac</button>""")
rep("""  <p class="blurb" id="info-blurb"></p>
</div>""","""  <p class="blurb" id="info-blurb"></p>
  <button class="go" id="info-go">Dive into the Solar System</button>
</div>""")
rep("  #info .blurb { margin: 0; color: #c9cee0; font-size: 13.5px; }","""  #info .blurb { margin: 0; color: #c9cee0; font-size: 13.5px; }
  #info .go { display: none; margin-top: 14px; padding: 7px 12px; border-radius: 999px; border: 1px solid rgba(255,207,110,0.45); background: rgba(255,207,110,0.14); color: var(--text); font: 500 12.5px Inter, sans-serif; cursor: pointer; }
  .embed-only { display: none; } body.embed .embed-only { display: inline; }""")
rep("  document.getElementById('info-blurb').textContent = blurb || '';\n","  document.getElementById('info-blurb').textContent = blurb || '';\n  document.getElementById('info-go').style.display = EMBED && ssReady && o.type === 'sun' ? 'inline-block' : 'none';\n")
open(P,'w',encoding='utf-8').write(s)
print('ok',len(s))

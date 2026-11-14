// ===================================================================
//  Sagittarius A* up close: the star S2 on its measured orbit, then the black hole itself
// ===================================================================
// Mass 4.297 million Suns (GRAVITY Collaboration 2022). Gravitational radius GM/c² = 6.345 million km; Schwarzschild radius Rs = twice that.
const GM_LY = 6.707e-7, RS_LY = 2 * GM_LY, AU_PER_LY = 63241.077, RS_SEC = 42.33;   // light crosses one Rs in 42.3 s
const BH_TIME = 120;                     // the flow is shown 120× faster than real time
const S2_RATE = 1;                       // S2's orbit is shown at one year per second
// directions on the sky at Sgr A* (Reid & Brunthaler 2004: RA 266.41684°, Dec −29.00781°), as vectors in the galactic frame and in this map's frame
const EQ2GAL = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
const eqToGal = v => EQ2GAL.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const galDirToWorld = v => { const a = helioToWorld(v[0], v[1], v[2]), o = helioToWorld(0, 0, 0); return [a.x - o.x, a.y - o.y, a.z - o.z]; };
const worldDirToGal = w => { const yh = -w[0], xg = -w[1], zg = w[2]; return [xg * cTH - zg * sTH, yh, xg * sTH + zg * cTH]; };
const SKY = (() => {
  const a = 266.41684 * DEG, d = -29.00781 * DEG;
  const away = [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)], east = [-Math.sin(a), Math.cos(a), 0], north = [-Math.sin(d) * Math.cos(a), -Math.sin(d) * Math.sin(a), Math.cos(d)];
  const g = { away: eqToGal(away), east: eqToGal(east), north: eqToGal(north) };
  return { g, w: { away: galDirToWorld(g.away), east: galDirToWorld(g.east), north: galDirToWorld(g.north) } };
})();
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
// an orbit's place on the sky: north and east offsets plus depth along the line of sight (visual-binary convention; i > 90° turns clockwise on the sky)
function skyOffset(r, u, i, Om) {
  const n = r * (Math.cos(Om) * Math.cos(u) - Math.sin(Om) * Math.sin(u) * Math.cos(i)), e = r * (Math.sin(Om) * Math.cos(u) + Math.cos(Om) * Math.sin(u) * Math.cos(i)), z = r * Math.sin(u) * Math.sin(i);
  return [n, e, z];
}
const skyToGal = ([n, e, z]) => [0, 1, 2].map(k => n * SKY.g.north[k] + e * SKY.g.east[k] + z * SKY.g.away[k]);
const skyToWorld = ([n, e, z]) => [0, 1, 2].map(k => n * SKY.w.north[k] + e * SKY.w.east[k] + z * SKY.w.away[k]);
// S2 (GRAVITY Collaboration 2020): a = 125.058 mas, e = 0.884649, i = 134.567°, Ω = 228.171°, ω = 66.263°, pericentre 2018.379, period 16.0455 yr
const S2 = { a: 0.125058 * 8275, e: 0.884649, i: 134.567 * DEG, Om: 228.171 * DEG, w: 66.263 * DEG, tp: 2018.379, P: 16.0455 };
function s2At(year) {
  const M = 2 * Math.PI * (((year - S2.tp) / S2.P) % 1); let E = M + S2.e * Math.sin(M);
  for (let k = 0; k < 8; k++) E -= (E - S2.e * Math.sin(E) - M) / (1 - S2.e * Math.cos(E));
  const nu = 2 * Math.atan2(Math.sqrt(1 + S2.e) * Math.sin(E / 2), Math.sqrt(1 - S2.e) * Math.cos(E / 2)), r = S2.a * (1 - S2.e * Math.cos(E));
  return skyToWorld(skyOffset(r, S2.w + nu, S2.i, S2.Om)).map(v => v / AU_PER_LY);
}
const S2_PATH = Array.from({ length: 361 }, (_, k) => s2At(S2.tp + S2.P * k / 360));
// The accretion flow turns the same way as the flares GRAVITY tracked orbiting just outside the hole (2018, 2023): clockwise on the sky,
// inclined about 152° with its node at 108°, so we see it within ~30° of face-on (EHT 2022 also favours a near face-on view)
const DISC = (() => {
  const n = norm3(cross3(skyToGal(skyOffset(1, 0, 152 * DEG, 108 * DEG)), skyToGal(skyOffset(1, Math.PI / 2, 152 * DEG, 108 * DEG))));
  const e1 = norm3(cross3(n, Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), e2 = cross3(n, e1);
  return { n, e1, e2 };
})();
const yearNow = () => 2000 + (Date.now() - Date.UTC(2000, 0, 1, 12)) / (365.25 * 864e5);
const T0 = performance.now(), Y0 = yearNow();

// the S2 orbit, drawn on the map
function drawS2() {
  const span = viewSpan(); if (span > 0.6 || span < 2e-5) return 0;
  const [gx, gy] = proj(GC.x, GC.y, GC.z); if (gx < -Wd || gx > 2 * Wd || gy < -Ht || gy > 2 * Ht) return 0;
  const a = Math.min(1, Math.log(0.6 / span) / Math.log(4)) * Math.min(1, Math.log(span / 2e-5) / Math.log(3));
  ctx.strokeStyle = `rgba(255,214,150,${0.5 * a})`; ctx.lineWidth = 1.2; ctx.setLineDash([]); ctx.beginPath();
  S2_PATH.forEach((p, k) => { const [X, Y] = proj(GC.x + p[0], GC.y + p[1], GC.z + p[2]); k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  const yr = Y0 + (performance.now() - T0) / 1000 * S2_RATE, s = s2At(yr), [X, Y] = proj(GC.x + s[0], GC.y + s[1], GC.z + s[2]);
  const gr = ctx.createRadialGradient(X, Y, 0, X, Y, 9); gr.addColorStop(0, `rgba(220,232,255,${a})`); gr.addColorStop(0.3, `rgba(170,200,255,${0.6 * a})`); gr.addColorStop(1, 'rgba(150,180,255,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X, Y, 9, 0, 7); ctx.fill();
  ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = `rgba(225,232,250,${a})`; ctx.fillText('S2', X + 10, Y - 6);
  ctx.font = '400 11px Inter, sans-serif'; ctx.fillStyle = `rgba(200,206,225,${0.75 * a})`;
  ctx.fillText(`${Math.floor(yr)} · ${Math.round(Math.hypot(...s) * AU_PER_LY).toLocaleString('en-CA')} AU from the black hole`, X + 10, Y + 9);
  return a;
}

// the black hole itself: every pixel's light traced back through curved spacetime (WebGL)
const bhCv = document.getElementById('bh'), bhNote = document.getElementById('bhnote');
let bhGL = null, bhProg = null, bhU = {}, bhFailed = false;
function bhInit() {
  const gl = bhCv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) { bhFailed = true; return; }
  const vs = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';
  const fs = document.getElementById('bh-fs').textContent;
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs); if (!v || !f) { bhFailed = true; return; }
  const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { bhFailed = true; return; }
  gl.useProgram(pr); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  for (const n of ['uRes', 'uC', 'uPx', 'uR', 'uU', 'uF', 'uT', 'uA', 'uSpot']) bhU[n] = gl.getUniformLocation(pr, n);
  bhGL = gl; bhProg = pr;
}
function drawBH() {
  const [gx, gy] = proj(GC.x, GC.y, GC.z), pxRs = view.s * RS_LY, shadowPx = 2.6 * pxRs;
  const on = !bhFailed && shadowPx > 1.5 && gx > -40 * pxRs && gx < Wd + 40 * pxRs && gy > -40 * pxRs && gy < Ht + 40 * pxRs;
  if (!on) { if (bhCv.style.display !== 'none') { bhCv.style.display = 'none'; bhNote.style.display = 'none'; } return false; }
  if (!bhGL) { bhInit(); if (!bhGL) return false; }
  const q = Math.min(1, 1100 / Math.max(Wd, Ht)) * Math.min(dpr, 1.5), w = Math.round(Wd * q), h = Math.round(Ht * q);
  if (bhCv.width !== w || bhCv.height !== h) { bhCv.width = w; bhCv.height = h; }
  bhCv.style.display = 'block';
  const gl = bhGL; gl.viewport(0, 0, w, h);
  // the map's screen axes, turned into the frame of the accretion disc (normal = +z)
  const R = worldDirToGal([CY, -SY, 0]), U = worldDirToGal([-SY * CT, -CY * CT, ST]).map(v => v), F = cross3(R, U);
  const toDisc = v => [dot3(v, DISC.e1), dot3(v, DISC.e2), dot3(v, DISC.n)];
  const t = (performance.now() - T0) / 1000 * BH_TIME / RS_SEC;   // time in units of Rs/c
  const cyc = ((performance.now() - T0) / 1000 * BH_TIME / 3600) % 3, spot = 0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(cyc, 1))), 2);   // a flare for about an hour, every three hours
  gl.uniform2f(bhU.uRes, w, h); gl.uniform2f(bhU.uC, gx * q, (Ht - gy) * q); gl.uniform1f(bhU.uPx, pxRs * q);
  gl.uniform3fv(bhU.uR, toDisc(R)); gl.uniform3fv(bhU.uU, toDisc(U)); gl.uniform3fv(bhU.uF, toDisc(F));
  gl.uniform1f(bhU.uT, t); gl.uniform1f(bhU.uA, Math.min(1, (shadowPx - 1.5) / 6)); gl.uniform1f(bhU.uSpot, spot);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  bhNote.style.display = shadowPx > 12 ? 'block' : 'none';
  return true;
}
// zooming in on Sgr A*: ease it to the middle of the screen on the way down, so you can follow it all the way to the event horizon
function gcSteer(X, Y, f) {
  if (f <= 1 || viewSpan() > 80) return false;
  setupView();
  const [sx, sy] = proj(GC.x, GC.y, GC.z), M = Math.min(Wd, Ht);
  if (sx < 0 || sx > Wd || sy < 0 || sy > Ht || (Math.hypot(sx - X, sy - Y) > 150 && selected !== GC)) return false;
  const sNew = Math.min(M / 4e-6, view.s * f), spanNew = M / sNew, k = Math.max(0, Math.min(1, Math.log(spanNew / 4e-6) / Math.log(80 / 4e-6)));
  let ox = sx - Wd / 2, oy = sy - Ht / 2; const m = Math.hypot(ox, oy), cap = 0.5 * M * Math.pow(k, 1.5);
  if (m > cap) { ox *= cap / m; oy *= cap / m; }
  const u = ox / sNew, v = oy / sNew;
  view.s = sNew; view.x = GC.x - (CY * u + SY * CT * v); view.y = GC.y - (-SY * u + CY * CT * v); view.z = GC.z + ST * v;
  anim = null; draw(); return true;
}

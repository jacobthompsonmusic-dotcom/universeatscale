P='milky-way/index.html'; s=open(P,encoding='utf-8').read()
glsl=open('tools/galaxy3d/galaxy.glsl',encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:80]); s=s.replace(old,new)
# 1. perspective camera state
rep("const setupView = () => { CY = Math.cos(view.yaw); SY = Math.sin(view.yaw); CT = Math.cos(view.tilt); ST = Math.sin(view.tilt); };",
"""// Close in, the map is drawn through a real camera with a 40° lens (the same as the Solar System view), so you see the Milky Way
// from inside it; the lens narrows to a flat, straight-down projection as you pull back past ~25,000 ly, and near Sgr A*.
// PT: tangent of half the vertical field of view (0 = flat projection); PD: the camera's distance from the view centre, in ly.
let PT = 0, PD = Infinity;
const TAN20 = Math.tan(20 * Math.PI / 180), sstep = (x, a, b) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const setupView = () => {
  CY = Math.cos(view.yaw); SY = Math.sin(view.yaw); CT = Math.cos(view.tilt); ST = Math.sin(view.tilt);
  const span = Math.min(Wd, Ht) / view.s, dGC = Math.hypot(view.x - GCO.x, view.y - GCO.y, view.z - GCO.z);
  PT = TAN20 * (1 - sstep(Math.log(span), Math.log(25000), Math.log(400000))) * sstep(Math.log(Math.max(dGC, 1e-9)), Math.log(20), Math.log(200));
  PD = PT > 1e-4 ? (Ht / 2 / view.s) / PT : Infinity;
};""")
rep("""function proj(x, y, z) {
  const dx = x - view.x, dy = y - view.y, dz = z - view.z;
  const ry = dx * SY + dy * CY;
  return [Wd / 2 + (dx * CY - dy * SY) * view.s, Ht / 2 + (ry * CT - dz * ST) * view.s, ry * ST + dz * CT];
}""","""// screen position [X, Y, depth toward the viewer, local magnification]; points behind the camera come back as NaN
function proj(x, y, z) {
  const dx = x - view.x, dy = y - view.y, dz = z - view.z;
  const ry = dx * SY + dy * CY, sx = dx * CY - dy * SY, sy = ry * CT - dz * ST, sz = ry * ST + dz * CT;
  if (PD === Infinity) return [Wd / 2 + sx * view.s, Ht / 2 + sy * view.s, sz, 1];
  const den = PD - sz; if (den < PD * 0.01) return [NaN, NaN, sz, 0];
  const f = PD / den; return [Wd / 2 + sx * view.s * f, Ht / 2 + sy * view.s * f, sz, f];
}
// the flat projection, for directions to things that may be behind the camera
function projFlat(x, y, z) {
  const dx = x - view.x, dy = y - view.y, dz = z - view.z, ry = dx * SY + dy * CY;
  return [Wd / 2 + (dx * CY - dy * SY) * view.s, Ht / 2 + (ry * CT - dz * ST) * view.s];
}""")
# 2. star field
rep("""    const dx = fx[i] - view.x, dy = fy[i] - view.y, ry = dx * SY + dy * CY;
    const X = Wd / 2 + (dx * CY - dy * SY) * s, Y = Ht / 2 + (ry * CT - (fz[i] - view.z) * ST) * s;
    if (X < -10 || X > Wd + 10 || Y < -10 || Y > Ht + 10) continue;""",
"""    const dx = fx[i] - view.x, dy = fy[i] - view.y, ry = dx * SY + dy * CY, dz = fz[i] - view.z;
    let f = 1; if (PD !== Infinity) { const den = PD - (ry * ST + dz * CT); if (den < PD * 0.01) continue; f = PD / den; }
    const X = Wd / 2 + (dx * CY - dy * SY) * s * f, Y = Ht / 2 + (ry * CT - dz * ST) * s * f;
    if (X < -10 || X > Wd + 10 || Y < -10 || Y > Ht + 10) continue;""")
rep("""      const Yf = Ht / 2 + (ry * CT - zf * ST) * s;
      if (Math.abs(Yf - Y) > 2 && Math.abs(Yf - Y) < maxLen) {
        ctx.globalAlpha = sAlpha; ctx.strokeStyle = fcol[i]; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, Yf); ctx.stroke();
        ctx.fillStyle = fcol[i]; ctx.fillRect(X - 1, Yf - 0.5, 2, 1);""",
"""      let ff = 1; if (PD !== Infinity) ff = PD / Math.max(PD * 0.01, PD - (ry * ST + zf * CT));
      const Xf = Wd / 2 + (dx * CY - dy * SY) * s * ff, Yf = Ht / 2 + (ry * CT - zf * ST) * s * ff;
      if (Math.abs(Yf - Y) > 2 && Math.abs(Yf - Y) < maxLen) {
        ctx.globalAlpha = sAlpha; ctx.strokeStyle = fcol[i]; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(Xf, Yf); ctx.stroke();
        ctx.fillStyle = fcol[i]; ctx.fillRect(Xf - 1, Yf - 0.5, 2, 1);""")
# 3. sizes scale with the local magnification
rep("const [X, Y] = proj(o.x, o.y, o.z), D = o.diam * view.s;","const [X, Y, , pf] = proj(o.x, o.y, o.z), D = o.diam * view.s * pf;")
rep("const [X, Y] = proj(rg.x, rg.y, rg.z), Rr = rg.r * view.s;","const [X, Y, , pf] = proj(rg.x, rg.y, rg.z), Rr = rg.r * view.s * pf;")
rep("const [X, Y] = proj(BUBBLE.x, BUBBLE.y, BUBBLE.z), R = BUBBLE.r * view.s;","const [X, Y, , pf] = proj(BUBBLE.x, BUBBLE.y, BUBBLE.z), R = BUBBLE.r * view.s * pf;")
rep("const [X, Y] = proj(SUNW.x, SUNW.y, SUNW.z), R = OORT * view.s;","const [X, Y, , pf] = proj(SUNW.x, SUNW.y, SUNW.z), R = OORT * view.s * pf;")
# 4. grid rings as true circles in the plane (polylines) when the camera has perspective
rep("    ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.ellipse(sx, sy, R, Math.max(R * aC, 0.01), 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);",
"""    ctx.setLineDash([3, 5]); ctx.beginPath();
    if (PD === Infinity) ctx.ellipse(sx, sy, R, Math.max(R * aC, 0.01), 0, 0, 7);
    else { let pen = false; for (let k = 0; k <= 96; k++) { const a = k / 96 * 2 * Math.PI, [X, Y] = proj(SUNW.x + r * Math.cos(a), SUNW.y + r * Math.sin(a), SUNW.z); if (isFinite(X)) { pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); pen = true; } else pen = false; } }
    ctx.stroke(); ctx.setLineDash([]);""")
rep("      ctx.fillText(fmtLy(r), sx + R * 0.7071 + 4, sy + R * CT * 0.7071 - 4);",
    "      const [lx, ly] = proj(SUNW.x + r * 0.7071, SUNW.y - r * 0.7071, SUNW.z); if (isFinite(lx)) ctx.fillText(fmtLy(r), lx + 4, ly - 4);")
# 5. the galaxy itself: the 3D volume when WebGL is available, else the old flat picture
rep("  drawHaze();\n  drawDisc();\n","  if (!drawGalaxy3D()) { drawHaze(); drawDisc(); }\n")
rep("function drawHaze() {","""const GX = { cv: document.createElement('canvas'), gl: null, u: {}, failed: false, q: 1, last: 0 };
function gxInit() {
  const gl = GX.cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) { GX.failed = true; return; }
  const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(o)); return null; } return o; };
  const v = sh(gl.VERTEX_SHADER, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }'), f = sh(gl.FRAGMENT_SHADER, 'precision highp float;\\n' + document.getElementById('galaxy-fs').textContent);
  if (!v || !f) { GX.failed = true; return; }
  const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { GX.failed = true; return; }
  gl.useProgram(pr); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  for (const n of ['uGal', 'uCam', 'uRight', 'uUp', 'uFwd', 'uRes', 'uTanH', 'uOrtho', 'uHalfH', 'uExpo', 'uAlpha']) GX.u[n] = gl.getUniformLocation(pr, n);
  // the face-on picture of the disc, on black (so its colours are premultiplied), 2048² so it can be mipmapped
  const c = document.createElement('canvas'); c.width = c.height = 2048; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 2048, 2048); g.drawImage(gal, 0, 0, 2048, 2048);
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, c); gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const ext = gl.getExtension('EXT_texture_filter_anisotropic'); if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  gl.uniform1i(GX.u.uGal, 0); GX.gl = gl;
}
// the Milky Way as a volume, seen from wherever the camera is: the band of light from inside, the disc from outside
function drawGalaxy3D() {
  if (GX.failed || viewSpan() > 4e6) return false;
  if (!GX.gl) { gxInit(); if (!GX.gl) return false; }
  const now = performance.now(), ft = now - GX.last; GX.last = now;   // too slow? draw it a little coarser
  if (ft > 50 && ft < 400) GX.q = Math.max(0.35, GX.q * 0.9); else if (ft < 24) GX.q = Math.min(1, GX.q * 1.03);
  const q = Math.min(1, 1100 / Math.max(Wd, Ht)) * Math.min(dpr, 1.25) * GX.q, w = Math.max(2, Math.round(Wd * q)), h = Math.max(2, Math.round(Ht * q));
  if (GX.cv.width !== w || GX.cv.height !== h) { GX.cv.width = w; GX.cv.height = h; }
  const gl = GX.gl, U = GX.u, F = [SY * ST, CY * ST, CT];
  gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform3f(U.uRight, CY, -SY, 0); gl.uniform3f(U.uUp, -SY * CT, -CY * CT, ST); gl.uniform3f(U.uFwd, -F[0], -F[1], -F[2]);
  gl.uniform2f(U.uRes, w, h); gl.uniform1f(U.uExpo, 1.35); gl.uniform1f(U.uAlpha, 1);
  if (PD === Infinity) { gl.uniform1f(U.uOrtho, 1); gl.uniform3f(U.uCam, view.x, view.y, view.z); gl.uniform1f(U.uHalfH, Ht / 2 / view.s); gl.uniform1f(U.uTanH, 0); }
  else { gl.uniform1f(U.uOrtho, 0); gl.uniform3f(U.uCam, view.x + F[0] * PD, view.y + F[1] * PD, view.z + F[2] * PD); gl.uniform1f(U.uTanH, PT); gl.uniform1f(U.uHalfH, 1); }
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(GX.cv, 0, 0, Wd, Ht); ctx.restore();
  return true;
}
function drawHaze() {""")
rep('<script type="x-shader/x-fragment" id="bh-fs">','<script type="x-shader/x-fragment" id="galaxy-fs">'+glsl+'</script>\n<script type="x-shader/x-fragment" id="bh-fs">')
# 6. pointer direction must not use points behind the camera
rep("  const [X, Y] = proj(GC.x, GC.y, GC.z);\n  if (X > Wd * 0.03","  let [X, Y] = proj(GC.x, GC.y, GC.z); if (!isFinite(X)) [X, Y] = projFlat(GC.x, GC.y, GC.z);\n  if (X > Wd * 0.03")
open(P,'w',encoding='utf-8').write(s)
print('ok')

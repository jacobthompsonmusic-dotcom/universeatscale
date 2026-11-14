def patch(P, pairs):
    s=open(P,encoding='utf-8').read()
    for old,new in pairs:
        assert s.count(old)==1,(P,s.count(old),old[:70]); s=s.replace(old,new)
    open(P,'w',encoding='utf-8').write(s)
# Shared rule (both maps): the glow of the disc we're inside. Strength 0.09, colour 150,160,220 → 175,170,215, brighter toward the
# galactic centre (linear across the screen, over the screen's half-diagonal), fading out between view spans of 3,000 and 60,000 ly.
patch('solar-system/index.html',[
("const milky = new THREE.Group(); backdrop.add(milky);",
 """const milky = new THREE.Group(); backdrop.add(milky);
// the glow of the galactic disc we sit inside: as the band slides out of view on the way out, this faint haze takes over, brighter
// toward the galactic centre, and the galaxy map draws exactly the same haze, so the two meet without a gap
const haze = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: { uA: { value: 0 }, uDir: { value: new THREE.Vector2(1, 0) }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `uniform float uA; uniform vec2 uDir; uniform vec2 uRes;
    void main() { vec2 p = gl_FragCoord.xy - uRes * 0.5; float t = clamp(dot(p, uDir) / (0.5 * length(uRes)) * 0.5 + 0.5, 0.0, 1.0);
      gl_FragColor = vec4(mix(vec3(150.0, 160.0, 220.0), vec3(175.0, 170.0, 215.0), t) / 255.0, uA * mix(0.55, 1.45, t)); }`,
  transparent: true, depthTest: false, depthWrite: false }));
haze.frustumCulled = false; haze.renderOrder = -3; skyScene.add(haze);"""),
("  starMat.uniforms.uMix.value = deep.p; milky.userData.glow.material.opacity = 0.38 * (1 - deep.p); milky.userData.pts.material.opacity = 0.9 * (1 - deep.p);",
 """  starMat.uniforms.uMix.value = deep.p; milky.userData.glow.material.opacity = 0.38 * (1 - deep.p); milky.userData.pts.material.opacity = 0.9 * (1 - deep.p);
  { const a = opts.milky ? 0.09 * Math.max(deep.p, 0.6 * deep.t) : 0; haze.visible = a > 0.002;
    if (haze.visible) {   // brighter toward the galactic centre: its direction on screen (device pixels, y up)
      skyCam.updateMatrixWorld(); const g = GC_DIR.clone().multiplyScalar(GC_LY).applyQuaternion(skyRoot.quaternion).project(skyCam);
      let dx = g.x * innerWidth, dy = g.y * innerHeight; if (g.z > 1) { dx = -dx; dy = -dy; } const L = Math.hypot(dx, dy) || 1;
      haze.material.uniforms.uDir.value.set(dx / L, dy / L); renderer.getDrawingBufferSize(haze.material.uniforms.uRes.value);
      haze.material.uniforms.uA.value = a; } }"""),
])
patch('milky-way/index.html',[
("  drawDisc();\n  if (opts.grid) drawGrid();",
 "  drawHaze();\n  drawDisc();\n  if (opts.grid) drawGrid();"),
("function drawDisc() {",
 """// Zoomed in near the Sun you are inside the disc, so it shows only as a faint glow, brighter toward the galactic centre;
// it gives way to the full picture of the disc as you pull back (the Solar System view draws exactly the same glow)
function drawHaze() {
  const span = viewSpan(), k = 1 - Math.max(0, Math.min(1, Math.log(span / 3000) / Math.log(20)));
  if (k <= 0) return;
  const k2 = k * k * (3 - 2 * k), [gx, gy] = proj(GC.x, GC.y, GC.z), cx = Wd / 2, cy = Ht / 2;
  let dx = gx - cx, dy = gy - cy; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
  const R = Math.hypot(Wd, Ht) / 2, a = 0.09 * k2, gr = ctx.createLinearGradient(cx - dx * R, cy - dy * R, cx + dx * R, cy + dy * R);
  gr.addColorStop(0, `rgba(150,160,220,${(a * 0.55).toFixed(4)})`); gr.addColorStop(1, `rgba(175,170,215,${(a * 1.45).toFixed(4)})`);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, Wd, Ht);
}
function drawDisc() {"""),
])
print('ok')

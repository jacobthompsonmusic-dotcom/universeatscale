
// ===================================================================
//  beyond the planets: the Kuiper belt, the heliopause, the Oort cloud — and rings to judge distance by
// ===================================================================
const FAR = new THREE.Group(); space.add(FAR);
function farCloud(n, seed, sample, color, size) {
  const pos = new Float32Array(n * 3), r = mulberry32(seed);
  for (let i = 0; i < n; i++) { const [x, y, z] = sample(r); pos.set([x * AUS, z * AUS, -y * AUS], i * 3); }   // ecliptic x, y, z in AU → scene axes
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size, sizeAttenuation: false, color, transparent: true, opacity: 0, depthWrite: false }));
  p.frustumCulled = false; FAR.add(p); return p;
}
const gaussR = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
// Kuiper belt: the classical belt between the 3:2 (39.4 AU) and 2:1 (47.7 AU) resonances with Neptune, plus a thinner scattered fringe
const KUIPER = farCloud(7000, 71, r => {
  const a = r() < 0.8 ? 39.4 + r() * 8.3 : 34 + r() * 30, inc = Math.abs(gaussR(r)) * (r() < 0.5 ? 2.6 : 15) * DEG, u = r() * TAU, O = r() * TAU;
  return [a * (Math.cos(u) * Math.cos(O) - Math.sin(u) * Math.sin(O) * Math.cos(inc)), a * (Math.cos(u) * Math.sin(O) + Math.sin(u) * Math.cos(O) * Math.cos(inc)), a * Math.sin(u) * Math.sin(inc)];
}, 0x9fb4d0, 1.2);
// Oort cloud (predicted, never seen directly): a flattened inner cloud from ~2,000 AU merging into a round outer shell that
// thins out toward ~100,000 AU; density falling roughly as r^-3.5 (Duncan, Quinn & Tremaine 1987)
const OORT = farCloud(34000, 72, r => {
  const a0 = Math.pow(2000, -0.5), a1 = Math.pow(100000, -0.5), d = Math.pow(a0 + r() * (a1 - a0), -2);
  const flat = THREE.MathUtils.clamp((Math.log(d) - Math.log(3000)) / (Math.log(20000) - Math.log(3000)), 0, 1);
  const sinb = flat >= 1 ? r() * 2 - 1 : THREE.MathUtils.clamp((1 - flat) * Math.sin(gaussR(r) * 22 * DEG) + flat * (r() * 2 - 1), -1, 1), cb = Math.sqrt(1 - sinb * sinb), l = r() * TAU;
  return [d * cb * Math.cos(l), d * cb * Math.sin(l), d * sinb];
}, 0xa9c4e6, 1.25);
// landmarks: [name, radius in AU, draw a ring in the plane of Earth's orbit?, angle of the label around the ring]
const MARKS = [
  ['Kuiper belt', 44, false, 200], ['Heliopause · 120 AU', 120, true, 320], ['1,000 AU', 1000, true, 300],
  ['10,000 AU', 10000, true, 320], ['Oort cloud (predicted)', 28000, false, 215], ['1 light-year', LYKM / AU, true, 305],
].map(([name, au, ring, ang]) => {
  const m = { name, r: au * AUS, pos: new THREE.Vector3(Math.cos(ang * DEG), 0, -Math.sin(ang * DEG)).multiplyScalar(au * AUS) };
  if (ring) {
    const pts = []; for (let i = 0; i <= 360; i++) pts.push(new THREE.Vector3(Math.cos(i * DEG) * m.r, 0, Math.sin(i * DEG) * m.r));
    m.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xcfd8ee, transparent: true, opacity: 0.2, dashSize: m.r * 0.012, gapSize: m.r * 0.016, depthWrite: false }));
    m.line.computeLineDistances(); m.line.frustumCulled = false; FAR.add(m.line);
  }
  return m;
});

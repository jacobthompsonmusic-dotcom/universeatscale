// The real sky: every naked-eye star, plus the faint ones within 50 light-years, at its measured place in space
// (AT-HYG v3.2: Gaia DR3 and Hipparcos parallaxes; heliocentric galactic coordinates in light-years, 16 bytes a star).
// Near the planets they are simply the sky. But they really are out there, so the view of them shifts once you leave.
const STARS_B64 = '@@STARS@@';
const skyRoot = new THREE.Group(); skyScene.add(skyRoot);      // turns with the scene
const backdrop = new THREE.Group(); skyRoot.add(backdrop);     // the far Milky Way glow: rides along with the camera
const STARPOS = [];
const starMat = new THREE.ShaderMaterial({
  uniforms: { uMix: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
  vertexShader: `attribute float aM; attribute float aOn; attribute vec3 aCol; uniform float uMix; uniform float uPR; varying vec3 vCol; varying float vA;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      float pc = max(distance(wp.xyz, cameraPosition), 0.001) / 3.26156;
      float m = aM + 5.0 * log(pc / 10.0) / 2.302585;                    // apparent magnitude from wherever the camera is
      float sSky = clamp(5.0 - 0.7 * m, 1.2, 7.5), aSky = clamp(1.2 - 0.14 * m, 0.0, 1.0) * smoothstep(7.6, 6.4, m);
      float fr = clamp(0.75 + (6.0 - aM) * 0.17, 0.55, 2.6);            // the galaxy map's star dots, sized by true brightness
      float sMap = 2.0 * fr + 0.8, aMap = clamp(0.45 + (5.0 - aM) * 0.07, 0.28, 1.0) * aOn;
      gl_PointSize = mix(sSky, sMap, uMix) * uPR; vA = mix(aSky, aMap, uMix); vCol = aCol;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: `varying vec3 vCol; varying float vA; void main() { float r = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(vCol, vA * smoothstep(1.0, 0.45, r)); }`,
  transparent: true, depthTest: false, depthWrite: false });
{
  const bin = atob(STARS_B64), n = bin.length / 16, bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const dv = new DataView(bytes.buffer), pos = new Float32Array(n * 3), col = new Float32Array(n * 3), mag = new Float32Array(n), on = new Float32Array(n), v = new THREE.Vector3();
  const BV = [[-0.4, 155, 176, 255], [0, 202, 215, 255], [0.4, 248, 247, 255], [0.65, 255, 244, 232], [0.9, 255, 222, 180], [1.2, 255, 204, 142], [1.6, 255, 172, 110], [2.2, 255, 140, 90]];
  const bv = c => { if (c <= BV[0][0]) return BV[0].slice(1); for (let i = 1; i < BV.length; i++) if (c <= BV[i][0]) { const a = BV[i - 1], b = BV[i], t = (c - a[0]) / (b[0] - a[0]); return [1, 2, 3].map(k => a[k] + (b[k] - a[k]) * t); } return BV[BV.length - 1].slice(1); };
  for (let i = 0; i < n; i++) {
    const o = i * 16; galToScene(dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true), v);
    pos.set([v.x, v.y, v.z], i * 3); STARPOS.push(v.clone()); mag[i] = dv.getInt16(o + 12, true) / 100;
    const c = bv(dv.getInt8(o + 14) / 50); col.set([c[0] / 255, c[1] / 255, c[2] / 255], i * 3); on[i] = dv.getUint8(o + 15);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aM', new THREE.BufferAttribute(mag, 1)); g.setAttribute('aOn', new THREE.BufferAttribute(on, 1));
  const pts = new THREE.Points(g, starMat); pts.frustumCulled = false; skyRoot.add(pts);
}
const milky = new THREE.Group(); backdrop.add(milky);
// the 12 zodiac constellations: stick figures (after d3-celestial) joined between those same stars, each at its real distance
const ZODIAC = @@ZODIAC@@;
const zodiac = new THREE.Group(); zodiac.visible = false; skyRoot.add(zodiac);
{
  const seg = [];
  for (const c of ZODIAC) for (const l of c.p) for (let i = 1; i < l.length; i++) seg.push(...STARPOS[l[i - 1]].toArray(), ...STARPOS[l[i]].toArray());
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
  const zl = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x9fbcff, transparent: true, opacity: 0.34, depthTest: false, depthWrite: false })); zl.frustumCulled = false; zodiac.add(zl);
  for (const c of ZODIAC) { // name labels, floating at the typical distance of the figure's stars
    const cv = document.createElement('canvas'), x = cv.getContext('2d'); cv.width = 512; cv.height = 96;
    x.font = '500 46px Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(170,195,255,0.62)';
    x.fillText(c.n.toUpperCase().split('').join(String.fromCharCode(8202)), 256, 48);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false, depthWrite: false }));
    galToScene(c.l[0] * c.d, c.l[1] * c.d, c.l[2] * c.d, sp.position); sp.scale.set(c.d * 0.13, c.d * 0.13 * 96 / 512, 1); zodiac.add(sp);
  }
}

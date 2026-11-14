let lastFG = undefined, paused = false, lastPost = '';
const camNom = new THREE.Vector3(), _v1 = new THREE.Vector3();
function frame(t) {
  if (paused) return;
  const dt = lastT ? Math.min(t - lastT, 100) : 0; lastT = t;
  logCur += (logTarget - logCur) * Math.min(1, dt / 220);
  if (playing) simMs += dt * Math.pow(10, logCur);
  if (simMs > TMAX || simMs < TMIN) { simMs = Math.min(TMAX, Math.max(TMIN, simMs)); playing = false; playBtn.textContent = '▶'; }
  // far from the Sun: stay centred on it, and turn the scene from the frame of Earth's orbit to the galaxy's
  { const r0 = camera.position.distanceTo(controls.target) / AUS;
    if (r0 > 1500 && !fly) { if (focus !== SUN) setFocus(SUN); if (controls.target.lengthSq() > 0) { _v1.copy(controls.target).multiplyScalar(0.2); controls.target.sub(_v1); camera.position.sub(_v1); } }
    deep.t = sstep(Math.log(r0), Math.log(3000), Math.log(60000));
    scene.quaternion.copy(Q_ID).slerp(Q_GAL, deep.t); skyRoot.quaternion.copy(scene.quaternion); }
  updateWorld();
  if (fly) stepFly(t);
  controls.update();
  keepOutside();
  const camD = camera.position.distanceTo(controls.target), pxs = innerHeight / 2 / Math.tan(camera.fov * DEG / 2), p = new THREE.Vector3();
  // past the Oort cloud the lens narrows while the camera backs away, so the picture slides from a view of the sky into the galaxy map's straight-down projection
  const spanLy = 2 * camD * TAN20 * Math.min(1, camera.aspect) / LY, ls = Math.log(Math.max(spanLy, 1e-30));
  deep.p = sstep(ls, Math.log(0.35), Math.log(2.8)); deep.q = EMBED ? sstep(ls, Math.log(3.2), Math.log(5.8)) : 0;
  deep.fov = deep.p > 0 ? 2 * Math.atan(Math.exp(Math.log(TAN20) * (1 - deep.p) + Math.log(TAN_FLAT) * deep.p)) / DEG : 40;
  const fk = Math.tan(deep.fov * DEG / 2) / TAN20;

  // light: the Sun as a point light, or — when you're visiting a giant — a shadow-casting beam aimed at it
  const fg = giantOf(focus);
  ptL.position.copy(origin).negate();
  if (fg) {
    if (fg !== lastFG) { const b = fg.cf.shadowBox; Object.assign(dirL.shadow.camera, { left: -b, right: b, top: b, bottom: -b, near: 100, far: 5200 }); dirL.shadow.camera.updateProjectionMatrix(); }
    relOf(fg, p); dirL.target.position.copy(p); dirL.position.copy(p).addScaledVector(fg.sunDir, 3000); dirL.intensity = 2.1; ptL.intensity = 0;
  } else { dirL.intensity = 0; ptL.intensity = 2.1; }
  lastFG = fg;

  // the Sun's glare shrinks with distance
  relOf(SUN, p); const dAU = p.distanceTo(camera.position) / AUS;
  const sz = (Math.min(0.6, 2.4 / dAU) + 0.04) * fk; SUN.glare.scale.set(sz, sz, 1);
  SUN.glare.material.opacity = THREE.MathUtils.clamp((dAU - 0.01) / 0.05, 0, 1);

  for (const b of PLANETS) {
    relOf(b, p); const dist = p.distanceTo(camera.position), px = b.R / dist * pxs;
    const ratio = b.orbit.userData.a / camD, tiny = THREE.MathUtils.clamp((ratio - 0.0012) / 0.003, 0, 1);   // from far enough out the whole orbit is a speck
    b.dot.visible = opts.dots && px < 2.5 && tiny > 0;
    b.orbit.visible = opts.orbits && ratio < 900 && tiny > 0; b.orbit.material.opacity = b.orbit.userData.base * THREE.MathUtils.clamp((900 - ratio) / 450, 0, 1) * tiny;
    if (b.moons.length) {
      for (const o of b.moons) {
        const orbitPx = o.a * U / dist * pxs, r2 = o.a * U / Math.max(camD, 1e-6);
        o.line.visible = opts.orbits && orbitPx > 3 && r2 < 12;
        o.line.material.opacity = o.baseOpacity * THREE.MathUtils.clamp((12 - r2) / 6, 0, 1) * THREE.MathUtils.clamp((orbitPx - 3) / 20, 0, 1);
      }
    }
  }
  { const la = Math.log(camD / AUS);   // the icy outskirts fade in as you pull back
    KUIPER.material.opacity = 0.42 * sstep(la, Math.log(6), Math.log(30)) * (1 - sstep(la, Math.log(4000), Math.log(30000)));
    OORT.material.opacity = 0.5 * sstep(la, Math.log(300), Math.log(4000));
    KUIPER.visible = KUIPER.material.opacity > 0.004; OORT.visible = OORT.material.opacity > 0.004; }

  // the camera the picture is actually drawn with (the controls keep working with the plain 40° one)
  camNom.copy(camera.position);
  if (deep.p > 0) camera.position.sub(controls.target).multiplyScalar(1 / fk).add(controls.target);
  camera.fov = deep.fov; camera.far = camD > 1e7 ? 1e15 : 2e8; camera.updateProjectionMatrix(); camera.updateMatrixWorld();

  renderer.clear();
  // the stars are drawn from where the camera really is among them, in light-years from the Sun
  skyCam.quaternion.copy(camera.quaternion); skyCam.fov = camera.fov; skyCam.updateProjectionMatrix();
  relOf(SUN, p); skyCam.position.copy(camera.position).sub(p).divideScalar(LY);
  backdrop.position.copy(skyCam.position).applyQuaternion(_qi.copy(skyRoot.quaternion).invert());
  starMat.uniforms.uMix.value = deep.p; milky.userData.glow.material.opacity = 0.38 * (1 - deep.p); milky.userData.pts.material.opacity = 0.9 * (1 - deep.p);
  renderer.render(skyScene, skyCam);
  renderer.clearDepth();
  renderer.render(scene, camera);
  updateLabels(); updateMarks(camD);
  camera.position.copy(camNom); camera.fov = 40; camera.updateProjectionMatrix();
  if (t - (frame.lt || 0) > 250) {
    frame.lt = t;
    document.getElementById('date').textContent = new Date(simMs).toLocaleString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    document.getElementById('spd').textContent = speedLabel(Math.pow(10, logTarget));
    updateScale(camD);
    if (selected && !selected.in && document.getElementById('info').style.display === 'block' && (selected.isSun || selected.kind !== 'moon')) select(selected); // keep live distances fresh
  }
  if (EMBED) { // tell the page that joins the maps where we are: pixels per light-year, and the direction of view in the galaxy map's terms
    const msg = { src: 'uas-ss', s: innerHeight * LY / (2 * camD * TAN20), yaw: controls.getAzimuthalAngle() - MW_AZ, tilt: controls.getPolarAngle(), q: deep.q, span: spanLy };
    const key = msg.s.toPrecision(7) + '|' + msg.yaw.toFixed(5) + '|' + msg.tilt.toFixed(5);
    if (key !== lastPost) { lastPost = key; parent.postMessage(msg, '*'); }
  }
  requestAnimationFrame(frame);
}
function wake() { if (paused) { paused = false; lastT = 0; requestAnimationFrame(frame); } }
// pull straight back from wherever you are until the view is `spanLy` light-years across
function goFar(spanLy) {
  if (focus !== SUN) setFocus(SUN);
  preset(camera.position.clone().sub(controls.target), Math.min(MAXD, spanLy * LY / (2 * TAN20) / Math.min(1, camera.aspect))); fly.dur = 2600; select(null);
}
// arrive from the galaxy map: same scale, same direction of view
function enterFrom(s, yaw, tilt) {
  fly = null; if (focus !== SUN) setFocus(SUN);
  const r = Math.min(MAXD, innerHeight / s * LY / (2 * TAN20)), ph = THREE.MathUtils.clamp(tilt, 0.002, Math.PI - 0.002), th = yaw + MW_AZ;
  controls.target.set(0, 0, 0); camera.position.set(r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), r * Math.sin(ph) * Math.cos(th)); controls.update(); lastPost = '';
}
if (EMBED) addEventListener('message', e => {
  const m = e.data; if (!m || m.to !== 'uas-ss') return;
  if (m.cmd === 'pause') paused = true;
  else if (m.cmd === 'resume') wake();
  else if (m.cmd === 'enter') { enterFrom(m.s, m.yaw, m.tilt); wake(); }
  else if (m.cmd === 'fly') { wake(); if (m.key === 'all') document.getElementById('p-all').onclick(); else if (m.key === 'far') goFar(m.span); else if (byKey(m.key)) flyTo(byKey(m.key)); }
  else if (m.cmd === 'opt') { if (opts[m.k] !== m.on) document.querySelector(`.tg[data-k="${m.k}"]`).click(); }
});

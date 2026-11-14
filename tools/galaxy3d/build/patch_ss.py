P='solar-system/index.html'; s=open(P,encoding='utf-8').read()
g=open('tools/galaxy3d/galaxy.glsl',encoding='utf-8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,(s.count(old),old[:80]); s=s.replace(old,new)
# 1. no more lens flattening: both views share a 40° lens where they meet
rep("  deep.p = sstep(ls, Math.log(0.35), Math.log(2.8)); deep.q","  deep.p = 0; deep.q")
# 2. the volume
rep("haze.frustumCulled = false; haze.renderOrder = -3; skyScene.add(haze);",
"""haze.frustumCulled = false; haze.renderOrder = -3; skyScene.add(haze);
// The Milky Way as a volume: the same 3D model and face-on picture the galaxy map uses (stars in a thin and a thick disc and a bulge,
// with a thinner layer of dust), seen from wherever the camera really is. From here it is the band across the sky, dust lane and all;
// the galaxy map carries on with the same picture as you pull out of the disc.
const GALAXY_FS = `"""+g+"""`;
const MWV = { ready: false };
{
  const tex = new THREE.TextureLoader().load('../milky-way/galaxy-disc.jpg', () => { MWV.ready = true; });
  tex.flipY = false; tex.anisotropy = 8;
  const V3 = () => ({ value: new THREE.Vector3() });
  MWV.mat = new THREE.ShaderMaterial({
    uniforms: { uGal: { value: tex }, uCam: V3(), uRight: V3(), uUp: V3(), uFwd: V3(), uRes: { value: new THREE.Vector2(1, 1) }, uTanH: { value: TAN20 },
      uOrtho: { value: 0 }, uHalfH: { value: 1 }, uExpo: { value: 1.35 }, uAlpha: { value: 1 } },
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: GALAXY_FS,
    transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false });
  MWV.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), MWV.mat); MWV.mesh.frustumCulled = false; MWV.mesh.renderOrder = -4; MWV.mesh.visible = false; skyScene.add(MWV.mesh);
}
// heliocentric galactic light-years → the galaxy map's frame (Sgr A* at the origin, true midplane at z = 0)
const R0_LY = 8275 * 3.26156, cTHm = Math.cos(MW_TH), sTHm = Math.sin(MW_TH), _g3 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _q3 = new THREE.Quaternion();
const sceneToGal = (v, out) => out.set(v.dot(GXs), v.dot(GYs), v.dot(GZs));
const galToMap = (gv, out, point) => { const x0 = gv.x - (point ? R0_LY : 0), xg = x0 * cTHm + gv.z * sTHm, zg = -x0 * sTHm + gv.z * cTHm; return out.set(-gv.y, -xg, zg); };
function updateMWV() {
  MWV.mesh.visible = MWV.ready && opts.milky; milky.visible = opts.milky && !MWV.ready;
  if (!MWV.mesh.visible) return;
  const u = MWV.mat.uniforms; _q3.copy(skyRoot.quaternion).invert();
  galToMap(sceneToGal(_v3.copy(skyCam.position).applyQuaternion(_q3), _g3), u.uCam.value, true);
  galToMap(sceneToGal(_v3.set(1, 0, 0).applyQuaternion(skyCam.quaternion).applyQuaternion(_q3), _g3), u.uRight.value, false);
  galToMap(sceneToGal(_v3.set(0, 1, 0).applyQuaternion(skyCam.quaternion).applyQuaternion(_q3), _g3), u.uUp.value, false);
  galToMap(sceneToGal(_v3.set(0, 0, -1).applyQuaternion(skyCam.quaternion).applyQuaternion(_q3), _g3), u.uFwd.value, false);
  renderer.getDrawingBufferSize(u.uRes.value); u.uTanH.value = Math.tan(skyCam.fov * DEG / 2);
}""")
# 3. star style: blend toward the map's dots as the hand-over nears; band and old haze give way to the volume
rep("  starMat.uniforms.uMix.value = deep.p; milky.userData.glow.material.opacity","  starMat.uniforms.uMix.value = sstep(ls, Math.log(1.2), Math.log(5)); milky.userData.glow.material.opacity")
rep("  { const a = opts.milky ? 0.09 * Math.max(deep.p, 0.6 * deep.t) : 0; haze.visible = a > 0.002;",
    "  updateMWV();\n  { const a = opts.milky && !MWV.ready ? 0.09 * Math.max(deep.p, 0.6 * deep.t) : 0; haze.visible = a > 0.002;")
open(P,'w',encoding='utf-8').write(s)
print('ok')

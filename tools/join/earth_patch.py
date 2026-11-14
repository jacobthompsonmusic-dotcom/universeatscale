import re
exec(open('/tmp/build/earth_small.py').read())
P='solar-system/index.html'; s=open(P,encoding='utf-8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,(s.count(old),old[:70]); s=s.replace(old,new)
# 1. textures
i0=s.index("const EARTH_DAY = 'data:"); i1=s.index("\n", s.index("const EARTH_NIGHT = 'data:"))
s=s[:i0]+"""// Earth: Solar System Scope's maps (CC BY 4.0), made from NASA's Blue Marble daytime imagery, Black Marble night lights, cloud cover and
// elevation data. Small copies are built in so Earth appears at once; the full 4K maps load straight after and swap in.
const EARTH_TEX = { day: '"""+E['day']+"""', night: '"""+E['night']+"""', rc: '"""+E['rc']+"""' };
const EARTH_FULL = { day: 'earth/day.jpg', night: 'earth/night.jpg', rc: 'earth/relief-clouds.jpg' };   // rc: red = elevation, green = land, blue = clouds"""+s[i1:]
# 2. material
i0=s.index("function earthMaterial(sunDir) {"); i1=s.index("const gmst = ms =>")
s=s[:i0]+r"""const earthU = { dayMap: { value: null }, nightMap: { value: null }, rcMap: { value: null }, texel: { value: new THREE.Vector2(1 / 1024, 1 / 512) }, relief: { value: 0.9 }, cloudShift: { value: 0 } };
{ const ld = new THREE.TextureLoader(); for (const k of ['day', 'night', 'rc']) { const t = ld.load(EARTH_TEX[k]); t.anisotropy = 8; earthU[k + 'Map'] ? earthU[k + 'Map'].value = t : earthU.rcMap.value = t; } }
function earthHiRes() {   // swap in the 4K maps once all three have arrived
  const ld = new THREE.TextureLoader(), got = {}; let n = 0;
  for (const k of ['day', 'night', 'rc']) ld.load(EARTH_FULL[k], t => {
    t.anisotropy = renderer.capabilities.getMaxAnisotropy(); got[k] = t;
    if (++n === 3) { for (const kk in got) { const u = kk === 'rc' ? earthU.rcMap : earthU[kk + 'Map']; u.value.dispose(); u.value = got[kk]; } earthU.texel.value.set(1 / 4096, 1 / 2048); earthU.relief.value = 2.6; }
  });
}
const EARTH_VS = `#include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying vec3 vAx;
  void main() { vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vAx = normalize(mat3(modelMatrix) * vec3(0.0, 1.0, 0.0));
    vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
  }`;
function earthMaterial(sunDir) {
  return new THREE.ShaderMaterial({
    uniforms: { ...earthU, sun: { value: sunDir } },
    vertexShader: EARTH_VS,
    fragmentShader: `#include <logdepthbuf_pars_fragment>
      uniform sampler2D dayMap; uniform sampler2D nightMap; uniform sampler2D rcMap; uniform vec3 sun; uniform vec2 texel; uniform float relief; uniform float cloudShift;
      varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying vec3 vAx;
      void main() {
        #include <logdepthbuf_fragment>
        vec3 N = normalize(vN); float d = dot(N, sun);
        vec3 day = texture2D(dayMap, vUv).rgb; vec4 rc = texture2D(rcMap, vUv);
        float land = smoothstep(0.25, 0.75, rc.g), ocean = 1.0 - land;
        // relief: the slope of the elevation map tilts the surface, so mountain ranges catch the light and throw shade (heights exaggerated)
        vec3 E = normalize(cross(normalize(vAx), N) + 1e-6), Nn = cross(N, E);
        float cl = max(cos((vUv.y - 0.5) * 3.14159265), 0.12);
        float hE = texture2D(rcMap, vUv + vec2(texel.x, 0.0)).r - texture2D(rcMap, vUv - vec2(texel.x, 0.0)).r;
        float hN = texture2D(rcMap, vUv + vec2(0.0, texel.y)).r - texture2D(rcMap, vUv - vec2(0.0, texel.y)).r;
        vec3 Nb = normalize(N - relief * land * (hE / cl * E + hN * Nn));
        float lit = smoothstep(-0.08, 0.3, d) * (0.32 + 0.78 * max(mix(d, dot(Nb, sun), land), 0.0));
        float cs = texture2D(rcMap, vec2(vUv.x + cloudShift, vUv.y)).b;            // the clouds above, for their shadows
        vec3 V = normalize(cameraPosition - vP), Hh = normalize(sun + V);
        float glint = pow(max(dot(N, Hh), 0.0), 70.0) * ocean * 0.8 * step(0.0, d) * (1.0 - cs);
        float dark = smoothstep(0.1, -0.16, d);
        vec3 lights = texture2D(nightMap, vUv).rgb * vec3(1.0, 0.86, 0.62) * dark * 1.7 * (1.0 - 0.55 * cs);
        vec3 dusk = vec3(0.35, 0.12, 0.02) * smoothstep(0.25, 0.0, abs(d)) * 0.22;
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0) * smoothstep(-0.15, 0.4, d);   // a thin blue haze at the limb, where we look through more air
        vec3 col = day * lit * (1.0 - 0.32 * cs * smoothstep(0.0, 0.3, d)) + glint * vec3(1.0, 0.95, 0.85) + lights + dusk * (1.0 - ocean * 0.5);
        gl_FragColor = vec4(mix(col, vec3(0.42, 0.62, 1.0) * lit, fres * 0.45), 1.0);
      }`,
  });
}
function cloudMaterial(sunDir) {
  return new THREE.ShaderMaterial({
    uniforms: { rcMap: earthU.rcMap, sun: { value: sunDir } },
    vertexShader: EARTH_VS,
    fragmentShader: `#include <logdepthbuf_pars_fragment>
      uniform sampler2D rcMap; uniform vec3 sun; varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying vec3 vAx;
      void main() {
        #include <logdepthbuf_fragment>
        float c = smoothstep(0.1, 0.85, texture2D(rcMap, vUv).b); vec3 N = normalize(vN); float d = dot(N, sun);
        float l = smoothstep(-0.12, 0.25, d) * (0.22 + 0.85 * max(d, 0.0));
        gl_FragColor = vec4(vec3(1.0, 0.99, 0.97) * l * c, c * 0.92);   // premultiplied: dark grey clouds by night still hide the city lights a little
      }`,
    transparent: true, depthWrite: false, premultipliedAlpha: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
}
"""+s[i1:]
# 3. clouds mesh
rep("new THREE.MeshLambertMaterial({ color: 0xffffff, alphaMap: cloudTexture(), transparent: true, depthWrite: false })","cloudMaterial(b.sunDir)")
# 4. cloud shift each frame
rep("b.clouds.rotation.y = b.mesh.rotation.y + simMs / 86400000 * 0.05; }",
    "b.clouds.rotation.y = b.mesh.rotation.y + simMs / 86400000 * 0.05; earthU.cloudShift.value = -((simMs / 86400000 * 0.05) / TAU % 1); }")
# 5. hi-res after start
rep("  requestAnimationFrame(frame);\n  if (/[?&]debug=1/","  requestAnimationFrame(frame);\n  setTimeout(earthHiRes, 400);\n  if (/[?&]debug=1/")
# 6. credit
rep("The stars behind are real, each at its measured distance.</div>","The stars behind are real, each at its measured distance. Earth imagery: <a href=\"https://www.solarsystemscope.com/textures/\" style=\"color:inherit\">Solar System Scope</a> (CC BY 4.0), from NASA data.</div>")
open(P,'w',encoding='utf-8').write(s)
print(len(s))

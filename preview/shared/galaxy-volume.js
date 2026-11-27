// The Milky Way volume shader, shared by the galaxy map (milky-way/) and the Solar System view (solar-system/), so the two
// views stay identical at the hand-over. Each page prepends its own "#define MAX_STEPS n" (and precision line if it needs one).
window.UAS_GALAXY_FS = `// The Milky Way as a volume, ray-marched per pixel. World frame of the galaxy map: Sgr A* at the origin, the disc's true midplane at z = 0,
// light-years. Face-on light comes from the map's picture of the disc; the vertical structure and dust follow measurements:
//   thin disc scale height 300 pc, thick disc 900 pc at ~6% of the local density, i.e. ~16% of the surface light (Bland-Hawthorn & Gerhard 2016)
//   the spiral arms' young stars and star-forming regions in a much thinner layer, ~100 pc (e.g. Bovy et al. 2016)
//   boxy/peanut bulge ~500 pc thick within ~1.5 kpc of the centre (Wegg & Gerhard 2013)
//   dust: scale height 134 pc, scale length 0.28 R0 (Drimmel & Spergel 2001); 1 magnitude of V-band extinction per kpc at the Sun,
//   reddening with the standard extinction curve (A_B : A_V : A_R ≈ 1.32 : 1 : 0.75)
uniform sampler2D uGal;
// The disc picture is read at an explicit detail level where the GPU allows it: a ray-marched pixel's neighbours stop at different
// depths, so the GPU's own level guess (from screen-space differences) jumps from one 2×2 block of pixels to the next and shows as a fine grid.
#ifdef UAS_LOD
#define GTEX(uv, l) texture2DLodEXT(uGal, uv, l)
#else
#define GTEX(uv, l) texture2D(uGal, uv, l)
#endif
uniform vec3 uCam, uRight, uUp, uFwd;
uniform vec2 uRes;
uniform float uTanH, uOrtho, uHalfH, uExpo, uAlpha, uGam;
const float GW = 62000.0, ZM = 9000.0, RSUN = 26989.0;
const float HY = 330.0, H1 = 978.0, H2 = 2935.0, HB = 1630.0, HD = 437.0, RD = 7557.0, K0 = 1.7e-4;
vec2 slab(vec3 ro, vec3 rd) {
  if (abs(rd.z) < 1e-7) return abs(ro.z) < ZM ? vec2(-1e12, 1e12) : vec2(1.0, -1.0);
  float a = (-ZM - ro.z) / rd.z, b = (ZM - ro.z) / rd.z; return vec2(min(a, b), max(a, b));
}
vec2 cyl(vec3 ro, vec3 rd) {
  float A = dot(rd.xy, rd.xy), B = dot(ro.xy, rd.xy), C = dot(ro.xy, ro.xy) - GW * GW;
  if (A < 1e-12) return C < 0.0 ? vec2(-1e12, 1e12) : vec2(1.0, -1.0);
  float D = B * B - A * C; if (D < 0.0) return vec2(1.0, -1.0);
  float s = sqrt(D); return vec2((-B - s) / A, (-B + s) / A);
}
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * uRes.y);
  vec3 ro, rd;
  // uCam is where the rays start: a plane just in front of the galaxy, worked out on the page in double precision. Far-off cameras
  // (millions of ly) would otherwise lose the precision of 32-bit floats and break the volume up into streaks.
  // uHalfH: half the view's height at that plane, in ly (0 = rays all start at uCam, as in the Solar System view)
  ro = uCam + (uRight * p.x + uUp * p.y) * uHalfH;
  rd = uOrtho > 0.5 ? uFwd : normalize(uFwd + (uRight * p.x + uUp * p.y) * uTanH);
  vec2 s1 = slab(ro, rd), s2 = cyl(ro, rd);
  float t0 = max(max(s1.x, s2.x), 0.0), t1 = min(s1.y, s2.y);
  if (t1 <= t0) { gl_FragColor = vec4(0.0); return; }
  vec3 I = vec3(0.0), T = vec3(1.0);
  float t = t0, jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));   // interleaved-gradient dither: even, fine-grained, no clumps   // per-pixel offset: turns banding into fine grain
  bool first = true;
  for (int i = 0; i < MAX_STEPS; i++) {
    if (t >= t1) break;
    vec3 q = ro + rd * t;
    float dt = clamp(0.14 * max(abs(q.z), 100.0) / max(abs(rd.z), 0.03), 6.0, 2000.0);
    if (uOrtho < 0.5) dt = min(dt, max(0.1 * t, 6.0));                      // fine steps close to the camera when we're inside
    dt = min(dt, max(0.15 * length(q), 30.0));                                 // and through the bright core, where coarse steps show as crawling grain
    if (first) { dt *= jit; first = false; }
    dt = min(dt, t1 - t);
    vec3 m = ro + rd * (t + 0.5 * dt);
    float R = length(m.xy), az = abs(m.z);
    float foot = max(dt * length(rd.xy), 0.0) / 60.5;                    // how many texels this step sweeps across: blur to match
    // the face-on light, split in two: the smooth glow of old stars (thick layers) and the arms' detail on top of it (a thin layer)
    vec2 uv = (m.xy + GW) / (2.0 * GW);
    vec3 smo = GTEX(uv, 7.0).rgb, full = GTEX(uv, clamp(log2(max(foot, 1.0)), 1.0, 6.0)).rgb, arm = max(full - smo, 0.0);
    float wb = exp(-R * R / (5000.0 * 5000.0));
    float vOld = mix(0.84 * exp(-az / H1) / (2.0 * H1) + 0.16 * exp(-az / H2) / (2.0 * H2), exp(-az / HB) / (2.0 * HB), wb);
    vec3 sig = smo * vOld + arm * mix(exp(-az / HY) / (2.0 * HY), vOld, wb);
    float vert = 1.0;
    float k = K0 * exp(-(R - RSUN) / RD) * exp(-az / HD) * smoothstep(1500.0, 4000.0, R) + K0 * 6.0 * exp(-R / 600.0) * exp(-az / 150.0);
    vec3 kap = k * vec3(0.75, 1.0, 1.32);
    vec3 tr = exp(-kap * dt);
    I += T * sig * vert * (kap.g > 1e-9 ? (1.0 - tr) / max(kap, 1e-9) : vec3(dt));   // exact for a uniform step
    T *= tr;
    t += dt;
    if (max(T.r, max(T.g, T.b)) < 0.003) break;
  }
  vec3 col = pow(clamp(1.0 - exp(-I * uExpo), 0.0, 1.0), vec3(uGam));   // a deep black point: faint light off the band falls to near-black, the band itself keeps most of its glow
  // phones' GPUs can slip a hair below zero or to NaN here (pow of a negative), which the view's blur then spreads into coloured specks
  if (!(col.r >= 0.0 && col.g >= 0.0 && col.b >= 0.0 && col.r <= 1.0 && col.g <= 1.0 && col.b <= 1.0)) col = vec3(0.0);
  gl_FragColor = vec4(col * uAlpha, max(col.r, max(col.g, col.b)) * uAlpha);
}
`;

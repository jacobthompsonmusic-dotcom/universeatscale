precision highp float;
uniform vec2 uRes, uC; uniform float uPx;        // screen centre of the hole (device px, y up) and pixels per Schwarzschild radius
uniform vec3 uR, uU, uF;                          // screen right, screen up and toward-the-viewer, in the disc's frame (disc normal = +z)
uniform float uT, uA, uSpot;                      // time (Rs/c), fade, flare strength
// units: Schwarzschild radius Rs = 1, c = 1. Photon paths follow the Schwarzschild null geodesic, written as x'' = -1.5 h² x / r⁵
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p) { return 0.55 * vnoise(p) + 0.3 * vnoise(p * 2.03 + 7.1) + 0.15 * vnoise(p * 4.1 + 3.3); }
// turbulent gas, sheared by differential rotation: two generations of pattern, each wound up for a while then faded out
float turb(vec3 p, float R, float om) {
  float s = 0.0;
  for (int k = 0; k < 2; k++) {
    float T = 90.0, age = mod(uT + float(k) * T * 0.5, T), w = sin(3.14159265 * age / T);
    float ph = atan(p.y, p.x) - om * age, lr = log(R);
    s += w * w * fbm(vec3(cos(ph) * 2.2 + lr * 3.0, sin(ph) * 2.2 - lr * 1.5, p.z * 1.2 / max(R, 1.0) + float(k) * 17.0));
  }
  return s;
}
void main() {
  vec2 b = (gl_FragCoord.xy - uC) / uPx;
  if (length(b) > 34.0) { gl_FragColor = vec4(0.0); return; }
  vec3 pos = uR * b.x + uU * b.y + uF * 42.0, vel = -uF;
  float h2 = dot(cross(pos, vel), cross(pos, vel)), I = 0.0; bool hole = false;
  vec3 sp = 4.0 * vec3(cos(0.0884 * uT), sin(0.0884 * uT), 0.0);   // the flare: a hot spot orbiting at 4 Rs, once every ~50 minutes
  for (int i = 0; i < 320; i++) {
    float r = length(pos);
    if (r < 1.0) { hole = true; break; }
    if (r > 46.0 && dot(pos, vel) > 0.0) break;
    float dt = clamp(0.05 * r, 0.02, 0.9);
    // emission: a hot, puffy, optically thin flow (not a thin bright disc), densest near the hole
    float R = length(pos.xy), H = 0.42 * R + 0.25;
    float j = pow(r, -2.3) * exp(-pos.z * pos.z / (2.0 * H * H)) * smoothstep(1.25, 2.6, r) * (1.0 - smoothstep(16.0, 30.0, r));
    float js = uSpot * 0.9 * exp(-dot(pos - sp, pos - sp) / 0.5);
    if (j + js > 1e-5) {
      float Rc = max(R, 1.5), v = min(sqrt(0.5 / Rc), 0.62), om = v / Rc;
      vec3 beta = v * normalize(vec3(-pos.y, pos.x, 0.0) + 1e-6);
      if (r < 3.0) beta += -0.25 * (3.0 - r) / 2.0 * normalize(vec3(pos.xy, 0.0) + 1e-6);   // inside the last stable orbit the gas plunges in
      vec3 k = -normalize(vel);                                                       // the way the light is actually going: toward us
      float g = sqrt(max(1.0 - 1.0 / r, 0.0)) * sqrt(max(1.0 - dot(beta, beta), 0.0)) / (1.0 - dot(beta, k));
      I += (j * (0.35 + 1.3 * turb(pos, Rc, om)) + js) * pow(g, 4.0) * dt;
    }
    vec3 acc = -1.5 * h2 * pos / pow(r, 5.0);
    vel += acc * dt; pos += vel * dt;
  }
  float x = 1.0 - exp(-I * 9.0);
  vec3 col = vec3(clamp(1.6 * x, 0.0, 1.0), clamp(1.6 * x - 0.45, 0.0, 1.0), clamp(1.8 * x - 1.1, 0.0, 1.0));   // false colour, after the EHT's palette
  float a = max(hole ? 1.0 : 0.0, max(col.r, max(col.g, col.b)));
  gl_FragColor = vec4(col, a) * uA;
}

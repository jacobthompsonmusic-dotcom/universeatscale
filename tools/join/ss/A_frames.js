
// ===================================================================
//  deep space: the galaxy map's frame, and where this view hands over to it
// ===================================================================
const EMBED = /[?&]embed=1/.test(location.search);
const LYKM = 9460730472580.8, LY = LYKM * U, TAN20 = Math.tan(20 * DEG);   // a light-year (Julian year × c) in km and in scene units
// heliocentric galactic axes (IAU galactic frame, ICRS J2000) in scene coordinates
const GXs = eqToScene(GAL.x), GYs = eqToScene(GAL.y), GZs = eqToScene(GAL.z);
const galToScene = (x, y, z, out = new THREE.Vector3()) => out.set(0, 0, 0).addScaledVector(GXs, x).addScaledVector(GYs, y).addScaledVector(GZs, z);
// the galaxy map's own axes: its "up" is the pole of the disc's true midplane, tipped 0.14° from the IAU pole because the Sun
// sits 20.8 pc above that plane (Bennett & Bovy 2019) at 8.275 kpc from the centre (GRAVITY 2021) — the same frame the map uses
const MW_TH = Math.asin(20.8 / 8275), MW_Y = galToScene(-Math.cos(MW_TH), 0, -Math.sin(MW_TH)), MW_Z = galToScene(-Math.sin(MW_TH), 0, Math.cos(MW_TH));
// far from the Sun the whole scene turns so that "up" swings from the pole of Earth's orbit to the pole of the galaxy (60.2° apart)
const Q_GAL = new THREE.Quaternion().setFromUnitVectors(MW_Z, new THREE.Vector3(0, 1, 0)), Q_ID = new THREE.Quaternion();
const MW_AZ = (() => { const v = MW_Y.clone().applyQuaternion(Q_GAL); return Math.atan2(v.x, v.z); })();   // the map's yaw 0, as an azimuth here
const sstep = (x, a, b) => { const k = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
// t: how far the scene has turned to the galaxy's frame · p: how far the lens has flattened into the map's straight-down projection · q: cross-fade into the galaxy map
const deep = { t: 0, p: 0, q: 0, fov: 40 }, SPAN_MAX = 6.2, TAN_FLAT = Math.tan(0.6 * DEG);

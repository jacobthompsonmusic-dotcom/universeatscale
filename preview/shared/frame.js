// The one set of measured constants and coordinate transforms both views use (galaxy map: milky-way/, Solar System: solar-system/).
// Change a number here and both views move together; tools/check.js fails if a page stops using these.
(() => {
  const DEG = Math.PI / 180;
  const F = {
    DEG,
    PC_LY: 3.26156,                    // light-years per parsec
    LY_KM: 9460730472580.8,            // a light-year (Julian year × c), km
    AU_KM: 149597870.7,                // IAU 2012
    R0_PC: 8275,                       // Sun–Sgr A* distance, GRAVITY Collaboration 2021 (8.275 ± 0.034 kpc)
    ZSUN_PC: 20.8,                     // Sun's height above the disc midplane, Bennett & Bovy 2019
    EPS: 23.4392911 * DEG,             // obliquity of the ecliptic, J2000 (IAU 1980)
    // ICRS (J2000 equatorial) → IAU galactic rotation: rows are the galactic x (toward l = 0), y (l = 90°) and z (north pole) axes
    EQ2GAL: [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]],
  };
  F.R0_LY = F.R0_PC * F.PC_LY;
  F.ZSUN_LY = F.ZSUN_PC * F.PC_LY;
  F.TH = Math.asin(F.ZSUN_PC / F.R0_PC);   // the Sun sits above the midplane, so the disc's true pole is tipped this far from the IAU pole
  const cTH = Math.cos(F.TH), sTH = Math.sin(F.TH);
  // Galaxy-map world frame: Sgr A* at the origin, z to the north pole of the true midplane; from above, l = 0° points up, 90° left, y grows down.
  // Heliocentric galactic cartesian (x toward the centre, y toward l = 90°, z north) → world, as in astropy's Galactocentric frame.
  F.helioToWorld = (xh, yh, zh) => {
    const x0 = xh - F.R0_LY, xg = x0 * cTH + zh * sTH, zg = -x0 * sTH + zh * cTH;
    return { x: -yh, y: -xg, z: zg };
  };
  F.galToWorld = (d, l, b) => { const cb = Math.cos(b * DEG);
    return F.helioToWorld(d * cb * Math.cos(l * DEG), d * cb * Math.sin(l * DEG), d * Math.sin(b * DEG)); };
  F.eqToGal = v => F.EQ2GAL.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  // Star colours, shared by both views. A star's colour index B−V gives its surface temperature (Ballesteros 2012, EPL 97, 34001);
  // the temperature gives the colour: a blackbody's sRGB tint (M. Charity's table, D65 white), its saturation raised 1.4× so the tints
  // read as they do in a good photograph — pale blue-white O/B, white A, warm-white F/G, peach K, orange M — rather than as paint.
  F.bvToT = bv => 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
  const TC = [[2400, 255, 128, 48], [3000, 255, 165, 80], [3500, 255, 190, 110], [4000, 255, 206, 142], [4600, 255, 219, 176], [5300, 255, 231, 207],
    [5800, 255, 239, 228], [6500, 255, 248, 254], [7500, 230, 236, 255], [10000, 198, 219, 255], [15000, 172, 206, 255], [30000, 147, 192, 255]];
  F.starRGB = T => {   // → [r, g, b], 0–255
    if (T <= TC[0][0]) return TC[0].slice(1);
    for (let i = 1; i < TC.length; i++) if (T <= TC[i][0]) {
      const a = TC[i - 1], b = TC[i], t = Math.log(T / a[0]) / Math.log(b[0] / a[0]);
      return [1, 2, 3].map(k => Math.round(a[k] + (b[k] - a[k]) * t));
    }
    return TC[TC.length - 1].slice(1);
  };
  F.starHex = T => '#' + F.starRGB(T).map(v => v.toString(16).padStart(2, '0')).join('');
  window.UAS_FRAME = F;
})();

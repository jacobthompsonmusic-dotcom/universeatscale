# Joining the Solar System and the Milky Way map (work in progress)

Goal: one continuous zoom from Earth to the edge of the observable universe.

- `match.py`, `match2.py`, `zod.py`, `build_data.py` — rebuild the star data from AT-HYG v3.2 (`athyg_32_reduced_m10.csv.gz`,
  github.com/astronexus/ATHYG-Database, data/subsets). Outputs: `field_raw.txt` (the map's 9,407 stars at full precision),
  `sky_b64.txt` (9,502 stars for the Solar System sky, 16 bytes each: gal x,y,z ly float32, absmag*100 int16, B-V*50 int8, on-map flag),
  `zod_sky.json` / `zod_map.json` (zodiac stick figures as indices into those star lists).
- `ss/` — code blocks and `patch_ss.py` that were applied to `solar-system/index.html`.
- `shot.js` — headless Chrome render harness (Playwright + local three.js r128).

Design: the Solar System view (three.js, perspective) now zooms out to ~6 light-years. Past 3,000 AU the scene turns from the
ecliptic frame to the galaxy map's frame (60.2 deg); past 0.35 ly the lens narrows (dolly zoom) until the picture matches the
map's orthographic projection; a shell page (`universe/`) then cross-fades to the Milky Way map, passing scale, yaw and tilt.

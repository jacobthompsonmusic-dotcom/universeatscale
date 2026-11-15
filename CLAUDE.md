# Universe at Scale — working notes for Claude

Live at https://universeatscale.com (GitHub Pages from `main`, custom domain via CNAME). Owner: Jacob Thompson.

## Workflow
- **Every change goes live** (pre-sharing stage, Jacob's standing instruction): commit to `main` and push. Pages updates in ~1–10 min; tell Jacob to hard-reload (Cmd+Shift+R).
- **Risky or heavy changes**: run `tools/preview.sh`, commit, push, and test at https://universeatscale.com/preview/ in Jacob's Chrome (real GPU — the cloud headless browser renders the galaxy volume at ~12 s/frame). The preview copy is noindex with analytics off.
- **Test in Jacob's Chrome** with the javascript tool: `?debug=1` exposes `window.__mw` (galaxy map) and `window.__ss` (Solar System). Headless fallback: `node tools/join/shot.js <path> <out.png> <steps.json> <wait-ms>`.
- Other Claude sessions may push to this repo: always `git pull --ff-only` before starting and before pushing.
- The old "Universe at Scale" Claude artifact mirror is retired — don't republish it unless Jacob asks.
- Keep replies to Jacob to 3–4 sentences.

## Layout
- `index.html` — home page (plates). `universe/` — the joined Earth-to-edge page: two iframes (solar-system/?embed=1 and milky-way/?embed=1) handing over at ~6 ly via postMessage.
- `solar-system/` — three.js r128 Solar System (planets, moons, dwarfs, probes, Oort cloud, star sky). Earth textures in `solar-system/earth/`.
- `milky-way/` — 2D-canvas + WebGL galaxy/universe map: stars, objects (OBJ, GALAXIES, REGIONS, VOIDS), Sgr A* layers and black-hole ray tracer (`#bh`), perspective lens below ~25,000 ly (PT/PD in setupView/proj).
- `shared/galaxy-volume.js` — the Milky Way volume shader used by BOTH views (each prepends `#define MAX_STEPS n`). Change it once; the hand-over stays matched. Tone curve: uExpo, uGam (1.8 inside the disc → 1.2 for the whole-galaxy view).
- `moons/`, `giant-planets-3d/` — older standalone maps. `music/music.js` — soundtrack note + Spotify player.
- `tools/seo/apply_seo.py` writes every page's head block (meta, OG, JSON-LD, GA4 G-EQP5W8H17E). Keep `google4477504e0eddd8e3.html` and the msvalidate meta.

## Gotchas
- Anything drawn near Sgr A* must use `gcScale()` (scale measured at the GC through proj's magnification), not `view.s`/`viewSpan()` — under perspective those are only right at the view centre.
- Flights: `flyTo` (van Wijk–Nuij path, max 12.5 s); arrival framing in `spanFor()` (OBJ_SIZE has literature sizes).
- Scientific accuracy matters to Jacob: base data on current measurements and say in the UI/credits what is illustrative.

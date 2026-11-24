# Cache-busting: stamps a short content hash onto the URLs the browser would otherwise keep for up to 10 minutes after a push —
# the joined page's two frames (Chrome caches frame documents separately, so a hard reload doesn't refresh them) and the shared
# scripts. Idempotent; runs from tools/preview.sh, i.e. before every commit.
import hashlib, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
FILES = ['milky-way/index.html', 'solar-system/index.html', 'shared/frame.js', 'shared/clock.js', 'shared/galaxy-volume.js', 'shared/fold.js', 'shared/perf.js', 'music/music.js', 'solar-system/baked/manifest.js']
strip = lambda s: re.sub(r'\?v=[0-9a-f]{8}', '', re.sub(r"const UAS_V = '[0-9a-f]{8}'", '', s))
h = hashlib.sha1(b''.join(strip((root / f).read_text()).encode() for f in FILES)).hexdigest()[:8]
PAGES = ['index.html', 'universe/index.html', 'milky-way/index.html', 'solar-system/index.html', 'moons/index.html', 'giant-planets-3d/index.html']
for p in PAGES:
    f = root / p; s = f.read_text(); o = s
    s = re.sub(r'(src="(?:\.\./)?(?:shared|music|baked)/[a-z-]+\.js)(?:\?v=[0-9a-f]{8})?"', rf'\1?v={h}"', s)
    if p == 'universe/index.html':
        s = re.sub(r"const UAS_V = '[0-9a-f]{8}';\n", '', s)
        s = s.replace("mwEl.src = '../milky-way/index.html' + dbg;", "mwEl.src = '../milky-way/index.html?v=' + UAS_V + dbg.replace('?', '&');")
        s = s.replace("ssEl.src = '../solar-system/index.html' + dbg;", "ssEl.src = '../solar-system/index.html?v=' + UAS_V + dbg.replace('?', '&');")
        s = s.replace("const MW_SRC = '../milky-way/index.html?v='", f"const UAS_V = '{h}';\nconst MW_SRC = '../milky-way/index.html?v='", 1)
    if s != o: f.write_text(s)
print('stamped', h)

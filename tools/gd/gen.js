// Face-on galaxy picture tools (Nov 2026).
//   node tools/gd/gen.js stats            → radial brightness profile of the galaxy map's painted disc (__mw.gal on black)
//   node tools/gd/gen.js jpg              → regenerate milky-way/galaxy-disc.jpg (2048 px, blur 1.6 px, JPEG 0.9) for phones and the Solar System
//   node tools/gd/gen.js png <out.png>    → a 1600-px preview of the painted disc
// Forces UAS_PERF.tier 0 so the page paints the disc itself instead of loading the JPEG.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), [mode = 'stats', out] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.css': 'text/css' };
(async () => {
  const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); r.end(d); } }); });
  await new Promise(res => srv.listen(8124, res));
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu', '--disable-webgl'] });
  const pg = await b.newPage({ viewport: { width: 800, height: 600 } });
  await pg.route(u => !/^http:\/\/localhost:8124/.test(u.href), r => r.abort());
  await pg.addInitScript(() => { let P; Object.defineProperty(window, 'UAS_PERF', { configurable: true, get: () => P, set: v => { try { v.tier = 0; } catch (e) {} P = v; } }); });
  pg.on('pageerror', e => console.error('pageerror', e.message));
  await pg.goto('http://localhost:8124/milky-way/?debug=1', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => window.__mw && window.__mw.gal, null, { timeout: 120000 });
  if (mode === 'stats') {
    console.log(await pg.evaluate(() => {
      const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
      g.fillStyle = '#000'; g.fillRect(0, 0, N, N); g.drawImage(__mw.gal, 0, 0, N, N);
      const d = g.getImageData(0, 0, N, N).data, bands = [0, 2000, 5000, 10000, 20000, 30000, 40000, 50000, 62000], acc = bands.slice(1).map(() => [0, 0, 0, 0]);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = (i + 0.5) / N * 124000 - 62000, y = (j + 0.5) / N * 124000 - 62000, R = Math.hypot(x, y);
        const k = bands.findIndex((v, n) => n > 0 && R < v) - 1; if (k < 0) continue;
        const o = 4 * (j * N + i); acc[k][0] += d[o]; acc[k][1] += d[o + 1]; acc[k][2] += d[o + 2]; acc[k][3]++;
      }
      return acc.map((a, k) => `${bands[k]}–${bands[k + 1]} ly: ` + [0, 1, 2].map(n => (a[n] / a[3]).toFixed(1)).join(' ')).join('\n') + `\npaint ${window.__galMs | 0} ms`;
    }));
  } else {
    const W = mode === 'jpg' ? 2048 : 1600;
    const url = await pg.evaluate(([W, jpg]) => {
      const c = document.createElement('canvas'); c.width = c.height = W; const g = c.getContext('2d');
      g.fillStyle = '#000'; g.fillRect(0, 0, W, W); if (jpg) g.filter = 'blur(1.6px)'; g.drawImage(__mw.gal, 0, 0, W, W); g.filter = 'none';
      return c.toDataURL(jpg ? 'image/jpeg' : 'image/png', 0.9);
    }, [W, mode === 'jpg']);
    const file = mode === 'jpg' ? path.join(ROOT, 'milky-way/galaxy-disc.jpg') : out;
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', file);
  }
  await b.close(); srv.close();
})();

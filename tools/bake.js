// tools/bake.js — paints the textures the maps would otherwise paint at every visit, and saves them as image files.
//   node tools/bake.js        (needs three@0.128 in /tmp/t, like tools/check.js; then run tools/preview.sh and commit)
// Writes solar-system/baked/* plus baked/manifest.js, which the page reads. File names carry a content
// hash, so browsers and the service worker can keep them for good. Rerun it whenever a painter (…Texture() in solar-system/index.html) changes. (The galaxy map's pictures were too big to
// be worth downloading — 4.4 MB — so desktop still paints them; phones use milky-way/galaxy-disc.jpg.)
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..'), T3 = '/tmp/t/node_modules/three/';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' }); r.end(d); } }); });
(async () => {
  await new Promise(res => srv.listen(8140, res));
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const map of ['solar-system']) {
    const pg = await b.newPage({ viewport: { width: 1280, height: 800 } }), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.route('**/*', rt => { const u = rt.request().url();
      if (u.includes('three.min.js')) return rt.fulfill({ path: T3 + 'build/three.min.js', contentType: 'text/javascript' });
      if (u.includes('OrbitControls.js')) return rt.fulfill({ path: T3 + 'examples/js/controls/OrbitControls.js', contentType: 'text/javascript' });
      return u.startsWith('http://localhost:8140') ? rt.continue() : rt.abort(); });
    await pg.goto(`http://localhost:8140/${map}/?bake=1`); await pg.waitForTimeout(9000);
    if (errs.length) throw new Error(map + ': ' + errs.join(' | '));
    const items = await pg.evaluate(() => {
      const BAKING = window.__BAKE, list = Array.isArray(BAKING) ? BAKING.map(({ key, t }) => ({ key, cv: t.image, t })) : Object.entries(BAKING).map(([key, cv]) => ({ key, cv, t: null }));
      const seen = new Set(), out = [];
      for (const { key, cv, t } of list) {
        if (seen.has(key) || !cv || !cv.getContext) continue; seen.add(key);
        const g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data; let alpha = false;
        for (let i = 3; i < d.length; i += 4) if (d[i] < 255) { alpha = true; break; }
        const one = document.createElement('canvas'); one.width = one.height = 1; const og = one.getContext('2d'); og.drawImage(cv, 0, 0, 1, 1);
        const a = og.getImageData(0, 0, 1, 1).data, avg = '#' + [a[0], a[1], a[2]].map(v => v.toString(16).padStart(2, '0')).join('');
        const data = cv.height <= 8 || key.startsWith('dense');   // data textures (ring densities) stay exact
        const type = data ? 'image/png' : 'image/webp', url = cv.toDataURL(type, 0.93);
        const s = t ? { enc: t.encoding, an: t.anisotropy, ws: t.wrapS, wt: t.wrapT, mag: t.magFilter, min: t.minFilter, gm: t.generateMipmaps, fy: t.flipY } : {};
        out.push({ key, url, ext: data ? 'png' : 'webp', avg, alpha, w: cv.width, h: cv.height, ...s });
      }
      return out;
    });
    const dir = path.join(ROOT, map, 'baked'); fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    const man = {}; let total = 0;
    for (const it of items) {
      const buf = Buffer.from(it.url.split(',')[1], 'base64'), h = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
      const name = `${it.key.replace(/[^\w.-]+/g, '_').slice(0, 60)}.${h}.${it.ext}`; fs.writeFileSync(path.join(dir, name), buf); total += buf.length;
      const { url, ext, alpha, w, h: hh, key, ...rest } = it; man[key] = { f: name, ...rest };
    }
    fs.writeFileSync(path.join(dir, 'manifest.js'), '// written by tools/bake.js — the pre-painted textures this map loads instead of painting them\nwindow.UAS_BAKED = ' + JSON.stringify(man) + ';\n');
    console.log(`${map}: ${items.length} pictures, ${(total / 1024).toFixed(0)} KB`);
    await pg.close();
  }
  await b.close(); srv.close();
})();

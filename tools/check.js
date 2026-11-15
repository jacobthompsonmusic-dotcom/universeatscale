// Consistency check for the two views. Run before pushing: node tools/check.js   (exit code 1 on any failure)
//  1. no page hard-codes the shared constants (they must come from shared/frame.js)
//  2. the joined page's two views share one clock, and agree on the date
//  3. no page errors while loading the joined page, the galaxy map and the Solar System
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const ROOT = path.join(__dirname, '..'); let fail = 0;
const bad = (m) => { console.log('FAIL', m); fail = 1; }, ok = (m) => console.log('ok  ', m);
// 1
const LIT = [['8275', 'R0'], ['3.26156', 'pc in ly'], ['0.0548755604', 'equatorial→galactic matrix'], ['23.4392911', 'obliquity'], ['9460730472580.8', 'ly in km'], ['Math.asin(20.8', 'Sun height']];
for (const f of ['milky-way/index.html', 'solar-system/index.html', 'universe/index.html']) {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').filter(l => !/^\s*\/\//.test(l)).map(l => l.replace(/\/\/.*$/, '')).join('\n');
  const hits = LIT.filter(([s]) => code.includes(s)).map(([, n]) => n);
  hits.length ? bad(`${f} hard-codes: ${hits.join(', ')} — use window.UAS_FRAME`) : ok(`${f} uses shared/frame.js`);
}
// 2 + 3
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' }); r.end(d); } }); });
(async () => {
  await new Promise(res => srv.listen(8124, res));
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const T3 = '/tmp/t/node_modules/three/';
  for (const url of ['/universe/?debug=1', '/milky-way/?debug=1', '/solar-system/?debug=1']) {
    const pg = await b.newPage({ viewport: { width: 1280, height: 800 } }), errs = [];
    await pg.route('**/*', rt => { const u = rt.request().url();
      if (u.includes('three.min.js')) return rt.fulfill({ path: T3 + 'build/three.min.js', contentType: 'text/javascript' });
      if (u.includes('OrbitControls.js')) return rt.fulfill({ path: T3 + 'examples/js/controls/OrbitControls.js', contentType: 'text/javascript' });
      return u.startsWith('http://localhost:8124') ? rt.continue() : rt.abort(); });
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('http://localhost:8124' + url); await pg.waitForTimeout(7000);
    errs.length ? bad(`${url}: ${errs.join(' | ').slice(0, 300)}`) : ok(`${url} loads without errors`);
    if (url.startsWith('/universe')) {
      const fr = pg.frames(), ss = fr.find(f => f.url().includes('solar-system')), mw = fr.find(f => f.url().includes('milky-way'));
      const same = await pg.evaluate(() => { const fs = [...document.querySelectorAll('iframe')].map(f => f.contentWindow); return fs.length === 2 && fs.every(w => w.UAS_CLOCK) && !!window.__uasClock; });
      same ? ok('joined page: both views share the top window\'s clock') : bad('joined page: the views do not share one clock');
      const [a, c] = await pg.evaluate(() => [...document.querySelectorAll('iframe')].map(f => f.contentWindow.UAS_CLOCK.now()));   // same JS tick
      Math.abs(a - c) < 60e3 ? ok(`joined page: dates agree (${new Date(a).toISOString()})`) : bad(`joined page: dates differ by ${(a - c) / 864e5} days`);
      // the S-stars' fast clock carries the Solar System's date with it
      await mw.evaluate(() => { UAS_CLOCK.boost(365.25 * 864e5 / 1000, 'check'); }); await pg.waitForTimeout(1000);
      const [a2, c2] = await pg.evaluate(() => [...document.querySelectorAll('iframe')].map(f => f.contentWindow.UAS_CLOCK.now()));
      await mw.evaluate(() => UAS_CLOCK.unboost('check'));
      (a2 - a > 0.5 * 365 * 864e5 && Math.abs(a2 - c2) < 7 * 864e5) ? ok('joined page: a time boost in one view moves the other') : bad('joined page: a boost in the galaxy map did not reach the Solar System');
      const fA = await ss.evaluate(() => [UAS_FRAME.R0_LY, UAS_FRAME.TH]), fB = await mw.evaluate(() => [UAS_FRAME.R0_LY, UAS_FRAME.TH]);
      JSON.stringify(fA) === JSON.stringify(fB) ? ok('joined page: both views use the same frame constants') : bad('joined page: frame constants differ');
    }
    await pg.close();
  }
  await b.close(); srv.close();
  console.log(fail ? '\nCHECK FAILED' : '\nall checks passed'); process.exit(fail);
})();

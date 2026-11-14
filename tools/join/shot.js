// usage: node shot.js <url-path> <out.png> [js-to-eval] [wait-ms] [w] [h]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.env.ROOT || '/home/claude/universeatscale';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.css': 'text/css', '.xml': 'text/xml', '.txt': 'text/plain' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end('nf'); } else { r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); });
(async () => {
  await new Promise(res => srv.listen(8123, res));
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: +(process.argv[6] || 1280), height: +(process.argv[7] || 800) } });
  const T3 = '/tmp/t/node_modules/three/';
  await pg.route('**/*', rt => { const u = rt.request().url();
    if (u.includes('three.min.js')) return rt.fulfill({ path: T3 + 'build/three.min.js', contentType: 'text/javascript' });
    if (u.includes('OrbitControls.js')) return rt.fulfill({ path: T3 + 'examples/js/controls/OrbitControls.js', contentType: 'text/javascript' });
    if (u.startsWith('http://localhost:8123')) return rt.continue();
    return rt.abort(); });
  const logs = []; pg.on('console', m => logs.push(m.type() + ': ' + m.text())); pg.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
  await pg.goto('http://localhost:8123' + process.argv[2]);
  await pg.waitForTimeout(+(process.argv[5] || 2500));
  const steps = process.argv[4] ? JSON.parse(fs.readFileSync(process.argv[4], 'utf8')) : [];
  let n = 0;
  for (const st of steps) {
    if (st.eval) { const fr = st.frame ? pg.frames().find(f => f.url().includes(st.frame)) : pg; try { const v = await fr.evaluate(st.eval); if (v !== undefined) console.log('eval:', JSON.stringify(v)); } catch (e) { console.log('EVALERR', e.message.slice(0, 300)); } }
    if (st.wheel) { await pg.mouse.move(st.x || 640, st.y || 400); for (let i = 0; i < st.n; i++) { await pg.mouse.wheel(0, st.wheel); await pg.waitForTimeout(st.gap || 30); } }
    if (st.drag) { await pg.mouse.move(st.drag[0], st.drag[1]); await pg.mouse.down({ button: st.button || 'left' }); await pg.mouse.move(st.drag[2], st.drag[3], { steps: 8 }); await pg.mouse.up({ button: st.button || 'left' }); }
    if (st.click) await pg.mouse.click(st.click[0], st.click[1]);
    if (st.wait) await pg.waitForTimeout(st.wait);
    if (st.shot) { await pg.screenshot({ path: st.shot }); n++; }
  }
  if (process.argv[3] && process.argv[3] !== '-') await pg.screenshot({ path: process.argv[3] });
  console.log(logs.slice(0, 25).join('\n'));
  await b.close(); srv.close();
})();

// sw.js — keeps the site's files on the device, so a second visit opens almost at once (and it still opens offline).
//   · pages (HTML): always asked for fresh first, so every update shows straight away; the kept copy is only used offline
//   · files whose address changes when they change (?v= stamps, baked/ pictures with a hash in the name, versioned libraries,
//     Wikimedia photos): kept and reused as they are
//   · other files of the site (Earth maps, the galaxy picture): the kept copy is used, and quietly refreshed for next time
//   · never touched: Google Analytics, Spotify
const CACHE = 'uas-1', KEEP_IMAGES = 160;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

const fixed = u => (u.origin === self.location.origin && (/[?&]v=/.test(u.search) || u.pathname.includes('/baked/')))
  || /(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|upload\.wikimedia\.org|fonts\.gstatic\.com)$/.test(u.hostname);
const skip = u => /google-analytics|googletagmanager|doubleclick|spotify|scdn\.co/.test(u.hostname);

async function put(req, res) {
  if (!res || !res.ok) return;   // only real answers: never opaque or failed ones
  const c = await caches.open(CACHE); await c.put(req, res);
  if (/\.(jpe?g|png|webp)$/i.test(new URL(req.url).pathname)) {   // keep the photo cache from growing without end
    const keys = (await c.keys()).filter(k => /\.(jpe?g|png|webp)$/i.test(new URL(k.url).pathname));
    for (let i = 0; i < keys.length - KEEP_IMAGES; i++) await c.delete(keys[i]);
  }
}
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (skip(u) || !/^https?:$/.test(u.protocol)) return;
  const page = r.mode === 'navigate' || r.destination === 'document' || r.destination === 'iframe';
  if (page) {   // fresh first
    e.respondWith(fetch(r).then(res => { e.waitUntil(put(r, res.clone())); return res; }).catch(async () => (await caches.match(r)) || Response.error()));
  } else if (fixed(u)) {   // never changes: reuse
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { e.waitUntil(put(r, res.clone())); return res; })));
  } else if (u.origin === self.location.origin || u.hostname === 'fonts.googleapis.com') {   // reuse, refresh in the background
    e.respondWith(caches.match(r).then(hit => {
      const net = fetch(r).then(res => { e.waitUntil(put(r, res.clone())); return res; });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    }));
  }
});

// window.UAS_PERF — keeping the maps smooth on every machine.
//   UAS_PERF.tier      first guess at the device: 0 strong desktop/laptop, 1 modest (phone, tablet, low memory/cores), 2 weak (software GL)
//   UAS_PERF.governor(name, steps, start, onChange)
//                      a frame-time governor: feed it the time between animated frames; it steps the quality down when frames are
//                      slow and back up when there's headroom, with hysteresis so it never flickers between levels. The level it
//                      settles on is remembered for the visit (sessionStorage), so the next page or reload starts there.
(function () {
  const nav = navigator, mm = q => { try { return matchMedia(q).matches; } catch (e) { return false; } };
  const phone = mm('(pointer: coarse)') && Math.min(screen.width, screen.height) < 820;
  let gpu = '';
  try { const g = document.createElement('canvas').getContext('webgl'), e = g && g.getExtension('WEBGL_debug_renderer_info'); if (e) gpu = String(g.getParameter(e.UNMASKED_RENDERER_WEBGL)); } catch (e) {}
  const soft = /swiftshader|llvmpipe|software|basic render/i.test(gpu);
  const lowMem = (nav.deviceMemory || 8) <= 4, fewCores = (nav.hardwareConcurrency || 8) <= 4;
  const tier = soft ? 2 : (phone || lowMem || fewCores) ? 1 : 0;

  const store = {
    get(k) { try { const v = sessionStorage.getItem('uas-q-' + k); return v === null ? null : +v; } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem('uas-q-' + k, v); } catch (e) {} },
  };

  // steps: number of levels (0 = best). Slow = median frame over ~0.6 s above 30 ms (under ~33 fps) → one step down, then a
  // 1.5 s pause to let it settle. Fast = median under 18 ms for ~4 s → one step back up, but never straight back to a level
  // that was just too slow (that level waits 20 s before it's tried again).
  // o.slow / o.fast: the thresholds (ms) — a page capped at 30 fps passes about 45 / 36
  function governor(name, steps, start, onChange, o) {
    const SLOW = (o && o.slow) || 30, FAST = (o && o.fast) || 18;
    const saved = store.get(name);
    const G = { level: Math.max(0, Math.min(steps - 1, saved !== null ? saved : start)), win: [], last: 0, hold: 0, good: 0, badAt: {} };
    G.frame = function (now) {
      const dt = now - G.last; G.last = now;
      if (dt <= 0 || dt > 250 || document.hidden) { G.win.length = 0; G.good = 0; return; }   // paused, idle or hidden: not a measurement
      STAT.n++; STAT.b[dt < 20 ? 0 : dt < 36 ? 1 : dt < 55 ? 2 : 3]++; STAT.level = G.level;
      if (now < G.hold) return;
      G.win.push(dt); if (G.win.length > 36) G.win.shift();
      if (G.win.length < 36) return;
      const med = [...G.win].sort((a, b) => a - b)[18];
      if (med > SLOW && G.level < steps - 1) { G.badAt[G.level] = now; set(G.level + 1, now); return; }
      if (med < FAST) G.good += dt; else G.good = 0;
      if (G.good > 4000 && G.level > 0 && now - (G.badAt[G.level - 1] || -1e9) > 20000) set(G.level - 1, now);
    };
    function set(l, now) { G.level = l; G.win.length = 0; G.good = 0; G.hold = now + 1500; store.set(name, l); onChange(l); }
    G.force = l => { G.level = Math.max(0, Math.min(steps - 1, l)); store.set(name, G.level); onChange(G.level); };
    onChange(G.level);
    return G;
  }
  // ---- anonymous speed report (Google Analytics, only on universeatscale.com, only where the page already loads it) ----
  // One 'uas_perf' event per page view, when it's hidden or closed: how the frames went (share at ~60, ~30, ~20 and under 20 fps),
  // the device class, the quality level the governor settled on, the screen's pixel ratio, the graphics chip's name and how many
  // times a 3D view lost its graphics. And one 'uas_possible_crash' if the last visit to this view in this tab never closed properly
  // (phones reload a page that crashed). Nothing about the person.
  const view = (location.pathname.match(/(solar-system|milky-way)/) || [])[1] || 'other';
  const STAT = { n: 0, b: [0, 0, 0, 0], level: -1, lost: 0 };
  addEventListener('webglcontextlost', () => { if (!window.__uasFreeing) STAT.lost++; }, true);
  const gt = (name, p) => { try { const f = (window.top && window.top.gtag) || window.gtag; if (f) f('event', name, p); } catch (e) {} };
  let sent = false;
  function report() {
    if (sent || STAT.n < 90) return; sent = true;
    const pc = i => Math.round(100 * STAT.b[i] / STAT.n);
    gt('uas_perf', { view, tier, phone: phone ? 1 : 0, level: STAT.level, frames: STAT.n, fps60_pct: pc(0), fps30_pct: pc(1), fps20_pct: pc(2), slow_pct: pc(3),
      lost: STAT.lost, dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100, gpu: gpu.replace(/ANGLE \(|, ANGLE Metal Renderer|Unspecified Version\)?/g, '').slice(0, 90) });
  }
  addEventListener('pagehide', report);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') report(); });
  try {
    const K = 'uas-alive-' + view;
    if (sessionStorage.getItem(K)) setTimeout(() => gt('uas_possible_crash', { view, tier, phone: phone ? 1 : 0 }), 3000);
    sessionStorage.setItem(K, '1'); addEventListener('pagehide', () => { try { sessionStorage.removeItem(K); } catch (e) {} });
  } catch (e) {}
  window.UAS_PERF = { tier, phone, gpu, soft, governor, stat: STAT };
})();

// One simulation clock for the whole site. The Solar System's date, the S-stars around Sgr A*, the probes and the "light you see
// left" dates all read it, so the views can never disagree about what time it is. In the joined page (universe/) both views are
// same-origin frames, so they share a single clock object kept on the top window; a standalone page keeps its own.
// Time is real milliseconds (Unix epoch). rate = simulated ms per real ms (3600 = one hour per second).
(() => {
  let root = window;
  try { if (window.top !== window && window.top.location.origin === location.origin) root = window.top; } catch (e) { root = window; }
  const S = root.__uasClock || (root.__uasClock = { base: Date.now(), wall: Date.now(), rate: 3600, playing: false, boost: null, ver: 0 });
  const raw = () => S.playing ? S.base + (Date.now() - S.wall) * S.rate : S.base;
  const rebase = () => { S.base = raw(); S.wall = Date.now(); };
  // a boost is a lease: the view that asked for it renews it every frame while its subject is on screen. If that view stops
  // drawing (hidden behind the other view after a hand-over, say) the lease runs out and the old pace comes back by itself, so
  // the play button can never be left stuck under someone else's speed.
  const expire = () => { if (S.boost && Date.now() - S.boost.at > 1500) { rebase(); S.rate = S.boost.rate; S.playing = S.boost.playing; S.boost = null; S.ver++; } };
  const now = () => { expire(); return raw(); };
  const C = {
    now,
    year: (ms = now()) => 2000 + (ms - Date.UTC(2000, 0, 1, 12)) / (365.25 * 864e5),
    get rate() { expire(); return S.rate; }, get playing() { expire(); return S.playing; }, get boosted() { expire(); return !!S.boost; }, get ver() { return S.ver; },
    set(ms) { S.base = ms; S.wall = Date.now(); S.ver++; },
    setRate(r) { if (r === S.rate) return; rebase(); S.rate = r; S.ver++; },
    setPlaying(p) { if (p === S.playing) return; rebase(); S.playing = p; S.ver++; },
    // a view can speed time up while it's showing something slow (the S-stars at one year per second) and hand back the old pace after
    boost(r, who) { expire(); if (S.boost && S.boost.who === who && S.rate === r && S.playing) { S.boost.at = Date.now(); return; }   // just renewing
      if (!S.boost) S.boost = { rate: S.rate, playing: S.playing }; S.boost.who = who; S.boost.at = Date.now(); rebase(); S.rate = r; S.playing = true; S.ver++; },
    unboost(who) { if (!S.boost || S.boost.who !== who) return; rebase(); S.rate = S.boost.rate; S.playing = S.boost.playing; S.boost = null; S.ver++; },
  };
  window.UAS_CLOCK = C;
})();

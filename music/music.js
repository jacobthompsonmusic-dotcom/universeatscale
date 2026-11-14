/* Universe at Scale — soundtrack note.
   A small "♪ Soundtrack" note in a corner that opens Jacob Thompson's album "First Time Again" in Spotify's own player.
   Nothing plays and nothing loads from Spotify until the visitor opens the note and presses play.
   Usage: <script src="../music/music.js" data-place="ladder|corner|header" defer></script>
     ladder  — under the scale ladder (joined page)
     corner  — fixed, bottom-right (home page)
     header  — beside the "← All maps" link in a map's panel (standalone map pages; skipped when embedded) */
(function () {
  var ALBUM = '5NK09eF6jO8AHI5NAiuBzL';
  var SPOTIFY = 'https://open.spotify.com/album/' + ALBUM;
  var EMBED_SRC = 'https://open.spotify.com/embed/album/' + ALBUM + '?utm_source=universeatscale&theme=0';
  var SITE = 'https://iamjacob.ca';
  var me = document.currentScript;
  var place = (me && me.getAttribute('data-place')) || 'corner';
  var embedded = window.name === 'uas-embed' || /[?&]embed=1/.test(location.search);
  if (embedded) return;                       // the joined page shows its own note, so the music keeps playing across the hand-over

  var css = [
    '.uas-mu-btn{font:500 11.5px Inter,system-ui,sans-serif;color:#8d93a8;background:rgba(12,13,20,.78);border:1px solid rgba(255,255,255,.09);',
    ' border-radius:999px;padding:6px 11px;cursor:pointer;white-space:nowrap;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:color .15s,border-color .15s}',
    '.uas-mu-btn:hover,.uas-mu-btn:focus-visible,.uas-mu-btn.open{color:#e9ecf5;border-color:rgba(255,207,110,.45);outline:none}',
    '.uas-mu-btn .n{color:#ffcf6e;margin-right:5px}',
    '.uas-mu-btn.playing .n{animation:uasmu 1.6s ease-in-out infinite}',
    '@keyframes uasmu{50%{opacity:.35}}',
    '.uas-mu-fixed{position:fixed;z-index:30}',
    '.uas-mu-ladder{top:262px;right:16px;width:130px;text-align:center}',
    '.uas-mu-corner{right:18px;bottom:18px}',
    '.uas-mu-header{border:0;background:none;backdrop-filter:none;-webkit-backdrop-filter:none;padding:0 0 0 10px;font-size:12px}',
    '.uas-mu-header:hover,.uas-mu-header.open{border:0}',
    '.uas-mu-pop{position:fixed;z-index:31;width:330px;max-width:calc(100vw - 24px);padding:14px;box-sizing:border-box;',
    ' background:rgba(12,13,20,.94);border:1px solid rgba(255,255,255,.1);border-radius:14px;color:#c9cede;',
    ' font:12.5px/1.45 Inter,system-ui,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.55);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}',
    '.uas-mu-pop[hidden]{display:block!important;visibility:hidden;pointer-events:none}',   /* hidden, not removed: the music keeps playing */
    '.uas-mu-pop h4{margin:0 0 2px;font:600 13.5px Inter,system-ui,sans-serif;color:#e9ecf5}',
    '.uas-mu-pop p{margin:0 0 10px;color:#8d93a8}',
    '.uas-mu-pop a{color:#ffcf6e;text-decoration:none}.uas-mu-pop a:hover{text-decoration:underline}',
    '.uas-mu-pop .x{position:absolute;top:8px;right:10px;border:0;background:none;color:#8d93a8;font-size:16px;cursor:pointer;padding:2px 6px}',
    '.uas-mu-pop .x:hover{color:#e9ecf5}',
    '.uas-mu-pop .frame{border-radius:12px;overflow:hidden;background:#181818;height:352px}',
    '.uas-mu-pop iframe{display:block;position:static;inset:auto;width:100%;height:352px;border:0;background:none}',
    '.uas-mu-pop .links{margin-top:10px;display:flex;justify-content:space-between;font-size:12px}',
    '@media (max-width:760px),(max-height:620px){.uas-mu-ladder{top:auto;bottom:14px;right:auto;left:50%;transform:translateX(-50%);width:auto}',
    ' .uas-mu-pop .frame,.uas-mu-pop iframe{height:152px}}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'uas-mu-btn';
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.title = 'Soundtrack: First Time Again by Jacob Thompson';
  btn.innerHTML = '<span class="n">♪</span>Soundtrack';

  var pop = document.createElement('div');
  pop.className = 'uas-mu-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Soundtrack');
  pop.hidden = true;
  pop.innerHTML =
    '<button class="x" type="button" aria-label="Close">×</button>' +
    '<h4>First Time Again</h4>' +
    '<p>Solo piano by Jacob Thompson, who made these maps. Put it on while you explore.</p>' +
    '<div class="frame"></div>' +
    '<div class="links"><a href="' + SPOTIFY + '" target="_blank" rel="noopener">Open in Spotify ↗</a>' +
    '<a href="' + SITE + '" target="_blank" rel="noopener">iamjacob.ca ↗</a></div>';

  function mount() {
    if (place === 'header') {
      var home = document.querySelector('a.homelink');
      if (!home) { place = 'corner'; return mount(); }
      btn.classList.add('uas-mu-header');
      home.insertAdjacentElement('afterend', btn);
    } else {
      btn.classList.add('uas-mu-fixed', place === 'ladder' ? 'uas-mu-ladder' : 'uas-mu-corner');
      if (place === 'ladder') {                // sit just under the ladder, whatever its height
        var lad = document.getElementById('ladder');
        if (lad) { var fit = function () { var r = lad.getBoundingClientRect(); if (r.height) { btn.style.top = (r.bottom + 8) + 'px'; btn.style.width = r.width + 'px'; } else btn.style.top = ''; };
          fit(); addEventListener('resize', fit); }
      }
      document.body.appendChild(btn);
    }
    document.body.appendChild(pop);
  }

  function position() {
    var r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, m = 12;
    var left = Math.min(Math.max(m, r.right - w), innerWidth - w - m);
    if (place === 'header') left = Math.min(Math.max(m, r.left), innerWidth - w - m);
    var top = r.bottom + 8;
    if (top + h > innerHeight - m) top = Math.max(m, r.top - h - 8);
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  }

  var loaded = false;
  function open() {
    if (!loaded) {
      loaded = true;
      var f = document.createElement('iframe');
      f.src = EMBED_SRC; f.title = 'First Time Again by Jacob Thompson on Spotify';
      f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'; f.loading = 'eager';
      pop.querySelector('.frame').appendChild(f);
    }
    pop.hidden = false; btn.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); position();
  }
  function close() { pop.hidden = true; btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }

  btn.addEventListener('click', function (e) { e.stopPropagation(); pop.hidden ? open() : close(); });
  pop.querySelector('.x').addEventListener('click', close);
  pop.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  pop.addEventListener('wheel', function (e) { e.stopPropagation(); }, { passive: true });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) close(); });
  addEventListener('resize', function () { if (!pop.hidden) position(); });
  // Spotify's player reports play/pause; use it to pulse the note while music is playing
  addEventListener('message', function (e) {
    if (e.origin !== 'https://open.spotify.com' || !e.data) return;
    var d = e.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_) { return; } }
    if (d && d.type === 'playback_update' && d.payload) btn.classList.toggle('playing', !d.payload.isPaused);
  });

  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();

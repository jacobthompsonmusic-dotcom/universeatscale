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
    /* invitation: a soft gold glow that breathes on arrival, until the note is first opened (or after ~40 s) */
    '.uas-mu-btn.invite{color:#f3e6c8;border-color:rgba(255,207,110,.55);animation:uasglow 2.8s ease-in-out infinite}',
    '.uas-mu-btn.invite .n{text-shadow:0 0 8px rgba(255,207,110,.9)}',
    '@keyframes uasglow{0%,100%{box-shadow:0 0 0 0 rgba(255,207,110,0),0 0 6px rgba(255,207,110,.18)}50%{box-shadow:0 0 0 3px rgba(255,207,110,.14),0 0 22px rgba(255,207,110,.5)}}',
    '@media (prefers-reduced-motion:reduce){.uas-mu-btn.invite{animation:none;box-shadow:0 0 14px rgba(255,207,110,.35)}}',
    '.uas-mu-btn.playing .n{animation:uasmu 1.6s ease-in-out infinite}',
    '@keyframes uasmu{50%{opacity:.35}}',
    '.uas-mu-fixed{position:fixed;z-index:30}',
    '.uas-mu-ladder{top:262px;right:16px;width:130px;text-align:center}',
    '.uas-mu-corner{right:18px;bottom:18px}',
    '.uas-mu-header{border:0;background:none;backdrop-filter:none;-webkit-backdrop-filter:none;padding:0 0 0 10px;font-size:12px}',
    '.uas-mu-header:hover,.uas-mu-header.open{border:0}',
    '.uas-mu-pop{position:fixed;z-index:31;width:340px;max-width:calc(100vw - 24px);padding:6px;box-sizing:border-box;',
    ' background:rgba(12,13,20,.94);border:1px solid rgba(255,255,255,.1);border-radius:14px;color:#c9cede;',
    ' font:12.5px/1.45 Inter,system-ui,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.55);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}',
    '.uas-mu-pop[hidden]{display:block!important;visibility:hidden;pointer-events:none}',   /* hidden, not removed: the music keeps playing */
    '.uas-mu-pop h4{margin:0 0 2px;font:600 13.5px Inter,system-ui,sans-serif;color:#e9ecf5}',
    '.uas-mu-pop p{margin:0 0 10px;color:#8d93a8}',
    '.uas-mu-pop a{color:#ffcf6e;text-decoration:none}.uas-mu-pop a:hover{text-decoration:underline}',
    '.uas-mu-pop .x{position:absolute;top:8px;right:10px;border:0;background:none;color:#8d93a8;font-size:16px;cursor:pointer;padding:2px 6px}',
    '.uas-mu-pop .x:hover{color:#e9ecf5}',
    '.uas-mu-pop .frame{border-radius:12px;overflow:hidden;background:#181818;height:80px}',
    '.uas-mu-pop iframe{display:block!important;position:static;inset:auto;width:100%;height:80px;border:0;background:none}',
    '.uas-mu-pop .frame.off{height:auto;padding:12px 10px;text-align:center;display:flex;flex-direction:column;gap:6px}',
    '.uas-mu-pop .frame.off a{font-weight:600;font-size:13.5px}.uas-mu-pop .frame.off span{color:#8d93a8;font-size:11.5px}',
    '.uas-mu-pop .links{margin:5px 6px 1px;display:flex;justify-content:space-between;font-size:11px}',
    '@media (max-width:760px),(max-height:620px){.uas-mu-ladder{top:auto;bottom:14px;right:auto;left:50%;transform:translateX(-50%);width:auto}}'
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
    var seen = false; try { seen = localStorage.getItem('uas-soundtrack-opened') === '1'; } catch (_) {}
    if (!seen) { btn.classList.add('invite'); setTimeout(function () { btn.classList.remove('invite'); }, 40000); }
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
    btn.classList.remove('invite'); try { localStorage.setItem('uas-soundtrack-opened', '1'); } catch (_) {}
    if (!loaded) {
      loaded = true;
      // Spotify's player only runs on the real site; previews (e.g. the Claude artifact) block outside players, so show a link there
      if (!/(^|\.)universeatscale\.com$|\.github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname)) {
        var fr = pop.querySelector('.frame'); fr.classList.add('off');
        fr.innerHTML = '<a href="' + SPOTIFY + '" target="_blank" rel="noopener">▶ Listen on Spotify</a><span>The built-in player appears on universeatscale.com</span>';
        pop.hidden = false; btn.classList.add('open'); position(); return;
      }
      startPlayer(pop.querySelector('.frame'));
    }
    pop.hidden = false; btn.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); position();
  }
  // The album in Spotify's player, starting on "The Last Time" and looping round the whole album for as long as the visitor leaves it playing.
  // Uses Spotify's iFrame API: each track is loaded in turn, and when one ends the next one starts.
  var ORDER = ['1zpn2Yzesj7KiJyhYtpeB9', '4NpcCuM3yeyeHqxeR1Hvgy', '7yfLDlMZSLsICflCIsAqTN', '22gfwWPKtsDVZhUz6gmWs7',   // The Last Time, Sacre Coeur in Winter, Three Dreams of a Lotus Garden, Accelerando,
               '6qxA5xihjqGV2o2BwDUOxc', '0A1rm66PkmAKY9TuVSpf0j'];                                                      // Trespasses, Nine Lives
  function startPlayer(frame) {
    var host = document.createElement('div'); frame.appendChild(host);
    var fallback = setTimeout(function () {                // if the API can't load, fall back to the plain album player
      if (frame.querySelector('iframe')) return;
      var f = document.createElement('iframe'); f.src = EMBED_SRC; f.title = 'First Time Again by Jacob Thompson on Spotify';
      f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'; frame.appendChild(f);
    }, 6000);
    window.onSpotifyIframeApiReady = function (API) {
      API.createController(host, { uri: 'spotify:track:' + ORDER[0], width: '100%', height: 80 }, function (ctl) {
        clearTimeout(fallback); window.__uasPlayer = ctl;
        var i = 0, advancing = false, wantPlay = false, last = { position: 0, duration: 0, playing: false };
        function next() {
          if (advancing) return; advancing = true; wantPlay = true;
          i = (i + 1) % ORDER.length; ctl.loadUri('spotify:track:' + ORDER[i]);
        }
        ctl.addListener('ready', function () { if (wantPlay) { wantPlay = false; ctl.play(); } advancing = false; });
        ctl.addListener('playback_update', function (e) {
          var d = e.data || {}, pos = d.position || 0, dur = d.duration || 0;
          btn.classList.toggle('playing', !d.isPaused);
          // the track has ended: it reached its end, or it stopped right after being near the end
          if (dur > 0 && (pos >= dur - 300 || (d.isPaused && last.playing && last.duration === dur && last.position >= dur - 1500))) next();
          last = { position: pos, duration: dur, playing: !d.isPaused };
        });
      });
    };
    var sc = document.createElement('script'); sc.src = 'https://open.spotify.com/embed/iframe-api/v1'; sc.async = true; document.head.appendChild(sc);
  }
  function close() { pop.hidden = true; btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }

  btn.addEventListener('click', function (e) { e.stopPropagation(); pop.hidden ? open() : close(); });
  document.addEventListener('pointerdown', function (e) { if (!pop.hidden && e.target !== btn && !btn.contains(e.target)) close(); });
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

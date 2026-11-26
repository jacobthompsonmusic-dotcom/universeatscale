/* Universe at Scale — soundtrack note.
   A small glowing "♪" note in a corner that opens Jacob Thompson's album "First Time Again" in Spotify's own player.
   Nothing plays and nothing loads from Spotify until the visitor opens the note and presses play.
   Usage: <script src="../music/music.js" data-place="ladder|corner|header" defer></script>
     ladder  — under the scale ladder (joined page)
     corner  — fixed, bottom-right (home page)
     info    — top right, just under the object card when one is open (standalone map pages; skipped when embedded)
   It always stays on screen: no menu folds it away. */
(function () {
  var ALBUM = '5NK09eF6jO8AHI5NAiuBzL';
  var SPOTIFY = 'https://open.spotify.com/album/' + ALBUM;
  var EMBED_SRC = 'https://open.spotify.com/embed/album/' + ALBUM + '?utm_source=universeatscale&theme=0';
  var SITE = 'https://iamjacob.ca';
  var me = document.currentScript;
  var place = (me && me.getAttribute('data-place')) || 'corner';
  var embedded = window.name === 'uas-embed' || /[?&]embed=1/.test(location.search);
  // the lowest of the panels stacked in the top right (the object card, the sky view's zodiac wheel), if any is showing
  function lowestCard() {
    var best = null;
    // also the intro/search panel when it stretches across to the right (phones), and only panels hung from the top (on phones the card sits at the bottom)
    ['info', 'zodwheel', 'top'].forEach(function (id) { var e = document.getElementById(id); if (!e || getComputedStyle(e).display === 'none') return;
      var r = e.getBoundingClientRect(); if (!r.height || r.top > 140) return;   // hung from the top edge only
      if (id === 'top' && r.right < innerWidth - 200) return;
      if (!best || r.bottom > best.bottom) best = { top: r.top, bottom: r.bottom, left: r.left, right: id === 'top' ? innerWidth - 16 : r.right }; });
    return best;
  }
  if (embedded) {                             // the joined page shows its own note, so the music keeps playing across the hand-over;
    var lastR = null;                         // tell it where this map's object card is, so the note can sit under it
    setInterval(function () {
      var r = lowestCard(), s = r ? [r.top, r.bottom, r.left, r.right].map(Math.round).join(',') : '';
      if (s !== lastR) { lastR = s; try { parent.postMessage({ src: 'uas-info', r: s }, '*'); } catch (_) {} }
    }, 200);
    return;
  }

  var css = [
    '.uas-mu-btn{font:italic 12.5px "IM Fell English",Georgia,serif;color:#8d93a8;background:rgba(12,13,20,.78);border:1px solid rgba(255,255,255,.09);',
    ' border-radius:999px;padding:7px 10px;cursor:pointer;white-space:nowrap;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:color .15s,border-color .15s}',
    '.uas-mu-btn:hover,.uas-mu-btn:focus-visible,.uas-mu-btn.open{color:#e9ecf5;border-color:rgba(255,207,110,.45);outline:none}',
    '.uas-mu-btn .n{color:#ffcf6e;font:15px/1 Georgia,serif;display:inline-block;width:1em;text-align:center}',
    /* open: a small × slides in after the word, saying a second press closes the player */
    '.uas-mu-btn .x{display:inline-block;width:0;margin-left:0;opacity:0;overflow:hidden;vertical-align:-1px;font:13px/1 Georgia,serif;color:#ffcf6e;transition:width .18s,margin .18s,opacity .18s}',
    '.uas-mu-btn.open .x{width:.75em;margin-left:7px;opacity:.9}',
    /* invitation: a soft gold glow that breathes on arrival, every visit, until the note is opened */
    '.uas-mu-btn.invite{color:#e9dfc6;border-color:rgba(255,207,110,.38);animation:uasglow 3.6s ease-in-out infinite}',
    '.uas-mu-btn.invite .n{text-shadow:0 0 6px rgba(255,207,110,.45)}',
    '@keyframes uasglow{0%,100%{box-shadow:0 0 5px rgba(255,207,110,.1)}50%{box-shadow:0 0 12px rgba(255,207,110,.28)}}',
    /* arrival: a few bright pulses first, so people notice it, then the soft breathing */
    '.uas-mu-btn.invite.arrive{animation:uasarrive 2.2s ease-in-out 4,uasglow 3.6s ease-in-out 8.8s infinite}',
    '.uas-mu-btn.invite.arrive .n{animation:uasarriven 2.2s ease-in-out 4}',
    '@keyframes uasarrive{0%,100%{box-shadow:0 0 6px rgba(255,207,110,.15)}50%{box-shadow:0 0 26px 5px rgba(255,207,110,.7);border-color:rgba(255,207,110,.9)}}',
    '@keyframes uasarriven{50%{text-shadow:0 0 12px rgba(255,207,110,1)}}',
    '@media (prefers-reduced-motion:reduce){.uas-mu-btn.invite,.uas-mu-btn.invite.arrive{animation:none;box-shadow:0 0 8px rgba(255,207,110,.15)}}',
    '.uas-mu-btn.playing .n{animation:uasmu 1.6s ease-in-out infinite}',
    '@keyframes uasmu{50%{opacity:.35}}',
    '.uas-mu-fixed{position:fixed;z-index:30}',
    '.uas-mu-ladder{top:262px;right:16px;text-align:center}',
    '.uas-mu-corner{right:18px;bottom:18px}',
    '.uas-mu-header{border:0;background:none;backdrop-filter:none;-webkit-backdrop-filter:none;padding:0 0 0 10px;font-size:12px}',
    '.uas-mu-header:hover,.uas-mu-header.open{border:0}',
    '.uas-mu-pop{position:fixed;z-index:31;width:340px;max-width:calc(100vw - 24px);padding:6px;box-sizing:border-box;',
    ' background:rgba(12,13,20,.94);border:1px solid rgba(255,255,255,.1);border-radius:14px;color:#c9cede;',
    ' font:13.5px/1.45 "IM Fell English",Georgia,serif;box-shadow:0 18px 50px rgba(0,0,0,.55);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}',
    '.uas-mu-pop[hidden]{display:block!important;visibility:hidden;pointer-events:none}',   /* hidden, not removed: the music keeps playing */
    '.uas-mu-pop h4{margin:0 0 2px;font:italic 14.5px "IM Fell English",Georgia,serif;color:#e9ecf5}',
    '.uas-mu-pop p{margin:0 0 10px;color:#8d93a8}',
    '.uas-mu-pop a{color:#ffcf6e;text-decoration:none}.uas-mu-pop a:hover{text-decoration:underline}',
    '.uas-mu-pop .x{position:absolute;top:8px;right:10px;border:0;background:none;color:#8d93a8;font-size:16px;cursor:pointer;padding:2px 6px}',
    '.uas-mu-pop .x:hover{color:#e9ecf5}',
    '.uas-mu-pop .frame{border-radius:12px;overflow:hidden;background:#181818;height:80px}',
    '.uas-mu-pop iframe{display:block!important;position:static;inset:auto;width:100%;height:80px;border:0;background:none}',
    '.uas-mu-pop .frame.off{height:auto;padding:12px 10px;text-align:center;display:flex;flex-direction:column;gap:6px}',
    '.uas-mu-pop .frame.off a{font-weight:600;font-size:13.5px}.uas-mu-pop .frame.off span{color:#8d93a8;font-size:11.5px}',
    '.uas-mu-pop .links{margin:5px 6px 1px;display:flex;justify-content:space-between;font-size:11px}',
    '.uas-mu-info{top:16px;right:16px}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'uas-mu-btn';
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.title = 'Soundtrack: First Time Again by Jacob Thompson';
  btn.innerHTML = '<span class="n">♪</span><span class="x" aria-hidden="true">×</span>';   // just the glowing note: it says enough
  btn.setAttribute('aria-label', 'Soundtrack');

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
    if (place === 'header') place = 'info';   // (older pages)
    if (false) {
      var home = document.querySelector('a.homelink');
      if (!home) { place = 'corner'; return mount(); }
      btn.classList.add('uas-mu-header');
      home.insertAdjacentElement('afterend', btn);
    } else {
      btn.classList.add('uas-mu-fixed', place === 'ladder' ? 'uas-mu-ladder' : place === 'info' ? 'uas-mu-info' : 'uas-mu-corner');
      if (place === 'ladder' || place === 'info') {
        // under the open object card if there is one (on the joined page the maps report theirs), else under the ladder, else the top-right corner
        var lad = document.getElementById('ladder'), frameInfo = new Map();
        var cardRect = function () {
          if (place === 'info') return lowestCard();
          // the topmost map on show (the Solar System sits over the galaxy map), and its card if it has one open
          var top = null; [].forEach.call(document.querySelectorAll('iframe[name="uas-embed"]'), function (f) { var cs = getComputedStyle(f); if (+cs.opacity >= 0.5 && cs.visibility !== 'hidden') top = f; });
          var s = top && frameInfo.get(top.contentWindow); if (!s) return null;
          var a = s.split(',').map(Number); return { top: a[0], bottom: a[1], left: a[2], right: a[3] };
        };
        var fit = function () {
          var c = cardRect(), r = lad && lad.getBoundingClientRect();
          if (c && c.bottom + 44 < innerHeight) { btn.style.top = (c.bottom + 8) + 'px'; btn.style.right = Math.max(8, innerWidth - c.right) + 'px'; btn.style.width = ''; }
          else if (r && r.height) { btn.style.top = (r.bottom + 8) + 'px'; btn.style.right = Math.max(8, innerWidth - r.right) + 'px'; btn.style.width = ''; }
          else { btn.style.top = '16px'; btn.style.right = '16px'; btn.style.width = ''; }
          if (!pop.hidden) position();
        };
        addEventListener('message', function (e) { if (e.data && e.data.src === 'uas-info') { frameInfo.set(e.source, e.data.r); fit(); } });
        addEventListener('resize', fit); setInterval(fit, 200); setTimeout(fit, 0);
      }
      document.body.appendChild(btn);
    }
    document.body.appendChild(pop);
    btn.classList.add('invite', 'arrive');   // pulses brightly on arrival, then breathes softly every visit until it's opened
    window.UAS_MUSIC_ARRIVE = function () {   // the home page calls this when the welcome sign lifts, so the pulses happen in view
      if (!btn.classList.contains('invite')) return;
      btn.classList.remove('arrive'); void btn.offsetWidth; btn.classList.add('arrive');
    };
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
    btn.classList.remove('invite');
    if (!loaded) {
      loaded = true;
      // Spotify's player only runs on the real site; previews (e.g. the Claude artifact) block outside players, so show a link there
      if (!/(^|\.)universeatscale\.com$|\.github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname)) {
        var fr = pop.querySelector('.frame'); fr.classList.add('off');
        fr.innerHTML = '<a href="' + SPOTIFY + '" target="_blank" rel="noopener">▶ Listen on Spotify</a><span>The built-in player appears on universeatscale.com</span>';
        pop.hidden = false; btn.classList.add('open'); btn.title = 'Close the player'; position(); return;
      }
      startPlayer(pop.querySelector('.frame'));
    }
    pop.hidden = false; btn.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); btn.title = 'Close the player'; position();
  }
  // The album in Spotify's player, starting on "Trespasses" and looping round the whole album for as long as the visitor leaves it playing.
  // Uses Spotify's iFrame API: each track is loaded in turn, and when one ends the next one starts.
  var ORDER = ['6qxA5xihjqGV2o2BwDUOxc', '0A1rm66PkmAKY9TuVSpf0j', '1zpn2Yzesj7KiJyhYtpeB9', '4NpcCuM3yeyeHqxeR1Hvgy',   // Trespasses (opens), Nine Lives, The Last Time, Sacre Coeur in Winter,
               '7yfLDlMZSLsICflCIsAqTN', '22gfwWPKtsDVZhUz6gmWs7'];                                                      // Three Dreams of a Lotus Garden, Accelerando
  function startPlayer(frame, autoplay) {
    var host = document.createElement('div'); frame.appendChild(host);
    var fallback = setTimeout(function () {                // if the API can't load, fall back to the plain album player
      if (frame.querySelector('iframe')) return;
      var f = document.createElement('iframe'); f.src = EMBED_SRC; f.title = 'First Time Again by Jacob Thompson on Spotify';
      f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'; frame.appendChild(f);
    }, 6000);
    window.onSpotifyIframeApiReady = function (API) {
      API.createController(host, { uri: 'spotify:track:' + ORDER[0], width: '100%', height: 80 }, function (ctl) {
        clearTimeout(fallback); window.__uasPlayer = ctl;
        var i = 0, advancing = false, wantPlay = !!autoplay, last = { position: 0, duration: 0, playing: false };
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
  // the welcome page's 'Enter the universe' click starts the album (that click is the visitor's go-ahead for sound; browsers allow
  // nothing earlier). Signed in to Spotify: whole tracks; otherwise Spotify plays 30-second previews. The ♪ pulses while it plays.
  window.UAS_MUSIC_PLAY = function () {
    if (!/(^|\.)universeatscale\.com$|\.github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname)) return;
    if (!loaded) { loaded = true; btn.classList.remove('invite'); startPlayer(pop.querySelector('.frame'), true); }
    else if (window.__uasPlayer) window.__uasPlayer.play();
  };
  function close() { pop.hidden = true; btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.title = 'Soundtrack: First Time Again by Jacob Thompson'; }

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

def patch(P, pairs):
    s=open(P,encoding='utf-8').read()
    for old,new in pairs:
        assert s.count(old)==1,(P,s.count(old),old[:70]); s=s.replace(old,new)
    open(P,'w',encoding='utf-8').write(s)
patch('index.html',[
("  .plate:hover, .plate:focus-visible {","  .plate.wide { grid-column: 1 / -1; }\n  .plate.wide canvas { aspect-ratio: 32 / 9; }\n  .plate:hover, .plate:focus-visible {"),
("    .plates { grid-template-columns: 1fr; }\n  }","    .plates { grid-template-columns: 1fr; }\n    .plate.wide canvas { aspect-ratio: 16 / 9; }\n  }"),
("""  <main class="plates">
""","""  <main class="plates">
    <a class="plate wide" href="universe/index.html">
      <canvas id="p0" aria-hidden="true"></canvas>
      <div class="txt">
        <div class="meta"><b>The whole journey</b><span>Every scale · one zoom</span></div>
        <h2>From Earth to the Edge of the Universe</h2>
        <p>The Solar System and the galaxy map joined into one space. Start at Earth and keep scrolling out: the Moon, the planets, the Oort cloud, the nearest stars, the Milky Way, and on to the edge of everything we can see.</p>
        <ul class="facts">
          <li>Range&nbsp; <span>12,742 km → 93 billion light-years</span></li>
          <li>Sky&nbsp; <span>9,502 real stars · zodiac figures in true 3D</span></li>
        </ul>
        <span class="open">Start at Earth →</span>
      </div>
    </a>
"""),
("  // Plate I: top-down moon system\n","""  // The whole journey: rings a fixed factor apart, breathing out from Earth to the observable universe and back
  const rungs = ['Earth', 'Moon\\u2019s orbit', '', 'Inner planets', 'Outer planets', '', 'Oort cloud', 'Nearest stars', '', 'Milky Way', 'Local Group', 'Laniakea', 'Observable universe'];
  function plate0(c, t) {
    const { g, w, h } = c; const cx = w / 2, cy = h / 2, z = (rungs.length - 1.6) * (0.5 - 0.5 * Math.cos(t * 0.11));
    g.fillStyle = '#03040a'; g.fillRect(0, 0, w, h);
    for (const [x, y, b] of skyStars.slice(100, 260)) { g.fillStyle = `rgba(236,231,221,${0.08 + b * 0.4})`; g.fillRect(x * w, y * h, 1, 1); }
    g.font = '500 10.5px Inter, system-ui, sans-serif'; g.textAlign = 'center';
    rungs.forEach((name, i) => {
      const r = h * 0.2 * Math.pow(2.6, i - z); if (r < 3 || r > w) return;
      const a = Math.min(1, (r - 3) / 12) * Math.max(0, 1 - r / (w * 0.75));
      g.strokeStyle = `rgba(${i ? '236,231,221' : '120,170,255'},${(name ? 0.34 : 0.12) * a})`; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
      if (name && r > 22 && r < h * 0.62) { g.fillStyle = `rgba(240,181,106,${0.9 * a})`; g.fillText(name.toUpperCase(), cx, cy - r - 6); }
    });
    const sg = g.createRadialGradient(cx, cy, 0, cx, cy, 9); sg.addColorStop(0, 'rgba(210,230,255,1)'); sg.addColorStop(0.35, 'rgba(120,170,255,0.75)'); sg.addColorStop(1, 'rgba(90,140,255,0)');
    g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.fill();
  }

  // Plate I: top-down moon system
"""),
("const plates = [['p1', plate1],","const plates = [['p0', plate0], ['p1', plate1],"),
])
patch('sitemap.xml',[("  <url><loc>https://universeatscale.com/solar-system/</loc></url>","  <url><loc>https://universeatscale.com/universe/</loc></url>\n  <url><loc>https://universeatscale.com/solar-system/</loc></url>")])
patch('solar-system/index.html',[
("the Oort cloud and the way to the stars.</p>","""the Oort cloud and the way to the stars.<span class="solo"> Or take the <a href="../universe/index.html" style="color:#ffcf6e">whole journey</a>, from Earth out to the edge of the universe.</span></p>"""),
("  .lab.mark::before { display:none; }","  .lab.mark::before { display:none; }\n  body.embed .solo { display:none; }"),
])
patch('milky-way/index.html',[
("""<span class="embed-only"> Zoom in on the <b>Sun</b> and you drop straight into the Solar System.</span></p>""","""<span class="embed-only"> Zoom in on the <b>Sun</b> and you drop straight into the Solar System.</span><span class="solo"> Or take the <a href="../universe/index.html" style="color:#ffcf6e">whole journey</a>, starting at Earth.</span></p>"""),
("body.embed .embed-only { display: inline; }","body.embed .embed-only { display: inline; } body.embed .solo { display: none; }"),
])
print('ok')

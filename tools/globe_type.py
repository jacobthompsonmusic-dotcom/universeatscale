# "Old globe" lettering for the map pages: IM Fell English (Igino Marini's revival of the 17th-century Fell types, SIL OFL) —
# italic for place names, its small caps for headings, spaced roman capitals for big regions, in a parchment cream.
# Idempotent. usage: python3 tools/globe_type.py [root]   (default: the repo; tools/preview.sh copies the result)
import re, pathlib, sys
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent)
PAGES = ['universe/index.html', 'milky-way/index.html', 'solar-system/index.html', 'moons/index.html', 'giant-planets-3d/index.html']
LINK = 'https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap'
CSS = """<style id="globe-type">
  /* clean lining figures for read-outs (distances, dates, coordinates): digits come from a plain system face, letters stay in Fell */
  @font-face { font-family:"UAS Num"; src:local("Helvetica Neue"), local("HelveticaNeue"), local("Helvetica"), local("Arial"), local("Roboto");
    unicode-range:U+0030-0039, U+002C-002E, U+00B0, U+2212, U+2009, U+00A0; }
  :root { --text:#eee2c4; }
  body, button, input, select, textarea, .panel, #info, #legend, #top, #time { font-family:"IM Fell English", Georgia, serif !important; letter-spacing:0.01em; }
  h1, h2, h3, .title, #info-name, [class*=title] { font-family:"IM Fell English SC", "IM Fell English", Georgia, serif !important; font-weight:400 !important; letter-spacing:0.04em; }
  #info-facts dd, #readout, #readout *, #scale-label, #scale-txt, #time .date, #time .spd, #datepick input, .lab.nearstar small {
    font-family:"UAS Num", "IM Fell English", Georgia, serif !important; font-variant-numeric:tabular-nums; }
  .lab { color:#efe3c3 !important; }
  .lab.mark { font-style:normal !important; letter-spacing:0.22em !important; color:rgba(226,214,186,0.75) !important; }
  .lab.sun { color:#ffe2a0 !important; }
</style>
<script>document.fonts && document.fonts.ready.then(() => { dispatchEvent(new Event('resize')); });</script>"""
FAM = 'IM Fell English, Georgia, serif'   # unquoted (valid CSS), so it is safe inside any JS or HTML string
canvas = lambda m: f"{'' if m.group(3) else 'italic '}{float(m.group(2)) + 1.5:g}px{m.group(3) or ''} {FAM}"   # body text (with a line height) stays roman
for rel in PAGES:
    f = root / rel
    if not f.exists(): continue
    s = f.read_text()
    s = re.sub(r"(\d00 )?(\d+(?:\.\d+)?)px(/[\d.]+)? Inter,\s*(?:system-ui,\s*)?sans-serif", canvas, s)
    s = s.replace('"Space Grotesk", sans-serif', 'IM Fell English SC, Georgia, serif')
    s = re.sub(r'https://fonts\.googleapis\.com/css2\?family=Inter[^"]*', LINK, s)
    s = re.sub(r'<style id="globe-type">.*?</script>\n', '', s, flags=re.S)   # replace any older version of the block
    s = s.replace('</head>', CSS + '\n</head>', 1)
    f.write_text(s)
m = root / 'music/music.js'
if m.exists():
    s = m.read_text()
    s = re.sub(r"(\d00 )?(\d+(?:\.\d+)?)px(/[\d.]+)? Inter,system-ui,sans-serif", lambda k: f"{'' if k.group(3) else 'italic '}{float(k.group(2)) + 1:g}px{k.group(3) or ''} \"IM Fell English\",Georgia,serif", s)
    m.write_text(s)
print('globe lettering applied under', root)

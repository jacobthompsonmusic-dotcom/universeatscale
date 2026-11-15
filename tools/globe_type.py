# Sample of an "old globe" lettering style, applied only to the /preview/ copy (run after tools/preview.sh).
# IM Fell English (Igino Marini's revival of the 17th-century Fell types, OFL) in italic for place names, its small caps for headings.
import re, pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent / 'preview'
FONT = "'IM Fell English', Georgia, serif"
LINK = '<link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap" rel="stylesheet">'
CSS = """<style id="globe-type">
  :root { --text:#eee2c4; }
  body, button, input, select, textarea, .panel, #info, #legend, #top, #time { font-family:'IM Fell English', Georgia, serif !important; letter-spacing:0.01em; }
  h1, h2, h3, .title, #info-name, [class*=title] { font-family:'IM Fell English SC', 'IM Fell English', Georgia, serif !important; font-weight:400 !important; letter-spacing:0.04em; }
  .lab { color:#efe3c3 !important; }
  .lab.mark { font-style:normal !important; letter-spacing:0.22em !important; color:rgba(226,214,186,0.75) !important; }
  .lab.sun { color:#ffe2a0 !important; }
</style>
<script>document.fonts && document.fonts.ready.then(() => { dispatchEvent(new Event('resize')); });</script>"""
def canvas_font(m):
    size = float(m.group(2)) + 1.5
    caps = False
    return f"italic {size:g}px {FONT}"
for f in root.rglob('*.html'):
    s = f.read_text()
    s = re.sub(r"(\d00 )?(\d+(?:\.\d+)?)px Inter, sans-serif", canvas_font, s)
    s = s.replace('"Space Grotesk", sans-serif', "'IM Fell English SC', Georgia, serif").replace("Inter, sans-serif", FONT)
    s = s.replace('</head>', LINK + '\n' + CSS + '\n</head>', 1)
    f.write_text(s)
print('globe lettering applied to', root)

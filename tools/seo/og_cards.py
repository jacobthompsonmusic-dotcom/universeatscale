# Builds the 1200x630 social-preview cards in /og/ from clean screenshots.
# Screenshots: node tools/join/shot.js <path> /tmp/og/<name>-clean.png tools/seo/hide.json 10000 1200 630
# Fonts: Instrument Serif + IBM Plex Mono (npm @fontsource), woff2 -> ttf with fontTools (+brotli).
import sys
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/og'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'og'
FS = '/tmp/t/node_modules/@fontsource/'
for n, f in [('serif', 'instrument-serif/files/instrument-serif-latin-400-normal.woff2'),
             ('mono', 'ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')]:
    t = TTFont(FS + f); t.flavor = None; t.save(f'{SRC}/{n}.ttf')

cards = {
    'home': ('universe-clean', 'Universe at Scale', 'Interactive 3D maps of space, drawn to real scale', 300),
    'universe': ('universe-clean', 'From Earth to the Edge\nof the Universe', 'One continuous true-scale zoom', 300),
    'solar-system': ('solar-system-clean', 'The Solar System\nto Scale', 'Every planet at its real position today', 0),
    'milky-way': ('milky-way-clean', 'The Milky Way in 3D', '9,407 real stars · Gaia & Hipparcos', 200),
    'moons': ('moons-clean', 'Moons of the\nGiant Planets', 'Jupiter · Saturn · Uranus · Neptune', 240),
    'giant-planets-3d': ('giant-planets-3d-clean', 'Giant Planets in 3D', 'Rings and moons to scale', 0),
}
S = ImageFont.truetype(f'{SRC}/serif.ttf', 76)
M = ImageFont.truetype(f'{SRC}/mono.ttf', 20)
M2 = ImageFont.truetype(f'{SRC}/mono.ttf', 24)
for k, (src, title, sub, shift) in cards.items():
    im = Image.open(f'{SRC}/{src}.png').convert('RGB').resize((1200, 630))
    if shift:  # move the subject right so the title sits on empty sky
        bg = Image.new('RGB', (1200, 630), (3, 4, 10)); bg.paste(im, (shift, 0)); im = bg
    mask = Image.new('L', (1200, 630)); d = ImageDraw.Draw(mask)
    for x in range(1200):
        d.line([(x, 0), (x, 630)], fill=int(max(0, min(225, 255 * (1 - x / 760)))))
    im = Image.composite(Image.new('RGB', (1200, 630), (5, 6, 11)), im, mask)
    d = ImageDraw.Draw(im)
    d.text((64, 64), 'UNIVERSEATSCALE.COM', font=M, fill=(240, 181, 106))
    lines = title.split('\n'); y = 630 - 130 - len(lines) * 80
    for ln in lines:
        d.text((60, y), ln, font=S, fill=(236, 231, 221)); y += 80
    d.text((64, y + 18), sub, font=M2, fill=(160, 154, 144))
    im.save(f'{OUT}/{k}.jpg', quality=86, optimize=True)
print('ok')

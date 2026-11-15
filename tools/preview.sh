#!/bin/bash
# Copy the current working tree's site into /preview/ (served at https://universeatscale.com/preview/), for trying changes on a real
# GPU in Chrome before they replace the live pages. The copy is noindex, has Google Analytics switched off, and is skipped by robots.txt.
# usage: tools/preview.sh   (then commit + push; GitHub Pages takes ~1 min)
set -e
cd "$(dirname "$0")/.."
python3 tools/globe_type.py >/dev/null   # idempotent: keeps the map pages' globe lettering in place
rm -rf preview && mkdir preview
for d in index.html universe milky-way solar-system moons giant-planets-3d music shared og favicon.svg favicon.ico favicon-48.png apple-touch-icon.png; do cp -r "$d" preview/; done
find preview -name '*.html' -print0 | xargs -0 sed -i \
  -e 's#!/(^|\\.)universeatscale\\.com$/.test(location.hostname)#true#' \
  -e 's#<head>#<head><meta name="robots" content="noindex, nofollow">#'
echo "<!-- preview built $(date -u +%FT%TZ) from $(git rev-parse --short HEAD) -->" >> preview/index.html
echo "preview/ rebuilt"

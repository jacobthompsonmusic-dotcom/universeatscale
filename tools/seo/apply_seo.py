# Idempotent SEO head block for every page: title, description, canonical, Open Graph,
# Twitter card, favicon, theme colour and JSON-LD. Re-run after editing PAGES.
# usage: python3 tools/seo/apply_seo.py   (from the repo root)
import json, re

SITE = 'https://universeatscale.com'
AUTHOR = {'@id': SITE + '/#jacob'}
WIKI = 'https://en.wikipedia.org/wiki/'
AUDIENCE = {'@type': 'Audience', 'audienceType': 'Anyone curious about space: astronomy and stargazing fans, astrology and zodiac fans, physics and science students, teachers, artists and scale-model makers'}

def thing(name, wiki):
    return {'@type': 'Thing', 'name': name, 'sameAs': WIKI + wiki}

PAGES = {
    'index.html': dict(
        path='/', og='home',
        title='Universe at Scale: 3D Solar System, Milky Way & Universe Maps',
        desc='Free interactive 3D maps of space at true scale. See where every planet is right now, explore 9,407 real Milky Way stars, and zoom from Earth to the edge of the universe.'),
    'universe/index.html': dict(
        path='/universe/', og='universe', crumb='From Earth to the Edge of the Universe',
        title='Zoom from Earth to the Edge of the Universe in 3D | Universe at Scale',
        desc='Scroll out from Earth past the Moon, the planets, the Oort cloud and the nearest stars, through the Milky Way to the edge of the observable universe, in one true-scale 3D zoom.',
        about=[thing('Observable universe', 'Observable_universe'), thing('Milky Way', 'Milky_Way'), thing('Solar System', 'Solar_System'), thing('Oort cloud', 'Oort_cloud'), thing('Local Group', 'Local_Group'), thing('Laniakea Supercluster', 'Laniakea_Supercluster')],
        keywords='scale of the universe, size of the universe, observable universe, zoom out from Earth, cosmic zoom, powers of ten, how big is space'),
    'solar-system/index.html': dict(
        path='/solar-system/', og='solar-system', crumb='The Solar System',
        title='Solar System to Scale in 3D: Where the Planets Are Right Now',
        desc='See the Sun, all 8 planets and 5 dwarf planets at their real positions today, from NASA JPL data. True-scale 3D: zoom from the whole solar system to a single moon. Free.',
        about=[thing('Solar System', 'Solar_System'), thing('Planet', 'Planet'), thing('Dwarf planet', 'Dwarf_planet'), thing('Zodiac', 'Zodiac'), thing('Earth', 'Earth'), thing('Pluto', 'Pluto')],
        keywords='solar system to scale, 3D solar system, where are the planets right now, planet positions today, solar system scale model, zodiac constellations, dwarf planets, Earth at night'),
    'milky-way/index.html': dict(
        path='/milky-way/', og='milky-way', crumb='The Milky Way in 3D',
        title='3D Milky Way Map: Real Stars, Nebulae & Black Hole | Universe at Scale',
        desc='Fly through a 3D map of the Milky Way: 9,407 real stars placed by Gaia and Hipparcos, nebulae, star clusters, a ray-traced Sagittarius A* black hole and the cosmic voids.',
        about=[thing('Milky Way', 'Milky_Way'), thing('Sagittarius A*', 'Sagittarius_A*'), thing('Gaia (spacecraft)', 'Gaia_(spacecraft)'), thing('Local Group', 'Local_Group'), thing('Void (astronomy)', 'Void_(astronomy)'), thing('Black hole', 'Black_hole')],
        keywords='Milky Way map, 3D galaxy map, real star positions, Gaia DR3, black hole simulation, Sagittarius A*, spiral arms, nebulae, cosmic voids, Local Group'),
    'moons/index.html': dict(
        path='/moons/', og='moons', crumb="The Giant Planets' Moon Systems",
        title='Moons of Jupiter, Saturn, Uranus & Neptune: Live Map | Universe at Scale',
        desc='Watch the moons of Jupiter, Saturn, Uranus and Neptune move live, with rings and orbits to scale. Io, Europa, Ganymede and Callisto shown at their real positions today.',
        about=[thing('Moons of Jupiter', 'Moons_of_Jupiter'), thing('Moons of Saturn', 'Moons_of_Saturn'), thing('Moons of Uranus', 'Moons_of_Uranus'), thing('Moons of Neptune', 'Moons_of_Neptune'), thing('Galilean moons', 'Galilean_moons')],
        keywords="Jupiter's moons today, Galilean moons positions, Saturn's moons, Saturn's rings, moons of Uranus, Triton, Io, Europa, Ganymede, Callisto"),
    'giant-planets-3d/index.html': dict(
        path='/giant-planets-3d/', og='giant-planets-3d', crumb='Giant Planets in 3D',
        title='Jupiter, Saturn, Uranus & Neptune in 3D: Moons & Rings to Scale',
        desc="Tilt and spin the moon systems of Jupiter, Saturn, Uranus and Neptune in 3D, with rings, moons and orbits to scale and the Milky Way across each planet's sky.",
        about=[thing('Jupiter', 'Jupiter'), thing('Saturn', 'Saturn'), thing('Uranus', 'Uranus'), thing('Neptune', 'Neptune'), thing('Rings of Saturn', 'Rings_of_Saturn')],
        keywords='Jupiter 3D, Saturn rings 3D, Uranus tilt, Neptune Triton, gas giants, ice giants, moons in 3D'),
}

FAQ = [
    ('Is the solar system really drawn to scale?',
     "Yes. Sizes and distances share one scale, so from far out the planets are far too small to see and dots mark where they are. Zoom in and each planet, ring and moon grows to its true size."),
    ('Where are the planets right now?',
     'The Solar System map opens at the current date and time, with every planet and dwarf planet placed from NASA JPL orbital elements. Press Now at any point to snap back to the present.'),
    ('How big is the observable universe?',
     'About 93 billion light-years across, a radius of roughly 46.5 billion light-years. That is bigger than the 13.8-billion-year age of the universe suggests because space kept expanding while the light was travelling to us.'),
    ('How far away is the nearest star?',
     'Proxima Centauri is 4.24 light-years away, about 268,000 times the distance from Earth to the Sun. In the joined map you can scroll out through the Oort cloud and watch it come into view.'),
    ('Which zodiac constellation is the Sun in today?',
     "Turn on Zodiac in the Solar System map to see the twelve zodiac constellations drawn between their real stars, with the Sun and planets in front of them. Because Earth's axis slowly wobbles, the Sun's real constellation often differs from the calendar sign, and each year it also crosses Ophiuchus, from about 29 November to 17 December."),
    ('Is Universe at Scale free?',
     'Yes. It is free, needs no account and runs in any modern browser with WebGL, on computers, tablets and phones.'),
    ('Where does the data come from?',
     'Planet and dwarf-planet orbits come from NASA JPL; star positions from the AT-HYG catalogue (Gaia DR3, with Hipparcos for the brightest stars); the distance to the galactic centre and the orbit of the star S2 from the GRAVITY collaboration; Earth imagery from Solar System Scope (CC BY 4.0), based on NASA Blue Marble and Black Marble.'),
]

MAPS = [('universe/', 'From Earth to the Edge of the Universe'), ('solar-system/', 'The Solar System'),
        ('milky-way/', 'The Milky Way in 3D'), ('moons/', "The Giant Planets' Moon Systems"),
        ('giant-planets-3d/', 'Giant Planets in 3D')]

def esc(s):
    return s.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')

def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>'

def graph(f, p):
    url = SITE + p['path']; img = f"{SITE}/og/{p['og']}.jpg"
    if f == 'index.html':
        return {'@context': 'https://schema.org', '@graph': [
            {'@type': 'WebSite', '@id': SITE + '/#website', 'url': SITE + '/', 'name': 'Universe at Scale',
             'description': p['desc'], 'inLanguage': 'en', 'publisher': AUTHOR, 'image': img},
            {'@type': 'Person', '@id': SITE + '/#jacob', 'name': 'Jacob Thompson', 'url': 'https://iamjacob.ca',
             'homeLocation': {'@type': 'Place', 'name': 'Ontario, Canada'}},
            {'@type': 'ItemList', 'name': 'Interactive maps', 'itemListElement': [
                {'@type': 'ListItem', 'position': i + 1, 'url': SITE + '/' + u, 'name': n} for i, (u, n) in enumerate(MAPS)]},
            {'@type': 'FAQPage', 'mainEntity': [
                {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in FAQ]},
        ]}
    return {'@context': 'https://schema.org', '@graph': [
        {'@type': 'WebApplication', '@id': url + '#app', 'name': p['crumb'], 'url': url, 'description': p['desc'],
         'image': img, 'applicationCategory': 'EducationalApplication', 'operatingSystem': 'Any (web browser)',
         'browserRequirements': 'Requires WebGL', 'isAccessibleForFree': True, 'inLanguage': 'en',
         'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'CAD'},
         'author': AUTHOR, 'isPartOf': {'@id': SITE + '/#website'}, 'about': p['about'],
         'keywords': p['keywords'], 'audience': AUDIENCE},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Universe at Scale', 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': p['crumb'], 'item': url}]},
    ]}

def block(f, p):
    url = SITE + p['path']; img = f"{SITE}/og/{p['og']}.jpg"; t = esc(p['title']); d = esc(p['desc'])
    rel = '' if f == 'index.html' else '../'
    return '\n'.join([
        '<!-- seo:start (generated by tools/seo/apply_seo.py) -->',
        f'<title>{t}</title>',
        f'<meta name="description" content="{d}">',
        f'<link rel="canonical" href="{url}">',
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        '<meta name="author" content="Jacob Thompson">',
        '<meta name="theme-color" content="#05060b">',
        f'<link rel="icon" href="{rel}favicon.svg" type="image/svg+xml">',
        f'<link rel="icon" href="{rel}favicon-48.png" sizes="48x48" type="image/png">',
        f'<link rel="apple-touch-icon" href="{rel}apple-touch-icon.png">',
        '<meta property="og:site_name" content="Universe at Scale">',
        '<meta property="og:type" content="website">',
        '<meta property="og:locale" content="en_CA">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:title" content="{t}">',
        f'<meta property="og:description" content="{d}">',
        f'<meta property="og:image" content="{img}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:image:alt" content="{esc(p.get("crumb", "Universe at Scale"))}, from Universe at Scale">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{t}">',
        f'<meta name="twitter:description" content="{d}">',
        f'<meta name="twitter:image" content="{img}">',
        ld(graph(f, p)),
        '<!-- seo:end -->'])

OLD = re.compile(r'\s*<(?:title>[^<]*</title|meta (?:name|property)="(?:description|og:[^"]+|twitter:[^"]+|robots|author|theme-color)"[^>]*|link rel="(?:canonical|icon|apple-touch-icon)"[^>]*)>')
for f, p in PAGES.items():
    s = open(f, encoding='utf-8').read()
    s = re.sub(r'\s*<!-- seo:start.*?<!-- seo:end -->', '', s, flags=re.S)
    head, rest = s.split('</head>', 1)
    head = OLD.sub('', head)
    head = head.replace('<meta name="viewport" content="width=device-width, initial-scale=1">',
                        '<meta name="viewport" content="width=device-width, initial-scale=1">\n' + block(f, p), 1)
    assert 'seo:start' in head, f
    open(f, 'w', encoding='utf-8').write(head + '</head>' + rest)
    print('ok', f)

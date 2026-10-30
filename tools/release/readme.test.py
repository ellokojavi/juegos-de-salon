#!/usr/bin/env python3
"""
What counts as a change for the README screenshots (D-51).
Run: python3 tools/release/readme.test.py

Tests the part of `tools/release/readme.py` that decides whether a change counts: version
stamping touched every `index.html` on each publish (C-11) and changes no screen, so it cannot
age the screenshots (D-51). Since D-205 the version is no longer in git, but the old commits the
screenshots look at still carry those stamps.
"""
import importlib.util, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('readme', ROOT / 'tools/release/readme.py')
readme = importlib.util.module_from_spec(spec)
spec.loader.exec_module(readme)

CASES = [
    # (what it is, diff, is it only a stamp?)
    ('the stylesheet re-stamped',
     '--- a/index.html\n+++ b/index.html\n'
     '-  <link rel="stylesheet" href="style.css?v=0.25.2">\n'
     '+  <link rel="stylesheet" href="style.css?v=0.25.3">', True),
    ('the version in the menu footer',
     '-  <p class="pie">v0.25.2 · hecho con cariño</p>\n'
     '+  <p class="pie">v0.25.3 · hecho con cariño</p>', True),
    ('the whole import map, with several modules',
     '-{"a.js": "a.js?v=0.25.2", "b.js": "b.js?v=0.25.2"}\n'
     '+{"a.js": "a.js?v=0.25.3", "b.js": "b.js?v=0.25.3"}', True),
    # The day the version left git (D-205): the import map went away whole and the stamps, without a number
    ('the version taken out of the pages',
     '-  <script type="importmap" id="importmap">{"imports": {"./a.js": "./a.js?v=0.98.1"}}</script>\n'
     '-  <link rel="stylesheet" href="style.css?v=0.98.1">\n'
     '+  <link rel="stylesheet" href="style.css">\n'
     '-  <meta property="og:image" content="https://x.cl/assets/og/menu.jpg?v=0.98.1">\n'
     '+  <meta property="og:image" content="https://x.cl/assets/og/menu.jpg">\n'
     '-  <p class="pie">v0.98.1 · hecho con cariño</p>\n'
     '+  <p class="pie">v0.0.0 · hecho con cariño</p>', True),
    # What is a change, even if the line carries a ?v= next to it
    ('a new module in the import map',
     '-{"a.js": "a.js?v=0.25.2"}\n'
     '+{"a.js": "a.js?v=0.25.3", "b.js": "b.js?v=0.25.3"}', False),
    ('text changed on the same line as the stamp',
     '-<p data-v="0.25.2">Toca para sacar carta</p>\n'
     '+<p data-v="0.25.3">Toca para dar vuelta la carta</p>', False),
    ('a new screen',
     '+  <section class="screen" id="screen-nueva"></section>', False),
    ('an empty diff', '', False),
    ('only images', 'Binary files a/x.png and b/x.png differ', False),
]

failures = 0
for name, diff, expected in CASES:
    got = readme.only_stamp(diff)
    if got != expected:
        failures += 1
        print(f'  ✗ {name}: returned {got} and {expected} was expected')

# The stamp recognizes the two forms set-version.py stamped, and no other loose version
assert readme.STAMP.search('href="a.css?v=1.2.3"'), 'does not recognize ?v='
assert readme.STAMP.search('v0.25.2 · Juegos de Salón'), 'does not recognize the footer one'
assert not readme.STAMP.search('la versión 1.2.3 del juego'), 'recognizes too much'

# The Layout tree is found even with prose between the heading and the block, and lists only the root
# (it used to look for "## Estructura" right before the block and the check never ran)
EXAMPLE = '## Layout\n\nThe root is not the site.\n\n```\npublic/   The site\n  index.html  Menu\ntools/\n```\n\n## Other\n'
assert readme.layout_tree(EXAMPLE) == ['public/', 'tools/'], readme.layout_tree(EXAMPLE)
assert readme.layout_tree('## Other\n\n```\npublic/\n```\n') == [], 'takes a block from another section'
assert 'public/' in readme.layout_tree((ROOT / 'README.md').read_text()), 'does not find the README tree'

# The generated-block marker, in English and in the Spanish of branches opened before D-316
for marker in ('generated', 'generado'):
    m = readme.MARKER.search(f'<!-- {marker}: games · x -->\nbody\n<!-- /{marker} -->')
    assert m and m.group(2) == 'games' and m.group(3) == 'body\n', marker

# An identical retake counts as fresh while the file keeps that hash (pattern captura-identica-atrasada:
# a byte-identical retake leaves no commit, and check kept flagging it as stale)
IMAGE = 'README.md'  # any tracked file serves: the hash is what matters
real = readme.sha256(ROOT / IMAGE)
assert readme.verified_date(IMAGE, {IMAGE: {'sha256': real, 'date': 4102444800}}) == 4102444800, 'ignores the record'
assert readme.verified_date(IMAGE, {IMAGE: {'sha256': '0' * 64, 'date': 4102444800}}) == 0, 'trusts a stale hash'
assert readme.verified_date(IMAGE, {}) == 0, 'invents a date'
assert readme.screenshot_date(IMAGE, {IMAGE: {'sha256': real, 'date': 4102444800}}) == 4102444800
assert readme.screenshot_date(IMAGE, {}) == readme.git_date([IMAGE])

# A retake that moved fewer than 0.5 % of the pixels keeps the committed PNG (#1037)
import io, tempfile
from PIL import Image
def png_bytes(im):
    b = io.BytesIO(); im.save(b, 'PNG'); return b.getvalue()
base = Image.new('RGB', (100, 100), 'white')
with tempfile.TemporaryDirectory() as d:
    shot = pathlib.Path(d) / 'shot.png'
    def retake(dots, size=(100, 100)):
        im = base.copy().resize(size)
        for i in range(dots):
            im.putpixel((i % size[0], i // size[0]), (0, 0, 0))
        shot.write_bytes(png_bytes(im))
        return readme.barely_changed(png_bytes(base), shot)
    assert retake(0), 'an identical retake counts as a change'
    assert retake(49), '49 of 10 000 pixels (0.49 %) count as a change'
    assert not retake(50), '0.5 % is a real change'
    assert not retake(0, (100, 101)), 'a new size is a real change'
    assert not readme.barely_changed(None, shot), 'a new screenshot counts as unchanged'

if failures:
    sys.exit(f'readme: {failures} case(s) wrong')
print(f'readme: {len(CASES)} "this is only a stamp" cases green')

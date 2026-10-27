# Run: python3 tools/release/set-version.test.py
# The module preloads get the same ?h= as the import map (without it the page would fetch each file twice),
# and each file's ?h= is a hash of its own content: changing one file changes only its URL (D-467)
import importlib.util, pathlib, re, tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('set_version', ROOT / 'tools/release/set-version.py')
sv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sv)

with tempfile.TemporaryDirectory() as d:
    site = pathlib.Path(d)
    (site / 'a.js').write_text('a')
    (site / 'b.js').write_text('b')
    (site / 's.css').write_text('body{}')
    (site / 'index.html').write_text('<head>\n  <link rel="stylesheet" href="s.css">\n  <link rel="modulepreload" href="a.js">\n'
                                     '</head><script type="module">import "./a.js";</script>')
    page = (site / 'index.html').read_text()
    sv.stamp(site, '1.2.3', 'K')
    html = (site / 'index.html').read_text()
    ha, hb, hs = sv.digest(site / 'a.js'), sv.digest(site / 'b.js'), sv.digest(site / 's.css')
    assert re.fullmatch(r'[0-9a-f]{8}', ha) and len({ha, hb}) == 2
    assert f'<link rel="modulepreload" href="a.js?h={ha}">' in html, html
    assert f'"./a.js": "./a.js?h={ha}"' in html and f'"./b.js": "./b.js?h={hb}"' in html, html
    assert f'href="s.css?h={hs}"' in html, html
    assert '<meta name="release" content="K">' in html and '?v=' not in html, html
    # Restamping is idempotent; a change to a.js changes only a.js's hash
    sv.stamp(site, '1.2.3', 'K')
    assert (site / 'index.html').read_text() == html
    (site / 'index.html').write_text(page)
    (site / 'a.js').write_text('a2')
    sv.stamp(site, '1.2.3', 'K2')
    after = (site / 'index.html').read_text()
    assert after.replace(sv.digest(site / 'a.js'), ha).replace('K2', 'K') == html, after
    assert f'"./b.js": "./b.js?h={hb}"' in after
    # A page with no screen has no stylesheet (/cup/recap/, D-423): the import map goes at the end of its head
    (site / 'x').mkdir()
    (site / 'x' / 'index.html').write_text('<head>\n  <title>x</title>\n</head><body><script type="module">import "../a.js";</script></body>')
    sv.stamp(site, '1.2.3', 'K')
    html = (site / 'x' / 'index.html').read_text()
    assert html.index('id="importmap"') < html.index('</head>') < html.index('type="module">'), html
    assert '"../a.js": "../a.js?h=' in html, html

# Every preload on the home page names a module that exists
home = (ROOT / 'public/index.html').read_text()
preloads = re.findall(r'<link rel="modulepreload" href="([^"]+)"', home)
assert preloads, 'the home page preloads One a Day (its card came in 1.4 s late without it)'
for p in preloads:
    assert (ROOT / 'public' / p).is_file(), f'public/index.html preloads {p}, which does not exist'
print(f'set-version: {len(preloads)} preloads · green')

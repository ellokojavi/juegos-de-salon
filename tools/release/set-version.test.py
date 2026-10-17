# Run: python3 tools/release/set-version.test.py
# The module preloads get the same ?v= as the import map: without it the page would fetch each file twice
import importlib.util, pathlib, re, tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('set_version', ROOT / 'tools/release/set-version.py')
sv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sv)

with tempfile.TemporaryDirectory() as d:
    site = pathlib.Path(d)
    (site / 'a.js').write_text('')
    (site / 'index.html').write_text('<head>\n  <link rel="stylesheet" href="s.css">\n  <link rel="modulepreload" href="a.js">\n'
                                     '</head><script type="module">import "./a.js";</script>')
    sv.stamp(site, '1.2.3', 'K')
    html = (site / 'index.html').read_text()
    assert '<link rel="modulepreload" href="a.js?v=K">' in html, html
    assert '"./a.js": "./a.js?v=K"' in html, html

# Every preload on the home page names a module that exists
home = (ROOT / 'public/index.html').read_text()
preloads = re.findall(r'<link rel="modulepreload" href="([^"]+)"', home)
assert preloads, 'the home page preloads One a Day (its card came in 1.4 s late without it)'
for p in preloads:
    assert (ROOT / 'public' / p).is_file(), f'public/index.html preloads {p}, which does not exist'
print(f'set-version: {len(preloads)} preloads · green')

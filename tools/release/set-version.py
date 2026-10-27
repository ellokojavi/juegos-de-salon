#!/usr/bin/env python3
"""
Stamps the version on the copy of the site that gets published, to avoid a mixed cache (new HTML
with old JS). `.github/workflows/publish.yml` runs it on every merge to main, on `_site/` (D-205):
the pages of `public/` in git carry no version, so two open PRs no longer collide on the fifty
`index.html` files that used to be re-stamped in each one.

- Writes a <script type="importmap"> in every page that loads modules, mapping ALL the site's JS
  modules (**/*.js, D-192) to the same path with ?h=<8 hex of the sha256 of that file> (D-467).
  Import maps also apply to nested imports (a module that imports another) and to dynamic import(),
  so a publish that changes one module invalidates only that module (and the pages' HTML).
- Adds ?h= of each file to the stylesheets, to the module preloads (`<link rel="modulepreload">`), to the site's classic scripts (`vigia.js`, D-251) and to the
  social card images (og:image, twitter:image), so a change of drawing does not get stuck in
  WhatsApp's cache (D-72).
- Writes `<meta name="release" content="KEY">` and puts the version number in the menu footer.

The number is the first entry of CHANGELOG.md (`## X.Y.Z — date`) bumped by each entry in
changelog/ not yet collected, in the order they reached main (D-300). The release KEY is that number
plus the commit (`0.98.1-09eb4db`), in the release meta: publish.yml checks it is live, and
`versionOf` (stats.js) reads its leading X.Y.Z. It no longer busts the cache: the content hashes do.

Whether the README and the cards are up to date is no longer asked here: the `tests` check of each
PR blocks it, and publish.yml runs it again before publishing (C-11, C-13, D-181).

Usage:
  python3 tools/release/set-version.py --site _site [--commit <sha>]   stamps that copy
  python3 tools/release/set-version.py --version                       prints X.Y.Z
"""
import re, sys, json, hashlib, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
CHANGELOG = ROOT / 'CHANGELOG.md'
OG = re.compile(r'(/assets/og/[^"?]+\.jpg)(\?[vh]=[^"]*)?"')


def version():
    """Today's (D-300): the first entry of the CHANGELOG (`## 0.98.1 — 2026-10-04`) bumped by the
    pending entries in changelog/, in the order they reached main. tools/release/changelog.mjs
    computes it, so there is a single count."""
    if not re.search(r'^## (\d+\.\d+\.\d+)\b', CHANGELOG.read_text(), re.M):
        sys.exit('CHANGELOG.md has no "## X.Y.Z — date" entry')
    r = subprocess.run(['node', str(ROOT / 'tools/release/changelog.mjs'), 'version'], cwd=ROOT, capture_output=True, text=True)
    if r.returncode or not re.fullmatch(r'\d+\.\d+\.\d+', r.stdout.strip()):
        sys.exit(f'changelog.mjs version failed: {r.stderr.strip() or r.stdout.strip()}')
    if r.stderr.strip():
        print(r.stderr.strip(), file=sys.stderr)
    return r.stdout.strip()


def modules(site):
    """All the site's JS modules (D-192): a new one gets in on its own, with no list to maintain."""
    return sorted(str(f.relative_to(site)) for f in site.rglob('*.js'))


def digest(file):
    """The cache key of one file (D-467): 8 hex of the sha256 of its bytes. A publish that changes one
    module changes only that module's URL, so a returning player downloads only what changed."""
    return hashlib.sha256(file.read_bytes()).hexdigest()[:8]


def stamp(site, number, key):
    site = pathlib.Path(site).resolve()
    mods = modules(site)
    hashes = {m: digest(site / m) for m in mods}
    meta = f'<meta name="release" content="{key}">'

    def hashed(page, url):
        """`url` (a page's href/src, relative or from the root) with ?h= of the file it names; as is if it names none."""
        target = (site / url.lstrip('/')) if url.startswith('/') else (page.parent / url)
        try:
            target = target.resolve()
            target.relative_to(site)
        except (OSError, ValueError):
            return url
        return f'{url}?h={digest(target)}' if target.is_file() else url

    pages = 0
    for path in sorted(site.rglob('index.html')):
        html = original = path.read_text()
        # The social cards are also in the bridge pages, which load no modules
        html = OG.sub(lambda m: f'{hashed(path, m.group(1))}"', html)
        if 'type="module"' in html:
            prefix = '../' * (len(path.relative_to(site).parts) - 1) or './'
            # Every module import is relative ("./x.js", "../assets/js/x.js") or an https URL, so it
            # resolves to a URL this map covers: a module's own hash is enough, even for nested imports
            imports = {f'{prefix}{m}': f'{prefix}{m}?h={hashes[m]}' for m in mods}
            block = '<script type="importmap" id="importmap">' + json.dumps({'imports': imports}, ensure_ascii=False) + '</script>'
            if 'id="importmap"' in html:
                html = re.sub(r'<script type="importmap" id="importmap">.*?</script>', lambda _: block, html, flags=re.S)
            else:
                # before the first stylesheet (and therefore before any module); a page with no
                # screen has none (/cup/recap/, D-423): then at the end of the head, before its modules
                if '  <link rel="stylesheet"' in html:
                    html = html.replace('  <link rel="stylesheet"', '  ' + block + '\n  <link rel="stylesheet"', 1)
                elif '</head>' in html and html.index('</head>') < html.index('type="module"'):
                    html = html.replace('</head>', '  ' + block + '\n</head>', 1)
                else:
                    sys.exit(f'{path}: it loads modules and has no stylesheet or head to put the import map before')
            # The release, which the URLs no longer carry: stats and the watchdog read its X.Y.Z, and
            # publish.yml checks it to know the new site is live
            html = re.sub(r'<meta name="release" content="[^"]*">', meta, html) if 'name="release"' in html else \
                html.replace(block, meta + '\n  ' + block, 1)
            html = re.sub(r'(<link rel="stylesheet" href=")([^"?]+)(\?[vh]=[^"]*)?"', lambda m: f'{m.group(1)}{hashed(path, m.group(2))}"', html)
            # The preloads are URLs, not specifiers: the import map does not reach them, and without
            # the same hash they would fetch a file the page then fetches again with it
            html = re.sub(r'(<link rel="modulepreload" href=")([^"?]+)(\?[vh]=[^"]*)?"', lambda m: f'{m.group(1)}{hashed(path, m.group(2))}"', html)
            # The site's classic scripts (the watchdog, D-251): the import map does not reach them
            html = re.sub(r'(<script src=")((?![a-z]+:|//)[^"?]+\.js)(\?[vh]=[^"]*)?"', lambda m: f'{m.group(1)}{hashed(path, m.group(2))}"', html)
            html = re.sub(r'v\d+\.\d+\.\d+ ·', f'v{number} ·', html)
            pages += 1
        if html != original:
            path.write_text(html)
    if not pages:
        sys.exit(f'{site}: no page loads modules; is it the site folder?')
    print(f'{site}: {pages} pages with an import map of {len(mods)} modules hashed by content · version {number} · release {key}')


def main(args):
    if args == ['--version']:
        print(version())
        return
    # `--sitio` is the name from before the switch to English (D-316): still accepted
    flag = next((f for f in ('--site', '--sitio') if f in args), None)
    if not flag or args.index(flag) + 1 >= len(args):
        sys.exit(__doc__ + '\nThe version is no longer stamped in public/ before committing (D-205): '
                 'write the entry in changelog/<branch>.md and publish.yml stamps at publish time (D-300).')
    site = pathlib.Path(args[args.index(flag) + 1]).resolve()
    if site == (ROOT / 'public').resolve():
        sys.exit('public/ is not stamped: it is what is in git (D-205). Copy the site and stamp the copy.')
    commit = args[args.index('--commit') + 1] if '--commit' in args else \
        subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    number = version()
    stamp(site, number, f'{number}-{commit[:7]}' if commit else number)


if __name__ == '__main__':
    main(sys.argv[1:])

#!/usr/bin/env python3
"""
Stamps the version on the copy of the site that gets published, to avoid a mixed cache (new HTML
with old JS). `.github/workflows/publish.yml` runs it on every merge to main, on `_site/` (D-205):
the pages of `public/` in git carry no version, so two open PRs no longer collide on the fifty
`index.html` files that used to be re-stamped in each one.

- Writes a <script type="importmap"> in every page that loads modules, mapping ALL the site's JS
  modules (**/*.js, D-192) to the same path with ?v=KEY. Import maps also apply to nested imports
  (a module that imports another) and to dynamic import().
- Adds ?v=KEY to the stylesheets, to the module preloads (`<link rel="modulepreload">`), to the site's classic scripts (`vigia.js`, D-251) and to the
  social card images (og:image, twitter:image), so a change of drawing does not get stuck in
  WhatsApp's cache (D-72).
- Puts the version number in the menu footer.

The number is the first entry of CHANGELOG.md (`## X.Y.Z — date`) bumped by each entry in
changelog/ not yet collected, in the order they reached main (D-300). The cache KEY is that number
plus the commit (`0.98.1-09eb4db`): every publish invalidates the cache even if someone merges
without bumping the version. `versionOf` (stats.js) still reads the leading X.Y.Z.

Whether the README and the cards are up to date is no longer asked here: the `tests` check of each
PR blocks it, and publish.yml runs it again before publishing (C-11, C-13, D-181).

Usage:
  python3 tools/release/set-version.py --site _site [--commit <sha>]   stamps that copy
  python3 tools/release/set-version.py --version                       prints X.Y.Z
"""
import re, sys, json, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
CHANGELOG = ROOT / 'CHANGELOG.md'
OG = re.compile(r'(/assets/og/[^"?]+\.jpg)(\?v=[^"]*)?"')


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


def stamp(site, number, key):
    mods = modules(site)
    pages = 0
    for path in sorted(site.rglob('index.html')):
        html = original = path.read_text()
        # The social cards are also in the bridge pages, which load no modules
        html = OG.sub(lambda m: f'{m.group(1)}?v={key}"', html)
        if 'type="module"' in html:
            prefix = '../' * (len(path.relative_to(site).parts) - 1) or './'
            imports = {f'{prefix}{m}': f'{prefix}{m}?v={key}' for m in mods}
            block = '<script type="importmap" id="importmap">' + json.dumps({'imports': imports}, ensure_ascii=False) + '</script>'
            if 'id="importmap"' in html:
                html = re.sub(r'<script type="importmap" id="importmap">.*?</script>', lambda _: block, html, flags=re.S)
            else:
                # before the first stylesheet (and therefore before any module)
                if '  <link rel="stylesheet"' not in html:
                    sys.exit(f'{path}: it loads modules and has no stylesheet to put the import map before')
                html = html.replace('  <link rel="stylesheet"', '  ' + block + '\n  <link rel="stylesheet"', 1)
            html = re.sub(r'(<link rel="stylesheet" href="[^"?]+)(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={key}"', html)
            # The preloads are URLs, not specifiers: the import map does not reach them, and without
            # the version they would fetch a file the page then fetches again with it
            html = re.sub(r'(<link rel="modulepreload" href="[^"?]+)(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={key}"', html)
            # The site's classic scripts (the watchdog, D-251): the import map does not reach them
            html = re.sub(r'(<script src="(?![a-z]+:|//)[^"?]+\.js)(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={key}"', html)
            html = re.sub(r'v\d+\.\d+\.\d+ ·', f'v{number} ·', html)
            pages += 1
        if html != original:
            path.write_text(html)
    if not pages:
        sys.exit(f'{site}: no page loads modules; is it the site folder?')
    print(f'{site}: {pages} pages with an import map of {len(mods)} modules · version {number} · cache {key}')


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

#!/usr/bin/env python3
"""
The README, up to date: blocks generated from the code, screenshots retaken by the browser.

  python3 tools/release/readme.py check        Did the README go stale? (the tests check runs it)
  python3 tools/release/readme.py update       Rewrites the README's generated blocks
  python3 tools/release/readme.py screenshots [section] [--offline]
                                       Retakes the screenshots with headless Chrome
  python3 tools/release/readme.py seal         "I already reviewed the README with these facts"

Why it exists: the README tells things the code knows —how many games there are, which
modes each one has, how many cards each theme brings, which tests exist— and shows
screenshots of screens that change. None of that warns when it goes stale. Here:

  1. What can be derived from the code is generated. Between the markers

         <!-- generated: games -->  ...  <!-- /generated -->

     nobody edits by hand: `update` rewrites it from `tools/release/facts.mjs`, which
     imports the real modules.

  2. What is prose —how it is played, why it is fun— is written by a person, so the
     tool does not touch it: it tells on it. `check` compares today's facts against
     those of the last seal (`docs/facts.json`) and fails naming what changed and which
     section has to be reread. When done, `seal` records it.

  3. The screenshots are retaken on their own: `docs/capturas.json` says which tools/e2e/
     script and which shot each image comes from, and `screenshots` runs the scripts and
     copies the PNGs to docs/screenshots/. The ones that depend on a Firebase room are
     marked `"red": true` and are skipped with --offline. A retake that comes out identical
     byte for byte leaves no commit, so `screenshots` records its hash and date in
     `docs/screenshots/verified.json`: while the file still has that hash, it counts as
     fresh from that date (otherwise `check` kept flagging it as stale forever).

The hook so this always happens and not when someone remembers: the `tests` check
runs `check` on every PR and before every publish (C-11, D-205), and goes red if
the README fell behind.
"""
import hashlib, json, os, re, shutil, socket, subprocess, sys, tempfile, time, pathlib
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parents[2]
README = ROOT / 'README.md'
CATALOG = ROOT / 'docs/capturas.json'
SEAL = ROOT / 'docs/facts.json'
#: Screenshots retaken identical: { image: { sha256, date } } (see point 3 above)
VERIFIED = ROOT / 'docs/screenshots/verified.json'
# With another session serving 8765, each one uses its own port: SITE_PORT=8770 (D-135)
PORT = int(os.environ.get('SITE_PORT') or os.environ.get('PUERTO_SITIO') or 8765)
# The Spanish marker (`generado`) is still read, for branches opened before the switch to English (D-316)
MARKER = re.compile(r'(<!-- (?:generated|generado): ([\w:-]+)[^>]*-->\n)(.*?)(<!-- /(?:generated|generado) -->)', re.S)


def facts():
    """The app's fact sheet, read from the real code."""
    out = subprocess.run(['node', str(ROOT / 'tools/release/facts.mjs')], cwd=ROOT,
                         capture_output=True, text=True)
    if out.returncode:
        sys.exit(f'could not read the app facts:\n{out.stderr.strip()}')
    return json.loads(out.stdout)


def catalog():
    return json.loads(CATALOG.read_text())


def anchor(name):
    """The anchor GitHub gives the heading '## 👑 Fourth King (Cuarto Rey)': the emoji goes
    but its space stays (hence the leading dash) and the parentheses disappear."""
    clean = ''.join(c for c in name.lower() if c.isalnum() or c in ' -_')
    return '#-' + re.sub(r'\s+', '-', clean.strip())


def game_title(g):
    """How the game's section is titled in the README: the English name and, in
    parentheses, the real one. The anchor comes from here too, so if the title changes
    the table's link changes and they never end up pointing to different places (D-78)."""
    en, es = g['name']['en'], g['name']['es']
    return f'{en} ({es})' if en != es else es


def without_emoji(text):
    """The mode's text without its emoji and without the clarification after the comma."""
    return re.sub(r'^[^\w¡¿]+', '', text).split(',')[0].strip()


def year(n):
    return f'{abs(n)} BC' if n < 0 else str(n)


# ------------------------------------------------------------- generated blocks

# The README is the project's public face and is in English (D-78). That is why the generated
# blocks come from the modules' `en`, not from `es`.
def block_games(F, C):
    rows = ['| Game | Players | Modes | Status |', '|---|---|---|---|']
    for g in F['games']:
        names = ' / '.join(dict.fromkeys([g['name']['en'], g['name']['es'], g['name']['pt']]))
        modes = ' · '.join(without_emoji(m['en']) for m in g['modes']) or 'One phone'
        # A game with available:false still works at its URL, but is not on the menu: say so
        # here and not only the version, or the README suggests it can be played from the home page (D-88).
        # Off the menu: "paused" if it was ever published (it has a version), "coming soon" if not yet (D-248)
        status = ('🧪 lab' if g.get('labs') else ('⏸ paused' if g['status'] else '🔜 coming soon') if not g['available']
                  else (g['status'] or '-'))
        rows.append(f"| {g['emoji']} [{names}]({anchor(game_title(g))}) | {g['players']} "
                    f"| {modes} | {status} |")
    # The Cup's games played standalone (D-142): one player, on its own page, no cup. The link
    # goes to the playable page, because they have no section of their own in the README.
    for m in F.get('standalone', []):
        names = ' / '.join(dict.fromkeys([m['name']['en'], m['name']['es'], m['name']['pt']]))
        # One in La Bodega (D-280, D-421) is off the menu and out of new cups, but its page still opens
        status = '🧪 lab' if m['labs'] else '📦 La Bodega' if m.get('bodega') else 'Also in The Cup'
        # One from the lab goes without a link: the lab is not announced (D-281)
        name = names if m['labs'] else f"[{names}](https://juegosdesalon.cl/{m['path']})"
        rows.append(f"| {m['emoji']} {name} | 1 "
                    f"| Play alone | {status} |")
    return '\n'.join(rows) + '\n'


def block_themes(F, C):
    rows = ['| Theme | Cards | Years | What it covers |', '|---|---|---|---|']
    for t in F['themes']:
        rows.append(f"| {t['emoji']} {t['name']['en']} | {t['cards']} | "
                    f"{year(t['from'])} to {year(t['to'])} | {t['hint']['en']} |")
    rows.append(f"| **Total** | **{sum(t['cards'] for t in F['themes'])}** | | |")
    return '\n'.join(rows) + '\n'


def block_languages(F, C):
    rows = ['| Español | English | Português | Deutsch |', '|---|---|---|---|',
            f"| {F['app']['es']} | {F['app']['en']} | {F['app']['pt']} | {F['app']['de']} |"]
    for g in F['games'] + F.get('standalone', []):
        rows.append(f"| {g['name']['es']} | {g['name']['en']} | {g['name']['pt']} | {g['name']['de']} |")
    return '\n'.join(rows) + '\n'


def block_tests(F, C):
    return '\n'.join(['```bash'] + [f'node {t}' for t in test_order(F['tests'])] + ['```']) + '\n'


def test_order(tests):
    """First the game engines, then the shared parts: it reads better."""
    engines = [t for t in tests if t.endswith('engine.test.mjs')]
    return engines + [t for t in tests if t not in engines]


# From the general to the particular: new documents fall at the end, where they are seen.
# Both spellings of each document, while the docs are being renamed to English (D-316).
DOC_ORDER = ['docs/CANONES.md', 'docs/CANONS.md', 'docs/REQUERIMIENTOS.md', 'docs/REQUIREMENTS.md',
             'docs/DECISIONES.md', 'docs/DECISIONS.md', 'docs/AGREGAR-JUEGO.md', 'docs/ADD-GAME.md',
             'docs/PANEL.md', 'tools/e2e/README.md', 'firebase/README.md']


def block_docs(F, C):
    def weight(d):
        if d['path'] in DOC_ORDER:
            return (0, DOC_ORDER.index(d['path']))
        if d['path'].startswith('docs/games/'):
            return (1, d['path'])
        return (2, d['path'] != 'CHANGELOG.md', d['path'])
    return '\n'.join(f"- [{d['title']}]({d['path']})" for d in sorted(F['documents'], key=weight)) + '\n'


def width(C, section):
    """At how many pixels the README shows that section's images."""
    return C['ancho']['portada'] if section == 'portada' else C['ancho']['galeria']


def block_screenshots(F, C, section):
    shots = [c for c in C['capturas'] if c['seccion'] == section]
    if not shots:
        return ''
    w = width(C, section)
    if section == 'portada':
        # The menu and, next to it, what the share button opens (D-253)
        return '<p align="center">' + '&nbsp;&nbsp;'.join(f'<img src="{c["imagen"]}" width="{w}" alt="{c["pie"]}">' for c in shots) + '</p>\n'
    rows = []
    for i in range(0, len(shots), 4):
        cells = [f'<td align="center"><img src="{c["imagen"]}" width="{w}" alt="{c["pie"]}">'
                 f'<br><sub>{c["pie"]}</sub></td>' for c in shots[i:i + 4]]
        cells += ['<td></td>'] * (4 - len(cells))
        rows.append('  <tr>\n' + '\n'.join('    ' + c for c in cells) + '\n  </tr>')
    return '<table>\n' + '\n'.join(rows) + '\n</table>\n'


BLOCKS = {'games': block_games, 'themes': block_themes, 'languages': block_languages,
          'tests': block_tests, 'docs': block_docs}


def generate(name, F, C):
    if name.startswith('screenshots:'):
        return block_screenshots(F, C, name.split(':', 1)[1])
    fn = BLOCKS.get(name)
    return fn(F, C) if fn else None


def readme_blocks():
    return [(m.group(2), m.group(3)) for m in MARKER.finditer(README.read_text())]


# ---------------------------------------------------------------------- update

def cmd_update():
    F, C = facts(), catalog()
    text = README.read_text()
    changed, unknown = [], []

    def replace(m):
        name, current = m.group(2), m.group(3)
        new = generate(name, F, C)
        if new is None:
            unknown.append(name)
            return m.group(0)
        if new != current:
            changed.append(name)
        return m.group(1) + new + m.group(4)

    text = MARKER.sub(replace, text)
    README.write_text(text)
    for d in unknown:
        print(f'  ERROR · <!-- generated: {d} --> nobody knows how to generate it')
    if changed:
        print('updated: ' + ', '.join(changed))
    else:
        print('the generated blocks were already up to date')
    print('\nWhat is left is prose, and no tool writes it:\n'
          '  [ ] The section of the game that changed: does it still tell what it does today?\n'
          '  [ ] python3 tools/release/readme.py screenshots <section>  if any screen changed\n'
          '  [ ] python3 tools/release/readme.py seal                   once you reread it')
    return 1 if unknown else 0


# ------------------------------------------------------------------------ seal

def cmd_seal():
    F = facts()
    SEAL.write_text(json.dumps(F, ensure_ascii=False, indent=2) + '\n')
    print(f'sealed: docs/facts.json with today\'s facts '
          f"({len(F['games'])} games, {len(F['themes'])} themes, v{F['version']})")
    return 0


# ----------------------------------------------------------------------- check

def differences(old, new, path=''):
    """The paths of the fact sheet that changed, with their before and after."""
    if isinstance(old, dict) and isinstance(new, dict):
        out = []
        for k in dict.fromkeys(list(old) + list(new)):
            out += differences(old.get(k), new.get(k), f'{path}.{k}' if path else k)
        return out
    if isinstance(old, list) and isinstance(new, list):
        if all(isinstance(x, dict) and 'id' in x for x in old + new):
            out = []
            for k in dict.fromkeys([x['id'] for x in old + new]):
                a = next((x for x in old if x['id'] == k), None)
                b = next((x for x in new if x['id'] == k), None)
                out += differences(a, b, f'{path}.{k}')
            return out
        if old != new:
            missing, extra = [x for x in old if x not in new], [x for x in new if x not in old]
            return [(path, summary(missing), summary(extra))]
        return []
    return [] if old == new else [(path, summary(old), summary(new))]


def summary(v):
    if isinstance(v, list):
        return ', '.join(summary(x) for x in v) if v else '—'
    if isinstance(v, dict):
        if 'name' in v and 'cards' in v:
            return f"{v['name']['es']} ({v['cards']} cards)"
        if 'name' in v:
            return v['name'].get('es', '')
        return v.get('es') or v.get('id') or json.dumps(v, ensure_ascii=False)[:60]
    return '—' if v is None else str(v)


def tell(path, before, now):
    """The change said the way a person would say it: appeared, disappeared or changed."""
    if before == '—':
        return f'appeared {path}: {now}'
    if now == '—':
        return f'disappeared {path}: {before}'
    return f'changed {path}: {before} → {now}'


SECTIONS = {
    'games': 'the game\'s section and the table at the top',
    'standalone': 'the games table, the home page and The Cup\'s section',
    'themes': 'the Timeline section (the themes are counted in the prose)',
    'languages': 'the Languages section', 'phrases': 'the Languages section',
    'app': 'the home page and the names table', 'modules': 'the Layout tree',
    'tests': 'the Running locally section',
    'e2e': 'the end-to-end tests (tools/e2e/README.md)',
    'documents': 'the Documentation index', 'screenshots': 'the screenshot galleries',
}


COMMITS_LOOKED_AT = 40   # cap on commits looked at backwards searching for a real one

#: The stamps set-version.py put in git until D-205: `?v=0.25.2` in the import map, the
#: stylesheets and the cards, and `v0.25.2 ·` in the menu footer. Today only the copy that gets
#: published is stamped, but the screenshots look at old commits.
STAMP = re.compile(r'\?v=\d+\.\d+\.\d+|v\d+\.\d+\.\d+ ·')
#: The whole import map line: the commit that took the version out of git deleted it (D-205)
IMPORT_MAP = re.compile(r'^\s*<script type="importmap" id="importmap">.*</script>\s*$')


def git(*args, paths=()):
    """A git command limited to those paths, with its output as text."""
    command = ['git', *args] + (['--', *paths] if paths else [])
    return subprocess.run(command, cwd=ROOT, capture_output=True, text=True).stdout


def only_stamp(diff):
    """
    Does that diff change nothing but the stamped version?

    The removed lines are compared against the added ones with the version number erased: if
    they come out equal, the only thing that happened was a publish. The import map line does
    not count: it is version machinery, and the new module that changes it shows in its own file.
    """
    plus, minus = [], []
    for line in diff.splitlines():
        if line.startswith(('+++', '---')):
            continue
        if IMPORT_MAP.match(line[1:]):
            continue
        if line.startswith('+'):
            plus.append(STAMP.sub('', line[1:]))
        elif line.startswith('-'):
            minus.append(STAMP.sub('', line[1:]))
    return bool(plus or minus) and sorted(plus) == sorted(minus)


def git_date(paths):
    """
    When any of those paths really changed for the last time (0 if never).

    Version stamping does not count: until D-205 `set-version.py` rewrote every
    `index.html` on each publish (C-11) and that changes no screen. Without this exception,
    publishing left the screenshots of every game "older than the code", including the ones
    nobody touched, and the warning stopped meaning anything (D-51).
    """
    paths = [p for p in paths if (ROOT / p).exists()]
    if not paths:
        return 0
    dirty = git('status', '--porcelain', paths=paths).strip()
    # A new uncommitted file is a real change; a modified one is looked at the same as a
    # commit, because it too may hold only a half-published stamp.
    if dirty and (any(l.startswith('??') for l in dirty.splitlines())
                  or not only_stamp(git('diff', 'HEAD', '-U0', paths=paths))):
        return 10 ** 12  # uncommitted: newer than any commit
    for line in git('log', f'-{COMMITS_LOOKED_AT}', '--format=%H %ct', paths=paths).splitlines():
        sha, date = line.split()
        if only_stamp(git('show', sha, '-U0', '--format=', paths=paths)):
            continue
        return int(date)
    return 0


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verified():
    return json.loads(VERIFIED.read_text()) if VERIFIED.exists() else {}


def verified_date(image, seen):
    """When that image was last retaken and came out identical (0 if never, or if it changed since)."""
    entry = seen.get(image)
    path = ROOT / image
    if not entry or not path.exists() or sha256(path) != entry.get('sha256'):
        return 0
    return int(entry.get('date', 0))


def screenshot_date(image, seen):
    """When that screenshot was last known to show the screen as it is: its commit or its identical retake."""
    return max(git_date([image]), verified_date(image, seen))


NUMBERS = {'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8}


def cmd_check():
    F, C = facts(), catalog()
    text = README.read_text()
    problems, warnings = [], []

    # 1. The generated blocks, up to date with the code
    expected = set(BLOCKS)
    expected |= {f'screenshots:{s}' for s in dict.fromkeys(c['seccion'] for c in C['capturas'])}
    present = dict(readme_blocks())
    for name in sorted(expected - set(present)):
        problems.append(f'the README is missing the block <!-- generated: {name} -->')
    for name, current in present.items():
        new = generate(name, F, C)
        if new is None:
            problems.append(f'<!-- generated: {name} --> nobody knows how to generate it')
        elif new != current:
            problems.append(f'the block "{name}" went stale  →  python3 tools/release/readme.py update')

    # 2. The facts, against the last seal: what changed asks for prose to be reread
    if not SEAL.exists():
        problems.append('docs/facts.json is missing  →  python3 tools/release/readme.py seal')
    else:
        for path, before, now in differences(json.loads(SEAL.read_text()), F):
            root = path.split('.')[0]
            if root == 'version':  # the version is the CHANGELOG's (D-205); the README does not quote it
                continue
            where = SECTIONS.get(root, 'the README')
            problems.append(f'{tell(path, before, now)}\n'
                            f'           reread {where}; then: python3 tools/release/readme.py seal')

    # 3. The screenshots: catalog, files and the scripts that take them
    in_catalog = {c['imagen'] for c in C['capturas']}
    for c in C['capturas']:
        if not (ROOT / c['imagen']).exists():
            problems.append(f"{c['imagen']} is in the catalog but does not exist  →  "
                            f"python3 tools/release/readme.py screenshots {c['seccion']}")
        script = C['guiones'].get(c['guion'])
        if not script:
            problems.append(f"{c['imagen']} says it comes from the script \"{c['guion']}\", which is not in the catalog")
        elif f"'{c['toma']}'" not in (ROOT / 'tools/e2e' / script['archivo']).read_text():
            problems.append(f"{script['archivo']} no longer takes the shot \"{c['toma']}\" that {c['imagen']} asks for")
    for png in sorted((ROOT / 'docs/screenshots').rglob('*.png')):
        rel = str(png.relative_to(ROOT))
        if rel not in in_catalog:
            warnings.append(f'{rel} is not used by the README nor in the catalog')

    # 4. Screenshots older than what they show
    sources = C['fuentes']
    seen = verified()
    for section in dict.fromkeys(c['seccion'] for c in C['capturas']):
        code = git_date(sources.get(section, []) + sources['comunes'])
        stale = [c['imagen'] for c in C['capturas'] if c['seccion'] == section
                 and (ROOT / c['imagen']).exists() and screenshot_date(c['imagen'], seen) < code]
        if stale:
            warnings.append(f'{section}: {len(stale)} screenshot(s) older than the code they show  →  '
                            f'python3 tools/release/readme.py screenshots {section}')

    # 5. README links and images that do not exist
    for path in set(re.findall(r'\]\(([^)#\s]+)\)', text)) | set(re.findall(r'<img src="([^"]+)"', text)):
        if path.startswith(('http', 'mailto:', '#')):
            continue
        if not (ROOT / path.split('#')[0]).exists():
            problems.append(f'the README links {path} and it does not exist')

    # 6. Numbers written as words, which no generated block watches
    counts = {'games': len(F['games']), 'decks': len(F['themes']),
              'themes': len(F['themes']), 'languages': len(F['languages'])}
    for word, thing in re.findall(r'\b(' + '|'.join(NUMBERS) + r')\s+(?:`?\w+\.js`?\s+of\s+)?(\w+)\b', text):
        if thing in counts and NUMBERS[word] != counts[thing]:
            warnings.append(f'the README says "{word} {thing}" and there are {counts[thing]}')

    # 7. The Layout tree, against what is in the repo root (only the unindented lines:
    # what goes inside each folder is the writer's call)
    listed = layout_tree(text)
    if listed:
        for path in listed:
            if not (ROOT / path).exists():
                warnings.append(f'the Layout tree names {path} and it does not exist')
        for f in sorted(ROOT.iterdir()):
            name = f.name + ('/' if f.is_dir() else '')
            if f.name.startswith('.') or f.name in ('README.md', 'arte-original', 'CNAME', 'CHANGELOG.md', 'CLAUDE.md',
                                                      'CONTRIBUTING.md', 'LICENSE'):
                continue
            if not any(l.startswith(name) or l.startswith(f.name) for l in listed):
                warnings.append(f'{name} does not appear in the Layout tree')

    for w in warnings:
        print(f'  warning · {w}')
    for p in problems:
        print(f'  ERROR · {p}')
    if not problems and not warnings:
        print(f"README up to date · {len(F['games'])} games, {len(F['themes'])} themes, "
              f"{len(C['capturas'])} screenshots")
    elif not problems:
        print('README up to date (the warnings above are judgment, not errors)')
    return 1 if problems else 0


def layout_tree(text):
    """What the tree in the Layout section lists at the repo root (the unindented lines).
    It used to look for "## Estructura" right before the block, and the README says "## Layout"
    with prose in between: the check never ran (D-307 and D-308 got in without joining the tree)."""
    tree = re.search(r'^## (?:Layout|Estructura)\n(?:(?!^## ).)*?^```\n(.*?)^```', text, re.S | re.M)
    if not tree:
        return []
    return [l.split()[0] for l in tree.group(1).splitlines() if l.strip() and not l[0].isspace()]


# ----------------------------------------------------------------- screenshots

def shrink(png, pixels):
    """The screenshot comes out of the browser at twice the pixels of the emulated phone and
    weighs half a megabyte. It is saved at twice the width the README shows it at and with a
    256-color palette (dithered, so gradients do not band): about 50 kB, which is what a repo
    whose screenshots are retaken often can take. With Pillow if present; otherwise with sips,
    which comes with the Mac."""
    try:
        from PIL import Image
    except ImportError:
        if shutil.which('sips'):
            subprocess.run(['sips', '--resampleWidth', str(pixels), str(png), '--out', str(png)],
                           capture_output=True)
        return
    im = Image.open(png).convert('RGB')
    if im.width > pixels:  # never enlarge: an old small screenshot would come out blurry
        im = im.resize((pixels, round(im.height * pixels / im.width)), Image.LANCZOS)
    im.quantize(colors=256, method=Image.Quantize.MEDIANCUT,
                dither=Image.Dither.FLOYDSTEINBERG).save(png, 'PNG', optimize=True)


def server_alive():
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', PORT)) == 0


def cmd_screenshots(section=None, offline=False):
    C = catalog()
    shots = [c for c in C['capturas'] if section in (None, c['seccion'])]
    if section and not shots:
        sys.exit(f'there are no screenshots of "{section}". There are: ' +
                 ', '.join(dict.fromkeys(c['seccion'] for c in C['capturas'])))
    scripts = dict.fromkeys(c['guion'] for c in shots)
    if offline:
        scripts = [g for g in scripts if not C['guiones'][g]['red']]
        shots = [c for c in shots if c['guion'] in scripts]

    server = None
    if not server_alive():
        server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'public'],
                                  cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(20):
            if server_alive():
                break
            time.sleep(0.2)
        print(f'own server on port {PORT}')

    new, same, failed = [], [], []
    seen = verified()
    # The scripts run TOGETHER at a time, each with its own Chrome ports (D-135): one after the
    # other, retaking every section took the sum of all; this way, little more than the longest
    # (cup/tournament.mjs). On a loaded machine, SCREENSHOTS_TOGETHER=1 goes back to one by one.
    together = max(1, int(os.environ.get('SCREENSHOTS_TOGETHER') or os.environ.get('CAPTURAS_JUNTOS') or 3))
    cdp_base = int(os.environ.get('CDP_PORT') or os.environ.get('PUERTO_CDP') or 9600)

    def run(i, g, tmp):
        script = C['guiones'][g]
        site = os.environ.get('SITE') or os.environ.get('SITIO') or f'http://localhost:{PORT}'
        port = str(cdp_base + 10 * i)
        # The new and the old names, while the e2e scripts switch to English (D-316)
        env = {**os.environ, 'SITE': site, 'SITIO': site, 'CDP_PORT': port, 'PUERTO_CDP': port}
        return subprocess.run(['node', f"tools/e2e/{script['archivo']}", tmp], cwd=ROOT, env=env,
                              stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

    try:
        with tempfile.TemporaryDirectory() as tmp_root, ThreadPoolExecutor(together) as pool:
            tmps = {g: pathlib.Path(tmp_root) / str(i) for i, g in enumerate(scripts)}
            for t in tmps.values():
                t.mkdir()
            # The longest first (the script's length serves as an approximation): if
            # cup/tournament.mjs starts last, everything waits for it to finish
            length = lambda g: (ROOT / 'tools/e2e' / C['guiones'][g]['archivo']).stat().st_size
            running = {g: pool.submit(run, i, g, str(tmps[g]))
                       for i, g in sorted(enumerate(scripts), key=lambda x: -length(x[1]))}
            for g in scripts:
                script = C['guiones'][g]
                r = running[g].result()
                tmp = tmps[g]
                print(f"\n▶ {script['archivo']}  ({script['que']}{', needs internet' if script['red'] else ''})")
                print(r.stdout, end='')
                if r.returncode:
                    failed.append(script['archivo'])
                    port = str(cdp_base + 10 * list(scripts).index(g))
                    print(f'  failed. If a Chrome was left alive: pkill -f "remote-debugging-port={port[:-1]}[{port[-1]}]"')
                    continue
                for c in [t for t in shots if t['guion'] == g]:
                    origin = tmp / f"{c['toma']}.png"
                    if not origin.exists():
                        failed.append(f"{script['archivo']} → {c['toma']}")
                        print(f"  no shot \"{c['toma']}\": the script did not get that far")
                        continue
                    target = ROOT / c['imagen']
                    before = target.read_bytes() if target.exists() else None
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(origin, target)
                    shrink(target, 2 * width(C, c['seccion']))
                    equal = before == target.read_bytes()
                    (same if equal else new).append(c['imagen'])
                    if equal:  # no commit will date it: the record does (D-51)
                        seen[c['imagen']] = {'sha256': sha256(target), 'date': int(time.time())}
                    else:      # its own commit dates it from now on
                        seen.pop(c['imagen'], None)
                    print(f"  {'=' if equal else '↻'} {c['imagen']}")
    finally:
        if server:
            server.terminate()
        if seen != verified():
            VERIFIED.write_text(json.dumps(dict(sorted(seen.items())), indent=2) + '\n')

    print(f'\n{len(new)} screenshot(s) changed, {len(same)} unchanged'
          + (f' (recorded in {VERIFIED.relative_to(ROOT)}: commit it)' if same else '')
          + (f', {len(failed)} not taken' if failed else ''))
    if new:
        print('Look at them before publishing (C-12: design problems are seen, not claimed):\n'
              '  git diff --stat docs/screenshots')
    return 1 if failed else 0


# ----------------------------------------------------------------------------

def main(argv):
    if len(argv) < 2:
        sys.exit(__doc__)
    cmd = argv[1]
    if cmd == 'check':
        sys.exit(cmd_check())
    elif cmd == 'update':
        sys.exit(cmd_update())
    elif cmd == 'seal':
        sys.exit(cmd_seal())
    elif cmd == 'screenshots':
        rest = [a for a in argv[2:] if a != '--offline']
        sys.exit(cmd_screenshots(rest[0] if rest else None, '--offline' in argv))
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main(sys.argv)

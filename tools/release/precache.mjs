#!/usr/bin/env node
/**
 * The offline precache list (D-538, docs/OFFLINE.md, PR 2): what the service worker stores so the
 * offline-capable games open with no signal. Run by publish.yml on the stamped copy, right after
 * set-version.py, and written as `precache.json` at the site's root:
 *
 *   { "release": "<the release meta>", "urls": ["./", "zip/", "assets/js/ui.js?h=1a2b3c4d", …] }
 *
 * - Pages: the home page, each offline-capable game's folder (offlineOk in games.js) and OFFLINE_PAGES (Uno al día). La Copa, the
 *   panel and the bridge pages stay out.
 * - Each of those games' files and its `reuses`, every shared module and stylesheet, the fonts, the
 *   icons and the manifests. JS and CSS carry the same `?h=` set-version.py puts on them (8 hex of
 *   the file's sha256, D-467), so the cached URL is exactly the one the page asks for.
 * - Never: music (the owner, 2026-11-07: silent offline until a song has played once), the link
 *   cards, the splash and season art, test files.
 *
 * Usage: node tools/release/precache.mjs --site _site [--out precache.json] [--print]
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Folders under assets/ that never go in: big, decorative, or not needed to play. */
export const NEVER = ['assets/music/', 'assets/og/', 'assets/splash/', 'assets/season/', 'assets/email/', 'assets/img/'];
/** Shared assets that always go in. */
export const SHARED = ['assets/js/', 'assets/css/', 'assets/fonts/', 'assets/icons/', 'assets/icon.svg',
  'manifest.webmanifest', 'manifest.en.webmanifest', 'manifest.pt.webmanifest'];
/** Relative references: `from './x.js'`, `import('./x.js')`, `new URL('./x', import.meta.url)`, `loadCss('./x.css')`, and a page's `href=` / `src=`. */
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*|\bnew URL\(\s*|\bloadCss\(\s*|\b(?:href|src)=\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
/** Pictures over this many bytes are not precached. */
export const BIG = 100 * 1024;
const SKIP = /\.(test\.mjs|test\.py|md)$|(^|\/)\./;

const digest = file => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8);

function files(site, rel) {
  const abs = join(site, rel);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return [rel];
  return readdirSync(abs).flatMap(f => files(site, rel.replace(/\/?$/, '/') + f));
}

/** The list for a site folder: `{ release, urls }`, sorted and without repeats. */
export async function precache(site) {
  site = resolve(site);
  const { GAMES, SUELTOS, offlineOk, OFFLINE_PAGES = [] } = await import(pathToFileURL(join(site, 'assets/js/games.js')).href);
  const games = [...GAMES, ...SUELTOS].filter(g => offlineOk(g) && g.path);
  const roots = [...SHARED, ...OFFLINE_PAGES, ...games.flatMap(g => [g.path, ...(g.reuses || [])])];
  const all = new Set(roots.flatMap(r => files(site, r)).map(f => f.split(sep).join('/')));
  // A game also plays what its modules import from elsewhere (a minigame's engine under cup/games/):
  // follow every relative import, static or import(), from what is already in
  const queue = [...all].filter(f => /\.(js|html)$/.test(f));
  while (queue.length) {
    const f = queue.pop();
    for (const [, spec] of readFileSync(join(site, f), 'utf8').matchAll(IMPORT)) {
      const dep = relative(site, resolve(join(site, f), '..', spec.split('?')[0])).split(sep).join('/');
      if (dep.startsWith('..') || all.has(dep) || !existsSync(join(site, dep)) || !statSync(join(site, dep)).isFile()) continue;
      all.add(dep);
      if (/\.(js|html)$/.test(dep)) queue.push(dep);
    }
  }
  const urls = new Set(['./', ...OFFLINE_PAGES, ...games.map(g => g.path)]);
  for (const f of [...all].sort()) {
    if (SKIP.test(f) || NEVER.some(n => f.startsWith(n))) continue;
    if (f.endsWith('/index.html')) continue;
    // Big pictures (Dónde's satellite tiles) are cached the first time they are seen, not up front
    if (/\.(webp|jpe?g|png|gif|mp4|mp3|ogg)$/.test(f) && statSync(join(site, f)).size > BIG) continue;   // a page is cached by its folder's URL, above
    urls.add(/\.(js|css)$/.test(f) ? `${f}?h=${digest(join(site, f))}` : f);
  }
  const home = readFileSync(join(site, 'index.html'), 'utf8');
  const release = (home.match(/<meta name="release" content="([^"]+)"/) || [])[1] || 'dev';
  return { release, urls: [...urls] };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const site = arg('--site') || 'public';
  const list = await precache(site);
  const bytes = list.urls.reduce((n, u) => {
    const f = join(site, u.split('?')[0].replace(/\/$/, '/index.html').replace(/^\.\/$/, 'index.html').replace(/^\.\/index\.html$/, 'index.html'));
    return n + (existsSync(f) && statSync(f).isFile() ? statSync(f).size : 0);
  }, 0);
  if (process.argv.includes('--print')) console.log(list.urls.join('\n'));
  writeFileSync(join(site, arg('--out') || 'precache.json'), JSON.stringify(list));
  console.log(`precache.json: ${list.urls.length} URLs, ${(bytes / 1048576).toFixed(1)} MB, release ${list.release}`);
}

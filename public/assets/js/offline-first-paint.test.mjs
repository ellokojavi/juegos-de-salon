// Run: node public/assets/js/offline-first-paint.test.mjs
// Offline mode (D-538) is the same on every page: each page that runs it (it loads instalable.js) and
// every game, old or new, paints its first frame in Candlelight when the phone is offline, with the
// inline script in its <head>. Tembleque and four lab pages were born without it (2026-11-23), so a
// game opened with no signal showed its normal colours first; this test stops the next one.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_GAMES } from './games.js';

const SITE = new URL('../../', import.meta.url).pathname;
const FIRST_PAINT = /classList\.add\('offline', 'offline-shell'\)/;

const pages = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith('.html')) pages.push(p);
  }
})(SITE);

let runs = 0;
for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  if (!html.includes('instalable')) continue;
  runs++;
  const head = html.slice(0, html.indexOf('</head>'));
  assert.match(head, FIRST_PAINT, `${p.slice(SITE.length)} runs offline mode but lacks the first-paint script in its <head> (copy it from public/zip/index.html)`);
}
assert.ok(runs > 30, `offline mode runs on the site's pages (${runs})`);

for (const g of ALL_GAMES) {
  if (!g.path) continue;
  const f = join(SITE, g.path, 'index.html');
  if (!existsSync(f)) continue;
  const html = readFileSync(f, 'utf8');
  assert.ok(html.includes('instalable'), `${g.id}: its page does not load instalable.js, so offline mode never runs there`);
  assert.match(html, FIRST_PAINT, `${g.id}: no first-paint script for offline mode`);
}
console.log(`✓ offline first paint: ${runs} pages and every game paint Candlelight from the first frame when offline`);

// Run: node tools/release/precache.test.mjs
// The offline precache list (D-538, PR 2): every offline-capable game can open from it, La Copa's own
// page and the heavy media stay out, and each JS/CSS URL carries the ?h= set-version.py gives it.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { precache, NEVER, BIG } from './precache.mjs';

const SITE = fileURLToPath(new URL('../../public/', import.meta.url));
const { ALL_GAMES, offlineOk } = await import(new URL('../../public/assets/js/games.js', import.meta.url));
const { release, urls } = await precache(SITE);
const set = new Set(urls);

assert.equal(release, 'dev', 'public/ carries no release meta: it is stamped at publish time');
assert.equal(set.size, urls.length, 'no repeats');
assert.ok(set.has('./'), 'the home page');
for (const g of ALL_GAMES) {
  assert.equal(set.has(g.path), offlineOk(g), `${g.id}: its page is precached exactly when it is offline-capable`);
}
// The minigames' pages load La Copa's engine and each game's module: those come along
for (const f of ['cup/game.js', 'cup/style.css', 'cup/games/index.js', 'cup/games/zip/engine.js', 'assets/js/games.js', 'assets/css/base.css']) {
  assert.ok(urls.some(u => u.split('?')[0] === f), `${f} is precached`);
}
for (const u of urls) {
  const f = u.split('?')[0];
  assert.ok(!NEVER.some(n => f.startsWith(n)), `${u}: music, link cards and splash art are never precached`);
  assert.ok(!/\.test\.mjs$/.test(f), `${u}: no test files`);
  if (/\.(js|css)$/.test(f)) {
    const h = createHash('sha256').update(readFileSync(join(SITE, f))).digest('hex').slice(0, 8);
    assert.equal(u, `${f}?h=${h}`, `${f}: its URL is the one set-version.py writes (D-467)`);
  }
  if (/\.(webp|jpe?g|png)$/.test(f)) assert.ok(statSync(join(SITE, f)).size <= BIG, `${f}: big pictures are cached when seen, not up front`);
}
const bytes = urls.map(u => u.split('?')[0]).filter(f => /\.\w+$/.test(f)).reduce((n, f) => n + statSync(join(SITE, f)).size, 0);
assert.ok(bytes < 8 * 1048576, `the precache stays under 8 MB (${(bytes / 1048576).toFixed(1)} MB)`);
console.log(`✓ precache: ${urls.length} URLs, ${(bytes / 1048576).toFixed(1)} MB, every offline-capable game and nothing heavy`);

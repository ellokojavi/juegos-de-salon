// The games manifest (#855): games.js is the one source, and each list moved into it is derived, never kept by hand
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES, SUELTOS } from './games.js';
import { KEYWORDS } from './search.js';

const ALL = [...GAMES, ...SUELTOS];
const ids = ALL.map(g => g.id);
assert.equal(new Set(ids).size, ids.length, 'every id in the manifest is unique');

// keywords (phase 1): search.js keeps no list of its own, and what it reads is exactly the manifest's
const src = readFileSync(new URL('./search.js', import.meta.url), 'utf8');
assert.ok(!/KEYWORDS\s*=\s*\{/.test(src), 'search.js keeps no KEYWORDS of its own: each game\'s `keywords` go in its entry in games.js');
assert.deepEqual(Object.keys(KEYWORDS).sort(), ALL.filter(g => g.keywords).map(g => g.id).sort(), 'KEYWORDS is the manifest\'s keywords, game by game');
for (const g of ALL.filter(x => x.keywords)) {
  assert.deepEqual(Object.keys(g.keywords).sort(), ['de', 'en', 'es', 'pt'], `${g.id}: keywords in es, en, pt and de, nothing else`);
  for (const [l, w] of Object.entries(g.keywords)) assert.ok(w.every(x => typeof x === 'string' && x === x.toLowerCase()), `${g.id}:${l}: keywords are lowercase strings`);
}
console.log('manifest: keywords come from games.js, green');

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

// Uno al día (phase 3): uno-al-dia.js keeps a row only for the two Cup-only ids; the rest come from `unoAlDia` here
const { JUEGOS_DIA, GRUPO } = await import('./uno-al-dia.js');
const uad = readFileSync(new URL('./uno-al-dia.js', import.meta.url), 'utf8');
for (const g of ALL.filter(x => x.unoAlDia)) assert.ok(!uad.includes(`id: '${g.id}'`), `${g.id}: its Uno al día row goes in its entry in games.js (unoAlDia), not in uno-al-dia.js`);
const orden = [...ALL.filter(x => x.unoAlDia).map(x => x.unoAlDia.orden), 0, 1].sort((a, b) => a - b);
assert.deepEqual(orden, orden.map((_, i) => i), 'unoAlDia.orden: each place in the deck once, none skipped (the shuffle depends on the order)');
assert.deepEqual(JUEGOS_DIA.map(j => j.id).filter(id => id !== 'linea' && id !== 'numero').sort(), ALL.filter(x => x.unoAlDia).map(x => x.id).sort(), 'JUEGOS_DIA is the manifest\'s unoAlDia games');
assert.deepEqual([...GRUPO].sort(), ALL.filter(x => x.unoAlDia?.grupo).map(x => x.id).sort(), 'GRUPO is the manifest\'s unoAlDia.grupo');
console.log('manifest: keywords and Uno al día come from games.js, green');

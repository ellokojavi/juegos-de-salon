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

// e2e reuses (phase 2): affected.mjs keeps no row for a game the manifest lists, and reads exactly its reuses
const { REUSES } = await import('../../../tools/e2e/affected.mjs');
const aff = readFileSync(new URL('../../../tools/e2e/affected.mjs', import.meta.url), 'utf8');
const page = g => g.path.replace(/\/$/, '');
for (const g of ALL.filter(x => x.path)) {
  assert.ok(!new RegExp(`^\\s*'?${page(g).replace('/', '\\/')}'?:\\s*\\[`, 'm').test(aff), `${g.id}: its reuses go in its entry in games.js, not in affected.mjs`);
  assert.deepEqual(REUSES[page(g)], g.reuses, `${g.id}: REUSES is the manifest's reuses`);
}

// Uno al día (phase 3): uno-al-dia.js keeps a row only for the two Cup-only ids; the rest come from `unoAlDia` here
const { JUEGOS_DIA, GRUPO } = await import('./uno-al-dia.js');
const uad = readFileSync(new URL('./uno-al-dia.js', import.meta.url), 'utf8');
for (const g of ALL.filter(x => x.unoAlDia)) assert.ok(!uad.includes(`id: '${g.id}'`), `${g.id}: its Uno al día row goes in its entry in games.js (unoAlDia), not in uno-al-dia.js`);
const orden = [...ALL.filter(x => x.unoAlDia).map(x => x.unoAlDia.orden), 0, 1].sort((a, b) => a - b);
assert.deepEqual(orden, orden.map((_, i) => i), 'unoAlDia.orden: each place in the deck once, none skipped (the shuffle depends on the order)');
assert.deepEqual(JUEGOS_DIA.map(j => j.id).filter(id => id !== 'linea' && id !== 'numero').sort(), ALL.filter(x => x.unoAlDia).map(x => x.id).sort(), 'JUEGOS_DIA is the manifest\'s unoAlDia games');
assert.deepEqual([...GRUPO].sort(), ALL.filter(x => x.unoAlDia?.grupo).map(x => x.id).sort(), 'GRUPO is the manifest\'s unoAlDia.grupo');

// La Copa (phase 4): POZO is the two Cup-only games plus the manifest's `copa`, and every one has its code
const { POZO } = await import('../../cup/engine.js');
const eng = readFileSync(new URL('../../cup/engine.js', import.meta.url), 'utf8');
assert.ok(!/POZO = \['/.test(eng), 'cup/engine.js keeps no POZO list of its own: a Cup game says `copa: { pozo }` in games.js');
const pozo = [0, 1, ...ALL.filter(x => x.copa).map(x => x.copa.pozo)].sort((a, b) => a - b);
assert.deepEqual(pozo, pozo.map((_, i) => i), 'copa.pozo: each place in the pool once, none skipped');
assert.deepEqual(POZO.slice(2).sort(), ALL.filter(x => x.copa).map(x => x.id).sort(), 'POZO is the manifest\'s copa games');
const idx = readFileSync(new URL('../../cup/games/index.js', import.meta.url), 'utf8');
for (const id of POZO) assert.ok(new RegExp(`^  ${id}: \\(\\) =>`, 'm').test(idx), `${id}: cup/games/index.js has its CODE loader`);

// e2e paths (phase 5): every game outside La Bodega has its screens in tools/e2e/paths.mjs, under its id
// (the snippets stay there: they are code, not data); with that it also enters the language tests
const { PATHS } = await import('../../../tools/e2e/paths.mjs');
for (const g of ALL.filter(x => !x.bodega)) assert.ok(PATHS[g.id] && Object.keys(PATHS[g.id]).length, `${g.id}: tools/e2e/paths.mjs has its screens under '${g.id}'`);
console.log('manifest: keywords, reuses, Uno al día, La Copa and e2e paths come from games.js, green');

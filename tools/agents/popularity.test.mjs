// The home page's weekly order (D-361): what counts as finished, the new order, when it is due and the rewrite of games.js.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { terminadasLog, terminadas, nuevoOrden, vence, reescribir, FILE } from './popularity.mjs';
import { POPULARIDAD, POPULARIDAD_FECHA, GAMES, SUELTOS } from '../../public/assets/js/games.js';

// Offline endings, ended rooms and cup days, the cup days under their game and all together as La Copa
assert.deepEqual(terminadas({
  finales: { tango: { terminadas: 15, empezadas: 65 }, dudo: { terminadas: 0 } },
  salas: { 'toque-y-fama': { terminadas: 2, creadas: 10 } },
  copa: [{ id: 'linea', jugadas: 4 }, { id: 'pintaminas:hard', jugadas: 2 }, { id: 'final', jugadas: 1 }, { id: 'numero', jugadas: 3 }],
}), { tango: 15, 'toque-y-fama': 5, 'linea-de-tiempo': 4, pintaminas: 2, copa: 10 });
assert.deepEqual(terminadas({}), {});
// The log and the counter are the same endings seen twice: the larger one per game, never the sum
assert.deepEqual(terminadas({ finales: { tango: { terminadas: 3 }, zip: { terminadas: 4 } }, log: { tango: 15, zip: 1, reinas: 2 } }), { tango: 15, zip: 4, reinas: 2 });
const days = { 100: { live: { a: { game: 'tango', mode: 'solo', fin: { d: '100/100' } }, b: { game: 'tango', mode: 'solo' }, c: { game: 'zip', mode: 'uno-al-dia', fin: {} }, e: { game: 'x', mode: 'copa', fin: {} } } }, 99: { live: { f: { game: 'zip', mode: 'solo', fin: {} } } } };
assert.deepEqual(terminadasLog(days, { from: 100, to: 100 }), { tango: 1, zip: 1 }, 'only endings, only the range, not cup days');

// Most finished first; ties and zeros keep the old place; a game missing from the old list goes last; lab ids drop
const viejo = ['copa', 'a', 'b', 'c'];
assert.deepEqual(nuevoOrden({ copa: 9, c: 5, a: 2, b: 2, labgame: 99 }, ['copa', 'a', 'b', 'c', 'd'], viejo), ['copa', 'c', 'a', 'b', 'd']);
assert.deepEqual(nuevoOrden({}, ['copa', 'a', 'b', 'c'], viejo), viejo, 'nothing finished: the order holds');
assert.deepEqual(nuevoOrden({ d: 1 }, ['copa', 'a', 'd'], viejo), ['d', 'copa', 'a']);

// Due once the list is a week old
assert.deepEqual(vence('2026-10-11', Date.parse('2026-10-17T12:00:00Z')), { dias: 6, toca: false });
assert.deepEqual(vence('2026-10-11', Date.parse('2026-10-18T12:00:00Z')), { dias: 7, toca: true });

// The rewrite touches only the two generated lines, and refuses if they moved
const src = readFileSync(FILE, 'utf8');
const out = reescribir(src, ['copa', 'tango'], '2026-10-25');
assert.match(out, /^export const POPULARIDAD_FECHA = '2026-10-25';$/m);
assert.match(out, /^export const POPULARIDAD = \['copa', 'tango'\];$/m);
assert.equal(out.split('\n').length, src.split('\n').length, 'the same lines, two of them changed');
assert.throws(() => reescribir('export const X = 1;', [], '2026-10-25'), /lost the POPULARIDAD/);

// What the repo holds is what the tool writes: a date, and only games the home page offers
assert.match(POPULARIDAD_FECHA, /^\d{4}-\d{2}-\d{2}$/);
const ofrecidos = new Set([...GAMES, ...SUELTOS].filter(g => !g.labs).map(g => g.id));
for (const id of POPULARIDAD) assert.ok(ofrecidos.has(id), `POPULARIDAD names ${id}, which the home page does not offer`);
assert.equal(new Set(POPULARIDAD).size, POPULARIDAD.length, 'no game twice in POPULARIDAD');

console.log('✓ popularity.test.mjs');

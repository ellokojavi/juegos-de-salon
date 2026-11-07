// node tools/agents/identifiers.test.mjs — new exported names in English (C-20, D-316, #1249 step 12):
// each piece on synthetic input, then the gate on the repo: no Spanish exported name outside the debt list.
import assert from 'node:assert/strict';
import { exportedNames, scan, gate, sources, readDebt } from './identifiers.mjs';

const src = `export function crearSala() {}
export async function joinRoom() {}
export const JUGADORES = 2, x = 1;
export class Tablero {}
export let score;
export default function share() {}
const abrirBuzon = 1, open = 2;
export { abrirBuzon, open as abrirMesa };
// export const comentarioJugador = 1;
/* export function otroJugador() {} */
const url = 'http://x';
export const { jugador: player, mesa } = o;`;
assert.deepEqual(exportedNames(src).sort(), ['JUGADORES', 'Tablero', 'abrirBuzon', 'abrirMesa', 'crearSala', 'joinRoom', 'mesa', 'player', 'score', 'share'].sort());

const files = { 'public/a.js': 'export const crearJugador = 1; export const createPlayer = 2;', 'tools/b.mjs': 'export function tablero() {}' };
const found = scan(Object.keys(files), p => files[p]);
assert.deepEqual(found, [{ file: 'public/a.js', name: 'crearJugador' }, { file: 'tools/b.mjs', name: 'tablero' }], 'English names pass, Spanish ones are found');
const g = gate(found, [{ file: 'public/a.js', name: 'crearJugador' }, { file: 'public/a.js', name: 'gone' }]);
assert.deepEqual(g.added, ['tools/b.mjs tablero'], 'a Spanish name not in the debt is new');
assert.deepEqual(g.stale, ['public/a.js gone'], 'a name that is gone is stale');
assert.deepEqual(sources(['public/x.js', 'tools/y.mjs', 'docs/z.js', 'public/s.css']), ['public/x.js', 'tools/y.mjs']);

// The repo
const real = scan(sources());
const r = gate(real, readDebt());
assert.deepEqual(r.added, [], `new Spanish exported names (name them in English, D-316): ${r.added.join(', ')}`);
assert.deepEqual(r.stale, [], `stale entries in docs/english-identifiers-debt.json (the name is gone: remove them): ${r.stale.join(', ')}`);
console.log(`✓ identifiers: ${real.length} Spanish exported names left, none new`);

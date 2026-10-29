// Run: node tools/firebase/rename-player.test.mjs
// Renaming a rankings player (D-513): the name, its search key and every row, in one write.
import assert from 'node:assert/strict';
import { cambiosRenombre } from './rename-player.mjs';

const c = cambiosRenombre('abcd1234', 'Puta Madre', 'Jugador ABCD', ['records/partidas/siempre/abcd1234', 'records/reinas/s2026-44/abcd1234']);
assert.deepEqual(c, {
  'jugadores/abcd1234/n': 'Jugador ABCD',
  'jugadorNombres/jugador-abcd/abcd1234': true,
  'jugadorNombres/puta-madre/abcd1234': null,
  'records/partidas/siempre/abcd1234/n': 'Jugador ABCD',
  'records/reinas/s2026-44/abcd1234/n': 'Jugador ABCD',
});
// Same key (only capitals change): the index entry stays
assert.equal(Object.keys(cambiosRenombre('abcd1234', 'CATA', 'Cata', [])).length, 2);
console.log('✓ rename-player');

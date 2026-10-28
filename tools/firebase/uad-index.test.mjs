// Uno al día's index by day (uad-index.mjs, D-475): the copy the migration writes, and the history read back from it
import assert from 'node:assert/strict';
import { indiceDe, historiaDeDias } from '../../public/assets/js/uad-days.js';
import { faltantes, desde } from './uad-index.mjs';
import { unoAlDiaDelRango } from '../../public/panel/aggregate.js';

const historia = {
  aaaaaaaa: { 20380: { j: 'reinas', s: 80, ms: 1, at: 1 }, 20381: { c: true, at: 2 }, 20382: { j: 'zip', s: 0, ms: 1, at: 3, p: true } },
  bbbbbbbb: { 20381: { j: 'anio', s: 55, ms: 1, at: 4 } },
  'no-jid': { 20381: { j: 'x', s: 1, ms: 1, at: 5 } },
};
const idx = indiceDe(historia);
assert.deepEqual(idx, { 20380: { aaaaaaaa: 80 }, 20381: { bbbbbbbb: 55 }, 20382: { aaaaaaaa: 0 } }, 'played days only, a 🧊 marker and a bad key left out');
assert.deepEqual(historiaDeDias(idx), { aaaaaaaa: { 20380: { s: 80 }, 20382: { s: 0 } }, bbbbbbbb: { 20381: { s: 55 } } });

assert.deepEqual(faltantes(idx, {}), { '20380/aaaaaaaa': 80, '20381/bbbbbbbb': 55, '20382/aaaaaaaa': 0 });
assert.deepEqual(faltantes(idx, { 20380: { aaaaaaaa: 80 }, 20381: { bbbbbbbb: 54 } }), { '20381/bbbbbbbb': 55, '20382/aaaaaaaa': 0 }, 'a different score is copied again');
assert.deepEqual(faltantes(idx, idx), {}, 'twice writes nothing');
assert.deepEqual(desde(historiaDeDias(idx), 20381), { aaaaaaaa: { 20382: { s: 0 } }, bbbbbbbb: { 20381: { s: 55 } } });

// The panel's numbers are the same from the index as from the whole history
const range = { from: 20380, to: 20382, hoy: 20390 };
assert.deepEqual(unoAlDiaDelRango({ historia: historiaDeDias(idx) }, range), unoAlDiaDelRango({ historia: { aaaaaaaa: historia.aaaaaaaa, bbbbbbbb: historia.bbbbbbbb } }, range));
console.log('uad-index: ok');

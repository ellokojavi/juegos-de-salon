// Tests de la planilla de la tabla final (D-161): node public/cup/planilla.test.mjs
import assert from 'node:assert/strict';
import { nuevaMeta, conCierre } from './engine.js';
import { filasPlanilla, planilla } from './planilla.js';
import { LOCALES, JUEGOS_COPA } from './rules.js';

const T = LOCALES.es;
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));
const H = 3600000;
const meta = nuevaMeta({ nombre: 'Copa; "rara"', dias: 3, inicio: '2026-09-28', tz: 'America/Santiago', admin: 'aaaaaa', creada: 0 });
const players = { aaaaaa: { name: 'Cata', at: 1 }, bbbbbb: { name: 'Javi', at: 2 }, cccccc: { name: 'Pancho', at: 3 } };
const results = {
  1: { aaaaaa: { s: 90, ms: 61000, r: '8/9' }, bbbbbb: { s: 50, ms: 1000 }, cccccc: { s: 10, ms: 1000 } },
  2: { aaaaaa: { s: 40, ms: 1000 }, bbbbbb: { s: 70, ms: 1000 } },
};
const opciones = { T, juegos: JUEGOS_COPA, fmt, fecha: ms => new Date(ms).toISOString().slice(0, 10) };
let n = 0;
const test = (name, fn) => { try { fn(); n++; } catch (e) { console.error(`✗ ${name}`); throw e; } };

test('terminada antes: tabla, lugares día a día y detalle, sin la final que no se jugó', () => {
  // Terminada a mediodía del día 2: la final (día 3) no alcanzó a abrirse
  const L = conCierre({ meta, players, results, wild: { bbbbbb: '2' }, fin: meta.win[2].a + 12 * H });
  const f = filasPlanilla(L, opciones);
  const texto = f.map(x => x.join('|'));
  assert.equal(f[1][0], fmt(T.csvEndedEarly, { fecha: '2026-09-29' }));
  const cab = texto.indexOf([T.csvPlace, T.csvPlayer, T.csvTotal, T.csvWins, fmt(T.csvDay, { d: 1, juego: JUEGOS_COPA.linea.nombre }), fmt(T.csvDay, { d: 2, juego: JUEGOS_COPA.conexiones.nombre })].join('|'));
  assert.ok(cab > 0);
  // Javi: 8 el día 1 y 10 × 2 (comodín) el día 2
  assert.deepEqual(f[cab + 1], [1, 'Javi', 28, 1, 8, 20]);
  assert.deepEqual(f[cab + 2], [2, 'Cata', 18, 1, 10, 8]);
  assert.deepEqual(f[cab + 3], [3, 'Pancho', 6, 0, 6, T.csvNotPlayed]);
  const prog = texto.indexOf(T.csvProgress);
  assert.deepEqual(f[prog + 2], ['Javi', 2, 1]);
  const det = texto.indexOf(T.csvDetail);
  assert.deepEqual(f[det + 2], [1, JUEGOS_COPA.linea.nombre, 'Cata', '8/9', 90, '1:01', 1, 10, '']);
  assert.ok(texto.some(x => x === ['2', JUEGOS_COPA.conexiones.nombre, 'Javi', '70', '70', '0:01', '1', '20', T.csvWild].join('|')));
  assert.ok(texto.some(x => x.startsWith(`2|${JUEGOS_COPA.conexiones.nombre}|Pancho|${T.csvNotPlayed}`)));
  assert.ok(!texto.some(x => x.includes(JUEGOS_COPA.final.nombre)));
});

test('terminada sola: la final vale doble y el CSV escapa el punto y coma y las comillas', () => {
  const L = { meta, players, results: { ...results, 3: { cccccc: { s: 100, ms: 1 } } } };
  const f = filasPlanilla(L, opciones);
  assert.equal(f[1][0], fmt(T.csvEnded, { fecha: new Date(meta.end).toISOString().slice(0, 10) }));
  assert.ok(f.some(x => x[2] === 'Pancho' && x[7] === 20 && x[8] === T.csvFinal));
  const csv = planilla(L, opciones);
  assert.ok(csv.startsWith('﻿'));
  assert.ok(csv.includes('"🏆 Copa; ""rara"""'));
  assert.ok(csv.includes('\r\n'));
});

console.log(`copa/planilla: ${n} tests OK`);

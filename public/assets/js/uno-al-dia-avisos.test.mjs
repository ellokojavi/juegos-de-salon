// Ejecutar: node public/assets/js/uno-al-dia-avisos.test.mjs
// Los avisos de Uno al día en el celular (D-230): lo que le cuenta al aviso (su último día, su racha,
// su semana).
import assert from 'node:assert/strict';

const m = new Map();
globalThis.localStorage = { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
const { datosAviso } = await import('./uno-al-dia-avisos.js');
const { anotar, numDia } = await import('./uno-al-dia.js');

assert.deepEqual(datosAviso(), {}, 'sin jugar, nada que contar');
for (const f of ['2026-10-05', '2026-10-06', '2026-10-07']) anotar(f, { j: 'reinas', s: 50, ms: 1 });
assert.deepEqual(datosAviso(), { u: numDia('2026-10-07'), c: 3, k: 0, m: 3, sp: 's2026-41', sn: 3 });

// El recordatorio de cada día es el aviso diario: no hay recordatorio en el calendario del celular
const m2 = await import('./uno-al-dia-avisos.js');
assert.equal(m2.ics, undefined);

console.log('uno-al-dia-avisos: ok');

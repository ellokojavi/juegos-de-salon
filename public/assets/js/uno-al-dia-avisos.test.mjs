// Ejecutar: node public/assets/js/uno-al-dia-avisos.test.mjs
// Los avisos de Uno al día en el celular (D-230): lo que le cuenta al aviso (su último día, su racha,
// su semana) y el evento de "Agregar al calendario".
import assert from 'node:assert/strict';

const m = new Map();
globalThis.localStorage = { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
const { datosAviso, ics } = await import('./uno-al-dia-avisos.js');
const { anotar, numDia } = await import('./uno-al-dia.js');

assert.deepEqual(datosAviso(), {}, 'sin jugar, nada que contar');
for (const f of ['2026-10-05', '2026-10-06', '2026-10-07']) anotar(f, { j: 'reinas', s: 50, ms: 1 });
assert.deepEqual(datosAviso(), { u: numDia('2026-10-07'), c: 3, k: 0, m: 3, sp: 's2026-41', sn: 3 });

const ev = ics({ lang: 'es', h: 13, hoy: '2026-10-07', url: 'https://juegosdesalon.cl/today/?de=cal' });
assert.match(ev, /^BEGIN:VCALENDAR\r\n/);
assert.match(ev, /\r\nDTSTART:20261007T130000\r\n/, 'a la hora elegida, en la hora del celular (sin zona)');
assert.match(ev, /\r\nDTEND:20261007T131500\r\n/);
assert.match(ev, /\r\nRRULE:FREQ=DAILY\r\n/, 'todos los días');
assert.match(ev, /\r\nSUMMARY:📅 Uno al día\r\n/);
assert.match(ev, /\r\nURL:https:\/\/juegosdesalon\.cl\/today\/\?de=cal\r\n/);
assert.match(ics({ lang: 'de', h: 9, hoy: '2026-10-07' }), /SUMMARY:📅 Spiel des Tages/);

console.log('uno-al-dia-avisos: ok');

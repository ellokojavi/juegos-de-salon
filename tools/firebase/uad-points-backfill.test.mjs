// The October backfill of Uno al día points (uad-points-backfill.mjs, D-414): the same days and rows a phone writes
import assert from 'node:assert/strict';
import { mesDe, lastDay, rehacerMes } from './uad-points-backfill.mjs';
import { numDia } from '../../public/assets/js/uno-al-dia.js';

const n = f => numDia(f);
assert.equal(lastDay('2026-10'), '2026-10-31');
assert.equal(lastDay('2026-02'), '2026-02-28');

// Three days in a row: 80+5, 70+10, 90+15; the streak r grows one a day
const hist = { [n('2026-10-06')]: { j: 'queens', s: 80 }, [n('2026-10-07')]: { j: 'queens', s: 70 }, [n('2026-10-08')]: { j: 'queens', s: 90 } };
const m = mesDe(hist, '2026-10');
assert.deepEqual(m.nuevos.map(d => [d.r, d.s]), [[1, 85], [2, 165], [3, 270]]);
assert.deepEqual(m.fila, { s: 270, r: 3, u: String(n('2026-10-08')) });

// A day a phone already counted (p) is left alone, and the row continues from the table's
const conP = { ...hist, [n('2026-10-06')]: { j: 'queens', s: 80, p: true } };
const m2 = mesDe(conP, '2026-10', { s: 85, r: 1, u: String(n('2026-10-06')) });
assert.deepEqual(m2.nuevos.map(d => d.s), [165, 270]);

// Everything counted: nothing to write (running it twice is harmless)
const todo = Object.fromEntries(Object.entries(hist).map(([k, x]) => [k, { ...x, p: true }]));
assert.equal(mesDe(todo, '2026-10', { s: 270, r: 3, u: '1' }), null);

// A missed day without a 🧊 breaks the streak: the bonus starts over
const corte = { [n('2026-10-06')]: { j: 'q', s: 50 }, [n('2026-10-08')]: { j: 'q', s: 50 } };
assert.deepEqual(mesDe(corte, '2026-10').nuevos.map(d => d.r), [1, 1]);

// September days count for the streak, not for October; the first October day claims up to 10
const largo = {};
for (let i = 0; i < 12; i++) largo[n('2026-09-20') + i] = { j: 'q', s: 10 };
const m3 = mesDe(largo, '2026-10');
assert.ok(m3.nuevos.every(d => d.date.startsWith('2026-10')));
assert.equal(m3.nuevos[0].r, 10);
assert.equal(m3.nuevos[0].s, 10 + 50);

// A day the phone's 🧊 saved (its marker, D-415) keeps the streak; without it the streak breaks
const marca = { ...corte, [n('2026-10-07')]: { c: true, at: 1 } };
assert.deepEqual(mesDe(marca, '2026-10').nuevos.map(d => d.r), [1, 2]);

// --rebuild: the whole month from scratch, whatever was counted before (p), plus +10 per friend counted
const contado = { [n('2026-10-06')]: { j: 'q', s: 50, p: true }, [n('2026-10-07')]: { c: true, at: 1 }, [n('2026-10-08')]: { j: 'q', s: 50, p: true }, [n('2026-10-09')]: { j: 'q', s: 20 } };
assert.deepEqual(rehacerMes(contado, '2026-10'), { s: 55 + 60 + 35, r: 3, u: String(n('2026-10-09')), faltaP: [n('2026-10-09')] });
assert.equal(rehacerMes(contado, '2026-10', { invites: 2 }).s, 150 + 20);
const sinMarca = { ...contado }; delete sinMarca[n('2026-10-07')];
assert.equal(rehacerMes(sinMarca, '2026-10').s, 55 + 55 + 30, 'without the marker the streak starts over');
assert.equal(rehacerMes(contado, '2026-11'), null);

// November is another table: October's days don't count there
assert.equal(mesDe(hist, '2026-11'), null);
console.log('✓ uad-points-backfill');

// The October backfill of Uno al día points (uad-points-backfill.mjs, D-414): the same days and rows a phone writes
import assert from 'node:assert/strict';
import { mesDe, lastDay, rehacerMes, cortesDe, temporadaDe, onTime, semanasDelMes, semanasDe, mejorRachaDe } from './uad-points-backfill.mjs';
import { numDia, semanaDe } from '../../public/assets/js/uno-al-dia.js';

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

// A day earns points only if its result reached the server near its date (D-465), the window the
// rules give its p; uploaded later (played offline) it keeps the streak and earns nothing
{
  const D = 86400000, d6 = n('2026-10-06');
  assert.equal(onTime(d6, { at: d6 * D - 13 * 3600000 }), true, 'UTC+14 plays it before its UTC start');
  assert.equal(onTime(d6, { at: d6 * D + 47 * 3600000 }), true, 'the next morning in UTC-12');
  assert.equal(onTime(d6, { at: d6 * D + 3 * D }), false, 'three days later');
  assert.equal(onTime(d6, { at: d6 * D - 2 * D }), false, 'before its day');
  assert.equal(onTime(d6, {}), true, 'a result without at');
  const tarde = { [n('2026-10-06')]: { j: 'q', s: 80, at: (n('2026-10-06') + 5) * D }, [n('2026-10-07')]: { j: 'q', s: 70, at: n('2026-10-07') * D } };
  assert.deepEqual(rehacerMes(tarde, '2026-10'), { s: 70 + 10, r: 2, u: String(n('2026-10-07')), faltaP: [n('2026-10-07')] }, 'the late day keeps the streak, earns nothing and gets no p');
  assert.deepEqual(mesDe(tarde, '2026-10').nuevos.map(d => [d.n, d.r]), [[n('2026-10-07'), 2]]);
  assert.equal(temporadaDe([{ jid: 'aaaaaaaa', n: 'A', hist: tarde }], '2026-10', '2026-10-10').j.aaaaaaaa.s, 80);
}

// November is another table: October's days don't count there
assert.equal(mesDe(hist, '2026-11'), null);

// The season's places by week (D-424): each Sunday and the last day; ties share a place; 0 before the first points
assert.deepEqual(cortesDe('2026-10'), ['2026-10-04', '2026-10-11', '2026-10-18', '2026-10-25', '2026-10-31']);
assert.deepEqual(cortesDe('2026-05'), ['2026-05-03', '2026-05-10', '2026-05-17', '2026-05-24', '2026-05-31'], 'a month ending on a Sunday: no cut twice');
{
  const day = (f, s) => [n(f), { j: 'queens', s }];
  const ana = Object.fromEntries([day('2026-10-02', 90), day('2026-10-20', 90)]);
  const beto = Object.fromEntries([day('2026-10-03', 50), day('2026-10-04', 50), day('2026-10-05', 50), day('2026-10-06', 50)]);
  const caro = Object.fromEntries([day('2026-10-12', 100)]);
  const t = temporadaDe([
    { jid: 'anaaaaaa', n: 'Ana', hist: ana }, { jid: 'betobeto', n: 'Beto', co: 'CL', hist: beto },
    { jid: 'carocaro', n: 'Caro', hist: caro, invites: ['2026-10-30'] }, { jid: 'nadienad', n: 'Nadie', hist: {} },
  ], '2026-10', '2026-11-01');
  assert.equal(t.t, '2026-11-01');
  assert.equal(t.c.length, 5);
  assert.deepEqual(Object.keys(t.j).sort(), ['anaaaaaa', 'betobeto', 'carocaro'], 'nobody without points');
  // Ana: 95 by the 4th, 190 from the 20th. Beto: 55+60=115 by the 4th, 250 from the 6th. Caro: 105 from the 12th, +10 on the 30th
  assert.deepEqual(t.j.betobeto, { n: 'Beto', co: 'CL', s: 250, l: [1, 1, 1, 1, 1] });
  assert.deepEqual(t.j.anaaaaaa.l, [2, 2, 3, 2, 2]);
  assert.deepEqual(t.j.carocaro.l, [0, 0, 2, 3, 3]);
  assert.equal(t.j.carocaro.s, 115, 'the friend’s +10 counts on the day they accepted');
  const tie = temporadaDe([{ jid: 'aaaaaaaa', n: 'A', hist: { [n('2026-10-02')]: { j: 'q', s: 90 } } }, { jid: 'bbbbbbbb', n: 'B', hist: { [n('2026-10-02')]: { j: 'q', s: 90 } } }], '2026-10', '2026-10-10');
  assert.deepEqual([tie.j.aaaaaaaa.l[0], tie.j.bbbbbbbb.l[0]], [1, 1], 'the same points share the place');
}

// The night's totals (D-500): the week's sums and the best streak come from the history too
{
  const sem = semanasDelMes('2026-10');
  assert.equal(sem[0], semanaDe('2026-10-01'));
  assert.equal(sem.at(-1), semanaDe('2026-10-31'));
  assert.equal(new Set(sem).size, sem.length);
  // Monday the 5th and Tuesday the 6th are one week; Sunday the 4th is the one before; a 0 adds nothing; a late upload neither
  const h = { [n('2026-10-04')]: { j: 'q', s: 30, ms: 5 }, [n('2026-10-05')]: { j: 'q', s: 40, ms: 10 }, [n('2026-10-06')]: { j: 'q', s: 50, ms: 20 },
    [n('2026-10-07')]: { j: 'q', s: 0, ms: 1 }, [n('2026-10-08')]: { j: 'q', s: 99, ms: 1, at: n('2026-10-20') * 86400000 } };
  const w = semanasDe(h, sem);
  assert.deepEqual(w[semanaDe('2026-10-05')], { s: 90, ms: 30, u: String(n('2026-10-06')) });
  assert.deepEqual(w[semanaDe('2026-10-04')], { s: 30, ms: 5, u: String(n('2026-10-04')) });
  assert.deepEqual(semanasDe(h, [semanaDe('2026-10-05')]), { [semanaDe('2026-10-05')]: w[semanaDe('2026-10-05')] }, 'only the weeks asked');
  // Five days in a row is a best streak of 5, a 🧊 marker keeps it going (it adds no day)
  assert.equal(mejorRachaDe(h, '2026-10'), 5);
  assert.equal(mejorRachaDe({ ...corte, [n('2026-10-07')]: { c: true, at: 1 } }, '2026-10'), 2, 'the saved day keeps the streak alive');
  assert.equal(mejorRachaDe(corte, '2026-10'), 1, 'without it the streak starts over');
}

console.log('✓ uad-points-backfill');

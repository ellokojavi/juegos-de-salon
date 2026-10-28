// The Uno al día points (public/assets/js/daily-points.js), shared by /today/, the lab prototype and the October backfill
import assert from 'node:assert/strict';
import { walk, bonusFor, seasonPoints, maxToday, rankAmong, onTime, lateDays } from './daily-points.js';
import { numDia } from './uno-al-dia.js';

assert.equal(bonusFor(0), 0);
assert.equal(bonusFor(1), 5);
assert.equal(bonusFor(10), 50);
assert.equal(bonusFor(40), 50);
assert.equal(maxToday(0), 105);
assert.equal(maxToday(12), 150);

// Three days played: 80+5, 70+10, 90+15
let w = walk({ '2026-10-01': { j: 'reinas', s: 80 }, '2026-10-02': { j: 'zip', s: 70 }, '2026-10-03': { j: 'tango', s: 90 } }, '2026-10-03');
assert.deepEqual(w.days.map(d => d.points), [85, 80, 105]);
assert.equal(w.streak, 3);
assert.equal(seasonPoints(w, '2026-10-03'), 270);

// Today not played yet does not break the streak
w = walk({ '2026-10-01': { j: 'reinas', s: 80 } }, '2026-10-02');
assert.equal(w.streak, 1);
assert.equal(w.days.length, 1);

// A missed day without a wildcard starts the streak (and its bonus) over
w = walk({ '2026-10-01': { j: 'reinas', s: 50 }, '2026-10-03': { j: 'zip', s: 50 } }, '2026-10-03');
assert.deepEqual(w.days.map(d => d.points), [55, 0, 55]);

// Seven days earn a wildcard; the eighth day is missed and saved; the ninth keeps the bonus going
const days = {};
for (let i = 1; i <= 7; i++) days[`2026-10-0${i}`] = { j: 'reinas', s: 100 };
days['2026-10-09'] = { j: 'zip', s: 100 };
w = walk(days, '2026-10-09');
assert.equal(w.days[7].saved, true);
assert.equal(w.days[7].points, 0);
assert.equal(w.days[8].streak, 8);
assert.equal(w.days[8].bonus, 40);
assert.equal(w.wildcards, 0);

// The server's way (D-415): a missed day is saved only by a 🧊 it can see, or by a phone's marker
// while the 2 it lends last; with neither, the streak breaks
const g = { '2026-10-01': { j: 'q', s: 10 }, '2026-10-02': { j: 'q', s: 10 }, '2026-10-04': { j: 'q', s: 10 }, '2026-10-06': { j: 'q', s: 10 }, '2026-10-08': { j: 'q', s: 10 }, '2026-10-10': { j: 'q', s: 10 } };
w = walk(g, '2026-10-10', { saved: [] });
assert.deepEqual(w.days.filter(d => d.played).map(d => d.streak), [1, 2, 1, 1, 1, 1], 'no marker: every gap breaks');
w = walk(g, '2026-10-10', { saved: ['2026-10-03', '2026-10-05', '2026-10-07'] });
assert.deepEqual(w.days.filter(d => d.played).map(d => d.streak), [1, 2, 3, 4, 1, 1], 'two markers honoured, the third breaks, and an unmarked gap breaks');
w = walk(g, '2026-10-10', { gifts: ['2026-10-02'], saved: ['2026-10-03', '2026-10-05', '2026-10-07'] });
assert.deepEqual(w.days.filter(d => d.played).map(d => d.streak), [1, 2, 3, 4, 5, 1], 'a gift (an invited friend) covers one more; the unmarked gap still breaks');
// The phone's way spends gifts too, as recorrer does
w = walk({ '2026-10-01': { j: 'q', s: 10 }, '2026-10-03': { j: 'q', s: 10 } }, '2026-10-03', { gifts: ['2026-10-01'] });
assert.deepEqual(w.days.map(d => d.saved), [false, true, false]);

// The season is the month
w = walk({ '2026-09-30': { j: 'reinas', s: 100 }, '2026-10-01': { j: 'zip', s: 100 } }, '2026-10-01');
assert.equal(seasonPoints(w, '2026-10-01'), 110);

// Ranking: ties go to the others; ahead is the one to chase
const r = rankAmong([{ name: 'Ana', pts: 300 }, { name: 'Beto', pts: 200 }], { name: 'Tú', pts: 200 });
assert.equal(r.rank, 3);
assert.equal(r.ahead.name, 'Beto');

console.log('✓ daily-score');

// A day uploaded more than a day late keeps the streak but adds 0, as the season total does (#879, D-465)
{
  const n2 = numDia('2026-10-02'), dia = n2 * 86400000;
  const hist = {
    [numDia('2026-10-01')]: { j: 'reinas', s: 80, at: numDia('2026-10-01') * 86400000 + 3600000, p: true },
    [n2]: { j: 'zip', s: 70, at: dia + 3 * 86400000 },
    [numDia('2026-10-03')]: { j: 'tango', s: 90, at: numDia('2026-10-03') * 86400000 + 3600000 },
  };
  assert.equal(onTime(n2, { at: dia + 3600000 }), true);
  assert.equal(onTime(n2, hist[n2]), false);
  assert.equal(onTime(n2, {}), true);
  assert.deepEqual(lateDays(hist), ['2026-10-02']);
  assert.deepEqual(lateDays({ [n2]: { ...hist[n2], p: true } }), []);
  const days = { '2026-10-01': { j: 'reinas', s: 80 }, '2026-10-02': { j: 'zip', s: 70 }, '2026-10-03': { j: 'tango', s: 90 } };
  const l = walk(days, '2026-10-03', { late: lateDays(hist) });
  assert.deepEqual(l.days.map(d => d.points), [85, 0, 105]);
  assert.equal(l.days[1].late, true);
  assert.equal(l.days[1].played, true);
  assert.equal(l.streak, 3);
  assert.equal(seasonPoints(l, '2026-10-03'), 190);
}

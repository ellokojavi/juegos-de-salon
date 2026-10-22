// The Uno al día points (public/assets/js/daily-points.js), shared by /today/, the lab prototype and the October backfill
import assert from 'node:assert/strict';
import { walk, bonusFor, seasonPoints, maxToday, rankAmong } from './daily-points.js';

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

// The season is the month
w = walk({ '2026-09-30': { j: 'reinas', s: 100 }, '2026-10-01': { j: 'zip', s: 100 } }, '2026-10-01');
assert.equal(seasonPoints(w, '2026-10-01'), 110);

// Ranking: ties go to the others; ahead is the one to chase
const r = rankAmong([{ name: 'Ana', pts: 300 }, { name: 'Beto', pts: 200 }], { name: 'Tú', pts: 200 });
assert.equal(r.rank, 3);
assert.equal(r.ahead.name, 'Beto');

console.log('✓ daily-score');

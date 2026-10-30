// The month-end window's words: the three languages say the same, and each place gets its own window.
import assert from 'node:assert/strict';
import { TEXTS, monthEndView, nextMonth } from './month-end.js';

const keys = Object.keys(TEXTS.es).sort();
for (const l of ['en', 'pt']) assert.deepEqual(Object.keys(TEXTS[l]).sort(), keys, `month-end.js: ${l} lacks or adds texts`);
for (const l of Object.keys(TEXTS)) for (const [k, v] of Object.entries(TEXTS[l]))
  assert.deepEqual([...v.matchAll(/\{\w+\}/g)].map(m => m[0]).sort(), [...TEXTS.es[k].matchAll(/\{\w+\}/g)].map(m => m[0]).sort(), `month-end.js: ${l}.${k} has other placeholders`);

assert.equal(nextMonth('2026-12'), '2027-01');
const recap = lugar => ({ me: { name: 'Javi', lugar, total: 2840 }, players: 212 });
const one = monthEndView({ month: '2026-10', recap: recap(1) }, 'es', { days: 29 });
assert.equal(one.podium, 1);
assert.match(one.lines[0], /^Javi, fuiste el número uno .* octubre\. 29 días/);
assert.match(one.lines[3], /noviembre/);
assert.ok(!/copa/i.test(one.lines.join(' ')), 'never say la copa: that is La Copa');
assert.equal(monthEndView({ month: '2026-10', recap: recap(3) }, 'pt').title, 'Terceiro lugar!');
const rest = monthEndView({ month: '2026-10', recap: recap(14) }, 'en');
assert.equal(rest.podium, 0);
assert.equal(rest.lines[0], 'You finished #14 of 212, with 2,840 points.');
assert.equal(monthEndView({ month: '2026-10', recap: { me: null, players: 3 } }, 'es'), null);
console.log('month-end ok');

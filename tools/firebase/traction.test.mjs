// The making-of page's Traction totals (traction.mjs): counted up to yesterday (UTC), with the panel's functions.
import assert from 'node:assert/strict';
import { traction } from './traction.mjs';

const DAY = 864e5, now = Date.UTC(2026, 10, 14, 12), today = Math.floor(now / DAY);
const ids = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`abcdefgh${String(i).padStart(2, '0')}`, 2]));
const days = {
  [today - 40]: { fin: { zip: { solo: 3 } } },                       // counts in the total, not the week
  [today - 3]: { fin: { zip: { solo: 5 }, dudo: { cpu: 2 } }, activos: ids(4) },
  [today - 1]: { fin: { zip: { solo: 1 } }, activos: ids(6) },
  [today]: { fin: { zip: { solo: 99 } }, activos: ids(50) },           // today is not over: left out
};
const t = traction(days, {}, now);
assert.equal(t.total, 11);
assert.equal(t.week, 8);
assert.equal(t.best, 7);
assert.equal(t.bestDay, new Date((today - 3) * DAY).toISOString().slice(0, 10));
assert.equal(t.phones7, 6, 'different browsers, not visits');
assert.equal(t.phones30, 6);
assert.equal(t.asOf, '2026-11-13');
assert.equal(t.bestWeek, 8, 'the best 7 days of games');
assert.equal(t.peak7, 6);
assert.equal(t.peak30, 6);
// A slow last week leaves the records where they were
const slow = traction({ ...days, [today - 20]: { fin: { zip: { solo: 30 } }, activos: ids(9) } }, {}, now);
assert.equal(slow.week, 8);
assert.equal(slow.bestWeek, 30);
assert.equal(slow.peak7, 9);
assert.equal(slow.peak30, 9 + 0, 'the 9 of that day are in the same 30 days as the later 6');
assert.deepEqual(Object.keys(t).sort(), ['asOf', 'at', 'best', 'bestDay', 'bestWeek', 'peak30', 'peak7', 'phones30', 'phones7', 'total', 'week'], 'only totals go out');
const none = traction({}, {}, now);
assert.equal(none.total, 0);
assert.equal(none.bestDay, null);
console.log('✓ traction');

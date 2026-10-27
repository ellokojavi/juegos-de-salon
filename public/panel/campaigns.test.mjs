// 📣 Campaigns in the panel (D-454): the switches, where each one stands, overlaps and order.
import assert from 'node:assert/strict';
import { switches, status, overlaps, move, toRemote, span, dayPlus, campaignStats } from './campaigns.js';
import { fromRemote } from '../assets/js/splash.js';

const campaigns = { a: {}, b: {}, c: {} };
const today = '2026-10-26';

// Before the panel ever saved: ACTIVE's, in its order, and the rest off
const first = switches({ remote: null, active: [{ id: 'b', until: '2026-10-28' }], campaigns });
assert.deepEqual(first.map(s => [s.id, s.on, s.until]), [['b', true, '2026-10-28'], ['a', false, null], ['c', false, null]]);
// After: Firebase's
const saved = switches({ remote: { c: { on: true, order: 0 }, a: { on: true, order: 1, from: '2026-11-01' } }, campaigns });
assert.deepEqual(saved.map(s => s.id), ['c', 'a', 'b']);

assert.equal(status({ on: false }, today), 'off');
assert.equal(status({ on: true }, today), 'live');
assert.equal(status({ on: true, from: '2026-10-27' }, today), 'scheduled');
assert.equal(status({ on: true, until: '2026-10-25' }, today), 'ended');
assert.equal(status({ on: true, from: today, until: today }, today), 'live', 'both days inclusive');

// Overlaps: the days two are on together, in the queue's order
const rows = [{ id: 'a', on: true, until: '2026-10-28' }, { id: 'b', on: true, from: '2026-10-27', until: '2026-10-30' }, { id: 'c', on: false }];
assert.deepEqual(overlaps(rows, today, 10), [{ from: '2026-10-27', to: '2026-10-28', ids: ['a', 'b'] }]);
assert.deepEqual(overlaps([rows[0]], today, 10), []);

// Order
assert.deepEqual(move(rows, 'b', -1).map(s => [s.id, s.order]), [['b', 0], ['a', 1], ['c', 2]]);
assert.deepEqual(move(rows, 'a', -1).map(s => s.id), ['a', 'b', 'c'], 'the first cannot go up');

// What is saved is what the home page reads back, in the same order
const remote = toRemote(move(rows, 'b', -1), 1);
assert.deepEqual(remote.b, { on: true, order: 0, at: 1, from: '2026-10-27', until: '2026-10-30' });
assert.deepEqual(fromRemote(remote), [{ id: 'b', from: '2026-10-27', until: '2026-10-30' }, { id: 'a', until: '2026-10-28' }]);

// The strip
assert.deepEqual(span(rows[1], today, 30), { start: 1, end: 4, open: false });
assert.deepEqual(span({ on: true }, today, 30), { start: 0, end: 29, open: true });
assert.equal(span({ on: true, until: '2026-10-01' }, today, 30), null);
assert.equal(dayPlus('2026-10-31', 1), '2026-11-01');


// How a campaign did (D-461): exposure counts only the days it was shown, so switching it off and
// on again leaves a gap the index skips
const D = 20000;
const days = {
  [D - 1]: { vistas: { inicio: 50 } },                                   // before it started
  [D]: { vistas: { inicio: 100 }, splash: { x: { shown: 40, reach: 30, play: 9, close: 20, t0: 10, t1: 12, t2: 7, start: 8, finish: 5 } } },
  [D + 1]: { vistas: { inicio: 80 }, splash: { x: { shown: 20, reach: 10, play: 3, close: 12, t0: 5, t1: 8, t2: 2 } } },
  [D + 2]: { vistas: { inicio: 90 } },                                   // switched off
  [D + 3]: { vistas: { inicio: 70 }, splash: { x: { shown: 10, reach: 4, play: 1, close: 8, t1: 9 } } },
  [D + 4]: { vistas: { inicio: 60 }, splash: { x: { shown: 6, reach: 2, close: 5, t0: 5 } }, y: 1 },
  [D + 5]: { vistas: { inicio: 60 } },                                   // over
};
const x = campaignStats(days, 'x', { from: D - 1, to: D + 5 });
assert.deepEqual(x.series.map(r => [r.day - D, r.n, r.off]), [[0, 1, false], [1, 2, false], [2, null, true], [3, 3, false], [4, 4, false]], 'trimmed to its days, the gap kept and not counted');
assert.equal(x.exposed, 4);
assert.deepEqual([x.shown, x.reach, x.play, x.close, x.rest], [76, 46, 13, 45, 18]);
assert.equal(x.ctr, 13 / 46);
assert.deepEqual([x.start, x.finish], [8, 5]);
assert.equal(x.startRate, 8 / 13);
assert.equal(x.finishRate, 5 / 13);
assert.equal(x.conversion, 5 / 46);
assert.equal(x.coverage, 76 / 310, 'home views of the days it was shown only');
assert.equal(x.stay3, (29 + 9) / (20 + 29 + 9));
assert.equal(x.stay10, 9 / 58);
assert.equal(x.early, 44 / 3);
assert.equal(x.late, 2);
assert.equal(x.halfDays, 1, '30 of 46 on its first day');
assert.equal(x.clipped, false);
assert.equal(campaignStats(days, 'x', { from: D + 1, to: D + 5 }).clipped, true, 'already showing when the range starts');
assert.equal(campaignStats(days, 'none', { from: D - 1, to: D + 5 }), null, 'never shown: nothing to say');
assert.equal(campaignStats({}, 'x', { from: D, to: D }), null);

console.log('campaigns ✓');

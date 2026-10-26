// 📣 Campaigns in the panel (D-454): the switches, where each one stands, overlaps and order.
import assert from 'node:assert/strict';
import { switches, status, overlaps, move, toRemote, span, dayPlus } from './campaigns.js';
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

console.log('campaigns ✓');

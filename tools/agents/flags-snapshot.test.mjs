import assert from 'node:assert/strict';
import { states, diff, snapshot, held, undecided, staleLab } from './flags-snapshot.mjs';
import { STATES } from '../../public/assets/js/flags.js';

assert.deepEqual(states({ b: { state: 'all', at: 5 }, a: {} }), { a: { state: 'lab' }, b: { state: 'all' } }, 'only states, sorted, lab by default');
assert.deepEqual(diff({ a: { state: 'lab' } }, { a: { state: 'all' }, b: { state: 'off' } }), [{ id: 'a', from: 'lab', to: 'all' }, { id: 'b', from: '-', to: 'off' }]);
assert.deepEqual(diff({ a: { state: 'all' } }, { a: { state: 'all' } }), []);
for (const [id, v] of Object.entries(snapshot())) assert.ok(STATES.includes(v.state) && Object.keys(v).length === 1, `${id}: one valid state`);
const { FLAGS } = await import('../../public/assets/js/flag-list.js');
for (const [id, v] of Object.entries(held())) assert.ok(FLAGS[id] && STATES.includes(v.state) && Object.keys(v).length === 1, `flags-held.json: ${id} is a flag of FLAGS with one valid state (remove its row with its gate)`);

// Every flag has a state the tests know (#1662, #1777, #1812, #1829: a new flag, 'lab' by default, was on in every script)
assert.deepEqual(undecided(['a', 'b', 'c'], { a: { state: 'all' } }, { b: { state: 'off' } }), ['c'], 'neither in the snapshot nor held');
assert.deepEqual(staleLab({ a: { state: 'all' } }, { a: { state: 'lab' }, b: { state: 'lab' }, c: { state: 'off' } }), ['a'], 'a lab row the snapshot now knows');
const missing = undecided(Object.keys(FLAGS), snapshot(), held());
assert.deepEqual(missing, [], `new flag(s) ${missing.join(', ')}: the end-to-end scripts would see them on everywhere (a flag Firebase does not know is 'lab', and localhost holds the lab key). Add a row to tools/e2e/flags-held.json: "off" if it changes a page or screen other scripts open (its own script turns it on with browser.flags()), "lab" if every script may see it (tools/e2e/README.md)`);
const stale = staleLab(snapshot(), held());
assert.deepEqual(stale, [], `flags-held.json: ${stale.join(', ')} held at 'lab' but the snapshot knows them now: drop the row (flags-snapshot.mjs refresh does it)`);
console.log('✓ flags-snapshot: states, diff and a valid snapshot');

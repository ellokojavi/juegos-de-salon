// The panel's switches for skins and site features (D-477), as the site reads them.
import assert from 'node:assert/strict';
import { skinOn, featureOn, cachedControls, loadControls } from './controls.js';
import { seasonOf } from './season.js';

const yearly = d => d >= '2026-10-26' && d <= '2026-10-31';
assert.equal(skinOn(undefined, '2026-10-27', yearly), true, 'nothing saved: its own days');
assert.equal(skinOn({ mode: 'yearly' }, '2026-11-02', yearly), false);
assert.equal(skinOn({ mode: 'off' }, '2026-10-27', yearly), false, 'off wins over its days');
assert.equal(skinOn({ mode: 'dates', from: '2026-11-01', until: '2026-11-03' }, '2026-11-03', yearly), true, 'moved, both days included');
assert.equal(skinOn({ mode: 'dates', from: '2026-11-01', until: '2026-11-03' }, '2026-10-27', yearly), false);
assert.equal(skinOn({ mode: 'dates', from: '2026-11-01' }, '2027-02-01', yearly), true, 'no end: until switched off');
assert.equal(skinOn({ mode: 'dates' }, '2026-10-27', yearly), false, 'dates without a start: off');

assert.equal(featureOn({}, 'support', 'footer'), true, 'on unless switched off');
assert.equal(featureOn({ features: { support: { endings: false } } }, 'support', 'endings'), false);
assert.equal(featureOn({ features: { support: { endings: false } } }, 'support', 'footer'), true);

// The season engine follows them
const oct27 = new Date(2026, 9, 27), nov2 = new Date(2026, 10, 2);
assert.equal(seasonOf(oct27), 'halloween');
assert.equal(seasonOf(oct27, undefined, { skins: { halloween: { mode: 'off' } } }), null);
assert.equal(seasonOf(nov2, undefined, { skins: { halloween: { mode: 'dates', from: '2026-11-01', until: '2026-11-02' } } }), 'halloween');

// Firebase's answer is kept on the device; without one, the last copy
const store = new Map(); const s = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
const val = { features: { support: { footer: false } } };
assert.deepEqual(await loadControls({ store: s, fetchFn: async () => ({ ok: true, json: async () => val }) }), val);
assert.deepEqual(cachedControls(s), val);
assert.deepEqual(cachedControls({ getItem: () => 'nope' }), {}, 'a broken copy is nothing');
console.log('✓ controls: skins by days or off, features on unless switched off, kept on the device');

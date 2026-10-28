// The lab's runtime flags (D-498), as a page reads them.
import assert from 'node:assert/strict';
import { flag, flagOn, stateOf, cachedFlags, loadFlags } from './flags.js';

assert.equal(stateOf({}, 'bn-salva'), 'lab', 'nothing saved: the lab, as before flags');
assert.equal(stateOf({ 'bn-salva': { state: 'all' } }, 'bn-salva'), 'all');
assert.equal(stateOf({ 'bn-salva': { state: 'weird' } }, 'bn-salva'), 'lab', 'a state out of the list is the lab');
assert.equal(flagOn('lab', true), true); assert.equal(flagOn('lab', false), false);
assert.equal(flagOn('all', false), true, 'all: every player');
assert.equal(flagOn('off', true), false, 'off: not even the lab');

let asked = 0;
const lab = v => async () => { asked++; return v; };
assert.equal(await flag('bn-salva', { load: async () => ({}), lab: lab(true) }), true);
assert.equal(await flag('bn-salva', { load: async () => ({}), lab: lab(false) }), false);
asked = 0;
assert.equal(await flag('bn-salva', { load: async () => ({ 'bn-salva': { state: 'all' } }), lab: lab(false) }), true);
assert.equal(asked, 0, 'the lab key is not asked when the flag is not lab');

const store = new Map(); const s = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
const val = { 'bn-salva': { state: 'all', at: 1 } };
assert.deepEqual(await loadFlags({ store: s, fetchFn: async () => ({ ok: true, json: async () => val }) }), val);
assert.deepEqual(cachedFlags(s), val, 'kept on the device');
assert.deepEqual(cachedFlags({ getItem: () => 'nope' }), {}, 'a broken copy is nothing');
console.log('✓ flags');

// The lab's 🚀 Publicar requests (D-480): which one is taken first and how sync moves them.
import assert from 'node:assert/strict';
import { branchOf, oldest, next, STALE_MS } from './lab-publish.mjs';

assert.equal(branchOf('seccion-copa-crear'), 'publish-copa-crear');
assert.deepEqual(oldest({ a: { state: 'requested', at: 5 }, b: { state: 'requested', at: 2 }, c: { state: 'pr', at: 1 } })[0], 'b', 'the oldest waiting');
assert.equal(oldest({ c: { state: 'merged', at: 1 } }), null, 'none waiting');
assert.equal(oldest(null), null);

assert.equal(next({ state: 'pr', pr: 1 }, { state: 'MERGED' }, 9).state, 'merged');
assert.equal(next({ state: 'pr', pr: 1 }, { state: 'CLOSED' }, 9).state, 'failed');
assert.equal(next({ state: 'pr', pr: 1 }, { state: 'OPEN' }, 9), null, 'an open PR waits');
assert.equal(next({ state: 'pr', pr: 1 }, null, 9), null, 'GitHub did not answer: try next time');
assert.equal(next({ state: 'working', started: 0 }, null, STALE_MS + 1).state, 'failed', 'a session that died');
assert.equal(next({ state: 'working', started: 0 }, null, 60000), null, 'one still working');
assert.equal(next({ state: 'requested', at: 0 }, null, STALE_MS * 9), null, 'a request waits for the job');
console.log('✓ lab publish');

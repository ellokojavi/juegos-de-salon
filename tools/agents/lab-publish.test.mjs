// The lab's 🚀 Publicar requests (D-480): which one is taken first and how sync moves them.
import assert from 'node:assert/strict';
import { branchOf, oldest, next, STALE_MS, CONFLICT_MS, FIX_MS } from './lab-publish.mjs';
import { toFix } from '../jobs/lab-publish-watch.mjs';

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
// A PR in conflict with main (#937): seen, then sent to be fixed once it lasts, then failed
const C = { state: 'OPEN', mergeable: 'CONFLICTING' };
assert.deepEqual(next({ state: 'pr', pr: 1 }, C, 100), { conflictAt: 100 }, 'first seen: noted, nothing else');
assert.equal(next({ state: 'pr', pr: 1, conflictAt: 100 }, C, 100 + CONFLICT_MS - 1), null, 'a stale read right after a push does not send anyone');
assert.deepEqual(next({ state: 'pr', pr: 1, conflictAt: 100 }, C, 100 + CONFLICT_MS + 1), { fixAt: 100 + CONFLICT_MS + 1 }, 'it lasted: a session brings it up to date');
assert.equal(next({ state: 'pr', pr: 1, conflictAt: 1, fixAt: 5 }, C, 5 + FIX_MS - 1), null, 'the fix is under way');
assert.equal(next({ state: 'pr', pr: 1, conflictAt: 1, fixAt: 5 }, C, 5 + FIX_MS + 1).state, 'failed', 'the fix did not take: Volver a pedir');
assert.deepEqual(next({ state: 'pr', pr: 1, conflictAt: 1, fixAt: 5 }, { state: 'OPEN', mergeable: 'MERGEABLE' }, 9), { conflictAt: null, fixAt: null }, 'cleared');
assert.equal(next({ state: 'pr', pr: 1 }, { state: 'OPEN', mergeable: 'UNKNOWN' }, 9), null, 'still being computed: wait');
assert.deepEqual(toFix('a: conflict seen\nseccion-x: conflict, sent to be fixed\n1 request(s) moved'), ['seccion-x'], 'the watcher starts a fix only for the sync that sent it');
console.log('✓ lab publish');

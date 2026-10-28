// What a waiting session is told about its PR (D-400).
import assert from 'node:assert/strict';
import { outcome, fromRest, MAX_ERRORS, settle, CONFLICT_READS } from './wait-pr.mjs';

const open = (checks = [], mergeable = 'MERGEABLE') => ({ state: 'OPEN', mergeable, checks });
assert.equal(outcome({ state: 'MERGED', mergeable: 'UNKNOWN', checks: [] }), 'merged');
assert.equal(outcome({ state: 'CLOSED', mergeable: 'UNKNOWN', checks: [] }), 'closed');
assert.equal(outcome(open([{ name: 'tests', conclusion: null }, { name: 'end-to-end', conclusion: null }])), null, 'still running: keep waiting');
assert.equal(outcome(open([{ name: 'tests', conclusion: 'SUCCESS' }, { name: 'end-to-end', conclusion: 'FAILURE' }])), 'failed: end-to-end');
assert.equal(outcome(open([{ name: 'g03 · cup/out.mjs', conclusion: 'FAILURE' }])), null, 'a group failing on its first try is not the verdict: end-to-end is');
assert.equal(outcome(open([], 'CONFLICTING')), 'conflict');
assert.equal(outcome(open([{ name: 'tests', conclusion: 'SUCCESS' }, { name: 'end-to-end', conclusion: 'SUCCESS' }])), null, 'green and open: auto-merge is about to merge it');
// D-441: the REST API gives the same verdicts where `gh pr view` is refused
const runs = [{ name: 'tests', conclusion: 'success' }, { name: 'end-to-end', conclusion: 'failure' }];
assert.equal(outcome(fromRest({ state: 'open', merged: false, mergeable_state: 'blocked' }, runs)), 'failed: end-to-end');
assert.equal(outcome(fromRest({ state: 'closed', merged: true, mergeable_state: 'unknown' }, [])), 'merged');
assert.equal(outcome(fromRest({ state: 'closed', merged: false, mergeable_state: 'unknown' }, [])), 'closed');
assert.equal(outcome(fromRest({ state: 'open', merged: false, mergeable_state: 'dirty' }, [])), 'conflict');
assert.equal(outcome(fromRest({ state: 'open', merged: false, mergeable_state: 'blocked' }, [{ name: 'tests', conclusion: null }])), null, 'running: keep waiting');
assert.ok(MAX_ERRORS > 1 && MAX_ERRORS <= 10, 'a few errors in a row end the wait, not one and not forever');
// A conflict stops only after CONFLICT_READS reads in a row: a stale read right after a push is not one (#919, #928)
assert.ok(CONFLICT_READS >= 2, 'one read of conflict is not enough');
let st = { conflicts: 0 };
for (let i = 1; i < CONFLICT_READS; i++) { st = settle('conflict', st.conflicts); assert.equal(st.stop, false, `conflict read ${i}: read again`); }
assert.equal(settle('conflict', st.conflicts).stop, true, 'conflict read every time: report it');
assert.deepEqual(settle(null, CONFLICT_READS - 1), { stop: false, conflicts: 0 }, 'the conflict went away: the streak starts over');
assert.equal(settle('merged', 1).stop, true, 'merged stops at once, even mid-streak');
assert.equal(settle('failed: tests').stop, true, 'a red check stops at once');
console.log('wait-pr: merged, closed, a red required check or a conflict, green');

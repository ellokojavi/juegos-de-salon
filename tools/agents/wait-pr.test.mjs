// What a waiting session is told about its PR (D-400).
import assert from 'node:assert/strict';
import { outcome } from './wait-pr.mjs';

const open = (checks = [], mergeable = 'MERGEABLE') => ({ state: 'OPEN', mergeable, checks });
assert.equal(outcome({ state: 'MERGED', mergeable: 'UNKNOWN', checks: [] }), 'merged');
assert.equal(outcome({ state: 'CLOSED', mergeable: 'UNKNOWN', checks: [] }), 'closed');
assert.equal(outcome(open([{ name: 'tests', conclusion: null }, { name: 'end-to-end', conclusion: null }])), null, 'still running: keep waiting');
assert.equal(outcome(open([{ name: 'tests', conclusion: 'SUCCESS' }, { name: 'end-to-end', conclusion: 'FAILURE' }])), 'failed: end-to-end');
assert.equal(outcome(open([{ name: 'g03 · cup/out.mjs', conclusion: 'FAILURE' }])), null, 'a group failing on its first try is not the verdict: end-to-end is');
assert.equal(outcome(open([], 'CONFLICTING')), 'conflict');
assert.equal(outcome(open([{ name: 'tests', conclusion: 'SUCCESS' }, { name: 'end-to-end', conclusion: 'SUCCESS' }])), null, 'green and open: auto-merge is about to merge it');
console.log('wait-pr: merged, closed, a red required check or a conflict, green');

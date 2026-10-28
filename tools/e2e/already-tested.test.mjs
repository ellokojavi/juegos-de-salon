// Run: node tools/e2e/already-tested.test.mjs
// When publish.yml doesn't repeat the end-to-end run (D-308): the same tree already tested, or a
// change that doesn't reach the browser over a tested parent. A mark from a fork doesn't count.
// And when it runs narrowed (D-496): a merge whose PR head passed gets smoke plus what it reaches.
import assert from 'node:assert/strict';
import { decide, validMark, MARK } from './already-tested.mjs';
import { chosenJobs } from './ci.mjs';

const run = (id, own = true) => ({ expired: false, workflow_run: { id, repository_id: 1, head_repository_id: own ? 1 : 2 } });

assert.equal(MARK('abc'), 'e2e-tree-abc');
assert.equal(validMark([]), null);
assert.equal(validMark([run(5, false)]), null, "a fork's mark doesn't count: it runs its own version of the workflow");
assert.equal(validMark([{ ...run(5), expired: true }]), null, "an expired mark doesn't count");
assert.equal(validMark([run(5, false), run(7)]).workflow_run.id, 7);

assert.equal(decide({ mark: run(7), parentMark: null, changes: null }).tested, true);
const docs = decide({ mark: null, parentMark: run(3), changes: ['docs/decisions/D-1.md', 'changelog/x.md'] });
assert.deepEqual([docs.tested, docs.inherited], [true, true]);
assert.equal(decide({ mark: null, parentMark: run(3), changes: ['public/index.html'] }).tested, false, 'a site change without its tree tested runs whole');
assert.equal(decide({ mark: null, parentMark: null, changes: ['docs/x.md'] }).tested, false, 'without a tested parent, there is nothing to inherit from');
assert.equal(decide({ mark: null, parentMark: null, changes: null }).tested, false);

// D-496: a merge whose PR head passed its own run retests only what the merge brings
const merge = decide({ mark: null, parentMark: null, changes: ['public/index.html'], headMark: run(9), base: 'abc' });
assert.deepEqual([merge.tested, merge.base], [false, 'abc']);
assert.equal(decide({ mark: null, parentMark: null, changes: ['public/index.html'], headMark: null, base: 'abc' }).base, undefined, "a PR head that didn't pass: whole");
assert.equal(decide({ mark: run(7), parentMark: null, changes: null, headMark: run(9), base: 'abc' }).tested, true, 'the same tree tested still skips it');
assert.ok(chosenJobs(['docs/x.md'], { smoke: true }).includes('smoke.mjs'), 'a merge always runs smoke, even with no browser change');
assert.deepEqual(chosenJobs(['docs/x.md']), [], 'a PR without browser changes still runs nothing');
assert.equal(chosenJobs(['public/index.html'], { smoke: true }).filter(j => j === 'smoke.mjs').length, 1, 'smoke only once');
console.log('already-tested: green');

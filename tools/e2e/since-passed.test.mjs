// Which commit a PR's push tests from (D-392): the last one before it that passed, or the whole PR.
import assert from 'node:assert/strict';
import { lastPassed, filesToTest, COMPARE_LIMIT, HEAD_MARK } from './since-passed.mjs';

const commits = ['a', 'b', 'c', 'd'];
const marks = new Set(['b']);
const passed = sha => marks.has(sha);

assert.equal(lastPassed(commits, 'd', passed), 'b', 'the newest earlier commit that passed');
assert.equal(lastPassed(commits, 'b', passed), null, 'its own mark does not count: a rerun tests it whole');
marks.add('c');
assert.equal(lastPassed(commits, 'd', passed), 'c', 'the newest wins over an older one');
assert.equal(lastPassed(commits, 'x', passed), null, 'a head not in the PR (a force push): the whole PR');
assert.equal(lastPassed(['a'], 'a', passed), null, 'a first push: the whole PR');

const prFiles = ['public/index.html', 'docs/x.md'];
assert.deepEqual(filesToTest({ since: 'c', compared: ['changelog/x.md'], prFiles }), { files: ['changelog/x.md'], since: 'c' }, 'only what changed since');
assert.deepEqual(filesToTest({ since: 'c', compared: [], prFiles }), { files: [], since: 'c' }, 'nothing changed (a rerun of a passed push): nothing to test');
assert.deepEqual(filesToTest({ since: null, compared: null, prFiles }), { files: prFiles, since: null });
assert.deepEqual(filesToTest({ since: 'c', compared: null, prFiles }).since, null, 'the compare failed: the whole PR');
assert.deepEqual(filesToTest({ since: 'c', compared: Array(COMPARE_LIMIT).fill('f'), prFiles }).files, prFiles, 'a compare at GitHub\'s limit may be cut: the whole PR');
assert.equal(HEAD_MARK('abc'), 'e2e-head-abc');

console.log('since-passed: a push tests what changed since its PR last passed, green');

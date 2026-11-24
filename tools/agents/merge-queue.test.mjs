import assert from 'node:assert/strict';
import { pick, stale, rank, diagnose, SLOW_MIN, STUCK_MIN, SILENT_MIN, queueWait, quantile, isMainMerge, summarize, LABEL } from './merge-queue.mjs';

const ok = [{ name: 'tests', conclusion: 'SUCCESS' }, { name: 'end-to-end', conclusion: 'SUCCESS' }];
const pr = (number, o = {}) => ({ number, isDraft: false, isCrossRepository: false, baseRefName: 'main', labels: [], headRefOid: `h${number}`,
  autoMergeRequest: { enabledAt: `2026-11-19T0${number}:00:00Z` }, mergeStateStatus: 'BEHIND', statusCheckRollup: ok, ...o });

assert.equal(pick([pr(3), pr(1), pr(2)]).pr.number, 1, 'the head of the line is the one with auto-merge on the longest');
assert.equal(pick([pr(1, { autoMergeRequest: null }), pr(2)]).pr.number, 2, 'no auto-merge, not in the line');
assert.equal(pick([pr(1, { labels: [{ name: 'needs-owner' }] }), pr(2)]).pr.number, 2, 'a 🔴 PR waiting for the owner is skipped');
assert.equal(pick([pr(1, { isDraft: true }), pr(2, { isCrossRepository: true })]).action, 'idle');
assert.equal(pick([pr(1, { mergeStateStatus: 'CLEAN' })]).action, 'idle', 'up to date: auto-merge merges it, nothing to do');
assert.equal(pick([pr(1, { statusCheckRollup: [{ name: 'tests', status: 'IN_PROGRESS' }] })]).action, 'idle', 'tests not passed yet: not in the line');
assert.equal(pick([pr(1, { statusCheckRollup: [ok[0]] })]).pr.number, 1, 'D-618: tests passed, end-to-end not run yet: in the line, it runs after the update');
assert.equal(pick([pr(1, { statusCheckRollup: [ok[0], { name: 'end-to-end', status: 'QUEUED' }] })]).pr.number, 1, 'D-618: end-to-end still running on the old main: in the line');
assert.equal(pick([pr(1, { statusCheckRollup: [ok[0], { name: 'end-to-end', conclusion: 'CANCELLED' }] })]).pr.number, 1, 'D-618: end-to-end cancelled by the queue: in the line');
assert.equal(pick([pr(1, { statusCheckRollup: [ok[0], { name: 'end-to-end', conclusion: 'FAILURE' }] })]).action, 'idle', 'a real end-to-end failure keeps it out until its session fixes it');
const running = [ok[0], { name: 'end-to-end', status: 'IN_PROGRESS' }];
assert.deepEqual(stale([pr(1, { statusCheckRollup: running }), pr(2, { statusCheckRollup: running, mergeStateStatus: 'BLOCKED' }),
  pr(3, { statusCheckRollup: running, autoMergeRequest: null }), pr(4), pr(5, { statusCheckRollup: running, labels: [{ name: 'needs-owner' }] })]).map(p => p.number), [1],
  'D-618: only a behind PR in the line\'s reach has its running end-to-end cancelled; an up-to-date one, one without auto-merge, a finished run and a 🔴 one keep theirs');
const flying = pr(5, { labels: [{ name: LABEL }], mergeStateStatus: 'BLOCKED', statusCheckRollup: [{ name: 'tests', status: 'IN_PROGRESS' }] });
assert.equal(pick([pr(1), flying]).action, 'wait', 'while the updated PR runs its checks, the rest wait: no avalanche');
assert.equal(pick([pr(1), { ...flying, statusCheckRollup: [{ name: 'tests', conclusion: 'FAILURE' }] }]).pr.number, 1, 'a red one no longer holds the line');
assert.equal(pick([pr(1), pr(2)], new Set(['1@h1'])).pr.number, 2, 'a conflicting head is skipped');

// D-619: which go first
const files = (...f) => ({ files: f.map(path => ({ path })), changedFiles: f.length });
assert.equal(rank(pr(1, files('tools/agents/merge-queue.mjs', 'changelog/x.md'))), 0, 'a fix to the queue itself goes first');
assert.equal(rank(pr(1, files('tools/agents/x.mjs', 'docs/X.md'))), 1, 'nothing under public/: fast');
assert.equal(rank(pr(1, files('public/hangman/x.js', 'docs/X.md'))), 2);
assert.equal(rank(pr(1, { files: [{ path: 'docs/X.md' }], changedFiles: 150 })), 2, 'a list cut short counts as slow');
assert.equal(rank(pr(1)), 2, 'no file list: slow');
assert.deepEqual([pr(1, files('public/a.js')), pr(2, files('docs/a.md')), pr(3, files('tools/agents/merge-queue.mjs'))]
  .map(p => pick([p, pr(9, files('public/b.js'))]).pr.number), [1, 2, 3], 'within a rank, the oldest first');
assert.equal(pick([pr(1, files('public/a.js')), pr(2, files('docs/a.md'))]).pr.number, 2, 'a fast PR passes an older slow one');
assert.equal(pick([pr(1, files('docs/a.md')), pr(2, files('tools/agents/merge-queue.mjs'))]).pr.number, 2, 'the queue fix passes everyone');

// D-619: the doctor
const now = Date.parse('2026-11-24T15:00:00Z');
const ago = m => new Date(now - m * 60e3).toISOString();
const run = (conclusion, m, id = m) => ({ databaseId: id, status: 'completed', conclusion, createdAt: ago(m) });
const kinds = o => diagnose({ prs: [], runs: [run('success', 1)], labelExists: true, now, ...o }).map(f => f.kind);
assert.deepEqual(kinds({}), [], 'all well');
assert.deepEqual(kinds({ labelExists: false }), ['label']);
assert.deepEqual(kinds({ runs: [run('failure', 1), run('cancelled', 2), run('failure', 3)] }), ['failing'], 'two failed steps in a row, cancelled ones aside');
assert.deepEqual(kinds({ runs: [run('failure', 1), run('success', 3)] }), [], 'one failure is not an alarm');
const fresh = { autoMergeRequest: { enabledAt: ago(10) } };
assert.deepEqual(kinds({ prs: [pr(1, fresh)], runs: [run('success', SILENT_MIN + 5)] }), ['silent'], 'one waits and the queue has not stepped');
assert.deepEqual(kinds({ prs: [pr(1, fresh)], runs: [run('success', 5)] }), [], 'the queue stepped lately: it will take it');
const inFlight = (m) => pr(1, { ...fresh, labels: [{ name: LABEL }], mergeStateStatus: 'BLOCKED', statusCheckRollup: [ok[0], { name: 'end-to-end', status: 'IN_PROGRESS', startedAt: ago(m) }] });
assert.deepEqual(kinds({ prs: [inFlight(SLOW_MIN + 5)] }), ['slow']);
assert.deepEqual(kinds({ prs: [inFlight(10)] }), []);
assert.deepEqual(kinds({ prs: [pr(1, { autoMergeRequest: { enabledAt: ago(STUCK_MIN + 5) }, mergeStateStatus: 'BLOCKED' })] }), ['stuck']);
assert.deepEqual(kinds({ prs: [pr(1, { autoMergeRequest: { enabledAt: ago(STUCK_MIN + 5) }, mergeStateStatus: 'BLOCKED', labels: [{ name: 'needs-owner' }] })] }), [], 'a 🔴 PR waits for the owner, not stuck');
assert.ok(diagnose({ prs: [], runs: [], labelExists: false, now }).every(f => f.kind !== 'label' || f.heal === 'label'), 'the label heals without a model');

assert.equal(quantile([5, 1, 3, 2, 4], 0.5), 3);
assert.equal(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9), 9);
assert.equal(quantile([], 0.5), null);
assert.ok(isMainMerge("Merge branch 'main' into topic"));
assert.ok(isMainMerge("Merge remote-tracking branch 'origin/main' into x"));
assert.ok(!isMainMerge('Merge pull request #1 from a/b'));

const at = (name, completedAt, conclusion = 'SUCCESS') => ({ name, completedAt, conclusion });
const merged = { mergedAt: '2026-11-19T10:30:00Z', autoMergeEnabledAt: '2026-11-19T09:00:00Z', commits: [
  { message: 'x', checks: [at('tests', '2026-11-19T08:00:00Z'), at('end-to-end', '2026-11-19T08:10:00Z', 'FAILURE')] },
  { message: "Merge branch 'main' into x", checks: [at('tests', '2026-11-19T09:50:00Z'), at('end-to-end', '2026-11-19T10:00:00Z')] }] };
assert.equal(queueWait(merged), 30, 'from both checks green after auto-merge on, to merged');
assert.equal(queueWait({ ...merged, autoMergeEnabledAt: undefined }), null);
const s = summarize({ prs: [merged, merged], issues: [{}], runs: [], from: '2026-11-19', to: '2026-11-20T23:59:59Z' });
assert.equal(s.mainMerges, 2);
assert.equal(s.wait.median, '30 min');
assert.equal(s.redIssues, 1);
console.log('✓ merge-queue: one PR at a time, oldest first, 🔴 and conflicts skipped; report numbers');

// Runs merge-queue.mjs `step` end to end against a fake `gh` on PATH: the pure tests in
// merge-queue.test.mjs never ran step() itself, and a name clash there crashed every real update (#1860).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, chmodSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), 'merge-queue.mjs');
const ok = [{ name: 'tests', conclusion: 'SUCCESS' }, { name: 'end-to-end', status: 'IN_PROGRESS' }];
const pr = n => ({ number: n, isDraft: false, isCrossRepository: false, baseRefName: 'main', labels: [], headRefOid: `h${n}`, headRefName: `b${n}`,
  author: { login: 'ellokojavi' }, autoMergeRequest: { enabledAt: `2026-11-24T0${n}:00:00Z` }, mergeStateStatus: 'BEHIND', statusCheckRollup: ok });

/** Runs one step with a fake gh; `labelMissing` makes the first --add-label fail as GitHub does. */
function run({ labelMissing }) {
  const dir = mkdtempSync(join(tmpdir(), 'mq-step-'));
  const log = join(dir, 'calls'), state = join(dir, 'label');
  if (!labelMissing) writeFileSync(state, '');
  writeFileSync(join(dir, 'gh'), `#!/usr/bin/env node
const fs = require('fs'); const a = process.argv.slice(2); const s = a.join(' ');
fs.appendFileSync(${JSON.stringify(log)}, s + '\\n');
if (s.startsWith('api repos/x/y/commits/main')) console.log('abc');
else if (s.includes('--workflow publish.yml')) console.log('[{"databaseId":1}]');
else if (s.startsWith('pr list')) console.log(${JSON.stringify(JSON.stringify([pr(1), pr(2)]))});
else if (s.includes('--workflow e2e.yml')) console.log('[{"databaseId":7,"status":"in_progress"}]');
else if (s.startsWith('label create')) fs.writeFileSync(${JSON.stringify(state)}, '');
else if (s.includes('--add-label') && !fs.existsSync(${JSON.stringify(state)})) { process.stderr.write("'merge-queue' not found\\n"); process.exit(1); }
`);
  chmodSync(join(dir, 'gh'), 0o755);
  try {
    execFileSync(process.execPath, [script, 'step'], { env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, GITHUB_REPOSITORY: 'x/y' }, stdio: 'pipe' });
    return readFileSync(log, 'utf8').trim().split('\n');
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

let calls = run({ labelMissing: false });
assert.ok(calls.includes('run cancel 7'), 'a behind PR\'s running end-to-end is cancelled (D-618)');
assert.ok(calls.some(c => c.startsWith('api -X PUT repos/x/y/pulls/1/update-branch')), 'the head of the line is updated');
assert.ok(calls.includes('pr edit 1 --add-label merge-queue'), 'and labelled as the one in flight');
assert.ok(!calls.some(c => c.includes('pulls/2/update-branch')), 'only one PR is updated');
calls = run({ labelMissing: true });
assert.ok(calls.some(c => c.startsWith('label create merge-queue')), 'a deleted label is made again');
assert.equal(calls.filter(c => c === 'pr edit 1 --add-label merge-queue').length, 2, 'then the PR is labelled');
console.log('✓ merge-queue step: cancels stale end-to-end, updates and labels one PR, remakes a deleted label');

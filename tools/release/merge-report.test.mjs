// Run: node tools/release/merge-report.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MARKER, READY_MARKER, STEPS, prOf, ready, report, testsConclusion } from './merge-report.mjs';

const base = { version: '0.172.0', siteUrl: 'https://juegosdesalon.cl/', runUrl: 'https://github.com/x/y/actions/runs/1' };
const all = r => Object.fromEntries(['tests', 'already-tested', 'e2e', 'rules', 'publish'].map(j => [j, { result: r }]));

/* Published */
{
  const { ok, body } = report({ ...base, results: all('success') });
  assert.equal(ok, true);
  assert.ok(body.startsWith(MARKER), 'carries the marker');
  assert.match(body, /✅ Merged and published: \*\*0\.172\.0\*\* is live on https:\/\/juegosdesalon\.cl\//);
  assert.match(body, /\(\[run\]\(https:\/\/github\.com\/x\/y\/actions\/runs\/1\)\)/);
}

/* The end-to-end run was skipped because the tree was already tested (D-308): still published */
{
  const results = { ...all('success'), e2e: { result: 'skipped' } };
  assert.equal(report({ ...base, results }).ok, true);
}

/* The first job that failed is the one named; the later ones were skipped because of it */
{
  const results = { ...all('skipped'), tests: { result: 'success' }, 'already-tested': { result: 'success' }, e2e: { result: 'failure' } };
  const { ok, body } = report({ ...base, results });
  assert.equal(ok, false);
  assert.match(body, /❌ Merged, but not published: the end-to-end run failed\. The "main is red" issue has the details\. The site still serves the previous version/);
}
{
  const results = { ...all('success'), publish: { result: 'failure' } };
  assert.match(report({ ...base, results }).body, /publishing the site failed\. It was the deploy or the check/);
}
{
  const results = { ...all('success'), rules: { result: 'cancelled' }, publish: { result: 'skipped' } };
  assert.match(report({ ...base, results }).body, /Firebase rules was cancelled/);
}

/* Nothing failed but nothing was published either: still a ❌, never silence */
{
  const { ok, body } = report({ ...base, results: all('skipped') });
  assert.equal(ok, false);
  assert.match(body, /not published: no step ran\. The site still serves/);
  assert.match(body, /re-run the failed jobs; if not, fix it in a new PR/);
}

/* The PR of the merge commit: only a merged one whose merge commit is this one */
{
  const pulls = [
    { number: 7, merged_at: null, merge_commit_sha: 'abc' },
    { number: 8, merged_at: '2026-10-15T00:00:00Z', merge_commit_sha: 'zzz' },
    { number: 9, merged_at: '2026-10-15T00:00:00Z', merge_commit_sha: 'abc' },
  ];
  assert.equal(prOf(pulls, 'abc'), 9);
  assert.equal(prOf(pulls, 'nope'), null);
  assert.equal(prOf([], 'abc'), null);
}

/* publish.yml: the report job runs last, always, waits for every job it names, and may comment */
{
  const yml = readFileSync(new URL('../../.github/workflows/publish.yml', import.meta.url), 'utf8');
  const job = yml.slice(yml.indexOf('\n  report:'));
  assert.ok(job.length > 20, 'publish.yml has a report job');
  for (const [name] of STEPS) assert.match(job, new RegExp(`needs:.*\\b${name}\\b`), `report waits for ${name}`);
  assert.match(job, /if: \$\{\{ always\(\) && github\.event_name == 'push' \}\}/, 'it reports failures too, and only for a merge');
  assert.match(job, /pull-requests: write/);
  assert.match(job, /node tools\/release\/merge-report\.mjs/);
  assert.match(job, /RESULTS: \$\{\{ toJSON\(needs\) \}\}/);
}

/* --ready: the comment that wakes the session, while the PR is still open */
{
  assert.match(ready({ autoMerge: true, tests: 'success' }), /✅ Both checks are green: auto-merge merges this PR now/);
  assert.ok(ready({ autoMerge: true, tests: 'success' }).startsWith(READY_MARKER));
  assert.match(ready({ autoMerge: true, tests: null }), /as soon as `tests` passes/);
  assert.equal(ready({ autoMerge: true, tests: 'failure' }), null, 'a red `tests` is reported by the monitor itself');
  assert.equal(ready({ autoMerge: false, tests: 'success' }), null, 'without auto-merge nobody is about to merge it');
}

/* The latest `tests` run decides; one still running is null */
{
  assert.equal(testsConclusion([]), null);
  assert.equal(testsConclusion([{ status: 'in_progress', conclusion: null, started_at: '2026-10-15T10:00:00Z' }]), null);
  assert.equal(testsConclusion([
    { status: 'completed', conclusion: 'failure', started_at: '2026-10-15T09:00:00Z' },
    { status: 'completed', conclusion: 'success', started_at: '2026-10-15T10:00:00Z' },
  ]), 'success');
}

/* e2e.yml: the comment goes inside the required end-to-end job, only on a PR of this repo, and never turns it red */
{
  const yml = readFileSync(new URL('../../.github/workflows/e2e.yml', import.meta.url), 'utf8');
  const job = yml.slice(yml.indexOf('\n  end-to-end:'), yml.indexOf('\n  notify:'));
  assert.match(job, /pull-requests: write/);
  assert.match(job, /checks: read/);
  const step = job.slice(job.lastIndexOf('- if:'));
  assert.match(step, /github\.event_name == 'pull_request' && github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
  assert.match(step, /continue-on-error: true/);
  assert.match(step, /node tools\/release\/merge-report\.mjs --ready/);
  // The hold keeps the PR open long enough for the monitor to read the comment (#427 lost it in 15 s)
  // publish.yml calls e2e.yml: it has to grant what end-to-end asks for, or the call fails to start
  const pub = readFileSync(new URL('../../.github/workflows/publish.yml', import.meta.url), 'utf8');
  const call = pub.slice(pub.indexOf('\n  e2e:'), pub.indexOf('\n  rules:'));
  for (const p of ['checks: read', 'pull-requests: write']) assert.ok(call.includes(p), `publish.yml grants ${p} to e2e.yml`);
}

console.log('ok merge-report');

// D-506: overtaken by a newer merge, which publishes it: not a failure
{
  const r = report({ results: { tests: { result: 'success' }, rules: { result: 'success', outputs: { newest: 'false' } }, publish: { result: 'skipped' } }, version: '', siteUrl: '', runUrl: '' });
  assert.equal(r.ok, true);
  assert.match(r.body, /newer merge/);
}

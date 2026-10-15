// Run: node tools/release/merge-report.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MARKER, STEPS, prOf, report } from './merge-report.mjs';

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

console.log('ok merge-report');

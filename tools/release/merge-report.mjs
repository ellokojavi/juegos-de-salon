// Tells the merged PR how its publication went, with a comment (D-323). publish.yml runs it last.
//
// With auto-merge (D-216) a PR merges by itself when its checks pass, and publish.yml takes it to
// the site. The session that opened the PR has the app's CI monitor on (D-218), which wakes it on a
// failure, a conflict or a new comment, but not when everything goes well: the work after the
// merge waited for the owner to say "it merged". A comment on the PR is an event the monitor
// already relays, so this is how the session learns that its change is live (or that it isn't).
//
//   node tools/release/merge-report.mjs      # in publish.yml, with RESULTS, VERSION, SITE_URL, RUN_URL
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** The jobs of publish.yml, in the order they run, and what each one means if it fails. */
export const STEPS = [
  ['tests', 'the tests'],
  ['e2e', 'the end-to-end run (the "main is red" issue has the details)'],
  ['rules', 'publishing the Firebase rules'],
  ['publish', 'publishing the site, or checking that it serves the new version'],
];

export const MARKER = '<!-- merge-report -->';

/**
 * The comment, from the `needs` of the report job: `{ job: { result } }`.
 * @returns {{ ok: boolean, body: string }}
 */
export function report({ results, version, siteUrl, runUrl }) {
  const run = runUrl ? ` ([run](${runUrl}))` : '';
  if (results.publish?.result === 'success') {
    return { ok: true, body: `${MARKER}\n✅ Merged and published: **${version}** is live on ${siteUrl}${run}.` };
  }
  const failed = STEPS.find(([job]) => ['failure', 'cancelled'].includes(results[job]?.result));
  const why = failed
    ? `${failed[1]} ${results[failed[0]].result === 'cancelled' ? 'was cancelled' : 'failed'}`
    : 'the site was not published';
  return { ok: false, body: `${MARKER}\n❌ Merged, but not published: ${why}. The site still serves the previous version${run}.` };
}

/** The PR that merged this commit, or null (a push straight to main, or a manual run). */
export function prOf(pulls, sha) {
  const pr = pulls.find(p => p.merged_at && p.merge_commit_sha === sha);
  return pr ? pr.number : null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sh = (...a) => execFileSync(a[0], a.slice(1), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const repo = process.env.GITHUB_REPOSITORY;
  const sha = process.env.GITHUB_SHA;
  const { ok, body } = report({
    results: JSON.parse(process.env.RESULTS || '{}'),
    version: process.env.VERSION || '?',
    siteUrl: process.env.SITE_URL || 'https://juegosdesalon.cl/',
    runUrl: process.env.RUN_URL || '',
  });
  console.log(body.replace(MARKER + '\n', ''));
  let pr = null;
  try { pr = prOf(JSON.parse(sh('gh', 'api', `repos/${repo}/commits/${sha}/pulls`)), sha); } catch (e) { console.log(`::warning::couldn't find the PR of ${sha}: ${String(e.message).split('\n')[0]}`); }
  if (!pr) { console.log(`no merged PR for ${sha}: nothing to tell`); process.exit(0); }
  sh('gh', 'pr', 'comment', String(pr), '--repo', repo, '--body', body);
  console.log(`commented on #${pr} (${ok ? 'published' : 'not published'})`);
}

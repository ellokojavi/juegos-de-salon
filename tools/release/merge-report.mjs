// Comments that tell the PR's session where its change is (D-323).
//
// With auto-merge (D-216) a PR merges by itself when its checks pass, and publish.yml takes it to
// the site. The session that opened the PR has the app's CI monitor on (D-218), which wakes it on a
// failure, a conflict or a new comment, but not when everything goes well: the work after the
// merge waited for the owner to say "it merged". A comment is an event the monitor relays, with
// two limits found by trying it (#427, #428): it ignores the comments of the PR owner's own
// account (a bot's do get through), and it stops listening once the PR is closed. So:
//
//   --ready   the last step of the required `end-to-end` check, on a PR with auto-merge on: the
//             PR is still open (auto-merge waits for this very check), and the comment says it
//             merges now. It no longer holds the check (D-400): holding it two minutes so the app's
//             monitor could read it delayed every merge, and sessions now learn of the merge with
//             `tools/agents/wait-pr.mjs`, which asks GitHub itself.
//   (none)    the last job of publish.yml: comments on the merged PR whether its version is live.
//             It no longer wakes anyone, but it records which version went live and when, and the
//             owner gets it by email.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** The jobs of publish.yml, in the order they run: what each one is, and where to look if it fails. */
export const STEPS = [
  ['tests', 'the tests', ''],
  ['e2e', 'the end-to-end run', ' The "main is red" issue has the details.'],
  ['rules', 'publishing the Firebase rules', ''],
  ['publish', 'publishing the site', ' It was the deploy or the check that the site serves the new version.'],
];

export const MARKER = '<!-- merge-report -->';
export const READY_MARKER = '<!-- merge-ready -->';

/**
 * The comment of the `end-to-end` check when it passes on a PR, or null when there is nothing to
 * tell: auto-merge off (nobody is about to merge it), or `tests` already red (the monitor reports
 * that failure by itself).
 * @param {{ autoMerge: boolean, tests: string|null }} o   `tests`: the conclusion of the `tests` check, null while it runs
 */
export function ready({ autoMerge, tests }) {
  if (!autoMerge) return null;
  if (tests === 'success') return `${READY_MARKER}\n✅ Both checks are green: auto-merge merges this PR now, and publish.yml takes it to the site.`;
  if (tests === null) return `${READY_MARKER}\n✅ The end-to-end run is green: auto-merge merges this PR as soon as \`tests\` passes.`;
  return null;
}

/**
 * The comment of publish.yml, from the `needs` of the report job: `{ job: { result } }`.
 * @returns {{ ok: boolean, body: string }}
 */
export function report({ results, version, siteUrl, runUrl }) {
  const run = runUrl ? ` ([run](${runUrl}))` : '';
  // A newer merge reached main before this one deployed, and its run publishes both (D-506)
  if ([results.rules, results.publish].some(j => j?.outputs?.newest === 'false')) {
    return { ok: true, body: `${MARKER}\n✅ Merged. A newer merge reached main first, and its run publishes this change with it${run}.` };
  }
  if (results.publish?.result === 'success') {
    return { ok: true, body: `${MARKER}\n✅ Merged and published: **${version}** is live on ${siteUrl}${run}.` };
  }
  const failed = STEPS.find(([job]) => ['failure', 'cancelled'].includes(results[job]?.result));
  const why = failed
    ? `${failed[1]} ${results[failed[0]].result === 'cancelled' ? 'was cancelled' : 'failed'}.${failed[2]}`
    : 'no step ran.';
  return {
    ok: false,
    body: `${MARKER}\n❌ Merged, but not published: ${why} The site still serves the previous version${run}.\n\n`
      + 'If it was intermittent, re-run the failed jobs; if not, fix it in a new PR, whose merge publishes this change too.',
  };
}

/** The PR that merged this commit, or null (a push straight to main, or a manual run). */
export function prOf(pulls, sha) {
  const pr = pulls.find(p => p.merged_at && p.merge_commit_sha === sha);
  return pr ? pr.number : null;
}

/** The conclusion of the latest `tests` check run, or null while it runs (or if there is none yet). */
export function testsConclusion(runs) {
  const latest = [...runs].sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)))[0];
  return latest && latest.status === 'completed' ? latest.conclusion : null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sh = (...a) => execFileSync(a[0], a.slice(1), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const repo = process.env.GITHUB_REPOSITORY;

  if (process.argv.includes('--ready')) {
    const pr = process.env.PR;
    const pull = JSON.parse(sh('gh', 'api', `repos/${repo}/pulls/${pr}`));
    const runs = JSON.parse(sh('gh', 'api', `repos/${repo}/commits/${pull.head.sha}/check-runs?check_name=tests`)).check_runs || [];
    const body = ready({ autoMerge: !!pull.auto_merge, tests: testsConclusion(runs) });
    if (!body) { console.log(`#${pr}: nothing to tell (auto-merge ${pull.auto_merge ? 'on' : 'off'})`); process.exit(0); }
    sh('gh', 'pr', 'comment', pr, '--repo', repo, '--body', body);
    console.log(`commented on #${pr}: ${body.split('\n')[1]}`);
    process.exit(0);
  }

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

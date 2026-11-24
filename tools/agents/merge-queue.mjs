#!/usr/bin/env node
/**
 * The homemade merge queue (D-586, a trial). The repo is personal, so GitHub's merge queue is not
 * offered; main went red when two PRs that passed alone failed together (#1567), because a PR merged
 * tested against a stale main. With "require branches up to date" on, auto-merge never merges a PR
 * that is behind main, and this script brings ONE behind PR at a time up to date, so its checks run
 * on main + PR. The others wait their turn: no avalanche of updates and re-runs.
 *
 *   node tools/agents/merge-queue.mjs step [--dry]          # one queue step (merge-queue.yml runs it)
 *   node tools/agents/merge-queue.mjs report [--since <yyyy-mm-dd>] [--until <yyyy-mm-dd>]
 *
 * `step`: a PR is in the line when it is open, not a draft, from this repo, has auto-merge on, is not
 * waiting for the owner (`needs-owner`, 🔴), is behind main, `tests` passed and `end-to-end` did not
 * fail (D-618: `end-to-end` runs once, after the update; a behind PR's running `end-to-end` is
 * cancelled, since it tests a main the PR can no longer merge into). While the PR the queue last updated (label `merge-queue`) still runs its checks,
 * nothing else moves. Otherwise the head of the line (auto-merge on the longest) is updated by
 * merging main in (GitHub's update-branch, never a rebase); if that conflicts, sync-pr.mjs tries
 * (a conflict only in generated files, D-580); a real conflict gets one comment and the PR is
 * skipped until its session fixes it. A merge made by a token that wakes no workflow leaves main
 * without a Publish run: the step dispatches publish.yml for main's head when it has none.
 * Off switch: repo variable MERGE_QUEUE=off (read as env MERGE_QUEUE).
 *
 * `report`: for the trial period and the same-length baseline just before the trial start, PRs
 * merged per day, "main is red" issues opened, red Publish / End to end runs on main, queue wait
 * (green with auto-merge on → merged: median, p90, max) and the main-merge commits on PRs (each one
 * re-runs tests and end-to-end).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TRIAL_START = '2026-11-19';
export const REQUIRED = ['tests', 'end-to-end'];
export const LABEL = 'merge-queue';
export const CONFLICT_MARK = '<!-- merge-queue:conflict ';
const OWNER = 'ellokojavi';

const checkState = (pr, name) => {
  const runs = (pr.statusCheckRollup || []).filter(c => (c.name || c.context) === name);
  if (!runs.length) return 'missing';
  const c = runs[runs.length - 1];
  const v = (c.conclusion || c.state || '').toUpperCase();
  if (v === 'SUCCESS') return 'success';
  if (v === 'CANCELLED') return 'cancelled';
  if (['FAILURE', 'ERROR', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'STARTUP_FAILURE'].includes(v)) return 'failure';
  return 'pending';
};
export const green = pr => REQUIRED.every(n => checkState(pr, n) === 'success');
export const failed = pr => REQUIRED.some(n => ['failure', 'cancelled'].includes(checkState(pr, n)));
/**
 * Ready to join the line (D-618): `tests` passed and `end-to-end` did not fail. An `end-to-end` still
 * running, never run or cancelled (the queue cancels it on a behind PR) does not hold a PR out: it runs
 * once, after the update, on today's main. A real `end-to-end` failure does, until its session fixes it.
 */
export const ready = pr => checkState(pr, 'tests') === 'success' && checkState(pr, 'end-to-end') !== 'failure';
/**
 * The PRs whose `end-to-end` run is wasted (D-618): in the line's reach (eligible) and behind main, so
 * that run tests a main the PR can no longer merge into; it runs again once the queue updates the PR.
 */
export const stale = prs => prs.filter(p => eligible(p) && p.mergeStateStatus === 'BEHIND' && checkState(p, 'end-to-end') === 'pending');
const labels = pr => (pr.labels || []).map(l => l.name);

/** Whether a PR may be in the line at all. */
export const eligible = pr => !pr.isDraft && !pr.isCrossRepository && pr.autoMergeRequest
  && pr.baseRefName === 'main' && !labels(pr).includes('needs-owner');

/**
 * What the queue does now: `wait` (the PR it updated still runs its checks), `update` (the head of
 * the line) or `idle`. `skip` holds PRs left out for a conflict on their current head.
 */
export function pick(prs, skip = new Set()) {
  const inFlight = prs.find(p => labels(p).includes(LABEL) && eligible(p)
    && p.mergeStateStatus !== 'BEHIND' && p.mergeStateStatus !== 'DIRTY' && !failed(p) && !green(p));
  if (inFlight) return { action: 'wait', pr: inFlight };
  const line = prs.filter(p => eligible(p) && p.mergeStateStatus === 'BEHIND' && ready(p) && !skip.has(`${p.number}@${p.headRefOid}`))
    .sort((a, b) => Date.parse(a.autoMergeRequest.enabledAt) - Date.parse(b.autoMergeRequest.enabledAt) || a.number - b.number);
  return line.length ? { action: 'update', pr: line[0], behindIt: line.length - 1 } : { action: 'idle' };
}

// ---- report helpers (pure) ----
export function quantile(xs, q) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(q * s.length) - 1)];
}
export const isMainMerge = msg => /^Merge (remote-tracking )?branch '(origin\/)?main'/.test(msg || '');

/** Minutes from "green with auto-merge on" to merged, or null when it cannot be told. */
export function queueWait(pr) {
  const enabled = pr.autoMergeEnabledAt ? Date.parse(pr.autoMergeEnabledAt) : null;
  const merged = Date.parse(pr.mergedAt);
  if (!enabled) return null;
  // the first moment, after auto-merge was on, when some head had both required checks green
  let greenAt = null;
  for (const c of pr.commits || []) {
    const t = REQUIRED.map(n => c.checks.filter(k => k.name === n && k.conclusion === 'SUCCESS').map(k => Date.parse(k.completedAt)));
    if (t.some(x => !x.length)) continue;
    const at = Math.max(...t.map(x => Math.min(...x)));
    const start = Math.max(at, enabled);
    if (start <= merged && (greenAt === null || start < greenAt)) greenAt = start;
  }
  return greenAt === null ? null : Math.max(0, (merged - greenAt) / 60000);
}

export function summarize({ prs, issues, runs, from, to }) {
  const days = Math.max(1, (Date.parse(to) - Date.parse(from)) / 86400000);
  const waits = prs.map(queueWait).filter(w => w !== null);
  const r = n => (n === null ? '–' : `${Math.round(n)} min`);
  return {
    merged: prs.length,
    perDay: +(prs.length / days).toFixed(1),
    redIssues: issues.length,
    redRuns: runs.length,
    wait: { n: waits.length, median: r(quantile(waits, 0.5)), p90: r(quantile(waits, 0.9)), max: r(waits.length ? Math.max(...waits) : null) },
    mainMerges: prs.reduce((s, p) => s + (p.commits || []).filter(c => isMainMerge(c.message)).length, 0),
  };
}

// ---- GitHub ----
const gh = (...a) => execFileSync('gh', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
const repo = () => process.env.GITHUB_REPOSITORY || JSON.parse(gh('repo', 'view', '--json', 'nameWithOwner')).nameWithOwner;

function mergedPrs(from, to) {
  const [owner, name] = repo().split('/');
  const out = [];
  let after = null;
  const q = `query($q:String!,$after:String){search(type:ISSUE,query:$q,first:20,after:$after){pageInfo{hasNextPage endCursor}nodes{... on PullRequest{number mergedAt
    timelineItems(itemTypes:[AUTO_MERGE_ENABLED_EVENT],last:1){nodes{... on AutoMergeEnabledEvent{createdAt}}}
    commits(last:30){nodes{commit{message:messageHeadline checkSuites(first:10){nodes{checkRuns(first:25){nodes{name conclusion completedAt}}}}}}}}}}}`;
  do {
    const args = ['api', 'graphql', '-f', `query=${q}`, '-f', `q=repo:${owner}/${name} is:pr is:merged base:main merged:${from}..${to}`];
    if (after) args.push('-f', `after=${after}`);
    const s = JSON.parse(gh(...args)).data.search;
    for (const n of s.nodes) out.push({
      number: n.number, mergedAt: n.mergedAt,
      autoMergeEnabledAt: n.timelineItems.nodes[0]?.createdAt,
      commits: n.commits.nodes.map(({ commit: c }) => ({ message: c.message, checks: c.checkSuites.nodes.flatMap(s => s.checkRuns.nodes) })),
    });
    after = s.pageInfo.hasNextPage ? s.pageInfo.endCursor : null;
  } while (after);
  return out;
}

function period(from, to) {
  const issues = JSON.parse(gh('issue', 'list', '--state', 'all', '--limit', '200', '--search', `"main is red" in:title created:${from}..${to}`, '--json', 'number,title'))
    .filter(i => /main is red|main en rojo/i.test(i.title));
  const runs = ['publish.yml', 'e2e.yml'].flatMap(w => JSON.parse(gh('run', 'list', '--workflow', w, '--branch', 'main', '--limit', '500', '--created', `${from}..${to}`, '--json', 'conclusion,event'))
    .filter(r => r.conclusion === 'failure' && r.event !== 'pull_request'));
  return summarize({ prs: mergedPrs(from, to), issues, runs, from, to: `${to}T23:59:59Z` });
}

function report(argv) {
  const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const from = opt('--since') || TRIAL_START;
  const to = opt('--until') || new Date().toISOString().slice(0, 10);
  const len = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  const bTo = new Date(Date.parse(from) - 86400000).toISOString().slice(0, 10);
  const bFrom = new Date(Date.parse(from) - len * 86400000).toISOString().slice(0, 10);
  const rows = [['', `trial ${from}..${to}`, `baseline ${bFrom}..${bTo}`]];
  const [t, b] = [period(from, to), period(bFrom, bTo)];
  for (const [k, f] of [['PRs merged', x => x.merged], ['PRs merged per day', x => x.perDay], ['"main is red" issues', x => x.redIssues],
    ['red Publish / End to end runs on main', x => x.redRuns], ['queue wait median', x => x.wait.median], ['queue wait p90', x => x.wait.p90],
    ['queue wait max', x => x.wait.max], ['PRs with a measurable wait', x => x.wait.n], ['main-merge commits on PRs (extra test runs)', x => x.mainMerges]]) rows.push([k, String(f(t)), String(f(b))]);
  const w = [0, 1, 2].map(i => Math.max(...rows.map(r => r[i].length)));
  for (const r of rows) console.log(r.map((c, i) => c.padEnd(w[i])).join('  '));
  console.log('Times are UTC days; queue wait counts from both required checks green with auto-merge on.');
}

function step(argv) {
  if ((process.env.MERGE_QUEUE || 'on').toLowerCase() === 'off') { console.log('merge-queue: off (MERGE_QUEUE=off)'); return 0; }
  const dry = argv.includes('--dry');
  const R = repo();
  // a merge by a token that wakes nothing (auto-merge turned on by the workflow token) left no Publish run
  const head = gh('api', `repos/${R}/commits/main`, '--jq', '.sha').trim();
  const pub = JSON.parse(gh('run', 'list', '--workflow', 'publish.yml', '--commit', head, '--limit', '1', '--json', 'databaseId'));
  if (!pub.length && !dry) { gh('workflow', 'run', 'publish.yml', '--ref', 'main'); console.log(`merge-queue: main ${head.slice(0, 7)} had no Publish run: started one`); }
  const prs = JSON.parse(gh('pr', 'list', '--base', 'main', '--state', 'open', '--limit', '100', '--json',
    'number,isDraft,isCrossRepository,autoMergeRequest,baseRefName,labels,mergeStateStatus,statusCheckRollup,headRefName,headRefOid,author'));
  for (const p of prs) if (labels(p).includes(LABEL) && failed(p) && !dry) gh('pr', 'edit', String(p.number), '--remove-label', LABEL);
  for (const p of stale(prs)) cancelStale(p, dry);
  const skip = new Set();
  for (;;) {
    const next = pick(prs, skip);
    if (next.action === 'idle') { console.log('merge-queue: nobody waiting'); return 0; }
    if (next.action === 'wait') { console.log(`merge-queue: #${next.pr.number} runs its checks on main; the rest wait`); return 0; }
    const p = next.pr;
    console.log(`merge-queue: updating #${p.number} (${next.behindIt} behind it)`);
    if (dry) return 0;
    if (update(R, p)) { mark(p.number); return 0; }
    skip.add(`${p.number}@${p.headRefOid}`);
    const mark = `${CONFLICT_MARK}${p.headRefOid} -->`;
    const said = gh('api', `repos/${R}/issues/${p.number}/comments`, '--paginate', '--jq', '.[].body').includes(mark);
    if (!said) gh('pr', 'comment', String(p.number), '--body', `${mark}\nMerge queue (D-586): this PR is next in line but merging \`main\` into it conflicts, so the queue skips it. Its session fixes it with \`node tools/agents/sync-pr.mjs\` (or by hand) and pushes; the PR then joins the line again.`);
  }
}

/** Cancels the running `end-to-end` of a PR that is behind main (D-618). A refusal is logged, never fatal. */
function cancelStale(p, dry) {
  let runs = [];
  try {
    runs = JSON.parse(gh('run', 'list', '--workflow', 'e2e.yml', '--branch', p.headRefName, '--event', 'pull_request',
      '--limit', '5', '--json', 'databaseId,status'));
  } catch (e) { console.log(`merge-queue: could not list #${p.number}'s end-to-end runs: ${String(e.stderr || e.message).trim().split('\n')[0]}`); return; }
  for (const r of runs.filter(r => r.status !== 'completed')) {
    console.log(`merge-queue: #${p.number} is behind main: cancelling its end-to-end run ${r.databaseId}`);
    if (dry) continue;
    try { gh('run', 'cancel', String(r.databaseId)); }
    catch (e) { console.log(`merge-queue: cancel refused for run ${r.databaseId}: ${String(e.stderr || e.message).trim().split('\n')[0]}`); }
  }
}

/**
 * Labels the PR the queue just updated. If the label was deleted, it is made again first: without it
 * the queue loses track of the PR in flight and updates another on every run (2026-11-24, an hour of
 * failed steps and six PRs testing at once).
 */
function mark(n) {
  try { gh('pr', 'edit', String(n), '--add-label', LABEL); return; }
  catch (e) { if (!/not found/i.test(String(e.stderr || e.message))) throw e; }
  gh('label', 'create', LABEL, '--force', '--color', '5319e7', '--description', 'The merge queue brought this PR up to date (D-586)');
  gh('pr', 'edit', String(n), '--add-label', LABEL);
}

/** Merges main into the PR: GitHub's update-branch, then sync-pr.mjs for generated-file conflicts. */
function update(R, p) {
  try { gh('api', '-X', 'PUT', `repos/${R}/pulls/${p.number}/update-branch`, '-f', `expected_head_sha=${p.headRefOid}`); return true; }
  catch (e) { console.log(`merge-queue: update-branch refused for #${p.number}: ${String(e.stderr || e.message).trim().split('\n')[0]}`); }
  if (p.author?.login !== OWNER) return false; // sync-pr runs the branch's generators: insiders only
  const dir = mkdtempSync(join(tmpdir(), 'mq-'));
  const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    git('worktree', 'add', '-q', '-B', p.headRefName, dir, `origin/${p.headRefName}`);
    const code = (() => { try { execFileSync('node', [join(dirname(fileURLToPath(import.meta.url)), 'sync-pr.mjs')], { cwd: dir, stdio: 'inherit' }); return 0; } catch (e) { return e.status; } })();
    return code === 0;
  } catch (e) { console.log(`merge-queue: sync-pr could not run: ${e.message.split('\n')[0]}`); return false; }
  finally { try { git('worktree', 'remove', '--force', dir); } catch (_) { rmSync(dir, { recursive: true, force: true }); } }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'step') process.exit(step(rest));
  else if (cmd === 'report') report(rest);
  else { console.log('usage: merge-queue.mjs step [--dry] | report [--since yyyy-mm-dd] [--until yyyy-mm-dd]'); process.exit(2); }
}

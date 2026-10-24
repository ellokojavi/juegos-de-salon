#!/usr/bin/env node
/**
 * Pending work nobody is watching (D-441): open PRs that are stuck, and branches on GitHub whose
 * commits never reached `main` and have no open PR. A session waits for its own PR (wait-pr.mjs,
 * D-400) and the processes round looks at what waits (D-273), but both can stop: a session ends, its
 * waiter gives up after two hours, the round stalls (D-440). And a branch with no PR is invisible to
 * all of them: on 2026-10-24 ten branches held commits nobody had looked at for weeks, some pushed
 * after their PR had already merged, others pushed by the worktree cleanup "so nothing is lost".
 *
 *   node tools/agents/pending.mjs check    # lists stuck PRs and stranded branches (exit 0 either way)
 *   node tools/agents/pending.mjs notify   # pending-watch.yml: keeps the "Pending work" issue current, closes it when empty
 *
 * Only the REST API (`gh api`), so it works on GitHub, on the Mac mini and in a cloud session alike.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const REPO = 'ellokojavi/juegos-de-salon';
export const TITLE = 'Pending work';
const HOUR = 3600 * 1000;
/** The checks `main` requires (D-216). */
const REQUIRED = ['tests', 'end-to-end'];
/** Never stranded: the published branches and the decision reservations (D-301). */
const SKIP = /^(main|gh-pages|reserve\/|reserva\/)/;

/**
 * Why an open PR is stuck, or [] if it is moving. A PR younger than its grace is left alone: its
 * session is still on it. `red` holds the required checks that failed on its head commit;
 * `conflict` is GitHub's `mergeable_state` "dirty".
 */
export function stuck({ draft, autoMerge, conflict, red = [], createdAt, pushedAt }, now = Date.now()) {
  const age = (now - Date.parse(createdAt)) / HOUR;
  const idle = (now - Date.parse(pushedAt || createdAt)) / HOUR;
  const why = [];
  if (draft) return age > 7 * 24 ? [`a draft for ${Math.floor(age / 24)} days`] : [];
  if (red.length && idle > 6) why.push(`red for ${Math.floor(idle)} h: ${red.join(', ')}`);
  if (conflict && idle > 6) why.push(`in conflict with main for ${Math.floor(idle)} h`);
  if (!autoMerge && age > 24) why.push(`open ${Math.floor(age)} h without auto-merge (waiting for the owner's review, or forgotten?)`);
  if (!why.length && age > 48) why.push(`open ${Math.floor(age / 24)} days`);
  return why;
}

/**
 * Whether a branch is stranded: commits that are not on main (`ahead`), no open PR from it, and
 * idle more than a day (a session may be about to open its PR). `mergedPr` is the number of a PR
 * from this branch that already merged, if any: then the commits came after it and nobody saw them.
 */
export function stranded({ name, ahead, openPr, lastDate, mergedPr = null }, now = Date.now()) {
  if (SKIP.test(name) || !ahead || openPr) return null;
  const days = Math.floor((now - Date.parse(lastDate)) / (24 * HOUR));
  if (now - Date.parse(lastDate) < 24 * HOUR) return null;
  return `${ahead} commit(s) not on main, last ${days} day(s) ago${mergedPr ? `, pushed after #${mergedPr} merged` : ', no PR'}`;
}

/** The issue's text: each item one line with its link, and what to do with it. */
export function issueBody({ prs, branches }) {
  const lines = [];
  if (prs.length) {
    lines.push('**Stuck PRs**', ...prs.map(p => `- #${p.number} ${p.title}: ${p.why.join('; ')}`), '');
    lines.push('Fix the check or the conflict, turn on auto-merge (D-419), or close it saying why.', '');
  }
  if (branches.length) {
    lines.push('**Branches with work that is not on main**',
      ...branches.map(b => `- [\`${b.name}\`](https://github.com/${REPO}/compare/main...${encodeURIComponent(b.name)}): ${b.why}`), '');
    lines.push('For each: open a PR if the work is still wanted, or delete the branch if main already has it another way.', '');
  }
  lines.push('Kept current every day by `pending-watch.yml` (D-441); it closes itself when nothing is left. The processes round works this list too.');
  return lines.join('\n');
}

const api = (path, ...args) => JSON.parse(execFileSync('gh', ['api', ...args, path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }));

/** Every page of a list (by number: `--paginate` follows links some proxies refuse). */
const pages = path => { const all = []; for (let n = 1; ; n++) { const p = api(`${path}?per_page=100&page=${n}`); all.push(...p); if (p.length < 100) return all; } };

/** The required checks that failed on a commit. */
export function redChecks(sha) {
  return [...new Set(api(`repos/${REPO}/commits/${sha}/check-runs?per_page=100`).check_runs
    .filter(c => REQUIRED.includes(c.name) && ['failure', 'cancelled', 'timed_out', 'action_required'].includes(c.conclusion))
    .map(c => c.name))];
}

/** Reads GitHub: the stuck PRs and the stranded branches, each with its reasons. */
export function gather(now = Date.now()) {
  const open = pages(`repos/${REPO}/pulls`).filter(p => p.state === 'open');
  const prs = [];
  for (const p of open) {
    const full = api(`repos/${REPO}/pulls/${p.number}`);
    const head = api(`repos/${REPO}/commits/${p.head.sha}`);
    const why = stuck({
      draft: p.draft, autoMerge: !!p.auto_merge, conflict: full.mergeable_state === 'dirty',
      red: redChecks(p.head.sha), createdAt: p.created_at, pushedAt: head.commit.committer.date,
    }, now);
    if (why.length) prs.push({ number: p.number, title: p.title, why });
  }
  const heads = new Set(open.map(p => p.head.ref));
  const branches = [];
  for (const b of pages(`repos/${REPO}/branches`).filter(b => !SKIP.test(b.name) && !heads.has(b.name))) {
    let c;
    try { c = api(`repos/${REPO}/compare/main...${encodeURIComponent(b.name)}`); } catch (_) { continue; } // no common history with main
    if (!c.ahead_by) continue;
    const lastDate = c.commits.at(-1).commit.committer.date;
    const merged = api(`repos/${REPO}/pulls?state=closed&head=${REPO.split('/')[0]}:${encodeURIComponent(b.name)}&per_page=5`).find(p => p.merged_at);
    const why = stranded({ name: b.name, ahead: c.ahead_by, openPr: false, lastDate, mergedPr: merged?.number }, now);
    if (why) branches.push({ name: b.name, why });
  }
  return { prs, branches };
}

function print({ prs, branches }) {
  for (const p of prs) console.log(`- PR #${p.number} ${p.title}: ${p.why.join('; ')}`);
  for (const b of branches) console.log(`- branch ${b.name}: ${b.why}`);
  if (!prs.length && !branches.length) console.log('Nothing: every open PR is moving and every branch with work has its PR.');
}

function notify() {
  const found = gather();
  const issues = api(`repos/${REPO}/issues?state=open&per_page=100`).filter(i => !i.pull_request && i.title === TITLE);
  print(found);
  if (found.prs.length || found.branches.length) {
    // One issue; while it stays open its body is kept current, without a new email each day
    const body = issueBody(found);
    if (issues.length) execFileSync('gh', ['issue', 'edit', String(issues[0].number), '-R', REPO, '--body', body]);
    else execFileSync('gh', ['issue', 'create', '-R', REPO, '--title', TITLE, '--body', body]);
  } else {
    for (const i of issues) execFileSync('gh', ['issue', 'close', String(i.number), '-R', REPO, '--comment', 'Nothing is pending any more: every open PR is moving and every branch with work has its PR.']);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command] = process.argv.slice(2);
  if (command === 'check') print(gather());
  else if (command === 'notify') notify();
  else { console.error('Usage: node tools/agents/pending.mjs check | notify'); process.exit(2); }
}

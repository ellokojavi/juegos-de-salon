#!/usr/bin/env node
/**
 * Removes the worktrees that are no longer used (D-206, D-218, D-252). With auto-merge (D-216) a PR
 * merges by itself, without the session that opened it finding out: this runs at the start of
 * every Claude Code session (SessionStart hook in .claude/settings.json) and leaves a single
 * `juegos-de-salon` folder, plus the worktrees with work in progress. It removes:
 *
 * - the **merged** ones: their branch entered `main` through a merge;
 * - the **empty** ones: no commits of their own and no changes, created more than a day ago;
 * - the **abandoned** ones: with commits that are not in `main`, no open PR and not moving for
 *   more than three days. Before removing them, their branch is pushed to GitHub: the work is not
 *   lost and is picked up again with `git worktree add ../juegos-de-salon-<topic> <branch>`; until
 *   someone opens its PR or deletes it, `pending-watch.yml` lists it in the "Pending work" issue (D-441).
 *
 * **Test litter** does not count as a change (D-315): an untracked folder at the worktree's root
 * named like a lost argument (`undefined/`, `null/`, `--part/`…) with only Chrome profiles and
 * screenshots inside. A `tools/e2e/` script run without an output folder left it (today
 * `tools/e2e/output.mjs` prevents it). When the worktree is removed, it goes with it.
 *
 * And the **local branches without a worktree** (D-315), which piled up by the dozen in the main
 * folder: it deletes those that already entered `main` and those that have no branch on GitHub
 * (the remote one was deleted on merge, or never pushed) but whose commits are all on GitHub. One
 * with commits that are not on GitHub is named and left (it is not pushed: it could be old history,
 * from before rewriting it). Never `main`, the branch of a live worktree nor that of an open PR;
 * without `gh` it only deletes those that already entered `main`.
 *
 *   node tools/agents/clean-worktrees.mjs           # removes the merged, empty and abandoned ones, and says what is left
 *   node tools/agents/clean-worktrees.mjs --show    # only says what it would remove
 *   node tools/agents/clean-worktrees.mjs --hook    # same as with nothing, in one line (for the session)
 *
 * It also applies to the Claude app's worktrees (`.claude/worktrees/`). It never touches the main
 * folder, the worktree it runs from, a worktree with uncommitted changes nor one with an open PR:
 * those are named and left. Without `gh` (it is not known which PRs are open) nothing is
 * considered abandoned.
 */
import { execFileSync } from 'node:child_process';
import { resolve, sep } from 'node:path';
import { realpathSync, statSync, readdirSync, rmSync } from 'node:fs';
import { isFolder as isFolderArg } from '../e2e/output.mjs';

const args = process.argv.slice(2);
const SHOW = args.includes('--show');
const HOOK = args.includes('--hook');

const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const attempt = f => { try { return f(); } catch (_) { return null; } };
/** The path without symlinks (on macOS, /var is /private/var): so the own worktree compares. */
const real = p => attempt(() => realpathSync(p)) || resolve(p);

/** `git worktree list --porcelain` → [{ path, branch, detached }]; the first one is the main one. */
export function readWorktrees(text) {
  const out = [];
  let current = null;
  for (const line of String(text).split('\n')) {
    if (line.startsWith('worktree ')) { current = { path: line.slice(9), branch: null, detached: false }; out.push(current); }
    else if (line.startsWith('branch ') && current) current.branch = line.slice(7).replace(/^refs\/heads\//, '');
    else if (line === 'detached' && current) current.detached = true;
  }
  return out;
}

/** What an end-to-end script leaves: screenshots, videos and loose data. */
const TEST_FILE = /\.(png|jpe?g|webm|json|txt|log)$/i;

/**
 * Is this untracked folder test litter? Only if its name is a lost argument (`undefined`, `null`,
 * one starting with `-`) and everything inside is Chrome profiles (a folder with `Local State`) or
 * test files. Anything else makes it real.
 */
export function isLitter(path, name) {
  if (isFolderArg(name)) return false;
  const only = d => {
    const entries = attempt(() => readdirSync(d, { withFileTypes: true }));
    if (!entries) return false;
    if (entries.some(e => e.name === 'Local State' && e.isFile())) return true; // a Chrome profile, whole
    return entries.every(e => e.isDirectory() ? only(resolve(d, e.name)) : e.isFile() && TEST_FILE.test(e.name));
  };
  return only(resolve(path, name));
}

/** `git status --porcelain` → { real, litter }: the litter is untracked folders at the root. */
export function readStatus(text, path, litter = isLitter) {
  const realChanges = [], thrown = [];
  for (const line of String(text).split('\n').filter(Boolean)) {
    const m = /^\?\? ([^/]+)\/$/.exec(line);
    if (m && litter(path, m[1])) thrown.push(m[1]); else realChanges.push(line);
  }
  return { real: realChanges, litter: thrown };
}

/**
 * What to do with each local branch: 'main', 'in-worktree', 'open' (open PR), 'merged' (delete),
 * 'no-remote' (no branch on GitHub and everything pushed: delete), 'unpushed' (commits only here:
 * left and named), 'on-github' (has its branch on GitHub: left) or 'unknown' (no gh).
 */
export function classifyBranches(branches, { inWorktree, merged, hasPr = () => null, onGithub, unpushed }) {
  return branches.map(branch => {
    let what;
    if (branch === 'main') what = 'main';
    else if (inWorktree(branch)) what = 'in-worktree';
    else if (hasPr(branch)) what = 'open';
    else if (merged(branch)) what = 'merged';
    else if (hasPr(branch) === null) what = 'unknown';
    else if (onGithub(branch)) what = 'on-github';
    else what = unpushed(branch) > 0 ? 'unpushed' : 'no-remote';
    return { branch, what };
  });
}

export const EMPTY_DAYS = 1;
export const ABANDONED_DAYS = 3;

/**
 * What to do with each worktree: 'main', 'own', 'detached', 'dirty' (merged with changes),
 * 'open', 'remove' (merged), 'empty' or 'abandoned'. `ownCommits(branch)` are its commits that are
 * not in `origin/main`; `days(worktree)`, how long it has not moved; `hasPr(branch)`, whether it has
 * an open PR (`null` if unknown).
 */
export function classify(worktrees, { here, merged, dirty, ownCommits = () => 1, days = () => 0, hasPr = () => null }) {
  return worktrees.map((w, i) => {
    let what;
    if (i === 0) what = 'main';
    else if (real(w.path) === real(here)) what = 'own';
    else if (w.detached || !w.branch) what = 'detached';
    else if (merged(w.branch)) what = dirty(w.path) ? 'dirty' : 'remove';
    else if (dirty(w.path) || hasPr(w.branch)) what = 'open';
    else if (ownCommits(w.branch) === 0) what = days(w) >= EMPTY_DAYS ? 'empty' : 'open';
    // Without knowing which PRs are open, nothing is considered abandoned
    else if (hasPr(w.branch) === null) what = 'open';
    else what = days(w) >= ABANDONED_DAYS ? 'abandoned' : 'open';
    return { ...w, what };
  });
}

function main() {
  const here = process.cwd();
  const common = resolve(here, git(here, 'rev-parse', '--git-common-dir'));
  const root = resolve(common, '..');
  // Without network, the origin/main already there is used: at most less gets removed
  // --prune: so it is known which branches are no longer on GitHub
  attempt(() => git(root, 'fetch', '-q', '--prune', 'origin'));
  const worktrees = readWorktrees(git(root, 'worktree', 'list', '--porcelain'));
  // Merged = its last commit is in origin/main, but not on the main line: it came in through a
  // merge. A branch just created from main (no commits of its own) also "is in main", and is not
  // removed: it is the work another session is starting.
  const mainLine = new Set((attempt(() => git(root, 'rev-list', '--first-parent', 'origin/main')) || '').split('\n'));
  const merged = branch => {
    const tip = attempt(() => git(root, 'rev-parse', branch));
    if (!tip || mainLine.has(tip)) return false;
    return attempt(() => { git(root, 'merge-base', '--is-ancestor', branch, 'origin/main'); return true; }) === true;
  };
  const statuses = new Map();
  const status = path => {
    if (!statuses.has(path)) {
      const text = attempt(() => git(path, 'status', '--porcelain'));
      statuses.set(path, text == null ? { real: ['?'], litter: [] } : readStatus(text, path));
    }
    return statuses.get(path);
  };
  const dirty = path => status(path).real.length > 0;
  const ownCommits = branch => Number(attempt(() => git(root, 'rev-list', '--count', `origin/main..${branch}`)) ?? 1);
  // Not moving since: its last own commit or, if newer, the worktree's creation (its private HEAD
  // in .git/worktrees/<name>, which also changes when switching branches). An empty one counts
  // only since it was created: its last commit is main's.
  const days = w => {
    const commit = ownCommits(w.branch) ? 1000 * Number(attempt(() => git(root, 'log', '-1', '--format=%ct', w.branch)) || 0) : 0;
    const head = attempt(() => statSync(resolve(git(w.path, 'rev-parse', '--absolute-git-dir'), 'HEAD')));
    // Only mtime: git writes HEAD when creating the worktree, and the creation date (birthtime)
    // cannot be set back on Linux, so the test could not age a worktree
    const created = head ? head.mtimeMs : Date.now();
    return (Date.now() - Math.max(commit, created)) / 864e5;
  };
  // CLEAN_OPEN_PRS="branch1,branch2" replaces gh (in the test)
  const openPrs = process.env.CLEAN_OPEN_PRS != null ? new Set(process.env.CLEAN_OPEN_PRS.split(',').filter(Boolean)) : attempt(() => new Set(execFileSync('gh', ['pr', 'list', '--state', 'open', '--limit', '200', '--json', 'headRefName', '-q', '.[].headRefName'],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 }).split('\n').filter(Boolean)));
  const hasPr = branch => (openPrs ? openPrs.has(branch) : null);
  const plan = classify(worktrees, { here, merged, dirty, ownCommits, days, hasPr });

  const removed = [], saved = [];
  for (const w of plan.filter(x => ['remove', 'empty', 'abandoned'].includes(x.what))) {
    if (SHOW) { (w.what === 'abandoned' ? saved : removed).push(w); continue; }
    // The abandoned one is pushed to GitHub first; if that fails, it is left
    if (w.what === 'abandoned' && !attempt(() => { git(root, 'push', '-q', 'origin', `${w.branch}:refs/heads/${w.branch}`); return true; })) continue;
    // Test litter goes with the worktree: with it, `worktree remove` does not let go
    for (const n of status(w.path).litter) attempt(() => rmSync(resolve(w.path, n), { recursive: true, force: true }));
    const ok = attempt(() => { git(root, 'worktree', 'remove', w.path); git(root, 'branch', '-D', w.branch); return true; });
    if (ok) (w.what === 'abandoned' ? saved : removed).push(w);
  }
  if (!SHOW) attempt(() => git(root, 'worktree', 'prune'));

  // The local branches without a worktree (D-315)
  const live = new Set(readWorktrees(git(root, 'worktree', 'list', '--porcelain')).map(w => w.branch).filter(Boolean));
  const remotes = new Set((attempt(() => git(root, 'for-each-ref', 'refs/remotes/origin', '--format=%(refname:short)')) || '').split('\n').filter(Boolean));
  const branches = (attempt(() => git(root, 'for-each-ref', 'refs/heads', '--format=%(refname:short)')) || '').split('\n').filter(Boolean);
  const branchPlan = classifyBranches(branches, {
    inWorktree: b => live.has(b),
    merged: b => attempt(() => { git(root, 'merge-base', '--is-ancestor', b, 'origin/main'); return true; }) === true,
    hasPr,
    onGithub: b => remotes.has(`origin/${b}`),
    unpushed: b => Number(attempt(() => git(root, 'rev-list', '--count', b, '--not', '--remotes=origin')) ?? 1),
  });
  const deletedBranches = [];
  for (const b of branchPlan.filter(x => x.what === 'merged' || x.what === 'no-remote')) {
    if (SHOW || attempt(() => { git(root, 'branch', '-D', b.branch); return true; })) deletedBranches.push(b.branch);
  }
  const unpushed = branchPlan.filter(b => b.what === 'unpushed').map(b => b.branch);
  const withLitter = plan.filter(w => status(w.path).litter.length && ['remove', 'empty', 'abandoned'].includes(w.what));

  const name = w => `${w.path.split(sep).pop()} (${w.branch || 'no branch'})`;
  const dirtyOnes = plan.filter(w => w.what === 'dirty');
  const open = plan.filter(w => w.what === 'open');
  if (HOOK) {
    const parts = [];
    if (removed.length) parts.push(`removed ${removed.length} merged or empty worktree(s): ${removed.map(name).join(', ')}`);
    if (saved.length) parts.push(`removed ${saved.length} abandoned worktree(s), with their branch pushed to GitHub: ${saved.map(name).join(', ')}`);
    if (dirtyOnes.length) parts.push(`careful: merged but with uncommitted changes: ${dirtyOnes.map(name).join(', ')}`);
    if (open.length) parts.push(`in progress: ${open.map(name).join(', ')}`);
    if (withLitter.length) parts.push(`with test litter (${withLitter.map(w => status(w.path).litter.join(', ')).join('; ')}), which went with the worktree`);
    if (deletedBranches.length) parts.push(`deleted ${deletedBranches.length} local branch(es) already merged or without a branch on GitHub: ${deletedBranches.join(', ')}`);
    if (unpushed.length) parts.push(`branches with commits that are not on GitHub (left): ${unpushed.join(', ')}`);
    if (parts.length) console.log(`Worktrees (D-252): ${parts.join(' · ')}.`);
    return;
  }
  console.log(SHOW ? 'Would remove:' : 'Removed:', removed.length ? '' : 'none');
  for (const w of removed) console.log(`  ✓ ${name(w)}`);
  if (saved.length) { console.log(SHOW ? 'Abandoned (would push their branch to GitHub and remove them):' : 'Abandoned (their branch is on GitHub):'); for (const w of saved) console.log(`  ✓ ${name(w)}`); }
  if (dirtyOnes.length) { console.log('Merged, but with uncommitted changes (left; look at them before removing):'); for (const w of dirtyOnes) console.log(`  ⚠️  ${w.path}`); }
  if (open.length) { console.log('In progress (their branch is not in main):'); for (const w of open) console.log(`  · ${name(w)}`); }
  for (const w of plan.filter(x => status(x.path).litter.length)) console.log(`Test litter in ${w.path.split(sep).pop()}: ${status(w.path).litter.join(', ')} (does not count as a change${withLitter.includes(w) ? (SHOW ? '; would go with the worktree' : '; went with the worktree') : ''})`);
  console.log(SHOW ? 'Local branches it would delete:' : 'Local branches deleted:', deletedBranches.length ? deletedBranches.join(', ') : 'none');
  if (unpushed.length) console.log(`Branches with commits that are not on GitHub (left; look at them): ${unpushed.join(', ')}`);
  const remaining = branchPlan.filter(b => ['open', 'on-github', 'unknown'].includes(b.what));
  if (remaining.length) console.log(`Branches that stay: ${remaining.map(b => `${b.branch} (${{ open: 'open PR', 'on-github': 'its branch is still on GitHub', unknown: 'no gh, unknown whether it has a PR' }[b.what]})`).join(', ')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try { main(); } catch (e) {
    // In the hook, it never stops the session: if something fails, it says so and moves on
    if (HOOK) console.log(`Worktrees (D-252): could not check them (${String(e.message).split('\n')[0]}).`);
    else { console.error(e.message); process.exit(1); }
  }
}

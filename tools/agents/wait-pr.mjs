// How a session learns what became of its PR (D-400): it waits, asking GitHub every minute, until
// the PR merges or closes, or something needs the session (a required check red, a conflict). Run
// in the background right after turning on auto-merge, it costs no tokens while it waits, works in
// any environment with `gh`, and does not depend on the app's PR monitor reading in time (which is
// why the `end-to-end` check used to be held two minutes, D-323).
//
//   node tools/agents/wait-pr.mjs <n> [--every 60] [--max-hours 2]
//
// It prints one line and exits: `merged`, `closed`, `failed: <check>`, `conflict` or `timeout`,
// with code 0 for merged and 1 otherwise, or `unreadable` (code 3) when GitHub could not be read
// several times in a row. The session then checks on GitHub and does what follows.
// It reads the PR with `gh pr view` and, where that fails (some cloud sessions refuse GitHub's
// GraphQL API), with the REST API; it no longer retries one error forever in silence (D-441: a
// session's PR went red and its waiter kept "trying again" for 25 minutes). A PR it stops watching,
// on a timeout or anything else, is not lost: pending-watch.yml lists stuck PRs every day.
// A conflict counts only once it is read CONFLICT_READS times in a row: right after a push GitHub
// still reports the head before it (and recomputes mergeability lazily), so a single read said
// `conflict` for PRs that were mergeable (#919, #928).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Consecutive failed reads before giving up (D-441). */
export const MAX_ERRORS = 5;

/** Consecutive reads that must say conflict before it is reported (a stale read is not one). */
export const CONFLICT_READS = 3;

/**
 * Whether to stop on what was just read. A conflict only stops after CONFLICT_READS reads in a
 * row; anything else stops at once. Returns { stop, conflicts } with the updated streak.
 */
export function settle(seen, conflicts = 0) {
  if (seen !== 'conflict') return { stop: !!seen, conflicts: 0 };
  const n = conflicts + 1;
  return { stop: n >= CONFLICT_READS, conflicts: n };
}

/** The checks `main` requires (D-216). */
export const REQUIRED = ['tests', 'end-to-end'];

/**
 * What the PR's state means for the session, or null to keep waiting.
 * @param {{ state: string, mergeable: string, checks: { name: string, conclusion: string|null }[] }} pr
 */
export function outcome({ state, mergeable, checks }) {
  if (state === 'MERGED') return 'merged';
  if (state === 'CLOSED') return 'closed';
  const red = checks.find(c => REQUIRED.includes(c.name) && ['FAILURE', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED'].includes(c.conclusion));
  if (red) return `failed: ${red.name}`;
  if (mergeable === 'CONFLICTING') return 'conflict';
  return null;
}

/**
 * The same state through the REST API (D-441): `pulls/<n>` and the check runs of its head commit,
 * shaped as `gh pr view` gives it. `mergeable_state` "dirty" is a conflict.
 */
export function fromRest(pull, runs) {
  return {
    state: pull.merged ? 'MERGED' : pull.state === 'closed' ? 'CLOSED' : 'OPEN',
    mergeable: pull.mergeable_state === 'dirty' ? 'CONFLICTING' : 'MERGEABLE',
    checks: runs.map(c => ({ name: c.name, conclusion: c.conclusion ? c.conclusion.toUpperCase() : null })),
  };
}

const run = args => JSON.parse(execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const REPO = 'ellokojavi/juegos-de-salon';

function read(pr) {
  try {
    const j = run(['pr', 'view', pr, '--json', 'state,mergeable,statusCheckRollup']);
    return { state: j.state, mergeable: j.mergeable, checks: (j.statusCheckRollup || []).map(c => ({ name: c.name, conclusion: c.conclusion || null })) };
  } catch (_) {
    const pull = run(['api', `repos/${REPO}/pulls/${pr}`]);
    return fromRest(pull, run(['api', `repos/${REPO}/commits/${pull.head.sha}/check-runs?per_page=100`]).check_runs);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? Number(process.argv[i + 1]) : d; };
  const pr = process.argv[2];
  if (!/^\d+$/.test(pr || '')) { console.error('usage: node tools/agents/wait-pr.mjs <n> [--every 60] [--max-hours 2]'); process.exit(2); }
  const every = arg('--every', 60) * 1000;
  const until = Date.now() + arg('--max-hours', 2) * 3600 * 1000;
  let errors = 0, conflicts = 0;
  for (;;) {
    let seen = null;
    try {
      seen = outcome(read(pr));
      errors = 0;
    } catch (e) {
      const why = (e.stderr?.toString() || e.message).trim().split('\n').at(-1);
      if (++errors >= MAX_ERRORS) { console.log(`#${pr}: unreadable (${why})`); process.exit(3); }
      console.error(`wait-pr: ${why}; trying again (${errors}/${MAX_ERRORS})`);
    }
    if (seen || conflicts) {
      const s = settle(seen, conflicts);
      conflicts = s.conflicts;
      if (s.stop) { console.log(`#${pr}: ${seen}`); process.exit(seen === 'merged' ? 0 : 1); }
      if (conflicts) console.error(`wait-pr: GitHub says conflict (${conflicts}/${CONFLICT_READS}); reading again to be sure`);
    }
    if (Date.now() > until) { console.log(`#${pr}: timeout`); process.exit(1); }
    await new Promise(r => setTimeout(r, every));
  }
}

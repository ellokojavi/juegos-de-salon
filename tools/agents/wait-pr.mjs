// How a session learns what became of its PR (D-400): it waits, asking GitHub every minute, until
// the PR merges or closes, or something needs the session (a required check red, a conflict). Run
// in the background right after turning on auto-merge, it costs no tokens while it waits, works in
// any environment with `gh`, and does not depend on the app's PR monitor reading in time (which is
// why the `end-to-end` check used to be held two minutes, D-323).
//
//   node tools/agents/wait-pr.mjs <n> [--every 60] [--max-hours 2]
//
// It prints one line and exits: `merged`, `closed`, `failed: <check>`, `conflict` or `timeout`,
// with code 0 for merged and 1 otherwise. The session then checks on GitHub and does what follows.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? Number(process.argv[i + 1]) : d; };
  const pr = process.argv[2];
  if (!/^\d+$/.test(pr || '')) { console.error('usage: node tools/agents/wait-pr.mjs <n> [--every 60] [--max-hours 2]'); process.exit(2); }
  const every = arg('--every', 60) * 1000;
  const until = Date.now() + arg('--max-hours', 2) * 3600 * 1000;
  for (;;) {
    let seen = null;
    try {
      const j = JSON.parse(execFileSync('gh', ['pr', 'view', pr, '--json', 'state,mergeable,statusCheckRollup'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
      seen = outcome({ state: j.state, mergeable: j.mergeable, checks: (j.statusCheckRollup || []).map(c => ({ name: c.name, conclusion: c.conclusion || null })) });
    } catch (e) {
      console.error(`wait-pr: ${e.message.split('\n')[0]}; trying again`);
    }
    if (seen) { console.log(`#${pr}: ${seen}`); process.exit(seen === 'merged' ? 0 : 1); }
    if (Date.now() > until) { console.log(`#${pr}: timeout`); process.exit(1); }
    await new Promise(r => setTimeout(r, every));
  }
}

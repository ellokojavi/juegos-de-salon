#!/usr/bin/env node
/**
 * The processes round's watchdog (D-440). The round runs on the owner's Mac mini; when it stops
 * (the Mac asleep, the Claude app closed, a task left pointing at renamed files), nothing used to say
 * so: in October 2026 it stopped for six days and 91 merges went unreviewed before anyone noticed.
 * This runs on GitHub, away from the Mac, and looks only at what the round leaves on `main`.
 *
 *   node tools/agents/round-watch.mjs check    # says whether the round is behind (exit 0 either way)
 *   node tools/agents/round-watch.mjs notify   # round-watch.yml: opens the issue when behind, closes it when caught up
 *
 * "Behind" means a commit on `main` that the round has not looked at yet (after `checkedUpTo` in
 * `docs/processes.json`) is older than LIMIT_HOURS. A day with no merges is never behind, so a
 * quiet day raises no alarm, and a round that ran and looked at everything clears it.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const HOUR = 3600 * 1000;
export const TITLE = 'Processes round missed';
export const LIMIT_HOURS = 24;

/**
 * Whether the round is behind. `pending` are the first-parent commits on main after `checkedUpTo`,
 * newest first, as `{ sha, date }`; `null` when `checkedUpTo` is not in the history that was read
 * (then it is so far back that it counts as behind). `lastRound` is the date of the last recorded round.
 */
export function behind({ pending, lastRound = null, now = Date.now() }) {
  if (pending === null) return { behind: true, count: null, hours: null, lastRound, why: 'the last commit the round looked at is not in the recent history of main' };
  if (!pending.length) return { behind: false, count: 0, hours: 0, lastRound, why: 'the round has looked at everything on main' };
  const oldest = pending.at(-1);
  const hours = Math.floor((now - Date.parse(oldest.date)) / HOUR);
  return {
    behind: hours > LIMIT_HOURS, count: pending.length, hours, lastRound, oldest: oldest.sha,
    why: `${pending.length} commit(s) on main not looked at yet, the oldest from ${hours} hour(s) ago`,
  };
}

/** The issue's text: what is wrong and what to look at, readable from a phone. */
export function issueBody(s, { site = 'https://github.com/ellokojavi/juegos-de-salon' } = {}) {
  return [
    `The processes round (D-273) has not looked at \`main\` for more than ${LIMIT_HOURS} hours: ${s.why}.`,
    `Last recorded round: ${s.lastRound || 'none'}.`,
    '',
    'What to check, in order:',
    '1. claude.ai → Scheduled → **Juegos de Salón · processes round**: did its last run fail, or not start?',
    '2. The Mac mini: awake, online, and the Claude desktop app open (the task runs there).',
    '3. Run it now from that page ("Run now"). This issue closes itself once the round catches up.',
    '',
    `How it is set up: [tools/jobs/MAC-MINI.md](${site}/blob/main/tools/jobs/MAC-MINI.md). Opened by \`round-watch.yml\` (D-440).`,
  ].join('\n');
}

const sh = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** The state of `main` as checked out: what the round has not looked at, and its last round. */
export function state(now = Date.now()) {
  const m = JSON.parse(readFileSync(join(ROOT, 'docs/processes.json'), 'utf8'));
  const lastRound = m.rounds?.at(-1)?.date || null;
  let pending = null;
  try {
    sh('git', ['cat-file', '-e', `${m.checkedUpTo}^{commit}`]);
    pending = sh('git', ['log', '--first-parent', '--format=%H %cI', `${m.checkedUpTo}..HEAD`]).split('\n').filter(Boolean)
      .map(l => { const [sha, date] = l.split(' '); return { sha, date }; });
  } catch (_) { /* not in the history that was fetched */ }
  return behind({ pending, lastRound, now });
}

function notify() {
  const s = state();
  const open = JSON.parse(sh('gh', ['issue', 'list', '--state', 'open', '--search', `"${TITLE}" in:title`, '--json', 'number,title']))
    .filter(i => i.title === TITLE);
  if (s.behind) {
    // One issue; while it stays open its body is kept current, without a new email each day
    if (open.length) sh('gh', ['issue', 'edit', String(open[0].number), '--body', issueBody(s)]);
    else sh('gh', ['issue', 'create', '--title', TITLE, '--body', issueBody(s)]);
    console.log(`Behind: ${s.why}. ${open.length ? `Updated #${open[0].number}.` : 'Opened the issue.'}`);
  } else {
    for (const i of open) sh('gh', ['issue', 'close', String(i.number), '--comment', `The round caught up: ${s.why} (last recorded round: ${s.lastRound}).`]);
    console.log(`Up to date: ${s.why}.${open.length ? ` Closed ${open.map(i => `#${i.number}`).join(', ')}.` : ''}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command] = process.argv.slice(2);
  if (command === 'check') { const s = state(); console.log(`${s.behind ? '⚠️ Behind' : '✅ Up to date'}: ${s.why} (last recorded round: ${s.lastRound || 'none'}).`); }
  else if (command === 'notify') notify();
  else { console.error('Usage: node tools/agents/round-watch.mjs check | notify'); process.exit(2); }
}

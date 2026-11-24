#!/usr/bin/env node
/**
 * Outside contributions (D-568): which open PRs from outside (a fork, or anyone but the owner, the
 * same rule as lanes.mjs, D-519) need the contributions agent now. A cloud scheduled task runs the
 * agent every hour (tools/jobs/prompts/contributions.md); this script is its cheap first step, so a
 * round with nothing new ends in seconds, without reading any diff.
 *
 *   node tools/agents/contributions.mjs check            # the PRs to look at now, or "nothing to do"
 *   node tools/agents/contributions.mjs ready <n> <why>  # tells the owner a PR waits only for their Yes
 *   node tools/agents/contributions.mjs stale <n> <why>  # a contributor silent 7 days: the owner decides (D-616)
 *
 * The agent remembers nothing between rounds: its state is its last comment on each PR, which ends
 * with a hidden marker `<!-- contributions: sha=<head> state=<reviewing|ready|red|stale> -->`. A PR needs a
 * look when it has no marker yet, its head moved since the marker, or someone other than the agent
 * wrote after it; and (D-616) when a required check went red after the look and its one automatic
 * rerun did not fix it, or when the contributor has been silent a week with something left to do. `ready` dispatches contrib-ready.yml, which comments as the workflows bot naming
 * the owner: GitHub notifies no one of what their own account does (the same reason as decide.yml).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { outsideReason } from './lanes.mjs';
import { RERUN_MARK, redChecks } from './pending.mjs';

export const REPO = 'ellokojavi/juegos-de-salon';
const MARK = /<!-- contributions: sha=([0-9a-f]+) state=(reviewing|ready|red|stale) -->/;
const DAY = 24 * 3600 * 1000;
/** Days a contributor may stay silent with something left to do before the owner decides (D-616). */
export const SILENT_DAYS = 7;
/** Hours after the automatic rerun before a still-red commit is read (D-616): the rerun must finish first. */
const AFTER_RERUN_H = 1;
export const marker = (sha, state) => `<!-- contributions: sha=${sha} state=${state} -->`;

/**
 * Why a PR needs the agent now, or null. `comments` are the PR's conversation comments and reviews,
 * oldest first, each `{ body, at }`; the agent's own carry the marker. `red` is true when a required
 * check failed on the head; `rerunAt` is when pending.mjs reran it once (D-616), or null.
 */
export function needsLook({ sha, comments = [], red = false, rerunAt = null }, now = Date.now()) {
  let last = -1;
  comments.forEach((c, i) => { if (MARK.test(c.body || '')) last = i; });
  if (last < 0) return 'new: not reviewed yet';
  const [, seen, state] = comments[last].body.match(MARK);
  if (seen !== sha) return `new commits since the last review (${state})`;
  if (comments.slice(last + 1).some(c => (c.body || '').trim())) return 'a new comment since the last review';
  // Red after the look, and the one rerun did not fix it: read the log, theirs or not (D-616)
  if (red && !['red', 'stale'].includes(state) && rerunAt && (now - Date.parse(rerunAt)) >= AFTER_RERUN_H * 3600 * 1000) return 'red after the automatic rerun';
  // Something left for the contributor and a week without a word: the owner decides (D-616)
  if (['reviewing', 'red'].includes(state) && (now - Date.parse(comments[last].at)) >= SILENT_DAYS * DAY) return `silent ${SILENT_DAYS} days with something left to do`;
  return null;
}

const gh = args => JSON.parse(execFileSync('gh', ['api', '--paginate', '--slurp', ...args], { encoding: 'utf8' })).flat();

function check() {
  const prs = gh([`repos/${REPO}/pulls?state=open&per_page=100`]);
  const todo = [];
  for (const pr of prs) {
    if (pr.draft || pr.user?.type === 'Bot') continue; // our own workflows' PRs are not contributions
    const files = gh([`repos/${REPO}/pulls/${pr.number}/files?per_page=100`]).map(f => f.filename);
    const outside = outsideReason(pr, files);
    if (!outside) continue;
    const comments = [
      ...gh([`repos/${REPO}/issues/${pr.number}/comments?per_page=100`])/* the bot's ready note is the agent's own word, not news */
        .filter(c => c.user?.login !== 'github-actions[bot]').map(c => ({ body: c.body, at: c.created_at })),
      ...gh([`repos/${REPO}/pulls/${pr.number}/reviews?per_page=100`]).map(c => ({ body: c.body, at: c.submitted_at })),
      ...gh([`repos/${REPO}/pulls/${pr.number}/comments?per_page=100`]).map(c => ({ body: c.body, at: c.created_at })),
    ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const red = redChecks(pr.head.sha).length > 0;
    const rerun = gh([`repos/${REPO}/issues/${pr.number}/comments?per_page=100`]).find(c => (c.body || '').includes(RERUN_MARK(pr.head.sha)));
    const why = needsLook({ sha: pr.head.sha, comments, red, rerunAt: rerun?.created_at || null });
    // A fork that does not let maintainers edit its branch: the merge queue cannot bring it up to date (D-616)
    const edits = pr.head?.repo?.fork && !pr.maintainer_can_modify ? 'edits by maintainers OFF' : null;
    if (why) todo.push({ number: pr.number, url: pr.html_url, author: pr.user.login, sha: pr.head.sha, outside, why, edits });
  }
  if (!todo.length) { console.log('nothing to do'); return; }
  for (const t of todo) console.log(`${t.url} · @${t.author} · ${t.outside} · ${t.why}${t.edits ? ` · ${t.edits}` : ''} · head ${t.sha.slice(0, 7)}`);
}

function ready(n, why) {
  if (!/^\d+$/.test(n || '') || !why) throw new Error('Usage: node tools/agents/contributions.mjs ready <n> "<one line: what it brings and its risk>"');
  execFileSync('gh', ['workflow', 'run', 'contrib-ready.yml', '-R', REPO, '-f', `pr=${n}`, '-f', `summary=${why}`], { stdio: 'inherit' });
  console.log(`PR ${n}: the owner will be notified`);
}

/**
 * The owner's one-tap decision for a contributor silent a week (D-616): Yes, one of the owner's
 * sessions takes the work over on a branch of ours, with the contributor as co-author; No, the PR
 * is closed with thanks. Leaving it unticked is "wait". Pure, for the test.
 */
export function staleDecision(n, author, why) {
  const url = `https://github.com/${REPO}/pull/${n}`;
  return {
    title: `Outside PR #${n}: @${author} has been silent ${SILENT_DAYS} days`,
    summary: `${url} waits on its contributor. ${why}`,
    decisions: [{
      question: `Take over #${n} (copy @${author}'s work to a branch of ours, finish it and merge it with them as co-author)? No closes it with thanks.`,
      origin: `contributions round, ${url}`,
      yes: [{ type: 'queue', task: `Take over outside PR #${n} by @${author}: copy its commits to a branch of ours (keep them as Co-authored-by), finish what the contributions comments ask, open our PR linking #${n}, and close #${n} saying where it went (D-616)` }],
      no: [{ type: 'comment', on: n, text: `Thanks for this, @${author}. It has waited ${SILENT_DAYS} days without changes, so we are closing it for now; reopen it whenever you want to pick it up again.` }, { type: 'close-pr', pr: n }],
    }],
  };
}

function stale(n, why) {
  if (!/^\d+$/.test(n || '') || !why) throw new Error('Usage: node tools/agents/contributions.mjs stale <n> "<one line: what is left and since when>"');
  const pr = JSON.parse(execFileSync('gh', ['api', `repos/${REPO}/pulls/${n}`], { encoding: 'utf8' }));
  const file = join(mkdtempSync(join(tmpdir(), 'stale-')), 'decision.json');
  writeFileSync(file, JSON.stringify(staleDecision(Number(n), pr.user.login, why)));
  execFileSync('node', [join(dirname(fileURLToPath(import.meta.url)), 'processes.mjs'), 'decide', file], { stdio: 'inherit' });
  console.log(`PR ${n}: the owner decides`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'check') check();
  else if (cmd === 'ready') ready(args[0], args.slice(1).join(' '));
  else if (cmd === 'stale') stale(args[0], args.slice(1).join(' '));
  else { console.error('Usage: contributions.mjs check | ready <n> <why> | stale <n> <why>'); process.exit(1); }
}

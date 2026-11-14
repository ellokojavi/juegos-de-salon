#!/usr/bin/env node
/**
 * The decisions sweep (D-555): the decision issues the owner already answered are closed by code,
 * not by a round remembering to. On 2026-11-14 four issues sat open: one answered and built
 * (#1381, its PR merged two days before), one asking again what an open issue already asked
 * (#1415 repeated #1435), and one answered whose queued tasks nobody did (#1435).
 *
 *   node tools/agents/sweep.mjs check   # says what it would do
 *   node tools/agents/sweep.mjs run     # pending-watch.yml, every day: settles, closes, reports
 *
 * For each open `processes` issue opened by the bot or the owner:
 *   - an undecided question that a newer open issue asks again is settled ("asked again in #n");
 *   - an issue with every decision made, and every queued task done, is closed. A queued task is
 *     done when the round recorded it (`queueDone` in docs/processes.json) or when a comment by
 *     the owner's account on the issue links a merged PR (the round's "built in #n");
 *   - a queued task still undone two days after the issue opened is listed as stale, and the
 *     "Pending work" issue (pending.mjs) shows it to the owner.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LABELS, AUTHORS, OWNER, readActions, checkboxes, doneSet, undecided, settle, question } from './approve.mjs';

const REPO = 'ellokojavi/juegos-de-salon';
const DAY = 24 * 3600 * 1000;
export const STALE_DAYS = 2;
const MEMORY = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs/processes.json');

/** A question as text to compare: no number, case, punctuation or emoji. */
export const normalize = q => String(q).toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();

/**
 * What a decision is about: the branches, ids and PRs its question and its actions name
 * (`al-toque-polish`, `auto/popularity-2026-11-09`, `#1417`). Two rounds word the same question
 * differently (#1415 and #1435), but name the same branch.
 */
export function subjects(body, d) {
  const acts = Object.entries(readActions(body) || {}).filter(([op]) => op.split(':')[0] === String(d)).flatMap(([, l]) => l);
  const text = [question(body, d), ...acts.map(a => [a.task, a.pr && `#${a.pr}`, a.issue && `#${a.issue}`, a.branch].filter(Boolean).join(' '))].join(' ');
  const refs = [...text.matchAll(/#\d+|[\w.]*[a-z][\w.]*(?:[-/][\w.]+)+/gi)].map(m => m[0].toLowerCase());
  return new Set(refs.filter(r => !/^(origin\/main|main|d-\d+|c-\d+|u-\d+)$/.test(r)));
}

/** Whether decision d of `a` and decision e of `b` ask the same thing. */
export function same(a, d, b, e) {
  if (normalize(question(a, d)) === normalize(question(b, e))) return true;
  const x = subjects(a, d), y = subjects(b, e);
  return [...x].some(r => y.has(r));
}

/** The decision numbers of a body, from its `### n.` headings and option markers. */
const decisions = body => [...new Set([...body.matchAll(/<!-- op:(\d+):[a-z]+ -->/g)].map(m => m[1]))];

/** The queued tasks of the checked options: `[{ id: "#n:d", task }]`. */
export function queuedTasks(number, body) {
  const checked = checkboxes(body), done = doneSet(body), res = [];
  for (const [op, list] of Object.entries(readActions(body) || {})) {
    const [d] = op.split(':');
    if (checked[op] && done.has(d)) for (const a of list) if (a.type === 'queue') res.push({ id: `#${number}:${d}`, task: a.task });
  }
  return res;
}

/** The PRs a comment by the owner's account links (`#1417`, or a pull URL). */
export const linkedPrs = text => [...String(text).matchAll(/(?:pull\/|#)(\d+)/g)].map(m => Number(m[1]));

/**
 * What to do, without touching GitHub. `issues`: open decision issues `{ number, title, body,
 * createdAt, author, comments: [{ author, body }] }`; `queueDone`: ids the round recorded;
 * `merged(n)`: whether PR n is merged.
 */
export function plan(issues, { queueDone = [], merged = () => false, now = Date.now() } = {}) {
  const own = issues.filter(i => AUTHORS.includes(i.author)).sort((a, b) => a.number - b.number);
  const settles = [], closes = [], stale = [];
  for (const issue of own) {
    let body = issue.body || '', repeated = 0;
    // 1. Asked again in a newer open issue
    for (const d of undecided(body)) {
      const newer = own.find(o => o.number > issue.number && decisions(o.body || '').some(n => same(body, d, o.body, n)));
      if (newer) {
        const note = `asked again in #${newer.number}; answer it there`;
        settles.push({ issue: issue.number, decision: d, note });
        body = settle(body, d, note);
        repeated++;
      }
    }
    if (undecided(body).length) continue;
    // 2. Every decision made: the queued tasks must be done
    const prs = (issue.comments || []).filter(c => c.author === OWNER).flatMap(c => linkedPrs(c.body));
    const builtIn = prs.find(n => n !== issue.number && merged(n));
    const left = queuedTasks(issue.number, body).filter(t => !queueDone.includes(t.id) && !builtIn);
    if (!left.length) {
      const all = repeated && repeated === decisions(issue.body || '').length;
      closes.push({ issue: issue.number, why: all ? 'every question here was asked again in a newer issue' : builtIn ? `every decision made; the queued work was built in #${builtIn}` : 'every decision made and every queued task done' });
    } else if (now - Date.parse(issue.createdAt) > STALE_DAYS * DAY) {
      for (const t of left) stale.push({ issue: issue.number, id: t.id, task: t.task, days: Math.floor((now - Date.parse(issue.createdAt)) / DAY) });
    }
  }
  return { settles, closes, stale };
}

/* ------------------------------------------------------------------ */

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });

export function gather() {
  const seen = new Map();
  for (const label of LABELS) {
    for (const i of JSON.parse(gh('issue', 'list', '-R', REPO, '--label', label, '--state', 'open', '--limit', '100', '--json', 'number,title,body,createdAt,author,comments'))) {
      seen.set(i.number, { ...i, author: i.author?.login === 'app/github-actions' || i.author?.is_bot ? 'github-actions[bot]' : i.author?.login, comments: i.comments.map(c => ({ author: c.author?.login, body: c.body })) });
    }
  }
  const queueDone = existsSync(MEMORY) ? JSON.parse(readFileSync(MEMORY, 'utf8')).queueDone || [] : [];
  const cache = new Map();
  const merged = n => {
    if (!cache.has(n)) { try { cache.set(n, JSON.parse(gh('pr', 'view', String(n), '-R', REPO, '--json', 'state')).state === 'MERGED'); } catch { cache.set(n, false); } }
    return cache.get(n);
  };
  return plan([...seen.values()], { queueDone, merged });
}

function run(apply) {
  const p = gather();
  for (const s of p.settles) {
    console.log(`#${s.issue}, decision ${s.decision}: settle (${s.note})`);
    if (!apply) continue;
    const body = JSON.parse(gh('issue', 'view', String(s.issue), '-R', REPO, '--json', 'body')).body;
    gh('issue', 'edit', String(s.issue), '-R', REPO, '--body', settle(body, s.decision, s.note));
  }
  for (const c of p.closes) {
    console.log(`#${c.issue}: close (${c.why})`);
    if (apply) gh('issue', 'close', String(c.issue), '-R', REPO, '--reason', 'completed', '--comment', `Closed by the decisions sweep (D-555): ${c.why}.`);
  }
  for (const s of p.stale) console.log(`${s.id}: queued ${s.days} days ago and not done: ${s.task}`);
  if (!p.settles.length && !p.closes.length && !p.stale.length) console.log('Nothing to sweep.');
  return p;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd] = process.argv.slice(2);
  if (cmd === 'check' || cmd === 'run') run(cmd === 'run');
  else { console.error('Usage: node tools/agents/sweep.mjs check | run'); process.exit(2); }
}

export { run };

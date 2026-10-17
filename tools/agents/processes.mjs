#!/usr/bin/env node
/**
 * The memory and the signals of the processes agent (D-273): the one that closes what was left
 * open and turns a recurring error into a mechanism that stops it on its own.
 *
 *   node tools/agents/processes.mjs check                       # today's signals
 *   node tools/agents/processes.mjs decide <file.json> [--direct]   # opens the one-tap decisions issue
 *   node tools/agents/processes.mjs pattern <key> "what happened" [--commit <sha>]   # records one sighting
 *   node tools/agents/processes.mjs mechanism <key> "what stops it now" --pr <url>
 *   node tools/agents/processes.mjs dispatch <documentation|usability> <commit>   # launched it up to that main commit
 *   node tools/agents/processes.mjs record --to <commit> [--issue <url>] [--pr <url>] [--note "…"]
 *   node tools/agents/processes.mjs record --queue <#n:d>      # an approved queued task is done
 *   node tools/agents/processes.mjs history
 *
 * `check` gathers, without judging, what the agent has to look at:
 *   - the open PRs that are waiting: without auto-merge, stacked on another branch, conflicting or red;
 *   - the "main is red" issues when main is already green (nobody closed them);
 *   - the last run of each workflow on main;
 *   - the usability dilemmas waiting for the owner for more than three days;
 *   - the owner's backlog: open issues with no label (their to-dos), oldest first (D-339);
 *   - what the documentation agent's memory carries over from one round to the next;
 *   - the main commits since the last round that fix something that fell behind;
 *   - the unhandled 🐞 feedback (open `feedback` issues, D-275);
 *   - the decisions the owner approved as "queued" that are still not done;
 *   - the patterns seen twice or more that still have no mechanism;
 *   - whom to dispatch today (D-276): the documentation agent if something entered main since its
 *     last round, and the usability agent if something in public/ changed since it was last launched.
 *
 * `decide` takes `{ title, summary, decisions: [{ question, context?, yes: [actions], no?: [actions] }] }`
 * and opens an issue with a Yes and a No checkbox per decision; checking one carries it out at once
 * (tools/agents/approve.mjs, .github/workflows/approve.yml). The actions are those of approve.mjs's
 * closed list (`{ type: 'merge', pr }`, `close-pr`, `close-issue`, `comment`, `run`, `queue`,
 * `nothing`): prepare the work beforehand, so the Yes only has to merge it. The issue is written
 * in English (D-316), like everything the repo writes on GitHub; the markers stay as they were.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { invalidAction, checkboxes, doneSet, readActions, normalizeAction, LABEL } from './approve.mjs';
import { wantsEmail, handled } from './feedback.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MEMORY = join(ROOT, 'docs/processes.json');
const REPO = 'ellokojavi/juegos-de-salon';
const DAY = 24 * 3600 * 1000;

/** Commit subjects that give away something that fell behind or was forgotten (Spanish history and English). */
export const FIX = /quedó atrás|quedaba atrás|atrasad|desactualizad|faltaba|se olvid|no se actualiz|(?<!Uno )al día con|estaba mal|corrige|arregla|fell behind|was behind|out of date|outdated|was missing|forgot|up to date with|was wrong|\bfix(es|ed)?\b/i;

/* ------------------------------------------------------------------ */
/* Pure logic (tested by approve.test.mjs and processes.test.mjs)     */
/* ------------------------------------------------------------------ */

/** What an option does, in words, for the checkbox: "merges #300", or '' if it is only noted. */
export function describeActions(list = []) {
  const phrases = list.map(normalizeAction).map(a => {
    switch (a.type) {
      case 'merge': return `merges #${a.pr}`;
      case 'close-pr': return `closes #${a.pr}`;
      case 'close-issue': return `closes #${a.issue}`;
      case 'comment': return `comments on #${a.on}`;
      case 'run': return a.workflow === 'publish.yml' ? 'publishes the site' : 'runs the end-to-end tests';
      case 'queue': return 'queues it for the next round';
      default: return '';
    }
  }).filter(Boolean);
  return phrases.length > 1 ? `${phrases.slice(0, -1).join(', ')} and ${phrases.at(-1)}` : phrases[0] || '';
}

/** The decisions issue body: `<!-- op:n:si -->` checkboxes and the actions block at the end. */
export function decisionsBody({ summary = '', decisions }) {
  if (!decisions?.length) throw new Error('No decisions.');
  const actions = {}, parts = [];
  if (summary) parts.push(summary.trim(), '');
  parts.push('Check **Yes** or **No** on each one. What you check happens right away and cannot be undone; the result is noted next to it.', '');
  decisions.forEach((d, i) => {
    const n = i + 1;
    // The markers keep their Spanish option names (`si`, `no`): approve.mjs reads old issues too
    for (const [op, key] of [['si', 'yes'], ['no', 'no']]) {
      const list = (d[key]?.length ? d[key] : [{ type: 'nothing' }]).map(normalizeAction);
      const bad = list.map(invalidAction).find(Boolean);
      if (bad) throw new Error(`Decision ${n}, ${key}: ${bad}`);
      actions[`${n}:${op}`] = list;
    }
    parts.push(`### ${n}. ${d.question}`);
    if (d.context) parts.push(d.context.trim());
    const box = (op, name) => { const q = describeActions(actions[`${n}:${op}`]); return `- [ ] ${name}${q ? `: ${q}` : ''} <!-- op:${n}:${op} -->`; };
    parts.push(box('si', 'Yes'), box('no', 'No'), '');
  });
  parts.push(`<!-- acciones ${JSON.stringify(actions)} -->`);
  return parts.join('\n');
}

/** The approved decisions that ask the next round for work: `[{ id: "#n:d", task }]`. */
export function queued(issues) {
  const res = [];
  for (const { number, body } of issues) {
    const acts = readActions(body) || {}, checked = checkboxes(body), done = doneSet(body);
    for (const [op, list] of Object.entries(acts)) {
      const [d] = op.split(':');
      if (!checked[op] || !done.has(d)) continue;
      for (const a of list) if (a.type === 'queue') res.push({ id: `#${number}:${d}`, task: a.task });
    }
  }
  return res;
}

/** What an open PR is waiting for, or [] if nothing: each reason, one sentence. */
/**
 * The owner's backlog (D-339): the open issues with no label are the to-dos the owner writes; no other
 * signal lists them. Oldest first, with their age in days; "main is red" issues are reported apart.
 */
export function backlog(issues, now = Date.now()) {
  return issues
    .filter(i => !i.labels.length && !/^main (en rojo|is red)/.test(i.title))
    .map(i => ({ number: i.number, title: i.title, days: Math.floor((now - Date.parse(i.createdAt)) / DAY) }))
    .sort((a, b) => b.days - a.days || a.number - b.number);
}

export function waits(pr, now = Date.now()) {
  const m = [];
  const days = Math.floor((now - Date.parse(pr.createdAt)) / DAY);
  if (pr.isDraft) return m;
  if (pr.baseRefName !== 'main') m.push(`stacked on ${pr.baseRefName}: it does not reach main until that one does`);
  if (pr.mergeable === 'CONFLICTING') m.push('conflicts with its base');
  const red = (pr.statusCheckRollup || []).filter(c => ['FAILURE', 'TIMED_OUT', 'CANCELLED'].includes(c.conclusion)).map(c => c.name);
  if (red.length) m.push(`red: ${[...new Set(red)].join(', ')}`);
  if (!pr.autoMergeRequest && days >= 1) m.push(`no auto-merge for ${days} day${days === 1 ? '' : 's'}`);
  return m;
}

/** The executors (D-276). */
export const EXECUTORS = ['documentation', 'usability'];

/**
 * Whom to dispatch today and why: `[{ agent, reason }]`. `documentation` gets the main commits
 * since its `checkedUpTo`; `usability`, those that touched public/ since its last dispatch (or
 * `null` if it was never launched) and the days since then: once a week it goes anyway.
 * `support`, the emails waiting in the hola@ inbox (D-318).
 */
export function toDispatch({ docCommits, publicCommits, usabilityDays, emails = 0 }) {
  const res = [];
  // D-318: the support agent only when hola@ left emails in the inbox
  if (emails > 0) res.push({ agent: 'support', reason: `${emails} email(s) in the hola@ inbox` });
  if (docCommits > 0) res.push({ agent: 'documentation', reason: `${docCommits} commit(s) on main since its last round` });
  if (publicCommits === null) res.push({ agent: 'usability', reason: 'it was never dispatched' });
  else if (publicCommits > 0) res.push({ agent: 'usability', reason: `${publicCommits} commit(s) that change public/ since its last dispatch` });
  else if (usabilityDays >= 7) res.push({ agent: 'usability', reason: `a week without a round (${usabilityDays} days)` });
  return res;
}

/** Records that a pattern was seen again (or the first time). Returns how many times so far. */
export function recordPattern(memory, key, what, { date, commit = null }) {
  let p = memory.patterns.find(x => x.key === key);
  if (!p) memory.patterns.push(p = { key, what, seen: [], mechanism: null });
  if (!p.seen.some(v => v.commit && v.commit === commit)) p.seen.push({ date, what, commit });
  return p.seen.length;
}

/* ------------------------------------------------------------------ */
/* What reads the repo and GitHub                                     */
/* ------------------------------------------------------------------ */

const sh = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gh = (...args) => JSON.parse(sh('gh', [...args, '-R', REPO]));
const empty = () => ({ checkedUpTo: null, patterns: [], mechanisms: [], queueDone: [], dispatches: {}, rounds: [] });
export const readMemory = () => (existsSync(MEMORY) ? { ...empty(), ...JSON.parse(readFileSync(MEMORY, 'utf8')) } : empty());
const save = m => writeFileSync(MEMORY, JSON.stringify(m, null, 2) + '\n');
const today = () => new Date().toISOString().slice(0, 10);

async function check() {
  const m = readMemory();
  sh('git', ['fetch', '-q', 'origin', 'main']);
  const tip = sh('git', ['rev-parse', 'origin/main']).trim();
  const heading = t => console.log(`\n## ${t}`);
  console.log(`# Processes · ${today()} · main at ${tip.slice(0, 7)}${m.checkedUpTo ? ` · last round up to ${m.checkedUpTo.slice(0, 7)}` : ' · first round'}`);

  heading('Waiting PRs');
  const prs = gh('pr', 'list', '--state', 'open', '--limit', '100', '--json', 'number,title,createdAt,baseRefName,isDraft,mergeable,autoMergeRequest,statusCheckRollup,headRefName');
  let n = 0;
  for (const pr of prs) {
    const w = waits(pr);
    if (w.length) { n++; console.log(`- #${pr.number} ${pr.title} (${pr.createdAt.slice(0, 10)}): ${w.join('; ')}`); }
  }
  if (!n) console.log('None.');

  heading('Workflows on main');
  for (const w of ['publish.yml', 'e2e.yml', 'notifications.yml']) {
    let r;
    try { [r] = gh('run', 'list', '--workflow', w, '--branch', 'main', '--limit', '1', '--json', 'conclusion,status,createdAt,url'); } catch (_) { console.log(`- ${w}: not found on main`); continue; }
    console.log(`- ${w}: ${r ? `${r.conclusion || r.status} (${r.createdAt.slice(0, 16)})${r.conclusion === 'failure' ? ` ${r.url}` : ''}` : 'no runs'}`);
  }

  heading('CHANGELOG to collect and decision reservations (D-300, D-301)');
  const toCollect = sh('git', ['ls-tree', '--name-only', 'origin/main', 'changelog/']).split('\n').filter(f => f.endsWith('.md') && !f.endsWith('README.md'));
  console.log(toCollect.length ? `- ${toCollect.length} ${toCollect.length === 1 ? 'entry' : 'entries'} in main's changelog/: collect them in your PR (node tools/release/changelog.mjs collect)` : "- main's changelog/ is empty.");
  try { console.log(sh('node', [join(ROOT, 'tools/agents/decision.mjs'), 'clean']).trim() || '- No open reservations.'); } catch (e) { console.log(`- reservations: ${String(e.message).split('\n')[0]}`); }

  heading('Issues');
  const issues = gh('issue', 'list', '--state', 'open', '--limit', '100', '--json', 'number,title,createdAt,labels,body');
  // On main, the end-to-end tests run inside publish.yml (D-302): its last finished run says whether main is green
  let greenE2E = false;
  try { greenE2E = gh('run', 'list', '--workflow', 'publish.yml', '--branch', 'main', '--status', 'completed', '--limit', '1', '--json', 'conclusion')[0]?.conclusion === 'success'; } catch (_) { /* publish.yml not on main yet */ }
  const redIssues = issues.filter(i => /^main (en rojo|is red)/.test(i.title));
  for (const i of redIssues) console.log(`- #${i.number} ${i.title} (${i.createdAt.slice(0, 10)})${greenE2E ? ': main is already green, it can be closed' : ': still red'}`);
  const dilemmas = issues.filter(i => i.labels.some(l => ['usability', 'usabilidad'].includes(l.name)) && Date.now() - Date.parse(i.createdAt) > 3 * DAY);
  for (const i of dilemmas) console.log(`- dilemma #${i.number} waiting for the owner since ${i.createdAt.slice(0, 10)}: ${i.title}`);
  if (!dilemmas.length && !redIssues.length) console.log('Nothing overdue.');

  heading("Owner's backlog: issues with no label (D-339)");
  const pendientes = backlog(issues);
  for (const i of pendientes) console.log(`- #${i.number} (${i.days} day${i.days === 1 ? '' : 's'}): ${i.title}`);
  console.log(pendientes.length ? '→ Close what is already done (link the PR); move one or two forward (smallest first), each in its PR with auto-merge; ask with checkboxes only what needs the owner\'s decision.' : 'Empty.');

  heading('Unhandled 🐞 feedback');
  const feedback = issues.filter(i => i.labels.some(l => l.name === 'feedback'));
  for (const i of feedback.reverse()) console.log(`- #${i.number} (${i.createdAt.slice(0, 10)}) ${i.title}`);
  if (!feedback.length) console.log('Nothing.');
  // D-317: a resolved report whose player left an email gets a reply (or, if destructive, only the
  // address deleted). Open ones get it when they're resolved, in this same round
  const closed = gh('issue', 'list', '--label', 'feedback', '--state', 'closed', '--limit', '60', '--json', 'number,title,body,comments,state');
  const unanswered = [...feedback.filter(i => wantsEmail(i.body)), ...closed.filter(i => wantsEmail(i.body) && !handled(i.comments))];
  for (const i of unanswered) console.log(`- 📧 #${i.number}${i.state === 'CLOSED' ? ' (resolved)' : ''} left an email (${/\*\*Email:\*\* `([^`]+)`/.exec(i.body)?.[1] || '?'})`);
  // D-328: doubts about how to answer, waiting for the owner (details in their email)
  const doubts = gh('issue', 'list', '--label', 'support-doubt', '--state', 'open', '--limit', '30', '--json', 'number,title,comments');
  for (const i of doubts) console.log(`- ❓ #${i.number} ${i.title}${(i.comments || []).length ? ` (${i.comments.length} comment(s): read the owner's answer)` : ' (no answer yet)'}`);
  if (unanswered.length) console.log('  One email per player for all their comments: node tools/agents/feedback.mjs pending groups them and says what to run (or forget, if destructive).');

  heading('What the documentation agent carries over');
  const doc = JSON.parse(readFileSync(join(ROOT, 'docs/documentation.json'), 'utf8'));
  const last = doc.rounds.at(-1);
  console.log(`Last recorded round: ${last?.date || 'none'}.`);
  for (const p of doc.pending || []) console.log(`- ${p.slice(0, 220)}${p.length > 220 ? '…' : ''}`);

  heading(`Commits that fix something that fell behind${m.checkedUpTo ? ` (since ${m.checkedUpTo.slice(0, 7)})` : ' (last 7 days)'}`);
  const range = m.checkedUpTo ? [`${m.checkedUpTo}..origin/main`] : ['--since=7.days', 'origin/main'];
  const commits = sh('git', ['log', '--no-merges', '--format=%h %ad %s', '--date=short', ...range]).split('\n').filter(l => FIX.test(l));
  for (const c of commits) console.log(`- ${c}`);
  if (!commits.length) console.log('None.');

  heading('Whom to dispatch today (D-276)');
  const count = (...a) => Number(sh('git', ['rev-list', '--count', ...a]).trim());
  const lastUsability = m.dispatches.usability;
  const plan = toDispatch({
    docCommits: doc.checkedUpTo ? count(`${doc.checkedUpTo}..origin/main`) : 1,
    publicCommits: lastUsability ? count(`${lastUsability.to}..origin/main`, '--', 'public/') : null,
    usabilityDays: lastUsability ? Math.floor((Date.now() - Date.parse(lastUsability.date)) / DAY) : null,
    emails: await import('./inbox.mjs').then(i => i.count()).catch(e => { console.log(`- (the hola@ inbox could not be read: ${e.message})`); return 0; }),
  });
  for (const d of plan) console.log(`- ${d.agent}: ${d.reason}${d.agent === 'support' ? '' : ` (when launching it: dispatch ${d.agent} ${tip.slice(0, 7)})`}`);
  if (!plan.length) console.log('Nobody: nothing changed that needs a review.');

  heading('Approved and queued');
  const decisionIssues = gh('issue', 'list', '--label', LABEL, '--state', 'all', '--limit', '30', '--json', 'number,body');
  const queue = queued(decisionIssues).filter(c => !m.queueDone.includes(c.id));
  for (const c of queue) console.log(`- ${c.id}: ${c.task}  (when done: record --queue ${c.id})`);
  if (!queue.length) console.log('Nothing.');

  heading('Patterns');
  for (const p of m.patterns) console.log(`- ${p.key} · seen ${p.seen.length} time(s) · ${p.mechanism ? `stopped: ${p.mechanism.what}` : p.seen.length >= 2 ? '⚠️ READY FOR A MECHANISM' : 'under observation'}: ${p.what}`);
  if (!m.patterns.length) console.log('None yet.');

  console.log(`\nWhen closing: node tools/agents/processes.mjs record --to ${tip.slice(0, 7)} [--issue <url>] [--pr <url>] [--note "…"]`);
}

function decide(file) {
  if (!file) throw new Error('Usage: node tools/agents/processes.mjs decide <file.json>');
  const d = JSON.parse(readFileSync(file, 'utf8'));
  const body = decisionsBody(d);
  const exists = gh('label', 'list', '--limit', '200', '--json', 'name').some(l => l.name === LABEL);
  if (!exists) sh('gh', ['label', 'create', LABEL, '-R', REPO, '--color', '5319e7', '--description', 'One-tap decisions from the processes agent (D-273)']);
  // The bot opens it (decide.yml): GitHub notifies no one of what their own account does, and
  // the agents use the owner's. With --direct, that account opens it (no email).
  if (process.argv.includes('--direct')) return console.log(sh('gh', ['issue', 'create', '-R', REPO, '--title', d.title, '--label', LABEL, '--body', body]).trim());
  const before = new Date().toISOString();
  sh('gh', ['workflow', 'run', 'decide.yml', '-R', REPO, '--ref', 'main', '-f', `title=${d.title}`, '-f', `body=${body}`]);
  for (let i = 0; i < 24; i++) {
    execFileSync('sleep', ['5']);
    const [created] = gh('issue', 'list', '--label', LABEL, '--state', 'all', '--limit', '5', '--json', 'url,title,createdAt').filter(x => x.title === d.title && x.createdAt >= before.slice(0, 19));
    if (created) return console.log(created.url);
  }
  throw new Error('decide.yml did not open the issue within two minutes: check Actions → Decide.');
}

const flag = (args, name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

function record(args) {
  const m = readMemory(), to = flag(args, '--to'), queue = flag(args, '--queue');
  if (queue) { if (!m.queueDone.includes(queue)) m.queueDone.push(queue); }
  if (to) {
    m.rounds.push({ date: today(), from: m.checkedUpTo, to, issue: flag(args, '--issue'), pr: flag(args, '--pr'), note: flag(args, '--note') });
    m.checkedUpTo = to;
  }
  if (!to && !queue) throw new Error('Usage: record --to <commit> [--issue <url>] [--pr <url>] [--note "…"] | record --queue <#n:d>');
  save(m);
  console.log('Recorded in docs/processes.json.');
}

const USAGE = 'Usage: node tools/agents/processes.mjs check | decide <file.json> [--direct] | pattern <key> "…" [--commit <sha>] | mechanism <key> "…" --pr <url> | dispatch <agent> <commit> | record --to <commit> | record --queue <#n:d> | history';

function main([command, ...args]) {
  const m = readMemory();
  switch (command) {
    case 'check': return check();
    case 'decide': return decide(args[0]);
    case 'pattern': {
      const [key, what] = args;
      if (!key || !what) throw new Error('Usage: pattern <key> "what happened" [--commit <sha>]');
      const times = recordPattern(m, key, what, { date: today(), commit: flag(args, '--commit') });
      save(m);
      return console.log(`${key}: seen ${times} time(s).${times >= 2 ? ' It deserves a mechanism now.' : ''}`);
    }
    case 'mechanism': {
      const [key, what] = args, pr = flag(args, '--pr');
      const p = m.patterns.find(x => x.key === key);
      if (!p || !what || !pr) throw new Error('Usage: mechanism <existing key> "what stops it" --pr <url>');
      p.mechanism = { date: today(), what, pr };
      m.mechanisms.push({ date: today(), key, what, pr });
      save(m);
      return console.log(`${key}: stopped by ${what}.`);
    }
    case 'dispatch': {
      const [agent, to] = args;
      if (!EXECUTORS.includes(agent) || !to) throw new Error(`Usage: dispatch <${EXECUTORS.join('|')}> <commit>`);
      m.dispatches[agent] = { date: today(), to };
      save(m);
      return console.log(`${agent}: dispatched up to ${to}.`);
    }
    case 'record': return record(args);
    case 'history':
      for (const r of m.rounds) console.log(`${r.date} · ${r.from?.slice(0, 7) || '—'}..${r.to.slice(0, 7)}${r.issue ? ` · ${r.issue}` : ''}${r.pr ? ` · ${r.pr}` : ''}${r.note ? ` · ${r.note}` : ''}`);
      for (const x of m.mechanisms) console.log(`mechanism ${x.date} · ${x.key}: ${x.what} (${x.pr})`);
      return;
    default:
      console.error(USAGE);
      process.exit(2);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { await main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(1); }
}

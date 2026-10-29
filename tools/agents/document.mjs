#!/usr/bin/env node
/**
 * The memory and the checks of the documentation agent (D-172). The agent uses it in its daily
 * round, and any session can run it before proposing a merge.
 *
 *   node tools/agents/document.mjs check [--from <commit>]   # what came in and what is left to document
 *   node tools/agents/document.mjs record --to <commit> [--pr <url>] [--pending "text"]…
 *   node tools/agents/document.mjs history                  # the previous rounds and what is pending
 *
 * `check` starts from the commit saved in docs/documentation.json (or from `--from`), lists what
 * came into main and checks what can be checked without reading prose:
 *   - each D-n cited in the repo exists in docs/decisions/ (one file each, D-394), and none is there twice;
 *   - each file is named after its heading, its Topics exist, and docs/DECISIONS.md is up to date;
 *   - the decisions are in order and without gaps (an empty number is written "(número sin usar)"
 *     or "(unused number)");
 *   - each decision has one of the four Statuses (D-213), and what its Status cites exists;
 *   - if a decision changes, amends or replaces another, the other's Status names it;
 *   - no ID of docs/REQUERIMIENTOS.md nor U-n of docs/USABILIDAD.md is there twice;
 *   - the backquoted paths of the guides (not of the history) exist;
 *   - each script of tools/e2e/ appears in tools/e2e/README.md;
 *   - the published version has its entry in CHANGELOG.md.
 * The rest (that the prose says what the code does) the agent reads. Exits with 1 if something is missing.
 * At the end it shows the messages the app introduces itself with (sharing it, the video and the
 * link card, D-271) as they come out, so the agent reads them against what came in.
 *
 * `record` closes a round: it saves how far it checked, the PR and what was left pending, which the
 * next round shows first. That way the agent remembers what it did not get to.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compartirApp, LO_PRINCIPAL } from '../../public/assets/js/compartir.js';
import { COMMON } from '../../public/assets/js/i18n.js';
import { PORTADA } from '../../public/assets/js/games.js';
import { allText, readAll, readTopics, topicsOf, buildIndex, numberOf, DIR, INDEX } from './decision.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MEMORY = join(ROOT, 'docs/documentation.json');

/* ------------------------------------------------------------------ */
/* Pure checks (tested by tools/agents/document.test.mjs)             */
/* ------------------------------------------------------------------ */

/** A heading for a number that was never used, in Spanish (before D-316) or English. */
const UNUSED = /\((número sin usar|unused number)\)/;

/**
 * The decision numbers that have their "## D-n" heading in DECISIONES.md, the repeated ones, those
 * missing between D-1 and the highest, and those that come out of order (`[n, the previous one]`).
 */
export function writtenDecisions(decisions) {
  const seen = new Set(), repeated = new Set(), outOfOrder = [];
  let previous = 0;
  for (const m of decisions.matchAll(/^## D-(\d+)\b/gm)) {
    const n = Number(m[1]);
    if (seen.has(n)) repeated.add(n);
    else if (n < previous) outOfOrder.push([n, previous]);
    seen.add(n);
    previous = Math.max(previous, n);
  }
  const gaps = [];
  for (let i = 1; i < previous; i++) if (!seen.has(i)) gaps.push(i);
  return { written: seen, repeated: [...repeated].sort((a, b) => a - b), gaps, outOfOrder };
}

/** The repeated IDs of a list, in the order they repeat. */
const repeatedIn = ids => [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];

/** The IDs of REQUERIMIENTOS.md (the first column, `| RP-01 |`) that are in more than one row. */
export const repeatedRequirements = text => repeatedIn([...text.matchAll(/^\|\s*([A-Z]+-\d+[a-z]?)\s*\|/gm)].map(m => m[1]));

/** The rules of USABILIDAD.md (`**U-n · …`) defined twice. */
export const repeatedUsabilityRules = text => repeatedIn([...text.matchAll(/\*\*U-(\d+[a-z]?) ·/g)].map(m => `U-${m[1]}`));

/** Each "## D-n · title" with its Status and Relation (null if missing); Spanish or English labels (D-316). */
export function entries(decisions) {
  const parts = decisions.split(/^(?=## D-\d+\b)/m).filter(p => p.startsWith('## D-'));
  return parts.map(p => {
    const [title] = p.split('\n');
    const field = name => { const m = p.match(new RegExp(`\\*\\*(?:${name}):\\*\\*[ \\t]*([^\\n]*?)[ \\t]*(?: · \\*\\*|$)`, 'm')); return m ? m[1] : null; };
    return { n: Number(title.match(/D-(\d+)/)[1]), title, unused: UNUSED.test(title), status: field('Estado|Status'), relation: field('Relación|Relation') };
  });
}

/**
 * The Status, if it is one of the four of D-213: `{ type, by }`, with the D-n that amend or replace
 * it. English (D-316) and Spanish both read; `type` is always the English name.
 */
const ES = { vigente: 'current', derogada: 'revoked', corregida: 'amended', reemplazada: 'replaced' };
export function readStatus(status) {
  if (status === 'current' || status === 'revoked') return { type: status, by: [] };
  if (status === 'vigente' || status === 'derogada') return { type: ES[status], by: [] };
  const m = (status || '').match(/^(corregida|reemplazada|amended|replaced) (?:por|by) (D-\d+(?:, D-\d+)*)$/);
  if (!m || (ES[m[1]] ? !/ por /.test(status) : !/ by /.test(status))) return null;
  return { type: ES[m[1]] || m[1], by: [...m[2].matchAll(/D-(\d+)/g)].map(x => Number(x[1])) };
}

/**
 * The decisions a Relation says it changes, amends or replaces. It counts what comes after the
 * verb up to the next verb or the semicolon: "corrige D-75 (el alto) y ajusta D-76" is only D-75;
 * "D-176 cambia la invitación" is nothing (there D-176 is the one that changes).
 */
const VERBS = /\b(cambia|corrige|reemplaza|amplía|ajusta|acota|completa|cierra|deroga|revisa|ordena|quita|saca|sube|es excepción|changes|amends|replaces|extends|adjusts|narrows|completes|closes|revokes|revises|reorders|removes|is an exception to)\b/;
export function amendedBy(relation) {
  const n = new Set();
  for (const clause of (relation || '').split(';')) {
    const pieces = clause.split(new RegExp(VERBS.source, 'g'));
    // split with a group leaves [before, verb, after, verb, after…]
    for (let i = 1; i < pieces.length; i += 2) {
      if (!/^(cambia|corrige|reemplaza|changes|amends|replaces)$/.test(pieces[i])) continue;
      for (const m of pieces[i + 1].matchAll(/\bD-(\d+)\b/g)) n.add(Number(m[1]));
    }
  }
  return [...n];
}

/**
 * What is wrong in the decision files themselves (D-394): a file not named after its heading, a
 * Topic that topics.json does not have, a meta line without English labels, a stale index.
 */
export function fileProblems(decisions, topics, index) {
  const problems = [], keys = new Set(topics.map(t => t.key));
  for (const d of decisions) {
    if (d.n === undefined) { problems.push(`${DIR}/${d.file} does not start with "## D-n · title"`); continue; }
    if (numberOf(d.file) !== d.n) problems.push(`${DIR}/${d.file} holds D-${d.n}: the file is named D-${d.n}.md`);
    for (const k of ['Fecha', 'Estado', 'Relación']) if (d.meta.has(k)) problems.push(`D-${d.n} uses the label **${k}:**; since D-394 the meta line is English (Date, Status, Relation, Topics)`);
    for (const t of topicsOf(d)) if (!keys.has(t)) problems.push(`D-${d.n} has the topic "${t}", which is not in ${DIR}/topics.json`);
  }
  if (index !== buildIndex(decisions, topics)) problems.push(`${INDEX} is stale: node tools/agents/decision.mjs index`);
  return problems;
}

/** What is wrong in the Statuses and Relations of the decisions (D-213). */
export function statusProblems(decisions) {
  const all = entries(decisions), problems = [];
  const byNumber = new Map(all.map(e => [e.n, e]));
  for (const e of all) {
    if (e.unused) continue;
    const status = readStatus(e.status);
    if (e.status === null) problems.push(`D-${e.n} has no **Status:** in ${DIR}/D-${e.n}.md`);
    else if (!status) problems.push(`D-${e.n} has a Status that is not one of the four: "${e.status}"`);
    else for (const x of status.by) if (!byNumber.has(x) || byNumber.get(x).unused) problems.push(`D-${e.n} is ${status.type} by D-${x}, which does not exist`);
    for (const x of amendedBy(e.relation)) {
      const other = byNumber.get(x);
      if (!other || other.unused || x === e.n) continue;
      const its = readStatus(other.status);
      if (!its || !['amended', 'replaced'].includes(its.type) || !its.by.includes(e.n)) {
        problems.push(`D-${e.n} changes, amends or replaces D-${x}, and the Status of D-${x} does not name it ("${other.status}")`);
      }
    }
  }
  return problems;
}

/**
 * The repo paths cited between backquotes: they start with a repo folder and are not templates
 * (`<folder>`, `*`, `{a,b}`, `…`) nor phrases. Without `:line`, `#anchor` or `?query`. Code
 * blocks do not count: commands go there, not citations.
 */
const FOLDERS = /^(public|tools|docs|firebase|marketing|\.github|\.claude)\//;
export const citedPaths = text => [...new Set([...text.replace(/```[\s\S]*?```/g, '').matchAll(/`([^`\n]+)`/g)]
  .map(m => m[1])
  .filter(r => FOLDERS.test(r) && !/[\s<*{…]/.test(r))
  .map(r => r.replace(/[?#].*$/, '').replace(/:\d.*$/, '')))];

/** The D-n cited in a text. */
export const citedDecisions = text => new Set([...text.matchAll(/\bD-(\d+)\b/g)].map(m => Number(m[1])));

/** What is missing from `list` in `text` (by file name, with or without the path). */
// An end-to-end script is named from tools/e2e/ ("hangman/local.mjs"); the others, by their path or name
const short = f => (f.startsWith('tools/e2e/') ? f.slice('tools/e2e/'.length) : f.split('/').pop());
export const notMentioned = (list, text) => list.filter(f => !text.includes(f) && !text.includes(short(f)));

/** Does CHANGELOG.md have the entry "## <version>"? */
export const changelogHas = (changelog, version) => new RegExp(`^## ${version.replace(/\./g, '\\.')}\\b`, 'm').test(changelog);

/** The version stamped in the cover page's importmap (`?v=0.81.0`). */
export const versionOf = html => (html.match(/\?v=(\d+\.\d+\.\d+)/) || [])[1] || null;

/** An empty memory, for the first round. */
export const newMemory = () => ({ checkedUpTo: null, pending: [], known: [], rounds: [] });

/** Separates the new from the already known: `known` are recorded problems waiting for the owner. */
export const split = (problems, known = []) => ({
  fresh: problems.filter(p => !known.includes(p)),
  old: problems.filter(p => known.includes(p)),
});

/**
 * Closes a round: advances how far it checked and replaces what is pending. If the last round
 * already reached that same commit, it is the same round: it is completed (the PR link, which is
 * known after opening it) instead of duplicated, and what is pending only changes if something is recorded.
 */
export function recordRound(memory, { date, from, to, pr = null, pending = [] }) {
  const rounds = memory.rounds || [];
  const last = rounds.at(-1);
  if (last && last.to === to) {
    const its = pending.length ? pending : last.pending || [];
    return {
      ...memory,
      checkedUpTo: to,
      pending: pending.length ? pending : memory.pending || [],
      rounds: [...rounds.slice(0, -1), { ...last, pr: pr || last.pr, pending: its }],
    };
  }
  return {
    ...memory,
    checkedUpTo: to,
    pending,
    rounds: [...rounds, { date, from, to, pr, pending }].slice(-60),
  };
}

/** What `check` shows: a round looks at main from the memory; a PR, its branch from the base. */
export const range = ({ from, memory, main, head }) => (from
  ? { start: from, tip: head, where: 'this branch' }
  : { start: memory.checkedUpTo, tip: main, where: 'main' });

/* ------------------------------------------------------------------ */
/* With the repo                                                       */
/* ------------------------------------------------------------------ */

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const read = f => readFileSync(join(ROOT, f), 'utf8');

export function readMemory() {
  if (!existsSync(MEMORY)) return newMemory();
  const m = JSON.parse(readFileSync(MEMORY, 'utf8'));
  return { ...newMemory(), ...m };
}
const saveMemory = m => writeFileSync(MEMORY, JSON.stringify(m, null, 2) + '\n');

/** The tip of main: the remote one if it exists (what is published), otherwise the local one. */
function mainTip() {
  for (const r of ['origin/main', 'main']) { try { return git('rev-parse', r); } catch (_) { /* the next one */ } }
  return git('rev-parse', 'HEAD');
}

/** Everything that can be checked without reading prose. Returns a list of problems. */
export function runChecks() {
  const problems = [];
  const files = git('ls-files').split('\n');
  const texts = files.filter(f => /\.(js|mjs|py|md|json|html|css)$/.test(f) && !f.startsWith('docs/screenshots/'));

  // Cited decisions that do not exist, and repeated ones
  const decisionsText = allText(ROOT);
  const { written, repeated } = writtenDecisions(decisionsText);
  for (const n of repeated) problems.push(`D-${n} is twice in ${DIR}/`);
  problems.push(...fileProblems(readAll(ROOT), readTopics(ROOT), existsSync(join(ROOT, INDEX)) ? read(INDEX) : ''));
  const missing = new Map();
  for (const f of texts) {
    for (const n of citedDecisions(read(f))) if (!written.has(n)) missing.set(n, [...(missing.get(n) || []), f]);
  }
  for (const [n, fs] of [...missing].sort((a, b) => a[0] - b[0])) problems.push(`D-${n} is cited (${fs.slice(0, 3).join(', ')}${fs.length > 3 ? '…' : ''}) and is not in ${DIR}/`);

  // Numbering, Statuses and unmarked amendments (D-213)
  const { gaps } = writtenDecisions(decisionsText);
  // A number missing here may be that of an open PR (CLAUDE.md, D-135): that is not a gap
  const branches = git('for-each-ref', '--format=%(refname)', 'refs/remotes').split('\n').filter(r => r && !r.endsWith('/HEAD'));
  // …or one reserved with `decision.mjs reserve` (D-301): its `reserve/D-n` branch (`reserva/D-n`
  // before D-316) says someone is writing it
  const inOtherBranch = n => branches.some(r => r.endsWith(`/reserve/D-${n}`) || r.endsWith(`/reserva/D-${n}`)) || (() => { try { return branches.some(b => { try { git('cat-file', '-e', `${b}:${DIR}/D-${n}.md`); return true; } catch (_) { return false; } }); } catch (_) { return false; } })();
  for (const n of gaps.filter(n => !inOtherBranch(n))) problems.push(`D-${n} is missing from ${DIR}/: a number that was not used is written "## D-${n} · (unused number)"`);
  problems.push(...statusProblems(decisionsText));

  // Repeated IDs
  for (const id of repeatedRequirements(read('docs/REQUERIMIENTOS.md'))) problems.push(`${id} is in more than one row of docs/REQUERIMIENTOS.md`);
  for (const id of repeatedUsabilityRules(read('docs/USABILIDAD.md'))) problems.push(`${id} is twice in docs/USABILIDAD.md`);

  // Paths that do not exist, in today's guides (DECISIONES, CHANGELOG and REQUERIMIENTOS are history)
  const guides = files.filter(f => /^(CLAUDE\.md|CONTRIBUTING\.md|docs\/(CANONES|AGREGAR-JUEGO|ADD-GAME|USABILIDAD|PANEL)\.md|docs\/games\/[^/]+\.md|\.claude\/agents\/[^/]+\.md|\.claude\/skills\/[^/]+\/SKILL\.md)$/.test(f));
  for (const f of guides) {
    for (const r of citedPaths(read(f))) if (!existsSync(join(ROOT, r))) problems.push(`${f} cites \`${r}\`, which does not exist`);
  }

  // End-to-end scripts that its README does not name
  const scripts = files.filter(f => /^tools\/e2e\/.+\.mjs$/.test(f) && !/cdp\.mjs$/.test(f));
  for (const f of notMentioned(scripts, read('tools/e2e/README.md'))) problems.push(`the script ${f} is not in tools/e2e/README.md`);

  // The published version has its entry
  const version = versionOf(read('public/index.html'));
  if (version && !changelogHas(read('CHANGELOG.md'), version)) problems.push(`version ${version} has no entry in CHANGELOG.md`);

  return problems;
}

/**
 * The messages the app introduces itself with, as they come out in Spanish (D-271): the one for
 * sharing it (the same on the phone and on the computer), the video's and the link card's
 * subtitle. If something main came in that they do not name, it is added to LO_PRINCIPAL and to
 * the four languages.
 */
function appMessages() {
  const C = COMMON.es;
  const { texto: text } = compartirApp({ C, lang: 'es', juegos: PORTADA.filter(g => g.available).length });
  const subtitle = readFileSync(join(ROOT, 'public/index.html'), 'utf8').match(/<meta name="description" content="([^"]*)"/)?.[1];
  const indent = t => t.split('\n').map(l => `    ${l}`).join('\n');
  console.log('\nThis is how the app introduces itself (D-271). Did something main come in that it does not name?');
  console.log(`  The main things: ${LO_PRINCIPAL.map(p => `${p.emoji} ${p.que}`).join(' · ')}`);
  console.log(`  Sharing the app (shareApp in i18n.js):\n${indent(text)}`);
  console.log(`  The video (shareSheet.videoLines):\n${indent(C.shareSheet.videoLines.join('\n'))}`);
  console.log(`  The link card (og.mjs):\n${indent(subtitle || '(no subtitle)')}`);
}

function check(from) {
  const m = readMemory();
  // With --from it is PR mode: what this branch brings since its base, not what came into main
  const { start: asked, tip, where } = range({ from, memory: m, main: mainTip(), head: git('rev-parse', 'HEAD') });
  const start = asked ? git('rev-parse', asked) : null;
  if (m.pending?.length) {
    console.log('Pending from the previous round:');
    for (const p of m.pending) console.log(`  · ${p}`);
    console.log('');
  }
  if (start) {
    const log = git('log', '--first-parent', '--format=%h %ad %s', '--date=short', `${start}..${tip}`);
    console.log(log ? `Came into ${where} since ${start.slice(0, 7)}:\n${log.split('\n').map(l => `  ${l}`).join('\n')}\n` : `Nothing new in ${where} since ${start.slice(0, 7)}.\n`);
    if (log) {
      const touched = git('diff', '--stat=120', `${start}..${tip}`).split('\n').slice(-1)[0];
      console.log(`  (${touched.trim()})\n`);
    }
  } else console.log('First round: there is no saved commit. Check from where it makes sense with --from.\n');
  const { fresh, old } = split(runChecks(), m.known);
  if (fresh.length) {
    console.log('Left to document:');
    for (const p of fresh) console.log(`  ✗ ${p}`);
  } else console.log('✓ Decisions, IDs, paths, scripts and CHANGELOG up to date.');
  if (old.length) {
    console.log('\nAlready known (waiting for the owner, in "known" of docs/documentation.json):');
    for (const p of old) console.log(`  · ${p}`);
  }
  appMessages();
  if (!from) console.log(`\nWhen closing the round: node tools/agents/document.mjs record --to ${tip.slice(0, 7)} [--pending "…"], and with the PR open: record --to ${tip.slice(0, 7)} --pr <url>`);
  return fresh.length ? 1 : 0;
}

function record(args) {
  const value = n => { const i = args.indexOf(n); return i < 0 ? null : args[i + 1]; };
  const pending = args.flatMap((a, i) => (a === '--pending' ? [args[i + 1]] : []));
  const m = readMemory();
  const to = value('--to') ? git('rev-parse', value('--to')) : mainTip();
  const updated = recordRound(m, { date: new Date().toISOString().slice(0, 10), from: m.checkedUpTo, to, pr: value('--pr'), pending });
  saveMemory(updated);
  console.log(`Recorded: checked up to ${to.slice(0, 7)}${pending.length ? `, ${pending.length} pending` : ''}. It goes in the round's PR.`);
  return 0;
}

function history() {
  const m = readMemory();
  for (const r of m.rounds || []) console.log(`${r.date}  ${(r.from || '—').slice(0, 7)}..${(r.to || '').slice(0, 7)}  ${r.pr || 'no PR'}${r.pending?.length ? `  (${r.pending.length} pending)` : ''}`);
  if (!m.rounds?.length) console.log('No rounds recorded yet.');
  if (m.pending?.length) { console.log('\nPending:'); for (const p of m.pending) console.log(`  · ${p}`); }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [command, ...rest] = process.argv.slice(2);
  const i = rest.indexOf('--from');
  const code = command === 'check' ? check(i < 0 ? null : rest[i + 1])
    : command === 'record' ? record(rest)
    : command === 'history' ? history()
    : (console.error('Usage: node tools/agents/document.mjs check [--from <commit>] | record --to <commit> [--pr <url>] [--pending "…"] | history'), 2);
  process.exit(code);
}

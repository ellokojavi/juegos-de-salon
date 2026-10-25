// Decisions (D-n): one file each, a generated index, and numbers without clashes (D-301, D-394).
//
// Each decision is docs/decisions/D-<n>.md: its "## D-n · title" heading, a meta line
// (**Date:** · **Status:** · **Relation:** · **Topics:**) and its text. docs/DECISIONS.md is the
// index, built from those files and docs/decisions/topics.json: never edited by hand. Two PRs that
// add decisions touch different files, so they do not collide; if the index collides when bringing
// in main, `index` builds it again (D-394, which replaced the merge driver of D-301).
//
// Numbers are reserved on GitHub before writing them (D-301): a `reserve/D-n` branch pushed with
// `git push --force-with-lease=<branch>:` (empty: "it must not exist"), which GitHub refuses if it
// already exists, so two sessions never get the same one. `reserve` also writes the file's
// skeleton. The `reserva/D-n` branches from before D-316 still count as taken.
//
// Usage:
//   node tools/agents/decision.mjs reserve [--count n]   # reserves the next free one(s) and writes their skeleton
//   node tools/agents/decision.mjs next                  # which one it would be, without reserving it
//   node tools/agents/decision.mjs reservations          # the reserved ones not yet in main
//   node tools/agents/decision.mjs clean                 # deletes the reservations already in main
//   node tools/agents/decision.mjs index [--check]       # builds docs/DECISIONS.md (--check: exits 1 if stale)
//   node tools/agents/decision.mjs split [file]          # a branch from before D-394: moves the decisions of
//                                                        # docs/DECISIONES.md (or file) to their own files
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO = process.env.REPO || 'ellokojavi/juegos-de-salon';
export const DIR = 'docs/decisions';
export const INDEX = 'docs/DECISIONS.md';
export const LEGACY = 'docs/DECISIONES.md';
const TOPICS = `${DIR}/topics.json`;
/** The reservation branch prefix, and the one used before D-316 (still read and cleaned). */
export const PREFIX = 'reserve';
const OLD_PREFIX = 'reserva';

/** A decision file's name, and the number in one. */
export const fileOf = n => `D-${n}.md`;
export const numberOf = name => { const m = name.match(/^D-(\d+)\.md$/); return m ? Number(m[1]) : null; };
/** The numbers of the "## D-n" headings of a text. */
export const numbers = text => [...text.matchAll(/^## D-[0]*(\d+)\b/gm)].map(m => Number(m[1]));
/** The next free one: one more than the highest of all. */
export const nextFree = (...lists) => Math.max(0, ...lists.flat()) + 1;

/* ---------------------------- one decision ---------------------------- */

/** A decision's parts: `{ n, title, meta: Map(label → value), body }`. */
export function parse(text) {
  const [heading, metaLine = '', ...rest] = text.replace(/\n*$/, '').split('\n');
  const m = heading.match(/^## D-[0]*(\d+) · (.*)$/);
  if (!m) return null;
  const meta = new Map();
  if (/^\*\*[^*]+:\*\*/.test(metaLine)) {
    for (const f of metaLine.split(/ · (?=\*\*[^*]+:\*\*)/)) { const p = f.match(/^\*\*([^*]+):\*\* ?(.*)$/); if (p) meta.set(p[1], p[2]); }
    return { n: Number(m[1]), title: m[2], meta, body: rest.join('\n') };
  }
  return { n: Number(m[1]), title: m[2], meta, body: [metaLine, ...rest].join('\n') };
}

/** Back to text, ending in one "\n". */
export function format({ n, title, meta, body }) {
  const line = [...meta].map(([k, v]) => `**${k}:** ${v}`.trimEnd()).join(' · ');
  return [`## D-${n} · ${title}`, ...(line ? [line] : []), ...(body ? [body] : [])].join('\n').replace(/\n*$/, '\n');
}

/** The status values of D-213, Spanish (before D-394) to English. */
const STATUS_ES = [[/^vigente$/, 'current'], [/^derogada$/, 'revoked'], [/^corregida por /, 'amended by '], [/^reemplazada por /, 'replaced by ']];
const LABELS_ES = { Fecha: 'Date', Estado: 'Status', 'Relación': 'Relation', Temas: 'Topics' };

/** The meta line in English: labels and Status (the Relation's prose is translated later, D-354). */
export function englishMeta(meta) {
  const out = new Map();
  for (const [k, v] of meta) {
    const label = LABELS_ES[k] || k;
    out.set(label, label === 'Status' ? STATUS_ES.reduce((s, [re, to]) => s.replace(re, to), v) : v);
  }
  return out;
}

/** The topic keys a decision lists. */
export const topicsOf = d => (d.meta.get('Topics') || '').split(',').map(s => s.trim()).filter(Boolean);

/* ---------------------------- all of them ---------------------------- */

/** The decisions in docs/decisions/, parsed and in order. */
export function readAll(root = ROOT) {
  const dir = join(root, DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => numberOf(f) !== null).sort((a, b) => numberOf(a) - numberOf(b))
    .map(f => ({ file: f, text: readFileSync(join(dir, f), 'utf8') }))
    .map(({ file, text }) => ({ file, text, ...parse(text) }));
}

/** All the decisions as one text, as DECISIONES.md was: what the checks of document.mjs read. */
export const allText = (root = ROOT) => readAll(root).map(d => d.text.replace(/\n*$/, '\n')).join('\n');

export const readTopics = (root = ROOT) => JSON.parse(readFileSync(join(root, TOPICS), 'utf8')).topics;

/** The kind of a Status: current, amended, replaced, revoked or unused. */
export function kind(d) {
  if (/\((unused number|número sin usar)\)/.test(d.title)) return 'unused';
  return (d.meta.get('Status') || '').split(' ')[0] || 'none';
}

const cell = s => s.replace(/\|/g, '\\|');
const link = d => `[D-${d.n}](decisions/${fileOf(d.n)})`;

/** docs/DECISIONS.md, from the files and the topics. */
export function buildIndex(decisions, topics) {
  const inForce = decisions.filter(d => ['current', 'amended'].includes(kind(d)));
  const gone = decisions.filter(d => ['replaced', 'revoked'].includes(kind(d)));
  const unused = decisions.filter(d => kind(d) === 'unused');
  const byTopic = topics.map(t => [t, decisions.filter(d => topicsOf(d).includes(t.key))]);
  const row = d => `| ${link(d)} | ${cell(d.title)} | ${cell(d.meta.get('Status') || '')} |`;
  return [
    '# Decisions',
    '',
    '<!-- Generated by `node tools/agents/decision.mjs index` from docs/decisions/: do not edit by hand (D-394). -->',
    '',
    'Design and architecture decisions, ADR style: numbered and never deleted. If one changes, a new one',
    'amends or replaces it. **Today\'s rule is in [CANONES.md](CANONES.md); here is the history, with its why** (D-213).',
    '',
    `Each decision is a file in [decisions/](decisions/) (\`D-<n>.md\`), so reading one costs one page. Read`,
    'this index first, then open only the decisions you need.',
    '',
    '- **Status** is one of four: `current` · `amended by D-x` (still holds, except what the other changed) ·',
    '  `replaced by D-x` (no longer holds: the other one does) · `revoked` (no longer holds, and nothing replaces it).',
    '- **Relation** says what it does to other rules: changes, amends, extends, completes or is an exception to.',
    '- **Topics** places it in the table below ([decisions/topics.json](decisions/topics.json)).',
    '- The number is the order in which it was merged, not the date: dates may go back.',
    '- A new one: `node tools/agents/decision.mjs reserve` reserves the number and writes its skeleton; then',
    '  `node tools/agents/decision.mjs index`. Paths cited by decisions before D-192: [decisions/PATHS.md](decisions/PATHS.md).',
    '- Many older decisions are still written in Spanish; they are translated in phases (D-316, D-354).',
    '',
    '## By topic',
    '',
    'Where today\'s rule is and which decisions explain it: those in force that still explain something.',
    '',
    '| Topic | Today\'s rule | Decisions |',
    '|---|---|---|',
    ...byTopic.map(([t, ds]) => `| ${cell(t.name)} | ${t.rule} | ${ds.map(d => `D-${d.n}`).join(', ')} |`),
    '',
    `## In force (${inForce.length})`,
    '',
    '| D | Title | Status |',
    '|---|---|---|',
    ...inForce.map(row),
    '',
    `## No longer in force (${gone.length})`,
    '',
    '| D | Title | Status |',
    '|---|---|---|',
    ...gone.map(row),
    '',
    `Numbers never used: ${unused.map(d => `D-${d.n}`).join(', ') || 'none'}.`,
    '',
  ].join('\n');
}

/* ---------------------------- the split ---------------------------- */

/**
 * The decisions of a DECISIONES.md (before D-394) as files: `{ files: Map(name → text) }`. The meta
 * line goes to English (labels and Status); topics come from the old index's rows; the text stays
 * word for word. `titles` (optional) maps a number to its title in English.
 */
export function splitLegacy(text, topics, titles = {}) {
  const parts = text.split(/^(?=## D-\d+ )/m);
  const head = parts[0];
  const rowTopics = new Map();
  for (const m of head.matchAll(/^\| ([^|]+?) \| [^|]+ \| (D-[\d, D-]+) \|$/gm)) {
    const t = topics.find(x => x.es === m[1] || x.name === m[1]);
    if (!t) throw new Error(`a topic of the old index is not in ${TOPICS}: "${m[1]}"`);
    for (const x of m[2].matchAll(/D-[0]*(\d+)/g)) rowTopics.set(Number(x[1]), [...(rowTopics.get(Number(x[1])) || []), t.key]);
  }
  const files = new Map();
  for (const p of parts.slice(1)) {
    const body = p.replace(/(\n+---)?\n*$/, '');
    const d = parse(body);
    const meta = englishMeta(d.meta);
    const ts = rowTopics.get(d.n);
    if (ts && meta.size) meta.set('Topics', ts.join(', '));
    // Its relative links were written from docs/; the file is one folder deeper
    const relinked = d.body.replace(/\]\((?!https?:|#|\/)([^)]+)\)/g, '](../$1)');
    files.set(fileOf(d.n), format({ ...d, title: titles[d.n] || d.title, meta, body: relinked }));
  }
  return { files };
}

/* ---------------------------- with GitHub ---------------------------- */

const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
const gh = (...args) => sh('gh', args);
const api = (path, ...extra) => JSON.parse(gh('api', path, ...extra) || 'null');

/** The reservations on GitHub, with both prefixes: `[{ n, ref }]`. */
const reservations = () => sh('git', ['ls-remote', 'origin', `refs/heads/${PREFIX}/D-*`, `refs/heads/${OLD_PREFIX}/D-*`]).split('\n').filter(Boolean)
  .map(l => { const ref = l.split('\t')[1]; return { n: Number(ref.split('/D-')[1]), ref }; }).filter(r => r.n);

/** The numbers in a commit: its files in docs/decisions/, or the old file's headings. */
function numbersAt(rev) {
  const names = sh('git', ['ls-tree', '--name-only', `${rev}:${DIR}`], { stdio: ['ignore', 'pipe', 'ignore'] }).split('\n');
  return names.map(numberOf).filter(n => n !== null);
}
const inMain = () => { sh('git', ['fetch', '-q', 'origin', 'main']); try { return numbersAt('origin/main'); } catch (_) { return numbers(sh('git', ['show', `origin/main:${LEGACY}`])); } };

/** The numbers in main, in the open PRs (new files, or headings added to the old file) and in the reservations. */
function taken() {
  const main = inMain();
  const prs = [];
  for (const pr of api(`repos/${REPO}/pulls?state=open&per_page=100`) || []) {
    for (const f of api(`repos/${REPO}/pulls/${pr.number}/files?per_page=100`) || []) {
      if (f.filename.startsWith(`${DIR}/`) && numberOf(f.filename.slice(DIR.length + 1)) !== null) prs.push(numberOf(f.filename.slice(DIR.length + 1)));
      if (f.filename === LEGACY) prs.push(...[...(f.patch || '').matchAll(/^\+## D-[0]*(\d+)\b/gm)].map(m => Number(m[1])));
    }
  }
  return { main, prs, reservations: reservations().map(r => r.n) };
}

/** The skeleton of a new decision, to fill in. */
const skeleton = n => format({ n, title: '(title)', meta: new Map([['Date', new Date().toISOString().slice(0, 10)], ['Status', 'current'], ['Relation', '—'], ['Topics', '']]),
  body: '**Context:** …\n**Decision:** …\n**Why:** …\n**Consequences:** …' });

/** Writes docs/DECISIONS.md; true if it changed. */
function writeIndex() {
  const text = buildIndex(readAll(), readTopics()), f = join(ROOT, INDEX);
  if (existsSync(f) && readFileSync(f, 'utf8') === text) return false;
  writeFileSync(f, text);
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'next') {
    const t = taken();
    console.log(`D-${nextFree(t.main, t.prs, t.reservations)} (main up to D-${Math.max(...t.main)}; open PRs: ${t.prs.map(n => `D-${n}`).join(', ') || 'none'}; reservations: ${t.reservations.map(n => `D-${n}`).join(', ') || 'none'})`);
  } else if (cmd === 'reserve') {
    const count = Number(args.includes('--count') ? args[args.indexOf('--count') + 1] : 1);
    const t = taken();
    const sha = sh('git', ['rev-parse', 'origin/main']).trim();
    let n = nextFree(t.main, t.prs, t.reservations);
    const mine = [];
    for (let attempts = 0; mine.length < count; attempts++) {
      if (attempts > 50) { console.error(`✗ 50 numbers in a row refused since D-${n - 50}: something more than other sessions' reservations`); process.exit(1); }
      const ref = `refs/heads/${PREFIX}/D-${n}`;
      try { sh('git', ['push', '-q', `--force-with-lease=${ref}:`, 'origin', `${sha}:${ref}`]); mine.push(n); }
      catch (e) { if (!/stale info|already exists|rejected/.test(String(e.stderr || e.message))) { console.error(`✗ could not reserve D-${n}: ${String(e.stderr || e.message).trim()}\n  In a fork, the decision goes as D-?? (D-189).`); process.exit(1); } }
      n++;
    }
    mkdirSync(join(ROOT, DIR), { recursive: true });
    for (const x of mine) { const f = join(ROOT, DIR, fileOf(x)); if (!existsSync(f)) writeFileSync(f, skeleton(x)); }
    console.log(`${mine.map(x => `D-${x}`).join(' ')}  (skeleton in ${mine.map(x => `${DIR}/${fileOf(x)}`).join(', ')}; then: node tools/agents/decision.mjs index)`);
  } else if (cmd === 'reservations' || cmd === 'clean') {
    const main = new Set(inMain());
    for (const r of reservations()) {
      if (cmd === 'clean' && main.has(r.n)) { try { sh('git', ['push', '-q', 'origin', '--delete', r.ref]); console.log(`D-${r.n}: already in main, reservation deleted`); }
        catch (e) { console.log(`D-${r.n}: already in main; its reservation could not be deleted from here (${String(e.stderr || e.message).split('\n').find(l => /error:|403|denied/i.test(l)) || 'no permission'})`); } }
      else if (!main.has(r.n)) console.log(`D-${r.n}: reserved, not in main yet`);
    }
  } else if (cmd === 'index') {
    if (args.includes('--check')) {
      const stale = !existsSync(join(ROOT, INDEX)) || readFileSync(join(ROOT, INDEX), 'utf8') !== buildIndex(readAll(), readTopics());
      console.log(stale ? `✗ ${INDEX} is stale: node tools/agents/decision.mjs index` : `${INDEX} is up to date`);
      process.exit(stale ? 1 : 0);
    }
    console.log(writeIndex() ? `${INDEX} built` : `${INDEX} was already up to date`);
  } else if (cmd === 'split') {
    const file = args[0] && !args[0].startsWith("--") ? args[0] : null;
    const src = join(ROOT, file || LEGACY);
    const titles = args.includes('--titles') ? JSON.parse(readFileSync(args[args.indexOf('--titles') + 1], 'utf8')) : {};
    const { files } = splitLegacy(readFileSync(src, 'utf8'), readTopics(), titles);
    mkdirSync(join(ROOT, DIR), { recursive: true });
    let written = 0;
    const differ = [];
    for (let [name, text] of files) {
      const f = join(ROOT, DIR, name);
      // A title already translated here is kept: only what the branch changed counts as different
      if (existsSync(f)) text = text.replace(/^.*\n/, readFileSync(f, 'utf8').match(/^.*\n/)[0]);
      if (existsSync(f) && readFileSync(f, 'utf8') !== text && !args.includes('--force')) { differ.push(name); continue; } // already here, maybe edited since
      if (!existsSync(f) || readFileSync(f, 'utf8') !== text) { writeFileSync(f, text); written++; }
    }
    if (!file || file === LEGACY) rmSync(src);
    writeIndex();
    console.log(`${written} decision file(s) written in ${DIR}/; ${INDEX} built`);
    // On a branch from before D-394, its changes to older decisions (a Status that now names its new one) are carried by hand
    if (differ.length && existsSync(join(ROOT, DIR))) console.log(`Already here and different, left as they are (carry over by hand what this branch changed in them): ${differ.join(', ')}`);
  } else {
    console.error('Usage: node tools/agents/decision.mjs reserve [--count n] | next | reservations | clean | index [--check] | split [file]');
    process.exit(1);
  }
}

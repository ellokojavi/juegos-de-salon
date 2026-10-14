// Decision numbers (D-n) without clashes (D-301).
//
// Before, each session took "the next after the highest in main and in the open PRs" (D-135), and
// two sessions at once took the same one: 10 renumberings from October 3 to 12, with the number
// changed in the code, the commits and the guides. Now the number is reserved on GitHub before
// writing it: a `reserve/D-n` branch pushed with `git push --force-with-lease=<branch>:` (empty:
// "it must not exist"), and GitHub refuses it if it already exists. Two sessions at once never get
// the same one. The `reserva/D-n` branches from before D-316 still count as taken.
//
// And DECISIONES.md has its own way of merging (`.gitattributes`: merge=decisions): two branches
// that add different decisions at the end, or that touch different rows of the index, come
// together on their own when bringing in main. If both change the same decision or the same row,
// the usual conflict stays, to be solved by hand. GitHub does not use this driver (only git, in
// the local worktree).
//
// Usage:
//   node tools/agents/decision.mjs reserve [--count n]   # reserves the next free one and prints it
//   node tools/agents/decision.mjs next                  # which one it would be, without reserving it
//   node tools/agents/decision.mjs reservations          # the reserved ones not yet in main
//   node tools/agents/decision.mjs clean                 # deletes the reservations already in main
//   node tools/agents/decision.mjs install               # sets up the driver in this worktree (reserve does it by itself)
//   node tools/agents/decision.mjs driver %O %A %B       # git calls it when merging DECISIONES.md
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO = process.env.REPO || 'ellokojavi/juegos-de-salon';
const FILE = 'docs/DECISIONES.md';
/** The reservation branch prefix, and the one used before D-316 (still read and cleaned). */
export const PREFIX = 'reserve';
const OLD_PREFIX = 'reserva';

/** The numbers of the "## D-n" headings of a text. */
export const numbers = text => [...text.matchAll(/^## D-[0]*(\d+)\b/gm)].map(m => Number(m[1]));
/** The numbers of the added lines "+## D-n" of a diff. */
export const addedNumbers = patch => [...(patch || '').matchAll(/^\+## D-[0]*(\d+)\b/gm)].map(m => Number(m[1]));
/** The next free one: one more than the highest of all. */
export const nextFree = (...lists) => Math.max(0, ...lists.flat()) + 1;

/* ---------------------------- the driver ---------------------------- */

/** The head (everything before the first decision, with the index) and the decisions by number. */
export function splitDecisions(text) {
  const parts = text.split(/^(?=## D-\d+ )/m);
  const decisions = new Map();
  for (const p of parts.slice(1)) {
    const n = Number(p.match(/^## D-[0]*(\d+)/)[1]);
    if (decisions.has(n)) return null; // a repeated number: let a person look at it
    decisions.set(n, p);
  }
  return { head: parts[0], decisions };
}

/** The decisions in order, with a blank line between them and the file ending in "\n". */
export function build(head, decisions) {
  const order = [...decisions.keys()].sort((a, b) => a - b);
  return head + order.map((n, i) => {
    const d = decisions.get(n), body = d.replace(/\n*$/, ''), end = d.slice(body.length);
    return body + (i === order.length - 1 ? '\n' : end.length >= 2 ? end : '\n\n');
  }).join('');
}

/** Three-way merge of a piece: a change on only one side wins; two different ones, null. */
const three = (o, a, b) => a === b ? a : a === o ? b : b === o ? a : null;

/** git merge-file over three texts: `{ text, clean }`. */
function mergeFile(o, a, b) {
  const dir = mkdtempSync(join(tmpdir(), 'decisions-'));
  try {
    const [fo, fa, fb] = ['base', 'ours', 'theirs'].map((n, i) => { const f = join(dir, n); writeFileSync(f, [o, a, b][i]); return f; });
    const r = spawnSync('git', ['merge-file', '-p', '-L', 'ours', '-L', 'base', '-L', 'theirs', fa, fo, fb], { encoding: 'utf8' });
    return { text: r.stdout, clean: r.status === 0 };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

/** The cell of a row that is a list of decisions ("D-1, D-24"), or null. */
const list = cell => /^\s*D-\d+(, D-\d+)*\s*$/.test(cell) ? cell.trim().split(', ') : null;

/**
 * A table row changed on both sides: if the only differences are lists of decisions, they are
 * joined (what one side added and the other did not remove), in order. Otherwise, null.
 */
export function row(o, a, b) {
  const [co, ca, cb] = [o, a, b].map(f => f.split('|'));
  if (co.length !== ca.length || co.length !== cb.length) return null;
  const cells = [];
  for (let i = 0; i < co.length; i++) {
    const r = three(co[i], ca[i], cb[i]);
    if (r !== null) { cells.push(r); continue; }
    const [lo, la, lb] = [co[i], ca[i], cb[i]].map(list);
    if (!lo || !la || !lb) return null;
    const kept = [...new Set([...la, ...lb])].filter(x => !(lo.includes(x) && (!la.includes(x) || !lb.includes(x))));
    cells.push(` ${kept.sort((x, y) => Number(x.slice(2)) - Number(y.slice(2))).join(', ')} `);
  }
  return cells.join('|');
}

/**
 * The head (the introduction and the index): table rows are merged by their first cell (the
 * topic), and the rest, line by line. Two sides that add different decisions to the same row are
 * joined; two that change something else in the same row, or the same text, are not.
 */
export function mergeHead(o, a, b) {
  const r = three(o, a, b);
  if (r !== null) return r;
  const key = l => /^\| /.test(l) && !/^\|\s*-/.test(l) ? `\u0000${l.split('|')[1].trim()}` : null;
  const takeApart = t => {
    const rows = new Map(), lines = t.split('\n').map(l => { const k = key(l); if (!k) return l; if (rows.has(k)) throw new Error('repeated row'); rows.set(k, l); return k; });
    return { skeleton: lines.join('\n'), rows };
  };
  let po, pa, pb;
  try { [po, pa, pb] = [o, a, b].map(takeApart); } catch (_) { return null; }
  const skeleton = three(po.skeleton, pa.skeleton, pb.skeleton) ?? (() => { const m = mergeFile(po.skeleton, pa.skeleton, pb.skeleton); return m.clean ? m.text : null; })();
  if (skeleton === null) return null;
  const rows = new Map();
  for (const k of new Set([...po.rows.keys(), ...pa.rows.keys(), ...pb.rows.keys()])) {
    const [fo, fa, fb] = [po, pa, pb].map(p => p.rows.get(k));
    let f = three(fo, fa, fb);
    if (f === null && fo && fa && fb) f = row(fo, fa, fb);
    if (f === null) return null;
    rows.set(k, f);
  }
  const lines = [];
  for (const l of skeleton.split('\n')) {
    if (!l.startsWith('\u0000')) { lines.push(l); continue; }
    if (!rows.has(l)) return null; // a row the skeleton names and nobody has
    if (rows.get(l) !== undefined) lines.push(rows.get(l));
  }
  return lines.join('\n');
}

/**
 * Merges DECISIONES.md decision by decision: `{ text, clean }`. A new decision from either side goes
 * into its place; one changed on only one side, with that change; the index, row by row
 * (`mergeHead`). If both sides change the same thing (the same decision, the same number for two
 * different decisions, something else of the same row), it is not clean: the caller falls back to
 * the usual merge, with its conflict markers.
 */
export function merge(base, ours, theirs) {
  const [o, a, b] = [base, ours, theirs].map(splitDecisions);
  if (!o || !a || !b) return { clean: false };
  const head = mergeHead(o.head, a.head, b.head);
  if (head === null) return { clean: false };
  const decisions = new Map();
  for (const n of new Set([...o.decisions.keys(), ...a.decisions.keys(), ...b.decisions.keys()])) {
    const r = three(o.decisions.get(n), a.decisions.get(n), b.decisions.get(n));
    if (r === null) return { clean: false };
    if (r !== undefined) decisions.set(n, r);
  }
  return { text: build(head, decisions), clean: true };
}

/* ---------------------------- with GitHub ---------------------------- */

const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
const gh = (...args) => sh('gh', args);
const api = (path, ...extra) => JSON.parse(gh('api', path, ...extra) || 'null');

/** The reservations on GitHub, with both prefixes: `[{ n, ref }]`. */
const reservations = () => sh('git', ['ls-remote', 'origin', `refs/heads/${PREFIX}/D-*`, `refs/heads/${OLD_PREFIX}/D-*`]).split('\n').filter(Boolean)
  .map(l => { const ref = l.split('\t')[1]; return { n: Number(ref.split('/D-')[1]), ref }; }).filter(r => r.n);

/** The numbers in main, in the open PRs and in the reservations. */
function taken() {
  sh('git', ['fetch', '-q', 'origin', 'main']);
  const main = numbers(sh('git', ['show', `origin/main:${FILE}`]));
  const prs = [];
  for (const pr of api(`repos/${REPO}/pulls?state=open&per_page=100`) || []) {
    const f = (api(`repos/${REPO}/pulls/${pr.number}/files?per_page=100`) || []).find(x => x.filename === FILE);
    if (!f) continue;
    let ns = addedNumbers(f.patch);
    if (!f.patch) { try { ns = numbers(gh('api', `repos/${REPO}/contents/${FILE}?ref=${pr.head.sha}`, '-H', 'Accept: application/vnd.github.raw')); } catch (_) { /* no access */ } }
    prs.push(...ns);
  }
  return { main, prs, reservations: reservations().map(r => r.n) };
}

/** Sets up the DECISIONES.md driver in this worktree (git config is shared by all worktrees of the clone). */
export function install() {
  sh('git', ['config', 'merge.decisions.name', 'DECISIONES.md, decision by decision (D-301)']);
  sh('git', ['config', 'merge.decisions.driver', 'node tools/agents/decision.mjs driver %O %A %B']);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'driver') {
    // git: %O base, %A ours (the result goes here), %B theirs. 0 if it came out clean.
    const [fo, fa, fb] = args;
    const [o, a, b] = [fo, fa, fb].map(f => readFileSync(f, 'utf8'));
    const r = merge(o, a, b);
    if (r.clean) { writeFileSync(fa, r.text); process.exit(0); }
    const m = mergeFile(o, a, b);
    writeFileSync(fa, m.text);
    process.exit(m.clean ? 0 : 1);
  } else if (cmd === 'next') {
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
    try { install(); } catch (_) { /* no git */ }
    console.log(mine.map(x => `D-${x}`).join(' '));
  } else if (cmd === 'reservations' || cmd === 'clean') {
    sh('git', ['fetch', '-q', 'origin', 'main']);
    const inMain = new Set(numbers(sh('git', ['show', `origin/main:${FILE}`])));
    for (const r of reservations()) {
      if (cmd === 'clean' && inMain.has(r.n)) { try { sh('git', ['push', '-q', 'origin', '--delete', r.ref]); console.log(`D-${r.n}: already in main, reservation deleted`); }
        catch (e) { console.log(`D-${r.n}: already in main; its reservation could not be deleted from here (${String(e.stderr || e.message).split('\n').find(l => /error:|403|denied/i.test(l)) || 'no permission'})`); } }
      else if (!inMain.has(r.n)) console.log(`D-${r.n}: reserved, not in main yet`);
    }
  } else if (cmd === 'install') {
    install();
    console.log('DECISIONES.md driver set up (merge.decisions)');
  } else {
    console.error('Usage: node tools/agents/decision.mjs reserve [--count n] | next | reservations | clean | install | driver %O %A %B');
    process.exit(1);
  }
}

// The CHANGELOG, one file per PR (D-300): each PR leaves its entry in `changelog/<branch>.md`, with
// no number, and the version is assigned on its own, in the order PRs reach `main`. That way two
// open PRs no longer collide on the first line of CHANGELOG.md (64 of 89 catch-ups from 3 to 12 October).
//
// Today's version = the first entry of CHANGELOG.md, bumped once per pending entry in changelog/,
// in the order they reached main (the main commit that added each file: `git log --first-parent`).
// `publish.yml` stamps it that way; the processes round collects them into CHANGELOG.md with their
// number (`collect`) in a PR, and collecting them does not change the version.
//
// Usage:
//   node tools/release/changelog.mjs new [patch|minor]    # creates changelog/<branch>.md to write in
//   node tools/release/changelog.mjs version              # today's version (the one that gets published)
//   node tools/release/changelog.mjs show                 # the pending ones, with the number each gets
//   node tools/release/changelog.mjs check [--base <ref>] # the format; with --base, what the PR brings
//   node tools/release/changelog.mjs migrate [--base <ref>]  # an old entry in CHANGELOG.md → changelog/
//   node tools/release/changelog.mjs collect              # the pending ones into CHANGELOG.md (processes round)
//   node tools/release/changelog.mjs archive              # months before the newest entry's → changelog/archive/ (D-497)
//
// CHANGELOG.md keeps only the month of its newest entry (D-497): `collect` moves every older month
// to `changelog/archive/<yyyy-mm>.md`, newest first inside each file, so the file every session may
// read stays small. The version still comes from CHANGELOG.md's first entry, which never moves.
//
// An entry:
//   level: patch          (patch, minor or major: how much the version goes up)
//
//   - **What changed** for players, in the tone of the previous ones.
//
// Entries written before the switch to English start with `nivel: parche|menor|mayor`: still read.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const FOLDER = 'changelog';
export const LEVELS = ['patch', 'minor', 'major'];
/** Level names of entries written in Spanish, before D-316. */
const OLD_LEVELS = { parche: 'patch', menor: 'minor', mayor: 'major' };
const HEADING = /^## (\d+\.\d+\.\d+)\b/m;

/** The level in English, or undefined if it is not one (accepts the old Spanish names). */
export const normalLevel = l => LEVELS.includes(l) ? l : OLD_LEVELS[l];

/** X.Y.Z of the first entry of a CHANGELOG, or null. */
export const firstVersion = text => (HEADING.exec(text) || [, null])[1];

/** The version that follows `v` at the given level. */
export function bump(v, level) {
  const [a, b, c] = v.split('.').map(Number);
  level = normalLevel(level);
  if (level === 'major') return `${a + 1}.0.0`;
  if (level === 'minor') return `${a}.${b + 1}.0`;
  return `${a}.${b}.${c + 1}`;
}

/** `{ level, body }` of an entry, or `{ error }` if it cannot be understood. */
export function parseEntry(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const i = lines.findIndex(l => l.trim());
  const m = i < 0 ? null : lines[i].trim().match(/^(?:level|nivel):\s*(\S+)$/);
  if (!m) return { error: 'the first line must be "level: patch" (or minor, or major)' };
  const level = normalLevel(m[1]);
  if (!level) return { error: `level "${m[1]}" does not exist: patch, minor or major` };
  const body = lines.slice(i + 1).join('\n').trim();
  if (!/^- /m.test(body)) return { error: 'it has no "- …" line telling what changed' };
  if (HEADING.test(body)) return { error: 'it does not take "## X.Y.Z": the number is added on its own (D-300)' };
  return { level, body };
}

const git = (root, ...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const today = () => new Date().toISOString().slice(0, 10);

/** The files in changelog/ in the working copy, without the README. */
export const files = (root = ROOT) => existsSync(join(root, FOLDER))
  ? readdirSync(join(root, FOLDER)).filter(f => f.endsWith('.md') && f !== 'README.md').map(f => `${FOLDER}/${f}`)
  : [];

/**
 * The pending entries in the order they reached main: `[{ file, date }]`. What counts is the
 * mainline commit (`--first-parent`) that added each file; in a PR, GitHub tests a merge with main
 * as first parent, so the PR's entry ends up last. One git does not know (no commit yet, or a copy
 * without history) goes last, by name, with today's date.
 */
export function arrivalOrder(root = ROOT) {
  const present = new Set(files(root));
  const order = new Map();
  let log = '';
  try { log = git(root, 'log', '--first-parent', '--reverse', '--diff-filter=A', '--name-only', '--format=@@%cs', '--', `${FOLDER}/`); } catch (_) { /* no git */ }
  let date = today();
  for (const l of log.split('\n')) {
    if (l.startsWith('@@')) date = l.slice(2);
    else if (present.has(l)) { order.delete(l); order.set(l, date); } // if it was added again, the last time counts
  }
  for (const f of [...present].sort()) if (!order.has(f)) order.set(f, today());
  return [...order].map(([file, date]) => ({ file, date }));
}

/** The pending ones, parsed: `[{ file, date, level, body }]`, or `error` on the ones not understood. */
export const pending = (root = ROOT) => arrivalOrder(root)
  .map(e => ({ ...e, ...parseEntry(readFileSync(join(root, e.file), 'utf8')) }));

/** The number of each pending entry, on top of the first version of the CHANGELOG. */
export function compute(changelog, list) {
  const base = firstVersion(changelog);
  if (!base) throw new Error('CHANGELOG.md has no "## X.Y.Z — date" entry');
  let v = base;
  const entries = list.filter(e => !e.error).map(e => ({ ...e, version: (v = bump(v, e.level)) }));
  return { base, entries, version: v };
}

/** Today's version: the one publish.yml stamps (D-205, D-300). */
export const todayVersion = (root = ROOT) => compute(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), pending(root)).version;

/** The CHANGELOG with the entries on top, newest first. */
export function collect(changelog, entries) {
  const block = [...entries].reverse().map(e => `## ${e.version} — ${e.date}\n${e.body}\n\n`).join('');
  const i = changelog.search(HEADING);
  return i < 0 ? changelog.trimEnd() + '\n\n' + block : changelog.slice(0, i) + block + changelog.slice(i);
}

export const ARCHIVE = `${FOLDER}/archive`;

/**
 * CHANGELOG.md split by month (D-497): `{ kept, months }`, where `kept` is the text with only the
 * newest entry's month and `months` maps each older `yyyy-mm` to its entries' text, newest first.
 */
export function archive(changelog) {
  const i = changelog.search(HEADING);
  if (i < 0) return { kept: changelog, months: {} };
  const blocks = changelog.slice(i).split(/^(?=## \d+\.\d+\.\d+\b)/m);
  const month = b => (b.match(/^## \S+\s+—\s+(\d{4}-\d{2})/) || [])[1];
  const current = month(blocks[0]);
  const months = {};
  const kept = blocks.filter(b => {
    const m = month(b);
    if (!m || !current || m >= current) return true;
    months[m] = (months[m] || '') + b.replace(/\s*$/, '\n\n');
    return false;
  });
  return { kept: (changelog.slice(0, i) + kept.join('')).replace(/\s*$/, '\n'), months };
}

/** Writes the archived months into changelog/archive/, on top of what each file already has. */
export function writeArchive(root, changelog) {
  const { kept, months } = archive(changelog);
  mkdirSync(join(root, ARCHIVE), { recursive: true });
  for (const [m, text] of Object.entries(months)) {
    const f = join(root, ARCHIVE, `${m}.md`);
    const old = existsSync(f) ? readFileSync(f, 'utf8').replace(/^# .*\n+/, '') : '';
    writeFileSync(f, `# Changelog · ${m}\n\n${text}${old}`.replace(/\s*$/, '\n'));
  }
  writeFileSync(join(root, 'CHANGELOG.md'), kept);
  return Object.keys(months);
}

/** CHANGELOG.md and every archived month, as one text (for readers that look back, like the weekly report). */
export const fullHistory = (root = ROOT) => [readFileSync(join(root, 'CHANGELOG.md'), 'utf8'),
  ...(existsSync(join(root, ARCHIVE)) ? readdirSync(join(root, ARCHIVE)).filter(f => /^\d{4}-\d{2}\.md$/.test(f)).sort().reverse()
    .map(f => readFileSync(join(root, ARCHIVE, f), 'utf8').replace(/^# .*\n+/, '')) : [])].join('\n');

/** The `## X.Y.Z` entries of `now` that were not in `before`: `[{ version, date, body }]`. */
export function newEntries(before, now) {
  const seen = new Set([...before.matchAll(/^## (\d+\.\d+\.\d+)\b/gm)].map(m => m[1]));
  const blocks = now.split(/^(?=## \d+\.\d+\.\d+\b)/m).slice(1);
  return blocks.map(b => {
    const [head, ...rest] = b.split('\n');
    const [, version, date] = head.match(/^## (\d+\.\d+\.\d+)(?:\s+—\s+(\S+))?/);
    return { version, date: date || today(), body: rest.join('\n').trim(), block: b };
  }).filter(e => !seen.has(e.version));
}

/** How much `b` went up from `a`. */
export const levelBetween = (a, b) => {
  const [x, y] = [a, b].map(v => v.split('.').map(Number));
  return y[0] !== x[0] ? 'major' : y[1] !== x[1] ? 'minor' : 'patch';
};

/**
 * What a PR brings compared with its base: errors (they block `tests`) and warnings.
 * - A new "## X.Y.Z" entry in CHANGELOG.md is from before D-300: it moves to changelog/ with `migrate`.
 *   The exception is the PR that collects them (it deletes the ones in changelog/ it moves to CHANGELOG.md).
 * - A PR that touches public/ without an entry in changelog/ gets a warning, not an error: the
 *   usability round and small fixes may not have one.
 */
export function checkPR({ changelogBase, changelogNow, changes }) {
  const errors = [], warnings = [];
  const collecting = changes.some(c => c.status === 'D' && c.file.startsWith(`${FOLDER}/`));
  const added = newEntries(changelogBase, changelogNow);
  if (added.length && !collecting) errors.push(`CHANGELOG.md brings ${added.map(e => e.version).join(', ')}: since D-300 the entry goes without a number in changelog/<branch>.md. Move it with: node tools/release/changelog.mjs migrate`);
  const withEntry = changes.some(c => c.status !== 'D' && c.file.startsWith(`${FOLDER}/`));
  if (!collecting && !withEntry && changes.some(c => c.file.startsWith('public/'))) warnings.push('the PR changes public/ and does not bring its entry in changelog/ (node tools/release/changelog.mjs new)');
  return { errors, warnings };
}

/* ------------------------------------------------------------------ */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  const option = (n, fallback) => args.includes(n) ? args[args.indexOf(n) + 1] : fallback;
  const read = f => readFileSync(join(ROOT, f), 'utf8');
  const branch = () => git(ROOT, 'rev-parse', '--abbrev-ref', 'HEAD').trim();
  const fileFor = r => `${FOLDER}/${r.replace(/[^A-Za-z0-9._-]+/g, '-')}.md`;
  const inGit = (ref, f) => { try { return git(ROOT, 'show', `${ref}:${f}`); } catch (_) { return ''; } };
  const shallow = () => { try { return git(ROOT, 'rev-parse', '--is-shallow-repository').trim() === 'true'; } catch (_) { return false; } };

  if (cmd === 'version') {
    if (shallow() && files().length > 1) console.error('⚠️ copy without full history: the order of the pending entries may not be the one in main');
    console.log(todayVersion());
  } else if (cmd === 'show') {
    const { base, entries, version } = compute(read('CHANGELOG.md'), pending());
    console.log(`CHANGELOG.md: ${base}. Pending: ${entries.length}. Today's version: ${version}.`);
    for (const e of entries) console.log(`\n### ${e.version} — ${e.date} (${e.file}, ${e.level})\n${e.body}`);
  } else if (cmd === 'new') {
    const level = normalLevel(args[0] || 'patch');
    if (!level) { console.error(`level: ${LEVELS.join(', ')}`); process.exit(1); }
    const r = branch();
    if (r === 'main' || r === 'HEAD') { console.error('on a topic branch, not on main'); process.exit(1); }
    const f = fileFor(r);
    if (existsSync(join(ROOT, f))) { console.log(`already exists: ${f}`); process.exit(0); }
    mkdirSync(join(ROOT, FOLDER), { recursive: true });
    writeFileSync(join(ROOT, f), `level: ${level}\n\n- **What changed**, for players.\n`);
    console.log(`write the entry in ${f} (no number: it is added at merge time, D-300)`);
  } else if (cmd === 'check') {
    let bad = 0;
    for (const e of pending()) if (e.error) { console.log(`✗ ${e.file}: ${e.error}`); bad++; }
    // Against the point where the branch left the base (in CI, HEAD^1 of the test merge is that base)
    const base = option('--base') && git(ROOT, 'merge-base', option('--base'), 'HEAD').trim();
    if (base) {
      const changes = git(ROOT, 'diff', '--name-status', '--no-renames', base, 'HEAD').split('\n').filter(Boolean)
        .map(l => { const [status, file] = l.split('\t'); return { status: status[0], file }; });
      const { errors, warnings } = checkPR({ changelogBase: inGit(base, 'CHANGELOG.md'), changelogNow: read('CHANGELOG.md'), changes });
      for (const e of errors) { console.log(`✗ ${e}`); bad++; }
      for (const w of warnings) console.log(process.env.GITHUB_ACTIONS ? `::warning title=CHANGELOG::${w}` : `⚠️ ${w}`);
    }
    if (bad) process.exit(1);
    const { entries, version } = compute(read('CHANGELOG.md'), pending());
    console.log(`✓ changelog/: ${entries.length} pending entr${entries.length === 1 ? 'y' : 'ies'}; today's version would be ${version}`);
  } else if (cmd === 'migrate') {
    const base = option('--base') || git(ROOT, 'merge-base', 'origin/main', 'HEAD').trim();
    const before = inGit(base, 'CHANGELOG.md'), now = read('CHANGELOG.md');
    const added = newEntries(before, now);
    if (!added.length) { console.log('CHANGELOG.md brings no new entries: nothing to migrate'); process.exit(0); }
    const top = firstVersion(before);
    const level = added.map(e => levelBetween(top, e.version)).sort((a, b) => LEVELS.indexOf(b) - LEVELS.indexOf(a))[0];
    const f = fileFor(branch());
    mkdirSync(join(ROOT, FOLDER), { recursive: true });
    writeFileSync(join(ROOT, f), `level: ${level}\n\n${[...added].reverse().map(e => e.body).join('\n')}\n`);
    writeFileSync(join(ROOT, 'CHANGELOG.md'), added.reduce((t, e) => t.replace(e.block, ''), now));
    console.log(`${added.map(e => e.version).join(', ')} → ${f} (level: ${level}). Review it, commit and bring in main: CHANGELOG.md no longer collides.`);
  } else if (cmd === 'collect') {
    // The entry of the branch that collects is not in main yet: if it were collected, it would take
    // a number that may belong to another PR that gets in first (it happened in the 14/10 round). It stays in changelog/
    const own = fileFor(branch());
    const list = pending().filter(e => e.file !== own);
    if (existsSync(join(ROOT, own))) console.log(`${own} belongs to this branch: it stays unnumbered until it reaches main.`);
    const broken = list.filter(e => e.error);
    if (broken.length) { for (const e of broken) console.error(`✗ ${e.file}: ${e.error}`); process.exit(1); }
    if (shallow()) { console.error('✗ copy without full history: the order would not be the one in main (git fetch --unshallow)'); process.exit(1); }
    const { entries, version } = compute(read('CHANGELOG.md'), list);
    if (!entries.length) { console.log('nothing to collect'); process.exit(0); }
    writeFileSync(join(ROOT, 'CHANGELOG.md'), collect(read('CHANGELOG.md'), entries));
    for (const e of entries) unlinkSync(join(ROOT, e.file));
    const moved = writeArchive(ROOT, read('CHANGELOG.md'));
    console.log(`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} into CHANGELOG.md, up to ${version}: the version does not change when this merges.${moved.length ? ` Archived: ${moved.join(', ')} → ${ARCHIVE}/.` : ''}`);
  } else if (cmd === 'archive') {
    const moved = writeArchive(ROOT, read('CHANGELOG.md'));
    console.log(moved.length ? `${moved.join(', ')} → ${ARCHIVE}/` : 'nothing to archive: CHANGELOG.md holds one month');
  } else {
    console.error('Usage: node tools/release/changelog.mjs new [level] | version | show | check [--base <ref>] | migrate [--base <ref>] | collect | archive');
    process.exit(1);
  }
}

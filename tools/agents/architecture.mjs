/**
 * The architecture boundary (#1249 step 5, docs/ARCHITECTURE.md): a game is a folder that leans only on
 * the shared assets, so it can be moved, renamed or retired without touching another game.
 *
 *   node tools/agents/architecture.mjs          (hits not allowlisted, a count per rule; exit 0: report mode)
 *   node tools/agents/architecture.mjs --all    (also the allowlisted hits and the firebase paths)
 *   node tools/agents/architecture.mjs --gate   (exit 1 on any hit not allowlisted or stale entry, as the test does)
 *
 * It reads every .js/.mjs file git knows inside a game folder (tests excluded). Game folders: every
 * `path` of ALL_GAMES in public/assets/js/games.js, every folder under public/cup/games/ and
 * under public/labs/. A file belongs to the deepest game folder that holds it (cup/games/zip/ is its own
 * game, not part of cup/). The shared code under public/assets/ is read too, as one more folder: it may
 * not import a game, and its storage keys and hosts follow the same rules. Rules:
 *   import         a static or dynamic import that resolves outside public/assets/ and the game's own folder
 *                  (another game's folder is a hit). The shared modules next to the games of a host are
 *                  part of it: public/cup/games/*.js for Cup games, public/labs/*.js for lab games.
 *   external       fetch( / new XMLHttpRequest().open / new WebSocket( / import to an absolute http(s) URL
 *                  whose host is not the site's own (juegosdesalon.cl).
 *   storage-key    a localStorage/sessionStorage key written as a string literal that does not start with
 *                  `juegos-de-salon:`.
 *   firebase-path  a literal path in ref(db, '…') or child(…, '…'). INFORMATIONAL ONLY: listed and counted,
 *                  never failing, until step 7 of #1249 adds the manifests that declare each game's paths.
 *
 * Exceptions to the first three live in docs/architecture-allowlist.json, entries { file, rule, what, why };
 * an entry that no longer hits is stale and fails architecture.test.mjs (docs/RULES.md, rule 4).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const RULES = ['import', 'external', 'storage-key', 'firebase-path'];
export const INFORMATIONAL = new Set(['firebase-path']);
const SITE = /^(www\.)?juegosdesalon\.cl$/;
const PREFIX = 'juegos-de-salon:';
const git = args => execFileSync('git', ['ls-files', ...args], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);

/** Every game folder, 'public/<path>/' each. */
export async function gameFolders() {
  const { ALL_GAMES } = await import(join(ROOT, 'public/assets/js/games.js'));
  const sub = new Set();
  for (const f of git(['public/cup/games', 'public/labs'])) {
    const m = f.match(/^(public\/(?:cup\/games|labs)\/[^/]+)\//);
    if (m) sub.add(m[1] + '/');
  }
  return [...new Set([...ALL_GAMES.filter(g => g.path).map(g => 'public/' + g.path), ...sub])];
}

/** The deepest game folder holding a file, or null. */
export function folderOf(file, folders) {
  return folders.filter(d => file.startsWith(d)).sort((a, b) => b.length - a.length)[0] || null;
}

/** May a file in game folder `own` import `target` (a repo path)? */
export function allowedImport(target, own) {
  if (target.startsWith('public/assets/') || target.startsWith(own)) return true;
  const host = own.match(/^public\/(cup\/games|labs)\//)?.[0];
  return !!host && posix.dirname(target) + '/' === host;
}

const external = url => { try { return !SITE.test(new URL(url).host); } catch { return true; } };
const strip = src => src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const lineAt = (src, i) => src.slice(0, i).split('\n').length;

/** The hits of one file's source; `own` is its game folder. */
export function scan(src, file, own) {
  const hits = [];
  const code = strip(src);
  const hit = (rule, i, what) => hits.push({ file, rule, line: lineAt(code, i), what });
  for (const m of code.matchAll(/(?:\bimport\s*(?:[\w${}\s,*]*?\bfrom\s*)?|\bimport\s*\(\s*|\bexport\s*[\w${}\s,*]*?\bfrom\s*)(['"])([^'"\n]+)\1/g)) {
    const spec = m[2];
    if (/^https?:\/\//.test(spec)) { if (external(spec)) hit('external', m.index, spec); continue; }
    if (!spec.startsWith('.') && !spec.startsWith('/')) continue;
    const target = spec.startsWith('/') ? posix.join('public', spec) : posix.join(posix.dirname(file), spec);
    if (!allowedImport(target, own)) hit('import', m.index, spec);
  }
  for (const m of code.matchAll(/\b(?:fetch\s*\(|\.open\s*\(\s*['"]\w+['"]\s*,|new\s+WebSocket\s*\()\s*(['"`])(https?:\/\/[^'"`/\s$]+)/g)) {
    if (external(m[2])) hit('external', m.index, m[2]);
  }
  for (const m of code.matchAll(/\b(?:localStorage|sessionStorage)\s*(?:\.\s*(?:getItem|setItem|removeItem)\s*\(\s*|\[\s*)(['"`])([^'"`\n]*)\1/g)) {
    if (!m[2].startsWith(PREFIX)) hit('storage-key', m.index, m[2]);
  }
  for (const m of code.matchAll(/\b(?:ref\s*\(\s*\w+|child\s*\(\s*[\w.]+)\s*,\s*(['"`])([^'"`\n]+)\1/g)) hit('firebase-path', m.index, m[2]);
  return hits;
}

/** docs/architecture-allowlist.json: entries { file, rule, what, why }. */
export function allowlist() {
  return JSON.parse(readFileSync(join(ROOT, 'docs/architecture-allowlist.json'), 'utf8')).entries;
}

/** Every hit of every game file, `allowed` set from the allowlist, plus the stale entries. */
export async function check(entries = allowlist()) {
  const folders = await gameFolders();
  const hits = [];
  for (const f of git(['public/**/*.js', 'public/**/*.mjs'])) {
    if (/\.test\.mjs$/.test(f)) continue;
    const own = f.startsWith('public/assets/') ? 'public/assets/' : folderOf(f, folders);
    if (own) hits.push(...scan(readFileSync(join(ROOT, f), 'utf8'), f, own));
  }
  const used = new Set();
  for (const h of hits) {
    if (INFORMATIONAL.has(h.rule)) continue;
    const e = entries.find(e => e.file === h.file && e.rule === h.rule && e.what === h.what);
    if (e) { h.allowed = true; used.add(e); }
  }
  return { hits, stale: entries.filter(e => !used.has(e)) };
}

/** Counts per rule: { rule: { open, allowed } }. */
export function counts(hits) {
  const c = Object.fromEntries(RULES.map(r => [r, { open: 0, allowed: 0 }]));
  for (const h of hits) c[h.rule][h.allowed ? 'allowed' : 'open']++;
  return c;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const { hits, stale } = await check();
  const failing = hits.filter(h => !h.allowed && !INFORMATIONAL.has(h.rule));
  for (const h of args.includes('--all') ? hits : failing) console.log(`${h.file}:${h.line}  ${h.rule.padEnd(13)} ${h.what}${h.allowed ? '  (allowlisted)' : ''}`);
  for (const e of stale) console.log(`stale allowlist entry: ${e.file} ${e.rule} ${e.what}`);
  console.log('');
  for (const [r, n] of Object.entries(counts(hits))) console.log(`${r.padEnd(13)} ${n.open} open, ${n.allowed} allowlisted${INFORMATIONAL.has(r) ? ' (informational, never fails)' : ''}`);
  process.exit(args.includes('--gate') && (failing.length || stale.length) ? 1 : 0);
}

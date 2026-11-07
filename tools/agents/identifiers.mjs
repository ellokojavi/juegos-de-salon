/**
 * New identifiers in English as a ratchet (C-20, D-316, #1249 step 12): no exported function, class,
 * const or let under public/ or tools/ gets a Spanish name. Spanish is told by `isSpanish` of
 * english.mjs, word by word (`crearSala` → crear, sala).
 *
 *   node tools/agents/identifiers.mjs          (every Spanish exported name, by file; exit 0: report mode)
 *   node tools/agents/identifiers.mjs --gate   (exit 1 on a name not in the debt list, or a stale entry)
 *
 * New file names are not checked here: english.test.mjs already fails on any Spanish path that
 * docs/english-renames.json does not name. The names that existed when this ratchet started are frozen
 * in docs/english-identifiers-debt.json, { file, name }, under the one reason its `_about` gives; an
 * entry whose name is gone (renamed, or its file moved) is stale and fails identifiers.test.mjs, so the
 * list only shrinks. The generated bridge pages are left out, as in english.mjs.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isSpanish, trackedPaths } from './english.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEBT = join(ROOT, 'docs', 'english-identifiers-debt.json');

/** The names a module exports: declarations and `export { a, b as c }` (the exported side). */
export function exportedNames(src) {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const out = new Set();
  for (const m of code.matchAll(/^\s*export\s+(?:default\s+)?(?:async\s+)?(?:function\s*\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) out.add(m[1]);
  for (const m of code.matchAll(/^\s*export\s+(?:const|let|var)\s+\{([^}]*)\}/gm)) for (const p of m[1].split(',')) { const n = p.split(':').pop().trim().split('=')[0].trim(); if (/^[A-Za-z_$][\w$]*$/.test(n)) out.add(n); }
  for (const m of code.matchAll(/^\s*export\s*\{([^}]*)\}/gm)) for (const p of m[1].split(',')) { const n = p.trim().split(/\s+as\s+/).pop().trim(); if (/^[A-Za-z_$][\w$]*$/.test(n) && n !== 'default') out.add(n); }
  return [...out];
}

/** The JavaScript files the ratchet reads: tracked .js/.mjs under public/ and tools/. */
export const sources = (paths = trackedPaths()) => paths.filter(p => /^(public|tools)\//.test(p) && /\.m?js$/.test(p));

/** Every Spanish exported name, as { file, name }. `read(path)` gives a file's text. */
export function scan(files, read = p => readFileSync(join(ROOT, p), 'utf8')) {
  return files.flatMap(file => exportedNames(read(file)).filter(isSpanish).map(name => ({ file, name })));
}

/** The debt list: [{ file, name }]. */
export const readDebt = (path = DEBT) => JSON.parse(readFileSync(path, 'utf8')).entries;

/** The gate: Spanish names not in the debt, and debt entries whose name is gone. */
export function gate(found, debt) {
  const key = x => `${x.file} ${x.name}`;
  const owed = new Set(debt.map(key)), has = new Set(found.map(key));
  return { added: found.filter(x => !owed.has(key(x))).map(key), stale: debt.filter(d => !has.has(key(d))).map(key) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const found = scan(sources());
  const g = gate(found, readDebt());
  if (process.argv.includes('--freeze')) {
    const doc = JSON.parse(readFileSync(DEBT, 'utf8'));
    console.log(JSON.stringify({ ...doc, entries: found }, null, 1));
  } else {
    for (const x of found) console.log(`${x.file}  ${x.name}`);
    console.log(`identifiers (D-316): ${found.length} Spanish exported name(s), ${g.added.length} new, ${g.stale.length} stale`);
    if (process.argv.includes('--gate') && (g.added.length || g.stale.length)) process.exit(1);
  }
}

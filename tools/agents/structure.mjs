/**
 * The structure of a game as a check (C-2, #1249 step 12): every game folder has the files C-2 lists.
 *
 *   node tools/agents/structure.mjs          (every missing file; exit 0: report mode)
 *   node tools/agents/structure.mjs --gate   (exit 1 on a missing file not in the debt list, or a stale entry)
 *
 * Two kinds of folder:
 *   a game of GAMES (games.js)   public/<path>: index.html, style.css, rules.js and game.js. Its engine.js and
 *                                engine.test.mjs are required by public/assets/js/games.test.mjs already, so
 *                                they are not checked twice here.
 *   a game of La Copa            public/cup/games/<folder>/: engine.js and ui.js.
 *
 * What a folder still lacks goes in docs/structure-debt.json, { folder, file, reason }; an entry whose
 * file now exists, or whose folder is no longer checked, is stale and fails structure.test.mjs.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEBT = join(ROOT, 'docs', 'structure-debt.json');
/** The files C-2 asks of a game of GAMES (beyond the engine and its tests, which games.test.mjs asks). */
export const GAME_FILES = ['index.html', 'style.css', 'rules.js', 'game.js'];
/** The files C-2 asks of a game of La Copa. */
export const CUP_FILES = ['engine.js', 'ui.js'];

/** The folders to check, `public/...` without a trailing slash, each with the files it must have. */
export async function folders(root = ROOT) {
  const { GAMES } = await import(pathToFileURL(join(root, 'public/assets/js/games.js')).href);
  const out = GAMES.map(g => ({ folder: `public/${g.path.replace(/\/$/, '')}`, files: GAME_FILES }));
  const cup = join(root, 'public/cup/games');
  for (const d of readdirSync(cup).sort()) if (statSync(join(cup, d)).isDirectory()) out.push({ folder: `public/cup/games/${d}`, files: CUP_FILES });
  return out;
}

/** Every missing file, as { folder, file }. `has(path)` says whether a repo path exists. */
export function missing(list, has = p => existsSync(join(ROOT, p))) {
  return list.flatMap(({ folder, files }) => files.filter(f => !has(`${folder}/${f}`)).map(file => ({ folder, file })));
}

/** The debt list: [{ folder, file, reason }]. */
export const readDebt = (path = DEBT) => JSON.parse(readFileSync(path, 'utf8')).entries;

/** The gate: what is missing and not in the debt, the entries that no longer match (stale) and those without a reason. */
export function gate(found, debt, list) {
  const key = x => `${x.folder}/${x.file}`;
  const owed = new Set(debt.map(key));
  const checked = new Set(list.map(x => x.folder));
  const isMissing = new Set(found.map(key));
  return {
    added: found.filter(x => !owed.has(key(x))).map(key),
    stale: debt.filter(d => !checked.has(d.folder) || !isMissing.has(key(d))).map(key),
    unreasoned: debt.filter(d => !d.reason).map(key),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const list = await folders();
  const found = missing(list);
  const g = gate(found, readDebt(), list);
  for (const f of found) console.log(`missing ${f.folder}/${f.file}`);
  console.log(`structure (C-2): ${list.length} folders, ${found.length} missing file(s), ${g.added.length} new, ${g.stale.length} stale`);
  if (process.argv.includes('--gate') && (g.added.length || g.stale.length || g.unreasoned.length)) process.exit(1);
}

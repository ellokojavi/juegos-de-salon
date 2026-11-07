#!/usr/bin/env node
/**
 * Writes public/assets/js/manifests/<folder>.js from each public/<folder>/game.json (#1249 step 7), so
 * the browser imports the manifest as an ES module with no build. `--check` only reports stale ones.
 *
 *   node tools/generators/manifests.mjs [--check]
 *   node tools/generators/manifests.mjs migrate <folder> --modes local,online,solo [--firebase rooms/{code}] [--exception "C-19=why"]…
 *
 * `migrate` is the codemod of #1249 step 14: it takes a game's entry out of games.js into its
 * game.json (adding what games.js never held: modes, firebasePaths, canonExceptions), writes the
 * module, and puts `catalogEntry(<name>Manifest)` where the entry was, keeping its comments. It checks
 * that the GAMES entry comes out byte-identical (JSON) and undoes everything if not. A game whose entry
 * has fields the schema lacks is refused, naming them.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { validateManifest, MANIFEST_SCHEMA } from '../../public/assets/js/game-manifest.js';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');

/** The folders that have a game.json: 'hangman', and 'labs/julep' for one in the lab. */
export const manifestFolders = (root = PUBLIC) => ['', 'labs/'].flatMap(pre => existsSync(join(root, pre)) ? readdirSync(join(root, pre), { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(root, pre, d.name, 'game.json'))).map(d => pre + d.name) : []).sort();

export const readManifest = folder => JSON.parse(readFileSync(join(PUBLIC, folder, 'game.json'), 'utf8'));

/** The generated module's text for a manifest. */
export const renderModule = m => `// Generated from game.json by node tools/generators/manifests.mjs: do not edit by hand.\nexport default ${JSON.stringify(m, null, 2)};\n`;

export const generatedPath = folder => join(PUBLIC, 'assets', 'js', 'manifests', `${folder}.js`);

const GAMES_JS = join(PUBLIC, 'assets', 'js', 'games.js');
/** The order a game.json lists its fields in. */
const ORDER = ['id', 'path', 'emoji', 'name', 'tagline', 'keywords', 'players', 'duration', 'tipos', 'jugadas', 'unoAlDia', 'reuses', 'offline', 'nuevoDesde', 'slug', 'labs', 'available', 'modes', 'ai', 'memory', 'languages', 'firebasePaths', 'canonExceptions'];

/** A GAMES entry as games.js has it, read by a fresh node (games.js may have just changed). */
const entryNow = id => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import { gameById } from ${JSON.stringify(new URL('../../public/assets/js/games.js', import.meta.url).href)}; process.stdout.write(JSON.stringify(gameById(${JSON.stringify(id)})))`], { encoding: 'utf8' });

/** The manifest for a GAMES entry plus what games.js never held. Throws naming the fields the schema lacks. */
export function manifestOf(entry, { modes, firebasePaths, canonExceptions = [] }) {
  const extra = Object.keys(entry).filter(k => !MANIFEST_SCHEMA[k]);
  if (extra.length) throw new Error(`${entry.id}: its entry has fields the manifest schema lacks (${extra.join(', ')}); it stays in games.js`);
  const [min, max = min] = String(entry.players).split('–').map(Number);
  const m = { ...entry, players: { min, max }, modes, ai: modes.includes('cpu'), memory: `juegos-de-salon:${entry.id}:session`, languages: ['es', 'en', 'pt'],
    firebasePaths: firebasePaths ?? (modes.includes('online') ? ['rooms/{code}'] : []), canonExceptions };
  return Object.fromEntries(ORDER.filter(k => k in m).map(k => [k, m[k]]));
}

/** games.js with the entry of `id` replaced by `catalogEntry(<varName>)` and its import added. */
export function rewriteGamesJs(src, id, folder, varName) {
  const at = src.indexOf(`\n    id: '${id}',\n`);
  if (at < 0) throw new Error(`games.js: no entry with id '${id}' written as a literal`);
  const start = src.lastIndexOf('\n  {\n', at) + 1;
  const end = src.indexOf('\n  },\n', at) + '\n  },\n'.length;
  if (start <= 0 || end < at || src.slice(start, end).includes('\n  {\n', 1)) throw new Error(`games.js: could not find where '${id}' begins and ends`);
  // Its comments stay in games.js, above the line that replaces it
  const comments = src.slice(start, end).split('\n').filter(l => /^\s*\/\//.test(l)).map(l => '  ' + l.trim());
  const body = [`  // ${id}: from public/${folder}/game.json`, ...comments, `  catalogEntry(${varName}),`].join('\n') + '\n';
  let out = src.slice(0, start) + body + src.slice(end);
  const imports = [...out.matchAll(/^import \w+ from '\.\/manifests\/[\w/-]+\.js';\n/gm)];
  const last = imports.at(-1);
  if (!last) throw new Error('games.js: no manifest import to follow');
  const pos = last.index + last[0].length;
  return out.slice(0, pos) + `import ${varName} from './manifests/${folder}.js';\n` + out.slice(pos);
}

/** The codemod: moves the entry of `public/<folder>/` from games.js to its game.json. */
export function migrate(folder, opts) {
  if (existsSync(join(PUBLIC, folder, 'game.json'))) throw new Error(`${folder} already has its game.json`);
  const all = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
    `import { GAMES } from ${JSON.stringify(new URL('../../public/assets/js/games.js', import.meta.url).href)}; process.stdout.write(JSON.stringify(GAMES))`], { encoding: 'utf8' }));
  const entry = all.find(g => g.path === `${folder}/`);
  if (!entry) throw new Error(`no GAMES entry has path ${folder}/`);
  const before = JSON.stringify(entry);
  const m = manifestOf(entry, opts);
  const problems = validateManifest(m);
  if (problems.length) throw new Error(`${folder}: ${problems.join('; ')}`);
  const varName = folder.split('/').pop().replace(/-(\w)/g, (_, c) => c.toUpperCase()) + 'Manifest';
  const src = readFileSync(GAMES_JS, 'utf8');
  const json = join(PUBLIC, folder, 'game.json'), mod = generatedPath(folder);
  writeFileSync(json, JSON.stringify(m, null, 2) + '\n');
  mkdirSync(dirname(mod), { recursive: true });
  writeFileSync(mod, renderModule(m));
  writeFileSync(GAMES_JS, rewriteGamesJs(src, entry.id, folder, varName));
  let after = '';
  try { after = entryNow(entry.id); } catch (e) { after = `games.js no longer loads: ${e.message}`; }
  if (after !== before) {
    writeFileSync(GAMES_JS, src); rmSync(json); rmSync(mod);
    throw new Error(`${folder}: the GAMES entry would change, nothing written\n  before ${before}\n  after  ${after}`);
  }
  return m;
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === 'migrate') {
  const args = process.argv.slice(3);
  const opt = k => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
  const folder = args[0];
  const modes = (opt('--modes') || '').split(',').filter(Boolean);
  if (!folder || !modes.length) { console.error('usage: node tools/generators/manifests.mjs migrate <folder> --modes a,b [--firebase p1,p2] [--exception "C-n=why"]…'); process.exit(2); }
  const canonExceptions = args.flatMap((a, i) => (a === '--exception' ? [args[i + 1]] : [])).map(e => { const k = e.indexOf('='); return { canon: e.slice(0, k), why: e.slice(k + 1) }; });
  const fb = opt('--firebase');
  try {
    migrate(folder, { modes, firebasePaths: fb === undefined ? undefined : fb.split(',').filter(Boolean), canonExceptions });
    console.log(`migrated ${folder}: public/${folder}/game.json, assets/js/manifests/${folder}.js, and games.js reads it (entry unchanged)`);
  } catch (e) { console.error(e.message); process.exit(1); }
} else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  let bad = 0;
  for (const f of manifestFolders()) {
    const m = readManifest(f);
    const problems = validateManifest(m);
    if (problems.length) { bad++; console.error(`${f}/game.json: ${problems.join('; ')}`); continue; }
    const text = renderModule(m);
    const path = generatedPath(f);
    const old = existsSync(path) ? readFileSync(path, 'utf8') : '';
    if (old === text) continue;
    if (check) { bad++; console.error(`assets/js/manifests/${f}.js is stale: run node tools/generators/manifests.mjs`); } else { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); console.log(`wrote assets/js/manifests/${f}.js`); }
  }
  process.exit(bad ? 1 : 0);
}

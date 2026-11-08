/**
 * Where each game's code lives, for the checks that walk every game (C-21, D-542): a game of GAMES in
 * its own folder (`public/<path>`), a game built in cup/games/ (SUELTOS) in the folder its entry in
 * `CODE` (public/cup/games/index.js) imports its screen from.
 *
 *   codeFolder(game)   'public/hangman', 'public/cup/games/queens'
 *   isCupBuilt(game)   whether it is one of SUELTOS
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** { id: folder } read from CODE in public/cup/games/index.js: `id: () => Promise.all([… import('./<folder>/ui.js') …])`. */
export function cupFolders(root = ROOT) {
  const src = readFileSync(join(root, 'public/cup/games/index.js'), 'utf8');
  const out = {};
  for (const m of src.matchAll(/^\s*([\w$]+):\s*\(\)\s*=>\s*Promise\.all\(\[[^\n]*?import\('\.\/([\w-]+)\/ui\.js'\)/gm)) out[m[1]] = m[2];
  return out;
}

/** Every game, each with `folder` (its code, `public/...`) and `cup` (built in cup/games/). */
export async function allGames(root = ROOT) {
  const { ALL_GAMES, SUELTOS } = await import(pathToFileURL(join(root, 'public/assets/js/games.js')).href);
  const cup = cupFolders(root);
  return ALL_GAMES.map(g => {
    if (!SUELTOS.includes(g)) return { game: g, cup: false, folder: `public/${g.path.replace(/\/$/, '')}` };
    if (!cup[g.id]) throw new Error(`${g.id}: no entry in CODE (public/cup/games/index.js)`);
    return { game: g, cup: true, folder: `public/cup/games/${cup[g.id]}` };
  });
}

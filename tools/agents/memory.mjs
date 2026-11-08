/**
 * Game memory as a ratchet (C-6, #1249 step 12): every available game (ALL_GAMES, C-21) saves its game in
 * progress with `createSessionStore(` (public/assets/js/session.js) somewhere in its own JavaScript: its
 * folder, or for a game built in cup/games/ the folder its code is in (tools/agents/game-folders.mjs).
 *
 *   node tools/agents/memory.mjs          (each game and whether it uses it; exit 0: report mode)
 *   node tools/agents/memory.mjs --gate   (exit 1 on a game without it that the debt list does not name, or a stale entry)
 *
 * It measures only that the store is used; whether every action is saved, the resume panel and the
 * one-phone cover are still judged (the checklist at the end of the canons). A game that cannot keep
 * its game on the phone goes in docs/memory-debt.json, { id, reason }; an entry whose game now uses
 * the store, or is no longer an available game, is stale and fails memory.test.mjs.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { allGames } from './game-folders.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEBT = join(ROOT, 'docs', 'memory-debt.json');

/** Whether some source text calls createSessionStore( (a comment that only names it does not count). */
export const usesStore = srcs => srcs.some(s => /\bcreateSessionStore\(/.test(s.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')));

/** The JavaScript of a game folder (any depth), tests left out. */
export function sourcesOf(folder, root = ROOT) {
  const dir = join(root, folder);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true }).filter(f => /\.(m?js)$/.test(f) && !/\.test\.m?js$/.test(f)).map(f => readFileSync(join(dir, f), 'utf8'));
}

/** Every available game, each { id, folder, uses }. */
export async function games(root = ROOT) {
  return (await allGames(root)).filter(x => x.game.available)
    .map(({ game, folder }) => ({ id: game.id, folder, uses: usesStore(sourcesOf(folder, root)) }));
}

/** The debt list: [{ id, reason }]. */
export const readDebt = (path = DEBT) => JSON.parse(readFileSync(path, 'utf8')).entries;

/** The gate: games without the store not in the debt, entries that no longer match, entries without a reason. */
export function gate(list, debt) {
  const owed = new Set(debt.map(d => d.id));
  const without = new Set(list.filter(g => !g.uses).map(g => g.id));
  return {
    added: [...without].filter(id => !owed.has(id)),
    stale: debt.filter(d => !without.has(d.id)).map(d => d.id),
    unreasoned: debt.filter(d => !d.reason).map(d => d.id),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const list = await games();
  const g = gate(list, readDebt());
  for (const x of list) console.log(`${x.uses ? '✓' : '✗'} ${x.id} (${x.folder}/)`);
  console.log(`memory (C-6): ${list.length} games, ${list.filter(x => !x.uses).length} without createSessionStore, ${g.added.length} new, ${g.stale.length} stale`);
  if (process.argv.includes('--gate') && (g.added.length || g.stale.length || g.unreasoned.length)) process.exit(1);
}

// C-21 (D-542): every game is one more game. Code that walks the games walks ALL_GAMES from games.js;
// a hand-made union of GAMES and SUELTOS is how a change ends up reaching only part of them, so it
// may only live in games.js. Usage: node public/assets/js/all-games.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { GAMES, SUELTOS, ALL_GAMES } from './games.js';

const ROOT = new URL('../../../', import.meta.url);
assert.deepEqual(ALL_GAMES.map(g => g.id), [...GAMES, ...SUELTOS].map(g => g.id), 'ALL_GAMES is every game');
assert.equal(new Set(ALL_GAMES.map(g => g.id)).size, ALL_GAMES.length, 'no game twice');

const UNION = /\[\s*\.\.\.\s*(?:\w+\.)?(?:GAMES|SUELTOS)\b[^\]]*\.\.\.\s*\(?\s*(?:\w+\.)?(?:SUELTOS|GAMES)\b/;
const files = execFileSync('git', ['ls-files', '*.js', '*.mjs'], { cwd: ROOT, encoding: 'utf8' }).split('\n')
  .filter(f => f.startsWith('public/') || f.startsWith('tools/'))
  .filter(f => !['public/assets/js/games.js', 'public/assets/js/all-games.test.mjs'].includes(f));
const found = files.filter(f => UNION.test(readFileSync(new URL(f, ROOT), 'utf8')));
assert.deepEqual(found, [], `a hand-made union of GAMES and SUELTOS: use ALL_GAMES from games.js (C-21)`);
console.log(`✓ all-games: ${ALL_GAMES.length} games in one list, and ${files.length} files checked for a union by hand`);

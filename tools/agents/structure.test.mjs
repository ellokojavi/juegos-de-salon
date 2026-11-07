// node tools/agents/structure.test.mjs — C-2's file layout (#1249 step 12): each piece on synthetic
// input, then the gate on the repo: no game folder lacks a file C-2 lists unless the debt list says why.
import assert from 'node:assert/strict';
import { folders, missing, gate, readDebt, GAME_FILES, CUP_FILES } from './structure.mjs';

const list = [{ folder: 'public/g', files: GAME_FILES }, { folder: 'public/cup/games/c', files: CUP_FILES }];
const has = p => !['public/g/style.css', 'public/cup/games/c/ui.js'].includes(p);
const found = missing(list, has);
assert.deepEqual(found, [{ folder: 'public/g', file: 'style.css' }, { folder: 'public/cup/games/c', file: 'ui.js' }]);

let g = gate(found, [{ folder: 'public/g', file: 'style.css', reason: 'r' }], list);
assert.deepEqual(g.added, ['public/cup/games/c/ui.js'], 'a missing file not in the debt is new');
assert.deepEqual(g.stale, []);
g = gate([], [{ folder: 'public/g', file: 'style.css', reason: 'r' }, { folder: 'public/gone', file: 'x', reason: 'r' }], list);
assert.deepEqual(g.stale, ['public/g/style.css', 'public/gone/x'], 'a file that came back, or a folder no longer checked, is stale');
assert.deepEqual(gate([], [{ folder: 'public/g', file: 'x' }], list).unreasoned, ['public/g/x'], 'every entry says why');

// The repo
const real = await folders();
assert.ok(real.some(f => f.folder === 'public/hangman') && real.some(f => f.folder === 'public/cup/games/queens'), 'GAMES and La Copa are both checked');
const r = gate(missing(real), readDebt(), real);
assert.deepEqual(r.added, [], `missing files C-2 asks for (add them, or a debt entry in docs/structure-debt.json with its reason): ${r.added.join(', ')}`);
assert.deepEqual(r.stale, [], `stale entries in docs/structure-debt.json (remove them): ${r.stale.join(', ')}`);
assert.deepEqual(r.unreasoned, [], 'every debt entry says why');
console.log(`✓ structure: ${real.length} game folders have C-2's files`);

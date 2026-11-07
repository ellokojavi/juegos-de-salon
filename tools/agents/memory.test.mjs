// node tools/agents/memory.test.mjs — C-6's measurable part (#1249 step 12): each piece on synthetic
// input, then the gate on the repo: every available game uses createSessionStore unless the debt list says why.
import assert from 'node:assert/strict';
import { usesStore, games, gate, readDebt } from './memory.mjs';

assert.ok(usesStore(['const s = createSessionStore(GAME_ID);']));
assert.ok(!usesStore(['// createSessionStore(GAME_ID) one day', '/* createSessionStore( */ x()']), 'a comment does not count');
assert.ok(!usesStore([]));

const list = [{ id: 'a', uses: true }, { id: 'b', uses: false }, { id: 'c', uses: false }];
let g = gate(list, [{ id: 'b', reason: 'r' }]);
assert.deepEqual(g.added, ['c'], 'a game without the store not in the debt is new');
assert.deepEqual(g.stale, []);
g = gate(list, [{ id: 'b', reason: 'r' }, { id: 'c', reason: 'r' }, { id: 'a', reason: 'r' }, { id: 'gone', reason: 'r' }]);
assert.deepEqual(g.stale, ['a', 'gone'], 'a game that now uses it, or is gone, is stale');
assert.deepEqual(gate(list, [{ id: 'b' }]).unreasoned, ['b'], 'every entry says why');

// The repo
const real = await games();
assert.ok(real.find(x => x.id === 'ahorcado')?.uses, 'hangman saves its game: the scan works');
const r = gate(real, readDebt());
assert.deepEqual(r.added, [], `games without createSessionStore (C-6: save the game, or a debt entry in docs/memory-debt.json with its reason): ${r.added.join(', ')}`);
assert.deepEqual(r.stale, [], `stale entries in docs/memory-debt.json (remove them): ${r.stale.join(', ')}`);
assert.deepEqual(r.unreasoned, [], 'every debt entry says why');
console.log(`✓ memory: ${real.length} available games, ${real.filter(x => !x.uses).length} in the debt`);

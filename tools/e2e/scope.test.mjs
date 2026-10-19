// Each page loads only its own game's files (D-377, D-378): the end-to-end scripts a PR runs are those whose
// pages load what it changed (D-329), so a game's file loaded by another page makes every change to it run
// that page's scripts too. A new import across games fails here: take what the other page needs into a module
// of its own (assets/js/rng.js, cup/code.js…), or add it to SHARED or REUSES in affected.mjs with its reason.
// Uso: node tools/e2e/scope.test.mjs
import assert from 'node:assert/strict';
import { siteGraph, crossLoads, mayLoad, SHARED } from './affected.mjs';

const g = siteGraph();
const wrong = crossLoads(g).map(({ page, file }) => `${page || 'the home page'} loads ${file}`);
assert.deepEqual(wrong, [], `pages that load another game's files (D-378):\n  ${wrong.join('\n  ')}`);

// The exceptions still exist, so the list does not keep stale names
for (const f of Object.keys(SHARED)) assert.ok(Object.values(g).some(files => files.has(f)), `${f} is in SHARED but no page loads it`);
// The rule itself, on cases that do not depend on today's imports
const fake = { '': new Set(['index.html']), hangman: new Set(['hangman/index.html']), timeline: new Set(['timeline/index.html']), cup: new Set(['cup/index.html', 'cup/game.js']), 'bulls-and-cows': new Set(['bulls-and-cows/index.html']) };
assert.equal(mayLoad(fake, '', 'timeline/engine.js'), false, 'the home page may not load a game engine');
assert.equal(mayLoad(fake, 'hangman', 'cup/rules.js'), false, 'nor may another game load La Copa');
assert.equal(mayLoad(fake, 'hangman', 'hangman/engine.js'), true, 'a game loads its own files');
assert.equal(mayLoad(fake, 'cup', 'timeline/engine.js'), true, "La Copa's screens load the games La Copa plays");
assert.equal(mayLoad(fake, 'hangman', 'cup/reportes.js'), true, 'a shared module, from anywhere');
assert.equal(mayLoad(fake, 'bulls-and-cows', 'cup/games/number/engine.js'), true, 'a declared reuse');
assert.equal(mayLoad(fake, 'hangman', 'assets/js/ui.js'), true, 'assets/ belongs to every page');
console.log(`✓ scope: ${Object.keys(g).length} pages, each loads only its own game's files`);

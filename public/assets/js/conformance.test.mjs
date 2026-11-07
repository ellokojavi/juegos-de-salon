// node public/assets/js/conformance.test.mjs — the conformance suite's node half (#1249 step 8).
// Every game with a game.json passes the static checks of tools/generators/conformance.mjs (C-2's
// files, LOCALES per language with the same keys, session.js, fin.js, compartir.js, the panel signal);
// the browser half is tools/e2e/conformance.mjs. A registered game without a game.json is ❌ unless it
// is debt in docs/manifest-debt.json, a ratchet: it only shrinks, and a stale entry fails.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GAMES } from './games.js';
import { manifestFolders, readManifest } from '../../../tools/generators/manifests.mjs';
import { staticConformance, leafKeys } from '../../../tools/generators/conformance.mjs';
import { PARTS } from '../../../tools/e2e/ci.mjs';

const PUBLIC = fileURLToPath(new URL('../..', import.meta.url));
const folders = manifestFolders();
const byId = Object.fromEntries(folders.map(f => [readManifest(f).id, f]));

// Every manifest conforms
let failures = 0;
for (const f of folders) {
  const problems = await staticConformance(PUBLIC, f);
  if (problems.length) { failures++; console.error(`✗ ${f}: ${problems.join('\n    ')}`); }
}
assert.equal(failures, 0, `${failures} game(s) fail conformance; fix them, or record a real exception in canonExceptions`);

// The browser half runs once per manifest (a part per game, named after its folder's last segment)
assert.deepEqual([...PARTS['conformance.mjs']].sort(), folders.map(f => f.split('/').pop()).sort(), 'tools/e2e/ci.mjs PARTS covers every manifest');

// The debt: a game in GAMES without a game.json is listed, and only these may ever be (the ratchet)
const FROZEN = ['copa', 'linea-de-tiempo', 'toque-y-fama', 'generala', 'batalla-naval', 'julepe', 'cuarto-rey'];
const debt = JSON.parse(readFileSync(new URL('../../../docs/manifest-debt.json', import.meta.url), 'utf8')).games;
for (const g of GAMES) {
  if (byId[g.id]) continue;
  assert.ok(debt[g.id], `${g.id} is in GAMES without a game.json: give it one (node tools/generators/manifests.mjs migrate <folder>) ❌`);
}
for (const [id, why] of Object.entries(debt)) {
  assert.ok(FROZEN.includes(id), `docs/manifest-debt.json: ${id} is new debt; the list only shrinks, a new game is born with its game.json`);
  assert.ok(GAMES.some(g => g.id === id), `docs/manifest-debt.json: ${id} is not in GAMES any more, remove it (stale)`);
  assert.ok(!byId[id], `docs/manifest-debt.json: ${id} has its game.json now, remove it (stale)`);
  assert.ok(typeof why === 'string' && why.trim(), `docs/manifest-debt.json: ${id} needs its reason`);
}

// The checks themselves catch what they claim to
const fake = { a: 1, b: { c: 2 } };
assert.deepEqual(leafKeys(fake), ['a', 'b.c']);
const pilot = folders.includes('hangman') ? 'hangman' : folders[0];
assert.deepEqual(await staticConformance(PUBLIC, pilot), []);
assert.deepEqual(await staticConformance(PUBLIC, 'assets'), ['manifest: no game.json']);

console.log(`conformance: ${folders.length} game(s) conform, ${Object.keys(debt).length} without a manifest yet`);

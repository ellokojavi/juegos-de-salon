// The move to English (D-316, D-354): every Spanish name in the repo is listed with its English one,
// so a new Spanish file can't slip in unnoticed and the list only shrinks
import assert from 'node:assert/strict';
import { tokens, isSpanish, propose, phaseOf, scan, trackedPaths, readRegistry } from './english.mjs';

assert.deepEqual(tokens('uno-al-dia-ui.js'), ['uno', 'al', 'dia', 'ui']);
assert.deepEqual(tokens('jugadorFirebase.mjs'), ['jugador', 'firebase']);
assert.ok(isSpanish('compartir.js') && isSpanish('CANONES.md'));
assert.ok(!isSpanish('share.js') && !isSpanish('red.png') && !isSpanish('de.webmanifest'), 'short or shared words alone are not Spanish');
assert.equal(propose('uno-al-dia-ui.js'), 'one-a-day-ui.js');
assert.equal(propose('CANONES.md'), 'CANONS.md');
assert.equal(propose('engine-palabra.test.mjs'), 'engine-word.test.mjs');
assert.equal(phaseOf('public/assets/js/azar.js'), 4);
assert.equal(phaseOf('docs/ALEMAN.md'), 5);
assert.equal(phaseOf('tools/x/compartir.mjs'), 3);
// A folder is listed once, with its files under it
const rows = scan(['marketing/tres-nuevos/tarjeta.html', 'marketing/tres-nuevos/x.png']);
assert.deepEqual(rows.map(r => r.path), ['marketing/tres-nuevos/', 'marketing/tres-nuevos/tarjeta.html']);

// The repo: nothing Spanish outside the list, and every proposal is English
const registry = readRegistry();
const unlisted = scan(trackedPaths(), registry).filter(r => r.state === 'unlisted').map(r => r.path);
assert.deepEqual(unlisted, [], `Spanish names not in docs/english-renames.json: name them in English, or add them with their English name (D-316): ${unlisted.join(', ')}`);
for (const [from, r] of Object.entries(registry)) {
  if (r.state === 'keep') { assert.ok(r.why, `${from}: kept, so it says why`); continue; }
  const last = r.to.replace(/\/$/, '').split('/').pop();
  assert.ok(!isSpanish(last), `${from} → ${r.to}: the new name is still Spanish`);
}
const destinations = Object.values(registry).filter(r => r.state === 'pending').map(r => r.to);
assert.equal(new Set(destinations).size, destinations.length, 'two names would become the same one');
console.log('✓ english.test.mjs');

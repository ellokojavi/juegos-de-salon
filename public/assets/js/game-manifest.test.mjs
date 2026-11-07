// node public/assets/js/game-manifest.test.mjs — the per-game manifests (#1249 step 7)
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validateManifest, catalogEntry, MANIFEST_SCHEMA } from './game-manifest.js';
import { gameById, MODE_IDS } from './games.js';
import { manifestFolders, readManifest, renderModule, generatedPath } from '../../../tools/generators/manifests.mjs';

const folders = manifestFolders();
assert.ok(folders.includes('hangman') && folders.includes('liars-dice'), 'both pilots have a game.json');

for (const f of folders) {
  const m = readManifest(f);
  assert.deepEqual(validateManifest(m), [], `${f}/game.json is valid`);
  assert.equal(m.path, `${f}/`, `${f}: path is its folder`);
  for (const mode of m.modes) assert.ok(MODE_IDS.includes(mode), `${f}: mode ${mode} is in MODES`);
  // The generated module is fresh, and games.js reads it: its entry is the manifest's
  assert.ok(existsSync(generatedPath(f)), `assets/js/manifests/${f}.js exists`);
  assert.equal(readFileSync(generatedPath(f), 'utf8'), renderModule(m), `assets/js/manifests/${f}.js is stale: run node tools/generators/manifests.mjs`);
  const entry = gameById(m.id);
  // A game still in the lab may live outside GAMES (a card in /labs/, D-409); a registered one is its manifest
  assert.ok(entry || m.labs, `${m.id} is in GAMES`);
  if (entry) {
    assert.deepEqual(entry, catalogEntry(m), `${m.id}: the GAMES entry is the manifest's`);
    assert.equal(entry.players, m.players.min === m.players.max ? String(m.players.min) : `${m.players.min}–${m.players.max}`);
  }
  // Its session key is the one session.js writes (C-6)
  const rules = readFileSync(new URL(`../../${f}/rules.js`, import.meta.url), 'utf8');
  assert.match(rules, new RegExp(`GAME_ID = '${m.id}'`), `${f}: rules.js GAME_ID is the manifest id`);
}

// A broken manifest is rejected, with a reason per problem
const good = readManifest('hangman');
assert.deepEqual(validateManifest(null), ['not an object']);
const bad = { ...good, players: { min: 3, max: 2 }, languages: ['es'], extra: 1, memory: 'x' };
delete bad.emoji;
const problems = validateManifest(bad);
for (const k of ['players', 'languages', 'extra', 'memory', 'emoji']) assert.ok(problems.some(p => p.startsWith(`${k}:`)), `reports ${k}: ${problems}`);
assert.ok(validateManifest({ ...good, modes: [...good.modes, 'cpu'] }).some(p => p.startsWith('ai:')), 'cpu without ai');
assert.ok(validateManifest({ ...good, firebasePaths: [] }).some(p => p.startsWith('firebasePaths:')), 'online without a room path');
assert.ok(validateManifest({ ...good, canonExceptions: [{ canon: 'C8', why: '' }] }).some(p => p.startsWith('canonExceptions:')));
assert.ok(validateManifest({ ...good, formato: { es: 'a', en: 'a', pt: 'a' } }).some(p => p.startsWith('formato:')), 'formato only on a tournament');
assert.ok(Object.values(MANIFEST_SCHEMA).every(s => typeof s.check === 'function' && s.about), 'every field documented');

console.log(`game-manifest: ${folders.length} manifests ok`);

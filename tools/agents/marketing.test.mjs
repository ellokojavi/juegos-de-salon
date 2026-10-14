// What counts as outdated marketing (U-34). Run: node tools/agents/marketing.test.mjs
import assert from 'node:assert/strict';
import { behind } from './marketing.mjs';

const asset = { app: '0.82.x', juegos: ['tango', 'zip'], grilla_mas: ['letras'] };

// Up to date: same games (the cup does not count: it is the showcase, not a grid game) and same version.
assert.deepEqual(behind(asset, { cover: ['copa', 'tango', 'zip', 'letras'], version: '0.82.3' }), []);

// A new game on the cover page, one that left and a newer minor version.
assert.deepEqual(behind(asset, { cover: ['tango', 'letras', 'desenredo'], version: '0.88.0' }), [
  'cover-page games that do not appear: desenredo',
  'games that are no longer on the cover page appear: zip',
  'shows app 0.82.x; today it is 0.88.0',
]);

// An asset that shows a selection does not miss the new games, but does warn if one is gone
assert.deepEqual(behind({ juegos: ['zip', 'reinas'], seleccion: true }, { cover: ['zip', 'reinas', 'desenredo'], version: '0.1.0' }), []);
assert.deepEqual(behind({ juegos: ['zip', 'viejo'], seleccion: true }, { cover: ['zip'], version: '0.1.0' }), ['games that are no longer on the cover page appear: viejo']);
// A patch does not age the asset.
assert.deepEqual(behind({ app: '0.88.0' }, { cover: [], version: '0.88.4' }), []);

// A lab game that appears on purpose is not flagged as "no longer on the cover page"
assert.deepEqual(behind({ juegos: ['caso'], laboratorio: ['caso'], seleccion: true }, { cover: ['ahorcado'], version: null }), [], 'labs: it should not warn');

console.log('marketing: ok');

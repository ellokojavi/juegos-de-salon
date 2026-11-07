// node tools/generators/manifests.test.mjs — the migration codemod (#1249 step 14) on samples
import assert from 'node:assert/strict';
import { manifestOf, rewriteGamesJs } from './manifests.mjs';
import { validateManifest, catalogEntry } from '../../public/assets/js/game-manifest.js';

const entry = {
  id: 'x-game', tipos: ['logic'], emoji: '🎯', name: { es: 'X', en: 'X', pt: 'X' }, tagline: { es: 'x x', en: 'x x', pt: 'x x' },
  keywords: { es: ['a'], en: ['a'], pt: ['a'] }, players: '1–4', duration: '5', jugadas: ['go'], path: 'x/', available: true,
};
const m = manifestOf(entry, { modes: ['local', 'online', 'cpu'] });
assert.deepEqual(validateManifest(m), []);
assert.deepEqual(m.players, { min: 1, max: 4 });
assert.equal(m.ai, true, 'ai follows cpu');
assert.deepEqual(m.firebasePaths, ['rooms/{code}'], 'an online game writes its room');
assert.equal(JSON.stringify(catalogEntry(m)), JSON.stringify(entry), 'the entry comes back byte-identical');
assert.deepEqual(manifestOf({ ...entry, players: '2' }, { modes: ['local'] }).players, { min: 2, max: 2 });
assert.throws(() => manifestOf({ ...entry, oculto: true }, { modes: ['local'] }), /oculto/, 'a field the schema lacks is refused');

const src = `import a from './manifests/a.js';\n\nexport const GAMES = [\n  {\n    id: 'y',\n    path: 'y/',\n  },\n  {\n    id: 'x-game',\n    // a comment that stays\n    path: 'x/',\n  },\n];\n`;
const out = rewriteGamesJs(src, 'x-game', 'x', 'xManifest');
assert.equal(out, `import a from './manifests/a.js';\nimport xManifest from './manifests/x.js';\n\nexport const GAMES = [\n  {\n    id: 'y',\n    path: 'y/',\n  },\n  // x-game: from public/x/game.json\n  // a comment that stays\n  catalogEntry(xManifest),\n];\n`);
assert.throws(() => rewriteGamesJs(src, 'z', 'z', 'zManifest'), /no entry/);
console.log('manifests codemod: ok');

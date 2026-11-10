// ¡Al toque!'s languages (C-3): every t('…') in game.js has its English and Portuguese, with the same {x}.
// node public/labs/microgames/rules.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TR, KEYS } from './rules.js';

const src = readFileSync(new URL('./game.js', import.meta.url), 'utf8');
const used = [...new Set([...src.matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'")))];
const holes = s => (s.match(/\{\w+\}/g) || []).sort().join();
for (const k of used) for (const l of ['en', 'pt']) {
  assert.ok(TR[l][k], `${l} is missing «${k}»`);
  assert.equal(holes(TR[l][k]), holes(k), `${l} «${k}» keeps its {x}`);
}
assert.equal(new Set(KEYS).size, KEYS.length, 'no key twice');
console.log(`✓ microgames: ${used.length} texts in es, en and pt`);

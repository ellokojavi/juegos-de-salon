// Who plays, how and what it costs, inside "Cómo se juega" (how-to-play-facts.js, #887, #888): four
// languages with the same keys, and each game's line built from games.js and the modes it offers.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TEXTS, factsLine } from './how-to-play-facts.js';

const langs = Object.keys(TEXTS);
assert.deepEqual(langs, ['es', 'en', 'pt']);
for (const l of langs) assert.deepEqual(Object.keys(TEXTS[l]), Object.keys(TEXTS.es), `${l}: different keys`);

const GAMES = { ahorcado: 'hangman', dudo: 'liars-dice', 'linea-de-tiempo': 'timeline', generala: 'generala', 'toque-y-fama': 'bulls-and-cows', 'batalla-naval': 'battleship' };
let n = 0;
for (const [id, folder] of Object.entries(GAMES)) {
  const { LOCALES } = await import(`../../${folder}/rules.js`);
  // Never a separate block: no FAQ module, no question list, no second heading (the owner's rule, #887)
  const html = readFileSync(new URL(`../../${folder}/index.html`, import.meta.url), 'utf8');
  assert.ok(!/faq-slot|class="[^"]*\bfaq\b/.test(html), `${folder}: a separate FAQ block on the cover`);
  for (const l of langs) {
    const T = LOCALES[l].ui || LOCALES[l];
    const line = factsLine(id, T, l);
    assert.ok(line && !/[{}?¿]|undefined|NaN/.test(line), `${id}/${l}: "${line}"`);
    assert.equal(line.split('. ').length, 3, `${id}/${l}: players, modes and free in three sentences: "${line}"`);
    assert.ok(line.length <= 170, `${id}/${l}: ${line.length} characters`);
    n++;
  }
}
console.log(`✓ How-to-play facts: ${n} game × language lines, players, modes and free`);

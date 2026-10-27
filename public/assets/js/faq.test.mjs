// The FAQ under a game's rules (faq.js, #887): four languages with the same keys, and each game's
// answers built from games.js and the modes it offers.
import assert from 'node:assert/strict';
import { TEXTS, faqItems } from './faq.js';

const langs = Object.keys(TEXTS);
assert.deepEqual(langs, ['es', 'en', 'pt', 'de']);
for (const l of langs) assert.deepEqual(Object.keys(TEXTS[l]), Object.keys(TEXTS.es), `${l}: different keys`);

const GAMES = { ahorcado: 'hangman', dudo: 'liars-dice', 'linea-de-tiempo': 'timeline', generala: 'generala', 'toque-y-fama': 'bulls-and-cows', 'batalla-naval': 'battleship' };
let n = 0;
for (const [id, folder] of Object.entries(GAMES)) {
  const { LOCALES } = await import(`../../${folder}/rules.js`);
  for (const l of langs) {
    const T = LOCALES[l].ui || LOCALES[l];
    const items = faqItems(id, T, l);
    assert.equal(items.length, 3, `${id}/${l}: ${items.length} questions`);
    for (const [q, a] of items) assert.ok(q && a && !/[{}]|undefined|NaN/.test(q + a), `${id}/${l}: "${q}" → "${a}"`);
    n++;
  }
}
console.log(`✓ FAQ: ${n} game × language combinations, three answers each`);

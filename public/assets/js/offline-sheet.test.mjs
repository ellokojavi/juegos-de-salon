// Run: node public/assets/js/offline-sheet.test.mjs
// Offline mode's once-only sheet (D-538, PR 6): three lines in es/en/pt, the iPhone line only on an
// iPhone outside the installed app, and never twice on one phone.
import assert from 'node:assert/strict';
import { TEXTS, sheetLines, seen, SEEN_KEY } from './offline-sheet.js';

for (const l of ['es', 'en', 'pt']) {
  assert.equal(TEXTS[l].lines.length, 3, `${l}: three lines`);
  for (const k of ['title', 'ios', 'ok']) assert.ok(TEXTS[l][k], `${l}: ${k}`);
}
assert.equal(sheetLines('es', { steps: null }).length, 3, 'a computer or the installed app: no iPhone line');
assert.equal(sheetLines('es', { steps: 'android' }).length, 3, 'Android: no iPhone line');
assert.equal(sheetLines('en', { steps: 'ios-safari' }).at(-1), TEXTS.en.ios, 'iPhone in Safari: the line');
assert.equal(sheetLines('pt', { steps: 'ios-chrome' }).length, 4);
for (const l of ['es', 'en', 'pt']) {
  assert.equal(TEXTS[l].cup.length, 2, `${l}: La Copa's two lines`);
  const withCup = sheetLines(l, { steps: null, cup: true });
  assert.equal(withCup.length, 4, `${l}: with La Copa offline, four lines`);
  assert.ok(withCup.some(x => x.startsWith('🏆')) && !withCup.some(x => x === TEXTS[l].lines[1]), `${l}: La Copa no longer said to need the signal`);
}
const m = new Map();
const storage = { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
assert.equal(seen(storage), false);
m.set(SEEN_KEY, '1');
assert.equal(seen(storage), true);
assert.equal(seen({ getItem() { throw new Error('no storage'); } }), true, 'without storage it never shows in a loop');
console.log('✓ offline sheet: three lines in three languages, the iPhone line where it applies, once per phone');

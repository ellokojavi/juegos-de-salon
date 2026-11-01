// node tools/agents/usability-lint.test.mjs — the measurable usability rules (D-520): each rule on
// its own, and the whole repo clean (or allowlisted with a reason). tests.yml runs it with every *.test.mjs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  emojiMidSentence, articleBeforeName, bannedSynonym, hardPlural, labelLength, isButton, stepsCheck,
  labTexts, walk, literalsOf, judge, lint, readJSON, BUDGET,
} from './usability-lint.mjs';

let n = 0;
const test = (name, fn) => { try { fn(); n++; } catch (e) { console.error(`✗ ${name}`); throw e; } };

test('U-2: an emoji at the start or after a sentence is fine; mid-sentence is not', () => {
  assert.equal(emojiMidSentence('🏆 La Copa'), null);
  assert.equal(emojiMidSentence('Si manejas, no tomas. 🚕'), null);
  assert.equal(emojiMidSentence('Gracias 🙌'), null);
  assert.equal(emojiMidSentence('Tu comentario: 💬 llegó'), null);
  assert.equal(emojiMidSentence('Toca el 🎲 para jugar'), '🎲');
  assert.equal(emojiMidSentence('una línea\n🎯 otra línea'), null);
});

test('U-4: no article before a proper name', () => {
  assert.equal(articleBeforeName('Te invitaron a la Copa: Valdenenas', 'es'), 'la Copa:');
  assert.equal(articleBeforeName('Juega en la {copa}', 'es'), 'la {copa}');
  assert.equal(articleBeforeName('La Copa: Valdenenas', 'es'), null);
  assert.equal(articleBeforeName('Join the Cup: X', 'en'), 'the Cup:');
  assert.equal(articleBeforeName('Entre na ${copa}', 'pt'), 'na ${copa}');
});

test('U-5: a banned synonym from the glossary, by language', () => {
  const g = readJSON('docs/usability-glossary.json');
  assert.match(bannedSynonym('Tres minijuegos', 'es', g), /minijuego/);
  assert.match(bannedSynonym('Three minigames', 'en', g), /mini/);
  assert.equal(bannedSynonym('Tres juegos', 'es', g), null);
  assert.match(bannedSynonym('Abre el link en el móvil', 'es', g), /celular/);
  assert.match(bannedSynonym('A minigame', 'lab', g), /mini/, 'a lab game is checked against every language');
  assert.equal(bannedSynonym('Minimal games', 'en', g), null);
});

test('U-6: a hard-coded 1 before a plural, and a plural in a singular slot', () => {
  assert.equal(hardPlural('Queda 1 vidas', 'es'), '1 vidas');
  assert.equal(hardPlural('Queda 1 vida', 'es'), null);
  assert.equal(hardPlural('1 guess left.', 'en'), null);
  assert.equal(hardPlural('10 puntos', 'es'), null);
  assert.equal(hardPlural('El 1 de cada mes', 'es'), null);
  assert.match(hardPlural('{n} pistas', 'es', 'ui.hintsOne'), /singular slot/);
  assert.equal(hardPlural('{n} pistas', 'es', 'ui.hintsMany'), null);
});

test('U-17: a button by its key or by the el("button") that draws it, measured without emoji', () => {
  assert.equal(labelLength('🔁 Jugar de nuevo'), 'Jugar de nuevo'.length);
  assert.ok(isButton({ path: 'LOCALES.es.buyBtn', file: 'public/hangman/rules.js' }));
  const keys = new Map([['otraVez', new Set(['hangman'])]]);
  assert.ok(isButton({ path: 'LOCALES.es.otraVez', file: 'public/hangman/rules.js' }, keys));
  assert.ok(!isButton({ path: 'LOCALES.es.otraVez', file: 'public/generala/rules.js' }, keys), 'only the folder that draws it');
  assert.ok(!isButton({ path: 'LOCALES.es.f()#0', file: 'public/hangman/rules.js' }, keys));
  assert.ok(Object.values(BUDGET).every(b => b >= 18 && b <= 32));
});

test('U-18: up to 3 steps and 280 characters, constants resolved', () => {
  assert.ok(stepsCheck(['👆 Toca.', '✂️ Corta.']).ok);
  assert.ok(!stepsCheck(['a x', 'b x', 'c x', 'd x']).ok);
  assert.equal(stepsCheck(['👆 Hay ${N} niveles'], { N: 10 }).length, 'Hay 10 niveles'.length);
  assert.ok(!stepsCheck([`👆 ${'x'.repeat(281)}`]).ok);
});

test('a lab game.js: its T literal is read, with the engine constants or the names left', () => {
  const T = labTexts("x\nconst T = {\n  lema: 'Hola',\n  como: [['👆', `Hasta ${MAX} veces {n}`]],\n  f: n => `${n} veces`,\n};\nmore", { MAX: 3 });
  assert.equal(T.lema, 'Hola');
  assert.equal(T.como[0][1], 'Hasta 3 veces {n}');
  const leaves = walk(T, 'T');
  assert.ok(leaves.some(l => l.path === 'T.f()#0' && l.text === '${n} veces'), 'a function is read by its literals');
  assert.deepEqual(literalsOf(n => `${n} veces` + 'x'), ['${n} veces']);
});

test('walk: the language comes from the nearest es/en/pt key', () => {
  const leaves = walk({ es: { a: 'Hola', b: { c: 'Chao' } }, en: { a: 'Hi' } }, 'X');
  assert.deepEqual(leaves.map(l => [l.path, l.lang]), [['X.es.a', 'es'], ['X.es.b.c', 'es'], ['X.en.a', 'en']]);
});

test('judge: an allowlist entry needs a reason, matches with *, and goes stale when it stops hitting', () => {
  const hits = [{ rule: 'U-2', file: 'a.js', path: 'L.es.k', lang: 'es' }, { rule: 'U-2', file: 'a.js', path: 'L.en.k', lang: 'en' }, { rule: 'U-6', file: 'b.js', path: 'q', lang: 'es' }];
  const r = judge(hits, { _about: 'x', 'U-2': [{ file: 'a.js', path: 'L.*.k', lang: '*', reason: 'a symbol of the board' }, { file: 'z.js', path: 'p', lang: 'es', reason: 'gone' }] });
  assert.equal(r.excused.length, 2);
  assert.deepEqual(r.failing.map(h => h.rule), ['U-6']);
  assert.equal(r.stale.length, 1);
  assert.equal(r.unreasoned.length, 1, 'a reason under 10 characters is no reason');
});

test('every U-n in docs/USABILIDAD.md says whether it is checked (🤖) or judged (👁)', () => {
  const guide = readFileSync(new URL('../../docs/USABILIDAD.md', import.meta.url), 'utf8');
  const rules = [...guide.matchAll(/^- (\S*) ?\*\*U-(\d+) ·/gm)];
  assert.ok(rules.length >= 30);
  assert.deepEqual(rules.filter(m => !/^(🤖|👁|🤖👁)$/u.test(m[1])).map(m => `U-${m[2]}`), []);
});

// The repo as it is: every hit fixed or allowlisted with a reason, and no stale entry
const r = judge(await lint(), readJSON('docs/usability-allowlist.json'));
test('the player texts pass the usability lint (node tools/agents/usability-lint.mjs)', () => {
  assert.deepEqual(r.failing.map(h => `${h.rule} ${h.file} ${h.path} [${h.lang}]: ${h.found}`), []);
  assert.deepEqual(r.stale.map(s => s.key), []);
  assert.deepEqual(r.unreasoned, []);
});

console.log(`✓ usability-lint: ${n} tests`);

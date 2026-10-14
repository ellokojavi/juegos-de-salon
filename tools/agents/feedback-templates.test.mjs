// The email reply templates (D-317): ten friendly openings per language, no dashes, and a whole email around the agent's answer.
import assert from 'node:assert/strict';
import { TEMPLATES, LANGUAGES, buildEmail, quote } from './feedback-templates.mjs';

assert.deepEqual(LANGUAGES, ['es', 'en', 'pt', 'de'], 'the four languages of the app');
for (const [lang, T] of Object.entries(TEMPLATES)) {
  for (const k of ['openings', 'openingsMany']) {
    assert.equal(T[k].length, 10, `${lang}: ten ${k}`);
    assert.equal(new Set(T[k]).size, 10, `${lang}: all different`);
  }
  const all = [T.subject, T.subjectMany, T.about('x'), T.greeting('Ana'), T.greeting(''), ...T.openings, ...T.openingsMany, T.closing, T.signature].join('\n');
  assert.doesNotMatch(all, /[—–]/, `${lang}: no em or en dashes`);
  assert.match(T.greeting('Ana'), /Ana/);
  assert.doesNotMatch(T.greeting(''), /undefined|, :|,,/);
}

const one = [{ quote: 'Las pistas son muy obvias', answer: 'Ya agregamos pistas más difíciles.' }];
const e = buildEmail({ lang: 'es', items: one, name: 'Cris', n: 383 });
assert.equal(e.subject, TEMPLATES.es.subject);
assert.ok(e.text.startsWith('Hola, Cris:\n\n' + TEMPLATES.es.openings[3]));
assert.ok(e.text.includes('Sobre «Las pistas son muy obvias»:\nYa agregamos pistas más difíciles.') && e.text.includes(TEMPLATES.es.closing));
assert.notEqual(buildEmail({ lang: 'en', items: [{ answer: 'x' }], n: 1 }).text.split('\n')[2], buildEmail({ lang: 'en', items: [{ answer: 'x' }], n: 2 }).text.split('\n')[2], 'two replies in a row open differently');
assert.ok(buildEmail({ lang: 'de', items: [{ answer: 'x' }] }).text.startsWith('Hallo,\n'));
// Several comments of the same player: one email, plural, each answer under its quote, in order
const many = buildEmail({ lang: 'es', name: 'Cris', n: 0, items: [{ quote: 'Primero', answer: 'Uno.' }, { quote: 'Segundo', answer: 'Dos.' }] });
assert.equal(many.subject, TEMPLATES.es.subjectMany);
assert.ok(many.text.includes(TEMPLATES.es.openingsMany[0]));
assert.ok(many.text.indexOf('Sobre «Primero»:\nUno.') < many.text.indexOf('Sobre «Segundo»:\nDos.'));
assert.equal(quote('a  b\u200b\nc'), 'a b c');
assert.ok(quote('x'.repeat(200)).length <= 70 && quote('x'.repeat(200)).endsWith('…'));
assert.throws(() => buildEmail({ lang: 'fr', items: one }));
assert.throws(() => buildEmail({ lang: 'es', items: [{ quote: 'x', answer: ' ' }] }));
assert.throws(() => buildEmail({ lang: 'es', items: [] }));
console.log('feedback-templates: ok');

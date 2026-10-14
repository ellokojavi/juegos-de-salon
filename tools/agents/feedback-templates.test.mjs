// The email reply templates (D-317): ten friendly openings per language, no dashes, and a whole email around the agent's answer.
import assert from 'node:assert/strict';
import { TEMPLATES, LANGUAGES, buildEmail } from './feedback-templates.mjs';

assert.deepEqual(LANGUAGES, ['es', 'en', 'pt', 'de'], 'the four languages of the app');
for (const [lang, T] of Object.entries(TEMPLATES)) {
  assert.equal(T.openings.length, 10, `${lang}: ten openings`);
  assert.equal(new Set(T.openings).size, 10, `${lang}: all different`);
  const all = [T.subject, T.greeting('Ana'), T.greeting(''), ...T.openings, T.closing, T.signature].join('\n');
  assert.doesNotMatch(all, /[—–]/, `${lang}: no em or en dashes`);
  assert.match(T.greeting('Ana'), /Ana/);
  assert.doesNotMatch(T.greeting(''), /undefined|, :|,,/);
}

const e = buildEmail({ lang: 'es', answer: 'Ya agregamos pistas más difíciles.', name: 'Cris', n: 383 });
assert.equal(e.subject, TEMPLATES.es.subject);
assert.ok(e.text.startsWith('Hola, Cris:\n\n' + TEMPLATES.es.openings[3]));
assert.ok(e.text.includes('Ya agregamos pistas más difíciles.') && e.text.includes(TEMPLATES.es.closing));
assert.notEqual(buildEmail({ lang: 'en', answer: 'x', n: 1 }).text.split('\n')[2], buildEmail({ lang: 'en', answer: 'x', n: 2 }).text.split('\n')[2], 'two replies in a row open differently');
assert.ok(buildEmail({ lang: 'de', answer: 'x' }).text.startsWith('Hallo,\n'));
assert.throws(() => buildEmail({ lang: 'fr', answer: 'x' }));
assert.throws(() => buildEmail({ lang: 'es', answer: ' ' }));
console.log('feedback-templates: ok');

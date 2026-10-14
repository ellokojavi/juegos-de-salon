// The email reply templates (D-317): ten friendly openings per language, no dashes, and a whole email around the agent's answer.
import assert from 'node:assert/strict';
import { PLANTILLAS, IDIOMAS, armarCorreo } from './feedback-plantillas.mjs';

assert.deepEqual(IDIOMAS, ['es', 'en', 'pt', 'de'], 'the four languages of the app');
for (const [idioma, P] of Object.entries(PLANTILLAS)) {
  assert.equal(P.aperturas.length, 10, `${idioma}: ten openings`);
  assert.equal(new Set(P.aperturas).size, 10, `${idioma}: all different`);
  const todo = [P.asunto, P.saludo('Ana'), P.saludo(''), ...P.aperturas, P.cierre, P.firma].join('\n');
  assert.doesNotMatch(todo, /[—–]/, `${idioma}: no em or en dashes`);
  assert.match(P.saludo('Ana'), /Ana/);
  assert.doesNotMatch(P.saludo(''), /undefined|, :|,,/);
}

const c = armarCorreo({ idioma: 'es', respuesta: 'Ya agregamos pistas más difíciles.', nombre: 'Cris', n: 383 });
assert.equal(c.asunto, PLANTILLAS.es.asunto);
assert.ok(c.texto.startsWith('Hola, Cris:\n\n' + PLANTILLAS.es.aperturas[3]));
assert.ok(c.texto.includes('Ya agregamos pistas más difíciles.') && c.texto.includes(PLANTILLAS.es.cierre));
assert.notEqual(armarCorreo({ idioma: 'en', respuesta: 'x', n: 1 }).texto.split('\n')[2], armarCorreo({ idioma: 'en', respuesta: 'x', n: 2 }).texto.split('\n')[2], 'two replies in a row open differently');
assert.ok(armarCorreo({ idioma: 'de', respuesta: 'x' }).texto.startsWith('Hallo,\n'));
assert.throws(() => armarCorreo({ idioma: 'fr', respuesta: 'x' }));
assert.throws(() => armarCorreo({ idioma: 'es', respuesta: ' ' }));
console.log('feedback-plantillas: ok');

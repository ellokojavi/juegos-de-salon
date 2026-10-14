// The email reply templates (D-317): ten friendly openings per language, no dashes, and a whole email around the agent's answer.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { PLANTILLAS, IDIOMAS, armarCorreo, cita, CABECERA } from './feedback-plantillas.mjs';

assert.deepEqual(IDIOMAS, ['es', 'en', 'pt', 'de'], 'the four languages of the app');
for (const [idioma, P] of Object.entries(PLANTILLAS)) {
  for (const k of ['aperturas', 'aperturasVarias']) {
    assert.equal(P[k].length, 10, `${idioma}: ten ${k}`);
    assert.equal(new Set(P[k]).size, 10, `${idioma}: all different`);
  }
  const todo = [P.asunto, P.asuntoVarios, P.comillas('x'), P.saludo('Ana'), P.saludo(''), ...P.aperturas, ...P.aperturasVarias, P.cierre, P.firma].join('\n');
  assert.doesNotMatch(todo, /[—–]/, `${idioma}: no em or en dashes`);
  assert.match(P.saludo('Ana'), /Ana/);
  assert.doesNotMatch(P.saludo(''), /undefined|, :|,,/);
}

const uno = [{ cita: 'Las pistas son muy obvias', respuesta: 'Ya agregamos pistas más difíciles.' }];
const c = armarCorreo({ idioma: 'es', items: uno, nombre: 'Cris', n: 383 });
assert.equal(c.asunto, PLANTILLAS.es.asunto);
assert.ok(c.texto.startsWith('Hola, Cris:\n\n' + PLANTILLAS.es.aperturas[3]));
assert.ok(c.texto.includes('«Las pistas son muy obvias»\nYa agregamos pistas más difíciles.') && c.texto.includes(PLANTILLAS.es.cierre));
// The HTML version: the quote in grey italics, the player's text escaped
assert.match(c.html, /<p style="[^"]*color:#6b6b6b;font-style:italic">«Las pistas son muy obvias»<\/p><p[^>]*>Ya agregamos/);
// The header (icons and title only) is in the site, and every language uses it
assert.ok(existsSync(new URL(`../../public/${CABECERA.replace('https://juegosdesalon.cl/', '')}`, import.meta.url)), `${CABECERA} is not in public/`);
for (const idioma of IDIOMAS) assert.ok(armarCorreo({ idioma, items: uno }).html.includes(`src="${CABECERA}"`));
assert.notEqual(armarCorreo({ idioma: 'en', items: [{ respuesta: 'x' }], n: 1 }).texto.split('\n')[2], armarCorreo({ idioma: 'en', items: [{ respuesta: 'x' }], n: 2 }).texto.split('\n')[2], 'two replies in a row open differently');
assert.ok(armarCorreo({ idioma: 'de', items: [{ respuesta: 'x' }] }).texto.startsWith('Hallo,\n'));
// Several comments of the same player: one email, plural, each answer under its quote, in order
const varios = armarCorreo({ idioma: 'es', nombre: 'Cris', n: 0, items: [{ cita: 'Primero', respuesta: 'Uno.' }, { cita: 'Segundo', respuesta: 'Dos.' }] });
assert.equal(varios.asunto, PLANTILLAS.es.asuntoVarios);
assert.ok(varios.texto.includes(PLANTILLAS.es.aperturasVarias[0]));
assert.ok(varios.texto.indexOf('«Primero»\nUno.') < varios.texto.indexOf('«Segundo»\nDos.'));
assert.equal(cita('a  b\u200b\n\nc '), 'a b\nc', 'the player\'s line breaks stay');
assert.equal(cita('x'.repeat(300)), 'x'.repeat(300), 'quotes are never cut');
assert.throws(() => armarCorreo({ idioma: 'fr', items: uno }));
assert.throws(() => armarCorreo({ idioma: 'es', items: [{ cita: 'x', respuesta: ' ' }] }));
assert.throws(() => armarCorreo({ idioma: 'es', items: [] }));
console.log('feedback-plantillas: ok');

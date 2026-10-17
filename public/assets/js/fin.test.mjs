// The exits of a result screen (C-19, D-343): read from the source, no browser
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raiz = new URL('../../', import.meta.url);
const leer = p => readFileSync(new URL(p, raiz), 'utf8');

// The contexts and their exits
const fin = leer('assets/js/fin.js');
assert.match(fin, /hoy: \['hoy', 'menu'\]/, 'One a Day: back to One a Day and to the menu');
assert.match(fin, /podio: \['menu'\]/, 'the podium: back to the menu');
assert.match(fin, /suelto: \['menu'\]/, 'a game on its own: back to the menu');

// The One a Day card carries its exits, and goes under the hero
const ui = leer('assets/js/uno-al-dia-ui.js');
assert.match(ui, /salidasFin\('hoy'/, 'the One a Day card brings its exits');
assert.match(ui, /result-hero/, 'ponerTarjeta puts the card under the hero');

// The group games put the card with no place of their own, and no buttons of theirs in today mode
for (const g of ['hangman', 'battleship', 'liars-dice', 'generala']) {
  const s = leer(`${g}/game.js`);
  const llamadas = s.match(/ponerTarjeta\(terminarHoy\([^\n]*/g) || [];
  assert.ok(llamadas.length, `${g}: puts the One a Day card`);
  for (const l of llamadas) assert.match(l, /\}\)\);/, `${g}: ponerTarjeta takes no place: the card goes under the hero (C-19)`);
  assert.doesNotMatch(s, /S\.hoy[^\n]*\? null : el\('button'/, `${g}: today mode adds no button of its own; the card has them (C-19)`);
}

// La Copa: the board button first on a day's result, the menu under the podium, One a Day's exits from its card
const copa = leer('cup/game.js');
const dia = copa.slice(copa.indexOf('function resultado('), copa.indexOf('function resultado(') + 4000);
assert.ok(dia.indexOf("id: 'btn-volver'") < dia.indexOf('T.dayTable'), 'a Cup day: back to the board before the day table (C-8, C-19)');
assert.ok(dia.indexOf("id: 'btn-volver'") < dia.indexOf('explicacion('), 'a Cup day: back to the board before the breakdown');
assert.match(copa, /salidasFin\('podio'/, 'the podium offers the way back to the menu');
assert.match(copa, /hoy \? null : volverDePractica\(\)/, 'One a Day in La Copa\'s games: the exits are the card\'s');
console.log('✓ fin.test.mjs');

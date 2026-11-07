// La Copa's screens: every screen the code opens exists, and the redraw rule (screens.js).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PANTALLAS, REDIBUJABLES, redibujarCon } from './screens.js';

const dir = new URL('./', import.meta.url);
const html = readFileSync(new URL('index.html', dir), 'utf8');
for (const id of PANTALLAS) assert.ok(html.includes(`id="screen-${id}"`), `index.html has no screen-${id}`);
for (const [, id] of html.matchAll(/class="screen[^"]*" id="screen-([a-z-]+)"/g)) assert.ok(PANTALLAS.includes(id), `screen-${id} is not in PANTALLAS`);

for (const f of readdirSync(dir).filter(f => f.endsWith('.js'))) {
  const src = readFileSync(new URL(f, dir), 'utf8');
  for (const [, id] of src.matchAll(/\bmostrar\('([a-z-]+)'\)/g)) assert.ok(PANTALLAS.includes(id), `${f}: mostrar('${id}') is not a screen`);
}
for (const id of REDIBUJABLES) assert.ok(PANTALLAS.includes(id));

const hechos = [];
const dibujar = { tablero: () => hechos.push('tablero'), resultado: () => (hechos.length ? hechos.push('resultado') : false) };
assert.equal(redibujarCon(dibujar, 'jugar'), false, 'jugar is never redrawn from outside');
assert.equal(redibujarCon(dibujar, 'resultado'), false, 'resultado with no day to show: not redrawn');
assert.equal(redibujarCon(dibujar, 'tablero', ['resultado']), false, 'outside the narrowed list');
assert.equal(redibujarCon(dibujar, 'tablero'), true);
assert.equal(redibujarCon(dibujar, 'resultado'), true);
assert.deepEqual(hechos, ['tablero', 'resultado']);
console.log('cup screens ok');

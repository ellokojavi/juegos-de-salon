// ↩️ Deshacer (D-283): los pasos que se deshacen, con el motor de Reinas. node public/cup/games/deshacer.test.mjs
import assert from 'node:assert/strict';
import { pasos } from './deshacer.js';
import * as reinas from './queens/engine.js';

let fallas = 0;
const prueba = (nombre, f) => {
  try { f(); console.log(`✓ ${nombre}`); } catch (e) { fallas++; console.log(`✗ ${nombre}\n  ${e.message}`); }
};

const p = reinas.generar('DESHA', 1, { n: 6 });
const tablero = j => reinas.estado(p, j).marcas.join('');

prueba('cada toque se deshace solo, hasta el comienzo', () => {
  const h = pasos();
  let j = [];
  const vistos = [tablero(j)];
  for (const t of [reinas.toque(0), reinas.toque(0), reinas.toque(7), reinas.toqueLargo(3)]) {
    h.abrir(j.length); j = [...j, t]; vistos.push(tablero(j));
  }
  for (let k = vistos.length - 2; k >= 0; k--) {
    j = h.deshacer(j);
    assert.equal(tablero(j), vistos[k]);
  }
  assert.deepEqual(j, []);
  assert.deepEqual(h.deshacer(j), [], 'sin nada que deshacer no pasa nada');
});

prueba('un arrastre se deshace entero', () => {
  const h = pasos();
  let j = [];
  h.abrir(j.length); j.push(reinas.toque(8));
  const antes = tablero(j);
  h.abrir(j.length); j.push(...[0, 1, 2, 3, 4, 5].map(reinas.toqueLargo));   // una fila de X
  j = h.deshacer(j);
  assert.equal(tablero(j), antes);
  assert.deepEqual(j, [reinas.toque(8)]);
});

prueba('deshacer Borrar todo devuelve el tablero', () => {
  const h = pasos();
  let j = [];
  for (const t of [reinas.toque(0), reinas.toqueLargo(9)]) { h.abrir(j.length); j.push(t); }
  const antes = tablero(j);
  h.abrir(j.length); j.push(reinas.BORRAR);
  assert.match(tablero(j), /^0+$/);
  j = h.deshacer(j);
  assert.equal(tablero(j), antes);
});

prueba('sin cortes (la partida se recargó), quita una jugada por vez', () => {
  const h = pasos();
  const j = [reinas.toque(0), reinas.toqueLargo(1), reinas.toqueLargo(2)];
  assert.deepEqual(h.deshacer(j), j.slice(0, 2));
});

prueba('no toca la lista que recibe', () => {
  const h = pasos();
  const j = [reinas.toque(0)];
  h.abrir(0);
  h.deshacer(j);
  assert.deepEqual(j, [reinas.toque(0)]);
});

prueba('un corte viejo, más allá de la lista, no se usa', () => {
  const h = pasos();
  h.abrir(0); h.abrir(5);
  assert.deepEqual(h.deshacer([reinas.toque(0), reinas.toque(1)]), []);
});

if (fallas) { console.log(`✗ ${fallas} pruebas fallaron`); process.exit(1); }

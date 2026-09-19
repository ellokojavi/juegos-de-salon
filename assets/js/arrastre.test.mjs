/**
 * Lo calculable del arrastre, sin navegador: a qué destino apunta el dedo y cuánto se corre
 * sola la página cerca del borde. El gesto en sí (punteros, captura, redibujo) se prueba de
 * punta a punta en Chrome; esto es lo que se puede equivocar en silencio.
 */
import assert from 'node:assert/strict';
import { destinoMasCercano, pasoDeAutoscroll, ALCANCE, ZONA, PASO_MAX } from './arrastre.js';

let hechas = 0;
const prueba = (nombre, fn) => { fn(); hechas++; console.log('  ✓', nombre); };

/* ---------- destinoMasCercano ---------- */

// Una línea con cuatro hitos deja cinco límites; el del medio de cada par es el destino.
const limites = [{ clave: 0, y: 100 }, { clave: 1, y: 200 }, { clave: 2, y: 300 }, { clave: 3, y: 400 }];

prueba('apunta al límite exacto', () => {
  assert.equal(destinoMasCercano(200, limites), 1);
});

prueba('gana el más cercano, aunque el dedo caiga sobre un hito', () => {
  assert.equal(destinoMasCercano(240, limites), 1);
  assert.equal(destinoMasCercano(260, limites), 2);
});

prueba('el empate exacto se lo lleva el primero, no el último', () => {
  // Importa: si no, al arrastrar por el borde entre dos límites el destino parpadea.
  assert.equal(destinoMasCercano(250, limites), 1);
});

prueba('el primer y el último límite atrapan todo lo que queda fuera, dentro del alcance', () => {
  assert.equal(destinoMasCercano(100 - ALCANCE, limites), 0);
  assert.equal(destinoMasCercano(400 + ALCANCE, limites), 3);
});

prueba('más lejos que el alcance no hay destino: se soltó fuera de la línea', () => {
  assert.equal(destinoMasCercano(100 - ALCANCE - 1, limites), null);
  assert.equal(destinoMasCercano(400 + ALCANCE + 1, limites), null);
});

prueba('sin destinos no hay destino, y no revienta', () => {
  assert.equal(destinoMasCercano(200, []), null);
});

prueba('la clave puede ser cualquier cosa, no sólo un número', () => {
  // Batalla Naval querría casillas; el módulo no supone que el destino sea un índice.
  assert.deepEqual(destinoMasCercano(10, [{ clave: { r: 2, c: 3 }, y: 12 }]), { r: 2, c: 3 });
});

prueba('el destino 0 es un destino, no un valor falso', () => {
  assert.equal(destinoMasCercano(0, [{ clave: 0, y: 0 }]), 0);
});

/* ---------- pasoDeAutoscroll ---------- */

const ALTO = 800;

prueba('por el medio de la pantalla la página no se mueve', () => {
  assert.equal(pasoDeAutoscroll(400, ALTO), 0);
  assert.equal(pasoDeAutoscroll(ZONA, ALTO), 0);
  assert.equal(pasoDeAutoscroll(ALTO - ZONA, ALTO), 0);
});

prueba('cerca del borde de arriba sube, y más arriba sube más', () => {
  const medio = pasoDeAutoscroll(ZONA / 2, ALTO);
  const borde = pasoDeAutoscroll(0, ALTO);
  assert.ok(medio < 0 && borde < 0);
  assert.ok(borde < medio, 'el borde tiene que correr más que la mitad de la franja');
  assert.equal(borde, -PASO_MAX);
});

prueba('cerca del borde de abajo baja, simétrico al de arriba', () => {
  assert.equal(pasoDeAutoscroll(ALTO, ALTO), PASO_MAX);
  assert.equal(pasoDeAutoscroll(ALTO - ZONA / 2, ALTO), -pasoDeAutoscroll(ZONA / 2, ALTO));
});

prueba('el dedo fuera de la pantalla no acelera más allá del tope', () => {
  // Pasa de verdad: se arrastra hasta el borde y el puntero sigue reportando más allá.
  assert.ok(Math.abs(pasoDeAutoscroll(-200, ALTO)) >= PASO_MAX);
  assert.ok(Math.abs(pasoDeAutoscroll(ALTO + 200, ALTO)) >= PASO_MAX);
});

prueba('el paso es entero: media página no se corre medio píxel por cuadro', () => {
  for (let y = 0; y <= ALTO; y += 7) assert.ok(Number.isInteger(pasoDeAutoscroll(y, ALTO)), `paso entero en y=${y}`);
});

console.log(`\n${hechas} pruebas del arrastre, todas bien.`);

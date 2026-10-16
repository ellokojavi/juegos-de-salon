// Tren en Vilo (lab): the physics is tuned so a bare deck falls and a truss holds, in every stage
import assert from 'node:assert/strict';
import { ETAPAS, probar, vigaValida, puntajePartida, crearSim, paso, PUNTOS_ETAPA, BONO_RAPIDEZ, TIEMPO_S } from './engine.js';

const V = (a, b) => ({ a, b });
const cubierta = W => Array.from({ length: W }, (_, i) => V([i, 0], [i + 1, 0]));
/** A Pratt truss: deck, top chord at y = 1, verticals and diagonals toward the middle. */
const cercha = W => {
  const v = cubierta(W);
  for (let i = 1; i < W - 1; i++) v.push(V([i, 1], [i + 1, 1]));
  for (let i = 1; i < W; i++) v.push(V([i, 0], [i, 1]));
  v.push(V([0, 0], [1, 1]), V([W, 0], [W - 1, 1]));
  for (let i = 1; i < W - 1; i++) v.push(i < W / 2 ? V([i, 1], [i + 1, 0]) : V([i + 1, 1], [i, 0]));
  return v;
};

/** A cheaper bridge: the deck held from below by the anchors under each cliff. */
const desdeAbajo = W => [...cubierta(W), V([0, -1], [1, 0]), V([W, -1], [W - 1, 0]), V([0, -1], [1, -1]), V([W, -1], [W - 1, -1]), V([1, -1], [1, 0]), V([W - 1, -1], [W - 1, 0])];
/** The known solution of each stage, so every stage can be done within its budget. */
const SOLUCION = [desdeAbajo, cercha, cercha, cercha, cercha];

ETAPAS.forEach((e, k) => {
  assert.ok(!probar(e, cubierta(e.ancho)).llego, `stage ${k + 1}: a bare deck must fall`);
  const c = SOLUCION[k](e.ancho);
  assert.ok(c.length <= e.presupuesto, `stage ${k + 1}: the known solution (${c.length}) fits the budget (${e.presupuesto})`);
  const r = probar(e, c);
  assert.ok(r.llego && r.rotas === 0, `stage ${k + 1}: the known solution holds (${JSON.stringify(r)})`);
  // Every beam of the truss is one the player could lay
  const puestas = [];
  for (const v of c) { assert.equal(vigaValida(e, puestas, v.a, v.b), null, `stage ${k + 1}: ${JSON.stringify(v)}`); puestas.push(v); }
});

// The same bridge, the same result: the simulation is deterministic
const e = ETAPAS[2], c = cercha(e.ancho);
const correr = () => { const s = crearSim(e, c); for (let k = 0; k < 3000; k++) paso(s); return s.nudos.map(n => `${n.x},${n.y}`).join(';'); };
assert.equal(correr(), correr());

// What a beam may not be
const e0 = ETAPAS[0];
assert.equal(vigaValida(e0, [], [0, 0], [0, 0]), 'cero');
assert.equal(vigaValida(e0, [], [0, 0], [3, 0]), 'larga');
assert.equal(vigaValida(e0, [], [0, 0], [-1, 0]), 'fuera');
assert.equal(vigaValida(e0, [V([0, 0], [1, 0])], [1, 0], [0, 0]), 'repetida');
assert.equal(vigaValida(e0, [], [0, 0], [1, 2]), null, 'a 1 × 2 diagonal is allowed');

// The score by layers: completing more always wins, and the speed bonus only with all five
const todas = ETAPAS.length;
assert.equal(puntajePartida(todas, 60).total, PUNTOS_ETAPA * todas + BONO_RAPIDEZ);
assert.equal(puntajePartida(todas, TIEMPO_S).rapidez, 0);
assert.equal(puntajePartida(todas - 1, 30).rapidez, 0);
assert.ok(puntajePartida(todas, TIEMPO_S).total > puntajePartida(todas - 1, 10).total);
assert.equal(puntajePartida(todas, 60).total, 100);
console.log('✓ Tren en Vilo (labs)');

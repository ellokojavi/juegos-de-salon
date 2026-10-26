// Tren en Vilo (lab): the physics is tuned so a bare deck falls and a truss holds, in every stage
import assert from 'node:assert/strict';
import { cubierta as deckOf, esCubierta, trazo, unirViga, puntosMedios, enMedio, costo as costoDe, ETAPAS, probar, vigaValida, puntajePartida, crearSim, paso, TIEMPO_S, picoReferencia, MARGEN_SOLIDO } from './physics.js';
import { readFileSync } from 'node:fs';

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

// The cheapest known bridge of each stage (found by search): it passes and sets `minimo`
const SOLUCIONES = JSON.parse(readFileSync(new URL('./solutions.json', import.meta.url), 'utf8')).map(s => s.map(([a, b]) => V(a, b)));

ETAPAS.forEach((e, k) => {
  assert.ok(!probar(e, cubierta(e.ancho)).llego, `stage ${k + 1}: a bare deck must fall`);
  const c = SOLUCIONES[k];
  assert.equal(c.length, e.minimo, `stage ${k + 1}: minimo is the known solution's beams`);
  assert.ok(e.presupuesto >= e.minimo, `stage ${k + 1}: the budget fits the known solution`);
  assert.ok(probar(e, c).llego, `stage ${k + 1}: the known solution passes`);
  const puestas = [];
  for (const v of c) { assert.equal(vigaValida(e, puestas, v.a, v.b), null, `stage ${k + 1}: ${JSON.stringify(v)}`); puestas.push(v); }
});
assert.equal(ETAPAS.at(-1).presupuesto, ETAPAS.at(-1).minimo, 'the last stage leaves no room: it is the hard one');

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

// The score: stages, savings, solidity and time; 100 only with all five at the minimum, clearly more
// solid than the known bridge, and fast
const minimos = ETAPAS.map(e => e.minimo), topes = ETAPAS.map(e => e.presupuesto);
const iguales = ETAPAS.map(e => picoReferencia(e)), solidos = iguales.map(x => x - MARGEN_SOLIDO);
assert.equal(puntajePartida(minimos, 60).total, 85, 'no strain measured: no solidity');
assert.equal(puntajePartida(minimos, 60, ETAPAS, iguales).total, 85, 'as strained as the known bridge: no solidity');
assert.equal(puntajePartida(minimos, 60, ETAPAS, solidos).total, 100);
assert.equal(puntajePartida(minimos, 60, ETAPAS, solidos.map(x => x + MARGEN_SOLIDO / 2)).solidez, 8, 'half the margin: half of 15, rounded');
assert.equal(puntajePartida(topes, TIEMPO_S).total, 55, 'all five at the budget and out of time: the stages, plus the savings of stage 5, whose budget is its minimum');
assert.equal(puntajePartida([], 30).total, 0);
assert.ok(puntajePartida(topes.slice(0, 4), TIEMPO_S).total < puntajePartida(topes, TIEMPO_S).total, 'one more stage always wins');
assert.equal(puntajePartida(minimos.slice(0, 2), 60).rapidez, 4, 'speed scales with the stages passed: 10 × 2/5');
const p = puntajePartida([8, 14], 200);   // stage 1: 2 of 3 spare beams saved; stage 2: at its budget
assert.equal(p.ahorros[0].fraccion, 2 / 3); assert.equal(p.ahorros[1].fraccion, 0);
// Joints in the middle of a beam: ending inside one splits it there; a new beam over a joint is split at it
{
  const larga = { a: [0, 0], b: [2, 0] };
  assert.ok(enMedio(larga, [1, 0]) && !enMedio(larga, [0, 0]) && !enMedio(larga, [1, 1]));
  assert.deepEqual([...puntosMedios([larga, { a: [0, 0], b: [1, 2] }])], ['1,0'], 'only grid points inside a beam');
  const unida = unirViga([larga], [1, 0], [1, 1]);
  assert.deepEqual(unida.map(v => `${v.a}>${v.b}`).sort(), ['0,0>1,0', '1,0>1,1', '1,0>2,0'], 'the long beam splits where the new one starts');
  const e = { madera: true };
  assert.equal(costoDe(e, unida), costoDe(e, [larga, { a: [1, 0], b: [1, 1] }]), 'splitting keeps the wood');
  const sobre = unirViga([{ a: [1, 0], b: [1, 1] }], [0, 0], [2, 0], new Set(['1,0']));
  assert.deepEqual(sobre.map(v => `${v.a}>${v.b}`).sort(), ['0,0>1,0', '1,0>1,1', '1,0>2,0'], 'a new beam over a joint joins it');
}
// The deck comes laid (owner's request): one beam per square at y = 0; a long beam over it adds nothing twice
{
  const e = { ancho: 4, anclas: [], madera: true };
  const d = deckOf(e);
  assert.deepEqual(d.map(v => `${v.a}>${v.b}`), ['0,0>1,0', '1,0>2,0', '2,0>3,0', '3,0>4,0'], 'the deck, square by square');
  assert.ok(d.every(esCubierta) && !esCubierta({ a: [1, 0], b: [1, 1] }), 'only the road beams are the deck');
  assert.equal(costoDe(e, d), 4, 'the deck costs its wood');
  assert.equal(unirViga(d, [0, 0], [2, 0], new Set(['1,0'])).length, 4, 'a beam over the deck is not laid twice');
  for (const c of [...ETAPAS]) assert.ok(c.presupuesto >= costoDe(c, deckOf(c)), 'the budget covers the deck');
}
// A long stroke: one beam per grid step, the ones already there left out
{
  const e = { ancho: 5, anclas: [], madera: true };
  assert.deepEqual(trazo(e, [], [0, 0], [5, 0]).piezas.map(v => `${v.a}>${v.b}`), ['0,0>1,0', '1,0>2,0', '2,0>3,0', '3,0>4,0', '4,0>5,0'], 'the whole deck in one drag');
  assert.equal(trazo(e, [{ a: [1, 0], b: [2, 0] }], [0, 0], [3, 0]).piezas.length, 2, 'the piece already there is left out');
  assert.equal(trazo(e, [], [0, 0], [2, 0]).piezas.length, 1, 'within one beam it is one beam, as before');
  assert.equal(trazo(e, [], [0, 0], [3, 1]).motivo, 'larga', 'no grid points in between: too long');
  assert.equal(trazo(e, [], [0, 0], [4, 2]).piezas.length, 2, 'a 1 x 2 diagonal step, twice');
}
// The catalog of crossings (tools/generators/bridges.mjs): each one has a solution that passes, at its
// minimum and within its budget, a bare deck that falls, and the level's spare beams
{
  const url = new URL('./catalog-beams.json', import.meta.url);
  const { existsSync } = await import('node:fs');
  if (existsSync(url)) {
    const cat = JSON.parse(readFileSync(url, 'utf8'));
    const HOLGURA = [3, 3, 2, 1, 0];
    for (const nivel of [1, 2, 3, 4, 5]) assert.ok(cat.some(c => c.nivel === nivel), `the catalog has crossings of level ${nivel}`);
    for (const c of cat) {
      const sol = c.solucion.map(([a, b]) => V(a, b));
      assert.equal(sol.length, c.minimo, `${c.tipo} ${c.ancho}: minimo is its solution's beams`);
      assert.equal(c.presupuesto, c.minimo + HOLGURA[c.nivel - 1], `${c.tipo} ${c.ancho}: the level's spare beams`);
      assert.ok(probar(c, sol).llego, `${c.tipo} ${c.ancho} (level ${c.nivel}): its solution passes`);
      assert.ok(!probar(c, cubierta(c.ancho)).llego, `${c.tipo} ${c.ancho}: a bare deck falls`);
      const puestas = [];
      for (const v of sol) { assert.equal(vigaValida(c, puestas, v.a, v.b), null, `${c.tipo} ${c.ancho}: ${JSON.stringify(v)}`); puestas.push(v); }
    }
    console.log(`  catalog: ${cat.length} crossings, each with a solution that passes`);
  }
}
// Steel is only the look (owner's request): a steel crossing costs and holds exactly like wood
{
  const e = { ...ETAPAS[1], madera: true }, acero = { ...e, acero: true }, vs = SOLUCIONES[1];
  assert.equal(costoDe(acero, vs), costoDe(e, vs), 'steel costs what wood costs');
  assert.deepEqual(probar(acero, vs), probar(e, vs), 'steel holds what wood holds');
}
console.log('✓ Tren en Vilo (labs)');

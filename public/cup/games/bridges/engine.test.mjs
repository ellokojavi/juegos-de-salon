// 🚅 Tren en Vilo: the 💡 hint (flag bridges-hint) picks a beam of the known bridge the player lacks, one
// that touches the bridge as it stands, and each hint costs COSTO_PISTA points, never below 0
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pista, cubre, COSTO_PISTA } from './engine.js';
import { cubierta, esCubierta, fijos, unirViga, puntajePartida, probar } from './physics.js';

const CATALOGO = JSON.parse(readFileSync(new URL('./catalog.json', import.meta.url), 'utf8'));
const V = (a, b) => ({ a, b });
const clave = p => p.join(',');

// A crossing of the catalog: its deck, a pillar at (3,−2), and the known bridge two beams under the deck
const e = CATALOGO[0];
assert.deepEqual(e.solucion.slice(-2), [[[3, -2], [2, 0]], [[3, -2], [3, 0]]], 'the first crossing is the one this test reads');
const deck = cubierta(e);

// On the bare deck, the first beam of the known bridge that is not the deck, in the catalog's order
assert.deepEqual(pista(e, deck), V([3, -2], [2, 0]), 'on the bare deck: the first beam under it');
// It is a beam of the known bridge, never the deck, and it touches a fixed point or a joint in use
for (const c of CATALOGO) {
  const v = pista(c, cubierta(c));
  if (!v) continue;
  assert.ok(c.solucion.some(([a, b]) => clave(a) === clave(v.a) && clave(b) === clave(v.b)), `${c.tipo} ${c.nivel}: a beam of the known bridge`);
  assert.ok(!esCubierta(v), `${c.tipo} ${c.nivel}: never the deck`);
  const nudos = new Set([...fijos(c), ...cubierta(c).flatMap(w => [w.a, w.b])].map(clave));
  assert.ok(nudos.has(clave(v.a)) || nudos.has(clave(v.b)), `${c.tipo} ${c.nivel}: it can be laid from the bridge as it stands`);
}

// Once laid, the next one; a beam laid split at its middle joint counts as laid
const con1 = [...deck, V([3, -2], [2, 0])];
assert.deepEqual(pista(e, con1), V([3, -2], [3, 0]), 'with the first laid: the second');
assert.ok(cubre(unirViga(con1, [3, -2], [3, -1]).concat(V([3, -1], [3, 0])), V([3, -2], [3, 0])), 'a two-square beam split at its middle is still that beam');
assert.ok(!cubre(con1.concat(V([3, -2], [3, -1])), V([3, -2], [3, 0])), 'half of it is not');
assert.deepEqual(pista(e, con1.concat(V([3, -2], [3, -1]))), V([3, -2], [3, 0]), 'so the hint still shows the whole beam');

// With the whole known bridge laid, no hint (and the bridge crosses)
const todo = e.solucion.map(([a, b]) => V(a, b));
assert.equal(pista(e, todo), null, 'the whole known bridge: no hint left');
assert.ok(probar(e, todo).llego, 'and the known bridge crosses');
// Laying hint after hint from the bare deck builds the known bridge
for (const c of CATALOGO) {
  let vs = cubierta(c);
  for (let n = 0, v; (v = pista(c, vs)) && n < 40; n++) vs = [...vs, v];
  assert.equal(pista(c, vs), null, `${c.tipo} ${c.nivel}: hints run out`);
  assert.ok(c.solucion.every(([a, b]) => cubre(vs, V(a, b))), `${c.tipo} ${c.nivel}: following every hint lays the known bridge`);
}
// No known bridge (the lab's fixed stages, when the catalog did not load): no hint
assert.equal(pista({ ancho: 4, anclas: [] }, cubierta({ ancho: 4 })), null, 'a crossing without a known bridge has no hint');

// The cost: COSTO_PISTA each, the last layer, never below 0
assert.equal(COSTO_PISTA, 3);
const lista = CATALOGO.slice(0, 2), usadas = lista.map(c => c.minimo);
const sin = puntajePartida(usadas, 600, lista), dos = puntajePartida(usadas, 600, lista, [], 2);
assert.equal(dos.total, sin.total - 6, 'two hints: −6');
assert.equal(dos.pistas, 2); assert.equal(dos.ptsPistas, 6);
assert.equal(puntajePartida([], 600, lista, [], 5).total, 0, 'never below 0');
assert.equal(puntajePartida([], 600, lista, [], 5).ptsPistas, 0, 'and what it takes is what there was');

console.log('✓ bridges engine: the 💡 hint picks a beam of the known bridge, −3 each');

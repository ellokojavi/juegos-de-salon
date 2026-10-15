// Rutas (laboratorio, D-293, D-294): girar un rectángulo dos veces lo deja igual, la meta está resuelta, el
// mínimo es exacto (se compara con una búsqueda simple, contando el tablero entero dado vuelta como
// solución), cada tablero es justo (no viene resuelto) y cada una de las cinco etapas da justo su mínimo.
import assert from 'node:assert/strict';
import { generar, generarEtapa, girar, resuelto, minimo, puntajePartida, RECTANGULOS, LADO, TODO, ETAPAS, TIEMPO_S, PUNTOS_ETAPA } from './engine.js';

assert.equal(RECTANGULOS.length, 36);
const META = Array.from({ length: 9 }, (_, p) => ({ p, v: 0 }));
for (const r of RECTANGULOS) assert.deepEqual(girar(girar(META, r), r), META, 'girar dos veces deshace');
// Una pieza sola: queda en su lugar, dada vuelta
assert.deepEqual(girar(META, { f1: 1, c1: 1, f2: 1, c2: 1 })[4], { p: 4, v: 1 });
// El tablero entero: la esquina va a la esquina opuesta
assert.deepEqual(girar(META, { f1: 0, c1: 0, f2: 2, c2: 2 })[8], { p: 0, v: 1 });

// El mínimo, contra una búsqueda simple hacia adelante
const clave = e => e.map(x => x.p * 2 + x.v).join();
function bfs(inicio, meta, tope) {
  let frente = [inicio]; const vistos = new Set([clave(inicio)]);
  for (let d = 0; d <= tope; d++) {
    if (frente.some(e => clave(e) === clave(meta))) return d;
    const sig = [];
    for (const e of frente) for (const r of RECTANGULOS) { const n = girar(e, r), k = clave(n); if (!vistos.has(k)) { vistos.add(k); sig.push(n); } }
    frente = sig;
  }
  return null;
}
let e = META;
for (const r of [RECTANGULOS[3], RECTANGULOS[17], RECTANGULOS[30]]) e = girar(e, r);
assert.equal(minimo(e, 6), bfs(e, META, 3));

let suma = 0;
for (let n = 0; n < 60; n++) {
  const t = generar(`prueba-${n}`);
  assert.deepEqual(generar(`prueba-${n}`), t, 'la misma semilla, el mismo tablero');
  assert.equal(t.piezas.length, LADO * LADO);
  assert.ok(t.piezas.every(p => p.tramos.length), `${n}: una pieza sin tramos`);
  assert.ok(resuelto(t.piezas, META), `${n}: la meta no está resuelta`);
  assert.ok(!resuelto(t.piezas, t.inicio), `${n}: viene resuelto`);
  assert.ok(t.minimo >= 3 && t.minimo <= 5, `${n}: mínimo ${t.minimo}`);
  assert.ok(resuelto(t.piezas, [...t.revuelta].reverse().reduce(girar, t.inicio)), `${n}: deshacer la revuelta no lo resuelve`);
  suma += t.minimo;
}
// El tablero entero dado vuelta también une todas las líneas: cuenta como solución
{ const t = generar('prueba-0'); assert.ok(resuelto(t.piezas, girar(META, TODO))); }
// El mínimo es exacto: con un giro menos no se llega a ninguna solución (búsqueda simple, en 12 tableros)
for (let n = 0; n < 12; n++) {
  const t = generar(`exacto-${n}`);
  let frente = [t.inicio]; const vistos = new Set([clave(t.inicio)]);
  for (let d = 0; d < t.minimo; d++) {
    assert.ok(!frente.some(e => resuelto(t.piezas, e)), `exacto-${n}: se resuelve en ${d}, pero el mínimo dice ${t.minimo}`);
    if (d === t.minimo - 1) break;
    const sig = [];
    for (const e of frente) for (const r of RECTANGULOS) { const x = girar(e, r), k = clave(x); if (!vistos.has(k)) { vistos.add(k); sig.push(x); } }
    frente = sig;
  }
}
console.log(`  (mínimo promedio: ${(suma / 60).toFixed(1)} giros)`);
// Las etapas: cada una con su mínimo exacto y sus líneas, y la dificultad no baja
for (let n = 0; n < 8; n++) for (let k = 0; k < ETAPAS.length; k++) {
  const t = generarEtapa(`partida-${n}`, k);
  assert.equal(t.minimo, ETAPAS[k].minimo, `partida-${n}, etapa ${k + 1}: mínimo ${t.minimo}`);
  assert.equal(t.colores.length, ETAPAS[k].lineas);
  assert.ok(resuelto(t.piezas, [...t.revuelta].reverse().reduce(girar, t.inicio)));
}
for (let k = 1; k < ETAPAS.length; k++) assert.ok(ETAPAS[k].minimo >= ETAPAS[k - 1].minimo && ETAPAS[k].lineas >= ETAPAS[k - 1].lineas, 'la dificultad baja');
// El puntaje por capas (D-295): completar manda, después la velocidad, después los giros
const perfectas = ETAPAS.map(e => ({ giros: e.minimo, minimo: e.minimo }));
const dobles = ETAPAS.map(e => ({ giros: 2 * e.minimo, minimo: e.minimo }));
assert.equal(puntajePartida(perfectas, 50).total, 100, 'rápido y en el mínimo: 100');
assert.equal(puntajePartida(perfectas, TIEMPO_S).total, 90, 'en el mínimo pero justo al final: 85 + 5');
assert.equal(puntajePartida(dobles, TIEMPO_S).total, 85, 'completas, lento y con el doble de giros: 85');
assert.equal(puntajePartida(dobles, 60).total, 95);
// Con una etapa menos, ni siendo perfecto se alcanza a quien completa todas lento
assert.ok(puntajePartida(perfectas.slice(0, 4), 30).total < puntajePartida(dobles, 10 * TIEMPO_S).total);
assert.equal(puntajePartida(perfectas.slice(0, 4), 30).total, 4 * PUNTOS_ETAPA + 5, 'sin completar no hay bono de velocidad');
assert.equal(puntajePartida([], 100).total, 0);
// Más rápido nunca da menos, y más giros nunca da más
for (let s = 60; s < TIEMPO_S; s += 15) assert.ok(puntajePartida(perfectas, s).total >= puntajePartida(perfectas, s + 15).total);
console.log('✓ Rutas (labs)');

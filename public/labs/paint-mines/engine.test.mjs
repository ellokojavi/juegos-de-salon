// Pintaminas (laboratorio, D-289): los dibujos son de 7×7, cada tablero se resuelve sin adivinar
// —con las dadas, `resolver` lo deduce entero— y el estado y el puntaje se calculan bien.
import assert from 'node:assert/strict';
import { DIBUJOS } from './dibujos.js';
import { generar, resolver, estado, puntaje, tarjeta, numero, VECINAS, LADO, RESTA_ERROR } from './engine.js';

for (const d of DIBUJOS) {
  assert.equal(d.filas.length, LADO, `${d.nombre}: filas`);
  for (const f of d.filas) assert.match(f, /^[#.]{7}$/, `${d.nombre}: ${f}`);
  const tinta = d.filas.join('').split('#').length - 1;
  assert.ok(tinta >= 12 && tinta <= 40, `${d.nombre}: ${tinta} de tinta, demasiado o muy poco`);
  assert.ok(d.nombre && d.emoji && d.color && d.cuadro, `${d.nombre}: le falta algo`);
}
assert.deepEqual(VECINAS[0].sort((a, b) => a - b), [1, 7, 8]);
assert.equal(VECINAS[24].length, 8);

// 300 tableros: con las dadas se resuelve entero, la misma semilla da el mismo tablero, y hay de los dos colores entre las dadas
let dadasTotal = 0;
for (let n = 0; n < 300; n++) {
  const t = generar(`prueba-${n}`);
  assert.deepEqual(generar(`prueba-${n}`), t, 'la misma semilla, el mismo tablero');
  assert.equal(t.sol.length, LADO * LADO);
  const sabe = resolver(t.sol, t.dadas);
  assert.equal(sabe.size, t.sol.length, `${n}: no se resuelve sin adivinar`);
  for (const [i, k] of sabe) assert.equal(k, t.sol[i], `${n}: dedujo mal la casilla ${i}`);
  // Sin sobrantes: sacar cualquier dada deja algo sin resolver
  for (const i of t.dadas) assert.ok(resolver(t.sol, t.dadas.filter(j => j !== i)).size < t.sol.length, `${n}: la dada ${i} sobra`);
  dadasTotal += t.dadas.length;
}
console.log(`  (en promedio ${(dadasTotal / 300).toFixed(1)} casillas dadas de ${LADO * LADO})`);

// El estado y el puntaje
const t = generar('prueba-estado');
const libres = t.sol.map((_, i) => i).filter(i => !t.dadas.includes(i));
let e = estado(t, libres.map(i => ({ i, color: t.sol[i] })));
assert.ok(e.fin && e.errores.size === 0 && puntaje(e) === 100);
// Un error: la casilla se destapa igual (con su color verdadero) y resta
e = estado(t, [{ i: libres[0], color: 1 - t.sol[libres[0]] }]);
assert.ok(e.conocidas.has(libres[0]) && e.errores.has(libres[0]) && !e.fin);
assert.equal(puntaje(estado(t, [{ i: libres[0], color: 1 - t.sol[libres[0]] }, ...libres.slice(1).map(i => ({ i, color: t.sol[i] }))])), 100 - RESTA_ERROR);
// Tocar dos veces la misma no cuenta dos veces
e = estado(t, [{ i: libres[0], color: 1 - t.sol[libres[0]] }, { i: libres[0], color: 1 - t.sol[libres[0]] }]);
assert.equal(e.errores.size, 1);
assert.equal(puntaje({ errores: { size: 9 } }), 0);
assert.equal(tarjeta(t, e).split('\n').length, LADO);
assert.ok(numero(t.sol, 0) <= 3);
console.log('✓ Pintaminas (labs)');

// Loteo (laboratorio, D-310): la validación de un rectángulo, el resolvedor, que los tableros de cada
// etapa tengan solución única, se deduzcan sin adivinar y que esa solución los resuelva; que las tres
// últimas etapas sean más difíciles que las dos primeras; los números repartidos; la ayuda y el puntaje.
import assert from 'node:assert/strict';
import {
  generar, generarEtapa, resolver, deducir, validar, poner, resuelto, pista, puntajePartida, tarjeta, area, casillas,
  ETAPAS, MAXIMO, PUNTOS_ETAPA, RESTA_AYUDA,
} from './engine.js';

// Un tablero a mano: 3×3 con un 3 arriba (fila entera), un 6 abajo
//  . 3 .
//  . . .
//  6 . .
const chico = { lado: 3, numeros: [0, 3, 0, 0, 0, 0, 6, 0, 0], pistas: [{ i: 1, n: 3 }, { i: 6, n: 6 }] };
assert.deepEqual(validar(chico, { f1: 0, c1: 0, f2: 0, c2: 2 }), { ok: true, n: 3, i: 1 });
assert.deepEqual(validar(chico, { f1: 1, c1: 0, f2: 1, c2: 2 }), { ok: false, motivo: 'sin-numero' });
assert.deepEqual(validar(chico, { f1: 0, c1: 0, f2: 2, c2: 1 }), { ok: false, motivo: 'dos-numeros', cuantos: 2 });
assert.deepEqual(validar(chico, { f1: 0, c1: 1, f2: 1, c2: 1 }), { ok: false, motivo: 'area', n: 3, area: 2 });
const r = resolver(chico, 2);
assert.equal(r.n, 1, 'el 3×3 tiene una sola solución');
assert.deepEqual(r.solucion, [{ f1: 0, c1: 0, f2: 0, c2: 2 }, { f1: 1, c1: 0, f2: 2, c2: 2 }]);
// Con dos soluciones: un 2 y un 2 en una grilla de 2×2, en diagonal
assert.equal(resolver({ lado: 2, numeros: [2, 0, 0, 2], pistas: [{ i: 0, n: 2 }, { i: 3, n: 2 }] }).n, 2);
// Sin solución
assert.equal(resolver({ lado: 2, numeros: [3, 0, 0, 1], pistas: [{ i: 0, n: 3 }, { i: 3, n: 1 }] }).n, 0);

// Poner reemplaza lo que pisa; resuelto pide todo cubierto y válido
{
  let ps = poner([], { f1: 0, c1: 0, f2: 0, c2: 1 });
  ps = poner(ps, { f1: 0, c1: 0, f2: 0, c2: 2 });
  assert.equal(ps.length, 1, 'el rectángulo nuevo saca al que pisa');
  assert.ok(!resuelto(chico, ps));
  ps = poner(ps, { f1: 1, c1: 0, f2: 2, c2: 2 });
  assert.ok(resuelto(chico, ps));
}

// Los tableros de cada etapa (200 de las fáciles, 80 de las difíciles): solución única, que se deduce
// sin adivinar, que pasa la validación y lo resuelve; rápidos. Y las difíciles, más difíciles
const prom = {};
for (const e of ETAPAS) {
  const { lado, dificil } = e, cuantos = dificil ? 80 : 200;
  let lento = 0, rondas = 0, aLaVista = 0, vecinos = 0;
  const areas = {};
  for (let s = 0; s < cuantos; s++) {
    const t0 = performance.now();
    const t = generar(`prueba-${lado}-${dificil}-${s}`, e);
    lento = Math.max(lento, performance.now() - t0);
    assert.equal(t.numeros.length, lado * lado);
    assert.equal(t.pistas.reduce((a, p) => a + p.n, 0), lado * lado, `${lado}-${s}: los números suman la grilla`);
    assert.equal(resolver(t, 2).n, 1, `${lado}-${s}: una sola solución`);
    const d = deducir(t);
    assert.ok(d.resuelto, `${lado}-${s}: se deduce sin adivinar`);
    rondas += d.rondas; aLaVista += d.deEntrada;
    let ps = [];
    for (const rect of t.solucion) { assert.ok(validar(t, rect).ok, `${lado}-${s}: la solución vale`); ps = poner(ps, rect); areas[area(rect)] = (areas[area(rect)] || 0) + 1; }
    assert.ok(resuelto(t, ps), `${lado}-${s}: la solución lo resuelve`);
    // Y cubre cada casilla una vez
    const vistas = t.solucion.flatMap(x => casillas(x, lado)).sort((a, b) => a - b);
    assert.deepEqual(vistas, [...Array(lado * lado).keys()]);
    // Los números, repartidos (pedido del dueño): pocos pares de números en casillas vecinas
    for (const { i } of t.pistas) for (const { i: j } of t.pistas) if (j > i && Math.abs(i % lado - j % lado) + Math.abs(Math.floor(i / lado) - Math.floor(j / lado)) === 1) vecinos++;
  }
  assert.ok(lento < 400, `${lado}×${lado}: un tablero tarda ${lento.toFixed(0)} ms (máximo 400)`);
  const total = Object.values(areas).reduce((a, b) => a + b, 0);
  assert.ok((areas[1] || 0) / total < (dificil ? 0.01 : 0.1), `${lado}×${lado}: pocos de 1`);
  assert.ok(vecinos / cuantos < 1, `${lado}×${lado}: números vecinos, ${(vecinos / cuantos).toFixed(2)} por tablero`);
  prom[`${lado}${dificil ? 'd' : ''}`] = { rondas: rondas / cuantos, aLaVista: aLaVista / cuantos };
}
// Las difíciles: más pasos de deducción y menos lotes a la vista de entrada que las fáciles
for (const d of ['7d', '8d']) for (const f of ['5', '6']) {
  assert.ok(prom[d].rondas > prom[f].rondas && prom[d].aLaVista < prom[f].aLaVista, `${d} más difícil que ${f}: ${JSON.stringify(prom)}`);
}

// El mismo tablero con la misma semilla; otro con otra; las etapas crecen
assert.deepEqual(generar('a', { lado: 6 }).numeros, generar('a', { lado: 6 }).numeros);
assert.notDeepEqual(generar('a', { lado: 6 }).numeros, generar('b', { lado: 6 }).numeros);
assert.deepEqual(ETAPAS.map((_, n) => generarEtapa('dia:2026-10-13', n).lado), [5, 6, 7, 7, 8]);

// La ayuda: un rectángulo de la solución que no está puesto
{
  const t = generar('ayuda', { lado: 5 });
  const [a, b] = t.solucion;
  assert.deepEqual(pista(t, []), a);
  assert.deepEqual(pista(t, [a]), b);
  assert.equal(pista(t, t.solucion), null);
}

// El puntaje: 12 por tablero; la rapidez, solo con los cinco (40 en 5 min, 0 en 15); la ayuda resta 10
assert.equal(MAXIMO, 100);
assert.equal(puntajePartida(5, 60).total, 100);
assert.equal(puntajePartida(5, 300).total, 100);
assert.equal(puntajePartida(5, 900).total, 60);
assert.equal(puntajePartida(5, 1200).total, 60);
assert.equal(puntajePartida(5, 600).total, 80, 'a mitad de camino, 20 de rapidez');
assert.equal(puntajePartida(5, 60, 1).total, 100 - RESTA_AYUDA);
assert.deepEqual(puntajePartida(2, 30), { total: 2 * PUNTOS_ETAPA, base: 24, ptsRapidez: 0, resta: 0, completa: false }, 'sin los cinco, sin rapidez');
assert.equal(puntajePartida(0, 30, 2).total, 0, 'nunca bajo 0');
assert.equal(tarjeta(2), '✅ 5×5  ✅ 6×6  ⬛ 7×7  ⬛ 7×7  ⬛ 8×8');
assert.equal(tarjeta(5, 1), '✅ 5×5  ✅ 6×6  ✅ 7×7  ✅ 7×7  ✅ 8×8\n💡 1');
console.log(`✓ loteo: validación, resolvedor, tableros de solución única que se deducen, las difíciles más difíciles, ayuda y puntaje ${JSON.stringify(prom)}`);

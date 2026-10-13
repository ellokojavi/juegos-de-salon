// Loteo (laboratorio, D-310): la validación de un rectángulo, el resolvedor, que 300 tableros de cada
// tamaño tengan solución única y que esa solución los resuelva, la ayuda y el puntaje.
import assert from 'node:assert/strict';
import {
  generar, generarEtapa, resolver, validar, poner, resuelto, pista, puntajePartida, tarjeta, area, casillas,
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

// 300 tableros de cada tamaño: solución única, que pasa la validación y lo resuelve; rápidos
for (const { lado } of ETAPAS) {
  let lento = 0;
  const areas = {};
  for (let s = 0; s < 300; s++) {
    const t0 = performance.now();
    const t = generar(`prueba-${lado}-${s}`, { lado });
    lento = Math.max(lento, performance.now() - t0);
    assert.equal(t.numeros.length, lado * lado);
    assert.equal(t.pistas.reduce((a, p) => a + p.n, 0), lado * lado, `${lado}-${s}: los números suman la grilla`);
    assert.equal(resolver(t, 2).n, 1, `${lado}-${s}: una sola solución`);
    let ps = [];
    for (const rect of t.solucion) { assert.ok(validar(t, rect).ok, `${lado}-${s}: la solución vale`); ps = poner(ps, rect); areas[area(rect)] = (areas[area(rect)] || 0) + 1; }
    assert.ok(resuelto(t, ps), `${lado}-${s}: la solución lo resuelve`);
    // Y cubre cada casilla una vez
    const vistas = t.solucion.flatMap(x => casillas(x, lado)).sort((a, b) => a - b);
    assert.deepEqual(vistas, [...Array(lado * lado).keys()]);
  }
  assert.ok(lento < 200, `${lado}×${lado}: un tablero tarda ${lento.toFixed(0)} ms (máximo 200)`);
  const total = Object.values(areas).reduce((a, b) => a + b, 0);
  assert.ok((areas[1] || 0) / total < 0.1, `${lado}×${lado}: pocos de 1`);
  if (lado === 7) assert.ok(Object.entries(areas).filter(([a]) => +a >= 6).reduce((x, [, n]) => x + n, 0) >= 600, '7×7: hay de 6 o más');
}

// El mismo tablero con la misma semilla; otro con otra; las etapas crecen
assert.deepEqual(generar('a', { lado: 6 }).numeros, generar('a', { lado: 6 }).numeros);
assert.notDeepEqual(generar('a', { lado: 6 }).numeros, generar('b', { lado: 6 }).numeros);
assert.deepEqual(ETAPAS.map((_, n) => generarEtapa('dia:2026-10-13', n).lado), [5, 6, 7]);

// La ayuda: un rectángulo de la solución que no está puesto
{
  const t = generar('ayuda', { lado: 5 });
  const [a, b] = t.solucion;
  assert.deepEqual(pista(t, []), a);
  assert.deepEqual(pista(t, [a]), b);
  assert.equal(pista(t, t.solucion), null);
}

// El puntaje: 20 por tablero; la rapidez, solo con los tres (40 en 90 s, 0 en 6 min); la ayuda resta 10
assert.equal(MAXIMO, 100);
assert.equal(puntajePartida(3, 60).total, 100);
assert.equal(puntajePartida(3, 90).total, 100);
assert.equal(puntajePartida(3, 360).total, 60);
assert.equal(puntajePartida(3, 600).total, 60);
assert.equal(puntajePartida(3, 225).total, 80, 'a mitad de camino, 20 de rapidez');
assert.equal(puntajePartida(3, 60, 1).total, 100 - RESTA_AYUDA);
assert.deepEqual(puntajePartida(2, 30), { total: 2 * PUNTOS_ETAPA, base: 40, ptsRapidez: 0, resta: 0, completa: false }, 'sin los tres, sin rapidez');
assert.equal(puntajePartida(0, 30, 2).total, 0, 'nunca bajo 0');
assert.equal(tarjeta(2), '✅ 5×5  ✅ 6×6  ⬛ 7×7');
assert.equal(tarjeta(3, 1), '✅ 5×5  ✅ 6×6  ✅ 7×7\n💡 1');
console.log('✓ loteo: validación, resolvedor, 900 tableros de solución única, ayuda y puntaje');

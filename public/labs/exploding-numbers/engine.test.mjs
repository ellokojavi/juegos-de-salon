// Números explosivos (laboratorio, D-297): las reglas de los pares, las filas que se van, ➕, el puntaje y que cada
// tablero se limpie entero sin ➕ siguiendo su orden.
import assert from 'node:assert/strict';
import { generar, nuevaPartida, une, quitar, agregar, pares, indice, puntaje, tarjeta, avance, pareja, INICIALES, MAS, MAXIMO } from './engine.js';

const partida = numeros => nuevaPartida({ numeros });

// Iguales o que suman 10
assert.ok(pareja(3, 3) && pareja(4, 6) && pareja(5, 5) && !pareja(3, 4));

// De lado, de arriba abajo, en diagonal y del final de una fila al comienzo de la siguiente
{
  const p = partida([1, 1, 2, 3, 4, 5, 6, 7, 8,
                     9, 2, 9, 3, 4, 5, 6, 7, 2]);
  assert.ok(une(p, 0, 1).ok, 'de lado');
  assert.deepEqual(une(p, 0, 2), { ok: false, motivo: 'numeros' });
  assert.ok(une(p, 4, 13).ok, 'de arriba abajo');
  assert.ok(une(p, 1, 11).ok, 'en diagonal (1 y 9)');
  assert.ok(une(p, 2, 10).ok, 'en la otra diagonal (2 y 2)');
  assert.deepEqual(une(p, 3, 7), { ok: false, motivo: 'tapado' }, '3 y 7 en la misma fila, con números entre medio');
  assert.deepEqual(une(p, 2, 17), { ok: false, motivo: 'linea' }, '2 y 2 sin línea');
}
{
  // Del final de una fila al comienzo de la siguiente
  const p = partida([5, 6, 7, 8, 9, 1, 2, 3, 4,
                     6, 1, 1, 1, 1, 1, 1, 1, 1]);
  assert.ok(une(p, 8, 9).ok, '4 y 6, del final de una fila al comienzo de la siguiente');
}
{
  // Lo tachado no estorba
  const p = partida([7, 1, 9, 3, 1, 1, 1, 1, 1]);
  assert.deepEqual(une(p, 0, 3), { ok: false, motivo: 'tapado' });
  assert.ok(quitar(p, 1, 2).ok);   // 1 y 9 suman 10
  assert.ok(une(p, 0, 3).ok, '7 y 3 con tachados entre medio');
}
{
  // Una fila tachada entera se va, y lo de abajo sube
  const p = partida([1, 1, 2, 2, 3, 3, 4, 4, 5,
                     5, 6, 7, 8, 9]);
  for (const [a, b] of [[0, 1], [2, 3], [4, 5], [6, 7]]) assert.ok(quitar(p, a, b).ok);
  const r = quitar(p, 8, 9);
  assert.deepEqual(r.filas, [0], 'la primera fila se fue');
  assert.equal(p.celdas.length, 5);
  assert.deepEqual(p.celdas.filter(c => !c.fuera).map(c => c.v), [6, 7, 8, 9]);
  assert.equal(p.filas, 1);
}
{
  // ➕ copia al final los que quedan, en orden, y se acaba
  const p = partida([1, 2, 3, 4]);
  quitar(p, 0, 1) || null;
  assert.equal(agregar(p), 4);
  assert.deepEqual(p.celdas.map(c => c.v), [1, 2, 3, 4, 1, 2, 3, 4]);
  assert.equal(p.mas, MAS - 1);
  p.mas = 0;
  assert.equal(agregar(p), 0, 'sin ➕ no agrega');
}

// Cada tablero se limpia entero sin ➕ con su orden, y su primer paso está entre los pares de la partida
for (let s = 0; s < 400; s++) {
  const t = generar(`prueba-${s}`);
  assert.equal(t.numeros.length, INICIALES);
  assert.ok(t.numeros.every(v => v >= 1 && v <= 9));
  const p = nuevaPartida(t);
  const primeros = pares(p);
  assert.ok(primeros.length > 0, `${s}: el tablero trae pares`);
  for (const [a, b] of t.orden) {
    const r = quitar(p, indice(p, a), indice(p, b));
    assert.ok(r.ok, `${s}: el par ${a}-${b} del orden se tacha (${r.motivo})`);
  }
  assert.equal(p.celdas.length, 0, `${s}: queda limpio`);
  assert.equal(puntaje(p), MAXIMO);
}
assert.equal(MAXIMO, 100);

// El mismo tablero con la misma semilla; otro con otra
assert.deepEqual(generar('a').numeros, generar('a').numeros);
assert.notDeepEqual(generar('a').numeros, generar('b').numeros);
// La portada usa tableros de 2 filas
{ const t = generar('demo', { n: 18 }); const p = nuevaPartida(t); for (const [a, b] of t.orden) assert.ok(quitar(p, indice(p, a), indice(p, b)).ok); assert.equal(p.celdas.length, 0); }

// El puntaje: limpio vale 70 y 10 por ➕ que sobra; si no, la parte tachada de 70; la ayuda resta 10
{
  const t = generar('puntaje'); const p = nuevaPartida(t);
  agregar(p); p.ayudas = 1;
  const antes = puntaje(p);
  assert.equal(antes, 0, 'sin tachar nada, con una ayuda, 0');
  for (const [a, b] of t.orden.slice(0, 6)) quitar(p, indice(p, a), indice(p, b));
  assert.equal(puntaje(p), Math.round(70 * avance(p)) - 10);
  assert.ok(Math.abs(avance(p) - 12 / 72) < 1e-9, 'lo agregado con ➕ también cuenta');
  assert.match(tarjeta(p), /➕⬜⬜ 1 de 3 ➕/);
  assert.match(tarjeta(p), /% estallado/);
}
console.log(`✓ números explosivos: pares, filas, ➕, puntaje, y 400 tableros que se limpian`);

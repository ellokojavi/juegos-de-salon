// Pintaminas (D-289, in La Copa since D-331): the drawings are 7×7, every board is solved without
// guessing (with the given cells, `resolver` deduces it whole), the state and the score (0 to 100 in
// both variants) are right, and `generarDia` is the same for everyone and shorter in the trial.
import assert from 'node:assert/strict';
import { DIBUJOS, DIBUJOS2, PALETA } from './dibujos.js';
import { generar, generarDia, resolver, ayuda, estado, puntaje, tarjeta, numero, VECINAS, LADO, RESTA_ERROR, RESTA_AYUDA, LIBRES_ENSAYO, VARIANTES } from './engine.js';
import { VARIANTES as VARIANTES_COPA } from '../../engine.js';

for (const d of DIBUJOS) {
  assert.equal(d.filas.length, LADO, `${d.id}: filas`);
  for (const f of d.filas) assert.match(f, /^[#.]{7}$/, `${d.id}: ${f}`);
  const tinta = d.filas.join('').split('#').length - 1;
  assert.ok(tinta >= 12 && tinta <= 40, `${d.id}: ${tinta} de tinta, demasiado o muy poco`);
  assert.ok(d.id && d.emoji, `${d.id}: something is missing`);
  // Irregulares: uno simétrico (de lado a lado o de arriba abajo) se adivina por espejo
  assert.ok(!d.filas.every(f => f === [...f].reverse().join('')), `${d.id}: es simétrico de lado a lado`);
  assert.ok(d.filas.join() !== [...d.filas].reverse().join(), `${d.id}: es simétrico de arriba abajo`);
}
for (const d of DIBUJOS2) {
  for (const f of d.filas) assert.match(f, /^[#+.]{7}$/, `${d.id}: ${f}`);
  const de = c => d.filas.join('').split(c).length - 1;
  assert.ok(de('#') >= 4 && de('+') >= 4 && de('#') + de('+') >= 12 && de('#') + de('+') <= 40, `${d.id}: colores mal repartidos`);
  assert.ok(!d.filas.every(f => f === [...f].reverse().join('')) && d.filas.join() !== [...d.filas].reverse().join(), `${d.id}: es simétrico`);
}
// Cada dibujo trae sus colores de verdad (pedido del dueño): de PALETA, uno por color del dibujo,
// distintos, y nunca amarillo con naranjo (se confunden a simple vista)
for (const [lista, n] of [[DIBUJOS, 1], [DIBUJOS2, 2]]) for (const d of lista) {
  assert.ok(Array.isArray(d.colores) && d.colores.length === n, `${d.id}: le faltan sus colores`);
  assert.ok(d.colores.every(c => PALETA.some(p => p.id === c)) && new Set(d.colores).size === n, `${d.id}: colores`);
  assert.notDeepEqual([...d.colores].sort(), ['amarillo', 'naranjo'], `${d.id}: amarillo con naranjo`);
}
// Y el tablero sale con ellos
for (let n = 0; n < 60; n++) for (const colores of [1, 2]) {
  const t = generar(`colores-${n}`, { colores });
  const d = (colores === 2 ? DIBUJOS2 : DIBUJOS).find(d => d.emoji === t.dibujo.emoji && d.id === t.dibujo.id);
  assert.deepEqual(t.dibujo.pinturas.map(p => p.id), d.colores, `${t.dibujo.id}: sus colores`);
}
// Las cerezas salen rojas con el tallo verde (pedido del dueño)
let cerezas = 0;
for (let n = 0; cerezas < 3 && n < 500; n++) {
  const t = generar(`cerezas-${n}`, { colores: 2 });
  if (t.dibujo.emoji !== '🍒') continue;
  cerezas++;
  assert.deepEqual(t.dibujo.pinturas.map(p => p.id), ['rojo', 'verde'], 'las cerezas: fruta roja, tallo verde');
}
assert.equal(cerezas, 3, 'salen cerezas en el modo difícil');
for (const p of PALETA) assert.ok(p.id && /^#[0-9a-f]{6}$/.test(p.color) && p.cuadro, `${p.id}: color`);
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

// El modo difícil, de dos colores: 300 tableros que también se resuelven sin adivinar
let dadas2 = 0;
for (let n = 0; n < 300; n++) {
  const t = generar(`dos-${n}`, { colores: 2 });
  assert.equal(t.dibujo.pinturas.length, 2);
  assert.notEqual(t.dibujo.pinturas[0].id, t.dibujo.pinturas[1].id);
  // Amarillo y naranjo se confunden a simple vista: no comparten tablero
  assert.notDeepEqual(t.dibujo.pinturas.map(p => p.id).sort(), ['amarillo', 'naranjo'], `dos-${n}: amarillo con naranjo`);
  assert.ok(t.sol.includes(2), `${n}: no hay segundo color`);
  const sabe = resolver(t.sol, t.dadas);
  assert.equal(sabe.size, t.sol.length, `dos-${n}: no se resuelve sin adivinar`);
  for (const [i, k] of sabe) assert.equal(k, t.sol[i], `dos-${n}: dedujo mal la casilla ${i}`);
  dadas2 += t.dadas.length;
}
console.log(`  (dos colores: en promedio ${(dadas2 / 300).toFixed(1)} casillas dadas)`);

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
// The hard variant scores 0 to 100 too (D-113, D-331): no bonus
{
  const t2 = generarDia('KQRST', 3, { variante: 'hard' }), libres2 = t2.sol.map((_, i) => i).filter(i => !t2.dadas.includes(i));
  assert.equal(puntaje(estado(t2, libres2.map(i => ({ i, color: t2.sol[i] })))), 100);
  const mal = { i: libres2[0], color: t2.sol[libres2[0]] ? 0 : 1 };
  assert.equal(puntaje(estado(t2, [mal, { ayuda: true }, ...libres2.slice(1).map(i => ({ i, color: t2.sol[i] }))])), 100 - RESTA_ERROR - RESTA_AYUDA);
}
assert.equal(tarjeta(e).split('\n').length, LADO);
assert.ok(numero(t.sol, 0) <= 3);
// La ayuda (D-292): siempre hay una casilla que se puede deducir hasta terminar, la casilla está sin
// conocer, y los números que la explican son conocidos y vecinos suyos. Jugando solo con ayudas se termina
for (const [semilla, colores] of [['ayuda-1', 1], ['ayuda-2', 2], ['ayuda-3', 2]]) {
  const t = generar(semilla, { colores });
  const sabidas = new Set(t.dadas);
  while (sabidas.size < t.sol.length) {
    const a = ayuda(t.sol, sabidas);
    assert.ok(a, `${semilla}: la ayuda no encontró nada con ${sabidas.size} conocidas`);
    assert.ok(!sabidas.has(a.celda), `${semilla}: la ayuda señala una casilla conocida`);
    assert.ok(a.por.length && a.por.every(i => sabidas.has(i)), `${semilla}: la explicación no es de conocidas`);
    sabidas.add(a.celda);
  }
  assert.equal(ayuda(t.sol, sabidas), null);
}
// Each hint subtracts
const tA = generar('ayuda-puntaje'), libresA = tA.sol.map((_, i) => i).filter(i => !tA.dadas.includes(i));
const eA = estado(tA, [{ ayuda: true }, { ayuda: true }, ...libresA.map(i => ({ i, color: tA.sol[i] }))]);
assert.ok(eA.fin && eA.ayudas === 2 && puntaje(eA) === 100 - 2 * RESTA_AYUDA);
// A paid hint remembers its cell (so a reloaded cup day shows it again for free) until it is painted
{
  const a = ayuda(tA.sol, new Set(tA.dadas));
  assert.equal(estado(tA, [{ ayuda: true, c: a.celda }]).pagada, a.celda);
  assert.equal(estado(tA, [{ ayuda: true, c: a.celda }, { i: a.celda, color: tA.sol[a.celda] }]).pagada, null);
}
// Rendirse (D-296): el puntaje vale la parte pintada
{
  const t = generar('rendirse'), libres = t.sol.map((_, i) => i).filter(i => !t.dadas.includes(i));
  const mitad = libres.slice(0, Math.floor(libres.length / 2)).map(i => ({ i, color: t.sol[i] }));
  const e = estado(t, mitad);
  assert.ok(Math.abs(e.avance - mitad.length / libres.length) < 1e-9);
  assert.equal(puntaje(e, { rendido: true }), Math.round(100 * e.avance));
  assert.equal(puntaje(estado(t, []), { rendido: true }), 0);
  // As a move, so a reloaded cup day knows: nothing after it counts, and the score is the painted part
  const er = estado(t, [...mitad, { rendido: true }, { i: libres.at(-1), color: t.sol[libres.at(-1)] }]);
  assert.ok(er.rendido && er.terminado && !er.fin);
  assert.equal(puntaje(er), Math.round(100 * e.avance));
}
// generarDia (D-331): the same for everyone with the same code, day and variant; hard is two colors
assert.deepEqual(VARIANTES, VARIANTES_COPA.pintaminas, 'the variants are the cup\'s');
for (const c of ['KQRST', 'ABCDE', 'ZZZZZ', 'MNPQR']) for (const d of [1, 2, 5]) {
  const f = generarDia(c, d), h = generarDia(c, d, { variante: 'hard' });
  assert.deepEqual(generarDia(c, d), f, `${c}/${d}: deterministic`);
  assert.deepEqual(generarDia(c, d, { variante: 'hard' }), h, `${c}/${d}: deterministic in hard`);
  assert.ok(f.colores === 1 && f.variante === 'easy' && !f.sol.includes(2), `${c}/${d}: easy is one color`);
  assert.ok(h.colores === 2 && h.variante === 'hard' && h.sol.includes(2) && h.dibujo.pinturas.length === 2, `${c}/${d}: hard is two colors`);
  assert.equal(generarDia(c, d, { variante: 'nope' }).variante, 'easy', 'an unknown variant is the default one');
  // The trial (D-103): another board, solvable, with only LIBRES_ENSAYO cells to paint
  for (const variante of VARIANTES) {
    const real = generarDia(c, d, { variante }), prueba = generarDia(c, d, { variante, sal: 'ensayo', ensayo: true });
    assert.deepEqual(generarDia(c, d, { variante, sal: 'ensayo', ensayo: true }), prueba);
    assert.equal(prueba.colores, real.colores);
    assert.ok(prueba.ensayo && prueba.sol.length - prueba.dadas.length <= LIBRES_ENSAYO, `${c}/${d}: the trial is shorter`);
    assert.ok(prueba.sol.length - prueba.dadas.length < real.sol.length - real.dadas.length);
    assert.equal(resolver(prueba.sol, prueba.dadas).size, prueba.sol.length, `${c}/${d}: the trial is solvable`);
  }
}
console.log('✓ Pintaminas');

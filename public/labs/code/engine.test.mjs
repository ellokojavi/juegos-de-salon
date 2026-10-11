// La clave (laboratorio, D-270): las orientaciones forman un grupo; con sus 4 cartas, la clave se
// lee con la orientación de cada carta y no hay otra forma de leer un código con todas puestas.
import assert from 'node:assert/strict';
import { generar, juntos, leer, componer, girar, voltear, mover, lecturas, choques, ORIENTACIONES, SEGMENTOS } from './engine.js';

for (const o of ORIENTACIONES) assert.equal(componer(o, o), 'I');
assert.equal(componer('R', 'H'), 'V');
assert.deepEqual(new Set([girar('I'), voltear('I'), girar(voltear('I')), 'I']), new Set(ORIENTACIONES));
for (const x of ORIENTACIONES) for (const y of ORIENTACIONES) for (const s of 'abcdefg') for (let i = 0; i < 4; i++) {
  assert.deepEqual(mover(x, mover(y, { i, s })), mover(componer(x, y), { i, s }));
}
for (const o of ORIENTACIONES) for (const v of Object.values(SEGMENTOS)) assert.equal(new Set([...v].map(s => mover(o, { i: 0, s }).s)).size, v.length);

let semilla = 11;
const rand = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
for (const n of [4]) {
  const t = Date.now();
  for (let k = 0; k < 200; k++) {
    const c = generar(n, rand);
    assert.equal(c.cartas.length, n);
    assert.match(c.codigo, /^\d{4}$/);
    assert.ok(c.base.length >= 2, 'la base tiene trazos');
    for (const carta of c.cartas) assert.ok(carta.trazos.length >= (n <= 4 ? 2 : 1), 'cada carta tiene trazos');
    if (n <= 4) assert.ok(c.cartas.every(x => x.o !== 'I'), 'con 4 cartas, ninguna viene derecha');
    // Con la orientación de cada carta se lee el código
    assert.equal(juntos(c, c.cartas.map(x => x.o)).map(leer).join(''), c.codigo);
    // Y es la única lectura posible con todas puestas y sin trazos encima de otros
    assert.deepEqual([...lecturas(c)], [c.codigo]);
    // Resuelta, ningún trazo queda encima de otro
    assert.deepEqual(choques(c, c.cartas.map(x => x.o)), []);
  }
  console.log(`  ${n} cartas: ${((Date.now() - t) / 200).toFixed(1)} ms por clave`);
}
// Un choque se ve: la misma carta dos veces encima de sí misma no, pero una carta sobre la base sí
{
  const c = { base: [{ i: 0, s: 'a' }], cartas: [{ o: 'I', trazos: [{ i: 0, s: 'a' }, { i: 1, s: 'b' }] }, { o: 'I', trazos: [{ i: 1, s: 'b' }] }] };
  assert.deepEqual(choques(c, ['I', 'I']).map(x => `${x.i}${x.s}`).sort(), ['0a', '1b']);
  assert.deepEqual(choques(c, ['I', 'I'], [true, false]).map(x => `${x.i}${x.s}`), ['0a']);
  assert.deepEqual(choques(c, ['V', 'I'], [true, false]), [], 'girada, la a pasa a ser la d');
}
console.log('✓ La clave (labs)');

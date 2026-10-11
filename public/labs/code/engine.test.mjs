// La clave (laboratorio, D-270): las orientaciones forman un grupo, la B calza solo con la
// orientación buena y entonces se lee el código, y ninguna figura sola dice una cifra completa.
import assert from 'node:assert/strict';
import { generar, juntos, leer, componer, girar, voltear, mover, ORIENTACIONES, SEGMENTOS, calza } from './engine.js';

// El grupo: cada una es su inversa, R·H = V, y con girar y voltear se llega a todas
for (const o of ORIENTACIONES) assert.equal(componer(o, o), 'I');
assert.equal(componer('R', 'H'), 'V');
assert.equal(componer('H', 'V'), 'R');
assert.deepEqual(new Set([girar('I'), voltear('I'), girar(voltear('I')), 'I']), new Set(ORIENTACIONES));
// Mover es una acción: mover(x, mover(y, s)) = mover(x·y, s)
for (const x of ORIENTACIONES) for (const y of ORIENTACIONES) for (const s of 'abcdefg') for (let i = 0; i < 4; i++) {
  assert.deepEqual(mover(x, mover(y, { i, s })), mover(componer(x, y), { i, s }));
}
// Toda cifra vista en cualquier orientación sigue siendo de siete segmentos (algunas son otra cifra)
for (const o of ORIENTACIONES) for (const [d, v] of Object.entries(SEGMENTOS)) {
  const m = [...v].map(s => mover(o, { i: 0, s }).s);
  assert.equal(new Set(m).size, v.length, `${o} ${d}`);
}

let semilla = 7;
const rand = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
for (let n = 0; n < 300; n++) {
  const c = generar(rand);
  assert.match(c.codigo, /^\d{4}$/);
  assert.notEqual(c.o, 'I', 'siempre hay que girarla o voltearla');
  // Con la orientación buena se lee el código
  assert.equal(juntos(c, c.o).map(leer).join(''), c.codigo, `${n}: con ${c.o} no se lee ${c.codigo}`);
  assert.ok(calza(c, c.o) && !calza(c, 'I'));
  // Cada cifra tiene trazos en las dos figuras: ninguna sola la dibuja entera
  for (let i = 0; i < 4; i++) {
    assert.ok(c.a.some(x => x.i === i), `${n}: la A no tiene trazos de la cifra ${i}`);
    const bBien = c.b.map(x => mover(c.o, x));
    assert.ok(bBien.some(x => x.i === i), `${n}: la B no tiene trazos de la cifra ${i}`);
    assert.notEqual(leer(new Set(c.a.filter(x => x.i === i).map(x => x.s))), c.codigo[i], `${n}: la A sola dice la cifra ${i}`);
  }
}
console.log('✓ La clave (labs)');

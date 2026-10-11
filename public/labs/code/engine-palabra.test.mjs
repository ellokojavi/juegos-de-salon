// La clave con palabra (laboratorio, D-270): las letras de catorce segmentos son todas distintas;
// media vuelta es su propia inversa; la clave se lee con la cara y el giro buenos de cada carta, y
// es la única lectura sin trazos encimados.
import assert from 'node:assert/strict';
import { LETRAS, SEGS, letraDe, girar, generar, juntos, leer, lecturas, choques, PALABRAS_CLAVE } from './engine-palabra.js';

assert.equal(new Set(Object.values(LETRAS).map(v => v.split(' ').sort().join())).size, 26, 'cada letra se dibuja distinto');
for (const v of Object.values(LETRAS)) for (const s of v.split(' ')) assert.ok(SEGS.includes(s), s);
for (const s of SEGS) for (let i = 0; i < 5; i++) assert.deepEqual(girar(girar({ i, s })), { i, s });
assert.ok(PALABRAS_CLAVE.length > 100 && PALABRAS_CLAVE.every(p => /^[A-Z]{5}$/.test(p)));
assert.equal(letraDe(0), null);

let semilla = 5;
const rand = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
const t = Date.now();
for (let n = 0; n < 150; n++) {
  const c = generar(rand);
  assert.ok(PALABRAS_CLAVE.includes(c.palabra));
  assert.equal(c.cartas.length, 4);
  for (const carta of c.cartas) assert.ok(carta.caras[0].length >= 2 && carta.caras[1].length === carta.caras[0].length, 'las dos caras con trazos');
  const bien = c.cartas.map(x => x.bien);
  assert.equal(juntos(c, bien).map(leer).join(''), c.palabra, `${n}: no se lee ${c.palabra}`);
  assert.deepEqual(choques(c, bien), [], `${n}: resuelta tiene choques`);
  assert.deepEqual([...lecturas(c)], [c.palabra], `${n}: hay otra lectura`);
}
console.log(`✓ La clave con palabra (labs) · ${((Date.now() - t) / 150).toFixed(1)} ms por clave`);

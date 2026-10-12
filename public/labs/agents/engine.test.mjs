// Agentes (laboratorio, D-286): cada tablero es justo —cada agente va solo con su pista, el asesino
// tienta pero no va con ninguna, las neutrales no tientan— y el estado y el puntaje se calculan bien.
import assert from 'node:assert/strict';
import { PISTAS } from './pistas.js';
import { generar, estado, puntaje, tarjeta, AGENTES, CUANTAS, NEUTRALES } from './engine.js';

const nombres = PISTAS.map(x => x.pista);
assert.equal(new Set(nombres).size, nombres.length, 'pistas repetidas');
for (const x of PISTAS) {
  assert.ok(x.si.length >= 6 && x.casi.length >= 2, `${x.pista}: pocas palabras`);
  assert.ok(!x.si.includes(x.pista) && !x.casi.some(w => x.si.includes(w)), `${x.pista}: una palabra en si y en casi`);
  for (const w of [...x.si, ...x.casi]) assert.match(w, /^[A-ZÁÉÍÓÚÑÜ]+$/, `${x.pista}: ${w}`);
}

for (let n = 0; n < 300; n++) {
  const t = generar(`prueba-${n}`);
  assert.deepEqual(generar(`prueba-${n}`), t, 'la misma semilla, el mismo tablero');
  assert.equal(t.cartas.length, AGENTES + NEUTRALES + 1);
  assert.equal(new Set(t.cartas.map(c => c.w)).size, AGENTES + NEUTRALES + 1, `${n}: palabras repetidas`);
  const elegidas = t.pistas.map(p => PISTAS.find(x => x.pista === p.pista));
  for (const c of t.cartas) {
    const van = elegidas.map((x, p) => (x.si.includes(c.w) ? p : -1)).filter(p => p >= 0);
    if (c.tipo === 'agente') assert.deepEqual(van, [c.p], `${n}: ${c.w} va con ${van}`);
    else assert.deepEqual(van, [], `${n}: la ${c.tipo} ${c.w} va con una pista`);
    if (c.tipo === 'asesino') assert.ok(elegidas[c.tienta]?.casi.includes(c.w), `${n}: el asesino ${c.w} no tienta a la pista que dice`);
    if (c.tipo === 'neutral') assert.ok(elegidas[c.tienta]?.casi.includes(c.w), `${n}: la neutral ${c.w} no tienta a la pista que dice`);
  }
  assert.ok(!t.cartas.some(c => t.pistas.some(p => p.pista === c.w)), `${n}: una pista está en el tablero`);
}

// El estado y el puntaje
const t = generar('prueba-estado');
const de = p => t.cartas.map((c, i) => [c, i]).filter(([c]) => c.tipo === 'agente' && c.p === p).map(([, i]) => i);
const neutral = t.cartas.findIndex(c => c.tipo === 'neutral'), asesino = t.cartas.findIndex(c => c.tipo === 'asesino');
// Todo perfecto: 100
const perfecto = [...Array(CUANTAS).keys()].flatMap(p => de(p).map(i => ({ i })));
let e = estado(t, perfecto);
assert.ok(e.fin && e.encontrados === AGENTES && puntaje(e) === 100);
// Un agente de otra pista suma y no corta: queda menos para esa pista
e = estado(t, [{ i: de(1)[0] }]);
assert.equal(e.actual, 0); assert.equal(e.encontrados, 1);
// Una neutral corta la pista y resta
e = estado(t, [{ i: de(0)[0] }, { i: neutral }]);
assert.equal(e.actual, 1); assert.equal(e.neutrales, 1);
// Pasar corta la pista sin restar
e = estado(t, [{ pasar: true }]);
assert.equal(e.actual, 1); assert.equal(puntaje(e), 0);
// El asesino resta 40
// (todas las pistas menos la última completas, y en la última el asesino: se acaba)
e = estado(t, [...[...Array(CUANTAS - 1).keys()].flatMap(p => de(p).map(i => ({ i }))), { i: asesino }]);
assert.ok(e.fin && e.asesino); assert.equal(puntaje(e), Math.round(100 * (AGENTES - 3) / AGENTES) - 40);
assert.equal(tarjeta(t, e).split('\n').length, (AGENTES + NEUTRALES + 1) / 3);
console.log('✓ Agentes (labs)');

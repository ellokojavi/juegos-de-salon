// Tests del motor de Generala: node public/generala/engine.test.mjs
import assert from 'node:assert/strict';
import {
  CATEGORIAS, DADOS, buildState, cuentas, esEscalera, esFull, esGenerala, esPoker, puntajeDia,
  puntos, readDice, readKeep, tirar, total, writeDice, writeKeep,
} from './engine.js';

const D = s => [...s].map(Number);

// --- Dados y guardados como texto ---
assert.deepEqual(readDice('31456'), [3, 1, 4, 5, 6]);
assert.equal(writeDice([3, 1, 4, 5, 6]), '31456');
assert.equal(readDice('3145'), null, 'cinco dados, ni uno menos');
assert.equal(readDice('31457'), null, 'caras del 1 al 6');
assert.equal(readDice(undefined), null);
assert.deepEqual(readKeep('10100'), [true, false, true, false, false]);
assert.equal(writeKeep([true, false, true, false, false]), '10100');
assert.equal(readKeep('1010'), null);
assert.deepEqual(cuentas(D('11223')), [0, 2, 2, 1, 0, 0, 0]);

// --- Tirar: los guardados quedan y el azar se consume en orden ---
{
  const seq = [0, 0.99, 0.5];
  let i = 0;
  const azar = () => seq[i++ % seq.length];
  assert.deepEqual(tirar(null, null, azar), [1, 6, 4, 1, 6]);
  i = 0;
  assert.deepEqual(tirar(D('22222'), [true, false, true, false, true], azar), [2, 1, 2, 6, 2]);
  assert.equal(tirar(null, null).length, DADOS);
}

// --- Los juegos ---
assert.ok(esEscalera(D('12345')) && esEscalera(D('65432')) && esEscalera(D('61345')), 'tres escaleras, el as arriba también');
assert.ok(!esEscalera(D('12346')));
assert.ok(esFull(D('33555')) && !esFull(D('33333')) && !esFull(D('33455')));
assert.ok(esPoker(D('44446')) && esPoker(D('44444')) && !esPoker(D('44466')));
assert.ok(esGenerala(D('66666')) && !esGenerala(D('66665')));

// --- Puntos ---
assert.equal(puntos('3', D('33315')), 9);
assert.equal(puntos('6', D('12345')), 0);
assert.equal(puntos('escalera', D('23456')), 20);
assert.equal(puntos('escalera', D('23456'), { servida: true }), 25);
assert.equal(puntos('full', D('22333')), 30);
assert.equal(puntos('full', D('22333'), { servida: true }), 35);
assert.equal(puntos('poker', D('55551')), 40);
assert.equal(puntos('poker', D('55551'), { servida: true }), 45);
assert.equal(puntos('generala', D('44444')), 50);
assert.equal(puntos('generala', D('44441')), 0);
assert.equal(puntos('doble', D('44444')), 0, 'sin generala anotada, la doble no vale');
assert.equal(puntos('doble', D('44444'), { tarjeta: { generala: 0 } }), 0, 'tachada tampoco');
assert.equal(puntos('doble', D('44444'), { tarjeta: { generala: 50 } }), 100);
assert.equal(total({ 1: 3, full: 30, generala: 0 }), 33);

// --- Una partida: helpers ---
const roll = (from, d, k = '00000') => ({ t: 'roll', from, d, k });
const score = (from, c) => ({ t: 'score', from, c });

// Un turno completo en dos tiros
{
  const v = buildState({ players: ['A', 'B'], plays: [roll('A', '33125'), roll('A', '33333', '11000')] });
  assert.equal(v.current, 'A');
  assert.equal(v.tiro, 2);
  assert.equal(v.opciones.generala, 50, 'generala en el segundo tiro: no es servida');
  assert.equal(v.opciones['3'], 15);
  assert.equal(v.opciones.doble, 0);
  assert.ok(!v.done);
}

// Los guardados no cambian, no se tira una cuarta vez y no se tira sin soltar ninguno
{
  const v = buildState({ players: ['A'], plays: [roll('A', '33125'), roll('A', '43125', '10000')] });
  assert.equal(v.tiro, 1, 'el guardado cambió de 3 a 4: se descarta');
  const w = buildState({ players: ['A'], plays: [roll('A', '33125'), roll('A', '33125', '11111')] });
  assert.equal(w.tiro, 1, 'todo guardado no es tirar');
  const x = buildState({ players: ['A'], plays: [roll('A', '11111'), roll('A', '11112', '11110'), roll('A', '11113', '11110'), roll('A', '11114', '11110')] });
  assert.equal(x.tiro, 3);
  assert.deepEqual(x.dados, D('11113'), 'el cuarto tiro se descarta');
}

// Fuera de turno y casillas ocupadas
{
  const v = buildState({ players: ['A', 'B'], plays: [roll('B', '12345'), roll('A', '12345'), score('A', 'escalera'), roll('B', '22221'), score('B', '2'), roll('A', '12345'), score('A', 'escalera')] });
  assert.equal(v.st.A.tarjeta.escalera, 25, 'servida');
  assert.equal(v.st.B.tarjeta['2'], 8);
  assert.equal(v.current, 'A', 'la escalera ya estaba: A sigue en su turno');
  assert.equal(v.tiro, 1);
  assert.equal(v.history.length, 2);
  // Anotar sin tirar no vale
  const w = buildState({ players: ['A'], plays: [score('A', '1')] });
  assert.equal(w.history.length, 0);
}

// Generala servida gana al tiro en grupo; solo, se anota como cualquier generala
{
  const v = buildState({ players: ['A', 'B'], plays: [roll('A', '12345'), score('A', '1'), roll('B', '66666')] });
  assert.ok(v.done);
  assert.deepEqual(v.winners, ['B']);
  assert.equal(v.servida.by, 'B');
  const sin = buildState({ players: ['A', 'B'], config: { servidaGana: false }, plays: [roll('A', '66666')] });
  assert.ok(!sin.done, 'con la regla apagada se sigue jugando');
  assert.equal(sin.opciones.generala, 50);
  const solo = buildState({ players: ['A'], plays: [roll('A', '66666')] });
  assert.ok(!solo.done, 'jugando solo no se gana al tiro');
}

// Partida entera: 11 turnos cada uno, gana el que suma más, y los empates se dicen
{
  const plays = [];
  for (const c of CATEGORIAS) {
    plays.push(roll('A', '66666'), score('A', c));     // A: generala en todo lo que puede
    plays.push(roll('B', '11111'), score('B', c));
  }
  const v = buildState({ players: ['A', 'B'], config: { servidaGana: false }, plays });
  assert.ok(v.done);
  assert.equal(v.st.A.total, 30 + 45 + 50 + 100, 'seis seises, póker servido (cinco iguales también son póker), generala y doble');
  assert.equal(v.st.B.total, 5 + 45 + 50 + 100);
  assert.deepEqual(v.winners, ['A']);
  assert.equal(v.current, null);
  const empate = buildState({ players: ['A', 'B'], config: { servidaGana: false }, plays: plays.map(p => (p.from === 'B' && p.t === 'roll' ? { ...p, d: '66666' } : p)) });
  assert.deepEqual(empate.winners, ['A', 'B']);
}

// La vuelta avanza cuando anotaron todos
{
  const v = buildState({ players: ['A', 'B'], plays: [roll('A', '12345'), score('A', '1'), roll('B', '12345'), score('B', '1')] });
  assert.equal(v.vuelta, 2);
  assert.equal(v.turno, 1);
}

// Uno al día: de 0 a 100
assert.equal(puntajeDia(0), 0);
assert.equal(puntajeDia(150), 50);
assert.equal(puntajeDia(360), 100);

console.log('✓ engine de Generala');

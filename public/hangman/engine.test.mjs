// Ejecutar: node ahorcado/engine.test.mjs
import assert from 'node:assert/strict';
import {
  ALPHABETS, FREQ, normalize, shapeOf, positionsOf, lettersOf, wordProblem, rarest,
  shuffleSeeded, dealWords, buildState, readPos, sha256, verifySetter,
} from './engine.js';
import { DECKS } from './decks/index.js';

/* ---------- normalización (D-57) ---------- */
assert.equal(normalize('paltá'), 'PALTA');
assert.equal(normalize('Açaí'), 'ACAI', 'la Ç se pliega a C');
assert.equal(normalize('ñandú'), 'ÑANDU', 'la Ñ sobrevive a la limpieza de tildes');
assert.equal(normalize('  el   mar '), 'EL MAR', 'espacios de más al medio y en los bordes');
assert.equal(normalize(null), '');
assert.equal(shapeOf('la paltá'), '.. .....', 'el espacio va regalado y se ve');
assert.deepEqual(positionsOf('banana', 'a'), [1, 3, 5]);
assert.deepEqual(positionsOf('banana', ''), []);
assert.deepEqual(positionsOf('el mar', 'á'), [4], 'la tilde del intento no importa');
assert.deepEqual(lettersOf('la paltá').sort(), ['A', 'L', 'P', 'T']);

/* ---------- alfabetos y frecuencias ---------- */
for (const lang of ['es', 'en', 'pt']) {
  assert.equal(FREQ[lang].length, ALPHABETS[lang].length, `${lang}: la frecuencia no cubre el alfabeto`);
  assert.deepEqual([...FREQ[lang]].sort(), [...ALPHABETS[lang]].sort(), `${lang}: frecuencia y alfabeto no coinciden`);
}
assert.ok(ALPHABETS.es.includes('Ñ') && !ALPHABETS.en.includes('Ñ'), 'la Ñ solo existe en español');

/* ---------- validación de la palabra que escribe un jugador ---------- */
assert.equal(wordProblem('palta'), null);
assert.equal(wordProblem('el mar'), null, 'una frase corta vale');
assert.equal(wordProblem('ab'), 'errWordShort');
assert.equal(wordProblem('extraordinariamente'), 'errWordLong');
assert.equal(wordProblem('casa2'), 'errWordLetters');
assert.equal(wordProblem('aaa'), 'errWordPoor');
assert.equal(wordProblem('ñandu', 'es'), null);
assert.equal(wordProblem('ñandu', 'en'), 'errWordLetters', 'en inglés no hay Ñ que probar');

/* ---------- comprar una letra revela la más rara (D-58) ---------- */
assert.equal(rarest('MURCIELAGO', [], 'es'), 'G', 'la G es la más rara de esa palabra');
assert.equal(rarest('MURCIELAGO', ['G'], 'es'), 'M', 'sacada la G, la M es la siguiente más rara');
assert.equal(rarest('AAA', ['A'], 'es'), null, 'si no falta ninguna, no hay nada que comprar');

/* ---------- reparto del mazo ---------- */
const cards = DECKS[0].cards;
assert.deepEqual(shuffleSeeded([1, 2, 3, 4, 5], 42), shuffleSeeded([1, 2, 3, 4, 5], 42), 'misma semilla, mismo orden');
const distintas = dealWords({ cards, seed: 7, roles: ['A', 'B', 'C'] });
assert.equal(new Set(Object.values(distintas)).size, 3, 'en serie, una palabra distinta por jugador');
const iguales = dealWords({ cards, seed: 7, roles: ['A', 'B', 'C'], same: true });
assert.equal(new Set(Object.values(iguales)).size, 1, 'a la vez, la misma palabra para todos (D-54)');
assert.deepEqual(dealWords({ cards, seed: 7, roles: ['A'] }), { A: distintas.A }, 'el reparto no depende de cuántos sean');

/* ---------- estado: con el mazo el aparato resuelve solo ---------- */
const cfg = { lives: 6, buy: true, turns: true };
// Una partida en cadena: se anuncia la forma y la pista, la palabra la sabe solo quien la puso
const cadena = {
  players: ['A', 'B'], config: cfg,
  declared: { A: { shape: '.....', hint: 'se come' }, B: { shape: '.....', hint: 'se toma' } },
};
const base = { players: ['A', 'B'], config: cfg, words: { A: 'PALTA', B: 'QUESO' } };
let v = buildState({ ...base, plays: [] });
assert.equal(v.phase, 'play');
assert.equal(v.current, 'A', 'con turnos juega el primero que no ha terminado');
assert.equal(v.st.A.pattern, '.....');
assert.equal(v.st.A.lives, 6);

v = buildState({ ...base, plays: [{ from: 'A', letter: 'a' }] });
assert.equal(v.st.A.pattern, '.A..A', 'la letra sale en todos sus lugares');
assert.equal(v.st.A.lives, 6, 'un acierto no cuesta nada');

v = buildState({ ...base, plays: [{ from: 'A', letter: 'A' }, { from: 'A', letter: 'Z' }, { from: 'A', letter: 'Z' }] });
assert.equal(v.st.A.wrong, 1, 'la letra repetida se descarta, no cobra dos veces');
assert.equal(v.st.A.lives, 5);

/* ---------- el turno se alterna letra a letra (D-59) ---------- */
v = buildState({ ...base, plays: [{ from: 'A', letter: 'A' }] });
assert.equal(v.current, 'B', 'una letra y el turno pasa: no se juega la palabra entera de una');
v = buildState({ ...base, plays: [{ from: 'A', letter: 'A' }, { from: 'B', letter: 'E' }] });
assert.equal(v.current, 'A', 'y vuelve');
// Con tres, el turno da la vuelta y saltea al que ya terminó
const tres = { players: ['A', 'B', 'C'], config: cfg, words: { A: 'PALTA', B: 'QUESO', C: 'MESA' } };
v = buildState({ ...tres, plays: [{ from: 'A', letter: 'Z' }, { from: 'B', letter: 'Z' }] });
assert.equal(v.current, 'C');
v = buildState({ ...tres, plays: [...[...'MESA'].map(letter => ({ from: 'C', letter })), { from: 'A', letter: 'Z' }] });
assert.equal(v.current, 'B', 'C ya sacó la suya: el turno la saltea');
v = buildState({ ...tres, plays: [{ from: 'A', letter: 'A' }, { from: 'B', letter: 'Z' }, { from: 'C', letter: 'Z' }, { from: 'A', letter: 'L' }] });
assert.equal(v.current, 'B', 'la vuelta completa deja el turno donde corresponde');
// El último que queda vivo sigue jugando sin pasarle el turno a nadie
v = buildState({ ...base, plays: [...[...'PALT'].map(letter => ({ from: 'A', letter })), { from: 'B', letter: 'Q' }] });
assert.equal(v.current, 'B', 'A ya terminó: el turno se queda con el único que sigue');
// Con cadena, mientras no llega la respuesta el turno no se mueve
v = buildState({ ...cadena, plays: [{ from: 'A', letter: 'A' }] });
assert.equal(v.current, 'A', 'una jugada sin responder no le pasa el turno a nadie');

/* ---------- comprar cuesta un error y revela la más rara ---------- */
v = buildState({ ...base, plays: [{ from: 'A', buy: true }] });
assert.equal(v.st.A.used[0], 'P', 'compró la letra que falta más rara de PALTA');
assert.equal(v.st.A.lives, 5, 'la compra se paga con un error');
assert.equal(v.st.A.bought, 1);
v = buildState({ ...base, config: { ...cfg, buy: false }, plays: [] });
assert.equal(v.st.A.canBuy, false, 'si la partida no deja comprar, no se ofrece');
v = buildState({ ...base, plays: [{ from: 'A', letter: 'Z' }, { from: 'A', letter: 'X' }, { from: 'A', letter: 'W' }, { from: 'A', letter: 'K' }, { from: 'A', letter: 'J' }] });
assert.equal(v.st.A.lives, 1);
assert.equal(v.st.A.canBuy, false, 'con un solo error de margen no se puede comprar la propia muerte');

/* ---------- sacarla, y que te cuelguen ---------- */
const sacar = [...'PALTA'].map(letter => ({ from: 'A', letter }));
v = buildState({ ...base, plays: sacar });
assert.ok(v.st.A.solved && !v.st.A.hanged);
assert.equal(v.st.A.score, 6, 'el puntaje son los errores que sobraron');
assert.equal(v.current, 'B', 'terminada su palabra, el turno pasa al siguiente');

const colgar = [...'ZXWKJH'].map(letter => ({ from: 'A', letter }));
v = buildState({ ...base, plays: colgar });
assert.ok(v.st.A.hanged && !v.st.A.solved);
assert.equal(v.st.A.score, 0, 'al colgado no le queda nada');
assert.equal(v.st.A.used.length, 6, 'la séptima ya no entra: la palabra quedó cerrada');
v = buildState({ ...base, plays: [...colgar, { from: 'A', letter: 'P' }] });
assert.equal(v.st.A.used.length, 6, 'después de colgado no se juega más');

/* ---------- fin de partida, ranking y desempate ---------- */
// PALTA y MESA se sacan con cuatro letras cada una: quedan parejas en puntaje y en letras
const parejo = { players: ['A', 'B'], config: cfg, words: { A: 'PALTA', B: 'MESA' } };
const sacaA = ms => [...'PALT'].map(letter => ({ from: 'A', letter, ms }));
const sacaB = ms => [...'MESA'].map(letter => ({ from: 'B', letter, ms }));
v = buildState({ ...parejo, plays: [...sacaA(50), ...sacaB(100)] });
assert.equal(v.phase, 'done');
assert.ok(v.done);
assert.deepEqual(v.winner, ['A'], 'mismo puntaje y mismas letras: gana quien tardó menos');
assert.deepEqual(v.rank, ['A', 'B']);
v = buildState({ ...parejo, plays: [...sacaA(50), ...sacaB(50)] });
assert.deepEqual(v.winner, ['A', 'B'], 'empate parejo de verdad: ganan los dos');
// Sacarla con menos letras vale más que sacarla con las mismas vidas
v = buildState({ ...base, plays: [...sacar, ...[...'QUESO'].map(letter => ({ from: 'B', letter }))] });
assert.deepEqual(v.winner, ['A'], 'a igual margen, gana quien gastó menos letras');

/* ---------- cadena: el patrón se arma con las respuestas del que puso la palabra ---------- */
v = buildState({ ...cadena, plays: [{ from: 'A', letter: 'A' }] });
assert.ok(v.st.A.pending, 'sin respuesta todavía, la jugada queda esperando');
assert.equal(v.st.A.used.length, 0);
v = buildState({ ...cadena, plays: [{ from: 'A', letter: 'A', pos: [1, 4] }] });
assert.equal(v.st.A.pattern, '.A..A', 'con la respuesta se dibuja igual que con el mazo');
assert.equal(v.st.A.pending, false);
v = buildState({ ...cadena, plays: [{ from: 'A', letter: 'Z', pos: [] }] });
assert.equal(v.st.A.lives, 5, 'una respuesta vacía es un error');
assert.equal(v.st.A.hint, 'se come', 'la pista viaja con la forma, no con la palabra');

/* ---------- el turno saltea a quien se fue de la sala (D-66) ---------- */
{
  const tres = { players: ['A', 'B', 'C'], config: { lives: 6, turns: true }, words: { A: 'PALTA', B: 'QUESO', C: 'MANGO' } };
  let t = buildState({ ...tres, plays: [{ from: 'A', letter: 'P' }] });
  assert.equal(t.current, 'B', 'sin nadie afuera, el turno va al siguiente');
  t = buildState({ ...tres, config: { ...tres.config, away: ['B'] }, plays: [{ from: 'A', letter: 'P' }] });
  assert.equal(t.current, 'C', 'si B cerró la pestaña, el turno lo saltea y no traba la sala');
  t = buildState({ ...tres, config: { ...tres.config, away: ['B'] }, plays: [] });
  assert.equal(t.current, 'A', 'el primer turno tampoco cae en alguien que no está');
  t = buildState({ ...tres, config: { ...tres.config, away: ['A', 'B', 'C'] }, plays: [{ from: 'A', letter: 'P' }] });
  assert.ok(t.current, 'si no queda nadie presente, el turno igual es de alguien vivo');
  // Volver a la sala devuelve el lugar en la rueda
  t = buildState({ ...tres, config: { ...tres.config, away: [] }, plays: [{ from: 'A', letter: 'P' }] });
  assert.equal(t.current, 'B', 'si vuelve, vuelve a entrar en la rueda');
}

/* ---------- sin turnos, todos juegan a la vez ---------- */
v = buildState({ players: ['A', 'B'], config: { ...cfg, turns: false }, words: { A: 'PALTA', B: 'QUESO' }, plays: [] });
assert.equal(v.current, null, 'en varios celulares no hay turno: cada uno juega el suyo');

/* ---------- nadie juega antes de que estén todas las palabras ---------- */
v = buildState({ players: ['A', 'B'], config: cfg, words: { A: 'PALTA' }, plays: [] });
assert.equal(v.phase, 'words');
assert.equal(v.ready, false);
assert.equal(v.st.B.ready, false);

/* ---------- anti-trampa (C-10) ---------- */
const salt = 'abc123';
const commit = await sha256('PALTA' + salt);
let ver = await verifySetter({ word: 'palta', salt, commit, replies: [{ letter: 'A', pos: [1, 4] }, { letter: 'Z', pos: [] }] });
assert.ok(ver.ok && ver.hashOk && ver.repliesOk);
ver = await verifySetter({ word: 'pauta', salt, commit, replies: [] });
assert.ok(!ver.hashOk, 'si la palabra revelada no es la comprometida, no pasa');
ver = await verifySetter({ word: 'palta', salt, commit, replies: [{ letter: 'A', pos: [1] }] });
assert.ok(ver.hashOk && !ver.repliesOk, 'una respuesta que escondió una letra queda a la vista');

/* ---------- las posiciones de una respuesta viajan como texto (D-60) ---------- */
assert.deepEqual(readPos('1,4,8'), [1, 4, 8]);
assert.deepEqual(readPos('0'), [0]);
// Lo que rompía en varios celulares: la letra que no está es la lista vacía, y Firebase
// no guarda una lista vacía, así que el campo llegaba ausente y la respuesta se descartaba.
assert.deepEqual(readPos(''), [], 'una letra que no está es una respuesta vacía, no una inválida');
assert.deepEqual(readPos(undefined), [], 'el campo ausente es lo mismo que el vacío');
assert.deepEqual(readPos(null), []);
assert.deepEqual(readPos([]), [], 'el transporte local manda la lista cruda');
assert.deepEqual(readPos([2, 5]), [2, 5]);
assert.equal(readPos('a,b'), null, 'lo que no son índices no pasa');
assert.equal(readPos('-1'), null, 'una posición negativa no pasa');
assert.equal(readPos('1.5'), null, 'una posición con decimales no pasa');
assert.equal(readPos({}), null, 'lo que no es texto ni lista no pasa');
// Una respuesta vacía sigue contando como error: es la letra que no estaba
let vv = buildState({ ...cadena, plays: [{ from: 'A', letter: 'Z', pos: readPos('') }] });
assert.equal(vv.st.A.lives, 5, 'la respuesta vacía que viajó como texto sigue siendo un error');

/* ---------- colgarse no gana, y entre colgados gana quien llegó más lejos (D-61) ---------- */
{
  const cfg3 = { lives: 2, turns: false };
  // A se cuelga con 2 letras sin revelar nada; B se cuelga con 4, pero dejó la S a la vista
  const todos = buildState({
    players: ['A', 'B'], config: cfg3, words: { A: 'PALTA', B: 'QUESO' },
    plays: [
      { from: 'A', letter: 'X' }, { from: 'A', letter: 'Z' },
      { from: 'B', letter: 'S' }, { from: 'B', letter: 'X' }, { from: 'B', letter: 'Z' },
    ],
  });
  assert.ok(todos.done && todos.st.A.hanged && todos.st.B.hanged, 'se colgaron los dos');
  assert.deepEqual(todos.winner, [], 'si no la sacó nadie, no hay ganador');
  assert.deepEqual(todos.rank, ['B', 'A'], 'entre colgados va primero el que reveló más, no el que gastó menos');

  // Con uno que sí la saca, ese va primero aunque haya gastado más letras
  const uno = buildState({
    players: ['A', 'B'], config: { lives: 6, turns: false }, words: { A: 'PALTA', B: 'QUESO' },
    plays: [
      { from: 'A', letter: 'X' }, { from: 'A', letter: 'Z' }, { from: 'A', letter: 'J' },
      { from: 'A', letter: 'B' }, { from: 'A', letter: 'C' }, { from: 'A', letter: 'D' },
      { from: 'B', letter: 'Q' }, { from: 'B', letter: 'U' }, { from: 'B', letter: 'E' },
      { from: 'B', letter: 'S' }, { from: 'B', letter: 'O' },
    ],
  });
  assert.ok(uno.st.A.hanged && uno.st.B.solved);
  assert.deepEqual(uno.rank, ['B', 'A'], 'quien la sacó va antes que quien se colgó');
  assert.deepEqual(uno.winner, ['B']);
}

console.log('ahorcado: motor, mazos, reparto y anti-trampa en orden');

// Ejecutar: node linea-de-tiempo/engine.test.mjs
import assert from 'node:assert/strict';
import { rng, shuffleSeeded, deal, isCorrect, correctSlot, buildState, yearLabel } from './engine.js';
import { DECKS, getDeck } from './decks/index.js';

// Mazos bien formados
for (const d of DECKS) {
  assert.ok(d.cards.length >= 80, `${d.id} tiene pocas cartas`);
  assert.equal(new Set(d.cards.map(c => c.id)).size, d.cards.length, `${d.id} tiene ids repetidos`);
  for (const c of d.cards) {
    assert.ok(c.id && typeof c.year === 'number' && c.emoji && c.es && c.en, `carta incompleta en ${d.id}: ${c.id}`);
    assert.ok(c.year > -4000 && c.year <= 2026, `año fuera de rango en ${d.id}: ${c.id}`);
  }
}
assert.equal(getDeck('musica').id, 'musica');
assert.equal(getDeck('noexiste').id, DECKS[0].id, 'temática desconocida cae en la primera');

// Barajado determinista
assert.deepEqual(shuffleSeeded([1, 2, 3, 4, 5], 42), shuffleSeeded([1, 2, 3, 4, 5], 42));
assert.notDeepEqual(shuffleSeeded([1, 2, 3, 4, 5], 42), shuffleSeeded([1, 2, 3, 4, 5], 43));
const r = rng(7); const vals = [r(), r(), r()];
assert.ok(vals.every(v => v >= 0 && v < 1));

// Reparto
const cards = getDeck('historia').cards;
const players = ['A', 'B', 'C'];
const { base, hands, pool } = deal(cards, 123, players, 5);
assert.ok(base);
players.forEach(p => assert.equal(hands[p].length, 5));
const repartidas = [base, ...players.flatMap(p => hands[p])];
assert.equal(new Set(repartidas).size, repartidas.length, 'no se reparte la misma carta dos veces');
assert.equal(pool.length, cards.length - 1 - 15);
assert.deepEqual(deal(cards, 123, players, 5), deal(cards, 123, players, 5), 'el reparto es determinista');

// Colocación
const byId = { a: { year: 1900 }, b: { year: 1950 }, c: { year: 2000 }, x: { year: 1930 }, y: { year: 1950 } };
const line = ['a', 'b', 'c'];
assert.equal(isCorrect(line, 'x', 1, byId), true, '1930 va entre 1900 y 1950');
assert.equal(isCorrect(line, 'x', 0, byId), false);
assert.equal(isCorrect(line, 'x', 2, byId), false);
assert.equal(correctSlot(line, 'x', byId), 1);
assert.equal(isCorrect(line, 'y', 1, byId), true, 'mismo año: vale antes');
assert.equal(isCorrect(line, 'y', 2, byId), true, 'mismo año: vale después');
assert.equal(correctSlot(line, 'a', byId), 0);
assert.equal(isCorrect(['a'], 'c', 1, byId), true, 'después del último');

// Partida completa
const st0 = buildState({ cards, seed: 99, players: ['A', 'B'], handSize: 5 });
assert.equal(st0.line.length, 1);
assert.equal(st0.hands.A.length, 5);
assert.equal(st0.current, 'A');
assert.equal(st0.done, false);

const cardA = st0.hands.A[0];
const good = buildState({ cards, seed: 99, players: ['A', 'B'], handSize: 5, moves: [{ from: 'A', card: cardA, at: correctSlot(st0.line, cardA, st0.byId) }] });
assert.equal(good.line.length, 2, 'acierto: la carta entra en la línea');
assert.equal(good.hands.A.length, 4, 'acierto: baja la mano');
assert.equal(good.current, 'B', 'el turno rota');
assert.equal(good.history[0].ok, true);

const wrongAt = correctSlot(st0.line, cardA, st0.byId) === 0 ? 1 : 0;
const bad = buildState({ cards, seed: 99, players: ['A', 'B'], handSize: 5, moves: [{ from: 'A', card: cardA, at: wrongAt }] });
assert.equal(bad.line.length, 1, 'error: la línea no crece');
assert.equal(bad.hands.A.length, 5, 'error: descarta y roba, la mano no baja');
assert.equal(bad.hands.A.includes(cardA), false, 'la carta fallada se descarta');
assert.equal(bad.history[0].ok, false);
assert.equal(bad.poolLeft, st0.poolLeft - 1);

// Jugadas inválidas se ignoran
const cheat = buildState({ cards, seed: 99, players: ['A', 'B'], handSize: 5, moves: [{ from: 'A', card: 'no-existe', at: 0 }] });
assert.equal(cheat.history.length, 0);
assert.equal(cheat.current, 'A');

// Ganar vaciando la mano
let moves = [];
let st = buildState({ cards, seed: 5, players: ['A', 'B'], handSize: 2 });
for (let i = 0; i < 40 && !st.done; i++) {
  const p = st.current;
  const card = st.hands[p][0];
  moves.push({ from: p, card, at: correctSlot(st.line, card, st.byId) });
  st = buildState({ cards, seed: 5, players: ['A', 'B'], handSize: 2, moves });
}
assert.ok(st.done, 'la partida termina si todos aciertan');
assert.deepEqual(st.winner, ['A'], 'gana quien se queda sin cartas primero');
assert.equal(st.hands.A.length, 0);

// Solitario: un solo jugador vacía su mano
let solo = buildState({ cards, seed: 11, players: ['A'], handSize: 3 });
assert.equal(solo.current, 'A');
let smoves = [];
for (let i = 0; i < 10 && !solo.done; i++) { const card = solo.hands.A[0]; smoves.push({ from: 'A', card, at: correctSlot(solo.line, card, solo.byId) }); solo = buildState({ cards, seed: 11, players: ['A'], handSize: 3, moves: smoves }); }
assert.deepEqual(solo.winner, ['A'], 'en solitario se gana al vaciar la mano');
assert.equal(solo.history.length, 3);

assert.equal(yearLabel(1969), '1969');
assert.equal(yearLabel(-753), '753 a.C.');
assert.equal(yearLabel(-753, 'en'), '753 BC');
console.log('engine: todos los tests OK');

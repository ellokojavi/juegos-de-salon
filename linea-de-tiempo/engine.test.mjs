// Ejecutar: node linea-de-tiempo/engine.test.mjs
import assert from 'node:assert/strict';
import { rng, shuffleSeeded, deal, dealShared, isCorrect, correctSlot, buildState, yearLabel, timeLabel, MAX_MOVE_MS } from './engine.js';
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
  moves.push({ from: p, card, at: correctSlot(st.line, card, st.byId), ms: p === 'A' ? 1000 : 2000 });
  st = buildState({ cards, seed: 5, players: ['A', 'B'], handSize: 2, moves });
}
assert.ok(st.done, 'la partida termina si todos aciertan');
assert.equal(st.hands.A.length, 0);
assert.equal(st.hands.B.length, 0, 'B alcanza a jugar su turno de la ronda y también vacía');
assert.deepEqual(st.winner, ['A'], 'empatados a cartas, gana el que respondió más rápido');

// Solitario: un solo jugador vacía su mano
let solo = buildState({ cards, seed: 11, players: ['A'], handSize: 3 });
assert.equal(solo.current, 'A');
let smoves = [];
for (let i = 0; i < 10 && !solo.done; i++) { const card = solo.hands.A[0]; smoves.push({ from: 'A', card, at: correctSlot(solo.line, card, solo.byId) }); solo = buildState({ cards, seed: 11, players: ['A'], handSize: 3, moves: smoves }); }
assert.deepEqual(solo.winner, ['A'], 'en solitario se gana al vaciar la mano');
assert.equal(solo.history.length, 3);

// La ronda se termina antes de cerrar la partida, y el empate lo define el tiempo (D-31)
const dos = { cards, seed: 77, players: ['A', 'B'], handSize: 1 };
const inicio = buildState(dos);
const cA = inicio.hands.A[0];
const jugadaA = { from: 'A', card: cA, at: correctSlot(inicio.line, cA, inicio.byId), ms: 5000 };
const soloA = buildState({ ...dos, moves: [jugadaA] });
assert.equal(soloA.hands.A.length, 0, 'A se quedó sin cartas');
assert.equal(soloA.done, false, 'no termina hasta que B juegue su turno de la ronda');
assert.equal(soloA.current, 'B');

const cB = soloA.hands.B[0];
const slotB = correctSlot(soloA.line, cB, soloA.byId);
const empateBRapido = buildState({ ...dos, moves: [jugadaA, { from: 'B', card: cB, at: slotB, ms: 3000 }] });
assert.equal(empateBRapido.done, true, 'terminada la ronda, se cierra la partida');
assert.deepEqual(empateBRapido.winner, ['B'], 'empate a cartas: gana quien respondió más rápido');
assert.deepEqual(empateBRapido.times, { A: 5000, B: 3000 });

const empateARapido = buildState({ ...dos, moves: [jugadaA, { from: 'B', card: cB, at: slotB, ms: 9000 }] });
assert.deepEqual(empateARapido.winner, ['A'], 'el más rápido es A');

// Si B falla, no empata: se queda con carta y gana A aunque haya sido más lento
const slotMalo = slotB === 0 ? soloA.line.length : 0;
const bFalla = buildState({ ...dos, moves: [jugadaA, { from: 'B', card: cB, at: slotMalo, ms: 10 }] });
assert.equal(bFalla.done, true);
assert.deepEqual(bFalla.winner, ['A'], 'gana el único sin cartas, el tiempo no importa');

// Empate exacto: quedan los dos como ganadores
const empateExacto = buildState({ ...dos, moves: [jugadaA, { from: 'B', card: cB, at: slotB, ms: 5000 }] });
assert.deepEqual(empateExacto.winner, ['A', 'B'], 'mismo tiempo: empate de verdad');

// Una interrupción larga no decide el desempate
const pausa = buildState({ ...dos, moves: [{ ...jugadaA, ms: 60 * 60 * 1000 }, { from: 'B', card: cB, at: slotB, ms: 3000 }] });
assert.equal(pausa.times.A, MAX_MOVE_MS, 'el tiempo por jugada tiene tope');
// Jugadas sin tiempo (partidas viejas guardadas) valen cero, no rompen
const sinMs = buildState({ ...dos, moves: [{ from: 'A', card: cA, at: jugadaA.at }, { from: 'B', card: cB, at: slotB }] });
assert.deepEqual(sinMs.times, { A: 0, B: 0 });
assert.equal(sinMs.done, true);

assert.equal(timeLabel(0), '0s');
assert.equal(timeLabel(48400), '48s');
assert.equal(timeLabel(72000), '1m 12s');
assert.equal(timeLabel(600000), '10m 0s');
assert.equal(timeLabel(59700), '1m 0s', 'redondear no puede dar "60s"');
assert.equal(timeLabel(2400, { decimals: 1 }), '2.4s');
assert.equal(timeLabel(72340, { decimals: 1 }), '1m 12.3s');
assert.equal(timeLabel(1237, { decimals: 2 }), '1.24s');

// --- Pozo común: una sola tira a la vista de todos (D-32) ---
const pozo = { cards, seed: 21, players: ['A', 'B'], handSize: 2, shared: true, visible: 6 };
const rep = dealShared(cards, 21, 6);
assert.equal(rep.table.length, 6);
assert.equal(rep.pool.length, cards.length - 7);
assert.equal(new Set([rep.base, ...rep.table]).size, 7, 'no se repite ninguna carta');

const p0 = buildState(pozo);
assert.equal(p0.shared, true);
assert.equal(p0.target, 2);
assert.deepEqual(p0.table, rep.table);
assert.deepEqual(p0.hands.A, p0.table, 'todos ven la misma tira');
assert.deepEqual(p0.hands.B, p0.table);
assert.deepEqual(p0.scores, { A: 0, B: 0 });

const pc = p0.table[0];
const acierto = { from: 'A', card: pc, at: correctSlot(p0.line, pc, p0.byId), ms: 1000 };
const p1 = buildState({ ...pozo, moves: [acierto] });
assert.equal(p1.table.length, 6, 'la tira mantiene su tamaño');
assert.equal(p1.table.includes(pc), false, 'la carta jugada sale de la tira');
assert.equal(p1.table[5], rep.pool[0], 'la carta nueva entra por el final');
assert.equal(p1.scores.A, 1);
assert.equal(p1.line.length, 2);
assert.equal(p1.done, false, 'falta que B juegue su turno de la ronda');

const malAt = acierto.at === 0 ? p0.line.length : 0;
const p1b = buildState({ ...pozo, moves: [{ from: 'A', card: pc, at: malAt, ms: 1000 }] });
assert.equal(p1b.scores.A, 0, 'fallar no suma');
assert.equal(p1b.table.length, 6, 'al fallar también entra una carta nueva');
assert.equal(p1b.table[5], rep.pool[0]);
assert.equal(p1b.line.length, 1, 'la carta fallada no entra en la línea');

// Meta de 1 carta: los dos llegan en la misma ronda y desempata el tiempo
const meta1 = { ...pozo, handSize: 1 };
const m0 = buildState(meta1);
const cartaA = m0.table[0];
const jA = { from: 'A', card: cartaA, at: correctSlot(m0.line, cartaA, m0.byId), ms: 4000 };
const trasA = buildState({ ...meta1, moves: [jA] });
assert.equal(trasA.scores.A, 1);
assert.equal(trasA.done, false, 'la ronda se termina igual (D-31)');
const cartaB = trasA.table[0];
const jB = { from: 'B', card: cartaB, at: correctSlot(trasA.line, cartaB, trasA.byId), ms: 1500 };
const finPozo = buildState({ ...meta1, moves: [jA, jB] });
assert.equal(finPozo.done, true);
assert.deepEqual(finPozo.winner, ['B'], 'empatados en cartas colocadas, gana el más rápido');
// Si B falla, gana A aunque haya sido más lento
const finSolo = buildState({ ...meta1, moves: [jA, { from: 'B', card: cartaB, at: correctSlot(trasA.line, cartaB, trasA.byId) === 0 ? trasA.line.length : 0, ms: 10 }] });
assert.deepEqual(finSolo.winner, ['A']);

assert.equal(yearLabel(1969), '1969');
assert.equal(yearLabel(-753), '753 a.C.');
assert.equal(yearLabel(-753, 'en'), '753 BC');
console.log('engine: todos los tests OK');

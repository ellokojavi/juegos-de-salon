// Ejecutar: node public/fourth-king/engine.test.mjs — las reglas del Cuarto Rey: mazo, quién toma con cada carta, el cuarto rey y el ranking
import assert from 'node:assert/strict';
import {
  rng, pickWith, pickOther, buildDeck, newGame, fromSaved, currentPlayer, resolveTargets, genderFallback,
  drawCard, isFourthKing, addSips, giftTap, applyGift, nextTurn, finish, ranking, minutesPlayed,
} from './engine.js';
import { GAME_ID, DEFAULT_CONFIG, MIN_PLAYERS, SORBOS, RANKS, CARD_RULES, LOCALES } from './rules.js';

const L = LOCALES.es;
const mesa = (...genders) => genders.map((gender, i) => ({ name: `J${i + 1}`, gender }));
/** Una partida cuyo mazo termina (se saca desde el final) con estas cartas, en este orden. */
function conCartas(players, ...ranks) {
  const s = newGame(players, { random: rng(1), now: 0 });
  s.deck = ranks.slice().reverse().map(rank => ({ rank, suit: '♠', color: 'black' }));
  return s;
}
const opts = { random: rng(3), penitencias: L.penitencias, categorias: L.categorias };

/* ---------- rules.js ---------- */
assert.equal(GAME_ID, 'cuarto-rey', 'el id lo guardan la sesión, el panel y la mesa recordada: no cambia (D-192)');
assert.deepEqual(DEFAULT_CONFIG, { players: MIN_PLAYERS, gender: 'm' });
for (const r of RANKS) assert.ok(CARD_RULES[r], `falta la regla de la carta ${r}`);

/* ---------- el mazo ---------- */
const deck = buildDeck(rng(42));
assert.equal(deck.length, 52, 'naipe inglés sin jokers');
assert.equal(new Set(deck.map(c => c.rank + c.suit)).size, 52, 'sin cartas repetidas');
assert.equal(deck.filter(c => c.rank === 'K').length, 4, 'cuatro reyes');
assert.ok(deck.every(c => c.color === (c.suit === '♥' || c.suit === '♦' ? 'red' : 'black')));
assert.deepEqual(buildDeck(rng(42)), deck, 'misma semilla, mismo mazo');
assert.notDeepEqual(buildDeck(rng(43)), deck, 'otra semilla, otro orden');
assert.ok([rng(7)(), rng(8)()].every(v => v >= 0 && v < 1));

/* ---------- partida nueva ---------- */
const s0 = newGame(mesa('m', 'f', 'x', 'm'), { random: rng(5), now: 1000 });
assert.equal(s0.deck.length, 52);
assert.deepEqual([s0.turn, s0.kings, s0.drawn, s0.finished, s0.victim, s0.current], [0, 0, 0, false, null, null]);
assert.deepEqual(s0.sorbos, [0, 0, 0, 0]);
assert.deepEqual(s0.history, []);
assert.equal(currentPlayer(s0).name, 'J1');

/* ---------- quién toma (D-04, D-05) ---------- */
const s1 = newGame(mesa('m', 'f', 'x', 'f', 'm'), { random: rng(1) });
s1.turn = 0;
assert.deepEqual(resolveTargets(s1, 'all'), [0, 1, 2, 3, 4]);
assert.deepEqual(resolveTargets(s1, 'right'), [1], 'la derecha es el siguiente');
assert.deepEqual(resolveTargets(s1, 'left'), [4], 'la izquierda del primero es el último');
assert.deepEqual(resolveTargets(s1, 'self'), [0]);
assert.deepEqual(resolveTargets(s1, 'men'), [0, 2, 4], '⚧ toma con los hombres');
assert.deepEqual(resolveTargets(s1, 'women'), [1, 2, 3], '⚧ toma con las mujeres');
s1.turn = 4;
assert.deepEqual(resolveTargets(s1, 'right'), [0], 'la derecha del último es el primero');
assert.deepEqual(resolveTargets(s1, 'left'), [3]);

const soloHombres = newGame(mesa('m', 'm', 'm', 'm'), { random: rng(1) });
soloHombres.turn = 2;
assert.deepEqual(resolveTargets(soloHombres, 'women'), [2], 'sin mujeres toma quien sacó');
assert.equal(genderFallback(soloHombres, 'women', [2]), 'f', 'y la pantalla dice que no hay mujeres');
assert.equal(genderFallback(soloHombres, 'men', [0, 1, 2, 3]), null);
assert.equal(genderFallback(soloHombres, 'self', [2]), null, 'el 10 no es un "no hay"');
const unaMujer = newGame(mesa('m', 'm', 'f', 'm'), { random: rng(1) });
unaMujer.turn = 2;
assert.equal(genderFallback(unaMujer, 'women', [2]), null, 'la que sacó es la única mujer: toma porque es mujer');

/* ---------- sacar cartas ---------- */
const s2 = conCartas(mesa('m', 'f', 'x', 'm'), 'A', 'J', 'Q', '2', '3', '10', '5', '7', '4', '8');
const sacar = () => { const c = drawCard(s2, opts); return c; };

let c = sacar();
assert.equal(c.rank, 'A');
assert.deepEqual(s2.sorbos, [2, 2, 2, 2], 'A: todos toman dos');
assert.deepEqual(s2.current.data.targets, [0, 1, 2, 3]);
assert.equal(s2.current.applied, true);
assert.equal(s2.drawn, 1);
assert.deepEqual(s2.history, [{ rank: 'A', suit: '♠', color: 'black', by: 0 }]);
assert.equal(drawCard(s2, opts), null, 'no se saca otra con una carta en la mesa');
assert.equal(s2.drawn, 1);

nextTurn(s2);
assert.equal(s2.turn, 1);
assert.equal(s2.current, null);
c = sacar(); // J: hombres y ⚧
assert.deepEqual(s2.current.data.targets, [0, 2, 3]);
assert.deepEqual(s2.sorbos, [4, 2, 4, 4]);
nextTurn(s2); c = sacar(); // Q: mujeres y ⚧, saca J3
assert.deepEqual(s2.current.data.targets, [1, 2]);
nextTurn(s2); c = sacar(); // 2: la derecha de J4 es J1
assert.equal(s2.turn, 3);
assert.deepEqual(s2.current.data.targets, [0]);
nextTurn(s2);
assert.equal(s2.turn, 0, 'después del último vuelve al primero');
c = sacar(); // 3: la izquierda de J1 es J4
assert.deepEqual(s2.current.data.targets, [3]);
nextTurn(s2); c = sacar(); // 10: toma quien sacó
assert.deepEqual(s2.current.data.targets, [1]);
nextTurn(s2); c = sacar(); // 5: penitencia sorteada del idioma
assert.ok(L.penitencias.includes(s2.current.data.penitencia));
const antes = s2.sorbos.slice();
nextTurn(s2); c = sacar(); // 7: categoría sorteada
assert.ok(L.categorias.includes(s2.current.data.category));
assert.deepEqual(s2.sorbos, antes, 'un minijuego no suma solo: suma quien se marca como perdedor');
addSips(s2, 1);
assert.equal(s2.sorbos[1], antes[1] + SORBOS);
nextTurn(s2); c = sacar(); // 4: Cuenta Cuentos, nada sorteado
assert.deepEqual(s2.current.data, {});
nextTurn(s2); c = sacar(); // 8: se regala
assert.equal(c.rank, '8');
assert.deepEqual(s2.history.map(h => h.by), [0, 1, 2, 3, 0, 1, 2, 3, 0, 1], 'el historial anota quién sacó cada una');

/* ---------- el 8: regalar dos sorbos ---------- */
let g = giftTap([0, 0, 0, 0], 2);
assert.deepEqual(g, { counts: [0, 0, 1, 0], left: 1 });
g = giftTap(g.counts, 2);
assert.deepEqual(g, { counts: [0, 0, 2, 0], left: 0 }, 'los dos al mismo');
g = giftTap(g.counts, 1);
assert.deepEqual(g, { counts: [0, 0, 2, 0], left: 0 }, 'con los dos repartidos, tocar a otro no le suma');
g = giftTap(g.counts, 2);
assert.deepEqual(g, { counts: [0, 0, 0, 0], left: 2 }, 'y tocar al que tenía lo deja en cero');
const s3 = newGame(mesa('m', 'f', 'm', 'f'), { random: rng(1) });
assert.deepEqual(applyGift(s3, [1, 0, 0, 1]), [0, 3], 'devuelve quiénes toman');
assert.deepEqual(s3.sorbos, [1, 0, 0, 1]);

/* ---------- los reyes y el cuarto (D-06) ---------- */
const s4 = conCartas(mesa('m', 'f', 'm', 'f'), 'K', 'K', '9', 'K', 'K', 'A');
for (let k = 1; k <= 3; k++) {
  drawCard(s4, opts);
  if (s4.current.card.rank === '9') { nextTurn(s4); drawCard(s4, opts); }
  assert.equal(s4.current.data.kingNumber, k);
  assert.equal(isFourthKing(s4), false);
  assert.equal(s4.victim, null);
  nextTurn(s4);
}
const quien = s4.turn;
drawCard(s4, opts);
assert.equal(s4.current.data.kingNumber, 4);
assert.equal(isFourthKing(s4), true, 'el cuarto rey termina la partida');
assert.equal(s4.victim, quien, 'quien lo sacó se toma el vaso');
assert.equal(s4.fondos[quien], 1);
finish(s4);
assert.equal(s4.finished, true);
assert.equal(s4.current, null);
assert.equal(drawCard(s4, opts), null, 'terminada no se saca más');
assert.equal(s4.deck.length, 1, 'quedó el As en el mazo');

const vacia = conCartas(mesa('m', 'f', 'm', 'f'));
assert.equal(drawCard(vacia, opts), null, 'sin cartas no se saca');

/* ---------- un mazo entero: siempre termina en el cuarto rey ---------- */
for (let seed = 1; seed <= 30; seed++) {
  const s = newGame(mesa('m', 'f', 'x', 'm', 'f', 'm'), { random: rng(seed) });
  while (!isFourthKing(s)) { assert.ok(drawCard(s, { ...opts, random: rng(seed) })); nextTurn(s); }
  assert.equal(s.kings, 4);
  assert.equal(s.history.length, s.drawn);
  assert.equal(s.deck.length, 52 - s.drawn);
  assert.equal(s.history.at(-1).rank, 'K', 'la última carta que salió es el cuarto rey');
  assert.equal(s.fondos.reduce((a, b) => a + b, 0), 1, 'un solo fondo por partida');
}

/* ---------- el ranking del final ---------- */
const s5 = newGame(mesa('m', 'f', 'm', 'f'), { random: rng(1), now: 0 });
s5.sorbos = [4, 12, 6, 2];
s5.fondos = [0, 0, 0, 1];
assert.deepEqual(ranking(s5).map(p => p.name), ['J2', 'J4', 'J3', 'J1'], 'un fondo vale como diez sorbos');
assert.deepEqual(ranking(s5)[1], { name: 'J4', gender: 'f', i: 3, sorbos: 2, fondos: 1 });
assert.equal(minutesPlayed(s5, 10_000), 1, 'al menos un minuto');
assert.equal(minutesPlayed(s5, 25 * 60_000), 25);

/* ---------- partidas guardadas ---------- */
assert.equal(fromSaved(null), null);
assert.equal(fromSaved({ v: 1, game: 'cuarto-rey' }), null, 'un registro sin partida');
const nueva = fromSaved({ v: 1, mode: 'local', state: { players: mesa('m'), history: [{ rank: 'A' }] } });
assert.deepEqual(nueva.history, [{ rank: 'A' }]);
const antigua = fromSaved({ players: mesa('m', 'f'), deck: [], turn: 1 });
assert.equal(antigua.turn, 1, 'formato antiguo: el estado en la raíz');
assert.deepEqual(antigua.history, [], 'guardada antes del historial (CR-18): se retoma sin él');

/* ---------- el azar ---------- */
const lista = ['a', 'b', 'c'];
assert.ok(lista.includes(pickWith(lista, rng(9))));
for (let i = 0; i < 20; i++) assert.notEqual(pickOther(lista, 'a', rng(i)), 'a', 'otra penitencia es otra');
assert.equal(pickOther(['única'], 'única', rng(1)), 'única', 'con una sola no se cuelga');

console.log('cuarto rey: motor ok');

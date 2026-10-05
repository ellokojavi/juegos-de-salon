/**
 * Cuarto Rey — reglas puras (C-2): el mazo, sacar una carta, a quién le toca tomar, el cuarto rey
 * y el ranking del final. Sin DOM ni estado global; lo prueba node public/fourth-king/engine.test.mjs.
 *
 * Las funciones que cambian la partida modifican el estado que reciben (game.js lo guarda tal cual
 * después de cada acción, C-6). El azar entra por parámetro (`random`, una función que da [0, 1)):
 * en el juego es Math.random y en los tests una semilla (`rng`).
 */
import { SUITS, RANKS, SORBOS, CARD_RULES } from './rules.js';

/** Generador pseudoaleatorio con semilla (mulberry32), para los tests y para repetir un mazo. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uno al azar de la lista. */
export const pickWith = (list, random = Math.random) => list[Math.floor(random() * list.length)];

/** Otro de la lista, distinto del que ya está (si hay más de uno): "otra penitencia", "otra categoría". */
export function pickOther(list, current, random = Math.random) {
  let p;
  do { p = pickWith(list, random); } while (p === current && list.length > 1);
  return p;
}

/** Las 52 cartas (naipe inglés sin jokers), barajadas. Se saca desde el final (`pop`). */
export function buildDeck(random = Math.random) {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit: suit.symbol, color: suit.color });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Partida nueva: `players` es [{ name, gender: 'm' | 'f' | 'x' }], sentados hacia la derecha. */
export function newGame(players, { random = Math.random, now = Date.now() } = {}) {
  return {
    players, deck: buildDeck(random), turn: 0, kings: 0, drawn: 0,
    sorbos: players.map(() => 0), fondos: players.map(() => 0),
    history: [],
    current: null, finished: false, victim: null, startedAt: now,
  };
}

/**
 * Una partida guardada, en la forma de hoy: el estado iba en la raíz en el formato antiguo, y las
 * de antes de la v0.27 no traen historial (CR-18). Devuelve null si no hay partida.
 */
export function fromSaved(data) {
  if (!data) return null;
  const saved = data.state || (data.players ? data : null);
  if (saved && !Array.isArray(saved.history)) saved.history = [];
  return saved;
}

export const currentPlayer = state => state.players[state.turn];

/**
 * Quiénes toman según la regla de la carta (D-04, D-05): la derecha es el siguiente, la izquierda
 * el anterior; ⚧ toma con los hombres y con las mujeres, y si no hay ninguno toma quien sacó.
 */
export function resolveTargets(state, kind) {
  const t = state.turn, total = state.players.length;
  const conGenero = g => state.players.map((p, i) => (p.gender === g || p.gender === 'x') ? i : -1).filter(i => i >= 0);
  switch (kind) {
    case 'all': return state.players.map((_, i) => i);
    case 'right': return [(t + 1) % total];
    case 'left': return [(t - 1 + total) % total];
    case 'self': return [t];
    case 'men': { const r = conGenero('m'); return r.length ? r : [t]; }
    case 'women': { const r = conGenero('f'); return r.length ? r : [t]; }
    default: return [t];
  }
}

/**
 * ¿La J o la Q cayó en quien sacó porque no hay nadie de ese género? Devuelve 'm' o 'f' (para
 * decir "no hay hombres" / "no hay mujeres"), o null si la regla se cumplió como dice.
 */
export function genderFallback(state, ruleTargets, targets) {
  const g = ruleTargets === 'men' ? 'm' : ruleTargets === 'women' ? 'f' : null;
  if (!g || targets.length !== 1 || targets[0] !== state.turn) return null;
  return state.players.some(p => p.gender === g || p.gender === 'x') ? null : g;
}

/**
 * Saca la carta de arriba y aplica lo que es automático (nadie decide nada): los sorbos de una
 * carta de tomar, contar el rey (el cuarto es un fondo para quien lo sacó, D-06) y sortear la
 * penitencia o la categoría. Devuelve la carta, o null si no se puede sacar (ya hay una en la mesa,
 * la partida terminó o se acabó el mazo).
 * `penitencias` y `categorias` son las del idioma: lo sorteado queda guardado en la partida.
 */
export function drawCard(state, { random = Math.random, penitencias = [], categorias = [] } = {}) {
  if (state.current || state.finished || !state.deck.length) return null;
  const card = state.deck.pop();
  state.drawn++;
  state.history.push({ ...card, by: state.turn });
  const data = {};
  state.current = { card, applied: false, data };
  const rule = CARD_RULES[card.rank];
  if (rule.kind === 'drink') {
    const targets = resolveTargets(state, rule.targets);
    targets.forEach(i => { state.sorbos[i] += SORBOS; });
    data.targets = targets;
  } else if (rule.kind === 'king') {
    state.kings++;
    data.kingNumber = state.kings;
    if (state.kings === 4) {
      state.fondos[state.turn]++;
      state.victim = state.turn;
    }
  } else if (rule.kind === 'penitencia') {
    data.penitencia = pickWith(penitencias, random);
  } else if (rule.kind === 'minigame' && rule.game === 'cultura') {
    data.category = pickWith(categorias, random);
  }
  state.current.applied = true;
  return card;
}

/** ¿Salió el cuarto rey? Ahí termina la partida (D-06). */
export const isFourthKing = state => state.kings >= 4;

/** Suma sorbos a un jugador (el que perdió el minijuego, el que se arrugó con la penitencia). */
export function addSips(state, i, n = SORBOS) {
  state.sorbos[i] += n;
}

/**
 * El 8 regala sorbos: tocar a alguien le suma uno; con los dos ya repartidos, tocar a alguien lo
 * deja en cero. Devuelve los conteos nuevos y cuántos quedan por regalar.
 */
export function giftTap(counts, i, total = SORBOS) {
  const next = counts.slice();
  const dados = next.reduce((a, b) => a + b, 0);
  if (dados >= total) next[i] = 0; else next[i]++;
  return { counts: next, left: total - next.reduce((a, b) => a + b, 0) };
}

/** Anota los sorbos regalados y devuelve quiénes toman. */
export function applyGift(state, counts) {
  counts.forEach((c, i) => { state.sorbos[i] += c; });
  return counts.map((c, i) => (c ? i : -1)).filter(i => i >= 0);
}

/** Cierra la carta en juego y le pasa el turno al de la derecha. */
export function nextTurn(state) {
  state.current = null;
  state.turn = (state.turn + 1) % state.players.length;
}

/** Fin de la partida (cuarto rey o mazo vacío). */
export function finish(state) {
  state.finished = true;
  state.current = null;
}

/** El ranking del final: más sorbos primero, y un fondo vale como diez sorbos. */
export function ranking(state) {
  return state.players.map((p, i) => ({ ...p, i, sorbos: state.sorbos[i], fondos: state.fondos[i] }))
    .sort((a, b) => (b.sorbos + b.fondos * 10) - (a.sorbos + a.fondos * 10));
}

/** Minutos que duró la partida, al menos uno. */
export const minutesPlayed = (state, now = Date.now()) => Math.max(1, Math.round((now - state.startedAt) / 60000));

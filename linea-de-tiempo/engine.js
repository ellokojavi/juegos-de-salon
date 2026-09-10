/**
 * Línea de Tiempo — motor puro (sin DOM). Testeable con node.
 *
 * Todo el estado se deriva de la semilla del mazo más la lista de jugadas, así que
 * cada dispositivo llega al mismo resultado sin necesidad de mensajes de respuesta.
 */

/** Generador pseudoaleatorio con semilla (mulberry32): mismo mazo en todos los dispositivos. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Baraja una copia de `arr` de forma determinista a partir de la semilla. */
export function shuffleSeeded(arr, seed) {
  const a = arr.slice();
  const rand = rng(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomSeed() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

/**
 * Reparte el mazo: una carta base para la línea y `handSize` cartas por jugador.
 * Devuelve solo ids, en el orden en que salen del mazo.
 */
export function deal(cards, seed, players, handSize) {
  const order = shuffleSeeded(cards.map(c => c.id), seed);
  const base = order[0];
  const hands = {};
  let i = 1;
  for (const p of players) hands[p] = [];
  for (let k = 0; k < handSize; k++) for (const p of players) hands[p].push(order[i++]);
  return { base, hands, pool: order.slice(i) };
}

/**
 * Reparte para el pozo común: una carta base y `visible` cartas a la vista de todos.
 * El resto queda en el mazo y va entrando por el final a medida que salen (D-32).
 */
export function dealShared(cards, seed, visible) {
  const order = shuffleSeeded(cards.map(c => c.id), seed);
  return { base: order[0], table: order.slice(1, 1 + visible), pool: order.slice(1 + visible) };
}

/**
 * ¿Es correcta la posición `at` para `card` dentro de `line`?
 * `line` son ids ya ordenados por año. `at` va de 0 (antes del primero) a line.length (después del último).
 * Los años iguales se aceptan en cualquier orden entre ellos.
 */
export function isCorrect(line, card, at, byId) {
  const y = byId[card].year;
  const before = at > 0 ? byId[line[at - 1]].year : -Infinity;
  const after = at < line.length ? byId[line[at]].year : Infinity;
  return before <= y && y <= after;
}

/** Posición correcta (la primera que calza) de una carta en la línea. */
export function correctSlot(line, card, byId) {
  const y = byId[card].year;
  let at = 0;
  while (at < line.length && byId[line[at]].year < y) at++;
  return at;
}

/** Tope por jugada: una interrupción larga no debe decidir el desempate (ver D-31). */
export const MAX_MOVE_MS = 5 * 60 * 1000;

/** De los candidatos, los que sumaron menos tiempo respondiendo. */
function fastest(cands, times) {
  const min = Math.min(...cands.map(p => times[p] ?? 0));
  return cands.filter(p => (times[p] ?? 0) === min);
}

/**
 * Reconstruye la partida a partir de la configuración y las jugadas.
 * moves: [{ from, card, at, ms }] en orden. Las inválidas ya vienen filtradas por el reductor.
 * `ms` es lo que tardó el jugador en responder ese turno; sirve para desempatar (D-31).
 */
export function buildState({ cards, seed, players, handSize, moves = [], shared = false, visible = 6 }) {
  const byId = Object.fromEntries(cards.map(c => [c.id, c]));
  // Dos repartos: mano propia por jugador, o una sola tira de cartas a la vista de todos (D-32).
  let table = null, hands = null, base, pool;
  if (shared) ({ base, table, pool } = dealShared(cards, seed, visible));
  else {
    const d = deal(cards, seed, players, handSize);
    base = d.base; pool = d.pool;
    hands = Object.fromEntries(players.map(p => [p, d.hands[p].slice()]));
  }
  let line = [base];
  let poolAt = 0;
  const history = [];
  const times = Object.fromEntries(players.map(p => [p, 0]));
  const scores = Object.fromEntries(players.map(p => [p, 0]));
  let turn = 0;

  for (const mv of moves) {
    const from = shared ? table : hands[mv.from];
    const idx = from.indexOf(mv.card);
    if (idx < 0) continue;                       // no estaba disponible
    from.splice(idx, 1);
    const ok = isCorrect(line, mv.card, mv.at, byId);
    const correctAt = ok ? mv.at : correctSlot(line, mv.card, byId);
    // Vecinos de la ranura correcta y de la elegida, sobre la línea tal como estaba: sirven para explicar el error
    const around = at => [line[at - 1] || null, line[at] || null];
    const entry = { ...mv, ok, correctAt, year: byId[mv.card].year, correctBetween: around(correctAt), placedBetween: around(mv.at) };
    if (ok) {
      line = line.slice(0, mv.at).concat(mv.card, line.slice(mv.at));
      scores[mv.from]++;
    }
    if (shared) {
      // Salga a la línea o se descarte, la carta deja la tira y entra otra por el final
      if (poolAt < pool.length) table.push(pool[poolAt++]);
    } else if (!ok && poolAt < pool.length) {
      hands[mv.from].push(pool[poolAt++]);       // falló: descarta y roba
    }
    history.push(entry);
    times[mv.from] += Number.isFinite(mv.ms) ? Math.max(0, Math.min(mv.ms, MAX_MOVE_MS)) : 0;
    turn = (turn + 1) % players.length;
  }

  const poolLeft = pool.length - poolAt;
  // La ronda se completa antes de terminar: si alguien llega a la meta, los que vienen
  // después en el orden juegan igual su turno y pueden empatarle (D-31).
  const roundDone = moves.length % players.length === 0;
  let winner = null;
  if (shared) {
    const listos = players.filter(p => scores[p] >= handSize);
    if (listos.length && roundDone) winner = fastest(listos, times);
    else if (!table.length) {                    // se acabó el mazo: gana quien colocó más
      const max = Math.max(...players.map(p => scores[p]));
      winner = fastest(players.filter(p => scores[p] === max), times);
    }
    // Todos ven la misma tira; `hands` se mantiene para que la interfaz y el reductor no cambien
    hands = Object.fromEntries(players.map(p => [p, table]));
  } else {
    const empty = players.filter(p => hands[p].length === 0);
    if (empty.length && roundDone) winner = fastest(empty, times);
    else if (poolLeft === 0 && moves.length && players.some(p => hands[p].length > 0)) {
      // El pozo se agotó: gana quien tenga menos cartas (y entre esos, el más rápido)
      const min = Math.min(...players.map(p => hands[p].length));
      const tooLong = moves.length >= players.length * 30;
      if (tooLong) winner = fastest(players.filter(p => hands[p].length === min), times);
    }
  }
  return { byId, line, hands, table, scores, shared, target: handSize, poolLeft, history, times, current: players[turn], winner, done: !!winner };
}

/**
 * Tiempo para mostrar: "48s" o "1m 12s". Con `decimals: 1` muestra décimas ("2.4s"),
 * que es lo que se usa cuando dos jugadores caen en el mismo segundo y hay que
 * mostrar por qué ganó uno (D-31).
 */
export function timeLabel(ms, { decimals = 0 } = {}) {
  const secs = Math.max(0, ms) / 1000;
  const f = 10 ** decimals;
  const r = Math.round(secs * f) / f;
  const m = Math.floor(r / 60);
  const s = r - m * 60;
  return m ? `${m}m ${s.toFixed(decimals)}s` : `${s.toFixed(decimals)}s`;
}

/** Texto del año para mostrar: los negativos son antes de Cristo. */
export function yearLabel(year, lang = 'es') {
  return year < 0 ? `${Math.abs(year)} ${lang === 'es' ? 'a.C.' : 'BC'}` : String(year);
}

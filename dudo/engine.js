/**
 * Dudo — motor puro (sin DOM). Testeable con node.
 *
 * Todo el estado se deriva de la lista de mensajes (C-7). Los dados son lo único que no
 * sale de la semilla: el código es público, así que una semilla compartida dejaría a
 * cualquiera calcular los dados del rival. Cada celular tira los suyos y publica
 * `sha256(dados + sal)`; al dudar se destapan y se verifica (C-10, D-70).
 */

export const PINTAS = [1, 2, 3, 4, 5, 6];
export const DICE_PER_PLAYER = 5;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

/** Tira `n` dados con el azar del navegador. Nunca con semilla: ver la cabecera. */
export function rollDice(n = DICE_PER_PLAYER) {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  // Se descarta el resto alto para que las seis caras salgan igual de seguido
  return Array.from(buf, b => (b % 6) + 1);
}

/**
 * Los dados tal como viajan: "3,3,5,1,6". Van como texto por lo mismo que las posiciones
 * del Ahorcado (D-60): una lista es un tipo más que puede llegar distinto. Devuelve null
 * si no sirve.
 */
export function readDice(raw) {
  if (Array.isArray(raw)) raw = raw.join(',');
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const out = raw.split(',').map(x => Number(x));
  return out.every(n => Number.isInteger(n) && n >= 1 && n <= 6) ? out : null;
}

export const writeDice = dice => dice.join(',');

/** Cuenta la pinta en la mesa. Los ases son comodín salvo que se pidan ases. */
export function countPinta(dice, pinta, { acesWild = true } = {}) {
  return dice.filter(d => d === pinta || (acesWild && pinta !== 1 && d === 1)).length;
}

/* ------------------------------------------------------------------ */
/* Apuestas                                                            */
/* ------------------------------------------------------------------ */

/**
 * La cantidad mínima con que se puede apostar esa pinta encima de `prev`.
 *
 * Subir es más cantidad, o la misma cantidad con pinta mayor. Los ases valen doble en las
 * dos direcciones: entrar cuesta la mitad (de "seis cincos" a "tres ases") y salir cuesta
 * el doble más uno (de "tres ases" a "siete" de lo que sea).
 */
export function minBid(prev, pinta) {
  if (!prev) return 1;
  if (pinta === 1) return prev.p === 1 ? prev.n + 1 : Math.ceil(prev.n / 2);
  if (prev.p === 1) return prev.n * 2 + 1;
  return pinta > prev.p ? prev.n : prev.n + 1;
}

/** ¿La apuesta nueva le gana a la anterior y cabe en la mesa? */
export function bidOk(prev, next, totalDice = Infinity) {
  if (!next || !PINTAS.includes(next.p)) return false;
  if (!Number.isInteger(next.n) || next.n < 1 || next.n > totalDice) return false;
  return next.n >= minBid(prev, next.p);
}

/**
 * Calzar solo se puede cuando la apuesta ya llegó a la mitad de los dados de la mesa.
 * Antes es una apuesta gratis: con muchos dados sin destapar, acertar la cantidad exacta
 * es casi imposible, pero fallar no cuesta lo mismo que arriesgarse a dudar.
 */
export function calzarOk(bid, totalDice) {
  return !!bid && bid.n * 2 >= totalDice;
}

/* ------------------------------------------------------------------ */
/* Probabilidad (la usa el celular para jugar, y la pantalla para ayudar) */
/* ------------------------------------------------------------------ */

function combinations(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

/** P(exactamente k éxitos en n intentos con probabilidad p). */
export function binomExact(k, n, p) {
  if (k < 0 || k > n) return 0;
  return combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

/** P(al menos k éxitos). Con k ≤ 0 es 1: ya están puestos. */
export function binomAtLeast(k, n, p) {
  if (k <= 0) return 1;
  if (k > n) return 0;
  let acc = 0;
  for (let i = k; i <= n; i++) acc += binomExact(i, n, p);
  return Math.min(1, acc);
}

/** Un dado desconocido tapa una pinta normal 1 de cada 3 veces (la pinta o un as). */
export const chanceOf = pinta => (pinta === 1 ? 1 / 6 : 1 / 3);

/**
 * Qué tan creíble es una apuesta para quien tiene `myDice`: la probabilidad de que entre
 * los dados que no ve haya los que faltan. Es lo único que sabe el celular cuando juega.
 */
export function credibility({ myDice, bid, totalDice }) {
  const mine = countPinta(myDice, bid.p);
  const unknown = Math.max(0, totalDice - myDice.length);
  return binomAtLeast(bid.n - mine, unknown, chanceOf(bid.p));
}

/**
 * La jugada del celular. Recibe **solo sus propios dados** y lo que está a la vista: no
 * mira los del rival aunque el aparato los tenga a mano en el modo de un celular.
 */
export function botMove({ myDice, bid, totalDice, canCalzar = false, rand = Math.random }) {
  const unknown = Math.max(0, totalDice - myDice.length);
  const mine = pinta => countPinta(myDice, pinta);

  // Calzar: solo cuando la cantidad exacta es de verdad probable
  if (bid && canCalzar && binomExact(bid.n - mine(bid.p), unknown, chanceOf(bid.p)) > 0.32) {
    return { t: 'calza' };
  }

  // La mejor subida posible: la pinta que deje la apuesta más creíble
  let best = null;
  for (const p of PINTAS) {
    const n = minBid(bid, p);
    if (n > totalDice) continue;
    const chance = binomAtLeast(n - mine(p), unknown, chanceOf(p));
    if (!best || chance > best.chance) best = { t: 'bid', n, p, chance };
  }

  if (bid) {
    const creo = credibility({ myDice, bid, totalDice });
    // Dudar cuando la apuesta que hay es poco creíble y no hay subida cómoda
    if (creo < 0.30 && (!best || best.chance < 0.55)) return { t: 'dudo' };
    if (!best) return { t: 'dudo' };
    // Un farol de vez en cuando: subir una más de la mínima cuando alcanza para creérselo
    if (best.chance > 0.75 && best.n + 1 <= totalDice && rand() < 0.35) best = { ...best, n: best.n + 1 };
    return { t: 'bid', n: best.n, p: best.p };
  }
  // Abre la ronda: sin apuesta que dudar, la apuesta más creíble que tenga
  const abre = best || { t: 'bid', n: 1, p: 6 };
  return { t: 'bid', n: abre.n, p: abre.p };
}

/* ------------------------------------------------------------------ */
/* Estado derivado                                                     */
/* ------------------------------------------------------------------ */

const nextIn = (list, from) => list[(list.indexOf(from) + 1) % list.length];

/**
 * Arma el estado completo de la partida.
 *
 *  players  roles en orden de juego (A, B, …)
 *  config   { dice, calzar }
 *  plays    mensajes en orden: roll | bid | dudo | calza | open
 *
 * Los mensajes que no corresponden —fuera de turno, apuesta que no sube, dados de otro
 * largo— se descartan en silencio, como manda C-7.
 */
export function buildState({ players = [], config = {}, plays = [] } = {}) {
  const perPlayer = config.dice || DICE_PER_PLAYER;
  const st = {};
  players.forEach(p => { st[p] = { dice: perPlayer, out: false }; });

  const aliveNow = () => players.filter(p => !st[p].out);
  const totalNow = () => aliveNow().reduce((a, p) => a + st[p].dice, 0);

  let opener = players[0] || null;
  let round = null;
  const history = [];
  let last = null;

  const nuevaRonda = () => ({
    n: history.length, opener, rolls: {}, bid: null, bids: [],
    end: null, opens: {}, phase: 'roll', current: opener,
  });
  round = nuevaRonda();

  /** Los dados de la ronda que este aparato conoce: del roll en claro o del open. */
  const known = r => {
    const out = {};
    for (const p of aliveNow()) {
      const d = r.rolls[p]?.d || r.opens[p]?.d || null;
      if (d) out[p] = d;
    }
    return out;
  };

  /**
   * Se acabaron las apuestas. Con los dados en claro —un celular, contra el celular— la
   * cuenta sale al tiro; en la sala hay que esperar a que cada uno destape los suyos.
   */
  const cerrar = (r, end) => {
    r.end = end;
    r.phase = 'open';
    if (aliveNow().every(p => known(r)[p])) resolver(r);
  };

  const resolver = r => {
    const dice = known(r);
    const todos = Object.values(dice).flat();
    const count = countPinta(todos, r.bid.p);
    const exact = count === r.bid.n;
    let loser = null, gainer = null;
    if (r.end.type === 'dudo') {
      // Si hay tantos como se apostó o más, se equivocó quien dudó
      loser = count >= r.bid.n ? r.end.by : r.bid.by;
    } else if (exact) {
      gainer = r.end.by;
    } else {
      loser = r.end.by;
    }
    if (loser) st[loser].dice = Math.max(0, st[loser].dice - 1);
    if (gainer) st[gainer].dice = Math.min(perPlayer, st[gainer].dice + 1);
    const fuera = loser && st[loser].dice === 0 ? loser : null;
    if (fuera) st[fuera].out = true;
    last = { n: r.n, type: r.end.type, by: r.end.by, bid: r.bid, count, exact, loser, gainer, fuera, dice };
    history.push(last);
    // Abre la ronda siguiente quien perdió el dado; si se fue, el de al lado
    const vivos = aliveNow();
    const abre = gainer || (loser && !st[loser].out ? loser : null);
    opener = vivos.length ? (abre && vivos.includes(abre) ? abre : (vivos.includes(nextIn(players, loser || r.end.by)) ? nextIn(players, loser || r.end.by) : vivos[0])) : null;
    if (!vivos.includes(opener)) opener = vivos[0] || null;
    round = nuevaRonda();
  };

  for (const play of plays) {
    if (!play || !players.includes(play.from) || st[play.from].out) continue;
    const vivos = aliveNow();
    if (vivos.length < 2) break;

    if (round.phase === 'roll') {
      if (play.t !== 'roll' || round.rolls[play.from]) continue;
      const d = readDice(play.d);
      if (d && d.length !== st[play.from].dice) continue;    // dados de más o de menos
      round.rolls[play.from] = { d, h: play.h || null };
      if (vivos.every(p => round.rolls[p])) { round.phase = 'bid'; round.current = opener; }
      continue;
    }

    if (round.phase === 'bid') {
      if (play.from !== round.current) continue;
      if (play.t === 'bid') {
        const next = { n: Number(play.n), p: Number(play.p) };
        if (!bidOk(round.bid, next, totalNow())) continue;
        round.bid = { ...next, by: play.from };
        round.bids.push(round.bid);
        round.current = nextIn(vivos, play.from);
      } else if (play.t === 'dudo' && round.bid) {
        cerrar(round, { type: 'dudo', by: play.from });
      } else if (play.t === 'calza' && config.calzar !== false && calzarOk(round.bid, totalNow())) {
        cerrar(round, { type: 'calza', by: play.from });
      }
      continue;
    }

    // phase 'open': se esperan los dados de todos para poder contar
    if (play.t !== 'open') continue;
    const d = readDice(play.d);
    if (!d || d.length !== st[play.from].dice) continue;
    round.opens[play.from] = { d, salt: play.salt || null, h: round.rolls[play.from]?.h || null };
    if (aliveNow().every(p => known(round)[p])) resolver(round);
  }

  const vivos = aliveNow();
  const done = vivos.length <= 1 && players.length >= MIN_PLAYERS;
  const totalDice = totalNow();
  // Con la ronda ya resuelta, `current` es de quien abre la siguiente
  const current = done ? null : round.phase === 'bid' ? round.current : null;
  const waiting = done ? []
    : round.phase === 'roll' ? vivos.filter(p => !round.rolls[p])
    : round.phase === 'open' ? vivos.filter(p => !known(round)[p])
    : [];

  return {
    phase: done ? 'done' : round.phase,
    players, st, alive: vivos, totalDice,
    round: round.n, opener, current, waiting,
    rolls: round.rolls, bid: round.bid, bids: round.bids, end: round.end,
    canCalzar: config.calzar !== false && calzarOk(round.bid, totalDice),
    last, history, done,
    winner: done ? (vivos[0] || null) : null,
  };
}

/* ------------------------------------------------------------------ */
/* Anti-trampa (C-10)                                                  */
/* ------------------------------------------------------------------ */

/** SHA-256 en hexadecimal (requiere contexto seguro: https o localhost). */
export async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Sal aleatoria en hexadecimal. */
export function randomSalt(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Los dados que se destaparon, ¿son los que se comprometieron al abrir la ronda? */
export async function verifyOpen({ dice, salt, commit }) {
  if (!commit) return { ok: true, sinHash: true };   // en un celular no hay nada que verificar
  const ok = (await sha256(writeDice(dice) + salt)) === commit;
  return { ok, sinHash: false };
}

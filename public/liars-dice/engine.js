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

/** Con dos jugadores no se puede calzar: hace falta una mesa de tres para arriba (D-71). */
export const MIN_CALZAR = 3;

/**
 * Calzar pide dos cosas: que queden al menos tres jugadores y que la apuesta ya haya llegado
 * a la mitad de los dados de la mesa.
 *
 * Lo de la mitad es porque antes es una apuesta gratis: con muchos dados tapados, acertar la
 * cantidad exacta es casi imposible, pero fallar cuesta lo mismo que dudar mal.
 * Lo de los tres jugadores es porque en un duelo solo hay una mano tapada, así que la cuenta
 * exacta deja de ser un riesgo y pasa a ser aritmética: el que calza ya sabe casi todo.
 */
export function calzarOk(bid, totalDice, jugadores = MIN_CALZAR) {
  return !!bid && jugadores >= MIN_CALZAR && bid.n * 2 >= totalDice;
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
 * Cuánto se arriesga el celular a mentir. El número salió de un torneo contra tres rivales de
 * prueba —uno que solo calcula, uno que supone que tienes lo que cantas y uno que supone lo
 * contrario— y no de la intuición (ver docs/juegos/dudo.md).
 *
 * No es 1 a propósito: con la perilla al tope **nunca** cantaría su pinta más fuerte, que es
 * un patrón tan legible como cantarla siempre. En 0,7 miente dos de cada tres veces que puede,
 * así que ninguna de las dos lecturas le sirve a nadie.
 */
export const AGRESIVIDAD = 0.7;

/**
 * Lo mínimo creíble que puede ser un farol. Mentir no es apostar lo improbable: si la apuesta
 * disfrazada ya es más falsa que cierta, no es un farol, es regalar un dado. Con el umbral en
 * 0,45 el celular perdía veinte puntos contra un rival que solo calcula; subirlo deja el
 * disfraz —cantar una pinta que no tiene— sin pagar por él (ver docs/juegos/dudo.md).
 */
const UMBRAL_FAROL = 0.62;

/**
 * Cada forma de mentir tiene su propio peso, porque no cuestan lo mismo. Abrir la ronda con una
 * pinta que no se tiene es casi gratis —con la mesa entera sin destapar, "un seis" es cierto
 * igual— y ya rompe la lectura. Disfrazar a mitad de ronda es caro: sube la escalera en una
 * pinta donde el celular está flaco y después le toca a él vivir con esa apuesta. Se miden por
 * separado y se pesan por separado (ver docs/juegos/dudo.md).
 */
export const MEZCLA = { abrir: 1, disfraz: 1, apriete: 1 };

/** Uno al azar de la lista, sin salirse aunque `rand()` devuelva 1. */
const unoDe = (lista, rand) => lista[Math.min(lista.length - 1, Math.floor(rand() * lista.length))];

/**
 * La jugada del celular. Recibe **solo sus propios dados** y lo que está a la vista: no
 * mira los del rival aunque el aparato los tenga a mano en el modo de un celular.
 *
 * Miente de tres formas, y las tres tienen su motivo (ver docs/juegos/dudo.md):
 *  - **disfraza la mano**: canta una pinta que no es la más fuerte que tiene, mientras la
 *    apuesta siga siendo creíble. Sin esto el celular es un libro abierto: siempre nombraba la
 *    pinta de la que más tenía, así que dos de cada tres apuestas delataban su mano.
 *  - **aprieta al que va perdiendo**: con uno o dos dados, cada ronda le puede costar la
 *    partida, y una apuesta alta lo obliga a decidir viendo menos mesa que nadie.
 *
 * Lo que **no** hace es exagerar la cantidad por encima de la mínima legal. Era la única mentira
 * que tenía antes, y medida sola gana el 21% de las partidas contra el 46% del celular honesto:
 * subir de más le regala al rival un piso más alto sin comprarle nada a cambio (ver docs/juegos/dudo.md).
 *
 * `rivales` son los dados que le quedan a cada uno de los otros; sin eso no puede saber a
 * quién apretar.
 */
export function botMove({
  myDice, bid, totalDice, canCalzar = false, rivales = [],
  agresividad = AGRESIVIDAD, mezcla = MEZCLA, rand = Math.random,
}) {
  const miente = que => rand() < agresividad * mezcla[que];
  const unknown = Math.max(0, totalDice - myDice.length);
  const mine = pinta => countPinta(myDice, pinta);
  const creer = (n, p) => binomAtLeast(n - mine(p), unknown, chanceOf(p));

  // Calzar: solo cuando la cantidad exacta es de verdad probable
  if (bid && canCalzar && binomExact(bid.n - mine(bid.p), unknown, chanceOf(bid.p)) > 0.32) {
    return { t: 'calza' };
  }

  // Todas las subidas legales, con lo creíble que sería cada una y cuántos tiene en la mano
  const subidas = PINTAS
    .map(p => ({ p, n: minBid(bid, p) }))
    .filter(s => s.n <= totalDice)
    .map(s => ({ ...s, chance: creer(s.n, s.p), tengo: mine(s.p) }));
  const mejor = subidas.reduce((a, b) => (!a || b.chance > a.chance ? b : a), null);
  const apuesta = s => ({ t: 'bid', n: s.n, p: s.p });

  if (!bid) {
    // Abrir con una pinta que no tiene es el farol más barato: nadie puede dudarle todavía,
    // y deja al de al lado midiendo una mano que no existe.
    const disfraz = subidas.filter(s => s.p !== mejor?.p && s.chance > UMBRAL_FAROL);
    if (disfraz.length && miente('abrir')) return apuesta(unoDe(disfraz, rand));
    return mejor ? apuesta(mejor) : { t: 'bid', n: 1, p: 6 };
  }

  const creo = credibility({ myDice, bid, totalDice });
  const rivalMin = rivales.length ? Math.min(...rivales) : myDice.length;
  // Contra la pared se duda antes: con uno o dos dados propios se ve menos mesa, la cuenta de
  // uno vale menos y seguir subiendo es apostar a ciegas.
  const umbral = 0.30 + (myDice.length <= 2 ? 0.15 : 0) - agresividad * 0.05;
  if (creo < umbral && (!mejor || mejor.chance < 0.55)) return { t: 'dudo' };
  if (!mejor) return { t: 'dudo' };

  // Apretar al que va perdiendo
  if (rivalMin <= 2 && miente('apriete')) {
    // La más alta que siga siendo creíble, no la más alta a secas: apretar no es regalar el dado
    const apriete = subidas.filter(s => s.chance > UMBRAL_FAROL).sort((a, b) => b.n - a.n)[0];
    if (apriete) return apuesta(apriete);
  }

  // Disfrazar la mano
  // Cualquier pinta creíble que **no** sea la suya más fuerte: lo que lo delataba no era tener
  // o no tener, era cantar siempre la mejor que tenía.
  const disfraz = subidas.filter(s => s.p !== mejor.p && s.chance > UMBRAL_FAROL);
  if (disfraz.length && miente('disfraz')) return apuesta(unoDe(disfraz, rand));

  return apuesta(mejor);
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
      } else if (play.t === 'calza' && config.calzar !== false && calzarOk(round.bid, totalNow(), vivos.length)) {
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
    canCalzar: config.calzar !== false && calzarOk(round.bid, totalDice, vivos.length),
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

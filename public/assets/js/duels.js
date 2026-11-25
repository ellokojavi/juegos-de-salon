/**
 * Duels (lab flag `rivals`, lab: #seccion-rivals): one player challenges another to a few rounds of
 * one game. Both play the same levels (each round has its seed, as La Copa's days do, D-97), each at
 * their own pace, and the duel lasts three days at most (the owner, 2026-11-22).
 *
 *   duelos/<did>                { a, b, an, bn, f, g, sd: { 0: CODE, … }, gr?: { 0: game, … }, at }
 *                               a challenged b to game `g` in format `f` (FORMATOS: bo3…bo9, pts, pts2…pts9), written once;
 *                               a custom duel's `gr` names each round's game (round i plays gr[i] or g);
 *                               `lv` locks the level of each round whose game has levels (Sudoku 🟢/🔴…),
 *                               chosen by the challenger, so both play the same one (the owner, 2026-11-25)
 *   duelos/<did>/e/<jid>/<i>    when jid began round i, once: a round begun and left counts as 0
 *   duelos/<did>/r/<jid>/<i>    { s, ms, at }: jid's result in round i, once, after it began
 *   jugadorDuelos/<jid>/<did>   when the duel was created: each player's list of duels
 *   duelosRecientes/<did>       when the duel was created: the public list of recent duels (/duels/)
 *
 * Everything that decides a duel is pure (`estado`), so a phone and the tests agree on it: no job
 * closes a duel, its clock does. The rules (firebase/database.rules.json) take a write only from a
 * phone seated as that player (jugadorSeats, D-464) and only before the three days are up.
 */
import { esJid, claveNombre, S_MAX, MS_MAX, TODOTERRENO, SIEMPRE, semana } from './records.js';

export const DURACION = 3 * 86400000;
/**
 * A duel's format: `bo<n>` best of n rounds (odd, 3 to 9), or most points over `pts<n>` rounds (2 to 9;
 * `pts` alone is 3, as the quick duel's). The custom duel picks how to win, then how many rounds (the owner, 2026-11-24).
 */
export const FORMATOS = { bo3: 3, bo5: 5, bo7: 7, bo9: 9, pts2: 2, pts: 3, pts4: 4, pts5: 5, pts6: 6, pts7: 7, pts8: 8, pts9: 9 };
export const esPuntos = f => /^pts\d?$/.test(f || '');
/** The format for a way to win (`'bo'` or `'pts'`) and a number of rounds. */
export const formatoDe = (modo, n) => (modo === 'pts' ? (n === 3 ? 'pts' : `pts${n}`) : `bo${n}`);
export const DID = /^[a-z0-9]{10}$/;
export const esDid = d => typeof d === 'string' && DID.test(d);
const HORA = { '.sv': 'timestamp' };

/** A round's seed: a code as La Copa's (5 letters without I and O, cup/code.js), which the game pages take. */
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const randomSeed = (rand = Math.random) => Array.from({ length: 5 }, () => LETRAS[Math.floor(rand() * LETRAS.length)]).join('');

export function nuevoDid(rand = Math.random) {
  const L = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += L[Math.floor(rand() * L.length)];
  return s;
}

export const rondas = d => FORMATOS[d?.f] || 3;
/** The game round i is played in: the custom duel's own for that round, or the duel's. */
export const roundGame = (d, i) => d?.gr?.[i] || d?.g;
/** The level round i is played at (a game's variant, D-331), or null: the game has none, or the duel is from before `lv`. */
export const roundLevel = (d, i) => d?.lv?.[i] || null;
export const otro = (d, jid) => (d.a === jid ? d.b : d.a);
export const nombreDe = (d, jid) => (d.a === jid ? d.an : d.bn);

/** Who won a round between two results (null: not played): 1 a, -1 b, 0 a tie. */
export function ganaRonda(ra, rb) {
  const sa = ra?.s ?? 0, sb = rb?.s ?? 0;
  if (sa !== sb) return sa > sb ? 1 : -1;
  const ja = ra && !ra.dejada, jb = rb && !rb.dejada;
  if (!ja || !jb) return ja ? 1 : jb ? -1 : 0;
  if (ra.ms !== rb.ms) return ra.ms < rb.ms ? 1 : -1;
  return 0;
}

/**
 * Everything a screen shows about a duel at time `t`, from `me`'s side:
 * { n, mias, suyas, puntos: [yo, el], rondas: ['w'|'l'|'t'|null…], fin, termino, gano: 1|-1|0|null,
 *   turno: the next round I can play or -1, vence }
 * A round counts once both played it, or once the duel is over (an unplayed round is a 0).
 * Best of N ends early when someone holds more than half; points, when both played every round.
 */
export function estado(d, me, t = Date.now()) {
  const n = rondas(d), el = otro(d, me);
  const res = jid => Array.from({ length: n }, (_, i) => d.r?.[jid]?.[i] || (d.e?.[jid]?.[i] != null ? { s: 0, ms: MS_MAX, dejada: true } : null));
  const mias = res(me), suyas = res(el);
  const vence = (d.at || 0) + DURACION;
  const vencido = t >= vence;
  const cuenta = i => vencido || (mias[i] && suyas[i]);
  const rondasV = mias.map((m, i) => (cuenta(i) ? ({ 1: 'w', '-1': 'l', 0: 't' })[ganaRonda(m, suyas[i])] : null));
  const w = rondasV.filter(x => x === 'w').length, l = rondasV.filter(x => x === 'l').length;
  const suma = a => a.reduce((x, r) => x + (r?.s || 0), 0);
  const msSuma = a => a.reduce((x, r) => x + (r && !r.dejada ? r.ms : 0), 0);
  const todas = mias.every(Boolean) && suyas.every(Boolean);
  let termino, gano = null, puntos;
  if (esPuntos(d.f)) {
    puntos = [suma(mias), suma(suyas)];
    termino = vencido || todas;
    if (termino) gano = puntos[0] !== puntos[1] ? Math.sign(puntos[0] - puntos[1]) : Math.sign(msSuma(suyas) - msSuma(mias));
  } else {
    puntos = [w, l];
    const mitad = Math.floor(n / 2) + 1;
    termino = vencido || todas || w >= mitad || l >= mitad;
    if (termino) gano = Math.sign(w - l);
  }
  const turno = termino ? -1 : mias.findIndex(x => !x);
  return { n, mias, suyas, puntos, rondas: rondasV, termino, gano, turno, vence, rival: el, rivalN: nombreDe(d, el) };
}

/** Where a player stands over their finished duels: { g, p, e, pct, racha }. */
export function record(lista, me, t = Date.now()) {
  const fin = lista.map(d => ({ d, e: estado(d, me, t) })).filter(x => x.e.termino).sort((x, y) => y.d.at - x.d.at);
  const g = fin.filter(x => x.e.gano === 1).length, p = fin.filter(x => x.e.gano === -1).length, e = fin.length - g - p;
  let racha = 0;
  for (const x of fin) { if (x.e.gano === 1) racha++; else break; }
  return { g, p, e, pct: g + p ? Math.round((100 * g) / (g + p)) : null, racha };
}

/**
 * The facts of the duels' badges (badges.js): finished duels, won, the longest run of wins, different
 * rivals, the longest run of wins against one same rival (`rivalRun`) and the duels won, each with its
 * rival and games (`wins`: [{ rival, games }], for the champion's badge, which the profile checks). Pure.
 */
export function duelFacts(lista, me, t = Date.now()) {
  const fin = lista.map(d => ({ d, e: estado(d, me, t) })).filter(x => x.e.termino).sort((x, y) => x.d.at - y.d.at);
  let run = 0, bestRun = 0, rivalRun = 0;
  const porRival = {};
  for (const x of fin) {
    run = x.e.gano === 1 ? run + 1 : 0; bestRun = Math.max(bestRun, run);
    const r = (porRival[x.e.rival] = x.e.gano === 1 ? (porRival[x.e.rival] || 0) + 1 : 0);
    rivalRun = Math.max(rivalRun, r);
  }
  const wins = fin.filter(x => x.e.gano === 1)
    .map(x => ({ rival: x.e.rival, games: [...new Set(Array.from({ length: x.e.n }, (_, i) => roundGame(x.d, i)).filter(Boolean))] }));
  return { played: fin.length, won: wins.length, bestRun, rivals: new Set(fin.map(x => x.e.rival)).size, rivalRun, wins };
}

/** The rival I lose to most (at least two duels and more lost than won), or null. */
export function nemesis(lista, me, t = Date.now()) {
  const por = {};
  for (const d of lista) {
    const e = estado(d, me, t);
    if (!e.termino) continue;
    const x = (por[e.rival] ||= { jid: e.rival, n: e.rivalN, g: 0, p: 0 });
    if (e.gano === 1) x.g++; else if (e.gano === -1) x.p++;
  }
  return Object.values(por).filter(x => x.g + x.p >= 2 && x.p > x.g).sort((a, b) => b.p - b.g - (a.p - a.g))[0] || null;
}

/**
 * Every rival I finished a duel with, head to head: [{ jid, n, g, p, e, total, ultimo }], the most
 * played first (then the newest). Pure, so the page and the tests agree.
 */
export function rivalidades(lista, me, t = Date.now()) {
  const por = {};
  for (const d of lista) {
    const e = estado(d, me, t);
    if (!e.termino) continue;
    const x = (por[e.rival] ||= { jid: e.rival, n: e.rivalN, g: 0, p: 0, e: 0, total: 0, ultimo: 0 });
    x.total++;
    if (e.gano === 1) x.g++; else if (e.gano === -1) x.p++; else x.e++;
    if ((d.at || 0) >= x.ultimo) { x.ultimo = d.at || 0; x.n = e.rivalN; }
  }
  return Object.values(por).sort((a, b) => b.total - a.total || b.ultimo - a.ultimo);
}

/**
 * My arch rival: the one I have dueled most (at least three finished duels), the closest record
 * breaking a tie. Can be the same player as the nemesis. Null when there is none yet.
 */
export function archirrival(lista, me, t = Date.now()) {
  return rivalidades(lista, me, t).filter(x => x.total >= 3)
    .sort((a, b) => b.total - a.total || Math.abs(a.g - a.p) - Math.abs(b.g - b.p) || b.ultimo - a.ultimo)[0] || null;
}

/**
 * The statistics of a player's duels: { jugados, g, p, e, pct, racha, mejorRacha, rivales,
 * abiertos, rondasG, rondasP, juego: the game id played most, or null }.
 */
export function estadisticas(lista, me, t = Date.now()) {
  const r = record(lista, me, t), f = duelFacts(lista, me, t);
  let abiertos = 0, rondasG = 0, rondasP = 0;
  const juegos = {};
  for (const d of lista) {
    const e = estado(d, me, t);
    if (!e.termino) { abiertos++; continue; }
    rondasG += e.rondas.filter(x => x === 'w').length;
    rondasP += e.rondas.filter(x => x === 'l').length;
    for (let i = 0; i < e.n; i++) { const g = roundGame(d, i); if (g) juegos[g] = (juegos[g] || 0) + 1; }
  }
  const juego = Object.entries(juegos).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return { jugados: f.played, g: r.g, p: r.p, e: r.e, pct: r.pct, racha: r.racha, mejorRacha: f.bestRun, rivales: f.rivals, abiertos, rondasG, rondasP, juego };
}

/** The game page of a duel's round: the game's own page with the round's seed. */
export function linkRonda(d, i, raiz, path) {
  // `path` is the page of round i's game (roundGame)
  const v = roundLevel(d, i);
  return `${raiz}${path}?seed=${d.sd[i]}&duel=${d.id}&round=${i}${v ? `&mode=${v}` : ''}`;
}

/**
 * The duels of a player, on a store (jugador-firebase.js or the test one): `yo()` is this phone's
 * player. Reads are public; writes need this phone seated as the player.
 */
export function crearDuelos({ almacen, yo, now = () => Date.now(), rand = Math.random }) {
  const leer = async did => { const d = await almacen.get(`duelos/${did}`); return d ? { id: did, ...d } : null; };
  return {
    leer,
    /** My duels, newest first. */
    async mios(jid = yo()?.jid) {
      if (!esJid(jid)) return [];
      const idx = (await almacen.get(`jugadorDuelos/${jid}`)) || {};
      const ids = Object.entries(idx).sort((a, b) => b[1] - a[1]).slice(0, 60).map(([k]) => k).filter(esDid);
      return (await Promise.all(ids.map(leer))).filter(Boolean);
    },
    /** The newest duels of everyone (the /duels/ page's list), newest first. */
    async recientes(n = 12) {
      const idx = (await almacen.recientes?.('duelosRecientes', n)) || {};
      const ids = Object.entries(idx).sort((a, b) => b[1] - a[1]).map(([k]) => k).filter(esDid);
      return (await Promise.all(ids.map(leer))).filter(Boolean);
    },
    /** Challenge `b` (a jid) to `g` in format `f`; `lv`: each round's level (null where its game has none). Returns the duel. */
    async retar({ b, bn, g, f, gr = null, lv = null }) {
      const me = yo();
      if (!me || !esJid(b) || b === me.jid || !FORMATOS[f]) throw Object.assign(new Error('duelo'), { code: 'duelo' });
      const id = nuevoDid(rand);
      const sd = Array.from({ length: FORMATOS[f] }, () => randomSeed(rand));
      const d = { a: me.jid, b, an: me.n, bn: String(bn || '').slice(0, 20) || '?', f, g, sd, at: HORA };
      // A custom duel: each round's game, only when they are not all the same
      if (Array.isArray(gr) && gr.length === sd.length && gr.some(x => x !== g)) d.gr = gr;
      // The level of each round whose game has levels, locked for both players
      if (Array.isArray(lv) && lv.length === sd.length) {
        const niveles = Object.fromEntries(lv.map((v, i) => [i, v]).filter(([, v]) => typeof v === 'string' && /^[a-z]{2,12}$/.test(v)));
        if (Object.keys(niveles).length) d.lv = niveles;
      }
      await almacen.update({ [`duelos/${id}`]: d, [`jugadorDuelos/${me.jid}/${id}`]: HORA, [`jugadorDuelos/${b}/${id}`]: HORA, [`duelosRecientes/${id}`]: HORA });
      return { id, ...d, at: now() };
    },
    /** I began round i: from now on, leaving it counts as a 0. */
    async empezar(did, i) {
      const me = yo();
      if (!me || !esDid(did)) return false;
      if (await almacen.get(`duelos/${did}/e/${me.jid}/${i}`)) return false;
      await almacen.update({ [`duelos/${did}/e/${me.jid}/${i}`]: HORA });
      return true;
    },
    /** My result in round i, once. */
    async anotar(did, i, { s, ms }) {
      const me = yo();
      if (!me || !esDid(did)) return false;
      const r = { s: Math.max(0, Math.min(S_MAX, Math.round(s) || 0)), ms: Math.max(0, Math.min(MS_MAX, Math.round(ms) || 0)), at: HORA };
      await almacen.update({ [`duelos/${did}/r/${me.jid}/${i}`]: r });
      return true;
    },
    /** Players whose name starts with what was typed (as signing in keys names): [{ jid, n }], at most 8. */
    async buscar(nombre) {
      const clave = claveNombre(nombre);
      if (!clave) return [];
      const claves = almacen.porPrefijo ? await almacen.porPrefijo('jugadorNombres', clave, 10).catch(() => null) : null;
      const mapa = claves || { [clave]: (await almacen.get(`jugadorNombres/${clave}`)) || {} };
      const ids = [...new Set(Object.values(mapa).flatMap(x => Object.keys(x || {})))].filter(j => esJid(j) && j !== yo()?.jid);
      return (await Promise.all(ids.slice(0, 8).map(async jid => ({ jid, n: await almacen.get(`jugadores/${jid}/n`) })))).filter(x => x.n);
    },
    /** The players of a cup that have a name and PIN (its rows carry their jid): [{ jid, n }]. */
    async deCopa(code) {
      const ps = (await almacen.get(`torneos/${code}/players`)) || {};
      return Object.values(ps).filter(p => esJid(p?.j) && p.j !== yo()?.jid).map(p => ({ jid: p.j, n: p.name || '?' }));
    },
    /** Players active lately (this week's all-round table, the all-time one when the week is thin), not me: [{ jid, n }]. */
    async activos(n = 10) {
      const leer = p => almacen.top(TODOTERRENO, p, 40).then(x => (x || []).filter(f => esJid(f.jid) && f.jid !== yo()?.jid && f.n)).catch(() => []);
      let filas = await leer(semana(now()));
      if (filas.length < n) filas = [...filas, ...(await leer(SIEMPRE)).filter(f => !filas.some(x => x.jid === f.jid))];
      return filas.slice(0, n).map(f => ({ jid: f.jid, n: f.n }));
    },
  };
}

/**
 * Who to suggest as a rival (the owner: anyone can be challenged, those already played come first):
 * the rivals of my duels, newest first, then the friends of my cups, without repeats or me.
 */
export function sugeridos(lista, me, amigos = {}) {
  const out = [], visto = new Set([me]);
  const poner = (jid, n) => { if (esJid(jid) && !visto.has(jid) && n) { visto.add(jid); out.push({ jid, n }); } };
  for (const d of [...lista].sort((x, y) => y.at - x.at)) poner(otro(d, me), nombreDe(d, otro(d, me)));
  for (const [jid, n] of Object.entries(amigos)) poner(jid, n);
  return out;
}

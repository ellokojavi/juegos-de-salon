/**
 * Generala — reglas puras, sin DOM ni estado global. Ver docs/games/generala.md.
 *
 * Cada uno, en su turno, tira cinco dados hasta tres veces, guardando los que quiera entre tiro y
 * tiro, y anota el resultado en una casilla libre de su planilla (o la tacha con un 0). Después de
 * 11 turnos cada uno, gana el que sumó más. Una generala servida (cinco iguales en el primer tiro)
 * gana la partida al tiro, si la mesa lo juega así y hay más de un jugador.
 *
 * El estado se deriva de la lista de jugadas (C-7): `roll` (los cinco dados después de tirar y qué
 * posiciones se guardaron) y `score` (la casilla elegida). Los puntos los calcula el motor: la
 * jugada solo dice dónde.
 */

export const DADOS = 5;
export const TIROS = 3;
export const MIN_PLAYERS = 2;   // en un celular y en la sala; jugar solo es su propio modo
export const MAX_PLAYERS = 6;

/** Las casillas de la planilla, en su orden: los números arriba y los juegos abajo. */
export const NUMEROS = ['1', '2', '3', '4', '5', '6'];
export const JUEGOS = ['escalera', 'full', 'poker', 'generala', 'doble'];
export const CATEGORIAS = [...NUMEROS, ...JUEGOS];

/** Lo que vale cada juego, y servido (en el primer tiro). La generala vale lo mismo servida. */
export const VALOR = {
  escalera: { normal: 20, servida: 25 },
  full: { normal: 30, servida: 35 },
  poker: { normal: 40, servida: 45 },
  generala: { normal: 50, servida: 50 },
  doble: { normal: 100, servida: 100 },
};

/** Las escaleras: del 1 al 5, del 2 al 6 y del 3 al 6 con el as arriba. */
const ESCALERAS = new Set(['12345', '23456', '13456']);

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

/** Los dados viajan como texto: "31456". */
export const writeDice = d => d.join('');
export function readDice(s) {
  if (typeof s !== 'string' || !/^[1-6]{5}$/.test(s)) return null;
  return [...s].map(Number);
}

/** Qué posiciones se guardaron, como "10100". El primer tiro no guarda nada. */
export const writeKeep = k => k.map(x => (x ? '1' : '0')).join('');
export function readKeep(s) {
  if (typeof s !== 'string' || !/^[01]{5}$/.test(s)) return null;
  return [...s].map(c => c === '1');
}

/** Cuántos dados hay de cada cara: `c[3]` es cuántos treses. */
export function cuentas(dados) {
  const c = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dados) c[d]++;
  return c;
}

/**
 * Tira de nuevo los dados que no se guardaron. `azar` da un número en [0, 1): por defecto el del
 * celular, o el de una semilla (Uno al día), y se consume en orden de posición, así dos jugadores
 * que guardan lo mismo reciben lo mismo.
 */
export function tirar(dados, keep, azar = Math.random) {
  return Array.from({ length: DADOS }, (_, i) => (dados && keep?.[i] ? dados[i] : 1 + Math.floor(azar() * 6)));
}

/* ------------------------------------------------------------------ */
/* Puntos                                                              */
/* ------------------------------------------------------------------ */

export const esEscalera = dados => ESCALERAS.has([...new Set(dados)].sort().join(''));
export const esFull = dados => cuentas(dados).filter(Boolean).sort().join('') === '23';
export const esPoker = dados => Math.max(...cuentas(dados)) >= 4;
export const esGenerala = dados => Math.max(...cuentas(dados)) === 5;

/**
 * Lo que vale anotar `dados` en la casilla `cat`. `servida` es que salió en el primer tiro;
 * `tarjeta` es la planilla del jugador, que la doble generala necesita: solo vale si ya hay una
 * generala anotada con sus 50 (tachada no cuenta).
 */
export function puntos(cat, dados, { servida = false, tarjeta = {} } = {}) {
  if (NUMEROS.includes(cat)) { const n = Number(cat); return n * cuentas(dados)[n]; }
  const vale = VALOR[cat];
  if (!vale) return 0;
  const v = servida ? vale.servida : vale.normal;
  switch (cat) {
    case 'escalera': return esEscalera(dados) ? v : 0;
    case 'full': return esFull(dados) ? v : 0;
    case 'poker': return esPoker(dados) ? v : 0;
    case 'generala': return esGenerala(dados) ? v : 0;
    case 'doble': return esGenerala(dados) && tarjeta.generala > 0 ? v : 0;
    default: return 0;
  }
}

export const total = tarjeta => CATEGORIAS.reduce((s, c) => s + (tarjeta[c] || 0), 0);

/* ------------------------------------------------------------------ */
/* La partida                                                          */
/* ------------------------------------------------------------------ */

/**
 * El estado de la partida a partir de la lista de jugadas. Las jugadas fuera de turno, repetidas o
 * ilegales se descartan (C-7): un tiro de más, un dado guardado que cambió, una casilla ocupada.
 *
 * Devuelve, entre otras cosas, de quién es el turno (`current`), en qué tiro va (`tiro`, 0 antes de
 * tirar), los dados y los guardados, la planilla de cada uno (`st[r].tarjeta`, con su total), lo que
 * valdría cada casilla libre con los dados de ahora (`opciones`), lo anotado (`history`) y, al
 * terminar, `done` y `winners` (más de uno si empatan).
 */
export function buildState({ players, config = {}, plays = [] }) {
  const n = players.length;
  const servidaGana = config.servidaGana !== false && n > 1;
  const st = Object.fromEntries(players.map(r => [r, { tarjeta: {}, total: 0, turnos: 0 }]));
  const history = [];
  let ti = 0, tiro = 0, dados = null, keep = [false, false, false, false, false];
  let done = false, winners = [], servida = null;

  for (const p of plays) {
    if (done) break;
    const current = players[ti % n];
    if (p.from !== current) continue;

    if (p.t === 'roll') {
      if (tiro >= TIROS) continue;
      const nuevos = readDice(p.d);
      const k = tiro === 0 ? [false, false, false, false, false] : readKeep(p.k);
      if (!nuevos || !k) continue;
      // Un guardado tiene que seguir siendo el mismo dado
      if (tiro > 0 && k.some((g, i) => g && nuevos[i] !== dados[i])) continue;
      if (tiro > 0 && k.every(Boolean)) continue;   // no se tira sin soltar ninguno
      dados = nuevos; keep = k; tiro++;
      if (tiro === 1 && servidaGana && esGenerala(dados)) {
        servida = { by: current, dados: dados.slice() };
        done = true; winners = [current];
      }
      continue;
    }

    if (p.t === 'score') {
      const s = st[current];
      if (tiro === 0 || !CATEGORIAS.includes(p.c) || p.c in s.tarjeta) continue;
      const pts = puntos(p.c, dados, { servida: tiro === 1, tarjeta: s.tarjeta });
      s.tarjeta[p.c] = pts;
      s.total += pts;
      s.turnos++;
      history.push({ n: history.length, by: current, c: p.c, pts, dados: dados.slice(), tiro });
      ti++; tiro = 0; dados = null; keep = [false, false, false, false, false];
      if (ti >= n * CATEGORIAS.length) {
        done = true;
        const max = Math.max(...players.map(r => st[r].total));
        winners = players.filter(r => st[r].total === max);
      }
    }
  }

  const current = done ? null : players[ti % n];
  const tarjeta = current ? st[current].tarjeta : {};
  const opciones = current && dados
    ? Object.fromEntries(CATEGORIAS.filter(c => !(c in tarjeta)).map(c => [c, puntos(c, dados, { servida: tiro === 1, tarjeta })]))
    : {};
  return {
    players, st, current, tiro, dados, keep, opciones, history, done, winners, servida,
    // La vuelta en curso (de 1 a 11) y la última anotación, para decir qué pasó
    vuelta: Math.min(CATEGORIAS.length, Math.floor(ti / n) + 1),
    last: history.at(-1) || null,
    turno: current ? st[current].turnos : null,
  };
}

/* ------------------------------------------------------------------ */
/* Ayudas                                                              */
/* ------------------------------------------------------------------ */

/**
 * Uno al día (D-230): la partida de uno llevada a 0–100. Un tercio del total, con tope: 300 puntos
 * ya es una partida excelente (el máximo teórico es 360, con la doble).
 */
export const puntajeDia = totalPartida => Math.max(0, Math.min(100, Math.round(totalPartida / 3)));

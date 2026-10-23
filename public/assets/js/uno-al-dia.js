/**
 * Uno al día (D-230): cada día un juego, el mismo desafío para todos. Lógica pura y la memoria del
 * celular; la pantalla está en `uno-al-dia-ui.js` y en `/today/`. El diseño entero está en
 * docs/UNO-AL-DIA.md.
 *
 * - **El día** es la fecha del jugador (`AAAA-MM-DD`, su medianoche, como Wordle).
 * - **El juego del día** sale de un mazo: se barajan los juegos y salen de a uno por día, sin repetir
 *   hasta que se acaba el mazo; al barajar el siguiente, ninguno vuelve antes de 7 días. Cada juego
 *   dice desde qué fecha entra (`desde`), así uno nuevo se suma en el mazo siguiente y los días que
 *   ya pasaron no cambian.
 * - **El contenido** sale de una semilla de La Copa (5 letras, D-97) que se saca de la fecha: la
 *   misma en todos los celulares, distinta de la de cualquier copa.
 * - **La memoria**: el primer intento de cada día (juego, puntaje y tiempo) y cuántas veces se jugó.
 *   De ahí salen la racha, la mejor racha, el calendario y cómo le va en cada juego.
 */
import { hash32 } from '../../cup/games/semilla.js';
import { rng as mulberry } from './rng.js';
import { semana } from './records.js';
import { param } from './parametros.js';

/** El día n.° 1: el día en que Uno al día salió del laboratorio (D-230). Queda fijo: moverlo cambia el juego de días ya jugados. */
export const LANZAMIENTO = '2026-10-06';

/** El día en que entran El Ahorcado, Batalla Naval y Dudo (PR 2 de Uno al día). */
export const DESDE_GRUPO = '2026-10-07';

/** The day Rutas rotas, Loteo, Pintaminas, Zip, Tango and ¿Dónde queda? enter (D-334): they join the next deck shuffled from then. */
export const DESDE_MAS = '2026-10-16';

/** The day Generala enters (D-247, D-405): the first day of the deck shuffled after it left "Próximamente". */
export const DESDE_GENERALA = '2026-10-23';

/**
 * The day Agentes takes Conexiones' place (D-421): from then on Conexiones does not come out (`hasta`),
 * also if the deck in play still has it, and Agentes joins the next deck shuffled.
 */
export const DESDE_AGENTES = '2026-10-24';

/**
 * Los juegos que pueden salir y la fecha desde la que entran. One that leaves says from which date
 * it no longer comes out (`hasta`): the days before it keep their game. Los solitarios van con su id de La
 * Copa (`cup/games/`); los de grupo, con el de la portada (`games.js`), que es el de su página.
 * Un juego nuevo se agrega con una fecha de hoy en adelante, nunca del pasado: si no, cambiaría
 * el juego de días que alguien ya jugó.
 */
export const JUEGOS_DIA = [
  // The two that only La Copa has carry their name here, so the dice does not load La Copa's rules
  // to say it (D-377); uno-al-dia.test.mjs checks they match juegosCopa()
  { id: 'linea', emoji: '⏳', desde: LANZAMIENTO, name: { es: 'Línea Relámpago', en: 'Timeline Flash', pt: 'Linha Relâmpago', de: 'Blitz-Zeitstrahl' } },
  { id: 'numero', emoji: '🔢', desde: LANZAMIENTO, name: { es: 'Toque y Fama: adivina el número', en: 'Bulls and Cows: Crack the Number', pt: 'Toque e Fama: descubra o número', de: 'Bullen und Kühe: Zahl knacken' } },
  { id: 'conexiones', emoji: '🔗', desde: LANZAMIENTO, hasta: DESDE_AGENTES },
  { id: 'letras', emoji: '🔤', desde: LANZAMIENTO },
  { id: 'anio', emoji: '📅', desde: LANZAMIENTO },
  { id: 'reinas', emoji: '👑', desde: LANZAMIENTO },
  { id: 'desenredo', emoji: '🧶', desde: LANZAMIENTO },
  { id: 'ahorcado', emoji: '🪢', desde: DESDE_GRUPO },
  { id: 'batalla-naval', emoji: '⚓', desde: DESDE_GRUPO },
  { id: 'dudo', emoji: '🎲', desde: DESDE_GRUPO },
  // D-334: the three that left the lab (D-332) and the solo games that were missing, from the next deck on
  { id: 'rutas', emoji: '🚇', desde: DESDE_MAS },
  { id: 'loteo', emoji: '📐', desde: DESDE_MAS },
  { id: 'pintaminas', emoji: '🖌️', desde: DESDE_MAS },
  { id: 'zip', emoji: '〰️', desde: DESDE_MAS },
  { id: 'tango', emoji: '☀️', desde: DESDE_MAS },
  { id: 'donde', emoji: '📍', desde: DESDE_MAS },
  // D-405: Generala, opened from the home page, plays solo with the day's dice (D-247)
  { id: 'generala', emoji: '📝', desde: DESDE_GENERALA },
  // D-421: Agentes, out of the lab in Conexiones' place
  { id: 'agentes', emoji: '🕵️', desde: DESDE_AGENTES },
];
/** Whether a game can come out on a date: it already joined and has not left. */
export const vigente = (j, fecha) => j.desde <= fecha && !(j.hasta && j.hasta <= fecha);
/** Los de grupo: tienen su propio motor y su modo para uno (contra el celular o con su mazo). */
export const GRUPO = ['ahorcado', 'batalla-naval', 'dudo', 'generala'];
export const juegoDia = id => JUEGOS_DIA.find(j => j.id === id) || null;

/**
 * Ningún juego vuelve antes de estos días. Con menos de 9 juegos, dos días menos que los que hay
 * (con 7, cinco días): si no, el mazo saldría siempre en el mismo orden.
 */
export const SIN_REPETIR = 7;

/* ------------------------------------------------------------------ */
/* Fechas                                                              */
/* ------------------------------------------------------------------ */

export const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const dos = n => String(n).padStart(2, '0');

/** La fecha de hoy del jugador, en su zona horaria: `2026-10-05`. */
export function fechaLocal(ms = Date.now()) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

const utc = f => { const [y, m, d] = f.split('-').map(Number); return Date.UTC(y, m - 1, d); };
/** Cuántos días hay de `a` a `b` (negativo si `b` es antes). */
export const diasEntre = (a, b) => Math.round((utc(b) - utc(a)) / 86400000);
/** `fecha` más `n` días. */
export const sumarDias = (f, n) => new Date(utc(f) + n * 86400000).toISOString().slice(0, 10);

/**
 * El número de un día desde el 1 de enero de 1970 (`2026-10-05` → 20731). Así se guarda en Firebase:
 * las reglas lo comparan con la hora del servidor para que nadie anote un día que no es el suyo.
 */
export const numDia = f => Math.round(utc(f) / 86400000);
export const fechaDeNum = n => new Date(n * 86400000).toISOString().slice(0, 10);
/** La semana de una fecha, como período de los rankings (`s2026-41`), sin depender de la zona. */
export const semanaDe = f => semana(utc(f) + 43200000, 'UTC');

/** El número que se comparte: el día del lanzamiento es el n.° 1. */
export const numeroDel = fecha => diasEntre(LANZAMIENTO, fecha) + 1;

/** Cuánto falta para la medianoche del jugador, en ms: el próximo juego. */
export function faltaParaManana(ms = Date.now()) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime() - ms;
}

/* ------------------------------------------------------------------ */
/* El mazo                                                             */
/* ------------------------------------------------------------------ */

const barajar = (xs, r) => {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/**
 * Los juegos de cada día desde el lanzamiento hasta `hasta`, como `{ fecha: id }`. Se arma mazo por
 * mazo: al empezar uno, entran los juegos cuyo `desde` ya llegó, se barajan con la semilla del mazo
 * y cada día sale el primero que no salió en los últimos 7 días (si ninguno cumple, el que hace más
 * tiempo que no sale). Se guarda lo calculado: cada llamada sigue desde donde quedó la anterior.
 */
export function crearCalendario(juegos = JUEGOS_DIA, lanzamiento = LANZAMIENTO) {
  const dias = [];                 // dias[n] = id del día lanzamiento + n
  const ultimo = {};               // id → n del último día que salió
  let mazo = [], ciclo = 0, espera = SIN_REPETIR;
  const siguiente = () => {
    const n = dias.length, fecha = sumarDias(lanzamiento, n);
    // A game that left goes out of the deck in play from its day on
    mazo = mazo.filter(id => vigente(juegos.find(j => j.id === id), fecha));
    if (!mazo.length) {
      const pozo = juegos.filter(j => vigente(j, fecha)).map(j => j.id);
      mazo = barajar(pozo, mulberry(hash32(`uno-al-dia:ciclo:${ciclo++}`)));
      // Con pocos juegos, 7 días obligaría a repetir el mismo orden cada semana: se deja holgura
      espera = Math.max(1, Math.min(SIN_REPETIR, pozo.length - 2));
    }
    let i = mazo.findIndex(id => !(id in ultimo) || n - ultimo[id] >= espera);
    if (i < 0) i = mazo.reduce((m, id, k) => (ultimo[id] < ultimo[mazo[m]] ? k : m), 0);
    const [id] = mazo.splice(i, 1);
    ultimo[id] = n;
    dias.push(id);
  };
  return {
    /** El id del juego de esa fecha, o null antes del lanzamiento. */
    juegoDel(fecha) {
      const n = diasEntre(lanzamiento, fecha);
      if (n < 0) return null;
      while (dias.length <= n) siguiente();
      return dias[n];
    },
  };
}

const CAL = crearCalendario();
/** El id del juego de esa fecha (de La Copa, o de la portada si es de grupo). */
export const juegoDel = fecha => CAL.juegoDel(fecha);

/** Las letras de un código de copa (`cup/engine.js`: sin I ni O). */
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
/** La semilla del contenido de ese día: un código de 5 letras, como el de una copa. */
export function semillaDel(fecha) {
  const r = mulberry(hash32(`uno-al-dia:${fecha}`));
  return Array.from({ length: 5 }, () => LETRAS[Math.floor(r() * LETRAS.length)]).join('');
}

/**
 * Un azar que sale de la semilla del día, para lo que reparte un juego de grupo contra el celular
 * (la flota, los dados de una ronda). `que` lo separa: cada cosa tiene su propia tira de números.
 * Solo para partidas locales: en una sala, la semilla es pública y adelantaría secretos (C-10).
 */
export const azarDel = (semilla, que) => mulberry(hash32(`${semilla}:${que}`));

/* ------------------------------------------------------------------ */
/* Los puntajes de los juegos de grupo (0 a 100)                       */
/* ------------------------------------------------------------------ */

const entre = (x, a, b) => Math.max(a, Math.min(b, x));

/** El Ahorcado: las vidas que quedan llevadas a 100; colgado, 0. El tiempo desempata aparte. */
export function puntajeAhorcado({ vidas, total }) {
  return total > 0 ? Math.round(100 * entre(vidas, 0, total) / total) : 0;
}

/** Las casillas de la flota: con menos disparos no se puede hundir. */
export const CASILLAS_FLOTA = 17;
/**
 * Batalla Naval: ganando, 100 con 17 disparos (sin fallar ninguno) y bajando parejo hasta 40 con
 * los 100 disparos del tablero. Perdiendo, 6 por casilla de barco acertada, hasta 39: siempre
 * menos que ganar.
 */
export function puntajeNaval({ gano, disparos, aciertos }) {
  if (gano) return entre(Math.round(100 - (disparos - CASILLAS_FLOTA) * 60 / (100 - CASILLAS_FLOTA)), 40, 100);
  return entre(6 * aciertos, 0, 39);
}

/** Dudo: ganar vale 60 y cada dado que te queda suma 8; perdiendo, 10 por ronda aguantada, hasta 50. */
export function puntajeDudo({ gano, dados, rondas }) {
  if (gano) return entre(60 + 8 * dados, 60, 100);
  return entre(10 * rondas, 0, 50);
}

/**
 * Dónde va el acceso en la portada: una tarjeta de media fila junto a La Copa (`'card'`, D-239).
 * `?daily=button` lo pone al lado de Juego al azar, como antes, y `?daily=off` no lo pone (para las
 * capturas del README). Los links de antes (`?uad=boton`, `?uad=no`) valen igual (D-266).
 */
export function formaAcceso({ loc = globalThis.location } = {}) {
  try {
    const q = param('daily', loc?.search || '');
    return q === 'button' || q === 'off' ? q : 'card';
  } catch (_) { return 'card'; }
}

/* ------------------------------------------------------------------ */
/* La memoria del celular                                              */
/* ------------------------------------------------------------------ */

export const KEY = 'juegos-de-salon:uno-al-dia';

/** Lo guardado: `{ dias: { fecha: { j, s, ms, at, n } } }`. Si no hay o está roto, vacío. */
export function leer(storage = globalThis.localStorage) {
  try {
    const d = JSON.parse(storage.getItem(KEY));
    return d && typeof d.dias === 'object' && d.dias ? d : { dias: {} };
  } catch (_) { return { dias: {} }; }
}

/**
 * Anota una partida de Uno al día. Solo la primera de cada fecha queda como resultado del día
 * (las siguientes son práctica: el tablero ya se conoce); de todas se cuenta cuántas fueron.
 * Devuelve `{ primera, dia }`.
 */
export function anotar(fecha, { j, s, ms }, { storage = globalThis.localStorage, ahora = Date.now() } = {}) {
  const d = leer(storage);
  const antes = d.dias[fecha];
  const dia = antes ? { ...antes, n: (antes.n || 1) + 1 } : { j, s: Math.round(s) || 0, ms: Math.round(ms) || 0, at: ahora, n: 1 };
  d.dias[fecha] = dia;
  try { storage.setItem(KEY, JSON.stringify(d)); } catch (_) { /* sin memoria: igual se muestra */ }
  return { primera: !antes, dia };
}

/* ------------------------------------------------------------------ */
/* The attempt counts from its start (D-433)                           */
/* ------------------------------------------------------------------ */
/**
 * Without this, a bad first attempt could be dropped (Back, reload) and the same board played
 * again from zero, with the board already known, until one was finished. With a lab key (lab: #seccion-uad-intento; the screens
 * ask `labAccess()`), starting today's first attempt leaves a marker on this phone (and in Firebase
 * with a player, `uno-al-dia-red.js`): a solo game left halfway goes on where it was, a group game
 * left halfway counts 0, and a day that ends with its attempt unfinished counts 0. Only the screens
 * write the marker, so without it everything here does nothing.
 */
export const STARTED_KEY = 'juegos-de-salon:uno-al-dia:empezado';
/** Today's attempt in progress, per game (moves and active time), to go on where it was. */
export const SAVE_PREFIX = 'juegos-de-salon:uno-al-dia:partida:';
/** The most an unfinished attempt is charged: a day. */
const FORFEIT_MS_MAX = 86400000;

/** The marker, `{ fecha, j, at }`, or null. */
export function startedAttempt(storage = globalThis.localStorage) {
  try {
    const x = JSON.parse(storage.getItem(STARTED_KEY));
    return x && FECHA.test(x.fecha || '') && typeof x.j === 'string' ? x : null;
  } catch (_) { return null; }
}

/** Marks the start of the day's first attempt. Not if the day already has its result. */
export function markStarted(fecha, j, { storage = globalThis.localStorage, ahora = Date.now() } = {}) {
  if (leer(storage).dias[fecha]) return false;
  const antes = startedAttempt(storage);
  if (antes?.fecha === fecha) return true;
  try { storage.setItem(STARTED_KEY, JSON.stringify({ fecha, j, at: ahora })); } catch (_) { return false; }
  return true;
}

/** Today's attempt started on this phone and not finished yet, or null. */
export function unfinished(fecha, { storage = globalThis.localStorage } = {}) {
  const s = startedAttempt(storage);
  return s && s.fecha === fecha && !leer(storage).dias[fecha] ? s : null;
}

const saveKey = (fecha, j) => `${SAVE_PREFIX}${fecha}:${j}`;
const forget = (storage, s) => {
  try { storage.removeItem(STARTED_KEY); if (s) storage.removeItem(saveKey(s.fecha, s.j)); } catch (_) { /* sin memoria */ }
};

/**
 * Records 0 for the day's attempt left unfinished, as the day's result (`anotar`): `{ primera, dia }`,
 * or null if the day already had one. `j` and `at` say which game and when, when the marker is not on
 * this phone (it was started on another one, D-433).
 */
export function forfeit(fecha, { j, at, storage = globalThis.localStorage, ahora = Date.now() } = {}) {
  const s = startedAttempt(storage);
  const mio = s?.fecha === fecha ? s : null;
  if (leer(storage).dias[fecha]) { if (mio) forget(storage, mio); return null; }
  const juego = j || mio?.j || juegoDel(fecha);
  // Charged its time so far: never better than an honest 0 that was played to the end
  const ms = Math.min(FORFEIT_MS_MAX, Math.max(dailySave(fecha, juego, { storage }).ms, ahora - (at ?? mio?.at ?? ahora)));
  const r = anotar(fecha, { j: juego, s: 0, ms }, { storage, ahora });
  if (mio) forget(storage, mio);
  return r;
}

/**
 * On any Uno al día screen: a marker whose day already has its result goes, and one from a day
 * that ended unfinished counts 0 for that day. Returns the forfeit, or null.
 */
export function settleStarted({ storage = globalThis.localStorage, ahora = Date.now() } = {}) {
  const s = startedAttempt(storage);
  if (!s) return null;
  if (leer(storage).dias[s.fecha]) { forget(storage, s); return null; }
  return s.fecha < fechaLocal(ahora) ? { fecha: s.fecha, ...forfeit(s.fecha, { storage, ahora }) } : null;
}

/**
 * Today's attempt in progress of a solo game: `{ jugadas, ms, guardar(jugadas, ms), borrar() }`,
 * as El caso's (D-267), so going back to it goes on where it was.
 */
export function dailySave(fecha, j, { storage = globalThis.localStorage } = {}) {
  const k = saveKey(fecha, j);
  let previa = null;
  try { previa = JSON.parse(storage.getItem(k) || 'null'); } catch (_) { /* de cero */ }
  return {
    jugadas: Array.isArray(previa?.jugadas) && previa.jugadas.length ? previa.jugadas : undefined,
    ms: Number(previa?.ms) || 0,
    guardar(jugadas, ms) { try { storage.setItem(k, JSON.stringify({ jugadas: jugadas || [], ms })); } catch (_) { /* sin memoria */ } },
    borrar() { try { storage.removeItem(k); } catch (_) { /* sin memoria */ } },
  };
}

/** Los comodines que se pueden tener a la vez. */
export const COMODINES_MAX = 2;
/** Cada cuántos días jugados seguidos se gana un comodín. */
export const COMODIN_CADA = 7;

/**
 * La racha con sus comodines, recorriendo los días desde el primero jugado hasta hoy (D-230):
 *
 * - Cada día jugado suma uno a la racha; cada 7 días jugados de la misma racha se gana un comodín.
 * - Un día sin jugar gasta un comodín si hay (la racha sigue, sin sumar ese día) o la corta.
 * - Hoy sin jugar todavía no cuenta: la racha se corta recién a medianoche.
 * - `regalos` son las fechas en que se ganó un comodín por invitar (un amigo terminó su primer
 *   Uno al día); también respetan el tope de 2.
 *
 * Devuelve `{ racha, comodines, mejor, salvados, ganados }`: `salvados` son las fechas que salvó un
 * comodín, y `ganados` las fechas en que se ganó uno por racha.
 */
export function recorrer(dias, hoy, { regalos = [] } = {}) {
  const fechas = Object.keys(dias).filter(f => FECHA.test(f) && f <= hoy).sort();
  const porRegalo = {};
  for (const f of regalos) if (FECHA.test(f) && f <= hoy) porRegalo[f] = (porRegalo[f] || 0) + 1;
  const desde = [fechas[0], ...Object.keys(porRegalo)].filter(Boolean).sort()[0];
  const out = { racha: 0, comodines: 0, mejor: 0, salvados: [], ganados: [] };
  if (!desde) return out;
  let seguidos = 0;
  for (let f = desde; f <= hoy; f = sumarDias(f, 1)) {
    if (porRegalo[f]) out.comodines = Math.min(COMODINES_MAX, out.comodines + porRegalo[f]);
    if (dias[f]) {
      out.racha++; seguidos++;
      if (seguidos % COMODIN_CADA === 0 && out.comodines < COMODINES_MAX) { out.comodines++; out.ganados.push(f); }
    } else if (f !== hoy) {
      if (out.racha > 0 && out.comodines > 0) { out.comodines--; out.salvados.push(f); }
      else { out.racha = 0; seguidos = 0; }
    }
    out.mejor = Math.max(out.mejor, out.racha);
  }
  return out;
}

/** La racha que lleva hoy (con sus comodines). */
export const racha = (dias, hoy, extra) => recorrer(dias, hoy, extra).racha;
/** La racha más larga de todas (con sus comodines). */
export const mejorRacha = (dias, hoy = [...Object.keys(dias)].sort().at(-1) || LANZAMIENTO, extra) => recorrer(dias, hoy, extra).mejor;

const promedio = xs => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

/**
 * Cómo le va en cada juego: cuántas veces lo jugó, su promedio, su mejor y los últimos 8 puntajes
 * (del más viejo al más nuevo). `tendencia` compara el promedio de los últimos 3 con el de los 5 de
 * antes (o los que haya): positivo es que va mejorando. Sin al menos 4 partidas, null.
 */
export function porJuego(dias) {
  const por = {};
  for (const f of Object.keys(dias).sort()) {
    const d = dias[f];
    if (!d?.j) continue;
    (por[d.j] ||= []).push(d.s);
  }
  return Object.entries(por).map(([id, xs]) => {
    const ult3 = xs.slice(-3), antes = xs.slice(-8, -3);
    return {
      id, n: xs.length, promedio: promedio(xs), mejor: Math.max(...xs), ultimos: xs.slice(-8),
      ultimos3: promedio(ult3), antes: promedio(antes),
      tendencia: xs.length >= 4 ? promedio(ult3) - promedio(antes) : null,
    };
  }).sort((a, b) => b.n - a.n || (a.id < b.id ? -1 : 1));
}

/** Todo lo que muestra la pantalla, de una vez. */
export function estado({ storage = globalThis.localStorage, ahora = Date.now() } = {}) {
  const hoy = fechaLocal(ahora);
  // A day that ended with its attempt unfinished counts 0 before the streak is counted (D-433)
  settleStarted({ storage, ahora });
  const d = leer(storage);
  const r = recorrer(d.dias, hoy, { regalos: d.regalos || [] });
  return {
    hoy, numero: numeroDel(hoy), juego: juegoDel(hoy), dia: d.dias[hoy] || null,
    // Today's first attempt started and left unfinished (D-433): the way in goes straight to it
    inProgress: !!unfinished(hoy, { storage }),
    racha: r.racha, mejor: r.mejor, comodines: r.comodines, salvados: r.salvados, ganados: r.ganados,
    jugados: Object.keys(d.dias).length, dias: d.dias,
  };
}

/**
 * Junta lo que viene de Firebase (el historial del jugador, de cualquier celular, y los comodines
 * por invitar) con lo del celular. Lo del celular manda en un día que está en los dos: es el mismo
 * primer intento. Devuelve lo que quedó.
 */
export function juntar({ dias = {}, regalos = null } = {}, { storage = globalThis.localStorage } = {}) {
  const d = leer(storage);
  for (const [f, x] of Object.entries(dias)) if (FECHA.test(f) && !d.dias[f] && x?.j) d.dias[f] = { j: x.j, s: x.s || 0, ms: x.ms || 0, at: x.at || 0, n: 1 };
  if (regalos) d.regalos = [...new Set(regalos.filter(f => FECHA.test(f)))].sort();
  try { storage.setItem(KEY, JSON.stringify(d)); } catch (_) { /* sin memoria */ }
  return d;
}

/**
 * Dónde se juega el de hoy, desde la raíz del sitio: la página del juego (`queens/?today`,
 * `hangman/?today`) o, si no tiene (Línea Relámpago, el número), la genérica
 * (`cup/suelto/?timeline-flash&today`). `slugs` es `{ id: carpeta }` de los sueltos y de los juegos
 * de la portada, y `sinPagina`, el nombre en la URL de los que no tienen (games.js, D-266).
 */
export const rutaDel = (id, slugs, sinPagina = {}) => (slugs[id] ? `${slugs[id]}/?today` : `cup/suelto/?${sinPagina[id] || id}&today`);

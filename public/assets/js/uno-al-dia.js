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
import { rng as mulberry } from '../../timeline/engine.js';
import { envOf } from './transport/stats.js';

/** El día n.° 1. Mientras esté en el laboratorio se puede mover; al salir queda fijo. */
export const LANZAMIENTO = '2026-10-05';

/** El día en que entran El Ahorcado, Batalla Naval y Dudo (PR 2 de Uno al día). */
export const DESDE_GRUPO = '2026-10-07';

/**
 * Los juegos que pueden salir y la fecha desde la que entran. Los solitarios van con su id de La
 * Copa (`cup/games/`); los de grupo, con el de la portada (`games.js`), que es el de su página.
 * Un juego nuevo se agrega con una fecha de hoy en adelante, nunca del pasado: si no, cambiaría
 * el juego de días que alguien ya jugó.
 */
export const JUEGOS_DIA = [
  { id: 'linea', emoji: '⏳', desde: LANZAMIENTO },
  { id: 'numero', emoji: '🔢', desde: LANZAMIENTO },
  { id: 'conexiones', emoji: '🔗', desde: LANZAMIENTO },
  { id: 'letras', emoji: '🔤', desde: LANZAMIENTO },
  { id: 'anio', emoji: '📅', desde: LANZAMIENTO },
  { id: 'reinas', emoji: '👑', desde: LANZAMIENTO },
  { id: 'desenredo', emoji: '🧶', desde: LANZAMIENTO },
  { id: 'ahorcado', emoji: '🪢', desde: DESDE_GRUPO },
  { id: 'batalla-naval', emoji: '⚓', desde: DESDE_GRUPO },
  { id: 'dudo', emoji: '🎲', desde: DESDE_GRUPO },
];
/** Los de grupo: tienen su propio motor y su modo para uno (contra el celular o con su mazo). */
export const GRUPO = ['ahorcado', 'batalla-naval', 'dudo'];
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
    if (!mazo.length) {
      const pozo = juegos.filter(j => j.desde <= fecha).map(j => j.id);
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

/* ------------------------------------------------------------------ */
/* El laboratorio                                                      */
/* ------------------------------------------------------------------ */

/**
 * Mientras se prueba, Uno al día se ve en el sitio local y en los celulares que lo activan en
 * `/labs/` (como los avisos y los rankings, D-212, D-223).
 */
export const UNO_AL_DIA_EN_LABS = true;
export const LABS_UNO_AL_DIA_KEY = 'juegos-de-salon:labs-uno-al-dia';
export function unoAlDiaVisible({ storage = globalThis.localStorage, loc = globalThis.location } = {}) {
  if (!UNO_AL_DIA_EN_LABS) return true;
  try { return envOf(loc || {}) === 'dev' || storage.getItem(LABS_UNO_AL_DIA_KEY) === '1'; } catch (_) { return false; }
}
export function activarUnoAlDia(si, storage = globalThis.localStorage) {
  try { if (si) storage.setItem(LABS_UNO_AL_DIA_KEY, '1'); else storage.removeItem(LABS_UNO_AL_DIA_KEY); } catch (_) { /* sin memoria */ }
}

/**
 * Dónde va el acceso en la portada. Lo elegido es al lado de Juego al azar (`'boton'`); la otra
 * forma, una tarjeta de media fila junto a La Copa (`'tarjeta'`), se puede probar desde `/labs/`
 * en un celular, o con `?uad=tarjeta`. `?uad=no` no lo pone.
 */
export const LABS_FORMA_KEY = 'juegos-de-salon:labs-uno-al-dia-forma';
export function formaAcceso({ storage = globalThis.localStorage, loc = globalThis.location } = {}) {
  try {
    const q = new URLSearchParams(loc?.search || '').get('uad');
    // `?uad=no` lo esconde: las capturas del README se sacan en el sitio local, donde se ve sin /labs/
    if (q === 'tarjeta' || q === 'boton' || q === 'no') return q;
    return storage.getItem(LABS_FORMA_KEY) === 'tarjeta' ? 'tarjeta' : 'boton';
  } catch (_) { return 'boton'; }
}
export function elegirForma(forma, storage = globalThis.localStorage) {
  try { if (forma === 'tarjeta') storage.setItem(LABS_FORMA_KEY, 'tarjeta'); else storage.removeItem(LABS_FORMA_KEY); } catch (_) { /* sin memoria */ }
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

/**
 * La racha que lleva hoy: los días seguidos jugados hasta hoy. Si hoy todavía no juega, la de
 * ayer sigue viva (se corta recién a medianoche).
 */
export function racha(dias, hoy) {
  let f = dias[hoy] ? hoy : sumarDias(hoy, -1), n = 0;
  while (dias[f]) { n++; f = sumarDias(f, -1); }
  return n;
}

/** La racha más larga de todas. */
export function mejorRacha(dias) {
  const fechas = Object.keys(dias).filter(f => FECHA.test(f)).sort();
  let mejor = 0, n = 0, prev = null;
  for (const f of fechas) {
    n = prev && diasEntre(prev, f) === 1 ? n + 1 : 1;
    mejor = Math.max(mejor, n);
    prev = f;
  }
  return mejor;
}

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
  const { dias } = leer(storage);
  return {
    hoy, numero: numeroDel(hoy), juego: juegoDel(hoy), dia: dias[hoy] || null,
    racha: racha(dias, hoy), mejor: mejorRacha(dias), jugados: Object.keys(dias).length, dias,
  };
}

/**
 * Dónde se juega el de hoy, desde la raíz del sitio: la página del juego (`queens/?hoy`,
 * `hangman/?hoy`) o, si no tiene (Línea Relámpago, el número), la genérica (`cup/suelto/?linea&hoy`).
 * `slugs` es `{ id: carpeta }` de los sueltos y de los juegos de la portada (games.js).
 */
export const rutaDel = (id, slugs) => (slugs[id] ? `${slugs[id]}/?hoy` : `cup/suelto/?${id}&hoy`);

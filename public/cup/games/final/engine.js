/**
 * 🏁 La Gran Final — motor puro. One round per game of the week, in the order they were played
 * (D-418), each from 0 to 100; it counts double in the table. The five games with a short version
 * (`SHORT`) play it; any other game is played whole, with content of its own for the final day.
 * Finals that opened before D-418, and the final played outside a cup, keep the five fixed rounds.
 */
import * as linea from '../timeline/engine.js';
import * as numero from '../number/engine.js';
import * as reinas from '../queens/engine.js';
import * as letras from '../word/engine.js';
import * as anio from '../year/engine.js';
import { temasDeLaCopa } from '../mazos.js';
import { diaDeCal, FIXED_FINAL } from '../../engine.js';

/** The five fixed rounds (before D-418, and outside a cup). */
export const RONDAS = FIXED_FINAL;
/** The games that have a short version for the final. */
export const SHORT = ['linea', 'numero', 'reinas', 'letras', 'anio'];
export const EMOJI = {
  linea: '⏳', numero: '🔢', conexiones: '🔗', reinas: '👑', letras: '🔤', anio: '📅', zip: '〰️', tango: '☀️',
  donde: '📍', caso: '🔍', desenredo: '🧶', rutas: '🚇', loteo: '📐', pintaminas: '🖌️', agentes: '🕵️', puentes: '🚂',
};

export const NUMERO_CIFRAS = 3;
export const NUMERO_INTENTOS = 7;
export const LETRAS_INTENTOS = 6;

/**
 * `lang`: el idioma de los textos; `palabras`: el de la palabra secreta, el de la copa (D-170).
 * `rondas`: the final's rounds as calendar entries (`finalRounds(meta)`); without it, the five fixed ones.
 * `otro(id, { variante, ... })`: builds a game without a short version (the registry passes it,
 * since this engine cannot import it without a cycle).
 * `enteras`: every game is played whole, none in its short version (a weekend cup's day of three, D-439).
 * Returns `{ rondas: [ids], <id>: content, ... }`, and `enteras: true` when asked.
 */
export function generar(codigo, dia, { lang = 'es', palabras = lang, aud = null, rondas = RONDAS, otro = null, enteras = false } = {}) {
  const tema = temasDeLaCopa(codigo, { aud }).final;
  const corta = {
    linea: () => linea.generar(codigo, dia, { n: 4, tema, sal: 'final-linea', lang, aud }),
    numero: () => numero.generar(codigo, dia, { cifras: NUMERO_CIFRAS, sal: 'final-numero' }),
    reinas: () => reinas.generar(codigo, dia, { n: 6, sal: 'final-reinas' }),
    letras: () => letras.generar(codigo, dia, { max: LETRAS_INTENTOS, sal: 'final-letras', palabras, aud }),
    anio: () => anio.generar(codigo, dia, { n: 2, tema, sal: 'final-anio', lang, aud }),
  };
  const out = { rondas: [], ...(enteras ? { enteras: true } : {}) };
  for (const x of rondas) {
    const { id, variante } = diaDeCal(x);
    if (out[id]) continue;
    if (corta[id] && !enteras) out[id] = corta[id]();
    else if (otro) out[id] = otro(id, { lang, palabras, aud, variante });
    else continue;
    out.rondas.push(id);
  }
  return out;
}

/** De 0 a 100 por ronda corta, a partir del estado de cada motor. */
export const puntosRonda = {
  linea: e => Math.round((100 * e.aciertos) / e.marcas.length || 0),
  numero: e => (e.resuelto ? Math.max(10, 100 - 15 * (e.usados - 1)) : 0),
  reinas: e => (e.fin && !e.rendido ? 100 : 0), // sin castigo por error (D-107); el tiempo de la final desempata
  letras: e => letras.puntaje(e), // las mismas famas y el mismo bono del día (D-108)
  anio: e => Math.round(e.total / e.filas.length || 0),
};

/**
 * A final's result is `{ rondas: [ids], pts: { <id>: 0..100 } }`, the rounds finished so far in `pts`.
 * De 0 a 100 (D-113): the average of all its rounds; one not played counts 0.
 */
export const puntaje = ({ rondas = RONDAS, pts = {} } = {}) => (rondas.length ? Math.round(rondas.reduce((s, r) => s + (pts[r] || 0), 0) / rondas.length) : 0);

/**
 * The running score between rounds (D-417): the average of the rounds played so far, from 0 to 100,
 * on the same scale as the result. After the last round it equals `puntaje`.
 */
export const puntajeParcial = ({ pts = {} } = {}) => {
  const hechas = Object.values(pts);
  return hechas.length ? Math.round(hechas.reduce((s, x) => s + x, 0) / hechas.length) : 0;
};

export const tarjeta = ({ rondas = RONDAS, pts = {} } = {}) => rondas.map(r => `${EMOJI[r] || '🏁'}${pts[r] || 0}`).join(' ');

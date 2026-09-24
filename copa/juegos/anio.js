/**
 * 📅 ¿En qué año? — motor puro. Seis hitos de una temática distinta a la de la línea, y se
 * escribe el año. Cada hito da hasta 100 puntos; el margen crece con la antigüedad.
 */
import { azar } from './semilla.js';
import { cartas, temasDeLaCopa, mazo } from './mazos.js';

export const HITOS = 6;
/** Año de referencia fijo, no el de hoy: el puntaje no puede cambiar según cuándo se calcule. */
export const REFERENCIA = 2026;

export function generar(codigo, dia, { n = HITOS, tema, sal = 'anio' } = {}) {
  const deck = tema || temasDeLaCopa(codigo).anio;
  const a = azar(codigo, dia, sal);
  return { tema: deck, temaNombre: mazo(deck).name.es, temaEmoji: mazo(deck).emoji, hitos: cartas(a, deck, n) };
}

/**
 * El margen: equivocarse por 5 años en 1990 es mucho; en el año 476, casi nada. Con este
 * margen, a los `margen` años de distancia ya no hay puntos.
 */
export const margen = year => Math.max(8, Math.round((REFERENCIA - year) / 4));

export function puntos(year, respuesta) {
  const d = Math.abs(Number(respuesta) - year);
  if (!Number.isFinite(d)) return 0;
  return Math.max(0, Math.round(100 * (1 - d / margen(year))));
}

/** 🎯 exacto · 🟩 cerca · 🟨 más o menos · 🟧 lejos · ⬛ muy lejos. */
export function marca(year, respuesta) {
  if (Number(respuesta) === year) return '🎯';
  const p = puntos(year, respuesta);
  return p >= 80 ? '🟩' : p >= 50 ? '🟨' : p >= 20 ? '🟧' : '⬛';
}

export function estado(p, respuestas) {
  const filas = respuestas.map((r, i) => ({ hito: p.hitos[i], r, pts: puntos(p.hitos[i].year, r) }));
  return { filas, fin: filas.length >= p.hitos.length, actual: p.hitos[filas.length] || null, total: filas.reduce((s, f) => s + f.pts, 0) };
}

/** De 0 a 100 (D-113): el promedio de los hitos, que valen hasta 100 cada uno. */
export const puntaje = e => (e.filas.length ? Math.round(e.total / e.filas.length) : 0);

export const tarjeta = e => e.filas.map(f => marca(f.hito.year, f.r)).join('');

/**
 * El año como se escribe: los negativos son antes de Cristo. El teclado acepta hasta cuatro
 * cifras y un botón "a. C." (algunos hitos de Historia son de antes de Cristo).
 */
export const anioLabel = y => (y < 0 ? `${-y} a. C.` : String(y));

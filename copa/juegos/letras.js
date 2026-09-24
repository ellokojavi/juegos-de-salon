/**
 * 🔤 Toque y Fama: Palabra — motor puro. Una palabra secreta de cinco letras distintas, la
 * misma para todos. Cada intento (cinco letras distintas, sin diccionario) responde famas y
 * toques como Toque y Fama, y además marca cada letra: así se juega como Wordle sobre la
 * pantalla de Toque y Fama.
 */
import { azar } from './semilla.js';
import { PALABRAS } from './palabras.js';

export const LARGO = 5;
export const MAX_INTENTOS = 8;
export const ALFABETO = 'QWERTYUIOPASDFGHJKLÑZXCVBNM'.split('');

export function generar(codigo, dia, { max = MAX_INTENTOS, sal = 'letras' } = {}) {
  const a = azar(codigo, dia, sal);
  return { largo: LARGO, max, secreto: a.uno(PALABRAS) };
}

export const valido = v => typeof v === 'string' && v.length === LARGO && new Set(v).size === LARGO && [...v].every(l => ALFABETO.includes(l));
export const puede = (v, l) => v.length < LARGO && !v.includes(l);

/** Famas, toques y la marca de cada letra: 'f' (fama), 't' (toque) o '-' (no está). */
export function responder(intento, secreto) {
  const marcas = [...intento].map((l, i) => (secreto[i] === l ? 'f' : secreto.includes(l) ? 't' : '-'));
  return { famas: marcas.filter(m => m === 'f').length, toques: marcas.filter(m => m === 't').length, marcas };
}

export function estado(p, intentos) {
  const filas = intentos.map(v => ({ v, ...responder(v, p.secreto) }));
  const resuelto = filas.some(f => f.famas === p.largo);
  // Los lugares donde alguna vez hubo fama: cada uno suma una sola vez, aunque se repita (D-108)
  const lugares = new Set(filas.flatMap(f => f.marcas.flatMap((m, i) => (m === 'f' ? [i] : []))));
  return { filas, resuelto, fin: resuelto || filas.length >= p.max, usados: filas.length, encontradas: lugares.size };
}

/**
 * De 0 a 100 (D-108): 10 por cada letra encontrada en su lugar, una sola vez por lugar (hasta 50),
 * y si la sacas, 50 más menos 5 por cada intento después del primero. Así quien se acercó gana
 * más que quien no, y quien la sacó (65 como mínimo) siempre gana más que quien no (50 como máximo).
 */
export const PUNTOS_FAMA = 10;
export const bono = usados => 50 - 5 * (usados - 1);
export const puntaje = e => PUNTOS_FAMA * (e.encontradas || 0) + (e.resuelto ? bono(e.usados) : 0);

/** Una fila por intento: 🟨 fama, 🟦 toque, ⬛ no está. Los colores de las pistas de Toque y Fama. */
export const tarjeta = e => e.filas.map(f => f.marcas.map(m => (m === 'f' ? '🟨' : m === 't' ? '🟦' : '⬛')).join('')).join('\n');

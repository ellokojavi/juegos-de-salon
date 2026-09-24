/**
 * 🔤 Toque y Fama con letras — motor puro. Una palabra secreta de cinco letras distintas, la
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
  return { filas, resuelto, fin: resuelto || filas.length >= p.max, usados: filas.length };
}

/** 9 menos los intentos si la sacó (de 8 a 1); 0 si no. */
export const puntaje = e => (e.resuelto ? MAX_INTENTOS + 1 - e.usados : 0);

/** Una fila por intento: 🟨 fama, 🟦 toque, ⬛ no está. Los colores de las pistas de Toque y Fama. */
export const tarjeta = e => e.filas.map(f => f.marcas.map(m => (m === 'f' ? '🟨' : m === 't' ? '🟦' : '⬛')).join('')).join('\n');

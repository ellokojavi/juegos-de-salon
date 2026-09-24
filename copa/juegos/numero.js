/**
 * 🔢 El Número del Día — motor puro. Toque y Fama de un solo lado: el número lo pone la
 * semilla, así que es el mismo para todos, y cada intento se responde con el motor del juego.
 */
import { score, isValid } from '../../toque-y-fama/engine.js';
import { azar } from './semilla.js';

export const CIFRAS = 4;
export const MAX_INTENTOS = 10;

/** El número secreto del día: `cifras` cifras distintas (puede empezar con cero). */
export function generar(codigo, dia, { cifras = CIFRAS, sal = 'numero' } = {}) {
  const a = azar(codigo, dia, sal);
  return { cifras, secreto: a.barajar(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']).slice(0, cifras).join('') };
}

export const valido = (valor, cifras = CIFRAS) => isValid(valor, cifras);

/** La respuesta a un intento: { famas, toques }. */
export const responder = (intento, secreto) => score(intento, secreto);

/** El estado a partir de la lista de intentos. */
export function estado(p, intentos, max = MAX_INTENTOS) {
  const filas = intentos.map(v => ({ v, ...responder(v, p.secreto) }));
  const resuelto = filas.some(f => f.famas === p.cifras);
  return { filas, resuelto, fin: resuelto || filas.length >= max, usados: filas.length };
}

/** Puntaje del día: 11 menos los intentos si lo sacó; 0 si no (de 1 a 10 intentos → 10 a 1). */
export const puntaje = (e, max = MAX_INTENTOS) => (e.resuelto ? max + 1 - e.usados : 0);

/** Cada intento es una fila: 🟢 por fama, 🟡 por toque y ⚪ por el resto. Nunca las cifras. */
export function tarjeta(e) {
  return e.filas.map(f => '🟢'.repeat(f.famas) + '🟡'.repeat(f.toques) + '⚪'.repeat(Math.max(0, f.v.length - f.famas - f.toques))).join('\n');
}

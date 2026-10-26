/**
 * 🔢 El Número del Día — motor puro. Toque y Fama de un solo lado: el número lo pone la
 * semilla, así que es el mismo para todos, y cada intento se responde con el motor del juego.
 */
import { score, isValid } from '../../../bulls-and-cows/engine.js';
import { azar } from '../semilla.js';

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

/**
 * Did the earlier clues already rule this guess out (D-453)? It does not look at the secret, only at
 * the answers already on the table: `score` is symmetric, so the guess is still possible when, against
 * each earlier guess, it gives exactly that guess's bulls and cows.
 */
export const descartado = (intento, anteriores) => anteriores.some(f => {
  const s = responder(intento, f.v);
  return s.famas !== f.famas || s.toques !== f.toques;
});

/** El estado a partir de la lista de intentos. Each row also says whether it was ruled out (D-453). */
export function estado(p, intentos, max = MAX_INTENTOS) {
  const filas = [];
  for (const v of intentos) filas.push({ v, ...responder(v, p.secreto), descartado: descartado(v, filas) });
  const resuelto = filas.some(f => f.famas === p.cifras);
  return {
    filas, resuelto, fin: resuelto || filas.length >= max, usados: filas.length,
    descartados: filas.filter(f => f.descartado).length,
  };
}

/** Puntaje del día: 11 menos los intentos si lo sacó; 0 si no (de 1 a 10 intentos → 10 a 1). */
/** De 0 a 100 (D-113): 100 al primer intento y 10 menos por cada uno más (con 10 intentos, 10 al último). */
export const puntaje = (e, max = MAX_INTENTOS) => (e.resuelto ? Math.round((100 * (max + 1 - e.usados)) / max) : 0);

export const PENA_DESCARTE = 15;
/**
 * The rule being tried in the lab (D-453): 100 when every guess could have been the number, 15 off
 * for each guess the earlier clues had already ruled out, never below 10 when solved; 0 if not.
 * The first guess has no clues, so D-113's 100 was 1 in 5040 of luck, and a flawless deducer topped
 * out near 60. Always playing a possible number cracks any of the 5040 secrets in 10 guesses or
 * fewer, so 100 is reachable without luck. Nothing records it yet: "publish" swaps it for `puntaje`.
 */
export const puntajeDescarte = e => (e.resuelto ? Math.max(10, 100 - PENA_DESCARTE * (e.descartados || 0)) : 0);

/** Cada intento es una fila: 🟢 por fama, 🟡 por toque y ⚪ por el resto. Nunca las cifras. */
export function tarjeta(e) {
  return e.filas.map(f => '🟢'.repeat(f.famas) + '🟡'.repeat(f.toques) + '⚪'.repeat(Math.max(0, f.v.length - f.famas - f.toques))).join('\n');
}

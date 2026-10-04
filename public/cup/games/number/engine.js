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
 * ¿Las pistas anteriores ya descartaban este intento? Un número que no puede ser el secreto es
 * un intento regalado. No se mira el secreto, sino las respuestas que ya están en la mesa: como
 * `score` es simétrico (las famas y los toques entre dos números son los mismos en los dos
 * sentidos), el intento es posible si contra cada intento anterior da justo sus famas y toques.
 */
export const descartado = (intento, anteriores) => anteriores.some(f => {
  const s = responder(intento, f.v);
  return s.famas !== f.famas || s.toques !== f.toques;
});

/** El estado a partir de la lista de intentos. */
export function estado(p, intentos, max = MAX_INTENTOS) {
  const filas = [];
  for (const v of intentos) filas.push({ v, ...responder(v, p.secreto), descartado: descartado(v, filas) });
  const resuelto = filas.some(f => f.famas === p.cifras);
  return {
    filas, resuelto, fin: resuelto || filas.length >= max, usados: filas.length,
    descartados: filas.filter(f => f.descartado).length,
  };
}

export const PENA_DESCARTE = 15;
/**
 * De 0 a 100 (D-204): 100 si cada intento podía ser el número y 15 menos por cada intento que las
 * pistas ya descartaban; sacándolo nunca baja de 10, como en Tango. 0 si no lo saca.
 *
 * Antes (D-113) eran 100 al primer intento y 10 menos por cada uno más. El primer intento no tiene
 * pistas: ese 100 era 1 en 5040 de suerte y quien deducía impecable no pasaba de 60, el mismo
 * puntaje que quien tiraba al aire y tenía suerte. Jugando siempre un número posible se saca en
 * 10 intentos o menos siempre (el peor secreto de los 5040 pide exactamente 10), así que el 100
 * es alcanzable sin suerte y el tope no deja a nadie afuera.
 */
export const puntaje = e => (e.resuelto ? Math.max(10, 100 - PENA_DESCARTE * (e.descartados || 0)) : 0);

/** Cada intento es una fila: 🟢 por fama, 🟡 por toque y ⚪ por el resto. Nunca las cifras. */
export function tarjeta(e) {
  return e.filas.map(f => '🟢'.repeat(f.famas) + '🟡'.repeat(f.toques) + '⚪'.repeat(Math.max(0, f.v.length - f.famas - f.toques))).join('\n');
}

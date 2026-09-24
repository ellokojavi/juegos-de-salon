/**
 * 🎲 ¿Dudo o le creo? — motor puro. Manos congeladas de Dudo: tus dados, cuántos hay en la
 * mesa y la apuesta del rival. Se elige "Dudo" o "Le creo" y se destapa.
 *
 * El puntaje no mira lo que salió sino la calidad de la decisión: la probabilidad de que la
 * elección fuera cierta con lo que se sabía, por 100 (D-97). Así la suerte de la mesa no
 * decide el día.
 *
 * Los dados salen de la semilla, al revés que en Dudo (D-70): allá una semilla pública dejaba
 * calcular la mano del rival; acá todos ven la misma mesa y no hay rival.
 */
import { credibility, countPinta } from '../../dudo/engine.js';
import { azar } from './semilla.js';

export const MANOS = 8;

const dado = a => a.entero(6) + 1;

/**
 * Una mano: entre 2 y 5 rivales con 1 a 5 dados cada uno, y una apuesta cuya probabilidad
 * queda cerca de un objetivo entre 20 % y 80 %: ni regalada ni imposible.
 */
function mano(a) {
  const mios = Array.from({ length: 5 }, () => dado(a));
  const rivales = 2 + a.entero(4);
  const otros = Array.from({ length: rivales }, () => Array.from({ length: 1 + a.entero(5) }, () => dado(a)));
  const total = 5 + otros.reduce((s, o) => s + o.length, 0);
  const pinta = a.real() < 0.15 ? 1 : 2 + a.entero(5);
  const objetivo = 0.2 + a.real() * 0.6;
  let mejor = null;
  for (let n = 1; n <= total; n++) {
    const c = credibility({ myDice: mios, bid: { n, p: pinta }, totalDice: total });
    if (c > 0.97 || c < 0.03) continue;
    if (!mejor || Math.abs(c - objetivo) < Math.abs(mejor.c - objetivo)) mejor = { n, c };
  }
  if (!mejor) return mano(a);
  return { mios, otros, total, apuesta: { n: mejor.n, p: pinta } };
}

export function generar(codigo, dia, { n = MANOS, sal = 'dudo' } = {}) {
  const a = azar(codigo, dia, sal);
  return { manos: Array.from({ length: n }, () => mano(a)) };
}

/** P(la apuesta es cierta) para quien ve solo sus dados. */
export const creible = m => credibility({ myDice: m.mios, bid: m.apuesta, totalDice: m.total });

/** Cuántos hay de verdad en la mesa (los ases son comodín salvo que se pidan ases). */
export const hayDeVerdad = m => countPinta([...m.mios, ...m.otros.flat()], m.apuesta.p);

/** Puntos de una decisión: la probabilidad de que fuera cierta, por 100. */
export function puntos(m, eleccion) {
  const c = creible(m);
  return Math.round(100 * (eleccion === 'creo' ? c : 1 - c));
}

/** ¿Era la mejor de las dos? (Con 50 % justo, las dos lo son.) */
export const mejor = (m, eleccion) => puntos(m, eleccion) >= 50;

export function estado(p, elecciones) {
  const filas = elecciones.map((e, i) => {
    const m = p.manos[i];
    return { m, e, pts: puntos(m, e), mejor: mejor(m, e), hay: hayDeVerdad(m), cierta: hayDeVerdad(m) >= m.apuesta.n };
  });
  return { filas, fin: filas.length >= p.manos.length, actual: p.manos[filas.length] || null, total: filas.reduce((s, f) => s + f.pts, 0) };
}

export const puntaje = e => e.total;

/** 🎯 la mejor decisión con buena ventaja · 👍 la mejor, pero pareja · 😬 la peor. */
export const tarjeta = e => e.filas.map(f => (!f.mejor ? '😬' : f.pts >= 65 ? '🎯' : '👍')).join('');

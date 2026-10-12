/**
 * Pintaminas — el motor (laboratorio, D-289). Inspirado en ColorSweeper (ARRKKA): un Buscaminas en que
 * cada casilla es de tinta o de fondo, y su número dice cuántas de sus 8 vecinas son de su mismo color.
 * Al resolverlo, la tinta forma un dibujo (lo que toma de los nonogramas).
 *
 * El tablero se arma desde un dibujo de 7×7: se dan algunas casillas con su color y su número, y el
 * resto se deduce. Cada casilla que el jugador acierta muestra su número, que da más pistas. El
 * generador agrega casillas dadas hasta que `resolver` lo termina sin adivinar, y después saca las
 * que sobran: siempre se resuelve con lógica.
 */
import { DIBUJOS } from './dibujos.js';

export const LADO = 7;
export const RESTA_ERROR = 15;

function azar(semilla) {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) { h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
const barajar = (xs, r) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Las vecinas de cada casilla (hasta 8). */
export const VECINAS = Array.from({ length: LADO * LADO }, (_, i) => {
  const f = Math.floor(i / LADO), c = i % LADO, v = [];
  for (let df = -1; df <= 1; df++) for (let dc = -1; dc <= 1; dc++) {
    if (!df && !dc) continue;
    const ff = f + df, cc = c + dc;
    if (ff >= 0 && ff < LADO && cc >= 0 && cc < LADO) v.push(ff * LADO + cc);
  }
  return v;
});

/** El número de una casilla: cuántas de sus vecinas son de su mismo color. */
export const numero = (sol, i) => VECINAS[i].filter(j => sol[j] === sol[i]).length;

/**
 * Lo que se puede deducir desde las casillas conocidas, como lo haría un jugador: cada casilla conocida
 * dice cuántas de sus vecinas desconocidas son de tinta; si son todas o ninguna, se sabe. Y si las
 * desconocidas de una casilla están todas entre las de otra, la diferencia también dice algo (como en
 * el Buscaminas). Cada casilla deducida muestra su número y se sigue. Devuelve el mapa de conocidas.
 */
export function resolver(sol, dadas) {
  const sabe = new Map([...dadas].map(i => [i, sol[i]]));
  for (let cambio = true; cambio;) {
    cambio = false;
    // Cada conocida: sus vecinas desconocidas y cuántas de ellas son de tinta
    const reglas = [];
    for (const [i, k] of sabe) {
      const des = VECINAS[i].filter(j => !sabe.has(j));
      if (!des.length) continue;
      const iguales = numero(sol, i) - VECINAS[i].filter(j => sabe.has(j) && sabe.get(j) === k).length;
      reglas.push({ des, tinta: k === 1 ? iguales : des.length - iguales });
    }
    const fijar = (des, color) => { for (const j of des) if (!sabe.has(j)) { sabe.set(j, color); cambio = true; } };
    for (const r of reglas) {
      if (r.tinta === 0) fijar(r.des, 0);
      else if (r.tinta === r.des.length) fijar(r.des, 1);
    }
    if (cambio) continue;
    // Una dentro de otra: lo que sobra de la grande tiene la diferencia de tinta
    for (const a of reglas) for (const b of reglas) {
      if (a === b || a.des.length >= b.des.length || !a.des.every(j => b.des.includes(j))) continue;
      const resto = b.des.filter(j => !a.des.includes(j)), tinta = b.tinta - a.tinta;
      if (tinta === 0) fijar(resto, 0);
      else if (tinta === resto.length) fijar(resto, 1);
    }
  }
  return sabe;
}

/**
 * El tablero de una semilla: `{ dibujo: { nombre, color, emoji }, sol: [0|1 ×49], dadas: [índices] }`.
 * El dibujo puede salir espejado. Las dadas mezclan tinta y fondo, y con ellas se resuelve entero.
 */
export function generar(semilla) {
  const r = azar(String(semilla));
  const d = DIBUJOS[Math.floor(r() * DIBUJOS.length)];
  const espejo = r() < 0.5;
  const sol = d.filas.flatMap(fila => [...(espejo ? [...fila].reverse().join('') : fila)].map(x => (x === '#' ? 1 : 0)));
  const todas = [...sol.keys()];
  // Se agregan dadas al azar hasta que se resuelve entero
  const dadas = new Set(barajar(todas, r).slice(0, 3));
  while (resolver(sol, dadas).size < sol.length) {
    const sabe = resolver(sol, dadas);
    const faltan = todas.filter(i => !sabe.has(i));
    dadas.add(faltan[Math.floor(r() * faltan.length)]);
  }
  // Y se sacan las que no hacen falta: más deducción, menos regalo
  for (const i of barajar([...dadas], r)) {
    dadas.delete(i);
    if (resolver(sol, dadas).size < sol.length) dadas.add(i);
  }
  return { dibujo: { nombre: d.nombre, color: d.color, emoji: d.emoji, cuadro: d.cuadro }, sol, dadas: [...dadas].sort((a, b) => a - b) };
}

/**
 * El estado tras las jugadas (`{ i, color }`, en orden): qué casillas se conocen (las dadas, las
 * acertadas y las erradas, que se destapan con su color verdadero), cuáles fueron error, y si terminó.
 */
export function estado(t, jugadas = []) {
  const conocidas = new Set(t.dadas), errores = new Set();
  for (const { i, color } of jugadas) {
    if (conocidas.has(i)) continue;
    conocidas.add(i);
    if (t.sol[i] !== color) errores.add(i);
  }
  return { conocidas, errores, fin: conocidas.size === t.sol.length };
}

/** De 0 a 100: cada error resta RESTA_ERROR. */
export const puntaje = e => Math.max(0, 100 - RESTA_ERROR * e.errores.size);

/** La tarjeta para compartir, sin delatar el dibujo: dónde se equivocó (🟥) en la grilla. */
export const tarjeta = (t, e) => Array.from({ length: LADO }, (_, f) =>
  Array.from({ length: LADO }, (_, c) => (e.errores.has(f * LADO + c) ? '🟥' : '⬛')).join('')).join('\n');

/**
 * La semilla de cada día de La Copa (D-97).
 *
 * Todo el contenido de un día —el número secreto, las cartas, la flota, los dados— sale de
 * `código:día:sal`, así que es idéntico en todos los celulares sin que nada viaje por la red.
 * Solo aritmética entera: el mismo número da la misma partida en cualquier navegador.
 */
import { rng as mulberry } from '../../linea-de-tiempo/engine.js';

/** Hash de 32 bits de un texto (FNV-1a con una vuelta de mezcla al final). */
export function hash32(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Un generador para ese código, ese día y ese uso (`sal` separa, por ejemplo, el mazo de las cartas). */
export function azar(codigo, dia, sal = '') {
  const r = mulberry(hash32(`${codigo}:${dia}:${sal}`));
  return {
    /** Un número en [0, 1). */
    real: r,
    /** Un entero en [0, n). */
    entero: n => Math.floor(r() * n),
    /** Un elemento al azar. */
    uno: arr => arr[Math.floor(r() * arr.length)],
    /** Una copia barajada. */
    barajar: arr => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

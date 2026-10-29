/**
 * The active-time clock of La Copa's games (D-95, D-277), out of engine.js, which re-exports it (D-377):
 * a game that only needs the clock (Generala alone, through games/solo.js) does not load La Copa.
 */

/**
 * Cronómetro que solo corre con la pantalla visible (D-95). Se guarda como { ms, desde }:
 * `ms` acumulado y `desde` el instante en que volvió a correr (o null si está en pausa).
 */
export const reloj = {
  nuevo: now => ({ ms: 0, desde: now }),
  pausar: (r, now) => (r.desde == null ? r : { ms: r.ms + Math.max(0, now - r.desde), desde: null }),
  seguir: (r, now) => (r.desde == null ? { ms: r.ms, desde: now } : r),
  leer: (r, now) => r.ms + (r.desde == null ? 0 : Math.max(0, now - r.desde)),
};

/**
 * La pausa para leer el dato de un error (D-277): detiene el reloj y lo vuelve a andar al cerrar
 * el veredicto o cuando se cumple el tope, lo que pase primero. Devuelve la función que la
 * termina; llamarla dos veces no hace nada. `pausar` y `seguir` son los del reloj de cada pantalla.
 */
export function pausaDeLectura({ ms, pausar, seguir, alCambiar }) {
  pausar(); alCambiar?.(true);
  let hecha = false;
  const fin = () => { if (hecha) return; hecha = true; clearTimeout(t); seguir(); alCambiar?.(false); };
  const t = setTimeout(fin, ms);
  return fin;
}

import { mmss } from '../assets/js/time-format.js';
export { mmss };

/**
 * El caso — el prototipo del laboratorio (D-256) con el mismo motor que el juego de La Copa
 * (D-257, D-259): `public/cup/games/case/engine.js` arma el caso y sus pistas, y aquí solo se
 * adapta a lo que espera esta página, solo en español: los oficios con su nombre y cada pista con
 * su frase (`texto`). Así el prototipo y el juego de La Copa tienen siempre la misma dificultad.
 */
import * as motor from '../../cup/games/case/engine.js';
import { LOCALES } from '../../cup/rules.js';

export { N, COLS, FILAS, LETRAS_COL, coord, vecinos, resolver, deducibles, pistasVerdaderas } from '../../cup/games/case/engine.js';

const L = LOCALES.es.casoTexto;
const { N, resolver } = motor;
const todas = Array.from({ length: N }, (_, i) => i);

/** El caso de la semilla `semilla`, con los oficios y las frases en español. */
export function generar(semilla) {
  const caso = motor.deSemilla(semilla);
  const oficios = caso.oficios.map(id => ({ ...motor.oficio(id), ...L.oficios[id] }));
  const pistas = caso.pistas.map((p, i) => ({ ...p, texto: motor.texto(caso, i, L) }));
  return { ...caso, oficios, pistas };
}

/**
 * Lo que se sabe hasta ahora: `x` (-1 sin saber) con las marcas del jugador, y qué se puede marcar.
 * `marcas` es la lista de celdas marcadas, en orden; cada una vale lo que es de verdad.
 */
export function estado(caso, marcas) {
  const x = new Array(N).fill(-1);
  x[caso.inicio] = caso.v[caso.inicio];
  for (const i of marcas) x[i] = caso.v[i];
  const conocidas = todas.filter(i => x[i] !== -1);
  const pistas = conocidas.map(i => caso.pistas[i]).filter(Boolean);
  return { x, conocidas, pistas, terminado: conocidas.length === N };
}

/**
 * Marcar a `i` como `valor` (1 criminal, 0 inocente). Devuelve 'ok' si está bien y se podía deducir,
 * 'error' si está mal (y se podía deducir: eso es una equivocación) o 'falta' si todavía no se puede
 * saber con las pistas que hay (no se cuenta como error y no dice si estaba bien).
 */
export function marcar(caso, marcas, i, valor) {
  const { x, pistas } = estado(caso, marcas);
  if (x[i] !== -1) return 'ya';
  const prueba = x.slice();
  prueba[i] = 1 - caso.v[i];
  if (resolver(pistas, prueba)) return 'falta';
  return valor === caso.v[i] ? 'ok' : 'error';
}

/**
 * La ayuda (D-263), la misma de La Copa: a quién mirar (`i`) y qué pistas juntar (`quienes`), con
 * las marcas del prototipo. `null` si no queda nadie por deducir.
 */
export const ayuda = (caso, marcas) => motor.ayuda(caso, marcas.map(i => ({ i, v: caso.v[i] })));
/** "Ana, Beto y Cata", con la "e" antes de i. */
export const lista = nombres => motor.lista(nombres, L);

/** La semilla de un día: el mismo caso para todos ese día. */
export const semillaDelDia = fecha => `dia:${fecha}`;

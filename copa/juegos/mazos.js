/**
 * Las cartas de Línea de Tiempo que usan ⏳ Línea Relámpago, 📅 ¿En qué año? y la final.
 *
 * Cada copa elige de entrada dos temáticas distintas: una para la línea y otra para los años,
 * así un día de historia no se repite con el otro (ver la revisión en docs/juegos/copa.md).
 */
import { DECKS } from '../../linea-de-tiempo/decks/index.js';
import { azar } from './semilla.js';

export { DECKS };

export function temasDeLaCopa(codigo) {
  const a = azar(codigo, 0, 'temas');
  const [linea, anio, final] = a.barajar(DECKS.map(d => d.id));
  return { linea, anio, final };
}

export const mazo = id => DECKS.find(d => d.id === id) || DECKS[0];

/**
 * `n` cartas de la temática, con años distintos entre sí y, si se pide, separadas por al
 * menos `separacion` años para que ordenar no dependa de adivinar el mismo año.
 */
export function cartas(a, deckId, n, { separacion = 0 } = {}) {
  const out = [];
  for (const c of a.barajar(mazo(deckId).cards)) {
    if (out.some(o => Math.abs(o.year - c.year) <= separacion - 1 || o.year === c.year)) continue;
    out.push({ id: c.id, year: c.year, emoji: c.emoji, texto: c.es });
    if (out.length === n) break;
  }
  return out;
}

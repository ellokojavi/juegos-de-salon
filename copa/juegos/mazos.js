/**
 * Las cartas de Línea de Tiempo que usan ⏳ Línea Relámpago, 📅 ¿En qué año? y la final.
 *
 * Cada copa elige de entrada dos temáticas distintas: una para la línea y otra para los años,
 * así un día de historia no se repite con el otro (ver la revisión en docs/juegos/copa.md).
 */
import { DECKS as TODOS } from '../../linea-de-tiempo/decks/index.js';
import { azar } from './semilla.js';

/**
 * Las temáticas que entran a la copa. Brasil queda fuera (D-111): la copa es de un grupo chileno
 * y ordenar hitos de la historia de Brasil no lo resuelve casi nadie que no sea brasileño.
 */
const FUERA = ['brasil'];
export const DECKS = TODOS.filter(d => !FUERA.includes(d.id));

export function temasDeLaCopa(codigo) {
  const a = azar(codigo, 0, 'temas');
  const [linea, anio, final] = a.barajar(DECKS.map(d => d.id));
  return { linea, anio, final };
}

// Busca en todas: el modo solo de Línea de Tiempo también juega la de Brasil
export const mazo = id => TODOS.find(d => d.id === id) || DECKS[0];

/**
 * `n` cartas de la temática, con años distintos entre sí y, si se pide, separadas por al
 * menos `separacion` años para que ordenar no dependa de adivinar el mismo año.
 */
export function cartas(a, deckId, n, { separacion = 0, lang = 'es', excluir = null } = {}) {
  const out = [];
  // `excluir`: ids vistos hace poco en el modo solo de Línea de Tiempo (D-34, D-142). La copa no lo usa.
  const fuera = excluir && excluir.length ? new Set(excluir) : null;
  const todas = fuera ? mazo(deckId).cards.filter(c => !fuera.has(c.id)) : mazo(deckId).cards;
  for (const c of a.barajar(todas)) {
    if (out.some(o => Math.abs(o.year - c.year) <= separacion - 1 || o.year === c.year)) continue;
    out.push({ id: c.id, year: c.year, emoji: c.emoji, texto: c[lang] || c.es });
    if (out.length === n) break;
  }
  return out;
}

/**
 * ⏳ Línea Relámpago — motor puro. Diez hitos de una temática: el primero queda puesto y los
 * otros nueve se juegan desde la mano, en el orden que el jugador quiera, igual que en el modo
 * solo de Línea de Tiempo. Un error deja la carta en su lugar, marcada, y se sigue.
 */
import { azar } from './semilla.js';
import { cartas, temasDeLaCopa, mazo } from './mazos.js';

export const CARTAS = 10;

export function generar(codigo, dia, { n = CARTAS, tema, sal = 'linea' } = {}) {
  const deck = tema || temasDeLaCopa(codigo).linea;
  const a = azar(codigo, dia, sal);
  const cs = cartas(a, deck, n, { separacion: 2 });
  return { tema: deck, temaNombre: mazo(deck).name.es, temaEmoji: mazo(deck).emoji, base: cs[0], mano: cs.slice(1) };
}

/** ¿El hueco `at` (0 = antes de la primera) es el correcto para `carta` en `linea`? */
export function correcto(linea, carta, at) {
  const antes = linea[at - 1], despues = linea[at];
  return (!antes || antes.year < carta.year) && (!despues || carta.year < despues.year);
}

/** Dónde va de verdad. */
export const huecoCorrecto = (linea, carta) => linea.filter(c => c.year < carta.year).length;

/**
 * El estado a partir de las jugadas: `{ c: id de la carta, at: hueco elegido }`, en orden.
 * Devuelve la línea como quedó, la mano que falta, cada veredicto y dónde iba cada error.
 */
export function estado(p, jugadas) {
  let linea = [{ ...p.base, ok: null }];
  const marcas = [];
  const historia = [];
  const puestas = new Set();
  for (const j of jugadas) {
    const carta = p.mano.find(c => c.id === j.c);
    if (!carta || puestas.has(carta.id)) continue;
    const ok = correcto(linea, carta, j.at);
    const pos = ok ? j.at : huecoCorrecto(linea, carta);
    linea = [...linea.slice(0, pos), { ...carta, ok }, ...linea.slice(pos)];
    puestas.add(carta.id);
    marcas.push(ok);
    historia.push({ carta, ok, entre: [linea[pos - 1] || null, linea[pos + 1] || null] });
  }
  const mano = p.mano.filter(c => !puestas.has(c.id));
  return { linea, mano, marcas, historia, fin: mano.length === 0, aciertos: marcas.filter(Boolean).length };
}

export const puntaje = e => e.aciertos;

export const tarjeta = e => e.marcas.map(ok => (ok ? '🟩' : '🟥')).join('');

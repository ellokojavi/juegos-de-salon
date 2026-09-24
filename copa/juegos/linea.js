/**
 * ⏳ Línea Relámpago — motor puro. Ocho hitos de una temática: el primero queda puesto y los
 * otros siete se colocan de a uno. Un error deja la carta en su lugar, marcada, y se sigue.
 */
import { azar } from './semilla.js';
import { cartas, temasDeLaCopa, mazo } from './mazos.js';

export const CARTAS = 8;

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
 * El estado a partir de los huecos elegidos, en orden: la línea como quedó, cuál va ahora
 * y si cada jugada acertó. Una carta mal puesta queda donde corresponde.
 */
export function estado(p, jugadas) {
  let linea = [{ ...p.base, ok: null }];
  const marcas = [];
  jugadas.forEach((at, i) => {
    const carta = p.mano[i];
    if (!carta) return;
    const ok = correcto(linea, carta, at);
    const pos = ok ? at : huecoCorrecto(linea, carta);
    linea = [...linea.slice(0, pos), { ...carta, ok }, ...linea.slice(pos)];
    marcas.push(ok);
  });
  const fin = marcas.length >= p.mano.length;
  return { linea, marcas, fin, actual: fin ? null : p.mano[marcas.length], aciertos: marcas.filter(Boolean).length };
}

export const puntaje = e => e.aciertos;

export const tarjeta = e => e.marcas.map(ok => (ok ? '🟩' : '🟥')).join('');

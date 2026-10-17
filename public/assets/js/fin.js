/**
 * The way out of a result screen, by context (C-19, D-343): each end screen offers the exits that
 * are right at that moment, with the same words and in the same place, after its main actions.
 *   hoy    → back to One a Day (the header's ‹ Menu is the way to the menu; the card already offers
 *            play another / replay)
 *   podio  → the main menu: the Cup is over
 *   suelto → the main menu (play again is the game's own main action)
 * A Cup day has no exit here: its only way out is back to the board, the Cup's home.
 */
import { el } from './ui.js';
import { COMMON } from './i18n.js';

export const SALIDAS = Object.freeze({ hoy: ['hoy'], podio: ['menu'], suelto: ['menu'] });

/** The row of exits for `contexto`, as links; `raiz` is the site root seen from the page. */
export function salidasFin(contexto, { lang = 'es', raiz = '../' } = {}) {
  const C = COMMON[lang] || COMMON.es;
  const destino = { hoy: [`${raiz}today/`, C.uad.verTodo], menu: [raiz || './', C.volverMenu] };
  const lista = SALIDAS[contexto];
  // A single exit goes full width; several share a row
  return el('div', { class: lista.length > 1 ? 'btn-row fin-salidas' : 'stack fin-salidas', id: 'fin-salidas' },
    lista.map(k => el('a', { class: 'btn btn--ghost btn--sm', id: `btn-fin-${k}`, href: destino[k][0] }, destino[k][1])));
}

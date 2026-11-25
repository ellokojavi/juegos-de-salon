/**
 * The home page's third card, ⚔️ Duels (lab flag rivals, lab: #seccion-rivals), after La Copa and
 * One a Day: the row of two becomes a row that slides, with this card peeking from the right edge.
 * Its badge counts the open duels, «1 VS 1» with none (the owner, 2026-11-22); its button is La
 * Copa's. It opens /duels/.
 */
import { el } from './ui.js';
import { jugador, leerYo } from './jugador.js';
import { estado } from './duels.js';
import { TEXTS } from './duels-texts.js';

export function cardDuelos(fila, { lang = 'es', tap = () => {} } = {}) {
  const T = TEXTS[lang] || TEXTS.es;
  const insignia = el('span', { class: 'duelos-mes' }, T.badgeNone);
  const card = el('a', { class: 'game-card torneo alta duelos-card', href: 'duels/', 'data-duels': '', onClick: tap },
    insignia,
    el('div', { class: 'emoji' }, el('span', { 'aria-hidden': 'true' }, '⚔️')),
    el('div', { class: 'texto' }, el('h2', {}, el('span', {}, T.cardTitle)), el('div', { class: 'tag' }, T.cardTag)),
    el('div', { class: 'meta' }, el('span', { class: 'copa-hoy-chip jugar' }, T.cardPlay)));
  fila.classList.add('con-duelos');
  fila.append(card);
  const yo = leerYo();
  if (yo) {
    jugador().then(J => J.duelos()).then(D => D.mios()).then(lista => {
      const n = lista.filter(d => !estado(d, yo.jid).termino).length;
      if (n) insignia.textContent = n === 1 ? T.badgeOne : T.badgeMany.replace('{n}', n);
      // ⚔️ A new duel someone else started: the «you've been challenged» screen, once per duel
      import('./duel-challenge.js').then(m => import('./duels-ui.js').then(u => m.maybeChallenge(lista, yo, d => ({ T, info: u.titulo(d), href: u.hrefRonda(d, 0) })))).catch(() => {});
    }).catch(() => {});
  }
  return card;
}

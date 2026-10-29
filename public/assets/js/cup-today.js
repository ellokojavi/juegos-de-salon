/**
 * La Copa's card on the home page says what to do today (lab flag `copa-hoy`): with a day of one of
 * this phone's cups left to play, a ▶ Jugar hoy chip like One a Day's, and the card opens that day;
 * with nothing to play, the card stays as it always was.
 *
 * It reads only what La Copa keeps on this phone each time a cup is opened (cup/cuenta.js
 * `porJugar`: the days left, with when each opens and closes), so the home page neither loads La
 * Copa (D-378) nor asks the network. A day played on another phone still shows here until this
 * phone opens the cup again, which then says it is done.
 */
import { el } from './ui.js';
import { COMMON } from './i18n.js';

const PREFIX = 'juegos-de-salon:copa:';

/** The first of this phone's cups with a day open now: `{ code, dia }`, or null. Pure, for node. */
export function pendingCup(store = globalThis.localStorage, now = Date.now()) {
  const read = k => { try { return JSON.parse(store?.getItem(PREFIX + k) || 'null'); } catch (_) { return null; } };
  const cups = read('mias');
  for (const c of Array.isArray(cups) ? cups : []) {
    const days = c?.code && read(`hoy:${c.code}`);
    const open = Array.isArray(days) && days.find(([, a, b]) => now >= a && now < b);
    if (open) return { code: c.code, dia: open[0] };
  }
  return null;
}

/** Puts the chip on La Copa's card when a day is waiting; returns whether it did. */
export function decorateCupCard(card, { lang = 'es', store, now = Date.now() } = {}) {
  const p = pendingCup(store, now);
  const meta = card?.querySelector('.meta');
  if (!p || !meta) return false;
  const T = (COMMON[lang] || COMMON.es).cupToday;
  card.href = `${card.getAttribute('href')}?${p.code}&day=${p.dia}`;
  card.classList.add('copa-hoy');
  card.setAttribute('aria-label', T.aria);
  // The chip takes the place of 👥 and ⏱, so the card keeps its height, as One a Day's does
  meta.replaceChildren(el('span', { class: 'copa-hoy-chip', id: 'copa-hoy-chip' }, `▶ ${T.play}`));
  return true;
}

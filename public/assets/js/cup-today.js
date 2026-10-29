/**
 * La Copa's card on the home page says what to do today (lab flag `copa-hoy`): with a day of one of
 * this phone's cups left to play, a ▶ Jugar hoy chip like One a Day's, and the card opens that day;
 * with today's day played and another to come (lab flag `copa-espera`), a ✅ Día N abre en X h Y min chip that counts down;
 * with nothing left, the card stays as it always was.
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

/** With nothing open now, the next day of this phone's cups to open: `{ code, dia, at }`, or null. Pure, for node. */
export function nextCupDay(store = globalThis.localStorage, now = Date.now()) {
  const read = k => { try { return JSON.parse(store?.getItem(PREFIX + k) || 'null'); } catch (_) { return null; } };
  const cups = read('mias');
  let best = null;
  for (const c of Array.isArray(cups) ? cups : []) {
    const days = c?.code && read(`hoy:${c.code}`);
    for (const [d, a] of Array.isArray(days) ? days : []) if (a > now && (!best || a < best.at)) best = { code: c.code, dia: d, at: a };
  }
  return best;
}

/** "5 h 12 min", "1 d 3 h", "12 min": how long until `ms` from now, never below a minute. */
export function untilText(ms) {
  const m = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(m / 60), d = Math.floor(h / 24);
  return d ? `${d} d${h % 24 ? ` ${h % 24} h` : ''}` : h ? `${h} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`;
}

/** Puts the chip on La Copa's card when a day is waiting; returns whether it did. */
export function decorateCupCard(card, { lang = 'es', store, now = Date.now(), wait = false } = {}) {
  const p = pendingCup(store, now);
  const meta = card?.querySelector('.meta');
  if (!meta) return false;
  const T = (COMMON[lang] || COMMON.es).cupToday;
  if (!p) return wait && waitChip(card, meta, T, nextCupDay(store, now), now);
  card.href = `${card.getAttribute('href')}?${p.code}&day=${p.dia}`;
  card.classList.add('copa-hoy');
  card.setAttribute('aria-label', T.aria);
  // The chip takes the place of 👥 and ⏱, so the card keeps its height, as One a Day's does
  meta.replaceChildren(el('span', { class: 'copa-hoy-chip', id: 'copa-hoy-chip' }, `▶ ${T.play}`));
  return true;
}

/** Today's day already played: ✅ Día N abre en X h Y min, counting down each minute while the page is open. */
function waitChip(card, meta, T, n, now) {
  if (!n) return false;
  const text = t => `✅ ${T.opens.replace('{day}', n.dia).replace('{time}', untilText(n.at - t))}`;
  const chip = el('span', { class: 'copa-hoy-chip espera', id: 'copa-hoy-chip' }, text(now));
  card.href = `${card.getAttribute('href')}?${n.code}`;
  card.classList.add('copa-hoy');
  meta.replaceChildren(chip);
  const tick = setInterval(() => {
    if (!chip.isConnected) return clearInterval(tick);
    // Once it opens, the chip becomes ▶ Jugar hoy
    if (Date.now() >= n.at) { clearInterval(tick); chip.textContent = `▶ ${T.play}`; card.href = `${card.href.split('?')[0]}?${n.code}&day=${n.dia}`; chip.classList.remove('espera'); return; }
    chip.textContent = text(Date.now());
  }, 30000);
  return true;
}

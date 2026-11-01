/**
 * La Copa's card on the home page says what to do today (lab flag `copa-hoy`): with a day of one of
 * this phone's cups left to play, a ▶ Jugar hoy chip like One a Day's, and the card opens that day;
 * with today's day played and another to come (lab flag `copa-espera`), a ✅ Día N en Xh chip that counts down;
 * with the final played and nothing else to come, ✅ Final jugada · cierra en X h Y min (same flag);
 * with nothing left, the card stays as it always was.
 * With lab flag `copa-contexto`, the card also says which cup, the player's place and the day's game,
 * with a bar of the cup's days, and invites to create or join one when there is none (`contextCard`).
 *
 * It reads only what La Copa keeps on this phone each time a cup is opened (cup/cuenta.js
 * `porJugar`: the days left, with when each opens and closes, written again the moment a day's
 * result is sent), so the home page does not load La Copa (D-378). A ▶ Jugar hoy is then confirmed
 * with one small read of that day's result (`confirmCupCard`): a day played on another phone does
 * not invite to play it again.
 */
import { el } from './ui.js';
import { COMMON } from './i18n.js';
import { gameById } from './games.js';

const PREFIX = 'juegos-de-salon:copa:';

/**
 * The codes of the cups this phone keeps: "Tus copas" (`mias`), then those it keeps a copy of
 * without being in that list, the cups of the Rankings player joined on another phone (D-220).
 */
function cupCodes(store, read) {
  const mias = read('mias');
  const codes = (Array.isArray(mias) ? mias : []).map(c => c?.code).filter(Boolean);
  try {
    for (let i = 0; i < (store?.length ?? 0); i++) {
      const m = /^juegos-de-salon:copa:(?:hoy|lista):([A-Z0-9]+)$/.exec(store.key(i) || '');
      if (m && !codes.includes(m[1])) codes.push(m[1]);
    }
  } catch (_) { /* only "Tus copas" */ }
  return codes;
}

/** The first of this phone's cups with a day open now: `{ code, dia }`, or null. Pure, for node. */
export function pendingCup(store = globalThis.localStorage, now = Date.now()) {
  const read = k => { try { return JSON.parse(store?.getItem(PREFIX + k) || 'null'); } catch (_) { return null; } };
  for (const code of cupCodes(store, read)) {
    const days = read(`hoy:${code}`);
    // A day the cup's kept copy already shows played is not offered again
    const L = read(`lista:${code}`), pid = read(`sesion:${code}`)?.pid;
    const open = Array.isArray(days) && days.find(([d, a, b]) => now >= a && now < b && !(pid && L?.results?.[d]?.[pid]));
    if (open) return { code, dia: open[0] };
  }
  return null;
}

/** With nothing open now, the next day of this phone's cups to open: `{ code, dia, at }`, or null. Pure, for node. */
export function nextCupDay(store = globalThis.localStorage, now = Date.now()) {
  const read = k => { try { return JSON.parse(store?.getItem(PREFIX + k) || 'null'); } catch (_) { return null; } };
  let best = null;
  for (const code of cupCodes(store, read)) {
    const days = read(`hoy:${code}`);
    for (const [d, a] of Array.isArray(days) ? days : []) if (a > now && (!best || a < best.at)) best = { code, dia: d, at: a };
  }
  return best;
}

/**
 * With no day to come, a cup of this phone whose final it already played and that is still open:
 * `{ code, at }`, `at` being when it closes. Read from the "Tus copas" copy (cup/cuenta.js `lista`). Pure, for node.
 */
export function finalPlayed(store = globalThis.localStorage, now = Date.now()) {
  const read = k => { try { return JSON.parse(store?.getItem(PREFIX + k) || 'null'); } catch (_) { return null; } };
  for (const code of cupCodes(store, read)) {
    const L = read(`lista:${code}`);
    const m = L?.meta, pid = Object.keys(L?.players || {})[0], last = m?.days;
    const end = Math.min(m?.end ?? 0, L?.fin ?? Infinity);
    if (pid && m?.win?.[last] && now >= m.win[last].a && now < end && L.results?.[last]?.[pid]) return { code, at: end };
  }
  return null;
}

/** "5 h 12 min", "1 d 3 h", "12 min": how long until `ms` from now, never below a minute. */
export function untilText(ms) {
  const m = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(m / 60), d = Math.floor(h / 24);
  // Compact (#1029): «6h» keeps the chip on one line at 320 px and reads the same in the four
  // languages; the minutes show only in the last hour, where they matter (the player's own suggestion)
  const hr = m >= 60 ? Math.floor(m / 60) : 0;
  return d ? `${d}d${h % 24 ? ` ${h % 24}h` : ''}` : hr ? `${hr}h` : `${m}m`;
}

/** Puts the chip on La Copa's card when a day is waiting; returns whether it did. */
export function decorateCupCard(card, { lang = 'es', store = globalThis.localStorage, now = Date.now(), wait = false, context = false } = {}) {
  const done = decorate(card, { lang, store, now, wait });
  if (context) contextCard(card, { lang, store, now });
  return done;
}

function decorate(card, { lang, store, now, wait }) {
  const p = pendingCup(store, now);
  const meta = card?.querySelector('.meta');
  if (!meta) return false;
  // How the card was before any chip, to draw it again once the server says a day is played
  card.__original ||= { href: card.getAttribute('href'), meta: meta.cloneNode(true), tag: card.querySelector('.tag')?.cloneNode(true) };
  const T = (COMMON[lang] || COMMON.es).cupToday;
  if (!p) return wait && (waitChip(card, meta, T, nextCupDay(store, now), now) || finalChip(card, meta, T, finalPlayed(store, now), now));
  card.href = `${card.getAttribute('href')}?${p.code}&day=${p.dia}`;
  card.classList.add('copa-hoy');
  card.setAttribute('aria-label', T.aria);
  // The chip takes the place of 👥 and ⏱, so the card keeps its height, as One a Day's does
  meta.replaceChildren(el('span', { class: 'copa-hoy-chip', id: 'copa-hoy-chip' }, `▶ ${T.play}`));
  return true;
}

/**
 * The ▶ Jugar hoy chip, confirmed with the server (`torneos/<code>/results/<day>/<pid>`, public over
 * REST, D-470): a day played on another phone, or whose result reached the server after this phone
 * last read the cup, leaves this phone's list of days to play, and the card is drawn again from
 * it. `fetchFn` and `base` are for node. Resolves true when it changed the card.
 */
export async function confirmCupCard(card, { lang = 'es', store = globalThis.localStorage, wait = false, context = false, fetchFn = (...a) => globalThis.fetch(...a), base } = {}) {
  try {
    const p = pendingCup(store);
    const pid = p && JSON.parse(store.getItem(`${PREFIX}sesion:${p.code}`) || 'null')?.pid;
    if (!pid || !card?.classList.contains('copa-hoy')) return false;
    base ||= (await import('./firebase-config.js')).firebaseConfig.databaseURL;
    const r = await fetchFn(`${base}/torneos/${p.code}/results/${p.dia}/${pid}.json`);
    if (!r.ok || (await r.json()) == null) return false;
    const days = JSON.parse(store.getItem(`${PREFIX}hoy:${p.code}`) || '[]').filter(([d]) => d !== p.dia);
    if (days.length) store.setItem(`${PREFIX}hoy:${p.code}`, JSON.stringify(days)); else store.removeItem(`${PREFIX}hoy:${p.code}`);
    // The card as it was, then decorated again from what is left
    if (card.__original) { card.href = card.__original.href; card.classList.remove('copa-hoy'); card.removeAttribute('aria-label'); card.querySelector('.meta')?.replaceWith(card.__original.meta.cloneNode(true)); restoreContext(card); }
    decorateCupCard(card, { lang, store, wait, context });
    // Another day of another cup may still be open: confirm that one too
    await confirmCupCard(card, { lang, store, wait, context, fetchFn, base });
    return true;
  } catch (_) { return false; }
}

/** Today's day already played: ✅ Día N en Xh, counting down each minute while the page is open. */
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

/** The final played: ✅ Final jugada · cierra en X h Y min, counting down; gone once the cup closes. */
function finalChip(card, meta, T, f, now) {
  if (!f) return false;
  const text = t => `✅ ${T.finalDone.replace('{time}', untilText(f.at - t))}`;
  const chip = el('span', { class: 'copa-hoy-chip espera', id: 'copa-hoy-chip' }, text(now));
  const old = meta.cloneNode(true);
  card.href = `${card.getAttribute('href')}?${f.code}`;
  card.classList.add('copa-hoy');
  meta.replaceChildren(chip);
  const tick = setInterval(() => {
    if (!chip.isConnected) return clearInterval(tick);
    if (Date.now() >= f.at) { clearInterval(tick); meta.replaceWith(old); return; }
    chip.textContent = text(Date.now());
  }, 30000);
  return true;
}

/**
 * The cups of this phone still on, as the card tells them (flag copa-contexto): `{ code, name, days,
 * day, played, place, game, next, final }`. `day` is the day the card speaks of (the one to play, or
 * else the last opened), `played` the days already played. Read from the "Tus copas" copy, which La Copa
 * writes with the place and each day's game (cup/engine.js `recorteLista`). Pure, for node.
 */
export function activeCups(store = globalThis.localStorage, now = Date.now()) {
  const read = k => { try { return JSON.parse(store?.getItem(PREFIX + k) || 'null'); } catch (_) { return null; } };
  const pending = pendingCup(store, now);
  const out = [];
  for (const code of cupCodes(store, read)) {
    const L = read(`lista:${code}`), m = L?.meta, pid = read(`sesion:${code}`)?.pid || Object.keys(L?.players || {})[0];
    if (!m?.win || !m.days || !pid || L.players?.[pid]?.out) continue;
    const end = Math.min(m.end ?? Infinity, L.fin ?? Infinity);
    if (now >= end || now < (m.win[1]?.a ?? Infinity) - 24 * 3600e3) continue;
    const days = read(`hoy:${code}`) || [];
    const open = days.find(([d, a, b]) => now >= a && now < b && !L.results?.[d]?.[pid]);
    let opened = 0;
    for (let d = 1; d <= m.days; d++) if (now >= (m.win[d]?.a ?? Infinity)) opened = d;
    const next = days.find(([, a]) => a > now)?.[0] || null;
    const day = open?.[0] || opened || 1;
    const played = [];
    for (let d = 1; d <= m.days; d++) if (L.results?.[d]?.[pid]) played.push(d);
    out.push({ code, name: m.name || '', days: m.days, day, played, place: L.place || null, open: !!open, next, final: day === m.days, games: L.games || calendarIds(m.cal), names: L.names || [], first: pending?.code === code });
  }
  // The cup the button opens goes first
  return out.sort((a, b) => b.first - a.first);
}

/**
 * Each day's game id from the cup's calendar (`meta.cal`), for a copy kept before `recorteLista` saved
 * `games`: as cup/engine.js `calendario` reads it (`id:variant`, a trio day `a+b+c`, two old ids
 * replaced), without loading La Copa (D-378).
 */
const OLD_IDS = { solitario: 'reinas', dudo: 'letras' };
export const calendarIds = cal => String(cal || '').split(',').filter(Boolean).map(x => { if (x.includes('+')) return 'trio'; const id = x.split(':')[0]; return OLD_IDS[id] || id; });

const ordinal = (n, lang) => {
  if (lang !== 'en') return `${n}.º`;
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
  return `${n}${s}`;
};
const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
/** The name of day `d`'s game: the one La Copa kept, or the site's list's. */
const gameName = (c, d, lang) => {
  const id = c.games[d - 1], g = id && gameById(id);
  return c.names[d - 1] || (g ? g.name[lang] || g.name.es : (COMMON[lang] || COMMON.es).cupToday.games?.[id] || '');
};

/** The day bar: played days, the day it speaks of, the rest. */
function bar(c) {
  return el('div', { class: 'copa-dias', 'aria-hidden': 'true' },
    ...Array.from({ length: c.days }, (_, i) => el('i', { class: c.played.includes(i + 1) ? 'ok' : i + 1 === c.day && !c.played.includes(c.day) ? 'hoy' : '' })));
}

/** «Vas 2.º de 6.», on the final «Vas 2.º, a 40 pts de Ana.»; empty without a place. */
function placeText(c, T, lang) {
  const p = c.place;
  if (!p?.at || !p.of) return '';
  const pos = ordinal(p.at, lang);
  return c.final && p.leader && p.gap > 0 ? fill(T.behind, { pos, pts: p.gap, name: p.leader }) : fill(T.place, { pos, n: p.of });
}

/** «Hoy: Conexiones.» (or the next day's game, once today's is played), bold. */
function gameLine(c, T, lang) {
  const d = c.open ? c.day : c.next;
  const g = d && gameName(c, d, lang);
  if (!g) return [];
  const [a, b] = (c.open ? T.today : T.next).split('{game}');
  return [a, el('b', {}, g), b];
}

/** Puts back the card's text as it was before `contextCard`. */
function restoreContext(card) {
  card.querySelector('.copa-mes')?.remove();
  card.classList.remove('copa-ctx');
  if (card.__original?.tag) card.querySelector('.tag')?.replaceWith(card.__original.tag.cloneNode(true));
}

/**
 * Flag copa-contexto: the cup's name in a pill on the border (One a Day's month), the place first and
 * then the game, the day bar and the button saying which day; with two or more cups one line each
 * (two at most, then «y N más»); with none, ▶ Crea o únete a una Copa. Long names end in «…».
 */
export function contextCard(card, { lang = 'es', store = globalThis.localStorage, now = Date.now() } = {}) {
  const meta = card?.querySelector('.meta'), tag = card?.querySelector('.tag');
  if (!meta || !tag) return false;
  card.__original ||= { href: card.getAttribute('href'), meta: meta.cloneNode(true), tag: tag.cloneNode(true) };
  card.__original.tag ||= tag.cloneNode(true);
  restoreContext(card);
  const T = (COMMON[lang] || COMMON.es).cupToday;
  const cups = activeCups(store, now);
  card.classList.add('copa-ctx');
  const chip = card.querySelector('#copa-hoy-chip');
  if (!cups.length) {
    if (!chip) meta.replaceChildren(el('span', { class: 'copa-hoy-chip', id: 'copa-hoy-chip' }, T.join));
    return true;
  }
  const one = cups.length === 1, c = cups[0];
  const pill = one ? (c.final ? `🏆 ${T.final} · ${c.name}` : c.name) : fill(T.cups, { n: cups.length });
  card.prepend(el('span', { class: 'copa-mes', title: pill }, pill));
  const body = card.querySelector('.tag');
  if (one) {
    const place = placeText(c, T, lang);
    // On the final the pill and the button already say it: no «Hoy: La Gran Final»
    const game = c.final && c.open ? [] : gameLine(c, T, lang);
    // Without the place (a cup kept before it was saved, or with nobody else yet): which day it is
    const lead = place || fill(T.dayOf, { day: c.day, days: c.days });
    const words = [lead, game.length ? ' ' : '', ...game].filter(Boolean);
    body.replaceChildren(...words, bar(c));
  } else {
    const rows = cups.slice(0, 2).flatMap(x => {
      const g = gameName(x, x.open ? x.day : x.next || x.day, lang);
      const tail = [x.place?.at && ordinal(x.place.at, lang), g].filter(Boolean).join(' · ');
      return [el('div', { class: 'copa-fila' }, el('b', {}, x.name), tail ? el('span', {}, `· ${tail}`) : ''), bar(x)];
    });
    if (cups.length > 2) rows.push(el('div', { class: 'copa-fila mas' }, fill(T.more, { n: cups.length - 2 })));
    body.replaceChildren(...rows);
  }
  // The ▶ button says which day of the first cup, the one it opens
  if (chip && !chip.classList.contains('espera')) chip.textContent = `▶ ${c.final ? T.playFinal : fill(T.playDay, { day: c.day })}`;
  return true;
}

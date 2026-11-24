/**
 * Another player's profile, at a glance (the owner, 2026-11-22): a tap on a name in a ranking of the profile
 * page and, with the lab flag `ranking-peek`, in any ranking (every `bloqueRanking` and the Cups' medal table in ranking.js, a Cup's own table) opens a sheet with what matters most about that player: their flag and name, their place in the
 * overall ranking when in its top 10 and the achievements anyone can see. Tapping your own name, or
 * «Ver cómo me ven los demás» in ⚙️, shows exactly what others see: the same sheet, the same words (D-604).
 *
 * Their streak, games and cups won, since when they play and their three most played games show for everyone,
 * with no switch to hide them (D-605, replacing D-602 and D-604's opt-out).
 *
 * Only what is already public is read (`jugadores/<jid>`, `unoAlDia/<jid>`, the Cups' podiums and the
 * tables): what this phone alone knows about its player (the hours, the marks, the cups joined) is not
 * there, so the achievements that come from it are left out, never shown as missing.
 *
 * Each of their most played games says their place in its all-time table, never how many times they played it:
 * a count tells how much someone plays, a place only how well (the owner, 2026-11-22).
 *
 * With `ranking-peek` the sheet opens where the name was tapped, and says so first (the owner, 2026-11-23: «that the card makes
 * sense with the view it comes from»): under the name, the table and tab it was tapped in with the row as it
 * showed (place, score, time), and, from a week's or friends' tab, their all-time place in that same table.
 * A Cup's table says the Cup and their place and points in it.
 */
import { el } from './ui.js';
import { withIcon } from './game-icon.js';
import { getLang, pickLang } from './i18n.js';
import { ALL_GAMES, GAMES, SOLO_TABLES, FIRST_VARIANT_TABLES } from './games.js';
import { jugador } from './jugador.js';
import { TODOTERRENO, UAD_PUNTOS, SIEMPRE, medallero, bandera } from './records.js';
import { recorrer, fechaLocal } from './uno-al-dia.js';
import { earned } from './badges.js';
import { TEXTS } from './profile-texts.js';
import { loadCss } from './load-css.js';

const conBandera = (co, n) => [bandera(co), n].filter(Boolean).join('\u00a0');
/** The sheet's styles (and the tappable name's), shared by every page with a ranking. */
const CSS = new URL('../css/player-peek.css', import.meta.url).href;

/** The achievements that public data can tell: the rest live on the player's own phone. */
export const PUBLIC_BADGES = new Set(['streak-10', 'streak-30', 'streak-100', 'month-full', 'month-podium', 'month-champion',
  'cup-podium', 'cup-champion', 'explorer', 'collector', 'plays-100', 'plays-1000', 'specialist', 'regular', 'weekends',
  'all-rounder', 'one-year']);
const TIER = { gold: 0, silver: 1, bronze: 2 };
/** How many medals the sheet shows before «+N». */
export const SHOWN_BADGES = 8;

/** The table a game's best lives in: its solo table, its wins for a group game, or its own. */
export function tableOf(id) {
  if (SOLO_TABLES[id]) return { t: SOLO_TABLES[id], wins: false };
  if (GAMES.some(g => g.id === id && g.jugadas)) return { t: `${id}_victorias`, wins: true };
  return { t: FIRST_VARIANT_TABLES[id] || id, wins: false };
}
/** How many most played games the sheet lists. */
export const SHOWN_GAMES = 3;

const CATALOGUE = ALL_GAMES.filter(g => g.available !== false && !g.labs && !g.oculto);
const gameOf = id => ALL_GAMES.find(g => g.id === id);

/**
 * The player's facts from their public record, pure for node. `perfil` is `jugadores/<jid>`, `hist`
 * `unoAlDia/<jid>` (by day number), `podios` the Cups' podiums, `general` the overall table's top
 * (`[{ jid, puesto }]`), `months` `[{ period, top: [{ jid, puesto }] }]`.
 */
export function peekFacts({ jid, perfil = null, hist = {}, podios = {}, general = [], months = [], today = fechaLocal(), now = Date.now() }) {
  const dias = {};
  for (const n of Object.keys(hist || {})) if (/^\d+$/.test(n)) dias[new Date(Number(n) * 86400000).toISOString().slice(0, 10)] = hist[n];
  const r = recorrer(dias, today, {});
  const ids = new Set(CATALOGUE.map(g => g.id));
  const byGame = Object.entries(perfil?.juegos || {}).map(([id, x]) => ({ id, n: Number(x?.n) || 0 }))
    .filter(x => x.n > 0 && gameOf(x.id)).sort((a, b) => b.n - a.n);
  const mine = medallero(podios || {}).find(x => x.jid === jid);
  const place = (general || []).find(x => x.jid === jid)?.puesto ?? null;
  return {
    today, now,
    n: perfil?.n || '', co: perfil?.co || '',
    since: Number(perfil?.at) || 0,
    streak: r.racha, bestStreak: r.mejor,
    dailyDays: Object.fromEntries(Object.keys(dias).map(d => [d, true])),
    byGame,
    gamesPlayed: byGame.filter(x => ids.has(x.id)).length,
    gamesTotal: CATALOGUE.length,
    plays: byGame.reduce((s, x) => s + x.n, 0),
    medals: { gold: mine?.oro || 0, silver: mine?.plata || 0, bronze: mine?.bronce || 0 },
    allRounder: Number.isInteger(place) && place <= 10 ? place : null,
    months: (months || []).map(m => ({ period: m.period, place: (m.top || []).find(x => x.jid === jid)?.puesto ?? null })),
  };
}

/** The achievements to show: earned and public, the best metal first. */
export function peekBadges(f) {
  return earned(f, {}).list.filter(b => b.got && PUBLIC_BADGES.has(b.id))
    .sort((a, b) => TIER[a.tier] - TIER[b.tier]);
}

/** Reads a player's public record; each read on its own, one failing leaves the rest. */
async function readFacts(J, jid) {
  const today = fechaLocal();
  const monthsWanted = [];
  for (let m = '2026-10'; m < today.slice(0, 7); m = nextMonth(m)) monthsWanted.push(m);
  const [perfil, hist, podios, general, months] = await Promise.all([
    J.perfil(jid).catch(() => null),
    J.historialDia(jid).catch(() => ({})),
    J.podios().catch(() => ({})),
    J.tabla(TODOTERRENO, SIEMPRE, { top: 10, reciente: 60000 }).then(v => v.top).catch(() => []),
    Promise.all(monthsWanted.map(m => J.tabla(UAD_PUNTOS, `s${m}`, { top: 3, reciente: 60000 }).then(v => ({ period: `s${m}`, top: v.top })).catch(() => null))),
  ]);
  if (!perfil) return null;
  const f = peekFacts({ jid, perfil, hist, podios, general, months: months.filter(Boolean), today });
  // Their place in each listed game's all-time table, when among the first ones read (100)
  await Promise.all(f.byGame.slice(0, SHOWN_GAMES).map(async g => {
    try { g.place = (await J.tabla(tableOf(g.id).t, SIEMPRE, { top: 100, reciente: 60000 })).top.find(x => x.jid === jid)?.puesto ?? null; } catch (_) { g.place = null; }
  }));
  return f;
}
const nextMonth = m => { const [y, mo] = m.split('-').map(Number); return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`; };

/**
 * Where a ranking row was tapped, read from what the screen shows (pure for node: `r` only needs
 * `closest`, `querySelector` and `dataset`): `label` the table's title and its tab, `place` the row's place
 * (a number when it has one, else what it shows), `values` what the row counts, each with the key of its unit
 * (`pts`, `time`, `wins`, `plays`, `streak`, or none), `allTime` the table to read their all-time place from,
 * only from a tab that is not already all-time (a week's or friends').
 */
export function rowContext(r) {
  const box = r.closest?.('.rk-ranking, .rk-campeones');
  const txt = x => (x?.textContent || '').replace(/\s+/g, ' ').trim();
  const on = box?.querySelector('.rk-seg .on');
  const tab = on?.dataset?.p || box?.dataset?.pestana || '';
  const shown = txt(r.querySelector('.rk-puesto'));
  const place = /^\d+$/.test(String(r.dataset?.puesto ?? '')) ? String(r.dataset.puesto) : shown === '·' ? '' : shown;
  const s = txt(r.querySelector('.rk-puntos')), second = txt(r.querySelector('.rk-tiempo'));
  const k = r.dataset?.k || (r.querySelector('.rk-medallas') ? 'medals' : 'score');
  const values = {
    score: [{ v: s, unit: 'pts' }, { v: second, unit: 'time' }],
    wins: [{ v: s, unit: 'wins' }],
    plays: [{ v: s, unit: 'plays' }],
    streak: [{ v: `🔥 ${s}`, unit: 'streak' }],
    points: [{ v: s, unit: 'pts' }, { v: second.replace(/^🔥\s*/, '🔥 '), unit: 'streak' }],
    medals: [{ v: txt(r.querySelector('.rk-medallas')) }],
  }[k] || [{ v: s }];
  const table = box?.dataset?.tabla;
  return {
    label: [txt(box?.querySelector('.rk-titulo')), txt(on)].filter(Boolean).join(' · '),
    place,
    values: values.filter(x => x.v && x.v !== '🔥 '),
    // The overall table's all-time place is already the sheet's own line (peekPlace)
    allTime: ['semana', 'amigos'].includes(tab) && table && table !== TODOTERRENO ? table : null,
  };
}

/** The word after a figure in the sheet's header: singular for exactly 1 («1 victoria», «🔥 1 día seguido»), never «1 victorias». */
export function unitWord(T, unit, v) {
  const one = /^(🔥\s*)?1$/.test(String(v).trim());
  return ({
    pts: T.peekUnitPts, time: T.peekUnitTime,
    wins: one ? T.peekUnitWin : T.peekUnitWins,
    plays: one ? T.peekUnitPlay : T.peekUnitPlays,
    streak: one ? T.peekUnitStreakOne : T.statStreak,
  })[unit] || '';
}

/**
 * Opens the sheet for `jid`; `hint` (`{ n, co }`) is what the tapped row showed, drawn while the rest loads;
 * `context` (`{ label, place, values, allTime }`, from `rowContext`) says where it was tapped: a medal with their
 * place (gold, silver and bronze on the podium, the badges' metals), the table and tab over what the row counts,
 * each with its unit, and their all-time place there as a tag (the owner's pick, option A, 2026-11-23).
 */
export async function peekPlayer(jid, { hint = {}, context = null, lang = getLang(), doc = document, onTap = () => {} } = {}) {
  if (!jid || doc.getElementById('pf-peek')) return null;
  loadCss(CSS);
  const T = TEXTS[lang] || TEXTS.es;
  const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));
  const num = x => new Intl.NumberFormat(lang).format(x);
  const y = doc.defaultView?.scrollY || 0;
  const bodyStyle = doc.body.getAttribute('style');
  let layer = null;
  const close = () => {
    if (!layer) return;
    onTap();
    layer.remove(); layer = null;
    if (bodyStyle === null) doc.body.removeAttribute('style'); else doc.body.setAttribute('style', bodyStyle);
    doc.defaultView?.scrollTo?.(0, y);
    doc.removeEventListener('keydown', onKey);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const who = el('h2', { id: 'pf-peek-name', class: 'pf-peek-name' }, conBandera(hint.co, hint.n || '…'));
  const placeOf = n => (lang === 'en' ? `#${n}` : `${n}.º`);
  // Where it was tapped, first: the table and tab, the row as it showed, and (filled in below) their all-time place
  const allTime = el('small', { class: 'pf-peek-here-all' });
  const n = /^\d+$/.test(context?.place || '') ? Number(context.place) : null;
  const tier = n === 1 ? 'gold' : n === 2 ? 'silver' : n === 3 ? 'bronze' : 'plain';
  const vals = context?.values || [];
  const here = context && (context.label || context.place || vals.length) ? el('div', { class: 'pf-peek-here' },
    context.place ? el('div', { class: `pf-peek-here-medal pf-badge--${tier}` }, el('span', { class: 'pf-medal' }, n ? placeOf(n) : context.place)) : null,
    el('div', { class: 'pf-peek-here-txt' },
      context.label ? el('small', { class: 'pf-peek-here-label' }, context.label) : null,
      vals.length ? el('div', { class: 'pf-peek-here-vals' }, vals.map(x => el('span', {}, el('b', {}, x.v), unitWord(T, x.unit, x.v) ? el('small', {}, unitWord(T, x.unit, x.v)) : null))) : null,
      allTime)) : null;
  const body = el('div', { class: 'pf-peek-body' }, el('p', { class: 'muted pf-peek-wait' }, T.peekLoading));
  const panel = el('div', { class: 'hoja pf-peek', id: 'pf-peek', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pf-peek-name' },
    el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
    el('div', { class: 'hoja-cabeza' },
      el('div', { class: 'pf-peek-who' }, who),
      el('button', { type: 'button', class: 'icon-btn', 'aria-label': T.peekClose, title: T.peekClose, onClick: close }, '✕')),
    here, body,
    el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn--yellow pf-peek-ok', onClick: close }, T.peekClose)));
  layer = el('div', { class: 'hoja-capa' }, el('div', { class: 'hoja-fondo', onClick: close }), panel);
  doc.body.append(layer);
  Object.assign(doc.body.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', overflow: 'hidden' });
  doc.addEventListener('keydown', onKey);
  panel.querySelector('.pf-peek-ok')?.focus?.({ preventScroll: true });

  let f = null;
  try {
    const J = await jugador();
    [f] = await Promise.all([readFacts(J, jid), context?.allTime
      ? J.tabla(context.allTime, SIEMPRE, { top: 100, reciente: 60000 }).then(v => {
        const p = v.top.find(x => x.jid === jid)?.puesto;
        if (Number.isInteger(p)) allTime.textContent = fmt(T.peekGamePlace, { place: placeOf(p) });
      }).catch(() => {})
      : null]);
  } catch (_) { f = null; }
  if (!layer) return null;
  if (!f) { body.replaceChildren(el('p', { class: 'muted pf-peek-wait' }, T.peekError)); return panel; }
  who.textContent = conBandera(f.co, f.n);
  const line = [f.since ? fmt(T.since, { month: new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(f.since)) }) : null,
    f.allRounder ? fmt(T.peekPlace, { place: placeOf(f.allRounder) }) : null].filter(Boolean);
  const stat = (b, s) => el('div', { class: 'pf-stat' }, el('b', {}, b), el('span', {}, s));
  const badges = peekBadges(f);
  const name = b => (T.badges[b.id] || [b.id])[0];
  const fav = f.byGame.slice(0, SHOWN_GAMES);
  body.replaceChildren(...[
    line.length ? el('p', { class: 'muted pf-peek-line' }, line.join(' · ')) : null,
    el('div', { class: 'pf-stats pf-peek-stats' },
      stat(`🔥 ${num(f.streak || 0)}`, T.statStreak), stat(num(f.plays || 0), T.statPlays), stat(`🏆 ${num(f.medals.gold)}`, T.statCups)),
    el('section', { class: 'pf-peek-part' },
      el('h3', {}, T.peekGames),
      fav.length
        ? el('ol', { class: 'pf-peek-games' }, fav.map(g => el('li', { 'data-game': g.id },
          el('span', { class: 'pf-peek-game' }, withIcon(gameOf(g.id), pickLang(gameOf(g.id).name, lang))),
          Number.isInteger(g.place) ? el('small', {}, fmt(T.peekGamePlace, { place: placeOf(g.place) })) : null)))
        : el('p', { class: 'muted' }, T.peekNoGames)),
    el('section', { class: 'pf-peek-part' },
      el('h3', {}, badges.length === 1 ? T.peekBadgesOne : badges.length ? fmt(T.peekBadges, { n: badges.length }) : T.peekBadgesNone),
      badges.length
        ? el('ul', { class: 'pf-peek-badges' },
          badges.slice(0, SHOWN_BADGES).map(b => el('li', { class: `pf-badge--${b.tier}`, 'data-badge': b.id },
            el('span', { class: 'pf-medal', 'aria-hidden': 'true' }, b.icon), el('small', {}, name(b)))),
          badges.length > SHOWN_BADGES ? el('li', { class: 'pf-peek-more' }, el('span', { class: 'pf-medal' }, `+${badges.length - SHOWN_BADGES}`)) : null)
        : el('p', { class: 'muted' }, T.peekNoBadges)),
  ].filter(Boolean));
  return panel;
}

/**
 * Makes every ranking row under `root` open its player's sheet: rows come and go as tabs change, so the
 * taps are caught on `root`, and each new row is made a button for the keyboard and screen readers.
 * By default the rows are ranking.js' (`.rk-fila` with their `data-jid`) and the context is read from the
 * table they are in; a page with its own table (a Cup's) passes `rows`, `jidOf`, `nameOf` and `contextOf`.
 * A tap on a button inside a row (a duel's ⚔️, a Cup's 💬) is that button's, not the sheet's.
 */
export function peekOnTap(root, {
  onTap = () => {}, rows = '.rk-fila[data-jid]', jidOf = r => r.dataset.jid,
  nameOf = r => r.querySelector('.rk-n')?.textContent || '', contextOf = rowContext,
} = {}) {
  if (!root || root.dataset?.peekOn) return;
  root.dataset.peekOn = '1';
  loadCss(CSS);
  const T = TEXTS[getLang()] || TEXTS.es;
  const ready = () => root.querySelectorAll(`${rows}:not([data-peek])`).forEach(r => {
    if (!/^[a-z0-9]{8}$/.test(jidOf(r) || '')) return;
    r.dataset.peek = '1';
    r.setAttribute('role', 'button');
    r.tabIndex = 0;
    r.setAttribute('aria-label', `${nameOf(r).trim()} · ${T.peekOpen}`);
  });
  const open = r => {
    onTap();
    peekPlayer(jidOf(r), { hint: { n: nameOf(r).trim() }, context: contextOf(r), onTap });
  };
  const rowOf = e => {
    const r = e.target.closest?.(`${rows}[data-peek]`);
    if (!r || !root.contains(r)) return null;
    const own = e.target.closest?.('button, a, input, textarea');
    return own && own !== r && r.contains(own) ? null : r;
  };
  // A ranking inside a page that also listens (the profile's, under ranking-peek): the innermost one opens it, once
  root.addEventListener('click', e => { const r = !e.peekDone && rowOf(e); if (r) { e.peekDone = true; open(r); } });
  root.addEventListener('keydown', e => {
    const r = !e.peekDone && rowOf(e);
    if (r && e.target === r && (e.key === 'Enter' || e.key === ' ')) { e.peekDone = true; e.preventDefault(); open(r); }
  });
  ready();
  new MutationObserver(ready).observe(root, { childList: true, subtree: true });
}

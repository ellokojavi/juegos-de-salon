/**
 * The player's profile (lab flag `profile`, lab: #seccion-profile): one page with the player's card,
 * then three tabs, 🎖️ badges, 🏅 rankings and ⚙️ settings. Without a player it invites to sign in,
 * shows the badges this phone already earned and the rankings as /records/ does. /records/ stays
 * as it is meanwhile (the owner, 2026-11-21: «que coexistan por un tiempo»).
 *
 * What it reads is the player's own (`jugador.js`): their record in `jugadores/<jid>` (since when,
 * how many games of each), their Uno al día history, their cups and La Copa's podiums, and the
 * tables they are in. A badge earned once stays earned on this phone (`earned`'s `seen`), so a
 * first place lost this week keeps its badge.
 */
import { el } from '../assets/js/ui.js';
import { withIcon } from '../assets/js/game-icon.js';
import { getLang, langToggle, pickLang, COMMON } from '../assets/js/i18n.js';
import { SFX, soundToggle } from '../assets/js/sound.js';
import { ALL_GAMES } from '../assets/js/games.js';
import { bloqueJugador, bloqueRanking, mmss, conBandera } from '../assets/js/ranking.js';
import { jugador, leerYo } from '../assets/js/jugador.js';
import { TODOTERRENO, UAD_PUNTOS, SIEMPRE, semana, medallero, limpiarNombre, esPin } from '../assets/js/records.js';
import { nombreOfensivo } from '../assets/js/name-guard.js';
import { flag } from '../assets/js/flags.js';
import { leer as leerDia, recorrer } from '../assets/js/uno-al-dia.js';
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { BADGES, GROUPS, earned, lastOnDay, withAnnounced } from './badges.js';
import { TEXTS } from './texts.js';
import { tableOf } from './peek.js';
import { phoneFacts, LOCAL_BADGES } from '../assets/js/phone-facts.js';
import { announced } from '../assets/js/secret-achievements.js';

const lang = getLang();
const T = TEXTS[lang] || TEXTS.es;
const RK = (COMMON[lang] || COMMON.es).rk;
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));
const tap = () => SFX.tap();
const num = x => new Intl.NumberFormat(lang).format(x);
const place = p => (Number.isInteger(p) ? (lang === 'en' ? `#${p}` : `${p}.º`) : T.noPlace);
const monthName = ms => new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(ms));
/** Monthly points began in October 2026 (D-412): the months before have no table. */
const FIRST_POINTS_MONTH = '2026-10';

/** The games a player can earn badges in: launched, not hidden. */
const CATALOGUE = ALL_GAMES.filter(g => g.available !== false && !g.labs && !g.oculto);
const gameOf = id => ALL_GAMES.find(g => g.id === id);

/* ------------------------------------------------------------------ */
/* What this phone knows, and what the server adds                     */
/* ------------------------------------------------------------------ */

const SEEN = jid => `juegos-de-salon:profile-badges:${jid || 'guest'}`;
const readSeen = jid => { try { return JSON.parse(localStorage.getItem(SEEN(jid)) || '{}') || {}; } catch (_) { return {}; } };
const writeSeen = (jid, v) => { try { localStorage.setItem(SEEN(jid), JSON.stringify(v)); } catch (_) { /* not kept */ } };

/**
 * What the profile had shown when this page opened, by player: a badge is new against it for the whole visit, so its
 * «¡Nueva!» survives the page's three draws (the phone's facts, the server's, the places) and a redraw. `first`: the
 * profile never drew this player's badges here (then every earned one is new, without the reveal below).
 */
const atLoad = new Map();
function seenAtLoad(jid) {
  const k = jid || 'guest';
  if (!atLoad.has(k)) { let first = true; try { first = localStorage.getItem(SEEN(jid)) == null; } catch (_) { /* not kept */ } atLoad.set(k, { seen: readSeen(jid), first }); }
  return atLoad.get(k);
}

/**
 * The badges with their state for `f`, written down as shown. A badge the phone already celebrated in its window is
 * earned here too (`withAnnounced`, the owner, 2026-11-22): the window and the page never disagree.
 */
function badgeState(f, jid) {
  const { seen } = seenAtLoad(jid);
  const r = earned(f, seen);
  const list = withAnnounced(r.list, announced(), LOCAL_BADGES, seen);
  const out = { ...readSeen(jid), ...r.seen };
  for (const b of list) if (b.got && !out[b.id]) out[b.id] = Date.now();
  writeSeen(jid, out);
  return list;
}

/**
 * The reveal of a badge new since the last visit (the owner, 2026-11-22): its medal turns from grey to its metal
 * with a flash, once, then keeps its «¡Nueva!» glow for the visit. Each badge's start is kept, so a redraw in the
 * middle carries on where it was (a negative delay) instead of starting over. The first visit has no reveal:
 * everything there is new.
 */
const REVEAL_GAP = 450;
const revealAt = new Map();
let revealUntil = null;
const calm = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function revealDelay(id) {
  const now = performance.now();
  if (!revealAt.has(id)) revealAt.set(id, Math.max(now + 350, ...[...revealAt.values()].map(t => t + REVEAL_GAP)));
  return Math.round(revealAt.get(id) - now);
}
/**
 * After a draw: the first badge being revealed comes into view if the badges' tab is showing, and stays in view until
 * its reveal and glow are over: whatever grows above it meanwhile (the server's facts, the duels, the fonts) brings
 * it back, so it is seen happening, unless the player scrolls first.
 */
function revealIntoView(root) {
  const find = () => { const b = root.querySelector('.pf-badge--reveal'); return b && !b.closest('[hidden]') ? b : null; };
  const b = find();
  if (!b || revealUntil != null) return;
  revealUntil = revealAt.get(b.dataset.badge) + 4500;
  const keep = () => {
    if (performance.now() > revealUntil) { ro?.disconnect(); return; }
    const x = find(), r = x?.getBoundingClientRect();
    if (r && (r.top < 0 || r.bottom > innerHeight)) x.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'center' });
  };
  const ro = globalThis.ResizeObserver ? new ResizeObserver(keep) : null;
  ro?.observe(document.body);
  // The player's own scroll wins: a touch or a wheel ends the follow
  for (const ev of ['touchstart', 'wheel']) addEventListener(ev, () => { revealUntil = 0; ro?.disconnect(); }, { once: true, passive: true });
  keep();
}

/** The facts this phone holds without asking anyone (a guest's, and a player's first draw): phone-facts.js. */
const localFacts = () => phoneFacts();

/** Whether this page talks to the real database (the published site) or to the test one (D-138). */
const realDb = () => !/[?&](test|records=local)\b/.test(location.search) && !/^(localhost|127\.|192\.168\.|10\.|100\.)/.test(location.hostname);

/** How many of `cups` (`[{ code, p }]`) the player created: the cup's admin is their seat. */
async function hostedOf(cups) {
  if (!realDb() || !cups.length) return 0;
  const base = firebaseConfig.databaseURL;
  const admins = await Promise.all(cups.slice(0, 40).map(c => fetch(`${base}/torneos/${c.code}/meta/admin.json`).then(r => (r.ok ? r.json() : null)).catch(() => null)));
  return cups.slice(0, 40).filter((c, i) => admins[i] === c.p).length;
}

/** How many cups the player won (`podios`, by pid) after being last on day 1: each won cup's day 1, read on the published site. */
async function climbsOf(podios, jid) {
  if (!realDb()) return 0;
  const won = Object.entries(podios || {}).flatMap(([code, c]) => (Number(c?.dias) || 2) > 1
    ? Object.entries(c?.p || {}).filter(([, x]) => x?.j === jid && x.l === 1).map(([pid]) => ({ code, pid })) : []).slice(-20);
  const base = firebaseConfig.databaseURL;
  const days = await Promise.all(won.map(w => fetch(`${base}/torneos/${w.code}/results/1.json`).then(r => (r.ok ? r.json() : null)).catch(() => null)));
  return won.filter((w, i) => days[i] && lastOnDay(days[i], w.pid)).length;
}

/** The player's facts: the phone's, plus their server record. Each read on its own: one failing leaves the rest. */
async function playerFacts(J, yo) {
  const f = localFacts();
  const [perfil, hist, cups, podios] = await Promise.all([
    J.perfil().catch(() => null), J.historialDia().catch(() => ({})), J.copas().catch(() => []), J.podios().catch(() => ({})),
  ]);
  // Uno al día from any phone: the server's days (by number) joined with this phone's (by date)
  const dias = { ...(leerDia().dias || {}) };
  for (const n of Object.keys(hist || {})) if (/^\d+$/.test(n)) dias[new Date(Number(n) * 86400000).toISOString().slice(0, 10)] ||= hist[n];
  const r = recorrer(dias, f.today, { regalos: leerDia().regalos || [] });
  f.streak = r.racha; f.bestStreak = r.mejor;
  f.dailyDays = Object.fromEntries(Object.keys(dias).map(d => [d, true]));
  const juegos = perfil?.juegos || {};
  f.byGame = Object.entries(juegos).map(([id, x]) => ({ id, n: Number(x?.n) || 0 })).filter(x => x.n > 0 && gameOf(x.id)).sort((a, b) => b.n - a.n);
  const ids = new Set(CATALOGUE.map(g => g.id));
  f.gamesPlayed = f.byGame.filter(x => ids.has(x.id)).length;
  f.plays = f.byGame.reduce((s, x) => s + x.n, 0);
  f.since = Number(perfil?.at) || 0;
  f.cups = cups.length;
  f.cupList = cups;
  const mine = medallero(podios).find(x => x.jid === yo.jid);
  f.medals = { gold: mine?.oro || 0, silver: mine?.plata || 0, bronze: mine?.bronce || 0 };
  f.podiumsByCode = podios || {};
  f.podiums = Object.entries(podios || {}).flatMap(([code, c]) => Object.values(c?.p || {}).filter(x => x.j === yo.jid).map(x => ({ code, name: c.name, end: c.end || 0, l: x.l }))).sort((a, b) => b.end - a.end);
  // Finished months of Uno al día points: the player's place when on the podium
  const months = [];
  for (let m = FIRST_POINTS_MONTH; m < f.today.slice(0, 7); m = nextMonth(m)) months.push(m);
  f.months = (await Promise.all(months.map(async m => {
    try { const v = await J.tabla(UAD_PUNTOS, `s${m}`, { top: 3 }); const i = v.top.findIndex(x => x.jid === yo.jid); return { period: `s${m}`, place: i >= 0 ? v.top[i].puesto : null }; } catch (_) { return null; }
  }))).filter(Boolean);
  [f.hosted, f.climbs] = await Promise.all([hostedOf(cups).catch(() => 0), climbsOf(podios, yo.jid).catch(() => 0)]);
  return f;
}
const nextMonth = m => { const [y, mo] = m.split('-').map(Number); return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`; };

/** Places in the overall ranking and in each game's table, read a few at a time. Adds `firsts` and `allRounder` to `f`. */
async function ranksOf(J, f, onGame) {
  const sem = semana(Date.now());
  const read = async (t, p) => { try { return (await J.tabla(t, p, { top: 10 })).yo || null; } catch (_) { return null; } };
  const [ever, week] = await Promise.all([read(TODOTERRENO, SIEMPRE), read(TODOTERRENO, sem)]);
  f.allRounder = ever?.puesto ?? null;
  f.general = { ever: ever?.puesto ?? null, week: week?.puesto ?? null };
  let firsts = 0;
  const queue = [...(f.byGame || [])];
  const worker = async () => {
    for (let g = queue.shift(); g; g = queue.shift()) {
      const { t, wins } = tableOf(g.id);
      const [e, w] = await Promise.all([read(t, SIEMPRE), read(t, sem)]);
      if (e?.puesto === 1 || w?.puesto === 1) firsts++;
      onGame(g.id, { t, wins, ever: e, week: w });
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  f.firsts = firsts;
  return f;
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

function badgeEl(b, { reveal = false } = {}) {
  const [name, desc] = b.secret && !b.got ? [T.secretName, T.secretDesc] : T.badges[b.id] || [b.id, ''];
  const show = reveal && b.new && b.got && !calm();
  return el('div', { class: `pf-badge pf-badge--${b.tier}${b.got ? '' : ' pf-badge--locked'}${b.new ? ' pf-badge--new' : ''}${show ? ' pf-badge--reveal' : ''}`, 'data-badge': b.id,
    ...(show ? { style: `--pf-d:${revealDelay(b.id)}ms` } : {}) },
    b.new ? el('span', { class: 'pf-new' }, T.isNew) : null,
    el('span', { class: 'pf-medal', 'aria-hidden': 'true' }, b.secret && !b.got ? '?' : b.icon),
    b.got && b.count > 1 ? el('span', { class: 'pf-times' }, `×${b.count}`) : null,
    el('span', { class: 'pf-name' }, name),
    el('span', { class: 'pf-desc' }, b.progress ? `${desc} · ${num(b.progress[0])} / ${num(b.progress[1])}` : desc),
    b.progress ? el('span', { class: 'pf-bar', 'aria-hidden': 'true' }, el('i', { style: `width:${Math.round(100 * b.progress[0] / b.progress[1])}%` })) : null);
}

function badgePanels(list, { only = null, reveal = false } = {}) {
  const title = { daily: T.groupDaily, cup: T.groupCup, games: T.groupGames };
  return GROUPS.map(g => {
    const all = list.filter(b => b.group === g && (!only || only(b)));
    if (!all.length) return null;
    const got = all.filter(b => b.got).length;
    return el('section', { class: 'panel pf-group', 'data-group': g },
      el('p', { class: 'lead pf-group-head' }, el('span', {}, title[g]), el('small', {}, fmt(T.groupOf, { n: got, total: all.length }))),
      el('div', { class: 'pf-grid' }, all.map(b => badgeEl(b, { reveal }))));
  });
}

function card(yo, f, list) {
  const got = list.filter(b => b.got).length;
  // The flag and the name are the player, as on every table (the owner, 2026-11-21: no initial in a circle)
  return el('section', { class: 'panel pf-card' },
    el('div', { class: 'pf-who' },
      el('div', {},
        el('p', { class: 'pf-player' }, conBandera(yo.co, yo.n)),
        el('p', { class: 'muted pf-since' }, [f.since ? fmt(T.since, { month: monthName(f.since) }) : null, fmt(T.badgesOf, { n: got, total: BADGES.length })].filter(Boolean).join(' · ')))),
    el('div', { class: 'pf-stats' },
      el('div', { class: 'pf-stat' }, el('b', {}, `🔥 ${num(f.streak || 0)}`), el('span', {}, T.statStreak)),
      el('div', { class: 'pf-stat' }, el('b', {}, num(f.plays || 0)), el('span', {}, T.statPlays)),
      el('div', { class: 'pf-stat' }, el('b', {}, `🏆 ${num(f.medals?.gold || 0)}`), el('span', {}, T.statCups))));
}

/** The 🏅 tab: the overall ranking with the player's places, their games, Uno al día's month and their cups. */
function rankingsTab(J, f) {
  const box = el('div', { class: 'pf-tab' });
  // The overall ranking, with the player's three places on top of its table
  const pos = (v, label) => el('div', { class: 'pf-place' }, el('i', { 'aria-hidden': 'true' }), el('b', {}, v), el('span', {}, label));
  const places = el('div', { class: 'pf-places' }, pos('…', T.week), pos('…', T.ever), pos('…', T.friends));
  // Each place with some joy (the owner, 2026-11-22): a medal and its metal on the podium, 🔥 in the top 10, a pop when it arrives
  const setPlace = (i, p) => {
    const box = places.children[i], ok = Number.isInteger(p) && p >= 1;
    const tier = !ok ? '' : p === 1 ? 'gold' : p === 2 ? 'silver' : p === 3 ? 'bronze' : p <= 10 ? 'top' : 'rest';
    box.className = `pf-place${tier ? ` pf-place--${tier}` : ''}`;
    box.children[0].textContent = { gold: '🥇', silver: '🥈', bronze: '🥉', top: '🔥', rest: '🎲' }[tier] || '';
    box.children[1].textContent = ok ? place(p) : T.noPlace;
  };
  const general = bloqueRanking({ juego: TODOTERRENO, titulo: T.general, hint: RK.allRounderHint, alTocar: tap });
  general.insertBefore(places, general.querySelector('.rk-seg'));
  J.tablaAmigos(TODOTERRENO, SIEMPRE).then(rows => {
    const i = rows.findIndex(x => x.jid === leerYo()?.jid);
    setPlace(2, i >= 0 && rows.length > 1 ? rows[i].puesto : null);
  }).catch(() => setPlace(2, null));
  // The player's games, most played first: their best, their place ever and this week
  const games = el('section', { class: 'panel pf-games' }, el('p', { class: 'lead rk-titulo' }, T.yourGames));
  const rows = new Map();
  const list = el('div', { class: 'pf-game-list' });
  let open = null;
  const SHOWN = 6;
  if (!f.byGame?.length) games.append(el('p', { class: 'muted rk-centro' }, T.noGames));
  else {
    games.append(el('p', { class: 'muted rk-hint' }, T.yourGamesHint), list);
    f.byGame.forEach((g, i) => {
      const game = gameOf(g.id);
      const { t, wins } = tableOf(g.id);
      const best = el('span', { class: 'pf-game-sub' }, g.n === 1 ? T.playsOne : fmt(T.plays, { n: num(g.n) }));
      const where = el('span', { class: 'pf-game-place' }, '…');
      const slot = el('div', { class: 'pf-game-table' });
      const row = el('button', { type: 'button', class: 'pf-game', 'data-game': g.id, 'aria-expanded': 'false', hidden: i >= SHOWN,
        onClick: () => {
          tap();
          const was = open === g.id;
          if (open) { const o = rows.get(open); o.slot.replaceChildren(); o.row.setAttribute('aria-expanded', 'false'); }
          open = was ? null : g.id;
          if (!was) { slot.replaceChildren(bloqueRanking({ juego: t, titulo: null, hint: wins ? RK.winsHint : null, alTocar: tap })); row.setAttribute('aria-expanded', 'true'); }
        } },
      el('span', { class: 'pf-game-name' }, withIcon(game, pickLang(game.name, lang))), best, where);
      rows.set(g.id, { row, best, where, slot, n: g.n, wins });
      list.append(row, slot);
    });
    if (f.byGame.length > SHOWN) {
      const more = el('button', { type: 'button', class: 'btn btn--ghost btn--sm pf-more', onClick: () => { tap(); list.querySelectorAll('.pf-game[hidden]').forEach(b => { b.hidden = false; }); more.remove(); } }, fmt(T.moreGames, { n: f.byGame.length - SHOWN }));
      games.append(more);
    }
  }
  // Uno al día's month and the player's cups
  const month = bloqueRanking({ juego: UAD_PUNTOS, titulo: fmt(T.dailyMonth, { month: monthName(Date.now()) }), pestanas: ['mes', 'amigosMes'], alTocar: tap });
  const cups = cupsPanel(f);
  const all = el('a', { class: 'btn btn--ghost', href: '../records/', onClick: tap }, T.allRankings);
  box.append(general, games, month, cups, all);
  return {
    box,
    /** A game's places arrived. */
    game(id, r) {
      const x = rows.get(id);
      if (!x) return;
      const b = r.ever;
      if (b) x.best.textContent = `${fmt(T.best, { score: x.wins ? num(b.s) : `${num(b.s)}${b.ms ? ` · ${mmss(b.ms)}` : ''}` })} · ${x.n === 1 ? T.playsOne : fmt(T.plays, { n: num(x.n) })}`;
      x.where.textContent = b ? place(b.puesto) : T.noPlace;
      if (r.week?.puesto) x.where.append(el('small', {}, fmt(T.placeWeek, { place: place(r.week.puesto) })));
    },
    general(g) {
      setPlace(0, g.week);
      setPlace(1, g.ever);
    },
  };
}

/**
 * 🏆 Your cups (the owner, 2026-11-22): each cup with its name, its dates, the player's final place and who won,
 * the ones in progress first and then the newest, five at a time. First what the podiums already say; then each
 * cup as La Copa's own table ranks it, from /cup/history/ in a hidden frame (the engine stays out of this page, D-377).
 */
const CUPS_PAGE = 5;
const CUPS_FRAME_MS = 15000;
const dayFmt = (ms, withYear) => new Date(ms).toLocaleDateString(lang, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
function cupDates(a, b) {
  if (!a && !b) return '';
  const y = new Date().getFullYear(), yb = new Date(b || a).getFullYear();
  if (!a || !b) return dayFmt(a || b, yb !== y);
  const da = new Date(a), db = new Date(b);
  // The same month says it once: «16 – 23 nov»
  if (da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()) return `${da.getDate()} – ${dayFmt(b, yb !== y)}`;
  return `${dayFmt(a, false)} – ${dayFmt(b, yb !== y)}`;
}
function askCups(list) {
  return new Promise(resolve => {
    const frame = el('iframe', { hidden: true, 'aria-hidden': 'true', tabindex: '-1' });
    const done = lines => { clearTimeout(timer); removeEventListener('message', onMessage); frame.remove(); resolve(lines || {}); };
    const onMessage = e => { if (e.source === frame.contentWindow && e.origin === location.origin && e.data?.type === 'cup-history') done(e.data.lines); };
    const timer = setTimeout(() => done({}), CUPS_FRAME_MS);
    addEventListener('message', onMessage);
    frame.src = `../cup/history/${realDb() ? '' : '?test'}#c=${list.slice(0, 60).map(c => `${c.code}.${c.p}`).join(',')}`;
    document.body.append(frame);
  });
}
function cupsPanel(f) {
  const box = el('section', { class: 'panel pf-cups' }, el('p', { class: 'lead rk-titulo' }, T.yourCups));
  const list = (f.cupList || []).filter(c => c?.code && c.p);
  if (!list.length) { box.append(el('p', { class: 'muted rk-centro' }, T.noCups)); return box; }
  // What the podiums say at once: the name, the end, the place when on the podium, the champion
  const fromPodium = Object.fromEntries(list.map(c => {
    const pod = f.podiumsByCode?.[c.code];
    if (!pod) return [c.code, { name: c.code, start: 0, end: Number(c.at) || 0, over: false, place: null, of: 0, champions: [], pending: true }];
    const ps = Object.entries(pod.p || {});
    const mine = ps.find(([pid]) => pid === c.p)?.[1];
    return [c.code, { name: pod.name || c.code, start: pod.end && pod.dias ? pod.end - pod.dias * 86400000 : 0, end: Number(pod.end) || 0, over: true,
      place: mine?.l || null, of: Number(pod.de) || 0, champions: ps.filter(([, x]) => x.l === 1).map(([, x]) => x.n) }];
  }));
  const wrap = el('div', { class: 'pf-cup-list' });
  let shown = CUPS_PAGE;
  const draw = lines => {
    const all = list.map(c => ({ code: c.code, ...(lines[c.code] || fromPodium[c.code]) }))
      .sort((a, b) => (a.over === b.over ? 0 : a.over ? 1 : -1) || (b.end || 0) - (a.end || 0));
    const medal = p => ['🥇', '🥈', '🥉'][p - 1] || '';
    wrap.replaceChildren(...all.slice(0, shown).map(c => {
      const won = c.over && c.place === 1;
      const champ = !c.over ? T.cupRunning : won ? T.cupYouWon : c.champions?.length ? fmt(c.champions.length > 1 ? T.cupChampions : T.cupChampion, { names: c.champions.join(', ') }) : '';
      const tier = c.place === 1 ? 'gold' : c.place === 2 ? 'silver' : c.place === 3 ? 'bronze' : '';
      return el('a', { class: `pf-cup${tier ? ` pf-cup--${tier}` : ''}${c.over ? '' : ' pf-cup--live'}`, href: `../cup/?${c.alias || c.code}${realDb() ? '' : '&test'}`, 'data-cup': c.code, onClick: tap },
        el('span', { class: 'pf-cup-place' }, c.place ? el('b', {}, medal(c.place) || place(c.place)) : el('b', {}, c.pending ? '…' : '–'),
          c.place && c.of ? el('small', {}, fmt(T.cupOf, { n: num(c.of) })) : null),
        el('span', { class: 'pf-cup-txt' },
          el('b', { class: 'pf-cup-name' }, c.name || c.code),
          el('small', {}, [cupDates(c.start, c.end), c.of ? fmt(T.cupPlayers, { n: num(c.of) }) : ''].filter(Boolean).join(' · ')),
          champ ? el('small', { class: 'pf-cup-champ' }, `${won ? '🏆 ' : c.over ? '👑 ' : '⏳ '}${champ}`) : null),
        el('span', { class: 'go', 'aria-hidden': 'true' }, '›'));
    }));
    const rest = all.length - shown;
    if (rest > 0) wrap.append(el('button', { type: 'button', class: 'btn btn--ghost btn--sm pf-more', onClick: () => { tap(); shown += CUPS_PAGE; draw(lines); } }, rest === 1 ? T.moreCupsOne : fmt(T.moreCups, { n: num(Math.min(rest, CUPS_PAGE)) })));
  };
  draw({});
  box.append(wrap);
  askCups(list).then(lines => { if (Object.keys(lines).length && wrap.isConnected) draw(lines); }).catch(() => {});
  return box;
}

/** The ⚙️ tab: the account and the preferences (offline mode's ☁️ stays on the home page; writing to us and privacy are in the footer). */
/** An account error in the player's words: the rankings' own texts. */
const accountError = e => ({ 'pin-actual': RK.errCurrentPin, espera: RK.errWait, nombre: RK.errName, 'pin-forma': RK.errPin })[e?.code] || RK.errNet;
const pinInput = (id, label) => el('input', { id, class: 'rk-pin', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '4', autocomplete: 'off', 'aria-label': label });

/**
 * 👤 Your account (D-600): the name and the PIN, each with «Cambiar», which opens its small form under
 * the row, and «Salir de tu cuenta», which asks once. Both changes ask for the PIN. Signing in is the
 * guest's page (drawGuest); signing out redraws the page as a guest.
 */
// A rename redraws the page (the card and the bars show the new name): its «Listo» waits here for the new panel
let renamed = '';
function accountPanel(yo) {
  const forms = [];
  const row = (label, hint, value, form) => {
    const btn = el('button', { type: 'button', class: 'btn btn--ghost btn--sm pf-change', 'aria-expanded': 'false' }, T.change);
    const box = el('div', { class: 'pf-form', hidden: true }, form);
    forms.push({ btn, box });
    btn.addEventListener('click', () => {
      tap();
      const open = box.hidden;
      for (const f of forms) { f.box.hidden = true; f.btn.setAttribute('aria-expanded', 'false'); f.btn.textContent = T.change; }
      box.hidden = !open; btn.setAttribute('aria-expanded', String(open));
      // While its form is open, the row's button closes it
      btn.textContent = open ? T.cancel : T.change;
      if (open) box.querySelector('input')?.focus();
    });
    return el('div', { class: 'pf-account-item' },
      el('div', { class: 'pf-account-row' }, el('span', { class: 'txt' }, el('small', { class: 'pf-account-label' }, label), value, el('small', {}, hint)), btn), box);
  };
  const say = (p, cls, text) => { p.className = cls; p.textContent = text; };

  // The name: the new one and the PIN
  const name = el('input', { id: 'pf-new-name', maxlength: '20', autocomplete: 'nickname', 'aria-label': T.newName, value: yo.n });
  const namePin = pinInput('pf-name-pin', RK.currentPin);
  const nameMsg = el('p', { class: 'rk-error', role: 'alert' });
  const saveName = el('button', { type: 'button', class: 'btn btn--cyan btn--sm', id: 'pf-save-name' }, T.saveName);
  saveName.addEventListener('click', async () => {
    tap(); say(nameMsg, 'rk-error', '');
    const n = limpiarNombre(name.value);
    if (!n) return say(nameMsg, 'rk-error', RK.errName);
    if (n === leerYo()?.n) return say(nameMsg, 'rk-error', T.sameName);
    if (!esPin(namePin.value)) return say(nameMsg, 'rk-error', RK.errPin);
    saveName.disabled = true;
    try {
      // A new name on the public tables: the obvious insults are refused, as on sign-up (D-513); lab: #seccion-name-guard
      if (nombreOfensivo(n) && await flag('name-guard').catch(() => false)) { say(nameMsg, 'rk-error', RK.errNameBad); return; }
      renamed = fmt(T.nameSaved, { name: n });
      await (await jugador()).renombrar(namePin.value, n);
      namePin.value = '';
      say(nameMsg, 'rk-ok', renamed);
    } catch (e) { renamed = ''; say(nameMsg, 'rk-error', accountError(e)); }
    finally { saveName.disabled = false; }
  });
  namePin.addEventListener('keydown', e => { if (e.key === 'Enter') saveName.click(); });

  // The PIN: the current one and the new one
  const current = pinInput('pf-pin-current', RK.currentPin);
  const fresh = pinInput('pf-pin-new', RK.newPin);
  const pinMsg = el('p', { class: 'rk-error', role: 'alert' });
  const savePin = el('button', { type: 'button', class: 'btn btn--cyan btn--sm', id: 'pf-save-pin' }, T.savePin);
  savePin.addEventListener('click', async () => {
    tap(); say(pinMsg, 'rk-error', '');
    if (!esPin(current.value) || !esPin(fresh.value)) return say(pinMsg, 'rk-error', RK.errPin);
    savePin.disabled = true;
    try { await (await jugador()).cambiarPin(current.value, fresh.value); current.value = ''; fresh.value = ''; say(pinMsg, 'rk-ok', RK.pinChanged); }
    catch (e) { say(pinMsg, 'rk-error', accountError(e)); }
    finally { savePin.disabled = false; }
  });
  fresh.addEventListener('keydown', e => { if (e.key === 'Enter') savePin.click(); });

  // Signing out: asked once, as it leaves this phone without the player
  const ask = el('div', { class: 'pf-logout-ask', hidden: true },
    el('p', { class: 'muted' }, T.logoutAsk),
    el('div', { class: 'rk-botones' },
      el('button', { type: 'button', class: 'btn btn--yellow btn--sm', id: 'pf-logout-yes', onClick: async () => { tap(); (await jugador()).salir(); } }, RK.logout),
      el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'pf-logout-no', onClick: () => { tap(); ask.hidden = true; out.hidden = false; out.focus(); } }, T.cancel)));
  const out = el('button', { type: 'button', class: 'btn btn--ghost btn--sm pf-logout', id: 'pf-logout', onClick: () => { tap(); out.hidden = true; ask.hidden = false; } }, T.logout);

  const nameNow = el('b', { class: 'pf-name-now' }, conBandera(yo.co, yo.n));
  const done = renamed ? el('p', { class: 'rk-ok', role: 'status', id: 'pf-renamed' }, renamed) : null;
  renamed = '';
  return el('section', { class: 'panel pf-settings', id: 'pf-account' }, el('p', { class: 'lead rk-titulo' }, T.account),
    row(T.nameRow, T.nameHint, nameNow, [
      el('label', { class: 'rk-campo' }, el('span', {}, T.newName), name),
      el('label', { class: 'rk-campo' }, el('span', {}, RK.currentPin), namePin),
      saveName, nameMsg,
    ]),
    done,
    row(T.pinRow, T.pinRowHint, el('b', { class: 'pf-pin-dots', 'aria-hidden': 'true' }, '••••'), [
      el('label', { class: 'rk-campo' }, el('span', {}, RK.currentPin), current),
      el('label', { class: 'rk-campo' }, el('span', {}, RK.newPin), fresh),
      savePin, pinMsg,
    ]),
    out, ask);
}

/**
 * 👁️ Your public profile: what others see when they tap your name, and a button to see it. There is nothing to
 * hide (D-605): the sheet shows where someone stands, not how much they play.
 */
function publicPanel(yo) {
  const see = el('button', { type: 'button', class: 'btn btn--ghost pf-see-public', onClick: () => { tap(); import('./peek.js').then(m => m.peekPlayer(yo.jid, { hint: yo, onTap: tap })); } }, T.seePublic);
  return el('section', { class: 'panel pf-settings pf-public' }, el('p', { class: 'lead rk-titulo' }, T.publicTitle),
    el('p', { class: 'muted rk-hint' }, T.publicHint), see);
}

function settingsTab(yo) {
  const row = (label, hint, control) => el('div', { class: 'toggle-row' }, el('span', { class: 'txt' }, el('b', {}, label), hint ? el('small', {}, hint) : null), control);
  const prefs = el('section', { class: 'panel pf-settings' }, el('p', { class: 'lead rk-titulo' }, T.prefs),
    row(T.language, null, langToggle()), row(T.sound, null, soundToggle()));
  const notices = el('div', {});
  import('../assets/js/uno-al-dia-avisos.js').then(m => {
    const draw = () => { const b = m.bloque({ lang, alTocar: tap, redibujar: draw }); notices.replaceChildren(...(b ? [b] : [])); };
    draw();
  }).catch(() => {});
  return el('div', { class: 'pf-tab' }, accountPanel(yo), publicPanel(yo), prefs, notices);
}

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */

const TABS = ['badges', 'rankings', 'settings'];

/** Draws the page in `root` for whoever is on this phone. Returns when the first draw is on screen. */
/**
 * The profile's welcome (the owner, 2026-11-22): a card over the page that says what each tab holds, open by
 * itself only on the first visit; «Entendido» or ✕ closes it and a subtle ⓘ at the title's right opens it again.
 * Opening the profile also retires the bubble the top bar's pill shows until then (profile-hint.js).
 */
async function welcome(root, sub) {
  const hint = await import('../assets/js/profile-hint.js');
  hint.demoReset();
  hint.mark(hint.BUBBLE_KEY);
  const first = (() => { try { return !localStorage.getItem(hint.INTRO_KEY); } catch (_) { return false; } })();
  // A subtle ⓘ, raised like a superscript at the title's right: no line of its own (the owner, 2026-11-22)
  const help = el('button', { type: 'button', class: 'pf-help', 'aria-controls': 'pf-intro', 'aria-expanded': 'false', 'aria-label': T.introHelp, title: T.introHelp }, 'ⓘ');
  const point = ([b, txt]) => el('li', {}, el('b', {}, b), el('span', {}, txt));
  const intro = el('section', { class: 'panel pf-intro', id: 'pf-intro', 'aria-labelledby': 'pf-intro-title', hidden: true },
    el('div', { class: 'pf-intro-head' },
      el('h2', { id: 'pf-intro-title' }, T.introTitle),
      el('button', { type: 'button', class: 'icon-btn pf-intro-x', 'aria-label': T.introClose, title: T.introClose }, '✕')),
    el('ul', { class: 'pf-intro-list' }, [T.introBadges, T.introRankings, T.introSettings].map(point)),
    el('p', { class: 'muted pf-intro-again' }, T.introAgain),
    el('button', { type: 'button', class: 'btn btn--yellow pf-intro-ok' }, T.introOk));
  const show = (open, { focus = false } = {}) => {
    intro.hidden = !open;
    help.setAttribute('aria-expanded', String(open));
    if (open && focus) { intro.scrollIntoView({ behavior: 'smooth', block: 'center' }); intro.querySelector('.pf-intro-ok').focus({ preventScroll: true }); }
    if (!open && focus) help.focus({ preventScroll: true });
  };
  help.addEventListener('click', () => { tap(); show(intro.hidden, { focus: true }); });
  for (const b of intro.querySelectorAll('.pf-intro-x, .pf-intro-ok')) b.addEventListener('click', () => { tap(); show(false, { focus: true }); });
  const h1 = sub.parentElement?.querySelector('h1');
  if (h1) { const row = el('div', { class: 'pf-title-row' }); h1.before(row); row.append(el('span', { 'aria-hidden': 'true' }), h1, help); }
  else sub.after(help);
  root.before(intro);
  show(first);
  if (first) hint.mark(hint.INTRO_KEY);
}

export async function drawProfile(root, { sub }) {
  welcome(root, sub).catch(() => {});
  const J = await jugador();
  let turn = 0;
  const draw = async () => {
    const mine = ++turn;
    const yo = leerYo();
    sub.textContent = yo ? T.pageSub : T.guestSub;
    if (!yo) return drawGuest(root);
    // First what the phone knows, at once; then the server's facts and places, as they arrive
    const tab = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'badges';
    let f = { ...localFacts(), byGame: [] };
    // A window only once every fact is in: the first look must note what the server knows too (💎, 🎂)
    const paint = (final = false) => {
      const list = badgeState(f, yo.jid);
      if (final) celebrateHere(list).catch(() => {});
      return list;
    };
    const badgesBox = el('div', { class: 'pf-tab' });
    const cardSlot = el('div', {});
    const seg = el('div', { class: 'seg pf-tabs', role: 'tablist' }, TABS.map(id => el('button', {
      type: 'button', role: 'tab', 'data-tab': id, onClick: () => { tap(); show(id); },
    }, T[`tab${id[0].toUpperCase()}${id.slice(1)}`])));
    const panes = { badges: badgesBox, rankings: el('div', {}), settings: settingsTab(yo) };
    function show(id) {
      seg.querySelectorAll('button').forEach(b => { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
      for (const k of TABS) panes[k].hidden = k !== id;
      history.replaceState(null, '', `#${id}`);
    }
    const reveal = !seenAtLoad(yo.jid).first;
    const repaint = list => {
      cardSlot.replaceChildren(card(yo, f, list));
      badgesBox.replaceChildren(...badgePanels(list, { reveal }).filter(Boolean));
      if (badgesBox.isConnected) revealIntoView(badgesBox);
    };
    repaint(paint());
    // Duels (lab flag rivals, duels-ui.js): under the player's card, before the tabs; lab: #seccion-rivals
    const duelsSlot = el('div', { class: 'dl-slot' });
    root.replaceChildren(cardSlot, duelsSlot, seg, panes.badges, panes.rankings, panes.settings);
    flag('rivals').then(on => on && import('../assets/js/duels-ui.js'))
      .then(m => m && mine === turn && m.seccionPerfil({ alTocar: tap })).then(box => box && duelsSlot.replaceChildren(box)).catch(() => {});
    show(tab);
    revealIntoView(badgesBox);
    try { f = { ...f, ...(await playerFacts(J, yo)) }; } catch (_) { /* offline: the phone's facts stay */ }
    if (mine !== turn) return;
    repaint(paint());
    const rk = rankingsTab(J, f);
    panes.rankings.replaceChildren(rk.box);
    await ranksOf(J, f, (id, r) => rk.game(id, r)).catch(() => {});
    if (mine !== turn) return;
    if (f.general) rk.general(f.general);
    repaint(paint(true));
  };
  // A tap on a name in any of the page's rankings opens that player's profile at a glance (the owner, 2026-11-22)
  import('./peek.js').then(m => m.peekOnTap(root, { onTap: tap })).catch(() => {});
  J.escuchar(() => draw());
  await draw();
  window.__profile = { redraw: draw };
  if (/[?&]achievement=demo\b/.test(location.search)) achievementDemo();
}

function drawGuest(root) {
  const all = badgeState(localFacts(), null);
  const reveal = !seenAtLoad(null).first;
  celebrateHere(all).catch(() => {});
  // The badges this phone could earn without a name: Uno al día's streaks and hours, and the games played
  const local = new Set(['streak-10', 'streak-30', 'month-full', 'early-bird', 'explorer', 'plays-100', 'obsession', 'premiere', 'regular', 'weekends', 'mondays',
    'night-owl', 'fiestas', 'halloween', 'xmas', 'new-year']);
  const list = all.filter(b => local.has(b.id) && (b.got || !b.secret));
  root.replaceChildren(
    bloqueJugador({ abierto: true, destacado: true, alTocar: tap }),
    el('section', { class: 'panel pf-group' },
      el('p', { class: 'lead pf-group-head' }, el('span', {}, T.guestBadges), el('small', {}, fmt(T.groupOf, { n: list.filter(b => b.got).length, total: list.length }))),
      el('div', { class: 'pf-grid' }, list.map(b => badgeEl(b, { reveal }))),
      el('p', { class: 'muted rk-hint pf-note' }, T.guestBadgesNote)),
    bloqueRanking({ juego: TODOTERRENO, titulo: T.general, hint: RK.allRounderHint, alTocar: tap }),
    bloqueRanking({ juego: UAD_PUNTOS, titulo: fmt(T.dailyMonth, { month: monthName(Date.now()) }), pestanas: ['mes', 'amigosMes'], alTocar: tap }),
    el('a', { class: 'btn btn--ghost', href: '../records/', onClick: tap }, T.allRankings));
  revealIntoView(root);
}


/**
 * `?achievement=demo` (lab flag profile): the achievement's window for each secret one and three others, with a picker under it.
 * Nothing is recorded.
 */
async function achievementDemo() {
  const { showAchievement } = await import('../assets/js/achievement-window.js');
  // The secret ones, then one badge of each metal that a game can earn (the owner, 2026-11-23)
  const secrets = BADGES.filter(b => b.secret);
  const shown = [...secrets, ...['streak-10', 'obsession', 'collector'].map(id => BADGES.find(b => b.id === id))];
  let i = shown.findIndex(b => b.id === 'xmas');
  const open = () => {
    document.querySelectorAll('.splash-capa').forEach(x => x.remove());
    const b = shown[i];
    const bar = el('div', { class: 'aw-demo' },
      ...shown.map((x, k) => el('button', { type: 'button', class: k === i ? 'on' : '', 'aria-label': T.badges[x.id]?.[0] || x.id, onClick: () => { i = k; open(); } }, x.icon)));
    showAchievement({ ...b, name: T.badges[b.id]?.[0] || b.id, text: T.badges[b.id]?.[1] || '' }, { lang, secret: b.secret ? { n: 3, total: secrets.length } : null, profileHref: '#badges', extra: bar });
  };
  open();
}

/**
 * A secret achievement the profile finds earned (the server's ones, 💎 and 🎂, or a local one no game told yet)
 * opens its window once per phone (achievement-window.js), here, where «Ver mis logros» just closes it. The
 * phone's first look only notes what was already earned (`firstLook`): nothing earned before is announced.
 */
async function celebrateHere(list) {
  if (/[?&]achievement=demo/.test(location.search)) return;
  const { announced, markAnnounced } = await import('../assets/js/secret-achievements.js');
  const { firstLook } = await import('../assets/js/achievement-window.js');
  if (firstLook(list)) return;
  const done = announced();
  const b = list.find(x => x.secret && x.got && !done[x.id]);
  if (!b || document.querySelector('.splash-capa')) return;
  const { showAchievement } = await import('../assets/js/achievement-window.js');
  markAnnounced(b.id);
  const now = announced();
  const secrets = list.filter(x => x.secret);
  showAchievement({ ...b, name: T.badges[b.id]?.[0] || b.id }, { lang, secret: { n: secrets.filter(x => x.got || now[x.id]).length, total: secrets.length }, profileHref: '#badges' });
}

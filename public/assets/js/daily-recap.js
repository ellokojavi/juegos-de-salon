/**
 * Uno al día's season recap (D-424): when a month ends, the first visits to the home page in the
 * next week tell whoever played it how the season ended: who won, their own place and points, the
 * top of the table with each player's place week by week, and a way to Uno al día. It is drawn by
 * the recap window (recap.js, D-423), after La Copa's if both are due, never both on one visit.
 *
 * The places by week are written every night by the points rebuild (`uadTemporada/s<yyyy-mm>`,
 * tools/firebase/uad-points-backfill.mjs) and read here over REST, so the home page loads nothing
 * else for it. A month is told only once its last night was computed (`t` after its last day).
 * Pure where it can be, so node tests it.
 */

/** Uno al día's history on this phone (uno-al-dia.js `KEY`): `{ dias: { 'yyyy-mm-dd': … } }`. */
export const DAILY_KEY = 'juegos-de-salon:uno-al-dia';
/** The player this phone is signed in as (jugador.js): `{ jid, n }`. */
export const PLAYER_KEY = 'juegos-de-salon:jugador';
/** The seasons whose recap this phone already saw: `['2026-10', …]`. */
export const SEASON_SEEN_KEY = 'juegos-de-salon:uno-al-dia:temporada-vista';
/** A season is told only in the first days of the next month. */
export const SEASON_DAYS = 7;
/** How many rows of the table the window shows, before the player's own if it is further down. */
export const TOP = 10;
const DB = 'https://juegos-de-salon-default-rtdb.firebaseio.com';

const storage = () => { try { return globalThis.localStorage || null; } catch (_) { return null; } };
const readJson = (key, empty) => { try { return JSON.parse(storage()?.getItem(key) || 'null') ?? empty; } catch (_) { return empty; } };
const pad = n => String(n).padStart(2, '0');
/** The phone's date, `yyyy-mm-dd` (as Uno al día counts its days). */
export const localDate = (ms = Date.now()) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
/** The month before `yyyy-mm`. */
export const monthBefore = m => { const [y, n] = m.split('-').map(Number); return n === 1 ? `${y - 1}-12` : `${y}-${pad(n - 1)}`; };
/** The last day of `yyyy-mm`. */
export const lastDayOf = m => { const [y, n] = m.split('-').map(Number); return `${m}-${pad(new Date(Date.UTC(y, n, 0)).getUTCDate())}`; };

export const seenSeasons = () => { const v = readJson(SEASON_SEEN_KEY, []); return Array.isArray(v) ? v : []; };
export function markSeasonSeen(month) {
  try { storage()?.setItem(SEASON_SEEN_KEY, JSON.stringify([month, ...seenSeasons().filter(m => m !== month)].slice(0, 24))); } catch (_) { /* no storage */ }
}
export const playedDays = () => Object.keys(readJson(DAILY_KEY, {})?.dias || {});
export const myJid = () => { const y = readJson(PLAYER_KEY, null); return typeof y?.jid === 'string' ? y.jid : null; };

/**
 * The season whose recap is due (`yyyy-mm`), or null: in the first week of a month, the month
 * before, if this phone played a day of it and has not seen its recap.
 */
export function dueSeason({ today = localDate(), days = playedDays(), seen = seenSeasons() } = {}) {
  if (Number(today.slice(8, 10)) > SEASON_DAYS) return null;
  const m = monthBefore(today.slice(0, 7));
  return days.some(d => d.startsWith(`${m}-`)) && !seen.includes(m) ? m : null;
}

/**
 * The window's rows from the season's places (`{ c, t, j }`): the top, and the player's own row
 * if it is further down; null if the season has nobody. Each row:
 * `{ jid, name, lugar, total, lugares, delta, mine }`, `lugares` with null before a player's first points.
 */
export function seasonRecap(data, jid = null) {
  const all = Object.entries(data?.j || {}).filter(([, x]) => x && Number.isFinite(x.s) && Array.isArray(x.l) && x.l.at(-1) > 0)
    .map(([id, x]) => {
      const lugares = x.l.map(l => (l > 0 ? l : null));
      const first = lugares.find(l => l != null);
      return { jid: id, name: x.n || '?', lugar: x.l.at(-1), total: x.s, lugares, delta: first - x.l.at(-1), mine: id === jid };
    })
    .sort((a, b) => a.lugar - b.lugar || b.total - a.total || a.name.localeCompare(b.name));
  if (!all.length) return null;
  const me = all.find(r => r.mine) || null;
  const rows = all.slice(0, TOP);
  if (me && !rows.includes(me)) rows.push(me);
  return { rows, me, winners: all.filter(r => r.lugar === 1), players: all.length, days: data.c || [] };
}

/**
 * The due season's recap, or null: `{ month, recap }`. A season not computed to its end yet (the
 * rebuild runs at night) or that could not be read is tried on the next visit; one with nobody in
 * it is marked seen. `month` forces one (the notification's link, the demo).
 */
export async function loadSeasonRecap({ month = dueSeason(), jid = myJid(), fetchFn = globalThis.fetch } = {}) {
  if (!month) return null;
  let data;
  try {
    const r = await fetchFn(`${DB}/uadTemporada/s${month}.json`);
    if (!r.ok) return null;
    data = await r.json();
  } catch (_) { return null; }
  if (!data || !(data.t > lastDayOf(month))) return null;
  const recap = seasonRecap(data, jid);
  if (!recap) { markSeasonSeen(month); return null; }
  return { month, recap };
}

/** `?recap=season-demo`: an October with eight players, this phone 3rd, as the window draws it. */
export function demoSeason() {
  const l = {
    a: [2, 1, 1, 1, 1], b: [1, 2, 2, 2, 2], c: [5, 4, 3, 3, 3], d: [3, 3, 4, 4, 4],
    e: [0, 6, 5, 5, 5], f: [4, 5, 6, 6, 6], g: [6, 7, 7, 7, 7], h: [0, 0, 8, 8, 8],
  };
  const names = { a: 'Chan', b: 'Mica', c: 'Javi', d: 'Vale', e: 'Maximiliano', f: 'Pancho', g: 'Tere', h: 'Nico' };
  const pts = { a: 1098, b: 1008, c: 901, d: 874, e: 702, f: 655, g: 410, h: 132 };
  const j = Object.fromEntries(Object.keys(l).map(k => [`demo000${k}`, { n: names[k], s: pts[k], l: l[k] }]));
  return { month: '2026-10', recap: seasonRecap({ c: ['2026-10-04', '2026-10-11', '2026-10-18', '2026-10-25', '2026-10-31'], t: '2026-11-01', j }, 'demo000c') };
}

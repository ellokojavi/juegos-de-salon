/**
 * The player's badges (lab flag `profile`): what each one asks, computed from what the profile page
 * reads. Pure, for node: `earned(facts)` takes the facts and returns one entry per badge.
 *
 * A badge has a tier (bronze, silver, gold), a group (daily, cup, games) and is either visible from
 * the start, locked until earned (greyed, with its progress when it has one), or secret (`secret`):
 * a secret one shows as «?» until it is earned. Some count how many times (`count`: Cup wins).
 *
 * The facts (every field optional, a missing one counts as nothing):
 *   bestStreak     the longest Uno al día streak (with its wildcards)
 *   dailyDays      { 'YYYY-MM-DD': true } the days Uno al día was played
 *   months         [{ period: 'sYYYY-MM', place }] the player's place in each finished month's points
 *   medals         { gold, silver, bronze } La Copa's podiums (records.js `medallero`)
 *   cups           how many cups the player sat in
 *   hosted         how many of them the player created
 *   plays          games finished with the player
 *   gamesPlayed    how many different games the player has finished
 *   gamesTotal     how many games there are to play
 *   firsts         in how many games the player is 1st this week or ever
 *   allRounder     the player's place in the overall ranking, ever (null if not in it)
 *   hours          { 'YYYY-MM-DD': { e, n } } games finished early (04:00–06:59) and at night (00:00–03:59), by local day
 *   bestRun        the most times this phone finished one same game in a row
 *   marks          the phone's marks kept for good (play-hours.js `addMark`): { first, days, wk, mon, played }
 *   launches       { <game>: 'YYYY-MM-DD' } the day each game came out (games.js `nuevoDesde`)
 *   byGame         [{ id, n }] games finished with the player, by game
 *   cupList        [{ code, at }] the cups the player sat in, with when
 *   climbs         how many cups the player won after being last on day 1
 *   since          when the player was created (ms)
 *   now            ms
 */

import { LOCAL_SECRETS, NIGHT_GAMES } from './secret-achievements.js';

export { NIGHT_GAMES };
export const GROUPS = ['daily', 'cup', 'games'];
export const EARLY_GAMES = 3;   // games before 7 in one morning…
export const EARLY_DAYS = 7;    // …on this many mornings
export const RUN_GAMES = 10;    // one same game in a row
export const WEEKENDS = 4;      // weekends with Saturday and Sunday played
export const MONDAYS = 4;       // Mondays with a game before 8
export const PARTY_CUPS = 3;    // cups within 7 days
export const SPECIALIST = 50;   // games of one same game
export const HOUSE_DAYS = 100;  // days with a game, not in a row
const DAY = 86400000;
const isoDay = ms => new Date(ms).toISOString().slice(0, 10);

/** The weekends (their Saturdays) with both days played: Uno al día's `days` joined with the phone's `wk`. */
export function weekendsOf(days = {}, wk = []) {
  const out = new Set(Array.isArray(wk) ? wk : []);
  for (const d of Object.keys(days || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const t = Date.parse(`${d}T12:00:00Z`);
    if (new Date(t).getUTCDay() === 6 && days[isoDay(t + DAY)]) out.add(d);
  }
  return out.size;
}

/** The days with a game: Uno al día's `days` joined with the phone's `played`. */
export const daysPlayed = (days = {}, played = []) => new Set([...Object.keys(days || {}).filter(d => days[d]), ...(Array.isArray(played) ? played : [])]).size;

/** The most cups joined within any 7 days, from `[{ at }]`. */
export function cupsInAWeek(cups = []) {
  const t = (Array.isArray(cups) ? cups : []).map(c => Number(c?.at)).filter(x => x > 0).sort((a, b) => a - b);
  let best = 0;
  for (let i = 0, j = 0; i < t.length; i++) {
    while (t[i] - t[j] >= 7 * DAY) j++;
    best = Math.max(best, i - j + 1);
  }
  return best;
}

/** How many games the phone first finished in their launch week (`first` and `launches` by game, 'YYYY-MM-DD'). */
export function premieres(first = {}, launches = {}) {
  return Object.entries(first || {}).filter(([g, d]) => {
    const from = launches?.[g];
    if (!from || typeof d !== 'string') return false;
    return d >= from && d <= isoDay(Date.parse(`${from}T12:00:00Z`) + 6 * DAY);
  }).length;
}

/** Was `pid` last on a Cup's day (`results`: { pid: { s } }): below everyone's best score, at the lowest, or absent. */
export function lastOnDay(results, pid) {
  const all = Object.values(results || {}).map(r => Number(r?.s) || 0);
  if (!all.length) return false;
  const best = Math.max(...all);
  if (!results[pid]) return true;
  const mine = Number(results[pid].s) || 0;
  return mine < best && mine <= Math.min(...all);
}

/** Whole calendar months fully played in `days` (`{ 'YYYY-MM-DD': true }`), up to `today`. */
export function fullMonths(days = {}, today = '9999-12-31') {
  const by = {};
  for (const d of Object.keys(days)) if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today) by[d.slice(0, 7)] = (by[d.slice(0, 7)] || 0) + 1;
  return Object.entries(by).filter(([m, n]) => {
    const [y, mo] = m.split('-').map(Number);
    const len = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    return n >= len && `${m}-${String(len).padStart(2, '0')}` <= today;
  }).map(([m]) => m).sort();
}

const n = x => (Number.isFinite(x) ? x : 0);
const progress = (cur, goal) => ({ got: n(cur) >= goal, progress: [Math.min(n(cur), goal), goal] });

/**
 * The catalogue, in the order the page shows it. `check(f)` says `{ got, count?, progress? }`.
 * The texts are in texts.js under the badge's id.
 */
export const BADGES = [
  // Uno al día
  { id: 'streak-10', group: 'daily', tier: 'bronze', icon: '🔥', check: f => progress(f.bestStreak, 10) },
  { id: 'streak-30', group: 'daily', tier: 'silver', icon: '🔥', check: f => progress(f.bestStreak, 30) },
  { id: 'streak-100', group: 'daily', tier: 'gold', icon: '🔥', check: f => progress(f.bestStreak, 100) },
  { id: 'month-full', group: 'daily', tier: 'silver', icon: '🗓️', check: f => { const c = fullMonths(f.dailyDays, f.today).length; return { got: c > 0, count: c }; } },
  { id: 'month-podium', group: 'daily', tier: 'bronze', icon: '🏅', check: f => { const c = (f.months || []).filter(m => m.place >= 1 && m.place <= 3).length; return { got: c > 0, count: c }; } },
  { id: 'month-champion', group: 'daily', tier: 'gold', icon: '👑', check: f => { const c = (f.months || []).filter(m => m.place === 1).length; return { got: c > 0, count: c }; } },
  { id: 'early-bird', group: 'daily', tier: 'silver', icon: '🌅', check: f => progress(Object.values(f.hours || {}).filter(h => n(h?.e) >= EARLY_GAMES).length, EARLY_DAYS) },
  // La Copa
  { id: 'cup-first', group: 'cup', tier: 'bronze', icon: '🎟️', check: f => ({ got: n(f.cups) >= 1 }) },
  { id: 'cup-five', group: 'cup', tier: 'silver', icon: '🎪', check: f => progress(f.cups, 5) },
  { id: 'cup-host', group: 'cup', tier: 'silver', icon: '🎤', check: f => progress(f.hosted, 3) },
  { id: 'cup-podium', group: 'cup', tier: 'bronze', icon: '🥉', check: f => { const m = f.medals || {}; const c = n(m.gold) + n(m.silver) + n(m.bronze); return { got: c > 0, count: c }; } },
  { id: 'cup-champion', group: 'cup', tier: 'gold', icon: '🏆', check: f => { const c = n(f.medals?.gold); return { got: c > 0, count: c }; } },
  { id: 'climber', group: 'cup', tier: 'gold', icon: '🧗', check: f => { const c = n(f.climbs); return { got: c > 0, count: c }; } },
  { id: 'party', group: 'cup', tier: 'silver', icon: '🥂', check: f => progress(cupsInAWeek(f.cupList), PARTY_CUPS) },
  // Games
  { id: 'explorer', group: 'games', tier: 'bronze', icon: '🧭', check: f => progress(f.gamesPlayed, 10) },
  { id: 'collector', group: 'games', tier: 'gold', icon: '🧩', check: f => progress(f.gamesPlayed, Math.max(1, n(f.gamesTotal))) },
  { id: 'plays-100', group: 'games', tier: 'bronze', icon: '🎲', check: f => progress(f.plays, 100) },
  { id: 'plays-1000', group: 'games', tier: 'gold', icon: '🎲', check: f => progress(f.plays, 1000) },
  { id: 'obsession', group: 'games', tier: 'silver', icon: '😬', check: f => progress(f.bestRun, RUN_GAMES) },
  { id: 'specialist', group: 'games', tier: 'silver', icon: '🎓', check: f => progress(Math.max(0, ...(f.byGame || []).map(g => n(g?.n))), SPECIALIST) },
  { id: 'premiere', group: 'games', tier: 'bronze', icon: '🎬', check: f => { const c = premieres(f.marks?.first, f.launches); return { got: c > 0, count: c }; } },
  { id: 'regular', group: 'games', tier: 'silver', icon: '🏠', check: f => progress(daysPlayed(f.dailyDays, f.marks?.played), HOUSE_DAYS) },
  { id: 'weekends', group: 'games', tier: 'silver', icon: '🛋️', check: f => progress(weekendsOf(f.dailyDays, f.marks?.wk), WEEKENDS) },
  { id: 'mondays', group: 'games', tier: 'bronze', icon: '☕', check: f => progress(Array.isArray(f.marks?.mon) ? f.marks.mon.length : 0, MONDAYS) },
  { id: 'number-one', group: 'games', tier: 'gold', icon: '🥇', check: f => ({ got: n(f.firsts) > 0, count: n(f.firsts) }) },
  { id: 'all-rounder', group: 'games', tier: 'silver', icon: '🎯', check: f => ({ got: Number.isInteger(f.allRounder) && f.allRounder >= 1 && f.allRounder <= 10 }) },
  // Secret: shown as «?» until earned
  { id: 'night-owl', group: 'games', tier: 'silver', icon: '🦉', secret: true, check: f => ({ got: LOCAL_SECRETS['night-owl'](f) }) },
  { id: 'triple-crown', group: 'games', tier: 'gold', icon: '💎', secret: true, check: f => ({ got: n(f.medals?.gold) > 0 && (f.months || []).some(m => m.place === 1) && n(f.firsts) > 0 }) },
  { id: 'one-year', group: 'games', tier: 'gold', icon: '🎂', secret: true, check: f => ({ got: n(f.since) > 0 && n(f.now) - f.since >= 365 * 86400000 }) },
  { id: 'fiestas', group: 'games', tier: 'bronze', icon: '🪁', secret: true, check: f => ({ got: LOCAL_SECRETS['fiestas'](f) }) },
  { id: 'halloween', group: 'games', tier: 'bronze', icon: '🎃', secret: true, check: f => ({ got: LOCAL_SECRETS['halloween'](f) }) },
  { id: 'xmas', group: 'games', tier: 'bronze', icon: '🎅', secret: true, check: f => ({ got: LOCAL_SECRETS['xmas'](f) }) },
  { id: 'new-year', group: 'games', tier: 'bronze', icon: '🎆', secret: true, check: f => ({ got: LOCAL_SECRETS['new-year'](f) }) },
];

/**
 * Every badge with its state: `{ ...badge, got, count, progress, new }`. `seen` is what this phone
 * already showed (`{ id: ms }`): a badge earned before stays earned (a first place lost this week
 * keeps its badge), and one not in `seen` is new. Returns `{ list, seen }` with `seen` updated.
 */
export function earned(facts = {}, seen = {}) {
  const now = n(facts.now) || Date.now();
  const out = { ...seen };
  const list = BADGES.map(b => {
    let r;
    try { r = b.check(facts) || {}; } catch (_) { r = {}; }
    const got = !!r.got || !!seen[b.id];
    const fresh = got && !seen[b.id];
    if (fresh) out[b.id] = now;
    return { ...b, got, count: r.count || 0, progress: got ? null : r.progress || null, new: fresh };
  });
  return { list, seen: out };
}

/**
 * A badge this phone already celebrated in its window stays earned on the profile (the owner, 2026-11-22: «lo
 * felicitó y al ver mis logros salía apagado»): `list` is `earned(…).list`, `done` the phone's announced ones
 * (secret-achievements.js `announced`), `local` the ids the phone tells alone (phone-facts.js `LOCAL_BADGES`; a
 * server one, 💎 or 🎂, is the player's and stays the facts'), `seen` what the profile had shown. Pure.
 */
export function withAnnounced(list = [], done = {}, local = new Set(), seen = {}) {
  return list.map(b => (!b.got && local.has(b.id) && done[b.id] ? { ...b, got: true, progress: null, new: !seen[b.id] } : b));
}

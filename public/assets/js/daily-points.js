/**
 * Uno al día points (D-412, D-414). One number that sums how well and how steadily a player plays
 * Uno al día, so it can rank everyone in a monthly season. Pure functions over the same history
 * `uno-al-dia.js` keeps (`{ fecha: { j, s } }`), with the same streak and wildcard (comodín) rules.
 *
 * A day's points:
 * - **Game**: the game's own 0–100 score, as today.
 * - **Streak bonus**: +5 per day of the streak that day, up to +50 (a 10-day streak).
 * - **Wildcard day**: a missed day that a 🧊 saves gives 0 points but keeps the streak, so the next
 *   day still earns the full bonus. Without a wildcard the streak, and its bonus, start over.
 * - **Wildcard in hand**: a 🧊 earned while already holding 2 is lost, so the prototype shows it.
 *
 * The season is the calendar month: everyone starts at 0 on the 1st, so a newcomer can compete.
 */
import { COMODINES_MAX, COMODIN_CADA, FECHA, fechaDeNum, sumarDias } from './uno-al-dia.js';

export const BONUS_PER_DAY = 5;
export const BONUS_MAX = 50;
/** Inviting: when the friend finishes their first Uno al día, a 🧊 and these points (tunable, D-412). */
export const INVITE_POINTS = 10;
export const bonusFor = streak => Math.min(BONUS_MAX, Math.max(0, streak) * BONUS_PER_DAY);

/**
 * Whether a played day's result reached the server near its own date (D-465): its `at` (the server's
 * time of the write) within the window the rules give a day's points, from two days before the day's
 * UTC start to one day after it, so any time zone fits. A day uploaded later (played offline, or on a
 * phone before signing in) keeps the streak but earns no points, as on the phone, where the rules
 * refuse its `p`. A result without `at` (none today) is taken as on time. `n` is the day's number.
 * The one definition: the backfill (`tools/firebase/uad-points-backfill.mjs`) and /today/ use it (#879).
 */
export const onTime = (n, x) => typeof x?.at !== 'number' || (n * 86400000 > x.at - 172800000 && n * 86400000 < x.at + 86400000);

/**
 * The dates of the server history `{ n: { j, s, at, p? } }` that earn no points: played, without a
 * counted `p`, and uploaded outside `onTime`'s window. `walk`'s `late` option takes them.
 */
export const lateDays = hist => Object.entries(hist || {})
  .filter(([k, x]) => /^[0-9]{5}$/.test(k) && x?.j && !x.p && !onTime(Number(k), x))
  .map(([k]) => fechaDeNum(Number(k)));

/**
 * Walks the history from the first day played to `today`, as `recorrer` does, and returns every day:
 * `{ date, played, game, score, streak, bonus, points, saved }`, plus the totals.
 * Today, not played yet, is left out (it does not break the streak until midnight).
 *
 * - `gifts`: the dates a 🧊 was won by inviting (`recorrer`'s `regalos`), also capped at 2.
 * - `saved`: the server's way (the backfill, D-415). The phone decides which missed days its 🧊 save
 *   and uploads them as markers (`unoAlDia/<jid>/<n>: { c: true }`). The server spends the 🧊 it can
 *   see (every 7 days in a row, the gifts) on any missed day, as the phone does; a marked day it
 *   can't cover that way takes one of 2 more it lends once (the most a phone can hold, earned on days
 *   the server never saw). A missed day with neither breaks the streak.
 * - `late`: the dates uploaded too late for points (`lateDays`, #879): played, they keep the streak
 *   but add 0 points, as the season total from the server does (`late: true`).
 */
export function walk(days, today, { gifts = [], saved = null, late = [] } = {}) {
  const tarde = new Set(late);
  const dates = Object.keys(days).filter(f => FECHA.test(f) && f <= today).sort();
  const out = { days: [], streak: 0, wildcards: 0, best: 0 };
  if (!dates.length) return out;
  const byGift = {};
  for (const f of gifts) if (FECHA.test(f) && f <= today) byGift[f] = (byGift[f] || 0) + 1;
  const marked = saved ? new Set(saved) : null;
  let lent = marked ? COMODINES_MAX : 0;
  let row = 0;
  for (let f = dates[0]; f <= today; f = sumarDias(f, 1)) {
    if (byGift[f]) out.wildcards = Math.min(COMODINES_MAX, out.wildcards + byGift[f]);
    const d = days[f];
    if (d) {
      out.streak++; row++;
      if (row % COMODIN_CADA === 0 && out.wildcards < COMODINES_MAX) out.wildcards++;
      const bonus = bonusFor(out.streak);
      out.days.push({ date: f, played: true, game: d.j, score: d.s, streak: out.streak, bonus, points: tarde.has(f) ? 0 : d.s + bonus, saved: false, ...(tarde.has(f) ? { late: true } : {}) });
    } else if (f !== today) {
      const own = out.streak > 0 && out.wildcards > 0;
      const borrowed = !own && out.streak > 0 && lent > 0 && marked?.has(f);
      if (own || borrowed) {
        if (own) out.wildcards--; else lent--;
        out.days.push({ date: f, played: false, saved: true, streak: out.streak, bonus: 0, points: 0 });
      } else {
        out.streak = 0; row = 0;
        out.days.push({ date: f, played: false, saved: false, streak: 0, bonus: 0, points: 0 });
      }
    }
    out.best = Math.max(out.best, out.streak);
  }
  return out;
}

/** The season's total: the points of the days of `today`'s month. */
export const seasonOf = date => date.slice(0, 7);
export function seasonPoints(walked, today) {
  const s = seasonOf(today);
  return walked.days.filter(d => d.date.startsWith(s)).reduce((a, d) => a + d.points, 0);
}

/** The most a player can earn today: a perfect game plus the bonus of the streak it would make. */
export const maxToday = streak => 100 + bonusFor(streak + 1);

/**
 * Where `me` lands among `others` (`[{ name, pts }]`), best first, ties to whoever got there first
 * (the others). Returns `{ list, rank, ahead }`: `ahead` is the player just above, to chase.
 */
export function rankAmong(others, me) {
  const list = [...others, { ...me, me: true }].sort((a, b) => b.pts - a.pts || (a.me ? 1 : b.me ? -1 : 0));
  const rank = list.findIndex(x => x.me) + 1;
  return { list, rank, ahead: rank > 1 ? list[rank - 2] : null };
}

/**
 * Uno al día points (lab prototype). One number that sums how well and how steadily a player plays
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
import { COMODINES_MAX, COMODIN_CADA, FECHA, sumarDias } from '../../assets/js/uno-al-dia.js';

export const BONUS_PER_DAY = 5;
export const BONUS_MAX = 50;
export const bonusFor = streak => Math.min(BONUS_MAX, Math.max(0, streak) * BONUS_PER_DAY);

/**
 * Walks the history from the first day played to `today`, as `recorrer` does, and returns every day:
 * `{ date, played, game, score, streak, bonus, points, saved }`, plus the totals.
 * Today, not played yet, is left out (it does not break the streak until midnight).
 */
export function walk(days, today) {
  const dates = Object.keys(days).filter(f => FECHA.test(f) && f <= today).sort();
  const out = { days: [], streak: 0, wildcards: 0, best: 0 };
  if (!dates.length) return out;
  let row = 0;
  for (let f = dates[0]; f <= today; f = sumarDias(f, 1)) {
    const d = days[f];
    if (d) {
      out.streak++; row++;
      if (row % COMODIN_CADA === 0 && out.wildcards < COMODINES_MAX) out.wildcards++;
      const bonus = bonusFor(out.streak);
      out.days.push({ date: f, played: true, game: d.j, score: d.s, streak: out.streak, bonus, points: d.s + bonus, saved: false });
    } else if (f !== today) {
      if (out.streak > 0 && out.wildcards > 0) {
        out.wildcards--;
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

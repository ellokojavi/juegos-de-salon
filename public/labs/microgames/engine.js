// ¡Al toque!'s pure rules (C-2): which games a run plays, and how a run scores. No DOM.
// docs/games/microgames.md, "Scoring" and "Shared runs".
import { rng } from '../../assets/js/rng.js';

// A text's 32-bit hash (FNV-1a with a final mix), the same La Copa's seeds use: a lab game does not
// import La Copa's modules (docs/ARCHITECTURE.md), so it lives here too
const hash32 = text => { let h = 0x811c9dc5; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; };
/** A run's code: 5 letters without I or O, like a cup's, so it reads out loud and fits a link. */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const newCode = (r = Math.random) => Array.from({ length: 5 }, () => LETTERS[Math.floor(r() * LETTERS.length)]).join('');

export const RUN = 10;
/** Every three games the run speeds up by 10 %. */
export const speedAt = i => +(1 + 0.1 * Math.floor(i / 3)).toFixed(2);
/** Points for one game: 10 per star, times the speed it was played at (a ★★★ at ×1.3 is 39). */
export const gamePoints = (stars, i) => Math.round(stars * 10 * speedAt(i));
/** A streak: every game with ★★ or more right after another one adds 5 more. */
export const STREAK = 5;

/**
 * A run's points, game by game: `marks` are the stars of each game in order (0 to 3).
 * Returns `{ games: [{ stars, points, streak }], points, max }`; `max` is a perfect run.
 */
export function score(marks) {
  let run = 0, points = 0, max = 0;
  const games = marks.map((stars, i) => {
    run = stars >= 2 ? run + 1 : 0;
    const streak = run >= 2 ? STREAK : 0, p = gamePoints(stars, i) + streak;
    points += p; max += gamePoints(3, i) + (i ? STREAK : 0);
    return { stars, points: p, streak };
  });
  return { games, points, max };
}

/**
 * The 0–100 score Uno al día and La Copa compare (the platform's scale, D-412): the stars weighed by the
 * speed of each game, with no streak, so a missed game costs the same wherever it falls.
 */
export function score100(marks) {
  if (!marks.length) return 0;
  const got = marks.reduce((s, m, i) => s + m * speedAt(i), 0), all = marks.reduce((s, _, i) => s + 3 * speedAt(i), 0);
  return Math.round(got / all * 100);
}

/** A random stream: seeded (the same on every phone) when there is a seed, `Math.random` when not. */
export const stream = (seed, what) => (seed ? rng(hash32(`microgames:${seed}:${what}`)) : Math.random);

/** The run: `n` different games out of `ids`, shuffled by the seed's stream (or at random without one). */
export function runOrder(ids, seed, n = RUN) {
  const r = stream(seed, 'order'), a = ids.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

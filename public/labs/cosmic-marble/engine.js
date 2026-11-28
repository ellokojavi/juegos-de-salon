/**
 * Cosmic Marble: the score, pure (C-2). The course, its physics and its drawing are in course.js; this
 * file holds only the rules a test can check: what a stage is worth, what a run is worth, which run is
 * the best. See docs/games/cosmic-marble.md.
 */

export const STAGE_PTS = 20;   // a stage cleared inside its par
export const LIFE_PTS = 3;     // taken off for each life lost
export const STAGES = 5;

/** A stage cleared in `t` seconds with par `par`: 20 inside the par, down to 10 at twice the par and after. */
export function stagePoints(t, par) {
  const late = Math.max(0, Math.min(1, (t - par) / par));
  return Math.round(STAGE_PTS - (STAGE_PTS / 2) * late);
}

/** A run: the cleared stages' points, 3 off per life lost, never below 0 (at most 100). */
export function runScore(results, falls, done = results.length >= STAGES) {
  const base = results.reduce((a, o) => a + o.pts, 0);
  return { done, base, lost: falls, pts: Math.max(0, base - LIFE_PTS * falls) };
}

/** Whether a run beats the best one kept: more points, or the same in less time. */
export function beats(run, best) {
  if (run.pts <= 0) return false;
  if (!best) return true;
  return run.pts > best.score || (run.pts === best.score && run.time < best.time);
}

/**
 * Drift: the stages, as data (docs/rally/core.md, section 4). A stage is a list of pieces the engine
 * expands into a centreline (`buildTrack` in engine.js); nothing here is computed.
 *
 *   ['S', length]                 a straight, in metres
 *   ['L', radius, degrees]        an arc turning left
 *   ['R', radius, degrees]        an arc turning right
 *
 * and, on top of the pieces (the owner, 2026-11-27):
 *
 *   forks: [{ from, to, side, offset, surface }]   a second road from `from` to `to` m that bulges
 *          `offset` m to the left (L) or right (R) and meets the main one again: the player picks;
 *          on its own `surface` if it has one, else the main road's
 *   ramps: [{ s } | { fork, u }]   a ramp at `s` m on the main road, or a share `u` along fork n
 *   pads:  [{ s } | { fork, u }]   a boost pad, the same way
 *   narrow: [{ from, to }]           the road narrows to NARROW m (engine.js) between `from` and `to` m
 *   zones: [{ from, to, surface }]   the road changes surface between `from` and `to` m (gravel, asphalt)
 *   weather: 'wet'                   the whole stage holds less (wet asphalt, mud)
 *
 *   loop: true                       a closed circuit: the pieces turn 360° and end where they start, and
 *                                    the finish is the start line
 *
 * A gate inside a fork stands across both roads (`gate.alt` on the branch), so both pass the same gates.
 *
 * The real ones are circuits of about a minute (the owner, 2026-11-27), generated with their standards
 * by tools/generators/drift-tracks.mjs into circuits.js, one a week for everyone (decision 7). Only the
 * three-gate test stage (the e2e script, `?test`) is written by hand.
 */
import { CIRCUITS } from './circuits.js';
import { ZONA_SEMANA } from '../../assets/js/records.js';

export const TRACKS = {
  ...Object.fromEntries(CIRCUITS.map(c => [c.id, c])),
  // About 12 seconds for the autopilot: three gates, two gentle bends
  test: {
    id: 'test', gates: 3, surface: 'gravel', setting: 'meadow',
    pieces: [['S', 50], ['R', 60, 45], ['S', 40], ['L', 50, 60], ['S', 70]],
    ramps: [{ s: 200 }],
  },
};

/** The circuits the lab's 🔧 panel offers, in the pool's order (the test stage is only for `?test`). */
export const STAGES = CIRCUITS.map(c => c.id);

/**
 * The week of a moment, counted from 1970: weeks start on Monday at midnight where the Rankings'
 * week starts (`ZONA_SEMANA`, records.js), so a week's table holds one circuit.
 */
export function weekOf(ms, tz = ZONA_SEMANA) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(ms)).filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
  const day = Date.UTC(p.year, p.month - 1, p.day) / 864e5;   // 1970-01-01 was a Thursday
  return Math.floor((day + 3) / 7);
}

/** The circuit everyone drives in the week of `ms` (decision 7: one a week, the pool in turn). */
export const circuitFor = ms => STAGES[((weekOf(ms) % STAGES.length) + STAGES.length) % STAGES.length];

/** The stage a run plays without a choice: this week's circuit. */
export const DEFAULT_TRACK = 'week';

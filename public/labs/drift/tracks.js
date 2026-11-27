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
 *   forks: [{ from, to, side, offset, … }]   a second road from `from` to `to` m that bulges
 *          `offset` m to the left (L) or right (R) and meets the main one again: the player picks
 *   ramps: [{ s } | { fork, u }]   a ramp at `s` m on the main road, or a share `u` along fork n
 *   pads:  [{ s } | { fork, u }]   a boost pad, the same way
 *
 * No gate sits inside a fork, so both roads pass the same gates.
 *
 * Phase 1.1 has two stages written by hand: the three-gate test stage (the e2e script, `?test`) and one
 * real stage. The generator and the weekly pool come in phase 1.3 (tools/generators/drift-tracks.mjs).
 */

export const TRACKS = {
  // About 12 seconds for the autopilot: three gates, two gentle bends
  test: {
    id: 'test', gates: 3, surface: 'gravel', setting: 'meadow',
    pieces: [['S', 50], ['R', 60, 45], ['S', 40], ['L', 50, 60], ['S', 70]],
    pads: [{ s: 22 }], ramps: [{ s: 200 }],
  },
  // The first real stage: 9 gates, a mix of sweepers, a hairpin and a chicane
  first: {
    id: 'first', gates: 9, surface: 'gravel', setting: 'meadow',
    pieces: [
      ['S', 80], ['R', 70, 40], ['S', 60], ['L', 45, 75], ['S', 50], ['R', 30, 60], ['L', 30, 60],
      ['S', 90], ['L', 120, 35], ['S', 40], ['R', 18, 150], ['S', 70], ['L', 60, 55], ['S', 40],
      ['R', 90, 50], ['S', 120], ['L', 35, 90], ['R', 40, 70], ['S', 60], ['L', 80, 45], ['S', 100],
      ['R', 25, 100], ['S', 60], ['L', 150, 30], ['S', 80],
    ],
    // Two forks: round the hairpin tight, or wide over a boost pad; the long sweeper, or a jump
    forks: [{ from: 540, to: 650, side: 'L', offset: 14 }, { from: 370, to: 505, side: 'R', offset: 15 }],
    pads: [{ s: 40 }, { fork: 0, u: 0.45 }, { s: 1230 }],
    ramps: [{ fork: 1, u: 0.3 }, { s: 900 }],
  },
};

/** The stage a run plays: `?test` drives the short one, everyone else the first real stage. */
export const DEFAULT_TRACK = 'first';

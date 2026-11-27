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
 *   zones: [{ from, to, surface }]   the road changes surface between `from` and `to` m (gravel, asphalt)
 *   weather: 'wet'                   the whole stage holds less (wet asphalt, mud)
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
    ramps: [{ s: 200 }],
  },
  // The first real stage: 9 gates, a mix of sweepers, a hairpin and a chicane
  first: {
    id: 'first', gates: 9, surface: 'gravel', setting: 'meadow',
    pieces: [
      ['S', 150], ['R', 70, 40], ['S', 60], ['L', 45, 75], ['S', 50], ['R', 30, 60], ['L', 30, 60],
      ['S', 90], ['L', 120, 35], ['S', 40], ['R', 18, 150], ['S', 70], ['L', 60, 55], ['S', 40],
      ['R', 90, 50], ['S', 120], ['L', 35, 90], ['R', 40, 70], ['S', 60], ['L', 80, 45], ['S', 170],
      ['R', 25, 100], ['S', 60], ['L', 150, 30], ['S', 80],
    ],
    // Two forks: round the hairpin tight and short, or wide and fast; the long sweeper, or a jump.
    // A boost pad only where a long straight follows it (PAD_RUN in engine.test.mjs)
    forks: [{ from: 610, to: 720, side: 'L', offset: 14 }, { from: 432, to: 556, side: 'R', offset: 15 }],
    pads: [{ s: 8 }, { s: 1282 }],
    ramps: [{ fork: 1, u: 0.3 }, { s: 970 }],
  },
  // Fast, then technical (the owner's track ideas, 2026-11-27): a kilometre of asphalt with long
  // sweepers flat out, then the road turns to gravel for hairpins and a chicane, braking hard on the change
  split: {
    id: 'split', gates: 10, surface: 'gravel', setting: 'meadow',
    pieces: [
      ['S', 300], ['R', 220, 30], ['S', 160], ['L', 180, 45], ['S', 230], ['R', 160, 35], ['S', 140],
      ['L', 30, 80], ['S', 40], ['R', 16, 160], ['S', 50], ['L', 28, 70], ['R', 28, 70], ['S', 60],
      ['L', 18, 150], ['S', 50], ['R', 35, 90], ['S', 40], ['L', 60, 50], ['S', 60], ['R', 40, 70], ['S', 90],
    ],
    zones: [{ from: 0, to: 1260, surface: 'asphalt' }],
  },
  // Under the rain: a short technical stage on wet asphalt, where the grip is less than on dry gravel
  rain: {
    id: 'rain', gates: 8, surface: 'asphalt', setting: 'plain', weather: 'wet',
    pieces: [
      ['S', 90], ['R', 40, 90], ['S', 60], ['L', 25, 120], ['S', 70], ['R', 60, 60], ['L', 60, 60],
      ['S', 110], ['R', 20, 150], ['S', 60], ['L', 45, 80], ['S', 90], ['R', 30, 100], ['S', 50],
      ['L', 90, 40], ['S', 80], ['R', 22, 140], ['S', 70], ['L', 50, 70], ['S', 110],
    ],
  },
};

/** The stages the lab's 🔧 panel offers, in its order (the test stage is only for `?test`). */
export const STAGES = ['first', 'split', 'rain'];

/** The stage a run plays: `?test` drives the short one, everyone else the first real stage. */
export const DEFAULT_TRACK = 'first';

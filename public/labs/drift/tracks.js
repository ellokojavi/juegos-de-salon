/**
 * Drift: the stages, as data (docs/rally/core.md, section 4). A stage is a list of pieces the engine
 * expands into a centreline (`buildTrack` in engine.js); nothing here is computed.
 *
 *   ['S', length]                 a straight, in metres
 *   ['L', radius, degrees]        an arc turning left
 *   ['R', radius, degrees]        an arc turning right
 *
 * Phase 1.1 has two stages written by hand: the three-gate test stage (the e2e script, `?test`) and one
 * real stage. The generator and the weekly pool come in phase 1.3 (tools/generators/drift-tracks.mjs).
 */

export const TRACKS = {
  // About 12 seconds for the autopilot: three gates, two gentle bends
  test: {
    id: 'test', gates: 3, surface: 'gravel', setting: 'meadow',
    pieces: [['S', 50], ['R', 60, 45], ['S', 40], ['L', 50, 60], ['S', 70]],
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
  },
};

/** The stage a run plays: `?test` drives the short one, everyone else the first real stage. */
export const DEFAULT_TRACK = 'first';

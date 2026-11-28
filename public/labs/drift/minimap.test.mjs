/**
 * Drift's minimap, in node: the share of the lap it paints as driven (minimap.js, doneShare).
 *   node public/labs/drift/minimap.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from './engine.js';
import { CIRCUITS } from './circuits.js';
import { doneShare } from './minimap.js';

const track = E.buildTrack(Object.values(CIRCUITS)[0]);
const g = E.newGame({ track, mode: 'play' });

// At the start nothing is driven, even though the line is also the finish
assert.equal(doneShare(g), 0);
g.progress = track.length - 2; g.gate = 0;
assert.equal(doneShare(g), 0, 'near the line before the first gate: still the start');

// It only grows along the lap with the autopilot, and reaches 1 at the finish
g.progress = 0;
let last = 0, i = 0;
while (g.mode !== 'done' && i++ < 120 * 300) {
  E.step(g, E.autopilot(g));
  const f = doneShare(g);
  assert.ok(f >= last - 0.02, `the share went back: ${last} → ${f}`);
  last = Math.max(last, f);
}
assert.equal(g.mode, 'done');
assert.equal(doneShare(g), 1);
console.log('minimap: the share starts at 0, grows along the lap and ends at 1');

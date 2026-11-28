/**
 * Drift's ghost (ghost.js), in node: a clean autopilot lap recorded, kept, beaten, replayed and timed.
 *   node public/labs/drift/ghost.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from './engine.js';
import { CIRCUITS } from './circuits.js';
import { recorder, load, keep, better, poseAt, gapAt, lapProgress, SAMPLE_MS } from './ghost.js';

const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const track = E.buildTrack(Object.values(CIRCUITS)[0]);

/** An autopilot lap, recorded every step as game.js does every frame. */
function lap() {
  const g = E.newGame({ track, mode: 'play' }), rec = recorder();
  for (let i = 0; i < 120 * 400 && g.mode !== 'done'; i++) {
    const a = E.autopilot(g);
    E.step(g, a);
    rec.add(g);
  }
  return { g, ghost: rec.ghost(g) };
}

const { g, ghost } = lap();
assert.equal(g.mode, 'done');
assert.ok(ghost, 'a finished run is a ghost');
assert.equal(ghost.s.length / 5, Math.floor(g.t / SAMPLE_MS) + 1, 'a pose every 100 ms of the race clock');
assert.ok(JSON.stringify(ghost).length < 40000, `small enough to keep: ${JSON.stringify(ghost).length} bytes`);

// Kept per circuit; a circuit drawn again (another length) drops it
const st = mem();
assert.equal(load(track.id, track.length, st), null);
keep(ghost, st);
assert.equal(load(track.id, track.length, st).time, ghost.time);
assert.equal(load(track.id, track.length + 50, st), null);

// Only a faster run replaces it; a wreck is no ghost
assert.ok(better(ghost, null));
assert.ok(!better(ghost, ghost));
assert.ok(better({ ...ghost, time: ghost.time - 1 }, ghost));
assert.equal(recorder().ghost({ ...g, wrecked: true }), null);

// Replayed: at the start on the line, at its clock at the car's finish, and 1 % faster ahead of itself
const p0 = poseAt(ghost, 0);
assert.ok(Math.hypot(p0.x - track.pts[0].x, p0.y - track.pts[0].y) < 3);
const pEnd = poseAt(ghost, ghost.clock + 5000);
assert.ok(pEnd.done && Math.hypot(pEnd.x - g.car.x, pEnd.y - g.car.y) < 3, 'it stays where it finished');
const t = 20000, a = poseAt(ghost, t), b = poseAt(ghost, t, 1.01);
assert.ok(Math.hypot(b.x - a.x, b.y - a.y) > 1, '1 % faster is a few metres ahead after 20 s');

// The gap: 0 on its own line, positive for a slower car, negative for a faster one
const g2 = E.newGame({ track, mode: 'play' });
for (let i = 0; i < 120 * 20; i++) E.step(g2, E.autopilot(g2));
const at = lapProgress(g2);
assert.ok(Math.abs(gapAt(ghost, at, g2.t)) < 0.15, `the same driver: ${gapAt(ghost, at, g2.t)} s`);
assert.ok(gapAt(ghost, at, g2.t + 1500) > 1.3, 'a second and a half later: behind');
assert.ok(gapAt(ghost, at, g2.t - 1500) < -1.3, 'a second and a half earlier: ahead');
assert.ok(gapAt(ghost, at, g2.t, 1.01) > 0.05, 'against the 1 % faster ghost the same lap is behind');
assert.equal(gapAt(ghost, 0, 0), null, 'nothing on the start line');
console.log('ghost: recorded, kept, beaten, replayed, timed');

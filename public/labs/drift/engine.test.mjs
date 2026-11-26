/**
 * Drift's engine, in node (C-2, C-12; docs/rally/core.md, section 13). No browser: the car, the track,
 * the gates, the clock, memory and the autopilot.
 *   node public/labs/drift/engine.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from './engine.js';
import { TRACKS } from './tracks.js';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const test = () => E.buildTrack(TRACKS.test);
const first = () => E.buildTrack(TRACKS.first);
const FULL = { steer: 0, throttle: 1, brake: 0, handbrake: false };
const steps = (g, input, k) => { for (let i = 0; i < k; i++) { E.step(g, typeof input === 'function' ? input(g) : input); } return g; };
/** A car on a flat, endless straight: the first stage turned into one long road. */
const straight = () => E.buildTrack({ id: 'flat', gates: 1, pieces: [['S', 3000]] });
const drive = (track, k = 120 * 300) => { const g = E.newGame({ track }); while (g.mode !== 'done' && k--) { E.step(g, E.autopilot(g)); g.events.length = 0; } return g; };

ok('the track: starts at the origin facing north, points every 2 m, gates on the road, the last near the end', () => {
  for (const t of [test(), first()]) {
    assert.equal(t.pts[0].x, 0); assert.equal(t.pts[0].h, Math.PI / 2);
    for (let i = 1; i < t.pts.length; i++) assert.ok(Math.abs(t.pts[i].s - t.pts[i - 1].s - 2) < 0.5);
    assert.ok(t.gates.length >= 3);
    assert.ok(t.length - t.gates.at(-1).s < 12);
    for (let i = 1; i < t.gates.length; i++) assert.ok(t.gates[i].s > t.gates[i - 1].s);
  }
});

ok('every stage stays clear of itself (25 m) and the first is 8 to 10 gates', () => {
  for (const t of [test(), first()]) {
    for (let i = 0; i < t.pts.length; i++) for (let j = i + 1; j < t.pts.length; j++) {
      const a = t.pts[i], b = t.pts[j];
      if (b.s - a.s > 80) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 25, `${t.id} comes near itself at ${a.s} m`);
    }
  }
  assert.equal(TRACKS.test.gates, 3);
  assert.ok(TRACKS.first.gates >= 8 && TRACKS.first.gates <= 10);
});

ok('the clock waits for the first throttle, and counts in steps', () => {
  const g = E.newGame({ track: test() });
  steps(g, E.IDLE, 120);
  assert.equal(g.mode, 'ready'); assert.equal(g.t, 0); assert.equal(g.car.speed, 0);
  E.step(g, FULL);
  assert.equal(g.mode, 'play'); assert.equal(g.events[0].type, 'start');
  steps(g, FULL, 119);
  assert.ok(Math.abs(g.t - 1000) < 1e-6);
});

ok('the car accelerates to its top speed and no further, and stops under braking', () => {
  const g = E.newGame({ track: straight() });
  steps(g, FULL, 120 * 30);
  assert.ok(g.car.speed > E.TUNING.topGravel - 1 && g.car.speed <= E.TUNING.topGravel + 1e-6, `top ${g.car.speed}`);
  steps(g, { ...FULL, throttle: 0, brake: 1 }, 120 * 4);
  assert.equal(g.car.speed, 0);
});

ok('a gentle bend at speed holds; a tight one slides', () => {
  const at = (speed, steer) => {
    const g = E.newGame({ track: straight() });
    g.mode = 'play'; g.car.vy = speed; g.car.speed = speed;
    let slip = 0;
    for (let i = 0; i < 120; i++) { E.step(g, { steer, throttle: 1, brake: 0, handbrake: false }); slip = Math.max(slip, g.car.slip); }
    return slip;
  };
  assert.ok(at(15, 0.15) < 0.05, 'a gentle bend holds');
  assert.ok(at(25, 1) > 1, 'full lock at speed slides');
  // The handbrake loosens the rear: more slide for the same steering
  const hb = (() => { const g = E.newGame({ track: straight() }); g.mode = 'play'; g.car.vy = 18; let s = 0; for (let i = 0; i < 120; i++) { E.step(g, { steer: 0.6, throttle: 1, brake: 0, handbrake: true }); s = Math.max(s, g.car.slip); } return s; })();
  assert.ok(hb > at(18, 0.6));
});

ok('easing the steering ends a slide within about half a second', () => {
  const g = E.newGame({ track: straight() });
  g.mode = 'play'; g.car.vy = 25;
  steps(g, { steer: 1, throttle: 1, brake: 0, handbrake: false }, 60);
  assert.ok(g.car.slip > 1);
  steps(g, { steer: 0, throttle: 1, brake: 0, handbrake: false }, 70);
  assert.ok(g.car.slip < 0.2, `slip ${g.car.slip}`);
});

ok('off the road the car is slower', () => {
  const g = E.newGame({ track: straight() });
  g.car.x = 20; g.lastRoad = 0;
  steps(g, FULL, 120 * 20);
  assert.equal(g.onRoad, false);
  assert.ok(g.car.speed <= E.TUNING.topOff + 1e-6);
});

ok('determinism: the same stage and inputs give the same state', () => {
  const a = drive(first()), b = drive(first());
  assert.deepEqual(E.snapshot(a), E.snapshot(b));
});

ok('the caller: one 1-second frame (clamped to 0.1 s ten times) and 120 steps end alike', () => {
  const a = E.newGame({ track: test() }), b = E.newGame({ track: test() });
  let acc = 0;
  for (let i = 0; i < 10; i++) acc = E.run(a, E.autopilot, 0.1, acc);
  for (let i = 0; i < 120; i++) E.run(b, E.autopilot, E.STEP);
  assert.deepEqual(E.snapshot(a), E.snapshot(b));
  // A hiccup is clamped: one 5-second frame runs 0.1 s
  const c = E.newGame({ track: test() });
  E.run(c, FULL, 5);
  assert.ok(Math.abs(c.t - 100) < 9);
});

ok('the autopilot finishes the test stage with every gate, in about 12 seconds, and the first stage in 60 to 90', () => {
  const g = drive(test());
  assert.equal(g.mode, 'done'); assert.equal(g.missed, 0); assert.equal(g.splits.length, 3);
  assert.ok(g.t > 9000 && g.t < 16000, `test ${g.t}`);
  const f = drive(first());
  assert.equal(f.mode, 'done'); assert.equal(f.missed, 0); assert.equal(f.splits.length, TRACKS.first.gates);
  assert.ok(f.t > 60000 && f.t < 90000, `first ${f.t}`);
});

ok('gates: a clean pass gives a split; the finish stops the clock with a finish event', () => {
  const g = E.newGame({ track: test() });
  const seen = [];
  while (g.mode !== 'done') { E.step(g, E.autopilot(g)); seen.push(...g.events.map(e => e.type)); g.events.length = 0; }
  assert.deepEqual(seen.filter(x => x === 'gate').length, 3);
  assert.equal(seen.at(-1), 'finish');
  const t = g.t;
  steps(g, FULL, 120);
  assert.equal(g.t, t);
  assert.equal(E.total(g), Math.round(t));
});

ok('gates: driving through one backwards does not count', () => {
  const t = test(), gate = t.gates[0];
  const g = E.newGame({ track: t });
  g.mode = 'play';
  // Just past the gate, facing back down the road, rolling backwards through it
  Object.assign(g.car, { x: gate.x + Math.cos(gate.h) * 3, y: gate.y + Math.sin(gate.h) * 3, h: gate.h + Math.PI });
  g.idx = gate.i;
  g.car.vx = -Math.cos(gate.h) * 10; g.car.vy = -Math.sin(gate.h) * 10;
  steps(g, { steer: 0, throttle: 0, brake: 0, handbrake: false }, 60);
  assert.equal(g.gate, 0);
  assert.equal(g.splits.length, 0);
});

ok('gates: a miss costs its penalty and the run moves on to the next gate', () => {
  const t = test(), gate = t.gates[0];
  const g = E.newGame({ track: t });
  g.mode = 'play';
  // Beside the gate, outside its posts, driving on past it
  const lx = -Math.sin(gate.h), ly = Math.cos(gate.h);
  Object.assign(g.car, { x: gate.x - Math.cos(gate.h) * 6 + lx * 9, y: gate.y - Math.sin(gate.h) * 6 + ly * 9, h: gate.h });
  g.car.vx = Math.cos(gate.h) * 15; g.car.vy = Math.sin(gate.h) * 15;
  g.idx = gate.i - 3;
  const evs = [];
  for (let i = 0; i < 240; i++) { E.step(g, { steer: 0, throttle: 0, brake: 0, handbrake: false }); evs.push(...g.events.map(e => e.type)); g.events.length = 0; }
  assert.ok(evs.includes('miss'));
  assert.equal(g.gate, 1); assert.equal(g.missed, 1);
  assert.equal(g.penalty, E.TUNING.missPenalty);
  assert.deepEqual(g.splits, [null]);
});

ok('reset: back on the road, stopped, facing forward, with its penalty; offered after 3 s off the road', () => {
  const t = first();
  const g = E.newGame({ track: t });
  steps(g, E.autopilot, 120 * 5);
  // Turn hard off the road and keep going
  steps(g, { steer: 1, throttle: 1, brake: 0, handbrake: false }, 120 * 2);
  steps(g, FULL, 120 * 5);
  assert.equal(g.onRoad, false);
  assert.ok(E.needsReset(g));
  const before = g.penalty;
  E.reset(g);
  const p = t.pts[g.lastRoad];
  assert.equal(g.car.x, p.x); assert.equal(g.car.h, p.h); assert.equal(g.car.speed, 0);
  assert.equal(g.penalty - before, E.TUNING.resetPenalty);
  assert.ok(!E.needsReset(g));
  assert.ok(g.events.some(e => e.type === 'reset'));
});

ok('snapshot then restore continues to the same result as a run never stopped', () => {
  const a = E.newGame({ track: first() });
  steps(a, E.autopilot, 120 * 20);
  const saved = JSON.stringify(E.snapshot(a));
  const b = E.restore(JSON.parse(saved), first());
  a.events.length = 0;
  for (const g of [a, b]) while (g.mode !== 'done') { E.step(g, E.autopilot(g)); g.events.length = 0; }
  assert.deepEqual(E.snapshot(a), E.snapshot(b));
});

ok('the clock reads m:ss.mmm', () => {
  assert.equal(E.clock(0), '0:00.000');
  assert.equal(E.clock(73592), '1:13.592');
  assert.equal(E.clock(600000 + 5007), '10:05.007');
});

ok('the engine never reads a clock, a random number or the page', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('./engine.js', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for (const word of ['Math.random', 'performance', 'Date', 'document', 'window', 'canvas']) assert.ok(!src.includes(word), word);
});

console.log(`\n${n} tests, all green`);

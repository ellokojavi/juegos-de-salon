/**
 * Drift's engine, in node (C-2, C-12; docs/rally/core.md, section 13). No browser: the car, the track,
 * the gates, the clock, memory and the autopilot.
 *   node public/labs/drift/engine.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from './engine.js';
import { TRACKS, STAGES, weekOf, circuitFor } from './tracks.js';
import { CIRCUITS } from './circuits.js';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const test = () => E.buildTrack(TRACKS.test);
const first = () => E.buildTrack(TRACKS[STAGES[0]]);
const all = () => STAGES.map(id => E.buildTrack(TRACKS[id]));
/** How far apart two distances are along a track (the short way round on a circuit). */
const apart = (t, a, b) => { const d = Math.abs(b - a); return t.loop ? Math.min(d, t.length - d) : d; };
const FULL = { steer: 0, throttle: 1, brake: 0, handbrake: false };
const steps = (g, input, k) => { for (let i = 0; i < k; i++) { E.step(g, typeof input === 'function' ? input(g) : input); } return g; };
/** A car on a flat, endless straight: the first stage turned into one long road. */
const straight = () => E.buildTrack({ id: 'flat', gates: 1, relief: false, pieces: [['S', 3000]] });
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

ok('every stage stays clear of itself (25 m) and the real ones are 8 to 10 gates', () => {
  for (const t of Object.values(TRACKS).map(E.buildTrack)) {
    for (let i = 0; i < t.pts.length; i++) for (let j = i + 1; j < t.pts.length; j++) {
      const a = t.pts[i], b = t.pts[j];
      if (apart(t, a.s, b.s) > 80) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 25, `${t.id} comes near itself at ${a.s} m`);
    }
  }
  assert.equal(TRACKS.test.gates, 3);
  for (const id of STAGES) assert.ok(TRACKS[id].gates >= 8 && TRACKS[id].gates <= 10, id);
});

ok('a fork is another road: it leaves the main one and meets it again, long, apart, clear of the rest, its gates across both', () => {
  for (const t of all()) for (const b of t.branches) {
    const a0 = b.pts[0], a1 = b.pts[b.pts.length - 1], m0 = t.pts[a0.i], m1 = t.pts[a1.i];
    assert.ok(Math.hypot(a0.x - m0.x, a0.y - m0.y) < 0.5 && Math.hypot(a1.x - m1.x, a1.y - m1.y) < 0.5, 'it starts and ends on the main road');
    const far = Math.max(...b.pts.map(q => Math.hypot(q.x - t.pts[q.i].x, q.y - t.pts[q.i].y)));
    assert.ok(far >= 18, `it really splits (${far.toFixed(1)} m apart)`);
    assert.ok(b.to - b.from >= 220 - 2 * E.SAMPLE, `long enough to be another road (${(b.to - b.from).toFixed(0)} m)`);
    assert.ok(b.pts.every(q => Math.abs(q.k) <= 1 / 24 + 1e-9), 'no bend on it under 24 m');
    for (const q of b.pts) for (const p of t.pts) {
      if (apart(t, p.s, b.from) > 40 && apart(t, p.s, b.to) > 40 && (p.s < b.from || p.s > b.to)) assert.ok(Math.hypot(q.x - p.x, q.y - p.y) >= 14, `fork ${b.n} comes near the road at ${p.s} m`);
    }
    for (const g of t.gates) if (g.s > b.from && g.s < b.to) {
      assert.ok(g.alt && g.alt.fork === b.n, `gate at ${g.s} m inside fork ${b.n} stands on the branch too`);
      assert.ok(g.s > b.from + 30 && g.s < b.to - 30, `gate at ${g.s} m not where the roads part or meet`);
    }
  }
});

ok('the road eases from one piece into the next: its curvature never jumps, a bend still turns what its pieces turn', () => {
  // Laid piece to piece, a 16 m bend into its opposite jumped 2/16 in one step; eased, a thirteenth of it at most
  for (const t of [test(), ...all()]) {
    for (let i = 1; i < t.pts.length; i++) assert.ok(Math.abs(t.pts[i].k - t.pts[i - 1].k) <= 2 / 16 / (2 * E.EASE + 1) + 1e-9, `${t.id}: the curvature jumps at ${t.pts[i].s.toFixed(0)} m`);
  }
  for (const c of all().filter(t => t.loop)) assert.ok(Math.abs(c.pts.at(-1).h - c.pts[0].h - 2 * Math.PI) < 1e-6, `${c.id} turns 360°`);
});

ok('a gate inside a fork counts on the branch too', () => {
  const t = all().find(t => t.gates.some(g => g.alt)), gi = t.gates.findIndex(g => g.alt), b = t.branches[t.gates[gi].alt.fork];
  const j = b.pts.findIndex(q => q.s >= t.gates[gi].s) - 6, q = b.pts[j];
  const g = E.newGame({ track: t });
  g.mode = 'play'; g.idx = q.i; g.gate = gi;
  Object.assign(g.car, { x: q.x, y: q.y, h: q.h, px: q.x, py: q.y, vx: Math.cos(q.h) * 15, vy: Math.sin(q.h) * 15 });
  const seen = [];
  // Straight on along the branch, a second (about 15 m): through the gate's twin
  for (let i = 0; i < 120; i++) { E.step(g, { steer: 0, throttle: 0.2, brake: 0, handbrake: false }); seen.push(...g.events.map(e => e.type)); g.events.length = 0; }
  assert.ok(seen.includes('gate') && !seen.includes('miss'), seen.join(' '));
});

ok('on a fork the car on the branch is on the road, and its progress runs as on the main one', () => {
  const t = first(), b = t.branches[0], q = b.pts[Math.floor(b.pts.length / 2)];
  const g = E.newGame({ track: t });
  g.mode = 'play'; g.idx = q.i;
  Object.assign(g.car, { x: q.x, y: q.y, h: q.h, px: q.x, py: q.y, vx: Math.cos(q.h) * 10, vy: Math.sin(q.h) * 10 });
  steps(g, { ...FULL, throttle: 0.3 }, 10);
  assert.equal(g.branch, 0); assert.ok(g.onRoad, 'on the road');
  assert.ok(Math.abs(g.progress - q.s) < 4, `progress ${g.progress.toFixed(1)} against ${q.s}`);
});

ok('a boost pad pushes the car well past its top speed for a moment', () => {
  const track = straight();
  // Where the car is near its top speed (gravel gets there slowly: about 15 s)
  track.pads = [{ x: 0, y: 600, h: Math.PI / 2, s: 600, half: 1.7, len: 8 }];
  const g = E.newGame({ track });
  const events = [];
  let best = 0;
  for (let i = 0; i < 120 * 22; i++) { E.step(g, FULL); best = Math.max(best, g.car.speed); events.push(...g.events.splice(0)); }
  assert.ok(events.some(e => e.type === 'boost'));
  assert.ok(best > E.TUNING.topGravel * 1.15, `peak ${best.toFixed(1)} against top ${E.TUNING.topGravel}`);
  assert.ok(g.car.speed < E.TUNING.topGravel * 1.05, `and then back near its top speed (${g.car.speed.toFixed(1)})`);
});

ok('a ramp throws the car up; it lands where it lands, without losing a life, and cannot crash in the air', () => {
  const track = straight();
  track.ramps = [{ x: 0, y: 80, h: Math.PI / 2, s: 80, half: 3.1, len: 5 }];
  // A tree right where the car flies over it
  track.solids = [{ x: 0, y: 100, r: 0.6 }];
  const g = E.newGame({ track });
  const events = [];
  let top = 0;
  for (let i = 0; i < 120 * 10; i++) { E.step(g, FULL); top = Math.max(top, g.car.z); events.push(...g.events.splice(0)); }
  assert.ok(events.some(e => e.type === 'jump') && events.some(e => e.type === 'land'));
  assert.ok(top > 1, `it flew ${top.toFixed(2)} m high`);
  assert.equal(g.car.z, 0);
  assert.equal(g.lives, E.TUNING.lives, 'no life lost: not the landing, not the tree under it');
});

ok('every boost pad has a long straight after it, so a boosted car is not thrown at a bend', () => {
  // About how far a boosted car goes before it is back to its top speed (the owner, 2026-11-27)
  const PAD_RUN = 130;
  for (const t of [test(), ...all()]) for (const p of t.pads) {
    const path = p.fork !== undefined ? t.branches[p.fork].pts : t.pts;
    const run = path.filter(q => q.s >= p.s && q.s <= p.s + PAD_RUN);
    assert.ok(run.length && run[run.length - 1].s >= p.s + PAD_RUN - 2 * E.SAMPLE, `${t.id}: the road ends ${PAD_RUN} m after the pad at ${p.s}`);
    const turn = Math.max(...run.map(q => Math.abs(((q.h - p.h + 3 * Math.PI) % (2 * Math.PI)) - Math.PI)));
    assert.ok(turn < 0.12, `${t.id}: the road turns ${(turn * 180 / Math.PI).toFixed(0)}° within ${PAD_RUN} m of the pad at ${p.s.toFixed(0)} m`);
  }
});

ok('every ramp of a circuit has a straight after it long enough to fly and land, so a jump never ends in a bend', () => {
  // Its flight at the top speed (2 v² lift / gravity, about 115 m) and 40 m to land and brake (drift-humans.mjs)
  const RUN = Math.round(2 * E.TUNING.topAsphalt ** 2 * E.TUNING.rampLift / E.TUNING.gravity + 40);
  for (const t of all()) for (const r of t.ramps) {
    const path = r.fork !== undefined ? t.branches[r.fork].pts : t.pts;
    const run = path.filter(q => q.s >= r.s && q.s <= r.s + RUN);
    assert.ok(run.length && run[run.length - 1].s >= r.s + RUN - 2 * E.SAMPLE, `${t.id}: the road ends ${RUN} m after the ramp at ${r.s}`);
    assert.ok(run.every(q => q.k === 0), `${t.id}: a bend within ${RUN} m of the ramp at ${r.s.toFixed(0)} m`);
  }
});

ok('boosted, the car still turns as well as at its top speed', () => {
  const turnAt = speed => { const g = E.newGame({ track: straight() }); g.mode = 'play'; g.car.vy = speed; g.boost = 1; const h0 = g.car.h; steps(g, { steer: 1, throttle: 1, brake: 0, handbrake: false }, 60); return h0 - g.car.h; };
  const top = E.TUNING.topGravel;
  assert.ok(turnAt(top * 1.6) >= turnAt(top) * 0.85, `full lock in half a second: ${turnAt(top * 1.6).toFixed(2)} rad boosted against ${turnAt(top).toFixed(2)} at top speed`);
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
  // Braking stops the car (from 30 m/s in a little over two seconds), it does not slide past zero
  let n = 0;
  while (g.car.speed > 0 && n < 120 * 4) { E.step(g, { ...FULL, throttle: 0, brake: 1 }); n++; }
  assert.equal(g.car.speed, 0);
  assert.ok(n > 120 * 1.5 && n < 120 * 3, `stopped in ${n} steps`);
});

ok('the brake held with the car stopped is reverse, up to its own top speed; the throttle stops it', () => {
  const g = E.newGame({ track: straight() });
  g.mode = 'play';
  const forward = () => g.car.vx * Math.cos(g.car.h) + g.car.vy * Math.sin(g.car.h);
  steps(g, { ...FULL, throttle: 0, brake: 1 }, 120 * 10);
  assert.ok(forward() < 0, `going backwards (${forward()})`);
  assert.ok(g.car.speed <= E.TUNING.topReverse + 1e-6 && g.car.speed > E.TUNING.topReverse * 0.5, `reverse speed ${g.car.speed}`);
  steps(g, FULL, 120 * 3);
  assert.ok(forward() > 0, 'the throttle drives it forward again');
  // Waiting at the start line, the held brake never reverses
  const w = E.newGame({ track: straight() });
  steps(w, E.IDLE, 120 * 2);
  assert.equal(w.car.speed, 0);
});

ok('a tree ahead: the car bounces off, loses one life and keeps a dent at its nose; a nudge costs nothing', () => {
  const track = straight();
  track.solids = [{ x: 0, y: 40, r: 1 }];
  const g = E.newGame({ track });
  for (let i = 0; i < 120 * 6 && g.lives === E.TUNING.lives; i++) E.step(g, FULL);
  steps(g, E.IDLE, 120);
  assert.equal(g.lives, E.TUNING.lives - 1, `lives ${g.lives}`);
  assert.ok(g.car.y < 40 - 1.9, `stopped before the trunk (${g.car.y.toFixed(2)})`);
  assert.equal(g.car.hits.length, 1);
  assert.ok(g.car.hits[0].f > 1 && Math.abs(g.car.hits[0].l) < 0.5, `the dent at the nose ${JSON.stringify(g.car.hits[0])}`);
  // Pushing on at a crawl against it is a nudge, not another crash
  const before = g.lives;
  steps(g, { ...FULL, throttle: 0.2 }, 120 * 2);
  assert.ok(g.lives >= before - 1);
  // A slow touch costs nothing
  const slow = E.newGame({ track: Object.assign(straight(), { solids: [{ x: 0, y: 4.2, r: 0.5 }] }) });
  steps(slow, { ...FULL, throttle: 0.3 }, 120 * 1);
  assert.equal(slow.lives, E.TUNING.lives);
});

ok('the tenth crash wrecks the car: the run ends with no finish, and a save keeps the lives and the dents', () => {
  const track = straight();
  track.solids = [{ x: 0, y: 40, r: 1 }];
  const g = E.newGame({ track });
  const events = [];
  for (let k = 0; k < 40 && !g.wrecked; k++) {
    // Back off, then drive into it again
    steps(g, { ...FULL, throttle: 0, brake: 1 }, 120 * 2);
    steps(g, FULL, 120 * 3);
    events.push(...g.events.splice(0));
  }
  assert.ok(g.wrecked && g.mode === 'done' && g.lives === 0, `wrecked ${g.wrecked}, lives ${g.lives}`);
  assert.equal(events.filter(e => e.type === 'crash').length, E.TUNING.lives);
  assert.ok(events.some(e => e.type === 'wrecked') && !events.some(e => e.type === 'finish'));
  const t = g.t; steps(g, FULL, 120);
  assert.equal(g.t, t, 'the clock stops');
  const back = E.restore(E.snapshot(g), track);
  assert.equal(back.lives, 0); assert.equal(back.car.hits.length, E.TUNING.lives);
});

ok('a gentle bend at speed holds; a tight one slides', () => {
  const at = (speed, steer) => {
    const g = E.newGame({ track: straight() });
    g.mode = 'play'; g.car.vy = speed; g.car.speed = speed;
    let slip = 0;
    for (let i = 0; i < 120; i++) { E.step(g, { steer, throttle: 1, brake: 0, handbrake: false }); slip = Math.max(slip, g.car.slip); }
    return slip;
  };
  // A gentle bend: a little thumb at half the top speed (the lock grew twice at the owner's asking,
  // so a little thumb is 0.05 of it now); it still turns, and the tyres hold
  assert.ok(at(E.TUNING.topGravel * 0.5, 0.05) < 0.05, 'a gentle bend at half the top speed holds');
  const turned = (() => { const g = E.newGame({ track: straight() }); g.mode = 'play'; g.car.vy = E.TUNING.topGravel * 0.5; const h0 = g.car.h; steps(g, { steer: 0.05, throttle: 1, brake: 0, handbrake: false }, 120); return h0 - g.car.h; })();
  assert.ok(turned > 0.1, `the gentle bend turns (${turned.toFixed(2)} rad in a second)`);
  assert.ok(at(E.TUNING.topGravel * 0.8, 1) > 1, 'full lock at speed slides');
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

ok('the autopilot laps the test stage in about 12 seconds, and every circuit in about a minute, at its par', () => {
  const g = drive(test());
  assert.equal(g.mode, 'done'); assert.equal(g.missed, 0); assert.equal(g.splits.length, 3);
  assert.ok(g.t > 9000 && g.t < 16000, `test ${g.t}`);
  for (const id of STAGES) {
    const r = drive(E.buildTrack(TRACKS[id]));
    assert.equal(r.mode, 'done', id); assert.equal(r.missed, 0, id); assert.equal(r.splits.length, TRACKS[id].gates, id);
    assert.ok(r.t >= 55000 && r.t <= 65000, `${id} ${r.t}`);
    assert.ok(Math.abs(r.t - TRACKS[id].par) < 1000, `${id}: lapped in ${r.t} against its par ${TRACKS[id].par}`);
  }
});

ok('a circuit is closed: it ends where it starts, facing the same way, and its finish is the start line', () => {
  assert.ok(CIRCUITS.length >= 12);
  for (const t of all()) {
    assert.ok(t.loop, t.id);
    const a = t.pts[0], z = t.pts.at(-1);
    assert.ok(Math.hypot(a.x - z.x, a.y - z.y) < 0.05, `${t.id} closes within ${Math.hypot(a.x - z.x, a.y - z.y).toFixed(3)} m`);
    assert.ok(Math.abs(Math.cos(z.h - a.h) - 1) < 1e-9, `${t.id} ends facing the start`);
    assert.ok(Math.hypot(t.gates.at(-1).x - a.x, t.gates.at(-1).y - a.y) < 0.05, `${t.id}: the finish is the start line`);
    assert.equal(a.k, 0, `${t.id} starts on a straight`);
    assert.ok(t.gates.length >= 8 && t.gates.length <= 10);
    assert.ok(t.pts.every(p => !p.k || 1 / Math.abs(p.k) >= 16 - 1e-9), `${t.id}: no bend under 16 m`);
    assert.ok(t.pads.length >= 1 && t.ramps.length >= 1 && t.branches.length >= 1, `${t.id} has a pad, a ramp and a fork`);
    for (const f of [...t.pads, ...t.ramps]) assert.ok(t.gates.every(g => apart(t, g.s, f.s) >= 25), `${t.id}: a ramp or a pad 25 m from every gate`);
  }
});

ok('one circuit a week for everyone: weeks start on Monday at midnight in the Rankings\' zone, the pool in turn', () => {
  // Sunday 23:59 and Monday 00:01 in Chile (UTC-3 in November)
  const sun = Date.UTC(2026, 10, 30, 2, 59), mon = Date.UTC(2026, 10, 30, 3, 1);
  assert.equal(weekOf(mon) - weekOf(sun), 1);
  assert.equal(weekOf(mon), weekOf(mon + 6 * 864e5 + 20 * 36e5));
  // Across a year's end the count goes on
  assert.equal(weekOf(Date.UTC(2027, 0, 4, 12)) - weekOf(Date.UTC(2026, 11, 28, 12)), 1);
  const seen = new Set();
  for (let w = 0; w < STAGES.length; w++) seen.add(circuitFor(mon + w * 7 * 864e5));
  assert.equal(seen.size, STAGES.length, 'every circuit once in as many weeks');
  assert.equal(circuitFor(mon), circuitFor(mon + 3 * 864e5));
});

ok('surfaces: a stage changes surface along its zones, a fork has its own or the main road\'s, and the car reads the one under it', () => {
  const id = STAGES.find(i => TRACKS[i].zones), t = E.buildTrack(TRACKS[id]);
  const z = TRACKS[id].zones[0];
  for (const p of t.pts) assert.equal(p.sf, p.s >= z.from && p.s < z.to ? 'asphalt' : 'gravel', `${p.s} m`);
  for (const b of t.branches) for (const q of b.pts) assert.equal(q.sf, b.f.surface || t.pts[q.i].sf);
  // Driven by the autopilot: on asphalt before the change, on gravel after it
  const g = E.newGame({ track: t }); let before = null, after = null;
  while (g.mode !== 'done') { E.step(g, E.autopilot(g)); g.events.length = 0; if (g.onRoad) { if (g.progress < z.to - 20) before = g.car.surface; else if (g.progress > z.to + 20) after = g.car.surface; } }
  assert.equal(before, 'asphalt'); assert.equal(after, 'gravel');
});

ok('rain: wet asphalt holds less than dry gravel, and a car at full lock on it runs wider', () => {
  assert.ok(E.gripOf('asphalt', true) < E.gripOf('gravel', false));
  assert.ok(E.gripOf('gravel', true) < E.gripOf('gravel', false));
  assert.equal(E.gripOf('off', true), E.gripOf('off', false));
  // How far the car's travel turns in half a second at full lock, from 30 m/s
  const turn = wet => {
    const g = E.newGame({ track: E.buildTrack({ id: 'flat', gates: 1, relief: false, surface: 'asphalt', weather: wet ? 'wet' : undefined, pieces: [['S', 3000]] }) });
    while (g.car.speed < 30) E.step(g, FULL);
    const a0 = Math.atan2(g.car.vy, g.car.vx);
    steps(g, { steer: 1, throttle: 1 }, 60);
    return Math.abs(Math.atan2(g.car.vy, g.car.vx) - a0);
  };
  assert.ok(STAGES.some(i => E.buildTrack(TRACKS[i]).wet) && !first().wet);
  const wet = turn(true), dry = turn(false);
  assert.ok(wet < dry * 0.8, `wet ${wet.toFixed(2)} rad, dry ${dry.toFixed(2)} rad`);
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

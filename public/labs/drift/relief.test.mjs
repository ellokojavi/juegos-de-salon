/**
 * Drift's relief (relief.js) and what it does to the car, in node: the road's height, the slopes, the
 * crests that throw the car, the hills and dips that never do, and gravel as fast as asphalt.
 *   node public/labs/drift/relief.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from './engine.js';
import { heightAt, gradeAt } from './relief.js';
import { TRACKS, STAGES } from './tracks.js';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const tracks = () => [...new Set(['test', ...STAGES])].map(id => E.buildTrack(TRACKS[id]));
/** A straight road with one feature of relief on it, given by hand. */
const flatWith = (feature, surface = 'gravel') => {
  const t = E.buildTrack({ id: 'flat', gates: 1, relief: false, surface, pieces: [['S', 3000]] });
  t.relief = feature ? [feature] : [];
  return t;
};
/** Drives straight with the throttle down, from `v` m/s, for `seconds`; returns the flights' times. */
const drive = (track, v, seconds, throttle = 1) => {
  const g = E.newGame({ track });
  Object.assign(g.car, { vy: v }); g.mode = 'play';
  const flights = [];
  for (let i = 0; i < 120 * seconds; i++) {
    E.step(g, { throttle, steer: 0, brake: 0, handbrake: false });
    for (const e of g.events) if (e.type === 'land') flights.push(e.t);
    g.events.length = 0;
  }
  return { g, flights };
};

ok('every stage rises and falls, back at its own height at the start and at the end', () => {
  for (const t of tracks()) {
    assert.ok(t.relief.length >= 1, `${t.id} has relief`);
    assert.ok(Math.abs(heightAt(t, 0)) < 1e-9 && Math.abs(heightAt(t, t.length)) < 1e-9, t.id);
    for (const p of t.pts) assert.ok(Number.isFinite(p.e) && Math.abs(p.e) < 10 && Math.abs(p.g) < 0.3, `${t.id} at ${p.s}`);
    for (const b of t.branches) for (const p of b.pts) assert.ok(Number.isFinite(p.e), `${t.id} fork`);
  }
  const kinds = new Set(tracks().flatMap(t => t.relief.map(f => f.kind)));
  for (const k of ['hill', 'crest', 'dip', 'whoops']) assert.ok(kinds.has(k), `some stage has a ${k}`);
});

ok('the same relief for everyone: built twice, the same features', () => {
  for (const id of STAGES) assert.deepEqual(E.buildTrack(TRACKS[id]).relief, E.buildTrack(TRACKS[id]).relief);
});

ok('the grade is the height\'s slope', () => {
  for (const t of tracks()) for (let s = 1; s < t.length - 1; s += 7) {
    const d = (heightAt(t, s + 0.01) - heightAt(t, s - 0.01)) / 0.02;
    assert.ok(Math.abs(d - gradeAt(t, s)) < 1e-3, `${t.id} at ${s}`);
  }
});

ok('a jump only where the road runs nearly straight on after it, never on a fork, a ramp or a pad', () => {
  for (const t of tracks()) for (const f of t.relief.filter(f => f.kind === 'crest' || f.kind === 'whoops')) {
    for (const p of t.pts) if ([p.s, p.s + t.length].some(x => x >= f.from - 20 && x <= f.from + f.len + 90)) assert.ok(Math.abs(p.k) <= 1 / 90, `${t.id} ${f.kind} at ${f.from}`);
    for (const b of t.branches) assert.ok(f.from + f.len + 90 < b.from - 30 || f.from > b.to + 30, `${t.id} fork`);
    for (const r of [...t.ramps, ...t.pads]) assert.ok(f.from + f.len + 90 < r.s - 40 || f.from > r.s + 60, `${t.id} ramp or pad`);
  }
});

ok('over a crest, fast, the car flies and lands unharmed; slow, it stays on the ground', () => {
  const crest = { kind: 'crest', from: 400, len: 40, a: 1.8 };
  const fast = drive(flatWith(crest), 45, 14, 0.8);
  assert.ok(fast.flights.some(t => t > 0.3), `a flight: ${fast.flights}`);
  assert.equal(fast.g.lives, E.TUNING.lives);
  assert.ok(!fast.g.car.air && fast.g.car.z === 0, 'back on the ground');
  const slow = drive(flatWith(crest), 10, 50, 0.12);
  assert.ok(slow.g.progress > 450, `past it (${slow.g.progress.toFixed(0)} m)`);
  assert.deepEqual(slow.flights.filter(t => t > 0.05), [], 'no flight');
});

ok('a hill or a dip never throws the car, even boosted', () => {
  for (const t of tracks()) for (const f of t.relief.filter(f => f.kind === 'hill' || f.kind === 'dip')) {
    const one = flatWith({ ...f, from: 300 });
    const { flights } = drive(one, E.TUNING.topAsphalt * E.TUNING.boostTop, 8);
    assert.deepEqual(flights.filter(x => x > 0.05), [], `${t.id} ${f.kind} at ${f.from}`);
  }
});

ok('uphill takes speed, downhill gives it', () => {
  const hill = { kind: 'hill', from: 50, len: 600, a: 12 };
  const speedAt = s => { const g = E.newGame({ track: flatWith(hill) }); Object.assign(g.car, { vy: 30 }); g.mode = 'play';
    for (let i = 0; i < 120 * 60 && g.progress < s; i++) { E.step(g, { throttle: 1 }); g.events.length = 0; } return g.car.speed; };
  const flatAt = s => { const g = E.newGame({ track: flatWith(null) }); Object.assign(g.car, { vy: 30 }); g.mode = 'play';
    for (let i = 0; i < 120 * 60 && g.progress < s; i++) { E.step(g, { throttle: 1 }); g.events.length = 0; } return g.car.speed; };
  const top = speedAt(340) - flatAt(340), foot = speedAt(640) - flatAt(640);
  assert.ok(top < -1, `slower at the top (${top.toFixed(1)} m/s)`);
  assert.ok(foot > top + 1, `it gains it back down the far side (${foot.toFixed(1)} m/s)`);
});

ok('gravel reaches asphalt\'s top speed, only later', () => {
  const run = (surface, sec) => drive(flatWith(null, surface), 0, sec).g.car.speed;
  assert.equal(E.TUNING.topGravel, E.TUNING.topAsphalt);
  assert.ok(run('gravel', 40) > E.TUNING.topAsphalt * 0.99, 'gravel gets there');
  assert.ok(run('gravel', 8) < run('asphalt', 8) - 3, 'but slower');
});

ok('relief.js never reads a clock, a random number or the page', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('./relief.js', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for (const word of ['Math.random', 'performance', 'Date', 'document', 'window', 'canvas']) assert.ok(!src.includes(word), word);
});

console.log(`\n${n} tests, all green`);

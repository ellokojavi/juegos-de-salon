/**
 * Drift's crowd (cheer.js), in node: who jumps, when a crowd bursts into confetti, and that reduced
 * motion keeps everyone still.
 *   node public/labs/drift/cheer.test.mjs
 */
import assert from 'node:assert/strict';
import { cheer } from './cheer.js';

const fans = Array.from({ length: 12 }, (_, i) => ({ x: 100 + (i % 4), y: 10 + Math.floor(i / 4), ph: i }));
const pass = (c, still, from = -60, to = 160) => {
  for (let x = from; x <= to; x += 0.5) c.update({ x, y: 0, vx: 30, vy: 0 }, 1 / 60, still);
};

// Near the car the fans jump; far, they stand
const c = cheer();
c.setup(fans);
c.update({ x: 100, y: 0, vx: 0, vy: 0 }, 1 / 60, false);
assert.ok(c.excite(100, 10) > 0.6);
assert.ok([0, 50, 100, 150].some(t => c.lift(fans[0], t) > 0), 'a fan by the car jumps');
c.update({ x: -200, y: 0, vx: 0, vy: 0 }, 1 / 60, false);
assert.equal(c.lift(fans[0], 100), 0, 'far from the car nobody jumps');

// A car going by at speed: one burst of confetti and streamers, which flutter down and are gone
const b = cheer();
b.setup(fans);
let most = 0, streamers = 0;
for (let x = -60; x <= 160; x += 0.5) { b.update({ x, y: 0, vx: 30, vy: 0 }, 1 / 60, false); most = Math.max(most, b.parts.length); streamers = Math.max(streamers, b.parts.filter(p => p.kind === 'streamer').length); }
assert.ok(most >= 30, `a burst: ${most} pieces`);
assert.ok(streamers > 0, 'streamers among the confetti');
const peak = Math.max(0, ...b.parts.map(p => p.z));
assert.ok(peak > 0.5, `thrown up: ${peak.toFixed(1)} m`);
for (let i = 0; i < 60 * 6; i++) b.update({ x: 1000, y: 0, vx: 0, vy: 0 }, 1 / 60, false);
assert.equal(b.parts.length, 0, 'gone after a few seconds');

// Once per pass: driving on nearby does not burst again; it bursts again after the car has gone away
const o = cheer();
o.setup(fans);
o.update({ x: 60, y: 0, vx: 30, vy: 0 }, 1 / 60, false);
const first = o.parts.length;
assert.ok(first > 0);
for (let i = 0; i < 60 * 6; i++) o.update({ x: 80 + (i % 20), y: 0, vx: 30, vy: 0 }, 1 / 60, false);
assert.equal(o.parts.length, 0, 'no second burst while the car stays near');
o.update({ x: 400, y: 0, vx: 30, vy: 0 }, 1 / 60, false);
o.update({ x: 60, y: 0, vx: 30, vy: 0 }, 1 / 60, false);
assert.ok(o.parts.length > 0, 'a new pass, a new burst');

// A slow car gets no burst; reduced motion: no jumps, no bursts
const s = cheer(); s.setup(fans);
s.update({ x: 80, y: 0, vx: 3, vy: 0 }, 1 / 60, false);
assert.equal(s.parts.length, 0);
const q = cheer(); q.setup(fans);
pass(q, true);
assert.equal(q.parts.length, 0);
q.update({ x: 100, y: 0, vx: 0, vy: 0 }, 1 / 60, true);
assert.equal(q.lift(fans[0], 100), 0);

// The grandstands burst too
const st = cheer();
st.setup([], [{ x: 50, y: 20, h: 0, side: 1, len: 24, dep: 6 }]);
st.update({ x: 30, y: 0, vx: 30, vy: 0 }, 1 / 60, false);
assert.ok(st.parts.length > 0, 'a grandstand bursts');
// Confetti leaves from the hands, above the ground the fan stands on
const hz = cheer(); hz.setup([{ x: 100, y: 10, z: 3, ph: 0 }]);
hz.update({ x: 60, y: 0, vx: 30, vy: 0 }, 1 / 600, false);
assert.ok(hz.parts.length && hz.parts.every(p => p.z > 4.5), 'from 1.9 m above a fan on 3 m of ground');

console.log('cheer: jumps near the car, one burst a pass, none slow or with reduced motion, grandstands too');

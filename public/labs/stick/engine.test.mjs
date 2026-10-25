// Stick Ninja's engine (D-446): the seeded course, the stick's length from the hold, perfect, land, short and long, the streak bonus, flips, stars, crashes and pauses.
import assert from 'node:assert/strict';
import {
  newGame, pillar, current, next, press, release, suspend, stickAt, advance, flip, pause, holdFor, starTime, walkEnd, runX,
  daySeed, card, VIEW, HOLD_X, GROW, MAX_STICK, PERFECT, MAX_BONUS, TURN_MS,
} from './engine.js';

const near = (a, b, msg, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} ≠ ${b}`);
/** Plays one bridge: holds for the stick that lands `offset` from the next center, and runs to the end. */
function bridge(g, t, offset = 0) {
  press(g, t);
  const r = release(g, t + holdFor(g, offset));
  const events = advance(g, walkEnd(g) + 1);
  return { r, events, t: walkEnd(g) + 2 };
}

// The same seed is the same course; another seed is another
{
  const a = newGame(7), b = newGame(7), c = newGame(8);
  for (let k = 0; k < 60; k++) assert.deepEqual(pillar(a, k), pillar(b, k), `pillar ${k}`);
  assert.notDeepEqual([1, 2, 3, 4, 5].map(k => pillar(a, k)), [1, 2, 3, 4, 5].map(k => pillar(c, k)));
  assert.equal(daySeed('2026-10-25'), daySeed('2026-10-25'), 'a day is one seed');
  assert.notEqual(daySeed('2026-10-25'), daySeed('2026-10-26'), 'and the next day another');
}

// Every pillar fits on the screen with the one before it, and they get narrower
{
  for (const seed of [1, 2, 3, 99, 12345]) {
    const g = newGame(seed);
    for (let k = 1; k < 200; k++) {
      const p = pillar(g, k), prev = pillar(g, k - 1);
      assert.ok(p.x > prev.x + prev.w, `seed ${seed}: pillar ${k} after a gap`);
      assert.ok(p.x + p.w - (prev.x + prev.w) <= VIEW - HOLD_X - 14 + 1e-9, `seed ${seed}: pillar ${k} fits on the screen`);
      assert.ok(p.w >= 16 && p.w > PERFECT * 2, `seed ${seed}: pillar ${k} is wide enough for its flag`);
      if (p.star != null) assert.ok(p.star > prev.x + prev.w && p.star < p.x, `seed ${seed}: pillar ${k}'s star hangs in its gap`);
    }
    const avg = (a, b) => { let s = 0; for (let k = a; k < b; k++) s += pillar(g, k).w; return s / (b - a); };
    assert.ok(avg(1, 15) > avg(60, 120), `seed ${seed}: the pillars get narrower`);
  }
}

// The stick grows with the hold, only with the hold, and up to a top length
{
  const g = newGame(1);
  assert.ok(press(g, 1000));
  near(stickAt(g, 1500), GROW / 2, 'half a second, half a second of growth');
  assert.equal(stickAt(g, 1e9), MAX_STICK, 'up to a top length');
  // 60 Hz or 120 Hz: the length depends on the two timestamps, not on how often it is asked
  const a = newGame(1), b = newGame(1);
  press(a, 0); press(b, 0);
  for (let t = 0; t < 700; t += 1000 / 60) stickAt(a, t);
  for (let t = 0; t < 700; t += 1000 / 120) stickAt(b, t);
  near(release(a, 700).len, release(b, 700).len, 'the same hold is the same stick');
}

// Perfect, land, short and long
{
  const g = newGame(3);
  const { r, events } = bridge(g, 0, 0);
  assert.equal(r.kind, 'perfect');
  assert.equal(events.at(-1).type, 'arrive'); assert.equal(events.at(-1).gain, 2, 'a point and +1 for the perfect');
  assert.equal(g.score, 2); assert.equal(g.i, 1); assert.equal(g.phase, 'ready');

  const h = newGame(3);
  assert.equal(bridge(h, 0, PERFECT * 0.9).r.kind, 'perfect', 'just inside the flag is perfect');
  const k = newGame(3);
  const land = bridge(k, 0, PERFECT * 1.6);
  assert.equal(land.r.kind, 'land', 'just outside is a plain landing');
  assert.equal(k.score, 1); assert.equal(k.streak, 0);

  const s = newGame(3), w = next(s).w;
  const short = bridge(s, 0, -w / 2 - 3);
  assert.equal(short.r.kind, 'short'); assert.equal(short.events.at(-1).type, 'fall'); assert.equal(s.phase, 'over');
  const l = newGame(3);
  const long = bridge(l, 0, w / 2 + 3);
  assert.equal(long.r.kind, 'long'); assert.equal(l.phase, 'over');
  assert.deepEqual(l.kinds, ['fall']);
  assert.equal(press(l, 1e6), false, 'nothing after the end');
}

// Perfects in a row are worth more and more, up to MAX_BONUS; a plain landing breaks the streak
{
  const g = newGame(5);
  let t = 0;
  const gains = [];
  for (let k = 0; k < MAX_BONUS + 2; k++) { const b = bridge(g, t, 0); gains.push(b.events.at(-1).gain); t = b.t; }
  assert.deepEqual(gains, [2, 3, 4, 5, 6, 6, 6]);
  assert.equal(g.bestStreak, MAX_BONUS + 2);
  const b = bridge(g, t, PERFECT * 2);
  assert.equal(b.events.at(-1).gain, 1); assert.equal(g.streak, 0); assert.equal(g.bestStreak, MAX_BONUS + 2);
  assert.equal(g.perfects, MAX_BONUS + 2);
  assert.equal(g.score, gains.reduce((a, x) => a + x) + 1);
}

// The ninja runs only once the stick is down, at a steady speed
{
  const g = newGame(1);
  press(g, 0); release(g, holdFor(g));
  const w = g.walk;
  near(runX(w, w.t0 - 1), w.from, 'still while the stick falls');
  assert.ok(runX(w, w.t0 + 200) > w.from);
  near(runX(w, 1e9), w.to, 'and stops on the next pillar');
  assert.equal(w.t0 - holdFor(newGame(1)), TURN_MS);
}

/** A game on a seed whose pillar 1 has a star, ready to run to it. */
function withStar() {
  for (let seed = 1; seed < 500; seed++) {
    const g = newGame(seed);
    let t = 0;
    // Perfect bridges until the next gap has a star
    for (let k = 0; k < 30 && next(g).star == null; k++) t = bridge(g, t, 0).t;
    if (next(g).star != null) return { g, t };
  }
  throw new Error('no seed with a star');
}

// Hanging under the bridge grabs the star; flipping back before the pillar is safe
{
  const { g, t } = withStar();
  const score = g.score;
  press(g, t); release(g, t + holdFor(g));
  const w = g.walk, ts = starTime(g);
  assert.ok(flip(g, w.t0 + 10), 'a tap while running flips the ninja');
  assert.ok(flip(g, ts + 5), 'and another flips it back');
  const events = advance(g, walkEnd(g) + 1);
  assert.deepEqual(events.map(e => e.type), ['star', 'arrive']);
  assert.equal(g.stars, 1); assert.equal(g.score, score + 1 + events[1].gain, 'the star is a point, on top of the bridge');
}

// Still upside down at the pillar: a crash
{
  const { g, t } = withStar();
  press(g, t); release(g, t + holdFor(g));
  flip(g, g.walk.t0 + 10);
  const ev = advance(g, walkEnd(g) + 1).map(e => e.type);
  assert.deepEqual(ev, ['star', 'crash']);
  assert.equal(g.phase, 'over'); assert.deepEqual(g.kinds.at(-1), 'crash');
  assert.ok(walkEnd(g) < g.walk.t0 + (g.walk.to - g.walk.from) / 310 * 1000, 'it stops at the pillar, before the end of the run');
}

// A flip before the ninja runs, or once it is on the pillar, does nothing
{
  const { g, t } = withStar();
  press(g, t); release(g, t + holdFor(g));
  const w = g.walk;
  assert.equal(flip(g, w.t0 - 50), false, 'not while the stick falls');
  assert.equal(flip(g, walkEnd(g) - 1), false, 'not on the pillar');
  assert.deepEqual(advance(g, walkEnd(g) + 1).map(e => e.type), ['arrive']);
}

// The events are the same however often the game is moved on
{
  const play = step => {
    const { g, t } = withStar();
    press(g, t); release(g, t + holdFor(g));
    const ts = starTime(g); flip(g, g.walk.t0 + 1); flip(g, ts + 20);
    const ev = [];
    for (let x = t; x < walkEnd(g) + step; x += step) ev.push(...advance(g, x).map(e => e.type));
    return ev;
  };
  assert.deepEqual(play(1000 / 60), play(1000 / 120));
  assert.deepEqual(play(1000 / 60), ['star', 'arrive']);
}

// A pause: in the middle of a hold the stick stops and goes on with the next press; while running, the ninja freezes
{
  const g = newGame(2);
  press(g, 0); suspend(g, 400);
  near(stickAt(g, 50000), GROW * 0.4, 'the stick waits where it was');
  press(g, 50000);
  near(release(g, 50300).len, GROW * 0.7, 'and the next press goes on from there');

  const h = newGame(2);
  press(h, 0); release(h, holdFor(h));
  const w = h.walk, at = w.t0 + 150, x = runX(w, at);
  pause(h, 30000);
  near(runX(w, at + 30000), x, 'the ninja comes back where it was');
  assert.deepEqual(advance(h, at + 30000).length, 0, 'and has not arrived during the pause');
}

// A perfect run never ends
{
  const g = newGame(11);
  let t = 0;
  for (let k = 0; k < 150; k++) { const b = bridge(g, t, 0); assert.equal(b.r.kind, 'perfect', `bridge ${k}`); t = b.t; }
  assert.equal(g.bridges, 150);
  assert.equal(current(g), pillar(g, 150));
}

// The share card
assert.equal(card(['perfect', 'land', 'fall']), '🎯🟩🕳️');
assert.equal(card(Array(15).fill('land')).split('\n').length, 2);

console.log('✓ stick engine');

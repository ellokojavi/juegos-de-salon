// Stick Ninja's engine (D-446): the seeded course, the stick's length from the hold, perfect, land, short and long, the streak bonus, flips, stars, crashes, pauses and moving pillars.
import assert from 'node:assert/strict';
const NINJA_HALF = 9;
import {
  newGame, pillar, pillarAt, current, next, press, release, suspend, stickAt, advance, flip, pause, holdFor, starTime, walkEnd, runX,
  daySeed, card, motion, VIEW, HOLD_X, GROW, MAX_STICK, PERFECT, MAX_BONUS, TURN_MS, MIN_GAP, MOVE_FROM, PERIOD_SLOW, PERIOD_FAST,
} from './engine.js';

const near = (a, b, msg, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} ≠ ${b}`);
/** Plays one bridge: holds for the stick that lands `offset` from the next center, and runs to the end. */
function bridge(g, t, offset = 0) {
  press(g, t);
  const r = release(g, t + holdFor(g, offset, t));
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

// Every pillar fits on the screen with the one before it, all of its swing if it moves, and they get narrower
{
  for (const seed of [1, 2, 3, 99, 12345]) {
    const g = newGame(seed);
    for (let k = 1; k < 200; k++) {
      const p = pillar(g, k), prev = pillar(g, k - 1);
      const amp = p.move ? p.move.amp : 0;
      assert.ok(p.x - amp >= prev.x + prev.w + (p.move ? MIN_GAP : 1), `seed ${seed}: pillar ${k} after a gap, even at its closest`);
      assert.ok(p.x + amp + p.w - (prev.x + prev.w) <= VIEW - HOLD_X - 14 + 1e-9, `seed ${seed}: pillar ${k} fits on the screen, even at its farthest`);
      assert.ok(p.w >= 10 && p.w > PERFECT * 2, `seed ${seed}: pillar ${k} is wide enough for its flag`);
      if (p.move) assert.ok(k >= MOVE_FROM && p.star == null, `seed ${seed}: pillar ${k} moves only from ${MOVE_FROM} on, and has no star`);
      if (p.star != null) assert.ok(p.star > prev.x + prev.w && p.star < p.x, `seed ${seed}: pillar ${k}'s star hangs in its gap`);
    }
    const avg = (a, b) => { let s = 0; for (let k = a; k < b; k++) s += pillar(g, k).w; return s / (b - a); };
    assert.ok(avg(1, 15) > avg(60, 120), `seed ${seed}: the pillars get narrower`);
    assert.ok(avg(60, 200) < 20, `seed ${seed}: late in the run they are narrow (${avg(60, 200).toFixed(1)})`);
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
  const k = newGame(2); press(k, 0); suspend(k, 100);
  near(holdFor(k, 0, 9000), holdFor(newGame(2), 0, 0) - 100, 'what is left to hold counts what was held');

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

/** A game whose next pillar moves, played perfectly up to it, and the moment to start from. */
function toMoving(seed = 1) {
  const g = newGame(seed);
  let t = 0;
  while (!next(g).move) t = bridge(g, t, 0).t;
  return { g, t };
}

// Moving pillars: none before MOVE_FROM, more and faster later
{
  let early = 0, late = 0, lateN = 0, earlyN = 0;
  const slow = [], fast = [];
  for (let seed = 1; seed <= 40; seed++) {
    const g = newGame(seed);
    for (let k = 1; k < 120; k++) {
      const p = pillar(g, k);
      if (k < MOVE_FROM) assert.ok(!p.move, `seed ${seed}: pillar ${k} stands still`);
      if (k >= MOVE_FROM && k < MOVE_FROM + 10) { earlyN++; if (p.move) { early++; slow.push(p.move.period); } }
      if (k >= 70) { lateN++; if (p.move) { late++; fast.push(p.move.period); } }
    }
  }
  assert.ok(early / earlyN > 0.15 && late / lateN > early / earlyN, `more of them move later (${(early / earlyN).toFixed(2)} → ${(late / lateN).toFixed(2)})`);
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(avg(slow) > 3800 && avg(fast) === PERIOD_FAST, `slow at first, faster later (${avg(slow)} → ${avg(fast)} ms a swing)`);
  assert.equal(motion(MOVE_FROM - 1), 0); assert.equal(motion(1000), 1);
}

// A moving pillar slides while it is the one to reach, only then, and always the same way
{
  const { g, t } = toMoving();
  const p = next(g), k = g.i + 1;
  const xs = [0, 500, 1000, 1500, 2000].map(d => pillarAt(g, k, t + d).x);
  assert.ok(new Set(xs).size > 2, `it moves (${xs.map(x => x.toFixed(0))})`);
  assert.ok(xs.every(x => Math.abs(x - p.x) <= p.move.amp + 1e-9), 'within its swing');
  assert.equal(pillarAt(g, k + 1, t + 700).x, pillar(g, k + 1).x, 'the one after it waits its turn');
  const { g: h, t: th } = toMoving();
  assert.equal(pillarAt(h, k, th + 1234).x, pillarAt(g, k, t + 1234).x, 'the same course, the same slide');
}

// It is judged where it is when the stick lands, and stops there; the ninja crosses to where it stopped
{
  const { g, t } = toMoving();
  const k = g.i + 1;
  press(g, t);
  const hold = holdFor(g, 0, t), rel = t + hold;
  const there = pillarAt(g, k, rel + TURN_MS);
  const r = release(g, rel);
  assert.equal(r.kind, 'perfect', 'aiming where it will be is a perfect');
  near(pillarAt(g, k, rel + TURN_MS / 2).x, pillarAt(toMoving().g, k, rel + TURN_MS / 2).x, 'it keeps sliding while the stick falls');
  near(pillarAt(g, k, rel + TURN_MS + 5000).x, there.x, 'and stops where the stick caught it');
  const ev = advance(g, walkEnd(g) + 1);
  assert.equal(ev.at(-1).type, 'arrive'); assert.ok(ev.at(-1).moving, 'the arrival says it was a moving one');
  near(current(g).x, there.x, 'standing on it, it stays where it stopped');
  near(runX(g.walk, 1e12), there.x + there.w - NINJA_HALF - 1, 'the ninja ran to its edge');
  assert.ok(pillar(g, k + 1).x - (current(g).x + current(g).w) >= 1, 'and the next gap is still a gap');
}

// Aiming at where it is now, not where it will be, misses once it moves fast
{
  let missed = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const { g, t } = toMoving(seed);
    const now = pillarAt(g, g.i + 1, t), cur = current(g);
    press(g, t);
    const r = release(g, t + (now.x + now.w / 2 - cur.x - cur.w) / GROW * 1000);
    if (r.kind !== 'perfect') missed++;
  }
  assert.ok(missed >= 10, `aiming at where it is now is rarely perfect (${missed} of 20 not)`);
}

// A pause in front of a moving pillar: it comes back where it was
{
  const { g, t } = toMoving();
  const k = g.i + 1, at = t + 800, x = pillarAt(g, k, at).x;
  pause(g, 60000);
  near(pillarAt(g, k, at + 60000).x, x, 'the pillar waits during the pause');
}

// The share card
assert.equal(card(['perfect', 'land', 'fall']), '🎯🟩🕳️');
assert.equal(card(Array(15).fill('land')).split('\n').length, 2);

console.log('✓ stick engine');

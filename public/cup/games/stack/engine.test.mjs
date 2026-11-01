// 🗼 Babel' engine (D-445, moved from the lab to La Copa): the slide, perfect drops, cuts, misses, growing back, and fairness across frame rates.
import assert from 'node:assert/strict';
import {
  newGame, drop, movingAt, offsetAt, perfectTime, pause, score, top, speed, axisOf, card,
  BASE, RANGE, PERFECT, GROW_FROM, GROW, SPEED_MAX,
  generarDia, puntaje, tarjeta, BLOQUES_ENSAYO,
} from './engine.js';

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} ≠ ${b}`);

// The slide: in from −RANGE, out to +RANGE and back
{
  const g = newGame(0), m = g.moving;
  near(offsetAt(m, 0), -RANGE, 'it comes in from one side');
  const s = speed(0) / 1000;
  near(offsetAt(m, RANGE / s), 0, 'it crosses the tower');
  near(offsetAt(m, 2 * RANGE / s), RANGE, 'it reaches the other side');
  near(offsetAt(m, 3 * RANGE / s), 0, 'and comes back');
  assert.equal(axisOf(0), 'x'); assert.equal(axisOf(1), 'z'); assert.equal(axisOf(2), 'x');
  assert.ok(speed(10) > speed(0), 'it speeds up');
  assert.equal(speed(10000), SPEED_MAX, 'up to a top speed');
}

// Where the slab is depends only on the time, never on how often it is asked (60 Hz vs 120 Hz)
{
  const a = newGame(0), b = newGame(0);
  let x60 = 0, x120 = 0;
  for (let t = 0; t <= 1000; t += 1000 / 60) x60 = movingAt(a, 1000).x;
  for (let t = 0; t <= 1000; t += 1000 / 120) x120 = movingAt(b, 1000).x;
  near(x60, x120, 'the same position at the same moment');
}

// A perfect drop: nothing is cut, the slab keeps its size
{
  const g = newGame(0);
  const t = perfectTime(g, 0);
  near(offsetAt(g.moving, t), 0, 'perfectTime finds the moment it is over the tower');
  const r = drop(g, t);
  assert.equal(r.kind, 'perfect');
  assert.deepEqual(r.slab, { x: 0, z: 0, w: BASE, d: BASE });
  assert.equal(score(g), 1); assert.equal(g.combo, 1); assert.equal(g.perfects, 1);
  assert.equal(g.moving.axis, 'z', 'the next one slides the other way');
}

// Just inside the tolerance is still perfect; just outside is a cut
{
  const g = newGame(0), s = speed(0) / 1000;
  const t = RANGE / s + (PERFECT * 0.9) / s;
  assert.equal(drop(g, t).kind, 'perfect');
  const h = newGame(0);
  const r = drop(h, RANGE / s + (PERFECT * 1.5) / s);
  assert.equal(r.kind, 'cut');
}

// A cut: the overlap stays, the rest falls, and the two add up to the slab
{
  const g = newGame(0), s = speed(0) / 1000;
  const r = drop(g, (RANGE + 0.3) / s);   // 0.3 past the center, along x
  assert.equal(r.kind, 'cut');
  near(r.slab.w, 0.7, 'the overlap is what stays');
  near(r.slab.x, 0.15, 'centered on the overlap');
  near(r.piece.w, 0.3, 'the cut piece');
  near(r.piece.x, 0.65, 'hanging off the far edge');
  near(r.slab.w + r.piece.w, BASE, 'nothing is lost');
  assert.equal(r.slab.d, BASE, 'the other side is untouched');
  assert.equal(g.combo, 0);
  // The next slab is the size of the new top, and slides along z
  near(g.moving.w, 0.7, 'the next slab is the new top'); assert.equal(g.moving.axis, 'z');
  // Cut on the other side, along z
  const t2 = g.moving.t0 + (RANGE - 0.2) / (speed(1) / 1000);
  const r2 = drop(g, t2);
  assert.equal(r2.kind, 'cut');
  near(r2.slab.d, 0.8, 'cut along z'); near(r2.slab.z, -0.1, 'the near side stays');
  near(r2.piece.z, -0.6, 'the piece falls off the near side');
}

// A miss: the game is over and the whole slab falls
{
  const g = newGame(0);
  const r = drop(g, 0);   // still at −RANGE, off the tower
  assert.equal(r.kind, 'miss');
  assert.ok(g.over); assert.equal(score(g), 0);
  assert.equal(drop(g, 100), null, 'nothing drops after the end');
}

// Perfects in a row grow the slab back, up to the base
{
  const g = newGame(0), s = speed(0) / 1000;
  drop(g, (RANGE + 0.4) / s);   // cut to 0.6
  near(top(g).w, 0.6, 'cut first');
  let t = g.moving.t0;
  for (let k = 1; k <= GROW_FROM + 1; k++) {
    t = perfectTime(g, t);
    const r = drop(g, t);
    assert.equal(r.kind, 'perfect');
    assert.equal(r.grew, k >= GROW_FROM, `perfect ${k} grows only from the ${GROW_FROM}th in a row`);
  }
  near(top(g).w, 0.6 + 2 * GROW, 'grew twice');
  // It never grows past the base
  for (let k = 0; k < 20; k++) { t = perfectTime(g, t); drop(g, t); }
  assert.equal(top(g).w, BASE); assert.equal(top(g).d, BASE);
  assert.equal(g.best, g.combo, 'the best streak is kept');
}

// A long game played perfectly never ends
{
  const g = newGame(0);
  let t = 0;
  for (let k = 0; k < 200; k++) { t = perfectTime(g, t); assert.equal(drop(g, t).kind, 'perfect', `drop ${k}`); }
  assert.equal(score(g), 200);
}

// A pause freezes the slab where it was: after it, the slab is exactly where it was when it began
{
  const g = newGame(0);
  const at = 900, ms = 45000;
  const before = movingAt(g, at).x;
  pause(g, ms);
  near(movingAt(g, at + ms).x, before, 'it comes back where it was');
  near(movingAt(g, at + ms + 100).x - movingAt(g, at + ms).x, movingAt(newGame(0), at + 100).x - movingAt(newGame(0), at).x, 'and at the same speed');
  // A drop after the pause is judged as if there had been none
  const t = perfectTime(g, at + ms);
  assert.equal(drop(g, t).kind, 'perfect', 'a perfect drop after a pause');
  const over = newGame(0); drop(over, 0); pause(over, 1000);
  assert.equal(over.moving, null, 'nothing to pause once it is over');
}

// The share card: the last twenty, newest on top
assert.equal(card(['cut', 'perfect', 'perfect']), '🟨🟩🟩');
assert.equal(card(Array(12).fill('perfect')).split('\n').length, 2);

// La Copa: the day's game, the same for everyone; the trial is capped
{
  const a = generarDia('ABCD', 2), b = generarDia('ABCD', 2);
  assert.deepEqual(a, b, 'the same day, the same game');
  assert.equal(a.semilla, 'ABCD:2'); assert.equal(a.tope, null); assert.equal(a.ensayo, false);
  const e = generarDia('ABCD', 2, { sal: 'ensayo', ensayo: true });
  assert.equal(e.semilla, 'ABCD:2:ensayo'); assert.equal(e.tope, BLOQUES_ENSAYO); assert.equal(e.ensayo, true);
  assert.equal(JSON.parse(JSON.stringify(a)).semilla, a.semilla, 'it survives being saved');
}

// The score: a point a block plus a point a perfect drop, from 0 up to 100
{
  assert.equal(puntaje({ n: 0 }), 0);
  assert.equal(puntaje({ n: 1 }), 1, 'a cut block: 1 point');
  assert.equal(puntaje({ n: 1, perfects: 1 }), 2, 'a perfect block: 2 points');
  assert.equal(puntaje({ n: 51, perfects: 26 }), 77, 'height and precision weigh the same');
  assert.equal(puntaje({ n: 50, perfects: 50 }), 100);
  assert.equal(puntaje({ n: 99 }), 99, 'all cut: 100 needs a taller tower');
  assert.equal(puntaje({ n: 5, perfects: 40 }), 10, 'never more perfect drops than blocks');
  assert.equal(puntaje({ n: 200, perfects: 80 }), 100, 'never over 100');
  assert.equal(puntaje(null), 0); assert.equal(puntaje({ n: -3 }), 0); assert.equal(puntaje({ n: 'x' }), 0);
  for (let n = 0; n < 300; n++) { const s = puntaje({ n, perfects: n >> 1 }); assert.ok(s >= 0 && s <= 100 && Number.isInteger(s)); }
}

// The share card, from a finished game
{
  assert.equal(tarjeta({ n: 3, kinds: ['cut', 'perfect', 'perfect'] }), '🟨🟩🟩');
  assert.equal(tarjeta({ n: 0, kinds: [] }), '💥', 'no block placed');
  assert.equal(tarjeta(null), '💥');
  const t = tarjeta({ n: 30, kinds: Array(30).fill('perfect') });
  assert.equal(t.split('\n').length, 2, 'the last twenty, ten to a line');
}

console.log('✓ stack engine');

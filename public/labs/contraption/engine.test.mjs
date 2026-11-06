// Artilugio's engine: placing parts, and every level solved by its solution and failed without parts.
import assert from 'node:assert/strict';
import { LEVELS, PARTS, COLS, ROWS, newBoard, place, move, remove, flip, partAt, fits, simulate, newRun, stepRun, starsOf, segmentsOf } from './engine.js';

// Every level: its solution fits its tray and wins; an empty board does not; its parts are known
LEVELS.forEach((L, i) => {
  assert.notEqual(simulate(newBoard(i)).state, 'won', `level ${i + 1} must not solve itself`);
  const b = newBoard(i);
  for (const p of L.solution) assert.ok(place(b, p.type, p.c, p.r, p.dir ?? 1), `level ${i + 1}: the solution's ${p.type} fits`);
  assert.equal(simulate(b).state, 'won', `level ${i + 1}: the solution wins`);
  for (const t of Object.keys(L.tray)) assert.ok(PARTS.includes(t));
  assert.ok(L.goal.c >= 0 && L.goal.c + 1 < COLS && L.goal.r < ROWS);
});

// Placing: from the tray, on free cells only, and back to it
{
  const b = newBoard(0);
  assert.equal(place(b, 'spring', 2, 2), false, 'no trampoline in this tray');
  assert.equal(place(b, 'ramp', 7, 2), false, 'two cells wide: not past the right edge');
  assert.equal(place(b, 'ramp', 1, 0), false, 'not on the start');
  assert.equal(place(b, 'ramp', 5, 9), false, 'not on the cup');
  const p = place(b, 'ramp', 2, 3, 1);
  assert.ok(p); assert.equal(b.left.ramp, 0);
  assert.equal(place(b, 'ramp', 4, 6), false, 'none left');
  assert.equal(partAt(b, 3, 3), p); assert.equal(partAt(b, 4, 3), null);
  assert.ok(move(b, p, 0, 6)); assert.deepEqual([p.c, p.r], [0, 6]);
  assert.equal(move(b, p, 0, 10), false, 'not on the spikes');
  assert.ok(flip(p)); assert.equal(p.dir, -1);
  assert.ok(remove(b, p)); assert.equal(b.left.ramp, 1); assert.equal(b.placed.length, 0);
  assert.equal(flip({ type: 'plank', dir: 1 }), false);
  assert.ok(fits(b, { type: 'plank', c: 3, r: 3 }));
}

// The ball: falls, bounces on a trampoline, and a run that leaves the board is lost
{
  const b = newBoard(0);
  const run = newRun(b);
  for (let i = 0; i < 30; i++) stepRun(run, 1 / 120);
  assert.ok(run.ball.y > LEVELS[0].start.y && run.ball.vy > 0, 'gravity pulls it down');
  assert.equal(simulate(b).state, 'spiked', 'level 1 empty ends on the spikes');
  assert.equal(segmentsOf({ type: 'ramp', c: 0, r: 0, dir: 1 })[0][3] > segmentsOf({ type: 'ramp', c: 0, r: 0, dir: 1 })[0][1], true, '↘ goes down to the right');
  const s = newBoard(2); place(s, 'spring', 2, 5);
  const r = newRun(s); let boing = false;
  while (r.state === 'running') { stepRun(r, 1 / 120); if (r.events.some(e => e.type === 'boing')) boing = true; }
  assert.ok(boing, 'the trampoline throws it');
}

// Stars: the fewest parts, three
assert.equal(starsOf(0, 1), 3); assert.equal(starsOf(0, 2), 2); assert.equal(starsOf(5, 4), 1);
console.log(`✓ artilugio engine: ${LEVELS.length} levels solved, placing, physics`);

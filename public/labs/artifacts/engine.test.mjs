// Artefactos' engine: placing parts, and every level solved by its solution and failed without parts.
import assert from 'node:assert/strict';
import { POOL } from './levels.js';
import { SETTLE, ROWS as FLOOR, LEVELS, PARTS, COLS, ROWS, newBoard, place, move, remove, flip, partAt, fits, simulate, newRun, stepRun, starsOf, segmentsOf, blockedCells } from './engine.js';

// Every level: its solution fits its tray and wins; an empty board does not; its parts are known
LEVELS.forEach((L, i) => {
  assert.notEqual(simulate(newBoard(i)).state, 'won', `level ${i + 1} must not solve itself`);
  const b = newBoard(i);
  for (const p of L.solution) assert.ok(place(b, p.type, p.c, p.r, p.dir ?? 1), `level ${i + 1}: the solution's ${p.type} fits`);
  assert.equal(simulate(b).state, 'won', `level ${i + 1}: the solution wins`);
  for (const t of Object.keys(L.tray)) assert.ok(PARTS.includes(t));
  assert.ok(L.goal.c >= 0 && L.goal.c + 1 < COLS && L.goal.r < ROWS);
});

// The generated pool: every level's answer fits its tray and wins, the board alone does not, the ids
// are unique and the tiers grow from 1 part to 3
{
  const ids = new Set();
  for (const L of POOL) {
    assert.ok(!ids.has(L.id), `${L.id} is unique`); ids.add(L.id);
    assert.notEqual(simulate(newBoard(L)).state, 'won', `${L.id} must not solve itself`);
    // No fixed piece on the basket: spikes inside it or a girder through it read as a bug (the owner's report, t5-6)
    for (const f of L.fixed) {
      const cells = blockedCells({ start: { x: -50, y: -50 }, goal: { c: -50, r: -50 }, fixed: [f] });
      assert.ok(!cells.has(`${L.goal.c},${L.goal.r}`) && !cells.has(`${L.goal.c + 1},${L.goal.r}`), `${L.id}: its ${f.type} sits on the basket`);
    }
    const b = newBoard(L);
    for (const p of L.solution) assert.ok(place(b, p.type, p.c, p.r, p.dir ?? 1), `${L.id}: the answer's ${p.type} fits its tray`);
    assert.equal(simulate(b).state, 'won', `${L.id}: its answer wins`);
  }
  const tiers = [...new Set(POOL.map(l => l.tier))].sort();
  assert.ok(tiers.length >= 6 && POOL.length >= 60, `six tiers and plenty of levels (${POOL.length})`);
  const need = t => Math.max(...POOL.filter(l => l.tier === t).map(l => l.solution.length));
  assert.ok(need(tiers[0]) === 1 && need(tiers.at(-1)) === 3, 'from one part to three');
}

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

// The basket passes the level only once the ball rests in it; the floor blows it up
{
  const b = newBoard(0); place(b, 'ramp', 0, 4, 1);
  const run = newRun(b); let inside = null;
  while (run.state === 'running') {
    stepRun(run, 1 / 120);
    const { c, r } = run.goal, x = run.ball.x, y = run.ball.y;
    if (inside === null && x > c + 0.1 && x < c + 1.9 && y > r && y < r + 1) inside = run.t;
  }
  assert.equal(run.state, 'won');
  assert.ok(run.t >= inside + SETTLE - 1e-9, `it waits for the ball to rest (in at ${inside.toFixed(2)} s, passed at ${run.t.toFixed(2)} s)`);
  assert.ok(Math.hypot(run.ball.vx, run.ball.vy) < 0.6, 'and the ball is at rest');
  const f = newRun(newBoard(0)); f.ball.x = 7.5;   // past the basket, straight down to the floor
  const events = [];
  while (f.state === 'running') { stepRun(f, 1 / 120); events.push(...f.events.splice(0)); }
  assert.equal(f.state, 'boom', 'the floor blows it up');
  assert.ok(events.some(e => e.type === 'boom' && e.y <= FLOOR), 'with where it happened, for the explosion');
}

// A long run that ends in the basket counts: trampolines kept this one in the air 13.5 s, and the
// old 14 s cap called it stuck while it was settling in the basket (the owner's report, stage 4)
{
  const L = POOL.find(l => l.id === 't5-10'), b = newBoard(L);
  b.placed = [{ type: 'ramp', c: 6, r: 1, dir: -1 }, { type: 'spring', c: 1, r: 6, dir: 1 }, { type: 'spring', c: 3, r: 6, dir: 1 }];
  const r = simulate(b);
  assert.equal(r.state, 'won', `the ball that lands in the basket late still passes (${r.state} at ${r.t.toFixed(2)} s)`);
  assert.ok(r.t > 13.5);
}

// Stars: the fewest parts, three
assert.equal(starsOf(0, 1), 3); assert.equal(starsOf(0, 2), 2); assert.equal(starsOf(5, 4), 1);
console.log(`✓ artifacts engine: ${LEVELS.length} hand-made and ${POOL.length} generated levels solved, placing, physics`);

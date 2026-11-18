import assert from 'node:assert/strict';
import {
  newGame, step, act, serialize, hydrate,
  COLS, FINISH_ROW, STEP, PTS_LANE, PTS_FRUIT, PTS_FINISH, LIVES,
} from './engine.js';

// 1. Seeded repeatability: same seed builds identical lanes, vehicles, and fruits
const a = newGame({ seed: 7777 });
const b = newGame({ seed: 7777 });
assert.deepEqual(
  a.lanes.map(l => ({ dir: l.dir, speed: l.speed, xs: l.vehicles.map(v => v.x) })),
  b.lanes.map(l => ({ dir: l.dir, speed: l.speed, xs: l.vehicles.map(v => v.x) })),
  'identical seed creates identical traffic',
);
assert.deepEqual(a.fruits, b.fruits, 'identical seed creates identical fruit placement');

// 2. Movement rules: forward, left, right only (clamped to board bounds, no backward)
const g = newGame({ seed: 1234 });
for (const l of g.lanes) l.vehicles = []; // isolate movement bounds from traffic
assert.equal(act(g, 'up'), true);
assert.equal(g.mode, 'play');
for (let i = 0; i < 30; i++) step(g, STEP);
assert.equal(g.frog.row, 1);
assert.equal(g.maxRow, 1);
assert.ok(g.score >= PTS_LANE);

for (let i = 0; i < 4; i++) {
  act(g, 'left');
  for (let k = 0; k < 25; k++) step(g, STEP);
}
assert.equal(g.frog.col, 0, 'clamps at left edge');
assert.equal(act(g, 'left'), false, 'cannot move past column 0');

for (let i = 0; i < COLS + 2; i++) {
  act(g, 'right');
  for (let k = 0; k < 25; k++) step(g, STEP);
}
assert.equal(g.frog.col, COLS - 1, 'clamps at right edge');
assert.equal(act(g, 'back'), false, 'no backward movement supported');

// 3. Dash starts with 3 charges, consumes 1 per Dash, and refuses when empty
const d = newGame({ seed: 2026 });
for (const l of d.lanes) l.vehicles = []; // clear road to verify pure dash mechanics
for (let n = 0; n < 3; n++) {
  assert.equal(act(d, 'dash'), true);
  for (let i = 0; i < 30; i++) step(d, STEP);
}
assert.equal(d.frog.row, 6, '3 dashes advance 6 rows');
assert.equal(d.dashes, 0, '3 dashes spend all 3 charges');
assert.equal(act(d, 'dash'), false, 'cannot dash with 0 charges');

// 3b. Hard difficulty has denser traffic / faster speeds than Normal
const norm = newGame({ seed: 7777, difficulty: 'normal' });
const hard = newGame({ seed: 7777, difficulty: 'hard' });
const normCars = norm.lanes.reduce((s, l) => s + l.vehicles.length, 0);
const hardCars = hard.lanes.reduce((s, l) => s + l.vehicles.length, 0);
assert.ok(hardCars > normCars, `hard (${hardCars}) has more traffic than normal (${normCars})`);

// 4. Airborne dash over a vehicle clears it and triggers aerial close-call (UX only, 0 pts)
const aerial = newGame({ seed: 3030 });
for (const l of aerial.lanes) l.vehicles = [];
aerial.lanes[1].vehicles = [{ id: 't1', type: 'sedan', len: 1.3, color: 'coral', x: 2.8, grazed: false }];
aerial.lanes[1].speed = 0;
act(aerial, 'dash');
for (let i = 0; i < 30; i++) step(aerial, STEP);
assert.equal(aerial.mode, 'play', 'dash leaps cleanly over vehicle in row 1');
assert.equal(aerial.frog.row, 2);
assert.equal(aerial.closeCalls, 1, 'aerial pass counts as close-call');
assert.equal(aerial.score, 2 * PTS_LANE, 'close-call awards no points');

// 5. First hit loses a life and grants ghost shield; losing the last life ends the run as crash
const crashGame = newGame({ seed: 4040 });
for (const l of crashGame.lanes) l.vehicles = [];
crashGame.lanes[1].vehicles = [{ id: 'c1', type: 'bus', len: 2.3, color: 'bus', x: 2.2, grazed: false }];
crashGame.lanes[1].speed = 0;
act(crashGame, 'up');
for (let i = 0; i < 30; i++) step(crashGame, STEP);
assert.equal(crashGame.mode, 'play', 'first hit keeps playing with remaining lives');
assert.equal(crashGame.lives, LIVES - 1);
assert.equal(crashGame.lifePenalty, 1, 'losing a life subtracts 1 point');
assert.equal(crashGame.score, 0, '1 lane - 1 life lost = 0 points');
assert.ok(crashGame.shield > 0, 'ghost shield activates after hit');

crashGame.lives = 1;
crashGame.shield = 0;
for (let i = 0; i < 10; i++) step(crashGame, STEP);
assert.equal(crashGame.mode, 'crash', 'losing final life ends the run');

// 6. Reaching FINISH_ROW awards +1 per lane + +1 per fruit - 1 per life lost (time is tie-break)
const winGame = newGame({ seed: 5050 });
for (const l of winGame.lanes) l.vehicles = [];
winGame.fruits = [{ id: 'f-33-3', row: FINISH_ROW, col: 3, kind: 'star', pts: PTS_FRUIT, taken: false }];
winGame.frog.row = FINISH_ROW - 1;
winGame.frog.fromRow = FINISH_ROW - 1;
winGame.frog.toRow = FINISH_ROW - 1;
winGame.frog.y = FINISH_ROW - 1;
winGame.maxRow = FINISH_ROW - 1;
act(winGame, 'up');
for (let i = 0; i < 30; i++) step(winGame, STEP);
assert.equal(winGame.mode, 'win');
assert.equal(winGame.timeBonus, 0);
assert.equal(winGame.distanceScore, FINISH_ROW * PTS_LANE + PTS_FINISH);
assert.equal(winGame.bonusScore, PTS_FRUIT);
assert.equal(winGame.lifePenalty, 0);
assert.equal(winGame.score, FINISH_ROW * PTS_LANE + PTS_FINISH + PTS_FRUIT);

// 7. Serialize / hydrate preserves progress for session.js resume
const snap = serialize(d);
const restored = hydrate(snap);
assert.equal(restored.seed, d.seed);
assert.equal(restored.frog.row, d.frog.row);
assert.equal(restored.score, d.score);

// 8. Water canal (row 22): riding a boat drifts safely; landing in water splashes back to shore (row 21)
const water = newGame({ seed: 6060 });
assert.equal(water.lanes[21].kind, 'median', 'row 21 is a safe shore before water');
assert.equal(water.lanes[22].kind, 'water', 'row 22 is the water canal');
water.lanes[22].vehicles = [{ id: 'b0', type: 'boat', len: 2.0, color: 'boatA', x: 2.5, grazed: false }];
water.lanes[22].speed = 0.5;
water.lanes[22].dir = 1;
water.frog.row = 21; water.frog.fromRow = 21; water.frog.toRow = 21; water.frog.y = 21;
act(water, 'up');
for (let i = 0; i < 30; i++) step(water, STEP);
assert.equal(water.frog.row, 22, 'hopping onto a boat stays on row 22');
assert.equal(water.lives, LIVES, 'riding a boat costs no life');

water.lanes[22].vehicles = [];
for (let i = 0; i < 5; i++) step(water, STEP);
assert.equal(water.lives, LIVES - 1, 'falling in water loses 1 life');
assert.equal(water.frog.row, 21, 'splashing returns frog to shore');

console.log('sapiondo engine.test.mjs ok');

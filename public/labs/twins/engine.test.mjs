// node public/labs/twins/engine.test.mjs: the rules, the generator and the solver (C-12)
import assert from 'node:assert/strict';
import * as E from './engine.js';
import { LOCALES } from './rules.js';

// The grid: up, down, left and right, never across an edge
assert.deepEqual(E.neighbours(0).sort((a, b) => a - b), [1, 5]);
assert.deepEqual(E.neighbours(4).sort((a, b) => a - b), [3, 9], 'the end of a row does not reach the next row');
assert.deepEqual(E.neighbours(12).sort((a, b) => a - b), [7, 11, 13, 17]);

// A merge: equal numbers side by side, the sum where it was dropped
{
  const cells = Array(25).fill(0);
  cells[0] = 8; cells[1] = 8; cells[2] = 4; cells[4] = 4; cells[5] = 8; cells[9] = 4;
  assert.ok(E.canMerge(cells, 0, 1), '8 onto the 8 beside it');
  assert.ok(E.canMerge(cells, 0, 5), 'and onto the 8 under it');
  assert.ok(!E.canMerge(cells, 1, 2), 'not onto another number');
  assert.ok(!E.canMerge(cells, 2, 4), 'not across a gap');
  assert.ok(!E.canMerge(cells, 4, 5), 'not across the end of a row');
  assert.ok(!E.canMerge(cells, 0, 6), 'not on a diagonal');
  assert.ok(!E.canMerge(cells, 3, 4), 'not from an empty cell');
  const after = E.merge(cells, 0, 1);
  assert.equal(after[1], 16, '8 + 8 = 16, on the cell it was dropped on');
  assert.equal(after[0], 0, 'and the cell it came from is empty');
  assert.equal(cells[1], 8, 'the board before is untouched');
}

// The solver: a board that can be solved, one that cannot, and one where the order matters
{
  const row = (...v) => [...v, ...Array(25 - v.length).fill(0)];
  assert.deepEqual(E.solve(row(4)), [], 'one number is already solved');
  assert.equal(E.solve(row(4, 0, 4)), null, 'two numbers that never meet');
  assert.equal(E.solve(row(2, 4)), null, 'two numbers that are not equal');
  // 2 2 4: merging the right 2 onto the left one leaves 4 _ 4, a dead end; onto the right one, 4 4 → 8
  const order = row(2, 2, 4);
  assert.ok(!E.solvable(E.merge(order, 1, 0)), 'the left merge strands the 4');
  assert.ok(E.solvable(E.merge(order, 0, 1)), 'the right one does not');
  assert.equal(E.traps(order), 1, 'one of its two first merges is a dead end');
  const way = E.solve(order);
  let s = order;
  for (const [a, b] of way) { assert.ok(E.canMerge(s, a, b)); s = E.merge(s, a, b); }
  assert.equal(E.count(s), 1);
  assert.equal(s[2], 8);
}

// The generator: the same seed, the same board; every board solvable, built of halves, with a dead end in it
assert.deepEqual(E.generate('abc'), E.generate('abc'), 'the same seed gives the same board');
assert.notDeepEqual(E.generate('abc').cells, E.generate('abd').cells, 'another seed, another board');
assert.deepEqual(E.boardOf('2026-12-01'), E.generate('twins:2026-12-01'), "a day's board is its seed's");
for (let k = 0; k < 60; k++) {
  const seed = k < 30 ? E.daySeed(E.localDate(Date.UTC(2026, 10, 26 + k, 12))) : 'seed-' + k;
  const b = E.generate(seed);
  const n = E.count(b.cells);
  assert.ok(n >= E.MIN_TILES && n <= E.MAX_TILES, `${seed}: ${n} numbers`);
  assert.equal(b.cells.reduce((t, v) => t + v, 0), b.start, `${seed}: the numbers add up to the last one`);
  assert.ok(E.STARTS.includes(b.start));
  const way = E.solve(b.cells, b.cols, b.rows);
  assert.ok(way, `${seed}: the solver solves it`);
  assert.equal(way.length, n - 1, `${seed}: one merge fewer than numbers`);
  // The solver's way, played through the game's own rules, ends on the last number
  let g = E.newGame(b, { seed });
  for (const [a, c] of way) g = E.play(g, a, c);
  assert.ok(g.done, `${seed}: played to the end`);
  assert.equal(g.cells.filter(Boolean)[0], b.start, `${seed}: and the last number is the one it was built from`);
  const t = E.traps(b.cells, b.cols, b.rows);
  assert.ok(t > 0 && t * 2 <= E.moves(b.cells, b.cols, b.rows).length, `${seed}: a dead end among its first merges, but not most of them`);
}

// A game: merge, undo, stuck, hint, score
{
  const b = E.generate('game');
  let g = E.newGame(b, { date: '2026-11-26' });
  assert.equal(E.play(g, 0, 0), g, 'a merge that cannot be made changes nothing');
  assert.equal(E.undo(g), g, 'nothing to undo at the start');
  const [a, c] = E.moves(g.cells)[0];
  const g1 = E.play(g, a, c);
  assert.equal(E.count(g1.cells), E.count(b.cells) - 1);
  assert.deepEqual(E.undo(g1).cells, b.cells, '↩ brings the board back');
  assert.equal(E.undo(g1).hints, 0, 'and costs nothing');

  // Into a dead end, then the hint: it undoes back to a solvable board and shows a merge from there
  const trap = E.moves(b.cells).find(([x, y]) => !E.solvable(E.merge(b.cells, x, y)));
  let s = E.play(g, ...trap);
  while (E.moves(s.cells).length) s = E.play(s, ...E.moves(s.cells)[0]);
  assert.ok(E.stuck(s) || !E.solvable(s.cells), 'the trap is a dead end');
  const h = E.hint(s);
  assert.equal(h.state.hints, 1, 'a hint is counted');
  assert.ok(h.undone >= 1, 'it undid the merges into the dead end');
  assert.ok(E.solvable(h.state.cells), 'back on a board that can be solved');
  assert.ok(E.canMerge(h.state.cells, h.move.from, h.move.to), 'and it shows a merge that can be made');
  assert.ok(E.solvable(E.merge(h.state.cells, h.move.from, h.move.to)), 'which keeps it solvable');

  // Hints alone play any board to the end
  let p = E.newGame(E.generate('hints only'));
  while (!p.done) { const k = E.hint(p); p = E.play(k.state, k.move.from, k.move.to); }
  assert.equal(p.hints, E.count(E.generate('hints only').cells) - 1);
  assert.equal(E.hint(p).state, p, 'no hint once solved');
  assert.equal(E.undo(p), p, 'and no undo');

  // The score: by time like Queens, minus the hints, 0 until solved
  assert.equal(E.score(g), 0);
  assert.equal(E.pointsByTime(10000), 100);
  assert.equal(E.pointsByTime(30000), 100);
  assert.equal(E.pointsByTime(165000), 55);
  assert.equal(E.pointsByTime(300000), 10);
  assert.equal(E.pointsByTime(900000), 10);
  assert.equal(E.score({ done: true, ms: 20000, hints: 0 }), 100);
  assert.equal(E.score({ done: true, ms: 20000, hints: 2 }), 80, 'each hint costs 10');
  assert.equal(E.score({ done: true, ms: 400000, hints: 3 }), 0, 'never below 0');
  assert.equal(E.clock(65400), '1:05');
}

// Dates: the board's number
assert.equal(E.numberOf(E.LAUNCH), 1);
assert.equal(E.numberOf('2026-11-30'), 5);
assert.equal(E.numberOf('2026-11-01'), 1, 'never below 1');
assert.equal(E.localDate(new Date(2026, 10, 26, 23, 59).getTime()), '2026-11-26', 'the player\'s own midnight');

// The texts: the same keys in every language, none empty (C-3)
const keys = Object.keys(LOCALES.es.ui).sort();
for (const [lang, L] of Object.entries(LOCALES)) {
  assert.deepEqual(Object.keys(L.ui).sort(), keys, lang + ': same keys as es');
  for (const k of keys) assert.ok(L.ui[k].trim(), lang + '.' + k + ' is not empty');
  assert.ok(L.como.length <= 3, lang + ': up to three steps (U-18)');
}
console.log('twins engine: ok');

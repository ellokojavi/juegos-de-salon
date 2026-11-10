// Sudoku's engine: the generator gives one solution and the level's grade; the moves keep the rules.
import assert from 'node:assert/strict';
import { generate, grade, solve, newGame, setDigit, toggleNote, erase, undo, conflicts, counts, hasNote, isOver, wrong, score, giveUp, PEERS, UNITS, LEVELS } from './engine.js';

assert.deepEqual(LEVELS, ['easy', 'hard'], 'two levels: easy and hard (the owner, 2026-11-10)');

// Units and peers
assert.equal(UNITS.length, 27);
assert.ok(PEERS.every(p => p.length === 20), 'every cell has 20 peers');

// The same seed, the same puzzle
assert.deepEqual(generate('easy', 'abc').givens, generate('easy', 'abc').givens);
assert.notDeepEqual(generate('easy', 'abc').givens, generate('easy', 'abd').givens);

for (const level of LEVELS) {
  for (let s = 0; s < 5; s++) {
    const p = generate(level, `t${s}`);
    const givens = p.givens.filter(Boolean).length;
    const { count, solution } = solve(p.givens);
    assert.equal(count, 1, `${level} ${s}: one solution`);
    assert.deepEqual(solution, p.solution, `${level} ${s}: the stored solution`);
    assert.ok(p.givens.every((d, i) => !d || d === p.solution[i]), `${level} ${s}: the givens agree with the solution`);
    assert.ok(p.givens.every((d, i) => !!d === !!p.givens[80 - i]), `${level} ${s}: symmetric`);
    const g = grade(p.givens);
    if (level === 'easy') { assert.equal(g, 0); assert.ok(givens >= 38, `easy keeps many givens (${givens})`); }
    if (level === 'hard') { assert.equal(g, 1, 'hard needs more than singles, and no guessing'); assert.ok(givens < 32, `hard has few givens (${givens})`); }
  }
}

// Playing
let s = newGame('easy', 'play');
const empty = s.cells.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
const given = s.cells.findIndex(Boolean);
assert.equal(setDigit(s, given, 1), s, 'a given cannot change');
const [a] = empty;
const right = s.solution[a];
s = toggleNote(s, a, right);
assert.ok(hasNote(s, a, right));
s = setDigit(s, a, right);
assert.equal(s.cells[a], right);
assert.equal(s.notes[a], 0, 'writing a digit clears its notes');
// A peer's note of that digit goes away
const peer = PEERS[a].find(i => !s.cells[i]);
let t = toggleNote(undo(undo(s)), peer, right);
t = setDigit(toggleNote(t, a, right), a, right);
assert.ok(!hasNote(t, peer, right), 'peers lose the note of the digit written');
// A repeated digit is a conflict
const clash = s.cells[PEERS[empty[1]].find(i => s.cells[i])];
const c = setDigit(s, empty[1], clash);
assert.ok(conflicts(c).has(empty[1]), 'a repeated digit is marked');
assert.equal(erase(c, empty[1]).cells[empty[1]], 0);
assert.equal(undo(c).cells[empty[1]], 0, 'undo takes it back');
assert.equal(setDigit(s, a, right).cells[a], 0, 'the same digit again clears the cell');
// Filling every cell with the solution ends it
for (const i of empty) if (!s.cells[i]) s = setDigit(s, i, s.solution[i]);
assert.ok(isOver(s));
assert.deepEqual(counts(s).slice(1), Array(9).fill(9));
assert.equal(setDigit(s, empty[0], 1), s, 'a finished game does not change');

// The score: 100, minus 10 per wrong digit written; undo does not give it back; notes never count
let q = newGame('easy', 'score');
assert.equal(score(q), 100);
const holes = q.cells.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
const h0 = holes[0], bad = q.solution[h0] % 9 + 1;
q = toggleNote(q, h0, bad);
assert.equal(score(q), 100, 'a note is free');
q = setDigit(q, h0, bad);
assert.equal(q.mistakes, 1);
assert.equal(score(q), 90, 'a wrong digit costs 10');
assert.ok(wrong(q).has(h0), 'and is marked');
q = undo(q);
assert.equal(score(q), 90, 'undo does not give the 10 back');
q = setDigit(q, h0, q.solution[h0]);
assert.equal(score(q), 90, 'a right digit costs nothing');
for (let k = 0; k < 12; k++) q = setDigit(setDigit(q, holes[1], q.solution[holes[1]] % 9 + 1), holes[1], q.solution[holes[1]] % 9 + 1);
assert.equal(score(q), 0, 'never below 0');
for (const i of holes) if (!q.cells[i]) q = setDigit(q, i, q.solution[i]);
assert.ok(isOver(q) && wrong(q).size === 0);

// Giving up ends the game with 0 points, whatever the board had
let g = setDigit(newGame('easy', 'give-up'), 0, 1);
g = giveUp(newGame('easy', 'give-up'));
assert.ok(isOver(g) && g.gaveUp && score(g) === 0, 'giving up ends it with 0');
assert.equal(giveUp(g), g, 'a finished game cannot give up again');

console.log('sudoku engine: ok');

// Sudoku's engine: the generator gives one solution and the level's grade; the moves keep the rules.
import assert from 'node:assert/strict';
import { generate, grade, solve, newGame, setDigit, toggleNote, erase, undo, conflicts, counts, hasNote, isOver, PEERS, UNITS, LEVELS } from './engine.js';

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
    if (level === 'medium') { assert.equal(g, 0); assert.ok(givens >= 28 && givens <= 32, `medium has 28–32 givens (${givens})`); }
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
const wrong = s.cells[PEERS[empty[1]].find(i => s.cells[i])];
const c = setDigit(s, empty[1], wrong);
assert.ok(conflicts(c).has(empty[1]), 'a repeated digit is marked');
assert.equal(erase(c, empty[1]).cells[empty[1]], 0);
assert.equal(undo(c).cells[empty[1]], 0, 'undo takes it back');
assert.equal(setDigit(s, a, right).cells[a], 0, 'the same digit again clears the cell');
// Filling every cell with the solution ends it
for (const i of empty) if (!s.cells[i]) s = setDigit(s, i, s.solution[i]);
assert.ok(isOver(s));
assert.deepEqual(counts(s).slice(1), Array(9).fill(9));
assert.equal(setDigit(s, empty[0], 1), s, 'a finished game does not change');

console.log('sudoku engine: ok');

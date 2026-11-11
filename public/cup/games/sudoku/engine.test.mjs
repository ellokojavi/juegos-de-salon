// Sudoku's engine: the generator gives one solution and the level's grade; the moves keep the rules.
import assert from 'node:assert/strict';
import { generate, grade, solve, newGame, setDigit, toggleNote, erase, undo, conflicts, counts, hasNote, isOver, wrong, score, giveUp, findHint, useHint, isHinted, completedUnits, PEERS, UNITS, LEVELS, geom, sizeOf } from './engine.js';

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
    assert.equal(p.givens.length, sizeOf(level) ** 2, `${level} ${s}: ${sizeOf(level)}×${sizeOf(level)}`);
    assert.ok(p.givens.every((d, i) => !!d === !!p.givens[p.givens.length - 1 - i]), `${level} ${s}: symmetric`);
    const g = grade(p.givens);
    if (level === 'easy') { assert.equal(g, 0, 'easy needs singles only'); assert.ok(givens >= 12 && givens <= 16, `easy keeps 12 to 16 givens (${givens})`); }
    if (level === 'hard') { assert.equal(g, 1, 'hard needs more than singles, and no guessing'); assert.ok(givens < 32, `hard has few givens (${givens})`); }
  }
}

// Playing
let s = newGame('hard', 'play');
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
let q = newGame('hard', 'score');
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

// Hints (the owner, 2026-11-11): the right digit, −15 each, fixed, not undone, with a reason a person can follow
let hs = newGame('hard', 'hint');
const first = findHint(hs);
assert.ok(first && first.d === hs.solution[first.i] && !hs.cells[first.i], 'a hint names an empty cell and its digit');
assert.ok(['single', 'row', 'col', 'box'].includes(first.why), `on a fresh hard board the hint is a deduction (${first.why})`);
hs = useHint(hs);
assert.equal(hs.cells[first.i], first.d);
assert.ok(isHinted(hs, first.i));
assert.equal(score(hs), 85, 'a hint costs 15');
assert.equal(setDigit(hs, first.i, (first.d % 9) + 1), hs, 'a hinted cell is fixed');
assert.equal(undo(hs).cells[first.i], first.d, 'undo does not take a hint back');
// The selected open cell is the one hinted, a wrong digit there included
const holesH = hs.cells.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
let w = setDigit(hs, holesH[3], (hs.solution[holesH[3]] % 9) + 1);
w = useHint(w, holesH[3]);
assert.equal(w.cells[holesH[3]], w.solution[holesH[3]], 'a hint fixes the selected wrong cell');
assert.equal(score(w), 100 - 10 - 30, 'one mistake and two hints');
// Hints alone finish the board, and the score never goes below 0
let all = newGame('easy', 'hints-all');
while (!isOver(all)) all = useHint(all);
assert.equal(score(all), 0);
assert.equal(findHint(all), null);
// A completed unit is reported for the celebration
let cu = newGame('hard', 'units');
const row = [...Array(9)].map((_, c) => c);
for (const i of row) if (!cu.cells[i]) cu = setDigit(cu, i, cu.solution[i]);
assert.ok(completedUnits(cu, 0).some(u => u.length === 9 && u.every(i => i < 9)), 'the first row is complete');

console.log('sudoku engine: ok');

// The mini sudoku (easy, the owner 2026-11-11): 6×6, boxes of 2 rows × 3 columns, digits 1 to 6
const G6 = geom(Array(36).fill(0));
assert.equal(G6.units.length, 18);
assert.ok(G6.peers.every(p => p.length === 12), 'every 6×6 cell has 12 peers');
assert.deepEqual(G6.units[12], [0, 1, 2, 6, 7, 8], 'the first box is 2 rows × 3 columns');
let m = newGame('easy', 'mini');
assert.equal(m.cells.length, 36);
const mHoles = m.cells.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
assert.equal(setDigit(m, mHoles[0], 7), m, 'no 7 on a 6×6 board');
assert.equal(toggleNote(m, mHoles[0], 7), m, 'no note 7 either');
m = useHint(m);
assert.ok(m.last.d >= 1 && m.last.d <= 6 && m.last.why !== 'solution', 'a hint on the mini board comes from logic');
for (const i of mHoles) if (!m.cells[i]) m = setDigit(m, i, m.solution[i]);
assert.ok(isOver(m), 'the mini board ends when full');
assert.equal(score(m), 100 - 15);
assert.deepEqual(counts(m).slice(1), Array(6).fill(6));

// La Copa's interface: the day's board is the same on every phone, in the day's level; the trial leaves 6 open
{
  const { generateDay, dayGame, card, DAY_LEVEL, TRIAL_OPEN } = await import('./engine.js');
  assert.equal(DAY_LEVEL, 'easy', 'a cup day plays the 6×6 mini unless the admin picks hard');
  const a = generateDay('ABCDE', 2), b = generateDay('ABCDE', 2);
  assert.deepEqual(a, b, 'the same code and day, the same board');
  assert.equal(a.givens.length, 36);
  assert.notDeepEqual(generateDay('ABCDE', 3).givens, a.givens, 'another day, another board');
  const h = generateDay('ABCDE', 2, { variante: 'hard' });
  assert.equal(h.level, 'hard');
  assert.equal(h.givens.length, 81);
  const t = generateDay('ABCDE', 2, { ensayo: true, sal: 'ensayo' });
  assert.equal(t.givens.filter(d => !d).length, TRIAL_OPEN, 'the trial leaves 6 cells open');
  assert.ok(t.givens.every((d, i) => !d || d === t.solution[i]));
  let s = dayGame(t);
  for (const i of s.cells.map((d, k) => (d ? -1 : k)).filter(k => k >= 0)) s = setDigit(s, i, s.solution[i]);
  assert.ok(isOver(s) && score(s) === 100, 'the trial is solved with its 6 digits');
  assert.match(card(s), /🟢 6×6\n✨/);
  assert.match(card({ ...dayGame(h), mistakes: 2, hints: 1 }), /🔴 9×9\n❌❌💡/);
}

/**
 * Sudoku: the rules as a pure state machine (C-2): no DOM, no global state, testable in node.
 *
 * A board is 81 numbers, row by row, 0 for an empty cell. The generator fills a solved grid from a
 * seed, then empties cells in pairs (180° symmetry) while the puzzle keeps a single solution and a
 * grade no harder than the level asks. The grade is what a person needs to solve it by logic alone
 * (`grade`): 0 = singles only (a cell with one candidate, a digit with one place in a row, column or
 * box); 1 = also locked candidates and naked or hidden pairs; Infinity = beyond those. Easy keeps
 * many givens and singles; medium few givens and singles; hard needs the grade-1 techniques.
 */

export const LEVELS = ['easy', 'medium', 'hard'];
/** Per level: the most techniques it may need, the fewest givens it keeps, and the grade it must need. */
const LEVEL = {
  easy: { maxGrade: 0, minGivens: 38, needGrade: 0 },
  medium: { maxGrade: 0, minGivens: 28, maxGivens: 32, needGrade: 0 },
  hard: { maxGrade: 1, minGivens: 22, needGrade: 1 },
};

const ALL = 0x3fe; // bits 1..9
const bit = d => 1 << d;
const popcount = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
const lowDigit = m => 31 - Math.clz32(m & -m);
const digitsOf = m => { const out = []; for (let d = 1; d <= 9; d++) if (m & bit(d)) out.push(d); return out; };

/** The 27 units (9 rows, 9 columns, 9 boxes), each a list of cell indexes, and each cell's 20 peers. */
export const UNITS = (() => {
  const u = [];
  for (let r = 0; r < 9; r++) u.push([...Array(9)].map((_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) u.push([...Array(9)].map((_, r) => r * 9 + c));
  for (let b = 0; b < 9; b++) {
    const r0 = Math.floor(b / 3) * 3, c0 = (b % 3) * 3;
    u.push([...Array(9)].map((_, k) => (r0 + Math.floor(k / 3)) * 9 + c0 + (k % 3)));
  }
  return u;
})();
const UNITS_OF = [...Array(81)].map((_, i) => UNITS.filter(u => u.includes(i)));
export const PEERS = [...Array(81)].map((_, i) => [...new Set(UNITS_OF[i].flat())].filter(j => j !== i));
export const boxOf = i => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);

/** A seeded random generator (mulberry32): the same seed, the same puzzle. */
export function rng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : [...String(seed)].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (list, rand) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** Candidates of an empty cell given the board. */
function candidates(board, i) {
  let m = ALL;
  for (const p of PEERS[i]) if (board[p]) m &= ~bit(board[p]);
  return m;
}

/**
 * Counts the solutions up to `limit` by backtracking on the cell with the fewest candidates; with
 * `rand`, digits are tried in random order and the first solution is returned in `first`.
 */
export function solve(board, { limit = 2, rand = null } = {}) {
  const b = [...board];
  let count = 0, first = null;
  const go = () => {
    let best = -1, bestMask = 0, bestN = 10;
    for (let i = 0; i < 81; i++) {
      if (b[i]) continue;
      const m = candidates(b, i), n = popcount(m);
      if (n === 0) return false;
      if (n < bestN) { best = i; bestMask = m; bestN = n; if (n === 1) break; }
    }
    if (best < 0) { count++; if (!first) first = [...b]; return count >= limit; }
    const ds = rand ? shuffle(digitsOf(bestMask), rand) : digitsOf(bestMask);
    for (const d of ds) {
      b[best] = d;
      if (go()) return true;
    }
    b[best] = 0;
    return false;
  };
  go();
  return { count, solution: first };
}

/**
 * The grade of a puzzle: the hardest family of techniques a person needs to solve it by logic
 * (0 singles, 1 locked candidates and pairs), or Infinity when those do not finish it.
 */
export function grade(board) {
  const b = [...board];
  const cand = b.map((v, i) => (v ? 0 : candidates(b, i)));
  let hardest = 0;
  const place = (i, d) => {
    b[i] = d; cand[i] = 0;
    for (const p of PEERS[i]) cand[p] &= ~bit(d);
  };
  const singles = () => {
    for (let i = 0; i < 81; i++) {
      if (!b[i] && popcount(cand[i]) === 1) { place(i, lowDigit(cand[i])); return true; }
    }
    for (const u of UNITS) {
      for (let d = 1; d <= 9; d++) {
        let at = -1, n = 0;
        for (const i of u) if (!b[i] && cand[i] & bit(d)) { at = i; n++; }
        if (n === 1) { place(at, d); return true; }
      }
    }
    return false;
  };
  const eliminate = (i, mask) => { if (cand[i] & mask) { cand[i] &= ~mask; return true; } return false; };
  const advanced = () => {
    let changed = false;
    // Locked candidates: a digit confined to one line inside a box (or one box inside a line)
    for (const u of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const where = u.filter(i => !b[i] && cand[i] & bit(d));
        if (where.length < 2) continue;
        for (const v of UNITS) {
          if (v === u || !where.every(i => v.includes(i))) continue;
          for (const j of v) if (!u.includes(j)) changed = eliminate(j, bit(d)) || changed;
        }
      }
    }
    // Naked pairs: two cells of a unit with the same two candidates take them from the rest
    for (const u of UNITS) {
      const twos = u.filter(i => !b[i] && popcount(cand[i]) === 2);
      for (let x = 0; x < twos.length; x++) for (let y = x + 1; y < twos.length; y++) {
        if (cand[twos[x]] !== cand[twos[y]]) continue;
        for (const j of u) if (j !== twos[x] && j !== twos[y] && !b[j]) changed = eliminate(j, cand[twos[x]]) || changed;
      }
    }
    // Hidden pairs: two digits that fit only the same two cells of a unit clear those cells' other candidates
    for (const u of UNITS) {
      const places = [...Array(10)].map((_, d) => (d ? u.filter(i => !b[i] && cand[i] & bit(d)) : []));
      for (let d1 = 1; d1 <= 9; d1++) for (let d2 = d1 + 1; d2 <= 9; d2++) {
        const p1 = places[d1], p2 = places[d2];
        if (p1.length !== 2 || p2.length !== 2 || p1[0] !== p2[0] || p1[1] !== p2[1]) continue;
        for (const i of p1) changed = eliminate(i, ~(bit(d1) | bit(d2)) & ALL) || changed;
      }
    }
    return changed;
  };
  for (;;) {
    if (b.every(Boolean)) return hardest;
    if (cand.some((m, i) => !b[i] && !m)) return Infinity; // a contradiction: not solvable as it stands
    if (singles()) continue;
    if (advanced()) { hardest = 1; continue; }
    return Infinity;
  }
}

/** A solved grid from `rand`. */
export function solvedGrid(rand) {
  return solve(Array(81).fill(0), { limit: 1, rand }).solution;
}

/**
 * A puzzle of `level` from `seed`: { level, seed, givens, solution } (arrays of 81). Tries a few
 * solved grids until one reaches the level's grade; the last try is kept if none does.
 */
export function generate(level = 'easy', seed = Date.now()) {
  const L = LEVEL[level] || LEVEL.easy;
  const rand = rng(seed);
  let kept = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const solution = solvedGrid(rand);
    const puzzle = [...solution];
    let givens = 81;
    const order = shuffle([...Array(41)].map((_, i) => i), rand); // a cell and its mirror (80 − i)
    for (const i of order) {
      const j = 80 - i, pair = i === j ? 1 : 2;
      if (givens - pair < L.minGivens) continue;
      const a = puzzle[i], c = puzzle[j];
      puzzle[i] = 0; puzzle[j] = 0;
      if (solve(puzzle).count === 1 && grade(puzzle) <= L.maxGrade) givens -= pair;
      else { puzzle[i] = a; puzzle[j] = c; }
    }
    kept = { level, seed: String(seed), givens: puzzle, solution };
    if (grade(puzzle) === L.needGrade && (!L.maxGivens || givens <= L.maxGivens)) return kept;
  }
  return kept;
}

/* ---------------- The game ---------------- */

/** A new game: the puzzle, the player's digits (the givens filled), empty notes, no time yet. */
export function newGame(level = 'easy', seed = Date.now()) {
  const p = generate(level, seed);
  return {
    level: p.level, seed: p.seed, givens: p.givens, solution: p.solution,
    cells: [...p.givens], notes: Array(81).fill(0), history: [], elapsed: 0, moves: 0, done: false,
  };
}

export const isGiven = (state, i) => state.givens[i] !== 0;

/** The cells whose digit repeats in a row, column or box (shown in red, without telling the solution). */
export function conflicts(state) {
  const bad = new Set();
  for (const u of UNITS) {
    const seen = {};
    for (const i of u) {
      const d = state.cells[i];
      if (!d) continue;
      if (seen[d] !== undefined) { bad.add(i); bad.add(seen[d]); } else seen[d] = i;
    }
  }
  return bad;
}

/** How many of each digit 1..9 are on the board (index 0 unused). */
export function counts(state) {
  const n = Array(10).fill(0);
  for (const d of state.cells) if (d) n[d]++;
  return n;
}

const push = (state, i) => [...state.history, { i, d: state.cells[i], n: state.notes[i] }].slice(-200);
const solvedNow = cells => cells.every((d, i) => d !== 0 && UNITS_OF[i].every(u => u.every(j => j === i || cells[j] !== d)));

/** Writes digit `d` in cell `i` (the same digit again clears it); peers lose `d` from their notes. */
export function setDigit(state, i, d) {
  if (state.done || isGiven(state, i) || d < 1 || d > 9) return state;
  const history = push(state, i);
  const cells = [...state.cells], notes = [...state.notes];
  cells[i] = cells[i] === d ? 0 : d;
  notes[i] = 0;
  if (cells[i]) for (const p of PEERS[i]) notes[p] &= ~bit(d);
  const done = solvedNow(cells);
  return { ...state, cells, notes, history, moves: state.moves + 1, done };
}

/** Toggles note `d` in an empty cell `i`. */
export function toggleNote(state, i, d) {
  if (state.done || isGiven(state, i) || state.cells[i] || d < 1 || d > 9) return state;
  const notes = [...state.notes];
  notes[i] ^= bit(d);
  return { ...state, notes, history: push(state, i) };
}

/** Empties cell `i`: its digit or, if it has none, its notes. */
export function erase(state, i) {
  if (state.done || isGiven(state, i) || (!state.cells[i] && !state.notes[i])) return state;
  const cells = [...state.cells], notes = [...state.notes];
  if (cells[i]) cells[i] = 0; else notes[i] = 0;
  return { ...state, cells, notes, history: push(state, i), moves: state.moves + 1 };
}

/** Takes back the last change. */
export function undo(state) {
  if (state.done || !state.history.length) return state;
  const history = state.history.slice(0, -1);
  const last = state.history[state.history.length - 1];
  const cells = [...state.cells], notes = [...state.notes];
  cells[last.i] = last.d; notes[last.i] = last.n;
  return { ...state, cells, notes, history };
}

export const hasNote = (state, i, d) => !!(state.notes[i] & bit(d));
export const isOver = state => !!state.done;

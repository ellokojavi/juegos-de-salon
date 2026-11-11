/**
 * Sudoku: the rules as a pure state machine (C-2): no DOM, no global state, testable in node.
 *
 * A board is n×n numbers (36 or 81), row by row, 0 for an empty cell. The generator fills a solved grid from a
 * seed, then empties cells in pairs (180° symmetry) while the puzzle keeps a single solution and a
 * grade no harder than the level asks. The grade is what a person needs to solve it by logic alone
 * (`grade`): 0 = singles only (a cell with one candidate, a digit with one place in a row, column or
 * box); 1 = also locked candidates and naked or hidden pairs; Infinity = beyond those. Easy keeps
 * many givens and singles; hard needs the grade-1 techniques (the owner kept only these two, 2026-11-10).
 *
 * Two sizes (the owner, 2026-11-11): easy is a mini sudoku of 6×6 with boxes of 2 rows × 3 columns
 * and digits 1 to 6, so a round fits a party; hard stays 9×9. A board's size is read from its length
 * (36 or 81 cells), so every function serves both.
 *
 * The score (for La Copa, when it goes there): 100 for the finished board, minus 10 for every digit
 * written that is not the solution's and 15 for every hint, never below 0. Notes never count. Giving
 * up scores 0.
 */

export const LEVELS = ['easy', 'hard'];
export const SCORE_FULL = 100;
export const SCORE_MISTAKE = 10;
export const SCORE_HINT = 15;
/** Per level: the most techniques it may need, the fewest givens it keeps, and the grade it must need. */
const LEVEL = {
  easy: { size: 6, maxGrade: 0, minGivens: 12, needGrade: 0 },
  hard: { size: 9, maxGrade: 1, minGivens: 22, needGrade: 1 },
};
export const sizeOf = level => (LEVEL[level] || LEVEL.easy).size;

const bit = d => 1 << d;
const popcount = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
const lowDigit = m => 31 - Math.clz32(m & -m);

/**
 * A board's geometry, for n = 9 (boxes 3×3) or n = 6 (boxes 2 rows × 3 columns): its n rows, n columns
 * and n boxes (`units`, rows first, then columns, then boxes), each cell's units and peers, and the
 * mask of its digits.
 */
function makeGeom(n) {
  const bh = n === 6 ? 2 : 3, bw = 3, cells = n * n;
  const units = [];
  for (let r = 0; r < n; r++) units.push([...Array(n)].map((_, c) => r * n + c));
  for (let c = 0; c < n; c++) units.push([...Array(n)].map((_, r) => r * n + c));
  for (let b = 0; b < n; b++) {
    const r0 = Math.floor(b / (n / bw)) * bh, c0 = (b % (n / bw)) * bw;
    units.push([...Array(n)].map((_, k) => (r0 + Math.floor(k / bw)) * n + c0 + (k % bw)));
  }
  const unitsOf = [...Array(cells)].map((_, i) => units.filter(u => u.includes(i)));
  const peers = [...Array(cells)].map((_, i) => [...new Set(unitsOf[i].flat())].filter(j => j !== i));
  let all = 0; for (let d = 1; d <= n; d++) all |= bit(d);
  return { n, bh, bw, cells, units, unitsOf, peers, all };
}
const GEOM = { 36: makeGeom(6), 81: makeGeom(9) };
/** The geometry of a board (or a state) by its number of cells. */
export const geom = board => GEOM[(board.cells || board).length] || GEOM[81];
export const geomOf = n => GEOM[n * n];
const digitsOf = (m, n = 9) => { const out = []; for (let d = 1; d <= n; d++) if (m & bit(d)) out.push(d); return out; };

/** The 9×9 board's 27 units and each cell's 20 peers (the 6×6 one's are in `geom`). */
export const UNITS = GEOM[81].units;
export const PEERS = GEOM[81].peers;

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
function candidates(board, i, G = geom(board)) {
  let m = G.all;
  for (const p of G.peers[i]) if (board[p]) m &= ~bit(board[p]);
  return m;
}

/**
 * Counts the solutions up to `limit` by backtracking on the cell with the fewest candidates; with
 * `rand`, digits are tried in random order and the first solution is returned in `first`.
 */
export function solve(board, { limit = 2, rand = null } = {}) {
  const b = [...board], G = geom(board);
  let count = 0, first = null;
  const go = () => {
    let best = -1, bestMask = 0, bestN = 10;
    for (let i = 0; i < G.cells; i++) {
      if (b[i]) continue;
      const m = candidates(b, i, G), n = popcount(m);
      if (n === 0) return false;
      if (n < bestN) { best = i; bestMask = m; bestN = n; if (n === 1) break; }
    }
    if (best < 0) { count++; if (!first) first = [...b]; return count >= limit; }
    const ds = rand ? shuffle(digitsOf(bestMask, G.n), rand) : digitsOf(bestMask, G.n);
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
  const b = [...board], G = geom(board), N = G.n, UNITS = G.units, PEERS = G.peers;
  const cand = b.map((v, i) => (v ? 0 : candidates(b, i, G)));
  let hardest = 0;
  const place = (i, d) => {
    b[i] = d; cand[i] = 0;
    for (const p of PEERS[i]) cand[p] &= ~bit(d);
  };
  const singles = () => {
    for (let i = 0; i < G.cells; i++) {
      if (!b[i] && popcount(cand[i]) === 1) { place(i, lowDigit(cand[i])); return true; }
    }
    for (const u of UNITS) {
      for (let d = 1; d <= N; d++) {
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
      for (let d = 1; d <= N; d++) {
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
      const places = [...Array(N + 1)].map((_, d) => (d ? u.filter(i => !b[i] && cand[i] & bit(d)) : []));
      for (let d1 = 1; d1 <= N; d1++) for (let d2 = d1 + 1; d2 <= N; d2++) {
        const p1 = places[d1], p2 = places[d2];
        if (p1.length !== 2 || p2.length !== 2 || p1[0] !== p2[0] || p1[1] !== p2[1]) continue;
        for (const i of p1) changed = eliminate(i, ~(bit(d1) | bit(d2)) & G.all) || changed;
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
export function solvedGrid(rand, n = 9) {
  return solve(Array(n * n).fill(0), { limit: 1, rand }).solution;
}

/**
 * A puzzle of `level` from `seed`: { level, seed, givens, solution } (arrays of 36 or 81). Tries a few
 * solved grids until one reaches the level's grade; the last try is kept if none does.
 */
export function generate(level = 'easy', seed = Date.now()) {
  const L = LEVEL[level] || LEVEL.easy;
  const rand = rng(seed), cells = L.size * L.size, last = cells - 1;
  let kept = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const solution = solvedGrid(rand, L.size);
    const puzzle = [...solution];
    let givens = cells;
    const order = shuffle([...Array(Math.ceil(cells / 2))].map((_, i) => i), rand); // a cell and its mirror (last − i)
    for (const i of order) {
      const j = last - i, pair = i === j ? 1 : 2;
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
    cells: [...p.givens], notes: Array(p.givens.length).fill(0), history: [], elapsed: 0, moves: 0, mistakes: 0, hints: 0, hinted: [], done: false,
  };
}

export const isGiven = (state, i) => state.givens[i] !== 0;
/** A cell a hint filled: it stays, like a given (its digit is the solution's). */
export const isHinted = (state, i) => (state.hinted || []).includes(i);
const isFixed = (state, i) => isGiven(state, i) || isHinted(state, i);

/** The cells whose digit repeats in a row, column or box (shown in red, without telling the solution). */
export function conflicts(state) {
  const bad = new Set();
  for (const u of geom(state).units) {
    const seen = {};
    for (const i of u) {
      const d = state.cells[i];
      if (!d) continue;
      if (seen[d] !== undefined) { bad.add(i); bad.add(seen[d]); } else seen[d] = i;
    }
  }
  return bad;
}

/** The cells holding a digit that is not the solution's (shown in red: each one cost 10 points). */
export function wrong(state) {
  const bad = new Set();
  state.cells.forEach((d, i) => { if (d && d !== state.solution[i]) bad.add(i); });
  return bad;
}

/** The score so far: 100 minus 10 per wrong digit written, never below 0. */
export const score = state => (state.gaveUp ? 0 : Math.max(0, SCORE_FULL - SCORE_MISTAKE * (state.mistakes || 0) - SCORE_HINT * (state.hints || 0)));

/** Giving up ends the game with 0 points (as in La Copa's puzzles: rendirse da 0). */
export function giveUp(state) {
  if (state.done) return state;
  return { ...state, done: true, gaveUp: true };
}

/** How many of each digit 1..n are on the board (index 0 unused). */
export function counts(state) {
  const n = Array(geom(state).n + 1).fill(0);
  for (const d of state.cells) if (d) n[d]++;
  return n;
}

const push = (state, i) => [...state.history, { i, d: state.cells[i], n: state.notes[i] }].slice(-200);
const solvedNow = cells => cells.every((d, i) => d !== 0 && geom(cells).unitsOf[i].every(u => u.every(j => j === i || cells[j] !== d)));

/** Writes digit `d` in cell `i` (the same digit again clears it); peers lose `d` from their notes. */
export function setDigit(state, i, d) {
  if (state.done || isFixed(state, i) || d < 1 || d > geom(state).n) return state;
  const history = push(state, i);
  const cells = [...state.cells], notes = [...state.notes];
  cells[i] = cells[i] === d ? 0 : d;
  notes[i] = 0;
  if (cells[i]) for (const p of geom(state).peers[i]) notes[p] &= ~bit(d);
  const done = solvedNow(cells);
  const mistakes = (state.mistakes || 0) + (cells[i] && cells[i] !== state.solution[i] ? 1 : 0);
  return { ...state, cells, notes, history, moves: state.moves + 1, mistakes, done };
}

/** Toggles note `d` in an empty cell `i`. */
export function toggleNote(state, i, d) {
  if (state.done || isFixed(state, i) || state.cells[i] || d < 1 || d > geom(state).n) return state;
  const notes = [...state.notes];
  notes[i] ^= bit(d);
  return { ...state, notes, history: push(state, i) };
}

/** Empties cell `i`: its digit or, if it has none, its notes. */
export function erase(state, i) {
  if (state.done || isFixed(state, i) || (!state.cells[i] && !state.notes[i])) return state;
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

/**
 * The hint (the owner asked, 2026-11-11): the cell to fill and why. The selected cell when it is open
 * (empty or wrong); else the easiest one left: a cell with one candidate, then a digit with one place
 * in a row, column or box, counted on the board without its wrong digits; else the open cell with the
 * fewest candidates. `why` is 'single' (only that digit fits the cell), 'row' / 'col' / 'box' (the
 * digit fits only there in that unit) or 'solution' (it just is the solution's).
 */
export function findHint(state, sel = -1) {
  const G = geom(state), { units: UNITS, unitsOf: UNITS_OF } = G, N = G.n;
  const open = i => !isFixed(state, i) && state.cells[i] !== state.solution[i];
  const board = state.cells.map((d, i) => (d && d === state.solution[i] ? d : 0));
  const why = (i, d) => {
    if (popcount(candidates(board, i)) === 1) return 'single';
    for (const [k, kind] of [[0, 'row'], [1, 'col'], [2, 'box']]) {
      const u = UNITS_OF[i].find(v => UNITS.indexOf(v) >= k * N && UNITS.indexOf(v) < k * N + N);
      if (u.every(j => j === i || board[j] || !(candidates(board, j) & bit(d)))) return kind;
    }
    return 'solution';
  };
  if (sel >= 0 && open(sel)) return { i: sel, d: state.solution[sel], why: why(sel, state.solution[sel]) };
  const cells = [...Array(G.cells).keys()].filter(open);
  if (!cells.length) return null;
  const single = cells.find(i => popcount(candidates(board, i)) === 1);
  if (single !== undefined) return { i: single, d: state.solution[single], why: 'single' };
  for (const i of cells) { const w = why(i, state.solution[i]); if (w !== 'solution') return { i, d: state.solution[i], why: w }; }
  const i = cells.reduce((a, b) => (popcount(candidates(board, b)) < popcount(candidates(board, a)) ? b : a));
  return { i, d: state.solution[i], why: 'solution' };
}

/** Uses a hint: writes the solution's digit in its cell, fixed from then on, and counts it (−15). */
export function useHint(state, sel = -1) {
  if (state.done) return state;
  const h = findHint(state, sel), G2 = geom(state);
  if (!h) return state;
  const cells = [...state.cells], notes = [...state.notes];
  cells[h.i] = h.d; notes[h.i] = 0;
  for (const p of G2.peers[h.i]) notes[p] &= ~bit(h.d);
  // Undo cannot take a hint back: the history forgets that cell
  const history = state.history.filter(x => x.i !== h.i);
  return { ...state, cells, notes, history, hints: (state.hints || 0) + 1, hinted: [...(state.hinted || []), h.i], done: solvedNow(cells), last: h };
}

/** The units (rows, columns, boxes) cell `i` completes right now with the solution's digits: for the celebration. */
export function completedUnits(state, i) {
  return geom(state).unitsOf[i].filter(u => u.every(j => state.cells[j] && state.cells[j] === state.solution[j]));
}

export const hasNote = (state, i, d) => !!(state.notes[i] & bit(d));
export const isOver = state => !!state.done;

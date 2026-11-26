/**
 * Twins: the rules as a pure state machine (C-2): no DOM, no global state, testable in node.
 *
 * A board of numbers on a grid with gaps. A number dragged onto an equal number right beside it (up, down,
 * left or right, never across a gap) merges with it into their sum, on the cell it was dropped on: 8 + 8 = 16.
 * The board is solved when one number is left. One board a day, the same for everyone on that date (the
 * player's own midnight), or any board by its seed (`?seed=`).
 *
 * Every board is built backwards from that last number (`generate`): a number splits into two halves on
 * two cells side by side, again and again, so the merges that undo the splits always lead back to it.
 * The order still matters: a merge can leave a number with no equal neighbour it can ever reach, a dead
 * end, and the generator looks for boards that have some, but not too many. ↩ Undo is free; a 💡 hint (`hint`) shows a
 * merge that keeps the board solvable (`solve`) and costs points (D-292). The score is 0 to 100 by time,
 * like Queens (D-107), minus the hints.
 */
import { rng } from '../../assets/js/rng.js';

/** The first daily board: number 1. */
export const LAUNCH = '2026-11-26';
export const COLS = 5;
export const ROWS = 5;
/** How many numbers a board starts with: between these two. */
export const MIN_TILES = 11;
export const MAX_TILES = 13;
/** The last number of a board: an odd base times a power of two, so it can be halved at least four times. */
export const STARTS = [48, 64, 80, 96, 112, 128, 160, 192];
/** Each 💡 hint costs this much (D-292); the score never goes below 0. */
export const HINT_COST = 10;
/** The time score, like Queens (D-107): 100 up to `FAST_MS`, then down evenly to 10 at `SLOW_MS`. */
export const FAST_MS = 30000;
export const SLOW_MS = 300000;

const two = n => String(n).padStart(2, '0');
/** The player's date today, in their time zone: `2026-11-26`. */
export function localDate(ms = Date.now()) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}
const utc = f => { const [y, m, d] = f.split('-').map(Number); return Date.UTC(y, m - 1, d); };
/** The board's number, the one that is shared: the launch day is #1 (and so is a day before it). */
export const numberOf = date => Math.max(1, Math.round((utc(date) - utc(LAUNCH)) / 86400000) + 1);
/** The seed of a day's board. */
export const daySeed = date => 'twins:' + date;

/** A text seed to a 32-bit number (FNV-1a), for `rng`. */
function hash(seed) {
  let h = 0x811c9dc5;
  for (const c of String(seed)) { h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/* ---------------- The grid ---------------- */

/** The cells beside `i`: up, down, left and right. */
export function neighbours(i, cols = COLS, rows = ROWS) {
  const r = Math.floor(i / cols), c = i % cols, out = [];
  if (r > 0) out.push(i - cols);
  if (r < rows - 1) out.push(i + cols);
  if (c > 0) out.push(i - 1);
  if (c < cols - 1) out.push(i + 1);
  return out;
}
const beside = (a, b, cols) => Math.abs(a - b) === cols || (Math.abs(a - b) === 1 && Math.floor(a / cols) === Math.floor(b / cols));

/** How many numbers are on the board. */
export const count = cells => cells.reduce((n, v) => n + (v ? 1 : 0), 0);

/** Can the number on `from` be dropped on `to`? Both hold the same number, side by side. */
export function canMerge(cells, from, to, cols = COLS) {
  return from !== to && !!cells[from] && cells[from] === cells[to] && beside(from, to, cols);
}

/** The board after dropping `from` on `to`: `to` holds the sum, `from` is empty. */
export function merge(cells, from, to) {
  const next = cells.slice();
  next[to] = cells[from] + cells[to];
  next[from] = 0;
  return next;
}

/** Every merge on the board, in reading order: [from, to]. */
export function moves(cells, cols = COLS, rows = ROWS) {
  const out = [];
  cells.forEach((v, i) => { if (v) for (const j of neighbours(i, cols, rows)) if (cells[j] === v) out.push([i, j]); });
  return out;
}

/**
 * A way to one number from `cells`: the list of merges, or null if there is none. A depth-first search that
 * remembers the boards it already found hopeless (`dead`, which calls on the same board may share).
 */
export function solve(cells, cols = COLS, rows = ROWS, dead = new Set()) {
  if (count(cells) <= 1) return [];
  const key = cells.join(',');
  if (dead.has(key)) return null;
  for (const [a, b] of moves(cells, cols, rows)) {
    const rest = solve(merge(cells, a, b), cols, rows, dead);
    if (rest) return [[a, b], ...rest];
  }
  dead.add(key);
  return null;
}
export const solvable = (cells, cols = COLS, rows = ROWS, dead = new Set()) => !!solve(cells, cols, rows, dead);

/** How many of the board's first merges lead to a dead end. */
export function traps(cells, cols = COLS, rows = ROWS) {
  const dead = new Set();
  return moves(cells, cols, rows).filter(([a, b]) => !solvable(merge(cells, a, b), cols, rows, dead)).length;
}

/* ---------------- The generator ---------------- */

/**
 * One board from `seed` (any text): built backwards from its last number. The number sits on a cell near
 * the middle; then, until the board has its count, a number that can still be halved splits onto an empty
 * cell beside it. A board should have a dead end among its first merges (so the order matters), but no more
 * dead ends than good merges (so a first-time player is not lost from the start): of 30 tries with the same
 * seed the first that fits is kept, else the last. The same seed gives the same board.
 */
export function generate(seed, { cols = COLS, rows = ROWS } = {}) {
  const r = rng(hash(seed));
  const pick = list => list[Math.floor(r() * list.length)];
  let board = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const start = pick(STARTS);
    const want = MIN_TILES + Math.floor(r() * (MAX_TILES - MIN_TILES + 1));
    const cells = Array(cols * rows).fill(0);
    const mid = Math.floor(rows / 2) * cols + Math.floor(cols / 2);
    cells[pick([mid, ...neighbours(mid, cols, rows)])] = start;
    let n = 1;
    while (n < want) {
      // The splits that can happen: an even number with an empty cell beside it
      const splits = [];
      cells.forEach((v, i) => { if (v && v % 2 === 0) for (const j of neighbours(i, cols, rows)) if (!cells[j]) splits.push([i, j]); });
      if (!splits.length) break;
      // A bigger number splits more often, so the board keeps numbers of several sizes
      let roll = r() * splits.reduce((t, [a]) => t + cells[a], 0);
      const [i, j] = splits.find(([a]) => (roll -= cells[a]) < 0) || splits.at(-1);
      cells[i] /= 2;
      cells[j] = cells[i];
      n++;
    }
    board = { cols, rows, start, cells };
    const t = traps(cells, cols, rows);
    if (n >= MIN_TILES && t > 0 && t * 2 <= moves(cells, cols, rows).length) break;
  }
  return board;
}

/** The board of `date`. */
export const boardOf = date => generate(daySeed(date));

/* ---------------- A game ---------------- */

/** A game on `board`: the cells now, the boards before each merge (for ↩), the hints taken and the time played. */
export const newGame = (board, { date = null, seed = null } = {}) => ({
  board, date, seed, cells: board.cells.slice(), history: [], hints: 0, ms: 0, done: false,
});

/** The game after dropping `from` on `to`; the same game if that merge cannot be made. */
export function play(state, from, to) {
  if (state.done || !canMerge(state.cells, from, to, state.board.cols)) return state;
  const cells = merge(state.cells, from, to);
  return { ...state, cells, history: [...state.history, state.cells], done: count(cells) === 1 };
}

/** ↩ Undo, free: the board before the last merge. */
export function undo(state) {
  if (state.done || !state.history.length) return state;
  return { ...state, cells: state.history.at(-1), history: state.history.slice(0, -1) };
}

/** No merge left and more than one number: only ↩ gets out. */
export const stuck = state => !state.done && moves(state.cells, state.board.cols, state.board.rows).length === 0;

/**
 * A 💡 hint (D-292): a merge that keeps the board solvable, as `{ from, to }`. If the board can no longer be
 * solved, the merges since the last solvable board are undone first (`undone` says how many). Each costs
 * `HINT_COST` on the score.
 */
export function hint(state) {
  if (state.done) return { state, move: null, undone: 0 };
  const { cols, rows } = state.board;
  const dead = new Set();
  let s = state, undone = 0;
  let way = solve(s.cells, cols, rows, dead);
  while (!way && s.history.length) { s = undo(s); undone++; way = solve(s.cells, cols, rows, dead); }
  const move = way?.length ? { from: way[0][0], to: way[0][1] } : null;
  return { state: { ...s, hints: s.hints + 1 }, move, undone };
}

/** The points for the time alone, like Queens (D-107): 100 up to 30 s, down evenly to 10 at 5 min. */
export function pointsByTime(ms) {
  const t = Math.min(Math.max(ms || 0, FAST_MS), SLOW_MS);
  return Math.round(100 - (90 * (t - FAST_MS)) / (SLOW_MS - FAST_MS));
}

/** The score, 0 to 100: the time's points minus each hint's cost; 0 until it is solved. */
export function score(state) {
  if (!state.done) return 0;
  return Math.max(0, pointsByTime(state.ms) - HINT_COST * state.hints);
}

/** The time as the screen shows it: `1:05`. */
export const clock = ms => { const s = Math.floor((ms || 0) / 1000); return `${Math.floor(s / 60)}:${two(s % 60)}`; };

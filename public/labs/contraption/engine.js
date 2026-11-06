/**
 * Artilugio's engine: the board, the parts, the placing rules and the physics of the ball, with no DOM,
 * so the tests run it in node and the page only draws it.
 *
 * The board is a grid of COLS × ROWS cells; one cell is one unit, y grows downwards. Every part is two
 * cells wide and one tall, anchored at its left cell, and is made of line segments the ball bounces off:
 *  - 'ramp'   a slope, dir +1 goes down to the right (↘), dir -1 down to the left (↙)
 *  - 'plank'  a flat board on the floor of its cells
 *  - 'spring' a trampoline: whatever falls on it is thrown back up to a fixed height
 *  - 'fan'    blows the ball sideways (dir) over itself and the three cells past it, in its row and the one above
 * A level brings fixed pieces (walls, spikes, the goal's cup) and the parts the player may place.
 */
export const COLS = 8, ROWS = 11;
export const R = 0.28;            // the ball's radius
export const G = 22;              // gravity, cells/s²
export const SPRING_V = 18;       // a trampoline's throw: up about 7 rows
export const FAN = 26;            // a fan's push, cells/s²
export const MAX_T = 14;          // a run that lasts longer has failed
export const STILL = 1.4;         // seconds almost still: stuck
export const ROLL = 1.6;          // rolling resistance on flat ground, per second
export const SETTLE = 0.5;        // seconds at rest in the basket: passed
export const SETTLE_V = 0.6;      // below this speed the ball is at rest
export const PARTS = ['ramp', 'plank', 'spring', 'fan'];

/** A part's segments, [x1, y1, x2, y2, kind]. */
export function segmentsOf(p) {
  const { c, r } = p;
  if (p.type === 'ramp') return p.dir > 0 ? [[c, r + 0.1, c + 2, r + 0.9, 'solid']] : [[c, r + 0.9, c + 2, r + 0.1, 'solid']];
  if (p.type === 'plank') return [[c, r + 0.8, c + 2, r + 0.8, 'solid']];
  if (p.type === 'spring') return [[c + 0.1, r + 0.75, c + 1.9, r + 0.75, 'spring']];
  if (p.type === 'fan') return [[c + 0.1, r + 0.85, c + 1.9, r + 0.85, 'solid']];
  return [];
}
/** The cells a part covers. */
export const cellsOf = p => [[p.c, p.r], [p.c + 1, p.r]];

/**
 * The levels. `start` is where the ball drops from, with its first speed; `goal` the cup's left cell
 * (two cells wide, open at the top); `fixed` the pieces the player cannot move (same shapes as the
 * parts, plus 'wall' [x1,y1,x2,y2] and 'spikes' [c, r, width]); `tray` how many of each part there are.
 * Each one is solved with at most the tray it gives (engine.test.mjs plays the solution) and fails
 * without any part.
 */
export const LEVELS = [
  { // 1. A ramp is all it takes
    start: { x: 1.5, y: 0.6 }, goal: { c: 5, r: 9 },
    fixed: [{ type: 'spikes', c: 0, r: 10, w: 4 }],
    tray: { ramp: 1 },
    solution: [{ type: 'ramp', c: 0, r: 4, dir: 1 }],
  },
  { // 2. Down to the left
    start: { x: 6.5, y: 0.6 }, goal: { c: 0, r: 9 },
    fixed: [{ type: 'spikes', c: 3, r: 10, w: 5 }, { type: 'wall', x1: 3, y1: 5, x2: 7, y2: 5 }],
    tray: { ramp: 2 },
    solution: [{ type: 'ramp', c: 5, r: 2, dir: -1 }],
  },
  { // 3. The trampoline throws it over the wall
    start: { x: 0.5, y: 0.6 }, goal: { c: 6, r: 9 },
    fixed: [{ type: 'ramp', c: 0, r: 4, dir: 1 }, { type: 'wall', x1: 5, y1: 3, x2: 5, y2: 11 }, { type: 'spikes', c: 2, r: 10, w: 3 }],
    tray: { spring: 1 },
    solution: [{ type: 'spring', c: 2, r: 5 }],
  },
  { // 4. The fan's breeze
    start: { x: 0.5, y: 0.6 }, goal: { c: 6, r: 9 },
    fixed: [{ type: 'spikes', c: 0, r: 10, w: 6 }, { type: 'wall', x1: 3, y1: 0, x2: 3, y2: 6 }],
    tray: { fan: 1, plank: 1 },  // the plank is a decoy
    solution: [{ type: 'fan', c: 0, r: 7, dir: 1 }],
  },
  { // 5. Zigzag
    start: { x: 3.5, y: 0.6 }, goal: { c: 3, r: 9 },
    fixed: [{ type: 'spikes', c: 0, r: 10, w: 3 }, { type: 'spikes', c: 5, r: 10, w: 3 }, { type: 'ramp', c: 3, r: 2, dir: 1 }, { type: 'wall', x1: 3, y1: 6, x2: 3, y2: 9 }, { type: 'wall', x1: 5, y1: 6, x2: 5, y2: 9 }],
    tray: { ramp: 2, plank: 1 },
    solution: [{ type: 'ramp', c: 5, r: 4, dir: -1 }],
  },
  { // 6. Up and over
    start: { x: 7.5, y: 0.6 }, goal: { c: 0, r: 3 },
    fixed: [{ type: 'spikes', c: 0, r: 10, w: 8 }, { type: 'wall', x1: 2, y1: 4, x2: 2, y2: 10 }],
    tray: { ramp: 2, spring: 1, fan: 1 },
    solution: [{ type: 'ramp', c: 0, r: 1, dir: 1 }, { type: 'fan', c: 6, r: 1, dir: -1 }],
  },
];

/** The fixed segments of a level: its pieces, the cup and the board's sides (no floor: falling out fails). */
export function fixedSegments(level) {
  const s = [[0, -3, 0, ROWS, 'solid'], [COLS, -3, COLS, ROWS, 'solid']];
  for (const f of level.fixed) {
    if (f.type === 'wall') s.push([f.x1, f.y1, f.x2, f.y2, 'solid']);
    else if (f.type === 'spikes') s.push([f.c, f.r + 0.7, f.c + f.w, f.r + 0.7, 'spikes']);
    else s.push(...segmentsOf(f).map(x => [...x, f]));
  }
  const { c, r } = level.goal;
  s.push([c + 0.1, r, c + 0.1, r + 1, 'solid'], [c + 1.9, r, c + 1.9, r + 1, 'solid'], [c + 0.1, r + 1, c + 1.9, r + 1, 'solid']);
  return s;
}
/** The cells nobody may place a part on: the fixed pieces', the cup's and the start's. */
export function blockedCells(level) {
  const b = new Set();
  const add = (c, r) => b.add(`${c},${r}`);
  for (const f of level.fixed) {
    if (f.type === 'spikes') for (let i = 0; i < f.w; i++) add(f.c + i, f.r);
    else if (f.type === 'wall') {
      // Every cell the wall touches, both sides when it runs along a grid line
      const n = 40;
      for (let i = 0; i <= n; i++) {
        const x = f.x1 + (f.x2 - f.x1) * i / n, y = Math.min(ROWS - 0.001, f.y1 + (f.y2 - f.y1) * i / n);
        const xs = Number.isInteger(x) ? [x - 1, x] : [Math.floor(x)], ys = Number.isInteger(y) && f.y1 === f.y2 ? [y - 1, y] : [Math.floor(y)];
        for (const a of xs) for (const b of ys) if (a >= 0 && a < COLS && b >= 0) add(a, b);
      }
    } else cellsOf(f).forEach(([c, r]) => add(c, r));
  }
  add(level.goal.c, level.goal.r); add(level.goal.c + 1, level.goal.r);
  add(Math.floor(level.start.x), Math.floor(level.start.y));
  return b;
}

/** A board to build on: the level, the parts placed and what is left in the tray. */
export function newBoard(which) {
  const level = typeof which === 'number' ? LEVELS[which] : which, index = typeof which === 'number' ? which : -1;
  return { index, level, placed: [], left: { ...level.tray }, blocked: blockedCells(level) };
}
/** Whether a part fits at c, r: inside the board, on free cells. */
export function fits(board, p, ignore = null) {
  return cellsOf(p).every(([c, r]) => c >= 0 && c < COLS && r >= 0 && r < ROWS && !board.blocked.has(`${c},${r}`)
    && !board.placed.some(q => q !== ignore && cellsOf(q).some(([a, b]) => a === c && b === r)));
}
/** Places a part from the tray; false if none is left or it does not fit. */
export function place(board, type, c, r, dir = 1) {
  if (!(board.left[type] > 0)) return false;
  const p = { type, c, r, dir };
  if (!fits(board, p)) return false;
  board.placed.push(p); board.left[type]--;
  return p;
}
/** Moves a placed part; false if it does not fit there. */
export function move(board, p, c, r) {
  const q = { ...p, c, r };
  if (!fits(board, q, p)) return false;
  p.c = c; p.r = r; return true;
}
/** Back to the tray. */
export function remove(board, p) {
  const i = board.placed.indexOf(p);
  if (i < 0) return false;
  board.placed.splice(i, 1); board.left[p.type]++;
  return true;
}
/** The part at a cell, if any. */
export const partAt = (board, c, r) => board.placed.find(p => cellsOf(p).some(([a, b]) => a === c && b === r)) || null;
/** Turns a ramp or a fan round; planks and trampolines have no direction. */
export function flip(p) { if (p.type === 'ramp' || p.type === 'fan') { p.dir = -p.dir; return true; } return false; }

/* ------------------------------------------------------------------ */
/* The run                                                             */
/* ------------------------------------------------------------------ */
/** Starts a run of the board as it is: the ball at the start, every segment fixed. */
export function newRun(board, opts = {}) {
  const { level } = board;
  const parts = [...level.fixed.filter(f => f.type !== 'wall' && f.type !== 'spikes'), ...board.placed];
  return {
    ball: { x: level.start.x, y: level.start.y, vx: level.start.vx || 0, vy: 0 },
    segs: [...fixedSegments(level), ...board.placed.flatMap(p => segmentsOf(p).map(x => [...x, p]))],
    fans: parts.filter(p => p.type === 'fan'),
    goal: level.goal, t: 0, still: 0, state: 'running', events: [],
    path: opts.path ? [] : null,
  };
}

function closest(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2)) : 0;
  return [x1 + t * dx, y1 + t * dy];
}

/** One step of dt seconds: gravity, the fans, the bounces, and whether it is in, out, spiked or stuck. */
export function stepRun(run, dt) {
  if (run.state !== 'running') return run;
  const b = run.ball;
  let ax = 0, ay = G;
  for (const f of run.fans) {
    // The breeze: over the fan and the three cells past it on the side it faces, its own row and the one above
    const x0 = f.dir > 0 ? f.c : f.c - 3, x1 = x0 + 5;
    if (b.x >= x0 && b.x <= x1 && b.y >= f.r - 1 && b.y <= f.r + 1) ax += FAN * f.dir;
  }
  b.vx += ax * dt; b.vy += ay * dt;
  b.x += b.vx * dt; b.y += b.vy * dt;
  for (const s of run.segs) {
    const [cx, cy] = closest(b.x, b.y, s);
    let nx = b.x - cx, ny = b.y - cy;
    const d = Math.hypot(nx, ny);
    if (d >= R || d === 0) continue;
    nx /= d; ny /= d;
    if (s[4] === 'spikes') { run.state = 'spiked'; run.events.push({ type: 'spiked', x: b.x, y: b.y }); return run; }
    b.x += nx * (R - d); b.y += ny * (R - d);
    const vn = b.vx * nx + b.vy * ny;
    if (vn >= 0) continue;
    if (s[4] === 'spring' && ny < -0.5) {
      b.vy = -SPRING_V; b.vx *= 0.9;
      run.events.push({ type: 'boing', part: s[5] });
    } else {
      const e = vn < -4 ? 0.35 : 0;
      b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
      // A little rolling friction along the surface, more on a flat floor so a ball rolling there comes to rest
      b.vx *= 0.998; b.vy *= 0.998;
      if (ny < -0.97) b.vx *= 1 - ROLL * dt;
      if (vn < -4) run.events.push({ type: 'knock' });
    }
  }
  run.t += dt;
  if (run.path) run.path.push(b.x, b.y);
  // The floor of the board: the ball that touches it blows up
  if (b.y + R >= ROWS) { b.y = ROWS - R; run.state = 'boom'; run.events.push({ type: 'boom', x: b.x, y: b.y }); return run; }
  // The basket: the level is passed only once the ball has come to rest inside it, not as it flies through
  // In the basket means down on its floor, not only past its rim: it may still roll from side to side
  const { c, r } = run.goal, inCup = b.x > c + 0.1 && b.x < c + 1.9 && b.y > r + 1 - R - 0.08 && b.y < r + 1;
  const slow = Math.hypot(b.vx, b.vy) < SETTLE_V;
  run.settle = inCup && slow ? (run.settle || 0) + dt : 0;
  if (run.settle >= SETTLE) { run.state = 'won'; run.events.push({ type: 'won' }); return run; }
  run.still = slow && !inCup ? run.still + dt : 0;
  if (run.still > STILL || run.t > MAX_T) { run.state = 'stuck'; run.events.push({ type: 'stuck' }); }
  return run;
}
/** Plays a whole run without drawing; the state it ends in: 'won', 'spiked', 'boom' (the floor) or 'stuck'. */
export function simulate(board, dt = 1 / 120, opts = {}) {
  const run = newRun(board, opts);
  while (run.state === 'running') stepRun(run, dt);
  return run;
}
/** Stars for a solved level: 3 using the fewest parts the level needs, fewer with more. */
export function starsOf(which, used) {
  const need = (typeof which === 'number' ? LEVELS[which] : which).solution.length;
  return used <= need ? 3 : used === need + 1 ? 2 : 1;
}

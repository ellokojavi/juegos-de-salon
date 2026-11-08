// Artefactos' level pool: generates public/labs/artifacts/levels.js, levels of growing difficulty
// that the game deals at random (docs/games/artifacts.md).
//
// Each level is built backwards from a working machine, so every one has an answer:
//  1. the ball drops from a random pipe; k parts are chained on its real path, each placed where the
//     ball passes so it changes the run;
//  2. the basket goes where that machine drops the ball, and the run must end at rest in it;
//  3. hazards (spikes on the floor and in the air, steel girders, fixed planks) are added only where
//     the machine still works;
//  4. the answer must read as a machine, not a fluke (legible(), the owner's request, 2026-11-08): it
//     still wins when the ball starts a hair to either side or the physics steps finer or coarser (no
//     chaos), with few hard bounces (4 + k), a short run (3 + 1.2·k s), and the ball meeting each part at
//     most twice;
//  5. a level is kept only if an exhaustive search finds no answer with fewer parts than k, from the
//     tray it gives (k parts plus decoys). The search is exact while pruned: a part the ball never
//     comes near (and no fan blows on) cannot change the run, so only parts near the path are tried.
//
// node tools/generators/artifacts-levels.mjs [per-tier=10] [seed=1] [tiers=1-6]
// With a tier list (e.g. 5 or 4,6) it writes only those tiers to a part file in /tmp, and
// `node tools/generators/artifacts-levels.mjs merge <parts…>` joins them into levels.js: the slow tiers
// run side by side.
import fs from 'node:fs';
import { COLS, ROWS, R, newBoard, newRun, stepRun, place, simulate, segmentsOf, fits, blockedCells } from '../../public/labs/artifacts/engine.js';

const MERGE = process.argv[2] === 'merge';
const PER = Number(process.argv[2] || 10), SEED = Number(process.argv[3] || 1);
const ONLY = !MERGE && process.argv[4] ? process.argv[4].split(',').map(Number) : null;
const OUT = new URL('../../public/labs/artifacts/levels.js', import.meta.url);

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(SEED);
const pickOf = a => a[Math.floor(rand() * a.length)];
const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

/* The tiers: how many parts the answer needs, which kinds, decoys in the tray and hazards */
const TIERS = [
  { k: 1, types: ['ramp'], decoys: 0, hazards: [1, 2] },
  { k: 1, types: ['ramp', 'spring', 'fan'], decoys: 1, hazards: [2, 3] },
  { k: 2, types: ['ramp', 'plank', 'spring'], decoys: 0, hazards: [2, 3] },
  { k: 2, types: ['ramp', 'spring', 'fan', 'plank'], decoys: 1, hazards: [3, 4] },
  { k: 3, types: ['ramp', 'spring', 'fan'], decoys: 0, hazards: [3, 4] },
  { k: 3, types: ['ramp', 'plank', 'spring', 'fan'], decoys: 1, hazards: [4, 6] },
];
const FLIP = t => t === 'ramp' || t === 'fan';
const OFF = { c: -50, r: -50 };   // no basket yet

function run(level, parts, path = false) {
  const b = newBoard(level);
  for (const p of parts) if (!place({ ...b, left: { [p.type]: 1 } }, p.type, p.c, p.r, p.dir)) return null;
  // place() spent the borrowed tray, not the board's; put the parts on the board itself
  b.placed = parts.map(p => ({ ...p }));
  return simulate(b, 1 / 120, { path });
}
const fitsOn = (level, parts, p) => { const b = newBoard(level); b.placed = parts.map(q => ({ ...q })); return fits(b, p); };

/** Every placement near a path (within reach of the ball, or a fan blowing on it). */
function nearPath(level, parts, path, types) {
  const pts = [];
  for (let i = 0; i < path.length; i += 6) pts.push([path[i], path[i + 1]]);
  const out = [];
  for (const type of types) for (const dir of FLIP(type) ? [1, -1] : [1]) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 1; c++) {
    const p = { type, c, r, dir };
    if (!fitsOn(level, parts, p)) continue;
    const segs = segmentsOf(p);
    const near = pts.some(([x, y]) => segs.some(([x1, y1, x2, y2]) => {
      const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy, t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / l));
      return Math.hypot(x - x1 - t * dx, y - y1 - t * dy) < R + 0.12;
    }) || (type === 'fan' && x >= (dir > 0 ? c : c - 3) && x <= (dir > 0 ? c : c - 3) + 5 && y >= r - 1 && y <= r + 1));
    if (near) out.push(p);
  }
  return out;
}

/** One run of a level with its parts, the start nudged by dx and stepped by dt: its end, bounces and contacts. */
function probe(level, parts, { dx = 0, dt = 1 / 120 } = {}) {
  const b = newBoard({ ...level, start: { ...level.start, x: level.start.x + dx } });
  b.placed = parts.map(p => ({ dir: 1, ...p }));
  const r = newRun(b, { path: true }); let hits = 0;
  while (r.state === 'running') { stepRun(r, dt); for (const e of r.events.splice(0)) if (e.type === 'knock' || e.type === 'boing') hits++; }
  // how many separate times the ball meets each part (a fan's breeze is not a contact)
  const meets = b.placed.map(p => {
    if (p.type === 'fan') return 1;
    const segs = segmentsOf(p); let n = 0, on = false;
    for (let i = 0; i < r.path.length; i += 2) {
      const x = r.path[i], y = r.path[i + 1];
      const t = segs.some(([x1, y1, x2, y2]) => { const ex = x2 - x1, ey = y2 - y1, l = ex * ex + ey * ey, k = Math.max(0, Math.min(1, ((x - x1) * ex + (y - y1) * ey) / l)); return Math.hypot(x - x1 - k * ex, y - y1 - k * ey) < R + 0.05; });
      if (t && !on) n++; on = t;
    }
    return n;
  });
  return { state: r.state, t: r.t, hits, meets };
}
/** Whether an answer can be worked out rather than stumbled on: no chaos, few bounces, a short run, each part met once or twice. */
function legible(level, parts) {
  const k = parts.length, m = probe(level, parts);
  if (m.state !== 'won' || m.hits > 4 + k || m.t > 3 + 1.2 * k || m.meets.some(n => n > 2)) return false;
  for (const dx of [-0.08, -0.04, 0.04, 0.08]) if (probe(level, parts, { dx }).state !== 'won') return false;
  for (const dt of [1 / 90, 1 / 240]) if (probe(level, parts, { dt }).state !== 'won') return false;
  return true;
}

/** Whether the level has an answer with at most `depth` parts from its tray (exact, pruned). */
function solvable(level, depth, parts = [], left = { ...level.tray }) {
  const r = run(level, parts, true);
  if (!r) return false;
  if (r.state === 'won') return true;
  if (!depth) return false;
  const types = Object.keys(left).filter(t => left[t] > 0);
  for (const p of nearPath(level, parts, r.path, types)) {
    left[p.type]--;
    const ok = solvable(level, depth - 1, [...parts, p], left);
    left[p.type]++;
    if (ok) return true;
  }
  return false;
}

/** Steps 1 and 2: a machine of k parts chained on the ball's path, and the basket where it lands. */
function machine(tier) {
  const level = { start: { x: int(0, COLS - 1) + 0.5, y: 0.6 }, goal: OFF, fixed: [], tray: {} };
  const parts = [];
  for (let i = 0; i < tier.k; i++) {
    const r0 = run(level, parts, true);
    const pts = [];
    for (let j = 0; j < r0.path.length; j += 2) { const x = r0.path[j], y = r0.path[j + 1]; if (y > 1.4 && y < ROWS - 1.3) pts.push([x, y]); }
    if (!pts.length) return null;
    let placed = false;
    for (let tries = 0; tries < 30 && !placed; tries++) {
      const [x, y] = pickOf(pts), type = i === 0 && tier.types.includes('ramp') && rand() < 0.5 ? 'ramp' : pickOf(tier.types);
      const p = { type, c: Math.max(0, Math.min(COLS - 2, Math.floor(x) - int(0, 1))), r: Math.floor(y + R * 0.5), dir: FLIP(type) ? pickOf([1, -1]) : 1 };
      if (p.r >= ROWS - 1 || !fitsOn(level, parts, p)) continue;
      const after = run(level, [...parts, p], true);
      // it has to change the run, and the ball must not end stuck on it
      if (!after || after.state === 'stuck' || Math.abs(after.ball.x - r0.ball.x) < 0.6 && Math.abs(after.t - r0.t) < 0.15) continue;
      parts.push(p); placed = true;
    }
    if (!placed) return null;
  }
  // The basket: where the machine's ball comes down, at a height its path crosses on the way down
  const end = run(level, parts, true);
  if (end.state !== 'boom') return null;
  const path = end.path, rows = [];
  for (let j = 2; j < path.length; j += 2) {
    const x = path[j], y = path[j + 1];
    if (path[j + 1] > path[j - 1] && y > 3 && Math.floor(y) !== Math.floor(path[j - 1])) rows.push([x, Math.floor(y)]);
  }
  for (const [x, rr] of rows.sort(() => rand() - 0.5)) {
    const r = Math.min(rr, ROWS - 2), c = Math.max(0, Math.min(COLS - 2, Math.round(x - 1)));
    const lv = { ...level, goal: { c, r } };
    if (parts.some(p => (p.c === c || p.c === c + 1 || p.c + 1 === c) && p.r === r)) continue;
    if (blockedCells(lv).has(`${Math.floor(level.start.x)},${Math.floor(level.start.y)}`) && c <= level.start.x && level.start.x < c + 2 && r === 0) continue;
    const w = run(lv, parts);
    if (w && w.state === 'won') return { level: lv, parts };
  }
  return null;
}

/** Whether a fixed piece sits on the basket's cells (spikes inside it, a girder through it): never fair. */
const inBasket = (level, f) => { const b = blockedCells({ start: { x: -50, y: -50 }, goal: OFF, fixed: [f] }), { c, r } = level.goal; return b.has(`${c},${r}`) || b.has(`${c + 1},${r}`); };

/** Step 3: hazards only where the machine still works, and that make the board read as a puzzle. */
function hazards(level, parts, n) {
  const fixed = [];
  const works = f => { const lv = { ...level, fixed: [...fixed, f] }; const r = run(lv, parts); return r && r.state === 'won'; };
  // the floor: spikes along it, except under the basket
  if (rand() < 0.7) { const c = int(0, 4), w = int(2, 4); const f = { type: 'spikes', c, r: ROWS - 1, w: Math.min(w, COLS - c) }; if (!inBasket(level, f) && works(f)) fixed.push(f); }
  for (let tries = 0; tries < 40 && fixed.length < n; tries++) {
    const kind = pickOf(['spikes', 'wall', 'wall', 'plank', 'ramp']);
    let f;
    if (kind === 'spikes') { const c = int(0, COLS - 2); f = { type: 'spikes', c, r: int(3, ROWS - 2), w: int(1, Math.min(3, COLS - c)) }; }
    else if (kind === 'wall') { const x = int(1, COLS - 1), y = int(1, ROWS - 4), l = int(2, 4); f = rand() < 0.6 ? { type: 'wall', x1: x, y1: y, x2: x, y2: Math.min(ROWS, y + l) } : { type: 'wall', x1: Math.max(0, x - 1), y1: y, x2: Math.min(COLS, x + l - 1), y2: y }; }
    else f = { type: kind, c: int(0, COLS - 2), r: int(2, ROWS - 2), dir: pickOf([1, -1]) };
    const lv = { ...level, fixed: [...fixed, f] };
    const b = newBoard(lv);
    if (parts.some(p => !fits(b, p)) || inBasket(level, f)) continue;
    if (works(f)) fixed.push(f);
  }
  return fixed;
}

// `check`: re-checks the pool in levels.js against the engine as it is now (after a physics change):
// every answer wins, and no level has an answer with fewer parts. Exits 1 and names the ones that fail.
if (process.argv[2] === 'check') {
  const { POOL } = await import('../../public/labs/artifacts/levels.js');
  const bad = [];
  for (const L of POOL) {
    const k = L.solution.length;
    if (L.fixed.some(f => inBasket(L, f))) bad.push(`${L.id}: a fixed piece sits on the basket`);
    else if (run(L, L.solution).state !== 'won') bad.push(`${L.id}: its answer no longer wins`);
    else if (!legible(L, L.solution)) bad.push(`${L.id}: its answer is a fluke (chaotic, too many bounces or too long)`);
    else if (solvable(L, k - 1)) bad.push(`${L.id}: has an answer with fewer than ${k} parts`);
    process.stdout.write(`\r${POOL.indexOf(L) + 1}/${POOL.length}   `);
  }
  console.log(bad.length ? `\n✗ ${bad.join('\n✗ ')}` : `\n✓ the ${POOL.length} levels hold`);
  process.exit(bad.length ? 1 : 0);
}

const pool = [];
const t0 = Date.now();
for (let ti = 0; ti < TIERS.length && !MERGE; ti++) {
  if (ONLY && !ONLY.includes(ti + 1)) continue;
  const tier = TIERS[ti];
  let made = 0, tries = 0;
  while (made < PER && tries < (tier.k > 2 ? 60000 : 8000)) {
    tries++;
    const m = machine(tier);
    if (!m) continue;
    const fixed = hazards(m.level, m.parts, int(...tier.hazards));
    const tray = {};
    for (const p of m.parts) tray[p.type] = (tray[p.type] || 0) + 1;
    for (let d = 0; d < tier.decoys; d++) { const t = pickOf(['ramp', 'plank', 'spring', 'fan']); tray[t] = (tray[t] || 0) + 1; }
    const level = { start: m.level.start, goal: m.level.goal, fixed, tray, solution: m.parts };
    // it must not solve itself, and no answer may use fewer parts than k
    if (run(level, []).state === 'won' || run(level, m.parts).state !== 'won' || !legible(level, m.parts)) continue;
    if (tier.k > 1 && solvable(level, tier.k - 1)) continue;
    if (tier.k === 1 && solvable(level, 0)) continue;
    pool.push({ id: `t${ti + 1}-${made + 1}`, tier: ti + 1, ...level });
    made++;
    process.stdout.write(`\rtier ${ti + 1}: ${made}/${PER} (${tries} tries, ${Math.round((Date.now() - t0) / 1000)} s)   `);
  }
  console.log();
}
if (MERGE) for (const f of process.argv.slice(3)) pool.push(...JSON.parse(fs.readFileSync(f, 'utf8')));
pool.sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id, 'en', { numeric: true }));
if (ONLY) { const f = `/tmp/artifacts-tiers-${ONLY.join('-')}.json`; fs.writeFileSync(f, JSON.stringify(pool)); console.log(`✓ ${pool.length} levels → ${f}`); process.exit(0); }
const js = `// Artefactos' level pool, generated by tools/generators/artifacts-levels.mjs (${pool.length} levels in ${TIERS.length} tiers):
// do not edit by hand, run it again. Each level is solved by its \`solution\` (engine.test.mjs plays it) and
// has no answer with fewer parts (checked by the generator's exhaustive search).
export const POOL = ${JSON.stringify(pool)};
`;
fs.writeFileSync(OUT, js);
console.log(`✓ ${pool.length} levels in ${Math.round((Date.now() - t0) / 1000)} s → public/labs/artifacts/levels.js`);

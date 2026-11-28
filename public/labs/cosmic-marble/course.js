/**
 * Cosmic Marble (Canica Cósmica): the course, its physics and its canvas (from the Bolita prototype,
 * docs/games/cosmic-marble.md). The page (game.js) owns the cover, the result and the memory; this
 * module draws the run inside #screen-play and calls back at each stage and at the end.
 */
import { getLang } from '../../assets/js/i18n.js';
import { isMuted } from '../../assets/js/sound.js';
import { COURSE_TEXTS as TEXTS } from './rules.js';
import { stagePoints, runScore } from './engine.js';
/**
 * 🔮 Cosmic Marble, from the Bolita prototype. The phone lies flat on the table and is the board: tilt it and a marble
 * (neon, water, galaxy, electric or fire, to match the world) rolls through five themed courses to the glowing hole. No mazes to get lost in: the way is
 * clear, the trick is getting along it. Bumpers, black holes, conveyor belts, spinning bars, pistons,
 * lava, lasers and sparks, a little harder each stage. Three lives, four minutes.
 *
 * Score: finish all five in under 2:00 and it's 100; after that it drops to 50 at 4:00. Each life lost
 * takes 20. A run you don't finish is worth 10 per stage cleared (lives still count).
 *
 * Parts: the texts; the courses (hand-made, in a portrait 8 × 13 frame, turned for landscape); the game
 * (fixed-step physics against segments, arcs and discs); the input (tilt, keys, drag); the view (flat 2D
 * neon canvas, galaxy marble, sparks and light on every hit, sound) and the cards.
 *
 * Address options: ?lang=en|pt, ?stage=3 (start at a later stage), ?order=fire,galaxy,neon,water,electric (fix the
 * order of the worlds; normally it is random), ?seed=123 (the same courses every time), ?vmax=5 (top speed, cells per second).
 */

/* ================================================================== */
/* The texts, in the site's three languages                            */
/* ================================================================== */
/**
 * In the shape of the site's texts files: `juego` is the game's entry, `ui` the keys its screen reads,
 * all prefixed `bo`. Plural forms are [none, one, many]. 'a|b' is a title and its line. A key ending in
 * `Desk` is the same text for a keyboard and mouse.
 */

const Q = new URLSearchParams(location.search);
/** The language: `?lang=en` in the address, else the one the site saved on this phone, else Spanish. */
const LANG = TEXTS[getLang()] ? getLang() : 'es';
const UI = TEXTS[LANG].ui;
const fmt = (s, o = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (o[k] !== undefined ? o[k] : ''));
const plural = (forms, n, o = {}) => fmt(forms[Math.max(0, Math.min(n, 2))], Object.assign({ n }, o));
const mmss = s => { s = Math.max(0, Math.ceil(s - 1e-6)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/* ================================================================== */
/* The courses: hand-made, portrait 8 × 13 (y grows downward)           */
/* ================================================================== */
const TAU = Math.PI * 2;
/**
 * Each course: its colours, start and goal, then whatever it has. All in cells of a portrait frame 8
 * wide and 13 tall; on a landscape screen the whole course is turned a quarter.
 *   walls     [x1, y1, x2, y2]                 straight walls (round ends)
 *   bumpers   [x, y, r]                        kick the marble away
 *   rocks     {line: [x1, y1, x2, y2] | orbit: [cx, cy, radius], r, speed}   drifting discs that shove
 *   holes     [x, y, r]                        fall in: a life
 *   wells     [x, y, pull radius, pull, r]     black holes: pull you in, the middle swallows
 *   voids     [x, y, w, h]                     lava: roll onto it and you burn
 *   belts     [x, y, w, h, ax, ay]             conveyor belts: push the marble along
 *   spinners  [x, y, half length, turn speed]  spinning bars
 *   sliders   [x1, y1, x2, y2, dx, dy, period, phase]   pistons going back and forth
 *   sparks    {line: [x1, y1, x2, y2] | orbit: [cx, cy, radius], speed}   touch one: a life
 *   lasers    [x1, y1, x2, y2, period, on share, phase]  beams that switch on and off: a life
 *   gate      [cx, cy, r, gap, turn speed]     a turning ring around the goal, with one gap
 *   boosts    [x, y]                           ⚡ turbo for a few seconds
 *   route     [[x, y], …]                      the way through (not drawn; used to check the course)
 *   rings     [cx, cy, r, gap angle, gap width] circular walls with one gap (orbits)
 *   polys     [[x, y], …]                      walls as a chain of straight pieces (sharp zigzags)
 *   river     {pts, hw, zones}                 a winding river; zones [from, to, ±1, strength] (shares of its length): −1 runs against you, +1 carries you
 *   checks    [x1, y1, x2, y2, rx, ry]         checkpoint lines across the way: cross one and a lost life brings you back to (rx, ry)
 *   theme     neon · water · galaxy · electric · fire: the look, and the marble
 */
/* ================================================================== */
/* The courses: generated, from rules                                  */
/* ================================================================== */
/*
 * Every stage is generated from a seed, its world and its difficulty d (1…5, the stage number in the run).
 * First the world's STRUCTURE (lanes, a river, a field of black holes, jagged columns, lava islands),
 * whose sizes depend on d; then the HAZARDS, bought from a budget along the way through. The rules:
 *
 *   Points          each stage has a par (3 s + route ÷ 1.6, rounded to 5 s): 20 within par, down to 10 at
 *                   twice the par; −3 per life lost; a clean stage gives a heart back; no time limit.
 *   Budget          5 + 3·(d − 1) points per stage (d1: 5 … d5: 17); each hazard has a cost and a lowest d.
 *   Road bumpers    2 + d more bumpers for free, out on the road (not against the walls), always leaving
 *                   one side a gap of ≥ 0.95 cells; if they ever close the way the newest go.
 *   Speed           everything that moves runs at 0.7 + 0.08·d (d1: 0.78× … d5: 1.1×).
 *   Pull            black holes and whirlpools pull at 0.75 + 0.07·d of their strength.
 *   Beams           arcs and flame jets are on 0.35 + 0.04·d of the time (never more than 0.55).
 *   Spacing         slots every 1.0 cell along the way, filled in two passes; a hard hazard (cost ≥ 2) is
 *                   never next to another hard one; the start, the goal and checkpoints stay clear.
 *   Lethal          sparks and beams only on straight stretches, ≥ 2.8 cells from the start, crossing the way once.
 *   No bumper within 1.2 cells of lava (a kick must never throw you straight in).
 *   Checkpoints     picked from the structure's chokes, and only if the path-finder can't reach the goal
 *                   with that line closed: never avoidable. 1 at d ≤ 2, 2 at d ≥ 3.
 *   Checked         after building, a path-finder must still get from start to goal past everything that
 *                   doesn't move; if not, the seed is bumped and the stage is built again.
 *
 * Per world, what d changes in the structure:
 *   Neón       4 lanes (5 from d2, 6 from d4), gaps 2.3 − 0.1·d; chicane stubs; neon blades swinging from the walls.
 *   Agua       a spiral river, lanes 2 cells apart, winding in (or out); pinches at the checkpoints; eddies
 *              by the banks; 4–6 stretches alternating upstream / downstream; current 2.4 + 0.45·d.
 *   Galaxia    energy barriers (2, or 3 from d3) with one gap each, alternating sides; 3 + ⌈d/2⌉ black
 *              holes between the gaps, some in broken orbit rings; d − 1 asteroids drift across.
 *   Electricidad  a circuit board laid out fresh: 3–4 columns, each divider in its own style (sawtooth,
 *              castellated, a trace jogging at 45°, a comb of pins); IC chips against the walls.
 *   Volcán     (no zappers) a winding way through lava; every row moves sideways; a few loop cells; the lava eats
 *              into the bridges (0.05 + 0.06·(d − 1) each side).
 */
const W0 = 8, H0 = 13;
const THEME_STYLE = {
  neon: { hue: '#f2f8ff', bump: '#ff5d73' }, water: { hue: '#3ab8ff', bump: '#7fe0ff' }, galaxy: { hue: '#b07bff', bump: '#ffd23f' },
  electric: { hue: '#4fd8ff', bump: '#ffe14f' }, fire: { hue: '#ff5a36', bump: '#ffd23f' },
};
/**
 * The balance knobs, one place: each world's difficulty comes from these. Tuned with simulated players (160 full
 * games): a medium player clears ~3.5 of 5 stages and loses about as many lives in each world; an expert ~4.7.
 */
const TUNE = {
  gPull: 11.0,      // black holes: pull strength
  gCore: 0.1,        // black holes: extra core radius
  eddyPull: 8.3,     // whirlpools by the bank: pull strength
  flow: 1.1,         // river current: scale
  lavaE0: 0.18, lavaE1: 0.1,   // lava eating into the bridges: base + per difficulty
  volPeriod: [8, 7, 6.2, 5.5, 5],   // volcano: seconds between bombs, per difficulty 1..5
  volAim: [0.3, 0.5, 0.65, 0.8, 0.92],    // volcano: share of bombs aimed at where you are going; the rest land somewhere along the way, near or far
  volJit: [0.9, 0.8, 0.7, 0.55, 0.45],    // volcano: how far (cells, at most) an aimed bomb lands from its mark
  bladeFull: 0.08,  // share of full-reach blades: bladeFull · d (from d3)
  bladeSpeed: 0.95,   // blade swing speed: scale
  beamOn: 0.76,       // arcs: share of time on, scale
  sparkSpeed: 0.85,   // sparks: speed, scale
  holeR: 0.42,     // holes: radius
  wind: 1.2,         // gusts: strength, scale
  volLead: 0.55,   // volcano: how far ahead (seconds of your speed) it aims
  bombR: 0.45,     // volcano: blast radius of a bomb (and of the fire it leaves)
  fallPull: 4.5,   // waterfalls: how hard the water drags you toward the lip (at the lip; it fades with distance)
  fallReach: 1.3,  // waterfalls: how far from the lip the drag starts
  burnT: 2.2,      // volcano: seconds the ground keeps burning
  lavaGrow: [0, 0, 0, 0, 0],   // volcano: per difficulty, rock added all along the shore after the plan is bent (cells; thin seams of lava break if this is large)
  lavaBend: [-0.18, -0.12, -0.1, 0, 0],   // volcano: per difficulty, a correction to how far the lava eats into the bridges, so that after bending and melting the narrowest places are as wide as the old straight corridors were
};
if (window.__tune) Object.assign(TUNE, window.__tune);
const DIFF = d => ({ budget: 5 + 3 * (d - 1), sp: 0.7 + 0.08 * d, pull: 0.75 + 0.07 * d, beamOn: Math.min(0.55, 0.35 + 0.04 * d) * TUNE.beamOn, beamPeriod: 2.7 - 0.1 * d });
/** A jagged wall: teeth `amp` either side of x, every `step` from y0 to y1 (the sharp electric walls). */
function zigzag(x, y0, y1, step, amp, sign) {
  const pts = [], dir = Math.sign(y1 - y0);
  for (let k = 0, y = y0; dir > 0 ? y <= y1 + 1e-9 : y >= y1 - 1e-9; k++, y += dir * step) pts.push([x + (k % 2 ? -sign : sign) * amp, y]);
  return pts;
}
/** Points along an orbit: radius r around (cx, cy), from angle a0 to a1. */
const orbitPts = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, k) => { const a = a0 + (a1 - a0) * k / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });

/* ---------- structure, per world ---------- */
/**
 * Each returns the walls (and river, lava, black holes…), start and goal, and `chokes`: short segments
 * across the only way through, in order along the course, from which the checkpoints are picked.
 */
/** A polyline through the corners `wp`, each corner rounded with radius rc, sampled every `step`. */
function filletPath(wp, rc, step) {
  const out = [];
  const line = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(l / step)); for (let j = 0; j < n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); };
  let cur = wp[0];
  for (let k = 1; k < wp.length - 1; k++) {
    const p = wp[k], a = wp[k - 1], b = wp[k + 1];
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]), t = Math.min(rc, la / 2, lb / 2);
    const ua = [(p[0] - a[0]) / la, (p[1] - a[1]) / la], ub = [(b[0] - p[0]) / lb, (b[1] - p[1]) / lb];
    const p1 = [p[0] - ua[0] * t, p[1] - ua[1] * t], p2 = [p[0] + ub[0] * t, p[1] + ub[1] * t];
    line(cur, p1);
    // a true circular arc (corners are square), so the inner bank never folds
    const c = [p1[0] + ub[0] * t, p1[1] + ub[1] * t], a1 = Math.atan2(p1[1] - c[1], p1[0] - c[0]);
    let da = Math.atan2(p2[1] - c[1], p2[0] - c[0]) - a1; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
    const n = Math.max(3, Math.round(t * Math.abs(da) / step));
    for (let j = 0; j < n; j++) { const a = a1 + da * j / n; out.push([c[0] + t * Math.cos(a), c[1] + t * Math.sin(a)]); }
    cur = p2;
  }
  line(cur, wp[wp.length - 1]); out.push(wp[wp.length - 1]);
  return out;
}
const STRUCTURES = {
  neon(d, r) {
    // lanes; every gap between lanes is a choke; chicanes (stubs off the lane walls) make you weave
    // always 4 lanes: harder means more in them, not a longer way
    const n = 3, gap = 2.1 - 0.1 * d, lane = H0 / (n + 1), walls = [], chokes = [], winds = [];
    let side = r() < 0.5 ? 1 : -1;
    const start = [side > 0 ? 1.3 : W0 - 1.3, H0 - lane / 2];
    for (let k = 1; k <= n + 1; k++) {
      const yb = H0 - lane * (k - 1), yt = H0 - lane * k;   // this lane's bottom and top
      // chicanes in this lane: stubs hanging from its top or standing on its bottom, between its entry and its exit
      const stubs = Math.min(3, Math.floor(r() * (1.5 + 0.35 * d)) + (k > 1 || d >= 2 ? 1 : 0));
      const xs = [];
      for (let j = 0; j < stubs; j++) {
        const x = gap + 0.6 + r() * (W0 - 2 * gap - 1.2);   // clear of the gaps at either end
        if (xs.some(o => Math.abs(o - x) < 1.6)) continue;
        xs.push(x);
        const fromTop = r() < 0.5, len = Math.min(lane * (0.45 + 0.12 * Math.min(d, 4) / 4), lane - 1.25);   // leave a gap the path-finder (and the marble) gets through
        walls.push(fromTop ? [x, yt, x, yt + len] : [x, yb, x, yb - len]);
      }
      // a gust across this lane: blowing the way you go, or right against you
      if (k > 1 || d >= 2) { const len = 2.2 + r() * 1.6, x0 = 1 + r() * (W0 - 2 - len), dir = r() < 0.5 ? -1 : 1; winds.push([x0, yt + 0.12, len, yb - yt - 0.24, dir * (2.2 + 0.5 * d) * TUNE.wind, 0]); }
      if (k > n) break;
      walls.push(side > 0 ? [0, yt, W0 - gap, yt] : [gap, yt, W0, yt]);
      chokes.push(side > 0 ? [W0 - gap + 0.07, yt, W0, yt] : [0, yt, gap - 0.07, yt]);
      side = -side;
    }
    const goal = [side > 0 ? W0 - 1.4 : 1.4, lane / 2];
    return { walls, winds, start, goal, chokes };
  },
  water(d, r) {
    // a river coiled in a spiral, lanes 2 cells apart: round and round toward the middle (or out of it),
    // the current turning against you and with you; it pinches at the checkpoints
    const hw0 = 0.88 - 0.02 * d, mir = r() < 0.5, out = r() < 0.4;
    let wp = [[1, 13], [1, 1], [7, 1], [7, 12], [3, 12]];
    wp = d <= 2 ? wp.concat([[3, 4.6]]) : wp.concat([[3, 3], [5, 3], [5, 10.1]]);
    if (mir) wp = wp.map(([x, y]) => [W0 - x, y]);
    let pts = filletPath(wp, 1.0, 0.25);
    if (out) pts = pts.reverse();
    const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const len = cum[cum.length - 1], pinchS = (d <= 2 ? [0.48] : [0.36, 0.7]).map(f => f * len);
    const hws = cum.map(sv => hw0 * (1 - 0.3 * pinchS.reduce((m, ps) => Math.max(m, Math.exp(-(((sv - ps) / 0.6) ** 2))), 0)));
    const nrm = k => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; };
    const left = pts.map((q, k) => { const [nx, ny] = nrm(k); return [q[0] - nx * hws[k], q[1] - ny * hws[k]]; });
    const right = pts.map((q, k) => { const [nx, ny] = nrm(k); return [q[0] + nx * hws[k], q[1] + ny * hws[k]]; });
    const nz = 4 + (d >= 3) + (d >= 5), zones = [], f = (2.2 + 0.4 * d) * TUNE.flow;
    let dir = r() < 0.5 ? -1 : 1;
    for (let z = 0; z < nz; z++) { zones.push([z / nz, z === nz - 1 ? 1.01 : (z + 1) / nz, dir, f * (dir < 0 ? 1 : 0.8)]); dir = -dir; }
    const chokes = pinchS.map(ps => { const k = cum.findIndex(c => c >= ps); return [left[k][0], left[k][1], right[k][0], right[k][1]].map((v, i) => v + (i < 2 ? 1 : -1) * 0.07 * (i % 2 ? (right[k][1] - left[k][1]) : (right[k][0] - left[k][0])) / (2 * hws[k])); });
    const at = sv => { const k = Math.max(0, Math.min(pts.length - 1, cum.findIndex(c => c >= sv))); return pts[k]; };
    const ends = [[left[0], right[0]], [left[left.length - 1], right[right.length - 1]]].map(([a, b2]) => [a[0], a[1], b2[0], b2[1]]);
    return { river: { pts, hws, zones, left, right }, walls: ends, start: at(0.7), goal: at(len - 0.8), chokes, minGap: 0.75 };
  },
  galaxy(d, r, sp, df) {
    // an open field cut by energy barriers with one gap each (the checkpoints); black holes sit across the way between gaps
    const start = [r() < 0.5 ? 1.4 + r() * 1.2 : 5.4 + r() * 1.2, 12.2], goal = [start[0] < 4 ? 5.6 + r() * 1.1 : 1.2 + r() * 1.1, 1.1];
    const fr = d <= 2 ? [0.3, 0.64] : [0.2, 0.5, 0.8], walls = [], polys = [], bars = [], chokes = [], wells = [], rings = [], rocks = [];
    let gside = start[0] < 4 ? 1 : -1;
    const gaps = [start];
    for (const f of fr) {
      const y = start[1] + (goal[1] - start[1]) * f, gx = gside > 0 ? 5.3 + r() * 1.4 : 1.3 + r() * 1.4, gw = 1.6 - 0.04 * d; gside = -gside;
      // a curving energy barrier, not a ruler line: a slow wave through the field
      const A = 0.28 + r() * 0.12, k = TAU / (3.6 + r() * 1.6), ph = r() * TAU, yb = x => y + A * Math.sin(k * x + ph);
      bars.push(yb);
      const piece = (x0, x1) => { const n = Math.max(2, Math.ceil((x1 - x0) / 0.25)), out = []; for (let j = 0; j <= n; j++) { const x = x0 + (x1 - x0) * j / n; out.push([x, yb(x)]); } return out; };
      if (gx - gw / 2 > 0.05) polys.push(piece(0, gx - gw / 2));
      if (gx + gw / 2 < W0 - 0.05) polys.push(piece(gx + gw / 2, W0));
      chokes.push([gx - gw / 2 + 0.07, yb(gx - gw / 2 + 0.07), gx + gw / 2 - 0.07, yb(gx + gw / 2 - 0.07)]);
      gaps.push([gx, yb(gx)]);
    }
    gaps.push(goal);
    const nb = 2 + Math.floor(d / 2), barY = fr.map(f => start[1] + (goal[1] - start[1]) * f);
    for (let tries = 0; wells.length < nb && tries < 400; tries++) {
      const seg2 = Math.floor(r() * (gaps.length - 1)), a = gaps[seg2], b = gaps[seg2 + 1];
      const t = 0.3 + r() * 0.4, ux = b[0] - a[0], uy = b[1] - a[1], ul = Math.hypot(ux, uy) || 1, off = (r() < 0.5 ? -1 : 1) * (0.4 + r() * 1.1);
      const R = 1.3 + r() * 0.5, core = 0.34 + r() * 0.05, x = a[0] + ux * t - uy / ul * off, y = a[1] + uy * t + ux / ul * off;
      if (x < 1.0 || x > 7.0 || y < 2.0 || y > 11.0) continue;
      if (bars.some(b => Math.abs(b(x) - y) < core + 1.05)) continue;
      if (Math.hypot(x - start[0], y - start[1]) < R + 1.0 || Math.hypot(x - goal[0], y - goal[1]) < R + 1.0) continue;
      if (gaps.some(g => Math.hypot(g[0] - x, g[1] - y) < core + 1.1)) continue;
      if (wells.some(w => Math.hypot(w[0] - x, w[1] - y) < w[4] + core + 1.3)) continue;
      wells.push([x, y, R, TUNE.gPull * (0.85 + 0.05 * d), core + TUNE.gCore]);   // about as strong at every stage: harder means more of them
      if (d >= 2 && r() < 0.5 && bars.every(b => Math.abs(b(x) - y) > core + 0.8 + 0.85)) rings.push([x, y, core + 0.8, r() * TAU, 1.8]);
    }
    for (let k = 0; k < 0; k++) {   // (no asteroids here: they are placed along the road and round the holes, see placeHazards)
      const y = 2 + r() * 9, x0 = 0.5 + r() * 2, x1 = 5.5 + r() * 2;
      rocks.push({ line: r() < 0.5 ? [x0, y, x1, y + (r() - 0.5) * 2] : [x1, y, x0, y + (r() - 0.5) * 2], r: 0.25 + r() * 0.15, speed: (0.8 + r() * 0.5) * sp });
    }
    return { walls, polys, wells, rings, rocks, start, goal, chokes };
  },
  electric(d, r) {
    // a circuit board, laid out fresh each time: 3 or 4 columns; every divider is drawn in its own style
    // (sawtooth, castellated, a trace that jogs at 45°, or a comb of pins); the way crosses at alternate
    // ends; IC chips sit against the walls and narrow the columns
    const n = d >= 3 && r() < 0.55 ? 4 : 3, cw = W0 / n, amp = Math.min(0.16 + 0.04 * d, cw * 0.15), gap = 1.75 - 0.05 * d;
    const styles = ['saw', 'castle', 'trace', 'comb'].map(v => [r(), v]).sort((a2, b2) => a2[0] - b2[0]).map(o => o[1]);
    let polys = [], walls = [], chokes = [], chips = [];
    for (let k = 1; k < n; k++) {
      const x = k * cw, top = k % 2 === 1, y0 = top ? gap : 0, y1 = top ? H0 : H0 - gap, sty = styles[k - 1], step = 0.7 + r() * 0.45;
      const pts = [];
      if (sty === 'saw') for (let y = y0, j = 0; y < y1 + step / 2 - 1e-9; y += step / 2, j++) pts.push([x + (j % 2 ? amp : -amp), Math.min(y, y1)]);
      else if (sty === 'castle') for (let y = y0, j = 0; y < y1 - 1e-9; y += step / 2, j++) { const sx = x + (j % 2 ? amp : -amp); pts.push([sx, y], [sx, Math.min(y1, y + step / 2)]); }
      else if (sty === 'trace') {
        let cx = x, y = y0; pts.push([cx, y]);
        while (y < y1 - 1e-9) {
          y = Math.min(y1, y + 1.0 + r() * 1.6); pts.push([cx, y]);
          if (y < y1 - 1.2) { const jog = (cx > x + 0.01 ? -1 : cx < x - 0.01 ? 1 : (r() < 0.5 ? -1 : 1)) * amp * 1.6; cx += jog; y += Math.abs(jog); pts.push([cx, y]); }
        }
      } else {   // comb: a straight divider with pins sticking out either side
        pts.push([x, y0], [x, y1]);
        let side = r() < 0.5 ? 1 : -1;
        for (let y = y0 + 0.7; y < y1 - 0.5; y += step) { walls.push([x, y, x + side * Math.min(amp * 2.2, cw * 0.28), y]); side = -side; }
      }
      polys.push(pts);
      chokes.push(top ? [x, 0.07, x, gap - 0.07] : [x, H0 - gap + 0.07, x, H0 - 0.07]);
    }
    const start = [cw / 2, 12.3], goal = [(n - 0.5) * cw, (n - 1) % 2 === 1 ? 12.2 : 1.0];
    // chips: against the frame in the outer columns, or against a divider, keeping a way past ≥ 1.4 cells
    for (let c = 0; c < n; c++) {
      const want = (r() < 0.25 + 0.12 * d ? 1 : 0) + (d >= 4 && r() < 0.4 ? 1 : 0), ys = [];
      for (let j = 0, tries = 0; j < want && tries < 20; tries++) {
        const atFrame = c === 0 || c === n - 1, inner = cw - amp * (atFrame ? 1 : 2), w = Math.min(0.95, inner - 1.3); if (w < 0.4) break;
        const h = 1.0 + r() * 0.7, y = 2.4 + r() * (H0 - 4.8 - h);
        if (ys.some(o => Math.abs(o - y) < h + 1.5)) continue;
        const leftSide = c === 0 ? true : c === n - 1 ? false : r() < 0.5;
        const x = leftSide ? c * cw + (c === 0 ? 0.07 : amp + 0.1) : (c + 1) * cw - (c === n - 1 ? 0.07 : amp + 0.1) - w;
        chips.push([x, y, w, h]); ys.push(y); j++;
        walls.push([x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]);
      }
    }
    if (r() < 0.5) {   // mirrored
      const m = q => [W0 - q[0], q[1]];
      polys = polys.map(l => l.map(m)); walls = walls.map(w => [W0 - w[0], w[1], W0 - w[2], w[3]]); chokes = chokes.map(c2 => [W0 - c2[0], c2[1], W0 - c2[2], c2[3]]);
      chips = chips.map(([x, y, w, h]) => [W0 - x - w, y, w, h]);
      return { polys, walls, chips, start: m(start), goal: m(goal), chokes };
    }
    return { polys, walls, chips, start, goal, chokes };
  },
  fire(d, r) {
    const cols = 4, rows = 6, cw = W0 / cols, rh = H0 / rows, open = Array.from({ length: rows }, () => new Array(cols).fill(false)), cells = [];
    let c = Math.floor(r() * cols);
    const spans = [];
    for (let row = rows - 1; row >= 0; row--) {   // bottom to top: wander sideways, then up
      open[row][c] = true; cells.push([c, row]); let lo = c, hi = c;
      if (row > 0) { let t = Math.floor(r() * cols); if (t === c) t = c < 2 ? 3 - Math.floor(r() * 2) : Math.floor(r() * 2); const dir = Math.sign(t - c); while (c !== t) { c += dir; open[row][c] = true; cells.push([c, row]); } lo = Math.min(lo, c); hi = Math.max(hi, c); }
      spans.push([row, lo, hi, c]);
    }
    // a few extra open cells next to the way: shortcuts and loops, more than one way to go
    for (let j = 0; j < 1 + (d >= 3); j++) { const [cc, rr] = cells[1 + Math.floor(r() * (cells.length - 2))], nc = cc + (r() < 0.5 ? -1 : 1); if (nc >= 0 && nc < cols && rr > 0 && rr < rows - 1) open[rr][nc] = true; }
    const e = TUNE.lavaE0 + TUNE.lavaE1 * (d - 1) + TUNE.lavaBend[d - 1], voids = [];
    for (let row = 0; row < rows; row++) {
      let k = 0;
      while (k < cols) {
        if (open[row][k]) { k++; continue; }
        let j = k; while (j + 1 < cols && !open[row][j + 1]) j++;
        const x0 = k * cw - (k > 0 ? e : 0), x1 = (j + 1) * cw + (j < cols - 1 ? e : 0);
        voids.push([Math.max(0, x0), row * rh, Math.min(W0, x1) - Math.max(0, x0), rh]);
        k = j + 1;
      }
    }
    // between rows, a seam of lava wherever both sides are open but it isn't the way up: one bridge per row
    for (const [row, , , up] of spans) {
      if (row === 0) continue;
      let k = 0;
      while (k < cols) {
        if (k === up || !(open[row][k] && open[row - 1][k])) { k++; continue; }
        let j = k; while (j + 1 < cols && j + 1 !== up && open[row][j + 1] && open[row - 1][j + 1]) j++;
        const x0 = k === up + 1 ? k * cw - e : Math.max(0, k * cw - 0.05), x1 = j === up - 1 ? (j + 1) * cw + e : Math.min(W0, (j + 1) * cw + 0.05);   // eats into the bridge like everywhere else
        voids.push([x0, row * rh - 0.22, x1 - x0, 0.44]);
        k = j + 1;
      }
    }
    // chokes: row boundaries where only one column is open on both sides (a single bridge up)
    const chokes = [];
    for (let row = rows - 1; row > 0; row--) {
      const both = []; for (let k = 0; k < cols; k++) if (open[row][k] && open[row - 1][k] && k === spans.find(o => o[0] === row)[3]) both.push(k);
      if (both.length === 1) { const k = both[0], y = row * rh; chokes.push([k * cw + (k > 0 ? e : 0) + 0.05, y, (k + 1) * cw - (k < cols - 1 ? e : 0) - 0.05, y]); }
    }
    const first = cells[0], last = cells[cells.length - 1];
    // the plan is bent and melted into the real lava; start, goal and the bridges go where the bending took them
    const F = lavaField(voids, r, TUNE.lavaGrow[d - 1]), bent = [];
    for (const [x1, y1, x2] of chokes) {   // a line across each bridge, from shore to shore
      const m = F.moved([(x1 + x2) / 2, y1]), a = F.moved([(x1 + x2) / 2 - 0.2, y1]), b = F.moved([(x1 + x2) / 2 + 0.2, y1]), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ex = (b[0] - a[0]) / l, ey = (b[1] - a[1]) / l;
      if (lavaDist(F, m[0], m[1]) < 0.1) continue;
      const reach = sg => { let t = 0; while (t < 2.6) { const x = m[0] + ex * sg * (t + 0.04), y = m[1] + ey * sg * (t + 0.04); if (x < 0 || y < 0 || x > W0 || y > H0 || lavaDist(F, x, y) < 0.02) break; t += 0.04; } return t; };
      const ta = reach(-1), tb = reach(1); if (ta >= 2.6 || tb >= 2.6) continue;
      bent.push([m[0] - ex * ta, m[1] - ey * ta, m[0] + ex * tb, m[1] + ey * tb]);
    }
    // a volcano rises out of the deepest lava (the spot furthest from any shore) and lobs bombs: slow and mostly at random on the first stage, quicker and better aimed on each one after
    let volcano = null;
    {
      let best = 0.45, at = null;
      for (let j = 0; j < LAVA_NY; j += 2) for (let i = 0; i < LAVA_NX; i += 2) { const x = i * LAVA_ST, y = j * LAVA_ST, sc = Math.min(-F.d[j * LAVA_NX + i], Math.min(x, W0 - x, y, H0 - y) - 0.2); if (sc > best) { best = sc; at = [x, y]; } }
      if (at) volcano = [at[0], at[1], TUNE.volPeriod[d - 1], 1.35];
    }
    return { volcano, lava: F, voids: F.boxes, start: F.settle(F.moved([(first[0] + 0.5) * cw, H0 - 0.7]), 0.5), goal: F.settle(F.moved([(last[0] + 0.5) * cw, 0.9]), 0.62), chokes: bent };
  },
};

/* ---------- the volcano's lava: a field, not rectangles ---------- */
/**
 * The lava of a volcano course is one grid of signed distances to the shore (course units, a point every 0.05; below zero is lava).
 * The same grid says what kills, what the way-finder keeps clear of, and what is drawn, so the three can never disagree.
 */
const LAVA_ST = 0.05, LAVA_NX = Math.round(W0 / LAVA_ST) + 1, LAVA_NY = Math.round(H0 / LAVA_ST) + 1;
function lavaDist(F, x, y) {
  if (F.rot) { const t = x; x = W0 - y; y = t; }   // a board turned a quarter
  const fx = Math.max(0, Math.min(LAVA_NX - 1.001, x / LAVA_ST)), fy = Math.max(0, Math.min(LAVA_NY - 1.001, y / LAVA_ST)), i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, k = j * LAVA_NX + i, d = F.d;
  return (d[k] * (1 - u) + d[k + 1] * u) * (1 - v) + (d[k + LAVA_NX] * (1 - u) + d[k + LAVA_NX + 1] * u) * v;
}
/**
 * From the blocky plan (rectangles of lava on a grid of cells) to something a volcano would make: the whole plan is bent by slow
 * waves (rows sway up and down, columns lean left and right, so no lane runs straight), its corners are melted round, and the
 * shore is roughened. Bending keeps what connects to what, so the way through, its bridges and its loops are all still there.
 */
function lavaField(rects, r, grow) {
  const NX = LAVA_NX, NY = LAVA_NY, ST = LAVA_ST, n = NX * NY;
  const A1 = 0.4 + 0.1 * r(), L1 = 4.5 + 1.5 * r(), p1 = r() * TAU, q1 = r() * TAU, A2 = 0.32 + 0.1 * r(), L2 = 4.2 + 1.5 * r(), p2 = r() * TAU, q2 = r() * TAU;
  const p3 = r() * TAU, p4 = r() * TAU, p5 = r() * TAU, p6 = r() * TAU, n1 = r() * TAU, n2 = r() * TAU, n3 = r() * TAU, n4 = r() * TAU;
  const warp = (x, y) => [
    x + A2 * Math.sin(y * TAU / L2 + p2 + 0.6 * Math.sin(x * TAU / 7 + q2)) + 0.1 * Math.sin(y * TAU / 1.7 + p4 + Math.sin(x * TAU / 3.3 + p6)),
    y + A1 * Math.sin(x * TAU / L1 + p1 + 0.6 * Math.sin(y * TAU / 9 + q1)) + 0.1 * Math.sin(x * TAU / 1.9 + p3 + Math.sin(y * TAU / 3.7 + p5))];
  let c = new Float32Array(n), t = new Float32Array(n);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const w = warp(i * ST, j * ST), x = Math.max(0, Math.min(W0, w[0])), y = Math.max(0, Math.min(H0, w[1]));
    for (const v of rects) if (x >= v[0] - 0.01 && x <= v[0] + v[2] + 0.01 && y >= v[1] - 0.01 && y <= v[1] + v[3] + 0.01) { c[j * NX + i] = 1; break; }
  }
  for (let pass = 0; pass < 2; pass++) {   // melt the corners: blur, twice across and twice down
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { let a = 0; for (let o = -4; o <= 4; o++) a += c[j * NX + Math.max(0, Math.min(NX - 1, i + o))]; t[j * NX + i] = a / 9; }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { let a = 0; for (let o = -4; o <= 4; o++) a += t[Math.max(0, Math.min(NY - 1, j + o)) * NX + i]; c[j * NX + i] = a / 9; }
  }
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {   // lava where this ends up above zero: half covered, give or take a rough shore
    const x = i * ST, y = j * ST;
    c[j * NX + i] += -0.5 - grow * 2.2 + 0.12 * Math.sin(x * TAU / 0.9 + n1 + 1.3 * Math.sin(y * TAU / 1.3 + n2)) * Math.sin(y * TAU / 0.8 + n3 + 1.3 * Math.sin(x * TAU / 1.1 + n4)) + 0.05 * Math.sin(x * TAU / 0.41 + n2) * Math.sin(y * TAU / 0.37 + n1);
  }
  // distances: exact-ish right at the shore (value over slope), then spread outward
  const d = t.fill(1e3), at = (i, j) => c[Math.max(0, Math.min(NY - 1, j)) * NX + Math.max(0, Math.min(NX - 1, i))];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const k = j * NX + i, v = c[k], s = v > 0;
    if ((at(i - 1, j) > 0) !== s || (at(i + 1, j) > 0) !== s || (at(i, j - 1) > 0) !== s || (at(i, j + 1) > 0) !== s) { const gx = (at(i + 1, j) - at(i - 1, j)) / (2 * ST), gy = (at(i, j + 1) - at(i, j - 1)) / (2 * ST); d[k] = Math.min(ST * 1.5, Math.abs(v) / (Math.hypot(gx, gy) || 1e-6)); }
  }
  const D1 = ST, D2 = ST * 1.4142;
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i; let m = d[k]; if (i > 0) m = Math.min(m, d[k - 1] + D1); if (j > 0) { m = Math.min(m, d[k - NX] + D1); if (i > 0) m = Math.min(m, d[k - NX - 1] + D2); if (i < NX - 1) m = Math.min(m, d[k - NX + 1] + D2); } d[k] = m; }
  for (let j = NY - 1; j >= 0; j--) for (let i = NX - 1; i >= 0; i--) { const k = j * NX + i; let m = d[k]; if (i < NX - 1) m = Math.min(m, d[k + 1] + D1); if (j < NY - 1) { m = Math.min(m, d[k + NX] + D1); if (i < NX - 1) m = Math.min(m, d[k + NX + 1] + D2); if (i > 0) m = Math.min(m, d[k + NX - 1] + D2); } d[k] = m; }
  for (let k = 0; k < n; k++) if (c[k] > 0) d[k] = -d[k];
  const F = { d };
  // where a point of the plan ended up after the bending
  F.moved = q => { let p = [q[0], q[1]]; for (let it = 0; it < 10; it++) { const w = warp(p[0], p[1]); p = [p[0] + q[0] - w[0], p[1] + q[1] - w[1]]; } return p; };
  // the nearest spot to p with `need` of rock all round, off the frame
  F.settle = (p, need) => {
    const ok = (x, y) => x >= 0.55 && x <= W0 - 0.55 && y >= 0.55 && y <= H0 - 0.55 && lavaDist(F, x, y) >= need;
    if (ok(p[0], p[1])) return p;
    for (let rad = 0.1; rad < 2.4; rad += 0.1) for (let a = 0; a < 16; a++) { const x = p[0] + Math.cos(a * TAU / 16) * rad, y = p[1] + Math.sin(a * TAU / 16) * rad; if (ok(x, y)) return [x, y]; }
    return p;
  };
  // the pools: bounding boxes of each connected body of lava (for bubbles and the like; they are not what kills)
  const lab = new Uint8Array(n), stack = []; F.boxes = [];
  for (let k0 = 0; k0 < n; k0++) if (d[k0] < 0 && !lab[k0]) {
    const b = [1e9, 1e9, -1e9, -1e9]; lab[k0] = 1; stack.push(k0);
    while (stack.length) { const k = stack.pop(), i = k % NX, j = (k / NX) | 0; b[0] = Math.min(b[0], i); b[1] = Math.min(b[1], j); b[2] = Math.max(b[2], i); b[3] = Math.max(b[3], j);
      if (i > 0 && d[k - 1] < 0 && !lab[k - 1]) { lab[k - 1] = 1; stack.push(k - 1); } if (i < NX - 1 && d[k + 1] < 0 && !lab[k + 1]) { lab[k + 1] = 1; stack.push(k + 1); }
      if (j > 0 && d[k - NX] < 0 && !lab[k - NX]) { lab[k - NX] = 1; stack.push(k - NX); } if (j < NY - 1 && d[k + NX] < 0 && !lab[k + NX]) { lab[k + NX] = 1; stack.push(k + NX); } }
    if (b[2] - b[0] >= 4 && b[3] - b[1] >= 4) F.boxes.push([b[0] * ST, b[1] * ST, (b[2] - b[0]) * ST, (b[3] - b[1]) * ST]);
  }
  return F;
}

/* ---------- what stands in the way of the marble (for the path-finder and for measuring the way) ---------- */
function courseWalls(C) {
  if (C._walls) return C._walls;
  const ws = (C.walls || []).map(([a, b, c2, d]) => seg(a, b, c2, d));
  for (const line of C.polys || []) for (let k = 0; k + 1 < line.length; k++) ws.push(seg(line[k][0], line[k][1], line[k + 1][0], line[k + 1][1]));
  if (C.river) for (const bank of [C.river.left, C.river.right]) for (let k = 0; k + 1 < bank.length; k++) ws.push(seg(bank[k][0], bank[k][1], bank[k + 1][0], bank[k + 1][1]));
  for (const [cx, cy, rr, g, gw] of C.rings || []) { const a0 = g + gw / 2; ws.push(arc(cx, cy, rr, a0, a0 + TAU - gw)); }
  for (const x of C._extra || []) ws.push(seg(...x));
  ws.push(seg(0, 0, W0, 0), seg(W0, 0, W0, H0), seg(W0, H0, 0, H0), seg(0, H0, 0, 0));
  return (C._walls = ws);
}
/**
 * How far (x, y) is from the nearest wall. A river has hundreds of bank pieces and the lay-out asks this hundreds of thousands
 * of times, so the walls are sorted once into one-cell bins, each holding every wall that comes within a cell of it: a point
 * less than a cell from a wall (nearly all of them) only looks at its own bin. Same answer as checking every wall.
 */
function wallRoom(ws, x, y) {
  let m = Infinity;
  if (ws.length > 40 && x >= 0 && y >= 0 && x <= W0 && y <= H0) {
    const nbx = Math.ceil(W0) + 1;
    if (!ws.bins) {
      const nby = Math.ceil(H0) + 1; ws.bins = Array.from({ length: nbx * nby }, () => []);
      for (const w of ws) { const b = boxOf(w); for (let j = Math.max(0, Math.floor(b[1] - 1)); j <= Math.min(nby - 1, Math.floor(b[3] + 1)); j++) for (let i = Math.max(0, Math.floor(b[0] - 1)); i <= Math.min(nbx - 1, Math.floor(b[2] + 1)); i++) ws.bins[j * nbx + i].push(w); }
    }
    for (const w of ws.bins[Math.floor(y) * nbx + Math.floor(x)]) { const q = nearest(w, x, y), d = Math.hypot(x - q[0], y - q[1]); if (d < m) m = d; }
    if (m <= 1) return m - WALL_T / 2;
  }
  m = Infinity;
  for (const w of ws) { const q = nearest(w, x, y), d = Math.hypot(x - q[0], y - q[1]); if (d < m) m = d; }
  return m - WALL_T / 2;
}
/** How far (x, y) is from the nearest thing that stops or kills a still marble. */
function clearance(C, x, y) {
  let m = Infinity;
  m = wallRoom(courseWalls(C), x, y);
  for (const h of C.holes || []) m = Math.min(m, Math.hypot(x - h[0], y - h[1]) - h[2]);
  for (const w of C.wells || []) m = Math.min(m, Math.hypot(x - w[0], y - w[1]) - (C.theme === 'water' ? w[4] * 0.8 + 0.12 : w[4] + 0.35));   // an eddy by the bank swallows only at its eye
  for (const b of C.bumpers || []) m = Math.min(m, Math.hypot(x - b[0], y - b[1]) - b[2]);
  for (const b of C.islands || []) m = Math.min(m, Math.hypot(x - b[0], y - b[1]) - b[2]);
  for (const w of C.sweeps || []) m = Math.min(m, Math.hypot(x - w[0], y - w[1]) - (w[7] ? w[4] - 0.9 : w[4]));   // the safe way hugs the far wall (a full blade still sweeps it now and then)
  for (const f of C.falls || []) m = Math.min(m, segDist(x, y, f[0], f[1], f[2], f[3]) - f[4]);
  if (C.lava) m = Math.min(m, lavaDist(C.lava, x, y));
  return m;
}
/** A* over a quarter-cell grid, preferring the middle of the way: the corners of the way from a to b, or null. */
function findRoute(C, a, b) {
  const S2 = 0.25, nx = Math.round(W0 / S2) + 1, ny = Math.round(H0 / S2) + 1, need = BALL_R + 0.08;
  const room = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) room[j * nx + i] = clearance(C, i * S2, j * S2);
  const idx = (x, y) => Math.round(y / S2) * nx + Math.round(x / S2), s0 = idx(a[0], a[1]), g0 = idx(b[0], b[1]);
  room[s0] = Math.max(room[s0], need + 0.01); room[g0] = Math.max(room[g0], need + 0.01);
  const gScore = new Float32Array(nx * ny).fill(Infinity), prev = new Int32Array(nx * ny).fill(-1), done = new Uint8Array(nx * ny);
  gScore[s0] = 0;
  const h = k => Math.hypot((k % nx) - (g0 % nx), ((k / nx) | 0) - ((g0 / nx) | 0));
  const heap = [[h(s0), s0]];
  const push = it => { heap.push(it); let i = heap.length - 1; while (i) { const q = (i - 1) >> 1; if (heap[q][0] <= heap[i][0]) break; [heap[q], heap[i]] = [heap[i], heap[q]]; i = q; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r2 = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r2 < heap.length && heap[r2][0] < heap[m][0]) m = r2; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  while (heap.length) {
    const [, cur] = pop();
    if (done[cur]) continue; done[cur] = 1;
    if (cur === g0) break;
    const ci = cur % nx, cj = (cur / nx) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= nx || nj >= ny) continue;
      const nk = nj * nx + ni; if (room[nk] <= need) continue;
      const g = gScore[cur] + (di && dj ? 1.414 : 1) * (1 + 0.8 * Math.max(0, 1.1 - room[nk]));   // a little dearer close to walls: keeps to the middle
      if (g < gScore[nk]) { gScore[nk] = g; prev[nk] = cur; push([g + h(nk), nk]); }
    }
  }
  if (prev[g0] < 0 && g0 !== s0) return null;
  const path = []; for (let k = g0; k >= 0; k = prev[k]) path.push([(k % nx) * S2, ((k / nx) | 0) * S2]);
  path.reverse();
  // keep only the corners: from each point, jump to the farthest one still in clear sight
  const sees = (p, q) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.ceil(l / 0.1); for (let k = 1; k < n; k++) if (clearance(C, p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n) <= need - 0.005) return false; return true; };
  const out = [a]; let i = 0;
  while (i < path.length - 1) { let j = path.length - 1; while (j > i + 1 && !sees(path[i], path[j])) j--; out.push(path[j]); i = j; }
  out[out.length - 1] = b;
  return out;
}
/** True when there is no way from start to goal with segment s closed off: that checkpoint can't be dodged. */
function unavoidable(C, s) {
  C._extra = [s]; C._walls = null;
  const ok = !findRoute(C, C.start, C.goal);
  C._extra = null; C._walls = null;
  return ok;
}
/** The way resampled every 0.25 cells: points with their direction and the free room either side. */
function wayPoints(C) {
  const pts = [], R = C.route;
  for (let k = 0; k + 1 < R.length; k++) {
    const [x1, y1] = R[k], [x2, y2] = R[k + 1], l = Math.hypot(x2 - x1, y2 - y1) || 1e-6, n = Math.max(1, Math.ceil(l / 0.25));
    for (let j = 0; j < n; j++) pts.push({ x: x1 + (x2 - x1) * j / n, y: y1 + (y2 - y1) * j / n, tx: (x2 - x1) / l, ty: (y2 - y1) / l });
  }
  let s = 0; pts.forEach((p, k) => { if (k) s += Math.hypot(p.x - pts[k - 1].x, p.y - pts[k - 1].y); p.s = s; });
  const room = (p, sgn) => { const nx = -p.ty * sgn, ny = p.tx * sgn; let t = 0; while (t < 4 && clearance(C, p.x + nx * t, p.y + ny * t) > 0.02) t += 0.05; return t; };
  for (const p of pts) { p.nx = -p.ty; p.ny = p.tx; p.wPos = room(p, 1); p.wNeg = room(p, -1); }
  return pts;
}

/* ---------- hazards: a catalogue per world, bought from the budget ---------- */
/** Static things must keep this far from every point of the way (not just the point they were placed at). */
const offWay = (C, x, y, need) => C._way.every(q => Math.hypot(q.x - x, q.y - y) >= need);
const nearLava = (C, x, y, m) => !!C.lava && lavaDist(C.lava, x, y) < m;
/** After adding something the safe way must squeeze past, check the way is still open; if not, take it back. */
function keepsWay(C, list) { if (findRoute(C, C.start, C.goal)) return true; C[list].pop(); return false; }
const HAZ = {
  bumper: { cost: 0.75, place(C, p, r) {   // anywhere across the road, as long as one side keeps a marble-wide gap
    const rr = 0.3 + r() * 0.08, lo = -(p.wNeg - rr - 0.12), hi = p.wPos - rr - 0.12; if (hi - lo < 0.2) return false;
    const o = lo + r() * (hi - lo), gapPos = p.wPos - (o + rr), gapNeg = p.wNeg - (rr - o);
    if (Math.max(gapPos, gapNeg) < (C.minGap || 0.95)) return false;
    const x = p.x + p.nx * o, y = p.y + p.ny * o;
    if (nearLava(C, x, y, 1.2)) return false;   // a kick must never throw you straight into lava
    if ((C.holes || []).concat(C.wells || []).some(h => Math.hypot(h[0] - x, h[1] - y) < rr + (h[4] || h[2]) + 0.7)) return false;
    if ((C.bumpers || []).some(b => Math.hypot(b[0] - x, b[1] - y) < b[2] + rr + 0.9)) return false;
    (C.bumpers = C.bumpers || []).push([x, y, rr]); return true; } },
  hole: { cost: 1.5, place(C, p, r) {
    const s = r() < 0.5 ? 1 : -1, w = s > 0 ? p.wPos : p.wNeg; if (w < 1.35) return false;
    const o = w - 0.45, x = p.x + p.nx * s * o, y = p.y + p.ny * s * o;
    if (!offWay(C, x, y, 0.34 + 0.55) || (C.bumpers || []).concat(C.holes || []).some(b => Math.hypot(b[0] - x, b[1] - y) < b[2] + 1.0)) return false; (C.holes = C.holes || []).push([x, y, TUNE.holeR]); return true; } },
  spinner: { cost: 2, place(C, p, r, df) {
    const w = Math.min(p.wPos, p.wNeg); if (w < 0.95) return false;
    (C.spinners = C.spinners || []).push([p.x, p.y, Math.min(w - 0.3, 1.1), (r() < 0.5 ? -1 : 1) * (1.1 + r() * 0.6) * df.sp]); return true; } },
  piston: { cost: 2, place(C, p, r, df) {
    const W = p.wPos + p.wNeg; if (W < 2.0 || W > 4.5) return false;
    const L2 = W * 0.45, ax = p.x + p.nx * (p.wPos - 0.1), ay = p.y + p.ny * (p.wPos - 0.1);
    (C.sliders = C.sliders || []).push([ax, ay, ax - p.nx * L2, ay - p.ny * L2, -p.nx * (W - L2 - 0.2), -p.ny * (W - L2 - 0.2), 2.6 / df.sp, r()]); return true; } },
  spark: { cost: 2.5, place(C, p, r, df) {   // crosses the way, never runs along it
    if (p.wPos + p.wNeg < 1.6) return false;
    const a = [p.x - p.nx * (p.wNeg - 0.25), p.y - p.ny * (p.wNeg - 0.25)], b = [p.x + p.nx * (p.wPos - 0.25), p.y + p.ny * (p.wPos - 0.25)];
    (C.sparks = C.sparks || []).push({ line: r() < 0.5 ? [...a, ...b] : [...b, ...a], speed: (0.95 + r() * 0.35) * df.sp * TUNE.sparkSpeed }); return true; } },
  beam: { cost: 3, place(C, p, r, df) {   // wall to wall across the way, on and off
    if (p.wPos + p.wNeg < 1.2 || p.wPos + p.wNeg > 4.4) return false;
    (C.lasers = C.lasers || []).push([p.x - p.nx * (p.wNeg - 0.02), p.y - p.ny * (p.wNeg - 0.02), p.x + p.nx * (p.wPos - 0.02), p.y + p.ny * (p.wPos - 0.02), df.beamPeriod, df.beamOn, r()]); return true; } },
  drift: { cost: 1.5, place(C, p, r, df) {   // a drifting rock (asteroid, lily pad, basalt boulder) crossing the way
    if (p.wPos + p.wNeg < 1.4 || (C.rocks || []).filter(k => k.hz).length >= 1 + Math.ceil(C._d / 2)) return false;
    const a = [p.x - p.nx * (p.wNeg - 0.4), p.y - p.ny * (p.wNeg - 0.4)], b = [p.x + p.nx * (p.wPos - 0.4), p.y + p.ny * (p.wPos - 0.4)];
    (C.rocks = C.rocks || []).push({ hz: 1, line: r() < 0.5 ? [...a, ...b] : [...b, ...a], r: 0.3 + r() * 0.14, speed: (0.9 + r() * 0.4) * df.sp }); return true; } },
  well: { cost: 2.5, place(C, p, r, df, th) {   // a black hole or whirlpool beside the way
    const s = p.wPos > p.wNeg ? 1 : -1, w = s > 0 ? p.wPos : p.wNeg, core = th === 'water' ? 0.28 : 0.34;
    if (w < (th === 'water' ? 1.05 : 1.35)) return false;
    const o = Math.min(w - (th === 'water' ? 0.3 : 0.45), th === 'water' ? 1.0 : 1.6), R = o + 0.45, x = p.x + p.nx * s * o, y = p.y + p.ny * s * o;
    if (!offWay(C, x, y, core + 0.55)) return false; (C.wells = C.wells || []).push([x, y, R, (th === 'water' ? 5 : 8) * df.pull, core]); return true; } },
  fall: { cost: 1.5, place(C, p, r) {   // a waterfall: the bank breaks and the river pours over into the stretch beside it, further back
    if (p.s < 7 || p.wPos + p.wNeg < 1.3) return false;
    for (const s of (r() < 0.5 ? [1, -1] : [-1, 1])) {
      const w = s > 0 ? p.wPos : p.wNeg, lx = p.x + p.nx * s * (w + 1.2), ly = p.y + p.ny * s * (w + 1.2);
      let best = null; for (const q of C._way) { const d = Math.hypot(q.x - lx, q.y - ly); if (!best || d < best.d) best = { q, d }; }
      if (!best || best.d > 0.7 || best.q.s > p.s - 4) continue;   // only into a part of the river you have already passed
      const o = w - 0.3, cx = p.x + p.nx * s * o, cy = p.y + p.ny * s * o;
      if ((C.wells || []).concat(C.falls || []).some(q => Math.hypot(q[0] - cx, q[1] - cy) < 2.5)) continue;
      (C.falls = C.falls || []).push([cx - p.tx * 0.55, cy - p.ty * 0.55, cx + p.tx * 0.55, cy + p.ty * 0.55, 0.3, best.q.x, best.q.y]);
      return keepsWay(C, 'falls');
    }
    return false; } },
  eddy: { cost: 2, place(C, p, r, df) {   // a whirlpool hugging one bank of a narrow river: squeeze past on the far side
    const s = r() < 0.5 ? 1 : -1, w = s > 0 ? p.wPos : p.wNeg; if (p.wPos + p.wNeg < 1.3) return false;
    const o = w - 0.25, x = p.x + p.nx * s * o, y = p.y + p.ny * s * o;
    if ((C.wells || []).some(q => Math.hypot(q[0] - x, q[1] - y) < 2.2)) return false;
    (C.wells = C.wells || []).push([x, y, 1.35, TUNE.eddyPull * (0.85 + 0.05 * C._d), 0.3]); return keepsWay(C, 'wells'); } },
  sweep: { cost: 2, place(C, p, r, df) {   // a neon blade swinging out from a wall, back and forth across the way; touch it and it zaps you
    const s = r() < 0.5 ? 1 : -1, W = p.wPos + p.wNeg; if (W < 1.5 || W > 3.4) return false;
    const w = s > 0 ? p.wPos : p.wNeg, px = p.x + p.nx * s * (w + 0.02), py = p.y + p.ny * s * (w + 0.02), full = C._d >= 3 && r() < TUNE.bladeFull * C._d, L = full ? W - 0.15 : W - 1.0;   // from d3, half the blades reach right across: no wall to hug, time it
    if (!C._way.every(q => Math.abs(q.s - p.s) < L + 0.8 || Math.hypot(q.x - px, q.y - py) > L + 0.6 || (q.x - px) * p.nx * s + (q.y - py) * p.ny * s > 0)) return false;   // (or behind its wall)   // its sweep only covers this stretch of the way
    if ((C.sweeps || []).some(q => Math.hypot(q[0] - px, q[1] - py) < 2.6)) return false;
    if ([C.start, ...C.checks.map(c => [c[4], c[5]])].some(q => Math.hypot(q[0] - px, q[1] - py) < L + 0.35)) return false;   // never reaching where you start or respawn
    (C.sweeps = C.sweeps || []).push([px, py, -p.nx * s, -p.ny * s, L, (full ? 1.3 + r() * 0.4 : 1.8 + r() * 0.7) * df.sp * TUNE.bladeSpeed, r() * TAU, full]);   // full blades swing slower: longer windows to slip past
    return keepsWay(C, 'sweeps'); } },
  orbiter: { cost: 1, place(C, p, r, df) {   // an asteroid circling a black hole near this point
    const w = (C.wells || []).find(q => Math.hypot(q[0] - p.x, q[1] - p.y) < q[2] + 1.2); if (!w) return false;
    if ((C.rocks || []).filter(k => k.orbit).length >= (C._d >= 4 ? 2 : 1)) return false;   // one on a course, two from difficulty 4
    if ((C.rocks || []).filter(k => k.orbit && k.orbit[0] === w[0]).length >= (df.sp > 1.05 ? 2 : 1)) return false;   // one asteroid per black hole (two at the hardest)
    (C.rocks = C.rocks || []).push({ orbit: [w[0], w[1], Math.min(w[2] * 0.85, 1.6)], r: 0.2 + r() * 0.08, speed: (r() < 0.5 ? -1 : 1) * (0.9 + r() * 0.5) * df.sp }); return true; } },
};
/** Which hazards each world uses, and from which difficulty (bumpers also come free along the road, see below). */
/**
 * Each world has ONE kind of bumper (balloons, leaves, moons, a capacitor, basalt studs: placed for free along
 * the road, see placeHazards) and at most TWO kinds of hard things, bought from the budget here. The world's own
 * structure adds the rest: wind in the sky, the current, black holes, the circuit, lava and the volcano.
 */
const CATALOG = {
  neon: [['hole', 1], ['sweep', 1]],
  water: [['eddy', 1], ['fall', 1]],
  galaxy: [['orbiter', 2]],   // only asteroids and black holes in space: from difficulty 2, an asteroid circles a hole
  electric: [['spark', 1], ['beam', 2]],
  fire: [],
};
/** How many of each hard thing a course may have at difficulty d. */
const HAZ_CAP = { hole: d => 1 + Math.floor(d / 2), sweep: d => 1 + Math.floor(d / 2), eddy: d => 1 + Math.floor(d / 2), fall: d => 1 + Math.floor(d / 3), spark: d => (d >= 5 ? 2 : 1), beam: d => (d >= 4 ? 2 : 1) };   // electric: 1, 2, 2, 3, 4 zappers at d1…d5
const HAZ_LIST = { hole: 'holes', sweep: 'sweeps', eddy: 'wells', fall: 'falls', spark: 'sparks', beam: 'lasers' };
const capped = (C, k, d) => HAZ_CAP[k] && (C[HAZ_LIST[k]] || []).length >= HAZ_CAP[k](d);
/**
 * Where something lethal may go: at least 2.8 cells from the start, on a straight stretch (the way turns
 * less than ~20° within a cell either side), and its line across must not touch the way anywhere else.
 */
function lethalOk(pts, p, L) {
  if (p.s < 2.8 || p.s > L - 2.2) return false;
  const a = pts.find(q => q.s >= p.s - 1) || pts[0], b = pts.find(q => q.s >= p.s + 1) || pts[pts.length - 1];
  if (a.tx * b.tx + a.ty * b.ty < 0.94) return false;
  const x1 = p.x - p.nx * p.wNeg, y1 = p.y - p.ny * p.wNeg, x2 = p.x + p.nx * p.wPos, y2 = p.y + p.ny * p.wPos;
  return pts.every(q => Math.abs(q.s - p.s) < 1.2 || segDist(q.x, q.y, x1, y1, x2, y2) > 0.9);
}
/** Where the way crosses segment c, as a distance along it (or -1). */
function crossingS(pts, c) {
  for (let k = 0; k + 1 < pts.length; k++) {
    const p = pts[k], q = pts[k + 1], d1 = (c[2] - c[0]) * (p.y - c[1]) - (c[3] - c[1]) * (p.x - c[0]), d2 = (c[2] - c[0]) * (q.y - c[1]) - (c[3] - c[1]) * (q.x - c[0]);
    if (d1 * d2 <= 0 && segDist((p.x + q.x) / 2, (p.y + q.y) / 2, c[0], c[1], c[2], c[3]) < 0.4) return k;
  }
  return -1;
}
function placeHazards(C, th, d, r, df) {
  const pts = wayPoints(C), L = pts[pts.length - 1].s;
  C._way = pts; C._d = d;
  // checkpoints: chokes the way can't avoid, picked near the wanted shares of the way; respawn just past them
  const want = d <= 2 ? [0.48] : [0.36, 0.7], cands = (C.chokes || []).map(c => ({ c, k: crossingS(pts, c) })).filter(o => o.k >= 0 && unavoidable(C, o.c));
  C.checks = [];
  const usedC = new Set();
  for (const f of want) {
    let best = null;
    for (const o of cands) { if (usedC.has(o)) continue; const sf = pts[o.k].s / L, score = Math.abs(sf - f); if (sf > 0.15 && sf < 0.9 && (!best || score < best.score)) best = { o, score }; }
    if (!best) continue;
    usedC.add(best.o);
    const q = pts[Math.min(pts.length - 1, best.o.k + 3)];
    C.checks.push([...best.o.c, q.x, q.y, pts[best.o.k].s]);
  }
  const slots = [];
  for (let s = 1.6; s < L - 1.4; s += 1.0) if (!C.checks.some(c => Math.abs(s - c[6]) < 0.8)) slots.push(s);
  const used = new Set(), hard = new Set(), cat = CATALOG[th].filter(([, lv]) => lv <= d).map(([k]) => k);
  let budget = df.budget;
  const order = slots.map((s, i) => [r(), i]).sort((a, b) => a[0] - b[0]).map(o => o[1]);
  // every neon course gets its blade and every river its eddy, from the first stage: the world's signature
  const sigs = { neon: Array(1 + Math.floor((d - 1) / 2)).fill('sweep'), water: ['eddy', 'fall'] }[th] || [];
  // the world's signature pieces first, searched for all along the way (not just on the slots)
  const sigAt = [];
  for (const sig of sigs) {
    const cand = pts.filter(p => (sig === 'sweep' ? p.s >= 2.8 && p.s <= L - 2.2 : lethalOk(pts, p, L)) && sigAt.every(s0 => Math.abs(s0 - p.s) > 2.2)).map(p => [r(), p]).sort((a2, b2) => a2[0] - b2[0]).map(o => o[1]);
    for (const p of cand) if (HAZ[sig].place(C, p, r, df, th)) { budget -= HAZ[sig].cost; sigAt.push(p.s); const i = slots.findIndex(x => Math.abs(x - p.s) < 0.5); if (i >= 0) { used.add(i); hard.add(i); } break; }
  }
  // two passes over the slots; a hard piece (cost 2 or more) never sits in the slot next to another hard one
  for (let pass = 0; pass < 2; pass++) for (const i of order) {
    if (budget < 0.75 || !cat.length) break;
    if (used.has(i)) continue;
    const nearHard = hard.has(i - 1) || hard.has(i + 1), nearAny = used.has(i - 1) || used.has(i + 1);
    if (pass === 0 && nearAny) continue;
    const p = pts.find(q => q.s >= slots[i]) || pts[pts.length - 1];
    const tries = cat.slice().sort(() => r() - 0.5);
    for (const k of tries) {
      if (HAZ[k].cost > budget || (HAZ[k].cost >= 2 && nearHard) || capped(C, k, d)) continue;
      if ((k === 'spark' || k === 'beam' || k === 'eddy' || k === 'fall') && !lethalOk(pts, p, L)) continue;
      if (k === 'sweep' && (p.s < 2.8 || p.s > L - 2.2)) continue;   // a blade checks its own reach instead
      if (HAZ[k].place(C, p, r, df, th)) { budget -= HAZ[k].cost; used.add(i); if (HAZ[k].cost >= 2) hard.add(i); break; }
    }
  }
  // bumpers along the road, free: 2 + d of them, in slots not taken (they help as much as they hinder)
  let extra = { neon: 2 + Math.ceil(d / 2), water: 1 + Math.floor(d / 2), galaxy: 1 + Math.floor(d / 2), electric: 1, fire: 0 }[th];   // the world's one kind of bumper
  const bumpKind = th === 'galaxy' ? 'drift' : 'bumper';   // in space the bumpers are asteroids drifting across the way
  for (const i of order) { if (extra <= 0) break; if (used.has(i)) continue; const p = pts.find(q => q.s >= slots[i] + 0.7) || pts[pts.length - 1]; if (HAZ[bumpKind].place(C, p, r, df)) { extra--; used.add(i); } }
  // (no turning gate any more: at most two hard things per world)
}
/** Build stage content for world `ti` at difficulty d from the run's seed; rebuilt with the next seed until it holds together. */
const courseCache = new Map();
function generateCourse(ti, d, seed) {
  const key = `${seed}|${ti}|${d}`;
  if (courseCache.has(key)) return courseCache.get(key);
  const th = THEME_KEYS[ti], df = DIFF(d);
  let C = null, good = null;
  for (let tries = 0; tries < 60; tries++) {
    if (tries >= 30 && good) break;
    const r = rngFrom((seed * 7919 + ti * 131 + d * 17 + tries * 104729) >>> 0);
    C = Object.assign({ theme: th }, THEME_STYLE[th], STRUCTURES[th](d, r, df.sp, df));
    C.route = findRoute(C, C.start, C.goal);
    if (!C.route) { C._fail = 'noway'; continue; }
    placeHazards(C, th, d, r, df);
    if (C.route) good = good || C;
    if (C.checks.length < (d <= 2 ? 1 : 2)) { C._fail = 'checks'; continue; }   // every checkpoint must be a real choke
    C._walls = null;
    let safe = findRoute(C, C.start, C.goal);
    while (!safe && (C.bumpers || []).length) { C.bumpers.pop(); safe = findRoute(C, C.start, C.goal); }   // bumpers never close the way
    while (!safe && th === 'water' && (C.wells || []).length) { C.wells.pop(); C._walls = null; safe = findRoute(C, C.start, C.goal); }   // nor do eddies
    if (safe) { C.route = safe; C._tries = tries; break; }
    C._fail = 'blocked';
  }
  if (C._tries === undefined && good) {
    C = good; C._walls = null; let safe = findRoute(C, C.start, C.goal);
    for (const k of ['bumpers', 'wells', 'holes']) while (!safe && (C[k] || []).length) { C[k].pop(); C._walls = null; safe = findRoute(C, C.start, C.goal); }
    C.route = safe || C.route;
  }
  courseCache.set(key, C);
  return C;
}


const STAGES = [0, 1, 2, 3, 4];
let RUN_SEED = 1;


/** A wall: a straight piece `s` (x1, y1 → x2, y2) or an arc `a` (around cx, cy, radius r, from a0 to a1 > a0). */
const seg = (x1, y1, x2, y2) => ({ t: 's', x1, y1, x2, y2 });
const arc = (cx, cy, r, a0, a1) => ({ t: 'a', cx, cy, r, a0, a1 });
/** Its bounding box, for the quick test before the real one. */
function boxOf(w) {
  if (w.t === 's') return [Math.min(w.x1, w.x2), Math.min(w.y1, w.y2), Math.max(w.x1, w.x2), Math.max(w.y1, w.y2)];
  const pts = [w.a0, w.a1];
  for (let k = Math.ceil(w.a0 / (Math.PI / 2)); k * Math.PI / 2 <= w.a1; k++) pts.push(k * Math.PI / 2);
  const xs = pts.map(a => w.cx + w.r * Math.cos(a)), ys = pts.map(a => w.cy + w.r * Math.sin(a));
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/**
 * Stage `i` ready to play on a board `aspect` tall per wide: on a landscape board the course is turned
 * a quarter, (x, y) → (y, 8 − x), so it fills the screen either way.
 */
/** Par time of a course: 2 s + a brisk roll along its way (2.4 cells/s), to the second. */
function parOf(C) {
  let L = 0; for (let k = 1; k < C.route.length; k++) L += Math.hypot(C.route[k][0] - C.route[k - 1][0], C.route[k][1] - C.route[k - 1][1]);
  return Math.max(8, Math.round(2 + L / 2.4));
}
function buildStage(ti, d, aspect) {
  const C = generateCourse(ti, d, RUN_SEED), rot = aspect < 0.85;
  // difficulty d (1…5): which pieces are there, and how fast and strong they are
  const pick = list => list || [];
  const P = rot ? ([x, y]) => [y, W0 - x] : p => p;
  const V = rot ? ([x, y]) => [y, -x] : v => v;
  const RC = rot ? ([x, y, w, h]) => [y, W0 - x - w, h, w] : r => r;
  const W = rot ? H0 : W0, H = rot ? W0 : H0;
  const pt = p => { const [x, y] = P(p); return { x, y }; };
  const walls = pick(C.walls).map(([x1, y1, x2, y2]) => { const [a, b] = P([x1, y1]), [c, d] = P([x2, y2]); return seg(a, b, c, d); });
  const turn = rot ? -Math.PI / 2 : 0;
  for (const [cx, cy, r, g, gw] of C.rings || []) { const [x, y] = P([cx, cy]), a0 = g + turn + gw / 2; walls.push(arc(x, y, r, a0, a0 + TAU - gw)); }
  for (const line of C.polys || []) for (let k = 0; k + 1 < line.length; k++) { const [a, b] = P(line[k]), [c2, d] = P(line[k + 1]); walls.push(seg(a, b, c2, d)); }
  let river = null;
  if (C.river) {   // banks either side of the centre line (offset across, so they never cross), built upright, then turned
    const hws = C.river.hws, left = C.river.left, right = C.river.right;
    for (const bank of [left, right]) for (let k = 0; k + 1 < bank.length; k++) { const [a, b] = P(bank[k]), [c2, d] = P(bank[k + 1]); walls.push(seg(a, b, c2, d)); }
    const pts = C.river.pts.map(P), cum = [0];
    for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    river = { pts, cum, hw: hws.reduce((a, b) => a + b, 0) / hws.length, hws, zones: C.river.zones, poly: left.map(P).concat(right.slice().reverse().map(P)) };
  }
  const c = 0.7;   // the frame, with rounded corners
  walls.push(seg(c, 0, W - c, 0), seg(W, c, W, H - c), seg(W - c, H, c, H), seg(0, H - c, 0, c),
    arc(c, c, c, Math.PI, Math.PI * 1.5), arc(W - c, c, c, Math.PI * 1.5, TAU), arc(W - c, H - c, c, 0, Math.PI / 2), arc(c, H - c, c, Math.PI / 2, Math.PI));
  walls.forEach(w => { w.box = boxOf(w); });
  const leaf = C.theme === 'water';   // on the river the bumpers are floating leaves: a soft, springy bounce
  const circles = pick(C.bumpers).map(([x, y, r], j) => Object.assign(pt([x, y]), { r, kick: leaf ? 1.8 : BUMP_KICK, kind: leaf ? 'leaf' : 'bumper', flash: 0, rot: j * 2.4 + x }));
  for (const k of C.rocks || []) {
    const rock = { r: k.r, kick: 0, kind: 'rock', flash: 0, vx: 0, vy: 0, spin: 0 };
    if (k.line) { const [a, b] = P(k.line.slice(0, 2)), [e, f] = P(k.line.slice(2)); Object.assign(rock, { path: 'line', x1: a, y1: b, x2: e, y2: f, len: Math.hypot(e - a, f - b), speed: k.speed, x: a, y: b }); }
    else { const [cx, cy] = P(k.orbit.slice(0, 2)); Object.assign(rock, { path: 'orbit', cx, cy, rad: k.orbit[2], w: k.speed / k.orbit[2], x: cx, y: cy }); }
    circles.push(rock);
  }
  for (const [x, y, r] of C.islands || []) circles.push(Object.assign(pt([x, y]), { r, kick: 0, kind: 'island', flash: 0, seed: x * 13 + y * 7 }));
  const sparks = pick(C.sparks).map(k => {
    if (k.line) { const [a, b] = P(k.line.slice(0, 2)), [e, f] = P(k.line.slice(2)); return { kind: 'line', x1: a, y1: b, x2: e, y2: f, len: Math.hypot(e - a, f - b), speed: k.speed, x: a, y: b }; }
    const [cx, cy] = P(k.orbit.slice(0, 2)); return { kind: 'orbit', cx, cy, r: k.orbit[2], w: k.speed / k.orbit[2], a0: 0, x: cx, y: cy };
  });
  const st = {
    i: ti, d, W, H, rot, theme: C.theme, hue: C.hue, bump: C.bump || '#2ee6d6',
    start: pt(C.start), goal: pt(C.goal), walls, circles, sparks,
    holes: pick(C.holes).map(([x, y, r]) => Object.assign(pt([x, y]), { r })),
    wells: pick(C.wells).map(([x, y, R, pull, r]) => Object.assign(pt([x, y]), { R, pull, r })),
    voids: pick(C.voids).map(RC), lava: C.lava ? (rot ? { d: C.lava.d, rot: true } : C.lava) : null,
    belts: pick(C.belts).map(([x, y, w, h, ax, ay]) => { const [rx, ry, rw, rh] = RC([x, y, w, h]), [vx, vy] = V([ax, ay]); return { x: rx, y: ry, w: rw, h: rh, ax: vx, ay: vy }; }),
    spinners: pick(C.spinners).map(([x, y, len, w]) => Object.assign(pt([x, y]), { len, w, a: 0 })),
    sliders: pick(C.sliders).map(([x1, y1, x2, y2, dx, dy, period, phase]) => {
      const [a, b] = P([x1, y1]), [e, f] = P([x2, y2]), [ox, oy] = V([dx, dy]);
      return { bx1: a, by1: b, bx2: e, by2: f, ox, oy, period, phase, k: 0, vk: 0 };
    }),
    lasers: pick(C.lasers).map(([x1, y1, x2, y2, period, on, phase]) => { const [a, b] = P([x1, y1]), [e, f] = P([x2, y2]); return { x1: a, y1: b, x2: e, y2: f, period, on, phase, live: false, warn: false }; }),
    gate: C.gate ? (() => { const [cx, cy] = P(C.gate.slice(0, 2)); return { cx, cy, r: C.gate[2], gap: C.gate[3], w: C.gate[4], a: rot ? -Math.PI / 2 : 0 }; })() : null,
    boosts: pick(C.boosts).map(p => Object.assign(pt(p), { got: false })),
    checks: pick(C.checks).map(([x1, y1, x2, y2, rx, ry]) => { const [a, b] = P([x1, y1]), [c2, d] = P([x2, y2]), [px, py] = P([rx, ry]); return { x1: a, y1: b, x2: c2, y2: d, rx: px, ry: py, on: false, lit: 0 }; }),
    river,
    winds: pick(C.winds).map(([x, y, w, h, ax, ay]) => { const [rx, ry, rw, rh] = RC([x, y, w, h]), [vx, vy] = V([ax, ay]); return { x: rx, y: ry, w: rw, h: rh, ax: vx, ay: vy }; }),
    volcano: C.volcano ? (() => { const [x, y] = P(C.volcano.slice(0, 2)); return { x, y, period: C.volcano[2], T: C.volcano[3], next: 2.5, bombs: [], burns: [] }; })() : null,
    falls: pick(C.falls).map(([ax, ay, bx, by, rr, lx, ly]) => { const [a, b] = P([ax, ay]), [c2, d2] = P([bx, by]), [e, f] = P([lx, ly]); return { x1: a, y1: b, x2: c2, y2: d2, r: rr, lx: e, ly: f }; }),
    chips: pick(C.chips).map(RC),
    par: parOf(C),
    sweeps: pick(C.sweeps).map(([x, y, nx, ny, len, w, ph]) => { const [px, py] = P([x, y]), [vx, vy] = V([nx, ny]); return { x: px, y: py, a0: Math.atan2(vy, vx), len, w, ph, a: 0 }; }),
    route: C.route.map(p => P(p)),
  };
  return st;
}

/* ================================================================== */
/* The game: fixed-step physics, in cell units                         */
/* ================================================================== */
let BOMB_R = 0.45, BURN_R = 0.45, BURN_T = 2.4;
const PULSE_PUSH = 10, SWEEP_AMP = 1.35, PLUNGE_T = 0.75, FALL_PULL = 0, FALL_PULL_W = 0.9, DT = 1 / 120, WALL_T = 0.14, BALL_R = 0.28, GOAL_R = 0.38, SPARK_R = 0.19, BOOST_R = 0.36, PISTON_T = 0.22, SPIN_T = 0.18;
const G_ACC = 20, FRICTION = 0.9, VMAX = Math.max(1, Math.min(15, Number(Q.get('vmax')) || 5)), REST = 0.32, PULL = 9, BUMP_KICK = 3.4, LIVES = 3;
const BOOST_T = 2.6, BOOST_MUL = 1.45, STAGE_PTS = 20, LIFE_PTS = 3;
/** The goal of each world: one of its own colours, kept apart from the holes and hazards. */
const GOAL_COL = { neon: '#ffd84d', water: '#7ff9ff', galaxy: '#ff6fd8', electric: '#ffe14f', fire: '#ffd23f' };
/** A bumper's cap: its colour, lit from the top left, darker at the far rim (drawn once per colour). */
const capCache = new Map();
function capSprite(col) {
  let c = capCache.get(col);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.fillStyle = col; g.beginPath(); g.arc(32, 32, 31, 0, TAU); g.fill();
    const hi = g.createRadialGradient(20, 18, 1, 26, 24, 30); hi.addColorStop(0, 'rgba(255,255,255,0.9)'); hi.addColorStop(0.35, 'rgba(255,255,255,0.25)'); hi.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hi; g.fill();
    const lo = g.createRadialGradient(26, 26, 18, 32, 32, 32); lo.addColorStop(0, 'rgba(0,0,0,0)'); lo.addColorStop(1, 'rgba(0,0,20,0.45)');
    g.fillStyle = lo; g.fill(); capCache.set(col, c);
  }
  return c;
}
/** Turbo, per world: its colour and the colour of its icon. */
const BOOST_LOOK = { neon: { col: '#2ee6d6', ink: '#e8fffd' }, water: { col: '#5fd0ff', ink: '#eafaff' }, galaxy: { col: '#ffd23f', ink: '#fff6d0' }, electric: { col: '#ffe14f', ink: '#fffbe0' }, fire: { col: '#ff8a1a', ink: '#ffd27a' } };
const THEME_I = { neon: 0, water: 1, galaxy: 2, electric: 3, fire: 4 };
const FALL_T = 0.7, SINK_T = 0.75, INTRO_T = 0.55, READY_STEP = 0.7, SAFE_T = 1.4;
const HIT_R = BALL_R + WALL_T / 2;
const SLOPE_W = 0.6, SLOPE_PULL = 3.2, SKIM_V = 5.2;   // the dip around a cup: how wide, how strong; above this speed you skim over

let S = null;
/** Everything about the run. `phase`: menu, ready, play, fall, sink, intro, paused, over. */
const THEME_KEYS = ['neon', 'water', 'galaxy', 'electric', 'fire'];
function runOrder() {
  const asked = (Q.get('order') || '').split(',').map(k => THEME_KEYS.indexOf(k.trim())).filter(k => k >= 0);
  if (asked.length === 5 && new Set(asked).size === 5) return asked;
  const o = [0, 1, 2, 3, 4]; for (let k = o.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [o[k], o[j]] = [o[j], o[k]]; }
  return o;
}
function newGame(saved) {
  const from = Math.max(0, Math.min(STAGES.length - 1, (Number(Q.get('stage')) || 1) - 1));
  RUN_SEED = Number(Q.get('seed')) || Math.floor(Math.random() * 1e9);
  S = { order: runOrder(), phase: 'ready', after: 'play', readyT: 0, calibrate: tiltMode, stageIdx: from, cleared: from, stage: null, lives: LIVES, falls: 0,
    elapsed: 0, stageT: 0, stageFalls: 0, results: [], timeLeft: 0, boostT: 0, x: 0, y: 0, vx: 0, vy: 0, rollX: 0, rollY: 0, animT: 0, hole: null, fallKind: '', spawnT: 0, safeT: 0,
    lastHit: 0, tick: -1, t: 0, said100: false, lastSec: -1 };
  if (saved) {
    RUN_SEED = saved.seed; S.order = saved.order; S.lives = saved.lives; S.falls = saved.falls; S.results = saved.results; S.elapsed = saved.elapsed;
    S.stageIdx = S.cleared = saved.stageIdx;
  }
  loadStage(S.stageIdx); hearts(true);
}
function loadStage(i) {
  BOMB_R = BURN_R = TUNE.bombR; BURN_T = TUNE.burnT;
  S.stageIdx = i; S.stage = buildStage(S.order[i], i + 1, boardAspect()); S.boostT = 0; S.t = 0; S.spawn = null; S.stageT = 0; S.stageFalls = 0; S.said100 = false;
  respawn(); fit(); hud(true);
  if (S.phase !== 'menu') hooks.onStage(snapshot());
}
function respawn() { const s = S.spawn || S.stage.start, v = S.stage.volcano; if (v) { v.bombs = []; v.next = Math.max(v.next, 1.6); v.burns = v.burns.filter(b => Math.hypot(b.x - s.x, b.y - s.y) > 1.3); } S.x = s.x; S.y = s.y; S.vx = S.vy = 0; S.spawnT = 0.35; S.safeT = SAFE_T; trail.length = 0; }

/** Which way and how hard the river runs at distance s along it: +1 toward the goal, −1 back toward the start. */
function riverZone(R, s) { const f = s / R.cum[R.cum.length - 1]; for (const z of R.zones) if (f >= z[0] && f < z[1]) return z; return R.zones[R.zones.length - 1]; }
/** The river's push at (x, y): along the nearest stretch of the centre line, its way set by the zone, weaker toward the banks. */
function flowAt(st, x, y) {
  const R = st.river; if (!R) return [0, 0];
  let best = Infinity, tx = 0, ty = 0, sAt = 0;
  for (let k = 0; k + 1 < R.pts.length; k++) {
    const [x1, y1] = R.pts[k], [x2, y2] = R.pts[k + 1], d = segDist(x, y, x1, y1, x2, y2);
    if (d < best) { best = d; const l = Math.hypot(x2 - x1, y2 - y1); tx = (x2 - x1) / l; ty = (y2 - y1) / l; sAt = R.cum[k] + Math.max(0, Math.min(l, (x - x1) * tx + (y - y1) * ty)); }
  }
  const z = riverZone(R, sAt), k = Math.max(0, 1 - (best / (R.hw * 1.2)) ** 2) * z[3] * z[2];
  return [tx * k, ty * k];
}
/** Smooth back-and-forth, 0 → 1 → 0 over a period. */
const pingPong = u => { const f = u < 0.5 ? u * 2 : 2 - u * 2; return f * f * (3 - 2 * f); };
/** The moving parts move whatever the marble does. */
function moveThings() {
  const st = S.stage; S.t += DT;
  for (const s of st.spinners) s.a += s.w * DT;
  for (const s of st.sweeps) s.a = s.a0 + SWEEP_AMP * Math.sin(s.w * S.t + s.ph);
  if (st.gate) st.gate.a += st.gate.w * DT;
  for (const c of st.circles) {
    c.flash = Math.max(0, c.flash - DT * 3);
    if (c.kind !== 'rock') continue;
    const ox = c.x, oy = c.y;
    if (c.path === 'orbit') { const a = c.w * S.t; c.x = c.cx + c.rad * Math.cos(a); c.y = c.cy + c.rad * Math.sin(a); }
    else { const period = 2 * c.len / c.speed, e = pingPong((S.t % period) / period); c.x = c.x1 + (c.x2 - c.x1) * e; c.y = c.y1 + (c.y2 - c.y1) * e; }
    c.vx = (c.x - ox) / DT; c.vy = (c.y - oy) / DT; c.spin += Math.hypot(c.vx, c.vy) * DT / c.r;
  }
  for (const k of st.sparks) {
    if (k.kind === 'orbit') { const a = k.a0 + k.w * S.t; k.x = k.cx + k.r * Math.cos(a); k.y = k.cy + k.r * Math.sin(a); continue; }
    const period = 2 * k.len / k.speed, e = pingPong((S.t % period) / period);
    k.x = k.x1 + (k.x2 - k.x1) * e; k.y = k.y1 + (k.y2 - k.y1) * e;
  }
  for (const s of st.sliders) {
    const u = S.t / s.period + s.phase, k = (1 - Math.cos(TAU * u)) / 2;
    s.vk = Math.PI / s.period * Math.sin(TAU * u); s.k = k;
  }
  for (const l of st.lasers) {
    const u = ((S.t / l.period + l.phase) % 1 + 1) % 1, warnFrom = 1 - 0.35 / l.period;
    l.live = u < l.on; l.warn = !l.live && u > warnFrom;
  }
}
/**
 * Where the volcano aims: somewhere you are about to be, not dead on you. Half the time a spot on the way
 * ahead of you (1.5–3.5 cells on), a third of the time where your speed is taking you (0.4–1.3 s from now),
 * otherwise close beside you (0.6–1.2 cells off); always with some scatter.
 */
function volcanoAim(st) {
  const aim = TUNE.volAim[st.d - 1], j = Math.random() * TAU, R = st.route;
  let x = S.x, y = S.y, jr = TUNE.volJit[st.d - 1] * (0.4 + 0.6 * Math.random());
  const ahead = far => {   // the point of the way `far` cells on from where you are (back, if negative)
    let bi = 0, bd = Infinity, bu = 0;
    for (let k = 0; k + 1 < R.length; k++) { const [x1, y1] = R[k], [x2, y2] = R[k + 1], ex = x2 - x1, ey = y2 - y1, l2 = ex * ex + ey * ey || 1, u = Math.max(0, Math.min(1, ((S.x - x1) * ex + (S.y - y1) * ey) / l2)), d = Math.hypot(x1 + ex * u - S.x, y1 + ey * u - S.y); if (d < bd) { bd = d; bi = k; bu = u; } }
    let k = bi, u = bu, left = Math.abs(far), px = R[bi][0] + (R[bi + 1][0] - R[bi][0]) * bu, py = R[bi][1] + (R[bi + 1][1] - R[bi][1]) * bu;
    if (far >= 0) while (k + 1 < R.length) { const [x1, y1] = R[k], [x2, y2] = R[k + 1], l = Math.hypot(x2 - x1, y2 - y1), rest = l * (1 - u); if (left <= rest) { const f = u + left / (l || 1); return [x1 + (x2 - x1) * f, y1 + (y2 - y1) * f]; } left -= rest; k++; u = 0; px = x2; py = y2; }
    else while (k >= 0) { const [x1, y1] = R[k], [x2, y2] = R[k + 1], l = Math.hypot(x2 - x1, y2 - y1), rest = l * u; if (left <= rest) { const f = u - left / (l || 1); return [x1 + (x2 - x1) * f, y1 + (y2 - y1) * f]; } left -= rest; k--; u = 1; px = x1; py = y1; }
    return [px, py];
  };
  if (Math.random() >= aim) { [x, y] = ahead(-4 + 11 * Math.random()); jr = 0.3 + 0.7 * Math.random(); }   // not aimed: somewhere along the way, behind you or well ahead
  else {
    const m = Math.random();
    if (m < 0.44 * aim) { const la = 0.4 + Math.random() * 0.9; x = S.x + S.vx * la; y = S.y + S.vy * la; }   // where your speed takes you: more of these as the stages go on
    else if (m < 0.44 * aim + 0.5) [x, y] = ahead(1.5 + Math.random() * 2.0);   // along the way ahead
    else { const a = Math.random() * TAU, o = 0.6 + Math.random() * 0.6; x = S.x + Math.cos(a) * o; y = S.y + Math.sin(a) * o; }   // beside you
  }
  return [Math.max(0.3, Math.min(st.W - 0.3, x + Math.cos(j) * jr)), Math.max(0.3, Math.min(st.H - 0.3, y + Math.sin(j) * jr))];
}
/** The outline of a lava pool: its rounded rectangle, but ragged, bulging and creeping a little past the edge. */
function lavaPath(v, n) {
  const cs = L.cs, r0 = Math.min(0.3, v[2] / 2, v[3] / 2), pts = [], per = 2 * (v[2] + v[3]);
  const at = t => {   // a point at distance t along the rounded-rectangle perimeter (corners as quarter circles)
    const w = v[2] - 2 * r0, h = v[3] - 2 * r0, q = Math.PI / 2 * r0, segs = [w, q, h, q, w, q, h, q];
    let k = 0; t = ((t % (2 * (w + h) + 4 * q)) + (2 * (w + h) + 4 * q)) % (2 * (w + h) + 4 * q);
    while (t > segs[k]) { t -= segs[k]; k = (k + 1) % 8; }
    const cx = [v[0] + r0 + w, v[0] + v[2] - r0, v[0] + v[2] - r0, v[0] + r0, v[0] + r0, v[0] + r0, v[0] + r0, v[0] + v[2] - r0];
    switch (k) {
      case 0: return [v[0] + r0 + t, v[1], 0, -1];
      case 2: return [v[0] + v[2], v[1] + r0 + t, 1, 0];
      case 4: return [v[0] + v[2] - r0 - t, v[1] + v[3], 0, 1];
      case 6: return [v[0], v[1] + v[3] - r0 - t, -1, 0];
      default: { const base = { 1: -Math.PI / 2, 3: 0, 5: Math.PI / 2, 7: Math.PI }[k], a = base + t / (r0 || 1e-6), ox = k === 1 || k === 3 ? v[0] + v[2] - r0 : v[0] + r0, oy = k === 1 || k === 7 ? v[1] + r0 : v[1] + v[3] - r0; return [ox + Math.cos(a) * r0, oy + Math.sin(a) * r0, Math.cos(a), Math.sin(a)]; }
    }
  };
  const N = Math.max(16, Math.round(per / 0.12));
  const path = new Path2D();
  for (let j = 0; j <= N; j++) {
    const t = j / N * per, [x, y, nx, ny] = at(t), off = 0.03 + 0.05 * Math.sin(t * 2.3 + n * 1.7) + 0.03 * Math.sin(t * 5.1 + n * 3.1);
    j ? path.lineTo(X(x + nx * off), Y(y + ny * off)) : path.moveTo(X(x + nx * off), Y(y + ny * off));
  }
  path.closePath(); return path;
}
/** The gate around the goal, as the arc it is right now (a ring with one gap). */
function gateArc(g) { return Object.assign(arc(g.cx, g.cy, g.r, g.a + g.gap / 2, g.a + TAU - g.gap / 2), { box: [g.cx - g.r, g.cy - g.r, g.cx + g.r, g.cy + g.r], spin: g.w, px: g.cx, py: g.cy, color: '#ff6a2a' }); }
/** The spinning bars, as the walls they are right now. */
const spinnerSeg = s => { const c = Math.cos(s.a) * s.len, d = Math.sin(s.a) * s.len; return Object.assign(seg(s.x - c, s.y - d, s.x + c, s.y + d), { box: [s.x - s.len, s.y - s.len, s.x + s.len, s.y + s.len], spin: s.w, px: s.x, py: s.y, thick: SPIN_T, color: '#ff2e88' }); };
/** The pistons, as the walls they are right now (they also carry their speed). */
const sliderSeg = s => {
  const x1 = s.bx1 + s.ox * s.k, y1 = s.by1 + s.oy * s.k, x2 = s.bx2 + s.ox * s.k, y2 = s.by2 + s.oy * s.k;
  return Object.assign(seg(x1, y1, x2, y2), { box: [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)], vx: s.ox * s.vk, vy: s.oy * s.vk, thick: PISTON_T, color: '#9dff3a' });
};
/** Inside a lava pool (its corners are rounded, as drawn). */
function inPool(x, y, v, m = 0.04) {
  if (!(x > v[0] + m && x < v[0] + v[2] - m && y > v[1] + m && y < v[1] + v[3] - m)) return false;
  const rr = Math.min(0.3, v[2] / 2, v[3] / 2), cx = Math.max(v[0] + rr, Math.min(x, v[0] + v[2] - rr)), cy = Math.max(v[1] + rr, Math.min(y, v[1] + v[3] - rr));
  return Math.hypot(x - cx, y - cy) < rr - m;
}
const inRect = (x, y, r, m = 0) => x > r[0] + m && x < r[0] + r[2] - m && y > r[1] + m && y < r[1] + r[3] - m;
/** Distance from a point to a segment. */
const segDist = (px, py, x1, y1, x2, y2) => { const ex = x2 - x1, ey = y2 - y1, l2 = ex * ex + ey * ey, u = l2 ? Math.max(0, Math.min(1, ((px - x1) * ex + (py - y1) * ey) / l2)) : 0; return Math.hypot(px - x1 - ex * u, py - y1 - ey * u); };

/** One fixed step of the world. */
function step() {
  const st = S.stage;
  if (S.phase === 'menu' || S.phase === 'paused' || S.phase === 'over') return;
  moveThings();
  if (S.spawnT > 0) S.spawnT -= DT;
  if (S.phase === 'ready') {
    S.readyT += DT;
    if (S.calibrate && S.readyT > READY_STEP * 1.5) calSamples.push([rawTilt.x, rawTilt.y]);
    const n = Math.floor(S.readyT / READY_STEP);
    if (n !== S.tick) { S.tick = n; if (n < 3) { toast(String(3 - n), S.calibrate ? UI.boFlat : '', true); sfx.tick(false); } }
    if (S.readyT >= READY_STEP * 3) {
      if (S.calibrate) finishCalibration();
      S.phase = S.after; S.tick = -1; toast(UI.boGo); sfx.tick(true);
    }
    return;
  }
  if (S.phase === 'intro') { S.animT += DT; if (S.animT >= INTRO_T) S.phase = 'play'; return; }
  if (S.phase === 'sink') {
    S.animT += DT; const g = st.goal;
    S.x += (g.x - S.x) * 0.2; S.y += (g.y - S.y) * 0.2;
    if (S.animT >= SINK_T) stageCleared();
    return;
  }
  // the clock runs while you play and while you fall
  // every stage is timed against its par (20 points inside it, down to 10 at twice the par), but there is no time limit
  S.elapsed += DT; S.stageT += DT;
  if (!S.said100 && S.stageT > st.par) { S.said100 = true; hint(UI.boHint100, 3000); }
  if (S.phase === 'fall') {
    S.animT += DT;
    if (S.fallKind === 'hole' || S.fallKind === 'well' || S.fallKind === 'lava') { S.x += (S.hole[0] - S.x) * 0.25; S.y += (S.hole[1] - S.y) * 0.25; }
    if (S.animT >= FALL_T) { if (S.lives <= 0) finish(false, 'lives'); else { S.phase = 'play'; respawn(); } }
    return;
  }
  if (S.phase === 'plunge') {   // over the waterfall: you tumble down over the bank into the stretch below (the clock keeps running)
    S.animT += DT;
    if (S.animT < PLUNGE_T) { const u = S.animT / PLUNGE_T, e = u * u; S.x = S.hole[0] + (S.plungeTo[0] - S.hole[0]) * e; S.y = S.hole[1] + (S.plungeTo[1] - S.hole[1]) * e; return; }
    S.x = S.plungeTo[0]; S.y = S.plungeTo[1]; S.vx = S.vy = 0; S.phase = 'play'; S.spawnT = 0.35; S.safeT = 0.5; trail.length = 0;
    burst(S.x, S.y, '#c8f4ff', 18); flash(S.x, S.y, 1.2, '#7fe0ff');
    return;
  }
  if (S.safeT > 0) S.safeT -= DT;
  if (S.boostT > 0) S.boostT = Math.max(0, S.boostT - DT);
  const mul = S.boostT > 0 ? BOOST_MUL : 1;
  let ax = G_ACC * mul * tilt.x, ay = G_ACC * mul * tilt.y;
  // belts and the river push
  for (const b of st.belts) if (inRect(S.x, S.y, [b.x, b.y, b.w, b.h])) { ax += b.ax; ay += b.ay; }
  for (const b of st.winds || []) if (inRect(S.x, S.y, [b.x, b.y, b.w, b.h])) { ax += b.ax; ay += b.ay; }   // gusts in the sky
  if (st.river) { const [fx, fy] = flowAt(st, S.x, S.y); ax += fx; ay += fy; }
  // waterfalls: the water rushes to the lip and drags you with it; over it, and you land back upstream
  for (const f of st.falls || []) {
    const ex = f.x2 - f.x1, ey = f.y2 - f.y1, l2 = ex * ex + ey * ey, u = Math.max(0, Math.min(1, ((S.x - f.x1) * ex + (S.y - f.y1) * ey) / l2));
    const qx = f.x1 + ex * u, qy = f.y1 + ey * u, dx = qx - S.x, dy = qy - S.y, d = Math.hypot(dx, dy);
    if (d < f.r) { S.phase = 'plunge'; S.animT = 0; S.hole = [qx, qy]; S.plungeTo = [f.lx, f.ly]; S.vx = S.vy = 0; sfx.fall(); buzz([20, 30, 60]); burst(qx, qy, '#e6fbff', 14); const [a, b] = UI.boFalls.split('|'); toast(a, b); return; }
    if (d < f.r + TUNE.fallReach) { const k = TUNE.fallPull * (1 - (d - f.r) / TUNE.fallReach) ** 1.5; ax += dx / d * k; ay += dy / d * k; }   // the water speeds up toward the edge and takes you with it
  }
  // black holes pull from afar; the middle swallows
  for (const w of st.wells) {
    const dx = w.x - S.x, dy = w.y - S.y, d = Math.hypot(dx, dy);
    if (d >= w.R) continue;
    if (d < w.r * 0.8) { loseLife('well', w.x, w.y); return; }
    const p = w.pull * (1 - d / w.R) ** 0.7; ax += dx / d * p; ay += dy / d * p;
  }
  // the lip of each hole (and of the goal) pulls the marble in a little, like a real one
  const pits = st.holes.map(h => [h, h.r, false]); pits.push([st.goal, GOAL_R, true]);
  const speedNow = Math.hypot(S.vx, S.vy);
  for (const [h, r, isGoal] of pits) {
    const dx = h.x - S.x, dy = h.y - S.y, d = Math.hypot(dx, dy);
    if (d >= r + SLOPE_W) continue;
    if (d < 1e-6) { isGoal ? enterGoal() : loseLife('hole', h.x, h.y); return; }
    if (d < r * 0.55 && (speedNow < SKIM_V || d < r * 0.25)) { isGoal ? enterGoal() : loseLife('hole', h.x, h.y); return; }
    // like a golf green: the ground slopes gently toward the cup, then steeply at its lip
    const p = d < r ? PULL * (1 - d / r) + SLOPE_PULL : SLOPE_PULL * (1 - (d - r) / SLOPE_W);
    ax += dx / d * p; ay += dy / d * p;
  }
  // lava
  if (st.lava && lavaDist(st.lava, S.x, S.y) < -0.04) { loseLife('lava', S.x, S.y); return; }   // the marble's centre is over the lava
  S.vx += ax * DT; S.vy += ay * DT;
  const f = Math.max(0, 1 - FRICTION * DT); S.vx *= f; S.vy *= f;
  const vmax = VMAX * mul, sp = Math.hypot(S.vx, S.vy); if (sp > vmax) { S.vx *= vmax / sp; S.vy *= vmax / sp; }
  S.x += S.vx * DT; S.y += S.vy * DT; S.rollX += S.vx * DT; S.rollY += S.vy * DT;
  const moving = st.spinners.map(spinnerSeg).concat(st.sliders.map(sliderSeg)); if (st.gate) moving.push(gateArc(st.gate));
  collide(st.walls, moving, st.circles);
  // sparks and lasers
  if (S.safeT <= 0) {
    for (const k of st.sparks) if (Math.hypot(k.x - S.x, k.y - S.y) < BALL_R + SPARK_R) { loseLife('zap', S.x, S.y); return; }
    for (const l of st.lasers) if (l.live && segDist(S.x, S.y, l.x1, l.y1, l.x2, l.y2) < BALL_R + 0.05) { loseLife('laser', S.x, S.y); return; }
    for (const w of st.sweeps) if (segDist(S.x, S.y, w.x, w.y, w.x + Math.cos(w.a) * w.len, w.y + Math.sin(w.a) * w.len) < BALL_R + 0.06) { loseLife('zap', S.x, S.y); return; }
  }
  // the volcano: a bomb every few seconds, aimed where you are heading; its shadow grows where it will land,
  // and the ground there burns for a while after
  if (st.volcano) {
    const v = st.volcano; v.next -= DT;
    if (v.next <= 0) {
      v.next = v.period; burst(v.x, v.y, '#ff8a2a', 12); (v.pops || (v.pops = [])).push({ x: v.x, y: v.y, r: 1.1, t0: clock });
      const [tx, ty] = volcanoAim(st); v.bombs.push({ sx: v.x, sy: v.y, tx, ty, t: 0 });
      if (st.d >= 5) { const [tx2, ty2] = volcanoAim(st); v.bombs.push({ sx: v.x, sy: v.y, tx: tx2, ty: ty2, t: -0.25 }); }   // at d5 a second bomb
    }
    for (const b of v.bombs) b.t += DT;
    while (v.bombs.length && v.bombs[0].t >= v.T) {
      const b = v.bombs.shift(); v.burns.push({ x: b.tx, y: b.ty, t: 0 }); burst(b.tx, b.ty, '#ff7a1a', 18); (v.pops || (v.pops = [])).push({ x: b.tx, y: b.ty, r: 1.4, t0: clock }); sfx.lava(); buzz(10);
      if (S.safeT <= 0 && Math.hypot(S.x - b.tx, S.y - b.ty) < BOMB_R + BALL_R * 0.5) { loseLife('zap', S.x, S.y); return; }
    }
    for (const b of v.burns) b.t += DT;
    v.burns = v.burns.filter(b => b.t < BURN_T);
    if (S.safeT <= 0) for (const b of v.burns) if (Math.hypot(S.x - b.x, S.y - b.y) < BURN_R * 0.8 + BALL_R * 0.3) { loseLife('zap', S.x, S.y); return; }
  }
  // checkpoints
  for (const c of st.checks) if (!c.on && segDist(S.x, S.y, c.x1, c.y1, c.x2, c.y2) < BALL_R) {
    st.checks.forEach(o => { o.on = false; }); c.on = true; c.lit = 1; S.spawn = { x: c.rx, y: c.ry };
    sfx.check(); hint(UI.boCheck, 1600);
  }
  // turbo
  for (const s of st.boosts) if (!s.got && Math.hypot(s.x - S.x, s.y - S.y) < BOOST_R + BALL_R * 0.5) {
    const col = BOOST_LOOK[st.theme].col;
    s.got = true; S.boostT = BOOST_T; sfx.boost(); buzz(25); burst(s.x, s.y, col, 16); flash(s.x, s.y, 1.6, col); toast(UI.boBoosts[THEME_I[st.theme]]); hud(true);
    if (Math.hypot(S.vx, S.vy) > 0.3) { S.vx *= 1.3; S.vy *= 1.3; }   // a kick right away
  }
}
/** The nearest point of a wall to (px, py). */
function nearest(w, px, py) {
  if (w.t === 's') {
    const ex = w.x2 - w.x1, ey = w.y2 - w.y1, l2 = ex * ex + ey * ey;
    const u = l2 ? Math.max(0, Math.min(1, ((px - w.x1) * ex + (py - w.y1) * ey) / l2)) : 0;
    return [w.x1 + ex * u, w.y1 + ey * u];
  }
  const span = w.a1 - w.a0; let d = Math.atan2(py - w.cy, px - w.cx) - w.a0; d = ((d % TAU) + TAU) % TAU;
  const a = d <= span ? w.a0 + d : (d - span < TAU - d ? w.a1 : w.a0);
  return [w.cx + w.r * Math.cos(a), w.cy + w.r * Math.sin(a)];
}
/** Push the marble out of every wall and disc it overlaps and bounce what goes into it; moving things also shove it. */
function collide(walls, moving, circles) {
  let hit = 0, at = null;
  const one = w => {
    const rr = w.thick ? BALL_R + w.thick / 2 : HIT_R, b = w.box;
    if (S.x + rr < b[0] || S.x - rr > b[2] || S.y + rr < b[1] || S.y - rr > b[3]) return;
    const [qx, qy] = nearest(w, S.x, S.y), dx = S.x - qx, dy = S.y - qy, d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr || d2 < 1e-12) return;
    const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
    S.x += nx * (rr - d); S.y += ny * (rr - d);
    let wx = w.vx || 0, wy = w.vy || 0;
    if (w.spin) { wx += -w.spin * (qy - w.py); wy += w.spin * (qx - w.px); }
    const vn = (S.vx - wx) * nx + (S.vy - wy) * ny;
    if (vn < 0) { S.vx -= (1 + REST) * vn * nx; S.vy -= (1 + REST) * vn * ny; if (-vn > hit) { hit = -vn; at = [qx, qy, nx, ny, w.color]; } }
  };
  for (let pass = 0; pass < 2; pass++) { for (const w of walls) one(w); for (const w of moving) one(w); }
  for (const c of circles) {
    const dx = S.x - c.x, dy = S.y - c.y, d = Math.hypot(dx, dy), rr = BALL_R + c.r;
    if (d >= rr || d < 1e-9) continue;
    const nx = dx / d, ny = dy / d; S.x = c.x + nx * rr; S.y = c.y + ny * rr;
    const cvx = c.vx || 0, cvy = c.vy || 0, vn = (S.vx - cvx) * nx + (S.vy - cvy) * ny;
    if (c.kick) {
      if (vn < c.kick) { S.vx += (c.kick - vn) * nx; S.vy += (c.kick - vn) * ny; }
      if (c.flash < 0.5) { sfx.bump(); buzz(15); impact(c.x + nx * c.r, c.y + ny * c.r, nx, ny, 5, S.stage.bump); flash(c.x, c.y, 1.1, S.stage.bump); }
      c.flash = 1;
    } else if (vn < 0) {
      S.vx -= (1 + 0.5) * vn * nx; S.vy -= (1 + 0.5) * vn * ny;
      if (-vn > 1 && c.flash < 0.5) { c.flash = 1; sfx.hit(-vn); impact(c.x + nx * c.r, c.y + ny * c.r, nx, ny, -vn + 1, '#d9c6ff'); }
    }
  }
  for (const w of walls) one(w);   // one more pass: whatever a disc pushed it into, the walls get the last word
  if (hit > 1.1 && S.elapsed - S.lastHit > 0.06) {
    S.lastHit = S.elapsed; impact(at[0], at[1], at[2], at[3], hit, at[4] || S.stage.hue);
    if (hit > 1.4) sfx.hit(hit); if (hit > 3) buzz(8);
  }
}
function loseLife(kind, x, y) {
  S.phase = 'fall'; S.fallKind = kind; S.animT = 0; S.hole = [x, y]; S.vx = S.vy = 0; S.lives--; S.falls++; S.stageFalls++; S.boostT = 0;
  hearts(); buzz([30, 40, 80]);
  const th = S.stage.theme;
  const C = {
    hole: ['#ff2e88', UI.boFell, sfx.fall],
    well: th === 'water' ? ['#3ab8ff', UI.boWhirl, sfx.suck] : ['#b07bff', UI.boSucked, sfx.suck],
    lava: ['#ff5a36', UI.boLava, sfx.lava],
    zap: th === 'electric' ? ['#4fd8ff', UI.boShock, sfx.zap] : th === 'fire' ? ['#ff7a1a', UI.boBurn, sfx.lava] : ['#ff8a3d', UI.boZap, sfx.zap],
    laser: th === 'electric' ? ['#4fd8ff', UI.boShock, sfx.zap] : th === 'fire' ? ['#ff7a1a', UI.boBurn, sfx.lava] : ['#ff2e4d', UI.boLaser, sfx.zap],
  }[kind];
  C[2](); burst(x, y, C[0], kind === 'hole' ? 8 : 22); flash(x, y, kind === 'hole' ? 0.9 : 1.8, C[0]);
  toast(C[1], S.lives === 1 ? UI.boLastLife : '');
}
function enterGoal() {
  S.phase = 'sink'; S.animT = 0; S.vx = S.vy = 0;
  const g = S.stage.goal; sfx.goal(); buzz([20, 30, 20]); burst(g.x, g.y, '#9dff3a', 28); flash(g.x, g.y, 2.2, '#9dff3a');
}
function stageCleared() {
  S.cleared = S.stageIdx + 1; hint('');
  const st = S.stage;
  S.results.push({ i: st.i, t: S.stageT, par: st.par, pts: stagePoints(S.stageT, st.par) });
  if (!S.stageFalls && S.lives < LIVES) { S.lives++; hearts(); const [a, b] = UI.boLifeBack.split('|'); setTimeout(() => S && S.phase !== 'over' && hint(`❤️ ${a} ${b}`, 2500), 900); }
  if (S.cleared >= STAGES.length) { finish(true); return; }
  loadStage(S.stageIdx + 1);
  S.phase = 'intro'; S.animT = -1;
  const [a, b] = UI.boStages[S.stage.i].split('|'); toast(a, b); hint(UI.boTips[S.stage.i], 5500);
}
/** The score: each cleared stage 20 inside its par, down to 10 at twice the par; 3 off per life lost (max 100). */
function scoreOf() {
  return runScore(S.results, S.falls, S.cleared >= STAGES.length);
}

/* ================================================================== */
/* Input: the tilt of the phone, keys and a drag stick                 */
/* ================================================================== */
const MAX_DEG = 32, DEAD_DEG = 1.0;
const rawTilt = { x: 0, y: 0 };      // degrees, turned to the screen's axes
const tilt = { x: 0, y: 0 };         // what the physics reads: the sine of the tilt, smoothed
let calib = { x: 0, y: 0 }, calSamples = [], tiltSeen = false, tiltMode = false;
const keys = new Set();
let drag = null;
const isCoarse = matchMedia('(pointer: coarse)').matches;

function onOrientation(e) {
  if (e.beta == null || e.gamma == null) return;
  tiltSeen = true;
  const a = ((screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0) % 360;
  const b = e.beta, g = e.gamma;
  let x = g, y = b;
  if (a === 90) { x = b; y = -g; } else if (a === 270 || a === -90) { x = -b; y = g; } else if (a === 180) { x = -g; y = -b; }
  rawTilt.x = x; rawTilt.y = y;
}
addEventListener('deviceorientation', onOrientation);
/** iOS asks before sharing the tilt; that question must come from a tap. */
async function askTilt() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      return (await DeviceOrientationEvent.requestPermission()) === 'granted';
    }
  } catch (_) { return false; }
  return true;
}
function finishCalibration() {
  if (calSamples.length) {
    const ax = calSamples.reduce((s, v) => s + v[0], 0) / calSamples.length, ay = calSamples.reduce((s, v) => s + v[1], 0) / calSamples.length;
    calib = { x: Math.max(-20, Math.min(20, ax)), y: Math.max(-20, Math.min(20, ay)) };
  }
  calSamples = []; S.calibrate = false;
}
const degToTilt = d => { const a = Math.abs(d) < DEAD_DEG ? 0 : Math.max(-MAX_DEG, Math.min(MAX_DEG, d - Math.sign(d) * DEAD_DEG)); return Math.sin(a * Math.PI / 180); };
/** The tilt the physics should feel this frame: keys or a drag win over the phone. */
function readTilt(dt) {
  let tx = 0, ty = 0;
  const kx = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
  const ky = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
  if (kx || ky) { const l = Math.hypot(kx, ky); tx = kx / l * 0.36; ty = ky / l * 0.36; }
  else if (drag && drag.on) { tx = drag.vx * 0.42; ty = drag.vy * 0.42; }
  else if (tiltMode) { tx = degToTilt(rawTilt.x - calib.x); ty = degToTilt(rawTilt.y - calib.y); }
  const k = 1 - Math.exp(-dt * 16);
  tilt.x += (tx - tilt.x) * k; tilt.y += (ty - tilt.y) * k;
}
addEventListener('keydown', e => {
  if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(); return; }
  if (!card.hidden && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); cBtn.click(); return; }
  if (/^(Arrow|Key[WASD])/.test(e.code)) { keys.add(e.code); e.preventDefault(); }
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
const cv = document.getElementById('cv');
cv.addEventListener('pointerdown', e => {
  if (!S || card.hidden === false) return;
  cv.setPointerCapture(e.pointerId); audio();
  drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, vx: 0, vy: 0, on: true };
});
cv.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const R = Math.min(L.W, L.H) * 0.17;
  let dx = (e.clientX - drag.x0) / R, dy = (e.clientY - drag.y0) / R; const l = Math.hypot(dx, dy);
  if (l > 1) { dx /= l; dy /= l; }
  drag.vx = dx; drag.vy = dy;
});
const endDrag = e => { if (drag && e.pointerId === drag.id) drag = null; };
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);

/* ================================================================== */
/* The view: flat 2D neon, cheap enough for a phone                    */
/* ================================================================== */
/*
 * Speed notes: nothing per frame uses shadowBlur or builds a gradient. Glows are two strokes (a wide
 * faint one under a thin bright one) or a cached soft sprite; the still board is drawn once per stage;
 * the canvas is capped at about 1.6 million pixels.
 */
const wrap = document.getElementById('wrap'), ctx = cv.getContext('2d', { desynchronized: true });
const bg = document.createElement('canvas'), bctx = bg.getContext('2d');
const L = { W: 300, H: 400, DPR: 1, cs: 40, ox: 0, oy: 0 };
const parts = [], trail = [], flashes = [];
let clock = 0;

function boardAspect() { return Math.max(0.3, (L.H - 20) / Math.max(1, L.W - 20)); }
function layout() {
  const r = wrap.getBoundingClientRect();
  if (!r.width || !r.height) return;   // hidden behind the cover: laid out when the run shows
  L.W = r.width; L.H = r.height;
  L.DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1, Math.sqrt(1.6e6 / Math.max(1, L.W * L.H))));
  cv.width = bg.width = Math.round(L.W * L.DPR); cv.height = bg.height = Math.round(L.H * L.DPR);
  // the course turns when the screen does
  if (S && S.stage && S.stage.rot !== (boardAspect() < 0.85) && S.phase !== 'over') {
    const got = S.stage.boosts.map(b => b.got), fx = S.x / S.stage.W, fy = S.y / S.stage.H, wasRot = S.stage.rot;
    S.stage = buildStage(S.order[S.stageIdx], S.stageIdx + 1, boardAspect()); S.stage.boosts.forEach((b, i) => { b.got = got[i]; });
    if (!wasRot) { S.x = fy * S.stage.W; S.y = (1 - fx) * S.stage.H; } else { S.x = (1 - fy) * S.stage.W; S.y = fx * S.stage.H; }
    S.vx = S.vy = 0;
  }
  fit();
}
function fit() {
  if (!S || !S.stage) return;
  const st = S.stage, pad = 12;
  L.cs = Math.min((L.W - pad * 2) / st.W, (L.H - pad * 2) / st.H);
  L.ox = (L.W - L.cs * st.W) / 2; L.oy = (L.H - L.cs * st.H) / 2;
  shadeCache = null;
  renderBoard();
}
const X = v => L.ox + v * L.cs, Y = v => L.oy + v * L.cs;
/** A wall into a path, in screen units. */
function addWall(p, w) {
  if (w.t === 's') { p.moveTo(X(w.x1), Y(w.y1)); p.lineTo(X(w.x2), Y(w.y2)); }
  else { p.moveTo(X(w.cx + w.r * Math.cos(w.a0)), Y(w.cy + w.r * Math.sin(w.a0))); p.arc(X(w.cx), Y(w.cy), w.r * L.cs, w.a0, w.a1); }
}
function roundRect(g, x, y, w, h, c) { g.beginPath(); g.moveTo(x + c, y); g.arcTo(x + w, y, x + w, y + h, c); g.arcTo(x + w, y + h, x, y + h, c); g.arcTo(x, y + h, x, y, c); g.arcTo(x, y, x + w, y, c); g.closePath(); }
/** A small fixed random, so the decorations are the same every time. */
function rngFrom(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** Neon without blur: the current path stroked wide and faint, then thin and bright. */
function glowStroke(color, width) {
  const a = ctx.globalAlpha;
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalAlpha = a * 0.22; ctx.lineWidth = width * 1.5 + 6; ctx.stroke();
  ctx.globalAlpha = a; ctx.lineWidth = width; ctx.stroke();
}
/** A soft round light of one colour, drawn once and reused (cheaper than a gradient each time). */
const glowCache = new Map();
function glowSprite(color) {
  let c = glowCache.get(color);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, color); gr.addColorStop(0.35, color + '99'); gr.addColorStop(1, color + '00');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); glowCache.set(color, c);
  }
  return c;
}
const glowAt = (x, y, r, color, alpha = 1) => { const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha; ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = a; };

/* ---------- themes: floor, walls' extras, the marble ---------- */
/**
 * Each world has its own marble: a tile of texture that slides inside it as it rolls, a halo, and
 * something alive on top (flames, arcs, ripples). The tiles are drawn once.
 */
function makeTile(seed, base, blobs, extra) {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), r = rngFrom(seed);
  g.fillStyle = base; g.fillRect(0, 0, N, N);
  g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 9; k++) {
    const x = r() * N, y = r() * N, rad = 18 + r() * 34, col = blobs[k % blobs.length];
    for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
      gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
    }
  }
  if (extra) extra(g, r, N);
  return c;
}
const stars = (g, r, N) => {
  for (let k = 0; k < 70; k++) {
    const x = r() * N, y = r() * N, s = r() < 0.12 ? 1.6 : 0.4 + r() * 0.8;
    g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
    if (s > 1.2) { g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x - 4, y - 0.4, 8, 0.8); g.fillRect(x - 0.4, y - 4, 0.8, 8); }
  }
};
const THEMES = {
  neon: { halo: '#9fdcff', rim: '#ffffff', dust: ['#ffffff', '#bfe6ff', '#ffc4ee'],
    tile: makeTile(3, '#2a0640', ['rgba(255,46,136,0.8)', 'rgba(46,230,214,0.6)', 'rgba(255,210,63,0.5)']) },
  water: { halo: '#3ab8ff', rim: '#c8f1ff', dust: ['#bfefff'],
    tile: makeTile(11, '#04305e', ['rgba(47,168,255,0.7)', 'rgba(127,224,255,0.5)', 'rgba(30,90,200,0.6)'], (g, r, N) => {
      g.strokeStyle = 'rgba(220,250,255,0.45)'; g.lineWidth = 1.3;
      for (let k = 0; k < 7; k++) { const y0 = r() * N; g.beginPath(); for (let x = -4; x <= N + 4; x += 4) g.lineTo(x, y0 + Math.sin(x / N * TAU * 2 + k) * 5); g.stroke(); }
    }) },
  galaxy: { halo: '#b07bff', rim: '#d9b8ff', dust: ['#ffffff', '#d9b8ff'],
    tile: makeTile(42, '#0a0424', ['rgba(138,77,255,0.55)', 'rgba(255,46,136,0.45)', 'rgba(46,230,214,0.35)', 'rgba(90,60,255,0.5)'], stars) },
  electric: { halo: '#4fd8ff', rim: '#e6fbff', dust: ['#ffffff', '#9ff0ff'],
    tile: makeTile(23, '#050c30', ['rgba(42,92,255,0.6)', 'rgba(79,216,255,0.45)', 'rgba(160,120,255,0.35)'], (g, r, N) => {
      g.strokeStyle = 'rgba(180,240,255,0.55)'; g.lineWidth = 1;
      for (let k = 0; k < 6; k++) { let x = r() * N, y = r() * N; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (r() - 0.5) * 22; y += (r() - 0.5) * 22; g.lineTo(x, y); } g.stroke(); }
    }) },
  fire: { halo: '#c2410c', rim: '#ffe27a', dust: ['#ffb000', '#ff5a00', '#ffe27a'],
    tile: makeTile(7, '#4a0800', ['rgba(255,90,0,0.8)', 'rgba(255,176,0,0.7)', 'rgba(255,40,0,0.6)', 'rgba(255,226,122,0.55)']) },
};
let shadeCache = null;
/** The sphere shading (light top-left, dark rim), drawn once per size. */
function shadeSprite(R) {
  const key = Math.round(R * 10);
  if (shadeCache && shadeCache.key === key) return shadeCache.c;
  const s = Math.ceil(R * 2) + 2, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d'), m = s / 2, gr = g.createRadialGradient(m - R * 0.35, m - R * 0.4, R * 0.1, m, m, R);
  gr.addColorStop(0, 'rgba(255,255,255,0.25)'); gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,10,0.62)');
  g.fillStyle = gr; g.beginPath(); g.arc(m, m, R, 0, TAU); g.fill();
  shadeCache = { key, c };
  return c;
}
let arcsAt = -1, arcs = [];
/** The marble of this world. */
function drawBall(x, y, scale, alpha) {
  const st = S.stage, th = THEMES[st.theme], R = BALL_R * L.cs * scale, px = X(x), py = Y(y);
  if (R < 0.5) return;
  const boost = S.boostT > 0, sp = Math.hypot(S.vx, S.vy);
  ctx.globalAlpha = alpha;
  if (st.theme === 'neon') { drawSkyMarble(px, py, R); ctx.globalAlpha = 1; return; }   // the sky marble: a soap bubble, with its own shadow
  const lift = st.theme === 'galaxy' ? 2.4 + 0.7 * Math.sin(clock * 1.6) : 1;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(px + SHADOW.x * L.cs * lift, py + SHADOW.y * L.cs * lift, R * 0.98, 0, TAU); ctx.fill();
  glowAt(px, py, R * 2.2, boost ? BOOST_LOOK[st.theme].col : th.halo, 0.55);
  // the texture, sliding with the roll
  ctx.save(); ctx.beginPath(); ctx.arc(px, py, R, 0, TAU); ctx.clip();
  const T = R * 2.7, mod = v => ((v % T) + T) % T, bx = px - R - T + mod(S.rollX * L.cs * 0.9), by = py - R - T + mod(S.rollY * L.cs * 0.9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) ctx.drawImage(th.tile, bx + i * T, by + j * T, T, T);
  if (st.theme === 'water') {   // light ripples moving across
    ctx.strokeStyle = 'rgba(230,252,255,0.35)'; ctx.lineWidth = Math.max(1, R * 0.08);
    for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let t = -1; t <= 1.01; t += 0.25) ctx.lineTo(px + t * R, py + (k - 0.5) * R * 0.8 + Math.sin(t * 4 + clock * 5 + k) * R * 0.12); ctx.stroke(); }
  }
  if (st.theme === 'fire') {   // it glows from inside instead of being shaded
    ctx.globalCompositeOperation = 'lighter'; glowAt(px + R * 0.1, py + R * 0.1, R * 1.0, '#ffb000', 0.35 + 0.1 * Math.random()); glowAt(px, py, R * 0.5, '#fff1a8', 0.22); ctx.globalCompositeOperation = 'source-over';
  } else ctx.drawImage(shadeSprite(R), px - R - 1, py - R - 1);
  ctx.restore();
  ctx.strokeStyle = boost ? BOOST_LOOK[st.theme].col : th.rim; ctx.lineWidth = Math.max(1.2, R * 0.12); ctx.beginPath(); ctx.arc(px, py, R, 0, TAU); ctx.stroke();
  const hl = st.theme === 'electric' ? pcbTilt() : [0, 0];   // on the circuit board the highlight slides as you tilt
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(px - R * (0.38 + hl[0] * 0.3), py - R * (0.42 + hl[1] * 0.3), R * 0.13, 0, TAU); ctx.fill();
  // on top: crackling arcs for the electric marble (new shapes every few hundredths of a second)
  if (st.theme === 'electric') {
    if (clock - arcsAt > 0.06) {
      arcsAt = clock; arcs = [];
      for (let k = 0; k < 3; k++) { const a = Math.random() * TAU, pts = []; for (let j = 0; j <= 5; j++) { const rr = R * (0.2 + j * 0.27), aa = a + (Math.random() - 0.5) * 0.7; pts.push([Math.cos(aa) * rr, Math.sin(aa) * rr]); } arcs.push(pts); }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const pts of arcs) {
      ctx.beginPath(); pts.forEach(([ax, ay], j) => (j ? ctx.lineTo(px + ax, py + ay) : ctx.moveTo(px + ax, py + ay)));
      ctx.strokeStyle = 'rgba(79,216,255,0.45)'; ctx.lineWidth = Math.max(2, R * 0.22); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, R * 0.07); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
}

/* ---------- realistic bits, drawn once ---------- */
/**
 * The matter round a black hole, seen from above: three rings of streaks that each wind inward. They are drawn
 * once and turned at different speeds (the inner one fastest), so the whole thing shears like a real disc.
 */
const HOLE_SWIRL = [[0.56, 1.0, 50, 0.34, 0.32, 0.30], [0.38, 0.74, 60, 0.42, 0.85, 0.30], [0.24, 0.46, 46, 0.5, 1.9, 0.26]].map(([r0, r1, n, al, speed, twist], li) => {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), r = rngFrom(5 + li * 7), m = N / 2;
  g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const u = Math.pow(r(), 1.2), rr = m * (r0 + (r1 - r0) * u), a0 = r() * TAU, span = 0.5 + r() * 1.7;
    const col = li === 2 ? '255,244,225' : li === 1 ? '255,175,85' : k % 3 ? '255,110,60' : '190,130,255';
    g.strokeStyle = `rgba(${col},${al * (0.4 + 0.6 * r()) * (1 - 0.7 * u)})`; g.lineWidth = (li === 0 ? 1 : 0.8) + r() * (li === 2 ? 2.2 : 3);
    g.beginPath(); for (let j = 0; j <= 10; j++) { const t = j / 10, a = a0 + span * t, q = rr * (1 - twist * t); g.lineTo(m + Math.cos(a) * q, m + Math.sin(a) * q); } g.stroke();
  }
  return { c, speed };
});
/** Foam arms of a whirlpool: spirals that thin out toward the rim. */
const SWIRL = (() => {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), m = N / 2; g.lineCap = 'round';
  for (let arm = 0; arm < 5; arm++) {
    let prev = null;
    for (let th = 0; th < 9; th += 0.08) {
      const rad = 6 * Math.exp(0.33 * th); if (rad > m) break;
      const a = th + arm * TAU / 5, p = [m + rad * Math.cos(a), m + rad * Math.sin(a)];
      if (prev) { g.strokeStyle = `rgba(220,248,255,${0.55 * (1 - rad / m)})`; g.lineWidth = 1 + 3 * (1 - rad / m); g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(p[0], p[1]); g.stroke(); }
      prev = p;
    }
  }
  return c;
})();
/** Moving light on the bottom of a pool: a seamless net of bright wavy lines (computed per pixel, once). */
const CAUSTICS = (() => {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N), r = rngFrom(5), pts = [];
  const wrap = (a2, b2) => { const d = Math.abs(a2 - b2); return Math.min(d, N - d); };
  for (let k = 0, tries = 0; k < 34 && tries < 4000; tries++) { const q = [r() * N, r() * N]; if (pts.every(o => Math.hypot(wrap(o[0], q[0]), wrap(o[1], q[1])) > 30)) { pts.push(q); k++; } }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const wx = x + Math.sin(y * TAU * 4 / N) * 5, wy = y + Math.sin(x * TAU * 3 / N) * 5; let f1 = 1e9, f2 = 1e9;
    for (const q of pts) { const d = Math.hypot(wrap(wx, q[0]), wrap(wy, q[1])); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
    const o = (y * N + x) * 4; img.data[o] = 235; img.data[o + 1] = 250; img.data[o + 2] = 255; img.data[o + 3] = Math.round(Math.max(0, 1 - (f2 - f1) / 9) ** 2.2 * 255);
  }
  g.putImageData(img, 0, 0);
  return c;
})();
let causticPat = null;
/**
 * A cup sunk in the floor, like on a golf green: a soft dip around it (where the slope pulls), then the
 * hole, its inner wall lit on the far side and dark in the depth.
 */
function drawCup(g, x, y, r, slope, rim) {
  const gr = g.createRadialGradient(x, y, r * 0.9, x, y, r + slope);
  gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.15)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r + slope, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 1;
  for (const f of [0.35, 0.7]) { g.beginPath(); g.arc(x, y, r + slope * f, 0, TAU); g.stroke(); }
  g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
  g.fillStyle = '#5c4c70'; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.fillStyle = '#000'; g.beginPath(); g.arc(x - r * 0.24, y - r * 0.24, r * 0.98, 0, TAU); g.fill();
  const deep = g.createRadialGradient(x - r * 0.15, y - r * 0.15, 0, x, y, r); deep.addColorStop(0, 'rgba(0,0,0,1)'); deep.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = deep; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
  g.strokeStyle = rim; g.lineWidth = Math.max(1.2, r * 0.12); g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
}
/** A spiral galaxy far away: a bright core, two arms of stars, and a haze. */
function drawSpiralGalaxy(g, x, y, R, tilt, rot) {
  const r = rngFrom(31);
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, tilt); g.globalCompositeOperation = 'lighter';
  const halo = g.createRadialGradient(0, 0, 0, 0, 0, R); halo.addColorStop(0, 'rgba(255,220,240,0.5)'); halo.addColorStop(0.25, 'rgba(176,123,255,0.18)'); halo.addColorStop(1, 'rgba(60,30,120,0)');
  g.fillStyle = halo; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
  for (let arm = 0; arm < 2; arm++) for (let k = 0; k < 260; k++) {
    const t = k / 260, th = t * 7 + arm * Math.PI, rad = R * 0.08 + R * 0.9 * t, j = (r() - 0.5) * R * 0.12 * (0.4 + t);
    const px = Math.cos(th) * rad + j, py = Math.sin(th) * rad + (r() - 0.5) * R * 0.12 * (0.4 + t);
    g.fillStyle = r() < 0.15 ? 'rgba(160,220,255,0.8)' : r() < 0.3 ? 'rgba(255,140,200,0.6)' : `rgba(255,255,255,${0.25 + r() * 0.5})`;
    g.beginPath(); g.arc(px, py, 0.4 + r() * 1.1, 0, TAU); g.fill();
  }
  const core = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.22); core.addColorStop(0, 'rgba(255,250,235,0.9)'); core.addColorStop(1, 'rgba(255,200,230,0)');
  g.fillStyle = core; g.beginPath(); g.arc(0, 0, R * 0.22, 0, TAU); g.fill();
  g.restore();
}
/**
 * Space bending into the black holes: a faint floor grid, flat everywhere except inside each hole's pull, where its
 * lines sink toward the middle (and show a little brighter, so you can see how far the pull reaches).
 */
function drawWarpGrid(g, st, cs) {
  const bend = (x, y) => {
    for (const w of st.wells) {
      const dx = w.x - x, dy = w.y - y, d = Math.hypot(dx, dy);
      if (d < w.R && d > 1e-6) { const pull = Math.min(d * 0.85, w.R * 0.5 * (1 - d / w.R) ** 2); return [x + dx / d * pull, y + dy / d * pull]; }
    }
    return [x, y];
  };
  const near = (x, y) => { let m = 9; for (const w of st.wells) m = Math.min(m, Math.hypot(w.x - x, w.y - y) / w.R); return m; };
  const P = [new Path2D(), new Path2D(), new Path2D()], step = 0.125;
  const seg = (x0, y0, x1, y1, fine) => { const u = near((x0 + x1) / 2, (y0 + y1) / 2); if (fine && u >= 1) return; const p = P[u < 0.6 ? 2 : u < 1 ? 1 : 0], a = bend(x0, y0), b = bend(x1, y1); p.moveTo(X(a[0]), Y(a[1])); p.lineTo(X(b[0]), Y(b[1])); };
  // lines every half cell everywhere, and twice as many inside a hole's pull, so the funnel shows as a round web
  for (let k = 1, a = 0.25; a < st.W - 0.01; a += 0.25, k++) for (let b = 0; b < st.H - 0.01; b += step) seg(a, b, a, Math.min(st.H, b + step), k % 2);
  for (let k = 1, b = 0.25; b < st.H - 0.01; b += 0.25, k++) for (let a = 0; a < st.W - 0.01; a += step) seg(a, b, Math.min(st.W, a + step), b, k % 2);
  g.lineWidth = 1; g.lineCap = 'round';
  [0.035, 0.13, 0.26].forEach((al, k) => { g.strokeStyle = `rgba(176,123,255,${al})`; g.stroke(P[k]); });
}

/* ---------- realistic bits, drawn each frame ---------- */
/**
 * A black hole seen from above: a pure black middle (the part that swallows you), a thin bright ring of light hugging
 * it, and glowing matter winding in around it: three rings of streaks that turn faster the closer they are, bright
 * knots in orbit, streaks dragged in from the edge of the pull, and a glow that slowly breathes. The floor sinks
 * toward it: the rings of the funnel shift a little as you tilt.
 */
function drawBlackHole(w) {
  const cs = L.cs, px = X(w.x), py = Y(w.y), r = w.r * cs, R = w.R * cs, D = r * 6, t = clock + w.x * 1.7, breath = 0.5 + 0.5 * Math.sin(t * 1.3);
  ctx.lineWidth = 1;
  for (let k = 0; k < 3; k++) { const dz = cs * 1.9 * (0.07 + 0.13 * k); ctx.strokeStyle = `rgba(176,123,255,${0.09 + 0.05 * k})`; ctx.beginPath(); ctx.arc(px - tilt.x * dz, py - tilt.y * dz, R * (0.8 - 0.2 * k), 0, TAU); ctx.stroke(); }
  glowAt(px, py, r * (2.9 + 0.4 * breath), '#ff9a3d', 0.16 + 0.1 * breath);   // (plain blending for the big pieces: additive over this much area is dear on phones)
  for (const s2 of HOLE_SWIRL) { ctx.save(); ctx.translate(px, py); ctx.rotate(t * s2.speed); ctx.drawImage(s2.c, -D / 2, -D / 2, D, D); ctx.restore(); }
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';   // matter torn from the edge of the pull, winding in faster and faster
  for (let j = 0; j < 12; j++) {
    const ph = (t * 0.22 + j / 12) % 1, at = q => { const rad = (R - r) * (1 - q) ** 1.3 + r * 0.95, a = j * 2.39 + q * q * 7 + t * 0.2; return [px + Math.cos(a) * rad, py + Math.sin(a) * rad]; };
    const p1 = at(ph), pm = at(Math.max(0, ph - 0.03)), p0 = at(Math.max(0, ph - 0.06));
    ctx.strokeStyle = j % 2 ? `rgba(255,190,120,${0.75 * Math.sin(ph * Math.PI) ** 0.6})` : `rgba(200,160,255,${0.7 * Math.sin(ph * Math.PI) ** 0.6})`; ctx.lineWidth = Math.max(1, cs * 0.03 * (0.5 + ph));
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(pm[0] * 2 - (p0[0] + p1[0]) / 2, pm[1] * 2 - (p0[1] + p1[1]) / 2, p1[0], p1[1]); ctx.stroke();
  }
  for (let j = 0; j < 5; j++) {   // bright knots in orbit: the nearer, the faster
    const rad = r * (1.22 + j * 0.3), a = t * 2.8 / (1 + j * 0.5) + j * 1.9;
    glowAt(px + Math.cos(a) * rad, py + Math.sin(a) * rad, r * (0.46 - j * 0.05), j % 2 ? '#ffd9a0' : '#ffffff', 0.9);
  }
  ctx.globalCompositeOperation = 'source-over';
  drawBlackHoleCore(w);
}
/** The black middle of a black hole and the ring of light hugging it. */
function drawBlackHoleCore(w) {
  const px = X(w.x), py = Y(w.y), r = w.r * L.cs, t = clock + w.x * 1.7, breath = 0.5 + 0.5 * Math.sin(t * 1.3);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px, py, r * 0.9, 0, TAU); ctx.fill();
  ctx.strokeStyle = `rgba(255,170,90,${0.3 + 0.2 * breath})`; ctx.lineWidth = r * 0.2; ctx.beginPath(); ctx.arc(px, py, r * 1.03, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,215,0.95)'; ctx.lineWidth = Math.max(1.2, r * 0.08); ctx.beginPath(); ctx.arc(px, py, r * 0.93, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.6, r * 0.13); ctx.beginPath(); ctx.arc(px, py, r * 0.93, t * 1.7, t * 1.7 + 1.2); ctx.stroke();   // a hot spot racing round the ring
}
/** A whirlpool: the dip is in the board; here the foam arms turn and the eye churns. */
function whirlSurface(w) {
  const cs = L.cs, px = X(w.x), py = Y(w.y), R = w.R * cs * 0.95, r = w.r * cs, tm = Math.min(1, Math.hypot(tilt.x, tilt.y) * 1.9), la = Math.atan2(tilt.y, tilt.x) + Math.PI;
  const spiral = (a, s2) => { const rad = R * (1 - s2) + r * s2, an = a + clock * 1.7 + s2 * 6.2 + s2 * s2 * 2; return [px + Math.cos(an) * rad, py + Math.sin(an) * rad]; };
  ctx.lineCap = 'round';
  for (let j = 0; j < 5; j++) { const rr = r + (R - r) * (j + 0.6) / 6, c = la + Math.sin(clock * 1.4 + j) * 0.25 + j * 0.22; ctx.strokeStyle = `rgba(255,255,255,${(0.08 + 0.5 * tm) * (1 - j / 7)})`; ctx.lineWidth = Math.max(1, cs * (0.05 - j * 0.006)); ctx.beginPath(); ctx.arc(px, py, rr, c - 0.5, c + 0.5); ctx.stroke(); }
  for (let a = 0; a < 3; a++) for (const [s0, s1, al] of [[0.08, 0.5, 0.22], [0.5, 1, 0.5]]) {
    ctx.beginPath(); for (let j = 0; j <= 14; j++) { const [x, y] = spiral(a * TAU / 3, s0 + (s1 - s0) * j / 14); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = `rgba(230,248,255,${al})`; ctx.lineWidth = Math.max(1.2, cs * 0.045); ctx.stroke();
  }
  ctx.fillStyle = '#f5fcff';
  for (let j = 0; j < 18; j++) { const s2 = (j * 0.618 + clock * (0.07 + (j % 5) * 0.012)) % 1, [x, y] = spiral(j * 2.4, s2); ctx.globalAlpha = Math.sin(s2 * Math.PI) * 0.85; ctx.beginPath(); ctx.arc(x, y, Math.max(1, cs * (0.025 + 0.035 * s2)), 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
/** The eye of a whirlpool (its foam and light are drawn with the rest of the water's surface). */
function drawWhirlpool(w) {
  const px = X(w.x), py = Y(w.y), r = w.r * L.cs;
  ctx.fillStyle = '#000814'; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(220,248,255,0.7)'; ctx.lineWidth = Math.max(1.2, r * 0.14);
  const a0 = clock * 5; ctx.beginPath(); ctx.arc(px, py, r * 1.05, a0, a0 + 4.2); ctx.stroke();
}
/** Light dancing on the bottom of the pool, two layers drifting apart. */
const causticTiles = new Map();
/** The net of light, already scaled to the screen's own pixels (a pattern that only has to slide is much cheaper to fill than one that is also scaled). */
function causticTile(n, a) {
  let pat = causticTiles.get(n + a);
  if (!pat) { if (causticTiles.size > 6) causticTiles.clear(); const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); g.globalAlpha = a; g.drawImage(CAUSTICS, 0, 0, n, n); pat = ctx.createPattern(c, 'repeat'); causticTiles.set(n + a, pat); }
  return pat;
}
function drawCaustics(st) {
  const cs = L.cs, dpr = L.DPR, x0 = X(0), y0 = Y(0), w = st.W * cs, h = st.H * cs, sc = cs / 92;   // cells of light about a fifth of a lane wide
  ctx.save(); stepClip(x0, y0, w, h, 0.7 * cs);   // laid on plainly (adding light pixel by pixel cost eight times as much, for a look you could not tell apart); the banks are painted over it afterwards
  for (const [sx, vx, vy, a, k] of [[sc, 9, 5, 0.17, 0.6], [sc * 1.45, -6, 7, 0.1, 0.9]]) {
    const n = Math.max(32, Math.round(256 * sx * dpr)), ox = Math.round(((((clock * vx - tilt.x * 34 * k) * dpr) % n) + n) % n), oy = Math.round(((((clock * vy - tilt.y * 34 * k) * dpr) % n) + n) % n);
    ctx.fillStyle = causticTile(n, a);
    ctx.setTransform(1, 0, 0, 1, Math.round(x0 * dpr) + ox, Math.round(y0 * dpr) + oy); ctx.fillRect(-ox - n, -oy - n, w * dpr + 2 * n, h * dpr + 2 * n);
  }
  ctx.restore();
}
/* ---------- v8: river, lava, neon orb, fire trail, current in the circuits, checkpoints ---------- */
/** The neon marble: a glossy magenta orb that glows from inside (drawn once). */
const NEON_BALL = (() => {
  const N = 96, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), m = N / 2, gr = g.createRadialGradient(m - 12, m - 14, 2, m, m, m);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.2, '#d6f1ff'); gr.addColorStop(0.55, '#5bb8f5'); gr.addColorStop(0.88, '#1f5fa8'); gr.addColorStop(1, '#0c2d5e');   // the sky marble
  g.fillStyle = gr; g.beginPath(); g.arc(m, m, m, 0, TAU); g.fill();
  return c;
})();
/** Molten veins: bright wavy threads on nothing, seamless, to slide over the lava. */
const LAVA_VEINS = (() => {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), r = rngFrom(19); g.lineCap = 'round';
  for (let k = 0; k < 14; k++) {   // meandering threads (a smooth random walk), drawn in all nine tiles so they wrap
    const pts = []; let x = r() * N, y = r() * N, a = r() * TAU;
    for (let j = 0; j < 14; j++) { pts.push([x, y]); a += (r() - 0.5) * 1.1; x += Math.cos(a) * 6; y += Math.sin(a) * 6; }
    for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) {
      g.beginPath(); pts.forEach(([px, py], j) => (j ? g.lineTo(px + dx, py + dy) : g.moveTo(px + dx, py + dy)));
      g.strokeStyle = 'rgba(255,200,90,0.16)'; g.lineWidth = 6; g.stroke();
      g.strokeStyle = 'rgba(255,240,180,0.45)'; g.lineWidth = 1.3; g.stroke();
    }
  }
  return c;
})();
/** Cooling crust: dark plates with open cracks between them, seamless, drifting slowly over the molten rock. */
const LAVA_CRUST = (() => {
  const N = 160, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), r = rngFrom(23);
  for (let k = 0; k < 11; k++) {
    const cx = r() * N, cy = r() * N, rad = 12 + r() * 16, n = 6 + Math.floor(r() * 3), pts = [];
    for (let j = 0; j < n * 2; j++) { const a = j / (n * 2) * TAU + r() * 0.25, rr = rad * (0.65 + r() * 0.45); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) {
      g.beginPath(); pts.forEach(([x, y], j) => (j ? g.lineTo(cx + dx + x, cy + dy + y) : g.moveTo(cx + dx + x, cy + dy + y))); g.closePath();
      g.fillStyle = 'rgba(38,6,2,0.72)'; g.fill(); g.strokeStyle = 'rgba(255,150,50,0.4)'; g.lineWidth = 1.2; g.stroke();
    }
  }
  return c;
})();
let veinPat = null, crustPat = null;
const bubbles = [];
/** The shore of the lava as closed lines (stage units), pool by pool: where the distance grid crosses zero. */
function lavaContours(st) {
  const ST = LAVA_ST, nx = Math.round(st.W / ST) + 3, ny = Math.round(st.H / ST) + 3, v = new Float32Array(nx * ny).fill(0.04), lab = new Int32Array(nx * ny);
  for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) v[j * nx + i] = lavaDist(st.lava, (i - 1) * ST, (j - 1) * ST);   // one point of rock all round, so every shore closes
  let np = 0; const stack = [];
  for (let k0 = 0; k0 < v.length; k0++) if (v[k0] < 0 && !lab[k0]) { lab[k0] = ++np; stack.push(k0); while (stack.length) { const c = stack.pop(); for (const o of [c - 1, c + 1, c - nx, c + nx]) if (v[o] < 0 && !lab[o]) { lab[o] = np; stack.push(o); } } }
  const pt = new Map(), link = (e1, p1, e2, p2, pool) => { for (const [e, p, o] of [[e1, p1, e2], [e2, p2, e1]]) { let q = pt.get(e); if (!q) pt.set(e, q = { x: p[0], y: p[1], nb: [], pool }); q.nb.push(o); } };
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const k = j * nx + i, a = v[k], b = v[k + 1], c = v[k + nx + 1], d = v[k + nx], code = (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0);
    if (code === 0 || code === 15) continue;
    const T = () => [2 * k, [i + a / (a - b), j]], R = () => [2 * (k + 1) + 1, [i + 1, j + b / (b - c)]], B = () => [2 * (k + nx), [i + d / (d - c), j + 1]], Lf = () => [2 * k + 1, [i, j + a / (a - d)]];
    const corner = [k, k + 1, k + nx + 1, k + nx];
    for (const [e1, e2, cn] of { 1: [[Lf, T, 0]], 2: [[T, R, 1]], 3: [[Lf, R, 0]], 4: [[R, B, 2]], 5: [[Lf, T, 0], [R, B, 2]], 6: [[T, B, 1]], 7: [[Lf, B, 0]], 8: [[B, Lf, 3]], 9: [[T, B, 0]], 10: [[T, R, 1], [B, Lf, 3]], 11: [[R, B, 0]], 12: [[Lf, R, 2]], 13: [[T, R, 0]], 14: [[Lf, T, 1]] }[code]) { const p = e1(), q = e2(); link(p[0], p[1], q[0], q[1], lab[corner[cn]]); }
  }
  const pools = Array.from({ length: np }, () => ({ loops: [], box: [1e9, 1e9, -1e9, -1e9], per: 0 })), seen = new Set();
  for (const [e0, q0] of pt) {
    if (seen.has(e0) || q0.nb.length !== 2) continue;
    const loop = [], P = pools[q0.pool - 1]; let prev = -1, cur = e0;
    for (let guard = 0; guard < 1e5; guard++) { const q = pt.get(cur); seen.add(cur); const x = (q.x - 1) * ST, y = (q.y - 1) * ST; if (loop.length) P.per += Math.hypot(x - loop[loop.length - 1][0], y - loop[loop.length - 1][1]); loop.push([x, y]); P.box[0] = Math.min(P.box[0], x); P.box[1] = Math.min(P.box[1], y); P.box[2] = Math.max(P.box[2], x); P.box[3] = Math.max(P.box[3], y); const nxt = q.nb[0] !== prev ? q.nb[0] : q.nb[1]; prev = cur; cur = nxt; if (cur === e0) break; }
    if (loop.length >= 3) P.loops.push(loop);
  }
  return { pools: pools.filter(p => p.loops.length), v, nx, ny };
}
let basaltPat = null, basaltFor = null;
/** Cooled basalt, as a tile made once: gentle folds lit from one side, and a fine grain. */
function basaltTile() {
  const N = 256, c = document.createElement('canvas'), g = c.getContext('2d'), im = g.createImageData(N, N), r = rngFrom(41), t = [], e = new Float32Array(N * N), k = TAU / N; c.width = c.height = N;
  for (let j = 0; j < 7; j++) t.push([3 + Math.floor(r() * 7), Math.floor(r() * 17) - 8, r() * TAU, 1 + Math.floor(r() * 3), Math.floor(r() * 7) - 3, r() * TAU, 0.5 + r()]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (const [a, b, p, c2, d2, q, amp] of t) s += amp * Math.sin((a * x + b * y) * k + p + 1.6 * Math.sin((c2 * x + d2 * y) * k + q)); e[y * N + x] = s; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const slope = (e[y * N + (x + N - 1) % N] - e[y * N + (x + 1) % N]) * 0.6 + (e[((y + N - 1) % N) * N + x] - e[((y + 1) % N) * N + x]) * 0.7, m = 1 + 0.3 * slope + 0.09 * (r() - 0.5), o = (y * N + x) * 4;
    im.data[o] = 54 * m; im.data[o + 1] = 43 * m; im.data[o + 2] = 39 * m; im.data[o + 3] = 255;
  }
  g.putImageData(im, 0, 0); return c;
}
/**
 * The still part of the volcano board: a floor of basalt you can see, scorched and lit orange where it meets the lava; the lava
 * itself, bright at one end of each pool and deep red at the other; a soft dark rim just inside the shore; crust floating by it.
 */
function renderLava(st, g) {
  const cs = L.cs, C = lavaContours(st), ST = LAVA_ST, r0 = rngFrom(21 + st.i);
  if (!basaltPat || basaltFor !== g) { basaltPat = g.createPattern(basaltTile(), 'repeat'); basaltFor = g; }
  g.fillStyle = basaltPat; g.fillRect(X(0) - 8, Y(0) - 8, st.W * cs + 16, st.H * cs + 16);
  for (let k = 0; k < 12; k++) { const x = X(r0() * st.W), y = Y(r0() * st.H), rr = cs * (1.3 + r0() * 1.6), gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }   // big soft unevenness
  g.lineCap = 'round';
  for (let k = 0; k < 14; k++) {   // a few cracks, still glowing
    let x = X(r0() * st.W), y = Y(r0() * st.H); g.beginPath(); g.moveTo(x, y);
    for (let j = 0; j < 5; j++) { x += (r0() - 0.5) * cs * 1.2; y += (r0() - 0.5) * cs * 1.2; g.lineTo(x, y); }
    g.strokeStyle = 'rgba(255,90,20,0.08)'; g.lineWidth = 4; g.stroke(); g.strokeStyle = 'rgba(255,170,60,0.16)'; g.lineWidth = 1; g.stroke();
  }
  // the pools
  st.lavaAll = new Path2D();
  st.lavaPaths = C.pools.map(p => { const path = new Path2D(); for (const loop of p.loops) { loop.forEach(([x, y], j) => (j ? path.lineTo(X(x), Y(y)) : path.moveTo(X(x), Y(y)))); path.closePath(); } st.lavaAll.addPath(path); return path; });
  C.pools.forEach((p, n) => {
    const x = X(p.box[0]), y = Y(p.box[1]), w = (p.box[2] - p.box[0]) * cs, h = (p.box[3] - p.box[1]) * cs, lg = g.createLinearGradient(x, y, x + w * 0.4, y + h);
    lg.addColorStop(0, '#ff8a1a'); lg.addColorStop(0.5, '#e8460a'); lg.addColorStop(1, '#b52a06');
    g.fillStyle = lg; g.fill(st.lavaPaths[n], 'evenodd');
  });
  // light and shade that follow the shore, straight from the distances: scorched rock and a dim rim inside the lava; then the lava's glow on the rock
  const shade = document.createElement('canvas'), light = document.createElement('canvas'); shade.width = light.width = C.nx; shade.height = light.height = C.ny;
  const sg = shade.getContext('2d'), lg2 = light.getContext('2d'), si = sg.createImageData(C.nx, C.ny), li = lg2.createImageData(C.nx, C.ny);
  for (let k = 0; k < C.v.length; k++) {
    const d = C.v[k], o = k * 4;
    if (d >= 0) { si.data[o + 3] = 255 * 0.5 * Math.exp(-d / 0.3); li.data[o] = 255; li.data[o + 1] = 96; li.data[o + 2] = 24; li.data[o + 3] = 255 * (0.42 * Math.exp(-d / 0.2) + 0.17 * Math.exp(-d / 0.8)); }
    else { si.data[o] = 40; si.data[o + 1] = 8; si.data[o + 2] = 3; si.data[o + 3] = 255 * 0.6 * Math.exp(d / 0.07); li.data[o] = 255; li.data[o + 1] = 96; li.data[o + 2] = 24; li.data[o + 3] = 255 * 0.59 * Math.exp(d / 0.05); }
  }
  sg.putImageData(si, 0, 0); lg2.putImageData(li, 0, 0);
  const ix = X(-1.5 * ST), iy = Y(-1.5 * ST), iw = C.nx * ST * cs, ih = C.ny * ST * cs;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(shade, ix, iy, iw, ih); g.globalCompositeOperation = 'lighter'; g.drawImage(light, ix, iy, iw, ih); g.globalCompositeOperation = 'source-over';
  // crust floating near the shore: dark irregular blobs, some half-sunk
  C.pools.forEach((p, n) => {
    const r = rngFrom(97 + n * 13), pts = [].concat(...p.loops), D = (x, y) => lavaDist(st.lava, x, y);
    g.save(); g.clip(st.lavaPaths[n], 'evenodd');
    for (let k = 0; k < p.per * 2.2; k++) {
      const [px, py] = pts[Math.floor(r() * pts.length)], gx = D(px + 0.06, py) - D(px - 0.06, py), gy = D(px, py + 0.06) - D(px, py - 0.06), gl = Math.hypot(gx, gy), inset = 0.05 + r() * 0.22, rr = cs * (0.06 + r() * 0.14), a1 = 1 + r(), a2 = r() * 3, a3 = r(), a4 = r(), a5 = r();
      if (gl < 0.02) continue;
      g.fillStyle = `rgba(${40 + a3 * 30 | 0},${8 + a4 * 10 | 0},4,${0.35 + a5 * 0.4})`; g.beginPath(); g.ellipse(X(px - gx / gl * inset), Y(py - gy / gl * inset), rr * a1, rr, a2, 0, TAU); g.fill();
    }
    g.restore();
  });
  st.lavaClip = null;
  st.embers = []; { const r = rngFrom(123 + st.i); for (let k = 0; k < 600 && st.embers.length < 22; k++) { const x = r() * st.W, y = r() * st.H; if (lavaDist(st.lava, x, y) < -0.2) st.embers.push({ x, y, ph: r(), v: 0.16 + r() * 0.2, a: r() * TAU, s: 0.8 + r() * 1.1 }); } }
}
/** Where the lava is, as one-pixel-high strips in screen pixels: a clip made only of plain rectangles (a curved clip costs many times more). */
function lavaSpans(st, dpr) {
  const cs = L.cs, path = new Path2D(), x0 = Math.floor(X(0) * dpr), x1 = Math.ceil(X(st.W) * dpr), y0 = Math.floor(Y(0) * dpr), y1 = Math.ceil(Y(st.H) * dpr), STEP = 4, IN = -0.03;
  const D = (x, y) => { const qx = Math.max(Math.abs(x - st.W / 2) - (st.W / 2 - 0.7), 0), qy = Math.max(Math.abs(y - st.H / 2) - (st.H / 2 - 0.7), 0); return Math.max(lavaDist(st.lava, x, y) - IN, Math.hypot(qx, qy) - 0.58); };   // lava, and inside the frame's rounded corners
  for (let py = y0; py < y1; py++) {
    const yc = ((py + 0.5) / dpr - L.oy) / cs; let prev = D((x0 / dpr - L.ox) / cs, yc), start = prev < 0 ? x0 : -1;
    for (let px = x0 + STEP; ; px += STEP) {
      const end = px >= x1, qx = end ? x1 : px, cur = D((qx / dpr - L.ox) / cs, yc);
      if ((cur < 0) !== (prev < 0)) { const cross = Math.round(qx - (qx - (px - STEP)) * cur / (cur - prev)); if (cur < 0) start = cross; else { if (cross > start) path.rect(start, py, cross - start, 1); start = -1; } }
      if (end) { if (start >= 0 && x1 > start) path.rect(start, py, x1 - start, 1); break; }
      prev = cur;
    }
  }
  return path;
}
let lavaTiles = null;
/** A lava texture redrawn once at the screen's device-pixel size, as a repeating pattern that never has to be scaled. */
function lavaTile(src, dpr, tint, lift) {
  const n = Math.max(16, Math.round(src.width * dpr)), c = document.createElement('canvas'), g = c.getContext('2d'); c.width = c.height = n; if (tint) { g.fillStyle = tint; g.fillRect(0, 0, n, n); } g.drawImage(src, 0, 0, n, n);
  if (lift) { const im = g.getImageData(0, 0, n, n), d = im.data; for (let i = 0; i < d.length; i += 4) { d[i] = Math.min(255, d[i] + lift[0]); d[i + 1] = Math.min(255, d[i + 1] + lift[1]); d[i + 2] = Math.min(255, d[i + 2] + lift[2]); } g.putImageData(im, 0, 0); }   // for drawing over the lava instead of adding to it (adding light costs several times more)
  return { n, pat: ctx.createPattern(c, 'repeat') };
}
/** Lava: molten orange underneath, bright veins flowing one way, dark crust drifting the other, bubbles that swell and pop. */
function drawLava(st) {
  if (!veinPat) { veinPat = ctx.createPattern(LAVA_VEINS, 'repeat'); crustPat = ctx.createPattern(LAVA_CRUST, 'repeat'); }
  const cs = L.cs, glow = 0.5 + 0.5 * Math.sin(clock * 1.8);
  // The same three layers as ever (veins one way, veins another, crust drifting back) and the slow pulse, but cheap: the tiles are
  // built once at the screen's own pixel size, so they are never scaled; they slide by whole pixels; and they are clipped to plain
  // rectangles that sit just inside each pool's ragged outline (a path clip made every fill cost as much as the whole board).
  if (st.lavaPaths) {
    const dpr = L.DPR, m = ctx.getTransform();
    if (!lavaTiles || lavaTiles.dpr !== dpr) lavaTiles = { dpr, veinGlow: lavaTile(LAVA_VEINS, dpr, 'rgba(255,122,26,0.3)'), vein: lavaTile(LAVA_VEINS, dpr, null, [225, 80, 13]), crust: lavaTile(LAVA_CRUST, dpr) };   // the first has the pulse's orange in it
    const x0 = Math.floor(m.a * (X(0) - 8) + m.e), y0 = Math.floor(m.d * (Y(0) - 8) + m.f), w = Math.ceil(m.a * (st.W * cs + 16)), h = Math.ceil(m.d * (st.H * cs + 16));
    ctx.save();
    if (m.a === dpr && m.d === dpr && !m.e && !m.f) {   // the board at rest: clip to the strips, in screen pixels
      const key = dpr + '|' + L.ox + '|' + L.oy + '|' + cs; if (!st.lavaClip || st.lavaClip.key !== key) { st.lavaClip = lavaSpans(st, dpr); st.lavaClip.key = key; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clip(st.lavaClip);
    } else {   // while a new stage zooms in: the plain outline, inside the frame's rounded corners (slow, but only for a moment)
      roundRect(ctx, X(0), Y(0), st.W * cs, st.H * cs, 0.7 * cs); ctx.clip(); ctx.clip(st.lavaAll, 'evenodd');
    }
    for (const [tile, vx, vy, a, op] of [[lavaTiles.veinGlow, 7, 2, 0.4 + 0.4 * glow, 'lighter'], [lavaTiles.vein, -4, 5, 0.3, 'source-over'], [lavaTiles.crust, 2.5, -1.5, 0.85, 'source-over']]) {   // the slow pulse (orange at 0.12 to 0.24) rides on the first layer instead of costing a fill of its own
      const n = tile.n, ox = Math.round((((clock * vx * dpr) % n) + n) % n), oy = Math.round((((clock * vy * dpr) % n) + n) % n);
      ctx.globalCompositeOperation = op; ctx.globalAlpha = a; ctx.fillStyle = tile.pat; ctx.setTransform(1, 0, 0, 1, ox, oy); ctx.fillRect(x0 - ox, y0 - oy, w, h);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  if (st.embers) {   // sparks rising off the lava: the higher they are, the more they slide when you tilt
    ctx.globalCompositeOperation = 'lighter';
    for (const e of st.embers) { const ph = (e.ph + clock * e.v) % 1, z = ph * cs * 1.7, x = X(e.x) + Math.sin(clock * 1.3 + e.a + ph * 5) * cs * 0.13 + tilt.x * z * 0.5, y = Y(e.y) - z * 0.45 + tilt.y * z * 0.5; ctx.fillStyle = `rgba(255,${150 + 80 * (1 - ph) | 0},60,${Math.sin(ph * Math.PI) * 0.9})`; ctx.beginPath(); ctx.arc(x, y, e.s * (1 - ph * 0.5), 0, TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
  }
  // bubbles: swell, then pop into a few sparks
  if (Math.random() < 0.3 && bubbles.length < 10 && st.lava) { const v = st.voids[Math.floor(Math.random() * st.voids.length)], bx = v[0] + Math.random() * v[2], by = v[1] + Math.random() * v[3]; if (lavaDist(st.lava, bx, by) < -0.25 && bx > 0.4 && by > 0.4 && bx < st.W - 0.4 && by < st.H - 0.4) bubbles.push({ x: bx, y: by, t: 0, life: 0.8 + Math.random() * 0.8, r: 0.08 + Math.random() * 0.12 }); }
  ctx.globalCompositeOperation = 'lighter';
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]; b.t += 1 / 60;
    if (b.t >= b.life) { bubbles.splice(i, 1); for (let k = 0; k < 5 && parts.length < MAX_PARTS; k++) { const a = Math.random() * TAU; parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2 - 0.5, life: 0.4, t: 0, color: '#ffd27a', dust: true }); } continue; }
    const k = b.t / b.life, R = b.r * cs * (0.4 + k);
    ctx.strokeStyle = `rgba(255,240,180,${0.3 + 0.5 * k})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), R, 0, TAU); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}
let mtn = null;
const MT_RC = 0.26, MT_RIM = Math.pow(1 - MT_RC, 1.5);
const mtRidge = (th, q) => (0.75 + 0.3 * Math.sin(th * 2 + 0.5)) * (0.46 * Math.sin(th * 5 + 1.3 + q * 1.5 + 0.5 * Math.sin(th * 3)) + 0.3 * Math.sin(th * 8 + 0.4 - q * 2.2) + 0.2 * Math.sin(th * 13 + 2.1 + q * 3) + 0.14 * Math.sin(th * 23 + q * 5));
/** How high the mountain is at (dx, dy) from its middle, MR being its foot radius: 0 at the foot, a rim round a bowl at the top, gullies down the flanks. */
function mtHeight(dx, dy, MR) {
  const th = Math.atan2(dy, dx), q = Math.hypot(dx, dy) / MR / (1 + 0.1 * mtRidge(th, 1)), u = 54 / MR;
  if (q >= 1) return 0;
  const gul = 0.11 * mtRidge(th, q) * Math.sin(Math.PI * Math.min(1, q * 1.25)) * (0.3 + 0.7 * q);
  return (q < MT_RC ? MT_RIM - 0.26 * (1 - (q / MT_RC) ** 2) : Math.pow(1 - q, 1.5)) + gul + 0.05 * Math.exp(-(((q - MT_RC) / 0.05) ** 2)) + 0.028 * Math.sin(dx * u * 0.21 + 1.3 * Math.sin(dy * u * 0.17)) * Math.sin(dy * u * 0.19 + 1.1 * Math.sin(dx * u * 0.13)) * Math.min(1, (1 - q) * 4);
}
/** The mountain, made once per size: lit from the upper left, glowing where its foot stands in the lava; cut into a base and five round slices; and the lines its lava streams follow. */
function mountainSprite(MR, k) {
  const S = Math.ceil(MR * 2.5), c = document.createElement('canvas'), g = c.getContext('2d'), im = g.createImageData(S, S), hs = new Float32Array((S + 2) * (S + 2)), K = MR * 1.25, r = rngFrom(77); c.width = c.height = S;
  for (let j = 0; j < S + 2; j++) for (let i = 0; i < S + 2; i++) hs[j * (S + 2) + i] = mtHeight(i - 1 - S / 2, j - 1 - S / 2, MR);
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }, Ld = nrm([-0.5, -0.62, 0.6]), Bd = nrm([0.5, 0.55, 0.22]);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = i - S / 2, dy = j - S / 2, th = Math.atan2(dy, dx), q = Math.hypot(dx, dy) / MR / (1 + 0.1 * mtRidge(th, 1)), o = (j * S + i) * 4, hk = (j + 1) * (S + 2) + i + 1;
    if (q >= 1.02) continue;
    const h = hs[hk], n = nrm([-(hs[hk + 1] - hs[hk - 1]) / 2 * K, -(hs[hk + S + 2] - hs[hk - S - 2]) / 2 * K, 1]);
    const dif = Math.max(0, n[0] * Ld[0] + n[1] * Ld[1] + n[2] * Ld[2]), bnc = Math.max(0, n[0] * Bd[0] + n[1] * Bd[1] + n[2] * Bd[2]) * 0.2 + (q > 0.74 ? ((q - 0.74) / 0.26) ** 2 * 0.5 : 0) + (q < MT_RC ? (1 - q / MT_RC) * 0.5 : 0);
    const t = Math.min(1, h / 0.62), mot = 0.95 + 0.1 * r();
    im.data[o] = Math.min(255, (34 + 62 * t) * mot * (0.22 + 1.2 * dif) * 1.5 + 255 * bnc); im.data[o + 1] = Math.min(255, (27 + 55 * t) * mot * (0.19 + 1.02 * dif) * 1.5 + 255 * bnc * 0.38); im.data[o + 2] = Math.min(255, (25 + 47 * t) * mot * (0.19 + 0.86 * dif) * 1.5 + 255 * bnc * 0.1);
    im.data[o + 3] = 255 * (1 - Math.max(0, Math.min(1, (q - 0.94) / 0.06)) ** 2 * (3 - 2 * Math.max(0, Math.min(1, (q - 0.94) / 0.06))));
  }
  g.putImageData(im, 0, 0);
  const N = Math.ceil(S * k / 2), base = document.createElement('canvas'), bg2 = base.getContext('2d'); base.width = base.height = N * 2;
  { const sh = bg2.createRadialGradient(N, N, 0, N, N, N); sh.addColorStop(0, 'rgba(0,0,0,0.8)'); sh.addColorStop(0.72, 'rgba(0,0,0,0.6)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); bg2.fillStyle = sh; bg2.fillRect(0, 0, N * 2, N * 2); }   // the cooled apron it stands on
  bg2.imageSmoothingQuality = 'high'; bg2.drawImage(c, N - S * k / 2, N - S * k / 2, S * k, S * k);
  const slices = [];
  for (let n = 1; n <= 5; n++) {
    const hk = n / 6 * MT_RIM, rr = Math.ceil((1 - Math.pow(hk, 1 / 1.5)) * MR * 1.04 * k), sc = document.createElement('canvas'), sg = sc.getContext('2d'); sc.width = sc.height = rr * 2;
    sg.beginPath(); sg.arc(rr, rr, rr, 0, TAU); sg.clip(); sg.drawImage(c, rr - S * k / 2, rr - S * k / 2, S * k, S * k); slices.push({ c: sc, r: rr, h: hk });
  }
  // streams: follow the bottom of a gully from the rim to the foot
  const mins = []; for (let a = 0; a < 360; a++) { const th = a / 360 * TAU, f = mtRidge(th, 0.5); if (f < mtRidge(th - 0.03, 0.5) && f < mtRidge(th + 0.03, 0.5)) mins.push([f, th]); }
  mins.sort((a, b) => a[0] - b[0]); const pick = []; for (const [, th] of mins) if (pick.length < 3 && pick.every(p => Math.abs(Math.atan2(Math.sin(p - th), Math.cos(p - th))) > 1.3)) pick.push(th);
  const streams = pick.map(th0 => {
    const pts = []; let th = th0;
    const trace = (q0, q1, st) => { th = th0; for (let q = q0; st > 0 ? q <= q1 : q >= q1; q += st) { let bt = th, bf = 1e9; for (let d = -0.05; d <= 0.0501; d += 0.005) { const f = mtRidge(th + d, q); if (f < bf) { bf = f; bt = th + d; } } th = bt; const rr = q * MR * (1 + 0.1 * mtRidge(th, 1)), p = [Math.cos(th) * rr, Math.sin(th) * rr, Math.pow(1 - Math.min(1, q), 1.5)]; if (st > 0) pts.push(p); else pts.unshift(p); } };
    trace(0.5, 1.08, 0.025); trace(0.475, MT_RC, -0.025);
    for (let it = 0; it < 6; it++) for (let i = 1; i < pts.length - 1; i++) { pts[i][0] = (pts[i - 1][0] + 2 * pts[i][0] + pts[i + 1][0]) / 4; pts[i][1] = (pts[i - 1][1] + 2 * pts[i][1] + pts[i + 1][1]) / 4; }
    return pts;
  });
  return { MR, k, N, base, slices, streams };
}
const flameSprites = new Map();
let coneSprite = null;
/** A soft dot of fire: the glow sprite redrawn once per size (in steps of two screen pixels) and laid down unscaled on whole pixels. */
function flameDot(x, y, r, color, alpha) {
  const m = ctx.getTransform(), R = Math.max(2, Math.round(r * m.a / 2) * 2), key = color + R; let c = flameSprites.get(key);
  if (!c) { c = document.createElement('canvas'); c.width = c.height = R * 2; c.getContext('2d').drawImage(glowSprite(color), 0, 0, R * 2, R * 2); flameSprites.set(key, c); }
  const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c, Math.round(m.a * x + m.e) - R, Math.round(m.d * y + m.f) - R); ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f); ctx.globalAlpha = a;
}
/** The fire marble's trail: little flames left where it rolled, fading from yellow to red. More speed, more fire. */
function shedFire(speed) {
  const n = Math.min(1, speed * 0.25);
  for (let k = 0; k < n && parts.length < MAX_PARTS; k++) {
    if (Math.random() > n - k) break;
    parts.push({ x: S.x + (Math.random() - 0.5) * BALL_R, y: S.y + (Math.random() - 0.5) * BALL_R, vx: (Math.random() - 0.5) * 0.3, vy: -0.25 - Math.random() * 0.3, life: 0.45 + Math.random() * 0.35, t: 0, color: '#ff7a1a', flame: true, size: 0.75 + Math.random() * 0.5 });
  }
}
/** Current through the circuits: short bright pulses sliding along the traces, thin, like a signal. */
function drawPulses(st) {
  if (!st.traces) return;
  if (!st.traceLen) st.traceLen = st.traces.map(tr => { let l = 0; for (let k = 1; k < tr.length; k++) l += Math.hypot(tr[k][0] - tr[k - 1][0], tr[k][1] - tr[k - 1][1]); return l; });
  const along = (tr, s) => { for (let k = 1; k < tr.length; k++) { const l = Math.hypot(tr[k][0] - tr[k - 1][0], tr[k][1] - tr[k - 1][1]); if (s <= l) { const f = s / l; return [tr[k - 1][0] + (tr[k][0] - tr[k - 1][0]) * f, tr[k - 1][1] + (tr[k][1] - tr[k - 1][1]) * f]; } s -= l; } return tr[tr.length - 1]; };
  const path = new Path2D();
  st.traces.forEach((tr, k) => {
    const len = st.traceLen[k], head = (clock * 1.8 + k * 0.61 * len) % (len + 1.5);
    if (head > len + 0.5) return;
    const a = Math.max(0, head - 0.5), b = Math.min(len, head), n = 5;
    for (let j = 0; j <= n; j++) { const [x, y] = along(tr, a + (b - a) * j / n); j ? path.lineTo(X(x), Y(y)) : path.moveTo(X(x), Y(y)); }
  });
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'miter';
  ctx.strokeStyle = 'rgba(79,216,255,0.22)'; ctx.lineWidth = 3; ctx.stroke(path);
  ctx.strokeStyle = 'rgba(210,250,255,0.85)'; ctx.lineWidth = 1.1; ctx.stroke(path);
  ctx.globalCompositeOperation = 'source-over';
}
/** A point along the river's centre line (s from the start), pushed `o` across it. */
function riverAt(R, s, o) {
  const pts = R.pts, cum = R.cum;
  let k = 1; while (k < pts.length - 1 && cum[k] < s) k++;
  const [x1, y1] = pts[k - 1], [x2, y2] = pts[k], l = cum[k] - cum[k - 1] || 1, f = Math.max(0, Math.min(1, (s - cum[k - 1]) / l));
  const nx = -(y2 - y1) / l, ny = (x2 - x1) / l;
  return [x1 + (x2 - x1) * f + nx * o, y1 + (y2 - y1) * f + ny * o];
}
const riverPath = (g, R) => { g.beginPath(); R.poly.forEach(([x, y], k) => (k ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.closePath(); };
/*
 * The current, drawn: a couple of hundred drops ride the real flow (along the river in each zone's direction,
 * round the whirlpools and into them, and over the waterfalls) and leave fading streaks on their own layer.
 */
function spawnDrop(R, p, len) {
  const s0 = Math.random() * len; let k = 1; while (k < R.pts.length - 1 && R.cum[k] < s0) k++;
  const hw = R.hws ? R.hws[k - 1] : R.hw, [x, y] = riverAt(R, s0, (Math.random() - 0.5) * 1.7 * hw);
  p.x = x; p.y = y; p.k = k - 1; p.v = 0.7 + Math.random() * 0.7; p.w = 0.7 + Math.random() * 0.9; p.age = 0; p.life = 2.5 + Math.random() * 4; p.tr = [x, y]; return p;
}
function drawRiverFlow(st, dt) {
  const R = st.river; if (!R) return;
  const len = R.cum[R.cum.length - 1], cs = L.cs, last = R.pts.length - 2;
  if (!R.drops) { R.drops = []; for (let k = 0, n = Math.min(260, Math.round(len * 5.5)); k < n; k++) R.drops.push(spawnDrop(R, {}, len)); }
  // Each drop remembers where it has been (eight points, one every third frame) and its streak is drawn straight onto the board,
  // older parts fainter. (It used to fade on a layer of its own; wiping and laying that layer over the board cost more than all the rest of the river.)
  R.tick = (R.tick || 0) + 1; const keep = R.tick % 3 === 0, paths = [0, 1, 2].map(() => [new Path2D(), new Path2D(), new Path2D()]);
  dt = Math.min(dt, 0.05);
  for (const p of R.drops) {
    const k = p.k, a = R.pts[k], b = R.pts[k + 1], l = (R.cum[k + 1] - R.cum[k]) || 1, z = riverZone(R, R.cum[k]), sp = z[2] * z[3] * 0.5 * p.v;
    let vx = (b[0] - a[0]) / l * sp, vy = (b[1] - a[1]) / l * sp, look = 0, dead = false;
    for (const w of st.wells) { const dx = p.x - w.x, dy = p.y - w.y, d = Math.hypot(dx, dy) || 1e-6, rr = w.R * 1.3; if (d < rr) { const kk = 1 - d / rr, s2 = 3.4 * kk * kk + 0.4 * kk; vx = vx * (1 - 0.6 * kk) - dy / d * s2 - dx / d * s2 * 0.5; vy = vy * (1 - 0.6 * kk) + dx / d * s2 - dy / d * s2 * 0.5; look = 1; if (d < w.r) dead = true; } }
    for (const f of st.falls || []) { const dx = (f.x1 + f.x2) / 2 - p.x, dy = (f.y1 + f.y2) / 2 - p.y, d = Math.hypot(dx, dy) || 1e-6; if (d < 2.0) { const kk = 1 - d / 2.0; vx = vx * (1 - 0.7 * kk) + dx / d * 4.2 * kk; vy = vy * (1 - 0.7 * kk) + dy / d * 4.2 * kk; if (d < 0.9) look = 2; if (d < 0.22) dead = true; } }   // the river is drawn into the fall from two cells around
    const ox = p.x, oy = p.y; p.x += vx * dt; p.y += vy * dt; p.age += dt;
    let best = Infinity, bk = k;
    for (let j = Math.max(0, k - 3); j <= Math.min(last, k + 3); j++) { const d = segDist(p.x, p.y, R.pts[j][0], R.pts[j][1], R.pts[j + 1][0], R.pts[j + 1][1]); if (d < best) { best = d; bk = j; } }
    const turned = riverZone(R, R.cum[bk]) !== z; p.k = bk;
    const tr = p.tr, n = tr.length >> 1, pp = paths[look];
    for (let t = 0, a = 0; t < 3 && n; t++) { const b = t === 2 ? n : Math.max(a, n - (t ? 2 : 5)); if (b > a) { const q = pp[t]; q.moveTo(X(tr[2 * a]), Y(tr[2 * a + 1])); for (let j = a + 1; j < b; j++) q.lineTo(X(tr[2 * j]), Y(tr[2 * j + 1])); if (b < n) q.lineTo(X(tr[2 * b]), Y(tr[2 * b + 1])); else q.lineTo(X(p.x), Y(p.y)); } a = b; }
    if (keep) { tr.push(p.x, p.y); if (tr.length > 16) tr.splice(0, 2); }
    if (dead || turned || p.age > p.life || best > (R.hws ? R.hws[bk] : R.hw) - 0.1 || (bk === 0 && sp < 0) || (bk === last && sp > 0)) spawnDrop(R, p, len);
  }
  ctx.lineCap = 'butt';
  [['170,225,255', 0.34, 1.2], ['215,245,255', 0.6, 1.2], ['255,255,255', 0.9, 1.8]].forEach(([c, a, w], look) => { ctx.lineWidth = w; [0.3, 0.6, 1].forEach((f, t) => { ctx.strokeStyle = `rgba(${c},${a * f})`; ctx.stroke(paths[look][t]); }); });
  ctx.globalCompositeOperation = 'source-over';   // (the drops never leave the river: no clip needed)
  drawGlints(st);
  ctx.save();   // (the white water and the whirlpools sit well inside the river: no clip, which would cost more than drawing them)
  // white water where two currents meet or part
  ctx.fillStyle = 'rgba(235,250,255,0.35)';
  for (let k = 1; k < R.zones.length; k++) {
    const s0 = R.zones[k][0] * len;
    for (let j = -4; j <= 4; j++) { const o = j / 4 * R.hw * 0.95, jit = Math.sin(clock * 7 + j * 1.7) * 0.12; const [x, y] = riverAt(R, s0 + jit, o); ctx.beginPath(); ctx.arc(X(x), Y(y), L.cs * (0.05 + 0.03 * Math.sin(clock * 9 + j)), 0, TAU); ctx.fill(); }
  }
  ctx.restore();
  // a whirlpool against a bank must be cut off at the bank (a clip, which costs); one in open water needs none
  for (const w of st.wells) {
    if (w.open === undefined) { let d = Infinity; for (let j = 0; j <= last; j++) d = Math.min(d, segDist(w.x, w.y, R.pts[j][0], R.pts[j][1], R.pts[j + 1][0], R.pts[j + 1][1]) - (R.hws ? R.hws[j] : R.hw)); w.open = d + w.R < -0.05; }
    if (w.open) whirlSurface(w); else { ctx.save(); riverPath(ctx, R); ctx.clip(); whirlSurface(w); ctx.restore(); }
  }
}
/** Glints: every little wave is a mirror that flashes when it faces the light. Tilt the board and other waves light up; a soft sheen slides with it. */
let sheenC = null;
function drawGlints(st) {
  const R = st.river; if (!R) return;
  const cs = L.cs, tx = tilt.x * 1.9, ty = tilt.y * 1.9;
  if (!R.facets) { const len = R.cum[R.cum.length - 1], r = rngFrom(23); R.facets = []; for (let k = 0, n = Math.min(150, Math.round(len * 3)); k < n; k++) { const [x, y] = riverAt(R, r() * len, (r() - 0.5) * 1.7 * R.hw); R.facets.push({ x, y, a: r() * TAU, b: r() * TAU, rot: (r() - 0.5) * 0.8 }); } }
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fff';
  for (const f of R.facets) {
    const nx = Math.sin(clock * 1.6 + f.a) * 0.6, ny = Math.sin(clock * 1.25 + f.b) * 0.6, I = Math.exp(-((nx - tx * 0.55) ** 2 + (ny - ty * 0.55) ** 2) * 20);
    if (I < 0.06) continue;
    ctx.globalAlpha = Math.min(1, I); ctx.beginPath(); ctx.ellipse(X(f.x), Y(f.y), cs * (0.04 + 0.15 * I), cs * (0.02 + 0.02 * I), f.rot, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const m = ctx.getTransform(), n = Math.round(cs * 7 * m.a);   // the sheen: drawn once at the screen's own pixel size, then only slid about
  if (!sheenC || sheenC.width !== n) { sheenC = document.createElement('canvas'); sheenC.width = sheenC.height = n; const g = sheenC.getContext('2d'); g.globalAlpha = 0.16; g.drawImage(glowSprite('#bfe8ff'), 0, 0, n, n); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(sheenC, Math.round(m.a * X(st.W / 2 + tx * st.W * 0.45) + m.e - n / 2), Math.round(m.d * Y(st.H / 2 + ty * st.H * 0.45) + m.f - n / 2)); ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}
/**
 * Waterfalls: a tall veil. There is no hard lip: the river pales and its streaks fan in from all round, the
 * water darkens as it bends over (the rock shows through), and a see-through sheet leans out over the lane
 * below. Its foot slides as you tilt (that is the height); below, a dark undercut, a boil of foam, rings,
 * spray thrown up over its own shadows, mist, and foam carried off downstream.
 */
function drawFalls(st) {
  const cs = L.cs, T = clock;
  for (const f of st.falls || []) {
    const ex = f.x2 - f.x1, ey = f.y2 - f.y1, Lw = Math.hypot(ex, ey), h2 = Lw / 2, mx = (f.x1 + f.x2) / 2, my = (f.y1 + f.y2) / 2;
    let nx = -ey / Lw, ny = ex / Lw; if ((f.lx - mx) * nx + (f.ly - my) * ny < 0) { nx = -nx; ny = -ny; }   // the way the water drops
    const tl = [(tilt.x * nx + tilt.y * ny) * 1.9, (-tilt.x * ny + tilt.y * nx) * 1.9];   // the tilt, in the fall's own axes
    const bank = 0.3, land = 0.3, foot = bank + land + 0.3 + tl[0] * 0.22, r = rngFrom(Math.round(mx * 31 + my * 17) + 91);
    const [fx, fy] = flowAt(st, f.lx, f.ly), down = (-fx * ny + fy * nx) >= 0 ? 1 : -1;   // which way the lane below runs
    ctx.save(); ctx.translate(X(mx), Y(my)); ctx.rotate(Math.atan2(ny, nx)); ctx.scale(cs, cs);   // x: the way it drops; y: along the lip; in cells
    ctx.lineCap = 'round';
    // the river pales as it gathers toward the fall
    let gr = ctx.createRadialGradient(0.1, 0, 0.1, 0.1, 0, 1.5); gr.addColorStop(0, 'rgba(225,248,255,0.34)'); gr.addColorStop(1, 'rgba(225,248,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(-1.4, -1.5, 1.7, 3);
    // below: the undercut in shadow, rings rolling out, foam carried off downstream
    gr = ctx.createLinearGradient(bank + land, 0, foot + 0.55, 0); gr.addColorStop(0, 'rgba(0,4,16,0.7)'); gr.addColorStop(1, 'rgba(0,4,16,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(bank + land, 0, foot + 0.55 - bank - land, h2 * 1.1, 0, -Math.PI / 2, Math.PI / 2); ctx.fill();
    for (let k = 0; k < 3; k++) { const u = (T * 0.5 + k / 3) % 1; ctx.strokeStyle = `rgba(235,250,255,${0.5 * (1 - u)})`; ctx.lineWidth = 0.05 * (1 - u) + 0.012; ctx.beginPath(); ctx.ellipse(foot + u * 0.25, down * u * 0.5, 0.2 + u * 0.75, 0.45 + u * 1.2, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
    for (let k = 0; k < 10; k++) { const u = (T * (0.10 + r() * 0.06) + r()) % 1, x = foot + 0.1 + r() * 0.75, y = down * (0.2 + u * 3.4), l = 0.25 + r() * 0.4; ctx.strokeStyle = `rgba(240,252,255,${0.5 * (1 - u)})`; ctx.lineWidth = 0.03 + r() * 0.04; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 0.05, y + down * l * 0.5, x - 0.03, y + down * l); ctx.stroke(); }
    // the rock of the bank, showing through: it comes up out of the water gradually, never as a line
    gr = ctx.createLinearGradient(bank - 0.4, 0, bank + 0.08, 0); gr.addColorStop(0, 'rgba(7,19,31,0)'); gr.addColorStop(1, 'rgba(7,19,31,1)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(bank - 0.4, -h2 * 1.25); ctx.quadraticCurveTo(bank - 0.1, -h2 * 1.05, bank + 0.08, -h2 - 0.02); ctx.lineTo(bank + 0.08, h2 + 0.02); ctx.quadraticCurveTo(bank - 0.1, h2 * 1.05, bank - 0.4, h2 * 1.25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#07131f'; ctx.fillRect(bank + 0.06, -h2 - 0.02, land + 0.02, Lw + 0.04);
    // the veil: nothing at all where it starts in the river, thin and see-through over the edge, white at its foot
    const veil = new Path2D(); veil.moveTo(-0.6, -h2 * 1.5); veil.quadraticCurveTo(bank - 0.25, -h2 * 1.1, bank, -h2); veil.lineTo(foot, -h2 * 0.94 + tl[1] * 0.1); veil.lineTo(foot, h2 * 0.94 + tl[1] * 0.1); veil.lineTo(bank, h2); veil.quadraticCurveTo(bank - 0.25, h2 * 1.1, -0.6, h2 * 1.5); veil.closePath();
    gr = ctx.createLinearGradient(-0.6, 0, foot, 0); const q = v => (v + 0.6) / (foot + 0.6);
    gr.addColorStop(0, 'rgba(120,200,240,0)'); gr.addColorStop(q(bank * 0.6), 'rgba(110,190,238,0.26)'); gr.addColorStop(q(bank + land * 0.6), 'rgba(190,232,252,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0.95)');
    ctx.fillStyle = gr; ctx.fill(veil);
    // the water itself: streaks that start well back in the river, fan in toward the fall, speed up over the edge and down the sheet
    for (let i = 0; i < 44; i++) {
      const y0 = (r() - 0.5) * Lw * 2.6, sp = 0.45 + r() * 0.5, u = (T * sp + r()) % 1, e0 = u * u, e1 = Math.min(1, e0 + 0.05 + 0.2 * u), x0 = -1.15, span = foot - x0;
      const at = e => { const x = x0 + span * e, c = Math.min(1, (x - x0) / (bank - x0)); return [x, y0 * (1 - 0.64 * c * (2 - c)) + tl[1] * 0.1 * Math.max(0, (x - bank) / (foot - bank))]; };
      const [ax, ay] = at(e0), [bx, by] = at(e1);
      ctx.strokeStyle = `rgba(255,255,255,${(0.12 + 0.75 * u) * Math.min(1, u * 5)})`; ctx.lineWidth = 0.014 + 0.03 * u; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    ctx.restore();
    // the foot of the fall, in screen space so the pieces stay round: a boil of foam, spray with shadows, mist
    const P = (a, b) => [X(mx + nx * a - ny * b), Y(my + ny * a + nx * b)];
    for (let k = 0; k < 26; k++) { const [x, y] = P(foot - 0.12 + r() * 0.42, (r() - 0.5) * Lw * 0.95 + tl[1] * 0.1), ph = r() * TAU, rr = cs * (0.05 + r() * 0.11); ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.sin(T * 8 + ph) ** 2})`; ctx.beginPath(); ctx.arc(x + Math.sin(T * 6 + ph) * cs * 0.04, y + Math.cos(T * 5 + ph) * cs * 0.05, rr * (0.7 + 0.3 * Math.sin(T * 7 + ph)), 0, TAU); ctx.fill(); }
    for (let i = 0; i < 26; i++) {
      const u = (T * (0.7 + r() * 0.5) + r()) % 1, a = (r() - 0.5) * 2.2, d = 0.25 + r() * 0.7, hgt = 4 * u * (1 - u) * (0.2 + r() * 0.3), [gx, gy] = P(foot + Math.cos(a) * d * u, (r() - 0.5) * Lw * 0.8 + Math.sin(a) * d * u);
      ctx.fillStyle = `rgba(0,6,20,${0.3 * (1 - u)})`; ctx.beginPath(); ctx.arc(gx + cs * 0.05, gy + cs * 0.07, Math.max(1, cs * 0.03), 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - u * 0.6)})`; ctx.beginPath(); ctx.arc(gx - tilt.x * 1.9 * hgt * cs * 0.9, gy - hgt * cs * 0.5 - tilt.y * 1.9 * hgt * cs * 0.9, Math.max(1, cs * (0.022 + hgt * 0.05)), 0, TAU); ctx.fill();
    }
    for (let k = 0; k < 5; k++) { const u = (T * 0.28 + k / 5) % 1, [x, y] = P(foot + 0.25 + Math.sin(k * 2.1 + u * 3) * 0.3, down * u * 1.6); glowAt(x - tilt.x * 14, y - tilt.y * 14, cs * (0.5 + u * 0.7), '#ffffff', 0.22 * (1 - u)); }
    const rb = Math.max(0, 0.2 + 0.6 * tl[0]), [cx, cy] = P(foot + 0.1, 0), an = Math.atan2(ny, nx);   // a faint rainbow in the mist, when the light is right
    if (rb > 0.02) { ctx.lineWidth = Math.max(1, cs * 0.045); ['255,80,80', '255,200,60', '90,220,120', '80,160,255', '170,110,255'].forEach((c, i) => { ctx.strokeStyle = `rgba(${c},${0.28 * rb})`; ctx.beginPath(); ctx.arc(cx, cy, cs * (0.85 - i * 0.05), an - 1.25, an + 1.25); ctx.stroke(); }); }
  }
}
/* ---------- the sky world (its key in the code is still `neon`): high noon, above the clouds ---------- */
/** A soft round puff of cloud. */
function skyPuff(g, x, y, rr, rgb, a) { const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.55, `rgba(${rgb},${a * 0.8})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
/** A cumulus seen from above: a heap of puffs, its shaded underside peeking out below and to the right (the sun is up and to the left). */
function skyCloud(g, cx, cy, sc, r, ta, ua) {
  const n = 7 + (r() * 6 | 0), lobes = [];
  for (let j = 0; j < n; j++) { const a = r() * TAU, d = Math.sqrt(r()); lobes.push([cx + Math.cos(a) * d * sc, cy + Math.sin(a) * d * sc * 0.62, sc * (0.34 + r() * 0.4)]); }
  for (const [x, y, rr] of lobes) skyPuff(g, x + sc * 0.1, y + sc * 0.16, rr, '140,170,215', ua);
  for (const [x, y, rr] of lobes) skyPuff(g, x, y, rr, '238,246,255', ta);
}
/** The land, a very long way down: a patchwork of fields, woods, a river and a road, blued by all the air in between (drawn once, into the far layer). */
function skyGround(g, st, x0, y0, w, h) {
  const r = rngFrom(202 + st.i), cs = L.cs, u = cs / 64, D = Math.hypot(w, h) / 2 + 4;
  const pal = ['#7fae4e', '#93b858', '#b9c46a', '#d4c274', '#6e9c4a', '#a58a55', '#588a45', '#c7b56a', '#86a84c'];
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  g.fillStyle = '#7fae4e'; g.fillRect(x0, y0, w, h);
  g.save(); g.translate(x0 + w / 2, y0 + h / 2); g.rotate(0.32);
  for (let y = -D; y < D;) {
    const bh = (14 + r() * 22) * u;
    for (let x = -D; x < D;) {
      const bw = (16 + r() * 38) * u; g.fillStyle = pal[r() * pal.length | 0]; g.fillRect(x, y, bw + 0.5, bh + 0.5);
      if (r() < 0.45) { g.strokeStyle = 'rgba(60,70,30,0.18)'; g.lineWidth = 0.6; g.beginPath(); for (let f = 2; f < bh; f += Math.max(2, 2.5 * u)) { g.moveTo(x, y + f); g.lineTo(x + bw, y + f); } g.stroke(); }
      g.strokeStyle = 'rgba(50,70,30,0.35)'; g.lineWidth = 0.8; g.strokeRect(x, y, bw, bh); x += bw;
    }
    y += bh;
  }
  g.restore();
  for (let k = 0, n = Math.round(w * h / (cs * cs) * 0.55); k < n; k++) { const x = x0 + r() * w, y = y0 + r() * h; g.fillStyle = `rgba(${38 + r() * 20 | 0},${82 + r() * 20 | 0},${44 + r() * 14 | 0},0.9)`; for (let j = 0; j < 6; j++) { g.beginPath(); g.arc(x + (r() - 0.5) * 22 * u, y + (r() - 0.5) * 16 * u, (3 + r() * 6) * u, 0, TAU); g.fill(); } }
  g.lineCap = 'round'; g.lineJoin = 'round';
  const fl = r() < 0.5, px = f => x0 + (fl ? 1 - f : f) * w, py = f => y0 + f * h;
  const river = () => { g.beginPath(); g.moveTo(px(-0.03), py(0.2)); g.bezierCurveTo(px(0.35), py(0.1), px(0.2), py(0.45), px(0.55), py(0.5)); g.bezierCurveTo(px(0.95), py(0.56), px(0.5), py(0.85), px(1.03), py(0.9)); };
  river(); g.strokeStyle = '#c9d9a0'; g.lineWidth = 12 * u; g.stroke(); river(); g.strokeStyle = '#3d7fc0'; g.lineWidth = 8 * u; g.stroke(); river(); g.strokeStyle = 'rgba(190,230,255,0.55)'; g.lineWidth = 1.5 * u; g.stroke();
  g.strokeStyle = 'rgba(240,235,215,0.8)'; g.lineWidth = 1.4 * u; g.beginPath(); g.moveTo(px(0.1), py(1)); g.bezierCurveTo(px(0.3), py(0.6), px(0.7), py(0.4), px(0.85), py(0)); g.stroke();
  g.fillStyle = 'rgba(70,140,235,0.46)'; g.fillRect(x0, y0, w, h);
  g.fillStyle = 'rgba(190,225,255,0.16)'; g.fillRect(x0, y0, w, h);   // and the thin haze you roll on
  g.restore();
}
/**
 * The cloud layer between you and the land, painted once into the near layer: the cloud deck, the small
 * clouds above it with the shadows they throw on it, and the sunlight (a glare where the sun is, just off
 * the top edge, and shafts fanning across). One layer, so one blit per frame.
 */
function skyDeck(g, st, x0, y0, w, h) {
  const r = rngFrom(12 + st.i), cs = L.cs, W2 = L.W + PAR_M * 2, H2 = L.H + PAR_M * 2, q = L.DPR / 2;
  for (let k = 0, n = Math.round(w * h / (cs * cs) * 0.13); k < n; k++) skyCloud(g, x0 + r() * w, y0 + r() * h, cs * (0.6 + r() * 0.62), r, 0.5, 0.3);
  // the small clouds: soft things, so half resolution is plenty; made here once, never per frame
  const small = document.createElement('canvas'), shade = document.createElement('canvas'), r2 = rngFrom(18 + st.i);
  small.width = shade.width = Math.round(W2 * q); small.height = shade.height = Math.round(H2 * q);
  const sg = small.getContext('2d'); sg.setTransform(q, 0, 0, q, 0, 0);
  for (let k = 0, n = Math.round(st.W * st.H * 0.055); k < n; k++) skyCloud(sg, r2() * W2, r2() * H2, cs * (0.3 + r2() * 0.32), r2, 0.46, 0.28);
  const sh = shade.getContext('2d'); sh.drawImage(small, 0, 0); sh.globalCompositeOperation = 'source-in'; sh.fillStyle = '#16407e'; sh.fillRect(0, 0, shade.width, shade.height);
  g.globalAlpha = 0.14; g.drawImage(shade, cs * 0.12 - PAR_M, cs * 0.16 - PAR_M, W2, H2); g.globalAlpha = 1;
  g.drawImage(small, -PAR_M, -PAR_M, W2, H2);
  small.width = small.height = shade.width = shade.height = 1;
  // sunlight
  const [sx, sy] = skySun0(st), far = (st.W + st.H) * cs, gr = g.createRadialGradient(sx, sy, 0, sx, sy, Math.max(st.W, st.H) * cs * 0.95);
  gr.addColorStop(0, 'rgba(255,250,225,0.7)'); gr.addColorStop(0.2, 'rgba(255,246,214,0.26)'); gr.addColorStop(0.6, 'rgba(255,244,210,0.09)'); gr.addColorStop(1, 'rgba(255,244,210,0)');
  g.fillStyle = gr; g.fillRect(x0, y0, w, h);
  const base = Math.atan2(Y(st.H / 2) - sy, X(st.W / 2) - sx);
  g.globalAlpha = 0.6;
  for (let k = -3; k <= 3; k++) { const a = base + k * 0.21, wd = 0.035 + 0.02 * ((k + 7) % 3); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a - wd) * far, sy + Math.sin(a - wd) * far); g.lineTo(sx + Math.cos(a + wd) * far, sy + Math.sin(a + wd) * far); g.closePath(); g.fill(); }
  g.globalAlpha = 1;
}
function renderSkyClouds() {}   // (the small clouds are now part of skyDeck)
/** Where the sun is: just off the top edge of the board (as painted), and where it is now that the cloud layer has slid with the tilt. */
function skySun0(st) { const cs = L.cs; return [X(st.W / 2) - cs * 0.9, Y(0) - cs * 1.1]; }
function skySun(st) { const p = skySun0(st); return [p[0] - tilt.x * 17 + Math.sin(clock * 0.07) * 5, p[1] - tilt.y * 17]; }
/**
 * Everything under the board: the land, then the cloud layer. The land is deeper, so it slides further when
 * you tilt. Both are drawn 1:1, on whole device pixels (no scaling, no blending passes: this is what keeps
 * the sky fast). On the clouds: the plane's shadow with its glory (the rainbow ring pilots see round it).
 */
function drawSkyBack(st) {
  const cs = L.cs, tx = tilt.x, ty = tilt.y, W2 = L.W + PAR_M * 2, H2 = L.H + PAR_M * 2, ga = ctx.globalAlpha, D = L.DPR, q = v => Math.round(v * D) / D;
  const dx = -tx * 17 + Math.sin(clock * 0.07) * 5, dy = -ty * 17;
  ctx.save(); roundRect(ctx, X(0) - 6, Y(0) - 6, st.W * cs + 12, st.H * cs + 12, 0.7 * cs + 6); ctx.clip();
  ctx.drawImage(farC, q(-tx * 30) - PAR_M, q(-ty * 30) - PAR_M, W2, H2);
  ctx.drawImage(nearC, q(dx) - PAR_M, q(dy) - PAR_M, W2, H2);
  if (S.phase === 'play') {
    const hx = X(S.x) + cs * 0.22 + dx, hy = Y(S.y) + cs * 0.3 + dy, R = BALL_R * cs; ctx.lineWidth = Math.max(1.2, R * 0.17);
    for (const [c, k] of [['255,90,80', 1.46], ['255,220,90', 1.27], ['110,190,255', 1.08]]) { ctx.strokeStyle = `rgba(${c},0.5)`; ctx.beginPath(); ctx.arc(hx, hy, R * k, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.beginPath(); ctx.arc(hx, hy, R * 0.96, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(22,64,126,0.45)'; ctx.beginPath(); ctx.arc(hx, hy, R * 0.46, 0, TAU); ctx.fill();
  }
  ctx.restore();
  return [-tx * 16, -ty * 16];
}
/** Over the board: each hole in the clouds is a clear window onto the land (you see the cloud's thickness on one side); and the sun's lens flare. */
function drawSkyOver(st) {
  const cs = L.cs, tx = tilt.x, ty = tilt.y, D = L.DPR, ox = Math.round(-tx * 30 * D) / D - PAR_M, oy = Math.round(-ty * 30 * D) / D - PAR_M;
  for (const h of st.holes) {
    const x = X(h.x), y = Y(h.y), r = h.r * cs;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    ctx.drawImage(farC, (x - r - ox) * D, (y - r - oy) * D, r * 2 * D, r * 2 * D, x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = 'rgba(30,105,225,0.2)'; ctx.fillRect(x - r, y - r, r * 2, r * 2);   // clear air all the way down: bluer than the haze around
    ctx.fillStyle = 'rgba(160,190,230,0.95)'; ctx.beginPath(); ctx.arc(x, y, r + 1, 0, TAU); ctx.arc(x - tx * r * 0.32, y - ty * r * 0.32 - r * 0.06, r * 0.96, 0, TAU, true); ctx.fill('evenodd');
    ctx.restore();
    ctx.strokeStyle = '#14244a'; ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  }
  const [sx, sy] = skySun(st), mx = X(st.W / 2), my = Y(st.H / 2), u = cs / 64;
  ctx.save(); roundRect(ctx, X(0), Y(0), st.W * cs, st.H * cs, 0.7 * cs); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
  for (const [k, rr, c, al] of [[0.55, 9, '255,220,150', 0.2], [0.85, 16, '160,210,255', 0.07], [1.2, 5, '255,255,255', 0.22], [1.5, 20, '255,190,150', 0.05], [1.85, 13, '170,255,210', 0.12]]) { ctx.fillStyle = `rgba(${c},${al})`; ctx.beginPath(); ctx.arc(sx + (mx - sx) * k, sy + (my - sy) * k, rr * u, 0, TAU); ctx.fill(); }
  ctx.restore();
}
/** The ring of cloud round a hole, and the dip toward it (drawn once, on the board). */
function skyHoleRim(g, x, y, r, slope, seed) {
  const rn = rngFrom(Math.round(seed * 977) + 5), pts = [];
  const gr = g.createRadialGradient(x, y, r * 0.9, x, y, r + slope); gr.addColorStop(0, 'rgba(22,64,126,0.3)'); gr.addColorStop(0.6, 'rgba(22,64,126,0.1)'); gr.addColorStop(1, 'rgba(22,64,126,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r + slope, 0, TAU); g.fill();
  for (let i = 0; i < 15; i++) { const a = i / 15 * TAU + rn() * 0.2, rr = r * (0.26 + rn() * 0.16); pts.push([x + Math.cos(a) * (r + rr * 0.75), y + Math.sin(a) * (r + rr * 0.75), rr]); }
  g.save(); g.beginPath(); g.rect(x - r * 3, y - r * 3, r * 6, r * 6); g.arc(x, y, r, 0, TAU, true); g.clip('evenodd');
  g.fillStyle = '#93b1dc'; g.beginPath(); for (const [px, py, rr] of pts) { g.moveTo(px + rr * 1.06, py + rr * 0.1); g.arc(px + rr * 0.06, py + rr * 0.1, rr, 0, TAU); } g.fill();
  g.fillStyle = '#fafdff'; g.beginPath(); for (const [px, py, rr] of pts) { g.moveTo(px + rr, py); g.arc(px, py, rr, 0, TAU); } g.fill();
  g.restore();
}
/** The walls: banks of cloud with a crisp scalloped edge (so you see exactly where they are), a shaded underside and a soft blue shadow on the haze (drawn once, on the board). */
function skyWalls(g, st) {
  const cs = L.cs, r = rngFrom(71 + st.i), step = cs * 0.1, pts = [];
  const add = (x, y) => pts.push([x + (r() - 0.5) * cs * 0.02, y + (r() - 0.5) * cs * 0.02, cs * (0.066 + r() * 0.022)]);
  for (const w of st.walls) {
    if (w.t === 's') { const n = Math.max(1, Math.round(Math.hypot(w.x2 - w.x1, w.y2 - w.y1) * cs / step)); for (let i = 0; i <= n; i++) add(X(w.x1 + (w.x2 - w.x1) * i / n), Y(w.y1 + (w.y2 - w.y1) * i / n)); }
    else { const n = Math.max(2, Math.round(Math.abs(w.a1 - w.a0) * w.r * cs / step)); for (let i = 0; i <= n; i++) { const a = w.a0 + (w.a1 - w.a0) * i / n; add(X(w.cx + w.r * Math.cos(a)), Y(w.cy + w.r * Math.sin(a))); } }
  }
  g.setLineDash([cs * 0.08, cs * 0.08]); g.lineDashOffset = cs * 0.08; g.strokeStyle = 'rgba(18,58,128,0.85)'; g.lineWidth = 2.4; g.beginPath(); g.arc(X(st.start.x), Y(st.start.y), cs * 0.38, 0, TAU); g.stroke(); g.setLineDash([]); g.lineDashOffset = 0;
  const pass = (col, ox, oy, k, o) => { g.fillStyle = col; g.beginPath(); for (const [x, y, rr] of pts) { const q = rr * k + o; g.moveTo(x + ox + q, y + oy); g.arc(x + ox, y + oy, q, 0, TAU); } g.fill(); };
  pass('rgba(10,30,76,0.42)', cs * 0.08, cs * 0.115, 1, cs * 0.03);   // a hard shadow on the haze
  pass('#14244a', 0, 0, 1, cs * 0.032);                               // the outline: this is solid
  pass('#3d4f80', 0, 0, 1, 0);
  pass('#6a80b8', -cs * 0.012, -cs * 0.02, 0.74, 0);
}
/**
 * The sky marble: a soap bubble. So that you never lose it over white cloud, it is not quite clear: a blue
 * tint that deepens toward the edge, a firm dark-blue outline and a dark inner ring. The rainbow film turns
 * as you tilt and as it rolls; the bright highlight sits on the side the sun is on.
 */
const SKY_BUBBLE = (() => {
  const N = 96, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), m = N / 2, gr = g.createRadialGradient(m, m, m * 0.2, m, m, m);
  gr.addColorStop(0, 'rgba(120,190,255,0.20)'); gr.addColorStop(0.62, 'rgba(70,150,245,0.34)'); gr.addColorStop(0.86, 'rgba(40,110,225,0.6)'); gr.addColorStop(1, 'rgba(24,70,170,0.85)');
  g.fillStyle = gr; g.beginPath(); g.arc(m, m, m, 0, TAU); g.fill();
  return c;
})();
const SKY_FILM = [['255,70,180', 0, 1.15], ['255,214,70', 1.26, 2.4], ['90,235,150', 2.51, 3.66], ['60,205,255', 3.77, 4.92], ['165,110,255', 5.03, 6.17]];
function drawSkyMarble(px, py, R) {
  const [sx, sy] = skySun(S.stage), sa = Math.atan2(sy - py, sx - px), rot = tilt.x * 1.8 + tilt.y * 1.3 + (S.rollX + S.rollY * 0.7) * 0.5;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(px + SHADOW.x * L.cs, py + SHADOW.y * L.cs, R * 0.98, 0, TAU); ctx.fill();
  if (S.boostT > 0) glowAt(px, py, R * 2.2, BOOST_LOOK.neon.col, 0.55);
  ctx.drawImage(SKY_BUBBLE, px - R, py - R, R * 2, R * 2);
  ctx.lineCap = 'butt'; ctx.lineWidth = R * 0.2;
  for (const [c, a0, a1] of SKY_FILM) { ctx.strokeStyle = `rgba(${c},0.9)`; ctx.beginPath(); ctx.arc(px, py, R * 0.8, rot + a0, rot + a1); ctx.stroke(); }
  ctx.strokeStyle = '#123f92'; ctx.lineWidth = Math.max(1.5, R * 0.13); ctx.beginPath(); ctx.arc(px, py, R * 0.97, 0, TAU); ctx.stroke();
  ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, R * 0.17); ctx.beginPath(); ctx.arc(px, py, R * 0.5, sa - 0.6, sa + 0.6); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(px - Math.cos(sa) * R * 0.42, py - Math.sin(sa) * R * 0.42, R * 0.09, 0, TAU); ctx.fill();
}
/** Bumpers: hot-air balloons seen from straight above (one sprite per colourway, drawn once). */
const SKY_BALLOONS = [['#ff5a4e', '#ffd94a'], ['#2f7fe0', '#ffffff'], ['#ff8a2a', '#fff3c4'], ['#9a5cf0', '#ffe07a']].map(([c1, c2]) => {
  const N = 112, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), m = N / 2, R = m - 2;
  for (let k = 0; k < 12; k++) { g.fillStyle = k % 2 ? c2 : c1; g.beginPath(); g.moveTo(m, m); g.arc(m, m, R, k / 12 * TAU, (k + 1) / 12 * TAU + 0.02); g.fill(); }
  const gr = g.createRadialGradient(m - R * 0.3, m - R * 0.36, 1, m, m, R); gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,10,60,0.42)');
  g.fillStyle = gr; g.beginPath(); g.arc(m, m, R, 0, TAU); g.fill();
  g.strokeStyle = '#14244a'; g.lineWidth = 7; g.beginPath(); g.arc(m, m, R - 2.5, 0, TAU); g.stroke();
  g.lineWidth = 3; g.fillStyle = c1; g.beginPath(); g.arc(m, m, R * 0.2, 0, TAU); g.fill(); g.stroke();
  return c;
});
function drawSkyBalloon(c, px, py, r) {
  const rr = r * (1 + 0.03 * Math.sin(clock * 2 + c.x * 3));
  ctx.drawImage(SKY_BALLOONS[Math.abs(Math.round(c.x * 7 + c.y * 3)) % 4], px - rr, py - rr, rr * 2, rr * 2);
  if (c.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${0.7 * c.flash})`; ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fill(); }
}
/** The blade: a red-and-white striped danger bar swinging from its hub, with the same dark outline as everything solid; a red fan shows its reach. */
function drawSkyBlade(w, px, py, R) {
  const u = L.cs, ga = ctx.globalAlpha, vel = w.w * SWEEP_AMP * Math.cos(w.w * S.t + w.ph), hw = u * 0.062, ol = Math.max(1.5, u * 0.03);
  ctx.fillStyle = 'rgba(232,33,47,0.13)'; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, R, w.a0 - SWEEP_AMP, w.a0 + SWEEP_AMP); ctx.closePath(); ctx.fill();
  ctx.setLineDash([u * 0.07, u * 0.08]); ctx.strokeStyle = 'rgba(214,20,36,0.85)'; ctx.lineWidth = Math.max(1.2, u * 0.03); ctx.beginPath(); ctx.arc(px, py, R, w.a0 - SWEEP_AMP, w.a0 + SWEEP_AMP); ctx.stroke(); ctx.setLineDash([]);
  ctx.save(); ctx.translate(px, py);
  ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(232,33,47,0.22)'; ctx.lineWidth = hw * 2;
  for (let k = 2; k >= 1; k--) { const a = w.a - vel * 0.05 * k; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (R - hw), Math.sin(a) * (R - hw)); ctx.stroke(); }   // where it has just been
  ctx.rotate(w.a);
  ctx.strokeStyle = '#14244a'; ctx.lineWidth = hw * 2 + ol * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R - hw, 0); ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = hw * 2; ctx.stroke();
  ctx.lineCap = 'butt'; ctx.strokeStyle = '#e8212f'; ctx.setLineDash([u * 0.17, u * 0.17]); ctx.lineDashOffset = -u * 0.13; ctx.beginPath(); ctx.moveTo(u * 0.13, 0); ctx.lineTo(R - hw, 0); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
  ctx.fillStyle = '#e8212f'; ctx.beginPath(); ctx.arc(R - hw, 0, hw, -Math.PI / 2, Math.PI / 2); ctx.fill();
  ctx.fillStyle = '#14244a'; ctx.beginPath(); ctx.arc(0, 0, u * 0.15, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8212f'; ctx.beginPath(); ctx.arc(0, 0, u * 0.11, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, u * 0.045, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.globalAlpha = ga;
}
/** A streak of wind: a shred of cloud with a bright head and a fading tail (head on the left; drawn once). */
const WIND_SHRED = (() => {
  const c = document.createElement('canvas'); c.width = 72; c.height = 16; const g = c.getContext('2d');
  g.save(); g.translate(20, 8); g.scale(5.2, 1); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 8); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-8, -8, 16, 16); g.restore();
  g.globalCompositeOperation = 'destination-in'; const m = g.createLinearGradient(0, 0, 72, 0); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.12, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, 72, 16);
  return c;
})();
/** Gusts: shreds of cloud torn along the way the wind blows, a faint band so you can see where it reaches. */
function drawWinds(st) {
  const cs = L.cs, ga = ctx.globalAlpha;
  for (const b of st.winds) {
    const horiz = Math.abs(b.ax) > Math.abs(b.ay), dir = Math.sign(horiz ? b.ax : b.ay), x = X(b.x), y = Y(b.y), w = b.w * cs, h = b.h * cs;
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; roundRect(ctx, x, y, w, h, cs * 0.3); ctx.fill();
    ctx.save(); roundRect(ctx, x, y, w, h, cs * 0.3); ctx.clip();
    const along = horiz ? w : h, across = horiz ? h : w, n = Math.max(4, Math.round(across / cs * 3.4));
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate(horiz ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2));   // from here on, +x is downwind
    ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.2, cs * 0.035); ctx.beginPath();
    for (let j = 0; j < n; j++) {
      const c = ((j + 0.5) / n - 0.5) * across + Math.sin(clock * 3 + j) * cs * 0.05, sp = (0.9 + ((j * 0.37) % 0.6)) * Math.abs(horiz ? b.ax : b.ay) * cs * 0.35, len = cs * (0.55 + ((j * 0.53) % 0.6));
      const a = ((clock * sp + j * 97) % (along + len * 2)) - len - along / 2, k = (j * 0.29) % 1;
      if (j % 3 === 2) { ctx.moveTo(a, c); ctx.lineTo(a - len * 0.7, c); continue; }
      ctx.globalAlpha = ga * (0.75 + 0.25 * k); ctx.drawImage(WIND_SHRED, a + len * 0.2, c - cs * (0.11 + 0.09 * k), -len * 1.9, cs * (0.22 + 0.18 * k));
    }
    ctx.globalAlpha = ga * 0.9; ctx.stroke(); ctx.globalAlpha = ga; ctx.restore();
  }
}
/** Checkpoints: a faint dashed line across the way. Crossing it lights it green for a moment, then it stays softly green. */
/** Checkpoint lines take a light colour from each world's own palette. */
const CHECK_COL = { neon: '#1f6fd6', water: '#7ff9ff', galaxy: '#d9b8ff', electric: '#7fe8ff', fire: '#ffb347' };
function drawChecks(st) {
  const cs = L.cs;
  for (const c of st.checks) {
    c.lit = Math.max(0, c.lit - 1 / 90);
    ctx.beginPath(); ctx.moveTo(X(c.x1), Y(c.y1)); ctx.lineTo(X(c.x2), Y(c.y2));
    const col = CHECK_COL[st.theme] || '#ffffff';
    if (c.lit > 0) { ctx.globalAlpha = c.lit; glowStroke(col, Math.max(2, cs * 0.06)); ctx.globalAlpha = 1; }
    ctx.setLineDash([cs * 0.1, cs * 0.14]); ctx.lineCap = 'butt'; ctx.lineWidth = Math.max(1, cs * (c.on ? 0.04 : 0.03));
    ctx.globalAlpha = c.on ? 0.7 : 0.3; ctx.strokeStyle = col; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
}

/* ---------- depth: two background layers that slide with the tilt, a still board on top ---------- */
/*
 * The board is three pictures stacked: a far layer and a near layer (both a little larger than the
 * board, so they can slide), and the still layer with the walls, cups and lava. The two back layers
 * move against the tilt, the far one less: tilt the phone and you look into it. Every object casts a
 * soft shadow down and to the right; in space they float higher, and bob.
 */
const farC = document.createElement('canvas'), nearC = document.createElement('canvas');
const PAR_M = 36;   // how far (CSS px) the back layers can slide
function layerCanvas(c) {
  c.width = Math.round((L.W + PAR_M * 2) * L.DPR); c.height = Math.round((L.H + PAR_M * 2) * L.DPR);
  const g = c.getContext('2d'); g.setTransform(L.DPR, 0, 0, L.DPR, PAR_M * L.DPR, PAR_M * L.DPR); g.clearRect(-PAR_M, -PAR_M, L.W + PAR_M * 2, L.H + PAR_M * 2);
  return g;
}
const FLOOR = { neon: 'rgba(30,50,110,0.9)', water: 'rgba(2,16,38,0.85)', galaxy: 'rgba(5,2,18,0.9)', electric: 'rgba(3,6,22,0.86)', fire: 'rgba(22,5,6,0.86)' };
/**
 * The deepest layer, galaxy only: it never moves (no tilt, no drift), so it reads as scenery, not as part
 * of the board. Everything here is very dim: the Milky Way's band, a few far galaxies, a faint nebula, and a
 * dark planet low in a corner.
 */
const deepC = document.createElement('canvas');
function renderDeep(st) {
  const g = layerCanvas(deepC), cs = L.cs, r = rngFrom(53 + st.i), x0 = X(0) - PAR_M, y0 = Y(0) - PAR_M, w = st.W * cs + PAR_M * 2, h = st.H * cs + PAR_M * 2;
  if (st.theme !== 'galaxy') return;
  g.fillStyle = FLOOR.galaxy; g.fillRect(x0, y0, w, h);
  const blob = (x, y, rx2, ry2, rot, col, a) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, ry2 / rx2); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx2); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx2, 0, TAU); g.fill(); g.restore(); };
  g.globalCompositeOperation = 'lighter';
  // the Milky Way: a soft diagonal band with a darker dust lane
  const ang = -0.6 + r() * 0.3, cx = x0 + w * 0.5, cy = y0 + h * 0.5;
  for (let k = -3; k <= 3; k++) blob(cx + Math.cos(ang) * k * cs * 1.8, cy + Math.sin(ang) * k * cs * 1.8, cs * 2.6, cs * 0.9, ang, 'rgba(170,150,255,A)', 0.05);
  for (let k = 0; k < 160; k++) { const t = (r() - 0.5) * 2, o = (r() - 0.5) * cs * 1.4; g.globalAlpha = 0.15 + r() * 0.2; g.fillStyle = '#e6dcff'; g.beginPath(); g.arc(cx + Math.cos(ang) * t * w * 0.7 - Math.sin(ang) * o, cy + Math.sin(ang) * t * w * 0.7 + Math.cos(ang) * o, 0.3 + r() * 0.4, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  // a faint nebula and far galaxies: tiny tilted smudges with a brighter core
  blob(x0 + w * (0.2 + r() * 0.6), y0 + h * (0.15 + r() * 0.3), cs * 2.2, cs * 1.3, r() * 3, 'rgba(255,90,200,A)', 0.04);
  for (let k = 0; k < 6; k++) {
    const x = x0 + r() * w, y = y0 + r() * h * 0.75, R = cs * (0.25 + r() * 0.45), rot = r() * 3, flat = 0.25 + r() * 0.4;
    blob(x, y, R, R * flat, rot, r() < 0.5 ? 'rgba(200,180,255,A)' : 'rgba(150,200,255,A)', 0.12);
    blob(x, y, R * 0.25, R * 0.25 * flat, rot, 'rgba(255,240,220,A)', 0.25);
  }
  g.globalCompositeOperation = 'source-over';
  // a dark planet, half in its own night, low in a corner: only its thin lit rim and ring catch the eye
  g.globalAlpha = 0.4;
  const right = r() < 0.5, R = cs * 3.6, px = right ? x0 + w - R * 0.35 : x0 + R * 0.35, py = y0 + h - R * 0.4, lx = right ? -1 : 1;
  const body = g.createRadialGradient(px + lx * R * 0.45, py - R * 0.45, R * 0.1, px, py, R);
  body.addColorStop(0, '#3a2670'); body.addColorStop(0.55, '#1a1040'); body.addColorStop(1, '#07041a');
  g.fillStyle = body; g.beginPath(); g.arc(px, py, R, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(px, py, R, 0, TAU); g.clip();
  for (let j = 0; j < 7; j++) { g.strokeStyle = `rgba(${j % 2 ? '255,120,220' : '140,200,255'},0.05)`; g.lineWidth = R * (0.05 + r() * 0.08); g.beginPath(); g.ellipse(px, py + (j - 3) * R * 0.27, R * 1.1, R * 0.12, -0.25, 0, TAU); g.stroke(); }
  const night = g.createLinearGradient(px + lx * R * 0.2, py - R * 0.4, px - lx * R, py + R * 0.6); night.addColorStop(0, 'rgba(5,2,18,0)'); night.addColorStop(0.55, 'rgba(5,2,18,0.8)'); night.addColorStop(1, 'rgba(5,2,18,0.97)');
  g.fillStyle = night; g.fillRect(px - R, py - R, R * 2, R * 2); g.restore();
  g.strokeStyle = 'rgba(200,170,255,0.5)'; g.lineWidth = Math.max(1, cs * 0.035); g.beginPath(); g.arc(px, py, R, right ? Math.PI * 1.02 : -Math.PI * 0.62, right ? Math.PI * 1.62 : -Math.PI * 0.02); g.stroke();
  g.strokeStyle = 'rgba(255,111,216,0.22)'; g.lineWidth = cs * 0.07; g.beginPath(); g.ellipse(px, py, R * 1.7, R * 0.32, right ? 0.35 : -0.35, Math.PI * 0.92, Math.PI * 2.08); g.stroke();
  g.globalAlpha = 1;
}
/** The far layer: the deepest floor of each world. */
function renderFar(st) {
  const g = layerCanvas(farC), cs = L.cs, r = rngFrom(17 + st.i), x0 = X(0) - PAR_M, y0 = Y(0) - PAR_M, w = st.W * cs + PAR_M * 2, h = st.H * cs + PAR_M * 2;
  const rx = () => x0 + r() * w, ry = () => y0 + r() * h;
  if (st.theme !== 'galaxy') { g.fillStyle = FLOOR[st.theme]; g.fillRect(x0, y0, w, h); }
  if (st.theme === 'neon') skyGround(g, st, x0, y0, w, h);   // the sky world: the land, far below
  if (st.theme === 'water') {   // the riverbed, seen through the water: sand, pebbles lit from the top left, then the blue of the water over it
    const sand = g.createLinearGradient(x0, y0, x0 + w, y0 + h); sand.addColorStop(0, '#6f6548'); sand.addColorStop(1, '#544a36'); g.fillStyle = sand; g.fillRect(x0, y0, w, h);
    for (let k = 0; k < 700; k++) { g.fillStyle = `rgba(${60 + r() * 60 | 0},${52 + r() * 50 | 0},${36 + r() * 40 | 0},0.5)`; g.fillRect(rx(), ry(), 1.5, 1.5); }
    const n = Math.min(700, Math.round(w * h / (cs * cs) * 5.5));
    for (let k = 0; k < n; k++) {
      const x = rx(), y = ry(), a2 = cs * (0.06 + r() * 0.17), b2 = a2 * (0.6 + r() * 0.35), rot = r() * TAU, v = 50 + r() * 95 | 0;
      g.fillStyle = 'rgba(20,16,8,0.45)'; g.beginPath(); g.ellipse(x + a2 * 0.2, y + a2 * 0.25, a2, b2, rot, 0, TAU); g.fill();
      g.fillStyle = `rgb(${v},${v * (0.9 + r() * 0.1) | 0},${v * (0.72 + r() * 0.2) | 0})`; g.beginPath(); g.ellipse(x, y, a2, b2, rot, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(x - a2 * 0.25, y - b2 * 0.3, a2 * 0.45, b2 * 0.3, rot, 0, TAU); g.fill();
    }
    g.fillStyle = 'rgba(5,66,140,0.72)'; g.fillRect(x0, y0, w, h);
  }
  if (st.theme === 'galaxy') {   // fine star dust (the planet and far galaxies sit still, further back: renderDeep)
    for (let k = 0; k < 200; k++) { g.globalAlpha = 0.08 + r() * 0.3; g.fillStyle = r() < 0.15 ? '#c9b6ff' : '#fff'; g.beginPath(); g.arc(rx(), ry(), 0.3 + r() * 0.5, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
  }
  if (st.theme === 'electric') {   // a circuit board far below (kept, so pulses can run along it)
    st.traces = [];
    g.strokeStyle = 'rgba(79,216,255,0.07)'; g.lineWidth = 1.2;
    for (let k = 0; k < 34; k++) {
      let x = (rx() - X(0)) / cs, y = (ry() - Y(0)) / cs; const tr = [[x, y]];
      for (let j = 0; j < 4; j++) { if (r() < 0.5) x += (r() < 0.5 ? -1 : 1) * (0.5 + r()); else y += (r() < 0.5 ? -1 : 1) * (0.5 + r()); tr.push([x, y]); }
      g.beginPath(); tr.forEach(([a, b], j) => (j ? g.lineTo(X(a), Y(b)) : g.moveTo(X(a), Y(b)))); g.stroke();
      g.fillStyle = 'rgba(79,216,255,0.14)'; g.beginPath(); g.arc(X(x), Y(y), 1.6, 0, TAU); g.fill();
      st.traces.push(tr);
    }
  }
  if (st.theme === 'fire') {   // cooled black rock, its cracks still glowing
    g.lineCap = 'round';
    for (let k = 0; k < 24; k++) {
      let x = rx(), y = ry(); g.beginPath(); g.moveTo(x, y);
      for (let j = 0; j < 5; j++) { x += (r() - 0.5) * cs * 1.2; y += (r() - 0.5) * cs * 1.2; g.lineTo(x, y); }
      g.strokeStyle = 'rgba(255,90,20,0.07)'; g.lineWidth = 4; g.stroke(); g.strokeStyle = 'rgba(255,170,60,0.14)'; g.lineWidth = 1; g.stroke();
    }
  }
}
/** The near layer: what floats between the deep floor and the board. */
function renderNear(st) {
  const g = layerCanvas(nearC), cs = L.cs, r = rngFrom(29 + st.i), x0 = X(0) - PAR_M, y0 = Y(0) - PAR_M, w = st.W * cs + PAR_M * 2, h = st.H * cs + PAR_M * 2;
  const rx = () => x0 + r() * w, ry = () => y0 + r() * h;
  g.globalCompositeOperation = 'lighter';
  const cloud = (x, y, rr, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); };
  if (st.theme === 'neon') { g.globalCompositeOperation = 'source-over'; skyDeck(g, st, x0, y0, w, h); renderSkyClouds(st); g.globalCompositeOperation = 'lighter'; }   // the sky world: the cloud deck
  if (st.theme === 'galaxy') {   // nearer: a faint violet haze and a few bright stars, nothing busy
    cloud(x0 + w * 0.2, y0 + h * 0.25, cs * 5, 'rgba(138,77,255,0.06)'); cloud(x0 + w * 0.8, y0 + h * 0.4, cs * 4, 'rgba(255,46,136,0.04)');
    for (let k = 0; k < 22; k++) { const x = rx(), y = ry(), s = 0.8 + r() * 1.1; cloud(x, y, s * 3.5, 'rgba(200,180,255,0.14)'); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, s * 0.55, 0, TAU); g.fill(); }
  }
  if (st.theme === 'fire') for (let k = 0; k < 14; k++) cloud(rx(), ry(), cs * (0.6 + r() * 1.2), 'rgba(255,90,20,0.035)');   // heat
}
/** The still board: what you roll against. Walls cast a soft shadow onto the floor. */
function renderBoard() {
  const st = S.stage, cs = L.cs;
  if (st.theme !== 'fire') { renderDeep(st); renderFar(st); renderNear(st); }
  const g = bctx; g.setTransform(L.DPR, 0, 0, L.DPR, 0, 0); g.clearRect(0, 0, L.W, L.H);
  roundRect(g, X(0) - 6, Y(0) - 6, st.W * cs + 12, st.H * cs + 12, 0.7 * cs + 6);
  g.save(); g.clip();
  if (st.theme === 'electric') renderPcbFloor(st, g);
  if (st.theme === 'galaxy') {
    for (const w of st.wells) { const x = X(w.x), y = Y(w.y), gr = g.createRadialGradient(x, y, w.r * cs, x, y, w.R * cs); gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, w.R * cs, 0, TAU); g.fill(); }
    drawWarpGrid(g, st, cs);   // galaxy: the floor grid, sinking into each black hole
  }
  if (st.theme === 'water') for (const w of st.wells) {   // each whirlpool is a dip: darker toward its eye
    const x = X(w.x), y = Y(w.y), gr = g.createRadialGradient(x, y, w.r * cs, x, y, w.R * cs);
    gr.addColorStop(0, 'rgba(0,4,16,0.9)'); gr.addColorStop(0.5, 'rgba(0,20,50,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, w.R * cs, 0, TAU); g.fill();
  }
  if (st.lava) renderLava(st, g);   // the volcano's floor and its lava
  // rivers: a deeper channel, darker in the middle, with banks (the flowing water comes each frame)
  for (const b of st.belts) {
    const horiz = Math.abs(b.ax) > Math.abs(b.ay), x = X(b.x), y = Y(b.y), w = b.w * cs, h = b.h * cs;
    const gr = horiz ? g.createLinearGradient(x, y, x, y + h) : g.createLinearGradient(x, y, x + w, y);
    gr.addColorStop(0, 'rgba(90,200,255,0.10)'); gr.addColorStop(0.5, 'rgba(0,40,90,0.45)'); gr.addColorStop(1, 'rgba(90,200,255,0.10)');
    roundRect(g, x, y, w, h, cs * 0.3); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(160,230,255,0.25)'; g.lineWidth = 2; g.beginPath();
    if (horiz) { g.moveTo(x + cs * 0.2, y); g.lineTo(x + w - cs * 0.2, y); g.moveTo(x + cs * 0.2, y + h); g.lineTo(x + w - cs * 0.2, y + h); }
    else { g.moveTo(x, y + cs * 0.2); g.lineTo(x, y + h - cs * 0.2); g.moveTo(x + w, y + cs * 0.2); g.lineTo(x + w, y + h - cs * 0.2); }
    g.stroke();
  }
  // land around the river: everything outside its banks, dark and mossy, with a sandy edge
  if (st.river) {
    const R = st.river;
    g.save(); g.beginPath(); g.rect(X(0) - 8, Y(0) - 8, st.W * cs + 16, st.H * cs + 16);
    R.poly.forEach(([x, y], k) => (k ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.closePath();
    g.fillStyle = 'rgba(6,26,26,0.94)'; g.fill('evenodd'); g.clip('evenodd');
    const rr = rngFrom(61);
    for (let k = 0; k < 160; k++) { g.fillStyle = rr() < 0.5 ? 'rgba(60,140,110,0.18)' : 'rgba(30,90,80,0.22)'; g.beginPath(); g.ellipse(X(rr() * st.W), Y(rr() * st.H), cs * (0.04 + rr() * 0.1), cs * 0.03, rr() * TAU, 0, TAU); g.fill(); }
    g.restore();
    riverPath(g, R); g.strokeStyle = 'rgba(210,190,140,0.18)'; g.lineWidth = cs * 0.28; g.lineJoin = 'round'; g.stroke();
  }
  // the start pad
  g.setLineDash([cs * 0.08, cs * 0.08]); g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2;
  g.beginPath(); g.arc(X(st.start.x), Y(st.start.y), cs * 0.38, 0, TAU); g.stroke(); g.setLineDash([]);
  // holes and the goal: cups sunk in the floor, with the slope around them
  for (const h of st.holes) { if (st.theme === 'neon') skyHoleRim(g, X(h.x), Y(h.y), h.r * cs, SLOPE_W * cs, h.x + h.y * 3); else drawCup(g, X(h.x), Y(h.y), h.r * cs, SLOPE_W * cs, 'rgba(255,46,136,0.85)'); }   // in the sky: a hole in the clouds
  drawCup(g, X(st.goal.x), Y(st.goal.y), GOAL_R * cs, SLOPE_W * cs, GOAL_COL[st.theme] + '66');
  g.restore();
  // the walls: a soft shadow on the floor (higher in space), then one neon line with a glow
  // join wall pieces that meet, so zigzags have real corners and banks bend smoothly
  const path = new Path2D(); let last = null;
  for (const w of st.walls) {
    if (w.t === 's' && last && Math.abs(last[0] - w.x1) < 1e-6 && Math.abs(last[1] - w.y1) < 1e-6) path.lineTo(X(w.x2), Y(w.y2)); else addWall(path, w);
    last = w.t === 's' ? [w.x2, w.y2] : null;
  }
  if (st.theme === 'electric') { renderPcbTop(st); st.flow = st.belts.map(b => makeFlow(b)); return; }   // a real circuit board: rails, solder and chips on their own layer
  if (st.theme === 'neon') { skyWalls(g, st); st.flow = st.belts.map(b => makeFlow(b)); return; }   // the sky world: banks of cloud
  const sharp = st.theme === 'electric';
  const lift = st.theme === 'galaxy' ? 2 : 1;
  g.save(); g.translate(SHADOW.x * cs * lift, SHADOW.y * cs * lift); g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = cs * 0.25 * lift;
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = Math.max(3, WALL_T * cs * 1.4); g.lineCap = 'round'; g.stroke(path); g.restore();
  const calm = st.theme === 'galaxy';   // space: the walls stay quiet, so the black holes and asteroids are the brightest things
  g.shadowColor = calm ? 'rgba(120,100,200,0.6)' : st.hue; g.shadowBlur = cs * (calm ? 0.14 : 0.3); g.strokeStyle = calm ? '#7d6fb8' : st.hue; g.lineWidth = Math.max(2, WALL_T * cs * (calm ? 0.8 : 1)); g.lineCap = sharp ? 'square' : 'round'; g.lineJoin = sharp ? 'miter' : 'round'; g.miterLimit = 10;
  g.stroke(path); g.shadowBlur = 0;
  if (calm) { g.strokeStyle = 'rgba(205,195,240,0.5)'; g.lineWidth = Math.max(1, WALL_T * cs * 0.25); g.stroke(path); }   // a pale core, so it still reads as a tube
  for (const [x, y, w, h] of st.chips || []) {   // IC chips: black epoxy, silver legs, a notch and a dot
    const px = X(x), py = Y(y), pw = w * cs, ph = h * cs, tall = h >= w;
    g.fillStyle = '#0b1322'; g.fillRect(px + 2, py + 2, pw - 4, ph - 4);
    g.strokeStyle = 'rgba(200,215,235,0.55)'; g.lineWidth = Math.max(1, cs * 0.035); g.beginPath();
    const n = Math.max(2, Math.floor((tall ? h : w) / 0.24));
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; if (tall) { const yy = py + ph * t; g.moveTo(px, yy); g.lineTo(px - cs * 0.09, yy); g.moveTo(px + pw, yy); g.lineTo(px + pw + cs * 0.09, yy); } else { const xx = px + pw * t; g.moveTo(xx, py); g.lineTo(xx, py - cs * 0.09); g.moveTo(xx, py + ph); g.lineTo(xx, py + ph + cs * 0.09); } }
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(px + pw * 0.28, py + Math.min(pw, ph) * 0.28, Math.max(1.5, cs * 0.05), 0, TAU); g.fill();
    g.strokeStyle = 'rgba(79,216,255,0.35)'; g.lineWidth = 1; g.beginPath(); tall ? g.arc(px + pw / 2, py + 2, cs * 0.08, 0, Math.PI) : g.arc(px + 2, py + ph / 2, cs * 0.08, -Math.PI / 2, Math.PI / 2); g.stroke();
  }
  st.flow = st.belts.map(b => makeFlow(b));
}
/** Where shadows fall (cells, scaled by how high a thing is). */
const SHADOW = { x: 0.1, y: 0.14 };
/** Clip to a rounded rectangle built from plain rectangles on whole screen pixels (stepping round the corners, just inside the curve):
 *  a clip like that costs next to nothing, where a curved one makes everything drawn under it several times dearer. */
function stepClip(x, y, w, h, r) {
  const D = L.DPR, q = v => Math.round(v * D) / D;
  ctx.beginPath();
  for (let k = 0; k <= 6; k++) { const ix = r - r * Math.cos(k * Math.PI / 12), iy = r - r * Math.sin(k * Math.PI / 12), x1 = q(x + ix), y1 = q(y + iy); ctx.rect(x1, y1, q(x + w - ix) - x1, q(y + h - iy) - y1); }
  ctx.clip();
}
/** Draw the back layers, sliding against the tilt (and drifting gently in space). */
function drawBack(st) {
  if (st.theme === 'electric') return [0, 0];   // the circuit board is solid: nothing shows through
  if (st.theme === 'fire') return [0, 0];   // so is the volcano's rock floor
  if (st.theme === 'neon') return drawSkyBack(st);
  const cs = L.cs, drift = st.theme === 'galaxy' ? clock : 0;
  // the layers slide by whole screen pixels (a layer laid between pixels has to be blended pixel by pixel: several times the cost), inside a plain rectangle
  const D = L.DPR, q = v => Math.round(v * D) / D, fx = q(-tilt.x * 16 + Math.sin(drift * 0.13) * 6), fy = q(-tilt.y * 16 + Math.cos(drift * 0.11) * 6);
  const nx = q(-tilt.x * 32 + Math.sin(drift * 0.21 + 1) * 12), ny = q(-tilt.y * 32 + Math.cos(drift * 0.17 + 2) * 12);
  ctx.save(); stepClip(X(0) - 6, Y(0) - 6, st.W * cs + 12, st.H * cs + 12, 0.7 * cs + 6);
  ctx.drawImage(deepC, -PAR_M, -PAR_M, L.W + PAR_M * 2, L.H + PAR_M * 2);   // still: scenery
  ctx.drawImage(farC, fx - PAR_M, fy - PAR_M, L.W + PAR_M * 2, L.H + PAR_M * 2);
  ctx.drawImage(nearC, nx - PAR_M, ny - PAR_M, L.W + PAR_M * 2, L.H + PAR_M * 2);
  ctx.restore();
  return [fx, fy];
}
/** Soft shadows of everything that moves, cast onto the floor. In space things float higher and bob. */
function drawShadows(st) {
  const cs = L.cs, space = st.theme === 'galaxy';
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineCap = 'round';
  const lift = o => (space ? 2.2 + 0.6 * Math.sin(clock * 1.3 + o) : 1);
  for (const c of st.circles) { const k = lift(c.x + c.y); ctx.beginPath(); ctx.arc(X(c.x + SHADOW.x * k), Y(c.y + SHADOW.y * k), c.r * cs * 1.02, 0, TAU); ctx.fill(); }
  for (const s of st.boosts) if (!s.got) { const k = lift(s.x); ctx.beginPath(); ctx.arc(X(s.x + SHADOW.x * k), Y(s.y + SHADOW.y * k), BOOST_R * cs * 0.85, 0, TAU); ctx.fill(); }
  for (const s of st.spinners) { const w = spinnerSeg(s); ctx.lineWidth = SPIN_T * cs; ctx.beginPath(); ctx.moveTo(X(w.x1 + SHADOW.x), Y(w.y1 + SHADOW.y)); ctx.lineTo(X(w.x2 + SHADOW.x), Y(w.y2 + SHADOW.y)); ctx.stroke(); }
  for (const w of st.sweeps || []) { const k = 1.6; ctx.lineWidth = cs * 0.12; ctx.beginPath(); ctx.moveTo(X(w.x + SHADOW.x * k), Y(w.y + SHADOW.y * k)); ctx.lineTo(X(w.x + Math.cos(w.a) * w.len + SHADOW.x * k), Y(w.y + Math.sin(w.a) * w.len + SHADOW.y * k)); ctx.stroke(); }
  for (const s of st.sliders) { const w = sliderSeg(s); ctx.lineWidth = PISTON_T * cs; ctx.beginPath(); ctx.moveTo(X(w.x1 + SHADOW.x), Y(w.y1 + SHADOW.y)); ctx.lineTo(X(w.x2 + SHADOW.x), Y(w.y2 + SHADOW.y)); ctx.stroke(); }
}
/** The water of a river: streaks of current and flecks of foam that ride the flow (made once, moved each frame). */
function makeFlow(b) {
  const r = rngFrom(Math.round(b.x * 100 + b.y * 10)), horiz = Math.abs(b.ax) > Math.abs(b.ay), lenA = horiz ? b.w : b.h, lenC = horiz ? b.h : b.w;
  const streaks = [];
  for (let k = 0; k < Math.round(lenA * lenC * 1.6); k++) streaks.push({ c: 0.1 + r() * 0.8, a: r() * (lenA + 2), l: 0.5 + r() * 1.1, v: 0.7 + r() * 0.6, ph: r() * TAU, foam: r() < 0.3 });
  return { horiz, lenA, lenC, streaks, speed: Math.hypot(b.ax, b.ay) * 0.32, sx: Math.sign(horiz ? b.ax : b.ay) };
}
function drawRiver(st) {
  const cs = L.cs;
  st.belts.forEach((b, i) => {
    const F = st.flow && st.flow[i]; if (!F) return;
    ctx.save(); roundRect(ctx, X(b.x), Y(b.y), b.w * cs, b.h * cs, cs * 0.3); ctx.clip();
    const pt = (a, c) => { const along = F.sx > 0 ? a : F.lenA - a; return F.horiz ? [X(b.x + along), Y(b.y + c * F.lenC)] : [X(b.x + c * F.lenC), Y(b.y + along)]; };
    ctx.beginPath();
    const foam = [];
    for (const s of F.streaks) {
      const a = ((s.a + clock * F.speed * s.v) % (F.lenA + 2)) - 1, wob = Math.sin(clock * 2 + s.ph) * 0.04;
      for (let j = 0; j <= 3; j++) { const [x, y] = pt(a + s.l * j / 3, s.c + wob * Math.sin(j + s.ph)); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      if (s.foam) foam.push(pt(a + s.l, s.c));
    }
    ctx.strokeStyle = 'rgba(200,240,255,0.22)'; ctx.lineWidth = Math.max(1.2, cs * 0.04); ctx.lineCap = 'round'; ctx.stroke();
    ctx.fillStyle = 'rgba(235,250,255,0.5)';
    for (const [x, y] of foam) { ctx.beginPath(); ctx.arc(x, y, Math.max(1, cs * 0.035), 0, TAU); ctx.fill(); }
    ctx.restore();
  });
}

/* ---------- sparks and light ---------- */
/** Never more than a couple of hundred sparkles at once, so a phone keeps up. */
const MAX_PARTS = 200;
/**
 * A hit: neon sparks thrown off the wall (bouncing back the way the marble came, more the harder it
 * hit, in the wall's colour with a few white-hot ones) and a quick flash of light where it touched.
 */
function impact(x, y, nx, ny, strength, color) {
  const k = Math.min(1, (strength - 1) / 5), n = 3 + Math.round(k * 8);
  for (let i = 0; i < n && parts.length < MAX_PARTS; i++) {
    const a = Math.atan2(ny, nx) + (Math.random() - 0.5) * 2.2, v = 1.5 + Math.random() * (2 + strength * 0.9);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.18 + Math.random() * 0.25, t: 0, color: Math.random() < 0.3 ? '#ffffff' : color, streak: true });
  }
  flash(x, y, 0.45 + k * 0.6, color);
}
/** A soft round light that fades fast; it adds up with the neon around it. */
function flash(x, y, r, color) { if (flashes.length < 12) flashes.push({ x, y, r, color, t: 0, life: 0.28 + r * 0.06 }); }
function burst(x, y, color, n) {
  for (let i = 0; i < n && parts.length < MAX_PARTS; i++) {
    const a = Math.random() * TAU, v = 1.5 + Math.random() * 3.5;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.5, t: 0, color });
  }
}
/** A drifting thing: an asteroid in space, a lily pad on the water. */
function drawRock(c) {
  const water = S.stage.theme === 'water', cs = L.cs, r = c.r * cs * (water ? 1 : 1 + 0.05 * Math.sin(clock * 1.3 + c.x + c.y)), px = X(c.x), py = Y(c.y);
  ctx.beginPath();
  if (water) { ctx.moveTo(px, py); ctx.arc(px, py, r, c.spin * 0.3 + 0.35, c.spin * 0.3 + TAU - 0.35); ctx.closePath(); }
  else for (let k = 0; k < 9; k++) { const a = c.spin + k * TAU / 9, rr = r * (0.82 + 0.18 * Math.sin(k * 2.3 + 1)); ctx.lineTo(px + rr * Math.cos(a), py + rr * Math.sin(a)); }
  if (!water) ctx.closePath();
  const fire = S.stage.theme === 'fire', col = water ? '#5dff9b' : fire ? '#ff8a3a' : '#d9c6ff';
  ctx.fillStyle = c.flash > 0 ? `rgba(255,255,255,${0.2 + 0.5 * c.flash})` : (water ? 'rgba(93,255,155,0.2)' : fire ? '#2a1410' : 'rgba(176,123,255,0.22)'); ctx.fill();
  glowStroke(col, Math.max(1.5, cs * 0.05));
}
/** A sandbar in the river: wet sand rim, dry sand, a few reed tufts (the water parts around it). */
function drawIsland(c) {
  const cs = L.cs, px = X(c.x), py = Y(c.y), r = c.r * cs, k = c.seed;
  const blob = (rr) => { ctx.beginPath(); for (let j = 0; j < 12; j++) { const a = j * TAU / 12, q = rr * (0.9 + 0.1 * Math.sin(j * 2.1 + k)); j ? ctx.lineTo(px + q * Math.cos(a), py + q * Math.sin(a)) : ctx.moveTo(px + q * Math.cos(a), py + q * Math.sin(a)); } ctx.closePath(); };
  const foam = 1 + 0.04 * Math.sin(clock * 2.2 + k);
  blob(r * 1.12 * foam); ctx.strokeStyle = 'rgba(230,250,255,0.55)'; ctx.lineWidth = Math.max(1.2, cs * 0.04); ctx.stroke();
  blob(r); ctx.fillStyle = '#b89a62'; ctx.fill();
  blob(r * 0.8); ctx.fillStyle = '#e3cc94'; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(px - r * 0.25, py - r * 0.3, r * 0.35, r * 0.18, -0.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#4fbf5a'; ctx.lineWidth = Math.max(1, cs * 0.03); ctx.lineCap = 'round'; ctx.beginPath();
  for (let j = 0; j < 4; j++) { const a = k + j * 1.9, d = r * 0.4 * ((j * 0.37 + 0.2) % 1), bx = px + d * Math.cos(a), by = py + d * Math.sin(a); for (let b = -1; b <= 1; b++) { ctx.moveTo(bx, by); ctx.lineTo(bx + b * r * 0.12 + Math.sin(clock * 1.5 + j) * r * 0.03, by - r * 0.25); } }
  ctx.stroke();
}
/** A leaf floating on the river (the river's bumpers): turning slowly, bobbing, a soft green with its veins. */
function drawLeaf(c) {
  const cs = L.cs, px = X(c.x), py = Y(c.y), r = c.r * cs * 1.25 * (1 + 0.15 * c.flash), a = c.rot + Math.sin(clock * 0.7 + c.rot) * 0.35;
  ctx.save(); ctx.translate(px, py); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.quadraticCurveTo(-r * 0.2, -r * 0.8, r, 0); ctx.quadraticCurveTo(-r * 0.2, r * 0.8, -r, 0); ctx.closePath();
  ctx.fillStyle = c.flash > 0 ? '#b8ffb0' : '#3fae5a'; ctx.fill();
  ctx.strokeStyle = 'rgba(200,255,190,0.85)'; ctx.lineWidth = Math.max(1, cs * 0.03); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,70,30,0.7)'; ctx.lineWidth = Math.max(1, cs * 0.025); ctx.beginPath(); ctx.moveTo(-r * 1.15, 0); ctx.lineTo(r * 0.9, 0);
  for (let j = 1; j <= 3; j++) { const x = -r + j * r * 0.45; ctx.moveTo(x, 0); ctx.lineTo(x + r * 0.25, -r * 0.3); ctx.moveTo(x, 0); ctx.lineTo(x + r * 0.25, r * 0.3); }
  ctx.stroke(); ctx.restore();
}
/** Electric sparks: a white-hot core in a blue glow, crackling bolts that change every frame, and an arc
 *  that leaps to the nearest wall when it gets close. */
function drawZap(st, k) {
  const cs = L.cs, r = SPARK_R * cs, px = X(k.x), py = Y(k.y);
  glowAt(px, py, r * 4.2, '#4fd8ff', 0.5 + 0.35 * Math.random()); glowAt(px, py, r * 1.6, '#e8fbff', 0.5);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let j = 0; j < 5; j++) {
    const a = Math.random() * TAU, l = SPARK_R * (1.8 + Math.random() * 3.0);
    jagged(k.x, k.y, k.x + Math.cos(a) * l, k.y + Math.sin(a) * l, 4, 0.14);
    ctx.strokeStyle = j < 2 ? '#ffffff' : 'rgba(120,220,255,0.9)'; ctx.lineWidth = Math.max(1, cs * (j < 2 ? 0.025 : 0.035)); ctx.stroke();
  }
  let best = Infinity, bq = null;
  for (const w of st.walls) { const q = nearest(w, k.x, k.y), d = Math.hypot(q[0] - k.x, q[1] - k.y); if (d < best) { best = d; bq = q; } }
  if (bq && best < 1.6 && Math.random() < 0.6) { jagged(k.x, k.y, bq[0], bq[1], 6, 0.2); glowStroke('#9fe8ff', Math.max(1.2, cs * 0.04)); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); glowAt(X(bq[0]), Y(bq[1]), cs * 0.25, '#bff3ff', 0.5); }
  ctx.fillStyle = '#f4fdff'; ctx.beginPath(); ctx.arc(px, py, r * 0.55 * (0.8 + 0.4 * Math.random()), 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(79,216,255,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, r * (0.85 + 0.3 * Math.random()), 0, TAU); ctx.stroke();
  if (Math.random() < 0.25 && parts.length < MAX_PARTS) { const a = Math.random() * TAU, v = 2 + Math.random() * 3; parts.push({ x: k.x, y: k.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.15 + Math.random() * 0.15, t: 0, color: Math.random() < 0.5 ? '#ffffff' : '#7fe8ff', streak: true }); }
}
/**
 * The volcano, seen from above: a basalt cone with gullies, glowing lava rivulets running down its flanks,
 * a crater of bubbling magma that brightens (and spits sparks) just before it erupts, and a smoke plume.
 * Where bombs fell, molten splashes cool to a dark crust; each bomb in the air throws its shadow ahead.
 */
function drawVolcanoGround(st) {
  const cs = L.cs, v = st.volcano, px = X(v.x), py = Y(v.y), R = cs * 1.0;
  for (const b of v.burns) {   // a splash of lava on the ground: bright, then crusting over, with glowing cracks
    const k = 1 - b.t / BURN_T, bx = X(b.x), by = Y(b.y), rr = BURN_R * cs;
    glowAt(bx, by, rr * 1.7, '#ff5a1a', 0.5 * k);
    ctx.beginPath(); for (let j = 0; j < 12; j++) { const a = j * TAU / 12, q = rr * (0.8 + 0.25 * Math.sin(j * 2.7 + b.x * 5)); j ? ctx.lineTo(bx + Math.cos(a) * q, by + Math.sin(a) * q) : ctx.moveTo(bx + Math.cos(a) * q, by + Math.sin(a) * q); } ctx.closePath();
    ctx.fillStyle = `rgba(${Math.round(60 + 190 * k)},${Math.round(14 + 90 * k * k)},6,${0.35 + 0.6 * k})`; ctx.fill();
    ctx.strokeStyle = `rgba(255,200,90,${0.8 * k})`; ctx.lineWidth = Math.max(1, cs * 0.025); ctx.beginPath();
    for (let j = 0; j < 5; j++) { const a = j * 1.3 + b.y, l = rr * 0.7; ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * l * 0.5 + Math.sin(j) * rr * 0.1, by + Math.sin(a) * l * 0.5); ctx.lineTo(bx + Math.cos(a + 0.2) * l, by + Math.sin(a + 0.2) * l); }
    ctx.stroke();
  }
  for (const b of v.bombs) {   // the shadow grows and darkens as the bomb comes down
    const u = Math.max(0, b.t / v.T), bx = X(b.tx), by = Y(b.ty), rr = BOMB_R * cs * (0.35 + 0.65 * u);
    ctx.fillStyle = `rgba(0,0,0,${0.2 + 0.4 * u})`; ctx.beginPath(); ctx.arc(bx, by, rr, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(255,70,30,${0.4 + 0.5 * u * (0.5 + 0.5 * Math.sin(clock * 20))})`; ctx.lineWidth = Math.max(1.5, cs * 0.05); ctx.beginPath(); ctx.arc(bx, by, BOMB_R * cs, 0, TAU); ctx.stroke();
  }
  const hot = Math.max(0, 1 - v.next / 0.9);
  // the cone: dark basalt, lit from the top left, with gullies running down from the rim
  // the mountain: shaded once from a real height map into sprites at screen size; its upper slices slide a little with the tilt, so it stands up
  const mt0 = ctx.getTransform(), mk = mt0.a, MR = R * 1.15, lean = z => [tilt.x * z * MR * 0.3, tilt.y * z * MR * 0.3];
  if (!mtn || mtn.MR !== MR || mtn.k !== mk) mtn = mountainSprite(MR, mk);
  {
    const cx = Math.round(mk * px + mt0.e), cy = Math.round(mt0.d * py + mt0.f);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(mtn.base, cx - mtn.N, cy - mtn.N);
    for (const sl of mtn.slices) { const o = lean(sl.h); ctx.drawImage(sl.c, cx - sl.r + Math.round(o[0] * mk), cy - sl.r + Math.round(o[1] * mk)); }
    ctx.setTransform(mt0.a, mt0.b, mt0.c, mt0.d, mt0.e, mt0.f);
  }
  // lava running down its gullies, flickering
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  mtn.streams.forEach((pts, j) => {
    ctx.beginPath(); pts.forEach(([x, y, h], i) => { const o = lean(h); i ? ctx.lineTo(px + x + o[0], py + y + o[1]) : ctx.moveTo(px + x + o[0], py + y + o[1]); });
    ctx.strokeStyle = 'rgba(70,12,4,0.8)'; ctx.lineWidth = Math.max(2.5, cs * 0.1); ctx.stroke();
    ctx.strokeStyle = `rgba(255,${104 + 30 * Math.sin(clock * 5 + j) | 0},24,${0.75 + 0.2 * hot})`; ctx.lineWidth = Math.max(1.5, cs * 0.06); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,232,150,0.85)'; ctx.lineWidth = Math.max(1, cs * 0.026); ctx.setLineDash([cs * 0.13, cs * 0.18]); ctx.lineDashOffset = -clock * cs * 0.5 + j * 5; ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
  });
  // the crater sits at the top, so it leans with it: a pool of magma, bubbling, brighter as it gets ready to blow
  { const o = lean(MT_RIM); ctx.save(); ctx.translate(o[0], o[1]); }
  glowAt(px, py, R * (0.4 + 0.55 * hot), '#ff6a1a', 0.35 + 0.5 * hot);
  const mg = ctx.createRadialGradient(px, py, 0, px, py, R * 0.3); mg.addColorStop(0, hot > 0.5 ? '#fff3b0' : '#ffb347'); mg.addColorStop(0.6, '#ff6a1a'); mg.addColorStop(1, '#8a1e06');
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(px, py, R * 0.29 * (1 + 0.04 * Math.sin(clock * 9)), 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,180,0.7)';
  for (let j = 0; j < 3; j++) { const ph = (clock * 1.3 + j / 3) % 1, a = j * 2.2 + Math.floor(clock * 1.3 + j / 3) * 1.7; ctx.beginPath(); ctx.arc(px + Math.cos(a) * R * 0.15, py + Math.sin(a) * R * 0.15, R * 0.05 * Math.sin(ph * Math.PI), 0, TAU); ctx.fill(); }
  if (hot > 0.4 && Math.random() < 0.4 && parts.length < MAX_PARTS) { const a = Math.random() * TAU, sp = 1 + Math.random() * 1.5; parts.push({ x: v.x, y: v.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4, t: 0, color: '#ffb347', streak: true }); }
  // the plume: grey smoke rising and drifting, thicker after an eruption
  for (let j = 0; j < 6; j++) { const ph = (clock * 0.25 + j / 6) % 1; ctx.fillStyle = `rgba(70,62,62,${0.3 * (1 - ph)})`; ctx.beginPath(); ctx.arc(px + Math.sin(ph * 4 + j) * R * 0.35 + ph * R * 0.6, py - ph * cs * 2.0, R * (0.25 + 0.55 * ph), 0, TAU); ctx.fill(); }
  ctx.restore();
}
/** Bombs in flight: a black rock with glowing cracks, tumbling, trailing smoke, arcing down onto its shadow. */
function drawBombs(st) {
  const cs = L.cs, v = st.volcano;
  for (const b of v.bombs) {
    if (b.t < 0) continue;
    const u = b.t / v.T, gx = b.sx + (b.tx - b.sx) * u, gy = b.sy + (b.ty - b.sy) * u, h = 2.8 * 4 * u * (1 - u), px = X(gx), py = Y(gy) - h * cs * 0.55, rr = cs * 0.2 * (1 + 0.2 * h), rot = b.t * 7;
    glowAt(px, py, rr * 2.6, '#ff6a1a', 0.45);
    ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
    ctx.fillStyle = '#2a120a'; ctx.beginPath(); for (let j = 0; j < 7; j++) { const a = j * TAU / 7, q = rr * (0.8 + 0.2 * Math.sin(j * 2.3)); j ? ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q) : ctx.moveTo(Math.cos(a) * q, Math.sin(a) * q); } ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffb347'; ctx.lineWidth = Math.max(1, cs * 0.03); ctx.beginPath(); ctx.moveTo(-rr * 0.5, -rr * 0.1); ctx.lineTo(0, rr * 0.15); ctx.lineTo(rr * 0.45, -rr * 0.3); ctx.moveTo(0, rr * 0.15); ctx.lineTo(rr * 0.1, rr * 0.6); ctx.stroke();
    ctx.restore();
    if (parts.length < MAX_PARTS) parts.push({ x: gx, y: gy - h * 0.55, vx: (Math.random() - 0.5) * 0.4, vy: -0.2 - Math.random() * 0.3, life: 0.6, t: 0, color: Math.random() < 0.3 ? '#ff9a2e' : '#6a5a5a', dust: true });
  }
  if (v.pops) for (let i = v.pops.length - 1; i >= 0; i--) {   // the flash of an eruption or a landing: a glow that swells and fades (drawn plainly, not added: the same on dark rock, a little less white over bright lava)
    const f = v.pops[i], k = (clock - f.t0) / (0.28 + f.r * 0.06); if (k >= 1 || k < 0) { v.pops.splice(i, 1); continue; }
    glowAt(X(f.x), Y(f.y), f.r * cs * (0.6 + 0.6 * k), '#ff6a1a', (1 - k) * 0.6);
  }
}
/** A jagged line from (x1, y1) to (x2, y2): an electric arc, redrawn differently every frame. */
function jagged(x1, y1, x2, y2, n, amp) {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
  ctx.beginPath(); ctx.moveTo(X(x1), Y(y1));
  for (let k = 1; k < n; k++) { const t = k / n, o = (Math.random() - 0.5) * amp; ctx.lineTo(X(x1 + dx * t + nx * o), Y(y1 + dy * t + ny * o)); }
  ctx.lineTo(X(x2), Y(y2));
}

/* ---------- the electric world as a real circuit board: blue solder mask, copper, tinned rails, solder, chips ---------- */
const PCB = { rail: document.createElement('canvas'), lit: document.createElement('canvas'), hot: [], slice: -1, fresh: false, capA: -0.8, dome: null, sleeve: null, alu: null, hx: [0, 0, 0, 0, 0], hy: [0, 0, 0, 0, 0], nd: [0, 0, 0, 0] };
/** The tilt as −1…1 on each axis (what the light, the shadows and the glints follow). */
const pcbTilt = () => [Math.max(-1, Math.min(1, tilt.x / PCB_TILT)), Math.max(-1, Math.min(1, tilt.y / PCB_TILT))];
const PCB_TILT = 0.3;
/** Random numbers that hold for a twentieth of a second, so lightning crackles instead of buzzing. */
const pcbRng = k => rngFrom((Math.floor(clock * 20) * 7919 + k * 104729 + 13) | 0);
/** A bolt added to the current path: split in the middle and pushed sideways, again and again (screen units). */
function pcbBolt(r, x1, y1, x2, y2, jag, it) { ctx.moveTo(x1, y1); pcbSeg(r, x1, y1, x2, y2, jag, it); }
function pcbSeg(r, x1, y1, x2, y2, jag, it) {
  if (!it) { ctx.lineTo(x2, y2); return; }
  const o = (r() - 0.5) * jag, mx = (x1 + x2) / 2 - (y2 - y1) * o, my = (y1 + y2) / 2 + (x2 - x1) * o;
  pcbSeg(r, x1, y1, mx, my, jag, it - 1); pcbSeg(r, mx, my, x2, y2, jag, it - 1);
}
function pcbSprites() {
  if (PCB.dome) return;
  const mk = n => { const c = document.createElement('canvas'); c.width = c.height = n; return c; };
  let c = PCB.dome = mk(32), g = c.getContext('2d'), gr = g.createRadialGradient(12, 12, 1, 16, 16, 16);
  gr.addColorStop(0, '#f4f8fc'); gr.addColorStop(0.45, '#aab6c4'); gr.addColorStop(1, '#4a5564'); g.fillStyle = gr; g.beginPath(); g.arc(16, 16, 15.2, 0, TAU); g.fill();
  c = PCB.sleeve = mk(96); g = c.getContext('2d'); gr = g.createRadialGradient(34, 34, 4, 48, 48, 48);   // the capacitor's yellow sleeve, with its dark stripe
  gr.addColorStop(0, '#fff3a6'); gr.addColorStop(0.5, '#ffe14f'); gr.addColorStop(1, '#a8860c'); g.fillStyle = gr; g.beginPath(); g.arc(48, 48, 47, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(40,30,0,0.65)'; g.lineWidth = 8; g.beginPath(); g.arc(48, 48, 43, 2.4, 3.9); g.stroke();
  c = PCB.alu = mk(96); g = c.getContext('2d');   // its brushed aluminium top: a bow-tie of shine
  if (g.createConicGradient) { gr = g.createConicGradient(0, 48, 48); [[0, '#f4f8fc'], [0.1, '#8d99a8'], [0.25, '#5d6875'], [0.4, '#8d99a8'], [0.5, '#f4f8fc'], [0.6, '#8d99a8'], [0.75, '#5d6875'], [0.9, '#8d99a8'], [1, '#f4f8fc']].forEach(([o, col]) => gr.addColorStop(o, col)); }
  else { gr = g.createLinearGradient(0, 48, 96, 48); gr.addColorStop(0, '#f4f8fc'); gr.addColorStop(0.5, '#6f7b89'); gr.addColorStop(1, '#f4f8fc'); }
  g.fillStyle = gr; g.beginPath(); g.arc(48, 48, 47, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,38,48,0.6)'; g.lineWidth = 2.5; g.stroke();
}
/** A soft elliptical light (half-axes a and b in CSS px, turned by rot), drawn once at screen resolution with its strength baked in. */
function pcbGlow(a, b, rot, rgb, alpha) {
  const D = L.DPR, c = document.createElement('canvas');
  c.width = Math.max(2, Math.ceil(Math.hypot(a * Math.cos(rot), b * Math.sin(rot)) * 2 * D)); c.height = Math.max(2, Math.ceil(Math.hypot(a * Math.sin(rot), b * Math.cos(rot)) * 2 * D));
  const g = c.getContext('2d'); g.translate(c.width / 2, c.height / 2); g.rotate(rot); g.scale(a * D, b * D);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${rgb},${alpha})`); gr.addColorStop(0.35, `rgba(${rgb},${alpha * 0.6})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); return c;
}
/** Draw one of those lights centred on (x, y), on whole screen pixels and unscaled. */
function pcbBlit(c, x, y) { const D = L.DPR; ctx.drawImage(c, Math.round(x * D - c.width / 2) / D, Math.round(y * D - c.height / 2) / D, c.width / D, c.height / D); }
/** Copy a rectangle of the bright copper onto the board, pixel for pixel. */
function pcbCopy(x0, y0, x1, y1) {
  const D = L.DPR, c = PCB.lit; x0 = Math.max(0, Math.round(x0 * D)); y0 = Math.max(0, Math.round(y0 * D)); x1 = Math.min(c.width, Math.round(x1 * D)); y1 = Math.min(c.height, Math.round(y1 * D));
  if (x1 > x0 && y1 > y0) ctx.drawImage(c, x0, y0, x1 - x0, y1 - y0, x0 / D, y0 / D, (x1 - x0) / D, (y1 - y0) / D);
}
/** A round window of bright copper: a disc stepped out of five bands. */
const PCB_BANDS = [[-1, -0.75, 0.48], [-0.75, -0.4, 0.82], [-0.4, 0.4, 1], [0.4, 0.75, 0.82], [0.75, 1, 0.48]];
function pcbWindow(cx, cy, r) { for (const [e0, e1, hw] of PCB_BANDS) pcbCopy(cx - r * hw, cy + r * e0, cx + r * hw, cy + r * e1); }
/** The floor of the board, drawn once: solder mask, copper traces under it, gold vias, white silkscreen. */
function renderPcbFloor(st, g) {
  const cs = L.cs, k = cs / 40, r = rngFrom(417 + st.i), x0 = X(0), y0 = Y(0), w = st.W * cs, h = st.H * cs, q = 0.3;
  const gr = g.createLinearGradient(x0, y0, x0 + w, y0 + h); gr.addColorStop(0, '#0a2452'); gr.addColorStop(1, '#07193e'); g.fillStyle = gr; g.fillRect(x0 - 8, y0 - 8, w + 16, h + 16);
  for (let n = Math.min(2600, w * h / 90), j = 0; j < n; j++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,20,0.05)'; g.fillRect(x0 + r() * w, y0 + r() * h, 1.2, 1.2); }
  // traces run straight and jog at 45 degrees, ending in vias; two buses of parallel lines
  const traces = [], vias = [];
  for (let n = 0; n < 20; n++) {
    let x = Math.round(r() * st.W / q) * q, y = Math.round(r() * st.H / q) * q, d = r() < 0.5 ? 0 : 1; const tr = [[x, y]]; vias.push([x, y]);
    for (let j = 0, m = 2 + (r() * 3 | 0); j < m; j++) { const len = (2 + (r() * 7 | 0)) * q, sg = r() < 0.5 ? -1 : 1; if (d) x += len * sg; else y += len * sg; tr.push([x, y]); const jog = q * (1 + (r() * 2 | 0)); x += jog * (r() < 0.5 ? -1 : 1); y += jog * (r() < 0.5 ? -1 : 1); tr.push([x, y]); if (r() < 0.3) d = 1 - d; }
    vias.push([x, y]); traces.push(tr);
  }
  for (let b = 0; b < 2; b++) { const bx = 0.6 + r() * (st.W - 3), by = 0.6 + r() * (st.H - 4.5), n = 4 + (r() * 2 | 0), sd = r() < 0.5 ? -1 : 1; for (let j = 0; j < n; j++) { const o = j * 0.2; traces.push([[bx + o, by], [bx + o, by + 1.5], [bx + o + sd * 0.6, by + 2.1], [bx + o + sd * 0.6, by + 3.6]]); } }
  st.traces = traces; st.traceLen = null;
  const tp = new Path2D(); for (const tr of traces) tr.forEach(([a, b], j) => (j ? tp.lineTo(X(a), Y(b)) : tp.moveTo(X(a), Y(b))));
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.save(); g.translate(0.8 * k, k); g.strokeStyle = 'rgba(0,6,30,0.2)'; g.lineWidth = 4 * k; g.stroke(tp); g.restore();
  g.strokeStyle = '#0f3068'; g.lineWidth = 2.6 * k; g.stroke(tp);
  g.save(); g.translate(-1.2 * k, -1.2 * k); g.strokeStyle = 'rgba(150,200,255,0.09)'; g.lineWidth = Math.max(0.6, 0.7 * k); g.stroke(tp); g.restore();
  for (const [a, b] of vias) { const x = X(a), y = Y(b); g.fillStyle = '#5d5536'; g.beginPath(); g.arc(x, y, 3.4 * k, 0, TAU); g.fill(); g.fillStyle = '#857848'; g.beginPath(); g.arc(x - 0.4 * k, y - 0.4 * k, 2.6 * k, 0, TAU); g.fill(); g.fillStyle = '#041026'; g.beginPath(); g.arc(x, y, 1.4 * k, 0, TAU); g.fill(); }
  // silkscreen: an outline and a name for each chip, a dashed line where each arc will strike, the board's name
  g.strokeStyle = 'rgba(235,242,255,0.2)'; g.fillStyle = 'rgba(235,242,255,0.22)'; g.lineWidth = Math.max(1, k); g.font = `600 ${Math.max(7, 8 * k)}px ui-monospace, Menlo, monospace`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  (st.chips || []).forEach(([x, y, cw, ch], j) => { g.strokeRect(X(x) - 3.5 * k, Y(y) - 3.5 * k, cw * cs + 7 * k, ch * cs + 7 * k); g.fillText('U' + (j + 1), X(x) + 2 * k, Y(y) - 6 * k); });
  st.lasers.forEach((l, j) => {
    const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1) || 1, ux = (l.x2 - l.x1) / len, uy = (l.y2 - l.y1) / len;
    g.strokeStyle = 'rgba(235,242,255,0.45)'; g.setLineDash([4 * k, 4 * k]); g.beginPath(); g.moveTo(X(l.x1 + ux * 0.5), Y(l.y1 + uy * 0.5)); g.lineTo(X(l.x2 - ux * 0.5), Y(l.y2 - uy * 0.5)); g.stroke(); g.setLineDash([]); g.strokeStyle = 'rgba(235,242,255,0.2)';   // where an arc will strike stays easy to see
    l.led = [l.x1 + ux * 0.78 + uy * 0.45, l.y1 + uy * 0.78 - ux * 0.45];   // a little red light beside the electrode
    const ex = X(l.led[0]), ey = Y(l.led[1]); g.fillStyle = '#1a1d24'; g.fillRect(ex - 5 * k, ey - 3 * k, 10 * k, 6 * k); g.fillStyle = '#5c1616'; g.fillRect(ex - 3 * k, ey - 2 * k, 6 * k, 4 * k);
    g.fillStyle = 'rgba(235,242,255,0.22)'; g.fillText('HV' + (j + 1), ex - 5 * k, ey - 6 * k);
  });
  g.textAlign = 'center'; g.fillText('BOLITA REV 2.1', X(st.W / 2), Y(st.H) - 8 * k); g.textAlign = 'left';
  // the same copper, bright: shown each frame only where light falls on it
  const lc = PCB.lit; lc.width = bg.width; lc.height = bg.height;
  const lg = lc.getContext('2d'); lg.setTransform(L.DPR, 0, 0, L.DPR, 0, 0); roundRect(lg, X(0), Y(0), w, h, 0.7 * cs); lg.clip();
  lg.lineJoin = 'round'; lg.lineCap = 'round'; lg.strokeStyle = 'rgba(255,214,140,0.17)'; lg.lineWidth = 1.4 * k; lg.stroke(tp);
  lg.fillStyle = 'rgba(255,243,207,0.18)'; for (const [a, b] of vias) { lg.beginPath(); lg.arc(X(a), Y(b), 3.2 * k, 0, TAU); lg.fill(); }
  st.pcbVias = vias;
}
/** What stands on the board, drawn once on its own layer: the rails (walls), solder, chips, electrodes. */
function renderPcbTop(st) {
  const cs = L.cs, k = cs / 40, c = PCB.rail; c.width = bg.width; c.height = bg.height;
  const g = c.getContext('2d'); g.setTransform(L.DPR, 0, 0, L.DPR, 0, 0);
  pcbSprites(); PCB.hot.length = 0;
  PCB.lampC = pcbGlow(cs * 5.2, cs * 5.2, 0, '170,215,255', 0.09); PCB.mirC = pcbGlow(cs * 1.55, cs * 1.55, 0, '90,170,255', 0.32); PCB.zapC = pcbGlow(cs * 1.1, cs * 1.1, 0, '110,170,255', 0.53);
  for (const l of st.lasers) l.glow = pcbGlow(Math.hypot(l.x2 - l.x1, l.y2 - l.y1) * cs * 0.7, cs * 1.3, Math.atan2(l.y2 - l.y1, l.x2 - l.x1), '90,170,255', 0.48);
  const chips = st.chips || [], e = 1e-3;
  const onChip = (px, py) => chips.some(([x, y, w, h]) => px > x - e && px < x + w + e && py > y - e && py < y + h + e && (Math.abs(px - x) < e || Math.abs(px - x - w) < e || Math.abs(py - y) < e || Math.abs(py - y - h) < e));
  // the rails: every wall except the outlines of the chips (those are the chips themselves)
  const path = new Path2D(), seen = new Set(), joints = []; let last = null;
  for (const w of st.walls) {
    if (w.t === 's' && onChip(w.x1, w.y1) && onChip(w.x2, w.y2)) { last = null; continue; }
    if (w.t === 's' && last && Math.abs(last[0] - w.x1) < 1e-6 && Math.abs(last[1] - w.y1) < 1e-6) path.lineTo(X(w.x2), Y(w.y2)); else addWall(path, w);
    last = w.t === 's' ? [w.x2, w.y2] : null;
    if (w.t === 's') for (const [x, y] of [[w.x1, w.y1], [w.x2, w.y2]]) { const key = Math.round(x * 100) + ',' + Math.round(y * 100); if (seen.has(key) || x < 0.05 || y < 0.05 || x > st.W - 0.05 || y > st.H - 0.05) continue; seen.add(key); joints.push([x, y, 4]); }
  }
  const keep = Math.ceil(joints.length / 70), jn = joints.filter((_, j) => j % keep === 0);
  st.pcbPath = path; st.pcbWT = Math.max(3, WALL_T * cs);
  g.lineJoin = 'miter'; g.lineCap = 'square'; g.miterLimit = 10;
  g.strokeStyle = '#2c3644'; g.lineWidth = st.pcbWT + 2 * k; g.stroke(path); g.strokeStyle = '#8f9db0'; g.lineWidth = st.pcbWT; g.stroke(path);
  // chips: black epoxy, etched lettering, a dimple at pin 1, silver legs down both long sides with solder at their feet
  const names = ['BL-4096', 'NE555', 'Z80', 'TL072', '74HC00', 'EEPROM'];
  chips.forEach(([x, y, w, h], j) => {
    const px = X(x), py = Y(y), pw = w * cs, ph = h * cs, tall = h >= w, n = Math.max(2, Math.floor((tall ? h : w) / 0.3)), ll = 0.1 * cs, lw = 4.4 * k;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      for (const sd of [0, 1]) {
        const lx = tall ? (sd ? px + pw : px - ll) : px + pw * t - lw / 2, ly = tall ? py + ph * t - lw / 2 : (sd ? py + ph : py - ll);
        g.fillStyle = '#c3ccd8'; g.fillRect(lx, ly, tall ? ll : lw, tall ? lw : ll); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(lx, ly, tall ? ll : 1.1 * k, tall ? 1.1 * k : ll);
        const fx = tall ? (sd ? x + w + 0.1 : x - 0.1) : x + w * t, fy = tall ? y + h * t : (sd ? y + h + 0.1 : y - 0.1);
        if (fx > 0.12 && fy > 0.12 && fx < st.W - 0.12 && fy < st.H - 0.12) jn.push([fx, fy, 2.4]);
      }
    }
    g.fillStyle = '#12151c'; g.fillRect(px, py, pw, ph);
    g.save(); g.translate(px + pw / 2, py + ph / 2); if (tall) g.rotate(-Math.PI / 2); g.fillStyle = 'rgba(170,180,195,0.55)'; g.font = `600 ${Math.max(7, 9 * k)}px ui-monospace, Menlo, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const name = names[j % names.length]; if (g.measureText(name).width < (tall ? ph : pw) - 14 * k) g.fillText(name, 0, 0); g.restore();
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.arc(px + 8 * k, py + 8 * k, 2.6 * k, 0, TAU); g.fill();
  });
  for (const [x, y, rr] of jn) g.drawImage(PCB.dome, X(x) - rr * k, Y(y) - rr * k, rr * 2 * k, rr * 2 * k);
  st.pcbJoints = jn; st.pcbMetal = jn.concat((st.pcbVias || []).filter(v => v[0] > 0.2 && v[1] > 0.2 && v[0] < st.W - 0.2 && v[1] < st.H - 0.2));
  // the electrodes at each end of an arc: a ribbed ceramic insulator and a brass tip
  for (const l of st.lasers) for (const [x, y, a] of [[l.x1, l.y1, Math.atan2(l.y2 - l.y1, l.x2 - l.x1)], [l.x2, l.y2, Math.atan2(l.y1 - l.y2, l.x1 - l.x2)]]) {
    g.save(); g.translate(X(x), Y(y)); g.rotate(a);
    g.fillStyle = '#e9ecf0'; g.fillRect(2 * k, -6 * k, 10 * k, 12 * k); g.fillStyle = 'rgba(60,70,90,0.45)'; for (let i = 0; i < 3; i++) g.fillRect((4 + i * 3) * k, -6 * k, k, 12 * k);
    g.fillStyle = '#c99a3c'; g.beginPath(); g.moveTo(12 * k, -4 * k); g.lineTo(18 * k, 0); g.lineTo(12 * k, 4 * k); g.fill();
    g.fillStyle = '#ffe9a8'; g.beginPath(); g.moveTo(12 * k, -3 * k); g.lineTo(17 * k, -0.5 * k); g.lineTo(12 * k, -k); g.fill();
    g.restore();
  }
}
/** Each frame, over the floor: light on the copper and on the glossy mask, current in the traces, the shadows,
 *  then the layer of rails and chips with the highlights and glints that slide as the board tilts. */
function drawPcb(st) {
  const cs = L.cs, k = cs / 40, [tx, ty] = pcbTilt(), sl = Math.floor(clock * 20);
  PCB.fresh = sl !== PCB.slice; PCB.slice = sl;
  ctx.save(); stepClip(X(0), Y(0), st.W * cs, st.H * cs, 0.7 * cs);
  // the copper shows where light falls: under the lamp (its reflection slides with the tilt), round each spark, along each live arc.
  // The bright copper is a still layer at screen resolution; pieces of it are copied straight across, pixel for pixel (stepped
  // discs made of plain rectangles: no curved clip, no adding of light, nothing scaled, which is what made this dear).
  const lx = X(st.W / 2) + tx * st.W * cs * 0.42, ly = Y(st.H / 2) + ty * st.H * cs * 0.42;
  pcbWindow(lx, ly, cs * 2.2);
  for (const sp of st.sparks) pcbWindow(X(sp.x), Y(sp.y), cs * 1.6);
  for (const l of st.lasers) if (l.live) pcbCopy(Math.min(X(l.x1), X(l.x2)) - cs * 0.9, Math.min(Y(l.y1), Y(l.y2)) - cs * 0.9, Math.max(X(l.x1), X(l.x2)) + cs * 0.9, Math.max(Y(l.y1), Y(l.y2)) + cs * 0.9);
  // the glossy mask: the lamp, and the blue of each spark and live arc mirrored in it (soft lights drawn once at screen size)
  if (PCB.lampC) {
    pcbBlit(PCB.lampC, lx, ly);
    for (const sp of st.sparks) pcbBlit(PCB.mirC, X(sp.x) + tx * cs * 0.3, Y(sp.y) + ty * cs * 0.3);
    for (const l of st.lasers) if (l.live && l.glow) pcbBlit(l.glow, X((l.x1 + l.x2) / 2) + tx * cs * 0.25, Y((l.y1 + l.y2) / 2) + ty * cs * 0.25);
  }
  // shadows: everything stands up from the board, so its shadow shifts as you tilt
  const sx = (SHADOW.x * 0.75 + tx * 0.12) * cs, sy = (SHADOW.y * 0.75 + ty * 0.12) * cs;
  ctx.save(); ctx.translate(sx, sy); ctx.lineJoin = 'miter'; ctx.lineCap = 'butt'; ctx.miterLimit = 10; ctx.strokeStyle = ctx.fillStyle = 'rgba(0,4,18,0.5)'; ctx.lineWidth = st.pcbWT + 2.5 * k; ctx.stroke(st.pcbPath);
  for (const [x, y, w, h] of st.chips || []) ctx.fillRect(X(x), Y(y), w * cs, h * cs);
  ctx.lineWidth = 12 * k; ctx.beginPath(); for (const l of st.lasers) { const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1) || 1, ux = (l.x2 - l.x1) / len * 0.42, uy = (l.y2 - l.y1) / len * 0.42; ctx.moveTo(X(l.x1), Y(l.y1)); ctx.lineTo(X(l.x1 + ux), Y(l.y1 + uy)); ctx.moveTo(X(l.x2), Y(l.y2)); ctx.lineTo(X(l.x2 - ux), Y(l.y2 - uy)); } ctx.stroke();
  ctx.restore(); ctx.restore();
  ctx.drawImage(PCB.rail, 0, 0, L.W, L.H);
  // the rails are bright tinned metal: the highlight runs along the side that faces the lamp, the other side goes dark
  const o = 1.5 * st.pcbWT / 5.6; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt'; ctx.miterLimit = 10;
  ctx.save(); ctx.translate(tx * o, ty * o); ctx.strokeStyle = 'rgba(30,40,58,0.7)'; ctx.lineWidth = 2 * k; ctx.stroke(st.pcbPath); ctx.restore();
  ctx.save(); ctx.translate(-tx * o, -ty * o); ctx.strokeStyle = 'rgba(245,250,255,0.95)'; ctx.lineWidth = 1.7 * k; ctx.stroke(st.pcbPath); ctx.restore();
  // the chips' bevel: each edge lights up when it faces the lamp
  ctx.lineWidth = 2.5 * k;
  for (const [x, y, w, h] of st.chips || []) {
    const px = X(x), py = Y(y), pw = w * cs, ph = h * cs, d = 1.2 * k;
    ctx.strokeStyle = `rgba(255,255,255,${0.10 + 0.34 * Math.max(0, -ty)})`; ctx.beginPath(); ctx.moveTo(px, py + d); ctx.lineTo(px + pw, py + d); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.10 + 0.34 * Math.max(0, -tx)})`; ctx.beginPath(); ctx.moveTo(px + d, py); ctx.lineTo(px + d, py + ph); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + 0.34 * Math.max(0, ty)})`; ctx.beginPath(); ctx.moveTo(px, py + ph - d); ctx.lineTo(px + pw, py + ph - d); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + 0.34 * Math.max(0, tx)})`; ctx.beginPath(); ctx.moveTo(px + pw - d, py); ctx.lineTo(px + pw - d, py + ph); ctx.stroke();
  }
  // solder: every blob is a little dome, and the glint slides across it
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath();
  for (const [x, y, rr] of st.pcbJoints) { const r = rr * k, gx = X(x) - r * 0.25 - tx * r * 0.55, gy = Y(y) - r * 0.25 - ty * r * 0.55; ctx.moveTo(gx + r * 0.3, gy); ctx.arc(gx, gy, r * 0.3, 0, TAU); }
  ctx.fill();
}
/** The capacitor bumper: a yellow sleeve and a brushed aluminium top whose bow-tie shine turns with the tilt. */
function drawCapacitor(c, px, py, r) {
  const [tx, ty] = pcbTilt(), tm = Math.hypot(tx, ty);
  pcbSprites();
  if (tm > 0.08) { let d = Math.atan2(ty, tx) - PCB.capA; d = ((d + Math.PI) % TAU + TAU) % TAU - Math.PI; if (d > Math.PI / 2) d -= Math.PI; else if (d < -Math.PI / 2) d += Math.PI; PCB.capA += d * 0.25; }   // the bow-tie looks the same turned half way round
  ctx.drawImage(PCB.sleeve, px - r, py - r, r * 2, r * 2);
  const ri = r * 0.68; ctx.save(); ctx.translate(px, py); ctx.rotate(PCB.capA); ctx.drawImage(PCB.alu, -ri, -ri, ri * 2, ri * 2); ctx.restore();
  ctx.strokeStyle = 'rgba(30,38,48,0.6)'; ctx.lineWidth = Math.max(1, r * 0.05); ctx.beginPath(); ctx.moveTo(px - ri * 0.62, py); ctx.lineTo(px + ri * 0.62, py); ctx.moveTo(px, py - ri * 0.62); ctx.lineTo(px, py + ri * 0.62); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(px - r * 0.58 - tx * r * 0.2, py - r * 0.58 - ty * r * 0.2, r * 0.09, 0, TAU); ctx.fill();
  if (c.flash > 0) glowAt(px, py, r * 2.2, '#ffffff', 0.6 * c.flash);
}
/** The arcs between electrodes: thin, white-hot, trembling, violet at the edge; the tips throw off hot metal that
 *  rolls downhill. Before firing, the printed dashed line lights up, the tips spit and the red light blinks. */
function drawPcbArcs(st, dt) {
  const cs = L.cs, k = cs / 40, [tx, ty] = pcbTilt();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  st.lasers.forEach((l, j) => {
    const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1) || 1, ux = (l.x2 - l.x1) / len, uy = (l.y2 - l.y1) / len;
    const ax = X(l.x1 + ux * 0.42), ay = Y(l.y1 + uy * 0.42), bx = X(l.x2 - ux * 0.42), by = Y(l.y2 - uy * 0.42), warn = l.warn && Math.sin(clock * 45) > 0;
    if (l.led && (l.live || warn)) { const ex = X(l.led[0]), ey = Y(l.led[1]); ctx.fillStyle = '#ff4a4a'; ctx.fillRect(ex - 3 * k, ey - 2 * k, 6 * k, 4 * k); ctx.globalCompositeOperation = 'lighter'; glowAt(ex, ey, 16 * k, '#ff3c3c', 0.7); }
    ctx.globalCompositeOperation = 'lighter';
    if (l.live) {
      ctx.beginPath(); pcbBolt(pcbRng(21 + j * 5), ax, ay, bx, by, 0.2, 5); pcbBolt(pcbRng(22 + j * 5), ax, ay, bx, by, 0.34, 5);
      ctx.strokeStyle = 'rgba(120,120,255,0.3)'; ctx.lineWidth = 9 * k; ctx.stroke(); ctx.strokeStyle = 'rgba(150,215,255,0.8)'; ctx.lineWidth = 3.2 * k; ctx.stroke();
      ctx.beginPath(); pcbBolt(pcbRng(21 + j * 5), ax, ay, bx, by, 0.2, 5); ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.2, 1.8 * k); ctx.stroke();
      glowAt(ax, ay, 12 * k, '#ffffff', 1); glowAt(bx, by, 12 * k, '#ffffff', 1);
      if (PCB.fresh && PCB.hot.length < 30) for (let n = 0; n < 2; n++) { const first = Math.random() < 0.5, a = Math.random() * TAU, v = 1 + Math.random() * 2.3; PCB.hot.push({ x: first ? l.x1 + ux * 0.42 : l.x2 - ux * 0.42, y: first ? l.y1 + uy * 0.42 : l.y2 - uy * 0.42, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.6 }); }
    } else if (l.warn) {
      if (warn) { ctx.setLineDash([4 * k, 4 * k]); ctx.strokeStyle = 'rgba(150,225,255,0.9)'; ctx.lineWidth = Math.max(1.5, 2 * k); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]); }
      const r = pcbRng(23 + j * 5); ctx.beginPath();
      for (const [x, y, d] of [[ax, ay, 1], [bx, by, -1]]) for (let n = 0; n < 2; n++) { const a = Math.atan2(uy, ux) + (d < 0 ? Math.PI : 0) + (r() - 0.5) * 1.6, ll = (6 + r() * 12) * k; pcbBolt(r, x, y, x + Math.cos(a) * ll, y + Math.sin(a) * ll, 0.6, 2); }
      ctx.strokeStyle = 'rgba(150,215,255,0.8)'; ctx.lineWidth = 2.4 * k; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, k); ctx.stroke();
      glowAt(ax, ay, 8 * k, '#ffffff', 0.8); glowAt(bx, by, 8 * k, '#ffffff', 0.8);
    }
    ctx.globalCompositeOperation = 'source-over';
  });
  if (PCB.hot.length) {
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#ffb347'; ctx.lineWidth = Math.max(1, 1.4 * k); ctx.beginPath();
    for (let i = PCB.hot.length - 1; i >= 0; i--) { const h = PCB.hot[i]; h.t += dt; if (h.t > h.life || h.x < 0.12 || h.y < 0.12 || h.x > st.W - 0.12 || h.y > st.H - 0.12) { PCB.hot.splice(i, 1); continue; } h.vx += tx * 6.5 * dt; h.vy += ty * 6.5 * dt; h.vx *= 1 - 1.5 * dt; h.vy *= 1 - 1.5 * dt; h.x += h.vx * dt; h.y += h.vy * dt; ctx.moveTo(X(h.x), Y(h.y)); ctx.lineTo(X(h.x - h.vx * 0.035), Y(h.y - h.vy * 0.035)); }
    ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
  }
}
/** A spark on the circuit board: a ball of lightning hanging over it; its arcs jump to the nearest metal
 *  (solder, vias, chip legs, the rails) and each landing glows. */
function drawPcbZap(st, s, j) {
  const cs = L.cs, k = cs / 40, px = X(s.x), py = Y(s.y), r = pcbRng(40 + j * 7), flick = 0.75 + 0.25 * r();
  const hx = PCB.hx, hy = PCB.hy, nd = PCB.nd; let nh = 0;
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (PCB.zapC) pcbBlit(PCB.zapC, px, py);
  // the four nearest bits of metal within reach, and the nearest point of a rail
  for (const m of st.pcbMetal || []) {
    const d = (m[0] - s.x) ** 2 + (m[1] - s.y) ** 2; if (d > 3.4 || (nh === 4 && d >= nd[3])) continue;
    let i = nh < 4 ? nh++ : 3;
    while (i > 0 && nd[i - 1] > d) { nd[i] = nd[i - 1]; hx[i] = hx[i - 1]; hy[i] = hy[i - 1]; i--; }
    nd[i] = d; hx[i] = m[0]; hy[i] = m[1];
  }
  let best = Infinity, bq = null;
  for (const w of st.walls) { const q = nearest(w, s.x, s.y), d = Math.hypot(q[0] - s.x, q[1] - s.y); if (d < best) { best = d; bq = q; } }
  let hits = 0; ctx.beginPath();
  for (let i = 0; i < nh; i++) { if (r() < 0.75) { hx[hits] = hx[i]; hy[hits] = hy[i]; pcbBolt(r, px, py, X(hx[hits]), Y(hy[hits]), 0.5, 4); hits++; } }
  if (bq && best < 1.6 && r() < 0.6) { hx[hits] = bq[0]; hy[hits] = bq[1]; pcbBolt(r, px, py, X(bq[0]), Y(bq[1]), 0.5, 4); hits++; }
  for (let i = hits; i < 4; i++) { const a = r() * TAU, ll = (14 + r() * 16) * k; pcbBolt(r, px, py, px + Math.cos(a) * ll, py + Math.sin(a) * ll, 0.7, 3); }
  ctx.strokeStyle = 'rgba(120,150,255,0.45)'; ctx.lineWidth = 4 * k; ctx.stroke(); ctx.strokeStyle = 'rgba(225,245,255,0.95)'; ctx.lineWidth = Math.max(1, 1.1 * k); ctx.stroke();
  for (let i = 0; i < hits; i++) glowAt(X(hx[i]), Y(hy[i]), 5.5 * k, '#ffffff', 0.8);
  glowAt(px, py, 11 * k, '#ffffff', 1); glowAt(px, py, 6 * k, '#ffffff', 1);
  ctx.globalCompositeOperation = 'source-over';
  if (Math.random() < 0.25 && parts.length < MAX_PARTS) { const a = Math.random() * TAU, v = 2 + Math.random() * 3; parts.push({ x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.15 + Math.random() * 0.15, t: 0, color: Math.random() < 0.5 ? '#ffffff' : '#7fe8ff', streak: true }); }
}

function draw(dt) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  if (!S || !S.stage) return;
  const st = S.stage, cs = L.cs, th = st.theme;
  // a new stage grows in
  const e = S.phase === 'intro' ? Math.max(0, Math.min(1, S.animT / INTRO_T)) : 1, ee = 1 - (1 - e) ** 3;
  const sc = 0.92 + 0.08 * ee, cx = L.W / 2, cy = L.H / 2;
  ctx.setTransform(L.DPR * sc, 0, 0, L.DPR * sc, L.DPR * cx * (1 - sc), L.DPR * cy * (1 - sc));
  ctx.globalAlpha = ee;
  const [pfx, pfy] = drawBack(st);
  if (th === 'water') drawCaustics(st);
  ctx.drawImage(bg, 0, 0, L.W, L.H);
  if (th === 'electric') drawPcb(st);
  const pulse = 0.5 + 0.5 * Math.sin(clock * 4);
  if (st.voids.length) drawLava(st);
  if (th === 'water') { drawRiverFlow(st, dt); drawFalls(st); }
  if (th === 'neon') drawSkyOver(st);
  if (st.winds && st.winds.length) drawWinds(st);
  drawChecks(st);
  if (st.volcano) drawVolcanoGround(st);
  drawShadows(st);
  // black holes and whirlpools: a swirl around a dark heart
  for (const w of st.wells) {
    if (th === 'galaxy') { drawBlackHole(w); continue; }
    if (th === 'water') { drawWhirlpool(w); continue; }
    const px = X(w.x), py = Y(w.y), water = false;
    glowAt(px, py, w.R * cs, water ? '#3ab8ff' : '#b07bff', 0.35);
    ctx.lineCap = 'round';
    for (let k = 0; k < 5; k++) {
      const a0 = -clock * (1.6 + k * 0.25) + k * 1.3, rr = w.r * cs * (1.3 + k * (w.R / w.r - 1.3) / 5);
      ctx.strokeStyle = water ? (k % 2 ? 'rgba(200,241,255,0.45)' : 'rgba(58,184,255,0.5)') : (k % 2 ? 'rgba(255,46,136,0.45)' : 'rgba(46,230,214,0.4)');
      ctx.lineWidth = Math.max(1.2, cs * 0.045); ctx.beginPath(); ctx.arc(px, py, rr, a0, a0 + 1.6 + k * 0.2); ctx.stroke();
    }
    ctx.fillStyle = water ? '#01122a' : '#000'; ctx.beginPath(); ctx.arc(px, py, w.r * cs, 0, TAU); ctx.fill();
    glowStroke(water ? '#7fe0ff' : '#b07bff', Math.max(1.5, cs * 0.05));
  }
  // the goal
  const gc = st.goal, gr = GOAL_R * cs;
  const GC = GOAL_COL[th], gx = X(gc.x), gy = Y(gc.y);
  glowAt(gx, gy, gr * 3.4, GC, 0.3 + 0.2 * pulse);   // a beacon you can see from anywhere
  ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); glowStroke(GC, Math.max(2.5, cs * 0.09));
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(gx, gy, gr * 0.72, 0, TAU); ctx.stroke();
  ctx.setLineDash([cs * 0.09, cs * 0.09]); ctx.lineDashOffset = -clock * cs * 0.3; ctx.strokeStyle = GC; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(gx, gy, gr * 1.45, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
  const pk = (clock * 0.8) % 1; ctx.globalAlpha = ee * (1 - pk) * 0.7; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx, gy, gr * (1 + pk * 1.6), 0, TAU); ctx.stroke();
  ctx.globalAlpha = ee;
  // the turning gate
  if (st.gate) { const g = gateArc(st.gate); ctx.beginPath(); addWall(ctx, g); glowStroke('#ff6a2a', Math.max(2.5, WALL_T * cs * 1.1)); }
  // turbo pickups, each in its world's shape: a bolt, a wave, a comet, a battery, a flame
  for (const s of st.boosts) {
    if (s.got) continue;
    const L2 = BOOST_LOOK[th], r = BOOST_R * cs, px = X(s.x), py = Y(s.y), k = 0.85 + 0.15 * Math.sin(clock * 8 + s.x), u = r * 0.62;
    glowAt(px, py, r * 2.2, L2.col, 0.35);
    ctx.fillStyle = L2.col + '29'; ctx.beginPath(); ctx.arc(px, py, r * k, 0, TAU); ctx.fill();
    glowStroke(L2.col, Math.max(1.5, cs * 0.045));
    ctx.fillStyle = L2.ink; ctx.strokeStyle = L2.ink; ctx.lineWidth = Math.max(1.2, u * 0.2); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (th === 'water') {   // a drop over a wave
      ctx.moveTo(px, py - u); ctx.quadraticCurveTo(px + u * 0.6, py - u * 0.1, px, py + u * 0.35); ctx.quadraticCurveTo(px - u * 0.6, py - u * 0.1, px, py - u); ctx.fill();
      ctx.beginPath(); for (let t = -1; t <= 1.01; t += 0.25) ctx.lineTo(px + t * u, py + u * 0.7 + Math.sin(t * 5 + clock * 6) * u * 0.12); ctx.stroke();
    } else if (th === 'galaxy') {   // a comet: a star with a tail
      ctx.moveTo(px - u * 0.9, py + u * 0.9); ctx.lineTo(px + u * 0.1, py - u * 0.1); ctx.stroke();
      ctx.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5 - Math.PI / 2 + clock, rr = j % 2 ? u * 0.25 : u * 0.6; ctx.lineTo(px + u * 0.25 + rr * Math.cos(a), py - u * 0.25 + rr * Math.sin(a)); } ctx.closePath(); ctx.fill();
    } else if (th === 'electric') {   // a battery filling up
      ctx.strokeRect(px - u * 0.45, py - u * 0.75, u * 0.9, u * 1.5); ctx.fillRect(px - u * 0.18, py - u * 0.95, u * 0.36, u * 0.2);
      const lvl = Math.floor((clock * 3) % 4); for (let j = 0; j < lvl; j++) ctx.fillRect(px - u * 0.3, py + u * 0.5 - j * u * 0.38, u * 0.6, u * 0.26);
    } else if (th === 'fire') {   // a flame, flickering
      const f = 1 + 0.1 * Math.sin(clock * 15);
      ctx.moveTo(px, py - u * f); ctx.quadraticCurveTo(px + u * 0.75, py - u * 0.1, px + u * 0.35, py + u * 0.75); ctx.quadraticCurveTo(px, py + u * 0.95, px - u * 0.35, py + u * 0.75);
      ctx.quadraticCurveTo(px - u * 0.75, py - u * 0.1, px, py - u * f); ctx.fill();
      ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(px, py + u * 0.35, u * 0.28, 0, TAU); ctx.fill();
    } else {   // neon: a lightning bolt
      ctx.moveTo(px + u * 0.25, py - u); ctx.lineTo(px - u * 0.45, py + u * 0.1); ctx.lineTo(px - u * 0.02, py + u * 0.1);
      ctx.lineTo(px - u * 0.25, py + u); ctx.lineTo(px + u * 0.45, py - u * 0.15); ctx.lineTo(px + u * 0.04, py - u * 0.15); ctx.closePath(); ctx.fill();
    }
  }
  // bumpers (buoys, capacitors…): a domed cap, lit from the top left, standing on its shadow; drifting things
  for (const c of st.circles) {
    if (c.kind === 'rock') { drawRock(c); continue; }
    if (c.kind === 'island') { drawIsland(c); continue; }
    if (c.kind === 'leaf') { drawLeaf(c); continue; }
    const r = c.r * cs * (1 + 0.12 * c.flash), col = st.bump, px = X(c.x), py = Y(c.y);
    if (th === 'neon') { drawSkyBalloon(c, px, py, r); continue; }   // hot-air balloons, seen from above
    if (th === 'electric') { drawCapacitor(c, px, py, r); continue; }   // a capacitor standing on the circuit board
    ctx.drawImage(capSprite(col), px - r, py - r, r * 2, r * 2);
    if (c.flash > 0) glowAt(px, py, r * 2.2, '#ffffff', 0.6 * c.flash);
    ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); glowStroke(col, Math.max(2, cs * 0.06));
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(px, py, r * 0.55, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
  }
  // spinning bars and pistons: a bevelled bar (light on its top-left edge, shade on the other) over its shadow
  const raisedBar = (x1, y1, x2, y2, col, w) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); glowStroke(col, w);
    const l = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / l, ny = (x2 - x1) / l, sgn = nx + ny > 0 ? -1 : 1, o = w * 0.28 * sgn;
    ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, w * 0.22);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(x1 + nx * o, y1 + ny * o); ctx.lineTo(x2 + nx * o, y2 + ny * o); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(x1 - nx * o, y1 - ny * o); ctx.lineTo(x2 - nx * o, y2 - ny * o); ctx.stroke();
  };
  for (const s of st.spinners) {
    const w = spinnerSeg(s); raisedBar(X(w.x1), Y(w.y1), X(w.x2), Y(w.y2), th === 'electric' ? '#ffe14f' : th === 'neon' ? '#7fd0ff' : '#ff2e88', Math.max(3, SPIN_T * cs));
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(s.x), Y(s.y), cs * 0.06, 0, TAU); ctx.fill();
  }
  // neon blades: a hot tube swinging from its hub, crackling at the tip; a faint arc shows how far it reaches
  for (const w of st.sweeps || []) {
    const px = X(w.x), py = Y(w.y), tx = X(w.x + Math.cos(w.a) * w.len), ty = Y(w.y + Math.sin(w.a) * w.len), R = w.len * cs;
    if (th === 'neon') { drawSkyBlade(w, px, py, R); continue; }   // the sky world: a propeller blade
    ctx.setLineDash([cs * 0.06, cs * 0.12]); ctx.strokeStyle = 'rgba(255,77,109,0.22)'; ctx.lineWidth = Math.max(1, cs * 0.025);
    ctx.beginPath(); ctx.arc(px, py, R, w.a0 - SWEEP_AMP, w.a0 + SWEEP_AMP); ctx.stroke(); ctx.setLineDash([]);
    const fl = 0.8 + 0.2 * Math.random();
    ctx.globalAlpha = ee * fl; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); glowStroke('#ff4d6d', Math.max(3, cs * 0.12));
    if (th === 'neon') {   // in the sky: a red-and-white striped blade, like a warning
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, cs * 0.09); ctx.setLineDash([cs * 0.16, cs * 0.16]); ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'round';
    } else { ctx.strokeStyle = '#fff4f6'; ctx.lineWidth = Math.max(1.2, cs * 0.04); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke(); }
    ctx.globalAlpha = ee;
    ctx.strokeStyle = 'rgba(255,240,250,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let j = 0; j < 3; j++) { const a = Math.random() * TAU, l = cs * (0.1 + Math.random() * 0.16); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(a) * l * 0.5 + (Math.random() - 0.5) * cs * 0.05, ty + Math.sin(a) * l * 0.5); ctx.lineTo(tx + Math.cos(a) * l, ty + Math.sin(a) * l); }
    ctx.stroke();
    ctx.fillStyle = '#2a0a14'; ctx.beginPath(); ctx.arc(px, py, cs * 0.13, 0, TAU); ctx.fill(); glowStroke('#ff4d6d', Math.max(1.5, cs * 0.04));
  }
  for (const s of st.sliders) {
    const w = sliderSeg(s); raisedBar(X(w.x1), Y(w.y1), X(w.x2), Y(w.y2), '#9dff3a', Math.max(4, PISTON_T * cs));
    ctx.strokeStyle = 'rgba(20,40,0,0.6)'; ctx.lineWidth = Math.max(1.5, PISTON_T * cs * 0.3); ctx.setLineDash([cs * 0.1, cs * 0.1]);
    ctx.beginPath(); ctx.moveTo(X(w.x1), Y(w.y1)); ctx.lineTo(X(w.x2), Y(w.y2)); ctx.stroke(); ctx.setLineDash([]);
  }

  // beams: electric arcs, flame jets, or plain lasers; a flicker before they fire
  const beam = th === 'electric' ? ['#4fd8ff', '#ffffff'] : th === 'fire' ? ['#ff7a1a', '#ffe27a'] : ['#ff2e4d', '#ffffff'];
  if (th === 'electric') drawPcbArcs(st, dt);
  for (const l of th === 'electric' ? [] : st.lasers) {
    const on = l.live, warn = l.warn && Math.sin(clock * 45) > 0;
    for (const [x, y] of [[l.x1, l.y1], [l.x2, l.y2]]) { ctx.fillStyle = on ? beam[0] : beam[0] + '99'; ctx.beginPath(); ctx.arc(X(x), Y(y), cs * 0.11, 0, TAU); ctx.fill(); }
    if (on) {
      ctx.globalCompositeOperation = 'lighter';
      const mx = (l.x1 + l.x2) / 2, my = (l.y1 + l.y2) / 2, len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
      if (th === 'electric') {
        glowAt(X(mx), Y(my), len * cs * 0.75, '#4fd8ff', 0.18 + 0.12 * Math.random());   // it lights up the room, flickering
        for (let k = 0; k < 2; k++) { jagged(l.x1, l.y1, l.x2, l.y2, 9, 0.35); glowStroke(beam[0], Math.max(1.5, cs * 0.05)); ctx.strokeStyle = beam[1]; ctx.lineWidth = 1; ctx.stroke(); }
        for (let k = 0; k < 3; k++) {   // short branches forking off
          const t = 0.2 + Math.random() * 0.6, bx = l.x1 + (l.x2 - l.x1) * t, by = l.y1 + (l.y2 - l.y1) * t, a = Math.random() * TAU, bl = 0.25 + Math.random() * 0.35;
          jagged(bx, by, bx + Math.cos(a) * bl, by + Math.sin(a) * bl, 4, 0.12); ctx.strokeStyle = 'rgba(159,240,255,0.7)'; ctx.lineWidth = 1; ctx.stroke();
        }
      } else if (th === 'fire') {
        glowAt(X(mx), Y(my), len * cs * 0.7, '#ff7a1a', 0.25 + 0.1 * Math.random());
        jagged(l.x1, l.y1, l.x2, l.y2, 7, 0.18); glowStroke(beam[0], Math.max(4, cs * 0.16)); ctx.strokeStyle = beam[1]; ctx.lineWidth = Math.max(1.5, cs * 0.05); ctx.stroke();
      }
      else { ctx.beginPath(); ctx.moveTo(X(l.x1), Y(l.y1)); ctx.lineTo(X(l.x2), Y(l.y2)); glowStroke(beam[0], Math.max(3, cs * 0.1)); ctx.strokeStyle = beam[1]; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.setLineDash([3, cs * 0.12]); ctx.strokeStyle = warn ? beam[0] : beam[0] + '4d'; ctx.lineWidth = warn ? 2.5 : 1.5;
      ctx.beginPath(); ctx.moveTo(X(l.x1), Y(l.y1)); ctx.lineTo(X(l.x2), Y(l.y2)); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  // sparks: electric sparks, fireballs, or plain sparks
  const sc1 = th === 'electric' ? '#7fe9ff' : '#ff8a3d', sc2 = th === 'electric' ? '#ffffff' : '#fff6d8';
  for (const k of st.sparks) {
    if (th === 'electric') { drawPcbZap(st, k, st.sparks.indexOf(k)); continue; }
    const r = SPARK_R * cs, px = X(k.x), py = Y(k.y), rot = clock * 6;
    glowAt(px, py, r * 2.6, sc1, 0.7);
    ctx.beginPath();
    for (let j = 0; j < 16; j++) { const a = rot + j * Math.PI / 8, rr = j % 2 ? r * 0.45 : r * (1.05 + 0.2 * Math.sin(clock * 20 + j)); ctx.lineTo(px + rr * Math.cos(a), py + rr * Math.sin(a)); }
    ctx.closePath(); ctx.fillStyle = sc1; ctx.fill();
    ctx.fillStyle = sc2; ctx.beginPath(); ctx.arc(px, py, r * 0.32, 0, TAU); ctx.fill();
  }
  // the marble and its trail
  let scale = 1, alpha = ee;
  if (S.phase === 'fall') {
    const k = Math.min(1, S.animT / FALL_T);
    if (S.fallKind === 'hole' || S.fallKind === 'well' || S.fallKind === 'lava') { scale = 1 - 0.9 * k; alpha = 1 - k * 0.7; } else { scale = 1 + 0.6 * k; alpha = (1 - k) * (Math.sin(S.animT * 40) > 0 ? 1 : 0.3); }
  } else if (S.phase === 'sink') scale = 1 - 0.9 * Math.min(1, S.animT / SINK_T);
  else if (S.phase === 'plunge') { const k = Math.min(1, S.animT / PLUNGE_T); scale = 1 + 0.25 * Math.sin(k * Math.PI * 0.5) - 0.5 * k * k; }   // over the lip, then down
  else if (S.spawnT > 0) scale = 1 + Math.sin((1 - S.spawnT / 0.35) * Math.PI) * 0.25;
  if (S.phase === 'play' && S.safeT > 0 && Math.sin(S.safeT * 25) < -0.3) alpha *= 0.35;   // blinking: safe for a moment after a life
  const speed = Math.hypot(S.vx, S.vy), T = THEMES[th];
  if (S.phase === 'play' && (speed > 1.2 || S.boostT > 0)) { trail.push([S.x, S.y]); if (trail.length > 12) trail.shift(); } else if (trail.length) trail.shift();
  for (let j = 0; j < trail.length; j++) {
    const k = (j + 1) / trail.length, [tx, ty] = trail[j];
    ctx.globalAlpha = alpha * k * (S.boostT > 0 ? 0.4 : 0.22); ctx.fillStyle = S.boostT > 0 ? BOOST_LOOK[th].col : T.halo;
    ctx.beginPath(); ctx.arc(X(tx), Y(ty), BALL_R * cs * (0.25 + 0.55 * k), 0, TAU); ctx.fill();
  }
  // what each marble sheds: stardust, bubbles, embers, little sparks
  if (S.phase === 'play' && (speed > 1.6 || th === 'fire') && Math.random() < (th === 'fire' ? 0.35 : 0.3) && parts.length < MAX_PARTS) {
    const bx = S.x - (speed > 0.1 ? S.vx / speed : 0) * BALL_R, by = S.y - (speed > 0.1 ? S.vy / speed : 0) * BALL_R;
    const col = T.dust[Math.floor(Math.random() * T.dust.length)];
    if (th === 'water') parts.push({ x: bx, y: by, vx: (Math.random() - 0.5) * 0.6, vy: -0.4 - Math.random() * 0.6, life: 0.6, t: 0, color: col, bubble: true });
    else if (th === 'fire') { /* the fire trail is shed below, every frame */ }
    else if (th === 'electric') parts.push({ x: S.x, y: S.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 0.15, t: 0, color: col, streak: true });
    else parts.push({ x: bx, y: by, vx: -S.vx * 0.15 + (Math.random() - 0.5), vy: -S.vy * 0.15 + (Math.random() - 0.5), life: 0.5, t: 0, color: col, dust: true });
  }
  ctx.globalAlpha = 1;
  if (th === 'fire' && S.phase === 'play' && speed > 0.4) shedFire(speed);   // a trail of fire where the marble rolls
  let dip = 0;
  if (S.phase === 'play') {
    for (const h of st.holes) dip = Math.max(dip, 1 - (Math.hypot(h.x - S.x, h.y - S.y) - h.r * 0.5) / (h.r * 0.5 + SLOPE_W));
    dip = Math.max(dip, 1 - (Math.hypot(st.goal.x - S.x, st.goal.y - S.y) - GOAL_R * 0.5) / (GOAL_R * 0.5 + SLOPE_W));
    for (const w of st.wells) dip = Math.max(dip, 0.8 * (1 - (Math.hypot(w.x - S.x, w.y - S.y) - w.r) / (w.R - w.r)));
    dip = Math.max(0, Math.min(1, dip));
  }
  if (S.phase !== 'over' || !S.won) {
    drawBall(S.x, S.y, scale * (1 - 0.14 * dip), alpha);
    if (dip > 0.02) { ctx.globalAlpha = 0.35 * dip; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(X(S.x), Y(S.y), BALL_R * cs * scale * (1 - 0.14 * dip), 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  }
  if (st.volcano) drawBombs(st);
  // light and sparkles, added on top of the neon
  ctx.globalCompositeOperation = 'lighter';
  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i]; f.t += dt; if (f.t >= f.life) { flashes.splice(i, 1); continue; }
    const k = f.t / f.life; glowAt(X(f.x), Y(f.y), f.r * cs * (0.6 + 0.6 * k), f.color, (1 - k) * 0.6);
  }
  ctx.lineCap = 'round';
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.t += dt; if (p.t >= p.life) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; const damp = p.streak ? 0.88 : 0.94; p.vx *= damp; p.vy *= damp;
    const a = 1 - p.t / p.life;
    if (p.streak) {   // a short glowing line along its flight: wide and faint, then thin and bright
      ctx.strokeStyle = p.color; ctx.beginPath(); ctx.moveTo(X(p.x), Y(p.y)); ctx.lineTo(X(p.x - p.vx * 0.06), Y(p.y - p.vy * 0.06));
      ctx.globalAlpha = a * 0.3; ctx.lineWidth = Math.max(3, cs * 0.12); ctx.stroke();
      ctx.globalAlpha = a; ctx.lineWidth = Math.max(1.2, cs * 0.045); ctx.stroke();
    } else if (p.flame) {   // fire left behind: yellow core in an orange-red glow, shrinking
      const k = p.t / p.life, rr = L.cs * BALL_R * p.size * (1 - 0.6 * k);
      flameDot(X(p.x), Y(p.y), rr * 1.6, k < 0.4 ? '#ff9a2e' : '#ff4a1a', a * 0.22); flameDot(X(p.x), Y(p.y), rr * 0.6, '#ffe27a', a * (1 - k) * 0.3);
    } else if (p.bubble) { ctx.globalAlpha = a * 0.8; ctx.strokeStyle = p.color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), Math.max(1.5, cs * 0.05) * (1 + p.t), 0, TAU); ctx.stroke(); }
    else { ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), p.dust ? Math.max(1, cs * 0.028) : Math.max(1.5, cs * 0.05), 0, TAU); ctx.fill(); }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // the drag stick
  if (drag && drag.on) {
    ctx.setTransform(L.DPR, 0, 0, L.DPR, 0, 0);
    const r = wrap.getBoundingClientRect(), ox = drag.x0 - r.left, oy = drag.y0 - r.top, R = Math.min(L.W, L.H) * 0.17;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox, oy, R, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(ox + drag.vx * R, oy + drag.vy * R, R * 0.32, 0, TAU); ctx.fill();
  }
}

/* ================================================================== */
/* Sound and touch feedback                                            */
/* ================================================================== */
let AC = null, master = null, rollG = null;
function audio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.6; master.connect(AC.destination);
    // a soft rumble that follows the marble's speed
    const buf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    rollG = AC.createGain(); rollG.gain.value = 0; src.connect(lp).connect(rollG).connect(master); src.start();
  } catch (_) { AC = null; }
}
function tone(f, d, { type = 'sine', v = 0.2, to = 0, at = 0 } = {}) {
  if (!AC || isMuted()) return;
  const t = AC.currentTime + at, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(master); o.start(t); o.stop(t + d + 0.03);
}
const sfx = {
  hit: s => tone(120 + s * 25, 0.07, { type: 'triangle', v: Math.min(0.3, 0.06 + s * 0.04) }),
  bump: () => { tone(330, 0.12, { type: 'square', v: 0.12, to: 660 }); },
  fall: () => tone(560, 0.6, { type: 'sawtooth', v: 0.1, to: 55 }),
  suck: () => { tone(300, 0.7, { type: 'sine', v: 0.18, to: 40 }); tone(900, 0.5, { type: 'triangle', v: 0.06, to: 120 }); },
  lava: () => { tone(160, 0.5, { type: 'sawtooth', v: 0.12, to: 60 }); tone(1400, 0.2, { type: 'square', v: 0.05, to: 300 }); },
  zap: () => { tone(1200, 0.25, { type: 'sawtooth', v: 0.12, to: 90 }); tone(90, 0.3, { type: 'square', v: 0.1, at: 0.05 }); },
  boost: () => { tone(180, 0.35, { type: 'sawtooth', v: 0.12, to: 1400 }); tone(90, 0.3, { type: 'square', v: 0.06, to: 300 }); },
  goal: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, { type: 'triangle', v: 0.22, at: i * 0.07 })),
  check: () => { tone(784, 0.1, { type: 'triangle', v: 0.16 }); tone(1175, 0.18, { type: 'triangle', v: 0.16, at: 0.08 }); },
  tick: hi => tone(hi ? 988 : 660, 0.09, { type: 'square', v: 0.07 }),
  win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, { type: 'triangle', v: 0.22, at: i * 0.1 })),
  lose: () => [440, 370, 311, 220].forEach((f, i) => tone(f, 0.3, { type: 'sawtooth', v: 0.08, at: i * 0.14 })),
};
function roll() {
  if (!rollG) return;
  const on = S && S.phase === 'play' ? Math.min(1, Math.hypot(S.vx, S.vy) / VMAX) : 0;
  rollG.gain.setTargetAtTime(isMuted() ? 0 : on * 0.22, AC.currentTime, 0.05);
}
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };
let wakeLock = null;
async function wake() {
  try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (_) {}
}

/* ================================================================== */
/* Screen: HUD, toasts, cards, flow                                    */
/* ================================================================== */
const $ = id => document.getElementById(id);
const card = $('card'), cBtn = $('cBtn'), cBtn2 = $('cBtn2'), toastEl = $('toast'), hintEl = $('hint');
$('pause').setAttribute('aria-label', UI.boPause);
const HEART = '<svg viewBox="0 0 24 22"><path d="M12 20.5C5.5 15 1.5 11.4 1.5 6.8a5.2 5.2 0 0 1 10.5-1.5 5.2 5.2 0 0 1 10.5 1.5c0 4.6-4 8.2-10.5 13.7z"/></svg>';
$('hearts').innerHTML = HEART.repeat(LIVES);
/** The hearts: full, or broken (the one just lost cracks). */
function hearts(reset) {
  [...$('hearts').children].forEach((h, i) => {
    const lost = S && i >= S.lives;
    if (lost && !h.classList.contains('lost') && !reset) { h.classList.add('breaking'); setTimeout(() => h.classList.remove('breaking'), 700); }
    h.classList.toggle('lost', !!lost);
  });
}
let hudShown = '';
/** Stage and turbo on the left, hearts in the middle, the time left on the right (orange once 100 is gone, pink at the end). */
function hud(force) {
  if (!S) return;
  const key = `${S.stageIdx}|${Math.floor(S.stageT)}|${S.phase === 'over'}`;
  if (key === hudShown && !force) return; hudShown = key;
  const name = UI.boStages[S.stage.i].split('|')[0];
  $('stageLbl').innerHTML = `${fmt(UI.boStage, { n: Math.min(S.stageIdx + 1, STAGES.length), m: STAGES.length, name })}${S.boostT > 0 ? `<b class="zp">⚡${Math.ceil(S.boostT)}</b>` : ''}`;
  const c = $('clock'), par = S.stage.par; c.innerHTML = `${mmss(S.stageT)}<small>par ${mmss(par)}</small>`;   // a stopwatch for this stage, with its par underneath; it never runs out
  c.classList.toggle('late', S.stageT > par); c.classList.remove('low');
}
function toast(big, small = '', hold = false) {
  toastEl.innerHTML = '';
  toastEl.append(document.createTextNode(big));
  if (small) { const s = document.createElement('small'); s.textContent = small; toastEl.append(s); }
  toastEl.className = 'cm-toast'; void toastEl.offsetWidth; toastEl.className = 'cm-toast ' + (hold ? 'hold' : 'pop');
}
let hintTimer = 0;
function hint(text, ms = 6000) {
  clearTimeout(hintTimer);
  if (!text) { hintEl.classList.add('off'); return; }
  hintEl.textContent = text; hintEl.classList.remove('off');
  hintTimer = setTimeout(() => hintEl.classList.add('off'), ms);
}
function showCard({ emoji, title, body, btn, onBtn, btn2, onBtn2 }) {
  $('cEmoji').textContent = emoji; $('cTitle').textContent = title; $('cBody').innerHTML = body;
  cBtn.textContent = btn; cBtn.onclick = onBtn;
  cBtn2.hidden = !btn2; if (btn2) { cBtn2.textContent = btn2; cBtn2.onclick = onBtn2; }
  card.hidden = false;
}
const hideCard = () => { card.hidden = true; };

const BALL_SVG = (cx, cy, r, cls = '') => `<g class="${cls}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gxb)" stroke="#d9b8ff" stroke-width="1.2"/><circle cx="${cx - r * 0.35}" cy="${cy - r * 0.4}" r="${r * 0.18}" fill="#fff"/></g>`;
const GX_DEF = '<defs><radialGradient id="gxb" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ff6fb5"/><stop offset=".45" stop-color="#8a4dff"/><stop offset="1" stop-color="#140840"/></radialGradient></defs>';
const SVG = {
  flat: `<svg viewBox="0 0 100 64">${GX_DEF}<path d="M6 54 H94" stroke="rgba(255,255,255,.35)" stroke-width="2"/><g class="s-flat"><path d="M22 52 L78 52 L67 32 L33 32 Z" fill="#2a0a4a" stroke="#2ee6d6" stroke-width="2" stroke-linejoin="round"/>${BALL_SVG(57, 42, 4)}</g></svg>`,
  keys: '<svg viewBox="0 0 100 64"><g fill="#2a0a4a" stroke="#2ee6d6" stroke-width="2"><rect x="40" y="6" width="20" height="20" rx="4"/><rect x="16" y="32" width="20" height="20" rx="4"/><rect x="40" y="32" width="20" height="20" rx="4"/><rect class="s-key" x="64" y="32" width="20" height="20" rx="4"/></g><g fill="#fff" font-size="10" text-anchor="middle" font-family="sans-serif"><text x="50" y="20">▲</text><text x="26" y="46">◀</text><text x="50" y="46">▼</text><text x="74" y="46">▶</text></g></svg>',
  tilt: `<svg viewBox="0 0 100 64">${GX_DEF}<path d="M43 60 L50 47 L57 60 Z" fill="rgba(255,255,255,.3)"/><g class="s-tilt"><rect x="12" y="42" width="76" height="5" rx="2.5" fill="#2ee6d6"/>${BALL_SVG(50, 36, 6, 's-roll')}</g></svg>`,
  lives: `<svg viewBox="0 0 100 64">${GX_DEF}<circle cx="34" cy="40" r="9" fill="#000" stroke="#ff2e88" stroke-width="2"/>${BALL_SVG(34, 40, 6, 's-fall')}<g fill="#ff2e88" stroke="#ff2e88" stroke-width="1.5" transform="translate(56 14) scale(.62)"><path d="M12 20.5C5.5 15 1.5 11.4 1.5 6.8a5.2 5.2 0 0 1 10.5-1.5 5.2 5.2 0 0 1 10.5 1.5c0 4.6-4 8.2-10.5 13.7z"/><path transform="translate(26 0)" d="M12 20.5C5.5 15 1.5 11.4 1.5 6.8a5.2 5.2 0 0 1 10.5-1.5 5.2 5.2 0 0 1 10.5 1.5c0 4.6-4 8.2-10.5 13.7z"/><path class="s-heart" transform="translate(13 22)" d="M12 20.5C5.5 15 1.5 11.4 1.5 6.8a5.2 5.2 0 0 1 10.5-1.5 5.2 5.2 0 0 1 10.5 1.5c0 4.6-4 8.2-10.5 13.7z"/></g></svg>`,
  clock: '<svg viewBox="0 0 100 64"><circle cx="38" cy="36" r="20" fill="#2a0a4a" stroke="#ffd23f" stroke-width="3"/><rect x="33" y="9" width="10" height="6" rx="2" fill="#ffd23f"/><g class="s-hand"><path d="M38 36 V21" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g><circle cx="38" cy="36" r="2.5" fill="#fff"/><text x="80" y="30" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="17" fill="#9dff3a">20</text><text x="80" y="47" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="10" fill="rgba(255,255,255,.75)">PAR</text></svg>',
};
/** A run from the start; `from` resumes one saved at the start of a stage (C-6). */
export async function play(from) {
  layout(); audio();
  const ok = await askTilt();
  hideCard(); wake();
  if (!tiltSeen && ok) await new Promise(r => setTimeout(r, 450));
  tiltMode = tiltSeen && ok;
  calib = { x: 0, y: 0 }; calSamples = [];
  newGame(from); hudShown = ''; hud(true);
  hint(tiltMode ? UI.boHintTilt : isCoarse ? (ok ? UI.boHintDrag : UI.boNoTilt) : UI.boHintDesk, 3500);
  const first = S.stage.i, at = S.stageIdx; setTimeout(() => { if (S && S.stageIdx === at && S.phase !== 'over') { const [a, b] = UI.boStages[first].split('|'); toast(a, b); hint(UI.boTips[first], 5500); } }, 3600);
}
/** Where the run is, to save it at the start of each stage (C-6): the seed and order rebuild the same courses. */
const snapshot = () => ({ seed: RUN_SEED, order: S.order, stageIdx: S.stageIdx, lives: S.lives, falls: S.falls, results: S.results, elapsed: S.elapsed });
let hooks = { onStage() {}, onEnd() {} };
/** The page (game.js) hears each stage start and the end of the run. */
export function connect(h) { hooks = Object.assign(hooks, h); }
/** Stops the run without a result (the page left the play screen). */
export function stop() { if (S) S.phase = 'menu'; hint(''); hideCard(); }
function finish(won, why) {
  S.phase = 'over'; S.won = won; hint(''); hud(true);
  const sc = scoreOf();
  if (won) { sfx.win(); buzz([30, 50, 30, 50, 80]); for (let i = 0; i < 4; i++) setTimeout(() => S && burst(Math.random() * S.stage.W, Math.random() * S.stage.H, ['#ffd23f', '#ff2e88', '#2ee6d6', '#9dff3a'][i], 30), i * 180); }
  else { sfx.lose(); buzz([60, 60, 120]); toast(why === 'time' ? UI.boTimeUp : UI.boOver); }
  const end = { won, score: sc, elapsed: S.elapsed, results: S.results.map(o => ({ ...o, name: UI.boStages[o.i].split('|')[0] })) };
  setTimeout(() => hooks.onEnd(end), won ? 1400 : 1100);
}
function togglePause() {
  if (!S || S.phase === 'over' || S.phase === 'menu') return;
  if (S.phase === 'paused') { resume(false); return; }
  S.before = S.phase === 'ready' ? S.after : S.phase; S.phase = 'paused'; drag = null;
  const name = UI.boStages[S.stage.i].split('|')[0];
  showCard({ emoji: '⏸', title: UI.boPaused, body: `<p class="nota">${fmt(UI.boStage, { n: S.stageIdx + 1, m: STAGES.length, name })} · ${mmss(S.stageT)} / ${mmss(S.stage.par)}</p>`,
    btn: UI.boResume, onBtn: () => resume(false), btn2: tiltMode ? UI.boRecal : '', onBtn2: () => resume(true) });
}
function resume(recal) {
  hideCard(); audio(); wake();
  S.after = S.before || 'play'; S.phase = 'ready'; S.readyT = recal ? 0 : READY_STEP * 1.6; S.tick = -1; S.calibrate = recal && tiltMode; calSamples = [];
}
$('pause').onclick = togglePause;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (S && S.phase !== 'paused' && S.phase !== 'over' && S.phase !== 'menu') togglePause(); }
  else if (S && S.phase !== 'over') wake();
});

/* ---------- the loop ---------- */
let last = 0, acc = 0;
function frame(ts) {
  if (!wrap.offsetParent) { last = 0; requestAnimationFrame(frame); return; }
  const dt = Math.min(0.1, last ? (ts - last) / 1000 : 0); last = ts; clock += dt;
  readTilt(dt);
  if (S) {
    acc += dt; let n = 0;
    while (acc >= DT && n < 14) { step(); acc -= DT; n++; if (S.phase === 'over') { acc = 0; break; } }
    if (n >= 14) acc = 0;
    if (S.phase === 'menu') moveThings();
    hud(); roll();
  }
  draw(dt);
  requestAnimationFrame(frame);
}
new ResizeObserver(layout).observe(wrap);
// Nothing is built until the page starts a run (play)

window.__cosmicMarble = { get S() { return S; }, generateCourse, setSeed: v => { RUN_SEED = v; }, draw, flowAt, buildCourse: (ti, d) => { S.stage = buildStage(ti, d, boardAspect()); S.stageIdx = d - 1; S.spawn = null; S.t = 0; respawn(); fit(); hud(true); }, tilt, rawTilt, keys, buildStage, STAGES, newGame, loadStage, finish, step, scoreOf, UI, LANG, TEXTS, play, nearest, segDist,
  HIT_R, BALL_R, set tiltMode(v) { tiltMode = v; }, get L() { return L; } };
requestAnimationFrame(frame);

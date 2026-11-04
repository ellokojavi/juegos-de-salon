/**
 * Aletazo's engine (lab prototype): the physics, the course and the rules, with no DOM, so the game
 * (game.js), the drawing (scene.js) and the tests read the same numbers.
 *
 * The world is measured in stage heights: 1 is the stage's height and `W` its width over its height.
 * The bird stays at a fixed x and the course (hoops, walls, spikes) slides left under it. `step(g, dt)`
 * advances a game and leaves what happened in `g.events` for the game to play (sounds, sparks, points).
 */

export const G = 3.0;            // gravity, heights per second²
export const FLAP = 0.85;        // the speed a flap gives upwards
export const MAX_FALL = 1.5;     // the fastest it falls
export const BR = 0.036;         // the bird's radius
export const RIM = 0.013;        // the radius of a hoop's two solid ends
export const GROUND = 0.9;       // where the ground starts
export const PERFECT = 0.3;      // dead center: within this share of the hoop's radius
export const WALL = 0.07;        // a wall's thickness
export const LEVEL_EVERY = 5;    // a new level every 5 gates
export const LIVES = 3;
export const SHIELD = 1.3;       // seconds the bird can't be hurt after a hit
export const NEON = ['#ff2e88', '#ff7a1a', '#ffd23f', '#9dff3a', '#2ee6d6', '#8a4dff'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** A seeded random in [0, 1) (mulberry32), so a test can replay the same course. */
export function rng(seed = Math.random() * 2 ** 32) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A narrow (portrait) stage sees less ahead: the world slows and tightens with it, so gates come at the same pace. */
export const fit = W => clamp(W / 0.9, 0.68, 1);
export const levelOf = passed => 1 + Math.floor(passed / LEVEL_EVERY);
/** Points between one time of day and the next (day, afternoon, night, then day again). */
export const SKY_EVERY = 30;
/**
 * The time of day a game is at, counting up without wrapping (0 day, 1 afternoon, 2 night, 3 day…):
 * the cover's demo is always night, a game starts by day and moves on every SKY_EVERY points.
 */
export const skyOf = g => (g.mode === 'demo' ? 2 : Math.floor(g.score / SKY_EVERY));
/** Difficulty from 0 up, never reaching 1: level 1 = 0, 3 ≈ 0.33, 6 ≈ 0.63, 11 ≈ 0.86. */
export const diff = level => 1 - Math.exp(-(level - 1) / 5);
/** Each level is clearly faster for the first ten, then keeps climbing slower, never stopping. */
export const targetSpeed = (level, W) => (0.55 + 0.055 * Math.min(level - 1, 10) + 0.02 * Math.max(0, level - 11)) * fit(W);
/** The result's line, by score: 0 nest, 1 getting the hang, 2 flying pretty, 3 high flyer, 4 king of the sky. */
export const verdictOf = score => (score >= 51 ? 4 : score >= 31 ? 3 : score >= 16 ? 2 : score >= 6 ? 1 : 0);

/**
 * A new game on a stage `W` wide, ready to fly: the bird hovers until the first flap. `mode: 'demo'`
 * flies itself (the cover); `mode: 'glide'` is the countdown's: the bird glides on, wings still, with no
 * gates to cross; `band` ([top, bottom], in heights) keeps a demo's hoops in
 * the free strip above the cover's card, smaller and whole. `y` starts the bird where a demo left it;
 * `level` and `score` start a tester's game further on (its gates and speed, and its sky).
 */
export function newGame({ W = 0.55, random = Math.random, mode = 'ready', band = null, y = 0.45, level = 1, score = 0 } = {}) {
  const g = {
    W, random, mode, band, clock: 0, speed: 0, scroll: 0, hoverY: y,
    bird: { x: Math.min(0.45, W * 0.3), y, vy: 0, flapT: 0, rot: 0, spin: 0 },
    gates: [], spikes: [], gateCount: 0,
    score: 0, passed: 0, perfects: 0, walls: 0, hearts: LIVES, shield: 0, level: 1, dieT: 0,
    wallsSeen: false, events: [],
  };
  // A tester's start (game.js): from a level, as if its gates had been passed, and with points for the sky
  if (level > 1) { g.level = level; g.passed = (level - 1) * LEVEL_EVERY; g.gateCount = g.passed; }
  g.score = score;
  g.speed = targetSpeed(g.level, W);
  if (mode !== 'glide') while (needSpawn(g)) spawn(g);
  return g;
}

export const needSpawn = g => !g.gates.length || g.gates[g.gates.length - 1].x < g.W + 0.6;

/**
 * The next gate: a hoop, a hoop set in a wall, or a bare gap in a wall. From level 2 some gates are
 * walls from the sky to the ground with one opening; how many, and how narrow, grows with the level.
 * Hoops get smaller, further apart in height and, from 6 gates in, some of them move.
 */
export function spawn(g) {
  const R = g.random, rnd = (a, b) => a + R() * (b - a);
  const d = diff(g.level), last = g.gates[g.gates.length - 1];
  const gap = (0.95 - 0.32 * d) * fit(g.W);
  const x = last ? last.x + gap * rnd(0.92, 1.08) : g.bird.x + 0.75;
  const r = (0.17 - 0.075 * d) * rnd(0.95, 1.05);
  const maxDy = g.gateCount < 3 ? 0.08 : 0.18 + 0.3 * d;   // the first hoops are a warm-up
  const band = g.mode === 'demo' && g.band;
  let baseY = last ? clamp(last.baseY + rnd(-maxDy, maxDy), 0.22, 0.72) : 0.45;
  if (band) baseY = rnd(band[0], band[1]);   // the cover's demo: only above the card
  const moving = g.passed >= 6 && R() < 0.15 + 0.6 * d;
  const amp = moving ? clamp(0.03 + 0.11 * d, 0, Math.min(baseY - 0.18, 0.78 - baseY)) : 0;
  const wall = g.gateCount >= 5 && g.passed >= LEVEL_EVERY && !(last?.wall && R() < 0.5) && R() < Math.min(0.55, 0.25 + 0.45 * d);
  const bare = wall && R() < 0.35 + 0.3 * d;
  const gate = {
    x: wall && last ? x + 0.08 : x, baseY, y: baseY,
    r: bare ? (0.15 - 0.045 * d) * rnd(0.95, 1.05) : band ? r * 0.7 : r,
    amp: wall ? (d > 0.45 ? amp * 0.6 : 0) : amp, w: rnd(1.4, 2.4), ph: R() * 6,
    color: NEON[g.gateCount % NEON.length], wall, bare,
    done: false, hit: false, ok: 0, flash: 0,
  };
  g.gates.push(gate); g.gateCount++;
  // From some way in, a spinning spike between two hoops, off the straight line, punishes wide arcs.
  // Never next to a wall, so no way through is ever closed
  if (last && !wall && !last.wall && g.passed >= 12 && R() < 0.15 + 0.45 * d) {
    const mid = (last.baseY + baseY) / 2, side = mid > 0.47 ? -1 : 1;
    g.spikes.push({ x: (last.x + x) / 2, baseY: clamp(mid + side * rnd(0.17, 0.24), 0.1, GROUND - 0.08), y: 0, r: 0.032, a: 0, bob: R() * 6 });
  }
  return gate;
}

/** A tap: the first one starts the game; every one sends the bird up. */
export function flap(g) {
  if (g.mode === 'ready') g.mode = 'play';
  if (g.mode !== 'play' && g.mode !== 'demo') return false;
  g.bird.vy = -FLAP; g.bird.flapT = 1;
  g.events.push({ type: 'flap' });
  return true;
}

/** What crossing a gate's line at height `y` is worth: 'perfect' (+2), 'pass' (+1) or 'miss'. */
export function crossing(gate, y) {
  const dy = Math.abs(y - gate.y);
  if (gate.bare) return dy < gate.r ? 'pass' : 'miss';
  if (dy < gate.r - BR * 0.5) return dy < gate.r * PERFECT ? 'perfect' : 'pass';
  return 'miss';
}

function hurt(g) {
  g.hearts--; g.shield = SHIELD;
  g.events.push({ type: 'hit', x: g.bird.x, y: g.bird.y });
  if (g.hearts <= 0) { g.mode = 'dying'; g.dieT = 0; g.bird.vy = -0.5; g.events.push({ type: 'over' }); }
}

function cross(g, gate) {
  gate.done = true;
  if (gate.hit) return;
  const kind = crossing(gate, g.bird.y);
  if (kind === 'miss') {
    gate.ok = -1;
    if (g.shield <= 0) hurt(g);
    return;
  }
  g.passed++; gate.flash = 1;
  if (gate.wall) g.walls++;
  if (kind === 'perfect') { g.score += 2; g.perfects++; gate.ok = 2; }
  else { g.score += 1; gate.ok = 1; }
  g.events.push({ type: kind, x: gate.x, y: gate.y, color: gate.bare ? '#2ee6d6' : gate.color });
  const lv = levelOf(g.passed);
  if (lv > g.level) { g.level = lv; g.events.push({ type: 'level', level: lv }); }
}

/**
 * The demo on the cover flies itself on a smooth path through the middle of every hoop: between the last
 * gate behind and the next one ahead it eases from one's center to the other's, so it never touches a rim.
 * It beats its wings while it climbs.
 */
export function autopilot(g, dt = 0) {
  const b = g.bird, ahead = g.gates.find(h => h.x > b.x);
  if (!ahead) return;
  const behind = [...g.gates].reverse().find(h => h.x <= b.x);
  const x0 = behind ? behind.x : b.x - 0.6, y0 = behind ? behind.y : b.y;
  const k = Math.min(1, Math.max(0, (b.x - x0) / Math.max(0.01, ahead.x - x0))), e = k * k * (3 - 2 * k);
  const y = y0 + (ahead.y - y0) * e;
  b.vy = dt > 0 ? (y - b.y) / dt : 0; b.y = y;
  b.rot = clamp(b.vy * 0.55, -0.45, 1.1);
  if (b.vy < -0.05 && b.flapT <= 0) b.flapT = 1;
}

/** Advances the game `dt` seconds. Modes: 'demo' (the cover's), 'glide' (the countdown's), 'ready', 'play', 'dying' and 'over'. */
export function step(g, dt) {
  const b = g.bird;
  g.clock += dt;
  g.speed += (targetSpeed(g.level, g.W) - g.speed) * Math.min(1, dt * 2.5);   // a new level eases in over about a second
  const sp = g.mode === 'ready' ? 0.25 : g.mode === 'dying' ? g.speed * Math.max(0, 1 - g.dieT * 1.5) : g.mode === 'over' ? 0 : g.speed;
  g.scroll += sp * dt;
  b.flapT = Math.max(0, b.flapT - dt / 0.2);

  // Waiting for the first flap: the bird eases from where the countdown's flight left it to the middle, level
  if (g.mode === 'ready') { g.hoverY += (0.45 - g.hoverY) * Math.min(1, dt * 3); b.y = g.hoverY + Math.sin(g.clock * 3.2) * 0.022; b.vy = 0; b.rot = 0; return; }
  if (g.mode === 'over') return;
  // The countdown: the city scrolls by and the bird glides, wings still, rising and sinking slowly; no gates
  if (g.mode === 'glide') { g.hoverY += (0.45 - g.hoverY) * Math.min(1, dt); b.y = g.hoverY + Math.sin(g.clock * 1.3) * 0.05; b.vy = Math.cos(g.clock * 1.3) * 0.065; b.rot = clamp(b.vy * 1.5, -0.12, 0.12); return; }
  const live = g.mode === 'play';

  if (g.mode === 'demo') autopilot(g, dt);
  else {
    b.vy = Math.min(MAX_FALL, b.vy + G * dt);
    b.y += b.vy * dt;
    if (b.y < BR) { b.y = BR; b.vy = Math.max(0, b.vy); }
    b.rot = clamp(b.vy * 0.55, -0.45, 1.1);
  }
  if (g.shield > 0) g.shield -= dt;

  if (g.mode === 'dying') {
    g.dieT += dt; b.spin += dt * 9;
    if (b.y > GROUND - BR) { b.y = GROUND - BR; b.vy = 0; }
    if (g.dieT > 1.2) { g.mode = 'over'; g.events.push({ type: 'end' }); }
  }

  for (const h of g.gates) {
    h.x -= sp * dt;
    h.y = h.baseY + (h.amp ? Math.sin(g.clock * h.w + h.ph) * h.amp : 0);
    h.flash = Math.max(0, h.flash - dt * 2);
    if (g.mode === 'dying') continue;
    // A wall: two slabs, from the sky to the opening and from the opening to the ground
    if (h.wall && !h.hit && g.shield <= 0 && Math.abs(b.x - h.x) < WALL / 2 + BR) {
      const nx = clamp(b.x, h.x - WALL / 2, h.x + WALL / 2);
      for (const [y0, y1] of [[-1, h.y - h.r], [h.y + h.r, GROUND]]) {
        if (Math.hypot(b.x - nx, b.y - clamp(b.y, y0, y1)) < BR * 0.85) {
          h.hit = true; h.ok = -1;
          if (live) hurt(g);
          b.vy = b.y < h.y ? 0.4 : -0.6;
          break;
        }
      }
    }
    // A hoop's two ends are solid
    if (!h.bare && !h.hit && !h.done && g.shield <= 0) {
      for (const s of [-1, 1]) {
        if (Math.hypot(b.x - h.x, b.y - (h.y + s * h.r)) < BR + RIM) {
          h.hit = true; h.ok = -1;
          if (live) hurt(g);
          b.vy = s < 0 ? 0.5 : -0.6;
          break;
        }
      }
    }
    if (!h.done && h.x <= b.x) { if (live) cross(g, h); else h.done = true; }
  }
  for (const z of g.spikes) {
    z.x -= sp * dt; z.a += dt * 3;
    z.y = z.baseY + Math.sin(g.clock * 2 + z.bob) * 0.02;
    if (live && g.shield <= 0 && Math.hypot(b.x - z.x, b.y - z.y) < BR + z.r * 0.8) { hurt(g); b.vy = -0.5; }
  }
  if (live && !g.wallsSeen && g.gates.some(h => h.wall && h.x < g.W - 0.02)) { g.wallsSeen = true; g.events.push({ type: 'walls' }); }
  g.gates = g.gates.filter(h => h.x > -0.4);
  g.spikes = g.spikes.filter(z => z.x > -0.3);
  if (live || g.mode === 'demo') while (needSpawn(g)) spawn(g);

  // The ground bounces the bird back up, and in a game costs a life
  if (g.mode !== 'dying' && b.y > GROUND - BR) {
    b.y = GROUND - BR; b.vy = -FLAP * 1.05;
    if (live && g.shield <= 0) hurt(g);
  }
}

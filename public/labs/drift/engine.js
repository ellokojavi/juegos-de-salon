/**
 * Drift: the engine (C-2, docs/rally/core.md). A pure state machine: the car, the track, the gates,
 * the clock, penalties and the autopilot, in plain numbers. It knows nothing about how the game is
 * drawn, touched or timed: no DOM, no canvas, no clock of its own, no Math.random. Every path of the
 * plan (2D now, 3D later) draws this same state; the physics is flat in all of them.
 *
 * Axes and angles, for the engine and every scene: metres, seconds, radians. x grows east, y grows
 * north (up the map). A heading h is the angle from +x, counter-clockwise, so a car facing north has
 * h = π/2 and its forward vector is (cos h, sin h); its left is (−sin h, cos h). Steering +1 turns
 * right (clockwise), −1 left.
 *
 * Beside the road stand solid things (trees, rocks: `track.solids`, circles the caller puts on the
 * track from the scenery). The car bounces off them; a hit faster than `crashSpeed` costs one of its
 * `lives` and leaves a dent where it struck (`car.hits`, in the car's own frame); the last life
 * wrecks it and ends the run with no time.
 *
 * The caller runs `step` in a fixed-step accumulator (`run` does it): the same inputs give the same
 * run on a 60 Hz and a 120 Hz screen, and a slow phone plays in slow motion, never a different time.
 */

/** The fixed step: 1/120 s. */
export const STEP = 1 / 120;

/**
 * Everything worth tuning by playing, in one object the lab's tuning panel changes live
 * (docs/rally/core.md, section 12). Every value is a starting value (core, section 3).
 */
export const TUNING = {
  steerTime: 0.15,        // s from centre to full lock
  topGravel: 30,          // m/s
  topAsphalt: 36,
  topOff: 14,             // off the road
  accel: 7,               // m/s²
  brake: 14,
  roll: 0.6,              // rolling drag, m/s²
  maxOffDrag: 12,         // the most the rough ground slows a fast car, m/s²
  wheelbase: 2.5,         // m
  lockSlow: 32,           // degrees of steering when slow…
  lockFast: 9,            // …and at top speed
  gripGravel: 9,          // m/s² of sideways grip
  gripAsphalt: 14,
  gripOff: 5,
  handbrake: 0.45,        // grip × this with the handbrake
  overSteer: 2.2,         // how far the nose may turn in past what the grip holds
  align: 2.5,             // how fast the rear pulls the nose back toward the travel, 1/s
  offAccel: 0.6,          // acceleration × this off the road
  reverseAccel: 7,        // m/s² backwards: the brake held with the car stopped (the owner, 2026-11-26: faster)
  topReverse: 14,         // m/s
  lives: 10,              // crashes the car takes before it is wrecked (the owner, 2026-11-26)
  crashSpeed: 3,          // m/s into an obstacle that costs a life; slower is a nudge
  crashBounce: 0.3,       // the share of the speed into an obstacle the car bounces back with
  missPenalty: 10000,     // ms
  resetPenalty: 5000,
  resetAfter: 3,          // s off the road or the wrong way before ↺ is offered
};
/** The values as shipped, to compare a tuned run against and to put back. */
export const DEFAULT_TUNING = Object.freeze({ ...TUNING });

/** The car's length, for a gate missed by more than a car (m). */
export const CAR_LENGTH = 4.2;
export const CAR_WIDTH = 1.8;
/** The centreline is sampled every this many metres. */
export const SAMPLE = 2;
const ROAD_WIDTH = 7, HAIRPIN_WIDTH = 9, HAIRPIN_RADIUS = 22;
/** How far the car is searched for along the centreline each step, in points either side. */
const SEARCH = 12;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const DEG = Math.PI / 180;

/* ------------------------------------------------------------------ */
/* The track                                                           */
/* ------------------------------------------------------------------ */

/**
 * Expands a stage's pieces (tracks.js) into its centreline: points every SAMPLE metres, each
 * `{ x, y, h, s, k, w }` (position, heading, distance from the start, curvature, road width).
 * The stage starts at (0, 0) facing north. The gates sit at even distances; the last is the finish.
 */
export function buildTrack(stage) {
  const pts = [];
  let x = 0, y = 0, h = Math.PI / 2, s = 0;
  const push = (k, w) => pts.push({ x, y, h, s, k, w });
  push(0, ROAD_WIDTH);
  for (const [kind, a, b] of stage.pieces) {
    const len = kind === 'S' ? a : a * b * DEG;
    const n = Math.max(1, Math.round(len / SAMPLE)), ds = len / n;
    const k = kind === 'S' ? 0 : (kind === 'L' ? 1 : -1) / a;
    const w = kind !== 'S' && a < HAIRPIN_RADIUS ? HAIRPIN_WIDTH : ROAD_WIDTH;
    for (let i = 0; i < n; i++) {
      if (k === 0) { x += Math.cos(h) * ds; y += Math.sin(h) * ds; }
      else {
        // Along the arc exactly: the chord at the mean heading
        const dh = k * ds, hm = h + dh / 2, chord = 2 * Math.sin(dh / 2) / k;
        x += Math.cos(hm) * chord; y += Math.sin(hm) * chord; h += dh;
      }
      s += ds;
      push(k, w);
    }
  }
  const length = s;
  const gates = [];
  for (let i = 1; i <= stage.gates; i++) {
    const at = (length - 6) * i / stage.gates;  // the finish sits a little before the end of the road
    let idx = 0;
    while (idx < pts.length - 1 && pts[idx].s < at) idx++;
    const p = pts[idx];
    gates.push({ i: idx, s: p.s, x: p.x, y: p.y, h: p.h, half: p.w / 2 + 0.6 });
  }
  return { id: stage.id, surface: stage.surface || 'gravel', setting: stage.setting || 'meadow', pts, length, gates };
}

/** The nearest centreline point to (x, y), searched around `from` (or everywhere with from < 0). */
function nearest(track, x, y, from) {
  const P = track.pts;
  let lo = 0, hi = P.length - 1;
  if (from >= 0) { lo = Math.max(0, from - SEARCH); hi = Math.min(P.length - 1, from + SEARCH); }
  let best = lo, bd = Infinity;
  for (let i = lo; i <= hi; i++) { const dx = P[i].x - x, dy = P[i].y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
  return best;
}

/** Where (x, y) is against point p: `along` the road from it and `side` to its left (m). */
function frame(p, x, y) {
  const dx = x - p.x, dy = y - p.y, c = Math.cos(p.h), s = Math.sin(p.h);
  return { along: dx * c + dy * s, side: -dx * s + dy * c };
}

/* ------------------------------------------------------------------ */
/* A run                                                               */
/* ------------------------------------------------------------------ */

/**
 * A new run on `track` (from buildTrack). `mode`: 'ready' waits for the first throttle to start the
 * clock; 'demo' drives with the clock off (the cover).
 */
export function newGame({ track, mode = 'ready' }) {
  const p = track.pts[0];
  const car = { x: p.x, y: p.y, h: p.h, vx: 0, vy: 0, steer: 0, throttle: 0, brake: 0, surface: track.surface, slip: 0, speed: 0, px: p.x, py: p.y, ph: p.h, hits: [] };
  return {
    track, car, mode,
    t: 0, gate: 0, splits: [], penalty: 0, missed: 0, resets: 0,
    idx: 0, progress: 0, side: 0, onRoad: true, lastRoad: 0,
    off: 0, back: 0, wrongWay: false, events: [],
    lives: TUNING.lives, hitCool: 0, wrecked: false,
  };
}

/** The input when nobody touches anything. */
export const IDLE = Object.freeze({ steer: 0, throttle: 0, brake: 0, handbrake: false });

/** One fixed step of STEP seconds. Pushes what happened to `g.events`; the caller empties it. */
export function step(g, input = IDLE) {
  const T = TUNING, dt = STEP, car = g.car, track = g.track;
  let { steer = 0, throttle = 0, brake = 0, handbrake = false } = input || IDLE;
  if (g.mode === 'done') { steer = 0; throttle = 0; brake = 0.6; handbrake = false; }
  if (g.mode === 'ready' && throttle > 0) { g.mode = 'play'; g.events.push({ type: 'start' }); }
  if (g.mode === 'ready') { throttle = 0; brake = 1; }
  car.px = car.x; car.py = car.y; car.ph = car.h;

  // 1. The steering eases toward the thumb: a tap and a held thumb both feel right
  const rate = dt / Math.max(0.01, T.steerTime);
  car.steer += clamp(clamp(steer, -1, 1) - car.steer, -rate, rate);

  // 2. Velocity against the heading: forward and to the left
  const c = Math.cos(car.h), s = Math.sin(car.h);
  let vf = car.vx * c + car.vy * s;

  // 3. Forward: throttle, brakes, drag; the surface scales them
  const off = !g.onRoad;
  const top = off ? T.topOff : track.surface === 'asphalt' ? T.topAsphalt : T.topGravel;
  const acc = T.accel * (off ? T.offAccel : 1);
  vf += clamp(throttle, 0, 1) * acc * dt;
  // Reverse: the brake held once the car has stopped (or is already rolling back) drives it backwards
  const backing = g.mode === 'play' && brake > 0 && !(throttle > 0) && vf <= 0;
  if (backing) vf -= clamp(brake, 0, 1) * T.reverseAccel * (off ? T.offAccel : 1) * dt;
  const sign = vf > 0 ? 1 : vf < 0 ? -1 : 0;
  const topNow = vf < 0 ? T.topReverse : top;
  let drag = T.roll + (T.accel - T.roll) * (vf / topNow) * (vf / topNow);
  if (off) drag = Math.min(drag, T.maxOffDrag);
  if (!backing) drag += clamp(brake, 0, 1) * T.brake;
  const dv = drag * dt;
  vf = Math.abs(vf) <= dv ? 0 : vf - sign * dv;

  // 4. Turn: the bicycle's yaw, with less lock at speed. The nose may turn in faster than the grip
  // can follow (that is the slide), but only so far: capped at `overSteer` times what the grip holds,
  // so a slide starts progressively and never as a spin. The rear then pulls the nose back toward
  // where the car is going (`align`), which ends a slide once the thumb lets go.
  const grip = (off ? T.gripOff : track.surface === 'asphalt' ? T.gripAsphalt : T.gripGravel) * (handbrake ? T.handbrake : 1);
  const lock = (T.lockSlow + (T.lockFast - T.lockSlow) * clamp(Math.abs(vf) / T.topGravel, 0, 1)) * DEG;
  const cap = T.overSteer * (handbrake ? 2 : 1) * grip / Math.max(Math.abs(vf), 4);
  let yaw = clamp(-vf / T.wheelbase * Math.tan(car.steer * lock), -cap, cap);
  const vxw = car.vx + (vf - (car.vx * c + car.vy * s)) * c, vyw = car.vy + (vf - (car.vx * c + car.vy * s)) * s;
  if (Math.abs(vf) > 2) {
    const beta = wrap(Math.atan2(vyw, vxw) - car.h);
    if (Math.abs(beta) < Math.PI / 2) yaw += T.align * (handbrake ? 0.3 : 1) * beta;
  }
  car.h = wrap(car.h + yaw * dt);

  // 5. Sideways grip, against the new heading: that one line is the drift
  const c2 = Math.cos(car.h), s2 = Math.sin(car.h);
  const vx = vxw, vy = vyw;
  let f = vx * c2 + vy * s2, l = -vx * s2 + vy * c2;
  const dl = grip * dt;
  l = Math.abs(l) <= dl ? 0 : l - Math.sign(l) * dl;
  // Sliding costs some forward speed too
  if (l !== 0) f = Math.max(0, Math.abs(f) - Math.abs(dl) * 0.15) * Math.sign(f);

  // 6. Rebuild the velocity and move
  car.vx = f * c2 - l * s2; car.vy = f * s2 + l * c2;
  car.x += car.vx * dt; car.y += car.vy * dt;
  // 6b. What stands beside the road: the car bounces off it, and a hard hit costs a life
  g.hitCool = Math.max(0, (g.hitCool || 0) - dt);
  if (track.solids?.length) collide(g);
  // 7. What the scene and the sound read (the pedals as applied: the brake lights)
  car.throttle = clamp(throttle, 0, 1); car.brake = clamp(brake, 0, 1);
  car.slip = Math.abs(l);
  car.speed = Math.hypot(car.vx, car.vy);

  locate(g, dt);
  gates(g);
  if (g.mode === 'play') g.t += dt * 1000;
}

/** The car as two circles along its length, against the solids near it (a grid built once per list of solids). */
const CAR_R = 0.95, CAR_AXLE = 1.15, SOLID_CELL = 10;
const grids = new WeakMap();
function solidGrid(track) {
  let grid = grids.get(track.solids);
  if (!grid) {
    grid = new Map();
    for (const o of track.solids) {
      const k = `${Math.floor(o.x / SOLID_CELL)},${Math.floor(o.y / SOLID_CELL)}`;
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(o);
    }
    grids.set(track.solids, grid);
  }
  return grid;
}
function collide(g) {
  const T = TUNING, car = g.car, grid = solidGrid(g.track);
  const cx = Math.floor(car.x / SOLID_CELL), cy = Math.floor(car.y / SOLID_CELL);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    for (const o of grid.get(`${cx + i},${cy + j}`) || []) {
      for (const along of [CAR_AXLE, -CAR_AXLE]) {
        const c = Math.cos(car.h), s = Math.sin(car.h);
        const px = car.x + c * along, py = car.y + s * along;
        const dx = px - o.x, dy = py - o.y, d = Math.hypot(dx, dy), pen = CAR_R + o.r - d;
        if (pen <= 0 || d === 0) continue;
        const nx = dx / d, ny = dy / d;
        car.x += nx * pen; car.y += ny * pen;
        const vn = car.vx * nx + car.vy * ny;
        if (vn >= 0) continue;
        // Bounce back with a share of the speed into it, and scrape off some of the rest
        car.vx -= (1 + T.crashBounce) * vn * nx; car.vy -= (1 + T.crashBounce) * vn * ny;
        car.vx *= 0.8; car.vy *= 0.8;
        if (-vn >= T.crashSpeed && g.hitCool === 0 && g.mode === 'play') {
          g.hitCool = 0.6;
          g.lives = Math.max(0, g.lives - 1);
          // Where it struck, in the car's frame (forward, left), for the dent
          const wx = o.x + nx * o.r - car.x, wy = o.y + ny * o.r - car.y;
          car.hits.push({ f: Math.round((wx * c + wy * s) * 100) / 100, l: Math.round((-wx * s + wy * c) * 100) / 100 });
          g.events.push({ type: 'crash', lives: g.lives, speed: -vn });
          if (!g.lives) {
            g.wrecked = true; g.mode = 'done';
            g.events.push({ type: 'wrecked' });
          }
        }
      }
    }
  }
}

/** Finds the car on the track: progress, on or off the road, the wrong way. */
function locate(g, dt) {
  const car = g.car, track = g.track;
  g.idx = nearest(track, car.x, car.y, g.idx);
  const p = track.pts[g.idx], f = frame(p, car.x, car.y);
  g.progress = p.s + f.along;
  g.side = f.side;
  const onRoad = Math.abs(f.side) <= p.w / 2;
  if (!onRoad && g.onRoad && g.mode === 'play') g.events.push({ type: 'offroad' });
  g.onRoad = onRoad;
  car.surface = onRoad ? track.surface : 'off';
  if (onRoad) g.lastRoad = g.idx;
  g.off = onRoad ? 0 : g.off + dt;
  const along = car.vx * Math.cos(p.h) + car.vy * Math.sin(p.h);
  const wrong = car.speed > 3 && along < -0.3 * car.speed;
  if (wrong && !g.wrongWay && g.mode === 'play') g.events.push({ type: 'back' });
  g.wrongWay = wrong;
  g.back = wrong ? g.back + dt : 0;
}

/** Passing, missing and finishing. */
function gates(g) {
  if (g.mode === 'done' || g.gate >= g.track.gates.length) return;
  const gate = g.track.gates[g.gate], car = g.car;
  const now = frame(gate, car.x, car.y), before = frame(gate, car.px, car.py);
  // Crossed between the posts, going forward
  if (before.along < 0 && now.along >= 0 && Math.abs(now.side) <= gate.half) {
    const split = Math.round(g.t);
    g.splits.push(split);
    const last = g.gate === g.track.gates.length - 1;
    g.events.push({ type: 'gate', gate: g.gate, split });
    g.gate++;
    if (last) finish(g);
    return;
  }
  // Gone past it by more than a car without crossing it: a miss, and the run goes on
  if (g.progress > gate.s + CAR_LENGTH && Math.abs(g.progress - gate.s) < 60) {
    g.missed++;
    g.penalty += TUNING.missPenalty;
    g.splits.push(null);
    g.events.push({ type: 'miss', gate: g.gate });
    g.events.push({ type: 'penalty', ms: TUNING.missPenalty });
    const last = g.gate === g.track.gates.length - 1;
    g.gate++;
    if (last) finish(g);
  }
}

function finish(g) {
  g.mode = 'done';
  g.events.push({ type: 'finish', ms: total(g) });
}

/** The time that counts: the clock plus the penalties, in ms. */
export const total = g => Math.round(g.t) + g.penalty;

/** Whether the ↺ button should be offered on its own: long off the road or the wrong way. */
export const needsReset = g => g.mode === 'play' && (g.off >= TUNING.resetAfter || g.back >= TUNING.resetAfter);

/**
 * Back on the road: the car on the centreline at the last point it was on the road, stopped, facing
 * forward, with its penalty.
 */
export function reset(g) {
  if (g.mode !== 'play') return;
  const p = g.track.pts[g.lastRoad], car = g.car;
  Object.assign(car, { x: p.x, y: p.y, h: p.h, vx: 0, vy: 0, steer: 0, slip: 0, speed: 0, px: p.x, py: p.y, ph: p.h });
  g.idx = g.lastRoad; g.onRoad = true; g.off = 0; g.back = 0; g.wrongWay = false;
  g.progress = p.s; g.side = 0;
  g.resets++;
  g.penalty += TUNING.resetPenalty;
  g.events.push({ type: 'reset' });
  g.events.push({ type: 'penalty', ms: TUNING.resetPenalty });
}

/**
 * The caller's loop in one call: adds `seconds` to the accumulator `acc`, runs every whole step
 * with `input` (a function of g, or an object) and returns what is left. A frame is clamped to
 * 0.1 s so a hiccup is not a jump.
 */
export function run(g, input, seconds, acc = 0) {
  acc += Math.min(0.1, Math.max(0, seconds));
  while (acc >= STEP - 1e-9) {
    step(g, typeof input === 'function' ? input(g) : input);
    acc -= STEP;
  }
  return Math.max(0, acc);
}

/* ------------------------------------------------------------------ */
/* The autopilot                                                       */
/* ------------------------------------------------------------------ */

/**
 * Drives the stage by itself (the cover, the tests, the e2e script, par time, core section 7): aims at
 * a point on the centreline ahead, further at speed, and brakes when the bends ahead ask for less
 * speed than it has. It reads only g. Decent, not brilliant: a careful human beats it.
 */
export function autopilot(g) {
  const T = TUNING, car = g.car, P = g.track.pts;
  const v = car.speed;
  const ahead = 5 + v * 0.45;
  const target = P[Math.min(P.length - 1, g.idx + Math.round(ahead / SAMPLE))];
  const err = wrap(Math.atan2(target.y - car.y, target.x - car.x) - car.h);
  const lock = (T.lockSlow + (T.lockFast - T.lockSlow) * clamp(v / T.topGravel, 0, 1)) * DEG;
  const steer = clamp(-err / lock * 1.6, -1, 1);
  // The slowest the next stretch allows, braking in time for it
  const grip = (g.track.surface === 'asphalt' ? T.gripAsphalt : T.gripGravel) * 0.8;
  const look = Math.round((v * v / (2 * T.brake) + 20) / SAMPLE);
  let limit = Infinity;
  for (let i = g.idx; i < Math.min(P.length, g.idx + look); i++) {
    const k = Math.abs(P[i].k);
    if (!k) continue;
    const vmax = Math.sqrt(grip / k), dist = (i - g.idx) * SAMPLE;
    limit = Math.min(limit, Math.sqrt(vmax * vmax + 2 * T.brake * 0.7 * dist));
  }
  const slow = v > limit + 0.5;
  return { steer, throttle: slow ? 0 : 1, brake: slow ? clamp((v - limit) / 4, 0.2, 1) : 0, handbrake: false };
}

/* ------------------------------------------------------------------ */
/* Memory (C-6)                                                        */
/* ------------------------------------------------------------------ */

/** The run as plain JSON, without the track (it is rebuilt from its id). */
export function snapshot(g) {
  const { track, events, ...rest } = g;
  return JSON.parse(JSON.stringify({ ...rest, trackId: track.id }));
}

/** The run back from a snapshot, on its track. */
export function restore(json, track) {
  const { trackId, ...rest } = json;
  return { ...JSON.parse(JSON.stringify(rest)), track, events: [] };
}

/** The clock as the player reads it: m:ss.mmm. */
export function clock(ms) {
  const v = Math.max(0, Math.round(ms)), m = Math.floor(v / 60000), s = Math.floor(v / 1000) % 60, r = v % 1000;
  return `${m}:${String(s).padStart(2, '0')}.${String(r).padStart(3, '0')}`;
}

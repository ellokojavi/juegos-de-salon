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
 * The road can fork (`track.branches`: a second road that leaves the main one and meets it again,
 * the player picks), and carries ramps (the car flies: `car.z`, `car.vz`; no steering, no grip and
 * no crash in the air; the landing costs nothing) and boost pads (`g.boost`: a short burst well past
 * the top speed).
 *
 * Tokens (`track.tokens`, the owner, 2026-11-27: «premiar al usuario que toma la bifurcación»): a
 * «−10» floating halfway along each fork's other road and a «−5» in the air past each ramp, where only
 * a car flying it fast passes. Caught, a token takes its `ms` off the time that counts (`g.bonus`) and
 * pushes a `token` event; each is caught once a run (`g.taken`).
 *
 * The road rises and falls (relief.js: hills, crests, dips, whoops): uphill pulls the car back and
 * downhill pushes it on (`slope`), and over a crest taken fast enough the ground drops away faster than
 * the car falls, so it flies (`car.air`, the same flight as off a ramp). `car.z` is always the height
 * above the ground under the car and `car.e` the ground's height there; in the air `car.vz` is the
 * car's own vertical speed.
 *
 * Each stretch of road has its surface (`zones` in tracks.js: gravel or asphalt, so a stage can change
 * from one to the other), and a wet stage (`weather: 'wet'`) holds less on both.
 *
 * Beside the road stand solid things (trees, rocks: `track.solids`, circles the caller puts on the
 * track from the scenery). The car bounces off them; a hit faster than `crashSpeed` costs one of its
 * `lives` and leaves a dent where it struck (`car.hits`, in the car's own frame); the last life
 * wrecks it and ends the run with no time.
 *
 * The caller runs `step` in a fixed-step accumulator (`run` does it): the same inputs give the same
 * run on a 60 Hz and a 120 Hz screen, and a slow phone plays in slow motion, never a different time.
 */

import { relief, heightAt, gradeAt } from './relief.js';

/** The fixed step: 1/120 s. */
export const STEP = 1 / 120;

/**
 * Everything worth tuning by playing, in one object the lab's tuning panel changes live
 * (docs/rally/core.md, section 12). Every value is a starting value (core, section 3).
 */
export const TUNING = {
  steerTime: 0.15,        // s from centre to full lock
  topGravel: 62,          // m/s (30, 42, 52; then as fast as asphalt, only slower to get there: the owner, 2026-11-27)
  topAsphalt: 62,
  gravelAccel: 1,         // acceleration × this on gravel (0.75 until the owner, 2026-11-28: «sigue estando demasiado lento en camino de tierra»)
  dragPower: 3,           // how the drag grows toward the top speed: (v / top)^this (2 until 2026-11-28: the car crept toward the top and never reached it)
  topOff: 18,             // off the road
  accel: 10,              // m/s²
  brake: 20,
  roll: 0.6,              // rolling drag, m/s²
  maxOffDrag: 12,         // the most the rough ground slows a fast car, m/s²
  wheelbase: 2.5,         // m
  lockSlow: 40,           // degrees of steering when slow…
  lockFast: 14,           // …and from `lockSpeed` up
  lockSpeed: 42,          // m/s where the lock reaches lockFast (the old top speed, so the steering feels as before)
  gripGravel: 14,         // m/s² of sideways grip (11 until 2026-11-28: bends on gravel were too slow)
  gripAsphalt: 16,
  gripOff: 5,
  wetGravel: 0.85,        // grip × this on a wet stage: mud…
  wetAsphalt: 0.6,        // …and wet asphalt, slipperier than dry gravel (the owner's track ideas, 2026-11-27)
  handbrake: 0.45,        // grip × this with the handbrake
  overSteer: 3.0,         // how far the nose may turn in past what the grip holds
  align: 3.0,             // how fast the rear pulls the nose back toward the travel, 1/s
  offAccel: 0.6,          // acceleration × this off the road
  reverseAccel: 7,        // m/s² backwards: the brake held with the car stopped (the owner, 2026-11-26: faster)
  topReverse: 14,         // m/s
  lives: 10,              // crashes the car takes before it is wrecked (the owner, 2026-11-26)
  crashSpeed: 3,          // m/s into an obstacle that costs a life; slower is a nudge
  crashBounce: 0.3,       // the share of the speed into an obstacle the car bounces back with
  rampLift: 0.18,         // a ramp throws the car up at this share of its forward speed, m/s per m/s
  gravity: 12,            // m/s² in the air (a little more than the Earth's: shorter, livelier jumps)
  slope: 9.8,             // m/s² per unit of grade: what a hill takes from the car going up and gives going down
  boostTime: 1.2,         // s of boost after a pad
  boostTop: 1.7,          // top speed × this while boosting
  boostAccel: 26,         // m/s² of extra push while boosting
  missPenalty: 10000,     // ms
  forkBonus: 10000,       // ms off for the token on a fork's other road (the owner, 2026-11-27)
  airBonus: 5000,         // ms off for the token in the air past a ramp, caught only flying it fast
  tokenReach: 3.2,        // m from a token's centre that catches it
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
const ROAD_WIDTH = 7, HAIRPIN_WIDTH = 9, HAIRPIN_RADIUS = 22, WIDEN = 14;
/** How far the road eases from one piece's curvature into the next: two passes of a box this many
 *  points either side (about 2 × 2 × EASE × SAMPLE m from the first change to the full bend). */
export const EASE = 6;
/** A narrow stretch's width, m (`narrow` in a stage: the owner, 2026-11-28, «tramos técnicos»). */
export const NARROW = 5.2;
/** How far the car is searched for along the centreline each step, in points either side. */
const SEARCH = 12;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const DEG = Math.PI / 180;

/* ------------------------------------------------------------------ */
/* The track                                                           */
/* ------------------------------------------------------------------ */

/**
 * Eases the road from one piece into the next (the owner, 2026-11-27: «pedazos que no están
 * orgánicamente conectados»): a straight met a bend at once, at its full curvature, like two cards laid
 * end to end. The turn of each step (k × ds) is spread by two passes of a box EASE points either side,
 * so the curvature ramps in and out as a driver's line does (close to a clothoid); every bend still
 * turns what its piece turns, a straight far from a bend stays exactly straight, and on a circuit the
 * spread wraps round the start. Then the road is laid again from those turns.
 */
function ease(pts, loop) {
  const n = pts.length, first = 1, N = n - 1;   // the steps are points 1..n-1 (each from the one before)
  const ds = pts.map((p, i) => (i ? p.s - pts[i - 1].s : 0));
  let dh = pts.map((p, i) => p.k * ds[i]);
  for (let pass = 0; pass < 2; pass++) {
    const out = dh.slice();
    for (let i = first; i < n; i++) {
      let sum = 0, w = 0;
      for (let d = -EASE; d <= EASE; d++) {
        let j = i + d;
        if (loop) j = first + (((j - first) % N) + N) % N;
        else if (j < first || j >= n) continue;
        sum += dh[j]; w++;
      }
      out[i] = sum / w;
    }
    dh = out;
  }
  let x = pts[0].x, y = pts[0].y, h = pts[0].h;
  for (let i = first; i < n; i++) {
    const p = pts[i], d = dh[i], k = ds[i] > 0 ? d / ds[i] : 0;
    if (d === 0) { x += Math.cos(h) * ds[i]; y += Math.sin(h) * ds[i]; }
    else { const hm = h + d / 2, chord = 2 * Math.sin(d / 2) / k; x += Math.cos(hm) * chord; y += Math.sin(hm) * chord; h += d; }
    Object.assign(p, { x, y, h, k });
  }
}

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
  ease(pts, !!stage.loop);
  // A circuit (`loop`) ends where it starts: its pieces turn a whole 360° and the generator solved
  // their straights so the road closes; what rounding and the easing leave open (a few metres in two
  // kilometres) is spread along the lap
  if (stage.loop) {
    const gx = pts.at(-1).x - pts[0].x, gy = pts.at(-1).y - pts[0].y;
    for (const p of pts) { p.x -= gx * p.s / length; p.y -= gy * p.s / length; }
  }
  // A hairpin's wider road eases in and out over WIDEN m either side, never in a step (the owner,
  // 2026-11-27: a road that looks cut where it changes width)
  const reachI = Math.ceil(WIDEN / SAMPLE) + 1, own = pts.map(p => p.w);
  pts.forEach((p, i) => {
    for (let j = Math.max(0, i - reachI); j <= Math.min(pts.length - 1, i + reachI); j++) {
      if (own[j] <= ROAD_WIDTH) continue;
      const u = Math.max(0, 1 - Math.abs(pts[j].s - p.s) / WIDEN), ease = u * u * (3 - 2 * u);
      p.w = Math.max(p.w, ROAD_WIDTH + (own[j] - ROAD_WIDTH) * ease);
    }
  });
  // A narrow stretch closes in over WIDEN m at either end (never under a hairpin's widening)
  for (const z of stage.narrow || []) for (const p of pts) {
    const inn = Math.min(p.s - z.from, z.to - p.s);
    if (inn <= -WIDEN) continue;
    const u = Math.min(1, (inn + WIDEN) / WIDEN), ease = u * u * (3 - 2 * u);
    p.w = Math.min(p.w, ROAD_WIDTH - (ROAD_WIDTH - NARROW) * ease);
  }
  for (const p of pts) p.w = Math.round(p.w * 100) / 100;
  // The surface of each point: the stage's own, changed along the zones it lists
  const base = stage.surface || 'gravel';
  for (const p of pts) p.sf = base;
  for (const z of stage.zones || []) for (const p of pts) if (p.s >= z.from && p.s < z.to) p.sf = z.surface;
  const gates = [];
  for (let i = 1; i <= stage.gates; i++) {
    // The finish sits a little before the end of the road; on a circuit it is the start line itself
    const at = (stage.loop ? length : length - 6) * i / stage.gates;
    let idx = 0;
    while (idx < pts.length - 1 && pts[idx].s < at) idx++;
    const p = pts[idx];
    // A gate on a narrow stretch keeps a full road's width between its posts (the road narrows, not the gate)
    gates.push({ i: idx, s: p.s, x: p.x, y: p.y, h: p.h, half: Math.max(p.w, ROAD_WIDTH) / 2 + 0.6 });
  }
  // Forks: a second road from `from` to `to` (m), bulging `offset` m to one side, meeting the main one
  // again; it carries the main road's distance (`s`), so the progress and the gates read the same
  const at = s0 => { let i = 0; while (i < pts.length - 1 && pts[i].s < s0) i++; return i; };
  const branches = (stage.forks || []).map((f, n) => {
    const i0 = at(f.from), i1 = at(f.to), side = f.side === 'R' ? -1 : 1, bp = [];
    for (let i = i0; i <= i1; i++) {
      const p = pts[i], u = (p.s - pts[i0].s) / (pts[i1].s - pts[i0].s), o = side * f.offset * Math.sin(Math.PI * u) ** 2;
      bp.push({ x: p.x - Math.sin(p.h) * o, y: p.y + Math.cos(p.h) * o, h: p.h, s: p.s, k: 0, w: ROAD_WIDTH, i, sf: f.surface || p.sf });
    }
    // Headings along the branch itself
    for (let j = 0; j < bp.length; j++) {
      const a = bp[Math.max(0, j - 1)], b = bp[Math.min(bp.length - 1, j + 1)];
      bp[j].h = Math.atan2(b.y - a.y, b.x - a.x);
    }
    // And its own curvature, from those headings (the autopilot and the relief read it)
    for (let j = 0; j < bp.length; j++) {
      const a = bp[Math.max(0, j - 1)], b = bp[Math.min(bp.length - 1, j + 1)], d = Math.hypot(b.x - a.x, b.y - a.y);
      bp[j].k = d > 0 ? wrap(b.h - a.h) / d : 0;
    }
    return { n, from: pts[i0].s, to: pts[i1].s, pts: bp, f };
  });
  // A gate that falls inside a fork stands across both roads (`alt`: the same gate on the branch), so
  // a fork can be as long as the player needs to feel it is another road (the owner, 2026-11-27)
  for (const gt of gates) for (const b of branches) {
    if (gt.s <= b.from || gt.s >= b.to) continue;
    const j = b.pts.reduce((m, q, j) => (Math.abs(q.s - gt.s) < Math.abs(b.pts[m].s - gt.s) ? j : m), 0), q = b.pts[j];
    gt.alt = { x: q.x, y: q.y, h: q.h, half: q.w / 2 + 0.6, fork: b.n, j };
  }
  // A ramp or a pad: a rectangle across the road, on the main road at `s` m or on a branch at a share `u` of it
  const place = (where, half, len) => {
    const p = where.fork !== undefined ? (b => b.pts[Math.round(where.u * (b.pts.length - 1))])(branches[where.fork]) : pts[at(where.s)];
    return { x: p.x, y: p.y, h: p.h, s: p.s, half, len, fork: where.fork };
  };
  const ramps = (stage.ramps || []).map(r => place(r, ROAD_WIDTH / 2 - 0.4, 5));
  const pads = (stage.pads || []).map(r => place(r, 1.7, 8));
  // The tokens: a «−10» halfway along each fork's other road, a «−5» in the air past each ramp of the
  // main road (45 m on and 4.2 m up: a car leaving the ramp from about 45 m/s up to the top speed flies
  // through it; at 3.5 m a car at the top speed passed over it)
  const tokens = [
    ...branches.map(b => { const q = b.pts[Math.floor(b.pts.length / 2)]; return { x: q.x, y: q.y, s: q.s, z: 1.4, ms: TUNING.forkBonus, fork: b.n, j: Math.floor(b.pts.length / 2) }; }),
    ...ramps.filter(r => r.fork === undefined).map(r => { const q = pts[at(r.s + 45)]; return { x: q.x, y: q.y, s: q.s, z: 4.2, ms: TUNING.airBonus, air: true }; }),
  ];
  const track = { id: stage.id, loop: !!stage.loop, surface: base, wet: stage.weather === 'wet', setting: stage.setting || 'meadow', pts, length, gates, branches, ramps, pads, tokens };
  // The relief last: it keeps its jumps away from the forks, the ramps and the pads
  if (stage.relief !== false) relief(track); else track.relief = [];
  return track;
}

/** The sideways grip and the top speed of a surface ('gravel', 'asphalt' or 'off') on a dry or wet stage. */
export function gripOf(surface, wet) {
  const T = TUNING;
  if (surface === 'off') return T.gripOff;
  return surface === 'asphalt' ? T.gripAsphalt * (wet ? T.wetAsphalt : 1) : T.gripGravel * (wet ? T.wetGravel : 1);
}
export const topOf = surface => (surface === 'off' ? TUNING.topOff : surface === 'asphalt' ? TUNING.topAsphalt : TUNING.topGravel);

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
  const car = { x: p.x, y: p.y, h: p.h, vx: 0, vy: 0, steer: 0, throttle: 0, brake: 0, surface: p.sf, slip: 0, speed: 0, px: p.x, py: p.y, ph: p.h, hits: [], z: 0, vz: 0, air: false, e: heightAt(track, 0), w: 0 };
  return {
    track, car, mode,
    t: 0, gate: 0, splits: [], penalty: 0, bonus: 0, taken: [], missed: 0, resets: 0,
    idx: 0, progress: 0, side: 0, onRoad: true, lastRoad: 0,
    off: 0, back: 0, wrongWay: false, events: [],
    lives: TUNING.lives, hitCool: 0, wrecked: false, boost: 0, branch: -1,
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
  car.throttle = clamp(throttle, 0, 1); car.brake = clamp(brake, 0, 1);

  // In the air: it flies on as it left the ramp or the crest, falls, and lands where it lands (no harm done)
  if (car.air) {
    car.x += car.vx * dt; car.y += car.vy * dt;
    car.slip = 0; car.speed = Math.hypot(car.vx, car.vy);
    g.boost = Math.max(0, g.boost - dt);
    locate(g, dt);
    const e = heightAt(track, g.progress);
    car.z += car.vz * dt - (e - car.e); car.vz -= T.gravity * dt; car.e = e; car.airT = (car.airT || 0) + dt;
    if (car.z <= 0) {
      const w = groundSpeed(g);
      g.events.push({ type: 'land', impact: Math.round(Math.max(0, w - car.vz) * 10) / 10, t: Math.round(car.airT * 100) / 100 });
      car.z = 0; car.vz = 0; car.air = false; car.w = w; car.airT = 0;
    }
    tokens(g);
    gates(g);
    if (g.mode === 'play') g.t += dt * 1000;
    return;
  }

  // 2. Velocity against the heading: forward and to the left
  const c = Math.cos(car.h), s = Math.sin(car.h);
  let vf = car.vx * c + car.vy * s;

  // 3. Forward: throttle, brakes, drag; the surface scales them
  const off = !g.onRoad;
  const boosting = g.boost > 0;
  const surface = off ? 'off' : car.surface === 'off' ? track.pts[g.idx].sf : car.surface;
  const top = topOf(surface) * (boosting ? T.boostTop : 1);
  // Gravel may pull slower than asphalt to the same top speed (`gravelAccel`): its drag scales with it (below)
  const pull = T.accel * (surface === 'gravel' ? T.gravelAccel : 1);
  const acc = pull * (off ? T.offAccel : 1) + (boosting && vf >= 0 ? T.boostAccel : 0);
  vf += clamp(throttle, 0, 1) * acc * dt;
  // The hill: its grade along the car's nose, uphill taking speed and downhill giving it
  const p0 = track.pts[g.idx];
  vf -= T.slope * gradeAt(track, g.progress) * Math.cos(car.h - p0.h) * dt;
  // Reverse: the brake held once the car has stopped (or is already rolling back) drives it backwards
  const backing = g.mode === 'play' && brake > 0 && !(throttle > 0) && vf <= 0;
  if (backing) vf -= clamp(brake, 0, 1) * T.reverseAccel * (off ? T.offAccel : 1) * dt;
  const sign = vf > 0 ? 1 : vf < 0 ? -1 : 0;
  const topNow = vf < 0 ? T.topReverse : top;
  let drag = T.roll + (pull - T.roll) * Math.pow(Math.abs(vf / topNow), T.dragPower);
  if (off) drag = Math.min(drag, T.maxOffDrag);
  // Past the top speed with the boost spent (after a pad): back down within a second or two
  if (!boosting && vf > top) drag += (vf - top) * 2;
  if (!backing) drag += clamp(brake, 0, 1) * T.brake;
  const dv = drag * dt;
  vf = Math.abs(vf) <= dv ? 0 : vf - sign * dv;

  // 4. Turn: the bicycle's yaw, with less lock at speed. The nose may turn in faster than the grip
  // can follow (that is the slide), but only so far: capped at `overSteer` times what the grip holds,
  // so a slide starts progressively and never as a spin. The rear then pulls the nose back toward
  // where the car is going (`align`), which ends a slide once the thumb lets go.
  // Past the normal top speed (a boost, and its tail) the car holds the road in proportion, as if
  // pressed down by the air: it turns as well as at its top speed (the owner, 2026-11-27: boosted, the
  // steering was too weak to control it)
  const over = Math.max(1, Math.abs(vf) / topOf(surface));
  const grip = gripOf(surface, track.wet) * (handbrake ? T.handbrake : 1) * over;
  const lock = (T.lockSlow + (T.lockFast - T.lockSlow) * clamp(Math.abs(vf) / T.lockSpeed, 0, 1)) * DEG;
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
  // 7. What the scene and the sound read
  car.slip = Math.abs(l);
  car.speed = Math.hypot(car.vx, car.vy);

  locate(g, dt);
  // Over a crest: when the ground falls away faster than the car can fall, the car leaves it
  car.e = heightAt(track, g.progress);
  const w = groundSpeed(g);
  if (car.w - w > T.gravity * dt * 1.02 && car.speed > 8) {
    car.air = true; car.z = 0; car.vz = car.w - T.gravity * dt;
    g.events.push({ type: 'jump', speed: car.speed, crest: true });
  }
  car.w = w;
  features(g, dt);
  tokens(g);
  gates(g);
  if (g.mode === 'play') g.t += dt * 1000;
}

/** Ramps and boost pads under the car (only on the ground: this runs after a ground step). */
function features(g, dt) {
  const T = TUNING, car = g.car, track = g.track;
  g.boost = Math.max(0, g.boost - dt);
  for (const r of track.ramps || []) {
    const now = frame(r, car.x, car.y), before = frame(r, car.px, car.py);
    const fwd = car.vx * Math.cos(r.h) + car.vy * Math.sin(r.h);
    // Over its crest going forward: up it goes
    if (before.along < 0 && now.along >= 0 && Math.abs(now.side) <= r.half && fwd > 5) {
      car.vz = car.w + fwd * T.rampLift; car.z = 0.01; car.air = true;
      g.events.push({ type: 'jump', speed: fwd });
    }
  }
  for (const p of track.pads || []) {
    const f = frame(p, car.x, car.y);
    if (Math.abs(f.along) <= p.len / 2 && Math.abs(f.side) <= p.half) {
      if (g.boost === 0) g.events.push({ type: 'boost' });
      g.boost = T.boostTime;
    }
  }
}

/** How fast the ground under the car rises (m/s): the road's grade times the car's speed along it. */
function groundSpeed(g) {
  const car = g.car, p = g.track.pts[g.idx];
  return gradeAt(g.track, g.progress) * (car.vx * Math.cos(p.h) + car.vy * Math.sin(p.h));
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
  let p = track.pts[g.idx], f = frame(p, car.x, car.y);
  // On a fork, whichever road the car is nearer to: the main one or the branch
  g.branch = -1;
  for (const b of track.branches || []) {
    if (p.s < b.from - 20 || p.s > b.to + 20) continue;
    let best = 0, bd = Infinity;
    b.pts.forEach((q, j) => { const d = (q.x - car.x) ** 2 + (q.y - car.y) ** 2; if (d < bd) { bd = d; best = j; } });
    const q = b.pts[best], fb = frame(q, car.x, car.y);
    if (Math.abs(fb.side) < Math.abs(f.side)) { p = q; f = fb; g.branch = b.n; }
  }
  g.progress = p.s + f.along;
  g.side = f.side;
  const onRoad = Math.abs(f.side) <= p.w / 2;
  if (!onRoad && g.onRoad && g.mode === 'play') g.events.push({ type: 'offroad' });
  g.onRoad = onRoad;
  car.surface = onRoad ? p.sf : 'off';
  // ↺ brings the car back to the main road at the same distance
  if (onRoad) g.lastRoad = p.i !== undefined ? p.i : g.idx;
  g.off = onRoad ? 0 : g.off + dt;
  const along = car.vx * Math.cos(p.h) + car.vy * Math.sin(p.h);
  const wrong = car.speed > 3 && along < -0.3 * car.speed;
  if (wrong && !g.wrongWay && g.mode === 'play') g.events.push({ type: 'back' });
  g.wrongWay = wrong;
  g.back = wrong ? g.back + dt : 0;
}

/** The tokens the car passes through: each once a run, its time off the total. */
function tokens(g) {
  const car = g.car, list = g.track.tokens || [];
  if (g.mode !== 'play' || !list.length) return;
  g.taken ||= [];
  list.forEach((k, i) => {
    if (g.taken.includes(i) || Math.abs(k.s - g.progress) > 12) return;
    // Its height over the ground under it, against the car's (in the air, the car's own)
    const ground = k.fork !== undefined ? g.track.branches[k.fork].pts[k.j].e || 0 : heightAt(g.track, k.s);
    const dz = car.e + car.z + 0.7 - (ground + k.z);
    if (Math.hypot(car.x - k.x, car.y - k.y) > TUNING.tokenReach || Math.abs(dz) > (k.air ? 1.8 : 2.5)) return;
    g.taken.push(i);
    g.bonus = (g.bonus || 0) + k.ms;
    g.events.push({ type: 'token', i, ms: k.ms });
  });
}

/** Passing, missing and finishing. */
function gates(g) {
  if (g.mode === 'done' || g.gate >= g.track.gates.length) return;
  const gate = g.track.gates[g.gate], car = g.car;
  const crossed = at => { const now = frame(at, car.x, car.y), before = frame(at, car.px, car.py); return before.along < 0 && now.along >= 0 && Math.abs(now.side) <= at.half; };
  // Crossed between the posts, going forward (on the main road, or on the branch for a gate in a fork)
  if (crossed(gate) || (gate.alt && crossed(gate.alt))) {
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

/** The time that counts: the clock plus the penalties, less the tokens caught, in ms. */
export const total = g => Math.max(0, Math.round(g.t) + g.penalty - (g.bonus || 0));

/** Whether the ↺ button should be offered on its own: long off the road or the wrong way. */
export const needsReset = g => g.mode === 'play' && (g.off >= TUNING.resetAfter || g.back >= TUNING.resetAfter);

/**
 * Back on the road: the car on the centreline at the last point it was on the road, stopped, facing
 * forward, with its penalty.
 */
export function reset(g) {
  if (g.mode !== 'play') return;
  const p = g.track.pts[g.lastRoad], car = g.car;
  Object.assign(car, { x: p.x, y: p.y, h: p.h, vx: 0, vy: 0, steer: 0, slip: 0, speed: 0, px: p.x, py: p.y, ph: p.h, z: 0, vz: 0, air: false, e: heightAt(g.track, p.s), w: 0 });
  g.boost = 0;
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
  const lock = (T.lockSlow + (T.lockFast - T.lockSlow) * clamp(v / T.lockSpeed, 0, 1)) * DEG;
  const steer = clamp(-err / lock * 1.6, -1, 1);
  // The slowest the next stretch allows, braking in time for it
  const look = Math.round((v * v / (2 * T.brake) + 20) / SAMPLE);
  let limit = Infinity;
  for (let i = g.idx; i < Math.min(P.length, g.idx + look); i++) {
    const k = Math.abs(P[i].k);
    if (!k) continue;
    const vmax = Math.sqrt(gripOf(P[i].sf, g.track.wet) * 0.8 / k), dist = (i - g.idx) * SAMPLE;
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
  const g = { ...JSON.parse(JSON.stringify(rest)), track, events: [] };
  // A run saved before the relief: on a ramp's flight if it was in the air, on the ground's height
  g.bonus ??= 0; g.taken ??= [];
  if (g.car.air === undefined) Object.assign(g.car, { air: g.car.z > 0 || g.car.vz > 0, e: heightAt(track, g.progress || 0), w: 0 });
  return g;
}

/** The clock as the player reads it: m:ss.mmm. */
export function clock(ms) {
  const v = Math.max(0, Math.round(ms)), m = Math.floor(v / 60000), s = Math.floor(v / 1000) % 60, r = v % 1000;
  return `${m}:${String(s).padStart(2, '0')}.${String(r).padStart(3, '0')}`;
}

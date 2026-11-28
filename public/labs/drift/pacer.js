/**
 * Drift: simulated drivers (the owner, 2026-11-27), shared by the calibration
 * (tools/generators/drift-humans.mjs, which says how they were made and solved) and by the game: the
 * pace driver's ghost (`pacerGhost`, the owner: «un piloto fantasma … que simule una carrera
 * intermedia para que el usuario la pueda seguir») is the intermediate driver's lap of the circuit,
 * driven at the start of a run through the real engine and recorded as a ghost (ghost.js).
 * Pure and seeded: the same circuit and tuning give everyone the same pace driver.
 */
import * as E from './engine.js';
import { seeded } from './scenery.js';
import { curve as gameCurve } from './input.js';
import { recorder } from './ghost.js';

/** What a person brings (not what they choose). */
export const LEVELS = {
  expert: { delay: 0.16, hand: 1400, shake: 3, look: 0.5, guess: 0.8 },
  intermediate: { delay: 0.24, hand: 900, shake: 6, look: 0.45, guess: 0.65 },
  novice: { delay: 0.34, hand: 600, shake: 10, look: 0.4, guess: 0.5 },
};
/** The expert's own pace: brave, not perfect. */
export const EXPERT_PACE = { grip: 0.78, top: 1 };
/**
 * The pace each level was solved to drive at (a share of the grip and of the top speed), per view, for
 * the lap times asked for: what drift-humans.test.mjs holds the game to. Solve them again with this
 * tool when the car or the circuits change, and write them here.
 */
export const PACES = { '2d': { intermediate: 0.43, novice: 0.31 }, '3d': { intermediate: 0.44, novice: 0.30 } };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const DEG = Math.PI / 180;
/** The thumb's offset that gives `y` through a rising curve on [−1, 1] (bisection: any curve works). */
const inverse = (f, y) => { let lo = -1, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (f(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };

/**
 * A driver: a function of g that returns the input, as the controls would read it. `reach` is the
 * thumb's travel for full lock (px); `scheme` 'wheel' (a thumb steering, the other on the pedal) or
 * 'stick' (one thumb: sideways steers, up accelerates, down brakes).
 */
export function driver({ delay, hand, shake, look, guess = 0 }, pace, { reach, seed = 'h', scheme = 'wheel', curve = gameCurve }) {
  const rnd = seeded(seed);
  const gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += rnd(); return (s - 3) / Math.SQRT1_2 / 1.0; };
  const lag = Math.max(1, Math.round(delay / E.STEP));
  const queue = [];
  let thumb = 0, wobble = 0;
  return g => {
    const T = E.TUNING, car = g.car, P = g.track.pts, n = P.length;
    // What they would do now, from what they see now (it reaches the thumb `delay` later)
    const v = car.speed;
    const ahead = 6 + v * look;
    const at = i => P[g.track.loop ? ((i % (n - 1)) + (n - 1)) % (n - 1) : Math.min(n - 1, i)];
    const target = at(g.idx + Math.round(ahead / E.SAMPLE));
    // Aimed from where they guess the car will be when the thumb answers (its path bent by its yaw)
    const yaw = wrap(car.h - car.ph) / E.STEP, lead = delay * guess;
    const ph = car.h + yaw * lead, px = car.x + car.vx * lead, py = car.y + car.vy * lead;
    const err = wrap(Math.atan2(target.y - py, target.x - px) - ph);
    const lock = (T.lockSlow + (T.lockFast - T.lockSlow) * clamp(v / T.lockSpeed, 0, 1)) * DEG;
    // Where the thumb must go for that steering, through the controls' curve
    // Pure pursuit: the wheel angle that bends the car's path through the point they aim at
    const dist = Math.hypot(target.x - px, target.y - py) || 1, wheel = Math.atan(2 * T.wheelbase * Math.sin(err) / dist);
    const want = inverse(curve, clamp(-wheel / lock, -1, 1)) * reach;
    // How fast they dare: the bends ahead at their share of the grip, braking in time; their share of the top
    const reachAhead = Math.round((v * v / (2 * T.brake) + 25) / E.SAMPLE);
    let limit = E.topOf(car.surface === 'off' ? 'off' : P[g.idx].sf) * pace.top;
    for (let i = g.idx; i < g.idx + reachAhead; i++) {
      const p = at(i), k = Math.abs(p.k);
      if (!k) continue;
      const vmax = Math.sqrt(E.gripOf(p.sf, g.track.wet) * pace.grip / k), dist = (i - g.idx) * E.SAMPLE;
      limit = Math.min(limit, Math.sqrt(vmax * vmax + 2 * T.brake * 0.6 * dist));
    }
    // Against the forward speed: nobody holds the brake into reverse by mistake (they let go as it stops)
    const vf = car.vx * Math.cos(car.h) + car.vy * Math.sin(car.h), over = vf - limit;
    const pedal = over > 1.5 ? { throttle: 0, brake: clamp(over / 5, 0.3, 1) } : over > 0 ? { throttle: 0, brake: 0 } : { throttle: 1, brake: 0 };
    queue.push({ want, ...pedal });
    const act = queue.length > lag ? queue.shift() : { want: 0, throttle: 0, brake: 0 };
    // The thumb travels toward where they want it, no faster than their hand, wobbling as it goes
    const step = hand * E.STEP;
    thumb += clamp(act.want - thumb, -step, step);
    wobble += (-wobble / 0.35 + gauss() * shake * Math.sqrt(2 / 0.35) / Math.sqrt(E.STEP)) * E.STEP;
    const steer = curve(clamp((thumb + wobble) / reach, -1, 1));
    if (scheme === 'stick') {
      // One thumb: the same wobble moves it up and down too, through the stick's dead zone
      const up = act.throttle ? 0.82 : act.brake ? -(0.12 + 0.7 * act.brake) : 0;
      const dy = up + wobble * 0.5 / reach;
      return { steer, throttle: clamp((dy - 0.12) / 0.7, 0, 1), brake: clamp((-dy - 0.12) / 0.7, 0, 1), handbrake: false };
    }
    return { steer, throttle: act.throttle, brake: act.brake, handbrake: false };
  };
}

/**
 * The pace driver's lap of `track` (armed with its solids) as a ghost marked `sim`, with the engine's
 * TUNING as it stands (the view's own); null if it did not finish clean. About 10 000 steps.
 */
export function pacerGhost(track, { view = '2d', reach = 75, scheme = 'wheel', level = 'intermediate' } = {}) {
  // The expert drives at its own pace; the others at the pace solved for their lap times
  const m = PACES[view]?.[level] ?? PACES['2d'].intermediate;
  const pace = level === 'expert' ? EXPERT_PACE : { grip: EXPERT_PACE.grip * m, top: m };
  const drive = driver(LEVELS[level], pace, { reach, scheme, seed: `pacer:${level === 'intermediate' ? '' : level + ':'}${track.id}` });
  const g = E.newGame({ track }), rec = recorder();
  for (let i = 0; i < 120 * 240 && g.mode !== 'done'; i++) {
    E.step(g, drive(g)); g.events.length = 0;
    if (E.needsReset(g)) E.reset(g);
    rec.add(g);
  }
  const ghost = rec.ghost(g);
  // The expert may knock a tree (it is brave, not perfect: the calibration allows it); nobody may miss a gate
  return ghost && !g.missed && (level === 'expert' || g.lives === E.TUNING.lives) ? { ...ghost, sim: level } : null;
}

/**
 * A circuit's medals (the owner, 2026-11-28, option B): gold at the expert's lap, bronze at the
 * intermediate's, silver halfway between, as times that count (ms). Null if a driver did not finish.
 */
export function medalsOf(expert, intermediate) {
  if (!expert || !intermediate) return null;
  const gold = Math.min(expert.time, intermediate.time), bronze = Math.max(expert.time, intermediate.time);
  return { gold, silver: Math.round((gold + bronze) / 2), bronze };
}

/** The medal a time that counts earns: 'gold', 'silver', 'bronze' or null. */
export const medalFor = (ms, medals) => !medals ? null : ms <= medals.gold ? 'gold' : ms <= medals.silver ? 'silver' : ms <= medals.bronze ? 'bronze' : null;

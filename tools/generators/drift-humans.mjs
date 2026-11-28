/**
 * Drift: simulated human drivers, to calibrate the controls (the owner, 2026-11-27: «Calibra los
 * controles para que un usuario humano con alta sensibilidad pueda completarlo en un tiempo
 * imperfecto pero razonable, que un usuario humano intermedio lo termine en 50 % más del tiempo sin
 * chocar y que un humano novicio pueda lograr completar sin chocar pero en el doble de tiempo»).
 *
 * A driver here is what a person with a phone brings, in numbers, driving the real engine through the
 * real controls' arithmetic (input.js: a thumb's offset over `reach` px is the steering):
 *
 *   delay   s between what happens and the thumb answering it (they see the road a moment late)
 *   hand    px/s the thumb can travel (a quick hand gets to full lock sooner)
 *   shake   px of wobble in the thumb, slowly wandering (a nervous thumb is never still)
 *   look    how far ahead they aim, s of travel
 *   guess   how much of their own delay they make up for, guessing where the car will be by then
 *           (everyone does it; the more practised, the better)
 *   pace    the share of the grip they dare use in a bend, and of the top speed they dare on a straight
 *
 * The three levels: expert (quick, steady, brave), intermediate, novice (slow to react, shaky, careful).
 * Their delay, hand and shake are what people are; their pace is what they choose, so the pace of the
 * intermediate and the novice is solved for the lap times the owner asked for (1.5× and 2× the
 * expert's); then the question the calibration answers is whether, at that pace, the game lets them
 * lap without a crash.
 *
 *   node tools/generators/drift-humans.mjs            the table: every circuit, every level, both views
 *   node tools/generators/drift-humans.mjs --quick    four circuits, two runs each
 */
import * as E from '../../public/labs/drift/engine.js';
import { TRACKS, STAGES } from '../../public/labs/drift/tracks.js';
import { scenery, solids, seeded } from '../../public/labs/drift/scenery.js';
import { DEFAULT_VIEW, defaultsFor } from '../../public/labs/drift/tuning.js';
import { curve as gameCurve } from '../../public/labs/drift/input.js';

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
export const PACES = { '2d': { intermediate: 0.39, novice: 0.27 }, '3d': { intermediate: 0.41, novice: 0.29 } };
/** The lap times asked for, as a multiple of the expert's. */
export const TARGET = { expert: 1, intermediate: 1.5, novice: 2 };

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const DEG = Math.PI / 180;
/** The thumb's offset that gives `y` through a rising curve on [−1, 1] (bisection: any curve works). */
const inverse = (f, y) => { let lo = -1, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (f(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };

/** A track as the game arms it: its circuit, with the setting's solid scenery. */
export function armed(id) {
  const t = E.buildTrack(TRACKS[id]);
  t.solids = solids(scenery(t, t.setting));
  return t;
}

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

/** One lap: its time (s), its crashes, its missed gates, its time off the road, and whether it finished. */
export function lap(track, drive, limit = 240) {
  const g = E.newGame({ track });
  let crashes = 0, off = 0;
  for (let i = 0; i < 120 * limit && g.mode !== 'done'; i++) {
    E.step(g, drive(g));
    for (const e of g.events) if (e.type === 'crash' || e.type === 'wrecked') crashes += e.type === 'crash' ? 1 : 0;
    g.events.length = 0;
    if (!g.onRoad) off += E.STEP;
    if (E.needsReset(g)) E.reset(g);
  }
  return { t: g.t / 1000, crashes, missed: g.missed, off, done: g.mode === 'done' && !g.wrecked, resets: g.resets };
}

/** Puts a view's values into TUNING (as tuning.js does), with changes on top. */
export function useView(scene, changes = {}) { Object.assign(E.TUNING, defaultsFor(scene), changes); }

/** A level's laps over some circuits, `runs` each. */
export function laps(level, pace, { ids, runs, reach, scheme, curve }) {
  const out = [];
  for (const id of ids) {
    const t = armed(id);
    for (let r = 0; r < runs; r++) out.push({ id, ...lap(t, driver(LEVELS[level], pace, { reach, scheme, curve, seed: `${level}:${id}:${r}` })) });
  }
  return out;
}

const mean = a => a.reduce((s, x) => s + x, 0) / a.length;

/** The pace (a share of grip and top speed, together) that gives a level about `ratio` × the expert's time. */
export function paceFor(level, ratio, expertTime, opts) {
  let lo = 0.1, hi = 1, best = null;
  for (let k = 0; k < 9; k++) {
    const m = (lo + hi) / 2, pace = { grip: EXPERT_PACE.grip * m, top: m };
    const r = laps(level, pace, opts), time = mean(r.map(x => x.t));
    best = { pace, r, time };
    if (time / expertTime > ratio) lo = m; else hi = m;
  }
  return best;
}

/** The whole calibration table for a view: each level's time against the expert's and its crashes. */
export function table(scene, { ids, runs, changes = {}, reach, curve }) {
  useView(scene, changes);
  const scheme = scene === '3d' ? DEFAULT_VIEW.scheme3d : DEFAULT_VIEW.scheme;
  reach ??= DEFAULT_VIEW.reach;
  const opts = { ids, runs, reach, scheme, curve };
  const expert = laps('expert', EXPERT_PACE, opts);
  const eTime = mean(expert.map(x => x.t));
  const par = mean(ids.map(id => TRACKS[id].par / 1000));
  const rows = [{ level: 'expert', pace: EXPERT_PACE, r: expert, time: eTime }];
  for (const level of ['intermediate', 'novice']) rows.push({ level, ...paceFor(level, TARGET[level], eTime, opts) });
  useView(scene);
  return { scene, scheme, reach, par, rows: rows.map(({ level, pace, r, time }) => ({
    level, pace: `${(pace.grip).toFixed(2)}g ${(pace.top).toFixed(2)}t`, time: +time.toFixed(1), ofPar: +(time / par).toFixed(2), ofExpert: +(time / eTime).toFixed(2),
    crashes: r.reduce((s, x) => s + x.crashes, 0), crashLaps: r.filter(x => x.crashes).length, laps: r.length,
    unfinished: r.filter(x => !x.done).length, missed: r.reduce((s, x) => s + x.missed, 0), resets: r.reduce((s, x) => s + x.resets, 0),
  })) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const quick = process.argv.includes('--quick');
  const ids = quick ? STAGES.filter((_, i) => i % 3 === 0) : STAGES;
  const runs = quick ? 2 : 3;
  const changes = JSON.parse(process.env.CHANGES || '{}'), reach = process.env.REACH ? Number(process.env.REACH) : undefined;
  const a = process.env.EXPO ? Number(process.env.EXPO) : null, curve = a === null ? undefined : x => x * (a + (1 - a) * x * x);
  for (const scene of (process.env.SCENES || '2d,3d').split(',')) {
    const t = table(scene, { ids, runs, changes, reach, curve });
    console.log(`\n${scene} · ${t.scheme} · reach ${t.reach} px · par ${t.par.toFixed(1)} s`);
    console.table(t.rows);
  }
}

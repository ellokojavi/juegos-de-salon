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
import { LEVELS, EXPERT_PACE, PACES, driver } from '../../public/labs/drift/pacer.js';

// The people and their driving live in the game (pacer.js: the pace driver's ghost is one of them)
export { LEVELS, EXPERT_PACE, PACES, driver };

/** The lap times asked for, as a multiple of the expert's. */
export const TARGET = { expert: 1, intermediate: 1.5, novice: 2 };


/** A track as the game arms it: its circuit, with the setting's solid scenery. */
export function armed(id) {
  const t = E.buildTrack(TRACKS[id]);
  t.solids = solids(scenery(t, t.setting));
  return t;
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

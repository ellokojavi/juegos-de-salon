/**
 * Drift's circuits (docs/rally/core.md, section 4): draws closed circuits from a seeded generator,
 * keeps those that meet the standards below, and writes them to public/labs/drift/circuits.js as
 * data (pieces and features), so every phone builds the same circuit without deciding anything.
 *
 *   node tools/generators/drift-tracks.mjs            writes the pool (12 circuits)
 *   node tools/generators/drift-tracks.mjs --check    says whether the committed pool is what it would write
 *
 * The standards (the owner, 2026-11-27: «el circuito debe durar aproximadamente 1 minuto… un circuito
 * cerrado»; «es importante definir los estándares»), each checked here and again in engine.test.mjs:
 *
 *   1. Closed: the pieces turn exactly 360° and two straights are solved so the road meets its start;
 *      the start and the finish are one line, on a straight.
 *   2. About a minute: the autopilot (par) laps it in 55 to 65 s, on its own surface and weather.
 *   3. 8 to 10 gates, evenly spaced; none inside a fork, none within 25 m of a ramp or a pad.
 *   4. Clear of itself: the road never comes within 30 m of another part of itself (80 m apart along it).
 *   5. Bends of 16 m radius or more; at most two hairpins (under 22 m).
 *   6. One or two boost pads, each at the start of a straight with 130 m of straight after it.
 *   7. One or two ramps, on straights, 30 m after a bend and with RAMP_RUN m of straight after them: a
 *      ramp at top speed throws the car about 115 m, and it must land with room to brake (the
 *      calibration, tools/generators/drift-humans.mjs: ramps 30 m from a hairpin crashed every expert).
 *   8. One or two forks on gentle stretches (radius 60 m or more), bulging 12 to 16 m, 14 m clear of
 *      the rest of the road.
 *   9. The settings take turns (meadow, forest, plain); a plain is asphalt, the others gravel, some
 *      with an asphalt stretch; one circuit in four is wet.
 *  10. People: two grandstands (by the start, and halfway round) and at least two crowds, which stand
 *      at bends tighter than 45 m (scenery.js `people`).
 *  11. The autopilot laps it clean with the setting's own scenery: no gate missed, no crash, never
 *      long off the road.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as E from '../../public/labs/drift/engine.js';
import { scenery, solids, seeded, people } from '../../public/labs/drift/scenery.js';

const OUT = fileURLToPath(new URL('../../public/labs/drift/circuits.js', import.meta.url));
const POOL = 12;
const DEG = Math.PI / 180;
const PAR = [55000, 65000];
const SETTINGS = ['meadow', 'forest', 'plain'];
/** The straight a ramp needs after it: its flight at the top speed (2 v² lift / gravity) and 40 m to land and brake. */
export const RAMP_RUN = Math.round(2 * E.TUNING.topAsphalt ** 2 * E.TUNING.rampLift / E.TUNING.gravity + 40);

/** Where a list of pieces ends, from the origin facing north: { x, y, h }. */
function end(pieces) {
  let x = 0, y = 0, h = Math.PI / 2;
  for (const [kind, a, b] of pieces) {
    if (kind === 'S') { x += Math.cos(h) * a; y += Math.sin(h) * a; continue; }
    const th = (kind === 'L' ? 1 : -1) * b * DEG, chord = 2 * a * Math.sin(b * DEG / 2);
    x += Math.cos(h + th / 2) * chord; y += Math.sin(h + th / 2) * chord; h += th;
  }
  return { x, y, h };
}

/** A circuit's pieces, closed: arcs turning 360° in all, straights between them, two solved to close. */
function pieces(rnd) {
  const pick = a => a[Math.floor(rnd() * a.length)];
  const RADII = [16, 20, 26, 34, 45, 60, 80, 110, 150, 200];
  for (let tries = 0; tries < 200; tries++) {
    const n = 7 + Math.floor(rnd() * 5);
    const arcs = [];
    for (let i = 0; i < n - 1; i++) {
      const r = pick(RADII), left = rnd() < 0.68;
      const most = r < 22 ? 180 : r < 50 ? 120 : r < 100 ? 90 : 60;
      arcs.push([left ? 'L' : 'R', r, 5 * Math.round((25 + rnd() * (most - 25)) / 5)]);
    }
    const turned = arcs.reduce((t, [k, , d]) => t + (k === 'L' ? d : -d), 0);
    const rest = 360 - turned;
    if (Math.abs(rest) < 20 || Math.abs(rest) > 150) continue;
    const r = rest > 0 ? pick(RADII.slice(2)) : pick(RADII.slice(4));
    arcs.splice(Math.floor(rnd() * arcs.length) + 1, 0, [rest > 0 ? 'L' : 'R', r, Math.abs(rest)]);
    if (arcs.filter(a => a[1] < 22).length > 2) continue;
    // Straights: one before each arc and one after the last (with the first, the start straight)
    const S = Array.from({ length: arcs.length + 1 }, () => Math.round(15 + Math.pow(rnd(), 1.6) * 230));
    const seq = () => { const out = []; arcs.forEach((a, i) => { out.push(['S', S[i]], a); }); out.push(['S', S[arcs.length]]); return out; };
    // Solve two straights (not the start's ones) whose headings differ enough, so the road closes
    const heads = []; let h = Math.PI / 2;
    arcs.forEach((a, i) => { heads.push(h); h += (a[0] === 'L' ? 1 : -1) * a[2] * DEG; });
    const cand = [];
    for (let i = 1; i < arcs.length; i++) for (let j = i + 1; j < arcs.length; j++) if (Math.abs(Math.sin(heads[j] - heads[i])) > 0.6) cand.push([i, j]);
    if (!cand.length) continue;
    const [i, j] = pick(cand);
    S[i] = 0; S[j] = 0;
    const g = end(seq());
    // g + Li·ui + Lj·uj = 0
    const ui = [Math.cos(heads[i]), Math.sin(heads[i])], uj = [Math.cos(heads[j]), Math.sin(heads[j])];
    const det = ui[0] * uj[1] - ui[1] * uj[0];
    const Li = (-g.x * uj[1] + g.y * uj[0]) / det, Lj = (-ui[0] * g.y + ui[1] * g.x) / det;
    if (!(Li >= 20 && Li <= 420 && Lj >= 20 && Lj <= 420)) continue;
    S[i] = Math.round(Li * 10) / 10; S[j] = Math.round(Lj * 10) / 10;
    // The start and finish on a straight: the first and last straights make it, 60 m or more together
    if (S[0] < 30) S[0] = 30;
    if (S[arcs.length] < 30) S[arcs.length] = 30;
    // Lengthening the start straights reopened the road: solve again
    S[i] = 0; S[j] = 0;
    const g2 = end(seq());
    const Li2 = (-g2.x * uj[1] + g2.y * uj[0]) / det, Lj2 = (-ui[0] * g2.y + ui[1] * g2.x) / det;
    if (!(Li2 >= 20 && Li2 <= 420 && Lj2 >= 20 && Lj2 <= 420)) continue;
    S[i] = Math.round(Li2 * 10) / 10; S[j] = Math.round(Lj2 * 10) / 10;
    return seq();
  }
  return null;
}

/** Whether the road stays 30 m clear of itself (parts 80 m apart along a closed lap). */
function clear(t, gap = 30, apart = 80) {
  const P = t.pts.filter((_, i) => i % 2 === 0), L = t.length;
  for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
    const ds = Math.min(P[b].s - P[a].s, L - (P[b].s - P[a].s));
    if (ds > apart && Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y) < gap) return false;
  }
  return true;
}

/** The straights of a built circuit: runs of points with no curvature, as { from, to } in m. */
function straights(t) {
  const out = []; let from = null;
  for (const p of t.pts) {
    if (p.k === 0 && from === null) from = p.s;
    if (p.k !== 0 && from !== null) { out.push({ from, to: p.s }); from = null; }
  }
  if (from !== null) out.push({ from, to: t.length });
  return out;
}

/** The features of a circuit: pads, ramps, forks, zones, keeping clear of each other and the gates. */
function features(stage, rnd) {
  const t = E.buildTrack(stage), L = t.length;
  const gates = t.gates.map(g => g.s);
  const nearGate = (s, d) => gates.some(g => Math.abs(g - s) < d) || s < d || s > L - d;
  const used = [];   // { from, to } stretches already taken
  const free = (a, b) => used.every(u => b < u.from - 20 || a > u.to + 20);
  const S = straights(t);
  // Pads: at the start of a straight with 130 m of it left (never across the finish)
  const pads = [];
  for (const st of S.filter(st => st.to - st.from >= 150).sort(() => rnd() - 0.5)) {
    if (pads.length >= 1 + (rnd() < 0.5 ? 1 : 0)) break;
    const s = Math.round(st.from + 8);
    if (st.to > L - 2 || nearGate(s, 25) || !free(s, s + 130)) continue;
    pads.push({ s }); used.push({ from: s - 10, to: s + 130 });
  }
  // Ramps: on a straight, 30 m after its bend, with RAMP_RUN m of it ahead to fly and land
  const ramps = [];
  for (const st of S.filter(st => st.to - st.from >= 30 + RAMP_RUN).sort(() => rnd() - 0.5)) {
    if (ramps.length >= 1 + (rnd() < 0.4 ? 1 : 0)) break;
    const s = Math.round(st.from + 30 + rnd() * (st.to - st.from - 30 - RAMP_RUN));
    if (st.to > L - 2 || nearGate(s, 25) || !free(s - 10, s + 30)) continue;
    ramps.push({ s }); used.push({ from: s - 10, to: s + 30 });
  }
  // Forks: a gentle stretch of 100 to 140 m (radius 60 m or more), no gate in it, bulging to the side with room
  const forks = [];
  for (let tries = 0; tries < 60 && forks.length < 1 + (rnd() < 0.5 ? 1 : 0); tries++) {
    const len = 100 + Math.round(rnd() * 40), from = Math.round(40 + rnd() * (L - len - 80)), to = from + len;
    if (!free(from, to) || gates.some(g => g >= from - 10 && g <= to + 10)) continue;
    if (t.pts.some(p => p.s >= from && p.s <= to && Math.abs(p.k) > 1 / 60)) continue;
    const side = rnd() < 0.5 ? 'L' : 'R', offset = 12 + Math.round(rnd() * 4);
    const trial = E.buildTrack({ ...stage, forks: [{ from, to, side, offset }] });
    const b = trial.branches[0];
    const ok = b.pts.every(q => trial.pts.every(p => {
      const ds = Math.min(Math.abs(p.s - q.s), L - Math.abs(p.s - q.s));
      return ds < 60 || Math.hypot(q.x - p.x, q.y - p.y) >= 20;
    }));
    if (!ok) continue;
    forks.push({ from, to, side, offset }); used.push({ from, to });
  }
  return { pads, ramps, forks };
}

/** Circuit number `slot` of the pool, drawn from seed n, or null if no draw meets every standard. */
function circuit(slot, n, tries = 400) {
  const setting = SETTINGS[slot % 3];
  const rnd = seeded(`drift:circuit:${n}`);
  for (let k = 0; k < tries; k++) {
    const p = pieces(rnd);
    if (!p) continue;
    const surface = setting === 'plain' ? 'asphalt' : 'gravel';
    const wet = slot % 4 === 3;
    const stage = { id: `c${String(slot + 1).padStart(2, '0')}`, loop: true, gates: 8 + Math.floor(rnd() * 3), surface, setting, pieces: p };
    if (wet) stage.weather = 'wet';
    let t = E.buildTrack(stage);
    if (t.length < 1100 || t.length > 2600 || !clear(t)) continue;
    // An asphalt stretch on some gravel circuits: from a gate to another
    if (surface === 'gravel' && rnd() < 0.35) {
      const a = Math.floor(rnd() * (t.gates.length - 3));
      stage.zones = [{ from: Math.round(t.gates[a].s), to: Math.round(t.gates[a + 2].s), surface: 'asphalt' }];
    }
    Object.assign(stage, features(stage, rnd));
    if (!stage.pads.length || !stage.ramps.length || !stage.forks.length) continue;
    t = E.buildTrack(stage);
    const { stands, crowd } = people(t);
    if (stands.length < 2 || crowd.filter(c => c.kind === 'fan').length < 30 || crowd.filter(c => c.kind === 'bale').length < 15) continue;
    t.solids = solids(scenery(t, setting));
    // The autopilot laps it: the par, clean
    const g = E.newGame({ track: t });
    let worstOff = 0;
    for (let i = 0; i < 120 * 120 && g.mode !== 'done'; i++) { E.step(g, E.autopilot(g)); g.events.length = 0; worstOff = Math.max(worstOff, g.off); }
    if (g.mode !== 'done' || g.missed || g.lives < E.TUNING.lives || worstOff > 1.5) continue;
    if (g.t < PAR[0] || g.t > PAR[1]) continue;
    return { ...stage, par: Math.round(g.t) };
  }
  return null;
}

function pool() {
  const out = [];
  for (let n = 0; out.length < POOL && n < POOL * 6; n++) {
    const c = circuit(out.length, n);
    if (c) out.push(c);
  }
  return out;
}

function write(list) {
  const lines = list.map(c => '  ' + JSON.stringify(c).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'") + ',');
  return `/**
 * Drift: the circuits of the weekly rotation, generated by tools/generators/drift-tracks.mjs (do not
 * edit by hand: change the generator and run it). Each one is closed, about a minute for the autopilot
 * (\`par\`, ms), and meets the standards written at the top of the generator (docs/rally/core.md, section 4).
 */
export const CIRCUITS = [
${lines.join('\n')}
];
`;
}

const text = write(pool());
if (process.argv.includes('--check')) {
  const same = readFileSync(OUT, 'utf8') === text;
  console.log(same ? '✓ circuits.js is what the generator writes' : '✗ circuits.js differs from the generator: run node tools/generators/drift-tracks.mjs');
  process.exit(same ? 0 : 1);
}
writeFileSync(OUT, text);
console.log(`wrote ${OUT}`);

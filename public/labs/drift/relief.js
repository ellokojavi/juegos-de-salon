/**
 * Drift: the relief of a stage (the owner, 2026-11-27: «Permite distintos tipos de relieves dentro de
 * la misma pista … el auto puede saltar, subir y bajar»). Pure, like the engine: no DOM, no clock, and
 * the same relief for everyone, from the track's own seed.
 *
 * The road's height is a sum of local features along its distance `s`, each one back to 0 at both
 * ends, so a stage starts and ends at the height it started at (a closed circuit closes on itself):
 *
 *   hill    a long rise and fall (up to 6 m over 240–320 m): the car slows going up, gains coming down
 *   crest   a short sharp bump (1.4–2 m over 34–44 m): fast, the car leaves the ground over its top
 *   dip     a hollow (up to 2.5 m over 60–80 m) that presses the car down at its bottom
 *   whoops  three small bumps in a row (0.45 m, 12 m each): little hops at speed
 *
 * The jumps (crests, whoops) go first, wherever the road runs nearly straight from a little before
 * them to 90 m after (a crest at top speed throws the car some 60 m, and it must land with room) (the car cannot steer in the air), never on a fork, a ramp or a pad, nor on a gate or within 25 m before one, nor near the start or the end.
 * The other kinds never throw the car, even boosted: their sharpest downward bend is capped (CALM),
 * so their height is lowered where their length would make them too sharp.
 *
 *   relief(track)        → the features, also kept as track.relief; puts `e` (height, m) and `g`
 *                          (grade, m per m) on every point of the road and its forks
 *   heightAt(track, s)   → the road's height at distance s (m)
 *   gradeAt(track, s)    → its slope there (m per m, + uphill going forward)
 */
import { seeded } from './scenery.js';

/** The kinds, with their heights (m, + up) and lengths (m) as [min, max]. */
const KINDS = {
  hill: { a: [3.5, 6], len: [240, 320], jumps: false },
  crest: { a: [1.4, 2], len: [34, 44], jumps: true },
  dip: { a: [-2.5, -1.5], len: [60, 80], jumps: false },
  whoops: { a: [0.45, 0.45], len: [36, 36], jumps: true },
};
const FLAT_START = 70, FLAT_END = 50, STRAIGHT_BEFORE = 20, STRAIGHT_AFTER = 90, STRAIGHT_K = 1 / 90;
/** Room between two jumps, m (and up to twice that). */
const JUMP_GAP = 160;
/**
 * The sharpest downward bend (1/m) a hill or a dip may have: the ground falls away from a car only
 * past √(gravity / bend), here about 90 m/s, more than a boosted car's top speed.
 */
const CALM = 0.0014;
/** The sharpest downward bend of each shape, for a height of 1 over a length of 1. */
const BEND = { hill: 2 * Math.PI ** 2, dip: 0 };
/** The dip's: a hollow bends down only at its rims (its bottom presses the car into the ground). */
function dipBend() { let m = 0; for (let i = 1; i < 1000; i++) { const u = i / 1000, h = 1e-3; m = Math.max(m, (S4(u + h) - 2 * S4(u) + S4(u - h)) / (h * h)); } return m; }

/**
 * The shape of each kind over u in [0, 1], and its slope (per unit of u). Each is 0 with a zero
 * slope at both ends, so features meet the flat road smoothly.
 */
const S2 = u => Math.sin(Math.PI * u) ** 2;
const dS2 = u => Math.PI * Math.sin(2 * Math.PI * u);
const S4 = u => Math.sin(Math.PI * u) ** 4;
const dS4 = u => 4 * Math.PI * Math.sin(Math.PI * u) ** 3 * Math.cos(Math.PI * u);
const SHAPE = {
  hill: [S2, dS2], crest: [S2, dS2], dip: [S4, dS4],
  // Three bumps: the same small crest three times over the length
  whoops: [u => S2((u * 3) % 1), u => 3 * dS2((u * 3) % 1)],
};

/** The road's distance wrapped on a closed circuit, kept inside the road on an open stage. */
const along = (track, s) => (track.loop ? ((s % track.length) + track.length) % track.length : s);

export function heightAt(track, s) {
  let e = 0;
  s = along(track, s);
  for (const f of track.relief || []) {
    const u = (s - f.from) / f.len;
    if (u > 0 && u < 1) e += f.a * SHAPE[f.kind][0](u);
  }
  return e;
}

export function gradeAt(track, s) {
  let d = 0;
  s = along(track, s);
  for (const f of track.relief || []) {
    const u = (s - f.from) / f.len;
    if (u > 0 && u < 1) d += f.a * SHAPE[f.kind][1](u) / f.len;
  }
  return d;
}

export function relief(track) {
  if (!BEND.dip) BEND.dip = dipBend();
  const P = track.pts, L = track.length;
  const rnd = seeded(`${track.id}:relief`);
  const between = ([a, b]) => a + rnd() * (b - a);
  // Where a jump may not go: forks, ramps and pads (with room around them)
  const busy = [
    ...(track.branches || []).map(b => [b.from - 30, b.to + 30]),
    ...[...(track.ramps || []), ...(track.pads || [])].map(r => [r.s - 40, r.s + 60]),
  ];
  // Whether the road runs nearly straight from `from` to `to` m (round the start line on a circuit)
  const inside = (x, from, to) => (x >= from && x <= to) || (track.loop && (x + L <= to || x - L >= from));
  const straight = (from, to) => P.every(p => !inside(p.s, from, to) || Math.abs(p.k) <= STRAIGHT_K);
  const free = (from, to) => busy.every(([a, b]) => to < a || from > b);
  const features = [];
  const add = (kind, from, len, a) => features.push({ kind, from: Math.round(from * 10) / 10, len: Math.round(len * 10) / 10, a: Math.round(a * 100) / 100 });
  // First the jumps, wherever the road runs straight enough, crests and whoops in turn, apart from each other
  let jumps = Math.floor(rnd() * 2);
  for (let s = FLAT_START; s < L - FLAT_END;) {
    s = Math.round(s * 10) / 10;
    const kind = jumps % 2 ? 'whoops' : 'crest', K = KINDS[kind], len = Math.round(between(K.len) * 10) / 10, to = s + len;
    // …and no gate on it or just past it: a car hopping cannot steer through the posts
    const gateFree = (track.gates || []).every(g => g.s < s - 10 || g.s > to + 25);
    if (to <= L - FLAT_END && gateFree && straight(s - STRAIGHT_BEFORE, to + STRAIGHT_AFTER) && free(s, to + STRAIGHT_AFTER)) {
      add(kind, s, len, between(K.a));
      jumps++;
      s = to + JUMP_GAP + rnd() * JUMP_GAP;
    } else s += 10;
  }
  // Then hills and dips in the stretches between them, a hill or a dip in turn where it fits
  const taken = features.map(f => [f.from - 25, f.from + f.len + 25]);
  let calm = Math.floor(rnd() * 2);
  for (let s = FLAT_START; s < L - FLAT_END;) {
    const kind = calm % 2 ? 'dip' : 'hill', K = KINDS[kind], len = between(K.len), to = s + len;
    if (to <= L - FLAT_END && taken.every(([a, b]) => to < a || s > b)) {
      // Lowered to its cap: its sharpest downward bend is |a| × BEND / len²
      const a = between(K.a);
      add(kind, s, len, Math.sign(a) * Math.min(Math.abs(a), CALM * len * len / BEND[kind]));
      calm++;
      s = to + 20 + rnd() * 50;
    } else s += 10;
  }
  features.sort((a, b) => a.from - b.from);
  track.relief = features;
  for (const p of P) { p.e = heightAt(track, p.s); p.g = gradeAt(track, p.s); }
  for (const b of track.branches || []) for (const p of b.pts) { p.e = heightAt(track, p.s); p.g = gradeAt(track, p.s); }
  return features;
}

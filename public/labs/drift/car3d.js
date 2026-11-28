/**
 * Drift: the car in 3D, a rally hatchback (the owner, 2026-11-27: «cambia el auto para que sea una
 * especie de auto de rally»). Built in its own frame (x forward, y left, z up, the ground at z 0) as
 * the parts scene3d.js draws with the car's pose:
 *
 *   carMeshes() → { body, glass, trim, wheelFront, wheelBack, lights, brake, shadow }
 *
 * What makes it a rally car: a short, tall hatchback body lofted through cross-sections, raised off
 * the ground (the gap under the sills shows), plastic arches flared over chunky gravel tyres on white
 * rims, a pod of four spotlights on the nose, a skid plate, red tow hooks, a roof vent and an aerial,
 * a big wing on tall struts over the hatch, mud flaps behind every wheel, side skirts, the livery
 * (two white stripes over the roof, a yellow and white band along the doors, a number on each door)
 * and mud thrown up the lower flanks. The wheels are placed by the scene at x ±1.3, y ±0.85, z 0.36.
 */
import { Mesh, rgb } from './gl3d.js';

export const CAR3D = {
  body: '#ff2e88', roof: '#e0206f', stripe: '#ffffff', band: '#ffd23f', glass: '#2e2a40',
  plastic: '#1c1c22', grey: '#3a3a44', chrome: '#c8c8d0', mud: '#6b5236', rim: '#f2f2ee', rimDark: '#a8a8b0',
  tyre: '#16161b', tyreLight: '#2c2c34', hook: '#e8302a', number: '#15151a', spot: '#fff3b0', spotRim: '#2a2a30',
  flap: '#20181c', headlight: '#fff6c8',
};
const CAR_L = 4.2;

export function carMeshes() {
  const body = new Mesh(), glass = new Mesh(), trim = new Mesh(), wheelFront = new Mesh(), wheelBack = new Mesh(), lights = new Mesh(), brake = new Mesh(), shadow = new Mesh();
  const C = Object.fromEntries(Object.entries(CAR3D).map(([k, v]) => [k, rgb(v)]));
  const B = C.body, BD = rgb(CAR3D.body, 0.78), MUD = C.mud, MUDB = rgb(CAR3D.mud, 1.25);

  // The body: cross-sections from the nose to the tail, x then [half width, z] at the sill, the flank,
  // the shoulder and the top. A short bonnet, then the tall hatch: the cabin is lofted separately
  const SECTIONS = [
    [2.1, [0.7, 0.45], [0.74, 0.56], [0.7, 0.72], [0.55, 0.77]],
    [1.95, [0.82, 0.42], [0.88, 0.56], [0.85, 0.8], [0.64, 0.87]],
    [1.2, [0.84, 0.42], [0.9, 0.58], [0.87, 0.9], [0.68, 0.97]],
    [0.6, [0.84, 0.42], [0.9, 0.58], [0.87, 0.95], [0.7, 1.0]],
    [-1.0, [0.84, 0.42], [0.9, 0.58], [0.87, 0.98], [0.7, 1.02]],
    [-1.75, [0.84, 0.42], [0.9, 0.58], [0.87, 0.98], [0.7, 1.02]],
    [-2.02, [0.8, 0.44], [0.85, 0.58], [0.82, 0.95], [0.66, 1.0]],
    [-2.1, [0.74, 0.47], [0.78, 0.58], [0.74, 0.92], [0.6, 0.96]],
  ];
  const ring = ([x, ...pts]) => [...pts.map(([w, z]) => [x, -w, z]), ...pts.slice().reverse().map(([w, z]) => [x, w, z])];
  // The faces between ring points: the sill and the lower flank carry the mud, then paint
  const bandCol = [MUD, MUDB, B, B, B, MUDB, MUD];
  for (let i = 0; i + 1 < SECTIONS.length; i++) {
    const a = ring(SECTIONS[i]), b = ring(SECTIONS[i + 1]);
    for (let k = 0; k + 1 < a.length; k++) body.quad(a[k], b[k], b[k + 1], a[k + 1], bandCol[k]);
  }
  const cap = (sec, out) => {
    const r = ring(sec), c = [sec[0] + out * 0.01, 0, 0.66];
    for (let k = 0; k + 1 < r.length; k++) out > 0 ? body.tri(r[k], c, r[k + 1], B) : body.tri(r[k + 1], c, r[k], B);
    out > 0 ? body.tri(r[r.length - 1], c, r[0], B) : body.tri(r[0], c, r[r.length - 1], B);
  };
  cap(SECTIONS[0], 1); cap(SECTIONS[SECTIONS.length - 1], -1);

  // The cabin of a hatchback: a raked windscreen, a long roof, a hatch glass that drops almost straight
  const ws0 = [0.62, 0.69, 0.99], ws1 = [-0.05, 0.6, 1.52], rf1 = [-1.6, 0.6, 1.53], rw0 = [-1.98, 0.66, 1.03];
  const Lp = ([x, w, z]) => [x, w, z], Rp = ([x, w, z]) => [x, -w, z];
  glass.quad(Rp(ws0), Lp(ws0), Lp(ws1), Rp(ws1), C.glass);
  body.quad(Rp(ws1), Lp(ws1), Lp(rf1), Rp(rf1), C.roof);
  glass.quad(Lp(rw0), Rp(rw0), Rp(rf1), Lp(rf1), C.glass);
  // Two white stripes from the bonnet over the roof
  for (const o of [-0.2, 0.2]) {
    body.quad([2.0, o - 0.09, 0.9], [2.0, o + 0.09, 0.9], [0.63, o + 0.09, 1.015], [0.63, o - 0.09, 1.015], C.stripe);
    body.quad([-0.08, o - 0.09, 1.535], [-0.08, o + 0.09, 1.535], [-1.58, o + 0.09, 1.545], [-1.58, o - 0.09, 1.545], C.stripe);
  }
  for (const side of [1, -1]) {
    const P = ([x, w, z]) => [x, side * w, z];
    const tri = (m, a, b, c, col) => (side > 0 ? m.tri(P(a), P(b), P(c), col) : m.tri(P(a), P(c), P(b), col));
    // Side glass in two panes, a B pillar between them, a C pillar before the hatch
    const bp0 = [-0.62, 0.7, 1.0], bp1 = [-0.62, 0.6, 1.525], bq0 = [-0.74, 0.7, 1.0], bq1 = [-0.74, 0.6, 1.525];
    const cp0 = [-1.62, 0.7, 1.0], cp1 = [-1.55, 0.6, 1.53];
    tri(glass, ws0, bp0, bp1, C.glass); tri(glass, ws0, bp1, ws1, C.glass);
    tri(body, bp0, bq0, bq1, C.roof); tri(body, bp0, bq1, bp1, C.roof);
    tri(glass, bq0, cp0, cp1, C.glass); tri(glass, bq0, cp1, bq1, C.glass);
    tri(body, cp0, rw0, rf1, C.roof); tri(body, cp0, rf1, cp1, C.roof);
    // The shoulder under the windows, where the glass meets the paint
    tri(body, [0.62, 0.86, 0.96], cp0, ws0, B);
    tri(body, [0.62, 0.86, 0.96], [-1.75, 0.86, 0.96], cp0, B);
  }

  // The livery: a yellow band with a white edge along each flank, and a number on each door
  for (const side of [-1, 1]) {
    const y = side * 0.905, f = (m, a, b, c, d, col) => (side > 0 ? m.quad(a, b, c, d, col) : m.quad(a, d, c, b, col));
    f(trim, [1.6, y, 0.62], [-1.9, y, 0.66], [-1.9, y, 0.74], [1.6, y, 0.7], C.band);
    f(trim, [1.6, y, 0.7], [-1.9, y, 0.74], [-1.9, y, 0.77], [1.6, y, 0.73], C.stripe);
    // The number plate: a white disc with a «7» in thick strokes
    const cx = -0.55, cz = 0.79, r = 0.2, n = 14, yy = side * 0.912;
    for (let k = 0; k < n; k++) {
      const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2;
      const p0 = [cx + Math.cos(a0) * r, yy, cz + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, yy, cz + Math.sin(a1) * r];
      side > 0 ? trim.tri([cx, yy, cz], p0, p1, C.stripe) : trim.tri([cx, yy, cz], p1, p0, C.stripe);
    }
    const y2 = side * 0.918;
    f(trim, [cx - 0.09 * side, y2, cz + 0.1], [cx + 0.09 * side, y2, cz + 0.1], [cx + 0.09 * side, y2, cz + 0.065], [cx - 0.09 * side, y2, cz + 0.065], C.number);
    f(trim, [cx + 0.09 * side, y2, cz + 0.1], [cx + 0.055 * side, y2, cz + 0.1], [cx - 0.04 * side, y2, cz - 0.12], [cx - 0.005 * side, y2, cz - 0.12], C.number);
  }

  // Plastic arches flared over the wheels, side skirts, mud flaps behind each wheel
  for (const fx of [CAR_L * 0.31, -CAR_L * 0.3]) for (const side of [-1, 1]) {
    for (let k = 0; k <= 8; k++) {
      const a = Math.PI * k / 8, ax = fx + Math.cos(a) * 0.5, az = 0.36 + Math.sin(a) * 0.5;
      trim.box(ax, side * 0.93, Math.max(0.42, az), 0.08, 0.06, 0.06, 0, [C.plastic, C.plastic]);
    }
    trim.box(fx - 0.56, side * 0.82, 0.3, 0.015, 0.16, 0.2, 0, [C.flap, C.flap]);
  }
  for (const side of [-1, 1]) trim.box(-0.05, side * 0.9, 0.42, 0.8, 0.04, 0.05, 0, [C.plastic, C.plastic]);

  // The nose: bumper, grille, skid plate, red tow hook; and the pod of four spotlights on the bonnet's lip
  trim.box(2.12, 0, 0.5, 0.06, 0.74, 0.11, 0, [C.grey, C.grey]);
  trim.quad([2.14, -0.36, 0.6], [2.14, 0.36, 0.6], [2.14, 0.36, 0.72], [2.14, -0.36, 0.72], C.plastic);
  trim.box(1.85, 0, 0.3, 0.38, 0.62, 0.03, 0, [C.chrome, C.grey]);
  trim.box(2.2, 0.45, 0.42, 0.05, 0.03, 0.05, 0, [C.hook, C.hook]);
  trim.box(2.17, 0, 0.88, 0.05, 0.62, 0.03, 0, [C.plastic, C.plastic]);
  for (const o of [-0.45, -0.15, 0.15, 0.45]) {
    // Each lamp: a dark ring facing forward, its glass lit
    const n = 10, r0 = 0.12, r1 = 0.09, x0 = 2.24, cz = 0.98;
    for (let k = 0; k < n; k++) {
      const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2;
      const P = (a, r, x) => [x, o + Math.cos(a) * r, cz + Math.sin(a) * r];
      trim.quad(P(a0, r0, x0 - 0.1), P(a1, r0, x0 - 0.1), P(a1, r0, x0), P(a0, r0, x0), C.spotRim);
      lights.tri([x0 + 0.005, o, cz], P(a0, r1, x0 + 0.005), P(a1, r1, x0 + 0.005), C.spot);
    }
    trim.box(2.16, o, 0.9, 0.04, 0.025, 0.05, 0, [C.plastic, C.plastic]);
  }
  // The headlights, small, in the nose
  for (const o of [-0.5, 0.5]) {
    trim.box(2.11, o, 0.66, 0.03, 0.16, 0.07, 0, [C.chrome, C.chrome]);
    lights.box(2.13, o, 0.66, 0.02, 0.12, 0.05, 0, C.headlight);
  }

  // The tail: bumper, red tow hook, the exhaust, the lights high on the hatch's sides
  trim.box(-2.12, 0, 0.52, 0.06, 0.76, 0.1, 0, [C.grey, C.grey]);
  trim.box(-2.2, -0.4, 0.44, 0.05, 0.03, 0.05, 0, [C.hook, C.hook]);
  trim.cone(-2.18, 0.5, 0.34, 0.34, 0.07, 0.07, 8, C.chrome);
  for (const o of [-0.6, 0.6]) brake.box(-2.11, o, 0.82, 0.02, 0.1, 0.12, 0, rgb('#ffffff'));

  // On the roof: a vent and an aerial. Over the hatch: a big wing on two tall struts, with end plates
  trim.box(-0.5, 0, 1.58, 0.24, 0.18, 0.05, 0, [C.plastic, C.grey]);
  trim.box(-1.3, 0.3, 1.78, 0.012, 0.012, 0.25, 0, [C.plastic, C.plastic]);
  for (const o of [-0.45, 0.45]) trim.box(-1.92, o, 1.62, 0.06, 0.03, 0.1, 0, [C.plastic, C.plastic]);
  body.box(-1.96, 0, 1.74, 0.2, 0.86, 0.035, 0, [C.roof, BD]);
  for (const o of [-0.87, 0.87]) body.box(-1.96, o, 1.7, 0.24, 0.02, 0.11, 0, [C.stripe, C.stripe]);
  // The mirrors, in the body's colour, with their glass
  for (const side of [-1, 1]) {
    body.box(0.5, side * 0.95, 1.06, 0.08, 0.11, 0.07, 0, [B, B]);
    glass.quad([0.41, side * 0.87, 1.01], [0.41, side * 1.03, 1.01], [0.41, side * 1.03, 1.11], [0.41, side * 0.87, 1.11], C.chrome);
  }

  // A wheel: a chunky gravel tyre with blocks on its tread, on a white rim (placed by the scene)
  const wheel = m => {
    const n = 16, r = 0.37, hw = 0.17;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      const p = (a, y, rr = r) => [Math.cos(a) * rr, y, Math.sin(a) * rr];
      // The tread: alternate blocks stand proud, so its turning shows from behind too
      const rr = i % 2 ? r : r + 0.02, col = Math.floor(i / 2) % 2 ? C.tyre : C.tyreLight;
      m.quad(p(a0, -hw, rr), p(a1, -hw, rr), p(a1, hw, rr), p(a0, hw, rr), col);
      for (const sy of [1, -1]) {
        const y = sy * (hw + 0.01), yr = sy * (hw + 0.02);
        const t = (a, b, c, cl) => (sy > 0 ? m.tri(a, b, c, cl) : m.tri(a, c, b, cl));
        t(p(a1, y, rr), p(a0, y, rr), p(a0, y, 0.24), C.tyre); t(p(a1, y, rr), p(a0, y, 0.24), p(a1, y, 0.24), C.tyre);
        // The white rim: six spokes over a grey dish, a dark nut in the middle
        t([0, yr, 0], p(a1, yr, 0.24), p(a0, yr, 0.24), i % 8 < 2 || (i + 4) % 8 < 2 ? C.rim : C.rimDark);
        t([0, yr * 1.05, 0], p(a1, yr * 1.05, 0.06), p(a0, yr * 1.05, 0.06), C.plastic);
      }
    }
  };
  wheel(wheelFront); wheel(wheelBack);

  // Its soft shadow: three dark rounded plates under it, smaller and darker inward
  for (const [k, al] of [[1.0, 0.16], [0.85, 0.16], [0.7, 0.18]]) {
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, ex = CAR_L * 0.62 * k, ey = 1.8 * 0.7 * k;
      shadow.tri([0, 0, 0.06], [Math.cos(a0) * ex, Math.sin(a0) * ey, 0.06], [Math.cos(a1) * ex, Math.sin(a1) * ey, 0.06], [0, 0, 0, al]);
    }
  }
  return { body, glass, trim, wheelFront, wheelBack, lights, brake, shadow };
}

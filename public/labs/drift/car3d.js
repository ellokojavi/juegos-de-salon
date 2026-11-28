/**
 * Drift: the car in 3D, a rally hatchback modelled like a real one (the owner, 2026-11-27: «una especie
 * de auto de rally»; then «pule más el diseño … más realista»). Built in its own frame (x forward, y
 * left, z up, the ground at z 0) as the parts scene3d.js draws with the car's pose:
 *
 *   carMeshes() → { body, glass, trim, wheelFront, wheelBack, lights, brake, shadow }
 *
 * How it is made, so it reads as a car and not as boxes:
 * - The lower body is lofted through sixty cross-sections from the nose to the tail. Each section's
 *   width follows a rounded plan (narrower nose, squarer tail), its top the bonnet and the waistline,
 *   and its bottom the sill, raised over each wheel along a circle: the wheel arches are cut into
 *   the body itself.
 * - Over each arch a wide flare (a rally car's), and inside it a dark liner.
 * - The cabin is a second loft with tumblehome. Its faces are glass or pillar by where they are: the
 *   windscreen, the side windows split by the B pillar, the rear hatch glass.
 * - Set into the surfaces: headlights, grille and intake in the nose, tail lights, a number plate and
 *   an exhaust at the back. Then a pod of four spotlights, a roof spoiler with end plates, mirrors,
 *   door lines and a handle, mud flaps, an aerial and a roof vent.
 * - The livery: two white stripes over the bonnet and the roof, a yellow band along the door, a
 *   number on each door (readable from both sides). The sills are dark and the lower flanks dusty.
 * - Wheels: tyres with rounded sidewalls and a fine tread, white five-spoke rims, a brake disc and a
 *   red caliper behind them.
 *
 * Every face is turned outward from a reference point (`out`), so the flat shading lights it right
 * whatever order its corners were written in. The wheels are placed by the scene at x ±1.3,
 * y ±0.85, z 0.36.
 */
import { Mesh, rgb } from './gl3d.js';

export const CAR3D = {
  body: '#ff2e88', roof: '#e8237a', stripe: '#ffffff', band: '#ffd23f', glass: '#1e2433',
  plastic: '#1b1b20', grey: '#3c3d45', chrome: '#c9cbd3', mud: '#8a6a48', rim: '#f4f4f0', rimDark: '#9a9ca6',
  tyre: '#18181d', tyreWall: '#232329', disc: '#8d8f97', caliper: '#e8302a', hook: '#e8302a', number: '#15151a',
  spot: '#fff4c2', spotRim: '#26262c', headlight: '#fff8dc', liner: '#121215', plate: '#f2f2ea',
};
const L = 2.1;                       // half length (the car is 4.2 m)
const W = 0.86;                      // half width of the body (the flares stick out past it)
const WHEELS = [1.302, -1.26];       // the axles' x (scene3d.js places the wheels there)
const R_ARCH = 0.47, AXLE_Z = 0.36;

/* ---------------- The profiles ---------------- */
/** Half width at x: a rounded plan, the nose rounder than the tail. */
const halfW = x => {
  const n = x > 0 ? 3.2 : 5.5, u = Math.min(1, Math.abs(x) / L);
  return W * Math.pow(Math.max(0, 1 - Math.pow(u, n)), 1 / n);
};
/** The x of the body's front or back surface at a half width y (the plan solved the other way). */
const endX = (y, sign) => {
  const n = sign > 0 ? 3.2 : 5.5;
  return sign * L * Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(y) / W), n)), 1 / n);
};
/** The top of the lower body: the bonnet falls to the nose, the waistline runs back, the tail drops a little. */
const topZ = x => {
  if (x > 0.78) { const u = (x - 0.78) / (L - 0.78); return 0.97 - 0.2 * u * u - 0.04 * u; }
  if (x > -1.85) return 0.98 + (0.78 - x) * 0.008;
  const u = (-1.85 - x) / (L - 1.85); return 1.0 - 0.07 * u * u;
};
/** The bottom: the sill, lower at the bumpers, and over each wheel the arch's circle. */
const bottomZ = x => {
  let z = 0.36;
  if (x > 1.85) z = 0.36 - (x - 1.85) * 0.3;
  if (x < -1.9) z = 0.36 - (-1.9 - x) * 0.25;
  for (const xw of WHEELS) {
    const d = Math.abs(x - xw);
    if (d < R_ARCH) z = Math.max(z, AXLE_Z + Math.sqrt(R_ARCH * R_ARCH - d * d));
  }
  return z;
};
/** The roof line of the cabin: up the windscreen, along the roof, down the hatch glass. */
const roofZ = x => {
  if (x > 0.02) { const u = Math.min(1, (0.8 - x) / 0.78); return 0.99 + 0.49 * Math.sin(u * Math.PI / 2); }
  if (x > -1.52) return 1.48 - (0.02 - x) * 0.012;
  const u = Math.min(1, (-1.52 - x) / 0.45); return 1.462 - 0.18 * u * u - 0.27 * u;
};

/* ---------------- Faces turned outward ---------------- */
/** A triangle whose normal points away from `ref` (b and c swapped when the corners say otherwise). */
function out(m, a, b, c, col, ref) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const cx = (a[0] + b[0] + c[0]) / 3 - ref[0], cy = (a[1] + b[1] + c[1]) / 3 - ref[1], cz = (a[2] + b[2] + c[2]) / 3 - ref[2];
  if (nx * cx + ny * cy + nz * cz < 0) m.tri(a, c, b, col); else m.tri(a, b, c, col);
}
const quadOut = (m, a, b, c, d, col, ref) => { out(m, a, b, c, col, ref); out(m, a, c, d, col, ref); };
/** The body's own reference: its centre line at the face's x, a little above the middle. */
const bodyRef = (...pts) => [Math.max(-1.7, Math.min(1.7, pts.reduce((s, p) => s + p[0], 0) / pts.length)), 0, 0.62];

const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

export function carMeshes() {
  const body = new Mesh(), glass = new Mesh(), trim = new Mesh(), wheelFront = new Mesh(), wheelBack = new Mesh(), lights = new Mesh(), brake = new Mesh(), shadow = new Mesh();
  const C = Object.fromEntries(Object.entries(CAR3D).map(([k, v]) => [k, rgb(v)]));
  const B = C.body, DUST = mix(C.body, C.mud, 0.45), ROOF = C.roof;

  /* ---- The lower body: sections from the nose to the tail ---- */
  const N = 64, xs = Array.from({ length: N + 1 }, (_, i) => L - 0.004 - (2 * L - 0.008) * (0.5 - 0.5 * Math.cos(Math.PI * i / N)));
  const ring = x => {
    const w = halfW(x), zb = bottomZ(x), zt = topZ(x), h = zt - zb;
    const clampZ = z => Math.max(zb, z);
    const side = [
      [w - 0.07, zb], [w - 0.01, clampZ(zb + 0.07)], [w + 0.012, clampZ(zb + h * 0.42)], [w + 0.004, clampZ(zt - 0.14)],
      [w - 0.03, clampZ(zt - 0.04)], [w - 0.11, zt + 0.004], [w * 0.5, zt + 0.018],
    ];
    return [...side.map(([y, z]) => [x, -y, z]), ...side.slice().reverse().map(([y, z]) => [x, y, z])];
  };
  // The colour of each band of the ring, from the sill up: dark sill, dusty lower flank, then paint
  const band = k => (k === 0 || k === 12 ? C.plastic : k === 1 || k === 11 ? DUST : B);
  for (let i = 0; i < N; i++) {
    const a = ring(xs[i]), b = ring(xs[i + 1]);
    for (let k = 0; k + 1 < a.length; k++) quadOut(body, a[k], b[k], b[k + 1], a[k + 1], band(k), bodyRef(a[k], b[k]));
  }
  // The nose and the tail closed: each end ring fanned to its centre
  for (const [i, sx] of [[0, 1], [N, -1]]) {
    const r = ring(xs[i]), c = [xs[i] + sx * 0.003, 0, (bottomZ(xs[i]) + topZ(xs[i])) / 2];
    for (let k = 0; k + 1 < r.length; k++) out(body, r[k], r[k + 1], c, k === 0 || k === 12 ? C.plastic : B, [0, 0, 0.6]);
    out(body, r[r.length - 1], r[0], c, C.plastic, [0, 0, 0.6]);
  }
  // The floor, dark, seen in the gap under the sills
  quadOut(trim, [1.9, -0.8, 0.3], [1.9, 0.8, 0.3], [-1.9, 0.8, 0.3], [-1.9, -0.8, 0.3], C.liner, [0, 0, 1]);

  /* ---- The wheel arches: a dark liner inside, a wide flare outside ---- */
  for (const xw of WHEELS) for (const side of [-1, 1]) {
    const n = 14, arch = (a, r) => [xw + Math.cos(a) * r, AXLE_Z + Math.sin(a) * r];
    for (let k = 0; k < n; k++) {
      const a0 = Math.PI * k / n, a1 = Math.PI * (k + 1) / n;
      const [x0, z0] = arch(a0, R_ARCH), [x1, z1] = arch(a1, R_ARCH);
      // The liner: the arch's inside, from the body's side in to the frame, facing the wheel
      quadOut(trim, [x0, side * 0.5, z0], [x1, side * 0.5, z1], [x1, side * (halfW(x1) + 0.08), z1], [x0, side * (halfW(x0) + 0.08), z0], C.liner, [xw, side * 0.7, AXLE_Z]);
      // The flare: a lip standing out past the body, its top sloping back into the panel
      const [fx0, fz0] = arch(a0, R_ARCH + 0.07), [fx1, fz1] = arch(a1, R_ARCH + 0.07), [tx0, tz0] = arch(a0, R_ARCH + 0.16), [tx1, tz1] = arch(a1, R_ARCH + 0.16);
      const o0 = halfW(x0) + 0.11, o1 = halfW(x1) + 0.11;
      const ref = [xw, side * 0.3, AXLE_Z];
      quadOut(body, [x0, side * o0, z0], [x1, side * o1, z1], [fx1, side * o1, fz1], [fx0, side * o0, fz0], B, ref);
      quadOut(body, [fx0, side * o0, fz0], [fx1, side * o1, fz1], [tx1, side * (halfW(tx1) + 0.005), tz1], [tx0, side * (halfW(tx0) + 0.005), tz0], B, ref);
      // Its underside, dark, between the lip and the body
      quadOut(trim, [x0, side * (halfW(x0) - 0.01), z0], [x1, side * (halfW(x1) - 0.01), z1], [x1, side * o1, z1], [x0, side * o0, z0], C.plastic, [xw, side * 0.9, AXLE_Z]);
    }
    // The flare's ends, down to the sill
    for (const a of [0, Math.PI]) {
      const [x0, z0] = arch(a, R_ARCH), [fx0] = arch(a, R_ARCH + 0.16), o = halfW(x0) + 0.11;
      quadOut(body, [x0, side * o, z0], [fx0, side * (halfW(fx0) + 0.005), z0], [fx0, side * (halfW(fx0) + 0.005), z0 - 0.06], [x0, side * o, z0 - 0.06], C.plastic, [xw, 0, AXLE_Z]);
    }
    // A mud flap behind the wheel, with a white logo
    const fx = xw - R_ARCH - 0.05, fy = side * (halfW(fx) - 0.05);
    trim.box(fx, fy, 0.24, 0.012, 0.14, 0.15, 0, [C.plastic, C.plastic]);
    trim.box(fx - 0.014, fy, 0.3, 0.002, 0.08, 0.025, 0, [C.stripe, C.stripe]);
  }

  /* ---- The cabin: windscreen, side windows, roof, hatch glass ---- */
  const cx = [];
  for (let i = 0; i <= 10; i++) cx.push(0.8 - 0.78 * i / 10);
  for (let i = 1; i <= 10; i++) cx.push(0.02 - 1.54 * i / 10);
  for (let i = 1; i <= 7; i++) cx.push(-1.52 - 0.45 * i / 7);
  const cabin = x => {
    const h = roofZ(x), zb = topZ(x) - 0.005, wb = halfW(x) - 0.1;
    const wr = Math.min(wb - 0.02, 0.63), rise = Math.max(0, h - zb);
    return [
      [x, -wb, zb], [x, -(wr + 0.06), zb + rise * 0.86], [x, -wr, zb + rise * 0.96], [x, -wr * 0.5, h], [x, wr * 0.5, h],
      [x, wr, zb + rise * 0.96], [x, wr + 0.06, zb + rise * 0.86], [x, wb, zb],
    ];
  };
  const sideWindow = x => (x < 0.02 && x > -1.52 && (x > -0.6 || x < -0.74));   // not the B pillar
  for (let i = 0; i + 1 < cx.length; i++) {
    const a = cabin(cx[i]), b = cabin(cx[i + 1]), xm = (cx[i] + cx[i + 1]) / 2, ref = [xm, 0, 0.9];
    const screen = xm > 0.02, hatch = xm < -1.52;
    for (let k = 0; k + 1 < a.length; k++) {
      const sideEdge = k === 0 || k === 6, rail = k === 1 || k === 5, top = k >= 2 && k <= 4;
      let m = body, col = ROOF;
      if (sideEdge) { if (screen || sideWindow(xm)) { m = glass; col = C.glass; } }
      else if (rail) { if (screen && xm > 0.1) { m = glass; col = C.glass; } }
      else if (top && (screen || hatch)) { m = glass; col = C.glass; }
      quadOut(m, a[k], b[k], b[k + 1], a[k + 1], col, ref);
    }
  }
  // The cabin's back: the hatch glass meets the tail
  {
    const r = cabin(cx[cx.length - 1]), c = [cx[cx.length - 1], 0, topZ(cx[cx.length - 1]) + 0.02];
    for (let k = 0; k + 1 < r.length; k++) out(body, r[k], r[k + 1], c, ROOF, [0, 0, 0.9]);
  }

  /* ---- The livery ---- */
  // Two white stripes over the bonnet and the roof, a hair above the paint
  for (const o of [-0.2, 0.2]) {
    for (let i = 0; i < 14; i++) {
      const x0 = 2.0 - i * 0.09, x1 = x0 - 0.09;
      if (x1 < 0.8) break;
      quadOut(body, [x0, o - 0.085, topZ(x0) + 0.024], [x0, o + 0.085, topZ(x0) + 0.024], [x1, o + 0.085, topZ(x1) + 0.024], [x1, o - 0.085, topZ(x1) + 0.024], C.stripe, [0, 0, 0]);
    }
    for (let i = 0; i < 10; i++) {
      const x0 = -0.02 - i * 0.15, x1 = x0 - 0.15;
      quadOut(body, [x0, o - 0.085, roofZ(x0) + 0.007], [x0, o + 0.085, roofZ(x0) + 0.007], [x1, o + 0.085, roofZ(x1) + 0.007], [x1, o - 0.085, roofZ(x1) + 0.007], C.stripe, [0, 0, 0]);
    }
  }
  // Along each door: a yellow band; a door line at each end; a handle; the number on a white disc
  for (const side of [-1, 1]) {
    const y = x => side * (halfW(x) + 0.016), ref = [0, 0, 0.62];
    for (let i = 0; i < 8; i++) {
      const x0 = 0.78 - i * 0.2, x1 = x0 - 0.2;
      if (x1 < -0.8) break;
      quadOut(trim, [x0, y(x0), 0.5], [x1, y(x1), 0.5], [x1, y(x1), 0.57], [x0, y(x0), 0.57], C.band, ref);
    }
    for (const xl of [0.8, -0.78]) quadOut(trim, [xl, y(xl), 0.44], [xl - 0.012, y(xl), 0.44], [xl - 0.012, y(xl), 0.96], [xl, y(xl), 0.96], C.plastic, ref);
    trim.box(-0.62, y(-0.62) * 1.01, 0.88, 0.07, 0.01, 0.015, 0, [C.plastic, C.plastic]);
    // The number «17» on a white rounded plate, set out from the flank so it never sinks into the paint
    const nx = 0.0, nz = 0.75, ex = 0.22, ez = 0.15, yy = side * (halfW(nx) + 0.03), n = 24;
    const plate = a => { const c = Math.cos(a), s = Math.sin(a), k = 4;   // a superellipse: a plate with round corners
      return [nx + ex * Math.sign(c) * Math.pow(Math.abs(c), 2 / k), yy, nz + ez * Math.sign(s) * Math.pow(Math.abs(s), 2 / k)]; };
    for (let k = 0; k < n; k++) out(trim, [nx, yy, nz], plate(k / n * Math.PI * 2), plate((k + 1) / n * Math.PI * 2), C.stripe, [nx, 0, nz]);
    // Drawn the right way round from its own side: on the left flank the viewer's right is −x
    const sr = side > 0 ? -1 : 1, y2 = side * (halfW(nx) + 0.036), P = (u, v) => [nx + sr * u, y2, nz + v];
    const digit = (...q) => quadOut(trim, ...q.map(([u, v]) => P(u, v)), C.number, [nx, 0, nz]);
    // «1»: a stem, its flag and its foot
    digit([-0.105, 0.11], [-0.065, 0.11], [-0.065, -0.11], [-0.105, -0.11]);
    digit([-0.105, 0.11], [-0.105, 0.072], [-0.15, 0.05], [-0.15, 0.085]);
    digit([-0.145, -0.11], [-0.025, -0.11], [-0.025, -0.08], [-0.145, -0.08]);
    // «7»: its top bar and its leg
    digit([0.0, 0.11], [0.15, 0.11], [0.15, 0.075], [0.0, 0.075]);
    digit([0.15, 0.11], [0.11, 0.11], [0.03, -0.11], [0.07, -0.11]);
  }

  /* ---- The nose: headlights, grille, intake, skid plate, tow hook, the spotlight pod ---- */
  const nose = (y, z, d = 0.006) => [endX(Math.max(0, Math.abs(y) - 0.015), 1) + 0.012 + d, y, z];   // a hair proud of the skin, which bulges past the plan
  const ref0 = [0, 0, 0.6];
  for (const s of [-1, 1]) {
    // A headlight: a slanted lens with a dark surround, following the nose's curve
    for (let i = 0; i < 4; i++) {
      const y0 = s * (0.42 + i * 0.075), y1 = s * (0.42 + (i + 1) * 0.075);
      quadOut(trim, nose(y0, 0.6, 0.004), nose(y1, 0.6, 0.004), nose(y1, 0.74, 0.004), nose(y0, 0.74, 0.004), C.plastic, ref0);
      quadOut(lights, nose(y0, 0.62), nose(y1, 0.62), nose(y1, 0.72 - i * 0.012), nose(y0, 0.72 - i * 0.012), C.headlight, ref0);
    }
  }
  for (let i = 0; i < 6; i++) {
    const y0 = -0.36 + i * 0.12, y1 = y0 + 0.12;
    quadOut(trim, nose(y0, 0.55), nose(y1, 0.55), nose(y1, 0.7), nose(y0, 0.7), C.plastic, ref0);
    // The grille's slats
    quadOut(trim, nose(y0, 0.6, 0.01), nose(y1, 0.6, 0.01), nose(y1, 0.615, 0.01), nose(y0, 0.615, 0.01), C.grey, ref0);
    quadOut(trim, nose(y0, 0.65, 0.01), nose(y1, 0.65, 0.01), nose(y1, 0.665, 0.01), nose(y0, 0.665, 0.01), C.grey, ref0);
  }
  for (let i = 0; i < 8; i++) {
    const y0 = -0.64 + i * 0.16, y1 = y0 + 0.16;
    quadOut(trim, nose(y0, 0.34), nose(y1, 0.34), nose(y1, 0.46), nose(y0, 0.46), C.liner, ref0);
  }
  trim.box(1.82, 0, 0.27, 0.24, 0.55, 0.02, 0, [C.grey, C.plastic]);
  trim.box(endX(0.45, 1) + 0.03, 0.45, 0.36, 0.04, 0.025, 0.04, 0, [C.hook, C.hook]);
  // The pod: a black bar on two brackets, four lamps in dark cans, their glass lit
  const podX = 1.98, podZ = 0.92;
  trim.box(podX - 0.04, 0, podZ - 0.07, 0.025, 0.6, 0.02, 0, [C.plastic, C.plastic]);
  for (const o of [-0.45, 0.45]) trim.box(podX - 0.08, o, podZ - 0.1, 0.03, 0.02, 0.05, 0, [C.plastic, C.plastic]);
  for (const o of [-0.42, -0.14, 0.14, 0.42]) {
    const n = 12, rc = 0.085, rl = 0.068;
    for (let k = 0; k < n; k++) {
      const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2, Q = (a, r, x) => [x, o + Math.cos(a) * r, podZ + Math.sin(a) * r];
      quadOut(trim, Q(a0, rc, podX - 0.09), Q(a1, rc, podX - 0.09), Q(a1, rc, podX + 0.01), Q(a0, rc, podX + 0.01), C.spotRim, [podX - 0.04, o, podZ]);
      out(trim, [podX - 0.09, o, podZ], Q(a0, rc, podX - 0.09), Q(a1, rc, podX - 0.09), C.spotRim, [podX, o, podZ]);
      out(lights, [podX + 0.012, o, podZ], Q(a0, rl, podX + 0.012), Q(a1, rl, podX + 0.012), C.spot, [podX - 0.1, o, podZ]);
    }
  }

  /* ---- The tail: lights, plate, exhaust, tow hook ---- */
  const tail = (y, z, d = 0.006) => [endX(Math.max(0, Math.abs(y) - 0.015), -1) - 0.012 - d, y, z];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y0 = s * (0.56 + i * 0.09), y1 = s * (0.56 + (i + 1) * 0.09);
      quadOut(trim, tail(y0, 0.74, 0.004), tail(y1, 0.74, 0.004), tail(y1, 0.92, 0.004), tail(y0, 0.92, 0.004), C.plastic, ref0);
      quadOut(brake, tail(y0, 0.76), tail(y1, 0.76), tail(y1, 0.9), tail(y0, 0.9), rgb('#ffffff'), ref0);
    }
  }
  quadOut(trim, tail(-0.26, 0.5), tail(0.26, 0.5), tail(0.26, 0.62), tail(-0.26, 0.62), C.plate, ref0);
  quadOut(trim, tail(-0.22, 0.54, 0.01), tail(0.22, 0.54, 0.01), tail(0.22, 0.58, 0.01), tail(-0.22, 0.58, 0.01), C.number, ref0);
  for (let k = 0; k < 10; k++) {
    const a0 = k / 10 * Math.PI * 2, a1 = (k + 1) / 10 * Math.PI * 2, E = (a, x) => [x, -0.5 + Math.cos(a) * 0.05, 0.3 + Math.sin(a) * 0.05];
    quadOut(trim, E(a0, -2.0), E(a1, -2.0), E(a1, -2.16), E(a0, -2.16), C.chrome, [-2.08, -0.5, 0.3]);
    out(trim, [-2.15, -0.5, 0.3], E(a0, -2.15), E(a1, -2.15), C.liner, [-2.0, -0.5, 0.3]);
  }
  trim.box(endX(0.4, -1) - 0.03, 0.4, 0.36, 0.04, 0.025, 0.04, 0, [C.hook, C.hook]);

  /* ---- The roof spoiler, the mirrors, the aerial, the roof vent, the wipers ---- */
  const wx0 = -1.5, wx1 = -1.92, wz = 1.53;
  for (const [y0, y1] of [[-0.78, 0], [0, 0.78]]) {
    quadOut(body, [wx0, y0, wz], [wx0, y1, wz], [wx1, y1, wz + 0.04], [wx1, y0, wz + 0.04], ROOF, [-1.7, 0, 0]);
    quadOut(body, [wx0, y0, wz - 0.035], [wx0, y1, wz - 0.035], [wx1, y1, wz + 0.005], [wx1, y0, wz + 0.005], mix(ROOF, [0, 0, 0], 0.4), [-1.7, 0, 3]);
    quadOut(body, [wx1, y0, wz + 0.04], [wx1, y1, wz + 0.04], [wx1, y1, wz + 0.005], [wx1, y0, wz + 0.005], C.plastic, [0, 0, 1.5]);
  }
  for (const s of [-1, 1]) {
    // End plates, white, from the roof's corner up past the wing
    for (const yp of [0.785, 0.8]) quadOut(body, [wx0 + 0.05, s * yp, 1.44], [wx1 - 0.03, s * yp, 1.34], [wx1 - 0.03, s * yp, 1.6], [wx0 + 0.02, s * yp, 1.58], C.stripe, [-1.7, 0, 1.5]);
    // A mirror: its stalk, its body-coloured housing, its glass facing back
    trim.box(0.66, s * (halfW(0.66) - 0.02), 1.0, 0.04, 0.05, 0.015, 0, [C.plastic, C.plastic]);
    body.box(0.66, s * (halfW(0.66) + 0.07), 1.03, 0.06, 0.075, 0.055, 0, [B, B]);
    quadOut(glass, [0.596, s * (halfW(0.66) + 0.01), 0.985], [0.596, s * (halfW(0.66) + 0.135), 0.985], [0.596, s * (halfW(0.66) + 0.135), 1.075], [0.596, s * (halfW(0.66) + 0.01), 1.075], C.chrome, [0.7, s * 0.9, 1.03]);
    // A wiper resting at the windscreen's foot
    trim.box(0.72, s * 0.22, 1.01, 0.012, 0.3, 0.006, s * 0.12, [C.plastic, C.plastic]);
  }
  trim.box(-0.35, 0, roofZ(-0.35) + 0.03, 0.17, 0.16, 0.03, 0, [C.plastic, C.grey]);
  trim.box(-1.25, 0.33, roofZ(-1.25) + 0.3, 0.008, 0.008, 0.3, 0, [C.plastic, C.plastic]);

  /* ---- The wheels: rounded tyres, a fine tread, white five-spoke rims, the brake behind ---- */
  const wheel = m => {
    const n = 28;
    // The tyre's cross-section, from one bead round the tread to the other: [radius, y]
    const prof = [[0.25, 0.155], [0.31, 0.172], [0.355, 0.165], [0.372, 0.14], [0.378, 0.08], [0.378, 0], [0.378, -0.08], [0.372, -0.14], [0.355, -0.165], [0.31, -0.172], [0.25, -0.155]];
    const P = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      for (let k = 0; k + 1 < prof.length; k++) {
        const [r0, y0] = prof[k], [r1, y1] = prof[k + 1], tread = k >= 3 && k <= 6;
        // The tread in two shades by block, so its turning shows; the walls plain
        const col = tread ? (i % 2 ? C.tyre : C.tyreWall) : C.tyreWall;
        quadOut(m, P(a0, r0, y0), P(a1, r0, y0), P(a1, r1, y1), P(a0, r1, y1), col, [0, (y0 + y1) / 2 * 0.3, 0]);
      }
      for (const s of [1, -1]) {
        const y = s * 0.15, yd = s * 0.11;
        // The rim's face: five spokes white over a dark gap, the barrel's lip, the hub
        const spoke = Math.floor(i * 10 / n) % 2 === 0;
        out(m, [0, y, 0], P(a0, 0.25, y), P(a1, 0.25, y), spoke ? C.rim : C.rimDark, [0, 0, 0]);
        quadOut(m, P(a0, 0.25, y), P(a1, 0.25, y), P(a1, 0.25, s * 0.1), P(a0, 0.25, s * 0.1), C.rim, [0, s * 0.2, 0]);
        out(m, [0, y * 1.03, 0], P(a0, 0.055, y * 1.03), P(a1, 0.055, y * 1.03), C.grey, [0, 0, 0]);
        // The brake disc behind the spokes
        out(m, [0, yd, 0], P(a0, 0.2, yd), P(a1, 0.2, yd), C.disc, [0, 0, 0]);
      }
    }
    // The caliper over the disc's rear top, both sides
    for (const s of [1, -1]) m.box(-0.14, s * 0.1, 0.12, 0.05, 0.02, 0.07, 0, [C.caliper, C.caliper]);
  };
  wheel(wheelFront); wheel(wheelBack);

  /* ---- Its soft shadow: three dark rounded plates, smaller and darker inward ---- */
  for (const [k, al] of [[1.0, 0.16], [0.85, 0.16], [0.7, 0.18]]) {
    const n = 20;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, ex = L * 1.24 * k, ey = 1.26 * k;
      shadow.tri([0, 0, 0.06], [Math.cos(a0) * ex, Math.sin(a0) * ey, 0.06], [Math.cos(a1) * ex, Math.sin(a1) * ey, 0.06], [0, 0, 0, al]);
    }
  }
  return { body, glass, trim, wheelFront, wheelBack, lights, brake, shadow };
}

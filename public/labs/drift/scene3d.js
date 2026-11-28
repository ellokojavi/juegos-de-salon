/**
 * Drift: the 3D scene, seen from behind the car (docs/rally/path-2-3d.md). The same interface as the
 * top-down scene.js, so the game picks one or the other and nothing else changes:
 *
 *   escena3d(canvas) → { draw(g, alpha, view), resize(), dispose() } | null (no WebGL: use scene.js)
 *
 * It reads the engine's state and never writes it. The world is built once per stage and setting from
 * the same data the top-down scene draws (the road and its forks, scenery.js's props, crowds and
 * grandstands, the ramps and pads), so both views show the same stage: the same tree is where the car
 * hits it. Flat-shaded low poly with no textures (gl3d.js): a colour per face, one sun, fog to the
 * horizon, baked shadows. The ground rises into hills only far from the road, where nothing is solid.
 *
 * The world is cut into square chunks, each one buffer, and only the chunks near the camera are drawn.
 * What moves is drawn every frame: the car (wheels that steer, brake lights, a body that leans and
 * darkens with each crash), the gates (the next one yellow), tyre tracks, dust, sparks and smoke.
 *
 * The camera is calm on purpose (the owner is sensitive to camera movement): behind and above the car,
 * following its direction of travel (not its heading, so a slide shows the car's side), eased over
 * about half a second, never rolling, never shaking, a fixed field of view. With reduced motion it is
 * eased twice as much.
 */
import { SETTINGS, scenery, settingOf, seeded } from './scenery.js';
import { renderer, Mesh, mat4, rgb } from './gl3d.js';
import { carMeshes } from './car3d.js';
import { addProp, addStand } from './props3d.js';

/** Per setting: the sky (top, horizon = fog), the sun's direction (x, y, z, unit-ish), the fog's start and end, m. */
const SKY = {
  meadow: { top: '#4f93dc', low: '#cfe3ef', sun: [0.45, -0.4, 0.8], fog: [90, 320] },
  forest: { top: '#3b2448', low: '#e59a68', sun: [0.85, -0.2, 0.35], fog: [70, 280] },
  plain: { top: '#1f2650', low: '#8d8fb4', sun: [-0.6, -0.4, 0.5], fog: [80, 300] },
};
const WET = { top: '#55606e', low: '#9aa4b0', fog: [50, 220] };
/** The colours that are the same everywhere. */
const COLOURS = {
  asphalt: '#4a4a50', line: '#f2f2ee', centre: '#ffd65a', gate: '#ffffff', gateNext: '#ffd23f', post: '#1b1b22',
  chequerDark: '#15151a', chequerLight: '#f4f4f0',
  car: '#ff2e88', carRoof: '#d81f70', stripe: '#ffffff', glass: '#2e2a40', wheel: '#14141a', rim: '#9a9aa4',
  headlight: '#fff6c8', brakeOn: '#ff3b30', brakeOff: '#5a1020', reverse: '#ffffff',
  ramp: '#8a5a2b', rampEdge: '#c58a4a', pad: '#28e6dc', padArrow: '#fff36b', boost: '#6ee7ff',
  spark: '#ffd23f', mark: '#000000',
};
const CAR_L = 4.2, CAR_W = 1.8;
/** The camera, starting values (path-2-3d.md): metres behind and above the car, and how far ahead it looks. */
const CAM = { back: 8.5, up: 3.8, look: 10, fov: 62 * Math.PI / 180, ease: 0.22 };
/** The world's chunks, m a side, and how far around the camera they are drawn. */
const CHUNK = 120;
const TRACKS = 500, MARK_SLIP = 1.4, DUST = 90, BITS = 48, SMOKE = 40;
const MAX_DPR = 2;
const quiet = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const shade = (col, k) => col.map((v, i) => (i < 3 ? Math.min(1, v * k) : v));

/* ---------------- The world, built once per stage and setting ---------------- */

/** The look of a stretch of road: the setting's own, or the other surface's usual one (as scene.js). */
function roadLook(S, sf) {
  const native = S.lines ? 'asphalt' : 'gravel';
  const L = sf === native ? S : SETTINGS[sf === 'asphalt' ? 'plain' : 'meadow'];
  return { road: L.road, ruts: !!L.ruts, lines: !!L.lines };
}

/** A gentle, seeded ground height far from the road: low hills. */
function hills(seedText) {
  const rnd = seeded(seedText), waves = Array.from({ length: 5 }, () => ({ a: rnd() * Math.PI * 2, k: 0.006 + rnd() * 0.02, p: rnd() * 6, amp: 2 + rnd() * 6 }));
  return (x, y) => waves.reduce((h, w) => h + w.amp * (1 + Math.sin((Math.cos(w.a) * x + Math.sin(w.a) * y) * w.k + w.p)) / 2, 0);
}

function buildWorld(track, settingName, wet) {
  const S = SETTINGS[settingName];
  const sky = SKY[settingName];
  const sunXY = S.sun;   // the top-down shadow's offset: the same direction here
  const chunks = new Map();
  const at = (x, y) => {
    const k = `${Math.floor(x / CHUNK)},${Math.floor(y / CHUNK)}`;
    if (!chunks.has(k)) chunks.set(k, { mesh: new Mesh(), x: (Math.floor(x / CHUNK) + 0.5) * CHUNK, y: (Math.floor(y / CHUNK) + 0.5) * CHUNK });
    return chunks.get(k).mesh;
  };
  const wetK = wet ? 0.72 : 1;
  const roads = [track.pts, ...(track.branches || []).map(b => b.pts)];

  // The ground: a grid of 16 m cells over the stage and well beyond it, each face its own shade
  const all = roads.flat();
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of all) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const M = sky.fog[1] + 60, G = 16;
  x0 = Math.floor((x0 - M) / G) * G; y0 = Math.floor((y0 - M) / G) * G; x1 = Math.ceil((x1 + M) / G) * G; y1 = Math.ceil((y1 + M) / G) * G;
  // Distance to the road, coarse: the centreline every 8 m, in a 40 m grid searched outward
  const coarse = new Map();
  all.forEach((p, i) => { if (i % 4) return; const k = `${Math.floor(p.x / 40)},${Math.floor(p.y / 40)}`; if (!coarse.has(k)) coarse.set(k, []); coarse.get(k).push(p); });
  const dist = (x, y) => {
    const cx = Math.floor(x / 40), cy = Math.floor(y / 40);
    let best = Infinity;
    for (let r = 0; r <= 5; r++) {
      for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
        for (const p of coarse.get(`${cx + i},${cy + j}`) || []) best = Math.min(best, Math.hypot(p.x - x, p.y - y));
      }
      if (best < (r) * 40) break;
    }
    return best;
  };
  const hill = hills(`${track.id}:hills`);
  const rnd = seeded(`${track.id}:${settingName}:ground`);
  const nx = (x1 - x0) / G, ny = (y1 - y0) / G;
  const H = [];
  for (let i = 0; i <= nx; i++) {
    H.push([]);
    for (let j = 0; j <= ny; j++) { const x = x0 + i * G, y = y0 + j * G; H[i].push(hill(x, y) * smooth(70, 190, dist(x, y)) - 0.02); }
  }
  const ground = rgb(S.ground, wetK);
  const patchCols = S.patches.map(p => { const m = p.match(/[\d.]+/g).map(Number); return [m[0] / 255, m[1] / 255, m[2] / 255, m[3]]; });
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x = x0 + i * G, y = y0 + j * G;
    const a = [x, y, H[i][j]], b = [x + G, y, H[i + 1][j]], c = [x + G, y + G, H[i + 1][j + 1]], d = [x, y + G, H[i][j + 1]];
    const mix = (pc, k) => [0, 1, 2].map(n => ground[n] * (1 - pc[3] * k) + pc[n] * pc[3] * k);
    const col1 = mix(patchCols[Math.floor(rnd() * patchCols.length)], 1.4 * rnd()), col2 = mix(patchCols[Math.floor(rnd() * patchCols.length)], 1.4 * rnd());
    const m = at(x + G / 2, y + G / 2);
    m.tri(a, b, c, col1).tri(a, c, d, col2);
  }

  // The roads: a shoulder, then the road over it, then its ruts or its lines; a colour per stretch
  const shoulder = rgb(S.shoulder, wetK);
  for (const P of roads) {
    for (let i = 0; i + 1 < P.length; i++) {
      const p = P[i], q = P[i + 1], m = at(p.x, p.y);
      const edge = (o, z, u) => { const r = u ? q : p; return [r.x - Math.sin(r.h) * o, r.y + Math.cos(r.h) * o, z]; };
      const strip = (o0, o1, z, col) => m.quad(edge(o0, z, 0), edge(o0, z, 1), edge(o1, z, 1), edge(o1, z, 0), col);
      const L = roadLook(S, p.sf);
      strip(-(p.w / 2 + 1.6), p.w / 2 + 1.6, 0.02, shoulder);
      strip(-p.w / 2, p.w / 2, 0.04, rgb(L.road, wetK * (i % 2 ? 1 : 0.985)));
      if (L.ruts) for (const o of [-1.25, 1.25]) strip(o - 0.35, o + 0.35, 0.05, rgb(L.road, wetK * 0.86));
      if (L.lines) {
        for (const o of [-p.w / 2 + 0.45, p.w / 2 - 0.45]) strip(o - 0.09, o + 0.09, 0.05, rgb(COLOURS.line));
        if (Math.floor(p.s / 4) % 2 === 0) strip(-0.1, 0.1, 0.05, rgb(COLOURS.centre));
      }
    }
  }

  // Tufts of grass and pebbles along the roads' edges, where the camera passes close: the detail that
  // gives the ground its scale (the owner, 2026-11-27: «más definición … al entorno»)
  const tuftCols = (S.trees ? [S.trees[0][1], S.trees[1][2], S.bush[1]] : [S.bush[0], S.bush[1], S.rock[0]]).map(c => rgb(c, wetK));
  const pebbleCols = [rgb(S.rock[0], wetK), rgb(S.rock[1], wetK), rgb(S.shoulder, wetK * 0.8)];
  const rt = seeded(`${track.id}:${settingName}:tufts`);
  // How far (x, y) is from the edge of any road, m: none may land on another road where two pass close
  const fine = new Map();
  for (const p of all) { const k = `${Math.floor(p.x / 10)},${Math.floor(p.y / 10)}`; if (!fine.has(k)) fine.set(k, []); fine.get(k).push(p); }
  const offRoad = (x, y) => {
    const cx = Math.floor(x / 10), cy = Math.floor(y / 10);
    let best = Infinity;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const p of fine.get(`${cx + i},${cy + j}`) || []) best = Math.min(best, Math.hypot(p.x - x, p.y - y) - p.w / 2);
    return best;
  };
  for (const P of roads) for (let i = 0; i < P.length; i += 2) {
    const p = P[i], nxp = -Math.sin(p.h), nyp = Math.cos(p.h);
    for (const side of [-1, 1]) {
      // Pebbles on the shoulder
      for (let k = 0; k < 2; k++) {
        const d = p.w / 2 + 0.3 + rt() * 1.4, a = (rt() - 0.5) * 4, r = 0.06 + rt() * 0.12;
        const x = p.x + nxp * side * d + Math.cos(p.h) * a, y = p.y + nyp * side * d + Math.sin(p.h) * a;
        const col = pebbleCols[Math.floor(rt() * 3)], tw = rt() * 6;
        if (offRoad(x, y) > 0.15) at(x, y).blob(x, y, 0.01, r, r * 1.2, 5, col, tw);
      }
      // Tufts in the grass beyond it: three or four blades leaning out
      for (let k = 0; k < 3; k++) {
        const d = p.w / 2 + 1.9 + Math.pow(rt(), 1.5) * 9, a = (rt() - 0.5) * 4, hgt = 0.25 + rt() * 0.35;
        const x = p.x + nxp * side * d + Math.cos(p.h) * a, y = p.y + nyp * side * d + Math.sin(p.h) * a;
        const m = at(x, y), col = tuftCols[Math.floor(rt() * tuftCols.length)], blades = 3 + Math.floor(rt() * 2), turn = rt() * 6;
        const keep = offRoad(x, y) > 1.8;
        for (let b = 0; b < blades; b++) {
          const ang = turn + b * Math.PI * 2 / blades, lean = 0.12 + rt() * 0.12, wb = 0.05;
          const tip = [x + Math.cos(ang) * lean, y + Math.sin(ang) * lean, hgt * (0.7 + rt() * 0.3)];
          if (keep) m.tri([x - Math.sin(ang) * wb, y + Math.cos(ang) * wb, 0.02], [x + Math.sin(ang) * wb, y - Math.cos(ang) * wb, 0.02], tip, col);
        }
      }
    }
  }

  // The ramps (a wedge up to the crest) and the pads (a glowing plate with arrows)
  for (const r of track.ramps || []) {
    const m = at(r.x, r.y), c = Math.cos(r.h), s = Math.sin(r.h);
    const P = (a, o, z) => [r.x + c * a - s * o, r.y + s * a + c * o, z];
    const top = 0.9, col = rgb(COLOURS.ramp), side = rgb(COLOURS.ramp, 0.7);
    m.quad(P(-r.len, -r.half, 0.05), P(0, -r.half, top), P(0, r.half, top), P(-r.len, r.half, 0.05), col);
    m.tri(P(-r.len, -r.half, 0.05), P(0, -r.half, 0.05), P(0, -r.half, top), side);
    m.tri(P(0, r.half, 0.05), P(-r.len, r.half, 0.05), P(0, r.half, top), side);
    m.quad(P(0, -r.half, 0.05), P(0, r.half, 0.05), P(0, r.half, top), P(0, -r.half, top), side);
    for (let a = -r.len + 0.6; a < -0.3; a += 1.1) {
      const z0 = 0.06 + top * (a + r.len) / r.len, z1 = 0.06 + top * (a + 0.35 + r.len) / r.len;
      m.quad(P(a, -r.half, z0), P(a + 0.35, -r.half, z1), P(a + 0.35, r.half, z1), P(a, r.half, z0), rgb(COLOURS.rampEdge));
    }
  }
  for (const p of track.pads || []) {
    const m = at(p.x, p.y), c = Math.cos(p.h), s = Math.sin(p.h);
    const P = (a, o, z = 0.06) => [p.x + c * a - s * o, p.y + s * a + c * o, z];
    m.quad(P(-p.len / 2, -p.half), P(p.len / 2, -p.half), P(p.len / 2, p.half), P(-p.len / 2, p.half), rgb(COLOURS.pad));
    for (let a = -p.len / 2 + 0.5; a < p.len / 2 - 0.9; a += 2) {
      m.tri(P(a, -1.2, 0.07), P(a + 0.9, 0, 0.07), P(a + 0.45, 0, 0.07), rgb(COLOURS.padArrow));
      m.tri(P(a + 0.45, 0, 0.07), P(a + 0.9, 0, 0.07), P(a, 1.2, 0.07), rgb(COLOURS.padArrow));
    }
  }

  // Baked shadows: a dark disc on the ground, pushed away from the sun (the top-down offset, longer)
  const shadowCol = (() => { const m = S.shadow.match(/[\d.]+/g).map(Number); return [m[0] / 255, m[1] / 255, m[2] / 255, Math.min(0.5, m[3])]; })();
  const shadow = (m, x, y, r, len) => {
    const n = 8, cx = x + sunXY[0] * len, cy = y + sunXY[1] * len;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      m.tri([cx, cy, 0.03], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, 0.03], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, 0.03], shadowCol);
    }
  };

  // The props, the crowds and the grandstands
  const { cells, stands } = scenery(track, settingName);
  // Fans face the nearest point of the road (a coarse search: they stand a few metres from it)
  const face = (x, y) => {
    let best = Infinity, p = track.pts[0];
    for (let i = 0; i < track.pts.length; i += 2) { const q = track.pts[i], d = (q.x - x) ** 2 + (q.y - y) ** 2; if (d < best) { best = d; p = q; } }
    return Math.atan2(p.y - y, p.x - x);
  };
  const ctx = { S, wetK, shadow, face, trackId: track.id, z: 0 };
  for (const it of [...cells.values()].flat()) addProp(at(it.x, it.y), it, ctx);
  for (const st of stands) addStand(at(st.x, st.y), st, ctx);

  return { track, setting: settingName, wet, S, sky, chunks: [...chunks.values()], bufs: null };
}

/** One gate: two posts and a banner across the road (the finish's is chequered). */
function gateMesh(gt, finish) {
  const m = new Mesh(), c = Math.cos(gt.h), s = Math.sin(gt.h);
  const P = (a, o, z) => [gt.x + c * a - s * o, gt.y + s * a + c * o, z];
  for (const o of [-gt.half - 0.3, gt.half + 0.3]) m.box(gt.x - s * o, gt.y + c * o, 1.95, 0.14, 0.14, 1.95, gt.h, rgb(COLOURS.post));
  const o0 = -gt.half - 0.3, o1 = gt.half + 0.3, z0 = 3.4, z1 = 3.9;
  if (finish) {
    const n = 14;
    for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) {
      const a0 = o0 + (o1 - o0) * i / n, a1 = o0 + (o1 - o0) * (i + 1) / n, zz0 = z0 + (z1 - z0) * j / 2, zz1 = z0 + (z1 - z0) * (j + 1) / 2;
      const col = rgb((i + j) % 2 ? COLOURS.chequerDark : COLOURS.chequerLight);
      m.quad(P(0, a0, zz0), P(0, a1, zz0), P(0, a1, zz1), P(0, a0, zz1), col);
      m.quad(P(0.02, a1, zz0), P(0.02, a0, zz0), P(0.02, a0, zz1), P(0.02, a1, zz1), col);
    }
  } else {
    const ban = rgb(COLOURS.gate);
    m.quad(P(0, o0, z0), P(0, o1, z0), P(0, o1, z1), P(0, o0, z1), ban);
    m.quad(P(0.02, o1, z0), P(0.02, o0, z0), P(0.02, o0, z1), P(0.02, o1, z1), ban);
  }
  return m;
}

/* ---------------- The scene ---------------- */
export function escena3d(canvas) {
  let world = null, carBufs = null, gateBufs = null, dyn = null;
  const R = renderer(canvas, {
    lost: () => { world = null; carBufs = null; gateBufs = null; dyn = null; },
    restored: () => {},
  });
  if (!R) return null;
  let W = 0, H = 0, dpr = 1, lastNow = 0;
  const cam = { a: Math.PI / 2, ready: false, x: 0, y: 0, z: 0 };
  const pose = { roll: 0, pitch: 0, lastVf: 0, lastVs: 0, spin: 0 };
  const vp = mat4.create(), proj = mat4.create(), view = mat4.create(), M = mat4.create(), MW = mat4.create();
  // Tyre tracks: a ring of segments [x1, y1, x2, y2]; dust, sparks and smoke: fixed pools
  const marks = new Float32Array(TRACKS * 4);
  let head = 0, count = 0, prevRear = null, lastG = null, lastCar = null, seenHits = 0, owed = 0, smokeOwed = 0;
  const puffs = Array.from({ length: DUST }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 1, life: 1, r: 1, col: null }));
  const bits = Array.from({ length: BITS }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 1, life: 1, r: 0.15, col: null }));
  const smoke = Array.from({ length: SMOKE }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 1, life: 1, r: 1, col: null }));
  let nextPuff = 0, nextBit = 0, nextSmoke = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(MAX_DPR, globalThis.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  resize();

  function settle(track, pick) {
    const setting = settingOf(track, pick);
    if (world && world.track === track && world.setting === setting) return world;
    if (world) world.chunks.forEach(c => R.free(c.buf));
    world = buildWorld(track, setting, !!track.wet);
    for (const c of world.chunks) { c.buf = R.buffer(c.mesh); c.mesh = null; }
    gateBufs?.forEach(b => R.free(b));
    gateBufs = track.gates.map((gt, i) => R.buffer(gateMesh(gt, i === track.gates.length - 1)));
    if (!carBufs) carBufs = Object.fromEntries(Object.entries(carMeshes()).map(([k, m]) => [k, R.buffer(m)]));
    if (!dyn) dyn = { marks: R.buffer(null, true), parts: R.buffer(null, true) };
    return world;
  }

  function draw(g, alpha = 0, viewOpts = {}) {
    if (!W || !H || R.lost) return;
    const now = globalThis.performance?.now() ?? 0;
    const dt = Math.min(0.1, lastNow ? (now - lastNow) / 1000 : 0);
    lastNow = now;
    const car = g.car, { S, sky } = settle(g.track, viewOpts.setting);
    if (g !== lastG) {
      lastG = g; head = 0; count = 0; prevRear = null; lastCar = null; cam.ready = false;
      seenHits = car.hits?.length || 0;
      for (const p of [...puffs, ...bits, ...smoke]) p.age = p.life;
    }
    const x = car.px + (car.x - car.px) * alpha, y = car.py + (car.y - car.py) * alpha;
    const h = car.ph + wrap(car.h - car.ph) * alpha;
    const c = Math.cos(h), s = Math.sin(h);
    const z = Math.max(0, car.z || 0);

    // The body leans: it rolls out of a turn and pitches under braking, a few degrees, eased
    const vf = car.vx * c + car.vy * s, vs = -car.vx * s + car.vy * c;
    if (dt > 0) {
      const af = (vf - pose.lastVf) / dt, yawRate = car.speed > 1 ? (vf * (car.steer || 0)) : 0;
      const k = 1 - Math.exp(-dt / 0.18);
      // Turning right (steer +1) the body rolls onto its left side: a negative roll
      pose.roll += (Math.max(-0.07, Math.min(0.07, -yawRate * 0.0018)) - pose.roll) * k;
      pose.pitch += (Math.max(-0.05, Math.min(0.05, -af * 0.004)) - pose.pitch) * k;
    }
    pose.lastVf = vf; pose.lastVs = vs;
    // The wheels turn as the car runs, and spin faster than it moves when it pulls away hard
    if (dt > 0) {
      const pull = (car.throttle || 0) * Math.max(0, 1 - car.speed / 15) * 22;
      pose.spin = (pose.spin + (vf / 0.36 + pull) * dt) % (Math.PI * 2);
    }

    // The camera: the direction of travel, eased; behind and above, looking ahead of the car. In reverse
    // it holds still (the owner, 2026-11-27): it neither swings round to the travel nor turns with the car
    const travel = car.speed > 2 ? Math.atan2(car.vy, car.vx) : h;
    const k = cam.ready ? 1 - Math.exp(-dt / (CAM.ease * (quiet() ? 2 : 1))) : 1;
    const reversing = vf < -0.3;
    if (!cam.ready) cam.a = h;
    else if (!reversing) cam.a = wrap(cam.a + wrap(travel - cam.a) * k);
    const ca = Math.cos(cam.a), sa = Math.sin(cam.a);
    const tz = z * 0.5;
    cam.z = cam.ready ? cam.z + (tz - cam.z) * k : tz;
    cam.ready = true;
    const eye = [x - ca * CAM.back, y - sa * CAM.back, CAM.up + cam.z];
    const target = [x + ca * CAM.look, y + sa * CAM.look, 0.6 + cam.z];
    mat4.perspective(proj, CAM.fov, W / H, 1, sky.fog[1] + 40);
    mat4.lookAt(view, eye, target, [0, 0, 1]);
    mat4.multiply(vp, proj, view);

    // What the car leaves: tyre tracks while it slides or brakes hard, dust from loose ground
    const moved = !lastCar || lastCar.x !== car.x || lastCar.y !== car.y;
    lastCar = { x: car.x, y: car.y };
    const rear = [-1, 1].map(side => [x - c * CAR_L * 0.3 - s * side * CAR_W * 0.42, y - s * CAR_L * 0.3 + c * side * CAR_W * 0.42]);
    if (moved) {
      const marking = (car.slip > MARK_SLIP || (car.brake > 0.6 && car.speed > 4)) && !(z > 0);
      if (marking && prevRear) {
        for (let w = 0; w < 2; w++) {
          const o = head * 4;
          marks[o] = prevRear[w][0]; marks[o + 1] = prevRear[w][1]; marks[o + 2] = rear[w][0]; marks[o + 3] = rear[w][1];
          head = (head + 1) % TRACKS; count = Math.min(TRACKS, count + 1);
        }
      }
      prevRear = marking ? rear : null;
      const w = g.track.pts[g.idx]?.w || 7, wet = g.track.wet;
      const dusty = (wet ? car.speed > 12 : car.surface === 'gravel' || !g.onRoad || Math.abs(g.side) > w / 2 - 1.2) && !(z > 0);
      let rate = dusty ? Math.min(60, car.slip * 9) + (car.speed > 3 ? (wet ? 0.5 : car.throttle || 0) * car.speed * 0.6 : 0) : 0;
      if (quiet()) rate /= 2;
      owed += rate * dt;
      const dustCol = wet ? [0.8, 0.84, 0.9] : S.dust.map(v => v / 255);
      while (owed >= 1) {
        owed -= 1;
        const p = puffs[nextPuff]; nextPuff = (nextPuff + 1) % DUST;
        const [wx, wy] = rear[nextPuff % 2];
        Object.assign(p, { x: wx, y: wy, z: 0.3, vx: car.vx * 0.15 + (Math.random() - 0.5) * 2, vy: car.vy * 0.15 + (Math.random() - 0.5) * 2, vz: 0.6 + Math.random() * 0.8, age: 0, life: 0.8 + Math.random() * 0.8, r: 0.3 + Math.random() * 0.25, col: dustCol, grow: 1.6, alpha: 0.24 });
      }
    }
    // A new crash: sparks and bits where it struck
    const hits = car.hits || [], damage = hits.length;
    while (seenHits < hits.length) {
      const hit = hits[seenHits++];
      const wx = x + c * hit.f - s * hit.l, wy = y + s * hit.f + c * hit.l;
      for (let i = 0; i < 16; i++) {
        const b = bits[nextBit]; nextBit = (nextBit + 1) % BITS;
        const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 8, spark = i % 2 === 0;
        Object.assign(b, { x: wx, y: wy, z: 0.7, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 2 + Math.random() * 4, age: 0, life: 0.35 + Math.random() * 0.5, r: spark ? 0.1 : 0.16, col: spark ? rgb(COLOURS.spark) : rgb(COLOURS.car, 0.8), grow: 0, alpha: 1, fall: true });
      }
    }
    // Smoke from the bonnet from the seventh crash, black near the end
    if (damage >= 7 && dt > 0) {
      smokeOwed += (g.wrecked ? 14 : (damage - 6) * 3) * dt * (quiet() ? 0.5 : 1);
      while (smokeOwed >= 1) {
        smokeOwed -= 1;
        const p = smoke[nextSmoke]; nextSmoke = (nextSmoke + 1) % SMOKE;
        const dark = g.wrecked || damage >= 9;
        Object.assign(p, { x: x + c * CAR_L * 0.35, y: y + s * CAR_L * 0.35, z: z + 1, vx: car.vx * 0.3 + (Math.random() - 0.5) * 0.6, vy: car.vy * 0.3 + (Math.random() - 0.5) * 0.6, vz: 1.2 + Math.random(), age: 0, life: 1 + Math.random(), r: 0.4, col: dark ? [0.14, 0.13, 0.13] : [0.6, 0.6, 0.62], grow: 2.5, alpha: 0.55 });
      }
    }
    for (const p of [...puffs, ...bits, ...smoke]) {
      if (p.age >= p.life) continue;
      p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.vx *= 0.95; p.vy *= 0.95;
      if (p.fall) { p.vz -= 12 * dt; if (p.z < 0.05) { p.z = 0.05; p.vz *= -0.3; } }
    }

    // Drawing
    const wet = g.track.wet;
    const skyTop = rgb(wet ? WET.top : sky.top), low = rgb(wet ? WET.low : sky.low);
    const sunL = Math.hypot(...sky.sun), sun = sky.sun.map(v => v / sunL);
    // The ambient light: the horizon's colour from above, the ground's own from below
    const ambient = [low.map(v => 0.36 + 0.34 * v), rgb(world.S.ground).map(v => 0.3 + 0.3 * v)];
    R.begin({ vp, eye, sun, fog: wet ? WET.fog : sky.fog, fogColour: low, skyTop, horizon: 0.1, ambient });
    // The chunks near the camera and not behind it
    const reach = (wet ? WET.fog : sky.fog)[1] + CHUNK * 0.75;
    for (const ch of world.chunks) {
      const dx = ch.x - eye[0], dy = ch.y - eye[1], d = Math.hypot(dx, dy);
      if (d > reach) continue;
      if (d > CHUNK && (dx * ca + dy * sa) / d < -0.3) continue;
      R.draw(ch.buf, { grain: 1 });
    }
    // The tyre tracks, rebuilt from the ring
    if (count) {
      const m = new Mesh(), col = [0, 0, 0, 0.32];
      for (let i = 0; i < count; i++) {
        const o = ((head - 1 - i + TRACKS) % TRACKS) * 4;
        const ax = marks[o], ay = marks[o + 1], bx = marks[o + 2], by = marks[o + 3];
        const l = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / l * 0.12, ny = (bx - ax) / l * 0.12;
        m.quad([ax - nx, ay - ny, 0.065], [bx - nx, by - ny, 0.065], [bx + nx, by + ny, 0.065], [ax + nx, ay + ny, 0.065], col);
      }
      R.upload(dyn.marks, m);
      R.draw(dyn.marks, { lit: 0, depth: false });
    }
    // The gates ahead: the next one yellow, the later ones white, the finish chequered (a passed one is
    // behind the camera, or just over it: not drawn)
    g.track.gates.forEach((gt, i) => {
      if (i < g.gate) return;
      const finish = i === g.track.gates.length - 1;
      R.draw(gateBufs[i], { tint: finish ? [1, 1, 1, 1] : i === g.gate ? [...rgb(COLOURS.gateNext), 1] : [1, 1, 1, 0.85], lit: 0 });
    });

    // The car: its shadow on the ground (further below while it flies), then its body and parts
    const darken = g.wrecked ? 0.3 : 1 - Math.min(0.45, damage * 0.045);
    mat4.pose(M, x, y, 0, h);
    R.draw(carBufs.shadow, { m: M, lit: 0, tint: [1, 1, 1, Math.max(0.25, 1 - z * 0.25)], depth: false });
    mat4.pose(M, x, y, z, h, pose.pitch + (car.vz ? -car.vz * 0.02 : 0), pose.roll);
    R.draw(carBufs.body, { m: M, tint: [darken, darken, darken, 1], shine: g.wrecked ? 0 : 0.55 * darken });
    R.draw(carBufs.trim, { m: M, tint: [darken, darken, darken, 1], shine: 0.25 });
    R.draw(carBufs.glass, { m: M, tint: damage >= 3 ? [1.6, 1.6, 1.7, 1] : [1, 1, 1, 1], shine: 1 });
    R.draw(carBufs.lights, { m: M, lit: 0, tint: damage >= 5 ? [0.2, 0.2, 0.2, 1] : [1, 1, 1, 1] });
    const braking = car.brake > 0.05 && vf > 0.5;
    R.draw(carBufs.brake, { m: M, lit: 0, tint: [...rgb(reversing ? COLOURS.reverse : braking ? COLOURS.brakeOn : COLOURS.brakeOff), 1] });
    // The wheels: the front ones turn with the steering (steer +1 is right: the heading decreases)
    const steerA = -(car.steer || 0) * 0.5;
    for (const [fx, front] of [[CAR_L * 0.31, true], [-CAR_L * 0.3, false]]) for (const side of [-1, 1]) {
      mat4.pose(MW, fx, side * (CAR_W / 2 - 0.05), 0.36, front ? steerA : 0, pose.spin);
      mat4.multiply(MW, M, MW);
      R.draw(front ? carBufs.wheelFront : carBufs.wheelBack, { m: MW, shine: 0.3 });
    }

    // The particles last: camera-facing squares, with the boost's flame behind the car
    const rx = -sa, ry = ca;                       // the camera's right, flat
    const m = new Mesh();
    // A soft-edged puff: a hexagon facing the camera
    const square = (px, py, pz, r, col) => {
      const P = i => { const a = i / 6 * Math.PI * 2; return [px + rx * Math.cos(a) * r, py + ry * Math.cos(a) * r, pz + Math.sin(a) * r]; };
      for (let i = 0; i < 6; i++) m.tri([px, py, pz], P(i), P(i + 1), col);
    };
    for (const p of [...puffs, ...smoke, ...bits]) {
      if (p.age >= p.life) continue;
      const u = p.age / p.life, r = p.r * (1 + u * (p.grow || 0));
      square(p.x, p.y, p.z, r, [...p.col, (p.alpha ?? 1) * (1 - u)]);
    }
    if (g.boost > 0) {
      const fl = rgb(COLOURS.boost), bx = x - c * (CAR_L / 2 + 0.4), by = y - s * (CAR_L / 2 + 0.4);
      for (let i = 0; i < 4; i++) square(bx - c * i * 0.45, by - s * i * 0.45, z + 0.6, 0.35 - i * 0.06 + Math.random() * 0.08, [...fl, 0.8 - i * 0.18]);
    }
    if (m.count) { R.upload(dyn.parts, m); R.draw(dyn.parts, { lit: 0, depth: false }); }
  }

  function dispose() {
    if (world && !R.lost) world.chunks.forEach(ch => R.free(ch.buf));
    R.dispose();
  }

  return { draw, resize, dispose, kind: '3d', stats: () => ({ chunks: world?.chunks.length || 0 }) };
}

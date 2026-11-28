/**
 * Drift: the top-down scene (docs/rally/path-1-top-down.md). It reads the engine's state and draws it
 * on one 2D canvas; it never writes the state. Path 2's 3D scene implements this same interface:
 *
 *   escena(canvas) → { draw(g, alpha, view), resize(), dispose() }
 *
 * `alpha` is the fraction of a step left in the caller's accumulator (to interpolate the car on fast
 * screens); `view` is { mode: 'follow' | 'fixed', ahead, setting } (metres of road seen ahead of the
 * car; `setting` 'stage' draws the stage's own, a setting's name draws that one: the lab's panel).
 *
 * Phase 1.4 dresses the grey box (scenery.js holds the settings and their props): the ground's patches,
 * the road (ruts on gravel, lines on asphalt), trees and rocks with their shadows, the gates with a
 * chequered finish, the car with its wheels and lights, tyre tracks while it slides and dust behind it.
 * Each prop is a sprite drawn once to an offscreen canvas; the dust is one soft sprite; nothing builds
 * a gradient or a blur per frame.
 *
 * A crash (a new entry in `car.hits`) flashes a ring where the car struck and throws sparks and
 * debris, with no camera shake. The damage then stays on the car and grows with each crash: dents
 * where it struck, a cracked windscreen, a dead headlight, a hanging bumper, smoke from the bonnet,
 * at the last lives a flame, and a scorched shell once wrecked.
 *
 * The camera is calm on purpose (the owner is sensitive to camera movement): it turns toward the
 * car's direction of travel, not its heading, so the twitch of a slide does not swing the world; it
 * arrives over about half a second and never snaps; it does not shake and does not zoom with speed.
 * With reduced motion it is damped twice as much, and there is half the dust.
 */
import { SETTINGS, CROWD, scenery, near, settingOf, seeded } from './scenery.js';
import { cheer } from './cheer.js';
import { tile, pattern } from './textures.js';
import { carSprite, shadowSprite } from './car2d.js';
import { ghostLabel } from './ghost-label.js';

// The colours that are the same in every setting (DESIGN.md §4: what is drawn inside the canvas is the game's)
/** The heading from (x, y) to the nearest point of the road: where a fan looks. */
function faceRoad(track, x, y) {
  let best = Infinity, p = track.pts[0];
  for (let i = 0; i < track.pts.length; i += 2) { const q = track.pts[i], d = (q.x - x) ** 2 + (q.y - y) ** 2; if (d < best) { best = d; p = q; } }
  return Math.atan2(p.y - y, p.x - x);
}
const faces = new WeakMap();

const COLOURS = {
  gateNext: '#ffd23f', gateLater: 'rgba(255, 255, 255, 0.5)', gatePast: 'rgba(255, 255, 255, 0.15)', gatePost: '#1b1b22',
  chequerDark: '#15151a', chequerLight: '#f4f4f0', label: '#ffffff',
  car: '#ff2e88', carRoof: '#d81f70', carStripe: '#ffffff', carGlass: '#2a0a1c', wheel: '#14141a',
  dent: 'rgba(30, 0, 10, 0.7)', scratch: 'rgba(255, 255, 255, 0.55)', crack: 'rgba(255, 255, 255, 0.8)', scorch: 'rgba(20, 10, 10, 0.55)',
  token: '#ffd23f', tokenEdge: '#1b1b22', tokenGlow: 'rgba(255, 210, 63, 0.35)', tokenBack: '#c9952a', tokenShadow: 'rgba(0, 0, 0, 0.25)',
  spark: '#ffd23f', flash: 'rgba(255, 255, 255, 0.85)', flameOuter: '#ff7a1a', flameInner: '#ffe066', bumper: '#b81a5e',
  ramp: '#8a5a2b', rampEdge: '#c58a4a', rampShade: 'rgba(0, 0, 0, 0.35)', pad: 'rgba(40, 230, 220, 0.75)', padArrow: '#fff36b',
  boostFlame: '#6ee7ff', streak: 'rgba(255, 255, 255, 0.35)',
  wetSheen: 'rgba(15, 25, 45, 0.3)', puddle: 'rgba(175, 195, 225, 0.22)', rain: 'rgba(200, 215, 240, 0.35)', wetTint: 'rgba(30, 45, 80, 0.18)',
  verge: 'rgba(20, 15, 5, 0.28)', edge: 'rgba(30, 20, 10, 0.2)', tread: '#2c2c34', rim: '#8c8c96', lens: '#fff8d8', chrome: '#d8d8e0',
  headlight: '#fff6c8', brakeLight: '#ff3b30', reverseLight: '#ffffff', brakeOff: '#5a1020',
};
/** Up to the phone's own density (3 on most): the owner asked for definition (2026-11-27). */
const MAX_DPR = 3;
const CAR_L = 4.2, CAR_W = 1.8;
/** Where the car sits on the stage, from the top (the lower third, so the road ahead shows). */
const CAR_AT = 0.7;
/** The camera's time constant, s: it arrives over about three of these. */
const EASE = 0.16;
/** Tyre tracks: segments kept, and the sideways speed (m/s) that leaves a mark. */
const TRACKS = 600, MARK_SLIP = 1.4;
/** Dust: particles in the pool. */
const DUST = 80;
/** Crash debris and bonnet smoke: particles in each pool. */
const DEBRIS = 48, SMOKE = 40;
/** Rain drops on a wet stage. */
const RAIN = 90;

/** The puddles of a wet stage: on the road, from the stage's own seed (never the engine's). */
function puddlesOf(track) {
  const rnd = seeded(`${track.id}:puddles`), out = [];
  for (let i = 5; i < track.pts.length; i += 6 + Math.floor(rnd() * 10)) {
    const p = track.pts[i], o = (rnd() - 0.5) * (p.w - 2.4);
    out.push({ x: p.x - Math.sin(p.h) * o, y: p.y + Math.cos(p.h) * o, h: p.h + (rnd() - 0.5) * 0.6, a: 0.8 + rnd() * 1.6, b: 0.4 + rnd() * 0.7 });
  }
  return out;
}

/** Where the sun stands, seen from above (north-west, as the props' shadows fall): lights the slopes. */
const SUN = [-0.6, 0.8];

/**
 * Which points of road `r` (0 the main one, 1… its forks) have their line `off` m to the side
 * (from the edge with `edge`) lying on another road's surface, where it must not show: the main
 * road's edge across a fork's mouth, a fork's lines over the main road. Worked out once per track.
 */
const hiddenCache = new WeakMap();
function hidden(track, r, off, edge) {
  let byKey = hiddenCache.get(track);
  if (!byKey) hiddenCache.set(track, byKey = new Map());
  const key = `${r}:${off}:${edge}`;
  if (byKey.has(key)) return byKey.get(key);
  const roads = [track.pts, ...(track.branches || []).map(b => b.pts)];
  const P = roads[r], out = new Uint8Array(P.length);
  // The other roads near this one: a fork against the main road; the main road against its forks
  const others = r ? [{ Q: track.pts, from: track.branches[r - 1].from - 30, to: track.branches[r - 1].to + 30 }]
    : track.branches.map(b => ({ Q: b.pts, from: b.from - 30, to: b.to + 30 }));
  P.forEach((p, i) => {
    const o = edge ? Math.sign(off) * (p.w / 2 - Math.abs(off)) : off;
    const x = p.x - Math.sin(p.h) * o, y = p.y + Math.cos(p.h) * o;
    for (const { Q, from, to } of others) {
      if (p.s < from || p.s > to) continue;
      for (const q of Q) {
        if (q.s < from || q.s > to) continue;
        const dx = x - q.x, dy = y - q.y;
        if (dx * dx + dy * dy > 36) continue;
        const along = dx * Math.cos(q.h) + dy * Math.sin(q.h), side = -dx * Math.sin(q.h) + dy * Math.cos(q.h);
        if (Math.abs(along) <= 1.2 && Math.abs(side) < q.w / 2 - 0.05) { out[i] = 1; break; }
      }
      if (out[i]) break;
    }
  });
  byKey.set(key, out);
  return out;
}

const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const quiet = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** A small canvas to draw a sprite on once. */
function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}

/**
 * One prop's sprite, drawn in metres around its centre for a prop of radius 1 (the scene scales it),
 * shadow included. Returns { img, E }: the sprite covers E × radius around the prop's centre.
 */
function propSprite(kind, v, S, ppm, cheering = false) {
  const sun = S.sun, E = 1 + Math.hypot(sun[0], sun[1]) + 0.1;
  const rRef = { tree: 4.2, dead: 3, bush: 1.8, rock: 1.4, hay: 1.1, stump: 0.8, fan: 0.5, bale: 0.6 }[kind] || 2;
  const px = Math.min(768, Math.max(8, 2 * E * rRef * ppm));
  const c = canvasOf(px, px), x = c.getContext('2d');
  x.translate(px / 2, px / 2); x.scale(px / (2 * E), px / (2 * E));
  const disc = (cx, cy, r, colour) => { x.fillStyle = colour; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
  const rnd = (() => { let a = (v + 1) * 9301 + kind.length * 49297; return () => ((a = (a * 9301 + 49297) % 233280) / 233280); })();
  const blob = (cx, cy, r, colour, wobble = 0.18, n = 9) => {
    x.fillStyle = colour; x.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, rr = r * (1 - wobble / 2 + rnd() * wobble);
      i ? x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    x.closePath(); x.fill();
  };
  const [sx, sy] = sun;
  if (kind === 'tree') {
    const [dark, mid, light] = S.trees[v % S.trees.length];
    disc(sx, sy, 0.95, S.shadow);
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + v; blob(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.5, dark, 0.2, 8); }
    blob(0, 0, 0.75, mid, 0.25, 10);
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + v * 0.7; blob(Math.cos(a) * 0.32 - sx * 0.12, Math.sin(a) * 0.32 - sy * 0.12, 0.34, light, 0.3, 8); }
  } else if (kind === 'dead') {
    const { trunk, branch, ember } = S.dead;
    x.strokeStyle = S.shadow; x.lineCap = 'round';
    const arms = [];
    for (let i = 0; i < 6; i++) arms.push([i * 1.05 + rnd() * 0.5, 0.6 + rnd() * 0.4]);
    for (const [col, ox, oy] of [[S.shadow, sx, sy], [branch, 0, 0]]) {
      x.strokeStyle = col;
      for (const [a, len] of arms) {
        x.lineWidth = 0.13; x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + Math.cos(a) * len, oy + Math.sin(a) * len); x.stroke();
        x.lineWidth = 0.07; x.beginPath(); x.moveTo(ox + Math.cos(a) * len * 0.6, oy + Math.sin(a) * len * 0.6);
        x.lineTo(ox + Math.cos(a + 0.5) * len, oy + Math.sin(a + 0.5) * len); x.stroke();
      }
    }
    disc(0, 0, 0.24, trunk);
    for (let i = 0; i < 3; i++) if (rnd() < 0.5) disc((rnd() - 0.5) * 1.2, (rnd() - 0.5) * 1.2, 0.06, ember);
  } else if (kind === 'stump') {
    disc(sx * 0.5, sy * 0.5, 1, S.shadow);
    disc(0, 0, 1, S.dead.branch); disc(0, 0, 0.7, '#6a5038'); disc(0, 0, 0.35, S.dead.branch);
  } else if (kind === 'bush') {
    blob(sx * 0.5, sy * 0.5, 1, S.shadow);
    for (let i = 0; i < 3; i++) blob(Math.cos(i * 2.1 + v) * 0.35, Math.sin(i * 2.1 + v) * 0.35, 0.68, S.bush[0]);
    blob(-sx * 0.15, -sy * 0.15, 0.4, S.bush[1]);
  } else if (kind === 'rock') {
    blob(sx * 0.35, sy * 0.35, 1, S.shadow, 0.4, 7);
    blob(0, 0, 1, S.rock[0], 0.4, 7);
    blob(-0.2, -0.15, 0.55, S.rock[1], 0.4, 6);
  } else if (kind === 'hay') {
    disc(sx * 0.6, sy * 0.6, 1, S.shadow);
    disc(0, 0, 1, S.hay[0]);
    x.strokeStyle = S.hay[1]; x.lineWidth = 0.09;
    for (const r of [0.7, 0.45, 0.2]) { x.beginPath(); x.arc(0, 0, r, 0.3 * v, 0.3 * v + 5); x.stroke(); }
  } else if (kind === 'bale') {
    // A round straw bale, the same in every setting
    disc(sx * 0.6, sy * 0.6, 1, S.shadow);
    disc(0, 0, 1, CROWD.bale[v % 2]);
    x.strokeStyle = CROWD.bale[(v + 1) % 2]; x.lineWidth = 0.12;
    for (const r of [0.65, 0.35]) { x.beginPath(); x.arc(0, 0, r, 0.5 * v, 0.5 * v + 5); x.stroke(); }
    // The rim's darker edge, and two strands of twine across it
    x.strokeStyle = 'rgba(60, 40, 10, 0.4)'; x.lineWidth = 0.08; x.beginPath(); x.arc(0, 0, 0.96, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = '#c9a248'; x.lineWidth = 0.05;
    for (const o of [-0.4, 0.4]) { const h = Math.sqrt(1 - o * o) * 0.97; x.beginPath(); x.moveTo(o, -h); x.lineTo(o, h); x.stroke(); }
  } else if (kind === 'fan') {
    // A person seen from above: a shadow, the shoulders in a jacket with a collar, the arms in one of
    // the five poses the 3D fans have (down, both up, a flag, a phone, hands on hips), a head with
    // hair or a cap whose peak points up the sprite (−y), the side the scene turns toward the road
    const shirt = CROWD.shirts[v % CROWD.shirts.length], skin = CROWD.skin[(v >> 3) % CROWD.skin.length];
    // Cheering (the car near): whoever had their arms down or on their hips throws them up, as in 3D
    const calm = (v >> 2) % 5, pose = cheering && calm !== 2 && calm !== 3 ? 1 : calm, edge = 'rgba(20, 10, 20, 0.45)';   // its shadow: drawn by the scene, unturned
    const arm = (ax, ay, bx, by) => {
      x.strokeStyle = shirt; x.lineCap = 'round'; x.lineWidth = 0.3;
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
      disc(bx, by, 0.17, skin);
    };
    if (pose === 1 || pose === 2) {
      arm(-0.75, 0.2, -1.0, 0.75);
      if (pose === 1) arm(0.75, 0.2, 1.0, 0.75);
      else { x.fillStyle = CROWD.flags[v % CROWD.flags.length]; x.fillRect(-1.05, 0.75, 0.9, 0.55); x.fillStyle = 'rgba(255, 255, 255, 0.7)'; x.fillRect(-1.05, 0.95, 0.9, 0.12); }
    } else if (pose === 3) {
      arm(-0.7, 0.1, -0.25, -0.75); arm(0.7, 0.1, 0.25, -0.75);
      x.fillStyle = '#15151a'; x.fillRect(-0.2, -0.95, 0.4, 0.22); x.fillStyle = '#bfe8ff'; x.fillRect(-0.15, -0.92, 0.3, 0.14);
    } else if (pose === 4) {
      arm(-0.8, 0.05, -0.95, 0.45); arm(0.8, 0.05, 0.95, 0.45);
    }
    x.fillStyle = shirt; x.beginPath(); x.ellipse(0, 0.1, 0.95, 0.55, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = edge; x.lineWidth = 0.06; x.stroke();
    x.fillStyle = 'rgba(0, 0, 0, 0.22)'; x.beginPath(); x.ellipse(0, 0.08, 0.5, 0.3, 0, 0, Math.PI * 2); x.fill();
    if (pose === 0) { disc(-0.9, 0.15, 0.17, skin); disc(0.9, 0.15, 0.17, skin); }
    disc(0, 0, 0.42, skin);
    if (v % 3 === 0) {
      const cap = CROWD.caps[(v >> 2) % CROWD.caps.length];
      disc(0, 0.04, 0.4, cap);
      x.fillStyle = cap; x.beginPath(); x.ellipse(0, -0.38, 0.3, 0.18, 0, Math.PI, Math.PI * 2); x.fill();
      x.strokeStyle = edge; x.lineWidth = 0.04; x.beginPath(); x.arc(0, 0.04, 0.4, 0, Math.PI * 2); x.stroke();
    } else {
      disc(0, 0.1, 0.36, CROWD.hair[(v >> 1) % CROWD.hair.length]);
    }
  }
  return { img: c, E };
}

/** The dust's soft disc: one radial gradient, drawn once per colour (the smoke uses it too). */
function dustSprite([r, g, b]) {
  const c = canvasOf(64, 64), x = c.getContext('2d');
  const grad = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.55)`);
  grad.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.25)`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  x.fillStyle = grad; x.fillRect(0, 0, 64, 64);
  return c;
}

export function escena(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const label = ghostLabel(canvas);
  const cam = { x: 0, y: 0, a: Math.PI / 2, ox: 0, oy: 0, ready: false };
  let lastNow = 0;
  // What is built once per stage and setting, and once per scale
  let world = null;          // { track, setting, S, patches, cells }
  const crowd = cheer();      // the people's jumps, confetti and streamers (cheer.js)
  let sprites = new Map(), spritePpm = 0, dust = null, spray = null;
  // The car's body and its soft shadow, drawn again only when the scale changes
  let carArt = null;
  // The rain: drops in screen space, falling at a slant
  const drops = Array.from({ length: RAIN }, () => ({ x: Math.random(), y: Math.random(), v: 0.8 + Math.random() * 0.5 }));
  const seen = [];
  // Tyre tracks: a ring of segments [x1, y1, x2, y2], newest at `head`
  const marks = new Float32Array(TRACKS * 4);
  let head = 0, count = 0, lastG = null, prevRear = null;
  // Dust: a fixed pool
  const puffs = Array.from({ length: DUST }, () => ({ x: 0, y: 0, vx: 0, vy: 0, age: 1, life: 1, r: 1 }));
  let nextPuff = 0, owed = 0, lastCar = null;
  // A crash: the ring where it struck, the debris, and the smoke the damage gives off
  const bits = Array.from({ length: DEBRIS }, () => ({ x: 0, y: 0, vx: 0, vy: 0, age: 1, life: 1, spark: false, size: 0.2 }));
  const smoke = Array.from({ length: SMOKE }, () => ({ x: 0, y: 0, vx: 0, vy: 0, age: 1, life: 1, r: 1, dark: false }));
  let nextBit = 0, nextSmoke = 0, smokeOwed = 0, seenHits = 0, seenTaken = 0;
  const booms = [];   // a token caught: a gold ring opening where it was
  const rings = [];   // { x, y, age }
  const greySmoke = dustSprite([150, 150, 155]), blackSmoke = dustSprite([35, 32, 32]);

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(MAX_DPR, globalThis.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  resize();

  function settle(track, name) {
    const setting = settingOf(track, name);
    if (world && world.track === track && world.setting === setting) return world;
    const S = SETTINGS[setting];
    world = { track, setting, S, ...scenery(track, setting), puddles: track.wet ? puddlesOf(track) : [] };
    // The grain of the ground, the shoulder and each road surface: tiles drawn once, repeated in metres
    world.grain = { ground: pattern(ctx, tile('ground', S, setting)), gravel: pattern(ctx, tile('gravel', S, setting)), asphalt: pattern(ctx, tile('asphalt', S, setting)) };
    carArt = null;
    sprites = new Map(); spritePpm = 0; dust = dustSprite(S.dust); spray = dustSprite([205, 215, 230]);
    crowd.setup([...world.cells.values()].flat().filter(it => it.kind === 'fan'), world.stands);
    return world;
  }
  function sprite(kind, v, ppm, cheering = false) {
    // Drawn again only when the scale changes by more than a tenth (the panel's zoom, a rotated phone)
    if (Math.abs(ppm - spritePpm) > spritePpm * 0.1) { sprites = new Map(); spritePpm = ppm; }
    const k = kind + v + (cheering ? '!' : '');
    if (!sprites.has(k)) sprites.set(k, propSprite(kind, v, world.S, spritePpm, cheering));
    return sprites.get(k);
  }

  function draw(g, alpha = 0, view = {}, ghost = null) {
    if (!W || !H) return;
    const mode = view.mode === 'fixed' ? 'fixed' : 'follow';
    const ahead = view.ahead || 40;
    const now = globalThis.performance?.now() ?? 0;
    const dt = Math.min(0.1, lastNow ? (now - lastNow) / 1000 : 0);
    lastNow = now;
    const car = g.car;
    const { S } = settle(g.track, view.setting);
    if (g !== lastG) {
      lastG = g; head = 0; count = 0; prevRear = null; lastCar = null; rings.length = 0;
      seenHits = car.hits?.length || 0; seenTaken = g.taken?.length || 0; booms.length = 0;
      for (const p of [...puffs, ...bits, ...smoke]) p.age = p.life;
      crowd.reset();
    }
    // The car between the last two steps
    const x = car.px + (car.x - car.px) * alpha, y = car.py + (car.y - car.py) * alpha;
    crowd.update({ x, y, vx: car.vx, vy: car.vy }, dt, quiet());
    const h = car.ph + wrap(car.h - car.ph) * alpha;

    // The camera: the direction of travel, eased
    const travel = car.speed > 2 ? Math.atan2(car.vy, car.vx) : car.h;
    const zoom = (H * CAR_AT) / ahead;
    const k = cam.ready ? 1 - Math.exp(-dt / (EASE * (quiet() ? 2 : 1))) : 1;
    const targetA = mode === 'fixed' ? Math.PI / 2 : travel;
    cam.a = wrap(cam.a + wrap(targetA - cam.a) * k);
    // Fixed view: the camera looks a little ahead of where the car is going, eased the same way
    const lead = mode === 'fixed' ? (H * (CAR_AT - 0.5)) / zoom : 0;
    cam.ox += (Math.cos(travel) * lead - cam.ox) * k;
    cam.oy += (Math.sin(travel) * lead - cam.oy) * k;
    cam.ready = true;
    cam.x = x + cam.ox; cam.y = y + cam.oy;
    const anchorY = mode === 'fixed' ? H * 0.5 : H * CAR_AT;

    // What the car leaves behind: tyre tracks and dust, only when it moved (not while paused)
    const moved = !lastCar || lastCar.x !== car.x || lastCar.y !== car.y;
    lastCar = { x: car.x, y: car.y };
    const c = Math.cos(h), s = Math.sin(h);
    const rear = [-1, 1].map(side => [x - c * CAR_L * 0.3 - s * side * CAR_W * 0.42, y - s * CAR_L * 0.3 + c * side * CAR_W * 0.42]);
    if (moved) {
      const marking = car.slip > MARK_SLIP || (car.brake > 0.6 && car.speed > 4);
      if (marking && prevRear) {
        for (let w = 0; w < 2; w++) {
          const o = head * 4;
          marks[o] = prevRear[w][0]; marks[o + 1] = prevRear[w][1]; marks[o + 2] = rear[w][0]; marks[o + 3] = rear[w][1];
          head = (head + 1) % TRACKS; count = Math.min(TRACKS, count + 1);
        }
      }
      prevRear = marking ? rear : null;
      // Dust from the slide, and from the throttle on loose ground
      // Dust from loose ground: a gravel road, the road's edge, off the road; never from asphalt itself
      // (the owner, 2026-11-27), and never in the air
      const w = g.track.pts[g.idx]?.w || 7;
      // On a wet stage the wheels throw spray instead, from any road at speed
      const wet = g.track.wet;
      const dusty = (wet ? car.speed > 12 : car.surface === 'gravel' || !g.onRoad || Math.abs(g.side) > w / 2 - 1.2) && !(car.z > 0);
      let rate = dusty ? Math.min(60, car.slip * 9) + (car.speed > 3 ? (wet ? 0.5 : car.throttle || 0) * car.speed * 0.6 : 0) : 0;
      if (quiet()) rate /= 2;
      owed += rate * dt;
      while (owed >= 1) {
        owed -= 1;
        const p = puffs[nextPuff]; nextPuff = (nextPuff + 1) % DUST;
        const [wx, wy] = rear[nextPuff % 2];
        p.x = wx; p.y = wy;
        p.vx = car.vx * 0.15 + (Math.random() - 0.5) * 2; p.vy = car.vy * 0.15 + (Math.random() - 0.5) * 2;
        p.age = 0; p.life = 0.8 + Math.random() * 0.8; p.r = 0.6 + Math.random() * 0.5;
      }
    }
    for (const p of puffs) if (p.age < p.life) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; }
    // A new crash: the ring where the car struck, sparks and bits of the car and of what it hit
    const hits = car.hits || [];
    while (seenHits < hits.length) {
      const hit = hits[seenHits++];
      const wx = x + c * hit.f - s * hit.l, wy = y + s * hit.f + c * hit.l;
      rings.push({ x: wx, y: wy, age: 0 });
      for (let i = 0; i < 14; i++) {
        const b = bits[nextBit]; nextBit = (nextBit + 1) % DEBRIS;
        const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 9;
        b.x = wx; b.y = wy; b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v;
        b.age = 0; b.life = 0.35 + Math.random() * 0.5; b.spark = i % 2 === 0; b.gold = false; b.size = b.spark ? 0.12 : 0.18 + Math.random() * 0.2;
      }
    }
    // A token caught: it bursts into gold shards and a ring (the owner, 2026-11-27: «que al capturarla explote»)
    const taken = g.taken || [];
    while (seenTaken < taken.length) {
      const k = g.track.tokens[taken[seenTaken++]];
      booms.push({ x: k.x, y: k.y, age: 0 });
      for (let i = 0; i < (quiet() ? 10 : 28); i++) {
        const b = bits[nextBit]; nextBit = (nextBit + 1) % DEBRIS;
        const a = Math.random() * Math.PI * 2, v = 6 + Math.random() * 14;
        b.x = k.x; b.y = k.y; b.vx = Math.cos(a) * v + car.vx * 0.6; b.vy = Math.sin(a) * v + car.vy * 0.6;
        b.age = 0; b.life = 0.5 + Math.random() * 0.6; b.spark = true; b.gold = true; b.size = 0.3 + Math.random() * 0.35;
      }
    }
    for (const r of booms) r.age += dt;
    while (booms.length && booms[0].age > 0.6) booms.shift();
    for (const r of rings) r.age += dt;
    while (rings.length && rings[0].age > 0.4) rings.shift();
    for (const b of bits) if (b.age < b.life) { b.age += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 0.9; b.vy *= 0.9; }
    // Smoke from the bonnet from the seventh crash, thicker and black near the end and once wrecked
    const damage = hits.length;
    if (damage >= 7 && dt > 0) {
      smokeOwed += (g.wrecked ? 14 : (damage - 6) * 3) * dt * (quiet() ? 0.5 : 1);
      while (smokeOwed >= 1) {
        smokeOwed -= 1;
        const p = smoke[nextSmoke]; nextSmoke = (nextSmoke + 1) % SMOKE;
        p.x = x + c * CAR_L * 0.35 + (Math.random() - 0.5) * 0.6; p.y = y + s * CAR_L * 0.35 + (Math.random() - 0.5) * 0.6;
        p.vx = car.vx * 0.3 + (Math.random() - 0.5) * 0.8 + 0.6; p.vy = car.vy * 0.3 + (Math.random() - 0.5) * 0.8 + 0.4;
        p.age = 0; p.life = 1 + Math.random(); p.r = 0.5 + Math.random() * 0.4; p.dark = g.wrecked || damage >= 9;
      }
    }
    for (const p of smoke) if (p.age < p.life) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = S.ground;
    ctx.fillRect(0, 0, W, H);

    // World transform: y up, the camera's direction pointing up the screen
    ctx.save();
    ctx.translate(W / 2, anchorY);
    ctx.scale(zoom, -zoom);
    ctx.rotate(Math.PI / 2 - cam.a);
    ctx.translate(-cam.x, -cam.y);
    const reach = Math.hypot(W, H) / zoom + 20;

    if (world.grain.ground) { ctx.fillStyle = world.grain.ground; ctx.fillRect(cam.x - reach, cam.y - reach, 2 * reach, 2 * reach); }
    for (const p of near(world.patches, cam.x, cam.y, reach, seen)) {
      ctx.fillStyle = S.patches[p.v % S.patches.length];
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    road(g.track, S, cam.x, cam.y, reach);
    if (g.track.wet) puddles(world.puddles, cam.x, cam.y, reach);
    features(g.track, now);
    tyreMarks(S, zoom);
    gates(g, zoom);
    tokens(g, zoom, now);
    // The props, then the car over them (a crown must never hide it), then its dust
    const ppm = zoom * dpr;
    const still = quiet();
    for (const it of near(world.cells, cam.x, cam.y, reach, seen)) {
      const fan = it.kind === 'fan', up = fan && !still && crowd.excite(it.x, it.y) > 0.25;
      const { img, E } = sprite(it.kind, it.v, ppm, up);
      let e = E * it.r;
      // The people jump as the car goes by, their arms up (never with reduced motion): seen from above, a jump grows them
      if (fan) e *= 1 + 0.4 * crowd.lift(it, now);
      if (it.kind === 'fan') {
        // Each fan turned toward the road, as in 3D (its heading found once, then kept)
        let h = faces.get(it);
        if (h === undefined) faces.set(it, (h = faceRoad(g.track, it.x, it.y)));
        // Its shadow first, unturned, so every shadow still falls away from the sun
        ctx.fillStyle = S.shadow; ctx.beginPath(); ctx.arc(it.x + S.sun[0] * 0.7 * it.r, it.y + S.sun[1] * 0.7 * it.r, 0.95 * it.r, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(h + Math.PI / 2);
        ctx.drawImage(img, -e, -e, 2 * e, 2 * e);
        ctx.restore();
      } else ctx.drawImage(img, it.x - e, it.y - e, 2 * e, 2 * e);
    }
    for (const st of world.stands) if (Math.hypot(st.x - cam.x, st.y - cam.y) < reach + st.len) stand(st, S, x, y, now, still);
    // The ghost (ghost.js) under the real car: the record's body, see-through, where it was at this time
    // and over it the driver's name when it is a real player's run (ghost-label.js), on the screen above it
    let named = false;
    if (ghost && carArt) {
      ctx.save(); ctx.globalAlpha = 0.42; ctx.translate(ghost.x, ghost.y); ctx.rotate(ghost.h);
      ctx.drawImage(carArt.body.img, -carArt.body.hx, -carArt.body.hy, 2 * carArt.body.hx, 2 * carArt.body.hy);
      ctx.restore();
      if (ghost.name && Math.hypot(ghost.x - x, ghost.y - y) > 0.5) {
        const p = ctx.getTransform().transformPoint({ x: ghost.x, y: ghost.y });
        label.show(ghost.name, p.x / dpr, p.y / dpr - CAR_L * 0.6 * zoom, 1); named = true;
      }
    }
    if (!named) label.hide();
    drawCar(car, S, x, y, h, g.wrecked, now, g.boost > 0, ppm);
    confetti();
    for (const p of puffs) {
      if (p.age >= p.life) continue;
      const f = p.age / p.life, r = p.r * (1 + f * 2.5);
      ctx.globalAlpha = 1 - f;
      ctx.drawImage(g.track.wet ? spray : dust, p.x - r, p.y - r, 2 * r, 2 * r);
    }
    for (const p of smoke) {
      if (p.age >= p.life) continue;
      const f = p.age / p.life, r = p.r * (1 + f * 3);
      ctx.globalAlpha = (1 - f) * 0.8;
      ctx.drawImage(p.dark ? blackSmoke : greySmoke, p.x - r, p.y - r, 2 * r, 2 * r);
    }
    for (const b of bits) {
      if (b.age >= b.life) continue;
      ctx.globalAlpha = 1 - b.age / b.life;
      ctx.fillStyle = b.gold ? COLOURS.token : b.spark ? COLOURS.spark : b.size > 0.28 ? S.shoulder : COLOURS.car;
      ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
    }
    for (const r of booms) {
      const f = r.age / 0.6;
      ctx.globalAlpha = 1 - f;
      ctx.strokeStyle = COLOURS.token; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(r.x, r.y, 1 + f * 9, 0, Math.PI * 2); ctx.stroke();
    }
    for (const r of rings) {
      const f = r.age / 0.4;
      ctx.globalAlpha = 1 - f;
      ctx.strokeStyle = COLOURS.flash; ctx.lineWidth = 0.35;
      ctx.beginPath(); ctx.arc(r.x, r.y, 0.6 + f * 3.2, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // The light of the hour: warm at sunset, blue at dusk
    if (S.tint) { ctx.fillStyle = S.tint; ctx.fillRect(0, 0, W, H); }
    if (g.track.wet) rain(dt);
    streaks(car, g.boost > 0);

    // The gate numbers, upright on the screen
    labels(g, { zoom, anchorY });
  }

  /**
   * The road as ribbons: each road near the camera (the main one and its forks) a filled strip
   * between its two edges, worked out point by point, so it widens into a hairpin smoothly, a fork
   * leaves and joins it with no seam, and a change of surface meets edge to edge (the owner,
   * 2026-11-27: «que la pista tenga un trazado continuo»). A closed circuit wraps past its start.
   * Then its slopes in light and shade, then its lines, each hidden where it crosses another road.
   */
  function road(track, S, cx, cy, reach) {
    const r2 = reach * reach;
    const roads = [track.pts, ...(track.branches || []).map(b => b.pts)];
    const runs = [];
    roads.forEach((P, r) => {
      let run = null;
      const mine = [];
      for (let i = 0; i < P.length; i++) {
        const p = P[i], dx = p.x - cx, dy = p.y - cy;
        if (dx * dx + dy * dy <= r2) { if (!run) mine.push(run = { r, pts: [], at: [] }); run.pts.push(p); run.at.push(i); } else run = null;
      }
      // A circuit's road runs on through the start line (its last point is its first): one stretch, no ends at the seam
      if (r === 0 && track.loop && mine.length > 1 && mine[0].at[0] === 0 && run && run.at[run.at.length - 1] === P.length - 1) {
        const first = mine.shift();
        run.pts.push(...first.pts.slice(1)); run.at.push(...first.at.slice(1));
      }
      runs.push(...mine);
    });
    // The two edges of a stretch, `extra` m wider than the road each side: one closed path
    const ribbon = (pts, from, to, extra) => {
      ctx.moveTo(pts[from].x - Math.sin(pts[from].h) * (pts[from].w / 2 + extra), pts[from].y + Math.cos(pts[from].h) * (pts[from].w / 2 + extra));
      for (let i = from + 1; i <= to; i++) { const p = pts[i], o = p.w / 2 + extra; ctx.lineTo(p.x - Math.sin(p.h) * o, p.y + Math.cos(p.h) * o); }
      for (let i = to; i >= from; i--) { const p = pts[i], o = p.w / 2 + extra; ctx.lineTo(p.x + Math.sin(p.h) * o, p.y - Math.cos(p.h) * o); }
      ctx.closePath();
    };
    const fill = (style, extra, pick = () => true) => {
      ctx.fillStyle = style;
      ctx.beginPath();
      for (const rn of runs) {
        const P = rn.pts;
        // Each stretch the pick keeps, reaching one point into the next so two surfaces meet edge to edge
        for (let i = 0; i < P.length; i++) {
          if (!pick(P[i])) continue;
          let j = i; while (j + 1 < P.length && pick(P[j + 1])) j++;
          const a = i, b = Math.min(P.length - 1, j + 1);
          if (b > a) ribbon(P, a, b, extra);
          i = j;
        }
      }
      ctx.fill();
    };
    // Each stretch in the look of its surface: the setting's own road for the surface it was made for,
    // the other surface's usual look where the stage changes (a gravel meadow that turns to asphalt)
    const native = S.lines ? 'asphalt' : 'gravel';
    const lookOf = sf => (sf === native ? S : SETTINGS[sf === 'asphalt' ? 'plain' : 'meadow']);
    const surfaces = [...new Set(runs.flatMap(rn => rn.pts.map(p => p.sf)))];
    // A dark rim where the shoulder meets the grass, the shoulder with its grit
    fill(COLOURS.verge, 1.6);
    fill(S.shoulder, 1.2);
    if (world.grain.gravel) fill(world.grain.gravel, 1.2);
    // The road: first all of it in its first surface's look, then each other surface over its stretches
    const first = surfaces[0];
    for (const sf of surfaces) {
      const pick = sf === first ? () => true : p => p.sf === sf;
      fill(lookOf(sf).road, 0, pick);
      const grain = world.grain[sf === 'asphalt' ? 'asphalt' : 'gravel'];
      if (grain) fill(grain, 0, pick);
    }
    // The rain darkens the road
    if (track.wet) fill(COLOURS.wetSheen, 0);
    slopes(runs);
    // A line along the road, `off` metres to its left (a negative one, to its right), on one surface;
    // broken where it would run over another road (a fork's mouth)
    const along = (off, edge, sf) => {
      ctx.beginPath();
      for (const rn of runs) {
        const hide = hidden(track, rn.r, off, edge);
        let open = false;
        rn.pts.forEach((p, k) => {
          if (p.sf !== sf || hide[rn.at[k]]) { open = false; return; }
          const o = edge ? Math.sign(off) * (p.w / 2 - Math.abs(off)) : off;
          const px = p.x - Math.sin(p.h) * o, py = p.y + Math.cos(p.h) * o;
          if (open) ctx.lineTo(px, py); else { ctx.moveTo(px, py); open = true; }
        });
      }
      ctx.stroke();
    };
    ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    // The road's edges a shade darker, where it wears into the shoulder
    for (const sf of surfaces) { ctx.strokeStyle = COLOURS.edge; ctx.lineWidth = 0.45; along(0.22, true, sf); along(-0.22, true, sf); }
    // Gravel: the two ruts the cars before you dug; asphalt: the edge lines and the centre dashes
    for (const sf of surfaces) {
      const L = lookOf(sf);
      if (L.ruts) { ctx.strokeStyle = L.ruts; ctx.lineWidth = 0.7; along(1.25, false, sf); along(-1.25, false, sf); }
      if (L.lines) { ctx.strokeStyle = L.lines; ctx.lineWidth = 0.18; along(0.45, true, sf); along(-0.45, true, sf); }
      if (L.centre) { ctx.strokeStyle = L.centre; ctx.lineWidth = 0.2; ctx.setLineDash([3, 5]); along(0, false, sf); ctx.setLineDash([]); }
    }
    ctx.lineCap = 'round';
  }

  /**
   * The relief seen from above: each stretch of road lit or shaded by how its slope faces the sun
   * (from the north-west, as the props' shadows), lighter climbing toward it, darker away; a crest's
   * far side shows as a dark band, a dip as a dark then a light one.
   */
  function slopes(runs) {
    const LEVELS = 5, buckets = [[], []];
    for (const rn of runs) {
      const P = rn.pts;
      for (let i = 0; i + 1 < P.length; i++) {
        const p = P[i], q = P[i + 1], gr = ((p.g || 0) + (q.g || 0)) / 2;
        if (Math.abs(gr) < 0.004) continue;
        // The surface's tilt toward the sun: the grade along the road's heading against the sun's direction
        const lit = -gr * (Math.cos(p.h) * SUN[0] + Math.sin(p.h) * SUN[1]);
        const level = Math.min(LEVELS, Math.round(Math.abs(lit) * 70));
        if (!level) continue;
        (buckets[lit > 0 ? 0 : 1][level] ||= []).push(p, q);
      }
    }
    buckets.forEach((byLevel, dark) => byLevel.forEach((list, level) => {
      if (!list?.length) return;
      ctx.fillStyle = dark ? `rgba(20, 10, 0, ${level * 0.045})` : `rgba(255, 250, 225, ${level * 0.04})`;
      ctx.beginPath();
      for (let k = 0; k < list.length; k += 2) {
        const p = list[k], q = list[k + 1], a = p.w / 2 + 1.2, b = q.w / 2 + 1.2;
        ctx.moveTo(p.x - Math.sin(p.h) * a, p.y + Math.cos(p.h) * a);
        ctx.lineTo(q.x - Math.sin(q.h) * b, q.y + Math.cos(q.h) * b);
        ctx.lineTo(q.x + Math.sin(q.h) * b, q.y - Math.cos(q.h) * b);
        ctx.lineTo(p.x + Math.sin(p.h) * a, p.y - Math.cos(p.h) * a);
        ctx.closePath();
      }
      ctx.fill();
    }));
  }

  /** The puddles of a wet stage: pale ellipses on the road that catch the sky. */
  function puddles(list, cx, cy, reach) {
    ctx.fillStyle = COLOURS.puddle;
    ctx.beginPath();
    for (const p of list) {
      if (Math.abs(p.x - cx) > reach || Math.abs(p.y - cy) > reach) continue;
      ctx.moveTo(p.x + Math.cos(p.h) * p.a, p.y + Math.sin(p.h) * p.a);
      ctx.ellipse(p.x, p.y, p.a, p.b, p.h, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  /**
   * A grandstand beside the road: a stepped stand along it, full of people facing the road, with a
   * roof over the back rows and a rail at the front. The front rows stand up as the car goes by.
   */
  /**
   * The crowd's confetti and streamers from above: little rectangles turning (a higher one is drawn a
   * little bigger), and ribbons along the streamers' tails.
   */
  function confetti() {
    for (const p of crowd.parts) {
      ctx.globalAlpha = Math.min(1, (p.life - p.age) / (p.life * 0.25));
      const k = 1 + p.z * 0.06;
      if (p.kind === 'confetti') {
        const w = p.w * 1.4 * k, cs = Math.cos(p.spin), sn = Math.sin(p.spin), t = Math.abs(Math.cos(p.spin * 1.3)) * 0.6 + 0.15;
        ctx.fillStyle = p.col; ctx.beginPath();
        ctx.moveTo(p.x + cs * w - sn * w * t, p.y + sn * w + cs * w * t); ctx.lineTo(p.x - cs * w - sn * w * t, p.y - sn * w + cs * w * t);
        ctx.lineTo(p.x - cs * w + sn * w * t, p.y - sn * w - cs * w * t); ctx.lineTo(p.x + cs * w + sn * w * t, p.y + sn * w - cs * w * t);
        ctx.closePath(); ctx.fill();
      } else if (p.tail.length > 1) {
        ctx.strokeStyle = p.col; ctx.lineWidth = p.w * 1.6 * k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        for (const [tx, ty] of p.tail) ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function stand(st, S, carX, carY, now, still) {
    ctx.save();
    // In the stand's own frame: x along the road, y away from it (its front rows and rail toward the road)
    ctx.translate(st.x, st.y); ctx.rotate(st.h); ctx.scale(1, st.side);
    const L = st.len / 2, D = st.dep / 2;
    ctx.fillStyle = S.shadow; ctx.fillRect(-L + 1, -D + 1, st.len, st.dep);
    ctx.fillStyle = CROWD.stand; ctx.fillRect(-L, -D, st.len, st.dep);
    ctx.fillStyle = CROWD.step;
    const rows = 4, rowD = (st.dep * 0.7) / rows;
    for (let r = 0; r < rows; r++) ctx.fillRect(-L + 0.3, -D + 0.4 + r * rowD, st.len - 0.6, rowD * 0.45);
    // The people on the rows, from the stand's own seed
    const rnd = seeded(`stand:${st.v}`), near = Math.hypot(carX - st.x, carY - st.y) < 45 && !still;
    for (let r = 0; r < rows; r++) for (let a = -L + 0.8; a < L - 0.6; a += 0.9 + rnd() * 0.5) {
      if (rnd() < 0.15) continue;
      const v = Math.floor(rnd() * 32), py = -D + 0.6 + r * rowD, jump = near && r < 2 ? 0.08 * Math.abs(Math.sin(now / 150 + a)) : 0;
      const sz = 0.34 + jump;
      ctx.fillStyle = CROWD.shirts[v % CROWD.shirts.length];
      ctx.beginPath(); ctx.ellipse(a, py, sz, sz * 0.62, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(20, 10, 20, 0.4)'; ctx.lineWidth = 0.05; ctx.stroke();
      // Some cheer with both arms up, toward the road
      if (v % 4 === 0) {
        ctx.fillStyle = CROWD.skin[(v >> 3) % CROWD.skin.length];
        for (const o of [-1, 1]) { ctx.beginPath(); ctx.arc(a + o * sz * 0.9, py - sz * 0.6, sz * 0.2, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.fillStyle = CROWD.skin[(v >> 3) % CROWD.skin.length];
      ctx.beginPath(); ctx.arc(a, py, sz * 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = v % 3 === 0 ? CROWD.caps[v % CROWD.caps.length] : CROWD.hair[v % CROWD.hair.length];
      ctx.beginPath(); ctx.arc(a, py + sz * 0.08, sz * 0.36, 0, Math.PI * 2); ctx.fill();
    }
    // The roof over the back, and the rail at the front
    ctx.fillStyle = CROWD.roof; ctx.fillRect(-L - 0.3, D - st.dep * 0.28, st.len + 0.6, st.dep * 0.28 + 0.3);
    ctx.strokeStyle = CROWD.rail; ctx.lineWidth = 0.15;
    ctx.beginPath(); ctx.moveTo(-L, -D); ctx.lineTo(L, -D); ctx.stroke();
    ctx.restore();
  }

  /** The rain: short slanted strokes across the screen, and a grey-blue cast (still drops with reduced motion). */
  function rain(dt) {
    ctx.fillStyle = COLOURS.wetTint; ctx.fillRect(0, 0, W, H);
    const fall = quiet() ? 0 : dt * 1.6;
    ctx.strokeStyle = COLOURS.rain; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of drops) {
      d.y += fall * d.v; d.x -= fall * d.v * 0.25;
      if (d.y > 1) { d.y -= 1; d.x = Math.random(); }
      if (d.x < 0) d.x += 1;
      const px = d.x * W, py = d.y * H;
      ctx.moveTo(px, py); ctx.lineTo(px - 4, py + 14);
    }
    ctx.stroke();
  }

  /**
   * The ramps (a wooden wedge, rising toward its crest, with its shadow beyond) and the boost pads
   * (arrows running forward over a cyan carpet).
   */
  function features(track, now) {
    const quad = (p, a0, a1, half) => {
      const c = Math.cos(p.h), s = Math.sin(p.h), lx = -s * half, ly = c * half;
      ctx.beginPath();
      ctx.moveTo(p.x + c * a0 - lx, p.y + s * a0 - ly); ctx.lineTo(p.x + c * a1 - lx, p.y + s * a1 - ly);
      ctx.lineTo(p.x + c * a1 + lx, p.y + s * a1 + ly); ctx.lineTo(p.x + c * a0 + lx, p.y + s * a0 + ly);
      ctx.fill();
    };
    for (const r of track.ramps || []) {
      ctx.fillStyle = COLOURS.rampShade; quad(r, 0, 1.6, r.half);
      ctx.fillStyle = COLOURS.ramp; quad(r, -r.len, 0, r.half);
      ctx.fillStyle = COLOURS.rampEdge;
      for (let a = -r.len + 0.6; a < 0; a += 1.1) quad(r, a, a + 0.35, r.half);
      quad(r, -0.35, 0, r.half);
    }
    const run = (now / 1000 * 4) % 2;
    for (const p of track.pads || []) {
      ctx.fillStyle = COLOURS.pad; quad(p, -p.len / 2, p.len / 2, p.half);
      ctx.fillStyle = COLOURS.padArrow;
      const c = Math.cos(p.h), s = Math.sin(p.h), lx = -s, ly = c;
      for (let a = -p.len / 2 + run; a < p.len / 2 - 0.9; a += 2) {
        ctx.beginPath();
        ctx.moveTo(p.x + c * a + lx * 1.2, p.y + s * a + ly * 1.2);
        ctx.lineTo(p.x + c * (a + 0.9), p.y + s * (a + 0.9));
        ctx.lineTo(p.x + c * a - lx * 1.2, p.y + s * a - ly * 1.2);
        ctx.lineTo(p.x + c * (a + 0.45), p.y + s * (a + 0.45));
        ctx.fill();
      }
    }
  }

  /** Speed: thin streaks down the stage's sides, from 30 m/s and stronger in a boost (none with reduced motion). */
  function streaks(car, boosting) {
    if (quiet()) return;
    const v = car.speed;
    const n = boosting ? 14 : v > 30 ? Math.round((v - 30) / 2) : 0;
    if (!n) return;
    ctx.strokeStyle = COLOURS.streak; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, x0 = W / 2 + side * (W * (0.32 + Math.random() * 0.18));
      const y0 = Math.random() * H, len = (boosting ? 90 : 30) + v * 1.5;
      ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + len);
    }
    ctx.stroke();
  }

  /** The tyre tracks, older ones fainter: four strokes, one per age band. */
  function tyreMarks(S, zoom) {
    if (!count) return;
    ctx.lineWidth = 0.35; ctx.lineCap = 'butt';
    const bands = 4, per = Math.ceil(count / bands);
    for (let b = 0; b < bands; b++) {
      ctx.strokeStyle = S.tyre.replace('A', String(0.12 + 0.13 * b));
      ctx.beginPath();
      // Band 0 holds the oldest
      for (let i = b * per; i < Math.min(count, (b + 1) * per); i++) {
        const o = ((head - count + i + TRACKS) % TRACKS) * 4;
        ctx.moveTo(marks[o], marks[o + 1]); ctx.lineTo(marks[o + 2], marks[o + 3]);
      }
      ctx.stroke();
    }
    ctx.lineCap = 'round';
  }

  /** Two posts and a bar across the road (across both roads in a fork); the next one bright; the last one, the finish, chequered. */
  function gates(g, zoom) {
    const last = g.track.gates.length - 1;
    g.track.gates.forEach((one, i) => [one, one.alt].filter(Boolean).forEach(gt => {
      const lx = -Math.sin(gt.h) * gt.half, ly = Math.cos(gt.h) * gt.half;
      const colour = i === g.gate ? COLOURS.gateNext : i < g.gate ? COLOURS.gatePast : COLOURS.gateLater;
      if (i === last) {
        // The finish: a chequered band across the road, two squares deep
        const n = Math.max(4, Math.round(gt.half * 2 / 1.2)), fx = Math.cos(gt.h) * 0.6, fy = Math.sin(gt.h) * 0.6;
        for (let j = 0; j < n; j++) for (let row = 0; row < 2; row++) {
          const t0 = -1 + (2 * j) / n, t1 = -1 + (2 * (j + 1)) / n, o = row ? 1 : -1;
          ctx.fillStyle = (j + row) % 2 ? COLOURS.chequerDark : COLOURS.chequerLight;
          ctx.beginPath();
          ctx.moveTo(gt.x + lx * t0, gt.y + ly * t0); ctx.lineTo(gt.x + lx * t1, gt.y + ly * t1);
          ctx.lineTo(gt.x + lx * t1 + fx * o, gt.y + ly * t1 + fy * o); ctx.lineTo(gt.x + lx * t0 + fx * o, gt.y + ly * t0 + fy * o);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = colour;
        ctx.lineWidth = Math.max(0.35, 2 / zoom);
        ctx.beginPath(); ctx.moveTo(gt.x - lx, gt.y - ly); ctx.lineTo(gt.x + lx, gt.y + ly); ctx.stroke();
      }
      for (const s of [-1, 1]) {
        ctx.fillStyle = COLOURS.gatePost; ctx.beginPath(); ctx.arc(gt.x + s * lx, gt.y + s * ly, 0.85, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colour; ctx.beginPath(); ctx.arc(gt.x + s * lx, gt.y + s * ly, 0.6, 0, Math.PI * 2); ctx.fill();
      }
    }));
  }

  /** The car: its shadow, the wheels (the front pair turned), the body, the roof and its stripes, the glass, the lights. */
  function drawCar(car, S, x, y, h, wrecked, now, boosting, ppm) {
    const hits = car.hits || [], damage = hits.length;
    // In the air the car grows a little (nearer the eye) and its shadow drifts away with the sun
    const z = car.z || 0, lift = 1 + z * 0.12;
    const box = (bx, by, w, hh, r) => {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, w, hh, r); else ctx.rect(bx, by, w, hh);
      ctx.fill();
    };
    // The body and its soft shadow, drawn once at this scale (car2d.js)
    if (!carArt || Math.abs(carArt.ppm - ppm) > carArt.ppm * 0.1) carArt = { ppm, body: carSprite(ppm), shadow: shadowSprite(ppm, S.shadow) };
    const sprite = (art, ox, oy) => ctx.drawImage(art.img, ox - art.hx, oy - art.hy, 2 * art.hx, 2 * art.hy);
    // The shadow falls the way the setting's sun says, in the world (drawn before turning to the car)
    ctx.save();
    ctx.translate(x + S.sun[0] * (0.35 + z * 0.9), y + S.sun[1] * (0.35 + z * 0.9));
    ctx.rotate(h);
    sprite(carArt.shadow, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(h);
    ctx.scale(lift, lift);
    // The boost: a blue flame from the exhaust
    if (boosting) {
      const flick = 0.8 + 0.2 * Math.sin(now / 30);
      ctx.fillStyle = COLOURS.boostFlame;
      ctx.beginPath(); ctx.moveTo(-CAR_L / 2, -0.35); ctx.lineTo(-CAR_L / 2 - 1.8 * flick, 0); ctx.lineTo(-CAR_L / 2, 0.35); ctx.fill();
    }
    // The wheels, the front pair turned as far as the steering is (so the player sees the thumb on the car):
    // a tyre with its tread blocks and a glint of rim at the hub
    const WL = 0.95, WW = 0.45, turn = -(car.steer || 0) * 0.5;
    for (const [wx, wy, front] of [[CAR_L * 0.3, CAR_W / 2, 1], [CAR_L * 0.3, -CAR_W / 2, 1], [-CAR_L * 0.3, CAR_W / 2, 0], [-CAR_L * 0.3, -CAR_W / 2, 0]]) {
      ctx.save();
      ctx.translate(wx, wy);
      if (front) ctx.rotate(turn);
      ctx.fillStyle = COLOURS.wheel; box(-WL / 2, -WW / 2, WL, WW, 0.12);
      ctx.fillStyle = COLOURS.tread;
      for (let k = -3; k <= 3; k++) ctx.fillRect(k * 0.12 - 0.03, -WW / 2 + 0.04, 0.06, WW - 0.08);
      ctx.fillStyle = COLOURS.rim; ctx.fillRect(-0.18, Math.sign(wy) * (WW / 2 - 0.07) - 0.04, 0.36, 0.08);
      ctx.restore();
    }
    sprite(carArt.body, 0, 0);
    // The windscreen cracks from the third crash
    if (damage >= 3) {
      ctx.strokeStyle = COLOURS.crack; ctx.lineWidth = 0.05;
      const gx = CAR_L * 0.14;
      ctx.beginPath();
      for (const [a, b] of [[0.35, 0.45], [-0.3, 0.5], [0.05, -0.55], [0.4, -0.2]]) { ctx.moveTo(gx, 0.05); ctx.lineTo(gx + a * 0.6, b); }
      ctx.stroke();
    }
    // The headlights at the front, in chrome: the left one dies at the fifth crash
    for (const [side, dead] of [[-1, false], [1, damage >= 5]]) {
      const ly = side * (CAR_W / 2 - 0.36);
      ctx.fillStyle = COLOURS.chrome; box(CAR_L / 2 - 0.3, ly - 0.22, 0.26, 0.44, 0.1);
      ctx.fillStyle = dead ? COLOURS.wheel : COLOURS.lens; box(CAR_L / 2 - 0.27, ly - 0.18, 0.2, 0.36, 0.08);
    }
    // The lights at the back: white while going backwards (reverse), red while braking, with a glow when lit
    const backwards = car.vx * Math.cos(car.h) + car.vy * Math.sin(car.h) < -0.3;
    const lit = backwards || car.brake > 0.05;
    const tail = backwards ? COLOURS.reverseLight : car.brake > 0.05 ? COLOURS.brakeLight : COLOURS.brakeOff;
    for (const side of [-1, 1]) {
      const ly = side * (CAR_W / 2 - 0.34);
      if (lit) { ctx.globalAlpha = 0.35; ctx.fillStyle = tail; ctx.beginPath(); ctx.ellipse(-CAR_L / 2 - 0.15, ly, 0.45, 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = tail; box(-CAR_L / 2 + 0.02, ly - 0.2, 0.2, 0.4, 0.07);
    }
    // The dents, where each crash struck (kept inside the body), each with a scratch
    for (const hit of hits) {
      const fx = Math.max(-CAR_L / 2 + 0.35, Math.min(CAR_L / 2 - 0.35, hit.f)), lx = Math.max(-CAR_W / 2 + 0.3, Math.min(CAR_W / 2 - 0.3, hit.l));
      ctx.fillStyle = COLOURS.dent;
      ctx.beginPath(); ctx.ellipse(fx, lx, 0.5, 0.34, (fx * 7 + lx * 3) % Math.PI, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COLOURS.scratch; ctx.lineWidth = 0.05;
      ctx.beginPath(); ctx.moveTo(fx - 0.3, lx - 0.1); ctx.lineTo(fx + 0.25, lx + 0.12); ctx.stroke();
    }
    // The front bumper hangs off one corner from the sixth crash
    if (damage >= 6) {
      ctx.save(); ctx.translate(CAR_L / 2 - 0.05, -CAR_W / 2 + 0.1); ctx.rotate(-0.45);
      ctx.fillStyle = COLOURS.bumper; ctx.fillRect(0, -0.12, 0.9, 0.24);
      ctx.restore();
    }
    // Worn darker with each crash; scorched once wrecked
    if (damage) {
      ctx.fillStyle = wrecked ? COLOURS.scorch : `rgba(0, 0, 0, ${Math.min(0.3, damage * 0.03)})`;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-CAR_L / 2, -CAR_W / 2 + 0.05, CAR_L, CAR_W - 0.1, 0.5); else ctx.rect(-CAR_L / 2, -CAR_W / 2 + 0.05, CAR_L, CAR_W - 0.1);
      ctx.fill();
    }
    // A flame on the bonnet at the last lives and once wrecked, flickering
    if (damage >= 9) {
      const flick = 0.85 + 0.15 * Math.sin(now / 45) + 0.1 * Math.sin(now / 17);
      ctx.fillStyle = COLOURS.flameOuter;
      ctx.beginPath(); ctx.arc(CAR_L * 0.32, 0, 0.55 * flick, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COLOURS.flameInner;
      ctx.beginPath(); ctx.arc(CAR_L * 0.32, 0, 0.28 * flick, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /**
   * The tokens not caught yet: the number itself (−10 on a fork, −5 in the air past a ramp), upright on
   * the screen and turning about its upright axis, over a glow, with its shadow on the ground (further
   * off for one up in the air). With reduced motion it stands still.
   */
  function tokens(g, zoom, now) {
    const taken = g.taken || [];
    (g.track.tokens || []).forEach((k, i) => {
      if (taken.includes(i) || Math.hypot(k.x - cam.x, k.y - cam.y) > Math.hypot(W, H) / zoom + 10) return;
      const spin = quiet() ? 1 : Math.cos(now / 1000 * 3 + i), size = k.air ? 4.4 : 3.6;
      const lift = k.z * 0.35;
      // Its shadow on the ground, away from the sun
      ctx.fillStyle = COLOURS.tokenShadow;
      ctx.beginPath(); ctx.ellipse(k.x + lift, k.y - lift, size * 0.55 * Math.max(0.25, Math.abs(spin)), size * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.rotate(-(Math.PI / 2 - cam.a));
      ctx.scale(1 / zoom, -1 / zoom);
      const px = size * zoom;
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, px * 0.9);
      glow.addColorStop(0, COLOURS.tokenGlow); glow.addColorStop(1, 'rgba(255, 210, 63, 0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, px * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.scale(Math.max(0.12, Math.abs(spin)), 1);
      ctx.font = `900 ${Math.round(px)}px Nunito, system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, px * 0.14); ctx.strokeStyle = COLOURS.tokenEdge;
      const text = `−${Math.round(k.ms / 1000)}`;
      ctx.strokeText(text, 0, 0);
      // Its back, as it turns, a darker gold
      ctx.fillStyle = spin < 0 ? COLOURS.tokenBack : COLOURS.token;
      ctx.fillText(text, 0, 0);
      ctx.restore();
    });
  }

  /** Each gate's number beside its right post, written in screen space so it never turns. */
  function labels(g, { zoom, anchorY }) {
    const ca = Math.cos(Math.PI / 2 - cam.a), sa = Math.sin(Math.PI / 2 - cam.a);
    ctx.font = `900 ${Math.round(Math.max(12, Math.min(18, zoom * 2.6)))}px Nunito, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    g.track.gates.forEach((one, i) => [one, one.alt].filter(Boolean).forEach(gt => {
      if (i < g.gate) return;
      const px = gt.x + Math.sin(gt.h) * (gt.half + 2.2), py = gt.y - Math.cos(gt.h) * (gt.half + 2.2);
      const dx = px - cam.x, dy = py - cam.y;
      const sx = W / 2 + (dx * ca - dy * sa) * zoom, sy = anchorY - (dx * sa + dy * ca) * zoom;
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return;
      ctx.fillStyle = i === g.gate ? COLOURS.gateNext : COLOURS.label;
      ctx.fillText(String(i + 1), sx, sy);
    }));
  }

  return { draw, resize, dispose() { label.dispose(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); } };
}

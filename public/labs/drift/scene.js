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
import { SETTINGS, scenery, near, settingOf } from './scenery.js';

// The colours that are the same in every setting (DESIGN.md §4: what is drawn inside the canvas is the game's)
const COLOURS = {
  gateNext: '#ffd23f', gateLater: 'rgba(255, 255, 255, 0.5)', gatePast: 'rgba(255, 255, 255, 0.15)', gatePost: '#1b1b22',
  chequerDark: '#15151a', chequerLight: '#f4f4f0', label: '#ffffff',
  car: '#ff2e88', carRoof: '#d81f70', carStripe: '#ffffff', carGlass: '#2a0a1c', wheel: '#14141a',
  dent: 'rgba(30, 0, 10, 0.7)', scratch: 'rgba(255, 255, 255, 0.55)', crack: 'rgba(255, 255, 255, 0.8)', scorch: 'rgba(20, 10, 10, 0.55)',
  spark: '#ffd23f', flash: 'rgba(255, 255, 255, 0.85)', flameOuter: '#ff7a1a', flameInner: '#ffe066', bumper: '#b81a5e',
  headlight: '#fff6c8', brakeLight: '#ff3b30', reverseLight: '#ffffff', brakeOff: '#5a1020',
};
const MAX_DPR = 2;
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
function propSprite(kind, v, S, ppm) {
  const sun = S.sun, E = 1 + Math.hypot(sun[0], sun[1]) + 0.1;
  const rRef = { tree: 4.2, dead: 3, bush: 1.8, rock: 1.4, hay: 1.1, stump: 0.8 }[kind] || 2;
  const px = Math.min(256, Math.max(8, 2 * E * rRef * ppm));
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
  const cam = { x: 0, y: 0, a: Math.PI / 2, ox: 0, oy: 0, ready: false };
  let lastNow = 0;
  // What is built once per stage and setting, and once per scale
  let world = null;          // { track, setting, S, patches, cells }
  let sprites = new Map(), spritePpm = 0, dust = null;
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
  let nextBit = 0, nextSmoke = 0, smokeOwed = 0, seenHits = 0;
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
    world = { track, setting, S, ...scenery(track, setting) };
    sprites = new Map(); spritePpm = 0; dust = dustSprite(S.dust);
    return world;
  }
  function sprite(kind, v, ppm) {
    // Drawn again only when the scale changes by more than a tenth (the panel's zoom, a rotated phone)
    if (Math.abs(ppm - spritePpm) > spritePpm * 0.1) { sprites = new Map(); spritePpm = ppm; }
    const k = kind + v;
    if (!sprites.has(k)) sprites.set(k, propSprite(kind, v, world.S, spritePpm));
    return sprites.get(k);
  }

  function draw(g, alpha = 0, view = {}) {
    if (!W || !H) return;
    const mode = view.mode === 'fixed' ? 'fixed' : 'follow';
    const ahead = view.ahead || 50;
    const now = globalThis.performance?.now() ?? 0;
    const dt = Math.min(0.1, lastNow ? (now - lastNow) / 1000 : 0);
    lastNow = now;
    const car = g.car;
    const { S } = settle(g.track, view.setting);
    if (g !== lastG) {
      lastG = g; head = 0; count = 0; prevRear = null; lastCar = null; rings.length = 0;
      seenHits = car.hits?.length || 0;
      for (const p of [...puffs, ...bits, ...smoke]) p.age = p.life;
    }
    // The car between the last two steps
    const x = car.px + (car.x - car.px) * alpha, y = car.py + (car.y - car.py) * alpha;
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
      const gravel = S.ruts !== null || !g.onRoad;
      let rate = Math.min(60, car.slip * 9) + (gravel && car.speed > 3 ? (car.throttle || 0) * car.speed * 0.6 : 0);
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
        b.age = 0; b.life = 0.35 + Math.random() * 0.5; b.spark = i % 2 === 0; b.size = b.spark ? 0.12 : 0.18 + Math.random() * 0.2;
      }
    }
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

    for (const p of near(world.patches, cam.x, cam.y, reach, seen)) {
      ctx.fillStyle = S.patches[p.v % S.patches.length];
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    road(g.track, S, cam.x, cam.y, reach);
    tyreMarks(S, zoom);
    gates(g, zoom);
    // The props, then the car over them (a crown must never hide it), then its dust
    const ppm = zoom * dpr;
    for (const it of near(world.cells, cam.x, cam.y, reach, seen)) {
      const { img, E } = sprite(it.kind, it.v, ppm);
      const e = E * it.r;
      ctx.drawImage(img, it.x - e, it.y - e, 2 * e, 2 * e);
    }
    drawCar(car, S, x, y, h, g.wrecked, now);
    for (const p of puffs) {
      if (p.age >= p.life) continue;
      const f = p.age / p.life, r = p.r * (1 + f * 2.5);
      ctx.globalAlpha = 1 - f;
      ctx.drawImage(dust, p.x - r, p.y - r, 2 * r, 2 * r);
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
      ctx.fillStyle = b.spark ? COLOURS.spark : b.size > 0.28 ? S.shoulder : COLOURS.car;
      ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
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

    // The gate numbers, upright on the screen
    labels(g, { zoom, anchorY });
  }

  /** The road: the points near the camera, stroked wide with round joins, the shoulder first. */
  function road(track, S, cx, cy, reach) {
    const P = track.pts, r2 = reach * reach;
    const runs = [];
    let run = null;
    for (let i = 0; i < P.length; i++) {
      const p = P[i], dx = p.x - cx, dy = p.y - cy;
      if (dx * dx + dy * dy <= r2) { if (!run) runs.push(run = []); run.push(p); } else run = null;
    }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const [colour, extra] of [[S.shoulder, 2.4], [S.road, 0]]) {
      ctx.strokeStyle = colour;
      // Wider where the bend is a hairpin: each width its own stroke
      for (const w of [7, 9]) {
        ctx.lineWidth = w + extra;
        ctx.beginPath();
        for (const rn of runs) {
          let open = false;
          for (const p of rn) {
            if (p.w < w) { open = false; continue; }
            if (!open) { ctx.moveTo(p.x, p.y); open = true; } else ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }
    }
    // A line along the road, `off` metres to its left (a negative one, to its right)
    const along = (off, edge) => {
      ctx.beginPath();
      for (const rn of runs) rn.forEach((p, i) => {
        const o = edge ? Math.sign(off) * (p.w / 2 - Math.abs(off)) : off;
        const px = p.x - Math.sin(p.h) * o, py = p.y + Math.cos(p.h) * o;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.stroke();
    };
    // Gravel: the two ruts the cars before you dug; asphalt: the edge lines and the centre dashes
    if (S.ruts) { ctx.strokeStyle = S.ruts; ctx.lineWidth = 0.7; along(1.25); along(-1.25); }
    if (S.lines) { ctx.strokeStyle = S.lines; ctx.lineWidth = 0.18; along(0.45, true); along(-0.45, true); }
    if (S.centre) { ctx.strokeStyle = S.centre; ctx.lineWidth = 0.2; ctx.setLineDash([3, 5]); along(0); ctx.setLineDash([]); }
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

  /** Two posts and a bar across the road; the next one bright; the last one, the finish, chequered. */
  function gates(g, zoom) {
    const last = g.track.gates.length - 1;
    g.track.gates.forEach((gt, i) => {
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
    });
  }

  /** The car: its shadow, the wheels (the front pair turned), the body, the roof and its stripes, the glass, the lights. */
  function drawCar(car, S, x, y, h, wrecked, now) {
    const hits = car.hits || [], damage = hits.length;
    const box = (bx, by, w, hh, r) => {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, w, hh, r); else ctx.rect(bx, by, w, hh);
      ctx.fill();
    };
    // The shadow falls the way the setting's sun says, in the world (drawn before turning to the car)
    ctx.fillStyle = S.shadow;
    ctx.save();
    ctx.translate(x + S.sun[0] * 0.35, y + S.sun[1] * 0.35);
    ctx.rotate(h);
    box(-CAR_L / 2, -CAR_W / 2, CAR_L, CAR_W, 0.5);
    ctx.restore();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(h);
    // The wheels, the front pair turned as far as the steering is (so the player sees the thumb on the car)
    ctx.fillStyle = COLOURS.wheel;
    const WL = 0.95, WW = 0.45, turn = -(car.steer || 0) * 0.5;
    for (const [wx, wy, front] of [[CAR_L * 0.3, CAR_W / 2, 1], [CAR_L * 0.3, -CAR_W / 2, 1], [-CAR_L * 0.3, CAR_W / 2, 0], [-CAR_L * 0.3, -CAR_W / 2, 0]]) {
      ctx.save();
      ctx.translate(wx, wy);
      if (front) ctx.rotate(turn);
      ctx.fillRect(-WL / 2, -WW / 2, WL, WW);
      ctx.restore();
    }
    ctx.fillStyle = COLOURS.car;
    box(-CAR_L / 2, -CAR_W / 2 + 0.05, CAR_L, CAR_W - 0.1, 0.5);
    ctx.fillStyle = COLOURS.carRoof;
    box(-CAR_L * 0.24, -CAR_W / 2 + 0.28, CAR_L * 0.42, CAR_W - 0.56, 0.25);
    // The rally stripes, nose to tail
    ctx.fillStyle = COLOURS.carStripe;
    ctx.fillRect(-CAR_L / 2 + 0.1, -0.3, CAR_L - 0.2, 0.18);
    ctx.fillRect(-CAR_L / 2 + 0.1, 0.12, CAR_L - 0.2, 0.18);
    ctx.fillStyle = COLOURS.carGlass;
    ctx.fillRect(CAR_L * 0.08, -CAR_W / 2 + 0.25, CAR_L * 0.12, CAR_W - 0.5);
    ctx.fillRect(-CAR_L * 0.3, -CAR_W / 2 + 0.3, CAR_L * 0.07, CAR_W - 0.6);
    // The windscreen cracks from the third crash
    if (damage >= 3) {
      ctx.strokeStyle = COLOURS.crack; ctx.lineWidth = 0.05;
      const gx = CAR_L * 0.14;
      ctx.beginPath();
      for (const [a, b] of [[0.35, 0.45], [-0.3, 0.5], [0.05, -0.55], [0.4, -0.2]]) { ctx.moveTo(gx, 0.05); ctx.lineTo(gx + a * 0.6, b); }
      ctx.stroke();
    }
    // The headlights at the front: the left one dies at the fifth crash
    ctx.fillStyle = COLOURS.headlight;
    ctx.fillRect(CAR_L / 2 - 0.22, -CAR_W / 2 + 0.14, 0.18, 0.36);
    ctx.fillStyle = damage >= 5 ? COLOURS.wheel : COLOURS.headlight;
    ctx.fillRect(CAR_L / 2 - 0.22, CAR_W / 2 - 0.5, 0.18, 0.36);
    // The lights at the back: white while going backwards (reverse), red while braking
    const backwards = car.vx * Math.cos(car.h) + car.vy * Math.sin(car.h) < -0.3;
    ctx.fillStyle = backwards ? COLOURS.reverseLight : car.brake > 0.05 ? COLOURS.brakeLight : COLOURS.brakeOff;
    ctx.fillRect(-CAR_L / 2 + 0.02, CAR_W / 2 - 0.5, 0.22, 0.36);
    ctx.fillRect(-CAR_L / 2 + 0.02, -CAR_W / 2 + 0.14, 0.22, 0.36);
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

  /** Each gate's number beside its right post, written in screen space so it never turns. */
  function labels(g, { zoom, anchorY }) {
    const ca = Math.cos(Math.PI / 2 - cam.a), sa = Math.sin(Math.PI / 2 - cam.a);
    ctx.font = `900 ${Math.round(Math.max(12, Math.min(18, zoom * 2.6)))}px Nunito, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    g.track.gates.forEach((gt, i) => {
      if (i < g.gate) return;
      const px = gt.x + Math.sin(gt.h) * (gt.half + 2.2), py = gt.y - Math.cos(gt.h) * (gt.half + 2.2);
      const dx = px - cam.x, dy = py - cam.y;
      const sx = W / 2 + (dx * ca - dy * sa) * zoom, sy = anchorY - (dx * sa + dy * ca) * zoom;
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return;
      ctx.fillStyle = i === g.gate ? COLOURS.gateNext : COLOURS.label;
      ctx.fillText(String(i + 1), sx, sy);
    });
  }

  return { draw, resize, dispose() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); } };
}

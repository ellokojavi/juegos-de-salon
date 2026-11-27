/**
 * Drift: the top-down scene (docs/rally/path-1-top-down.md). It reads the engine's state and draws it
 * on one 2D canvas; it never writes the state. Path 2's 3D scene implements this same interface:
 *
 *   escena(canvas) → { draw(g, alpha, view), resize(), dispose() }
 *
 * `alpha` is the fraction of a step left in the caller's accumulator (to interpolate the car on fast
 * screens); `view` is { mode: 'follow' | 'fixed', ahead } (metres of road seen ahead of the car).
 *
 * Phase 1.1 is a grey box: flat ground with a faint grid, the road, the gates, a rectangle for the
 * car. No scenery, no particles.
 *
 * The camera is calm on purpose (the owner is sensitive to camera movement): it turns toward the
 * car's direction of travel, not its heading, so the twitch of a slide does not swing the world; it
 * arrives over about half a second and never snaps; it does not shake and does not zoom with speed.
 * With reduced motion it is damped twice as much.
 */

// The scene's own colours, declared once (DESIGN.md §4: what is drawn inside the canvas is the game's)
const COLOURS = {
  ground: '#2f4a2a', grid: 'rgba(255, 255, 255, 0.05)', shoulder: '#6d5f44', road: '#a8916a',
  hairpin: '#b39c74', centre: 'rgba(255, 255, 255, 0.18)',
  gateNext: '#ffd23f', gateLater: 'rgba(255, 255, 255, 0.45)', gatePast: 'rgba(255, 255, 255, 0.15)',
  car: '#ff2e88', carGlass: '#2a0a1c', wheel: '#14141a', brakeLight: '#ff3b30', brakeOff: '#5a1020', shadow: 'rgba(0, 0, 0, 0.35)', label: '#ffffff',
};
const MAX_DPR = 2;
const CAR_L = 4.2, CAR_W = 1.8;
/** Where the car sits on the stage, from the top (the lower third, so the road ahead shows). */
const CAR_AT = 0.7;
/** The camera's time constant, s: it arrives over about three of these. */
const EASE = 0.16;

const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const quiet = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function escena(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const cam = { x: 0, y: 0, a: Math.PI / 2, ox: 0, oy: 0, ready: false };
  let lastNow = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(MAX_DPR, globalThis.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  resize();

  function draw(g, alpha = 0, view = {}) {
    if (!W || !H) return;
    const mode = view.mode === 'fixed' ? 'fixed' : 'follow';
    const ahead = view.ahead || 70;
    const now = globalThis.performance?.now() ?? 0;
    const dt = Math.min(0.1, lastNow ? (now - lastNow) / 1000 : 0);
    lastNow = now;
    const car = g.car;
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

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLOURS.ground;
    ctx.fillRect(0, 0, W, H);

    // World transform: y up, the camera's direction pointing up the screen
    ctx.save();
    ctx.translate(W / 2, anchorY);
    ctx.scale(zoom, -zoom);
    ctx.rotate(Math.PI / 2 - cam.a);
    ctx.translate(-cam.x, -cam.y);
    const reach = Math.hypot(W, H) / zoom + 20;

    grid(cam.x, cam.y, reach, zoom);
    road(g.track, cam.x, cam.y, reach);
    gates(g, zoom);
    // The car: its shadow, the body, the wheels (the front pair turned), the windscreen, the brake lights
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(h);
    ctx.fillStyle = COLOURS.shadow;
    ctx.fillRect(-CAR_L / 2 + 0.3, -CAR_W / 2 - 0.3, CAR_L, CAR_W);
    ctx.fillStyle = COLOURS.car;
    ctx.fillRect(-CAR_L / 2, -CAR_W / 2, CAR_L, CAR_W);
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
    ctx.fillStyle = COLOURS.carGlass;
    ctx.fillRect(CAR_L * 0.08, -CAR_W / 2 + 0.2, CAR_L * 0.22, CAR_W - 0.4);
    // The brake lights at the back: lit while braking
    ctx.fillStyle = car.brake > 0.05 ? COLOURS.brakeLight : COLOURS.brakeOff;
    ctx.fillRect(-CAR_L / 2, CAR_W / 2 - 0.5, 0.25, 0.4);
    ctx.fillRect(-CAR_L / 2, -CAR_W / 2 + 0.1, 0.25, 0.4);
    ctx.restore();
    ctx.restore();

    // The gate numbers, upright on the screen
    labels(g, { zoom, anchorY });
  }

  function grid(cx, cy, reach, zoom) {
    const step = 20;
    ctx.strokeStyle = COLOURS.grid;
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    const x0 = Math.floor((cx - reach) / step) * step, y0 = Math.floor((cy - reach) / step) * step;
    for (let gx = x0; gx <= cx + reach; gx += step) { ctx.moveTo(gx, cy - reach); ctx.lineTo(gx, cy + reach); }
    for (let gy = y0; gy <= cy + reach; gy += step) { ctx.moveTo(cx - reach, gy); ctx.lineTo(cx + reach, gy); }
    ctx.stroke();
  }

  /** The road: the points near the camera, stroked wide with round joins, the shoulder first. */
  function road(track, cx, cy, reach) {
    const P = track.pts, r2 = reach * reach;
    const runs = [];
    let run = null;
    for (let i = 0; i < P.length; i++) {
      const p = P[i], dx = p.x - cx, dy = p.y - cy;
      if (dx * dx + dy * dy <= r2) { if (!run) runs.push(run = []); run.push(p); } else run = null;
    }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const [colour, extra] of [[COLOURS.shoulder, 2.4], [COLOURS.road, 0]]) {
      ctx.strokeStyle = colour;
      // Wider where the bend is a hairpin: each width its own stroke
      for (const w of [7, 9]) {
        ctx.lineWidth = w + extra;
        ctx.beginPath();
        for (const rn of runs) {
          let open = false;
          for (let i = 0; i < rn.length; i++) {
            const p = rn[i];
            if (p.w < w) { open = false; continue; }
            if (!open) { ctx.moveTo(p.x, p.y); open = true; } else ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }
    }
    // The centre dashes
    ctx.strokeStyle = COLOURS.centre;
    ctx.lineWidth = 0.25;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    for (const rn of runs) rn.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /** Two posts and a bar across the road; the next one bright. */
  function gates(g, zoom) {
    g.track.gates.forEach((gt, i) => {
      const lx = -Math.sin(gt.h) * gt.half, ly = Math.cos(gt.h) * gt.half;
      const colour = i === g.gate ? COLOURS.gateNext : i < g.gate ? COLOURS.gatePast : COLOURS.gateLater;
      ctx.strokeStyle = colour; ctx.fillStyle = colour;
      ctx.lineWidth = Math.max(0.35, 2 / zoom);
      ctx.beginPath(); ctx.moveTo(gt.x - lx, gt.y - ly); ctx.lineTo(gt.x + lx, gt.y + ly); ctx.stroke();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(gt.x + s * lx, gt.y + s * ly, 0.7, 0, Math.PI * 2); ctx.fill(); }
    });
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

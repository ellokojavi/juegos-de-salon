/**
 * Aletazo's drawing: the city by day, afternoon or night, the gates, the spikes, the bird and what celebrates, on one
 * canvas. The canvas is transparent: it stands on the app's own night (base.css).
 *
 * Nothing here uses `shadowBlur`: on a 3× phone screen it cost ~50 ms a frame. The neon glow is a wide
 * see-through stroke under each line, and the bird and the spike are drawn once into small canvases
 * (sprites) and stamped every frame.
 */
import { BR, RIM, GROUND, WALL, skyOf } from './engine.js';

const QUIET = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a);
const SPARK = ['#ffd23f', '#fff3a6', '#ff2e88', '#2ee6d6'];

/**
 * The sky, 4 heights long and repeated as the course scrolls: stars, clouds, flocks of far birds, two
 * strips of city (the far one with antennas whose tips blink) and the street lamps.
 */
function skyline() {
  const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * 4, y: Math.random() * 0.7, s: rnd(0.002, 0.005), p: Math.random() * 6 }));
  const clouds = Array.from({ length: 7 }, (_, i) => ({ x: i * 0.57 + rnd(0, 0.3), y: rnd(0.08, 0.42), w: rnd(0.12, 0.24) }));
  const flocks = Array.from({ length: 8 }, (_, i) => ({ x: i * 0.5 + rnd(0, 0.3), y: rnd(0.12, 0.45), n: 2 + ((Math.random() * 3) | 0), p: Math.random() * 6 }));
  const city = (hmin, hmax, lit) => {
    const out = []; let x = 0;
    while (x < 4) {
      const w = rnd(0.08, 0.22), h = rnd(hmin, hmax), wins = [];
      if (Math.random() < lit) for (let wy = 0.025; wy < h - 0.02; wy += 0.04) for (let wx = 0.02; wx < w - 0.02; wx += 0.035) if (Math.random() < 0.6) wins.push(wx, wy);
      out.push({ x, w, h, wins, mast: h > hmax * 0.8 && Math.random() < 0.6, p: Math.random() * 6 }); x += w + rnd(0, 0.05);
    }
    return out;
  };
  const flecks = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), s: rnd(0.002, 0.005) }));
  return { flecks, stars, clouds, flocks, far: city(0.12, 0.32, 0.85), near: city(0.06, 0.18, 0.8) };
}

/**
 * The three times of day the course goes through, one every SKY_EVERY points (engine.js): day, the
 * afternoon and the night, then day again. Colors are [r, g, b, a]; the scene blends from one to the next.
 */
const SKIES = [
  { top: [104, 170, 255, 0.9], low: [255, 196, 228, 0.9], far: [150, 120, 215, 0.5], farWin: [255, 255, 255, 0.3], near: [84, 46, 148, 0.85], win: [200, 230, 255, 0.25], cloud: [255, 255, 255, 0.75], bird: [60, 30, 100, 0.7], stars: 0, lamps: 0, sea: 0 },
  { top: [88, 40, 150, 0.9], low: [255, 128, 92, 0.9], far: [130, 50, 140, 0.55], farWin: [255, 210, 63, 0.35], near: [48, 14, 70, 0.88], win: [255, 210, 63, 0.7], cloud: [255, 150, 180, 0.55], bird: [40, 10, 60, 0.6], stars: 0.25, lamps: 0.7, sea: 1 },
  { top: [14, 5, 32, 0.55], low: [70, 22, 100, 0.55], far: [138, 77, 255, 0.2], farWin: [255, 210, 63, 0.4], near: [21, 7, 38, 0.8], win: [255, 210, 63, 0.75], cloud: [180, 150, 255, 0.1], bird: [0, 0, 0, 0], stars: 1, lamps: 1, sea: 0 },
];
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const css = c => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${c[3].toFixed(3)})`;

/**
 * A scene on a canvas. `draw(g)` paints one frame of the game `g`; `fx(event, g)` plays what an engine
 * event looks like (sparks, rings, points); `tick(dt, g)` moves the effects. `measure()` returns the
 * stage's width over its height, the engine's `W`.
 */
export function escena(canvas, opts = {}) {
  // `loop: { scroll, seconds }` (the splash teaser, the owner's request): over that much scroll and
  // time every layer moves by whole repeats of its pattern and every flicker runs whole cycles, so the
  // last frame leads into the first with nothing to notice. The game passes nothing and is unchanged
  const L = opts.loop;
  /** How far a layer that moves at `k` times the course and repeats every `p` has moved. */
  const mov = (s, k, p) => (L ? (s / L.scroll) * Math.round((L.scroll * k) / p) * p : s * k);
  /** A flicker's speed, rounded to whole cycles over the loop. */
  const hz = w => (L ? (2 * Math.PI * Math.round((w * L.seconds) / (2 * Math.PI))) / L.seconds : w);
  const ctx = canvas.getContext('2d');
  let CW = 0, CH = 0, dpr = 1, W = 1;
  let birdSprite, glowSprite, spikeSprite;
  const sky = skyline();
  let parts = [], pulses = [], floats = [], flashT = 0, glow = 0, shake = 0, trailT = 0;
  let skyT = null, lastClock = 0;   // the time of day shown, easing to the game's (skyOf)

  function sprite(size, paint) {
    const px = Math.max(8, Math.ceil(size * CH * dpr)), c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    g.setTransform(px / size, 0, 0, px / size, px / 2, px / 2); paint(g);
    return { c, size };
  }
  function bake() {
    const R = BR;
    birdSprite = sprite(R * 4.4, g => {
      const halo = g.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 2.1);
      halo.addColorStop(0, 'rgba(255,210,63,0.45)'); halo.addColorStop(1, 'rgba(255,210,63,0)');
      g.fillStyle = halo; g.beginPath(); g.arc(0, 0, R * 2.1, 0, 7); g.fill();
      g.fillStyle = '#ff2e88';   // tail
      g.beginPath(); g.moveTo(-R * 0.9, 0); g.lineTo(-R * 1.6, -R * 0.5); g.lineTo(-R * 1.45, R * 0.1); g.lineTo(-R * 1.6, R * 0.55); g.closePath(); g.fill();
      const body = g.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.2, 0, 0, R * 1.2);
      body.addColorStop(0, '#fff3a6'); body.addColorStop(0.6, '#ffd23f'); body.addColorStop(1, '#ff9a1a');
      g.fillStyle = body; g.beginPath(); g.ellipse(0, 0, R * 1.15, R, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(R * 0.15, R * 0.45, R * 0.6, R * 0.35, 0, 0, 7); g.fill();
      g.fillStyle = '#ff7a1a'; g.beginPath(); g.moveTo(R * 0.95, -R * 0.2); g.lineTo(R * 1.6, R * 0.05); g.lineTo(R * 0.95, R * 0.3); g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(R * 0.45, -R * 0.32, R * 0.32, 0, 7); g.fill();
    });
    glowSprite = sprite(R * 7, g => {
      const halo = g.createRadialGradient(0, 0, R * 0.8, 0, 0, R * 3.5);
      halo.addColorStop(0, 'rgba(255,248,200,0.95)'); halo.addColorStop(0.35, 'rgba(255,210,63,0.55)'); halo.addColorStop(1, 'rgba(255,210,63,0)');
      g.fillStyle = halo; g.beginPath(); g.arc(0, 0, R * 3.5, 0, 7); g.fill();
    });
    const zr = 0.032;
    spikeSprite = sprite(zr * 3.4, g => {
      const halo = g.createRadialGradient(0, 0, zr * 0.5, 0, 0, zr * 1.7);
      halo.addColorStop(0, 'rgba(224,36,60,0.5)'); halo.addColorStop(1, 'rgba(224,36,60,0)');
      g.fillStyle = halo; g.beginPath(); g.arc(0, 0, zr * 1.7, 0, 7); g.fill();
      g.fillStyle = '#ff2e88'; g.beginPath();
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? zr * 0.5 : zr; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill();
      g.fillStyle = '#150726'; g.beginPath(); g.arc(0, 0, zr * 0.25, 0, 7); g.fill();
    });
  }
  function measure() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);   // 2× is plenty for a canvas game
    CW = r.width; CH = r.height || 1; W = CW / CH;
    canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
    bake();
    return W;
  }

  /* --- effects --- */
  function burst(x, y, c, n, sp = 0.6, star = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rnd(0.2, sp);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6, max: 0.6, c, s: star ? rnd(0.008, 0.016) : rnd(0.004, 0.009), star, rot: Math.random() * 3 });
    }
  }
  /** What an engine event looks like. */
  function fx(e, g) {
    const b = g.bird;
    if (e.type === 'flap') {
      for (let i = 0; i < 3; i++) parts.push({ x: b.x - BR, y: b.y + BR * 0.3, vx: rnd(-0.5, -0.2), vy: rnd(0.05, 0.3), life: 0.35, max: 0.35, c: '#2ee6d6', s: rnd(0.004, 0.008) });
    } else if (e.type === 'pass') {
      burst(e.x, e.y, e.color, 10, 0.5); burst(e.x, e.y, e.color, 4, 0.4, true);
      floats.push({ text: '+1', x: e.x, y: e.y - 0.05, life: 0.8, max: 0.8, c: '#fff' });
    } else if (e.type === 'perfect') {
      // Like Shinobi's flag, softer: two rings open from the hoop, a faint gold flash, a short spray
      // of sparks, the bird lit up for a moment and the +2 popping up
      if (!QUIET) {
        ['#ffd23f', '#2ee6d6'].forEach((c, j) => pulses.push({ x: e.x, y: e.y, born: g.clock + j * 0.1, c, max: 0.11 + j * 0.025 }));
        flashT = 0.25; glow = 0.6;
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + rnd(-0.5, 0.5) * Math.PI, v = rnd(0.25, 0.55);
          parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(0.5, 0.75), max: 0.75, c: i % 2 ? '#ffd23f' : '#fff3a6', s: rnd(0.005, 0.01), star: i % 2 === 0, rot: Math.random() * 3, heavy: true });
        }
      }
      floats.push({ text: '+2', x: e.x, y: e.y - 0.11, life: 0.9, max: 0.9, c: '#ffd23f', big: true });
    } else if (e.type === 'hit') {
      shake = 0.3; burst(e.x, e.y, '#ff2e88', 12, 0.7);
    }
  }
  function tick(dt, g) {
    shake = Math.max(0, shake - dt);
    flashT = Math.max(0, flashT - dt); glow = Math.max(0, glow - dt / 0.6);
    pulses = pulses.filter(p => g.clock - p.born < 0.75);
    // A trail of little sparkles behind the bird while it flies
    if (!QUIET && (g.mode === 'play' || g.mode === 'demo' || g.mode === 'glide') && (trailT -= dt) <= 0) {
      trailT = 0.045;
      const b = g.bird;
      parts.push({ x: b.x - BR * 1.3, y: b.y + rnd(-0.4, 0.4) * BR, vx: rnd(-0.25, -0.1), vy: rnd(-0.08, 0.08), life: 0.45, max: 0.45, c: SPARK[(Math.random() * 4) | 0], s: rnd(0.006, 0.011), star: true, rot: Math.random() * 3, float: true });
    }
    for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; if (!p.float) p.vy += (p.heavy ? 1.6 : 0.6) * dt; p.rot = (p.rot || 0) + dt * 4; p.life -= dt; }
    parts = parts.filter(p => p.life > 0);
    for (const f of floats) f.life -= dt;
    floats = floats.filter(f => f.life > 0);
  }
  function clear() { skyT = null; lastClock = 0; parts = []; pulses = []; floats = []; flashT = 0; glow = 0; shake = 0; }

  /* --- drawing --- */
  const stamp = (sp, x, y, a) => { ctx.save(); ctx.translate(x, y); if (a) ctx.rotate(a); ctx.drawImage(sp.c, -sp.size / 2, -sp.size / 2, sp.size, sp.size); ctx.restore(); };
  /** A 4-point twinkle: the curves pull in to the center between the points. */
  function sparkle(x, y, s, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s);
    ctx.fill(); ctx.restore();
  }
  function background(g) {
    // The time of day eases to the game's over about two seconds; a new game starts on its own at once
    const want = skyOf(g), dt = Math.max(0, Math.min(0.1, g.clock - lastClock)); lastClock = g.clock;
    if (skyT === null || skyT > want) skyT = want; else skyT += Math.min(want - skyT, QUIET ? 1 : dt * 0.5);
    const i = Math.floor(skyT), k = skyT - i, A = SKIES[i % 3], B = SKIES[(i + 1) % 3];
    const P = {}; for (const key in A) P[key] = typeof A[key] === 'number' ? A[key] + (B[key] - A[key]) * k : mix(A[key], B[key], k);
    const w = [0, 0, 0]; w[i % 3] += 1 - k; w[(i + 1) % 3] += k;   // how much of day, afternoon and night
    const t = QUIET ? 0 : g.clock;

    const grad = ctx.createLinearGradient(0, 0, 0, GROUND);
    grad.addColorStop(0, css(P.top)); grad.addColorStop(1, css(P.low));
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, GROUND);
    // The sun high by day, low and orange in the afternoon; the moon at night, with its craters
    const body = (x, y, r, c, a) => {
      if (a <= 0.01) return;
      ctx.globalAlpha = a * 0.2; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r * 1.5, 0, 7); ctx.fill();
      ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    };
    body(W * 0.78, 0.16, 0.06, '#fff3a6', w[0]);
    body(W * 0.72, 0.5, 0.075, '#ff9a4a', w[1]);
    if (w[2] > 0.01) {
      body(W * 0.8, 0.14, 0.055, '#fff6d8', w[2]);
      ctx.globalAlpha = w[2] * 0.35; ctx.fillStyle = '#d9c9a0';
      for (const [dx, dy, r] of [[-0.015, -0.012, 0.011], [0.018, 0.01, 0.008], [-0.006, 0.02, 0.006]]) { ctx.beginPath(); ctx.arc(W * 0.8 + dx, 0.14 + dy, r, 0, 7); ctx.fill(); }
    }
    if (P.stars > 0.01) for (const s of sky.stars) {
      const x = ((s.x - mov(g.scroll, 0.03, 4)) % 4 + 4) % 4; if (x > W + 0.1) continue;
      ctx.globalAlpha = P.stars * (QUIET ? 0.5 : 0.35 + 0.35 * Math.sin(t * hz(2) + s.p));
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, s.y, s.s, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Clouds drift slower than the city
    ctx.fillStyle = css(P.cloud);
    for (const c of sky.clouds) {
      const x = ((c.x - mov(g.scroll, 0.06, 4)) % 4 + 4) % 4 - 0.3; if (x > W + 0.1) continue;
      ctx.beginPath(); ctx.ellipse(x, c.y, c.w, c.w * 0.22, 0, 0, 7); ctx.ellipse(x - c.w * 0.35, c.y + 0.005, c.w * 0.45, c.w * 0.2, 0, 0, 7); ctx.ellipse(x + c.w * 0.2, c.y - c.w * 0.12, c.w * 0.4, c.w * 0.25, 0, 0, 7); ctx.fill();
    }
    // Far birds in small flocks, beating their wings, by day and in the afternoon
    if (P.bird[3] > 0.01) {
      ctx.strokeStyle = css(P.bird); ctx.lineWidth = 0.004; ctx.lineCap = 'round';
      for (const f of sky.flocks) {
        const x0 = ((f.x - mov(g.scroll, 0.09, 4) - (L ? 0 : t * 0.03)) % 4 + 4) % 4 - 0.2; if (x0 > W + 0.1) continue;
        for (let j = 0; j < f.n; j++) {
          const x = x0 + j * 0.035, y = f.y + (j % 2) * 0.02 + Math.sin(t * hz(0.8) + f.p) * 0.01, s = 0.011, up = Math.sin(t * hz(7) + f.p + j) * 0.006;
          ctx.beginPath(); ctx.moveTo(x - s, y - up); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.5, x, y); ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.5, x + s, y - up); ctx.stroke();
        }
      }
    }
    const strip = (list, k, fill, winC, masts) => {
      const off = mov(g.scroll, k, 4) % 4;
      for (const rep of [0, 4]) for (const b of list) {
        const x = b.x - off + rep; if (x > W || x + b.w < 0) continue;
        ctx.fillStyle = fill; ctx.fillRect(x, GROUND - b.h, b.w, b.h + 0.01);
        if (masts && b.mast) {
          ctx.fillRect(x + b.w / 2 - 0.002, GROUND - b.h - 0.05, 0.004, 0.05);
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * hz(3) + b.p); ctx.fillStyle = '#ff2e88';
          ctx.beginPath(); ctx.arc(x + b.w / 2, GROUND - b.h - 0.05, 0.005, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        }
        if (winC && b.wins.length) { ctx.fillStyle = winC; const top = GROUND - b.h; for (let i = 0; i < b.wins.length; i += 2) ctx.fillRect(x + b.wins[i], top + b.wins[i + 1], 0.012, 0.014); }
      }
    };
    strip(sky.far, 0.12, css(P.far), css(P.farWin), true);
    strip(sky.near, 0.3, css(P.near), P.win[3] > 0.01 ? css(P.win) : null, false);
    // Street lamps along the ground, lit from the afternoon on
    const lo = mov(g.scroll, 0.6, 0.4) % 0.4;
    for (let x = -lo; x < W + 0.1; x += 0.4) {
      ctx.fillStyle = 'rgba(21,7,38,0.9)'; ctx.fillRect(x, GROUND - 0.07, 0.005, 0.07); ctx.fillRect(x - 0.004, GROUND - 0.072, 0.02, 0.005);
      if (P.lamps > 0.01) {
        ctx.globalAlpha = P.lamps * 0.18; ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x + 0.014, GROUND - 0.066, 0.03, 0, 7); ctx.fill();
        ctx.globalAlpha = P.lamps; ctx.fillStyle = '#fff3a6'; ctx.beginPath(); ctx.arc(x + 0.014, GROUND - 0.066, 0.006, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    if (P.sea < 0.99) ground(g, P);
    if (P.sea > 0.01) { ctx.globalAlpha = P.sea; sea(g, P, w); ctx.globalAlpha = 1; }
  }
  /**
   * The sea, the afternoon's ground: the street fades into it and back. A seawall with its neon edge, the
   * water taking the sky's colors, waves that run with the speed and the low sun's path glittering on it.
   */
  function sea(g, P, w) {
    const Y = GROUND, A = ctx.globalAlpha, t = QUIET ? 0 : g.clock;
    ctx.fillStyle = 'rgba(21,7,38,0.95)'; ctx.fillRect(0, Y, W, 0.012);
    ctx.globalAlpha = A * 0.25; ctx.fillStyle = '#2ee6d6'; ctx.fillRect(0, Y - 0.002, W, 0.01);
    ctx.globalAlpha = A; ctx.fillStyle = '#2ee6d6'; ctx.fillRect(0, Y, W, 0.003);
    const top = Y + 0.012, wat = ctx.createLinearGradient(0, top, 0, 1);
    wat.addColorStop(0, css(mix(P.low, [40, 20, 90, 1], 0.45))); wat.addColorStop(1, css(mix(P.top, [12, 4, 30, 1], 0.6)));
    ctx.fillStyle = wat; ctx.fillRect(0, top, W, 1 - top);
    // The low sun's path on the water, made of short glints
    const sx = W * 0.72;
    for (let r = 0; r < 7; r++) {
      const y = top + 0.008 + r * 0.011, half = 0.02 + r * 0.008;
      ctx.globalAlpha = A * w[1] * (0.55 - r * 0.06) * (0.75 + 0.25 * Math.sin(t * hz(3) + r * 1.7));
      ctx.fillStyle = r % 2 ? '#ffd23f' : '#ff9a4a';
      ctx.fillRect(sx - half + Math.sin(t * hz(2) + r) * 0.006, y, half * 2, 0.004);
    }
    // Waves: short light crests in three rows, the nearer ones faster
    ctx.fillStyle = 'rgba(255,255,255,1)';
    for (let r = 0; r < 3; r++) {
      const y = top + 0.018 + r * 0.024, gap = 0.09 + r * 0.03, k = 0.5 + r * 0.35, off = (mov(g.scroll, k, gap) % gap + gap) % gap;
      ctx.globalAlpha = A * (0.16 + r * 0.06);
      for (let x = -off + (r % 2) * gap / 2; x < W; x += gap) ctx.fillRect(x, y + Math.sin(t * hz(2) + x * 9) * 0.002, 0.03 + r * 0.008, 0.0035);
    }
    ctx.globalAlpha = A;
  }
  /**
   * The street, scrolling at the course's speed: a sidewalk of tiles with a lit curb, then the asphalt,
   * flecked, with its lane's dashes and, from the afternoon on, the lamps' glow on it.
   */
  function ground(g, P) {
    const Y = GROUND, side = 0.028, curb = 0.007, road = Y + side + curb;
    const dusk = P.lamps;
    // The sidewalk: lighter by day, tiles whose seams run with the speed
    const sw = ctx.createLinearGradient(0, Y, 0, Y + side);
    sw.addColorStop(0, css(mix([120, 92, 170, 1], [40, 18, 66, 1], dusk))); sw.addColorStop(1, css(mix([88, 64, 138, 1], [28, 11, 50, 1], dusk)));
    ctx.fillStyle = sw; ctx.fillRect(0, Y, W, side);
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(0, Y, W, 0.002);
    ctx.fillStyle = 'rgba(14,5,28,0.35)';
    const to = mov(g.scroll, 1, 0.06) % 0.06; for (let x = -to; x < W; x += 0.06) ctx.fillRect(x, Y, 0.0025, side);
    // The curb: a neon edge, its glow a wide see-through line
    ctx.fillStyle = 'rgba(255,46,136,0.22)'; ctx.fillRect(0, Y + side - 0.004, W, curb + 0.008);
    ctx.fillStyle = '#ff2e88'; ctx.fillRect(0, Y + side, W, curb * 0.6);
    ctx.fillStyle = 'rgba(21,7,38,0.9)'; ctx.fillRect(0, Y + side + curb * 0.6, W, curb * 0.4);
    // The asphalt, darker toward the bottom, with flecks that scroll
    const as = ctx.createLinearGradient(0, road, 0, 1);
    as.addColorStop(0, css(mix([52, 34, 84, 1], [22, 9, 40, 1], dusk))); as.addColorStop(1, css(mix([30, 18, 52, 1], [10, 4, 20, 1], dusk)));
    ctx.fillStyle = as; ctx.fillRect(0, road, W, 1 - road);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    const fo = (mov(g.scroll, 1, 1) % 1 + 1) % 1;
    for (const f of sky.flecks) { const x = ((f.x - fo) % 1 + 1) % 1 * (W + 0.1) - 0.05; ctx.fillRect(x, road + f.y * (1 - road), f.s, f.s * 0.6); }
    // The lamps' pools of light on the road, from the afternoon on
    if (dusk > 0.01) {
      const lo = mov(g.scroll, 0.6, 0.4) % 0.4;
      for (let x = -lo; x < W + 0.1; x += 0.4) {
        ctx.globalAlpha = dusk * 0.14; ctx.fillStyle = '#ffd23f';
        ctx.beginPath(); ctx.ellipse(x + 0.014, road + 0.012, 0.06, 0.008, 0, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // The lane: dashes with a soft glow, at the speed of the course
    const ly = road + (1 - road) * 0.5, off = mov(g.scroll, 1, 0.16) % 0.16;
    for (let x = -off; x < W; x += 0.16) {
      ctx.fillStyle = 'rgba(46,230,214,0.18)'; ctx.fillRect(x - 0.003, ly - 0.004, 0.076, 0.014);
      ctx.fillStyle = 'rgba(46,230,214,0.7)'; ctx.fillRect(x, ly, 0.07, 0.006);
    }
  }
  function wall(h) {
    if (!h.wall) return;
    const x0 = h.x - WALL / 2, faded = h.ok < 0 ? 0.45 : 1;
    ctx.globalAlpha = faded;
    for (const [y0, y1] of [[-0.05, h.y - h.r], [h.y + h.r, GROUND]]) {
      if (y1 <= y0) continue;
      ctx.fillStyle = 'rgba(30,8,52,0.94)'; ctx.fillRect(x0, y0, WALL, y1 - y0);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, WALL, y1 - y0); ctx.clip();   // warning stripes
      ctx.strokeStyle = 'rgba(255,46,136,0.22)'; ctx.lineWidth = 0.014; ctx.beginPath();
      for (let yy = y0 - WALL; yy < y1 + WALL; yy += 0.045) { ctx.moveTo(x0, yy + WALL); ctx.lineTo(x0 + WALL, yy); }
      ctx.stroke(); ctx.restore();
      ctx.strokeStyle = 'rgba(255,46,136,0.25)'; ctx.lineWidth = 0.02; ctx.strokeRect(x0, y0, WALL, y1 - y0);
      ctx.strokeStyle = '#ff2e88'; ctx.lineWidth = 0.005; ctx.strokeRect(x0, y0, WALL, y1 - y0);
    }
    if (h.bare && h.ok >= 0) {   // the opening's lips, lit so the way through reads at a glance
      ctx.fillStyle = h.flash > 0 ? '#9dff3a' : '#2ee6d6';
      ctx.fillRect(x0 - 0.008, h.y - h.r - 0.008, WALL + 0.016, 0.012);
      ctx.fillRect(x0 - 0.008, h.y + h.r - 0.004, WALL + 0.016, 0.012);
      ctx.globalAlpha = 0.12 * faded; ctx.fillRect(x0, h.y - h.r, WALL, h.r * 2);
    }
    ctx.globalAlpha = 1;
  }
  /** Half a hoop: the back half before the bird, the front half after, so it flies through. */
  function hoopHalf(h, front) {
    if (h.bare) return;
    const c = h.ok > 0 && h.flash > 0 ? (h.ok === 2 ? '#ffd23f' : '#9dff3a') : h.color;
    const base = h.ok < 0 ? 0.3 : front ? 1 : 0.55;
    ctx.strokeStyle = c; ctx.lineCap = 'round';
    ctx.beginPath();
    if (front) ctx.ellipse(h.x, h.y, h.r * 0.34, h.r, 0, Math.PI / 2, Math.PI * 1.5);
    else ctx.ellipse(h.x, h.y, h.r * 0.34, h.r, 0, -Math.PI / 2, Math.PI / 2);
    ctx.globalAlpha = base * 0.22; ctx.lineWidth = 0.05 + h.flash * 0.02; ctx.stroke();   // the glow
    ctx.globalAlpha = base; ctx.lineWidth = 0.02 + h.flash * 0.01; ctx.stroke();
    if (front) {
      ctx.fillStyle = '#fff';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(h.x, h.y + s * h.r, RIM * 0.75, 0, 7); ctx.fill(); }
      if (h.amp && h.ok >= 0) {   // a faint track shows the hoop moves
        ctx.globalAlpha = 0.18; ctx.setLineDash([0.01, 0.015]); ctx.lineWidth = 0.004;
        ctx.beginPath(); ctx.moveTo(h.x, h.baseY - h.amp - h.r); ctx.lineTo(h.x, h.baseY + h.amp + h.r); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    ctx.globalAlpha = 1;
  }
  function bird(g) {
    const b = g.bird, R = BR;
    if (g.shield > 0 && g.mode === 'play' && Math.floor(g.shield * 12) % 2) ctx.globalAlpha = 0.35;   // blinks while shielded
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(g.mode === 'dying' || g.mode === 'over' ? b.spin : b.rot);
    if (glow > 0) {   // lit up after a dead center, and a touch bigger for a moment
      const s = glowSprite.size * (1 + 0.15 * glow);
      ctx.globalAlpha = glow; ctx.drawImage(glowSprite.c, -s / 2, -s / 2, s, s); ctx.globalAlpha = 1;
      const pop = 1 + 0.08 * Math.sin(Math.min(1, (1 - glow) * 4) * Math.PI); ctx.scale(pop, pop);
    }
    ctx.drawImage(birdSprite.c, -birdSprite.size / 2, -birdSprite.size / 2, birdSprite.size, birdSprite.size);
    if (g.mode === 'dying' || g.mode === 'over') {   // ✕ eyes
      ctx.strokeStyle = '#150726'; ctx.lineWidth = R * 0.1; ctx.beginPath();
      ctx.moveTo(R * 0.3, -R * 0.5); ctx.lineTo(R * 0.65, -R * 0.15); ctx.moveTo(R * 0.65, -R * 0.5); ctx.lineTo(R * 0.3, -R * 0.15); ctx.stroke();
    } else { ctx.fillStyle = '#150726'; ctx.beginPath(); ctx.arc(R * 0.55, -R * 0.3, R * 0.15, 0, 7); ctx.fill(); }
    // The wing: up on a flap, then it settles; flutters while hovering
    const wa = 0.5 - b.flapT * 1.6 + (g.mode === 'ready' && !QUIET ? Math.sin(g.clock * 14) * 0.4 : 0);
    ctx.save(); ctx.translate(-R * 0.15, R * 0.05); ctx.rotate(wa);
    ctx.fillStyle = '#2ee6d6'; ctx.beginPath(); ctx.ellipse(-R * 0.45, 0, R * 0.62, R * 0.32, 0, 0, 7); ctx.fill();
    ctx.restore();
    ctx.restore(); ctx.globalAlpha = 1;
  }

  function draw(g) {
    if (!CH) return;
    ctx.setTransform(dpr * CH, 0, 0, dpr * CH, 0, 0);
    ctx.clearRect(0, 0, W, 1);
    if (shake > 0 && !QUIET) ctx.translate(rnd(-1, 1) * shake * 0.03, rnd(-1, 1) * shake * 0.03);
    background(g);
    for (const h of g.gates) wall(h);
    for (const h of g.gates) hoopHalf(h, false);
    for (const z of g.spikes) stamp(spikeSprite, z.x, z.y, z.a);
    bird(g);
    for (const h of g.gates) hoopHalf(h, true);
    for (const p of parts) {
      const k = p.life / p.max; ctx.globalAlpha = k; ctx.fillStyle = p.c;
      if (p.star) sparkle(p.x, p.y, p.s * (0.5 + 0.5 * k), p.rot); else { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill(); }
    }
    for (const p of pulses) {
      const k = (g.clock - p.born) / 0.75; if (k < 0) continue;
      const r = 0.01 + (1 - (1 - k) * (1 - k)) * p.max;
      ctx.strokeStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7);
      ctx.globalAlpha = 0.3 * (1 - k); ctx.lineWidth = 0.022 * (1 - k) + 0.004; ctx.stroke();
      ctx.globalAlpha = 1 - k; ctx.lineWidth = 0.008 * (1 - k) + 0.002; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // The points, in pixels so the font renders crisp: they pop, rise and fade
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (flashT > 0) { ctx.fillStyle = `rgba(255,210,63,${0.07 * flashT / 0.25})`; ctx.fillRect(0, 0, CW, CH); }
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    for (const f of floats) {
      const k = 1 - f.life / f.max;
      const size = CH * (f.big ? 0.065 : 0.045) * (1 + (f.big ? 0.2 : 0.12) * Math.sin(Math.min(1, k * 3) * Math.PI));
      const y = (f.y - (1 - (1 - k) * (1 - k)) * 0.07) * CH;
      ctx.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
      ctx.font = `${Math.round(size)}px Bangers, Impact, sans-serif`;
      ctx.lineWidth = Math.max(3, size * 0.14); ctx.strokeStyle = 'rgba(21,7,38,0.9)'; ctx.fillStyle = f.c;
      ctx.strokeText(f.text, f.x * CH, y); ctx.fillText(f.text, f.x * CH, y);
    }
    ctx.globalAlpha = 1;
  }

  return { measure, draw, fx, tick, clear };
}

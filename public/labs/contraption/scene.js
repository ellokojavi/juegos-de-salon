/**
 * Artilugio's drawing: the workshop at night, all drawn on the canvas (no image files), in the app's neon:
 * a dotted grid, wooden ramps and planks with brass bolts, a coiled trampoline that squashes, a fan whose
 * blades spin and whose breeze shows, violet steel girders, glowing red spikes, a woven basket that
 * glows, a pipe the ball drops from, the ball with its light and shadow, and particles for the moments
 * that matter (a bounce, a pop, a win). Colours are read from the design tokens of base.css.
 */
import { COLS, ROWS, R } from './engine.js';

export function escena(canvas) {
  const ctx = canvas.getContext('2d');
  let px = 40, dpr = 1;
  const C = {};
  const sparks = [];          // particles: { x, y, vx, vy, life, max, colour, size }
  const squash = new Map();   // part → seconds left of its bounce
  let spin = 0, clock = 0;
  colours();   // before the first measure: the cover's demo may draw first

  function colours() {
    const s = getComputedStyle(document.documentElement);
    for (const k of ['yellow', 'cyan', 'pink', 'lime', 'orange', 'purple', 'ink', 'muted', 'red', 'bg1']) C[k] = s.getPropertyValue(`--${k}`).trim() || '#fff';
  }
  function size() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return false;
    dpr = devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    px = canvas.width / COLS; colours();
    return true;
  }
  const X = v => v * px;
  const glow = (colour, blur) => { ctx.shadowColor = colour; ctx.shadowBlur = blur * dpr; };
  const noGlow = () => { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; };

  /** A thick bar between two points, with a gradient across it and rounded ends */
  function bar(x1, y1, x2, y2, w, c1, c2, shine = true) {
    const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
    ctx.save(); ctx.translate(X(x1), X(y1)); ctx.rotate(ang);
    const h = X(w), g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-h / 2, -h / 2, X(len) + h, h, h / 2); ctx.fill();
    if (shine) { ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.roundRect(0, -h / 2 + h * 0.12, X(len), h * 0.2, h * 0.1); ctx.fill(); }
    ctx.restore();
  }
  function bolt(x, y, colour = '#d9b26a') {
    const r = X(0.07), g = ctx.createRadialGradient(X(x) - r / 3, X(y) - r / 3, 0, X(x), X(y), r);
    g.addColorStop(0, '#fff6d8'); g.addColorStop(1, colour);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X(x), X(y), r, 0, 7); ctx.fill();
  }

  /* The parts */
  function wood(x1, y1, x2, y2, fixed) {
    // Fixed parts in a cooler, darker wood with steel bolts, so they read as not yours
    const [a, b] = fixed ? ['#8a7397', '#4b3b5c'] : ['#ffb45e', '#b8612a'];
    ctx.save(); glow(fixed ? 'transparent' : 'rgba(255,150,60,0.45)', 10); bar(x1, y1, x2, y2, 0.2, a, b); ctx.restore();
    // grain
    ctx.save(); ctx.strokeStyle = fixed ? 'rgba(255,255,255,0.08)' : 'rgba(90,40,10,0.35)'; ctx.lineWidth = Math.max(1, X(0.015));
    for (const t of [0.3, 0.62]) { ctx.beginPath(); ctx.moveTo(X(x1 + (x2 - x1) * (t - 0.12)), X(y1 + (y2 - y1) * (t - 0.12)) + X(0.03)); ctx.lineTo(X(x1 + (x2 - x1) * t), X(y1 + (y2 - y1) * t) + X(0.03)); ctx.stroke(); }
    ctx.restore();
    bolt(x1 + (x2 - x1) * 0.08, y1 + (y2 - y1) * 0.08, fixed ? '#9aa3b5' : '#d9b26a');
    bolt(x1 + (x2 - x1) * 0.92, y1 + (y2 - y1) * 0.92, fixed ? '#9aa3b5' : '#d9b26a');
  }
  function spring(p, fixed) {
    const { c, r } = p, k = squash.get(p) || 0, press = Math.sin(Math.min(1, k / 0.25) * Math.PI) * 0.12;
    const top = r + 0.75 + press, base = r + 0.98;
    // feet
    ctx.fillStyle = '#3a2f4d'; ctx.beginPath(); ctx.roundRect(X(c + 0.15), X(base - 0.06), X(1.7), X(0.08), X(0.04)); ctx.fill();
    // coils
    ctx.save(); ctx.strokeStyle = '#c9d2e3'; ctx.lineWidth = X(0.035); ctx.lineJoin = 'round';
    for (const cx of [c + 0.45, c + 1.55]) {
      ctx.beginPath(); const n = 5;
      for (let i = 0; i <= n; i++) { const y = base - 0.06 - (base - 0.06 - top) * i / n, x = cx + (i % 2 ? 0.12 : -0.12); i ? ctx.lineTo(X(x), X(y)) : ctx.moveTo(X(x), X(y)); }
      ctx.stroke();
    }
    ctx.restore();
    // the pad
    ctx.save(); glow(C.lime, k > 0 ? 22 : 12); bar(c + 0.1, top, c + 1.9, top, 0.14, fixed ? '#9fbf7a' : C.lime, fixed ? '#4f6b3a' : '#2fa35c'); ctx.restore();
  }
  function fan(p, fixed) {
    const { c, r, dir } = p, cx = c + 1, cy = r + 0.42;
    // breeze: soft streaks drifting out of the fan's mouth across its reach
    ctx.save();
    for (let k = 0; k < 6; k++) {
      const t = (clock * 0.9 + k / 6) % 1, len = 0.5, from = dir > 0 ? c + 1.4 + t * 3.3 : c + 0.6 - t * 3.3, y = r - 0.6 + (k % 3) * 0.55 + Math.sin(clock * 3 + k) * 0.05;
      ctx.globalAlpha = 0.35 * Math.sin(t * Math.PI); ctx.strokeStyle = C.cyan; ctx.lineWidth = X(0.04); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(from), X(y)); ctx.lineTo(X(from + len * dir), X(y)); ctx.stroke();
    }
    ctx.restore();
    // the housing
    ctx.save(); glow(C.cyan, 12);
    const g = ctx.createLinearGradient(0, X(r), 0, X(r + 0.95));
    g.addColorStop(0, fixed ? '#5d6c84' : '#2b6f86'); g.addColorStop(1, fixed ? '#2e3646' : '#123747');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(X(c + 0.12), X(r + 0.02), X(1.76), X(0.92), X(0.18)); ctx.fill(); noGlow();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = Math.max(1, X(0.02)); ctx.stroke();
    // the grille's ring and spinning blades
    ctx.translate(X(cx), X(cy)); ctx.strokeStyle = 'rgba(160,240,255,0.5)'; ctx.beginPath(); ctx.arc(0, 0, X(0.36), 0, 7); ctx.stroke();
    ctx.rotate(spin * dir);
    ctx.fillStyle = C.cyan;
    for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.ellipse(X(0.17), 0, X(0.17), X(0.07), 0.3, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#e8fbff'; ctx.beginPath(); ctx.arc(0, 0, X(0.06), 0, 7); ctx.fill();
    ctx.restore();
    // which way it blows: a small chevron on the side it faces
    ctx.save(); ctx.fillStyle = C.cyan; ctx.globalAlpha = 0.9;
    const ax = dir > 0 ? c + 1.98 : c + 0.02;
    ctx.beginPath(); ctx.moveTo(X(ax), X(cy)); ctx.lineTo(X(ax - 0.14 * dir), X(cy - 0.12)); ctx.lineTo(X(ax - 0.14 * dir), X(cy + 0.12)); ctx.fill(); ctx.restore();
  }
  function part(p, fixed = false) {
    const { c, r } = p;
    if (p.type === 'ramp') p.dir > 0 ? wood(c, r + 0.1, c + 2, r + 0.9, fixed) : wood(c, r + 0.9, c + 2, r + 0.1, fixed);
    else if (p.type === 'plank') wood(c, r + 0.8, c + 2, r + 0.8, fixed);
    else if (p.type === 'spring') spring(p, fixed);
    else if (p.type === 'fan') fan(p, fixed);
  }

  /* The level's own pieces */
  function girder(f) {
    ctx.save(); glow(C.purple, 14); bar(f.x1, f.y1, f.x2, f.y2, 0.18, '#a98bff', '#5b3fc4'); ctx.restore();
    const n = Math.max(1, Math.round(Math.hypot(f.x2 - f.x1, f.y2 - f.y1)));
    for (let i = 0; i <= n; i++) bolt(f.x1 + (f.x2 - f.x1) * i / n, f.y1 + (f.y2 - f.y1) * i / n, '#c7b8ff');
  }
  function spikes(f) {
    ctx.save(); glow(C.red, 12 + Math.sin(clock * 4) * 4);
    const n = f.w * 3, w = 1 / 3;
    for (let i = 0; i < n; i++) {
      const x = f.c + i * w, g = ctx.createLinearGradient(0, X(f.r + 0.55), 0, X(f.r + 1));
      g.addColorStop(0, '#ffd1d9'); g.addColorStop(0.35, C.red); g.addColorStop(1, '#6d0f2a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X(x + 0.02), X(f.r + 1)); ctx.lineTo(X(x + w / 2), X(f.r + 0.55)); ctx.lineTo(X(x + w - 0.02), X(f.r + 1)); ctx.fill();
    }
    ctx.restore();
  }
  function basket(g, won) {
    const { c, r } = g, x0 = c + 0.1, x1 = c + 1.9, top = r + 0.05, bot = r + 1;
    const pulse = won ? 30 : 14 + Math.sin(clock * 3) * 5;
    // a soft light inside
    const lg = ctx.createRadialGradient(X(c + 1), X(r + 0.6), 0, X(c + 1), X(r + 0.6), X(1.2));
    lg.addColorStop(0, 'rgba(255,214,79,0.28)'); lg.addColorStop(1, 'rgba(255,214,79,0)');
    ctx.fillStyle = lg; ctx.fillRect(X(c - 0.3), X(r - 0.4), X(2.6), X(1.6));
    // the woven body
    ctx.save(); glow(C.yellow, pulse);
    ctx.beginPath(); ctx.moveTo(X(x0), X(top)); ctx.lineTo(X(x0 + 0.1), X(bot)); ctx.lineTo(X(x1 - 0.1), X(bot)); ctx.lineTo(X(x1), X(top));
    ctx.strokeStyle = C.yellow; ctx.lineWidth = X(0.09); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); noGlow();
    ctx.clip(); ctx.strokeStyle = 'rgba(255,214,79,0.35)'; ctx.lineWidth = X(0.03);
    for (let y = top + 0.25; y < bot; y += 0.22) { ctx.beginPath(); ctx.moveTo(X(x0), X(y)); ctx.lineTo(X(x1), X(y)); ctx.stroke(); }
    for (let x = x0 + 0.2; x < x1; x += 0.3) { ctx.beginPath(); ctx.moveTo(X(x), X(top)); ctx.lineTo(X(x), X(bot)); ctx.stroke(); }
    ctx.restore();
    // the rim
    ctx.save(); glow(C.yellow, 10); bar(x0 - 0.04, top, x1 + 0.04, top, 0.1, '#fff1a8', '#f2a81d', false); ctx.restore();
  }
  function pipe(s) {
    ctx.save();
    const g = ctx.createLinearGradient(X(s.x - 0.45), 0, X(s.x + 0.45), 0);
    g.addColorStop(0, '#59607a'); g.addColorStop(0.45, '#c9cfe0'); g.addColorStop(1, '#3d4257');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(X(s.x - 0.42), X(-0.2), X(0.84), X(0.52), [0, 0, X(0.08), X(0.08)]); ctx.fill();
    ctx.fillRect(X(s.x - 0.5), X(0.26), X(1), X(0.1));
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.ellipse(X(s.x), X(0.36), X(0.38), X(0.06), 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  function ball(b, roll) {
    const x = X(b.x), y = X(b.y), r = X(R);
    ctx.save(); glow(C.pink, 18);
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffd0ea'); g.addColorStop(0.35, C.pink); g.addColorStop(1, '#8c0f52');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); noGlow();
    // a stripe that turns as it rolls
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = r * 0.22;
    ctx.beginPath(); ctx.ellipse(x, y, r * Math.abs(Math.cos(roll)) + 0.5, r, 0, 0, 7); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.14, -0.6, 0, 7); ctx.fill();
  }

  /** The whole board. s: { board, run, chosen, picked, ghost: {type,c,r,dir,ok}, trail, roll, won } */
  function draw(s) {
    if (!s.board || !canvas.width) return;
    const { level } = s.board, building = !s.run;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // the floor: a soft violet light from the top, dots at the grid's corners
    const bg = ctx.createRadialGradient(canvas.width / 2, 0, 0, canvas.width / 2, 0, canvas.height);
    bg.addColorStop(0, 'rgba(120,70,220,0.22)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = building ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)';
    for (let c = 1; c < COLS; c++) for (let r = 1; r < ROWS; r++) { ctx.beginPath(); ctx.arc(X(c), X(r), Math.max(1, X(0.03)), 0, 7); ctx.fill(); }
    // while a part is picked, the free cells it can go to glow faintly
    if (building && s.free) { ctx.fillStyle = 'rgba(255,214,79,0.06)'; for (const [c, r] of s.free) { ctx.beginPath(); ctx.roundRect(X(c) + 2, X(r) + 2, X(1) - 4, X(1) - 4, X(0.12)); ctx.fill(); } }
    for (const f of level.fixed) if (f.type === 'spikes') spikes(f);
    for (const f of level.fixed) if (f.type === 'wall') girder(f);
    for (const f of level.fixed) if (f.type !== 'wall' && f.type !== 'spikes') part(f, true);
    basket(level.goal, s.won);
    pipe(level.start);
    for (const p of s.board.placed) {
      if (p === s.chosen && building) {
        ctx.save(); ctx.strokeStyle = C.yellow; ctx.lineWidth = Math.max(2, X(0.03)); ctx.setLineDash([X(0.12), X(0.08)]); ctx.lineDashOffset = -clock * 20;
        ctx.beginPath(); ctx.roundRect(X(p.c) + 3, X(p.r) + 3, X(2) - 6, X(1) - 6, X(0.15)); ctx.stroke(); ctx.restore();
      }
      part(p);
    }
    if (s.ghost && building) {
      ctx.save(); ctx.globalAlpha = 0.45; part(s.ghost); ctx.restore();
      if (!s.ghost.ok) { ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.strokeRect(X(s.ghost.c) + 2, X(s.ghost.r) + 2, X(2) - 4, X(1) - 4); ctx.restore(); }
    }
    // the trail, then the ball
    s.trail.forEach(([x, y], i) => { ctx.globalAlpha = 0.3 * i / s.trail.length; ctx.fillStyle = C.pink; ctx.beginPath(); ctx.arc(X(x), X(y), X(R) * (0.3 + 0.5 * i / s.trail.length), 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
    if (!s.popped) ball(s.run ? s.run.ball : level.start, s.roll || 0);
    // particles
    for (const p of sparks) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.colour; ctx.beginPath(); ctx.arc(X(p.x), X(p.y), X(p.size), 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  /** Time passes for the moving bits: the blades, the springs, the particles. */
  function tick(dt) {
    clock += dt; spin += dt * 9;
    for (const [p, k] of squash) k - dt <= 0 ? squash.delete(p) : squash.set(p, k - dt);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.life -= dt; p.vy += 9 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0) sparks.splice(i, 1);
    }
  }
  const busy = () => sparks.length > 0 || squash.size > 0;
  function burst(x, y, colours, n = 18, speed = 4) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random());
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.5, life: 0.6 + Math.random() * 0.6, max: 1.2, colour: colours[i % colours.length], size: 0.04 + Math.random() * 0.05 });
    }
  }
  function boing(part) { squash.set(part, 0.25); }
  return { size, draw, tick, burst, boing, busy, get C() { return C; } };
}

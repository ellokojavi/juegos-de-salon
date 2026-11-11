/**
 * Artefactos' drawing, in the flat neon of the other games (Tren en Vilo's beams): all drawn on the canvas,
 * no image files. A night sky with stars and hills over a dotted grid, the floor that blows the ball up
 * marked in cyan; ramps and planks as yellow beams with pink joints (the level's fixed ones in steel
 * grey), a coiled trampoline that squashes, a fan whose blades spin and whose breeze shows, violet
 * girders, spikes as Aletazo's spinning neon stars on a red rail, a green cup with pink rims, a cyan neon
 * tube the ball waits in and drops out of, a flat pink ball. What the ball touches lights up where it touches, as strong as the
 * blow: a faint line where it rolls, a flash and a ring on a hard hit, a few sparks on the hardest.
 * Colours are read from the design tokens of base.css.
 */
import { COLS, ROWS, R } from './engine.js';

export function escena(canvas) {
  const ctx = canvas.getContext('2d');
  let px = 40, dpr = 1;
  const C = {};
  const sparks = [];          // particles: { x, y, vx, vy, life, max, colour, size }
  const squash = new Map();   // part → seconds left of its bounce
  const rings = [];           // shock waves: { x, y, t }
  const glows = [];           // where the ball touched: { seg, x, y, k (0 a roll … 1 a hard blow), life, max, colour }
  const pings = [];           // the ring of a hard hit: { x, y, k, t }
  let shake = 0, spin = 0, clock = 0;
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
    const fill = fixed ? '#8f86a8' : C.yellow;
    bar(x1, y1, x2, y2, 0.26, 'rgba(10,4,24,0.85)', 'rgba(10,4,24,0.85)', false);
    bar(x1, y1, x2, y2, 0.17, fill, fill, false);
    ctx.save(); ctx.strokeStyle = 'rgba(60,30,0,0.45)'; ctx.lineWidth = Math.max(1, X(0.03)); ctx.setLineDash([X(0.14), X(0.1)]);
    ctx.beginPath(); ctx.moveTo(X(x1), X(y1)); ctx.lineTo(X(x2), X(y2)); ctx.stroke(); ctx.restore();
    for (const [x, y] of [[x1, y1], [x2, y2]]) { ctx.fillStyle = fixed ? '#cfd3e0' : C.pink; ctx.strokeStyle = '#fff'; ctx.lineWidth = X(0.04); ctx.beginPath(); ctx.arc(X(x), X(y), X(0.11), 0, 7); ctx.fill(); ctx.stroke(); }
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
    bar(f.x1, f.y1, f.x2, f.y2, 0.3, 'rgba(10,4,24,0.85)', 'rgba(10,4,24,0.85)', false);
    bar(f.x1, f.y1, f.x2, f.y2, 0.2, C.purple, C.purple, false);
    const n = Math.max(1, Math.round(Math.hypot(f.x2 - f.x1, f.y2 - f.y1)));
    for (let i = 0; i <= n; i++) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(X(f.x1 + (f.x2 - f.x1) * i / n), X(f.y1 + (f.y2 - f.y1) * i / n), X(0.045), 0, 7); ctx.fill(); }
  }
  /** One of Aletazo's spikes: a pink sixteen-point star with a red halo and a dark eye, turned by `a` */
  function star(x, y, rr, a) {
    const h = ctx.createRadialGradient(X(x), X(y), X(rr * 0.5), X(x), X(y), X(rr * 1.8));
    h.addColorStop(0, `rgba(224,36,60,${0.45 + 0.15 * Math.sin(clock * 4)})`); h.addColorStop(1, 'rgba(224,36,60,0)');
    ctx.fillStyle = h; ctx.beginPath(); ctx.arc(X(x), X(y), X(rr * 1.8), 0, 7); ctx.fill();
    ctx.fillStyle = C.pink; ctx.beginPath();
    for (let i = 0; i < 16; i++) { const t = a + i / 16 * Math.PI * 2, r = i % 2 ? rr * 0.5 : rr; ctx.lineTo(X(x + Math.cos(t) * r), X(y + Math.sin(t) * r)); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.bg1; ctx.beginPath(); ctx.arc(X(x), X(y), X(rr * 0.25), 0, 7); ctx.fill();
  }
  function spikes(f) {
    // A red rail on the line the ball pops on, and two spinning stars per cell along it, turning both ways
    const y = f.r + 0.7;
    ctx.save(); glow(C.red, 8); ctx.strokeStyle = C.red; ctx.lineWidth = X(0.05); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(X(f.c + 0.12), X(y)); ctx.lineTo(X(f.c + f.w - 0.12), X(y)); ctx.stroke(); ctx.restore();
    for (let i = 0; i < f.w * 2; i++) star(f.c + (i + 0.5) / 2, y, 0.2, clock * 1.6 * (i % 2 ? 1 : -1) + i);
  }
  function basket(g, won) {
    const { c, r } = g, x0 = c + 0.1, x1 = c + 1.9, top = r + 0.05, bot = r + 1;
    const pulse = won ? 30 : 14 + Math.sin(clock * 3) * 5;
    // a soft light inside
    const lg = ctx.createRadialGradient(X(c + 1), X(r + 0.6), 0, X(c + 1), X(r + 0.6), X(1.2));
    lg.addColorStop(0, 'rgba(157,255,58,0.22)'); lg.addColorStop(1, 'rgba(157,255,58,0)');
    ctx.fillStyle = lg; ctx.fillRect(X(c - 0.3), X(r - 0.4), X(2.6), X(1.6));
  }
  /** The basket's weave and rim, drawn over the ball so a ball inside reads as inside */
  function basketFront(g, won) {
    const { c, r } = g, x0 = c + 0.12, x1 = c + 1.88, top = r + 0.1, bot = r + 1;
    ctx.save(); glow(C.lime, won ? 26 : 10 + Math.sin(clock * 3) * 4);
    ctx.beginPath(); ctx.moveTo(X(x0), X(top)); ctx.lineTo(X(x0 + 0.08), X(bot)); ctx.lineTo(X(x1 - 0.08), X(bot)); ctx.lineTo(X(x1), X(top));
    ctx.strokeStyle = C.lime; ctx.lineWidth = X(0.12); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
    for (const x of [x0, x1]) { ctx.fillStyle = C.pink; ctx.strokeStyle = '#fff'; ctx.lineWidth = X(0.04); ctx.beginPath(); ctx.arc(X(x), X(top), X(0.11), 0, 7); ctx.fill(); ctx.stroke(); }
  }
  /* The pipe the ball drops from: a cyan neon tube, the ball waiting hidden inside it (the start's cell is
     kept free, so the tube fits in it), light flowing down it, a bright rim at its mouth */
  const PIPE = { top: -0.3, bot: 0.96, w: 0.42 };
  /** The soft cone of light under the mouth, drawn with the floor so the parts sit over it */
  function pipeLight(s) {
    const { bot, w } = PIPE, x = s.x, cone = ctx.createLinearGradient(0, X(bot), 0, X(bot + 1.2));
    cone.addColorStop(0, 'rgba(46,230,214,0.2)'); cone.addColorStop(1, 'rgba(46,230,214,0)');
    ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(X(x - w), X(bot)); ctx.lineTo(X(x + w), X(bot)); ctx.lineTo(X(x + w * 1.8), X(bot + 1.2)); ctx.lineTo(X(x - w * 1.8), X(bot + 1.2)); ctx.fill();
  }
  /** The tube itself, opaque and drawn over the ball, so the ball waits hidden inside it until it drops out */
  function pipe(s) {
    const { top, bot, w } = PIPE, x = s.x;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(X(x - w), X(top), X(w * 2), X(bot - top), X(0.1));
    ctx.fillStyle = C.bg1; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(46,230,214,0.5)'; ctx.lineWidth = X(0.05); ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const y = top + ((clock * 0.9 + k / 3) % 1) * (bot - top); ctx.beginPath(); ctx.moveTo(X(x - 0.16), X(y - 0.08)); ctx.lineTo(X(x), X(y)); ctx.lineTo(X(x + 0.16), X(y - 0.08)); ctx.stroke(); }
    // a glint down the glass
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(X(x - w + 0.08), X(top), X(0.06), X(bot - top - 0.1));
    ctx.restore();
    glow(C.cyan, 14); ctx.strokeStyle = C.cyan; ctx.lineWidth = X(0.06); ctx.stroke();
    glow(C.cyan, 18 + 6 * Math.sin(clock * 4)); bar(x - w - 0.08, bot, x + w + 0.08, bot, 0.12, '#e8fbff', C.cyan, false);
    ctx.restore();
  }
  function ball(b, roll) {
    const x = X(b.x), y = X(b.y), r = X(R);
    ctx.save(); glow(C.pink, 12); ctx.fillStyle = C.pink; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = X(0.05); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, 7); ctx.fill();
  }

  /** The whole board. s: { board, run, chosen, fading: {part,a}, picked, ghost: {type,c,r,dir,ok}, trail, roll, won } */
  function draw(s) {
    if (!s.board || !canvas.width) return;
    const { level } = s.board, building = !s.run;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the canvas always matches its box, so the ball stays round (a stage can start mid-layout)
    const w = Math.round(canvas.clientWidth * (devicePixelRatio || 1)), h = Math.round(canvas.clientHeight * (devicePixelRatio || 1));
    if (w && (w !== canvas.width || h !== canvas.height)) size();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // the board shakes for a moment after an explosion
    if (shake > 0) ctx.translate((Math.random() - 0.5) * X(0.25) * shake, (Math.random() - 0.5) * X(0.25) * shake);
    { const W = canvas.width, H = canvas.height, sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#1d3a8a'); sky.addColorStop(0.65, '#2a1466'); sky.addColorStop(1, '#3a0f55');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 26; i++) { const h1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, h2 = Math.abs(Math.sin(i * 78.233) * 12543.123) % 1, sx = h1 * W, sy = h2 * H * 0.7; ctx.beginPath(); ctx.arc(sx, sy, X(0.025) + (i % 3) * 0.4, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(20,10,50,0.55)'; ctx.beginPath(); ctx.moveTo(0, H * 0.8); for (let k = 0; k <= 8; k++) ctx.lineTo(W * k / 8, H * (0.74 + 0.06 * Math.sin(k * 1.7))); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      for (let c = 1; c < COLS; c++) for (let r = 1; r < ROWS; r++) { ctx.beginPath(); ctx.arc(X(c), X(r), Math.max(1.2, X(0.035)), 0, 7); ctx.fill(); }
      ctx.fillStyle = C.cyan; ctx.globalAlpha = 0.8; ctx.fillRect(0, H - X(0.08), W, X(0.08)); ctx.globalAlpha = 1; }
    for (const f of level.fixed) if (f.type === 'spikes') spikes(f);
    for (const f of level.fixed) if (f.type === 'wall') girder(f);
    for (const f of level.fixed) if (f.type !== 'wall' && f.type !== 'spikes') part(f, true);
    basket(level.goal, s.won);
    pipeLight(level.start);
    // While building, the ball waits up in the tube, barely seen; on Probar it lights up and slides down
    // (s.emerge 0→1), then falls out of the mouth. The tube is drawn over it either way.
    const tucked = !s.run || (s.emerge ?? 1) < 1;
    for (const p of s.board.placed) {
      if (p === s.dragging) continue;   // it floats as the ghost while it is dragged
      // the chosen part's dashed outline; a part just let go keeps it a moment, fading out (s.fading: { part, a })
      const outline = p === s.chosen ? 1 : s.fading?.part === p ? s.fading.a : 0;
      if (outline > 0 && building) {
        ctx.save(); ctx.globalAlpha = outline; ctx.strokeStyle = C.yellow; ctx.lineWidth = Math.max(2, X(0.03)); ctx.setLineDash([X(0.12), X(0.08)]); ctx.lineDashOffset = -clock * 20;
        ctx.beginPath(); ctx.roundRect(X(p.c) + 3, X(p.r) + 3, X(2) - 6, X(1) - 6, X(0.15)); ctx.stroke(); ctx.restore();
      }
      part(p);
    }
    if (s.hint && building) {
      // a hint: where one part of an answer goes, a pulsing cyan slot with the part faint over it
      const g = s.hint, a = 0.55 + 0.35 * Math.sin(clock * 6);
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.cyan; ctx.lineWidth = Math.max(2, X(0.04)); ctx.setLineDash([X(0.1), X(0.07)]); glow(C.cyan, 14);
      ctx.beginPath(); ctx.roundRect(X(g.c) + 2, X(g.r) + 2, X(2) - 4, X(1) - 4, X(0.15)); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.4; part(g); ctx.restore();
    }
    if (s.ghost && building) {
      // where it would land: a lit slot (green fits, red does not), and the part over it
      const g = s.ghost, ok = g.ok;
      ctx.save(); ctx.fillStyle = ok ? 'rgba(124,255,155,0.14)' : 'rgba(255,77,109,0.16)'; ctx.strokeStyle = ok ? C.lime : C.red; ctx.lineWidth = Math.max(2, X(0.035));
      ctx.beginPath(); ctx.roundRect(X(g.c) + 2, X(g.r) + 2, X(2) - 4, X(1) - 4, X(0.15)); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha = ok ? 0.85 : 0.45; part(g); ctx.restore();
    }
    // where the ball touched: a line of light along the surface, brighter and wider the harder the blow
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const g of glows) {
      const [x1, y1, x2, y2] = g.seg, len = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      const t = (g.x - x1) * ux + (g.y - y1) * uy, half = 0.16 + 0.34 * g.k, a = Math.max(0, Math.min(len, t - half)), b = Math.max(0, Math.min(len, t + half));
      const fade = g.life / g.max;
      ctx.globalAlpha = fade * (0.45 + 0.55 * g.k); ctx.strokeStyle = g.colour; ctx.lineWidth = X(0.07 + 0.07 * g.k); glow(g.colour, 6 + 18 * g.k);
      ctx.beginPath(); ctx.moveTo(X(x1 + ux * a), X(y1 + uy * a)); ctx.lineTo(X(x1 + ux * b), X(y1 + uy * b)); ctx.stroke();
    }
    noGlow();
    for (const p of pings) { const k = p.t / 0.32; ctx.globalAlpha = (1 - k) * p.k; ctx.strokeStyle = '#fff'; ctx.lineWidth = X(0.05); ctx.beginPath(); ctx.arc(X(p.x), X(p.y), X(0.12 + k * (0.35 + 0.3 * p.k)), 0, 7); ctx.stroke(); }
    ctx.restore();
    // the trail, then the ball
    s.trail.forEach(([x, y], i) => { ctx.globalAlpha = 0.3 * i / s.trail.length; ctx.fillStyle = C.pink; ctx.beginPath(); ctx.arc(X(x), X(y), X(R) * (0.3 + 0.5 * i / s.trail.length), 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
    if (!s.popped && !tucked) ball(s.run.ball, s.roll || 0);
    else if (!s.popped) {
      const e = s.run ? 1 - (1 - s.emerge) ** 3 : 0, tuck = PIPE.top + R;
      ctx.save(); ctx.globalAlpha = 0.2 + 0.8 * e;
      ball({ x: level.start.x, y: tuck + (level.start.y - tuck) * e }, s.roll || 0);
      ctx.restore();
    }
    basketFront(level.goal, s.won);
    pipe(level.start);   // over the ball: it waits hidden inside the tube and drops out of its mouth on Probar
    // particles
    for (const p of sparks) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.colour; ctx.beginPath(); ctx.arc(X(p.x), X(p.y), X(p.size), 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // the explosion: a white flash, an orange fireball and a shock wave that spreads and fades
    for (const w of rings) {
      const k = w.t / 0.9;
      if (k < 0.35) {
        const f = ctx.createRadialGradient(X(w.x), X(w.y), 0, X(w.x), X(w.y), X(0.4 + k * 4));
        f.addColorStop(0, `rgba(255,255,255,${1 - k / 0.35})`); f.addColorStop(0.35, `rgba(255,200,80,${0.9 - k * 2})`); f.addColorStop(1, 'rgba(255,80,40,0)');
        ctx.fillStyle = f; ctx.beginPath(); ctx.arc(X(w.x), X(w.y), X(0.4 + k * 4), 0, 7); ctx.fill();
      }
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); glow(C.orange, 20);
      ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = X(0.12 * (1 - k)) + 1;
      ctx.beginPath(); ctx.arc(X(w.x), X(w.y), X(0.3 + k * 3.2), 0, 7); ctx.stroke(); ctx.restore();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /** Time passes for the moving bits: the blades, the springs, the particles. */
  function tick(dt) {
    clock += dt; spin += dt * 9;
    shake = Math.max(0, shake - dt * 2.2);
    for (let i = rings.length - 1; i >= 0; i--) if ((rings[i].t += dt) > 0.9) rings.splice(i, 1);
    for (let i = glows.length - 1; i >= 0; i--) if ((glows[i].life -= dt) <= 0) glows.splice(i, 1);
    for (let i = pings.length - 1; i >= 0; i--) if ((pings[i].t += dt) > 0.32) pings.splice(i, 1);
    for (const [p, k] of squash) k - dt <= 0 ? squash.delete(p) : squash.set(p, k - dt);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.life -= dt; p.vy += 9 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0) sparks.splice(i, 1);
    }
  }
  const busy = () => sparks.length > 0 || squash.size > 0 || rings.length > 0 || glows.length > 0 || pings.length > 0;
  /** The ball blows up: fire, sparks, smoke that drifts up, a shock wave and a shake */
  function explode(x, y) {
    rings.push({ x, y, t: 0 }); shake = 1;
    burst(x, y, ['#ffffff', '#ffd27a', C.orange, C.red, C.pink], 60, 9);
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, v = 1 + Math.random() * 1.5;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, life: 1 + Math.random() * 0.6, max: 1.6, colour: 'rgba(120,110,140,0.55)', size: 0.12 + Math.random() * 0.12 });
    }
  }
  function burst(x, y, colours, n = 18, speed = 4) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random());
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.5, life: 0.6 + Math.random() * 0.6, max: 1.2, colour: colours[i % colours.length], size: 0.04 + Math.random() * 0.05 });
    }
  }
  function boing(part) { squash.set(part, 0.25); }
  /** The colour a surface lights up in when the ball touches it */
  function lightOf(seg) {
    const kind = seg[4], p = seg[5];
    if (kind === 'cup') return C.lime;
    if (p && typeof p === 'object') return p.type === 'spring' ? C.lime : p.type === 'fan' ? C.cyan : '#fff4b0';
    return '#d6c8ff';   // a girder or the board's side
  }
  /**
   * The ball presses on a surface (the engine's 'touch', each step it does): that spot lights up, as strong
   * as the blow. Rolling leaves a faint line along where it goes; a knock flashes wider; a hard hit adds a
   * small ring and, the hardest, a few sparks.
   */
  function contact({ x, y, v, seg }) {
    const k = Math.min(1, v / 9), colour = lightOf(seg), last = glows[glows.length - 1];
    if (last && last.seg === seg && Math.hypot(last.x - x, last.y - y) < 0.12) { last.life = last.max = Math.max(last.max, 0.3 + 0.5 * k); last.k = Math.max(last.k * 0.97, k); }
    else { glows.push({ seg, x, y, k: Math.max(0.12, k), life: 0.3 + 0.5 * k, max: 0.3 + 0.5 * k, colour }); if (glows.length > 90) glows.shift(); }
    if (v > 4) pings.push({ x, y, k, t: 0 });
    if (v > 6.5) burst(x, y, [colour, '#ffffff'], Math.round(2 + 6 * k), 1.5 + 2.5 * k);
  }
  /** The tray's picture of a part: this canvas holds one part, two cells by one, nothing else */
  function piece(type) {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    dpr = devicePixelRatio || 1; colours();
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    px = canvas.width / 2.2;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    part({ type, c: 0.1, r: 0.05, dir: 1 });
  }
  return { size, draw, piece, tick, burst, boing, contact, busy, explode, get C() { return C; } };
}

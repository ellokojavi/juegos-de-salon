/**
 * 🗼 Babel' drawing: the tower in isometric view on a canvas, for the game and the cover (ui.js).
 * Moved from the lab (labs/stack/scene.js), the same drawing.
 */
import { drop, movingAt, score, top, SLAB } from './engine.js';

const QUIETO = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const COS30 = Math.cos(Math.PI / 6), SIN30 = 0.5;

/**
 * Each level's color: the house's neon (base.css), from pink through orange, yellow, lime and cyan to
 * purple and back to pink, a sixth of the way each level, like the titles' rainbow.
 */
export const NEON = [[255, 46, 136], [255, 122, 26], [255, 210, 63], [157, 255, 58], [46, 230, 214], [138, 77, 255]];
const PASOS = 6;   // levels from one color to the next
export function colorDe(n) {
  const k = (n / PASOS) % NEON.length, i = Math.floor(k), f = k - i;
  const a = NEON[i], b = NEON[(i + 1) % NEON.length];
  return a.map((v, j) => Math.round(v + (b[j] - v) * f));
}
const rgb = ([r, g, b], a = 1) => `rgba(${r},${g},${b},${a})`;
const sombra = (c, k) => c.map(v => Math.round(v * k));
const claro = (c, k) => c.map(v => Math.round(v + (255 - v) * k));
/** The base: the night's purple (--bg2), that fades into the background going down. */
const BASE_COLOR = [58, 20, 100];

/**
 * A scene on a canvas: the tower, the sliding block, the pieces falling, and a camera that rises with
 * the tower. The canvas is transparent: the tower stands on the app's own night. `draw(g, now)` paints
 * one frame.
 */
export function escena(canvas, { zoom = 1 } = {}) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, u = 0, camY = 0, ultimo = 0;
  let fija = null;     // a camera set from outside (the teaser): { y, yaw }; the game leaves it null
  const piezas = [];   // falling pieces: { slab, y, vy, color }
  const anillos = [];  // the glow of a perfect drop: { slab, y, born }
  const chispas = [];  // its sparks: { x, y, z, vx, vy, vz, born, color }
  let gira = null, giro = 0;     // the end's tour: { n, born } (recorrer)

  const medir = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(3, devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The base takes about half the width, and never so much that the slide leaves a short screen
    u = Math.min(W * 0.3, H * 0.28) * zoom;
  };
  const ro = new ResizeObserver(medir); ro.observe(canvas); medir();

  // The yaw turns the view around the tower (the teaser's; the game's is 0). Under 45° either way the
  // same two sides keep facing the viewer
  const pt = (x, y, z) => {
    const yaw = fija?.yaw || giro;
    if (yaw) { const c = Math.cos(yaw), s = Math.sin(yaw); [x, z] = [x * c - z * s, x * s + z * c]; }
    return [W / 2 + (x - z) * COS30 * u, H * 0.56 + (x + z) * SIN30 * u - (y - camY) * u];
  };
  const poly = (pts, fill) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };

  /** A box: its top (with a soft shine) and the two sides that face the viewer (+x on the right, +z on the left). */
  function caja(s, y0, y1, c, alpha = 1) {
    const x0 = s.x - s.w / 2, x1 = s.x + s.w / 2, z0 = s.z - s.d / 2, z1 = s.z + s.d / 2;
    ctx.globalAlpha = alpha;
    poly([pt(x1, y0, z0), pt(x1, y0, z1), pt(x1, y1, z1), pt(x1, y1, z0)], rgb(sombra(c, 0.72)));
    poly([pt(x0, y0, z1), pt(x1, y0, z1), pt(x1, y1, z1), pt(x0, y1, z1)], rgb(sombra(c, 0.55)));
    const [ax, ay] = pt(x0, y1, z0), [bx, by] = pt(x1, y1, z1);
    const brillo = ctx.createLinearGradient(ax, ay, bx, by);
    brillo.addColorStop(0, rgb(claro(c, 0.45))); brillo.addColorStop(1, rgb(claro(c, 0.08)));
    poly([pt(x0, y1, z0), pt(x1, y1, z0), pt(x1, y1, z1), pt(x0, y1, z1)], brillo);
    // A faint line under each slab, so the layers read apart
    ctx.beginPath(); [pt(x0, y0, z1), pt(x1, y0, z1), pt(x1, y0, z0)].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /** The base: a purple column whose sides fade into the night going down. */
  function columna(s) {
    const x0 = s.x - s.w / 2, x1 = s.x + s.w / 2, z0 = s.z - s.d / 2, z1 = s.z + s.d / 2, y0 = -3;
    const lado = (pts, k) => {
      const [, top] = pt(x1, 0, z1), [, bot] = pt(x1, y0, z1);
      const gr = ctx.createLinearGradient(0, top, 0, bot);
      gr.addColorStop(0, rgb(sombra(BASE_COLOR, k))); gr.addColorStop(1, rgb(sombra(BASE_COLOR, k), 0));
      poly(pts, gr);
    };
    lado([pt(x1, y0, z0), pt(x1, y0, z1), pt(x1, 0, z1), pt(x1, 0, z0)], 1);
    lado([pt(x0, y0, z1), pt(x1, y0, z1), pt(x1, 0, z1), pt(x0, 0, z1)], 0.75);
    poly([pt(x0, 0, z0), pt(x1, 0, z0), pt(x1, 0, z1), pt(x0, 0, z1)], rgb(claro(BASE_COLOR, 0.25)));
  }

  /** `reloj`: the sliding slab's moment (frozen while the game is paused); `now` moves the rest. */
  function draw(g, now, reloj = now) {
    const dt = ultimo ? Math.min(0.05, (now - ultimo) / 1000) : 0;
    ultimo = now;
    const n = score(g);
    // The camera follows the top of the tower, smoothly
    const meta = n * SLAB;
    const vista = gira && tour(gira.n, now - gira.born);
    giro = vista ? vista.yaw : 0;
    camY = fija ? fija.y : vista ? vista.y : dt ? camY + (meta - camY) * Math.min(1, dt * 5) : meta;
    ctx.clearRect(0, 0, W, H);

    // The pieces behind the tower first, the ones in front after it
    const t0 = top(g), detras = p => (p.slab.x - t0.x) + (p.slab.z - t0.z) < 0;
    for (const p of piezas) { p.vy -= 9 * dt; p.y += p.vy * dt; }
    for (let i = piezas.length - 1; i >= 0; i--) if (piezas[i].y < camY - 8) piezas.splice(i, 1);
    piezas.filter(detras).forEach(p => caja(p.slab, p.y, p.y + SLAB, p.color));

    // The base, then the slabs (only the ones in sight)
    if (camY < 4) columna(g.slabs[0]);
    const desde = fija || gira ? 1 : Math.max(1, n - Math.ceil(H / (SLAB * u)) - 4);
    for (let i = desde; i <= n; i++) caja(g.slabs[i], (i - 1) * SLAB, i * SLAB, colorDe(i));

    piezas.filter(p => !detras(p)).forEach(p => caja(p.slab, p.y, p.y + SLAB, p.color));
    if (vista) vista.marcas.forEach(m => corte(m.k, m.luz));

    // A perfect drop: a neon outline that opens around the slab, glowing, and fades
    for (let i = anillos.length - 1; i >= 0; i--) {
      const a = anillos[i], k = (now - a.born) / 600;
      if (k >= 1) { anillos.splice(i, 1); continue; }
      const m = 0.03 + k * 0.22, s = a.slab;
      const x0 = s.x - s.w / 2 - m, x1 = s.x + s.w / 2 + m, z0 = s.z - s.d / 2 - m, z1 = s.z + s.d / 2 + m;
      ctx.beginPath();
      [pt(x0, a.y, z0), pt(x1, a.y, z0), pt(x1, a.y, z1), pt(x0, a.y, z1)].forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.save();
      ctx.shadowColor = '#2ee6d6'; ctx.shadowBlur = 16;
      ctx.strokeStyle = `rgba(160,255,248,${1 - k})`; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.restore();
    }
    // Its sparks: small squares of the house's colors that fly out and fall
    for (let i = chispas.length - 1; i >= 0; i--) {
      const c = chispas[i], k = (now - c.born) / 700;
      if (k >= 1) { chispas.splice(i, 1); continue; }
      c.vy -= 6 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
      const [sx, sy] = pt(c.x, c.y, c.z), r = 3.5 * (1 - k) + 1;
      ctx.fillStyle = rgb(c.color, 1 - k); ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    }

    // The sliding block, on top of everything
    if (g.moving) caja(movingAt(g, reloj), n * SLAB, (n + 1) * SLAB, colorDe(n + 1));
  }

  /**
   * A cut every ten levels: a glowing plane across the tower, wider than the base, with its number on
   * the right. `luz` (0 to 1) is how bright it is: full when the camera reaches it, then it settles.
   */
  function corte(k, luz) {
    const y = k * SLAB, m = 0.78, a = 0.35 + 0.65 * luz;
    const pts = [pt(-m, y, -m), pt(m, y, -m), pt(m, y, m), pt(-m, y, m)];
    ctx.save();
    ctx.beginPath(); pts.forEach(([x, yy], i) => (i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy))); ctx.closePath();
    ctx.fillStyle = `rgba(46,230,214,${0.08 + 0.14 * luz})`; ctx.fill();
    ctx.shadowColor = '#2ee6d6'; ctx.shadowBlur = 6 + 14 * luz;
    ctx.strokeStyle = `rgba(160,255,248,${a})`; ctx.lineWidth = 1.5 + 1.5 * luz; ctx.stroke();
    const [lx, ly] = pts[1];
    ctx.font = `${Math.round(18 + 8 * luz)}px Bangers, system-ui, sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillText(String(k), lx + 10, ly);
    ctx.restore();
  }

  return {
    /** The end's tour (`n` levels): from the top down to the base, a cut every ten, and back up. */
    recorrer(n, now = performance.now()) { gira = { n, born: now }; },
    /** Whether the tour is still moving (the loop keeps drawing while it is). */
    recorriendo(now = performance.now()) { return !!gira && now - gira.born < tour(gira.n, 0).total + 200; },
    /** Sets the camera by hand: its height and its yaw (the teaser); `null` gives it back to the tower. */
    camara(c) { fija = c; },
    draw,
    caer(slab, y, n) { piezas.push({ slab, y, vy: 0, color: colorDe(n) }); },
    brillar(slab, y, now = performance.now()) {
      anillos.push({ slab, y, born: now });
      if (QUIETO) return;
      // Sparks from the slab's edges, outwards
      for (let k = 0; k < 14; k++) {
        const ang = (k / 14) * Math.PI * 2, r = Math.max(slab.w, slab.d) * 0.55;
        chispas.push({ x: slab.x + Math.cos(ang) * r, y, z: slab.z + Math.sin(ang) * r, vx: Math.cos(ang) * 0.9, vy: 1.2 + (k % 3) * 0.4, vz: Math.sin(ang) * 0.9, born: now, color: NEON[k % NEON.length] });
      }
    },
    cerrar() { ro.disconnect(); },
  };
}

const VIAJE_MS = 650, ALTO_MS = 380;   // the tour: each ten levels' trip, and the stop at each cut
const suave = k => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
/**
 * Where the tour's camera is at `t` ms on a tower of `n` levels, and which cuts it has passed: the stops
 * are the top, each multiple of ten below it and the base (0); the camera goes down them and back up.
 */
export function tour(n, t) {
  t = Math.max(0, t);
  const paradas = [n];
  for (let k = Math.floor((n - 1) / 10) * 10; k >= 0; k -= 10) paradas.push(k);
  if (n <= 0) paradas.length = 1;
  const ida = paradas.concat(paradas.slice(0, -1).reverse());
  const tramo = VIAJE_MS + ALTO_MS, total = (ida.length - 1) * tramo;
  const marcas = paradas.filter(k => k % 10 === 0).map(k => ({ k, luz: 0, visto: false }));
  let y = ida[0] * SLAB;
  if (t >= total) y = n * SLAB;
  else {
    const i = Math.floor(t / tramo), r = t - i * tramo;
    const a = ida[i], b = ida[i + 1];
    y = (r < ALTO_MS ? a : a + (b - a) * suave((r - ALTO_MS) / VIAJE_MS)) * SLAB;
  }
  // A cut lights up when the camera reaches it (on the way down or up) and settles after
  for (const m of marcas) {
    let ultimo = -Infinity;
    ida.forEach((k, j) => { const en = j * tramo; if (k === m.k && en <= t) ultimo = en; });
    if (ultimo === -Infinity) continue;
    m.visto = true; m.luz = Math.max(0, 1 - (t - ultimo) / 900);
  }
    // The camera also turns around the tower, there and back (under 45°, the same two sides in view)
  const yaw = t >= total ? 0 : 0.7 * Math.sin((t / total) * Math.PI * 2);
  return { y, yaw, total, marcas: marcas.filter(m => m.visto) };
}

/** The moment of a tap, on performance.now()'s clock (an old browser's epoch timestamp is not trusted). */
export const momento = ev => {
  const ahora = performance.now(), t = ev?.timeStamp;
  return typeof t === 'number' && t > 0 && t <= ahora + 50 && t >= ahora - 1000 ? t : ahora;
};

/** Drops the block in `g` at `t` and shows it on `sc`: the cut piece falls, a perfect drop shines. */
export function soltar(g, sc, t, now) {
  const n = score(g);
  const r = drop(g, t);
  if (!r) return null;
  const y = n * SLAB;
  if (r.kind === 'perfect') sc.brillar(r.slab, y + SLAB, now);
  else sc.caer(r.piece, y, n + 1);
  return r;
}

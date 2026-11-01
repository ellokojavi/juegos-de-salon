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
export function escena(canvas, { zoom = 1, foco = 0.56 } = {}) {
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
    return [W / 2 + (x - z) * COS30 * u, H * foco + (x + z) * SIN30 * u - (y - camY) * u];
  };
  const poly = (pts, fill) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };

  /**
   * The sides of a footprint that face the viewer, as the view turns: each with its two bottom corners
   * and its shade (0.72 for the right one, 0.55 for the left one at yaw 0, blending as it turns).
   */
  function caras(x0, x1, z0, z1) {
    const yaw = fija?.yaw || giro, c = Math.cos(yaw), sn = Math.sin(yaw);
    return [[1, 0, [x1, z0], [x1, z1]], [0, 1, [x0, z1], [x1, z1]], [-1, 0, [x0, z1], [x0, z0]], [0, -1, [x1, z0], [x0, z0]]]
      .map(([nx, nz, a, b]) => ({ a, b, vx: nx * c - nz * sn, vz: nx * sn + nz * c }))
      .filter(f => f.vx + f.vz > 1e-6)
      .map(f => ({ a: f.a, b: f.b, k: 0.635 + 0.085 * (f.vx - f.vz) }));
  }
  const borde = (x0, x1, z0, z1, y) => caras(x0, x1, z0, z1).map(f => [pt(f.a[0], y, f.a[1]), pt(f.b[0], y, f.b[1])]);
  const trazo = (segs, color, ancho) => {
    ctx.beginPath(); for (const [[ax, ay], [bx, by]] of segs) { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }
    ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.lineCap = 'round'; ctx.stroke();
  };

  /** A box: its top (with a soft shine) and the sides that face the viewer. */
  function caja(s, y0, y1, c, alpha = 1) {
    const x0 = s.x - s.w / 2, x1 = s.x + s.w / 2, z0 = s.z - s.d / 2, z1 = s.z + s.d / 2;
    ctx.globalAlpha = alpha;
    for (const f of caras(x0, x1, z0, z1)) poly([pt(f.a[0], y0, f.a[1]), pt(f.b[0], y0, f.b[1]), pt(f.b[0], y1, f.b[1]), pt(f.a[0], y1, f.a[1])], rgb(sombra(c, f.k)));
    const [ax, ay] = pt(x0, y1, z0), [bx, by] = pt(x1, y1, z1);
    const brillo = ctx.createLinearGradient(ax, ay, bx, by);
    brillo.addColorStop(0, rgb(claro(c, 0.45))); brillo.addColorStop(1, rgb(claro(c, 0.08)));
    poly([pt(x0, y1, z0), pt(x1, y1, z0), pt(x1, y1, z1), pt(x0, y1, z1)], brillo);
    // A faint line under each slab, so the layers read apart
    trazo(borde(x0, x1, z0, z1, y0), 'rgba(0,0,0,0.18)', 1);
    ctx.globalAlpha = 1;
  }

  /** The base: a purple column whose sides fade into the night going down. */
  function columna(s) {
    const x0 = s.x - s.w / 2, x1 = s.x + s.w / 2, z0 = s.z - s.d / 2, z1 = s.z + s.d / 2, y0 = -3;
    const [, top] = pt(x1, 0, z1), [, bot] = pt(x1, y0, z1);
    for (const f of caras(x0, x1, z0, z1)) {
      const gr = ctx.createLinearGradient(0, top, 0, bot), k = 0.75 + (f.k - 0.55) / 0.17 * 0.25;
      gr.addColorStop(0, rgb(sombra(BASE_COLOR, k))); gr.addColorStop(1, rgb(sombra(BASE_COLOR, k), 0));
      poly([pt(f.a[0], y0, f.a[1]), pt(f.b[0], y0, f.b[1]), pt(f.b[0], 0, f.b[1]), pt(f.a[0], 0, f.a[1])], gr);
    }
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
    // The tour's cuts go between the slabs: the plane under the slab above it (which hides its far half),
    // and the cut's glowing line around that slab's foot, so the tower reads sliced
    const cortes = new Map((vista?.marcas || []).map(m => [m.k, m]));
    for (let i = desde; i <= n; i++) {
      const m = cortes.get(i - 1);
      if (m) plano(m);
      caja(g.slabs[i], (i - 1) * SLAB, i * SLAB, colorDe(i));
      if (m) linea(g.slabs[i], m);
    }
    if (cortes.has(n)) { plano(cortes.get(n)); linea(g.slabs[n], cortes.get(n)); }

    piezas.filter(p => !detras(p)).forEach(p => caja(p.slab, p.y, p.y + SLAB, p.color));

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

  /** A cut every ten levels: a glowing plane across the tower, wider than the base. `luz` (0 to 1): full as the camera passes it. */
  const ANCHO = 0.95;
  function plano({ k, luz }) {
    const y = k * SLAB, m = ANCHO;
    ctx.save();
    ctx.beginPath(); [pt(-m, y, -m), pt(m, y, -m), pt(m, y, m), pt(-m, y, m)].forEach(([x, yy], i) => (i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy))); ctx.closePath();
    ctx.fillStyle = `rgba(46,230,214,${0.1 + 0.16 * luz})`; ctx.fill();
    ctx.shadowColor = '#2ee6d6'; ctx.shadowBlur = 6 + 14 * luz;
    ctx.strokeStyle = `rgba(160,255,248,${0.35 + 0.65 * luz})`; ctx.lineWidth = 1.5 + 1.5 * luz; ctx.stroke();
    // Its number, big and lying on the plane, its base along an edge, in two opposite corners past the
    // tower's foot, so one is always in sight as the tower turns; faint, always on
    const [ox, oy] = pt(0, y, 0), [ux, uy] = pt(1, y, 0), [vx, vy] = pt(0, y, 1), e = 1 / 100;
    const dpr = canvas.width / W;
    ctx.shadowBlur = 0;
    ctx.font = '26px Bangers, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = `rgba(220,255,252,${0.35 + 0.35 * luz})`;
    for (const sg of [1, -1]) {
      ctx.setTransform(sg * dpr * (ux - ox) * e, sg * dpr * (uy - oy) * e, sg * dpr * (vx - ox) * e, sg * dpr * (vy - oy) * e, dpr * ox, dpr * oy);
      ctx.fillText(String(k), (m - 0.07) * 100, (m - 0.06) * 100);
    }
    ctx.restore();
  }
  /** Where the plane meets the tower: a dark slit and a bright line around the slab's foot. */
  function linea(s, { k, luz }) {
    const y = k * SLAB, x0 = s.x - s.w / 2, x1 = s.x + s.w / 2, z0 = s.z - s.d / 2, z1 = s.z + s.d / 2;
    ctx.save();
    trazo(borde(x0, x1, z0, z1, y + SLAB * 0.18), 'rgba(10,0,30,0.55)', 3);
    ctx.shadowColor = '#2ee6d6'; ctx.shadowBlur = 8 + 16 * luz;
    trazo(borde(x0, x1, z0, z1, y), `rgba(220,255,252,${0.6 + 0.4 * luz})`, 2 + 2 * luz);
    ctx.restore();
  }
  return {
    /** Where the top of the tower sits, as a share of the canvas's height (the end screen centers it between its texts). */
    enfocar(f) { foco = f; },
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

const BAJA_MS = n => Math.max(4000, n * 135);   // the tour: the way down (and up), longer for a taller tower
const ABAJO_MS = 1000;                            // the rest at the base before going back up
const RAMPA = 0.12;                              // only the first and last bit of each way speed up and slow down
/** Progress at `u` (0 to 1) at a steady speed, easing in and out only at the ends. */
const avance = u => {
  u = Math.min(1, Math.max(0, u));
  const k = 2 * RAMPA * (1 - RAMPA);
  return u < RAMPA ? u * u / k : u > 1 - RAMPA ? 1 - (1 - u) ** 2 / k : (u - RAMPA / 2) / (1 - RAMPA);
};
/**
 * Where the tour's camera is at `t` ms on a tower of `n` levels: it goes down from the top to the base
 * at a steady pace while the tower turns a full circle, rests, and goes back up turning the other way.
 * A cut every ten levels shows once the camera has reached it, glowing as it passes.
 */
export function tour(n, t) {
  t = Math.max(0, t);
  const D = BAJA_MS(n), total = 2 * D + ABAJO_MS;
  let nivel, yaw;
  if (t < D) { const p = avance(t / D); nivel = n * (1 - p); yaw = 2 * Math.PI * p; }
  else if (t < D + ABAJO_MS) { nivel = 0; yaw = 0; }
  else { const p = avance((t - D - ABAJO_MS) / D); nivel = n * p; yaw = -2 * Math.PI * p; }
  const marcas = [];
  for (let k = 0; k <= n; k += 10) {
    if (t < D && k < nivel - 0.01) continue;
    marcas.push({ k, luz: Math.max(0, 1 - Math.abs(nivel - k) / 3) });
  }
  return { y: nivel * SLAB, yaw: t >= total ? 0 : yaw, total, marcas };
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

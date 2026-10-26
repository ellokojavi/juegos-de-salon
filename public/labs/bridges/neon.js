/**
 * 🚂 Tren en Vilo — the scene in the house style (lab prototype, `?style=neon`): smooth shapes, soft
 * glows and the home page's palette (night purple, yellow → pink, cyan), like Stick Ninja, instead of
 * pixel art. Same entry as scene.js's `dibujar` and the same world; only the drawing changes. The
 * visitors come and go as in the pixel scene (visitors.js), drawn as shapes by neon-visitors.js.
 *
 * Everything is drawn in "art units" (16 per grid unit, as in the pixel scene), so the particles and
 * the train keep their sizes and speeds; the canvas scales them smoothly instead of in blocks.
 */
import { el } from '../../assets/js/ui.js';
import { ALTO, LARGO_MAX, PIEZAS, fijos, FISICA, alturaCamino } from './engine.js';
import { particulas } from './pixel.js';
import { param } from '../../assets/js/parametros.js';
import { TRENES, BALAS } from './trains.js';
import { visitasCielo, visitaBallena, visitaLancha, visitaTopo } from './visitors.js';
import { pincel } from './neon-visitors.js';
import { QUIETO, aPantalla, pasoPorEncima, PARPADEO_MS } from './scene.js';

const ARTE = 16;
const ruido = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgba = (h, a = 1) => `rgba(${hex(h).join(',')},${a})`;
const mixColor = (a, b, f) => { const [x, y] = [hex(a), hex(b)]; return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * f).toString(16).padStart(2, '0')).join(''); };

/** The beam colors by strain: the house's yellow warming to pink and red (the gauge keeps its own). */
const TENSION = ['#ffd23f', '#ffbe3a', '#ff9d3d', '#ff7a4a', '#ff4f7a', '#ff2e4a'];
const colorTension = (t, quiebre = FISICA.quiebre, ramp = TENSION) => ramp[Math.min(ramp.length - 1, Math.floor((Math.abs(t) / quiebre) * ramp.length))];
/** Steel by strain: a cold blue-white light that heats to pink and red, never the wood's yellow. */
const TENSION_ACERO = ['#bfe6ff', '#d4dcff', '#f0c4ff', '#ff8fb0', '#ff4f7a', '#ff2e4a'];
const VETA = '#a8611c', REMACHE = '#2a3550';
const OSCURO = '#14081f';

/**
 * The time of day in the house's colors: a bright blue morning (clearly day, owner's request 2026-10-26),
 * a sunset in the title's yellow → pink, and the home page's night. Same `t` as scene.js's timeOfDay (0 = morning, 1 = night).
 */
const MORNING = { sky: ['#2f7fd6', '#5fb4ec', '#bfe9f5'], far: '#4a86b8', near: '#2f6496', water: ['#3fb0e0', '#1c5c9e'], rock: ['#5a4a7e', '#2e2450'], edge: '#9dff3a', stars: 0, clouds: 0.75,
  sun: { x: 0.8, y: 0.2, r: 6, color: '#fff6c8', halo: '#ffe08a', moon: false } };
const SUNSET = { sky: ['#4a2a8e', '#e0567e', '#ffc35a'], far: '#8a3f86', near: '#5e2a6e', water: ['#a85aa8', '#3a2272'], rock: ['#4a2058', '#1e0c34'], edge: '#ffd23f', stars: 0.1, clouds: 0.4,
  sun: { x: 0.24, y: 0.5, r: 9, color: '#ffcf5a', halo: '#ff8a50', moon: false } };
const NIGHT = { sky: ['#12052a', '#2a0c4e', '#4a1a6e'], far: '#2e1258', near: '#1e0a3c', water: ['#173f7a', '#0a1a3a'], rock: ['#170838', '#0a0320'], edge: '#2ee6d6', stars: 1, clouds: 0.06,
  sun: { x: 0.8, y: 0.16, r: 6, color: '#ffe9a8', halo: '#ffd23f', moon: true } };
const mezcla = (a, b, f) => ({
  sky: a.sky.map((c, i) => mixColor(c, b.sky[i], f)), far: mixColor(a.far, b.far, f), near: mixColor(a.near, b.near, f),
  water: a.water.map((c, i) => mixColor(c, b.water[i], f)), rock: a.rock.map((c, i) => mixColor(c, b.rock[i], f)), edge: mixColor(a.edge, b.edge, f),
  stars: a.stars + (b.stars - a.stars) * f, clouds: a.clouds + (b.clouds - a.clouds) * f, sun: f < 0.5 ? a.sun : b.sun,
});
const luz = t => (t <= 0.5 ? mezcla(MORNING, SUNSET, t / 0.5) : mezcla(SUNSET, NIGHT, (t - 0.5) / 0.5));

/** A stroke with a glow in its own color. */
function brilla(ctx, color, blur, fn) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore(); }
function linea(ctx, ax, ay, bx, by, color, ancho) {
  ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
}
function circulo(ctx, x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function caja(ctx, x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }

/* ------------------------------------------------------------------ */
/* The train, as shapes                                                */
/* ------------------------------------------------------------------ */

/** A wheel at (x, y) with radius r, its spoke turned by `giro`. */
function rueda(ctx, x, y, r, giro) {
  circulo(ctx, x, y, r, '#1a0d30');
  ctx.strokeStyle = 'rgba(190,160,255,0.75)'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.arc(x, y, r - 0.35, 0, Math.PI * 2); ctx.stroke();
  linea(ctx, x - Math.cos(giro) * (r - 0.7), y - Math.sin(giro) * (r - 0.7), x + Math.cos(giro) * (r - 0.7), y + Math.sin(giro) * (r - 0.7), 'rgba(190,160,255,0.4)', 0.3);
  circulo(ctx, x, y, 0.45, '#2ee6d6');
}

/** The locomotive, facing right, its bottom-centre at (x, y): 22 × 14 art units, like the sprite. */
export function locomotora(ctx, x, y, { giro = 0, pesada = false } = {}) {
  const [c1, c2] = pesada ? ['#8ef04a', '#3d9a2a'] : ['#ff5aa8', '#c81d6a'];
  ctx.save(); ctx.translate(x, y);
  // The chassis and the cowcatcher
  caja(ctx, -10.5, -5.2, 21, 1.8, 0.6, OSCURO);
  ctx.fillStyle = OSCURO; ctx.beginPath(); ctx.moveTo(10, -5); ctx.lineTo(12, -1.2); ctx.lineTo(10, -1.2); ctx.closePath(); ctx.fill();
  // The boiler, round in front, with gold bands
  const gr = ctx.createLinearGradient(0, -11, 0, -4.8);
  gr.addColorStop(0, c1); gr.addColorStop(1, c2);
  caja(ctx, -3.5, -11, 14, 6.2, 2.6, gr);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(0.8, -11, 0.8, 6.2); ctx.fillRect(5.4, -11, 0.8, 6.2);
  // The chimney, with a gold rim
  caja(ctx, 5.6, -14.2, 2.4, 3.6, 0.5, OSCURO);
  caja(ctx, 5.1, -14.8, 3.4, 1, 0.4, '#ffd23f');
  // The cab, deep purple with a lit window, under a pink roof
  caja(ctx, -10.5, -13, 7.6, 8.2, 1.2, '#2a1458');
  ctx.strokeStyle = 'rgba(190,160,255,0.6)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.roundRect(-10.5, -13, 7.6, 8.2, 1.2); ctx.stroke();
  brilla(ctx, '#ffd23f', 4, () => caja(ctx, -9.2, -11.6, 4.6, 3.2, 0.6, '#ffd23f'));
  caja(ctx, -11.2, -14, 9, 1.4, 0.6, c1);
  // The lamp, in front
  brilla(ctx, '#fff3a0', 6, () => circulo(ctx, 10.2, -8.6, 1, '#fff3a0'));
  rueda(ctx, -6.5, -2.2, 2.2, giro); rueda(ctx, -1.5, -2.2, 2.2, giro + 1); rueda(ctx, 5.5, -2.6, 2.6, giro + 2);
  ctx.restore();
}
/** Where the chimney's top is, from the locomotive's bottom-centre. */
const CHIMENEA = { dx: 6.8, dy: -15 };

/** What a wagon carries, by the train's weight (like trenDe in pixel.js). */
const cargaDe = carga => (carga < 1.2 ? 'pasajeros' : carga < 1.4 ? 'cajas' : carga < 1.6 ? 'troncos' : carga < 1.9 ? 'carbon' : 'contenedor');

/** A wagon, its bottom-centre at (x, y): 16 × 10 art units. */
export function vagon(ctx, x, y, carga = 1, giro = 0) {
  const tipo = cargaDe(carga);
  ctx.save(); ctx.translate(x, y);
  caja(ctx, -8, -4.6, 16, 1.6, 0.5, OSCURO);
  if (tipo === 'pasajeros') {
    caja(ctx, -7.6, -10.6, 15.2, 6.2, 1.6, '#5b2ea6');
    ctx.strokeStyle = 'rgba(190,160,255,0.7)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.roundRect(-7.6, -10.6, 15.2, 6.2, 1.6); ctx.stroke();
    caja(ctx, -8.2, -11.4, 16.4, 1.3, 0.6, '#2ee6d6');
    brilla(ctx, '#ffd23f', 3, () => { for (const wx of [-6, -1.6, 2.8]) caja(ctx, wx, -9.4, 3.2, 2.4, 0.5, '#ffd23f'); });
  } else if (tipo === 'cajas') {
    for (const [bx, w, h] of [[-7.4, 7, 5.4], [0.2, 7, 4.2]]) {
      caja(ctx, bx, -4.6 - h, w, h, 0.5, '#ffb347');
      ctx.strokeStyle = '#a8561e'; ctx.lineWidth = 0.4; ctx.beginPath();
      ctx.moveTo(bx + 0.6, -4.6 - h + 0.6); ctx.lineTo(bx + w - 0.6, -5.2); ctx.moveTo(bx + w - 0.6, -4.6 - h + 0.6); ctx.lineTo(bx + 0.6, -5.2); ctx.stroke();
    }
  } else if (tipo === 'troncos') {
    caja(ctx, -7.8, -10, 0.8, 5.4, 0.3, OSCURO); caja(ctx, 7, -10, 0.8, 5.4, 0.3, OSCURO);
    // Two layers of logs, seen from the side, their cut ends at the back
    for (const ly of [-5.9, -8.4]) {
      caja(ctx, -7, ly - 1.25, 14, 2.5, 1.2, '#b8642e');
      ctx.fillStyle = 'rgba(20,8,31,0.25)'; ctx.fillRect(-6.5, ly + 0.2, 13, 0.4);
      circulo(ctx, 5.8, ly, 1.2, '#f0a060'); ctx.strokeStyle = '#8a4a20'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.arc(5.8, ly, 0.55, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (tipo === 'carbon') {
    // A heap of coal over the hopper, with a few glints
    ctx.fillStyle = '#0c0616'; ctx.beginPath(); ctx.moveTo(-7, -8.8); ctx.quadraticCurveTo(0, -15, 7, -8.8); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 5; k++) circulo(ctx, -4.4 + k * 2.2, -10.2 - (k % 2) * 0.9 - (k === 2 ? 0.8 : 0), 0.35, 'rgba(46,230,214,0.8)');
    caja(ctx, -7.6, -9.6, 15.2, 5, 1, '#3a2a5a');
    ctx.strokeStyle = 'rgba(190,160,255,0.5)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.roundRect(-7.6, -9.6, 15.2, 5, 1); ctx.stroke();
  } else {
    caja(ctx, -7.8, -11.2, 15.6, 6.6, 0.8, '#ff2e88');
    ctx.fillStyle = 'rgba(20,8,31,0.35)'; for (let k = -6; k <= 6; k += 2) ctx.fillRect(k - 0.2, -10.6, 0.4, 5.4);
  }
  rueda(ctx, -4.6, -2, 2, giro); rueda(ctx, 4.6, -2, 2, giro + 1);
  ctx.restore();
}

/** The stage's train in small, next to its weight in the title (scene.js's trenMini, in this style). */
/** The first neon train, as a design like those in trains.js. */
const CLASICO = {
  id: 'clasico', nombre: 'Clásico', lema: 'El primer tren neón, el que se critica: locomotora a vapor de formas simples.', humo: CHIMENEA, luz: { dx: 10.2, dy: -8.6 },
  frente: (ctx, x, y, { giro = 0, carga = 1 } = {}) => locomotora(ctx, x, y, { giro, pesada: carga >= 1.6 }),
  vagon,
};
/**
 * The train of a stage: the bullet train in a color drawn at random for each stage, never the same as the
 * stage before (owner's request). The color is only paint: the weight is still the stage's (`e.carga`),
 * in the physics and in the title. `?train=bala-perla|…` fixes one color, `?train=clasico` the first train.
 * Only colors that stand out against the stage's light are drawn (owner's request, 2026-10-26): a silver
 * train on the morning's blue sky, or a ruby one on the sunset's pink, disappears. `contraste` measures
 * the body's tint against the sky and the far hills right behind it (WCAG contrast ratio).
 */
const FIJO = param('train') === 'clasico' ? CLASICO : TRENES[param('train')] || null;
export const CONTRASTE_MIN = 1.8;
const luminancia = ([r, g, b]) => [r, g, b].map(v => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const razon = (a, b) => { const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => m - n); return (y + 0.05) / (x + 0.05); };
/** The worst contrast of a train's body against what is behind it at time `t` (0 = morning, 1 = night). */
export const contraste = (tren, t) => { const L = luz(t); return Math.min(razon(tren.tinte, hex(L.sky[1])), razon(tren.tinte, hex(L.far))); };
/** The colors that read well at time `t` (in the morning only pearl); if none did, the one that stands out the most. */
export const balasPara = t => {
  const bien = BALAS.filter(b => contraste(b, t) >= CONTRASTE_MIN);
  return bien.length ? bien : [...BALAS].sort((a, b) => contraste(b, t) - contraste(a, t)).slice(0, 1);
};
const colores = new WeakMap();
let ultimo = null;
export function trenDe(e, t = 1) {
  if (FIJO) return FIJO;
  if (!e) return BALAS[0];
  if (!colores.has(e)) {
    // Never the stage before's color, unless it is the only one that reads well
    const validos = balasPara(t), opciones = validos.filter(b => b !== ultimo);
    const lista = opciones.length ? opciones : validos;
    colores.set(e, ultimo = lista[Math.floor(Math.random() * lista.length)]);
  }
  return colores.get(e);
}

export function trenMiniNeon(carga, e, t) {
  const TREN = trenDe(e, t);
  const dpr = window.devicePixelRatio || 1, k = 2, ancho = 44, alto = 17;
  const c = el('canvas', { class: 'tv-tren-mini', 'aria-hidden': 'true', width: ancho * k * dpr, height: alto * k * dpr });
  c.style.width = `${ancho * k}px`; c.style.height = `${alto * k}px`;
  const ctx = c.getContext('2d');
  ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
  TREN.vagon(ctx, 9, alto - 0.5, carga); TREN.frente(ctx, 30, alto - 0.5, { carga });
  return c;
}

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

/** A range of hills behind the gap: a dark silhouette, its ridge faintly lit. */
function sierra(ctx, W, base, alto, color, borde, semilla, hasta) {
  const cumbre = x => 0.55 + 0.25 * Math.sin(x * 0.07 + semilla) + 0.2 * Math.sin(x * 0.19 + semilla * 3);
  ctx.beginPath(); ctx.moveTo(0, hasta);
  for (let x = 0; x <= W + 4; x += 4) ctx.lineTo(x, base - alto * cumbre(x));
  ctx.lineTo(W + 4, hasta); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath();
  for (let x = 0; x <= W + 4; x += 4) ctx.lineTo(x, base - alto * cumbre(x));
  ctx.strokeStyle = borde; ctx.lineWidth = 0.5; ctx.stroke();
}

/** Draws a stage in the house style: same arguments as scene.js's `dibujar`. */
export function dibujarNeon(c, e, { vigas = [], sim = null, grilla = false, arrastre = null, usados = new Set(), rotasAntes = new Set(), visitas = null } = {}) {
  if (!c._m) return;
  const ctx = c.getContext('2d');
  const k = c._m.escala / ARTE, dpr = c._m.dpr;
  ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
  const W = c._m.w / k, H = c._m.h / k;
  const ahora = performance.now() / 1000;
  const esc = c._neon ||= { parts: particulas(), ultimo: ahora, humo: 0, rotas: new Set(), caida: null, sim: null };
  const dt = Math.min(0.05, ahora - esc.ultimo); esc.ultimo = ahora;
  if (esc.sim !== sim) { esc.sim = sim; esc.rotas = new Set(); esc.caida = null; esc.sueltos = new Set(); }
  const A = (x, y) => { const [px, py] = aPantalla(c, x, y); return [px / k, py / k]; };
  const u = ARTE;
  const L = luz(c._time?.t ?? 1);
  const [x0, y0] = A(0, 0), [x1] = A(e.ancho, 0);
  const [, yAgua] = A(0, c._v.abajo + 0.7);
  const TREN = trenDe(e, c._time?.t ?? 1);
  // The visitors draw through a smooth renderer with the pixel one's methods (neon-visitors.js)
  const r = c._pincel ||= pincel(ctx, W, H);
  r.W = W; r.H = H;
  const V = { r, esc, e, c, A, W, H, ahora, dt, visitas, yAgua, x0, x1, y0 };

  // The sky: one smooth gradient, the stars that twinkle, the sun or the moon with its halo
  const cielo = ctx.createLinearGradient(0, 0, 0, yAgua);
  cielo.addColorStop(0, L.sky[0]); cielo.addColorStop(0.55, L.sky[1]); cielo.addColorStop(1, L.sky[2]);
  ctx.fillStyle = cielo; ctx.fillRect(0, 0, W, H);
  for (let s = 0; s < 40; s++) {
    if (ruido(s, 5) >= L.stars) continue;
    const a = QUIETO ? 0.5 : (Math.sin(ahora * (0.8 + ruido(s, 3) * 1.6) + s) + 1) / 2;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.45 * a})`;
    const r = 0.3 + ruido(s, 6) * 0.4;
    ctx.fillRect(ruido(s, 1) * W, ruido(s, 2) * y0 * 0.85, r * 2, r * 2);
  }
  const sol = L.sun, sx = W * sol.x, sy = y0 * sol.y * 1.6;
  const halo = ctx.createRadialGradient(sx, sy, sol.r * 0.6, sx, sy, sol.r * 3.4);
  halo.addColorStop(0, rgba(sol.halo, 0.32)); halo.addColorStop(1, rgba(sol.halo, 0));
  ctx.fillStyle = halo; ctx.fillRect(sx - sol.r * 3.4, sy - sol.r * 3.4, sol.r * 6.8, sol.r * 6.8);
  circulo(ctx, sx, sy, sol.r, sol.color);
  if (sol.moon) circulo(ctx, sx + sol.r * 0.45, sy - sol.r * 0.2, sol.r * 0.88, L.sky[0]);
  // Soft clouds drifting by
  esc.nubes ||= Array.from({ length: 3 }, (_, n) => ({ y: 0.1 + n * 0.14 + Math.random() * 0.05, w: 14 + Math.random() * 12, v: 1.2 + Math.random() * 2.4, d: Math.random() * 200 }));
  for (const nb of esc.nubes) {
    const x = ((ahora * nb.v + nb.d) % (W + nb.w * 2)) - nb.w;
    const g = ctx.createRadialGradient(x, nb.y * y0 * 1.4, 0, x, nb.y * y0 * 1.4, nb.w);
    g.addColorStop(0, `rgba(255,240,255,${L.clouds})`); g.addColorStop(1, 'rgba(255,240,255,0)');
    ctx.save(); ctx.translate(x, nb.y * y0 * 1.4); ctx.scale(1, 0.32); ctx.translate(-x, -nb.y * y0 * 1.4);
    ctx.fillStyle = g; ctx.fillRect(x - nb.w, nb.y * y0 * 1.4 - nb.w, nb.w * 2, nb.w * 2);
    ctx.restore();
  }
  // Two ranges of hills behind the gap, like Stick Ninja's night
  // (the near one low, over the water, so its ridge never reads as a wire under the deck)
  sierra(ctx, W, y0 + u * 0.1, u * 1.3, L.far, 'rgba(190,160,255,0.22)', 1.3, yAgua);
  sierra(ctx, W, yAgua, Math.min(u * 1.2, (yAgua - y0) * 0.45), L.near, 'rgba(190,160,255,0.08)', 4.1, yAgua);
  // Birds and the flying saucer, in the game only (never on the cover: they are a surprise)
  if (visitas) visitasCielo(V);

  // The water: a deep gradient and a lit surface that ripples
  const agua = ctx.createLinearGradient(0, yAgua, 0, H);
  agua.addColorStop(0, L.water[0]); agua.addColorStop(1, L.water[1]);
  ctx.fillStyle = agua; ctx.fillRect(0, yAgua, W, H - yAgua);
  const ola = x => Math.sin(x * 0.22 + ahora * 2) * 0.6;
  brilla(ctx, '#7af0ff', 4, () => {
    ctx.beginPath(); for (let x = 0; x <= W; x += 2) ctx.lineTo(x, yAgua + ola(x));
    ctx.strokeStyle = 'rgba(122,240,255,0.85)'; ctx.lineWidth = 0.7; ctx.stroke();
  });
  for (let n = 0; n < 7; n++) {
    const x = ((ruido(n, 9) * W + ahora * (3 + n)) % (W + 10)) - 5, y = yAgua + 2.5 + ruido(n, 8) * (H - yAgua - 4);
    linea(ctx, x, y, x + 3 + ruido(n, 7) * 4, y, 'rgba(191,248,255,0.35)', 0.4);
  }
  if (visitas) { visitaBallena(V); visitaLancha(V); }

  // The cliffs: dark silhouettes, their inner face faintly lit, a neon edge on top
  for (const [xa, xb, cara] of [[0, x0, x0], [x1, W, x1]]) {
    const roca = ctx.createLinearGradient(0, y0, 0, H);
    roca.addColorStop(0, L.rock[0]); roca.addColorStop(1, L.rock[1]);
    ctx.fillStyle = roca; ctx.fillRect(xa, y0, xb - xa, H - y0);
    const lado = ctx.createLinearGradient(0, y0, 0, H);
    lado.addColorStop(0, rgba(L.edge, 0.5)); lado.addColorStop(1, rgba(L.edge, 0));
    ctx.fillStyle = lado; ctx.fillRect(cara - 0.4, y0, 0.8, H - y0);
    brilla(ctx, L.edge, 6, () => { ctx.fillStyle = L.edge; ctx.fillRect(xa, y0 - 0.5, xb - xa, 1); });
  }

  // The mole digs through the cliff
  if (visitas) visitaTopo(V);

  // The anchors: a stone tower above the deck, a pillar out of the water, or a ledge on the cliff
  for (const [ax, ay] of e.anclas) {
    const [px, py] = A(ax, ay);
    const enOrilla = ax === 0 || ax === e.ancho;
    if (enOrilla && ay > 0) {
      const w = u * 0.5;
      const g = ctx.createLinearGradient(0, py, 0, y0);
      g.addColorStop(0, '#4a2c86'); g.addColorStop(1, '#2a1458');
      caja(ctx, px - w / 2, py, w, y0 - py, 0.8, g);
      ctx.fillStyle = 'rgba(190,160,255,0.35)'; ctx.fillRect(px - w / 2, py, 0.5, y0 - py);
      brilla(ctx, '#be9cff', 5, () => caja(ctx, px - w / 2 - 0.6, py - 0.6, w + 1.2, 1.2, 0.5, '#be9cff'));
    } else if (!enOrilla) {
      const w = u * 0.7;
      const g = ctx.createLinearGradient(0, py, 0, yAgua + 4);
      g.addColorStop(0, L.rock[0]); g.addColorStop(1, L.rock[1]);
      ctx.fillStyle = g; ctx.fillRect(px - w / 2, py, w, yAgua - py + 4);
      ctx.fillStyle = rgba(L.edge, 0.35); ctx.fillRect(px - w / 2, py, 0.5, yAgua - py); ctx.fillRect(px + w / 2 - 0.5, py, 0.5, yAgua - py);
      brilla(ctx, L.edge, 6, () => { ctx.fillStyle = L.edge; ctx.fillRect(px - w / 2, py - 0.5, w, 1); });
    } else {
      const lado = ax === 0 ? -1 : 1, w = u * 0.35;
      ctx.fillStyle = L.rock[0]; ctx.fillRect(lado < 0 ? px - w : px, py, w, u * 0.32);
      brilla(ctx, L.edge, 5, () => { ctx.fillStyle = L.edge; ctx.fillRect(lado < 0 ? px - w : px, py - 0.4, w, 0.8); });
    }
  }

  // The grid of points where a beam can go; while dragging, the reachable ones light up
  if (grilla) for (let x = 0; x <= e.ancho; x++) for (let y = ALTO[0]; y <= ALTO[1]; y++) {
    const [px, py] = A(x, y);
    const alcanza = arrastre && Math.hypot(x - arrastre.a[0], y - arrastre.a[1]) <= LARGO_MAX + 1e-9 && !(x === arrastre.a[0] && y === arrastre.a[1]);
    if (alcanza) brilla(ctx, '#9dff3a', 4, () => circulo(ctx, px, py, 1, 'rgba(157,255,58,0.9)'));
    else circulo(ctx, px, py, 0.55, arrastre ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)');
  }

  // The beams: glowing rods, the house's yellow warming to red with the strain; the deck a little thicker, with its rail
  const grosor = 1.2;
  const pos = sim ? i => [sim.nudos[i].x, sim.nudos[i].y] : null;
  const lista = sim ? sim.vigas.map((v, n) => ({ k: n, a: pos(v.i), b: pos(v.j), t: v.tension, rota: v.rota, camino: v.camino, acero: v.acero, quiebre: v.quiebre }))
    : vigas.map(v => ({ a: v.a, b: v.b, t: 0, camino: v.a[1] === 0 && v.b[1] === 0, acero: !!v.acero }));
  const parpadeo = Math.sin(ahora * 8) > 0 && Date.now() - (rotasAntes.desde || 0) < PARPADEO_MS;
  // Each material has its texture (owner's request: told apart at a glance). Wood: the warm rod with a
  // broken darker grain along it. Steel: a thicker cold rod with a bright top edge and rivets at even steps
  const viga = (ax, ay, bx, by, v, extra = 0) => {
    const ramp = v.acero ? TENSION_ACERO : TENSION, col = sim ? colorTension(v.t, v.quiebre, ramp) : ramp[0];
    const g = (v.camino ? grosor + 0.5 : grosor) + (v.acero ? 0.5 : 0);
    const l = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / l, uy = (by - ay) / l;
    const en = (d, o = 0) => [ax + ux * d - uy * o, ay + uy * d + ux * o];
    linea(ctx, ax, ay, bx, by, OSCURO, g + 1 + extra);
    brilla(ctx, col, v.acero ? 7 : 5, () => linea(ctx, ax, ay, bx, by, col, g));
    if (v.acero) {
      linea(ctx, ...en(0.6, -g / 4), ...en(l - 0.6, -g / 4), 'rgba(255,255,255,0.9)', 0.35);
      for (let d = 2.5; d < l - 1.5; d += 4) circulo(ctx, ...en(d, g / 6), 0.38, REMACHE);
    } else {
      // The grain: dashes of different lengths from a seed by where the beam is, so it doesn't flicker
      const semilla = Math.abs(Math.round(v.a[0] * 7 + v.a[1] * 13 + v.b[0] * 3 + v.b[1] * 5));
      for (let d = 1 + (semilla % 3) * 0.6, k = 0; d < l - 1; k++) {
        const largo = 1.6 + ((semilla + k * 5) % 4) * 0.7, o = (((semilla + k) % 3) - 1) * g * 0.18;
        linea(ctx, ...en(d, o), ...en(Math.min(l - 1, d + largo), o), VETA, 0.35);
        d += largo + 1.2 + ((semilla + k) % 3) * 0.6;
      }
    }
    if (v.camino) linea(ctx, ax, ay - g / 2 - 0.2, bx, by - g / 2 - 0.2, 'rgba(255,246,214,0.85)', 0.4);
  };
  for (const v of lista) {
    if (v.rota) continue;
    const [ax, ay] = A(...v.a), [bx, by] = A(...v.b);
    if (!sim && rotasAntes.has(`${v.a}|${v.b}`) && parpadeo) brilla(ctx, '#ff2e4a', 10, () => linea(ctx, ax, ay, bx, by, '#ff2e4a', grosor + 2.4));
    viga(ax, ay, bx, by, v);
  }
  // A beam that just snapped shakes the board and throws sparks and splinters
  if (sim) for (const v of lista) {
    if (!v.rota || esc.rotas.has(v.k)) continue;
    esc.rotas.add(v.k);
    if (QUIETO) continue;
    c.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(3px,-1px)' }, { transform: 'translate(-1px,1px)' }, { transform: 'translate(0,0)' }], { duration: 240 });
    const [ax, ay] = A(...v.a), [bx, by] = A(...v.b), mx = (ax + bx) / 2, my = (ay + by) / 2;
    for (let n = 0; n < 14; n++) esc.parts.agregar({ x: mx, y: my, vx: (Math.random() - 0.5) * 70, vy: -Math.random() * 60, g: 120, vida: 0.5 + Math.random() * 0.4, colores: ['#fff3a0', '#ffd23f', '#ff8a3d', '#ff2e88'], tipo: 'chispa' });
    for (let n = 0; n < 6; n++) esc.parts.agregar({ x: mx, y: my, vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 30, g: 160, vida: 1.2, radio: 0.7, colores: ['#ffd23f', '#ff9d3d', '#c8642e'] });
  }
  // The joints: the fixed ones are pink lights, the others small bolts
  const nudos = sim ? sim.nudos.map(n => ({ x: n.x, y: n.y, fijo: n.fijo })) : [...fijos(e).map(([x, y]) => ({ x, y, fijo: true })),
    ...[...usados].map(s => s.split(',').map(Number)).filter(([x, y]) => !fijos(e).some(([a, b]) => a === x && b === y)).map(([x, y]) => ({ x, y }))];
  for (const n of nudos) {
    const [px, py] = A(n.x, n.y);
    if (n.fijo) { circulo(ctx, px, py, 2, OSCURO); brilla(ctx, '#ff2e88', 6, () => circulo(ctx, px, py, 1.4, '#ff2e88')); circulo(ctx, px - 0.4, py - 0.4, 0.45, '#ffb3d6'); }
    else { circulo(ctx, px, py, 1.3, OSCURO); circulo(ctx, px, py, 0.7, '#fff6e0'); }
  }
  // A beam that crosses another, or runs over a bolt it doesn't end at, passes in front with a dark edge there
  for (const [v, [x, y]] of pasoPorEncima(lista.filter(w => !w.rota), nudos)) {
    const [ax, ay] = A(...v.a), [bx, by] = A(...v.b), l = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / l, uy = (by - ay) / l;
    const [px, py] = A(x, y), m = 3;
    viga(px - ux * m, py - uy * m, px + ux * m, py + uy * m, v, 1.6);
  }
  // The beam being dragged: dashes, green if it can go, pink if not, and a ring where it will land
  if (arrastre) {
    const [ax, ay] = A(...arrastre.a), [bx, by] = A(...arrastre.b), col = arrastre.ok ? '#9dff3a' : '#ff2e88';
    brilla(ctx, col, 6, () => {
      ctx.setLineDash([2, 1.6]); linea(ctx, ax, ay, bx, by, col, grosor); ctx.setLineDash([]);
      if (Number.isInteger(arrastre.b[0]) && Number.isInteger(arrastre.b[1])) { ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.stroke(); }
    });
  }

  // The train: the locomotive and two wagons on the deck, with its headlight and smoke
  if (sim) {
    const tr = sim.tren, giro = tr.x * 7;
    if (tr.cayo && !esc.caida) esc.caida = { dy: 0, vy: 0, salpico: false };
    if (esc.caida) { esc.caida.vy += 220 * dt; esc.caida.dy += esc.caida.vy * dt; }
    const piezas = PIEZAS.map((pz, n) => ({ x: tr.x + pz.dx, k: n, loco: n === 0 }));
    const en = piezas.map(p => { const h = alturaCamino(sim, p.x); const [px, py] = A(p.x, h ?? tr.y); return [px, py + (esc.caida && (h === null || p.k === tr.cayoPieza) ? esc.caida.dy : 0)]; });
    for (let n = 1; n < en.length; n++) {
      if (esc.sueltos.has(n)) continue;
      if (Math.abs(en[n][1] - en[n - 1][1]) > 3) {
        esc.sueltos.add(n);
        if (!QUIETO) for (let s = 0; s < 8; s++) esc.parts.agregar({ x: en[n][0] + 10, y: en[n][1] - 4, vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 40, g: 120, vida: 0.45, colores: ['#fff3a0', '#ffd23f', '#ff8a3d'], tipo: 'chispa' });
        continue;
      }
      linea(ctx, en[n][0] + 6, en[n][1] - 3.8, en[n - 1][0] - 9, en[n - 1][1] - 3.8, OSCURO, 1.2);
    }
    if (TREN.humo && !QUIETO && sim.t < 1.2 && Math.random() < 0.5) for (const s of [-1, 1]) esc.parts.agregar({ x: en[0][0] + s * 9, y: en[0][1] - 2, vx: s * (10 + Math.random() * 10), vy: -4, vida: 0.8, radio: 1, crece: 3, colores: ['rgba(255,255,255,0.7)'], tipo: 'humo' });
    // The headlight: a soft cone ahead
    if (!tr.cayo) {
      const [lx, ly] = [en[0][0] + TREN.luz.dx, en[0][1] + TREN.luz.dy];
      const cono = ctx.createLinearGradient(lx, 0, lx + 26, 0);
      cono.addColorStop(0, 'rgba(255,243,160,0.4)'); cono.addColorStop(1, 'rgba(255,243,160,0)');
      ctx.fillStyle = cono; ctx.beginPath(); ctx.moveTo(lx, ly - 0.8); ctx.lineTo(lx + 26, ly - 5); ctx.lineTo(lx + 26, ly + 5); ctx.lineTo(lx, ly + 0.8); ctx.closePath(); ctx.fill();
    }
    for (const p of piezas) {
      const [px, py] = en[p.k];
      if (py > yAgua + 4) {
        if (!esc.caida.salpico && !QUIETO) {
          esc.caida.salpico = true;
          for (let n = 0; n < 22; n++) esc.parts.agregar({ x: px, y: yAgua, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 50, g: 140, vida: 1, colores: ['#bff8ff', '#7af0ff', '#2ec4d6'] });
        }
        continue;
      }
      if (p.loco) TREN.frente(ctx, px, py - 0.5, { giro, carga: e.carga });
      else if (p.k === piezas.length - 1 && TREN.cola) TREN.cola(ctx, px, py - 0.5, { giro: giro + p.k });
      else TREN.vagon(ctx, px, py - 0.5, e.carga, giro + p.k);
      if (p.loco && TREN.humo && !tr.cayo && !QUIETO) {
        esc.humo += dt;
        if (esc.humo > 0.09) {
          esc.humo = 0;
          esc.parts.agregar({ x: px + TREN.humo.dx, y: py + TREN.humo.dy, vx: -8 - Math.random() * 8, vy: -16 - Math.random() * 6, vida: 1.5, radio: 1, crece: 2.6, colores: ['rgba(255,240,255,1)'], tipo: 'humo' });
        }
      }
    }
  }

  // The particles: smoke as soft puffs, sparks that glow, drops and splinters
  esc.parts.paso(dt);
  for (const p of esc.parts.lista) {
    const t = p.edad / p.vida, col = p.colores[Math.min(p.colores.length - 1, Math.floor(t * p.colores.length))];
    if (p.tipo === 'humo') {
      const r = Math.max(1, p.radio * 1.2), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, `rgba(240,230,255,${0.55 * (1 - t)})`); g.addColorStop(1, 'rgba(240,230,255,0)');
      ctx.fillStyle = g; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    } else if (p.tipo === 'chispa') brilla(ctx, col, 4, () => circulo(ctx, p.x, p.y, 0.6 * (1 - t) + 0.3, col));
    else { ctx.globalAlpha = 1 - t * 0.7; circulo(ctx, p.x, p.y, Math.max(0.45, p.radio), col); ctx.globalAlpha = 1; }
  }
}

/**
 * 🚂 Tren en Vilo — the scene: the canvas, the pixel-art drawing of a stage (sky, cliffs, water, the
 * beams, the train and its visitors), the strain gauge and the cover's demo bridge. Shared by the lab's
 * page (game.js) and La Copa's screen (cup/games/bridges/ui.js). No game state: who calls it passes it.
 */
import { el } from '../../assets/js/ui.js';
import { ALTO, LARGO_MAX, PIEZAS, fijos, paso, FISICA, alturaCamino } from './engine.js';
import { param } from '../../assets/js/parametros.js';
import { dibujarNeon, trenMiniNeon } from './neon.js';
import { pixelado, particulas, LOCO, CHIMENEA, trenDe } from './pixel.js';
import { visitasCielo, visitaBallena, visitaLancha, visitaTopo } from './visitors.js';

export const QUIETO = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
/**
 * The scene in the house style (neon.js) instead of pixel art: the lab's game since the owner approved it
 * (2026-10-25). `?style=pixel` brings back the pixel art there, to compare; La Copa's screen keeps the pixel
 * art unless `?style=neon`. The page gets the `tv-neon` class for the pieces around the board.
 */
export const NEON = param('style') === 'neon' || (param('style') !== 'pixel' && /\/labs\//.test(globalThis.location?.pathname ?? ''));
if (NEON) globalThis.document?.documentElement.classList.add('tv-neon');
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
// How long the beams that snapped in the last test blink red, while fixing the bridge
export const PARPADEO_MS = 8000;
export const pct = x => `${Math.round(x * 100)} %`;

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

export const MARGEN = 1.3;          // the cliffs, on each side, in grid units
const ARRIBA = ALTO[1] + 0.6, ABAJO = ALTO[0] - 1.1;

/** A canvas sized to its box, in device pixels; returns the world ↔ screen mapping. */
/**
 * The stage's train in small, next to its weight in the title: the locomotive and a wagon as they will
 * cross (passenger cars, crates, logs, coal or containers), so the weight has a picture.
 */
export function trenMini(carga, e) {
  if (NEON) return trenMiniNeon(carga, e);
  const { vagon, paleta } = trenDe(carga), dpr = window.devicePixelRatio || 1, px = 2;
  const ancho = 40, alto = Math.max(LOCO[0].length, vagon[0].length) + 1;
  const c = el('canvas', { class: 'tv-tren-mini', 'aria-hidden': 'true', width: ancho * px * dpr, height: alto * px * dpr });
  c.style.width = `${ancho * px}px`; c.style.height = `${alto * px}px`;
  const r = pixelado(c, { px });
  r.limpiar();
  r.sprite(vagon[0], paleta, 8, alto); r.sprite(LOCO[0], paleta, 28, alto);
  r.volcar();
  return c;
}

export function lienzo(e, { arriba = ARRIBA, abajo = ABAJO } = {}) {
  const c = el('canvas', { class: 'tv-lienzo' });
  c._v = { arriba, abajo };
  const ajustar = () => {
    const w = Math.min(c.parentElement?.clientWidth || 340, 560);
    const escala = w / (e.ancho + 2 * MARGEN);
    const h = Math.round(escala * (arriba - abajo));
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.style.width = `${w}px`; c.style.height = `${h}px`;
    c._m = { escala, dpr, w, h };
    // A fixed 16 art pixels per grid unit: the train is the same size on every stage, its wagons coupled
    c._r = pixelado(c, { px: escala / ARTE });
  };
  c._ajustar = ajustar;
  return c;
}
export const aPantalla = (c, x, y) => [(x + MARGEN) * c._m.escala, (c._v.arriba - y) * c._m.escala];
export const aMundo = (c, px, py) => [px / c._m.escala - MARGEN, c._v.arriba - py / c._m.escala];

/** Screen pixels per art pixel: the size of the pixel-art grid. */
const ARTE = 16;

/** The color of a beam by how stretched or squeezed it is: wood that warms to red, in steps. */
export const TENSION = ['#c8874a', '#d9a23a', '#e8b13a', '#f08a2c', '#ff5a3c', '#ff2e4a'];
/**
 * Where a beam passes over something it is not joined to: each crossing of two beams away from their
 * ends (the later one goes in front), and each bolt a beam runs over without ending there.
 * [[beam, [x, y]], …] in grid units.
 */
export function pasoPorEncima(vigas, nudos, eps = 0.04) {
  const res = [];
  const cerca = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < eps;
  for (let i = 0; i < vigas.length; i++) for (let j = i + 1; j < vigas.length; j++) {
    const v = vigas[i], w = vigas[j], [ax, ay] = v.a, [bx, by] = v.b, [cx, cy] = w.a, [dx, dy] = w.b;
    const den = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
    if (Math.abs(den) < 1e-9) continue;
    const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / den, s = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / den;
    if (t <= eps || t >= 1 - eps || s <= eps || s >= 1 - eps) continue;
    res.push([w, [ax + t * (bx - ax), ay + t * (by - ay)]]);
  }
  for (const v of vigas) for (const n of nudos) {
    const p = [n.x, n.y];
    if (cerca(p, v.a) || cerca(p, v.b)) continue;
    const [ax, ay] = v.a, [bx, by] = v.b, l2 = (bx - ax) ** 2 + (by - ay) ** 2;
    const t = ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / l2;
    if (t <= 0 || t >= 1) continue;
    if (Math.hypot(ax + t * (bx - ax) - p[0], ay + t * (by - ay) - p[1]) < eps) res.push([v, p]);
  }
  return res;
}
/**
 * The strain gauge, at the top of the board while the train crosses: a dial from 0 to 100 % of the
 * snapping point, its needle on the bridge's hardest-working beam right now, a mark that stays at the
 * peak so far and a white mark at the cheapest known bridge's peak (what solidity is measured against).
 */
export function medidor(referencia, T = { carga_titulo: 'Carga', maximo: 'máx. {p}' }) {
  const R = 50, cx = 70, cy = 66, ANCHO = 140, ALTO = 90;
  const punto = (f, r = R) => { const a = Math.PI * (1 - f); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
  const xy = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const arco = (f0, f1) => `M${xy(punto(f0))} A${R} ${R} 0 0 1 ${xy(punto(f1))}`;
  const marca = (f, r0, r1) => `M${xy(punto(f, r0))} L${xy(punto(f, r1))}`;
  // The peak: a triangle outside the dial, pointing in at the highest load reached
  const flecha = f => `M${xy(punto(f, R + 7))} L${xy(punto(f - 0.035, R + 17))} L${xy(punto(f + 0.035, R + 17))} Z`;
  const bandas = TENSION.map((col, k) => `<path d="${arco(k / TENSION.length, (k + 1) / TENSION.length)}" stroke="${col}" stroke-width="10" fill="none"/>`).join('');
  const caja = el('div', { class: 'tv-medidor', 'aria-hidden': 'true', hidden: true });
  // Drawn 10 % smaller than its own coordinates (owner's request), under its title
  caja.innerHTML = `<span class="tv-medidor-titulo">${T.carga_titulo}</span><svg viewBox="0 0 ${ANCHO} ${ALTO}" width="${Math.round(ANCHO * 0.9)}" height="${Math.round(ALTO * 0.9)}">${bandas}
    <path d="${marca(referencia, R - 7, R + 7)}" stroke="#fff" stroke-width="2"/>
    <path class="pico" d="${flecha(0)}" fill="#ff2e4a" stroke="#14081f" stroke-width="1" visibility="hidden"/>
    <line class="aguja" x1="${cx}" y1="${cy}" x2="${cx - R + 8}" y2="${cy}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="4.5" fill="#fff"/>
    <text x="${cx}" y="${ALTO - 3}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff"></text></svg>`;
  const aguja = caja.querySelector('.aguja'), pico = caja.querySelector('.pico'), texto = caja.querySelector('text');
  let suave = 0;
  return {
    caja,
    /** `actual` (the needle: the load right now) and `maximo` (the arrow: the peak so far), from 0 to 1. */
    poner(actual, maximo) {
      suave += (Math.min(1, actual) - suave) * 0.35;
      const [x, y] = punto(suave, R - 8);
      aguja.setAttribute('x2', x.toFixed(1)); aguja.setAttribute('y2', y.toFixed(1));
      if (maximo > 0.005) { pico.setAttribute('d', flecha(Math.min(1, maximo))); pico.setAttribute('visibility', 'visible'); }
      texto.textContent = fmt(T.maximo, { p: pct(maximo) });
    },
    ver(si) { caja.hidden = !si; if (si) { suave = 0; pico.setAttribute('visibility', 'hidden'); texto.textContent = ''; } },
  };
}
/** How hard the bridge works right now: its most strained unbroken beam, from 0 to 1 of the snapping point. */
export const esfuerzoAhora = sim => sim.vigas.reduce((m, v) => (v.rota ? m : Math.max(m, Math.abs(v.tension) / v.quiebre)), 0);
export const colorTension = (t, quiebre = FISICA.quiebre, ramp = TENSION) => ramp[Math.min(ramp.length - 1, Math.floor((Math.abs(t) / quiebre) * ramp.length))];
/** Steel by strain: cold gray that heats to orange and red, so it never reads as wood. */
export const TENSION_ACERO = ['#a9b0c4', '#b9b4c0', '#d6a58a', '#f08a2c', '#ff5a3c', '#ff2e4a'];

const CIELO = ['#1d0838', '#26093f', '#2f0c48', '#3a1152', '#46175c', '#521e66', '#5e2670'];
const ROCA = { base: '#5a2f8a', claro: '#7444a8', oscuro: '#3d1d63', borde: '#25103f' };
/**
 * The time of day along a game (owner's request): stage 1 in the morning, the middle ones toward
 * sunset, the last at night. Three palettes, and the stages in between mix them (`timeOfDay(t)`, t from
 * 0 = morning to 1 = night). The cover and anything without a stage stay at night.
 */
const MORNING = { sky: ['#3f86c9', '#4f93d0', '#5fa0d6', '#71aedc', '#86bde2', '#9dcbe6', '#b4d8ea'], rock: { base: '#8a5f42', claro: '#a77a55', oscuro: '#6a4530', borde: '#3a2416' },
  water: ['#1f7fa8', '#14608a'], stars: 0, clouds: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.35)'], sun: { x: 0.8, y: 0.14, r: 5, color: '#fff3a0', halo: 'rgba(255,240,160,0.35)' } };
const SUNSET = { sky: ['#3b2a6e', '#6b3a7e', '#a2477a', '#d45f6a', '#ee8458', '#f6a85a', '#f8c66c'], rock: { base: '#6e3f5c', claro: '#8c5672', oscuro: '#4e2a42', borde: '#2a1424' },
  water: ['#2c4f7e', '#1c3560'], stars: 0.15, clouds: ['rgba(255,190,150,0.35)', 'rgba(255,220,180,0.25)'], sun: { x: 0.25, y: 0.42, r: 7, color: '#ffb347', halo: 'rgba(255,160,80,0.35)' } };
const NIGHT = { sky: CIELO, rock: ROCA, water: ['#11415e', '#0b2c48'], stars: 1, clouds: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.05)'], sun: null };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixColor = (a, b, f) => {
  if (a.startsWith('rgba') || b.startsWith('rgba')) return f < 0.5 ? a : b;
  const [x, y] = [hex(a), hex(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * f).toString(16).padStart(2, '0')).join('');
};
const mix = (a, b, f) => ({
  sky: a.sky.map((c, i) => mixColor(c, b.sky[i], f)),
  rock: Object.fromEntries(Object.keys(a.rock).map(k => [k, mixColor(a.rock[k], b.rock[k], f)])),
  water: a.water.map((c, i) => mixColor(c, b.water[i], f)),
  stars: a.stars + (b.stars - a.stars) * f,
  clouds: f < 0.5 ? a.clouds : b.clouds,
  sun: f < 0.5 ? a.sun : b.sun,
});
// `t` stays on it, so the neon scene can draw the same time of day in its own palette
export const timeOfDay = t => ({ ...(t <= 0.5 ? mix(MORNING, SUNSET, t / 0.5) : mix(SUNSET, NIGHT, (t - 0.5) / 0.5)), t });
const MADERA = { borde: '#3a1d10', riel: '#e6e6f0', cuerpo: '#c8874a', veta: '#8a5226', nudo: '#5e3418' };
const ACERO = { borde: '#1c1d2a', brillo: '#eef0f8', remache: '#3c4054' };

/**
 * A beam with its material's texture (owner's request: wood and steel must be told apart at a glance).
 * Wood: a warm plank with a broken darker grain along it and a knot now and then. Steel: a cold gray
 * bar with a bright top edge and rivets at even steps. `col` is the body color (the strain's, while it runs).
 */
function viga(r, ax, ay, bx, by, g, v, col) {
  const l = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / l, uy = (by - ay) / l, nx = -uy, ny = ux;
  const en = (d, o = 0) => [ax + ux * d + nx * o, ay + uy * d + ny * o];
  if (v.acero) {
    r.linea(ax, ay, bx, by, ACERO.borde, g + 2);
    r.linea(ax, ay, bx, by, col, g + 1);
    const o = -Math.max(1, (g + 1) / 2) + 0.5;
    r.linea(...en(0, o), ...en(l, o), ACERO.brillo, 1);
    for (let d = 3; d < l - 2; d += 5) r.punto(...en(d).map(Math.round), ACERO.remache);
    return;
  }
  r.linea(ax, ay, bx, by, MADERA.borde, g + 1);
  r.linea(ax, ay, bx, by, col, g);
  // The grain: dashes of different lengths, from a seed by the beam's position, so it doesn't flicker
  const semilla = Math.abs(Math.round(ax * 7 + ay * 13 + bx * 3 + by * 5));
  for (let d = 1 + (semilla % 3), k = 0; d < l - 1; k++) {
    const largo = 2 + ((semilla + k * 5) % 4);
    r.linea(...en(d), ...en(Math.min(l - 1, d + largo)), MADERA.veta, 1);
    d += largo + 2 + ((semilla + k) % 3);
  }
  if (l > 12) r.punto(...en(l * (0.3 + (semilla % 4) / 10)).map(Math.round), MADERA.nudo);
}
const HUMO = ['rgba(255,255,255,0.95)', 'rgba(235,232,245,0.85)', 'rgba(200,196,220,0.7)', 'rgba(160,156,188,0.5)', 'rgba(130,126,160,0.3)'];
const CHISPAS = ['#fff3a0', '#ffd23f', '#ff8a3d', '#ff2e4a'];
const ASTILLAS = ['#e8b070', '#c8874a', '#8a5a30'];
const AGUA = ['#bff8ff', '#7af0ff', '#2ec4d6'];

/** A fixed pseudo-random number for a position: the stars and the rock grain don't flicker. */
const ruido = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };

/**
 * Draws a stage in pixel art: sky, clouds, cliffs, water, the grid (while building), the beams and
 * the train with its smoke. `sim` (while it runs) gives positions and tensions; without it, the
 * beams as laid. The scene keeps its own particles and clock on the canvas (`c._esc`).
 */
export function dibujar(c, e, { vigas = [], sim = null, grilla = false, arrastre = null, usados = new Set(), rotasAntes = new Set(), visitas = null } = {}) {
  if (NEON) return dibujarNeon(c, e, arguments[2]);
  const r = c._r;
  if (!r) return;
  const ahora = performance.now() / 1000;
  const esc = c._esc ||= { parts: particulas(), ultimo: ahora, humo: 0, rotas: new Set(), caida: null, sim: null };
  const dt = Math.min(0.05, ahora - esc.ultimo); esc.ultimo = ahora;
  if (esc.sim !== sim) { esc.sim = sim; esc.rotas = new Set(); esc.caida = null; esc.sueltos = new Set(); }
  const A = (x, y) => { const [px, py] = aPantalla(c, x, y); return [px / r.px, py / r.px]; };
  const u = ARTE;                        // art pixels per grid unit
  const { W, H } = r;
  // The time of day (owner's request): the stage's light, from morning to night (timeOfDay)
  const time = c._time || NIGHT, SKY = time.sky, RK = time.rock;

  // The sky, in bands, with stars that twinkle and two clouds drifting by
  for (let y = 0; y < H; y++) r.rect(0, y, W, 1, SKY[Math.min(SKY.length - 1, Math.floor((y / H) * SKY.length * 1.3))]);
  // The sun (or the moon at night): high in the morning, low and orange at sunset
  if (time.sun) { const [ax, ay] = [W * time.sun.x, H * time.sun.y]; r.circulo(ax, ay, time.sun.r + 2, time.sun.halo); r.circulo(ax, ay, time.sun.r, time.sun.color); }
  for (let k = 0; k < 26; k++) {
    const x = Math.floor(ruido(k, 1) * W), y = Math.floor(ruido(k, 2) * H * 0.45);
    if (ruido(k, 5) < time.stars && Math.sin(ahora * (1 + ruido(k, 3) * 2) + k) > -0.3) r.punto(x, y, ruido(k, 4) > 0.5 ? '#fff3a0' : '#ffffff');
  }
  // Clouds, each with its own shape (puffs of different sizes drawn once per scene), height and speed;
  // the top of each puff a little lighter
  esc.nubes ||= Array.from({ length: 3 }, (_, k) => {
    const n = 3 + Math.floor(Math.random() * 4), puffs = [];
    let x = 0;
    for (let i = 0; i < n; i++) { const rr = 2 + Math.floor(Math.random() * 4); puffs.push([x, -Math.floor(Math.random() * 3), rr]); x += rr + Math.floor(Math.random() * 3); }
    return { puffs, ancho: x + 4, y: H * (0.06 + 0.13 * k + Math.random() * 0.05), v: 1.5 + Math.random() * 3, desfase: Math.random() * (W + 60) };
  });
  for (const nb of esc.nubes) {
    const x = ((ahora * nb.v + nb.desfase) % (W + nb.ancho + 20)) - nb.ancho - 10;
    for (const [dx, dy, rr] of nb.puffs) r.circulo(x + dx, nb.y + dy, rr, time.clouds[0]);
    for (const [dx, dy, rr] of nb.puffs) r.circulo(x + dx, nb.y + dy - 1, Math.max(1, rr - 1), time.clouds[1]);
  }

  // Visitors, only in the game (never on the cover: they are a surprise): visitors.js
  if (visitas) visitasCielo({ r, esc, e, c, A, W, H, ahora, dt, visitas });

  // The water, with waves that run and glint
  const [, yAgua] = A(0, c._v.abajo + 0.7);
  r.rect(0, yAgua, W, H - yAgua, time.water[0]);
  r.rect(0, yAgua + 3, W, H - yAgua, time.water[1]);
  for (let x = 0; x < W; x++) {
    const ola = Math.round(Math.sin(x * 0.35 + ahora * 2.2) * 1.2);
    r.punto(x, yAgua + ola, AGUA[1]);
    if (ruido(x, Math.floor(ahora * 3)) > 0.93) r.punto(x, yAgua + 2 + ola, AGUA[0]);
  }

  if (visitas) visitaBallena({ r, esc, e, A, ahora, dt, visitas, yAgua });
  if (visitas) visitaLancha({ r, esc, e, A, W, ahora, dt, visitas, yAgua });

  // The cliffs: rock with grain, an outline and grass on top
  const [x0, y0] = A(0, 0), [x1] = A(e.ancho, 0);
  const roca = (xa, xb) => {
    r.rect(xa, y0, xb - xa, H - y0, RK.base);
    for (let y = Math.ceil(y0) + 2; y < H; y++) for (let x = Math.floor(xa); x < xb; x++) {
      const n = ruido(x, y);
      if (n > 0.9) r.punto(x, y, RK.claro); else if (n < 0.08) r.punto(x, y, RK.oscuro);
    }
  };
  roca(0, x0); roca(x1, W);
  r.rect(x0 - 1, y0, 1, H - y0, RK.borde); r.rect(x1, y0, 1, H - y0, RK.borde);
  for (const [xa, xb] of [[0, x0], [x1, W]]) {
    r.rect(xa, y0 - 1, xb - xa, 2, '#6fd42a'); r.rect(xa, y0 - 2, xb - xa, 1, '#9dff3a');
    for (let x = Math.floor(xa); x < xb; x += 3) if (ruido(x, 7) > 0.5) r.punto(x, y0 - 3, '#9dff3a');
  }
  if (visitas) visitaTopo({ r, esc, e, A, W, ahora, dt, visitas, yAgua, x0, x1, y0 });

  // The anchors, each on what holds it: a stone tower above the deck, a rock pillar rising out of the
  // water in the gap, or a ledge on the cliff's face
  for (const [ax, ay] of e.anclas) {
    const [px, py] = A(ax, ay);
    const enOrilla = ax === 0 || ax === e.ancho;
    if (enOrilla && ay > 0) {
      const ancho = Math.round(u * 0.5), xa = Math.round(px - ancho / 2);
      r.rect(xa, py, ancho, y0 - py, '#8a7aa8');
      for (let yy = Math.round(py) + 3; yy < y0; yy += 4) r.rect(xa, yy, ancho, 1, '#5e5080');
      r.rect(xa - 1, py - 1, ancho + 2, 2, '#b9aed6');
    } else if (!enOrilla) {
      const ancho = Math.round(u * 0.7), xa = Math.round(px - ancho / 2);
      r.rect(xa, py, ancho, yAgua - py + 6, RK.base);
      for (let yy = Math.round(py) + 2; yy < yAgua; yy++) for (let xx = xa; xx < xa + ancho; xx++) { const n = ruido(xx, yy); if (n > 0.88) r.punto(xx, yy, RK.claro); else if (n < 0.1) r.punto(xx, yy, RK.oscuro); }
      r.rect(xa, py, ancho, 1, RK.claro); r.rect(xa - 1, py, 1, yAgua - py, RK.borde); r.rect(xa + ancho, py, 1, yAgua - py, RK.borde);
    } else {
      r.rect(px - u * 0.35, py, u * 0.7, u * 0.35, RK.base); r.rect(px - u * 0.35, py, u * 0.7, 1, RK.claro);
    }
  }

  // The grid of points where a beam can go
  // While dragging, the points the beam can reach light up, and a ring marks where it will land
  if (grilla) for (let x = 0; x <= e.ancho; x++) for (let y = ALTO[0]; y <= ALTO[1]; y++) {
    const [px, py] = A(x, y);
    const alcanza = arrastre && Math.hypot(x - arrastre.a[0], y - arrastre.a[1]) <= LARGO_MAX + 1e-9 && !(x === arrastre.a[0] && y === arrastre.a[1]);
    if (alcanza) r.rect(px - 1, py - 1, 2, 2, 'rgba(157,255,58,0.85)'); else r.punto(px, py, arrastre ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.45)');
  }

  // The beams as planks: a dark edge, the wood (warming to red with the strain), rails on the road
  // Thin planks: on a phone the grid is small, and a thick beam hides where it starts and ends
  const grosor = Math.max(1, Math.round(u * 0.07));
  const pos = sim ? i => [sim.nudos[i].x, sim.nudos[i].y] : null;
  const lista = sim ? sim.vigas.map((v, k) => ({ k, a: pos(v.i), b: pos(v.j), t: v.tension, rota: v.rota, camino: v.camino, acero: v.acero, quiebre: v.quiebre }))
    : vigas.map(v => ({ a: v.a, b: v.b, t: 0, camino: v.a[1] === 0 && v.b[1] === 0, acero: !!v.acero }));
  const cuerpo = v => (v.acero ? (sim ? colorTension(v.t, v.quiebre, TENSION_ACERO) : TENSION_ACERO[0]) : sim ? colorTension(v.t, v.quiebre) : MADERA.cuerpo);
  // It blinks for a few seconds after the test and then stops: a red that never ends gets in the way
  const parpadeo = Math.sin(ahora * 8) > 0 && Date.now() - (rotasAntes.desde || 0) < PARPADEO_MS;
  for (const v of lista) {
    if (v.rota) continue;
    const [ax, ay] = A(...v.a), [bx, by] = A(...v.b), g = v.camino ? grosor + 1 : grosor;
    // A beam that snapped in the last test glows red while you fix the bridge
    if (!sim && rotasAntes.has(`${v.a}|${v.b}`) && parpadeo) r.linea(ax, ay, bx, by, '#ff2e4a', g + 3);
    viga(r, ax, ay, bx, by, g, v, cuerpo(v));
    if (v.camino) r.linea(ax, ay - Math.ceil(g / 2), bx, by - Math.ceil(g / 2), MADERA.riel, 1);
  }
  // A beam that just snapped throws sparks and splinters
  if (sim) for (const v of lista) {
    if (!v.rota || esc.rotas.has(v.k)) continue;
    esc.rotas.add(v.k);
    if (!QUIETO) c.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(3px,-1px)' }, { transform: 'translate(-1px,1px)' }, { transform: 'translate(0,0)' }], { duration: 240 });
    const [ax, ay] = A(...v.a), [bx, by] = A(...v.b), mx = (ax + bx) / 2, my = (ay + by) / 2;
    if (!QUIETO) {
      for (let n = 0; n < 12; n++) esc.parts.agregar({ x: mx, y: my, vx: (Math.random() - 0.5) * 70, vy: -Math.random() * 60, g: 120, vida: 0.5 + Math.random() * 0.4, colores: CHISPAS });
      for (let n = 0; n < 6; n++) esc.parts.agregar({ x: mx, y: my, vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 30, g: 160, vida: 1.2, radio: 1, colores: ASTILLAS });
    }
  }
  // The joints: bolts; the fixed ones are pink plates
  const nudos = sim ? sim.nudos.map(n => ({ x: n.x, y: n.y, fijo: n.fijo })) : [...fijos(e).map(([x, y]) => ({ x, y, fijo: true })),
    ...[...usados].map(k => k.split(',').map(Number)).filter(([x, y]) => !fijos(e).some(([a, b]) => a === x && b === y)).map(([x, y]) => ({ x, y }))];
  for (const n of nudos) {
    const [px, py] = A(n.x, n.y);
    if (n.fijo) { r.rect(px - 2, py - 2, 5, 5, '#25103f'); r.rect(px - 1, py - 1, 3, 3, '#ff2e88'); r.punto(px - 1, py - 1, '#ff9cc8'); }
    else { r.circulo(px, py, 2, '#25103f'); r.circulo(px, py, 1, '#e6e6f0'); }
  }
  // Not every touch is a joint: a beam that crosses another, or runs over a bolt it doesn't end at,
  // passes in front, with a dark edge around it there, so it doesn't read as joined (owner's request)
  const vivas = lista.filter(v => !v.rota);
  const pieza = (v, [x, y]) => {
    const [ax, ay] = A(...v.a), [bx, by] = A(...v.b), l = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / l, uy = (by - ay) / l;
    const [px, py] = A(x, y), m = 3, g = v.camino ? grosor + 1 : grosor;
    r.linea(px - ux * m, py - uy * m, px + ux * m, py + uy * m, v.acero ? ACERO.borde : MADERA.borde, g + 3);
    r.linea(px - ux * m, py - uy * m, px + ux * m, py + uy * m, cuerpo(v), v.acero ? g + 1 : g);
  };
  for (const [p, q] of pasoPorEncima(vivas, nudos)) pieza(p, q);
  // The beam being dragged: dashes, green if it can go, red if not
  if (arrastre) {
    const [ax, ay] = A(...arrastre.a), [bx, by] = A(...arrastre.b), col = arrastre.ok ? '#9dff3a' : '#ff2e88';
    if (Number.isInteger(arrastre.b[0]) && Number.isInteger(arrastre.b[1])) { r.circulo(bx, by, 4, col); r.circulo(bx, by, 3, 'rgba(20,8,31,0.9)'); }
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 3));
    for (let k = 0; k < n; k += 2) r.linea(ax + (bx - ax) * k / n, ay + (by - ay) * k / n, ax + (bx - ax) * Math.min(1, (k + 1) / n), ay + (by - ay) * Math.min(1, (k + 1) / n), col, grosor);
  }

  // The train: the locomotive and two wagons, each on the deck where it is, with smoke from the chimney
  if (sim) {
    // The wheel frame, from the distance run (positive also while the train is still left of the gap)
    const tr = sim.tren, cuadro = ((Math.floor(tr.x * 7) % 6) + 6) % 6;
    // Its look follows its weight: old passenger cars at first, bigger loads on the heavier stages
    const { vagon: VAGON, paleta: PALETA_TREN } = trenDe(e.carga);
    const piezas = PIEZAS.map((pz, k) => ({ x: tr.x + pz.dx, k, loco: k === 0, spr: k === 0 ? LOCO[cuadro % 3] : VAGON[(cuadro + k) % 2] }));
    if (tr.cayo && !esc.caida) esc.caida = { dy: 0, vy: 0, salpico: false };
    if (esc.caida) { esc.caida.vy += 220 * dt; esc.caida.dy += esc.caida.vy * dt; }
    // The couplings first, under the bodies: a short dark bar between each pair, at wheel height
    const en = piezas.map(p => { const h = alturaCamino(sim, p.x); const [px, py] = A(p.x, h ?? tr.y); return [px, py + (esc.caida && (h === null || p.k === tr.cayoPieza) ? esc.caida.dy : 0)]; });
    // A coupling is rigid: if two pieces part (one falls), it snaps for good, with a spark, and each falls on its own
    esc.sueltos ||= new Set();
    for (let k = 1; k < en.length; k++) {
      if (esc.sueltos.has(k)) continue;
      if (Math.abs(en[k][1] - en[k - 1][1]) > 3) {
        esc.sueltos.add(k);
        if (!QUIETO) for (let n = 0; n < 8; n++) esc.parts.agregar({ x: en[k][0] + 10, y: en[k][1] - 4, vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 40, g: 120, vida: 0.45, colores: CHISPAS });
        continue;
      }
      r.linea(en[k][0] + 6, en[k][1] - 4, en[k - 1][0] - 9, en[k - 1][1] - 4, '#14081f', 2);
    }
    // Departure: steam puffs from under the wheels while it starts
    if (!QUIETO && sim.t < 1.2 && Math.random() < 0.5) for (const sx of [-1, 1]) esc.parts.agregar({ x: en[0][0] + sx * 9, y: en[0][1] - 2, vx: sx * (10 + Math.random() * 10), vy: -4, vida: 0.8, radio: 1, crece: 3, colores: HUMO });
    // The headlight: a soft cone ahead of the locomotive
    if (!tr.cayo) for (let k = 0; k < 10; k++) r.rect(en[0][0] + 12 + k, en[0][1] - 9 - k / 4, 1, 2 + k / 2, `rgba(255,243,160,${0.32 - k * 0.03})`);
    for (const p of piezas) {
      let [px, py] = en[p.k];
      if (py > yAgua + 4) {
        if (!esc.caida.salpico && !QUIETO) {
          esc.caida.salpico = true;
          for (let n = 0; n < 22; n++) esc.parts.agregar({ x: px, y: yAgua, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 50, g: 140, vida: 1, colores: AGUA });
        }
        continue;
      }
      r.sprite(p.spr, PALETA_TREN, px, py - 1);
      if (p.loco && !tr.cayo && !QUIETO) {
        esc.humo += dt;
        if (esc.humo > 0.09) {
          esc.humo = 0;
          esc.parts.agregar({ x: px + CHIMENEA.dx, y: py + CHIMENEA.dy, vx: -8 - Math.random() * 8, vy: -16 - Math.random() * 6, vida: 1.5, radio: 1, crece: 2.6, colores: HUMO });
        }
      }
    }
  }
  esc.parts.paso(dt);
  esc.parts.dibujar(r);
  r.volcar();
}

/* ------------------------------------------------------------------ */
/* The cover: a truss that a train crosses, over and over               */
/* ------------------------------------------------------------------ */

export const DEMO = (() => {
  const W = 4, v = [], V = (a, b) => v.push({ a, b });
  for (let i = 0; i < W; i++) V([i, 0], [i + 1, 0]);
  V([1, 1], [2, 1]); V([2, 1], [3, 1]);
  for (let i = 1; i < W; i++) V([i, 0], [i, 1]);
  V([0, 0], [1, 1]); V([W, 0], [W - 1, 1]); V([1, 1], [2, 0]); V([3, 1], [2, 0]);
  return v;
})();

/** Has the last wagon left the screen, past the right cliff? */
export const fueraDeEscena = (sim, e) => sim.tren.x + PIEZAS[PIEZAS.length - 1].dx - 0.6 > e.ancho + MARGEN;

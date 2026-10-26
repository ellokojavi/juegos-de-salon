/**
 * Stick Ninja — lab prototype (D-446), inspired by Stick Hero (Ketchapp, 2014): hold to stretch a stick,
 * let go and it falls across the gap. English only for now, like Stack (D-445). The engine is engine.js;
 * this file draws the night, the pillars and the ninja on a canvas, reads the finger and celebrates.
 *
 * The hold is measured between the press's and the release's own timestamps, so a slow phone does not
 * play a harder game (engine.js). The course is the day's: everyone
 * crosses the same gaps today, and the phone keeps today's runs, so a group can pass it around.
 */
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { COMMON, SITIO } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { param } from '../../assets/js/parametros.js';
import {
  newGame, pillar, pillarAt, current, next, press, release, suspend, stickAt, advance, pause, runX, walkEnd,
  holdFor, restX, daySeed, card, VIEW, HOLD_X, TURN_MS, NINJA, PERFECT, MAX_BONUS,
  revive, LIVES,
} from './engine.js';

trackVisit();   // the site's traffic (D-208)

const GAME_ID = 'stick';
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const KETCHAPP = 'https://www.ketchappgames.com/';
const BEST_KEY = 'juegos-de-salon:stick-best';
const TODAY_KEY = 'juegos-de-salon:stick-today';
const MOVING_KEY = 'juegos-de-salon:stick-moving';
const T = {
  nombre: 'Stick Ninja',
  lema: 'Stretch the stick, cross the gap, plant the flag.',
  como: [
    ['👆', 'Hold to stretch the stick, let go to drop it across the gap. You have ❤️ 3 lives.'],
    ['🚩', 'Land its tip on the flag for a perfect: +1, then +2, +3… for each one in a row.'],
    ['↔️', 'Later on, some pillars slide: aim where they will be when the stick lands.'],
  ],
  hoy: '📅 Today\'s course is the same for everyone. Pass the phone and compare.',
  jugar: '🥷 Play',
  sostener: 'Hold to stretch the stick',
  seguirSosteniendo: 'Hold to keep stretching',
  movil: 'This pillar moves: aim where it will be when the stick lands',
  pausa: 'Paused', seguir: 'Tap to continue',
  perfecto: 'Perfect!', racha: 'Perfect ×{n}',
  fin: { short: 'Too short!', long: 'Too long!' },
  vidas: ['', 'Last life!', '❤️ 2 lives left'],
  vidasAria: '{n} lives left',
  finCorto: 'Game over',
  record: '🏆 New best!',
  mejor: 'Your best: {n}',
  mejorCorto: '🏆 Best: {n}',
  logros: {
    primero: ['🚩', 'Bullseye!', 'Your first flag'],
    racha3: ['🔥', 'On fire', '3 perfects in a row'],
    racha5: ['⚡', 'Unstoppable', 'Max bonus: +5 a bridge'],
    racha8: ['👑', 'Flag master', '8 perfects in a row'],
    movil: ['🎯', 'Moving target', 'A flag on a moving pillar'],
    mejor: ['🏆', 'New best!', 'Beyond your record'],
    puntos: ['🏯', '{n} points', 'Keep going'],
  },
  desglose: {
    puentes: ['🌉 No bridges crossed.', '🌉 1 bridge crossed.', '🌉 {n} bridges crossed.'],
    perfectos: ['🚩 No flags.', '🚩 1 flag: +{b} bonus.', '🚩 {n} flags: +{b} bonus.'],
    racha: '🔥 Longest flag streak: {n}.',
  },
  hoyTitulo: 'Today on this phone',
  otraVez: '🔁 Play again', pasar: 'Same course: pass the phone and compare.',
  laboratorio: '‹ Back to the lab',
  comentarAbrir: '💬 Leave a comment',
  comentario: { titulo: 'What did you think?', lead: 'Tell us if it felt fair, if the stick did what your finger meant, and what you would change.', ph: 'For example: the flags are too small.', nombre: 'Name or nickname (optional)', enviar: 'Send comment', enviando: 'Sending…', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your comment arrived.', guardado: 'There is no internet right now: your comment is saved on this phone and will be sent later.', error: 'It could not be sent. Try again in a while.', cancelar: 'Cancel', cerrar: 'Close' },
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const plural = (arr, n, o = {}) => fmt(arr[Math.min(n, 2)], { n, ...o });

const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const S = { g: null, fin: false, desde: 0, antes: 0, pausa: 0, logros: null, presionar: null, soltar: null, pausar: null };

/** Today, on the phone's calendar: the course's seed. `?seed=` plays another course (tests, sharing a run). */
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const semilla = () => { const s = Number(param('seed')); return Number.isFinite(s) && s > 0 ? s : daySeed(hoy()); };

function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, puntaje: S.g ? S.g.score : 0,
  url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

/** The house's neon (base.css): each pillar's top edge takes the next one. */
const NEON = [[255, 46, 136], [255, 122, 26], [255, 210, 63], [157, 255, 58], [46, 230, 214], [138, 77, 255]];
const rgb = ([r, g, b], a = 1) => `rgba(${r},${g},${b},${a})`;
const GOLD = [255, 210, 63];
const easeIn = k => k * k;
const easeOut = k => 1 - (1 - k) ** 3;
const clamp01 = k => Math.max(0, Math.min(1, k));

/** A smooth skyline of peaks at world x (no randomness: the same mountains on every phone and every frame). */
const cumbre = (x, f) => 1 - Math.abs(Math.sin(x * 0.009 * f)) * 0.6 - Math.abs(Math.sin(x * 0.021 * f + 1.7)) * 0.3 - Math.abs(Math.sin(x * 0.047 * f + 0.4)) * 0.1;

/**
 * The scene on a canvas: the night (stars, a moon, two ranges of mountains moving slower than the
 * pillars), the pillars with their flags, the stick, the ninja, and what celebrates (pulses, sparks,
 * floating points). The canvas is transparent: it stands on the app's own night.
 */
function escena(canvas, { compacto = false } = {}) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, s = 1, G = 0, ultimo = 0;
  const cam = { x: 0, from: 0, to: 0, t0: 0 };
  const pulsos = [];   // the emerging pulse of a perfect: { x, y, born, color, max }
  const chispas = [];  // sparks: { x, y, vx, vy, born, life, color, size }
  const flotan = [];   // floating points: { x, y, text, born, color }
  const doradas = new Set();   // the pillars whose flag was hit: they keep a gold flag
  let golpe = null;    // the flag just hit, popping: { k, born }
  let previo = null;   // the last bridge, still lying across its gap: { x0, len }
  let muerte = null;   // the fall at the end: { kind, born, x, y, vy, vx, rot }
  let destello = 0;    // a soft flash of the whole night, for a perfect

  const medir = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(3, devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    s = W / VIEW;
    G = H * (compacto ? 0.66 : 0.63);
  };
  const ro = new ResizeObserver(medir); ro.observe(canvas); medir();

  const sx = wx => (wx - cam.x) * s;
  const camara = now => {
    const k = clamp01((now - cam.t0) / 420);
    cam.x = cam.from + (cam.to - cam.from) * easeOut(k);
  };

  /* --- the night --- */
  const ESTRELLAS = Array.from({ length: 70 }, (_, i) => {
    const a = Math.sin(i * 127.1) * 43758.5453, b = Math.sin(i * 311.7) * 12345.678;
    return { x: (a - Math.floor(a)) * 1400, y: (b - Math.floor(b)), r: 0.5 + ((i * 7) % 5) / 5, f: i * 0.7 };
  });
  function fondo(now) {
    // Stars that barely move, and twinkle
    for (const e of ESTRELLAS) {
      const x = ((e.x - cam.x * 0.06 * s) % (W + 40) + W + 40) % (W + 40) - 20;
      const y = e.y * G * 0.75;
      ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.35 * (QUIETO ? 0.5 : (Math.sin(now / 700 + e.f) + 1) / 2)})`;
      ctx.fillRect(x, y, e.r * 1.4, e.r * 1.4);
    }
    // The moon, with its halo
    const mx = W * 0.78, my = G * 0.2, mr = Math.max(14, 24 * s * (compacto ? 0.8 : 1));
    const halo = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3.2);
    halo.addColorStop(0, 'rgba(255,210,63,0.25)'); halo.addColorStop(1, 'rgba(255,210,63,0)');
    ctx.fillStyle = halo; ctx.fillRect(mx - mr * 3.2, my - mr * 3.2, mr * 6.4, mr * 6.4);
    ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(42,10,74,0.9)'; ctx.beginPath(); ctx.arc(mx + mr * 0.45, my - mr * 0.2, mr * 0.88, 0, Math.PI * 2); ctx.fill();
    // Two ranges of mountains: the far one slow and faint, the near one darker
    sierra(0.12, G * 0.66, G * 0.4, [34, 10, 62], 0.55, 'rgba(190,160,255,0.22)', 0.8);
    sierra(0.3, G * 0.9, G * 0.32, [21, 7, 38], 0.8, 'rgba(255,210,63,0.16)', 1.3);
  }
  /** A range of mountains: a dark silhouette, its ridge faintly lit by the moon. */
  function sierra(par, base, alto, color, opacidad, borde, f) {
    const off = cam.x * par;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 6; x += 6) ctx.lineTo(x, base - alto * cumbre(x / s + off, f));
    ctx.lineTo(W, H); ctx.closePath();
    const gr = ctx.createLinearGradient(0, base - alto, 0, H);
    gr.addColorStop(0, rgb(color, opacidad)); gr.addColorStop(1, rgb(color, opacidad * 0.4));
    ctx.fillStyle = gr; ctx.fill();
    ctx.beginPath();
    for (let x = 0; x <= W + 6; x += 6) ctx.lineTo(x, base - alto * cumbre(x / s + off, f));
    ctx.strokeStyle = borde; ctx.lineWidth = 1.2; ctx.stroke();
  }

  /* --- pillars and flags --- */
  function columna(p, k, now, objetivo) {
    const x = sx(p.x), w = p.w * s;
    if (p.move && objetivo) riel(pillar(lastG, k), now);
    if (x > W + 4 || x + w < -4) return;
    const gr = ctx.createLinearGradient(0, G, 0, H);
    const c = NEON[k % NEON.length];
    gr.addColorStop(0, '#2b1150'); gr.addColorStop(0.7, 'rgba(30,10,56,0.9)'); gr.addColorStop(1, 'rgba(21,7,38,0)');
    ctx.fillStyle = gr; ctx.fillRect(x, G, w, H - G);
    // Its sides, faintly lit in its color, so it stands out of the mountains
    const lado = ctx.createLinearGradient(0, G, 0, G + (H - G) * 0.7);
    lado.addColorStop(0, rgb(c, 0.45)); lado.addColorStop(1, rgb(c, 0));
    ctx.fillStyle = lado; ctx.fillRect(x, G, 1.5, (H - G) * 0.7); ctx.fillRect(x + w - 1.5, G, 1.5, (H - G) * 0.7);
    // The neon top edge
    ctx.save(); ctx.shadowColor = rgb(c); ctx.shadowBlur = 10;
    ctx.fillStyle = rgb(c); ctx.fillRect(x, G - 1, w, 3);
    ctx.restore();
    if (k === 0) return;
    // The flag at its center: the target. The one to reach waves; a hit one stays gold
    const oro = doradas.has(k), cx = sx(p.x + p.w / 2);
    // The perfect zone, a small lit strip at the pole's foot
    ctx.fillStyle = oro ? rgb(GOLD) : objetivo ? 'rgba(255,46,136,0.95)' : 'rgba(255,46,136,0.5)';
    ctx.fillRect(cx - PERFECT * s, G - 1, PERFECT * 2 * s, 3);
    bandera(cx, k, now, oro, objetivo);
  }
  /** A moving pillar's rail: a faint dashed line along its whole swing, with an arrow at each end. */
  function riel(base, now) {
    const a = sx(base.x - base.move.amp), b = sx(base.x + base.w + base.move.amp), y = G + 9 * s;
    ctx.save();
    ctx.strokeStyle = 'rgba(46,230,214,0.45)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
    ctx.lineDashOffset = QUIETO ? 0 : -now / 60;
    ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(b, y); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = 'rgba(46,230,214,0.7)';
    for (const [px, d] of [[a, -1], [b, 1]]) { ctx.beginPath(); ctx.moveTo(px + d * 5, y); ctx.lineTo(px, y - 4); ctx.lineTo(px, y + 4); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function bandera(cx, k, now, oro, objetivo) {
    let esc = 1;
    if (golpe && golpe.k === k) { const t = (now - golpe.born) / 500; if (t < 1) esc = 1 + Math.sin(t * Math.PI) * 0.7; }
    const alto = (oro ? 20 : 16) * s * esc, ancho = (oro ? 13 : 10) * s * esc;
    const top = G - alto;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1, 1.3 * s);
    ctx.beginPath(); ctx.moveTo(cx, G - 1); ctx.lineTo(cx, top); ctx.stroke();
    const ola = QUIETO ? 0 : Math.sin(now / (oro || objetivo ? 140 : 260) + k);
    const color = oro ? rgb(GOLD) : '#ff2e88';
    ctx.save();
    if (oro || objetivo) { ctx.shadowColor = color; ctx.shadowBlur = oro ? 14 : 8; }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.quadraticCurveTo(cx + ancho * 0.5, top + ola * 2 * s, cx + ancho, top + alto * 0.22 + ola * 1.5 * s);
    ctx.quadraticCurveTo(cx + ancho * 0.5, top + alto * 0.3 - ola * 2 * s, cx, top + alto * 0.44);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  /* --- the stick --- */
  function palo(x0, len, ang, brillo = 0) {
    const L = len * s, a = -Math.PI / 2 + ang;
    const x1 = x0 + Math.cos(a) * L, y1 = G - 1 + Math.sin(a) * L;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = brillo ? rgb(GOLD) : 'rgba(255,210,63,0.6)'; ctx.shadowBlur = brillo ? 16 : 6;
    ctx.strokeStyle = brillo ? '#fff2b0' : '#ffd23f'; ctx.lineWidth = Math.max(2.5, 3.2 * s);
    ctx.beginPath(); ctx.moveTo(x0, G - 1); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.restore();
  }

  /* --- the ninja --- */
  /**
   * The ninja, its feet at (x, y): a dark hood with a rim of light (so it reads on the night), the eye slit,
   * a pink headband whose tails fly behind it as it runs, and legs that move.
   */
  function ninja(x, y, now, { corre = false, rot = 0, salto = 0 } = {}) {
    const u = s * (compacto ? 0.95 : 1), w = NINJA * u, h = NINJA * 1.2 * u;
    ctx.save();
    ctx.translate(x, y - salto * u);
    if (rot) ctx.rotate(rot);
    // A soft halo behind
    const halo = ctx.createRadialGradient(0, -h * 0.55, 2, 0, -h * 0.55, h * 1.3);
    halo.addColorStop(0, 'rgba(46,230,214,0.22)'); halo.addColorStop(1, 'rgba(46,230,214,0)');
    ctx.fillStyle = halo; ctx.fillRect(-h * 1.4, -h * 2, h * 2.8, h * 2.6);
    // Legs
    const paso = corre && !QUIETO ? Math.sin(now / 45) : 0;
    ctx.fillStyle = '#0d0619';
    ctx.fillRect(-w * 0.32 + paso * w * 0.12, -h * 0.28, w * 0.24, h * 0.28);
    ctx.fillRect(w * 0.08 - paso * w * 0.12, -h * 0.28, w * 0.24, h * 0.28);
    // The headband's tails, behind the head, flying
    const viento = corre ? 1 : 0.35, ondea = QUIETO ? 0 : Math.sin(now / (corre ? 60 : 300));
    ctx.strokeStyle = '#ff2e88'; ctx.lineWidth = Math.max(1.5, 2 * u); ctx.lineCap = 'round';
    for (const [dy, k] of [[0, 1], [2.2 * u, 0.75]]) {
      ctx.beginPath(); ctx.moveTo(-w * 0.45, -h * 0.72 + dy);
      ctx.quadraticCurveTo(-w * (0.45 + 0.5 * viento), -h * 0.72 + dy + ondea * 3 * u * k, -w * (0.45 + 1.05 * viento * k), -h * (0.72 - 0.12 * (1 - viento)) + dy - ondea * 2 * u);
      ctx.stroke();
    }
    // Body and hood: one rounded shape, with a rim of light
    const r = w * 0.42;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h * 0.26); ctx.lineTo(-w / 2, -h + r);
    ctx.quadraticCurveTo(-w / 2, -h, -w / 2 + r, -h); ctx.lineTo(w / 2 - r, -h);
    ctx.quadraticCurveTo(w / 2, -h, w / 2, -h + r); ctx.lineTo(w / 2, -h * 0.26); ctx.closePath();
    ctx.fillStyle = '#140a26'; ctx.fill();
    ctx.strokeStyle = 'rgba(190,160,255,0.55)'; ctx.lineWidth = 1; ctx.stroke();
    // The headband
    ctx.fillStyle = '#ff2e88'; ctx.fillRect(-w / 2, -h * 0.8, w, 2.2 * u);
    // The eye slit and the eyes, looking ahead
    ctx.fillStyle = '#ffd9b8'; ctx.fillRect(-w * 0.1, -h * 0.66, w * 0.58, 3 * u);
    ctx.fillStyle = '#140a26';
    ctx.fillRect(w * 0.08, -h * 0.64, 1.6 * u, 1.8 * u); ctx.fillRect(w * 0.3, -h * 0.64, 1.6 * u, 1.8 * u);
    // A belt
    ctx.fillStyle = 'rgba(46,230,214,0.7)'; ctx.fillRect(-w / 2, -h * 0.4, w, 1.4 * u);
    ctx.restore();
  }

  /* --- what celebrates --- */
  function efectos(now, dt) {
    if (destello) {
      const k = (now - destello) / 450;
      if (k >= 1) destello = 0;
      else { ctx.fillStyle = `rgba(255,210,63,${0.12 * (1 - k)})`; ctx.fillRect(0, 0, W, H); }
    }
    for (let i = pulsos.length - 1; i >= 0; i--) {
      const p = pulsos[i], k = (now - p.born) / 750;
      if (k < 0) continue;
      if (k >= 1) { pulsos.splice(i, 1); continue; }
      const r = (4 + easeOut(k) * p.max) * s;
      ctx.save();
      ctx.shadowColor = rgb(p.color); ctx.shadowBlur = 14;
      ctx.strokeStyle = rgb(p.color, 1 - k); ctx.lineWidth = Math.max(1, 4 * (1 - k) * s);
      ctx.beginPath(); ctx.arc(sx(p.x), p.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    for (let i = chispas.length - 1; i >= 0; i--) {
      const c = chispas[i], k = (now - c.born) / c.life;
      if (k >= 1) { chispas.splice(i, 1); continue; }
      c.vy += 380 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      const r = c.size * (1 - k) + 0.6;
      ctx.fillStyle = rgb(c.color, 1 - k); ctx.fillRect(sx(c.x) - r, c.y - r, r * 2, r * 2);
    }
    for (let i = flotan.length - 1; i >= 0; i--) {
      const f = flotan[i], k = (now - f.born) / 1000;
      if (k >= 1) { flotan.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
      ctx.font = `${Math.round(22 * s * (1 + 0.25 * Math.sin(Math.min(1, k * 3) * Math.PI)))}px Bangers, Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(21,7,38,0.9)'; ctx.fillStyle = f.color;
      const y = f.y - easeOut(k) * 46 * s;
      ctx.strokeText(f.text, sx(f.x), y); ctx.fillText(f.text, sx(f.x), y);
      ctx.restore();
    }
  }
  const lluvia = (x, y, n, colores, fuerza = 1) => {
    if (QUIETO) return;
    const now = performance.now();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4, v = (120 + Math.random() * 180) * fuerza;
      chispas.push({ x, y, vx: Math.cos(a) * v / s, vy: Math.sin(a) * v, born: now, life: 600 + Math.random() * 400, color: colores[i % colores.length], size: 2 + Math.random() * 2.5 });
    }
  };

  /** One frame. `reloj` is the game's clock (frozen while paused); `now` moves the rest. */
  let lastG = null;
  function draw(g, now, reloj = now) {
    lastG = g;
    const dt = ultimo ? Math.min(0.05, (now - ultimo) / 1000) : 0;
    ultimo = now;
    camara(now);
    ctx.clearRect(0, 0, W, H);
    fondo(now);

    const w = g.walk, i = g.i;
    // The pillars in sight
    for (let k = Math.max(0, i - 2); k <= i + 3; k++) columna(pillarAt(g, k, reloj), k, now, k === i + 1 && g.phase !== 'over');

    // The last bridge, still across its gap
    if (previo) palo(sx(previo.x0), previo.len, Math.PI / 2);
    // The stick: growing, falling across, lying, or dropping into the gap at the end
    const x0 = sx(current(g).x + current(g).w);
    let ninjaX = restX(current(g)), corre = false;
    if (g.phase === 'growing' || g.phase === 'held') palo(x0, stickAt(g, reloj), 0);
    else if (w && (g.phase === 'walking' || g.phase === 'lost' || g.phase === 'over')) {
      const k = clamp01((reloj - (w.t0 - TURN_MS)) / TURN_MS);
      let ang = easeIn(k) * Math.PI / 2;
      if (muerte && !w.ok) ang = Math.PI / 2 + easeIn(clamp01((now - muerte.born) / 380)) * Math.PI / 2;
      palo(x0, g.stick, ang, w.kind === 'perfect' && k >= 1 ? 1 : 0);
      if (g.phase === 'walking') { ninjaX = runX(w, reloj); corre = reloj >= w.t0; }
    }

    // The ninja: standing, running (on top or hanging under), or falling at the end
    if (muerte) {
      const m = muerte;
      m.vy += 1500 * dt; m.y += m.vy * dt; m.x += m.vx * dt; m.rot += m.vr * dt;
      if (m.y < H + 60) ninja(sx(m.x), m.y, now, { rot: m.rot });
    } else {
      const salto = g.phase === 'ready' && efectoSalto(now);
      ninja(sx(ninjaX), G - 1, now, { corre, salto: salto || 0 });
    }
    efectos(now, dt);
  }
  let saltoDesde = 0;
  const efectoSalto = now => { const k = (now - saltoDesde) / 380; return k >= 0 && k < 1 && !QUIETO ? Math.sin(k * Math.PI) * 9 : 0; };

  return {
    draw,
    /** A new game: the camera on its start, nothing celebrating. */
    empezar(g) {
      cam.x = cam.from = cam.to = current(g).x + current(g).w - HOLD_X; cam.t0 = 0;
      pulsos.length = chispas.length = flotan.length = 0; doradas.clear();
      previo = null; muerte = null; golpe = null; destello = 0;
    },
    /** The stick just landed with its tip on the flag: the emerging pulse, sparks, the flag pops and turns gold. */
    perfecto(g, tip, racha) {
      const now = performance.now(), k = g.i + 1, y = G - 1;
      doradas.add(k); golpe = { k, born: now };
      if (QUIETO) return;
      const max = 46 + Math.min(racha, MAX_BONUS) * 10;
      [[46, 230, 214], [255, 46, 136], GOLD].forEach((c, j) => pulsos.push({ x: tip, y, born: now + j * 120, color: c, max: max + j * 8 }));
      destello = now;
      lluvia(tip, y, 18 + racha * 3, [GOLD, [255, 46, 136], [46, 230, 214], [157, 255, 58]], 1 + racha * 0.08);
    },
    /** A plain landing: a little dust where the tip hit. */
    toque(tip) { lluvia(tip, G - 1, 6, [[255, 255, 255], [190, 160, 255]], 0.5); },
    /** Points rising from where they were won. */
    puntos(x, text, color = '#ffd23f') { flotan.push({ x, y: G - 30 * s, text, born: performance.now(), color }); },
    /** The ninja is on the next pillar: the camera slides, the bridge stays lying behind. */
    llegar(g, prevX0, len, perfecto) {
      previo = { x0: prevX0, len };
      cam.from = cam.x; cam.to = current(g).x + current(g).w - HOLD_X; cam.t0 = performance.now();
      if (perfecto) saltoDesde = performance.now();
    },
    /** The end: the ninja drops into the gap from the stick's tip. */
    caer(g, kind) {
      muerte = { kind, born: performance.now(), x: g.walk.tip, y: G - 1, vy: -60, vx: 10, rot: 0, vr: 3 };
    },
    /** A life lost, not the last: the ninja is back on its pillar, the fallen stick gone. */
    revivir() { muerte = null; saltoDesde = performance.now(); },
    cerrar() { ro.disconnect(); },
  };
}

/** The moment of a touch, on performance.now()'s clock (an old browser's epoch timestamp is not trusted). */
const momento = ev => {
  const ahora = performance.now(), t = ev?.timeStamp;
  return typeof t === 'number' && t > 0 && t <= ahora + 50 && t >= ahora - 1000 ? t : ahora;
};

/* ------------------------------------------------------------------ */
/* The cover                                                           */
/* ------------------------------------------------------------------ */

let animando = 0;   // the frame loop on screen; a new screen stops the old one

const tituloJuego = (chico = false) => el('h1', { class: `titulo-ninja${chico ? ' chico' : ''}` },
  el('span', { class: 'logo', 'aria-hidden': 'true' }, '🥷'), el('span', { class: `display ${chico ? '' : 'display--lg '}rainbow` }, T.nombre));
const credito = () => el('p', { class: 'credito' }, 'Inspired by ',
  el('a', { href: KETCHAPP, target: '_blank', rel: 'noopener', id: 'link-stick-hero' }, 'Stick Hero'), ', by Ketchapp.');
const pasos = () => el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ico), el('span', {}, x))));

function portada() {
  const lienzo = el('canvas', { class: 'demo-ninja', 'aria-hidden': 'true' });
  const antes = mejorAntes();
  vista.replaceChildren(
    el('div', { class: 'portada' }, tituloJuego(), el('p', { class: 'lead', style: 'margin:0' }, T.lema), credito(), lienzo),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-jugar', onClick: () => { SFX.tap(); jugar(); } }, T.jugar),
    antes ? el('p', { class: 'muted mejor-portada', id: 'mejor-portada' }, fmt(T.mejorCorto, { n: antes })) : '',
    // The steps go after Play, so it is seen without scrolling on a small phone (U-39)
    el('div', { class: 'panel' }, pasos(), el('p', { class: 'muted hoy-nota' }, T.hoy)),
  );
  pieComentario('portada');
  demo(lienzo);
}

/**
 * The cover plays itself: mostly flags, a plain landing now and then, and every so often a stick too
 * short; then it starts over on another course.
 */
function demo(lienzo) {
  const vez = ++animando;
  const sc = escena(lienzo, { compacto: true });
  let g, plan = null, ronda = 0;
  const empezar = now => { g = newGame(1000 + ronda++, now); sc.empezar(g); plan = { at: now + 700 }; };
  empezar(performance.now());
  if (QUIETO) { requestAnimationFrame(now => sc.draw(g, now)); return; }
  const paso = now => {
    if (vez !== animando || !lienzo.isConnected) return sc.cerrar();
    if (g.phase === 'ready' && plan && now >= plan.at) {
      const n = g.bridges, fallo = n >= 6 && n % 7 === 6;
      const off = fallo ? -next(g).w / 2 - 6 : n % 3 === 2 ? PERFECT * 2.5 : 0;
      press(g, now); plan = { suelta: now + holdFor(g, off, now) };
    }
    if (g.phase === 'growing' && plan?.suelta && now >= plan.suelta) {
      const r = release(g, plan.suelta);
      plan = { tip: r.tip, kind: r.kind, cayo: false };
    }
    if (g.phase === 'walking') {
      const w = g.walk;
      if (!plan.cayo && now >= w.t0) {
        plan.cayo = true;
        if (plan.kind === 'perfect') sc.perfecto(g, plan.tip, g.streak + 1); else if (plan.kind === 'land') sc.toque(plan.tip);
      }
      const x0 = current(g).x + current(g).w, len = g.stick;
      for (const e of advance(g, now)) {
        if (e.type === 'arrive') { sc.llegar(g, x0, len, e.kind === 'perfect'); plan = { at: now + 520 }; }
        if (e.type === 'fall') { sc.caer(g, e.kind); plan = { fin: now + 1300 }; }
      }
    }
    if (g.phase === 'over' && plan?.fin && now >= plan.fin) empezar(now);
    sc.draw(g, now);
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/* ------------------------------------------------------------------ */
/* The game                                                            */
/* ------------------------------------------------------------------ */

function jugar() {
  const vez = ++animando;
  S.g = newGame(semilla(), performance.now()); S.fin = false; S.desde = Date.now(); S.pausa = 0; S.logros = new Set();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  const lienzo = el('canvas', { class: 'lienzo-ninja', 'aria-hidden': 'true' });
  const marcador = el('div', { class: 'marcador-ninja', id: 'marcador', 'aria-live': 'polite' }, '0');
  const racha = el('div', { class: 'racha-ninja', id: 'racha', hidden: true });
  const vidas = el('div', { class: 'vidas-ninja', id: 'vidas', 'aria-label': fmt(T.vidasAria, { n: LIVES }) },
    ...Array.from({ length: LIVES }, () => el('span', { 'aria-hidden': 'true' }, '❤️')));
  const aviso = el('div', { class: 'aviso-ninja', id: 'aviso' }, T.sostener);
  const logro = el('div', { class: 'logros-ninja', id: 'logros', 'aria-live': 'polite' });
  const cartel = el('div', { class: 'pausa-ninja', id: 'pausa', 'aria-live': 'polite', hidden: true },
    // The emoji outside the rainbow: a gradient clipped to text paints an emoji as a colored square
    el('span', { class: 'titulo-pausa' }, el('span', { 'aria-hidden': 'true' }, '⏸️'), el('span', { class: 'display rainbow' }, T.pausa)), el('span', {}, T.seguir));
  const escenario = el('div', { class: 'escenario', id: 'escenario', role: 'button', tabindex: 0, 'aria-label': T.sostener }, lienzo, marcador, vidas, racha, aviso, logro, cartel);
  const antes = S.antes = mejorAntes();
  const mejor = el('span', { class: 'mejor-ninja', id: 'mejor-juego' }, antes ? fmt(T.mejorCorto, { n: antes }) : '');
  vista.replaceChildren(el('div', { class: 'cabeza-ninja' }, tituloJuego(true), mejor), escenario);
  pieComentario('juego');
  document.body.classList.add('jugando');
  const sc = escena(lienzo);
  sc.empezar(S.g);
  let cayo = false, ultimoTic = 0;
  const g = S.g;

  const decir = (nodo, clase) => {
    aviso.replaceChildren(nodo);
    aviso.classList.remove('fuera', 'brilla', 'final'); void aviso.offsetWidth;
    if (clase) aviso.classList.add(clase);
  };
  /** The hint for the moment: how to stretch, and the first time a pillar moves, how to aim at it. */
  const pista = () => {
    if (g.phase === 'held') return decir(T.seguirSosteniendo);
    if (next(g).move && !yaMovil()) return decir(T.movil);
    if (g.bridges === 0) return decir(T.sostener);
  };

  // An achievement: a banner that slides down under the score, with its own pulse, one at a time
  const cola = [];
  let mostrando = false;
  const celebrar = clave => {
    if (S.logros.has(clave)) return;
    S.logros.add(clave);
    const [ico, titulo, sub] = T.logros[clave.startsWith('puntos') ? 'puntos' : clave];
    cola.push({ ico, titulo: fmt(titulo, { n: clave.slice(6) }), sub });
    if (!mostrando) siguienteLogro();
  };
  const siguienteLogro = () => {
    const l = cola.shift();
    if (!l || vez !== animando) { mostrando = false; return; }
    mostrando = true;
    const banda = el('div', { class: 'logro' }, el('span', { class: 'logro-ico', 'aria-hidden': 'true' }, l.ico),
      el('span', { class: 'logro-txt' }, el('b', {}, l.titulo), el('small', {}, l.sub)));
    logro.replaceChildren(banda);
    SFX.turn();
    setTimeout(() => { banda.classList.add('sale'); setTimeout(siguienteLogro, QUIETO ? 0 : 260); }, QUIETO ? 1400 : 1700);
  };

  /** The streak chip under the score: how many flags in a row, and what the next one is worth. */
  const rachaChip = n => {
    racha.hidden = n < 2;
    if (n >= 2) racha.textContent = `🔥 ×${n} · next flag +${Math.min(n + 1, MAX_BONUS)}`;
  };

  const presionar = t => {
    if (S.fin || S.pausa) return;
    if (!press(g, t)) return;
    ultimoTic = 0;
    aviso.classList.add('fuera');
  };
  const soltar = t => {
    if (S.fin || S.pausa || g.phase !== 'growing') return;
    const r = release(g, t);
    if (!r) return;
    cayo = false;
    aviso.classList.add('fuera');
    SFX.dice();
  };
  S.presionar = presionar; S.soltar = soltar;

  const llego = (e, x0, len) => {
    if (e.moving) marcarMovil();
    marcador.textContent = String(g.score);
    marcador.classList.remove('salta'); void marcador.offsetWidth; marcador.classList.add('salta');
    sc.llegar(g, x0, len, e.kind === 'perfect');
    if (e.kind === 'perfect') {
      sc.puntos(current(g).x + current(g).w / 2, `+${e.gain}`, '#ffd23f');
      celebrar('primero');
      if (e.moving) celebrar('movil');
      if (e.streak >= 3) celebrar('racha3');
      if (e.streak >= MAX_BONUS) celebrar('racha5');
      if (e.streak >= 8) celebrar('racha8');
    } else sc.puntos(current(g).x + current(g).w / 2, '+1', '#ffffff');
    rachaChip(g.streak);
    for (const m of [10, 25, 50, 100, 150, 200]) if (g.score >= m) celebrar(`puntos${m}`);
    puntaje();
    pista();
  };
  const puntaje = () => {
    marcador.textContent = String(g.score);
    // A new best is kept the moment it happens, not at the end: a game the phone closes still keeps it
    if (g.score > antes) guardarMejor(g.score);
    if (antes && g.score > antes) {
      mejor.textContent = fmt(T.mejorCorto, { n: g.score });
      if (!mejor.classList.contains('record')) { mejor.classList.add('record'); celebrar('mejor'); }
    }
  };

  // Paused when the page is hidden or loses focus (a call, another app): a stick being stretched stops
  // where it was and the next press goes on from there; a running ninja freezes. The first tap back
  // only takes the pause off
  const pausar = () => {
    if (S.fin || S.pausa || vez !== animando) return;
    S.pausa = performance.now();
    suspend(g, S.pausa);
    cartel.hidden = false;
  };
  const reanudar = () => {
    if (!S.pausa) return;
    pause(g, performance.now() - S.pausa);
    S.pausa = 0;
    cartel.hidden = true;
    SFX.tap();
    pista();
  };
  S.pausar = pausar;
  const fuera = new AbortController();
  const sig = { signal: fuera.signal };
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); }, sig);
  addEventListener('blur', pausar, sig);
  addEventListener('pagehide', pausar, sig);

  // The finger: down stretches; up drops. Up is heard anywhere on the page
  let tras = false;   // the press that took the pause off: its release does nothing
  escenario.addEventListener('pointerdown', ev => {
    if (ev.button > 0) return;
    ev.preventDefault();
    if (S.pausa) { tras = true; return reanudar(); }
    presionar(momento(ev));
  });
  const arriba = ev => { if (tras) { tras = false; return; } soltar(momento(ev)); };
  addEventListener('pointerup', arriba, sig);
  addEventListener('pointercancel', arriba, sig);
  escenario.addEventListener('contextmenu', ev => ev.preventDefault());
  escenario.addEventListener('keydown', ev => {
    if (ev.key !== ' ' && ev.key !== 'Enter') return;
    ev.preventDefault();
    if (ev.repeat) return;
    if (S.pausa) { tras = true; return reanudar(); }
    presionar(momento(ev));
  });
  escenario.addEventListener('keyup', ev => { if (ev.key === ' ' || ev.key === 'Enter') arriba(ev); });
  escenario.focus({ preventScroll: true });

  /** A fall that leaves lives: a heart goes dark, and the ninja is back on the same pillar. */
  function tropezar(kind, quedan) {
    sc.caer(g, kind);
    SFX.letterMiss();
    vibrate([40, 30, 60]);
    racha.hidden = true;
    const corazon = vidas.children[quedan];
    corazon.classList.add('perdida');
    vidas.setAttribute('aria-label', fmt(T.vidasAria, { n: quedan }));
    decir(el('span', {}, el('span', { class: 'rainbow' }, T.fin[kind]), el('small', { class: 'quedan' }, T.vidas[quedan])), 'final');
    setTimeout(() => {
      if (vez !== animando) return;
      // A pause in between waits: the ninja comes back once the game goes on
      const volver = () => {
        if (vez !== animando) return;
        if (S.pausa) return setTimeout(volver, 200);
        revive(g, performance.now());
        sc.revivir();
        aviso.classList.add('fuera');
        pista();
      };
      volver();
    }, QUIETO ? 600 : 1500);
  }

  function perder(kind) {
    S.fin = true;
    vidas.children[0]?.classList.add('perdida');
    fuera.abort();
    sc.caer(g, kind);
    SFX.letterMiss();
    setTimeout(() => { if (vez === animando) SFX.error(); }, 380);
    vibrate([40, 30, 60]);
    racha.hidden = true;
    decir(el('span', { class: 'rainbow' }, T.fin[kind] || T.finCorto), 'final');
    guardarHoy(g.score);
    setTimeout(() => { if (vez === animando) resultado(); }, QUIETO ? 500 : 1700);
  }

  const paso = now => {
    if (vez !== animando || !lienzo.isConnected) { fuera.abort(); return sc.cerrar(); }
    const reloj = S.pausa || now;
    // Stretching: a soft tick every so often, rising, so the length is heard too
    if (g.phase === 'growing') {
      const len = stickAt(g, reloj), paso = Math.floor(len / 36);
      if (paso > ultimoTic) { ultimoTic = paso; SFX.letterHit(Math.min(paso, 11)); }
    }
    if (g.phase === 'walking' && !S.pausa) {
      const w = g.walk;
      // The stick lands: on the flag, the pulse; on the pillar, a thud
      if (!cayo && reloj >= w.t0) {
        cayo = true;
        if (w.kind === 'perfect') {
          const n = g.streak + 1;
          sc.perfecto(g, w.tip, n);
          SFX.reveal(); SFX.letterHit(Math.min(4 + n * 2, 11)); vibrate([12, 40, 18]);
          decir(el('span', { class: 'rainbow' }, n > 1 ? fmt(T.racha, { n }) : T.perfecto), 'brilla');
          rachaChip(n);
          escenario.classList.remove('pulso'); void escenario.offsetWidth; escenario.classList.add('pulso');
          if (n >= MAX_BONUS && !QUIETO) confetti({ count: 50, duration: 900 });
        } else if (w.kind === 'land') { sc.toque(w.tip); SFX.tap(); vibrate(8); rachaChip(0); }
      }
      const x0 = current(g).x + current(g).w, len = g.stick;
      for (const e of advance(g, reloj)) {
        if (e.type === 'arrive') llego(e, x0, len);
        if (e.type === 'fall') (e.over ? perder(e.kind) : tropezar(e.kind, e.lives));
      }
    }
    sc.draw(g, now, reloj);
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/* ------------------------------------------------------------------ */
/* The result                                                          */
/* ------------------------------------------------------------------ */

function mejorAntes() { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } }
function guardarMejor(n) { try { localStorage.setItem(BEST_KEY, String(n)); } catch { /* private mode */ } }
function yaMovil() { try { return localStorage.getItem(MOVING_KEY) === '1'; } catch { return false; } }
function marcarMovil() { try { localStorage.setItem(MOVING_KEY, '1'); } catch { /* private mode */ } }
/** Today's runs on this phone, on today's course (a group passing the phone sees them all). */
function corridasHoy() {
  try { const d = JSON.parse(localStorage.getItem(TODAY_KEY) || '{}'); return d.dia === hoy() && d.seed === semilla() ? d.runs || [] : []; } catch { return []; }
}
function guardarHoy(n) {
  try { localStorage.setItem(TODAY_KEY, JSON.stringify({ dia: hoy(), seed: semilla(), runs: [...corridasHoy(), n].slice(-12) })); } catch { /* private mode */ }
}

function resultado() {
  ++animando;
  document.body.classList.remove('jugando');
  const g = S.g, n = g.score, antes = S.antes, record = n > antes && n > 0;
  const segundos = Math.round((Date.now() - S.desde) / 1000);
  trackFinish({ detalle: `${n} points · ${g.bridges} bridges · ${g.perfects} flags · streak ${g.bestStreak} · ${segundos}s` });
  pie.replaceChildren();
  const lineas = [
    plural(T.desglose.puentes, g.bridges),
    plural(T.desglose.perfectos, g.perfects, { b: g.bonus }),
    ...(g.bestStreak > 1 ? [fmt(T.desglose.racha, { n: g.bestStreak })] : []),
  ];
  const runs = corridasHoy(), tope = Math.max(...runs, 0);
  const hoyLista = runs.length > 1 ? el('div', { class: 'panel hoy-ninja', id: 'hoy' },
    el('p', { class: 'hoy-titulo' }, T.hoyTitulo),
    el('ol', { class: 'corridas' }, ...runs.map((r, i) => el('li', { class: `${r === tope ? 'tope' : ''}${i === runs.length - 1 ? ' ultima' : ''}` }, String(r)))),
    el('p', { class: 'muted', style: 'margin:0;font-size:0.85rem' }, T.pasar)) : null;
  vista.replaceChildren(el('div', { class: 'resultado' },
    tituloJuego(true),
    el('p', { class: 'sello-ninja' }, record ? T.record : T.finCorto),
    el('div', { class: 'score-big', id: 'puntaje' }, String(n)),
    record ? null : el('p', { class: 'muted', style: 'margin:0', id: 'mejor' }, fmt(T.mejor, { n: Math.max(antes, n) })),
    el('ul', { class: 'desglose muted' }, ...lineas.map(x => el('li', {}, x))),
    hoyLista,
    botonResultadoSolo({ C: COMMON.en, emoji: '🥷', juego: T.nombre, puntaje: `🥷 ${n}`, tiempo: '', tarjeta: card(g.kinds), url: `${SITIO}labs/stick/`, alTocar: () => SFX.tap() }),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-otra', onClick: () => { SFX.tap(); jugar(); } }, T.otraVez),
    el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.laboratorio),
    el('hr', { class: 'divisor' }),
    formularioComentario({ T: T.comentario, contexto: contexto('resultado') })));
  scrollTo(0, 0);
  if (record) { SFX.win(); if (!QUIETO) confetti({ count: 140, duration: 2000 }); }
}

document.getElementById('sound-slot').append(soundToggle());
initSound();
sparkles();
portada();
// For the end-to-end script: the game (S.presionar(t) / S.soltar(t) as a finger would, S.pausar() as a
// hidden page does), how long to hold for the flag, and where a pillar is now
window.__stick = { S, sostener: (off = 0, t = performance.now()) => holdFor(S.g, off, t), fin: () => walkEnd(S.g), columna: k => pillarAt(S.g, k, performance.now()) };

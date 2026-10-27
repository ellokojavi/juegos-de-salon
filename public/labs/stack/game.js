/**
 * Stack — lab prototype (D-445), inspired by Stack (Ketchapp, 2016): a block slides over the tower, a
 * tap drops it, and whatever hangs over the edge is cut off. English only, for friends to try (the
 * owner's request). The engine is engine.js; this file draws the tower on a canvas and reads the taps.
 *
 * A tap is judged at its own timestamp (the event's), not at the next frame, so a slow phone does not
 * play a harder game (engine.js).
 */
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { COMMON, SITIO } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { newGame, drop, movingAt, perfectTime, pause, score, top, card, SLAB } from './engine.js';

trackVisit();   // the site's traffic (D-208)

const GAME_ID = 'stack';
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const KETCHAPP_STACK = 'https://www.ketchappgames.com/';
const BEST_KEY = 'juegos-de-salon:stack-best';
const T = {
  nombre: 'Stack',
  lema: 'Stack the blocks as high as you can.',
  como: [
    ['👆', 'Tap to drop each sliding block onto the tower.'],
    ['✂️', 'Whatever hangs over the edge is cut off, so the next block is smaller. Miss the tower and the game ends.'],
    ['🎯', 'Drop a block exactly on the one below and nothing is cut. Do it 4 times in a row and the block grows back.'],
  ],
  comoTitulo: 'How to play',
  jugar: '🧱 Play',
  toca: 'Tap anywhere to drop the block',
  pausa: 'Paused', seguir: 'Tap to continue',
  perfecto: 'Perfect!', racha: 'Perfect ×{n}',
  fin: 'Game over',
  record: '🏆 New best!',
  mejor: 'Your best: {n}',
  mejorCorto: '🏆 Best: {n}',
  desglose: {
    perfectos: ['🎯 No perfect drops.', '🎯 1 perfect drop.', '🎯 {n} perfect drops.'],
    racha: '🔥 Longest perfect streak: {n}.',
  },
  otraVez: '🔁 Play again', laboratorio: '‹ Back to the lab',
  comentarAbrir: '💬 Leave a comment',
  comentario: { titulo: 'What did you think?', lead: 'Tell us if it felt fair, if the taps landed when you meant them to, and what you would change.', ph: 'For example: the blocks got too fast too soon.', nombre: 'Name or nickname (optional)', enviar: 'Send comment', enviando: 'Sending…', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your comment arrived.', guardado: 'There is no internet right now: your comment is saved on this phone and will be sent later.', error: 'It could not be sent. Try again in a while.', cancelar: 'Cancel', cerrar: 'Close' },
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));

const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const S = { g: null, kinds: [], fin: false, desde: 0, antes: 0, pausa: 0, soltarEn: null, pausar: null };

function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, puntaje: S.g ? score(S.g) : 0,
  url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

/* ------------------------------------------------------------------ */
/* Drawing the tower                                                   */
/* ------------------------------------------------------------------ */

const COS30 = Math.cos(Math.PI / 6), SIN30 = 0.5;

/**
 * Each level's color: the house's neon (base.css), from pink through orange, yellow, lime and cyan to
 * purple and back to pink, a sixth of the way each level, like the titles' rainbow.
 */
const NEON = [[255, 46, 136], [255, 122, 26], [255, 210, 63], [157, 255, 58], [46, 230, 214], [138, 77, 255]];
const PASOS = 6;   // levels from one color to the next
function colorDe(n) {
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
function escena(canvas, { zoom = 1 } = {}) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, u = 0, camY = 0, ultimo = 0;
  const piezas = [];   // falling pieces: { slab, y, vy, color }
  const anillos = [];  // the glow of a perfect drop: { slab, y, born }
  const chispas = [];  // its sparks: { x, y, z, vx, vy, vz, born, color }

  const medir = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(3, devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The base takes about half the width, and never so much that the slide leaves a short screen
    u = Math.min(W * 0.3, H * 0.28) * zoom;
  };
  const ro = new ResizeObserver(medir); ro.observe(canvas); medir();

  const pt = (x, y, z) => [W / 2 + (x - z) * COS30 * u, H * 0.56 + (x + z) * SIN30 * u - (y - camY) * u];
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
    camY = dt ? camY + (meta - camY) * Math.min(1, dt * 5) : meta;
    ctx.clearRect(0, 0, W, H);

    // The pieces behind the tower first, the ones in front after it
    const t0 = top(g), detras = p => (p.slab.x - t0.x) + (p.slab.z - t0.z) < 0;
    for (const p of piezas) { p.vy -= 9 * dt; p.y += p.vy * dt; }
    for (let i = piezas.length - 1; i >= 0; i--) if (piezas[i].y < camY - 8) piezas.splice(i, 1);
    piezas.filter(detras).forEach(p => caja(p.slab, p.y, p.y + SLAB, p.color));

    // The base, then the slabs (only the ones in sight)
    if (camY < 4) columna(g.slabs[0]);
    const desde = Math.max(1, n - Math.ceil(H / (SLAB * u)) - 4);
    for (let i = desde; i <= n; i++) caja(g.slabs[i], (i - 1) * SLAB, i * SLAB, colorDe(i));

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

  return {
    draw,
    caer(slab, y, n) { piezas.push({ slab, y, vy: 0, color: colorDe(n) }); },
    brillar(slab, y) {
      const now = performance.now();
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

/** The moment of a tap, on performance.now()'s clock (an old browser's epoch timestamp is not trusted). */
const momento = ev => {
  const ahora = performance.now(), t = ev?.timeStamp;
  return typeof t === 'number' && t > 0 && t <= ahora + 50 && t >= ahora - 1000 ? t : ahora;
};

/** Drops the block in `g` at `t` and shows it on `sc`: the cut piece falls, a perfect drop shines. */
function soltar(g, sc, t) {
  const n = score(g);
  const r = drop(g, t);
  if (!r) return null;
  const y = n * SLAB;
  if (r.kind === 'perfect') sc.brillar(r.slab, y + SLAB);
  else sc.caer(r.piece, y, n + 1);
  return r;
}

/* ------------------------------------------------------------------ */
/* The cover                                                           */
/* ------------------------------------------------------------------ */

let animando = 0;   // the frame loop on screen; a new screen stops the old one

const tituloJuego = (chico = false) => el('h1', { class: `titulo-torre${chico ? ' chico' : ''}` },
  el('span', { class: 'logo', 'aria-hidden': 'true' }, '🧱'), el('span', { class: `display ${chico ? '' : 'display--lg '}rainbow` }, T.nombre));
const credito = () => el('p', { class: 'credito' }, 'Inspired by ',
  el('a', { href: KETCHAPP_STACK, target: '_blank', rel: 'noopener', id: 'link-stack' }, 'Stack'), ', by Ketchapp.');
const pasos = () => el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ico), el('span', {}, x))));

function portada() {
  const lienzo = el('canvas', { class: 'demo-torre', 'aria-hidden': 'true' });
  vista.replaceChildren(
    el('div', { class: 'portada' }, tituloJuego(), el('p', { class: 'lead', style: 'margin:0' }, T.lema), credito(), lienzo),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-jugar', onClick: () => { SFX.tap(); jugar(); } }, T.jugar),
    // The steps go after Play, so it is seen without scrolling on a small phone (U-39)
    el('div', { class: 'panel' }, pasos()),
  );
  pieComentario('portada');
  demo(lienzo);
}

/** The cover's tower builds itself: mostly perfect drops, a cut now and then, and starts over. */
function demo(lienzo) {
  const vez = ++animando;
  const sc = escena(lienzo, { zoom: 0.8 });
  let g = newGame(performance.now()), proxima = 0, k = 0;
  if (QUIETO) {
    let t = 0;
    for (let i = 0; i < 10; i++) { t = perfectTime(g, t); drop(g, t + (i % 3 === 2 ? 40 : 0)); }
    g.moving = null;
    requestAnimationFrame(now => sc.draw(g, now));
    return;
  }
  const paso = now => {
    if (vez !== animando || !lienzo.isConnected) return sc.cerrar();
    if (!proxima) proxima = perfectTime(g, now) + (k % 4 === 3 ? 60 : 0);
    if (now >= proxima) {
      soltar(g, sc, proxima); k++; proxima = 0;
      if (score(g) >= 14 || Math.min(top(g).w, top(g).d) < 0.45) { g = newGame(now + 600); k = 0; }
    }
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
  S.g = newGame(performance.now() + 400); S.kinds = []; S.fin = false; S.desde = Date.now(); S.pausa = 0;
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  const lienzo = el('canvas', { class: 'lienzo-torre', 'aria-hidden': 'true' });
  const marcador = el('div', { class: 'marcador-torre', id: 'marcador', 'aria-live': 'polite' }, '0');
  const aviso = el('div', { class: 'aviso-torre', id: 'aviso' }, T.toca);
  const cartel = el('div', { class: 'pausa-torre', id: 'pausa', 'aria-live': 'polite', hidden: true },
    // The emoji outside the rainbow: a gradient clipped to text paints an emoji as a colored square
    el('span', { class: 'titulo-pausa' }, el('span', { 'aria-hidden': 'true' }, '⏸️'), el('span', { class: 'display rainbow' }, T.pausa)), el('span', {}, T.seguir));
  const escenario = el('div', { class: 'escenario', id: 'escenario', role: 'button', tabindex: 0, 'aria-label': T.toca }, lienzo, marcador, aviso, cartel);
  // The heading, like the other games': the name, and the best so far (it lights up once beaten)
  const antes = S.antes = mejorAntes();
  const mejor = el('span', { class: 'mejor-torre', id: 'mejor-juego' }, antes ? fmt(T.mejorCorto, { n: antes }) : '');
  vista.replaceChildren(el('div', { class: 'cabeza-torre' }, tituloJuego(true), mejor), escenario);
  pieComentario('juego');
  document.body.classList.add('jugando');
  const sc = escena(lienzo);

  // Drops the block at moment `t`; a tap passes its own timestamp
  const caer = t => {
    if (S.fin || S.pausa) return;
    const n = score(S.g);
    const r = soltar(S.g, sc, t);
    if (!r) return;
    aviso.classList.add('fuera');
    if (r.kind === 'miss') return perder();
    S.kinds.push(r.kind);
    marcador.textContent = String(n + 1);
    // A new best is kept the moment it happens, not at the end: a game the phone closes still keeps it
    if (n + 1 > antes) guardarMejor(n + 1);
    if (antes && n + 1 > antes) { mejor.textContent = fmt(T.mejorCorto, { n: n + 1 }); mejor.classList.add('record'); }
    if (r.kind === 'perfect') {
      SFX.reveal(); vibrate(12);
      aviso.replaceChildren(el('span', { class: 'rainbow' }, S.g.combo > 1 ? fmt(T.racha, { n: S.g.combo }) : T.perfecto));
      aviso.classList.remove('fuera', 'brilla'); void aviso.offsetWidth; aviso.classList.add('brilla');
      // A streak that grows the block back: a little confetti
      if (r.grew && !QUIETO) confetti({ count: 40, duration: 900 });
    } else { SFX.tap(); vibrate(8); }
  };
  S.soltarEn = caer;

  // Paused when the page is hidden or loses focus (a call, another app, the screen locked): the slab
  // freezes where it was, and the first tap back only takes the pause off, it never drops (D-445)
  const pausar = () => {
    if (S.fin || S.pausa || vez !== animando) return;
    S.pausa = performance.now();
    cartel.hidden = false;
  };
  const reanudar = () => {
    if (!S.pausa) return;
    S.despertar?.();
    pause(S.g, performance.now() - S.pausa);
    S.pausa = 0;
    cartel.hidden = true;
    SFX.tap();
  };
  S.pausar = pausar;
  const fuera = new AbortController();
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); }, { signal: fuera.signal });
  addEventListener('blur', pausar, { signal: fuera.signal });
  addEventListener('pagehide', pausar, { signal: fuera.signal });

  const tocar = ev => { ev.preventDefault(); if (S.pausa) return reanudar(); caer(momento(ev)); };
  escenario.addEventListener('pointerdown', ev => { if (ev.button > 0) return; tocar(ev); });
  escenario.addEventListener('keydown', ev => { if (ev.key === ' ' || ev.key === 'Enter') { if (!ev.repeat) tocar(ev); else ev.preventDefault(); } });
  escenario.focus({ preventScroll: true });

  function perder() {
    S.fin = true;
    fuera.abort();
    SFX.error(); vibrate([40, 30, 60]);
    aviso.replaceChildren(el('span', { class: 'rainbow' }, T.fin)); aviso.classList.remove('fuera', 'brilla'); aviso.classList.add('final');
    setTimeout(() => { if (vez === animando) resultado(); }, QUIETO ? 400 : 1400);
  }

  const paso = now => {
    if (vez !== animando || !lienzo.isConnected) { fuera.abort(); return sc.cerrar(); }
    sc.draw(S.g, now, S.pausa || now);
    // Paused for a second (effects done): the loop sleeps until the tap back, so a game left
    // paused on the table does not burn battery (#892)
    if (S.pausa && now - S.pausa > 1000) { S.dormido = true; return; }
    requestAnimationFrame(paso);
  };
  S.despertar = () => { if (S.dormido) { S.dormido = false; requestAnimationFrame(paso); } };
  requestAnimationFrame(paso);
}

/* ------------------------------------------------------------------ */
/* The result                                                          */
/* ------------------------------------------------------------------ */

function mejorAntes() { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } }
function guardarMejor(n) { try { localStorage.setItem(BEST_KEY, String(n)); } catch { /* private mode */ } }

function resultado() {
  ++animando;
  document.body.classList.remove('jugando');
  // The best from before this game (the new one is already kept, as it happened)
  const g = S.g, n = score(g), antes = S.antes, record = n > antes && n > 0;
  const segundos = Math.round((Date.now() - S.desde) / 1000);
  trackFinish({ detalle: `${n} blocks · ${g.perfects} perfect · streak ${g.best} · ${segundos}s` });
  pie.replaceChildren();
  const lineas = [
    fmt(T.desglose.perfectos[Math.min(g.perfects, 2)], { n: g.perfects }),
    ...(g.best > 1 ? [fmt(T.desglose.racha, { n: g.best })] : []),
  ];
  vista.replaceChildren(el('div', { class: 'resultado' },
    tituloJuego(true),
    el('p', { class: 'sello-torre' }, record ? T.record : T.fin),
    el('div', { class: 'score-big', id: 'puntaje' }, String(n)),
    record ? null : el('p', { class: 'muted', style: 'margin:0', id: 'mejor' }, fmt(T.mejor, { n: Math.max(antes, n) })),
    el('ul', { class: 'desglose muted' }, ...lineas.map(x => el('li', {}, x))),
    botonResultadoSolo({ C: COMMON.en, emoji: '🧱', juego: T.nombre, puntaje: `🧱 ${n}`, tiempo: '', tarjeta: card(S.kinds), url: `${SITIO}labs/stack/`, alTocar: () => SFX.tap() }),
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
// For the end-to-end script: the game (S.soltarEn(t) drops at moment t, as a tap then would; S.pausar()
// pauses, as a hidden page does) and the next moment the block is exactly over the tower
window.__stack = { S, perfecto: () => perfectTime(S.g, performance.now()) };

/**
 * Stack — lab prototype (D-445), inspired by Stack (Ketchapp, 2016): a block slides over the tower, a
 * tap drops it, and whatever hangs over the edge is cut off. English only, for friends to try (the
 * owner's request). The engine is engine.js; this file draws the tower on a canvas and reads the taps.
 *
 * A tap is judged at its own timestamp (the event's), not at the next frame, so a slow phone does not
 * play a harder game (engine.js).
 */
import { salidasFin } from '../../assets/js/fin.js';
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { onScreen } from '../../assets/js/on-screen.js';
import { COMMON, SITIO } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { newGame, drop, perfectTime, pause, score, top, card } from './engine.js';
import { escena, soltar, momento } from './scene.js';

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
    otro();
  };
  const otro = onScreen(lienzo, paso);
  otro();
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
    salidasFin('lab', { raiz: '../../' }),
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

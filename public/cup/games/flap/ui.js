/**
 * 🐤 Aletazo (id `aletazo`) — its screen in La Copa, Uno al día and on its standalone page /flap/, moved
 * from the lab (labs/flap/game.js) as Shinobi and Babel were (D-517): every tap gives the bird a flap
 * upwards, gravity pulls it down, and the day's course comes at it: hoops (dead center counts double),
 * walls with one opening, spinning spikes. A new level every 5 gates; 3 lives (the trial, 1).
 * The engine is engine.js; the drawing, scene.js. Its exports are named in English (D-316): La Copa's
 * interface (`portada`, `titulo`, `montar`, `resultado`, `desglose`) is mapped to them in cup/games/index.js.
 *
 * What the lab had in play comes along: the fixed 1/120 s step (the same feel on every phone), the
 * hover with «👆 Toca para aletear» until the first tap, the level and walls announcements, the times of
 * day, the dead-center celebration and the synth tones (silenced by the app's 🔊). The page hidden pauses
 * the game; a tap brings it back.
 *
 * What the cup page now provides stays out: the lab's cover card, its countdown (the cup has its own),
 * its comment form, the local best, the usage signal and the share button. The credit to the original
 * is in `titulo`, in the waiting room. The cup's game.js does the result, rankings, sharing and telemetry.
 *
 * A real-time game cannot be resumed: after each gate the state is saved with `ctx.guardar`, and a page
 * reloaded mid-game ends that game with the points it had (no retry by reloading). A finished game in
 * `ctx.jugadas` shows finished. The state is `{ fin, score, passed, perfects, walls, level, kinds, ms }`.
 */
import { newGame, step, flap, rng, verdictOf, score, card, LIVES } from './engine.js';
import { escena } from './scene.js';
import { onScreen } from '../../../assets/js/on-screen.js';
import { loadCss } from '../../../assets/js/load-css.js';
import { getLang } from '../../../assets/js/i18n.js';
import { isMuted } from '../../../assets/js/sound.js';
import TEXTOS from './texts.js';

// Its own stylesheet, loaded with its code and before its first screen (D-468)
await loadCss(new URL('./style.css', import.meta.url));

const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmtLocal = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
/** [none, one, many] */
const forma = n => (n === 0 ? 0 : n === 1 ? 1 : 2);
/** The engine's fixed step: the same physics on a 60 Hz and a 120 Hz screen. */
const STEP = 1 / 120;
const UI = () => { let l = 'es'; try { l = getLang(); } catch (_) { /* outside the browser */ } return (TEXTOS[l] || TEXTOS.es).ui; };

/** `portada` gets no `el`: a small one of its own. */
function h(tag, attrs = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (k === 'class') n.className = v; else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  for (const x of hijos.flat()) if (x !== null && x !== undefined && x !== false) n.append(x instanceof Node ? x : String(x));
  return n;
}

/* ------------------------------------------------------------------ */
/* Sound: the lab's short synth tones, silenced by the app's 🔊        */
/* ------------------------------------------------------------------ */
// Opened by the tap on «Empezar» (a user's gesture): opening it on the first flap froze that frame
let ac = null, master = null;
function unlockAudio() {
  try {
    if (!ac) { ac = new (globalThis.AudioContext || globalThis.webkitAudioContext)(); master = ac.createGain(); master.connect(ac.destination); }
    if (ac.state !== 'running') ac.resume();
  } catch (_) { /* no audio: it plays silent */ }
}
globalThis.document?.addEventListener('click', ev => { if (ev.target?.closest?.('#btn-empezar, #btn-continuar, .btn')) unlockAudio(); }, true);
function tone(f0, f1, dur, type = 'sine', vol = 0.12, delay = 0) {
  if (isMuted() || !ac || ac.state !== 'running') return;
  try {
    const o = ac.createOscillator(), g = ac.createGain(), s = ac.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f0, s); o.frequency.exponentialRampToValueAtTime(f1, s + dur);
    g.gain.setValueAtTime(vol, s); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    o.connect(g).connect(master); o.start(s); o.stop(s + dur + 0.02);
  } catch (_) { /* a missed beep is fine */ }
}
const SOUND = {
  flap: () => tone(420, 760, 0.09, 'triangle', 0.08),
  pass: () => tone(760, 1040, 0.12, 'sine', 0.1),
  perfect: () => { tone(880, 880, 0.08, 'square', 0.05); tone(1175, 1175, 0.08, 'square', 0.05, 0.07); tone(1568, 1568, 0.14, 'square', 0.05, 0.14); },
  hit: () => tone(220, 70, 0.28, 'sawtooth', 0.12),
  over: () => { tone(440, 330, 0.18, 'triangle', 0.1); tone(330, 220, 0.25, 'triangle', 0.1, 0.18); tone(220, 110, 0.4, 'triangle', 0.1, 0.42); },
};

/* ------------------------------------------------------------------ */
/* Waiting room                                                        */
/* ------------------------------------------------------------------ */

/**
 * The cover (the lab's demo): the bird flies the course itself, with the game's own gravity and flaps
 * (the engine's autopilot), by night. Still, with reduced motion. The loop sleeps off screen (onScreen).
 */
let demoVez = 0;
export function cover() {
  const lienzo = h('canvas', { class: 'fl-demo', 'aria-hidden': 'true' });
  const raiz = h('div', { class: 'fl-portada', 'aria-hidden': 'true' }, lienzo);
  const vez = ++demoVez;
  const sc = escena(lienzo);
  let g = null, last = 0, acc = 0, visto = false;
  const desde = performance.now();
  const empezar = () => { g = newGame({ W: sc.measure(), mode: 'demo' }); sc.clear(); };
  const paso = now => {
    if (lienzo.isConnected) visto = true;
    if (vez !== demoVez || (!lienzo.isConnected && (visto || now - desde > 5000))) return;
    if (lienzo.isConnected && !g) { empezar(); last = now; }
    if (g) {
      if (QUIETO()) { if (g.clock < 1.5) for (let i = 0; i < 180; i++) step(g, STEP); sc.draw(g); return; }
      acc += Math.min(0.05, (now - last) / 1000); last = now;
      while (acc >= STEP) { step(g, STEP); sc.tick(STEP, g); g.events.length = 0; acc -= STEP; }
      sc.draw(g);
    }
    otro();
  };
  const otro = onScreen(lienzo, paso);
  otro();
  return raiz;
}

/** The name in the waiting room, with the 🐤 that sways, its line and the credit to the original right under it. */
export function title({ el, J }) {
  const U = UI();
  const [antes, despues] = String(U.flCredit).split('{juego}');
  return el('div', { class: 'fl-cabeza' },
    el('h2', { class: 'fl-titulo' },
      el('span', { class: 'fl-logo', 'aria-hidden': 'true' }, '🐤'),
      el('span', { class: 'display display--lg rainbow' }, J.nombre)),
    el('p', { class: 'fl-lema' }, U.flLema),
    el('p', { class: 'fl-credito', id: 'fl-credito' }, antes, el('a', { href: U.flWiki, target: '_blank', rel: 'noopener', id: 'link-flappy-bird' }, 'Flappy Bird'), despues || ''));
}

/* ------------------------------------------------------------------ */
/* The game                                                            */
/* ------------------------------------------------------------------ */

let partidas = 0;   // the game on screen; a new one stops the old one's loop

export function mount(raiz, ctx) {
  const { p = {}, T, el, vibrate = () => {} } = ctx;
  const fmt = ctx.fmt || fmtLocal;
  const vidas = p.vidas || LIVES;
  const previa = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) && Number.isFinite(ctx.jugadas.score) ? ctx.jugadas : null;
  const vez = ++partidas;
  unlockAudio();

  const lienzo = el('canvas', { class: 'fl-lienzo', 'aria-hidden': 'true' });
  const corazones = el('div', { class: 'fl-vidas', id: 'fl-vidas', 'aria-live': 'polite' });
  const nivel = el('div', { class: 'fl-nivel', id: 'fl-nivel' });
  const marcador = el('div', { class: 'fl-marcador', id: 'fl-marcador', 'aria-live': 'polite' }, '0');
  const aviso = el('div', { class: 'fl-aviso', id: 'fl-aviso' });
  const pista = el('div', { class: 'fl-pista', id: 'fl-pista' }, T.flTap);
  const cartel = el('div', { class: 'fl-pausa', id: 'fl-pausa', 'aria-live': 'polite', hidden: true },
    el('span', { class: 'display display--lg' }, T.flPaused), el('span', {}, T.flResume));
  const escenario = el('div', { class: 'fl-escenario', id: 'fl-escenario', role: 'button', tabindex: 0, 'aria-label': T.flTap },
    lienzo, el('div', { class: 'fl-hud' }, corazones, nivel, marcador, aviso), pista, cartel);
  const fin = el('div', { class: 'fl-fin', id: 'fl-fin' });
  const juego = el('div', { class: 'fl-juego' }, escenario, fin);
  raiz.append(juego);
  const sc = escena(lienzo);

  const S = { g: null, kinds: [], fin: false, pausa: false, pausado: 0, pausaDesde: 0, inicio: 0, ms: 0, last: performance.now(), acc: 0 };
  S.g = newGame({ W: sc.measure(), random: rng(p.semilla ?? 1), lives: vidas });
  new ResizeObserver(() => { if (vez === partidas && lienzo.isConnected) S.g.W = sc.measure(); }).observe(escenario);

  const pintarHud = () => {
    const g = S.g;
    marcador.textContent = String(g.score);
    corazones.replaceChildren(...Array.from({ length: g.lives }, (_, i) => el('span', { class: i < g.hearts ? '' : 'off' }, '❤️')));
    corazones.setAttribute('aria-label', fmt(T.flLives, { n: g.hearts }));
    nivel.textContent = fmt(T.flLevel, { n: g.level });
  };
  const decir = (texto, brilla = false) => {
    aviso.textContent = texto;
    aviso.className = 'fl-aviso';
    if (brilla) { void aviso.offsetWidth; aviso.className = 'fl-aviso brilla'; }
  };
  pintarHud();

  /** The game as it is saved and handed to the cup. */
  const estado = () => ({
    fin: S.fin, score: S.g.score, passed: S.g.passed, perfects: S.g.perfects, walls: S.g.walls, level: S.g.level,
    kinds: S.kinds.slice(), ms: S.fin ? S.ms : (S.inicio ? Math.round(performance.now() - S.inicio - S.pausado) : 0),
  });

  // Paused when the page is hidden (a call, another app, the screen locked); a tap brings it back
  const fuera = new AbortController();
  const pausar = () => {
    if (!lienzo.isConnected) { fuera.abort(); return; }
    if (S.fin || S.pausa || vez !== partidas || S.g.mode !== 'play') return;
    S.pausa = true; S.pausaDesde = performance.now(); cartel.hidden = false;
  };
  const reanudar = () => {
    S.pausado += performance.now() - S.pausaDesde;
    S.pausa = false; cartel.hidden = true; S.last = performance.now();
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); }, { signal: fuera.signal });
  addEventListener('pagehide', pausar, { signal: fuera.signal });

  const tocar = ev => {
    ev?.preventDefault();
    if (S.fin || vez !== partidas) return;
    if (S.pausa) return reanudar();
    const g = S.g;
    if (g.mode === 'ready') { pista.classList.add('fuera'); S.inicio = performance.now(); unlockAudio(); }
    if (g.mode === 'ready' || g.mode === 'play') flap(g);
  };
  escenario.addEventListener('pointerdown', ev => { if (ev.button > 0) return; tocar(ev); }, { signal: fuera.signal });
  addEventListener('keydown', ev => {
    if ((ev.code === 'Space' || ev.code === 'ArrowUp') && !ev.target.closest?.('button, a, input, textarea')) { if (!ev.repeat) tocar(ev); else ev.preventDefault(); }
  }, { signal: fuera.signal });

  const jugar = e => {
    const g = S.g;
    if (e.type === 'flap') SOUND.flap();
    else if (e.type === 'pass' || e.type === 'perfect') {
      S.kinds.push(e.type);
      if (e.type === 'perfect') { SOUND.perfect(); vibrate(12); } else SOUND.pass();
      // Saved after each gate: a reload ends the game here, it does not start it over
      ctx.guardar?.(estado());
      if (p.tope && g.passed >= p.tope) acabar('tope');
    } else if (e.type === 'hit') { SOUND.hit(); vibrate(60); }
    else if (e.type === 'over') SOUND.over();
    else if (e.type === 'level') decir(fmt(T.flLevel, { n: e.level }), true);
    else if (e.type === 'walls') decir(T.flWalls, true);
    else if (e.type === 'end') acabar('fin');
    sc.fx(e, g);
  };

  /**
   * The end: the last life lost (the bird fell), or a game left halfway (`recien` false: a reload, or one
   * already finished). The cup's clock stops right here (D-130) and, with the final state, the result goes
   * out now (D-150).
   */
  function acabar(motivo, { recien = true } = {}) {
    if (S.fin) return;
    S.ms = S.inicio ? Math.round(performance.now() - S.inicio - S.pausado) : (previa?.ms || 0);
    S.fin = true; S.pausa = false; cartel.hidden = true;
    fuera.abort();
    const e = estado();
    ctx.guardar?.(e);
    ctx.pararReloj?.(e);
    pista.classList.add('fuera');
    decir(motivo === 'tope' ? T.flTrialDone : T.flOver);
    aviso.classList.add('final');
    juego.classList.add('terminado');
    fin.replaceChildren(
      el('p', { class: 'fl-veredicto', id: 'fl-veredicto' }, T.flVerdicts[verdictOf(e.score)]),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => ctx.terminar(estado()) }, ctx.textoFin || T.flContinue));
    if (!recien) return;
    requestAnimationFrame(() => fin.scrollIntoView?.({ block: 'nearest', behavior: QUIETO() ? 'auto' : 'smooth' }));
  }

  const paso = now => {
    if (vez !== partidas || !lienzo.isConnected) { fuera.abort(); return; }
    const g = S.g;
    if (!S.pausa) {
      S.acc += Math.min(0.05, (now - S.last) / 1000);
      while (S.acc >= STEP) {
        step(g, STEP); sc.tick(STEP, g); S.acc -= STEP;
        if (g.events.length) {
          const evs = g.events.splice(0);
          evs.forEach(jugar);
          if (evs.some(x => x.type !== 'flap')) pintarHud();
        }
      }
    }
    S.last = now;
    sc.draw(g);
    // Finished and the bird down: one more second for the sparks, then the loop sleeps
    if (S.fin && g.mode === 'over' && (S.dormir ||= now + 1000) < now) return;
    requestAnimationFrame(paso);
  };

  // A game already played on this phone: finished, it shows finished; halfway, it ends where it was
  if (previa) {
    const g = S.g;
    g.score = previa.score | 0; g.passed = previa.passed | 0; g.perfects = previa.perfects | 0; g.walls = previa.walls | 0; g.level = previa.level || 1;
    g.mode = 'over'; g.hearts = 0; g.gates = []; g.spikes = [];
    S.kinds = Array.isArray(previa.kinds) ? previa.kinds.slice() : [];
    pintarHud();
    acabar(previa.fin && p.tope && previa.passed >= p.tope ? 'tope' : 'fin', { recien: false });
    S.ms = previa.ms || 0;
  } else escenario.focus({ preventScroll: true });
  requestAnimationFrame(paso);

  // For the end-to-end script: the game in play, a tap, and the state as the cup gets it
  window.__aletazo = { S, get g() { return S.g; }, tocar: () => tocar(), pausar, estado };
}

/** What goes to the cup and to the result: the points (no cap), its card, and the flying time without pauses. */
export function result(e) {
  const s = score(e);
  return { s, t: card(e), resumen: String(s), ms: Number.isFinite(e?.ms) ? Math.round(e.ms) : undefined };
}

/** How the score was reached (D-106): the gates crossed, the dead centers and the level reached. */
export function breakdown(e, { T, fmt = fmtLocal }) {
  if (!e) return [];
  const passed = Math.max(0, e.passed | 0), perfects = Math.max(0, e.perfects | 0);
  return [
    fmt(T.flBdGates[forma(passed)], { n: passed }),
    perfects ? fmt(T.flBdCenters[forma(perfects)], { n: perfects }) : null,
    (e.level | 0) > 1 ? fmt(T.flBdLevel, { n: e.level }) : null,
  ].filter(Boolean);
}

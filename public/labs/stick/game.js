/**
 * Stick Ninja — lab prototype (D-446), inspired by Stick Hero (Ketchapp, 2014): hold to stretch a stick,
 * let go and it falls across the gap. English only for now, like Stack (D-445). The engine is engine.js;
 * this file draws the night, the pillars and the ninja on a canvas, reads the finger and celebrates.
 *
 * The hold is measured between the press's and the release's own timestamps, so a slow phone does not
 * play a harder game (engine.js). The course is the day's: everyone
 * crosses the same gaps today, and the phone keeps today's runs, so a group can pass it around.
 */
import { salidasFin } from '../../assets/js/fin.js';
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { onScreen } from '../../assets/js/on-screen.js';
import { COMMON, SITIO } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { param } from '../../assets/js/parametros.js';
import { bloqueTabla, avisoPartida, fijarIdioma } from '../../assets/js/ranking.js';
import { rankingsVisibles, leerYo } from '../../assets/js/jugador.js';
import {
  newGame, pillar, pillarAt, current, next, press, release, suspend, stickAt, advance, pause, runX, walkEnd,
  holdFor, restX, daySeed, card, VIEW, HOLD_X, TURN_MS, NINJA, PERFECT, MAX_BONUS,
  revive, LIVES,
} from './engine.js';
import { CAIDA_MS, RESCATE_MS, escena, momento } from './scene.js';

trackVisit();   // the site's traffic (D-208)

const GAME_ID = 'stick';
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const KETCHAPP = 'https://www.ketchappgames.com/';
const BEST_KEY = 'juegos-de-salon:stick-best';
const TODAY_KEY = 'juegos-de-salon:stick-today';
const MOVING_KEY = 'juegos-de-salon:stick-moving';
const T = {
  nombre: 'Shinobi',
  lema: 'Stretch the stick, cross the gap, plant the flag.',
  como: [
    ['👆', 'Hold to stretch the stick, let go to drop it across the gap. You have 3 lives.'],
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
  vista.replaceChildren(el('div', { class: 'portada-ninja' },
    el('div', { class: 'portada' }, tituloJuego(), el('p', { class: 'lead lema-ninja' }, T.lema), credito(), lienzo),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-jugar', onClick: () => { SFX.tap(); jugar(); } }, T.jugar),
    // The game's ranking and signing in, under Play, like every game played alone (D-212, D-249)
    tabla(),
    // The steps go after Play, so it is seen without scrolling on a small phone (U-39); this phone's best with them
    el('div', { class: 'panel' }, pasos(), el('p', { class: 'muted hoy-nota' }, T.hoy),
      antes ? el('p', { class: 'muted mejor-portada', id: 'mejor-portada' }, fmt(T.mejorCorto, { n: antes })) : ''),
  ));
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
    S.despertar?.();
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
        sc.rescatar(g);
        setTimeout(() => {
          if (vez !== animando) return;
          revive(g, performance.now());
          sc.revivir();
          aviso.classList.add('fuera');
          pista();
        }, QUIETO ? 0 : RESCATE_MS);
      };
      volver();
    }, QUIETO ? 600 : CAIDA_MS);
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
function yaMovil() { try { return localStorage.getItem(MOVING_KEY) === '1'; } catch { return false; } }
function marcarMovil() { try { localStorage.setItem(MOVING_KEY, '1'); } catch { /* private mode */ } }
/** Stick Ninja's ranking (D-212): the `stick` table, Week · All time · Friends, in English like the page. */
function tabla({ entrar = true } = {}) {
  return bloqueTabla({ tabla: GAME_ID, titulo: fmt(COMMON.en.rk.titleOf, { game: T.nombre }), alTocar: () => SFX.tap(), entrar });
}

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
  const ms = Date.now() - S.desde, segundos = Math.round(ms / 1000);
  trackFinish({ detalle: `${n} points · ${g.bridges} bridges · ${g.perfects} flags · streak ${g.bestStreak} · ${segundos}s` });
  pie.replaceChildren();
  // The table is made before the notice: saving the run reloads it
  const tablaFin = tabla({ entrar: false });
  // A course chosen in the link (?seed=) does not count: it would let the same gaps be replayed (D-212)
  const cuenta = !param('seed');
  const conRanking = cuenta && rankingsVisibles() && !!leerYo();
  const aviso = () => avisoPartida({ juego: GAME_ID, s: n, ms, alAnotar: () => tablaFin.recargar(), alTocar: () => SFX.tap() });
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
    // With a player, how the run did against their record replaces this phone's best (D-212)
    conRanking ? aviso() : record ? null : el('p', { class: 'muted', style: 'margin:0', id: 'mejor' }, fmt(T.mejor, { n: Math.max(antes, n) })),
    el('ul', { class: 'desglose muted' }, ...lineas.map(x => el('li', {}, x))),
    hoyLista,
    botonResultadoSolo({ C: COMMON.en, emoji: '🥷', juego: T.nombre, puntaje: `🥷 ${n}`, tiempo: '', tarjeta: card(g.kinds), url: `${SITIO}labs/stick/`, alTocar: () => SFX.tap() }),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-otra', onClick: () => { SFX.tap(); jugar(); } }, T.otraVez),
    salidasFin('lab', { raiz: '../../' }),
    // Without a player, "make this game count?" after the buttons, so they stay in sight (C-8, D-274); then the table
    !conRanking && cuenta && rankingsVisibles() ? aviso() : null,
    tablaFin,
    el('hr', { class: 'divisor' }),
    formularioComentario({ T: T.comentario, contexto: contexto('resultado') })));
  scrollTo(0, 0);
  if (record) { SFX.win(); if (!QUIETO) confetti({ count: 140, duration: 2000 }); }
}

fijarIdioma('en');
document.getElementById('sound-slot').append(soundToggle());
initSound();
sparkles();
portada();
// For the end-to-end script: the game (S.presionar(t) / S.soltar(t) as a finger would, S.pausar() as a
// hidden page does), how long to hold for the flag, and where a pillar is now
window.__stick = { S, sostener: (off = 0, t = performance.now()) => holdFor(S.g, off, t), fin: () => walkEnd(S.g), columna: k => pillarAt(S.g, k, performance.now()) };

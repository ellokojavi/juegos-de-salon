/**
 * 🥷 Shinobi (id `stick`): the screen for its own page (/shinobi/), Uno al día and La Copa, moved over from
 * the lab (D-446) as Tren en Vilo was (D-456). Hold to stretch a stick, let go and it falls across the
 * gap; land it on the next pillar and the ninja runs over. Everything the lab's game had in play comes
 * along: the hold measured with the events' own timestamps, 3 lives with the climb back up, flags with
 * their streak bonus, moving pillars, achievement banners, the streak chip, the pause when the page is
 * hidden or loses focus (a tap takes it off; the loop sleeps meanwhile), sounds, vibration and reduced
 * motion. The cup's page does the rest (cover, rules, result, ranking, sharing, telemetry).
 *
 * A real-time run cannot be resumed halfway: nothing is saved while it goes, and the finished run is
 * saved with `ctx.guardar([estado])` (an array of one, so the standalone page keeps it too). If
 * `ctx.jugadas` already holds a finished run, the screen shows it finished.
 *
 * The course comes from `p.semilla` (engine.js `generarDia`) and the lives from `p.vidas` (one in the trial).
 */
import { el, confetti } from '../../../assets/js/ui.js';
import { loadCss } from '../../../assets/js/load-css.js';
import { getLang } from '../../../assets/js/i18n.js';
import TEXTOS from './texts.js';
import { onScreen } from '../../../assets/js/on-screen.js';
import {
  newGame, pillarAt, current, next, press, release, suspend, stickAt, advance, pause, walkEnd,
  holdFor, revive, puntaje, tarjeta, PERFECT, MAX_BONUS, LIVES,
} from './engine.js';
import { CAIDA_MS, RESCATE_MS, escena, momento } from './scene.js';

// Its own stylesheet, loaded with its code and before its first screen (D-468)
await loadCss(new URL('./style.css', import.meta.url));

const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
/** The first moving pillar's hint is shown once per phone (the lab's key, kept). */
const MOVING_KEY = 'juegos-de-salon:stick-moving';
const yaMovil = () => { try { return localStorage.getItem(MOVING_KEY) === '1'; } catch { return false; } };
const marcarMovil = () => { try { localStorage.setItem(MOVING_KEY, '1'); } catch { /* private mode */ } };

/** A finished run kept in `ctx.jugadas`: `[estado]` (or the state itself), with `fin`. */
const previaDe = j => {
  const e = Array.isArray(j) ? j[j.length - 1] : j;
  return e && typeof e === 'object' && e.fin ? e : null;
};

/** What a finished run keeps: enough for the result, the breakdown and the card. */
const estadoDe = (g, ms) => ({
  fin: true, score: g.score, bridges: g.bridges, perfects: g.perfects, bonus: g.bonus,
  bestStreak: g.bestStreak, kinds: [...g.kinds], ms: Math.round(ms) || 0,
});

/**
 * The cover plays itself: mostly flags, a plain landing now and then, and every so often a stick too
 * short; then it starts over on another course.
 */
export function portada() {
  const lienzo = el('canvas', { class: 'sn-demo', 'aria-hidden': 'true' });
  // The waiting room puts the cover on screen after this returns: start once it is there
  let intentos = 0;
  const empezar = () => {
    if (!lienzo.isConnected) { if (++intentos < 120) requestAnimationFrame(empezar); return; }
    demo(lienzo);
  };
  requestAnimationFrame(empezar);
  return lienzo;
}

function demo(lienzo) {
  const sc = escena(lienzo, { compacto: true });
  let g, plan = null, ronda = 0;
  const empezar = now => { g = newGame(1000 + ronda++, now); sc.empezar(g); plan = { at: now + 700 }; };
  empezar(performance.now());
  if (QUIETO()) { requestAnimationFrame(now => { sc.draw(g, now); sc.cerrar(); }); return; }
  const paso = now => {
    if (!lienzo.isConnected) return sc.cerrar();
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

/**
 * The name in the waiting room, with the credit to the original right under it, as Loteo does (the
 * owner's call: transparency; the name stays Shinobi). `titulo` gets no T: the texts in the page's language.
 */
const KETCHAPP = 'https://www.ketchappgames.com/';
const UI = () => { let l = 'es'; try { l = getLang(); } catch (_) { /* outside the browser */ } return (TEXTOS[l] || TEXTOS.es).ui; };
export function titulo({ el: h = el, J }) {
  const [antes, despues] = String(UI().snCredit).split('{juego}');
  return h('div', { class: 'sn-titulo' },
    h('h2', { class: 'sn-nombre' }, h('span', { class: 'sn-logo', 'aria-hidden': 'true' }, '🥷'), h('span', { class: 'display display--lg rainbow' }, J.nombre)),
    h('p', { class: 'sn-credito', id: 'sn-credito' }, antes, h('a', { href: KETCHAPP, target: '_blank', rel: 'noopener', id: 'link-stick-hero' }, 'Stick Hero'), despues || ''));
}

export function montar(raiz, ctx) {
  const { T, fmt, SFX, vibrate, p = {} } = ctx;
  const previa = previaDe(ctx.jugadas);
  const terminar = e => el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults);

  /** The end of the run, before the cup's result: the stamp, the points, how they came, and the button. */
  function fin(e) {
    raiz.replaceChildren(el('div', { class: 'sn-fin' },
      el('p', { class: 'sn-sello', id: 'sn-sello' }, T.snOver),
      el('p', { class: 'score-big', id: 'sn-puntaje' }, String(e.score)),
      el('ul', { class: 'sn-desglose muted' }, ...desglose(e, { T, fmt }).map(x => el('li', {}, x))),
      terminar(e)));
  }
  if (previa) { ctx.pararReloj?.(previa); fin(previa); return; }

  const vidasTotal = Math.max(1, p.vidas | 0 || LIVES);
  const g = newGame(p.semilla ?? 1, performance.now(), vidasTotal);
  const S = { g, fin: false, pausa: 0, dormido: false, logros: new Set(), activo: 0, desde: performance.now(), despertar: null };
  const quieto = QUIETO();

  const lienzo = el('canvas', { class: 'sn-lienzo', 'aria-hidden': 'true' });
  const marcador = el('div', { class: 'sn-marcador', id: 'sn-marcador', 'aria-live': 'polite' }, '0');
  const racha = el('div', { class: 'sn-racha', id: 'sn-racha', hidden: true });
  const vidas = el('div', { class: 'sn-vidas', id: 'sn-vidas', 'aria-label': fmt(T.snLivesAria, { n: vidasTotal }) },
    ...Array.from({ length: vidasTotal }, () => el('span', { 'aria-hidden': 'true' }, '❤️')));
  const aviso = el('div', { class: 'sn-aviso', id: 'sn-aviso' }, T.snHold);
  const logro = el('div', { class: 'sn-logros', id: 'sn-logros', 'aria-live': 'polite' });
  const cartel = el('div', { class: 'sn-pausa', id: 'sn-pausa', 'aria-live': 'polite', hidden: true },
    // The emoji outside the rainbow: a gradient clipped to text paints an emoji as a colored square
    el('span', { class: 'sn-titulo-pausa' }, el('span', { 'aria-hidden': 'true' }, '⏸️'), el('span', { class: 'display rainbow' }, T.snPaused)), el('span', {}, T.snTapToGo));
  const escenario = el('div', { class: 'sn-escenario', id: 'sn-escenario', role: 'button', tabindex: 0, 'aria-label': T.snHold },
    lienzo, marcador, vidas, racha, aviso, logro, cartel);
  raiz.replaceChildren(escenario);
  const sc = escena(lienzo);
  sc.empezar(g);
  let cayo = false, ultimoTic = 0;
  const vivo = () => raiz.isConnected && escenario.isConnected;

  const decir = (nodo, clase) => {
    aviso.replaceChildren(nodo);
    aviso.classList.remove('sn-fuera', 'sn-brilla', 'sn-final'); void aviso.offsetWidth;
    if (clase) aviso.classList.add(clase);
  };
  /** The hint for the moment: how to stretch, and the first time a pillar moves, how to aim at it. */
  const pista = () => {
    if (g.phase === 'held') return decir(T.snHoldMore);
    if (next(g).move && !yaMovil()) return decir(T.snMoving);
    if (g.bridges === 0) return decir(T.snHold);
  };

  // An achievement: a banner that slides in near the bottom, with its own pulse, one at a time
  const LOGROS = { primero: 'snAchFirst', racha3: 'snAchStreak3', racha5: 'snAchStreak5', racha8: 'snAchStreak8', movil: 'snAchMoving', puntos: 'snAchPoints' };
  const cola = [];
  let mostrando = false;
  const celebrar = clave => {
    if (S.logros.has(clave)) return;
    S.logros.add(clave);
    const [ico, titulo, sub] = String(T[LOGROS[clave.startsWith('puntos') ? 'puntos' : clave]] || '').split('|');
    cola.push({ ico, titulo: fmt(titulo, { n: clave.slice(6) }), sub });
    if (!mostrando) siguienteLogro();
  };
  const siguienteLogro = () => {
    const l = cola.shift();
    if (!l || !vivo()) { mostrando = false; return; }
    mostrando = true;
    const banda = el('div', { class: 'sn-logro' }, el('span', { class: 'sn-logro-ico', 'aria-hidden': 'true' }, l.ico),
      el('span', { class: 'sn-logro-txt' }, el('b', {}, l.titulo), el('small', {}, l.sub)));
    logro.replaceChildren(banda);
    SFX.turn?.();
    setTimeout(() => { banda.classList.add('sn-sale'); setTimeout(siguienteLogro, quieto ? 0 : 260); }, quieto ? 1400 : 1700);
  };

  /** The streak chip under the score: how many flags in a row, and what the next one is worth. */
  const rachaChip = n => {
    racha.hidden = n < 2;
    if (n >= 2) racha.textContent = fmt(T.snStreakChip, { n, b: Math.min(n + 1, MAX_BONUS) });
  };

  const presionar = t => {
    if (S.fin || S.pausa) return;
    if (!press(g, t)) return;
    ultimoTic = 0;
    aviso.classList.add('sn-fuera');
  };
  const soltar = t => {
    if (S.fin || S.pausa || g.phase !== 'growing') return;
    if (!release(g, t)) return;
    cayo = false;
    aviso.classList.add('sn-fuera');
    SFX.dice?.();
  };

  const llego = (e, x0, len) => {
    if (e.moving) marcarMovil();
    marcador.textContent = String(g.score);
    marcador.classList.remove('sn-salta'); void marcador.offsetWidth; marcador.classList.add('sn-salta');
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
    pista();
  };

  // Paused when the page is hidden or loses focus (a call, another app): a stick being stretched stops
  // where it was and the next press goes on from there; a running ninja freezes. The first tap back
  // only takes the pause off
  const pausar = () => {
    if (S.fin || S.pausa || !vivo()) return;
    S.pausa = performance.now();
    S.activo += S.pausa - S.desde;
    suspend(g, S.pausa);
    cartel.hidden = false;
  };
  const reanudar = () => {
    if (!S.pausa) return;
    S.despertar?.();
    const ahora = performance.now();
    pause(g, ahora - S.pausa);
    S.pausa = 0; S.desde = ahora;
    cartel.hidden = true;
    SFX.tap();
    pista();
  };
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

  /** A fall that leaves lives: a heart goes dark, and the ninja climbs back onto the same pillar. */
  function tropezar(kind, quedan) {
    sc.caer(g, kind);
    SFX.letterMiss?.();
    vibrate([40, 30, 60]);
    racha.hidden = true;
    vidas.children[quedan]?.classList.add('sn-perdida');
    vidas.setAttribute('aria-label', fmt(T.snLivesAria, { n: quedan }));
    const quedanTxt = quedan === 1 ? T.snLastLife : quedan === 2 ? T.snTwoLives : fmt(T.snLivesAria, { n: quedan });
    decir(el('span', {}, el('span', { class: 'rainbow' }, kind === 'long' ? T.snLong : T.snShort), el('small', { class: 'sn-quedan' }, quedanTxt)), 'sn-final');
    setTimeout(() => {
      // A pause in between waits: the ninja comes back once the game goes on
      const volver = () => {
        if (!vivo()) return;
        if (S.pausa) return setTimeout(volver, 200);
        sc.rescatar(g);
        setTimeout(() => {
          if (!vivo()) return;
          revive(g, performance.now());
          sc.revivir();
          aviso.classList.add('sn-fuera');
          pista();
        }, quieto ? 0 : RESCATE_MS);
      };
      volver();
    }, quieto ? 600 : CAIDA_MS);
  }

  /** The last life gone: the cup's clock stops here, the run is saved finished, then its end. */
  function perder(kind) {
    S.fin = true;
    vidas.children[0]?.classList.add('sn-perdida');
    fuera.abort();
    sc.caer(g, kind);
    SFX.letterMiss?.();
    setTimeout(() => { if (vivo()) SFX.error?.(); }, 380);
    vibrate([40, 30, 60]);
    racha.hidden = true;
    decir(el('span', { class: 'rainbow' }, kind === 'long' ? T.snLong : kind === 'short' ? T.snShort : T.snOver), 'sn-final');
    const e = estadoDe(g, ctx.tiempo?.() ?? (S.activo + performance.now() - S.desde));
    ctx.guardar?.([e]);
    ctx.pararReloj?.(e);
    if (g.score >= 25 && !quieto) setTimeout(() => { if (vivo()) { SFX.win?.(); confetti({ count: 120, duration: 1800 }); } }, 900);
    setTimeout(() => { if (raiz.isConnected) fin(e); }, quieto ? 500 : 1700);
  }

  const paso = now => {
    if (!vivo()) { fuera.abort(); return sc.cerrar(); }
    const reloj = S.pausa || now;
    // Stretching: a soft tick every so often, rising, so the length is heard too
    if (g.phase === 'growing') {
      const k = Math.floor(stickAt(g, reloj) / 36);
      if (k > ultimoTic) { ultimoTic = k; SFX.letterHit?.(Math.min(k, 11)); }
    }
    if (g.phase === 'walking' && !S.pausa) {
      const w = g.walk;
      // The stick lands: on the flag, the pulse; on the pillar, a thud
      if (!cayo && reloj >= w.t0) {
        cayo = true;
        if (w.kind === 'perfect') {
          const n = g.streak + 1;
          sc.perfecto(g, w.tip, n);
          SFX.reveal?.(); SFX.letterHit?.(Math.min(4 + n * 2, 11)); vibrate([12, 40, 18]);
          decir(el('span', { class: 'rainbow' }, n > 1 ? fmt(T.snStreak, { n }) : T.snPerfect), 'sn-brilla');
          rachaChip(n);
          escenario.classList.remove('sn-pulso'); void escenario.offsetWidth; escenario.classList.add('sn-pulso');
          if (n >= MAX_BONUS && !quieto) confetti({ count: 50, duration: 900 });
        } else if (w.kind === 'land') { sc.toque(w.tip); SFX.tap(); vibrate(8); rachaChip(0); }
      }
      const x0 = current(g).x + current(g).w, len = g.stick;
      for (const e of advance(g, reloj)) {
        if (e.type === 'arrive') llego(e, x0, len);
        if (e.type === 'fall') (e.over ? perder(e.kind) : tropezar(e.kind, e.lives));
      }
    }
    sc.draw(g, now, reloj);
    if (S.fin && g.phase === 'over' && now - (walkEnd(g) || now) > 2500) return sc.cerrar();
    // Paused for a second (effects done): the loop sleeps until the tap back, so a game left
    // paused on the table does not burn battery (#892)
    if (S.pausa && now - S.pausa > 1000) { S.dormido = true; return; }
    requestAnimationFrame(paso);
  };
  S.despertar = () => { if (S.dormido) { S.dormido = false; requestAnimationFrame(paso); } };
  requestAnimationFrame(paso);
  pista();

  // For the end-to-end script: the game, a finger (presionar(t) / soltar(t)), a hidden page (pausar()),
  // how long to hold for the flag, when the walk ends, and where a pillar is now
  globalThis.__stick = {
    S, g, presionar, soltar, pausar,
    sostener: (off = 0, t = performance.now()) => holdFor(g, off, t),
    fin: () => walkEnd(g),
    columna: k => pillarAt(g, k, performance.now()),
  };
}

/** The result: the cup's 0–100 (engine.js `puntaje`), the card, the game's own points, and the time played. */
export function resultado(e) {
  return { s: puntaje(e), t: tarjeta(e), resumen: `🥷 ${Number(e?.score) || 0}`, ...(e?.ms ? { ms: e.ms } : {}) };
}

/** How the score was reached (D-106): the pillars crossed, the flags and their bonus, the longest streak. */
export function desglose(e, { T, fmt }) {
  if (!e) return [];
  const n = e.bridges | 0, f = e.perfects | 0, b = e.bonus | 0;
  const lineas = [
    n === 0 ? T.snBdBridges0 : n === 1 ? T.snBdBridges1 : fmt(T.snBdBridges, { n }),
    f === 0 ? T.snBdFlags0 : f === 1 ? fmt(T.snBdFlags1, { b }) : fmt(T.snBdFlags, { n: f, b }),
  ];
  if ((e.bestStreak | 0) > 1) lineas.push(fmt(T.snBdStreak, { n: e.bestStreak }));
  if ((e.score | 0) > 100) lineas.push(fmt(T.snBdCap, { n: e.score }));
  return lineas;
}

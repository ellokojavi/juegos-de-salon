/**
 * 🚇 Rutas rotas: the screen, for a La Copa day, its trial session and the standalone page /routes/
 * (D-331; it came from the lab, D-293). Inspired by Junction Nine (Bricks and Chips): nine pieces of
 * a subway map. Dragging from one piece to another marks the rectangle between them and, on release,
 * it turns half a turn as a single block; a tap turns one piece. Each game is five stages, harder
 * each time (D-294), against a 7-minute clock, and the score goes by layers (D-295): the stages done,
 * then speed, then the turns against the exact minimum.
 *
 * The clock is the cup's (`ctx.tiempo()`), which already pauses with the screen hidden (D-95) and
 * survives a reload; the 7 minutes are counted against it. The moves are the whole game:
 * `{ etapa, hechas: [{ giros, minimo }], giros: [index in RECTANGULOS], reinicios, fin, seg }`, and
 * the state is rebuilt from the day's seed and them, so a cup day resumes where it was.
 *
 * The board does not mark which edges already fit (#359): reading the lines is the game.
 */
import { el } from '../../../assets/js/ui.js';
import { generar, generarEtapa, girar, resuelto, puntajePartida, tarjeta, RECTANGULOS, LADO, ETAPAS, TIEMPO_S } from './engine.js';
import { loadCss } from '../../../assets/js/load-css.js';

// Its own stylesheet, loaded with its code and before its first screen (D-468)
await loadCss(new URL('./style.css', import.meta.url));

const JUNCTION = 'https://bricksandchips.co/junction-nine';
/** How long Give up waits for the second tap, like Clear all in Zip. */
const CONFIRMAR_MS = 3000;
const quieto = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const META = Array.from({ length: LADO * LADO }, (_, p) => ({ p, v: 0 }));
const mmss = ms => { const t = Math.max(0, Math.round((ms || 0) / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const indice = r => RECTANGULOS.findIndex(x => x.f1 === r.f1 && x.c1 === r.c1 && x.f2 === r.f2 && x.c2 === r.c2);

// ——— The pieces, in SVG: each segment joins two doors with a curve, with a station halfway ———
const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => { const n = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
const PUNTO = { N: k => [35 + 30 * k, 0], S: k => [35 + 30 * k, 100], O: k => [0, 35 + 30 * k], E: k => [100, 35 + 30 * k] };
const ADENTRO = { N: [0, 1], S: [0, -1], O: [1, 0], E: [-1, 0] };
function dibujoPieza(pieza) {
  const s = svg('svg', { viewBox: '0 0 100 100', class: 'rr-pieza-svg', 'aria-hidden': 'true' });
  const estaciones = [];
  for (const { de, a, color } of pieza.tramos) {
    const [x1, y1] = PUNTO[de.lado](de.k), [x2, y2] = PUNTO[a.lado](a.k);
    const [dx1, dy1] = ADENTRO[de.lado], [dx2, dy2] = ADENTRO[a.lado];
    const c1 = [x1 + dx1 * 45, y1 + dy1 * 45], c2 = [x2 + dx2 * 45, y2 + dy2 * 45];
    s.append(svg('path', { d: `M${x1} ${y1} C${c1} ${c2} ${x2} ${y2}`, stroke: color, 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'butt', class: 'rr-tramo' }));
    // One station per place: at the crossings they piled up and read as a smudge
    const m = (u, v, w, z) => 0.125 * u + 0.375 * v + 0.375 * w + 0.125 * z;
    const cx = m(x1, c1[0], c2[0], x2), cy = m(y1, c1[1], c2[1], y2);
    if (estaciones.some(([x, y]) => Math.hypot(x - cx, y - cy) < 14)) continue;
    estaciones.push([cx, cy]);
    s.append(svg('circle', { cx, cy, r: 5.5, class: 'rr-estacion' }));
  }
  return s;
}

/**
 * The board: one piece per place, placed with left/top. Each piece has two layers: the outer one
 * sits in its place and only rotates while a move plays; the inner one (the drawing) carries the
 * orientation the engine says, half a turn when flipped (`v`).
 */
function crearTablero(t, { interactivo = false, alGirar, tablero = false, vibrate } = {}) {
  const caja = el('div', { class: 'rr-tablero', id: interactivo ? 'rr-tablero' : null, 'data-tablero': interactivo || tablero ? 'rutas' : null });
  const marco = el('div', { class: 'rr-seleccion', 'aria-hidden': 'true' });
  const piezas = t.piezas.map((p, i) => el('div', { class: 'rr-pieza', 'data-p': i }, dibujoPieza(p)));
  caja.append(...piezas, marco);
  const colocar = estado => {
    estado.forEach(({ p, v }, lugar) => {
      const n = piezas[p];
      n.classList.add('sin-animar');
      n.style.transform = ''; n.style.transformOrigin = '';
      n.style.left = `${(lugar % LADO) * 100 / LADO}%`;
      n.style.top = `${Math.floor(lugar / LADO) * 100 / LADO}%`;
      n.firstChild.style.transform = v ? 'rotate(180deg)' : '';
      n.dataset.lugar = lugar;
    });
  };
  /**
   * A move: the rectangle turns half a turn as one block, around its center (the owner's request).
   * Each piece orbits that center without turning on its own; at the end it lands in its new place
   * with its new orientation, with no jump. A move that arrives before the last one ends closes it.
   */
  let pendiente = null;
  const aplicar = (estado, rect) => {
    pendiente?.();
    const nuevo = girar(estado, rect);
    if (quieto()) { colocar(nuevo); return nuevo; }
    const cx = (rect.c1 + rect.c2 + 1) / 2, cy = (rect.f1 + rect.f2 + 1) / 2;
    const moviendo = [];
    for (let f = rect.f1; f <= rect.f2; f++) for (let c = rect.c1; c <= rect.c2; c++) {
      const n = piezas[estado[f * LADO + c].p];
      n.style.transformOrigin = `${(cx - c) * 100}% ${(cy - f) * 100}%`;
      void n.offsetWidth;
      n.classList.remove('sin-animar');
      n.classList.add('girando');
      n.style.transform = 'rotate(180deg)';
      moviendo.push(n);
    }
    const cerrar = () => { clearTimeout(reloj); pendiente = null; moviendo.forEach(n => n.classList.remove('girando')); colocar(nuevo); };
    const reloj = setTimeout(cerrar, 460);
    pendiente = cerrar;
    return nuevo;
  };
  const marcar = r => {
    if (!r) { marco.classList.remove('ve'); return; }
    Object.assign(marco.style, { left: `${r.c1 * 100 / LADO}%`, top: `${r.f1 * 100 / LADO}%`, width: `${(r.c2 - r.c1 + 1) * 100 / LADO}%`, height: `${(r.f2 - r.f1 + 1) * 100 / LADO}%` });
    marco.classList.add('ve');
  };
  if (interactivo) {
    // Dragging from one piece to another marks the rectangle; releasing turns it. A tap is a 1×1 rectangle
    let desde = null, hasta = null;
    const lugarEn = ev => {
      const b = caja.getBoundingClientRect();
      const c = Math.min(LADO - 1, Math.max(0, Math.floor((ev.clientX - b.left) / (b.width / LADO))));
      const f = Math.min(LADO - 1, Math.max(0, Math.floor((ev.clientY - b.top) / (b.height / LADO))));
      return { f, c };
    };
    const rectDe = () => ({ f1: Math.min(desde.f, hasta.f), c1: Math.min(desde.c, hasta.c), f2: Math.max(desde.f, hasta.f), c2: Math.max(desde.c, hasta.c) });
    caja.addEventListener('pointerdown', ev => {
      if (caja.classList.contains('bloqueado')) return;
      desde = hasta = lugarEn(ev);
      try { caja.setPointerCapture(ev.pointerId); } catch (_) { /* a simulated touch */ }
      marcar(rectDe());
      ev.preventDefault();
    });
    caja.addEventListener('pointermove', ev => { if (!desde) return; const l = lugarEn(ev); if (l.f !== hasta.f || l.c !== hasta.c) { hasta = l; marcar(rectDe()); vibrate?.(5); } });
    const soltar = ev => { if (!desde) return; const r = rectDe(); desde = hasta = null; marcar(null); if (ev.type === 'pointerup') alGirar?.(r); };
    caja.addEventListener('pointerup', soltar);
    caja.addEventListener('pointercancel', soltar);
    // The tests turn without dragging: the same path as a drag
    caja.addEventListener('girar', ev => { if (!caja.classList.contains('bloqueado')) alGirar?.(ev.detail); });
  }
  // Put a state at once (at the start, on restart): a move still turning is closed first
  const poner = estado => { pendiente?.(); colocar(estado); };
  return { caja, poner, aplicar, marcar };
}

/**
 * The top of the waiting room (the owner's request in the lab): the board starts scrambled and gets
 * solved in 5 or 6 moves, alternating the two kinds of move: one piece alone (it turns in its place)
 * and two neighbours (they swap places). Before each one the rectangle is marked, as when dragging.
 * Solved, the route lights up and it starts again with another scramble; with reduced motion it stays solved.
 */
const UNA = [...Array(LADO * LADO).keys()].map(i => ({ f1: Math.floor(i / LADO), c1: i % LADO, f2: Math.floor(i / LADO), c2: i % LADO }));
const PAR = RECTANGULOS.filter(r => (r.f2 - r.f1) + (r.c2 - r.c1) === 1);
let demo = null;
const tableroDemo = () => (demo ||= generar('portada-demo', { giros: 3 }));
export function portada() {
  const t = tableroDemo();
  const tab = crearTablero(t);
  tab.caja.classList.add('rr-portada');
  tab.caja.setAttribute('aria-hidden', 'true');
  tab.poner(META);
  if (quieto()) { tab.caja.classList.add('resuelto'); return tab.caja; }
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const desorden = () => {
    const n = 5 + Math.floor(Math.random() * 2), jugadas = [];
    for (let k = 0; k < n; k++) {
      const lista = k % 2 ? PAR : UNA;
      let r;
      do r = lista[Math.floor(Math.random() * lista.length)]; while (r === jugadas[k - 1]);
      jugadas.push(r);
    }
    return jugadas;
  };
  // It goes on while it is on screen: a redrawn waiting room (another language) leaves it behind
  const sigue = () => tab.caja.isConnected;
  (async () => {
    await espera(300);
    while (sigue()) {
      const jugadas = desorden();
      let estado = jugadas.reduce(girar, META);
      if (resuelto(t.piezas, estado)) continue;
      tab.caja.classList.remove('resuelto', 'aparece'); void tab.caja.offsetWidth; tab.caja.classList.add('aparece');
      tab.poner(estado);
      await espera(1100);
      for (const r of [...jugadas].reverse()) {
        if (!sigue()) return;
        tab.marcar(r); await espera(550);
        if (!sigue()) return;
        estado = tab.aplicar(estado, r); tab.marcar(null);
        await espera(800);
      }
      if (!sigue()) return;
      tab.caja.classList.add('resuelto');
      await espera(2600);
    }
  })();
  return tab.caja;
}

/**
 * The drawing of the rules (D-134): the same board twice, one move away. Before, with the rectangle
 * marked, the lines break; after its half turn, they all join. Under it, the credit to Junction Nine.
 */
let ej = null;
function tableroEjemplo() {
  if (ej) return ej;
  const t = generar('ejemplo-rr', { lineas: 3, minimo: 2 });
  const rect = [{ f1: 0, c1: 0, f2: 1, c2: 1 }, { f1: 0, c1: 1, f2: 1, c2: 2 }, { f1: 1, c1: 0, f2: 2, c2: 1 }].find(r => !resuelto(t.piezas, girar(META, r)));
  return (ej = { t, rect });
}
export function ejemplo({ el: h = el, T }) {
  const { t, rect } = tableroEjemplo();
  const antes = crearTablero(t), despues = crearTablero(t);
  antes.poner(girar(META, rect)); antes.marcar(rect);
  despues.poner(META); despues.caja.classList.add('resuelto');
  for (const x of [antes, despues]) { x.caja.classList.add('rr-ej'); x.caja.setAttribute('aria-hidden', 'true'); }
  const [a, b] = String(T.rrCredit).split('{juego}');
  return h('div', { class: 'rr-ejemplo' },
    h('div', { class: 'rej-ejemplo' },
      h('figure', {}, antes.caja, h('figcaption', {}, `❌ ${T.rrExBad}`)),
      h('figure', {}, despues.caja, h('figcaption', {}, `✅ ${T.rrExOk}`))),
    h('p', { class: 'rr-credito', id: 'rr-credito' }, a, h('a', { href: JUNCTION, target: '_blank', rel: 'noopener', id: 'link-junction' }, 'Junction Nine'), b || ''));
}

export function montar(raiz, ctx) {
  const { T, fmt, SFX, vibrate, p } = ctx;
  const etapas = p.etapas || ETAPAS.length, limite = p.tiempo || TIEMPO_S * 1000;
  const previa = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) ? ctx.jugadas : {};
  const J = { etapa: 0, hechas: [], giros: [], reinicios: 0, fin: null, seg: 0, ...previa };
  J.hechas = (J.hechas || []).slice(0, etapas); J.giros = (J.giros || []).filter(i => RECTANGULOS[i]);
  J.etapa = Math.min(J.etapa | 0, etapas - 1);
  const guardar = () => ctx.guardar({ ...J, hechas: J.hechas.map(x => ({ ...x })), giros: J.giros.slice() });
  const final = () => ({ ...J, hechas: J.hechas.map(x => ({ ...x })), giros: J.giros.slice(), etapas, tiempo: limite });
  const usado = () => ctx.tiempo?.() ?? 0;

  raiz.replaceChildren();
  const caja = el('div', { class: 'stack rr-juego' });
  raiz.append(caja);
  let t = null, estado = null, tab = null, relojNodo = null, acabado = !!J.fin, reloj = null;
  // The hook for the end-to-end tests (as the lab's): the moves, the board in play and a turn as if dragged
  window.__rutas = { J, get t() { return t; }, get estado() { return estado; }, girar: r => tab?.caja.dispatchEvent(new CustomEvent('girar', { detail: r })) };

  /** The dots of the stages: done (green at the minimum, yellow with extra turns, like 🟩 and 🟨 in the card), the current one and the ones to come. */
  const progreso = () => el('div', { class: 'rr-etapas', 'aria-hidden': 'true' }, ...Array.from({ length: etapas }, (_, k) => {
    const x = J.hechas[k];
    return el('span', { class: `rr-punto${x ? (x.giros <= x.minimo ? ' perfecta' : ' hecha') : k === J.etapa && !J.fin ? ' actual' : ''}` });
  }));

  function jugarEtapa() {
    t = generarEtapa(p.semilla, J.etapa);
    estado = J.giros.reduce((e, i) => girar(e, RECTANGULOS[i]), t.inicio);
    // The minimum is on the scoreboard just below (U-8): one line less, and the notice fits at 320×568
    const cabeza = el('div', { class: 'rr-cabeza entra', id: 'rr-etapa' },
      el('p', { class: 'rr-n-etapa' }, fmt(T.rrStage, { n: J.etapa + 1, t: etapas })), progreso());
    const marcador = el('p', { class: 'rr-marcador', id: 'rr-marcador' });
    relojNodo = el('p', { class: 'rr-reloj', id: 'rr-reloj' });
    const aviso = el('p', { class: 'rr-aviso', 'aria-live': 'polite' });
    const avisar = (x, bien = false) => { aviso.className = `rr-aviso${bien ? ' bien' : ''}`; aviso.textContent = x; };
    const pintar = () => {
      marcador.textContent = fmt(T.rrScoreboard, { g: J.giros.length, m: t.minimo });
      reiniciar.disabled = !J.giros.length;
      deshacer.disabled = !J.giros.length;
    };
    tab = crearTablero(t, {
      interactivo: true, vibrate,
      alGirar: r => {
        if (acabado) return;
        const i = indice(r);
        if (i < 0) return;
        estado = tab.aplicar(estado, r);
        J.giros.push(i);
        SFX.flip(); vibrate(15);
        avisar('');
        pintar();
        if (resuelto(t.piezas, estado)) lista(); else guardar();
      },
    });
    // Undo: the same turn undoes it (turning twice leaves it as it was); an undone turn doesn't count,
    // just as restarting is free: the game counts the turns that stay
    const deshacer = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-deshacer', onClick: () => {
      if (acabado || !J.giros.length) return;
      SFX.tap(); vibrate(10);
      estado = tab.aplicar(estado, RECTANGULOS[J.giros.pop()]);
      guardar(); pintar(); avisar(T.rrUndone);
    } }, `↩ ${T.undo}`);
    const reiniciar = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-reiniciar', onClick: () => {
      if (acabado || !J.giros.length) return;
      SFX.tap(); vibrate(10);
      estado = t.inicio; J.giros = []; J.reinicios++;
      tab.poner(estado);
      guardar(); pintar(); avisar(T.rrRestarted);
    } }, `↺ ${T.rrRestart}`);
    // Give up: with a second tap, like Clear all in Zip; the stages already done count
    let armado = false, armadoTimer = null;
    const rendirse = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-rendirse', onClick: () => {
      if (acabado) return;
      if (!armado) {
        armado = true; SFX.tap(); vibrate(15);
        rendirse.textContent = `🏳️ ${T.rrGiveUpSure}`; rendirse.classList.add('armado');
        clearTimeout(armadoTimer);
        armadoTimer = setTimeout(() => { armado = false; rendirse.textContent = `🏳️ ${T.giveUp}`; rendirse.classList.remove('armado'); }, CONFIRMAR_MS);
        return;
      }
      clearTimeout(armadoTimer);
      acabar('rendido');
    } }, `🏳️ ${T.giveUp}`);
    // The three buttons, the same width in one row, in this order (the owner's request): undo, restart, give up
    const acciones = el('div', { class: 'rr-acciones' }, deshacer, reiniciar, rendirse);
    /** Stage done: the lines glow, and the next one comes, or the end. */
    const lista = () => {
      J.hechas.push({ giros: J.giros.length, minimo: t.minimo });
      tab.caja.classList.add('bloqueado');
      // Restart and Give up go away with the stage done: giving up in the pause makes no sense
      acciones.remove();
      const perfecta = J.giros.length <= t.minimo;
      if (J.hechas.length >= etapas) { acabar('completa'); return; }
      J.etapa++; J.giros = [];
      guardar();
      const n = J.etapa;
      setTimeout(() => {
        if (!raiz.isConnected) return;
        tab.caja.classList.add('resuelto');
        avisar(fmt(perfecta ? T.rrStagePerfect : T.rrStageDone, { n }), true);
        cabeza.querySelector('.rr-etapas').replaceWith(progreso());
        SFX.reveal();
      }, quieto() ? 0 : 500);
      setTimeout(() => { if (!acabado && raiz.isConnected) jugarEtapa(); }, quieto() ? 1000 : 2300);
    };
    tab.poner(estado);
    caja.replaceChildren(cabeza, el('div', { class: 'rr-fila' }, relojNodo, marcador), tab.caja, aviso, acciones);
    tic();
    pintar();
  }

  /** The end of the game: all the stages done, out of time or given up. The cup clock stops right here (D-130). */
  function acabar(motivo) {
    if (J.fin && acabado) return;
    acabado = true; clearInterval(reloj);
    J.fin = motivo;
    J.seg = Math.min(limite, usado()) / 1000;
    guardar();
    ctx.pararReloj?.(final());
    if (motivo === 'completa') SFX.win();
    else if (motivo === 'tiempo') { SFX.timeUp(); vibrate([60, 40, 60]); }
    else { SFX.error(); vibrate([40, 40, 40]); }
    fin();
  }

  /** The finished board, its stamp and "See result", which opens the cup's result screen. */
  function fin() {
    if (!t) {
      t = generarEtapa(p.semilla, J.etapa);
      estado = J.giros.reduce((e, i) => girar(e, RECTANGULOS[i]), t.inicio);
    }
    const tabla = crearTablero(t, { tablero: true });
    tabla.caja.classList.add('bloqueado');
    tabla.poner(estado);
    const completa = J.fin === 'completa';
    if (completa) setTimeout(() => tabla.caja.classList.add('resuelto'), quieto() ? 0 : 450);
    const perfecto = completa && J.hechas.every(x => x.giros <= x.minimo);
    const sello = completa ? (perfecto ? T.rrEndPerfect : T.rrEndDone) : J.fin === 'tiempo' ? T.rrEndTime : T.rrEndGaveUp;
    caja.replaceChildren(
      el('div', { class: 'rr-cabeza', id: 'rr-etapa' }, progreso()),
      tabla.caja,
      el('p', { class: `rr-sello${completa ? '' : ' mal'}`, id: 'rr-sello' }, sello),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(final()); } }, ctx.textoFin || T.seeResults));
    relojNodo = null;
  }

  /** The countdown of the 7 minutes, against the cup's clock; red in the last minute. */
  function tic() {
    if (!raiz.isConnected) { clearInterval(reloj); return; }
    if (acabado) return;
    const quedan = Math.max(0, limite - usado());
    if (relojNodo) {
      relojNodo.textContent = fmt(T.rrClock, { t: mmss(Math.ceil(quedan / 1000) * 1000) });
      relojNodo.classList.toggle('poco', quedan <= 60000);
    }
    if (quedan <= 0) acabar('tiempo');
  }

  if (J.fin) { ctx.pararReloj?.(final()); fin(); return; }
  jugarEtapa();
  if (usado() >= limite) { acabar('tiempo'); return; }
  reloj = setInterval(tic, 250);
}

/** The layered score (D-295) of a finished game, with its own number of stages and clock. */
const puntaje = e => puntajePartida(e?.hechas || [], e?.seg || 0, { etapas: e?.etapas || ETAPAS.length, tiempo: (e?.tiempo || TIEMPO_S * 1000) / 1000 });

export function resultado(e) {
  const r = puntaje(e);
  return { s: r.total, t: tarjeta(e?.hechas || [], e?.etapas || ETAPAS.length), resumen: `${r.total}/100` };
}

/** How the score was reached (D-106): the three layers, then each stage and the restarts. */
export function desglose(e, { T, fmt, mmss: tiempo = mmss }) {
  const r = puntaje(e), hechas = e?.hechas || [], etapas = e?.etapas || ETAPAS.length;
  const lineas = [fmt(T.rrBdStages, { n: hechas.length, t: etapas, p: r.base }),
    r.completa ? fmt(T.rrBdSpeed, { t: tiempo((e.seg || 0) * 1000), p: r.ptsVelocidad }) : T.rrBdNoSpeed];
  if (hechas.length) lineas.push(fmt(T.rrBdTurns, { g: r.giros, m: r.minimos, p: r.ptsGiros }));
  lineas.push(...hechas.map((x, k) => fmt(T.rrBdStage, { c: x.giros <= x.minimo ? '🟩' : '🟨', n: k + 1, g: x.giros, m: x.minimo })));
  if (e?.reinicios) lineas.push(e.reinicios === 1 ? T.rrBdRestartOne : fmt(T.rrBdRestarts, { n: e.reinicios }));
  return lineas;
}

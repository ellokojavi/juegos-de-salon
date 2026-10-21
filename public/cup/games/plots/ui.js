/**
 * 📐 Loteo — the screen, in La Copa and on its own page `/plots/` (D-331; born in the lab, D-310).
 * Inspired by Shikaku (Nikoli, 1989): a grid with some numbers is split whole into rectangles, the
 * plots, each with exactly one number, which says how many squares it has. In the ⚡💧 Utilities
 * variant (D-311) the grid has ⚡ and 💧 instead: every plot is the same size and holds one of each.
 *
 * Drag from one corner to the other to draw a plot (with its live size, "2×3 = 6"); tapping a plot
 * erases it, tapping a 1 draws it. Five boards per variant against the clock (`ETAPAS`,
 * `ETAPAS_SERVICIOS`; the trial session, the two warm-up ones). Below the board, ↩️ Undo, 🧹 Clear
 * (with a second tap) and 🏳️ Give up (with a second tap) in one row, and 💡 Hint (−10) apart.
 *
 * The moves are saved as a list (`motor.jugada`) and the game is rebuilt from `p` and that list
 * (`motor.partida`), so a reloaded cup day goes on where it was. The clock is the cup's (`ctx.tiempo()`).
 */
import * as motor from './engine.js';
import TEXTOS from './texts.js';
import { botonDeshacer } from '../deshacer.js';
import { el as crear, vibrate as vibrar } from '../../../assets/js/ui.js';
import { getLang } from '../../../assets/js/i18n.js';

const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const espera = ms => new Promise(r => setTimeout(r, ms));
const SHIKAKU = 'https://en.wikipedia.org/wiki/Shikaku';
/** How long a two-tap button waits for its second tap (like Clear all in Tango and Queens). */
const CONFIRMAR_MS = 3000;
/** The texts of `portada` and `titulo`, which get no T: the page's language. */
const UI = () => { let l = 'es'; try { l = getLang(); } catch (_) { /* outside the browser */ } return (TEXTOS[l] || TEXTOS.es).ui; };

/** The plots' colors: light and cheerful, so a solved board ends up like a mosaic. */
const PALETA = ['#ff9fb8', '#ffd166', '#9be58f', '#8fd3ff', '#c3a6ff', '#ffb27a', '#7fe7d3', '#f59bff', '#d4ef7a', '#a8b8ff'];
/** Do they share an edge? (so two neighbouring plots never get the same color) */
const vecinos = (a, b) => {
  const filas = a.f1 <= b.f2 && b.f1 <= a.f2, cols = a.c1 <= b.c2 && b.c1 <= a.c2;
  return (filas && (a.c2 + 1 === b.c1 || b.c2 + 1 === a.c1)) || (cols && (a.f2 + 1 === b.f1 || b.f2 + 1 === a.f1));
};
/** A new plot's color: its number's (or its ⚡'s), unless a neighbour already has it. */
export function colorPara(t, parcelas, r) {
  const k = t.iconos ? (motor.casillas(r, t.lado).find(i => t.iconos[i] === 'luz') ?? 0)
    : t.pistas.findIndex(p => motor.contiene(r, Math.floor(p.i / t.lado), p.i % t.lado));
  const usados = new Set(parcelas.filter(p => vecinos(p, r)).map(p => p.color));
  for (let d = 0; d < PALETA.length; d++) { const c = PALETA[(Math.max(0, k) * 3 + d) % PALETA.length]; if (!usados.has(c)) return c; }
  return PALETA[0];
}
/** A list of plots with their colors, in order (the solution, the demo). */
const pintados = (t, rects) => rects.reduce((ps, r) => [...ps, { ...r, color: colorPara(t, ps, r) }], []);

/* ------------------------------------------------------------------ */
/* The board                                                           */
/* ------------------------------------------------------------------ */

const pos = (r, lado) => ({
  left: `${r.c1 * 100 / lado}%`, top: `${r.f1 * 100 / lado}%`,
  width: `${motor.ancho(r) * 100 / lado}%`, height: `${motor.alto(r) * 100 / lado}%`,
});

/**
 * The board: the squared background, the plots on top (each in its color) and the numbers (or ⚡ and
 * 💧) above everything. Interactive, dragging draws a rectangle and a tap without moving is `alTocar`.
 */
function crearTablero(el, t, { interactivo = false, clase = '', alDibujar, alTocar, alMedir } = {}) {
  const { lado } = t;
  const caja = el('div', { class: `lt-tablero ${clase}`, id: interactivo ? 'lt-tablero' : null, 'data-tablero': interactivo ? 'loteo' : null, style: `--lado:${lado}` });
  const celdas = t.iconos || t.numeros;
  const fondo = el('div', { class: 'lt-fondo' }, ...celdas.map(() => el('span', { class: 'lt-celda' })));
  const lotes = el('div', { class: 'lt-lotes' });
  const nums = el('div', { class: 'lt-nums' }, ...celdas.map((n, i) => (t.iconos
    ? el('span', { class: 'lt-num lt-icono', 'data-i': i, 'data-servicio': n || null }, n ? motor.ICONOS[n] : '')
    : el('span', { class: 'lt-num', 'data-i': i }, n ? String(n) : ''))));
  const marco = el('div', { class: 'lt-seleccion', 'aria-hidden': 'true' });
  caja.append(fondo, lotes, nums, marco);

  /** Draws the plots; `nuevo` (a rectangle) comes in with a jump. */
  const pintar = (parcelas, { nuevo = null } = {}) => {
    lotes.replaceChildren(...parcelas.map(p => {
      const n = el('div', { class: `lt-lote${p.ayuda ? ' ayudado' : ''}${nuevo && motor.iguales(p, nuevo) ? ' nace' : ''}`, style: `--c:${p.color}` });
      Object.assign(n.style, pos(p, lado));
      return n;
    }));
    const cubiertos = new Set();
    for (const p of parcelas) for (const k of motor.casillas(p, lado)) cubiertos.add(k);
    nums.querySelectorAll('.lt-num').forEach(n => n.classList.toggle('cubierto', cubiertos.has(+n.dataset.i)));
  };
  /** Shows a rectangle with the frame (or hides it, with null). */
  const marcar = r => {
    marco.classList.remove('mal');
    if (!r) { marco.classList.remove('ve'); return; }
    Object.assign(marco.style, pos(r, lado));
    marco.classList.add('ve');
  };
  /** The frame shakes in red and goes: the rectangle is not valid. */
  const rechazar = r => {
    Object.assign(marco.style, pos(r, lado));
    marco.classList.remove('mal'); void marco.offsetWidth;
    marco.classList.add('ve', 'mal');
    clearTimeout(marco._t);
    marco._t = setTimeout(() => marco.classList.remove('ve', 'mal'), QUIETO() ? 700 : 520);
  };

  if (interactivo) {
    let desde = null, hasta = null, movio = false, id = null;
    const lugarEn = ev => {
      const b = caja.getBoundingClientRect();
      const c = Math.min(lado - 1, Math.max(0, Math.floor((ev.clientX - b.left) / (b.width / lado))));
      const f = Math.min(lado - 1, Math.max(0, Math.floor((ev.clientY - b.top) / (b.height / lado))));
      return { f, c };
    };
    const rectDe = () => ({ f1: Math.min(desde.f, hasta.f), c1: Math.min(desde.c, hasta.c), f2: Math.max(desde.f, hasta.f), c2: Math.max(desde.c, hasta.c) });
    const bloqueado = () => caja.classList.contains('bloqueado');
    caja.addEventListener('pointerdown', ev => {
      if (bloqueado() || !ev.isPrimary) return;
      desde = hasta = lugarEn(ev); movio = false; id = ev.pointerId;
      try { caja.setPointerCapture(ev.pointerId); } catch { /* a simulated touch */ }
      clearTimeout(marco._t);
      marcar(rectDe());
    });
    caja.addEventListener('pointermove', ev => {
      if (!desde || ev.pointerId !== id) return;
      const l = lugarEn(ev);
      if (l.f !== hasta.f || l.c !== hasta.c) { hasta = l; movio = true; const r = rectDe(); marcar(r); alMedir?.(r); vibrar(5); }
    });
    const soltar = ev => {
      if (!desde || ev.pointerId !== id) return;
      const r = rectDe(), toque = !movio && desde.f === hasta.f && desde.c === hasta.c;
      desde = hasta = null;
      marcar(null);
      if (ev.type !== 'pointerup' || bloqueado()) { alMedir?.(null); return; }
      if (toque) alTocar?.(r.f1, r.c1); else alDibujar?.(r);
    };
    caja.addEventListener('pointerup', soltar);
    caja.addEventListener('pointercancel', soltar);
    caja.addEventListener('contextmenu', ev => ev.preventDefault());
    // The tests draw and tap without a finger: the same path as a drag or a tap
    caja.addEventListener('dibujar', ev => { if (!bloqueado()) alDibujar?.(ev.detail); });
    caja.addEventListener('tocar', ev => { if (!bloqueado()) alTocar?.(ev.detail.f, ev.detail.c); });
  }
  return { caja, pintar, marcar, rechazar };
}

/* ------------------------------------------------------------------ */
/* The waiting room                                                    */
/* ------------------------------------------------------------------ */

/** The name in the waiting room, with where the game comes from and its link (it was in the lab's cover). */
export function titulo({ el, J }) {
  const [antes, despues] = UI().ltCredit.split('{shikaku}');
  return el('div', { class: 'lt-titulo' },
    el('h2', { class: 'display display--lg' }, J.nombre),
    el('p', { class: 'lt-credito', id: 'lt-credito' }, antes,
      el('a', { href: SHIKAKU, target: '_blank', rel: 'noopener', id: 'link-shikaku' }, 'Shikaku'), despues));
}

/**
 * The top of the waiting room: a board that solves itself, plot by plot (a 5×5 of numbers, or a 4×4 of
 * utilities in plots of 4): the frame grows from one corner to the other, as when dragging, and the plot
 * takes its color. At the end, "Done!" big in the middle, and another board. Still with reduced motion.
 */
const DEMO_SERVICIOS = { lado: 4, tam: 4 };
const tableroDemo = (variante, ronda) => (variante === 'utilities'
  ? motor.generarServicios(`portada-demo-${ronda % 8}`, DEMO_SERVICIOS)
  : motor.generar(`portada-demo-${ronda % 8}`, { lado: 5 }));
export function portada({ variante = null } = {}) {
  const el = crear, T = UI();
  const caja = el('div', { class: 'lt-demo' });
  const rotulo = el('p', { class: 'lt-demo-rotulo' }, T.ltReady);
  const raiz = el('div', { class: 'lt-portada', 'aria-hidden': 'true' },
    // Both variants keep this row (hidden in Numbers), so switching does not move the title
    el('p', { class: variante === 'utilities' ? 'lt-tam lt-demo-tam' : 'lt-tam lt-demo-tam vacio' }, fmt(T.ltLotSize, { n: DEMO_SERVICIOS.tam })),
    el('div', { class: 'lt-demo-caja' }, caja, rotulo));
  if (QUIETO()) {
    const t = tableroDemo(variante, 0);
    const tab = crearTablero(el, t, { clase: 'chico resuelto' });
    tab.pintar(pintados(t, t.solucion));
    caja.replaceChildren(tab.caja);
    return raiz;
  }
  // It goes on while it is on screen: a new waiting room (another variant) brings its own
  const sigue = () => raiz.isConnected;
  (async () => {
    await espera(60);
    for (let ronda = 0; sigue(); ronda++) {
      const t = tableroDemo(variante, ronda);
      const tab = crearTablero(el, t, { clase: 'chico entra' });
      caja.replaceChildren(tab.caja);
      rotulo.classList.remove('ve');
      await espera(900);
      let ps = [];
      for (const r of t.solucion) {
        const pasos = Math.max(motor.alto(r), motor.ancho(r));
        for (let k = 0; k < pasos; k++) {
          if (!sigue()) return;
          tab.marcar({ f1: r.f1, c1: r.c1, f2: r.f1 + Math.min(k, motor.alto(r) - 1), c2: r.c1 + Math.min(k, motor.ancho(r) - 1) });
          await espera(150);
        }
        await espera(160);
        if (!sigue()) return;
        tab.marcar(null);
        ps = [...ps, { ...r, color: colorPara(t, ps, r) }];
        tab.pintar(ps, { nuevo: r });
        await espera(380);
      }
      if (!sigue()) return;
      tab.caja.classList.add('resuelto');
      await espera(500);
      rotulo.classList.add('ve');
      await espera(2200);
    }
  })();
  return raiz;
}

/**
 * The drawing in "How to play": a right board and a wrong plot, of the variant. Hand-made, so they
 * never change. Numbers: a 4×4 split into a 4, a 6, a 2 and a 4; wrong, a plot with two numbers.
 * Utilities: a 4×4 in plots of 4, each with its ⚡ and 💧; wrong, a plot with two ⚡.
 */
const EJ_NUMEROS = {
  t: { lado: 4, numeros: [0, 4, 0, 0, 0, 0, 0, 6, 2, 0, 0, 0, 0, 0, 4, 0] },
  sol: [{ f1: 0, c1: 0, f2: 0, c2: 3 }, { f1: 1, c1: 1, f2: 2, c2: 3 }, { f1: 1, c1: 0, f2: 2, c2: 0 }, { f1: 3, c1: 0, f2: 3, c2: 3 }],
  mal: { t: { lado: 2, numeros: [2, 0, 0, 2] }, r: { f1: 0, c1: 0, f2: 1, c2: 1 } },
};
const EJ_SERVICIOS = {
  t: { lado: 4, iconos: ['luz', null, 'agua', null, null, 'agua', 'luz', null, null, 'luz', null, 'agua', 'agua', null, null, 'luz'] },
  sol: [{ f1: 0, c1: 0, f2: 1, c2: 1 }, { f1: 0, c1: 2, f2: 1, c2: 3 }, { f1: 2, c1: 0, f2: 3, c2: 1 }, { f1: 2, c1: 2, f2: 3, c2: 3 }],
  mal: { t: { lado: 2, iconos: ['luz', null, 'agua', 'luz'] }, r: { f1: 0, c1: 0, f2: 1, c2: 1 } },
};
const conPistas = t => (t.numeros ? { ...t, pistas: t.numeros.map((n, i) => ({ i, n })).filter(x => x.n) } : t);
export function ejemplo({ el, T, variante = null }) {
  const ut = variante === 'utilities', ej = ut ? EJ_SERVICIOS : EJ_NUMEROS;
  const t = conPistas(ej.t), bien = crearTablero(el, t, { clase: 'ej resuelto' });
  bien.pintar(pintados(t, ej.sol));
  const mt = conPistas(ej.mal.t), mal = crearTablero(el, mt, { clase: 'ej ej-mal' });
  mal.pintar([{ ...ej.mal.r, color: 'rgba(255, 77, 94, 0.55)' }]);
  return el('div', { class: 'rej-ejemplo lt-ejemplo', 'aria-hidden': 'true' },
    el('figure', {}, bien.caja, el('figcaption', {}, `✅ ${ut ? T.ltExOkUt : T.ltExOk}`)),
    el('figure', {}, mal.caja, el('figcaption', {}, `❌ ${ut ? T.ltExBadUt : T.ltExBad}`)));
}

/** Building the hard Utilities boards takes about half a second: the waiting room builds them ahead. */
export const caro = true;
/** Speed scores and there is no countdown: the play head shows the elapsed time (D-384). */
export const clock = true;

/* ------------------------------------------------------------------ */
/* The game                                                            */
/* ------------------------------------------------------------------ */

export function montar(raiz, ctx) {
  const { p, T, el, SFX, vibrate } = ctx;
  const { tableros } = p, total = tableros.length;
  const ut = p.variante === 'utilities';
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.filter(j => typeof j === 'string') : [];
  const rehacer = () => motor.partida(p, jugadas, { color: colorPara });
  let e = rehacer();
  /** The game's state for the hook and the end: rebuilt after every move. */
  const P = { p, variante: p.variante };
  const exponer = () => Object.assign(P, { etapa: e.k, t: e.t, parcelas: e.parcelas, historial: e.historial, hechas: e.hechas, ayudas: e.ayudas, terminado: e.fin, rendido: e.rendido });
  // The time it ended, kept: on a reload of a finished day the clock already stopped there
  let msFin = null;
  const final = () => ({ hechas: e.hechas, ayudas: e.ayudas, rendido: e.rendido, total, variante: p.variante, etapas: tableros.map(t => ({ lado: t.lado })), ms: msFin ?? ctx.tiempo?.() ?? 0 });

  raiz.innerHTML = '';
  const caja = el('div', { class: 'stack lt-juego' });
  raiz.append(caja);
  let vista = null;   // the current board's pieces

  /** Two-tap buttons: one armed at a time, and it goes back after 3 seconds (like Clear all). */
  const armables = [];
  const dosToques = (boton, { listo, seguro, accion }) => {
    let armado = false, timer = null;
    const desarmar = () => { armado = false; clearTimeout(timer); boton.classList.remove('armado'); boton.textContent = listo(); };
    armables.push(desarmar);
    boton.textContent = listo();
    boton.addEventListener('click', () => {
      if (e.fin || vista?.bloqueado) return;
      if (!armado) {
        armables.forEach(d => d !== desarmar && d());
        armado = true; SFX.tap(); vibrate(15); boton.textContent = seguro(); boton.classList.add('armado');
        timer = setTimeout(desarmar, CONFIRMAR_MS);
        return;
      }
      desarmar();
      accion();
    });
    return desarmar;
  };
  const desarmarTodo = () => armables.forEach(d => d());

  /** The dots of the boards: solved (green), the current one and the coming ones. */
  const progreso = (hechas, actual) => el('div', { class: 'lt-etapas', 'aria-hidden': 'true' }, ...tableros.map((_, k) =>
    el('span', { class: `lt-punto${k < hechas ? ' hecha' : k === actual ? ' actual' : ''}` })));

  /** Saves a move and rebuilds the game from the list; returns how it was before. */
  const anotar = j => {
    const antes = e;
    jugadas.push(j); ctx.guardar(jugadas.slice());
    e = rehacer(); exponer();
    return antes;
  };

  /** A board on screen: its header, the notice, the board and the controls. */
  function armarEtapa() {
    armables.length = 0;
    const t = e.t, k = e.k;
    const aviso = el('p', { class: 'lt-aviso', id: 'lt-aviso', 'aria-live': 'polite' }, '');
    const decir = (texto, clase = '') => { aviso.className = `lt-aviso ${clase}`; aviso.textContent = texto; };
    const cabeza = el('div', { class: 'lt-cabeza', id: 'lt-etapa' },
      el('p', { class: 'lt-n-etapa' }, fmt(T.ltBoard, { n: k + 1, t: total })), progreso(e.hechas, k),
      t.tam ? el('p', { class: 'lt-tam', id: 'lt-tam' }, fmt(T.ltLotSize, { n: t.tam })) : null);
    const motivo = (v, r) => {
      if (t.iconos) {
        if (v.motivo === 'tam') return fmt(v.area === 1 ? T.ltUtSizeOne : T.ltUtSize, { a: v.area, n: v.tam });
        if (v.motivo === 'falta') return fmt(T.ltUtMissing, { s: motor.ICONOS[v.servicio] });
        return fmt(T.ltUtExtra, { k: v.cuantos, s: motor.ICONOS[v.servicio] });
      }
      if (v.motivo === 'sin-numero') return T.ltNoNumber;
      if (v.motivo === 'dos-numeros') return fmt(T.ltTwoNumbers, { k: v.cuantos });
      return fmt(v.n === 1 ? T.ltAreaOne : T.ltArea, { n: v.n, a: motor.area(r) });
    };
    const dibujar = r => {
      if (e.fin || vista.bloqueado) return;
      desarmarTodo();
      const v = motor.validar(t, r);
      if (!v.ok) {
        SFX.error(); vibrate([40, 30, 40]);
        tab.rechazar(r);
        decir(motivo(v, r), 'mal');
        return;
      }
      SFX.flip(); vibrate(15);
      decir('');
      despues(anotar(motor.jugada.dibujar(r)), r);
    };
    const tab = crearTablero(el, t, {
      interactivo: true,
      alMedir: r => decir(r ? fmt(T.ltSize, { w: motor.ancho(r), h: motor.alto(r), a: motor.area(r) }) : '', 'medida'),
      alDibujar: dibujar,
      alTocar: (f, c) => {
        if (e.fin || vista.bloqueado) return;
        desarmarTodo();
        if (e.parcelas.some(q => motor.contiene(q, f, c))) {
          SFX.tap(); vibrate(10);
          decir(T.ltErased);
          despues(anotar(motor.jugada.borrar(f, c)));
          return;
        }
        // A 1 is drawn with a tap: it is its own plot
        if (t.numeros?.[f * t.lado + c] === 1) { dibujar({ f1: f, c1: c, f2: f, c2: c }); return; }
        decir(T.ltDrag, 'ojo');
      },
    });

    const deshacer = () => botonDeshacer({ el, T, SFX, vibrate, puede: e.historial.length > 0 && !e.fin, alDeshacer: () => {
      if (e.fin || vista.bloqueado || !e.historial.length) return;
      desarmarTodo();
      anotar(motor.jugada.DESHACER);
      decir(T.ltUndone);
      pintar();
    } });
    const botonBorrar = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-borrar' });
    const botonRendirse = el('button', { type: 'button', class: 'btn btn--ghost btn--sm lt-rendirse', id: 'btn-rendirse' });
    const botonAyuda = el('button', { type: 'button', class: 'btn btn--ghost btn--sm lt-ayuda', id: 'btn-ayuda' });
    dosToques(botonAyuda, {
      listo: () => fmt(T.ltHelp, { pts: motor.RESTA_AYUDA }), seguro: () => fmt(T.ltHelpSure, { pts: motor.RESTA_AYUDA }),
      accion: () => {
        const r = motor.pista(t, e.parcelas);
        if (!r) return;
        SFX.reveal(); vibrate(10);
        decir(T.ltHelpSays, 'ayuda');
        despues(anotar(motor.jugada.AYUDA), r);
      },
    });
    dosToques(botonBorrar, { listo: () => `🧹 ${T.clearAll}`, seguro: () => `🧹 ${T.ltSure}`, accion: () => {
      if (!e.parcelas.length) return;
      SFX.splash(); vibrate([10, 20, 10]);
      anotar(motor.jugada.LIMPIAR);
      decir(T.ltCleared);
      pintar();
    } });
    dosToques(botonRendirse, { listo: () => `🏳️ ${T.giveUp}`, seguro: () => `🏳️ ${T.ltSure}`, accion: () => {
      SFX.error(); vibrate([40, 40, 40]);
      anotar(motor.jugada.RENDIRSE);
      terminar();
    } });
    const acciones = el('div', { class: 'lt-acciones' }, deshacer(), botonBorrar, botonRendirse);
    const pintar = (nuevo = null) => {
      tab.pintar(e.parcelas, { nuevo });
      acciones.firstChild.replaceWith(deshacer());
      botonBorrar.disabled = !e.parcelas.length;
    };
    caja.replaceChildren(cabeza, aviso, tab.caja, acciones, botonAyuda);
    vista = { t, tab, decir, pintar, cabeza, aviso, acciones, botonAyuda, bloqueado: false };
    // The first hard board of Utilities says how to think them (the owner's request)
    if (ut && t.dificil && !tableros[k - 1]?.dificil) decir(T.ltHardNotice, 'ojo');
    pintar();
  }

  /** After a move: the board is solved (it shines and the next one comes, or the end), or it is repainted. */
  function despues(antes, nuevo = null) {
    if (e.hechas > antes.hechas) {
      // The board that was just solved, as it was solved: the state already moved on to the next one
      vista.bloqueado = true;
      desarmarTodo();
      vista.tab.pintar(e.ultima, { nuevo });
      vista.tab.caja.classList.add('bloqueado', 'resuelto');
      [...vista.acciones.querySelectorAll('button'), vista.botonAyuda].forEach(b => { b.disabled = true; });
      vista.decir(fmt(T.ltBoardDone, { n: antes.k + 1 }), 'bien');
      vista.cabeza.querySelector('.lt-etapas').replaceWith(progreso(e.hechas, e.fin ? -1 : antes.k));
      SFX.reveal(); vibrate([20, 30, 40]);
      if (e.fin) { terminar({ yaPintado: true }); return; }
      setTimeout(() => { if (raiz.isConnected) armarEtapa(); }, QUIETO() ? 900 : 1700);
      return;
    }
    vista.pintar(nuevo);
  }

  /**
   * The end, solved or given up: the clock stops right here (D-130), the last board stays (the
   * player's, or how it was solved after giving up), and "See result" goes on.
   */
  function terminar({ yaPintado = false } = {}) {
    if (msFin === null) msFin = ctx.tiempo?.() ?? 0;
    exponer();
    const estado = final();
    ctx.pararReloj?.(estado);
    if (!vista || !yaPintado) {
      // A reload of a finished game, or giving up: the board drawn again, locked
      armarEtapa();
      vista.bloqueado = true;
      vista.tab.caja.classList.add('bloqueado');
      if (e.rendido) vista.tab.pintar(pintados(e.t, e.t.solucion));
      else { vista.tab.pintar(e.parcelas); vista.tab.caja.classList.add('resuelto'); }
      vista.cabeza.querySelector('.lt-etapas').replaceWith(progreso(e.hechas, -1));
    }
    desarmarTodo();
    vista.acciones.remove(); vista.botonAyuda.remove();
    vista.aviso.remove();
    const cierre = el('div', { class: 'stack lt-cierre', id: 'lt-cierre' },
      el('p', { class: `lt-sello${e.rendido ? ' mal' : ''}`, id: 'lt-sello' }, e.rendido ? T.ltGaveUp : T.ltAllDone),
      e.rendido ? el('p', { class: 'muted center', id: 'lt-asi-se', style: 'margin:0' }, fmt(T.ltSolvedWas, { n: e.k + 1 })) : null,
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(final()); } }, ctx.textoFin || T.seeResults));
    // The end goes above the board: "See result" in sight without scrolling (C-8)
    vista.cabeza.after(cierre);
  }

  exponer();
  globalThis.__loteo = {
    P,
    // For the tests: draw a rectangle or tap a square, as with the finger
    dibujar: r => document.getElementById('lt-tablero')?.dispatchEvent(new CustomEvent('dibujar', { detail: r })),
    tocar: (f, c) => document.getElementById('lt-tablero')?.dispatchEvent(new CustomEvent('tocar', { detail: { f, c } })),
  };
  if (e.fin) terminar();
  else armarEtapa();
}

/** The score (D-113, out of 100), the card to share and the summary. */
export function resultado(estado) {
  const r = motor.puntajePartida(estado.hechas, (estado.ms || 0) / 1000, estado.ayudas, estado.total);
  return { s: r.total, t: motor.tarjeta(estado.hechas, estado.ayudas, estado.etapas), resumen: `${r.total}/100`, ms: estado.ms };
}

/** How the score was reached (D-106), line by line. */
export function desglose(estado, { T, fmt: f = fmt, mmss }) {
  const r = motor.puntajePartida(estado.hechas, (estado.ms || 0) / 1000, estado.ayudas, estado.total);
  const lineas = [f(T.ltBdBoards, { n: estado.hechas, t: estado.total, p: r.base }),
    r.completa ? f(T.ltBdSpeed, { t: mmss(estado.ms || 0), p: r.ptsRapidez }) : T.ltBdNoSpeed];
  if (estado.ayudas) lineas.push(f(estado.ayudas === 1 ? T.ltBdHelpOne : T.ltBdHelps, { n: estado.ayudas, pts: r.resta }));
  return lineas;
}

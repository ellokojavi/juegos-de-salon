/**
 * 🎲 Dominorama (id `dominorama`) — its screen in La Copa, Uno al día and on its standalone page /dominorama/,
 * moved from the lab (labs/dominorama/game.js) as Sudoku was (D-517's way). Inspired by Pips (The New York
 * Times Games, 2025), credited under the name. Three boards, easy to hard: lay every domino so each colored
 * zone keeps its rule. Dominoes are dragged (or chosen with a tap that turns them, then a tap on a cell),
 * a placed one comes off with a tap; ↩️ Undo, 🧹 Clear (twice), 💡 Help (−10, twice) and 🏳️ Give up (twice).
 *
 * What the cup page provides stays out: the countdown, the clock (`clock`), the ranking, sharing and the
 * usage signal. The state (which board, what is laid, the helps) is saved after every move with
 * `ctx.guardar`, so a reloaded day resumes where it was; a finished game shows finished. The score is the
 * lab's, 0 to 100 already: 20 a board, up to 40 for speed with all three, −10 a help.
 */
import * as E from './engine.js';
import TEXTOS from './texts.js';
import { loadCss } from '../../../assets/js/load-css.js';
import { flag, flagGuess } from '../../../assets/js/flags.js';

// Its own stylesheet, loaded with its code and before its first screen (D-468)
await loadCss(new URL('./style.css', import.meta.url));

const NYT_PIPS = 'https://www.nytimes.com/games/pips';
const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmtLocal = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const espera = ms => new Promise(r => setTimeout(r, ms));
const UI = () => (TEXTOS[(globalThis.document?.documentElement.lang || 'es').slice(0, 2)] || TEXTOS.es).ui;
/** `cover` gets neither `el` nor `T`: a small `el` of its own. */
function h(tag, attrs = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (k === 'class') n.className = v; else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  for (const x of hijos.flat()) if (x !== null && x !== undefined && x !== false) n.append(x instanceof Node ? x : String(x));
  return n;
}

// Bigger rules (lab: #seccion-dominorama-corner-labels): the zone's corner filled with its color and the rule
// inside, big, instead of the small diamond; some players found the diamonds too small (the owner, 2026-11-24)
let esquinas = false;
const ponerEsquinas = on => { esquinas = !!on; globalThis.document?.querySelectorAll('.dm-board').forEach(g => g.classList.toggle('dm-esquinas', esquinas)); };
if (globalThis.document) { esquinas = !!flagGuess('dominorama-corner-labels'); flag('dominorama-corner-labels').then(ponerEsquinas).catch(() => {}); }
/** The zones' palette; a zone with no rule is plain. */
// The zones' colors stay away from red, so a broken rule's red stands out (the owner, 2026-11-22)
const COLORES = ['#2ee6d6', '#ffd23f', '#b98bff', '#9dff3a', '#4fa3ff', '#ff8c42', '#c8d3e6'];
/** A color in Oklab, where distance is how different two colors look. */
function oklab(hex) {
  const [r, g, b] = [1, 3, 5].map(k => { const v = parseInt(hex.slice(k, k + 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const [l, m, s] = [0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b, 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b, 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b].map(Math.cbrt);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675778 * s];
}
const LAB = COLORES.map(oklab);
const lejos = (a, b) => Math.hypot(...LAB[a].map((v, k) => v - LAB[b][k]));
/**
 * One color per zone, so zones that touch (side or corner) look as different as the palette allows:
 * each zone takes the color farthest from its colored neighbours, then the least used (the owner, 2026-11-24).
 */
export function coloresDeZonas(t) {
  const zonaDe = []; t.zonas.forEach((z, k) => z.celdas.forEach(i => { zonaDe[i] = k; }));
  const vecinas = t.zonas.map(() => new Set());
  t.celdas.forEach((a, i) => t.celdas.forEach((b, j) => {
    if (zonaDe[i] !== zonaDe[j] && Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1) vecinas[zonaDe[i]].add(zonaDe[j]);
  }));
  const idx = t.zonas.map(() => null), uso = COLORES.map(() => 0);
  t.zonas.forEach((z, k) => {
    if (z.tipo === 'libre') return;
    const usadas = [...vecinas[k]].map(v => idx[v]).filter(x => x !== null);
    let mejor = 0, nota = -Infinity;
    COLORES.forEach((_, c) => {
      const d = usadas.length ? Math.min(...usadas.map(u => lejos(c, u))) : 1;
      const n = d * 100 - uso[c];
      if (n > nota) { nota = n; mejor = c; }
    });
    idx[k] = mejor; uso[mejor]++;
  });
  return idx.map(c => (c === null ? null : COLORES[c]));
}

/* ------------------------------------------------------------------ */
/* Drawing dominoes and boards                                         */
/* ------------------------------------------------------------------ */

/** Where the dots go on a 3×3 half, for 0 to 6 pips. */
const PUNTOS = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const mitad = v => h('span', { class: 'dm-mitad', 'aria-hidden': 'true' }, ...Array.from({ length: 9 }, (_, k) => h('i', { class: PUNTOS[v].includes(k) ? 'pt' : '' })));
/** A domino: its two halves, side by side or one over the other. A `type` makes it a button. */
function ficha([x, y], { vertical = false, ...attrs } = {}) {
  const n = h(attrs.type ? 'button' : 'span', { ...attrs, class: `dm-ficha${vertical ? ' vertical' : ''} ${attrs.class || ''}`.trim(), 'aria-label': attrs['aria-label'] || fmtLocal(UI().dmFicha, { x, y }) }, mitad(x), mitad(y));
  return n;
}

/** The board: its cells (colored by zone, with the zone's edges) and the diamonds of the rules. */
function tableroVacio(t, { chico = false } = {}) {
  const U = UI();
  const zonaDe = Array(t.celdas.length);
  t.zonas.forEach((z, k) => z.celdas.forEach(i => { zonaDe[i] = k; }));
  const en = (r, c) => t.celdas.findIndex(x => x.r === r && x.c === c);
  const g = h('div', { class: `dm-board${chico ? ' chico' : ''}${esquinas ? ' dm-esquinas' : ''}`, style: `--w:${t.ancho};--h:${t.alto}`, 'data-tablero': 'dominorama' });
  const colorDe = coloresDeZonas(t);
  t.celdas.forEach((c, i) => {
    const z = zonaDe[i];
    const borde = [[-1, 0, 'bt'], [0, 1, 'br'], [1, 0, 'bb'], [0, -1, 'bl']].filter(([dr, dc]) => { const j = en(c.r + dr, c.c + dc); return j < 0 || zonaDe[j] !== z; }).map(x => x[2]);
    g.append(h('button', {
      type: 'button', class: `dm-celda ${borde.join(' ')}${colorDe[z] ? '' : ' libre'}`, 'data-i': i, 'data-zona': z, tabindex: chico ? -1 : null,
      style: `grid-row:${c.r + 1};grid-column:${c.c + 1};${colorDe[z] ? `--z:${colorDe[z]}` : ''}`, 'aria-label': fmtLocal(U.dmCasilla, { r: c.r + 1, c: c.c + 1 }),
    }));
  });
  // The diamond sits inside the zone's last cell, bottom right (D-385)
  t.zonas.forEach((z, k) => {
    const txt = E.etiqueta(z); if (!txt) return;
    const i = Math.max(...z.celdas), c = t.celdas[i];
    g.append(h('span', { class: 'dm-regla', 'data-zona': k, style: `grid-row:${c.r + 1};grid-column:${c.c + 1};--z:${colorDe[k]}` }, h('span', {}, txt)));
  });
  return g;
}

/** The dominoes placed on a board, over its cells, and each full zone kept or broken. */
function fichasPuestas(g, p, { conBotones = false } = {}) {
  const U = UI();
  g.querySelectorAll('.dm-puesta').forEach(x => x.remove());
  p.puestas.forEach((s, f) => {
    if (!s) return;
    const a = p.t.celdas[s.a], b = p.t.celdas[s.b];
    const vertical = a.c === b.c;
    const [c0, v0, v1] = (vertical ? a.r < b.r : a.c < b.c) ? [a, p.t.fichas[f][0], p.t.fichas[f][1]] : [b, p.t.fichas[f][1], p.t.fichas[f][0]];
    g.append(ficha([v0, v1], {
      vertical, ...(conBotones ? { type: 'button' } : {}), class: 'dm-puesta', 'data-f': f,
      style: `grid-row:${c0.r + 1} / span ${vertical ? 2 : 1};grid-column:${c0.c + 1} / span ${vertical ? 1 : 2}`,
      'aria-label': fmtLocal(U.dmFichaPuesta, { x: v0, y: v1 }),
    }));
  });
  const est = E.estadoZonas(p);
  // A full zone that breaks its rule is marked over the dominoes (they hide its cells): stripes and its edge, in its color
  g.querySelectorAll('.dm-mala').forEach(x => x.remove());
  const zonaDe = []; p.t.zonas.forEach((z, k) => z.celdas.forEach(i => { zonaDe[i] = k; }));
  const en = (r, c) => p.t.celdas.findIndex(x => x.r === r && x.c === c);
  p.t.zonas.forEach((z, k) => {
    if (est[k] !== false) return;
    z.celdas.forEach(i => {
      const c = p.t.celdas[i];
      const borde = [[-1, 0, 'bt'], [0, 1, 'br'], [1, 0, 'bb'], [0, -1, 'bl']].filter(([dr, dc]) => { const j = en(c.r + dr, c.c + dc); return j < 0 || zonaDe[j] !== k; }).map(x => x[2]);
      const z = g.querySelector(`.dm-celda[data-i="${i}"]`)?.style.getPropertyValue('--z');
      g.append(h('span', { class: `dm-mala ${borde.join(' ')}`, 'aria-hidden': 'true', style: `grid-row:${c.r + 1};grid-column:${c.c + 1};${z ? `--z:${z}` : ''}` }));
    });
  });
  g.querySelectorAll('.dm-regla').forEach(r => { const e = est[+r.dataset.zona]; r.classList.toggle('ok', e === true); r.classList.toggle('mal', e === false); });
}

/* ------------------------------------------------------------------ */
/* Waiting room                                                        */
/* ------------------------------------------------------------------ */

/** The cover's demo (the lab's): an easy board that solves itself, a domino at a time, then another. */
let demoVez = 0;
export function cover() {
  const caja = h('div', { class: 'dm-demo', 'aria-hidden': 'true' });
  const raiz = h('figure', { class: 'dm-portada', 'aria-hidden': 'true' }, caja);
  const vez = ++demoVez;
  let visto = false;
  const desde = Date.now();
  const sigue = () => { if (caja.isConnected) visto = true; return vez === demoVez && (caja.isConnected || (!visto && Date.now() - desde < 5000)); };
  (async () => {
    for (let ronda = 0; sigue(); ronda++) {
      const t = E.generar(`portada-demo-${ronda % 6}`, 'facil'), p = E.nuevaPartida(t);
      const g = tableroVacio(t, { chico: true });
      caja.replaceChildren(g);
      if (QUIETO()) { for (const s of t.solucion) E.poner(p, s.f, s); fichasPuestas(g, p); return; }
      await espera(700);
      for (const s of t.solucion) {
        if (!sigue()) return;
        E.poner(p, s.f, s); fichasPuestas(g, p);
        g.querySelector(`.dm-puesta[data-f="${s.f}"]`)?.classList.add('cae');
        await espera(650);
      }
      if (!sigue()) return;
      g.classList.add('resuelto');
      await espera(2000);
    }
  })();
  return raiz;
}

/** The name in the waiting room, with the ivory domino that sways, its line and the credit to NYT's Pips. */
export function title({ el, J }) {
  const U = UI();
  const [antes, despues] = String(U.dmCredit).split('{juego}');
  return el('div', { class: 'dm-cabeza' },
    el('h2', { class: 'dm-titulo' }, ficha([6, 3], { class: 'dm-logo', 'aria-hidden': 'true' }), el('span', { class: 'display display--lg rainbow' }, J.nombre)),
    el('p', { class: 'dm-lema' }, U.dmLema),
    el('p', { class: 'dm-credito', id: 'dm-credito' }, antes, el('a', { href: NYT_PIPS, target: '_blank', rel: 'noopener', id: 'link-nyt' }, 'Pips'), despues || ''));
}

/* ------------------------------------------------------------------ */
/* The game                                                            */
/* ------------------------------------------------------------------ */

/** The play head shows the elapsed time (D-384): speed is part of the score. Building three boards takes a moment. */
export const clock = true;
export const caro = true;

/** Ends the board's drag: its ghost and its window listeners (set by each board). */
let finArrastre = () => {};

export function mount(raiz, ctx) {
  const { p: dia, T, el, SFX, vibrate = () => {} } = ctx;
  const fmt = ctx.fmt || fmtLocal;
  const boards = dia.boards;
  const previa = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) && Number.isInteger(ctx.jugadas.k) ? ctx.jugadas : null;
  const S = previa ? { ...previa } : { k: 0, resueltos: 0, ayudas: 0, puestas: null, fin: null, ms: 0 };
  S.total = boards.length;
  const estado = () => ({ k: S.k, resueltos: S.resueltos, ayudas: S.ayudas, puestas: S.puestas, fin: S.fin, ms: S.ms, total: S.total, rendido: S.fin === 'rendido' });
  const guardar = () => ctx.guardar?.(estado());
  const caja = el('div', { class: 'stack dm-juego' });
  raiz.append(caja);
  let partida = null;
  let repasar = () => {};

  function tablero() {
    finArrastre();
    const nivel = boards[S.k].nivel;
    const t = boards[S.k];
    const p = partida = E.nuevaPartida(t);
    if (S.puestas && S.puestas.length === t.fichas.length) p.puestas = S.puestas.map(x => (x ? { ...x } : null));
    let sel = null;
    const giro = t.fichas.map(() => 0);
    const historial = [];
    const recordar = () => { historial.push(p.puestas.map(x => (x ? { ...x } : null))); };
    const anotar = () => { S.puestas = p.puestas.map(x => (x ? { ...x } : null)); guardar(); };
    let cortar = () => {};
    const encabezado = el('p', { class: 'dm-marcador', id: 'dm-marcador' }, fmt(T.dmTablero, { n: S.k + 1, total: boards.length, nivel: T.dmNivel[nivel] }));
    const g = tableroVacio(t);
    g.id = 'dm-tablero';
    const bandeja = el('div', { class: 'dm-bandeja', id: 'dm-bandeja', role: 'group', 'aria-label': T.dmFichas });
    const aviso = el('p', { class: 'dm-aviso', id: 'dm-aviso', 'aria-live': 'polite' }, T.dmElegir);
    const decir = (texto, clase = '') => { aviso.className = `dm-aviso ${clase}`; aviso.textContent = texto; };

    const dosToques = (boton, { listo, seguro, accion }) => {
      let armado = false, timer = null;
      const desarmar = () => { armado = false; clearTimeout(timer); boton.classList.remove('armado'); boton.textContent = listo(); };
      boton.addEventListener('click', () => {
        if (S.fin) return;
        if (!armado) { armado = true; SFX.tap(); vibrate(15); boton.textContent = seguro(); boton.classList.add('armado'); timer = setTimeout(desarmar, 3000); return; }
        desarmar(); accion();
      });
      boton.textContent = listo();
    };
    const botonAyuda = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-ayuda' });
    const botonRendirse = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-rendirse' });
    const botonDeshacer = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-deshacer' }, T.dmDeshacer);
    const botonLimpiar = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-limpiar' });
    botonDeshacer.addEventListener('click', () => {
      if (S.fin || !historial.length) return;
      p.puestas = historial.pop(); sel = null;
      SFX.flip?.(); vibrate(6); dibujar(); decir(T.dmElegir); anotar();
    });
    dosToques(botonLimpiar, { listo: () => T.dmLimpiar, seguro: () => T.dmLimpiarSeguro, accion: () => {
      if (!p.puestas.some(Boolean)) return;
      recordar(); p.puestas = p.puestas.map(() => null); sel = null;
      SFX.flip?.(); vibrate(10); dibujar(); decir(T.dmElegir); anotar();
    } });
    dosToques(botonAyuda, { listo: () => fmt(T.dmAyuda, { pts: E.RESTA_AYUDA }), seguro: () => fmt(T.dmAyudaSeguro, { pts: E.RESTA_AYUDA }), accion: () => {
      recordar(); const f = E.ayudar(p); if (f < 0) { historial.pop(); return; }
      S.ayudas++; sel = null; SFX.flip?.(); vibrate(10);
      dibujar(); g.querySelector(`.dm-puesta[data-f="${f}"]`)?.classList.add('pista');
      decir(T.dmAyudaDice, 'ayuda'); anotar(); revisar();
    } });
    dosToques(botonRendirse, { listo: () => T.dmRendirse, seguro: () => T.dmRendirseSeguro, accion: () => terminar('rendido') });

    /** A laid domino settles with a squash and leaves a ring on the cells it took. */
    const aterriza = f => {
      const x = g.querySelector(`.dm-puesta[data-f="${f}"]`); if (!x) return;
      x.classList.add('cae');
      if (QUIETO()) return;
      const sitio = p.puestas[f]; if (!sitio) return;
      for (const i of [sitio.a, sitio.b]) {
        const c = t.celdas[i];
        const onda = h('span', { class: 'dm-onda', 'aria-hidden': 'true', style: `grid-row:${c.r + 1};grid-column:${c.c + 1}` });
        g.append(onda); setTimeout(() => onda.remove(), 500);
      }
    };
    const dibujar = () => {
      cortar();
      botonDeshacer.disabled = !historial.length;
      botonLimpiar.disabled = !p.puestas.some(Boolean);
      fichasPuestas(g, p, { conBotones: true });
      bandeja.replaceChildren(...t.fichas.map((fx, f) => el('span', { class: 'dm-hueco' }, p.puestas[f] ? null : ficha(giro[f] >= 2 ? [fx[1], fx[0]] : fx, {
        type: 'button', vertical: giro[f] % 2 === 1, class: sel === f ? 'sel' : '', 'data-f': f, 'data-giro': giro[f],
        'aria-label': fmt(T.dmFichaBandeja, { x: fx[0], y: fx[1] }), 'aria-pressed': sel === f ? 'true' : 'false',
      }))));
    };
    const revisar = () => {
      if (E.resuelto(p)) return listo();
      if (p.puestas.every(Boolean)) decir(T.dmRota, 'mal');
    };

    let focoTimer = null;
    const enfocar = (k, ms = 0) => {
      clearTimeout(focoTimer);
      g.classList.toggle('foco', k !== null);
      g.querySelectorAll('.dm-celda, .dm-regla').forEach(x => x.classList.toggle('encendida', k !== null && +x.dataset.zona === k));
      if (ms) focoTimer = setTimeout(() => enfocar(null), ms);
    };

    // Drag and drop (D-385): the domino follows the finger, lifted a little; the half grabbed lands on the cell under it
    let arr = null, tragar = false;
    const LEVANTE = 36, UMBRAL = 8, MANTENER = 250;
    const giroDe = s => { const a = t.celdas[s.a], b = t.celdas[s.b], v = a.c === b.c; return ((v ? a.r < b.r : a.c < b.c) ? 0 : 2) + (v ? 1 : 0); };
    const celdaEn = (x, y) => [...g.querySelectorAll('.dm-celda')].find(c => { const r = c.getBoundingClientRect(); return x >= r.left && x < r.right && y >= r.top && y < r.bottom; });
    const en = (r, c) => t.celdas.findIndex(x => x.r === r && x.c === c);
    const destino = (i, f, m) => {
      if (m === 0) return E.lugar(t, i, giro[f]);
      const c = t.celdas[i], j = giro[f] % 2 ? en(c.r - 1, c.c) : en(c.r, c.c - 1);
      return j < 0 ? null : E.lugar(t, j, giro[f]);
    };
    const marcar = sitio => {
      g.querySelectorAll('.destino').forEach(x => x.classList.remove('destino', 'no'));
      if (!sitio) return;
      const o = E.ocupacion(p), mal = [sitio.a, sitio.b].some(i => o[i] >= 0 && o[i] !== arr.f);
      [sitio.a, sitio.b].forEach(i => g.querySelector(`.dm-celda[data-i="${i}"]`).classList.add('destino', ...(mal ? ['no'] : [])));
    };
    const cancelar = () => {
      if (!arr) return;
      const a = arr; arr = null;
      clearTimeout(a.timer);
      a.fantasma?.remove(); a.boton.classList.remove('arrastrada');
      marcar(null); enfocar(null);
    };
    cortar = cancelar;
    const agarrar = (ev, boton, f, puesta) => {
      if (S.fin || ev.button > 0) return;
      if (arr) { if (ev.pointerId !== arr.id) return; cancelar(); }
      const m = ev.target.closest('.dm-mitad');
      arr = { f, boton, puesta, x0: ev.clientX, y0: ev.clientY, id: ev.pointerId, mitad: m ? [...m.parentNode.children].indexOf(m) : 0, fantasma: null, sitio: null, celda: null, levante: ev.pointerType === 'mouse' ? 0 : LEVANTE };
      try { boton.setPointerCapture(ev.pointerId); } catch { /* a pointer the browser no longer tracks */ }
      arr.timer = setTimeout(() => { if (arr && !arr.fantasma) { levantar(); seguir(arr.x0, arr.y0); } }, MANTENER);
    };
    const levantar = () => {
      clearTimeout(arr.timer);
      if (arr.puesta) giro[arr.f] = giroDe(p.puestas[arr.f]);
      const fx = t.fichas[arr.f];
      arr.fantasma = ficha(giro[arr.f] >= 2 ? [fx[1], fx[0]] : fx, { vertical: giro[arr.f] % 2 === 1, class: 'fantasma', 'aria-hidden': 'true' });
      arr.fantasma.style.setProperty('--t', `${g.querySelector('.dm-celda').getBoundingClientRect().width - 4}px`);
      document.body.append(arr.fantasma);
      arr.boton.classList.add('arrastrada');
      SFX.tap(); vibrate(8);
    };
    const mover = ev => {
      if (!arr || ev.pointerId !== arr.id) return;
      if (!arr.fantasma) {
        if (Math.hypot(ev.clientX - arr.x0, ev.clientY - arr.y0) < UMBRAL) return;
        levantar();
      }
      seguir(ev.clientX, ev.clientY);
    };
    const seguir = (px, py) => {
      const x = px, y = py - arr.levante;
      const fr = arr.fantasma.getBoundingClientRect(), hm = arr.fantasma.querySelectorAll('.dm-mitad')[arr.mitad].getBoundingClientRect();
      arr.fantasma.style.left = `${x - (hm.left - fr.left) - hm.width / 2}px`;
      arr.fantasma.style.top = `${y - (hm.top - fr.top) - hm.height / 2}px`;
      arr.celda = celdaEn(x, y);
      arr.sitio = arr.celda ? destino(+arr.celda.dataset.i, arr.f, arr.mitad) : null;
      marcar(arr.sitio);
      enfocar(arr.celda ? +arr.celda.dataset.zona : null);
    };
    const soltar = ev => {
      if (!arr || ev.pointerId !== arr.id) return;
      const a = arr; arr = null;
      clearTimeout(a.timer);
      if (!a.fantasma) return;
      tragar = true; setTimeout(() => { tragar = false; }, 0);
      a.fantasma.remove(); a.boton.classList.remove('arrastrada');
      marcar(null); enfocar(null);
      if (ev.type === 'pointercancel') return;
      if (!a.celda) {
        if (a.puesta) { recordar(); E.sacar(p, a.f); SFX.tap(); vibrate(6); sel = null; dibujar(); decir(T.dmElegir); anotar(); }
        return;
      }
      const antes = p.puestas[a.f];
      recordar();
      const r = E.poner(p, a.f, a.sitio);
      if (!r.ok) {
        historial.pop();
        if (antes) p.puestas[a.f] = antes;
        SFX.error(); vibrate([40, 30, 40]);
        a.celda.classList.remove('no'); void a.celda.offsetWidth; a.celda.classList.add('no');
        decir(T.dmNo[r.motivo], 'mal');
        return;
      }
      if (sel === a.f) sel = null;
      SFX.hit?.(); vibrate(15);
      dibujar();
      aterriza(a.f);
      decir(sel === null ? T.dmElegir : T.dmElegida);
      anotar(); revisar();
    };
    bandeja.addEventListener('pointerdown', ev => { const b = ev.target.closest('.dm-ficha'); if (b) agarrar(ev, b, +b.dataset.f, false); });
    g.addEventListener('pointerdown', ev => { const b = ev.target.closest('.dm-puesta'); if (b) agarrar(ev, b, +b.dataset.f, true); });
    const fuera = new AbortController();
    addEventListener('pointermove', mover, { signal: fuera.signal });
    addEventListener('pointerup', soltar, { signal: fuera.signal });
    addEventListener('pointercancel', soltar, { signal: fuera.signal });
    addEventListener('blur', cancelar, { signal: fuera.signal });
    document.addEventListener('visibilitychange', cancelar, { signal: fuera.signal });
    finArrastre = () => { cancelar(); fuera.abort(); document.querySelectorAll('body > .fantasma').forEach(x => x.remove()); };

    bandeja.addEventListener('click', ev => {
      const b = ev.target.closest('.dm-ficha'); if (!b || S.fin || tragar) return;
      const f = +b.dataset.f;
      giro[f] = (giro[f] + 1) % 4; sel = f; SFX.flip?.(); vibrate(6);
      decir(T.dmElegida);
      dibujar();
    });
    g.addEventListener('click', ev => {
      if (S.fin || tragar) return;
      const regla = ev.target.closest('.dm-regla');
      if (regla) { const k = +regla.dataset.zona; SFX.tap(); enfocar(g.querySelector('.dm-regla.encendida') === regla ? null : k, 1800); return; }
      const puesta = ev.target.closest('.dm-puesta');
      if (puesta) { recordar(); E.sacar(p, +puesta.dataset.f); SFX.tap(); vibrate(6); dibujar(); decir(sel === null ? T.dmElegir : T.dmElegida); anotar(); return; }
      const celda = ev.target.closest('.dm-celda'); if (!celda) return;
      if (sel === null) { decir(T.dmElegir, 'ojo'); return; }
      recordar();
      const r = E.poner(p, sel, E.lugar(t, +celda.dataset.i, giro[sel]));
      if (!r.ok) {
        historial.pop();
        SFX.error(); vibrate([40, 30, 40]);
        celda.classList.remove('no'); void celda.offsetWidth; celda.classList.add('no');
        decir(T.dmNo[r.motivo], 'mal');
        return;
      }
      const f = sel; sel = null;
      SFX.hit?.(); vibrate(15);
      dibujar();
      aterriza(f);
      decir(T.dmElegir);
      anotar(); revisar();
    });

    async function listo() {
      S.resueltos++; S.puestas = null;
      const ultimo = S.resueltos === boards.length;
      if (ultimo) { S.fin = 'todos'; S.ms = ctx.tiempo?.() || 0; }
      else S.k++;
      guardar();
      SFX.win?.(); vibrate([30, 30, 60]);
      g.classList.add('resuelto'); decir(T.dmListo, 'bien');
      await espera(QUIETO() ? 300 : 1300);
      if (!caja.isConnected) return;
      if (ultimo) return terminar('todos');
      tablero();
    }

    caja.replaceChildren(el('div', { class: 'dm-cabeza-juego' }, encabezado), g, aviso, bandeja,
      el('div', { class: 'dm-acciones' }, botonDeshacer, botonLimpiar), el('div', { class: 'dm-acciones' }, botonAyuda, botonRendirse));
    dibujar();
    repasar = () => { sel = null; dibujar(); anotar(); revisar(); };
    if (E.lleno(p)) revisar();
  }

  /** The end: all three solved, or given up. The clock stops here, not on "See results" (D-130). */
  function terminar(motivo, { recien = true } = {}) {
    finArrastre();
    if (recien) { S.fin = motivo; if (!S.ms) S.ms = ctx.tiempo?.() || 0; guardar(); }
    const e = estado();
    ctx.pararReloj?.(e);
    const todos = S.fin === 'todos';
    const sello = todos ? T.dmFin.todos : T.dmFin.rendido;
    const hecho = [...caja.querySelectorAll('.dm-bandeja, .dm-acciones, .dm-aviso')];
    hecho.forEach(x => x.remove());
    if (!caja.querySelector('.dm-board')) caja.append(el('p', { class: 'dm-marcador' }, E.card(e)));
    if (recien) { if (todos) SFX.win?.(); else SFX.tap(); }
    caja.append(el('div', { class: 'stack dm-fin', id: 'dm-fin' },
      el('p', { class: `dm-sello${todos ? '' : ' mal'}`, id: 'dm-sello' }, sello),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(estado()); } }, ctx.textoFin || T.seeResults)));
  }

  if (S.fin) terminar(S.fin, { recien: false });
  else tablero();

  // For the end-to-end scripts (C-14): the state, the board on screen and its solution, and a way to lay it
  window.__dominorama = {
    state: () => estado(),
    board: () => partida?.t,
    solveBoard: () => {
      if (S.fin || !partida) return;
      partida.puestas = partida.puestas.map(() => null);
      for (const s of partida.t.solucion) E.poner(partida, s.f, { a: s.a, b: s.b });
      repasar();   // the same path a last domino takes
    },
  };
}

/** What goes to the cup and to the result: 0 to 100 already, and its card. */
export function result(e) {
  const s = e ? E.puntaje({ resueltos: e.resueltos || 0, ms: e.ms || 0, ayudas: e.ayudas || 0 }) : 0;
  return { s, t: E.card(e), resumen: `${s}/100`, ...(e?.ms ? { ms: e.ms } : {}) };
}

/** How the score was reached (D-106), line by line; the cup adds the total. */
export function breakdown(e, { T, fmt = fmtLocal }) {
  if (!e) return null;
  const r = e.resueltos || 0, a = e.ayudas || 0, total = e.total || E.NIVELES.length;
  const lineas = [fmt(T.dmBdTableros[Math.min(r, 2)], { n: r, pts: r * E.PUNTOS_TABLERO })];
  if (r === total && total === E.NIVELES.length) lineas.push(fmt(T.dmBdRapidez, { pts: E.puntaje({ resueltos: r, ms: e.ms || 0, ayudas: 0 }) - r * E.PUNTOS_TABLERO }));
  if (a) lineas.push(fmt(T.dmBdAyudas[a === 1 ? 0 : 1], { n: a, pts: E.RESTA_AYUDA * a }));
  if (E.puntaje({ resueltos: r, ms: e.ms || 0, ayudas: 0 }) - a * E.RESTA_AYUDA < 0) lineas.push(T.dmBdPiso);
  return lineas;
}

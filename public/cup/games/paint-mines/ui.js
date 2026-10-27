/**
 * 🖌️ Pintaminas — its screen in La Copa and on its standalone page (D-331), ported from the lab
 * prototype (D-289): the 7×7 board, the brushes ("Pinta {color}" / "No pinta", three in the hard
 * variant), a hit shows its number, a miss uncovers the true color with a red border and −15, and at
 * the end the drawing appears and says what it was. The 💡 hint (D-292) and 🏳️ give up (D-296) ask
 * for a second tap; a paid hint is seen again for free while its cell is unpainted (#351).
 *
 * The moves are those of engine.js `estado`: `{ i, color }`, `{ ayuda: true, c }` and
 * `{ rendido: true }`, saved with `ctx.guardar` so a reloaded cup day resumes.
 *
 * Besides `montar`, the waiting room uses `portada` (a real game in small that paints itself and
 * says "🐟 ¡Era un pez!", in the variant's colors), `titulo`, `ejemplo` (a numbered cell and its
 * neighbors, and the ColorSweeper credit) and `selector`: the lever on a metal plate that switches to
 * the hard variant, with its flash, sparks, sound and vibration (D-291). The hard variant's night-blue
 * page background (`body.modo-dificil`, the owner's request) follows what is on screen: see `fondo`.
 */
import * as motor from './engine.js';
import TEXTOS from './texts.js';
import { loadCss } from '../../../assets/js/load-css.js';

// Its own stylesheet, loaded with its code and before its first screen (D-468)
await loadCss(new URL('./style.css', import.meta.url));

const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const COLORSWEEPER = 'https://store.steampowered.com/app/3128730/ColorSweeper/';
const CONFIRMAR_MS = 3000;
const espera = ms => new Promise(r => setTimeout(r, ms));
/** `portada` gets neither `el` nor `T`: its own small `el`, and the texts in the page's language. */
function h(tag, attrs = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (k === 'class') n.className = v; else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  for (const x of hijos.flat()) if (x !== null && x !== undefined && x !== false) n.append(x instanceof Node ? x : String(x));
  return n;
}
const textosDeLaPagina = () => (TEXTOS[(globalThis.document?.documentElement.lang || 'es').slice(0, 2)] || TEXTOS.es).ui;
/** Waits (a while) until a node the waiting room is still building is on the page. */
async function enLaPagina(n) {
  for (let k = 0; k < 40 && !n.isConnected; k++) await espera(25);
  return n.isConnected;
}

/* ------------------------------------------------------------------ */
/* The hard variant's background                                      */
/* ------------------------------------------------------------------ */

/**
 * The page goes night blue while the hard variant is on screen (D-291): in the waiting room, the
 * game and its result. Every piece of this game drawn in the hard variant carries `.pm-dificil`, and
 * the background follows the active screen: on if it shows one of them; on the result, the last game's
 * (also back from the 🐞 report) and while the game screen is empty (the 3, 2, 1 countdown
 * clears it); off anywhere else (another game, the cup board). One observer watches the screens, so
 * nothing has to remember to clear it.
 */
let ultimaDificil = false;
function fondo() {
  const activa = document.querySelector('.screen.active');
  // The result is the last game's, also when coming back to it from another screen (the 🐞 report)
  if (activa?.id === 'screen-resultado') { document.body.classList.toggle('modo-dificil', ultimaDificil); return; }
  if (activa?.id === 'screen-jugar' && !activa.querySelector('#jugar-body')?.children.length) return;
  const dificil = !!activa?.querySelector('.pm-dificil');
  if (activa?.id === 'screen-jugar') ultimaDificil = dificil;
  document.body.classList.toggle('modo-dificil', dificil);
}
let vigia = null;
function vigilarFondo() {
  if (typeof document === 'undefined') return;
  if (!vigia && typeof MutationObserver !== 'undefined') {
    vigia = new MutationObserver(fondo);
    vigia.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  }
}

/* ------------------------------------------------------------------ */
/* Grids                                                              */
/* ------------------------------------------------------------------ */

/** The board's colors, as variables (--p1, --p2) for the cells and the brushes. */
const estiloPinturas = t => t.dibujo.pinturas.map((p, k) => `--p${k + 1}:${p.color}`).join(';');
const claseColor = k => (k ? ` tinta pm-p${k}` : ' fondo');
/** A small grid (the cover's): the known cells with their color and number. */
function grilla(t, { conocidas = new Set(t.sol.keys()), clase = '' } = {}) {
  return h('div', { class: `pm-grilla ${clase}`, style: estiloPinturas(t) }, ...t.sol.map((k, i) => {
    const sabe = conocidas.has(i);
    return h('span', { class: `pm-casilla${sabe ? claseColor(k) : ''}`, 'data-i': i, style: `--k:${i}` }, sabe ? String(motor.numero(t.sol, i)) : '');
  }));
}
/** "🐟 ¡Era un pez!" */
const dibujoDice = (T, t) => `${t.dibujo.emoji} ${T.pmDibujos[t.dibujo.id] || ''}`;

/* ------------------------------------------------------------------ */
/* Waiting room                                                       */
/* ------------------------------------------------------------------ */

/**
 * The cover (the owner's request): a real game in small. It starts with the given cells and paints
 * one cell at a time, in the order a player would deduce them (the 💡 hint's), each with its number;
 * when done the drawing appears and it says what it was. Then another board. In the hard variant it
 * is a two-color game. Still, and whole, with reduced motion.
 */
let demoVez = 0;
export function portada({ variante } = {}) {
  vigilarFondo();
  const colores = variante === 'hard' ? 2 : 1;
  const primera = motor.generar('portada-demo-0', { colores });
  const caja = h('div', { class: 'pm-demo' });
  const rotulo = h('p', { class: 'pm-demo-rotulo' }, '');
  const raiz = h('div', { class: `pm-portada${colores === 2 ? ' pm-dificil' : ''}`, 'aria-hidden': 'true' }, caja, rotulo);
  if (QUIETO()) { caja.append(grilla(primera, { clase: 'chica' })); return raiz; }
  caja.append(grilla(primera, { conocidas: new Set(primera.dadas), clase: 'chica' }));
  const vez = ++demoVez;
  const sigue = () => vez === demoVez && caja.isConnected;
  (async () => {
    if (!await enLaPagina(caja)) return;
    for (let ronda = 0; sigue(); ronda++) {
      const T = textosDeLaPagina();
      const t = ronda ? motor.generar(`portada-demo-${ronda % 6}`, { colores }) : primera;
      const sabidas = new Set(t.dadas), orden = [];
      for (let a = motor.ayuda(t.sol, sabidas); a; a = motor.ayuda(t.sol, sabidas)) { orden.push(a.celda); sabidas.add(a.celda); }
      const g = grilla(t, { conocidas: new Set(t.dadas), clase: 'chica entra' });
      caja.replaceChildren(g);
      rotulo.textContent = ''; rotulo.className = 'pm-demo-rotulo';
      await espera(900);
      for (const i of orden) {
        if (!sigue()) return;
        const c = g.querySelector(`[data-i="${i}"]`);
        c.className = `pm-casilla${claseColor(t.sol[i])} pm-pop`;
        c.textContent = String(motor.numero(t.sol, i));
        await espera(230);
      }
      if (!sigue()) return;
      // Done: the numbers go, the drawing glows and it says what it was
      g.classList.add('revelada');
      rotulo.textContent = dibujoDice(T, t);
      rotulo.className = 'pm-demo-rotulo ve';
      await espera(2800);
    }
  })();
  return raiz;
}

/** The name in the waiting room, as in the prototype: the brush that paints, and the moving colors. */
export function titulo({ el, J }) {
  return el('h2', { class: 'pm-titulo' },
    el('span', { class: 'pm-brocha', 'aria-hidden': 'true' }, '🖌️'),
    el('span', { class: 'display display--lg rainbow' }, J.nombre));
}

/**
 * The how-to drawing: a cell and its 8 neighbors, its number counting the ones like it (in the hard
 * variant, only those of its color), and below it the credit to ColorSweeper with its link.
 */
export function ejemplo({ el, T, variante }) {
  vigilarFondo();
  const dos = variante === 'hard';
  // easy: a painted 5 with 5 painted neighbors; hard: a red 3 with 3 red, 2 green and 3 unpainted
  const celdas = dos ? [1, 1, 2, 1, 1, 2, 0, 0, 0] : [1, 1, 1, 1, 1, 1, 0, 0, 0];
  const g = el('div', { class: `pm-grilla pm-ejemplo${dos ? ' tablero' : ''}`, style: dos ? '--p1:#ff4d5e;--p2:#7ddc3a' : '--p1:#4da3ff', 'aria-hidden': 'true' },
    ...celdas.map((k, i) => el('span', { class: `pm-casilla${claseColor(k)}${i === 4 ? ' pm-centro' : ''}` }, i === 4 ? (dos ? '3' : '5') : '')));
  const [antes, despues] = T.pmCredito.split('{juego}');
  return el('div', { class: `rej-ejemplo pm-ejemplo-caja${dos ? ' pm-dificil' : ''}` },
    el('figure', {}, g, el('figcaption', {}, `✅ ${dos ? T.pmEjemploDos : T.pmEjemplo}`)),
    el('p', { class: 'pm-credito' }, antes, el('a', { href: COLORSWEEPER, target: '_blank', rel: 'noopener', id: 'link-colorsweeper' }, 'ColorSweeper'), despues));
}

/**
 * The hard variant's switch (D-291): a lever on a metal plate. Up, the plate electrifies (sparks and
 * a glow that flickers at random) and the game goes to two colors. Flipping it calls `cambiar`, which
 * redraws the waiting room: the new lever starts where the old one was and swings over, so the swing
 * and the spark play on the new screen; the flash covers the whole view and outlives the redraw.
 */
let desde = null;   // the lever's position before the flip that redrew the waiting room
let parpadeoVez = 0;
export function selector({ el, T, SFX, vibrate, variante, cambiar }) {
  vigilarFondo();
  const dificil = variante === 'hard';
  const animar = desde !== null && desde !== dificil && !QUIETO();
  desde = null;
  const titulo = el('b', {}), sub = el('span', { class: 'muted' });
  const caja = el('button', {
    type: 'button', class: 'pm-interruptor', id: 'btn-dificil', role: 'switch', 'aria-label': T.pmModo[1].titulo,
    onClick: () => {
      desde = dificil;
      if (!dificil) { relampago(); SFX.error(); vibrate([15, 30, 15, 30, 40]); } else vibrate(10);
      cambiar(dificil ? 'easy' : 'hard');
    },
  },
  el('span', { class: 'pm-placa', 'aria-hidden': 'true' },
    // The ball's track, engraved on the plate (the owner's request): it shows where the lever goes
    el('span', { class: 'pm-recorrido', html: '<svg viewBox="0 0 70 60"><path class="pm-ranura" d="M10.99 16.52 A39 39 0 0 1 59.01 16.52" /></svg>' }),
    el('span', { class: 'pm-rayo r1' }, '⚡'), el('span', { class: 'pm-rayo r2' }, '⚡'), el('span', { class: 'pm-rayo r3' }, '⚡'),
    el('span', { class: 'pm-palanca' }, el('span', { class: 'pm-mango' })), el('span', { class: 'pm-eje' })),
  el('span', { class: 'pm-rotulo' }, titulo, sub));
  const poner = on => {
    caja.classList.toggle('on', on); caja.classList.toggle('pm-dificil', on);
    caja.setAttribute('aria-checked', String(on));
    titulo.textContent = T.pmModo[+on].titulo; sub.textContent = T.pmModo[+on].sub;
  };
  // The label and aria-checked say the new position at once; only the lever and the glow swing
  poner(dificil);
  if (animar) {
    caja.classList.toggle('on', !dificil);
    (async () => {
      if (!await enLaPagina(caja)) return;
      // A frame with the old position painted, then the swing
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      caja.classList.toggle('on', dificil);
      if (dificil) { caja.classList.remove('chispa'); void caja.offsetWidth; caja.classList.add('chispa'); }
    })();
  }
  if (dificil) parpadear(caja);
  return caja;
}

/** The flash over the whole view when switching to hard, white and cyan. */
function relampago() {
  if (QUIETO()) return;
  const x = document.createElement('div');
  x.className = 'pm-relampago';
  x.setAttribute('aria-hidden', 'true');
  document.body.append(x);
  setTimeout(() => x.remove(), 600);
}

/**
 * While hard is on, the switch's glow rises and falls out of step: sometimes it holds, sometimes a
 * burst of sparks, sometimes it almost goes out (the owner's request). With reduced motion it stays
 * lit and still.
 */
function parpadear(caja) {
  const vez = ++parpadeoVez;
  if (QUIETO()) return;
  const paso = () => {
    if (vez !== parpadeoVez || !caja.isConnected) { caja.style.removeProperty('--brillo'); return; }
    const r = Math.random();
    // Almost always lit; now and then a dip or a short burst
    const brillo = r < 0.12 ? 0.05 + Math.random() * 0.2 : r < 0.3 ? 1 : 0.45 + Math.random() * 0.45;
    caja.style.setProperty('--brillo', brillo.toFixed(2));
    setTimeout(paso, r < 0.3 ? 40 + Math.random() * 90 : 120 + Math.random() * 900);
  };
  enLaPagina(caja).then(si => si && paso());
}

/* ------------------------------------------------------------------ */
/* The game                                                           */
/* ------------------------------------------------------------------ */

export function montar(raiz, ctx) {
  const { p: t, T, el, SFX, vibrate } = ctx;
  vigilarFondo();
  const jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  const dos = t.colores === 2;
  const nombreColor = k => T.pmColores[t.dibujo.pinturas[k - 1].id] || t.dibujo.pinturas[k - 1].id;
  const inicial = motor.estado(t, jugadas);
  // The brush starts on the first color; resumed, on the last one used
  let pincel = [...jugadas].reverse().find(j => Number.isInteger(j.color))?.color ?? 1;
  const porDe = new Map();   // the numbers that explain each paid hint, to show it again as it was

  const marcador = el('p', { class: 'pm-marcador', id: 'pm-marcador' });
  const aviso = el('p', { class: 'pm-aviso', 'aria-live': 'polite' }, '');
  const tablero = el('div', { class: `pm-grilla tablero${dos ? ' dificil' : ''}`, id: 'pm-tablero', 'data-tablero': 'pintaminas', style: estiloPinturas(t) });
  const casillas = t.sol.map((_, i) => el('button', { type: 'button', class: 'pm-casilla', 'data-i': i, onClick: () => tocar(i) }));
  tablero.append(...casillas);
  // One brush per color, and «No pinta» last
  const botonPincel = k => el('button', {
    type: 'button', class: `pm-pincel ${k ? `pm-pincel--tinta pm-p${k}` : 'pm-pincel--fondo'}`, id: k ? (k === 1 ? 'btn-tinta' : `btn-tinta${k}`) : 'btn-fondo', 'data-k': k,
    onClick: () => { SFX.tap(); pincel = k; dibujar(); },
  }, k ? fmt(T.pmTinta, { c: nombreColor(k) }) : T.pmFondo);
  const pinceles = el('div', { class: `pm-pinceles${dos ? ' tres' : ''}`, role: 'group', 'aria-label': T.pmPincel, style: estiloPinturas(t) },
    ...t.dibujo.pinturas.map((_, k) => botonPincel(k + 1)), botonPincel(0));

  // The hint and Give up: the first tap arms the button for 3 s, the second one acts (#351, D-296)
  let armado = null, armadoTimer = null;
  const armar = clave => {
    armado = clave; SFX.tap(); vibrate(15);
    clearTimeout(armadoTimer);
    armadoTimer = setTimeout(() => { armado = null; if (raiz.isConnected) dibujar(); }, CONFIRMAR_MS);
    dibujar();
  };
  const desarmar = () => { armado = null; clearTimeout(armadoTimer); };
  const botonAyuda = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-ayuda', onClick: () => pedirAyuda() });
  const botonRendirse = el('button', { type: 'button', class: 'btn btn--ghost btn--sm pm-rendirse', id: 'btn-rendirse', onClick: () => rendirse() });
  const acciones = el('div', { class: 'pm-acciones' }, botonAyuda, botonRendirse);
  const fin = el('div', { class: 'pm-fin' });
  raiz.append(el('div', { class: `stack pm-juego${dos ? ' pm-dificil' : ''}` }, marcador, tablero, aviso, pinceles, acciones, fin));

  const guardar = j => { jugadas.push(j); ctx.guardar(jugadas.slice()); };
  const nErrores = n => (n === 0 ? T.pmErrores[0] : n === 1 ? T.pmErrores[1] : fmt(T.pmErrores[2], { n }));

  const dibujar = () => {
    const e = motor.estado(t, jugadas);
    casillas.forEach((b, i) => {
      const sabe = e.conocidas.has(i), k = t.sol[i];
      b.className = 'pm-casilla' + (sabe ? claseColor(k) : '') + (e.errores.has(i) ? ' error' : '');
      b.textContent = sabe ? String(motor.numero(t.sol, i)) : '';
      b.disabled = sabe || e.terminado;
      b.setAttribute('aria-label', sabe ? fmt(k ? T.pmCelda.tinta : T.pmCelda.fondo, { c: k ? nombreColor(k) : '', n: motor.numero(t.sol, i) }) : T.pmCelda.nada);
    });
    pinceles.querySelectorAll('.pm-pincel').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.k === pincel)));
    // Each part whole on its line: at 320 px «Faltan 23» does not break in two
    const partes = [nErrores(e.errores.size), fmt(T.pmQuedan, { n: t.sol.length - e.conocidas.size })];
    marcador.replaceChildren(...partes.flatMap((x, j) => [j ? ' · ' : '', el('span', { class: 'parte' }, x)]));
    const ver = e.pagada !== null;
    botonAyuda.classList.toggle('armado', armado === 'ayuda' && !ver);
    botonAyuda.textContent = ver ? T.pmAyudaVer : armado === 'ayuda' ? fmt(T.pmAyudaSeguro, { pts: motor.RESTA_AYUDA }) : fmt(T.pmAyuda, { pts: motor.RESTA_AYUDA });
    botonRendirse.classList.toggle('armado', armado === 'rendirse');
    botonRendirse.textContent = armado === 'rendirse' ? T.pmRendirseSeguro : T.pmRendirse;
    return e;
  };

  // The hint: marks the cell that can be deduced and the numbers that explain it, and subtracts.
  // It does not say the color (D-292)
  const pedirAyuda = () => {
    const e = motor.estado(t, jugadas);
    if (e.terminado) return;
    const yaPagada = e.pagada !== null;
    let a;
    if (yaPagada) {
      const otra = motor.ayuda(t.sol, e.conocidas);
      a = { celda: e.pagada, por: porDe.get(e.pagada) || (otra?.celda === e.pagada ? otra.por : []) };
    } else a = motor.ayuda(t.sol, e.conocidas);
    if (!a) return;
    if (!yaPagada && armado !== 'ayuda') { armar('ayuda'); return; }
    desarmar();
    SFX.tap(); vibrate(10);
    if (!yaPagada) { porDe.set(a.celda, a.por); guardar({ ayuda: true, c: a.celda }); }
    dibujar();
    casillas[a.celda].classList.add('pm-pista-objetivo');
    for (const i of a.por) casillas[i].classList.add('pm-pista-razon');
    aviso.className = 'pm-aviso ayuda'; aviso.textContent = T.pmAyudaDice;
  };

  const rendirse = () => {
    if (motor.estado(t, jugadas).terminado) return;
    if (armado !== 'rendirse') { armar('rendirse'); return; }
    desarmar();
    guardar({ rendido: true });
    revelar(motor.estado(t, jugadas));
  };

  const tocar = i => {
    if (armado) desarmar();
    const antes = motor.estado(t, jugadas);
    if (antes.terminado || antes.conocidas.has(i)) return;
    guardar({ i, color: pincel });
    const e = dibujar();
    const b = casillas[i];
    if (e.errores.has(i)) {
      SFX.error(); vibrate([60, 40, 60]);
      aviso.className = 'pm-aviso mal';
      aviso.textContent = t.sol[i] ? fmt(T.pmMalTinta, { pts: motor.RESTA_ERROR, c: nombreColor(t.sol[i]) }) : fmt(T.pmMalFondo, { pts: motor.RESTA_ERROR });
      b.classList.add('pm-shake');
    } else {
      SFX.letterHit(); vibrate(12);
      aviso.className = 'pm-aviso'; aviso.textContent = '';
      if (!QUIETO()) b.classList.add('pm-pop');
    }
    if (e.terminado) revelar(e);
  };

  // At the end: the numbers go, the unpainted cells dim, the paint glows and it says what it was.
  // The clock stops here, not on "See results" (D-130), and in a cup the result goes out now (D-150)
  const revelar = (e, { recien = true } = {}) => {
    dibujar();
    if (e.rendido) casillas.forEach((b, i) => { if (!e.conocidas.has(i)) { b.className = `pm-casilla${claseColor(t.sol[i])} sin-hacer`; b.disabled = true; } });
    tablero.classList.add('revelada');
    pinceles.remove(); acciones.remove();
    aviso.className = 'pm-aviso era'; aviso.textContent = dibujoDice(T, t);
    ctx.pararReloj?.(e);
    if (recien) { if (e.rendido) SFX.tap(); else { SFX.reveal(); vibrate([30, 50, 30]); } }
    // ¡Perfecto! is without mistakes and without hints: with a hint it is not perfect (U-1)
    const sello = e.rendido ? T.pmFin.rendido : !e.errores.size && !e.ayudas ? T.pmFin.perfecto : T.pmFin.listo;
    fin.replaceChildren(
      el('p', { class: `pm-sello${e.rendido ? ' mal' : ''}` }, sello),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(motor.estado(t, jugadas)); } }, ctx.textoFin || T.seeResults));
  };

  dibujar();
  if (inicial.terminado) revelar(inicial, { recien: false });
  // For the end-to-end scripts: the board and the state, as the engine sees them
  globalThis.__pintaminas = { p: t, jugadas: () => jugadas.slice(), estado: () => motor.estado(t, jugadas) };
}

/** What goes to the cup and to the result: 0 to 100 in both variants (D-113, D-331). */
export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });

/** How the score was reached (D-106), line by line; the cup adds the total. */
export function desglose(e, { T, fmt: f = fmt }) {
  if (!e) return null;
  const n = e.errores.size, a = e.ayudas || 0;
  return [
    T.pmBdInicio,
    n ? f(T.pmBdErrores[n === 1 ? 1 : 2], { n, pts: motor.RESTA_ERROR * n }) : T.pmBdErrores[0],
    a ? f(T.pmBdAyudas[a === 1 ? 0 : 1], { n: a, pts: motor.RESTA_AYUDA * a }) : null,
    100 - motor.RESTA_ERROR * n - motor.RESTA_AYUDA * a < 0 ? T.pmBdPiso : null,
    e.rendido ? f(T.pmBdRendido, { p: Math.round(100 * e.avance) }) : null,
  ].filter(Boolean);
}

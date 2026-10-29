/**
 * Dominorama — lab prototype (D-381), inspired by Pips (The New York Times Games, 2025): lay every domino on
 * the board so each colored zone keeps its rule. Three boards against the clock, easy to hard. Spanish
 * only, for friends to try. Without `?seed=` it is today's game, the same for everyone. The engine is
 * engine.js.
 */
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { COMMON, SITIO } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { fechaLocal } from '../../assets/js/uno-al-dia.js';
import { cuentaRegresiva } from '../../assets/js/cuenta-regresiva.js';
import { mmss } from '../../assets/js/time-format.js';
import {
  generar, nuevaPartida, lugar, poner, sacar, valores, ocupacion, estadoZonas, resuelto, ayudar, etiqueta, puntaje, tarjeta,
  NIVELES, MAXIMO, PUNTOS_TABLERO, PUNTOS_RAPIDEZ, RESTA_AYUDA,
} from './engine.js';

trackVisit();   // the site's traffic (D-208)

const GAME_ID = 'dominorama';
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NYT_PIPS = 'https://www.nytimes.com/games/pips';
const T = {
  nombre: 'Dominorama',
  lema: 'Pon todas las fichas de dominó para que cada zona cumpla su regla.',
  hoy: 'Los tableros de hoy son los mismos para todos.',
  como: [
    ['🎲', 'Pon todas las fichas: cada una cubre dos casillas.'],
    ['🎯', 'Cada zona de color cumple su regla: un número es lo que suman sus puntos; = todos iguales; ≠ todos distintos; <5 y >9, menos o más.'],
    ['👆', 'Mantén y arrastra cada ficha a su casilla; un toque la gira. Toca un rombo: se ilumina su zona.'],
  ],
  comoTitulo: '¿Cómo se juega?',
  empezar: '🎲 Empezar', aJugar: '¡A jugar!',
  tablero: 'Tablero {n} de {total} · {nivel}',
  nivel: { facil: 'fácil', medio: 'medio', dificil: 'difícil' },
  elegir: 'Arrastra una ficha al tablero; un toque la gira.',
  elegida: 'Tócala para girarla otra vez, o toca la casilla donde va.',
  no: { fuera: 'Así no cabe: gírala o prueba otra casilla.', ocupada: 'Ahí ya hay una ficha: sácala primero.' },
  rota: '❌ Una zona no cumple su regla: mueve alguna ficha.',
  listo: '✅ ¡Listo!',
  ayuda: '💡 Ayuda (−{pts})', ayudaSeguro: 'Toca de nuevo (−{pts})', ayudaDice: '💡 Esa ficha va ahí.',
  rendirse: '🏳️ Rendirse', rendirseSeguro: '🏳️ ¿Seguro?',
  deshacer: '↩️ Deshacer', limpiar: '🧹 Limpiar', limpiarSeguro: '🧹 ¿Sacar todas?',
  fin: { todos: '¡Los tres!', rendido: 'Te rendiste' },
  desglose: {
    tableros: ['🎲 Ningún tablero.', `🎲 1 tablero: ${PUNTOS_TABLERO}.`, `🎲 {n} tableros: {pts}.`],
    rapidez: `⏱️ Rapidez: {pts} de ${PUNTOS_RAPIDEZ}.`,
    ayudas: ['💡 1 ayuda: −{pts}.', '💡 {n} ayudas: −{pts}.'],
  },
  tiempo: 'Tiempo: {t}.',
  otraVez: '🔁 Otros tableros', deHoy: '📅 Los de hoy', laboratorio: '‹ Volver al laboratorio',
  comentarAbrir: '💬 Dejar un comentario',
  comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si se entendían las reglas de las zonas, si costaba poner o girar las fichas y qué le cambiarías.', ph: 'Por ejemplo: no sabía que podía girar la ficha.', nombre: 'Nombre o apodo (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' },
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const espera = ms => new Promise(r => setTimeout(r, ms));

/** One color per zone, in order; a zone with no rule is plain. */
const COLORES = ['#ff2e88', '#2ee6d6', '#ffd23f', '#9dff3a', '#ff8a3d', '#b98bff', '#4fa3ff', '#ff6b6b', '#5fe0a0', '#e0a85f'];

const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const params = new URLSearchParams(location.search);
const SEMILLA_URL = (params.get('seed') || '').trim();
const P = { semilla: '', k: 0, p: null, desde: 0, resueltos: 0, ayudas: 0, fin: null };

function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, semilla: P.semilla, tablero: P.k + 1, resueltos: P.resueltos,
  url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

/* ------------------------------------------------------------------ */
/* Drawing dominoes and boards                                         */
/* ------------------------------------------------------------------ */

/** Where the dots go on a 3×3 half, for 0 to 6 pips. */
const PUNTOS = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const mitad = v => el('span', { class: 'mitad', 'aria-hidden': 'true' }, ...Array.from({ length: 9 }, (_, k) => el('i', { class: PUNTOS[v].includes(k) ? 'pt' : '' })));
/** A domino: its two halves, side by side or one over the other. */
const ficha = ([x, y], { vertical = false, ...attrs } = {}) => el(attrs.type ? 'button' : 'span', {
  ...attrs, class: `ficha${vertical ? ' vertical' : ''} ${attrs.class || ''}`.trim(), 'aria-label': attrs['aria-label'] || `Ficha ${x} y ${y}`,
}, mitad(x), mitad(y));

/** The board: its cells (colored by zone, with the zone's edges) and the badges of the rules. */
function tableroVacio(t, { chico = false } = {}) {
  const zonaDe = Array(t.celdas.length);
  t.zonas.forEach((z, k) => z.celdas.forEach(i => { zonaDe[i] = k; }));
  const en = (r, c) => t.celdas.findIndex(x => x.r === r && x.c === c);
  const g = el('div', { class: `tablero-dominorama${chico ? ' chico' : ''}`, style: `--w:${t.ancho};--h:${t.alto}`, 'data-tablero': 'dominorama' });
  let color = 0;
  const colorDe = t.zonas.map(z => (z.tipo === 'libre' ? null : COLORES[color++ % COLORES.length]));
  t.celdas.forEach((c, i) => {
    const z = zonaDe[i];
    const borde = [[-1, 0, 'bt'], [0, 1, 'br'], [1, 0, 'bb'], [0, -1, 'bl']].filter(([dr, dc]) => { const j = en(c.r + dr, c.c + dc); return j < 0 || zonaDe[j] !== z; }).map(x => x[2]);
    g.append(el('button', {
      type: 'button', class: `celda ${borde.join(' ')}${colorDe[z] ? '' : ' libre'}`, 'data-i': i, 'data-zona': z, tabindex: chico ? -1 : null,
      style: `grid-row:${c.r + 1};grid-column:${c.c + 1};${colorDe[z] ? `--z:${colorDe[z]}` : ''}`, 'aria-label': `Casilla ${c.r + 1}, ${c.c + 1}`,
    }));
  });
  // The badge sits on the zone's last cell (bottom right), like a tag hung on it
  t.zonas.forEach((z, k) => {
    const txt = etiqueta(z); if (!txt) return;
    const i = Math.max(...z.celdas), c = t.celdas[i];
    g.append(el('span', { class: 'regla', 'data-zona': k, style: `grid-row:${c.r + 1};grid-column:${c.c + 1};--z:${colorDe[k]}` }, el('span', {}, txt)));
  });
  return g;
}

/** The dominoes placed on a board, over its cells. */
function fichasPuestas(g, p, { conBotones = false } = {}) {
  g.querySelectorAll('.puesta').forEach(x => x.remove());
  p.puestas.forEach((s, f) => {
    if (!s) return;
    const a = p.t.celdas[s.a], b = p.t.celdas[s.b];
    const vertical = a.c === b.c, primero = (vertical ? a.r < b.r : a.c < b.c) ? [a, p.t.fichas[f][0], p.t.fichas[f][1]] : [b, p.t.fichas[f][1], p.t.fichas[f][0]];
    const [c0, v0, v1] = primero;
    g.append(ficha([v0, v1], {
      vertical, ...(conBotones ? { type: 'button' } : {}), class: 'puesta', 'data-f': f,
      style: `grid-row:${c0.r + 1} / span ${vertical ? 2 : 1};grid-column:${c0.c + 1} / span ${vertical ? 1 : 2}`,
      'aria-label': `Ficha ${v0} y ${v1}, puesta: tócala para sacarla`,
    }));
  });
  // Each zone: kept (✓) or broken, only once it is full
  const est = estadoZonas(p);
  g.querySelectorAll('.regla').forEach(r => { const e = est[+r.dataset.zona]; r.classList.toggle('ok', e === true); r.classList.toggle('mal', e === false); });
}

/* ------------------------------------------------------------------ */
/* The cover                                                           */
/* ------------------------------------------------------------------ */

const tituloJuego = (chico = false) => el('h1', { class: `titulo-dominorama${chico ? ' chico' : ''}` },
  ficha([6, 3], { class: 'logo' }), el('span', { class: `display ${chico ? '' : 'display--lg '}rainbow` }, T.nombre));
const credito = () => el('p', { class: 'credito' }, 'Inspirado en ',
  el('a', { href: NYT_PIPS, target: '_blank', rel: 'noopener', id: 'link-nyt' }, 'Pips'), ', de The New York Times Games.');

/** The three steps, on the cover and, folded, under the board. */
const pasos = () => el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ico), el('span', {}, x))));

let demoVez = 0;
function portada() {
  const caja = el('div', { class: 'demo', 'aria-hidden': 'true' });
  vista.replaceChildren(...[
    el('div', { class: 'portada' }, tituloJuego(), el('p', { class: 'lead', style: 'margin:0' }, T.lema), credito(), caja),
    SEMILLA_URL ? null : el('p', { class: 'muted center', style: 'margin:0' }, `📅 ${T.hoy}`),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); empezar(); } }, T.empezar),
    // The steps go after Empezar, so it is seen without scrolling on a small phone (U-39)
    el('div', { class: 'panel' }, pasos()),
  ].filter(Boolean));
  pieComentario('portada');
  partidaDemo(caja);
}

/** An easy board that solves itself, a domino at a time, then another one. */
function partidaDemo(caja) {
  const vez = ++demoVez;
  const sigue = () => vez === demoVez && caja.isConnected;
  (async () => {
    for (let ronda = 0; sigue(); ronda++) {
      const t = generar(`portada-demo-${ronda % 6}`, 'facil'), p = nuevaPartida(t);
      const g = tableroVacio(t, { chico: true });
      caja.replaceChildren(g);
      if (QUIETO) { for (const s of t.solucion) poner(p, s.f, s); fichasPuestas(g, p); return; }
      await espera(700);
      for (const s of t.solucion) {
        if (!sigue()) return;
        poner(p, s.f, s); fichasPuestas(g, p);
        g.querySelector(`.puesta[data-f="${s.f}"]`)?.classList.add('cae');
        await espera(650);
      }
      if (!sigue()) return;
      g.classList.add('resuelto');
      await espera(2000);
    }
  })();
}

/* ------------------------------------------------------------------ */
/* The game                                                            */
/* ------------------------------------------------------------------ */

function empezar() {
  P.semilla = SEMILLA_URL || `dia:${fechaLocal()}`;
  P.k = 0; P.resueltos = 0; P.ayudas = 0; P.fin = null;
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  // La Copa's 3, 2, 1 (D-105): the clock runs from "¡A jugar!"
  vista.replaceChildren(); pie.replaceChildren();
  cuentaRegresiva({ titulo: '🎲 Dominorama', ya: T.aJugar }).then(() => { P.desde = Date.now(); tablero(); });
}

/** Ends the board's drag: its ghost and its window listeners (set by each board). */
let finArrastre = () => {};

function tablero() {
  finArrastre();
  const nivel = NIVELES[P.k];
  const t = generar(P.semilla, nivel.id);
  const p = P.p = nuevaPartida(t);
  let sel = null;
  const giro = t.fichas.map(() => 0);
  // Undo (D-385): each change to the board keeps what was there before; help keeps its cost
  const historial = [];
  const guardar = () => { historial.push(p.puestas.map(x => (x ? { ...x } : null))); };
  let cortar = () => {};   // calls a drag off (set below); redrawing the board under a finger does it
  const encabezado = el('p', { class: 'marcador' }, fmt(T.tablero, { n: P.k + 1, total: NIVELES.length, nivel: T.nivel[nivel.id] }));
  const reloj = el('span', { class: 'reloj', id: 'reloj' }, '0:00');
  const g = tableroVacio(t);
  g.id = 'tablero';
  const bandeja = el('div', { class: 'bandeja', id: 'bandeja', role: 'group', 'aria-label': 'Fichas' });
  const aviso = el('p', { class: 'aviso-dominorama', 'aria-live': 'polite' }, T.elegir);
  const decir = (texto, clase = '') => { aviso.className = `aviso-dominorama ${clase}`; aviso.textContent = texto; };

  const dosToques = (boton, { listo, seguro, accion }) => {
    let armado = false, timer = null;
    const desarmar = () => { armado = false; clearTimeout(timer); boton.classList.remove('armado'); boton.textContent = listo(); };
    boton.addEventListener('click', () => {
      if (P.fin) return;
      if (!armado) { armado = true; SFX.tap(); vibrate(15); boton.textContent = seguro(); boton.classList.add('armado'); timer = setTimeout(desarmar, 3000); return; }
      desarmar(); accion();
    });
    boton.textContent = listo();
    return desarmar;
  };
  const botonAyuda = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-ayuda' });
  const botonRendirse = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-rendirse' });
  const botonDeshacer = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-deshacer' }, T.deshacer);
  const botonLimpiar = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-limpiar' });
  botonDeshacer.addEventListener('click', () => {
    if (P.fin || !historial.length) return;
    p.puestas = historial.pop(); sel = null;
    SFX.flip(); vibrate(6); dibujar(); decir(T.elegir);
  });
  dosToques(botonLimpiar, { listo: () => T.limpiar, seguro: () => T.limpiarSeguro, accion: () => {
    if (!p.puestas.some(Boolean)) return;
    guardar(); p.puestas = p.puestas.map(() => null); sel = null;
    SFX.flip(); vibrate(10); dibujar(); decir(T.elegir);
  } });
  dosToques(botonAyuda, { listo: () => fmt(T.ayuda, { pts: RESTA_AYUDA }), seguro: () => fmt(T.ayudaSeguro, { pts: RESTA_AYUDA }), accion: () => {
    guardar(); const f = ayudar(p); if (f < 0) { historial.pop(); return; }
    P.ayudas++; sel = null; SFX.flip(); vibrate(10);
    dibujar(); g.querySelector(`.puesta[data-f="${f}"]`)?.classList.add('pista');
    decir(T.ayudaDice, 'ayuda'); revisar();
  } });
  dosToques(botonRendirse, { listo: () => T.rendirse, seguro: () => T.rendirseSeguro, accion: () => terminar('rendido') });

  const dibujar = () => {
    cortar();
    botonDeshacer.disabled = !historial.length;
    botonLimpiar.disabled = !p.puestas.some(Boolean);
    fichasPuestas(g, p, { conBotones: true });
    bandeja.replaceChildren(...t.fichas.map((fx, f) => el('span', { class: 'hueco' }, p.puestas[f] ? null : ficha(giro[f] >= 2 ? [fx[1], fx[0]] : fx, {
      type: 'button', vertical: giro[f] % 2 === 1, class: sel === f ? 'sel' : '', 'data-f': f, 'data-giro': giro[f],
      'aria-label': `Ficha ${fx[0]} y ${fx[1]}${sel === f ? ', elegida' : ''}: tócala para girarla, mantén para arrastrarla`, 'aria-pressed': sel === f ? 'true' : 'false',
    }))));
  };
  const revisar = () => {
    if (resuelto(p)) return listo();
    if (p.puestas.every(Boolean)) decir(T.rota, 'mal');
  };

  // The zone in focus lights up (its cells and its diamond) and the rest dims: on a tap on its
  // diamond, for a moment, and under a domino being dragged.
  let focoTimer = null;
  const enfocar = (k, ms = 0) => {
    clearTimeout(focoTimer);
    g.classList.toggle('foco', k !== null);
    g.querySelectorAll('.celda, .regla').forEach(x => x.classList.toggle('encendida', k !== null && +x.dataset.zona === k));
    if (ms) focoTimer = setTimeout(() => enfocar(null), ms);
  };

  // Drag and drop (D-385): a domino from the tray, or one already placed, follows the finger
  // (lifted a little, so the finger does not hide it) and the half that was grabbed lands on the
  // cell under it. A move of less than a few pixels is still a tap.
  let arr = null, tragar = false;
  const LEVANTE = 36, UMBRAL = 8, MANTENER = 250;
  const giroDe = (f, s) => { const a = t.celdas[s.a], b = t.celdas[s.b], v = a.c === b.c; return ((v ? a.r < b.r : a.c < b.c) ? 0 : 2) + (v ? 1 : 0); };
  const celdaEn = (x, y) => [...g.querySelectorAll('.celda')].find(c => { const r = c.getBoundingClientRect(); return x >= r.left && x < r.right && y >= r.top && y < r.bottom; });
  const en = (r, c) => t.celdas.findIndex(x => x.r === r && x.c === c);
  const destino = (i, f, mitad) => {
    if (mitad === 0) return lugar(t, i, giro[f]);
    const c = t.celdas[i], j = giro[f] % 2 ? en(c.r - 1, c.c) : en(c.r, c.c - 1);
    return j < 0 ? null : lugar(t, j, giro[f]);
  };
  const marcar = sitio => {
    g.querySelectorAll('.destino').forEach(x => x.classList.remove('destino', 'no'));
    if (!sitio) return;
    const o = ocupacion(p), mal = [sitio.a, sitio.b].some(i => o[i] >= 0 && o[i] !== arr.f);
    [sitio.a, sitio.b].forEach(i => g.querySelector(`.celda[data-i="${i}"]`).classList.add('destino', ...(mal ? ['no'] : [])));
  };
  // A drag that never got its pointerup (the domino redrawn under the finger, a second finger, the
  // browser dropping the pointer) is called off, so its ghost never stays on the screen
  const cancelar = () => {
    if (!arr) return;
    const a = arr; arr = null;
    clearTimeout(a.timer);
    a.fantasma?.remove(); a.boton.classList.remove('arrastrada');
    marcar(null); enfocar(null);
  };
  cortar = cancelar;
  const agarrar = (ev, boton, f, puesta) => {
    if (P.fin || ev.button > 0) return;
    if (arr) { if (ev.pointerId !== arr.id) return; cancelar(); }
    const m = ev.target.closest('.mitad');
    arr = { f, boton, puesta, x0: ev.clientX, y0: ev.clientY, id: ev.pointerId, mitad: m ? [...m.parentNode.children].indexOf(m) : 0, fantasma: null, sitio: null, celda: null, levante: ev.pointerType === 'mouse' ? 0 : LEVANTE };
    try { boton.setPointerCapture(ev.pointerId); } catch { /* a pointer the browser no longer tracks */ }
    // Held still for a moment, it lifts: the drag starts without moving
    arr.timer = setTimeout(() => { if (arr && !arr.fantasma) { levantar(); seguir(arr.x0, arr.y0); } }, MANTENER);
  };
  const levantar = () => {
    clearTimeout(arr.timer);
    if (arr.puesta) giro[arr.f] = giroDe(arr.f, p.puestas[arr.f]);
    const fx = t.fichas[arr.f];
    arr.fantasma = ficha(giro[arr.f] >= 2 ? [fx[1], fx[0]] : fx, { vertical: giro[arr.f] % 2 === 1, class: 'fantasma', 'aria-hidden': 'true' });
    arr.fantasma.style.setProperty('--t', `${g.querySelector('.celda').getBoundingClientRect().width - 4}px`);
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
    const fr = arr.fantasma.getBoundingClientRect(), h = arr.fantasma.querySelectorAll('.mitad')[arr.mitad].getBoundingClientRect();
    arr.fantasma.style.left = `${x - (h.left - fr.left) - h.width / 2}px`;
    arr.fantasma.style.top = `${y - (h.top - fr.top) - h.height / 2}px`;
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
      // Off the board: a placed domino goes back to the tray, one from the tray stays there
      if (a.puesta) { guardar(); sacar(p, a.f); SFX.tap(); vibrate(6); sel = null; dibujar(); decir(T.elegir); }
      return;
    }
    const antes = p.puestas[a.f];
    guardar();
    const r = poner(p, a.f, a.sitio);
    if (!r.ok) {
      historial.pop();
      if (antes) p.puestas[a.f] = antes;
      SFX.error(); vibrate([40, 30, 40]);
      a.celda.classList.remove('no'); void a.celda.offsetWidth; a.celda.classList.add('no');
      decir(T.no[r.motivo], 'mal');
      return;
    }
    if (sel === a.f) sel = null;
    SFX.hit(); vibrate(15);
    dibujar();
    g.querySelector(`.puesta[data-f="${a.f}"]`)?.classList.add('cae');
    decir(sel === null ? T.elegir : T.elegida);
    revisar();
  };
  bandeja.addEventListener('pointerdown', ev => { const b = ev.target.closest('.ficha'); if (b) agarrar(ev, b, +b.dataset.f, false); });
  g.addEventListener('pointerdown', ev => { const b = ev.target.closest('.puesta'); if (b) agarrar(ev, b, +b.dataset.f, true); });
  // On the window, not the board: the pointer may end anywhere, and the domino it grabbed may be gone
  const fuera = new AbortController();
  addEventListener('pointermove', mover, { signal: fuera.signal });
  addEventListener('pointerup', soltar, { signal: fuera.signal });
  addEventListener('pointercancel', soltar, { signal: fuera.signal });
  addEventListener('blur', cancelar, { signal: fuera.signal });
  document.addEventListener('visibilitychange', cancelar, { signal: fuera.signal });
  finArrastre = () => { cancelar(); fuera.abort(); document.querySelectorAll('body > .fantasma').forEach(x => x.remove()); };

  bandeja.addEventListener('click', ev => {
    const b = ev.target.closest('.ficha'); if (!b || P.fin || tragar) return;
    const f = +b.dataset.f;
    // A tap turns it a quarter, and leaves it chosen for a tap on a cell (D-385)
    giro[f] = (giro[f] + 1) % 4; sel = f; SFX.flip(); vibrate(6);
    decir(T.elegida);
    dibujar();
  });
  g.addEventListener('click', ev => {
    if (P.fin || tragar) return;
    const regla = ev.target.closest('.regla');
    if (regla) { const k = +regla.dataset.zona; SFX.tap(); enfocar(g.querySelector('.regla.encendida') === regla ? null : k, 1800); return; }
    const puesta = ev.target.closest('.puesta');
    if (puesta) { guardar(); sacar(p, +puesta.dataset.f); SFX.tap(); vibrate(6); dibujar(); decir(sel === null ? T.elegir : T.elegida); return; }
    const celda = ev.target.closest('.celda'); if (!celda) return;
    if (sel === null) { decir(T.elegir, 'ojo'); return; }
    guardar();
    const r = poner(p, sel, lugar(t, +celda.dataset.i, giro[sel]));
    if (!r.ok) {
      historial.pop();
      SFX.error(); vibrate([40, 30, 40]);
      celda.classList.remove('no'); void celda.offsetWidth; celda.classList.add('no');
      decir(T.no[r.motivo], 'mal');
      return;
    }
    const f = sel; sel = null;
    SFX.hit(); vibrate(15);
    dibujar();
    g.querySelector(`.puesta[data-f="${f}"]`)?.classList.add('cae');
    decir(T.elegir);
    revisar();
  });

  async function listo() {
    P.resueltos++;
    SFX.win(); vibrate([30, 30, 60]);
    g.classList.add('resuelto'); decir(T.listo, 'bien');
    if (!QUIETO) confetti({ count: 60, duration: 1200 });
    await espera(QUIETO ? 300 : 1300);
    if (P.fin) return;
    if (P.resueltos === NIVELES.length) return terminar('todos');
    P.k++; tablero();
  }

  vista.replaceChildren(tituloJuego(true), el('div', { class: 'cabeza-dominorama' }, encabezado, reloj), g, aviso, bandeja, el('div', { class: 'acciones-dominorama' }, botonDeshacer, botonLimpiar), el('div', { class: 'acciones-dominorama' }, botonAyuda, botonRendirse),
    el('details', { class: 'panel como-dominorama', id: 'como-dominorama' }, el('summary', {}, T.comoTitulo), pasos()));
  dibujar();
  pieComentario('juego');
  const tic = setInterval(() => { if (!reloj.isConnected || P.fin) return clearInterval(tic); reloj.textContent = `⏱️ ${mmss(Date.now() - P.desde)}`; }, 500);
}

function terminar(motivo) {
  finArrastre();
  if (P.fin) return;
  P.fin = motivo;
  resultado();
}

/* ------------------------------------------------------------------ */
/* The result                                                          */
/* ------------------------------------------------------------------ */

const enlace = semilla => (semilla ? `?seed=${encodeURIComponent(semilla)}` : '');

function resultado() {
  const ms = Date.now() - P.desde;
  const s = puntaje({ resueltos: P.resueltos, ms, ayudas: P.ayudas });
  const todos = P.fin === 'todos';
  trackFinish({ detalle: `${s}/${MAXIMO} · ${P.resueltos} de ${NIVELES.length} · ${P.ayudas} ayudas · ${mmss(ms)}` });
  pie.replaceChildren();
  const rapidez = todos ? puntaje({ resueltos: P.resueltos, ms, ayudas: 0 }) - P.resueltos * PUNTOS_TABLERO : 0;
  const lineas = [fmt(T.desglose.tableros[Math.min(P.resueltos, 2)], { n: P.resueltos, pts: P.resueltos * PUNTOS_TABLERO })];
  if (todos) lineas.push(fmt(T.desglose.rapidez, { pts: rapidez }));
  if (P.ayudas) lineas.push(fmt(T.desglose.ayudas[P.ayudas === 1 ? 0 : 1], { n: P.ayudas, pts: RESTA_AYUDA * P.ayudas }));
  vista.replaceChildren(el('div', { class: 'resultado' },
    tituloJuego(true),
    el('p', { class: `sello-dominorama${todos ? '' : ' mal'}` }, T.fin[P.fin]),
    el('div', { class: 'score-big', id: 'puntaje' }, `${s}/${MAXIMO}`),
    el('ul', { class: 'desglose muted' }, ...lineas.map(x => el('li', {}, x))),
    el('p', { class: 'lead', style: 'margin:0' }, fmt(T.tiempo, { t: mmss(ms) })),
    botonResultadoSolo({ C: COMMON.es, emoji: '🎲', juego: T.nombre, puntaje: `${s}/${MAXIMO}`, tiempo: mmss(ms), tarjeta: tarjeta({ resueltos: P.resueltos, ayudas: P.ayudas }), url: `${SITIO}labs/dominorama/${enlace(SEMILLA_URL)}`, alTocar: () => SFX.tap() }),
    el('a', { class: 'btn btn--yellow', id: 'btn-otro', href: enlace(Math.random().toString(36).slice(2, 8)) }, T.otraVez),
    SEMILLA_URL ? el('a', { class: 'btn btn--ghost btn--sm', id: 'btn-de-hoy', href: location.pathname }, T.deHoy) : null,
    el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.laboratorio),
    el('hr', { class: 'divisor' }),
    formularioComentario({ T: T.comentario, contexto: contexto('resultado') })));
  scrollTo(0, 0);
  if (todos) { SFX.win(); if (!QUIETO) confetti({ count: 180, duration: 2400 }); }
  else SFX.tap();
}

document.getElementById('sound-slot').append(soundToggle());
initSound();
sparkles();
portada();
// For the end-to-end script: the game, and the engine's solution of the board on screen
window.__dominorama = { P, solucion: () => P.p?.t.solucion };

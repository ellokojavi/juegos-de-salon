/**
 * 🚂 Tren en Vilo — lab demo: build a bridge of beams over a gap, then the train crosses; if a beam
 * stretches too much it snaps. Five stages in 7 minutes; the score is the stages done and the speed,
 * like Rutas rotas (D-295). Spanish only, a prototype. The engine (physics, stages, score) is
 * engine.js. It sends no usage signal and has no comment form: it is a local demo for the owner.
 */
import { el, vibrate, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { cuentaRegresiva } from '../../assets/js/cuenta-regresiva.js';
import { ETAPAS, TIEMPO_S, LARGO_MAX, ALTO, fijos, vigaValida, crearSim, paso, DT, FISICA, puntajePartida, PUNTOS_ETAPA } from './engine.js';

const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const POLY_BRIDGE = 'https://en.wikipedia.org/wiki/Poly_Bridge';
const T = {
  nombre: 'Tren en Vilo',
  lema: 'Arma un puente que aguante el tren.',
  como: [
    ['🌉', 'Arrastra de un punto a otro para tender una viga. Tócala para quitarla.'],
    ['🚂', 'Toca Probar: cruza el tren. Si una viga se estira de más, se corta.'],
    ['⏱', `Son ${ETAPAS.length} etapas en ${TIEMPO_S / 60} minutos. Cuentan las etapas que pasa el tren y lo rápido que lo logras.`],
  ],
  empezar: '🚂 Empezar', aJugar: '¡A construir!',
  etapa: 'Etapa {n} de {total}', vigas: 'Vigas: {n} de {max}',
  probar: '🚂 Probar', arreglar: '✏️ Arreglar', deshacer: '↩ Deshacer', borrar: '🧹 Borrar', borrarSeguro: '🧹 ¿Seguro?',
  rendirse: '🏳️ Rendirse', rendirseSeguro: '🏳️ ¿Seguro?',
  aviso: {
    inicio: 'Arrastra desde un punto marcado: las orillas o una viga que ya pusiste.',
    larga: 'Muy larga: una viga mide hasta 2 cuadros.', fuera: 'Fuera del área de construcción.',
    repetida: 'Ya hay una viga ahí.', presupuesto: 'No te quedan vigas: quita alguna.', suelta: 'Empieza en un punto marcado.',
    quitada: 'Viga quitada.', borrado: 'Borraste el puente: ↩ Deshacer lo trae de vuelta.',
    cruza: '🚂 Cruzando…', paso: '✅ ¡El tren pasó!', cayo: '💥 Se cayó el puente. Arréglalo y prueba otra vez.',
  },
  fin: { todas: '¡Todos los puentes en pie!', tiempo: 'Se acabó el tiempo', rendido: 'Te rendiste' },
  desglose: { etapas: '🌉 Etapas ({n} de {total}): +{pts}.', rapidez: '⏱ Rapidez ({t}): +{pts}.', sinRapidez: '⏱ Rapidez: +0 (faltaron etapas).' },
  otraVez: '🔁 Jugar otra vez', laboratorio: '‹ Volver al laboratorio',
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const vista = document.getElementById('vista');
const CONFIRMAR_MS = 3000;

const tituloJuego = (chico = false) => el('h1', { class: `titulo-tv${chico ? ' chico' : ''}` },
  el('span', { class: 'tren', 'aria-hidden': 'true' }, '🚂'), el('span', { class: `display ${chico ? '' : 'display--lg '}rainbow` }, T.nombre));
const credito = () => el('p', { class: 'credito' }, 'Inspirado en ',
  el('a', { href: POLY_BRIDGE, target: '_blank', rel: 'noopener' }, 'Poly Bridge'), ', de Dry Cactus.');

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const MARGEN = 1.3;          // the cliffs, on each side, in grid units
const ARRIBA = ALTO[1] + 0.6, ABAJO = ALTO[0] - 1.1;

/** A canvas sized to its box, in device pixels; returns the world ↔ screen mapping. */
function lienzo(e, { arriba = ARRIBA, abajo = ABAJO } = {}) {
  const c = el('canvas', { class: 'tv-lienzo' });
  c._v = { arriba, abajo };
  const ajustar = () => {
    const w = Math.min(c.parentElement?.clientWidth || 340, 560);
    const escala = w / (e.ancho + 2 * MARGEN);
    const h = Math.round(escala * (arriba - abajo));
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.style.width = `${w}px`; c.style.height = `${h}px`;
    c._m = { escala, dpr, w, h };
  };
  c._ajustar = ajustar;
  return c;
}
const aPantalla = (c, x, y) => [(x + MARGEN) * c._m.escala, (c._v.arriba - y) * c._m.escala];
const aMundo = (c, px, py) => [px / c._m.escala - MARGEN, c._v.arriba - py / c._m.escala];

/** The color of a beam by how stretched or squeezed it is, from green through yellow to red. */
function colorTension(t) {
  const r = Math.min(1, Math.abs(t) / FISICA.quiebre);
  const h = 120 - 120 * r;
  return `hsl(${h}, 90%, ${55 - 5 * r}%)`;
}

/**
 * Draws a stage: sky, cliffs and water, the grid (while building), the beams and the train.
 * `sim` (while it runs) gives the positions and tensions; without it, the beams as laid.
 */
function dibujar(c, e, { vigas = [], sim = null, grilla = false, arrastre = null, usados = new Set() } = {}) {
  const ctx = c.getContext('2d'), { escala: s, dpr, w, h } = c._m;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  // Water at the bottom of the gap
  const [, yAgua] = aPantalla(c, 0, c._v.abajo + 0.7);
  const agua = ctx.createLinearGradient(0, yAgua, 0, h);
  agua.addColorStop(0, 'rgba(46, 230, 214, 0.45)'); agua.addColorStop(1, 'rgba(11, 30, 63, 0.9)');
  ctx.fillStyle = agua; ctx.fillRect(0, yAgua, w, h - yAgua);
  // The two cliffs, down from the deck
  const [x0, y0] = aPantalla(c, 0, 0), [x1] = aPantalla(c, e.ancho, 0);
  ctx.fillStyle = '#6b3fa0';
  ctx.fillRect(0, y0, x0, h - y0); ctx.fillRect(x1, y0, w - x1, h - y0);
  ctx.fillStyle = '#9dff3a'; ctx.fillRect(0, y0 - 3, x0, 4); ctx.fillRect(x1, y0 - 3, w - x1, 4);
  // The anchors under the deck are rock ledges: drawn as small blocks
  for (const [ax, ay] of e.anclas) {
    const [px, py] = aPantalla(c, ax, ay);
    ctx.fillStyle = '#6b3fa0'; ctx.fillRect(px - s * 0.35, py, s * 0.7, s * 0.35);
  }
  // The grid of points where a beam can go
  if (grilla) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    for (let x = 0; x <= e.ancho; x++) for (let y = ALTO[0]; y <= ALTO[1]; y++) {
      const [px, py] = aPantalla(c, x, y);
      ctx.beginPath(); ctx.arc(px, py, Math.max(1.6, s * 0.045), 0, 2 * Math.PI); ctx.fill();
    }
  }
  // The beams: from the simulation if it runs, if not as laid
  const grosor = Math.max(3, s * 0.11);
  ctx.lineCap = 'round';
  const pos = sim ? i => [sim.nudos[i].x, sim.nudos[i].y] : null;
  const lista = sim ? sim.vigas.map(v => ({ a: pos(v.i), b: pos(v.j), t: v.tension, rota: v.rota, camino: v.camino }))
    : vigas.map(v => ({ a: v.a, b: v.b, t: 0, camino: v.a[1] === 0 && v.b[1] === 0 }));
  for (const v of lista) {
    if (v.rota) continue;
    const [ax, ay] = aPantalla(c, ...v.a), [bx, by] = aPantalla(c, ...v.b);
    ctx.strokeStyle = sim ? colorTension(v.t) : v.camino ? '#ffd23f' : '#e8c8a0';
    ctx.lineWidth = v.camino ? grosor * 1.25 : grosor;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }
  // The joints: fixed ones as squares, the rest as circles
  const nudos = sim ? sim.nudos.map(n => ({ x: n.x, y: n.y, fijo: n.fijo })) : [...fijos(e).map(([x, y]) => ({ x, y, fijo: true })),
    ...[...usados].map(k => k.split(',').map(Number)).filter(([x, y]) => !fijos(e).some(([a, b]) => a === x && b === y)).map(([x, y]) => ({ x, y }))];
  for (const n of nudos) {
    const [px, py] = aPantalla(c, n.x, n.y);
    ctx.fillStyle = n.fijo ? '#ff2e88' : '#ffffff';
    ctx.strokeStyle = '#1a0b2e'; ctx.lineWidth = 2;
    const r = Math.max(4, s * 0.11);
    if (n.fijo) { ctx.fillRect(px - r, py - r, 2 * r, 2 * r); ctx.strokeRect(px - r, py - r, 2 * r, 2 * r); }
    else { ctx.beginPath(); ctx.arc(px, py, r * 0.85, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
  }
  // The beam being dragged: green if it can go, red if not
  if (arrastre) {
    const [ax, ay] = aPantalla(c, ...arrastre.a), [bx, by] = aPantalla(c, ...arrastre.b);
    ctx.strokeStyle = arrastre.ok ? 'rgba(157, 255, 58, 0.9)' : 'rgba(255, 46, 136, 0.9)';
    ctx.setLineDash([grosor * 1.4, grosor]); ctx.lineWidth = grosor;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
  }
  // The train, an emoji riding on the deck (or tumbling into the water)
  if (sim) {
    const tr = sim.tren;
    const [px, py] = aPantalla(c, tr.x, tr.cayo ? tr.y - 1.2 : tr.y);
    ctx.font = `${Math.round(s * 0.95)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.save(); ctx.translate(px, py); ctx.scale(-1, 1); ctx.fillText('🚂', 0, 2); ctx.restore();
  }
}

/* ------------------------------------------------------------------ */
/* The cover: a truss that a train crosses, over and over               */
/* ------------------------------------------------------------------ */

const DEMO = (() => {
  const W = 4, v = [], V = (a, b) => v.push({ a, b });
  for (let i = 0; i < W; i++) V([i, 0], [i + 1, 0]);
  V([1, 1], [2, 1]); V([2, 1], [3, 1]);
  for (let i = 1; i < W; i++) V([i, 0], [i, 1]);
  V([0, 0], [1, 1]); V([W, 0], [W - 1, 1]); V([1, 1], [2, 0]); V([3, 1], [2, 0]);
  return v;
})();

function portada() {
  const e = ETAPAS[0];
  // The cover shows only the bridge and the water right under it
  const c = lienzo(e, { arriba: 1.9, abajo: -2.2 });
  vista.replaceChildren(
    el('div', { class: 'portada' }, tituloJuego(), el('p', { class: 'lead', style: 'margin:0' }, T.lema), credito(), el('div', { class: 'tv-demo', 'aria-hidden': 'true' }, c)),
    el('div', { class: 'panel' }, el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ico), el('span', {}, x))))),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); parar(); empezar(); } }, T.empezar));
  c._ajustar();
  let sim = crearSim(e, DEMO), vivo = true;
  const parar = () => { vivo = false; };
  if (QUIETO) { dibujar(c, e, { vigas: DEMO }); return; }
  const cuadro = () => {
    if (!vivo || !c.isConnected) return;
    for (let k = 0; k < Math.round(1 / 60 / DT); k++) paso(sim);
    dibujar(c, e, { sim });
    if (sim.fin) sim = crearSim(e, DEMO);
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
}

/* ------------------------------------------------------------------ */
/* The game                                                            */
/* ------------------------------------------------------------------ */

const P = { etapa: 0, hechas: 0, inicio: 0, fin: null, vigas: [], historial: [], reloj: null, simulando: false };
const segundos = () => (P.fin?.segundos ?? (Date.now() - P.inicio) / 1000);

function empezar() {
  cuentaRegresiva({ titulo: `🚂 ${T.nombre}`, ya: T.aJugar }).then(() => {
    Object.assign(P, { etapa: 0, hechas: 0, inicio: Date.now(), fin: null, vigas: [], historial: [] });
    jugar();
    clearInterval(P.reloj);
    P.reloj = setInterval(() => {
      const quedan = TIEMPO_S - segundos();
      const r = document.getElementById('tv-reloj');
      if (r) { r.textContent = `⏱ ${mmss(Math.max(0, quedan))}`; r.classList.toggle('apurado', quedan <= 60); }
      if (quedan <= 0) terminar('tiempo');
    }, 250);
  });
}

function jugar() {
  const e = ETAPAS[P.etapa];
  const c = lienzo(e);
  const aviso = el('p', { class: 'tv-aviso', 'aria-live': 'polite' }, T.aviso.inicio);
  const puntos = el('div', { class: 'tv-puntos', 'aria-hidden': 'true' },
    ...ETAPAS.map((_, k) => el('span', { class: k < P.hechas ? 'hecha' : k === P.etapa ? 'actual' : '' })));
  const cuenta = el('span', { class: 'tv-cuenta', id: 'tv-cuenta' });
  const botonProbar = el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-probar', onClick: () => probarPuente() }, T.probar);
  const armados = {};
  const conConfirmacion = (clave, rotulo, rotuloArmado, accion, attrs = {}) => {
    const b = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', ...attrs, onClick: () => {
      if (armados[clave]) { clearTimeout(armados[clave]); armados[clave] = null; b.textContent = rotulo; b.classList.remove('armado'); accion(); return; }
      SFX.tap(); vibrate(15); b.textContent = rotuloArmado; b.classList.add('armado');
      armados[clave] = setTimeout(() => { armados[clave] = null; b.textContent = rotulo; b.classList.remove('armado'); }, CONFIRMAR_MS);
    } }, rotulo);
    return b;
  };
  const botonDeshacer = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-deshacer', onClick: () => {
    if (!P.historial.length) return;
    P.vigas = P.historial.pop(); SFX.tap(); repintar();
  } }, T.deshacer);
  const botonBorrar = conConfirmacion('borrar', T.borrar, T.borrarSeguro, () => {
    if (!P.vigas.length) return;
    P.historial.push(P.vigas); P.vigas = []; SFX.splash?.(); aviso.textContent = T.aviso.borrado; repintar();
  }, { id: 'btn-borrar' });
  const botonRendirse = conConfirmacion('rendirse', T.rendirse, T.rendirseSeguro, () => terminar('rendido'), { id: 'btn-rendirse' });
  const fila = el('div', { class: 'tv-acciones' }, botonDeshacer, botonBorrar, botonRendirse);

  vista.replaceChildren(
    el('div', { class: 'tv-cabeza' },
      el('span', { class: 'tv-etapa' }, fmt(T.etapa, { n: P.etapa + 1, total: ETAPAS.length })), puntos,
      el('span', { class: 'tv-reloj', id: 'tv-reloj' }, `⏱ ${mmss(Math.max(0, TIEMPO_S - segundos()))}`)),
    el('div', { class: 'tv-tablero' }, c),
    el('div', { class: 'tv-barra' }, cuenta, aviso),
    botonProbar, fila);
  c._ajustar();

  const usados = () => new Set([...fijos(e).map(([x, y]) => `${x},${y}`), ...P.vigas.flatMap(v => [v.a.join(','), v.b.join(',')])]);
  function repintar(arrastre = null) {
    cuenta.textContent = fmt(T.vigas, { n: P.vigas.length, max: e.presupuesto });
    cuenta.classList.toggle('lleno', P.vigas.length >= e.presupuesto);
    botonDeshacer.disabled = !P.historial.length || P.simulando;
    botonProbar.disabled = P.simulando || !P.vigas.length;
    botonBorrar.disabled = P.simulando || !P.vigas.length;
    dibujar(c, e, { vigas: P.vigas, grilla: !P.simulando, arrastre, usados: usados() });
  }
  repintar();

  // Dragging from a joint in use to any grid point lays a beam; a tap on a beam removes it
  const punto = ev => { const r = c.getBoundingClientRect(); return aMundo(c, ev.clientX - r.left, ev.clientY - r.top); };
  const cercano = ([x, y]) => [Math.round(x), Math.round(y)];
  const cerca = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= 0.45;
  let desde = null, inicioPx = null;
  c.addEventListener('pointerdown', ev => {
    if (P.simulando || P.fin) return;
    const m = punto(ev), g = cercano(m);
    inicioPx = [ev.clientX, ev.clientY];
    desde = cerca(m, g) && usados().has(g.join(',')) ? g : null;
    c.setPointerCapture(ev.pointerId);
  });
  c.addEventListener('pointermove', ev => {
    if (!desde) return;
    const m = punto(ev), g = cercano(m);
    const hasta = cerca(m, g) ? g : m;
    const motivo = Array.isArray(hasta) && Number.isInteger(hasta[0]) && Number.isInteger(hasta[1]) ? vigaValida(e, P.vigas, desde, hasta) : 'suelta';
    repintar({ a: desde, b: hasta, ok: !motivo && P.vigas.length < e.presupuesto });
  });
  c.addEventListener('pointerup', ev => {
    const m = punto(ev), g = cercano(m);
    const toque = inicioPx && Math.hypot(ev.clientX - inicioPx[0], ev.clientY - inicioPx[1]) < 8;
    if (toque) {
      // A tap: removes the beam under the finger, if there is one
      const i = vigaBajo(m);
      if (i >= 0) { P.historial.push(P.vigas); P.vigas = P.vigas.filter((_, k) => k !== i); SFX.tap(); aviso.textContent = T.aviso.quitada; }
      else if (!desde) aviso.textContent = T.aviso.suelta;
      desde = null; repintar(); return;
    }
    if (desde) {
      const hasta = cerca(m, g) ? g : null;
      const motivo = !hasta ? 'fuera' : P.vigas.length >= e.presupuesto ? 'presupuesto' : vigaValida(e, P.vigas, desde, hasta);
      if (motivo) { if (motivo !== 'cero') { aviso.textContent = T.aviso[motivo] || T.aviso.fuera; SFX.error(); vibrate([30, 30, 30]); } }
      else { P.historial.push(P.vigas); P.vigas = [...P.vigas, { a: desde, b: hasta }]; SFX.tap(); vibrate(10); aviso.textContent = ''; }
    }
    desde = null; repintar();
  });
  function vigaBajo([x, y]) {
    let mejor = -1, d = 0.22;
    P.vigas.forEach((v, k) => {
      const [ax, ay] = v.a, [bx, by] = v.b, dx = bx - ax, dy = by - ay;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      const dd = Math.hypot(x - (ax + u * dx), y - (ay + u * dy));
      if (dd < d) { d = dd; mejor = k; }
    });
    return mejor;
  }

  // Testing: the train crosses in real time; the beams change color with the strain
  function probarPuente() {
    if (P.simulando) {
      // ✏️ Arreglar: back to building, with the same beams
      P.simulando = false; botonProbar.textContent = T.probar; aviso.textContent = ''; repintar(); return;
    }
    SFX.tap();
    P.simulando = true; botonProbar.textContent = T.arreglar; botonProbar.disabled = true;
    aviso.textContent = T.aviso.cruza;
    repintar();
    const sim = crearSim(e, P.vigas);
    let rotas = 0;
    const cuadro = () => {
      if (!P.simulando || !c.isConnected || P.fin) return;
      for (let k = 0; k < Math.round(1 / 60 / DT); k++) paso(sim);
      const ahora = sim.vigas.filter(v => v.rota).length;
      if (ahora > rotas) { rotas = ahora; SFX.error(); vibrate(40); }
      dibujar(c, e, { sim });
      if (!sim.fin) { requestAnimationFrame(cuadro); return; }
      if (sim.tren.llego) {
        aviso.textContent = T.aviso.paso; SFX.win(); vibrate([30, 50, 30]);
        P.hechas++;
        setTimeout(() => {
          if (P.fin) return;
          P.simulando = false;
          if (P.hechas >= ETAPAS.length) { terminar('todas'); return; }
          P.etapa++; P.vigas = []; P.historial = []; jugar();
        }, 1300);
      } else {
        aviso.textContent = T.aviso.cayo;
        botonProbar.disabled = false;
      }
    };
    requestAnimationFrame(cuadro);
  }
}

function terminar(motivo) {
  if (P.fin) return;
  clearInterval(P.reloj);
  P.simulando = false;
  P.fin = { motivo, segundos: Math.min(TIEMPO_S, (Date.now() - P.inicio) / 1000) };
  resultado();
}

function resultado() {
  const { motivo, segundos: seg } = P.fin;
  const p = puntajePartida(P.hechas, seg);
  const todas = P.hechas === ETAPAS.length;
  vista.replaceChildren(el('div', { class: 'resultado' },
    tituloJuego(true),
    el('p', { class: `tv-sello${todas ? '' : ' mal'}` }, T.fin[motivo]),
    el('div', { class: 'score-big', id: 'puntaje' }, `${p.total}/100`),
    el('div', { class: 'tv-puntos grande', 'aria-hidden': 'true' }, ...ETAPAS.map((_, k) => el('span', { class: k < P.hechas ? 'hecha' : '' }))),
    el('ul', { class: 'desglose muted' },
      el('li', {}, fmt(T.desglose.etapas, { n: P.hechas, total: ETAPAS.length, pts: p.etapas })),
      el('li', {}, todas ? fmt(T.desglose.rapidez, { t: mmss(seg), pts: p.rapidez }) : T.desglose.sinRapidez)),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-otro', onClick: () => { SFX.tap(); empezar(); } }, T.otraVez),
    el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.laboratorio)));
  scrollTo(0, 0);
  if (todas) { SFX.win(); vibrate([40, 30, 40, 30, 120]); if (!QUIETO) confetti({ count: 160, duration: 2200 }); }
  else SFX.tap();
}

document.getElementById('sound-slot').append(soundToggle());
initSound?.();
// While building, the page doesn't scroll under the finger that drags a beam
addEventListener('resize', () => { const c = document.querySelector('.tv-lienzo'); if (c?._ajustar && !P.simulando) { c._ajustar(); } });
portada();
// For the end-to-end scripts and the owner's console
window.__trenEnVilo = { P, ETAPAS };

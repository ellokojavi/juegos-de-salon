/**
 * Rutas rotas — prototipo de laboratorio (D-293; se llamaba Rutas hasta v0.167.3), inspirado en Junction Nine (Bricks and Chips): 9 piezas
 * con tramos de líneas de metro; se arrastra de una pieza a otra para elegir un rectángulo y, al
 * soltar, gira media vuelta. Gana quien une todas las líneas, y el desafío es hacerlo en el mínimo de
 * giros (el motor lo calcula exacto). Reiniciar es gratis. Solo en español, para probar con amigos.
 * Sin `?seed=` es el tablero de hoy, el mismo para todos. El motor está en engine.js.
 */
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { COMMON, SITIO } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { fechaLocal } from '../../assets/js/uno-al-dia.js';
import { cuentaRegresiva } from '../../assets/js/cuenta-regresiva.js';
import { generar, generarEtapa, girar, resuelto, bordesUnidos, puntajePartida, RECTANGULOS, LADO, ETAPAS, TIEMPO_S } from './engine.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'rutas';
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const JUNCTION = 'https://bricksandchips.co/junction-nine';
const T = {
  nombre: 'Rutas rotas',
  lema: 'Une todas las líneas del metro girando partes del tablero.',
  hoy: 'El tablero de hoy es el mismo para todos.',
  como: [
    ['🔄', 'Arrastra de una pieza a otra: el rectángulo da media vuelta y sus piezas quedan al revés. Un toque gira una sola.'],
    ['🚇', 'Une todas las líneas, sin cortes de pieza en pieza.'],
    ['⛳', `Son ${ETAPAS.length} etapas en ${TIEMPO_S / 60} minutos. Cuenta completarlas, luego la rapidez y los giros; deshacer y reiniciar son gratis.`],
  ],
  empezar: '🚇 Empezar', aJugar: '¡A girar!',
  // Las etapas (D-294): cinco tableros de dificultad creciente
  etapa: 'Etapa {n} de {t}', etapaLista: '🚇 ¡Etapa {n} lista!', etapaPerfecta: '🚇 ¡Etapa {n} en el mínimo!',
  filaEtapa: '{c} Etapa {n}: {g} giros (mínimo {m})',
  // El reloj y el puntaje por capas (D-295): completar, la rapidez y los giros
  reloj: '⏱ {t}', rendirse: '🏳️ Rendirse', rendirseSeguro: '🏳️ ¿Seguro?',
  capas: { etapas: '🚇 Etapas ({n} de {t}): +{p}.', rapidez: '⏱ Rapidez ({t}): +{p}.', sinRapidez: '⏱ Rapidez: +0 (faltaron etapas).', giros: '🔄 Giros ({g}, mínimo {m}): +{p}.' },
  finPor: { tiempo: 'Se acabó el tiempo', rendido: 'Te rendiste' },
  // Los tres botones bajo el tablero, en este orden (pedido del dueño): deshacer, reiniciar, rendirse
  deshacer: '↩ Deshacer', deshecho: 'Deshiciste el último giro: no cuenta.',
  marcador: 'Giros: {g} · Mínimo: {m}', reiniciar: '↺ Reiniciar', reiniciado: 'De vuelta al comienzo: los giros vuelven a 0.',
  unidas: '🚇 ¡Todas las líneas unidas!',
  fin: { perfecto: '¡Todas en el mínimo!', listo: '¡Rutas unidas!' },
  reinicios: ['Reiniciaste 1 vez.', 'Reiniciaste {n} veces.'],
  tiempo: 'Tiempo: {t}.',
  otraVez: '🔁 Otro tablero', deHoy: '📅 El de hoy', laboratorio: '‹ Volver al laboratorio',
  comentarAbrir: '💬 Dejar un comentario',
  comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si se entendía cómo girar, si el mínimo te pareció justo y qué le cambiarías.', ph: 'Por ejemplo: me costó ver dónde quedaba cada pieza al girar.', nombre: 'Tu nombre (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' },
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const params = new URLSearchParams(location.search);
const SEMILLA_URL = (params.get('seed') || '').trim();
const P = { semilla: '', etapa: 0, t: null, estado: null, giros: 0, reinicios: 0, hechas: [], desde: 0, terminado: false, acabado: false, segundos: 0, reloj: null, oculto: 0 };
// El tiempo de la partida; en el modo de prueba se puede acortar (?test&time=20) para probar el final por tiempo
const LIMITE_S = params.has('test') && +params.get('time') > 0 ? +params.get('time') : TIEMPO_S;
// El reloj se pausa con la pantalla oculta (U-20): el rato oculto se le descuenta al comienzo
const usado = () => Math.max(0, ((P.oculto || Date.now()) - P.desde) / 1000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (P.desde && !P.acabado) P.oculto = Date.now(); }
  else if (P.oculto) { P.desde += Date.now() - P.oculto; P.oculto = 0; }
});

function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, semilla: P.semilla, etapa: P.etapa + 1, giros: P.giros, minimo: P.t?.minimo, reinicios: P.reinicios, hechas: P.hechas.map(h => `${h.giros}/${h.minimo}`).join(' '),
  url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

const tituloJuego = () => el('h1', { class: 'titulo-rt' },
  el('span', { class: 'metro', 'aria-hidden': 'true' }, '🚇'), el('span', { class: 'display display--lg rainbow' }, T.nombre));
/** De dónde viene el juego, con el link a su página (como Agentes y Pintaminas). */
const credito = () => el('p', { class: 'credito' }, 'Inspirado en ',
  el('a', { href: JUNCTION, target: '_blank', rel: 'noopener', id: 'link-junction' }, 'Junction Nine'), ', de Bricks and Chips.');

// ——— Las piezas, en SVG: cada tramo une dos puertas con una curva, y en su mitad hay una estación ———
const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => { const n = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
const PUNTO = { N: k => [35 + 30 * k, 0], S: k => [35 + 30 * k, 100], O: k => [0, 35 + 30 * k], E: k => [100, 35 + 30 * k] };
const ADENTRO = { N: [0, 1], S: [0, -1], O: [1, 0], E: [-1, 0] };
function dibujoPieza(pieza) {
  const s = svg('svg', { viewBox: '0 0 100 100', class: 'pieza-svg', 'aria-hidden': 'true' });
  const estaciones = [];
  for (const { de, a, color } of pieza.tramos) {
    const [x1, y1] = PUNTO[de.lado](de.k), [x2, y2] = PUNTO[a.lado](a.k);
    const [dx1, dy1] = ADENTRO[de.lado], [dx2, dy2] = ADENTRO[a.lado];
    const c1 = [x1 + dx1 * 45, y1 + dy1 * 45], c2 = [x2 + dx2 * 45, y2 + dy2 * 45];
    s.append(svg('path', { d: `M${x1} ${y1} C${c1} ${c2} ${x2} ${y2}`, stroke: color, 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'butt', class: 'tramo' }));
    // La estación, en la mitad de la curva
    const m = (u, v, w, z) => 0.125 * u + 0.375 * v + 0.375 * w + 0.125 * z;
    // Una sola estación por lugar: en los cruces se apilaban y se leían como un manchón
    const cx = m(x1, c1[0], c2[0], x2), cy = m(y1, c1[1], c2[1], y2);
    if (estaciones.some(([x, y]) => Math.hypot(x - cx, y - cy) < 14)) continue;
    estaciones.push([cx, cy]);
    s.append(svg('circle', { cx, cy, r: 5.5, class: 'estacion' }));
  }
  return s;
}

/**
 * El tablero: una pieza por lugar, posicionada con left/top y girada con rotate. Cada pieza recuerda su
 * ángulo acumulado, para que al girar siempre dé media vuelta hacia el mismo lado.
 */
function crearTablero(t, { interactivo = false, alGirar } = {}) {
  const caja = el('div', { class: 'tablero-rt', id: interactivo ? 'tablero' : null });
  const marco = el('div', { class: 'seleccion', 'aria-hidden': 'true' });
  const angulo = t.piezas.map(() => 0);
  const piezas = t.piezas.map((p, i) => el('div', { class: 'pieza', 'data-p': i }, dibujoPieza(p)));
  caja.append(...piezas, marco);
  // Cada pieza tiene dos capas: la de afuera va en su lugar y solo gira mientras se juega una jugada; la de
  // adentro (el dibujo) lleva la orientación que dice el motor: dada vuelta (v), media vuelta
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
   * Una jugada: el rectángulo gira media vuelta como un bloque (pedido del dueño), alrededor de su centro.
   * Cada pieza orbita ese centro, sin girar por su cuenta; al terminar queda en su lugar nuevo con su
   * orientación nueva, sin salto. Una jugada que llega antes de que termine la anterior la cierra de una.
   */
  let pendiente = null;
  const aplicar = (estado, rect, animar = true) => {
    pendiente?.();
    const nuevo = girar(estado, rect);
    if (!animar || QUIETO) { colocar(nuevo); return nuevo; }
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
  if (interactivo) {
    // Arrastrar de una pieza a otra marca el rectángulo; al soltar, gira
    caja.style.touchAction = 'none';
    let desde = null, hasta = null;
    const lugarEn = ev => {
      const b = caja.getBoundingClientRect();
      const c = Math.min(LADO - 1, Math.max(0, Math.floor((ev.clientX - b.left) / (b.width / LADO))));
      const f = Math.min(LADO - 1, Math.max(0, Math.floor((ev.clientY - b.top) / (b.height / LADO))));
      return { f, c };
    };
    const rectDe = () => ({ f1: Math.min(desde.f, hasta.f), c1: Math.min(desde.c, hasta.c), f2: Math.max(desde.f, hasta.f), c2: Math.max(desde.c, hasta.c) });
    const marcar = () => {
      const r = rectDe();
      Object.assign(marco.style, { left: `${r.c1 * 100 / LADO}%`, top: `${r.f1 * 100 / LADO}%`, width: `${(r.c2 - r.c1 + 1) * 100 / LADO}%`, height: `${(r.f2 - r.f1 + 1) * 100 / LADO}%` });
      marco.classList.add('ve');
    };
    caja.addEventListener('pointerdown', ev => { if (caja.classList.contains('bloqueado')) return; desde = hasta = lugarEn(ev); try { caja.setPointerCapture(ev.pointerId); } catch { /* un toque simulado */ } marcar(); });
    // Las pruebas giran sin arrastrar: el mismo camino que un arrastre
    caja.addEventListener('girar', ev => { if (!caja.classList.contains('bloqueado')) alGirar?.(ev.detail); });
    caja.addEventListener('pointermove', ev => { if (!desde) return; const l = lugarEn(ev); if (l.f !== hasta.f || l.c !== hasta.c) { hasta = l; marcar(); vibrate(5); } });
    const soltar = ev => { if (!desde) return; const r = rectDe(); desde = hasta = null; marco.classList.remove('ve'); if (ev.type === 'pointerup') alGirar?.(r); };
    caja.addEventListener('pointerup', soltar);
    caja.addEventListener('pointercancel', soltar);
  }
  // Marcar un rectángulo sin el dedo (la portada lo usa para mostrar cada jugada antes de hacerla)
  const marcar = r => {
    if (!r) { marco.classList.remove('ve'); return; }
    Object.assign(marco.style, { left: `${r.c1 * 100 / LADO}%`, top: `${r.f1 * 100 / LADO}%`, width: `${(r.c2 - r.c1 + 1) * 100 / LADO}%`, height: `${(r.f2 - r.f1 + 1) * 100 / LADO}%` });
    marco.classList.add('ve');
  };
  // Poner un estado de una (al empezar, al reiniciar): si una jugada estaba girando, se cierra antes
  const poner = estado => { pendiente?.(); colocar(estado); };
  return { caja, poner, aplicar, marcar };
}

// La portada (pedido del dueño): el tablero parte desordenado y se arma en 5 o 6 jugadas, mostrando las
// dos clases de jugada: girar una carta sola (rotarla en su lugar) y girar dos vecinas (cambian de lugar).
// Antes de cada una se marca el rectángulo, como cuando se arrastra. Al final la ruta se ilumina, y vuelve
// a empezar con otro desorden.
const UNA = [...Array(LADO * LADO).keys()].map(i => ({ f1: Math.floor(i / LADO), c1: i % LADO, f2: Math.floor(i / LADO), c2: i % LADO }));
const PAR = RECTANGULOS.filter(r => (r.f2 - r.f1) + (r.c2 - r.c1) === 1);
let demoVez = 0;
function portada() {
  const t = generar('portada-demo', { giros: 3 });
  const META = t.piezas.map((_, p) => ({ p, v: 0 }));
  const tab = crearTablero(t);
  tab.caja.classList.add('chico');
  vista.replaceChildren(...[
    el('div', { class: 'portada' }, tituloJuego(), el('p', { class: 'lead', style: 'margin:0' }, T.lema), credito(), tab.caja),
    el('div', { class: 'panel' }, el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ico), el('span', {}, x))))),
    SEMILLA_URL ? null : el('p', { class: 'muted center', style: 'margin:0' }, `📅 ${T.hoy}`),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); empezar(); } }, T.empezar),
  ].filter(Boolean));
  pieComentario('portada');
  if (QUIETO) { tab.poner(META, false); tab.caja.classList.add('resuelto'); return; }
  const vez = ++demoVez;
  const sigue = () => vez === demoVez && tab.caja.isConnected;
  const espera = ms => new Promise(r => setTimeout(r, ms));
  // Un desorden de 5 o 6 jugadas, alternando una carta sola y un par, sin repetir la anterior
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
  (async () => {
    while (sigue()) {
      const jugadas = desorden();
      let estado = jugadas.reduce(girar, META);
      if (resuelto(t.piezas, estado)) continue;
      tab.caja.classList.remove('resuelto', 'aparece'); void tab.caja.offsetWidth; tab.caja.classList.add('aparece');
      tab.poner(estado, false);
      await espera(1100);
      // Se arma deshaciendo el desorden al revés: se marca, se gira
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
}

function empezar() {
  P.semilla = SEMILLA_URL || `dia:${fechaLocal()}`;
  P.etapa = 0; P.hechas = []; P.reinicios = 0; P.acabado = false; P.segundos = 0;
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  // El 3, 2, 1 de La Copa (D-105): el tablero se arma con el "¡A girar!", y el tiempo corre desde ahí
  vista.replaceChildren(); pie.replaceChildren();
  cuentaRegresiva({ titulo: '🚇 Rutas rotas', ya: T.aJugar }).then(() => { P.desde = Date.now(); jugar(); });
}

/** Los puntos de las etapas: hechas (verde en el mínimo, amarilla con giros de más, como 🟩 y 🟨 al compartir), la actual y las que vienen. */
const progreso = () => el('div', { class: 'etapas', 'aria-hidden': 'true' }, ...ETAPAS.map((_, k) => {
  const h = P.hechas[k];
  return el('span', { class: `punto${h ? (h.giros <= h.minimo ? ' perfecta' : ' hecha') : k === P.etapa ? ' actual' : ''}` });
}));

function jugar() {
  const t = P.t = generarEtapa(P.semilla, P.etapa);
  P.estado = t.inicio; P.giros = 0; P.terminado = false;
  const cabeza = el('div', { class: 'cabeza-etapa entra', id: 'etapa' },
    // El mínimo lo dice el marcador, justo debajo (U-8): una línea menos, y el aviso cabe a 320×568
    el('p', { class: 'n-etapa' }, fmt(T.etapa, { n: P.etapa + 1, t: ETAPAS.length })), progreso());
  const marcador = el('p', { class: 'marcador', id: 'marcador' });
  const reloj = el('p', { class: 'reloj-rt', id: 'reloj' });
  const tic = () => {
    const quedan = Math.max(0, LIMITE_S - usado());
    // Hacia arriba, como toda cuenta atrás: el rojo parte en 1:00 y el 0:00 llega con el final
    reloj.textContent = fmt(T.reloj, { t: mmss(Math.ceil(quedan) * 1000) });
    reloj.classList.toggle('poco', quedan <= 60);
    if (quedan <= 0) acabar('tiempo');
  };
  clearInterval(P.reloj); P.reloj = setInterval(tic, 250);
  const aviso = el('p', { class: 'aviso-rt', 'aria-live': 'polite' }, '');
  const pintar = () => {
    marcador.textContent = fmt(T.marcador, { g: P.giros, m: t.minimo });
    reiniciar.disabled = !P.giros || P.terminado;
    deshacer.disabled = !historial.length || P.terminado;
  };
  // Los bordes que ya calzan
  const unir = () => {
    const unidos = new Set(bordesUnidos(t.piezas, P.estado).flat());
    tab.caja.querySelectorAll('.pieza').forEach(n => n.classList.toggle('unida', unidos.has(+n.dataset.lugar)));
  };
  const tab = crearTablero(t, {
    interactivo: true,
    alGirar: r => {
      if (P.terminado) return;
      P.estado = tab.aplicar(P.estado, r);
      P.giros++; historial.push(r);
      SFX.flip(); vibrate(15);
      aviso.className = 'aviso-rt'; aviso.textContent = '';
      pintar();
      setTimeout(unir, QUIETO ? 0 : 450);
      if (resuelto(t.piezas, P.estado)) terminar();
    },
  });
  // Deshacer: el mismo giro lo deshace (girar dos veces deja igual); el giro deshecho no cuenta, como
  // reiniciar es gratis: el golf cuenta los giros que quedan
  const historial = [];
  const deshacer = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-deshacer', onClick: () => {
    if (P.terminado || !historial.length) return;
    SFX.tap(); vibrate(10);
    P.estado = tab.aplicar(P.estado, historial.pop());
    P.giros--;
    pintar();
    setTimeout(unir, QUIETO ? 0 : 450);
    aviso.className = 'aviso-rt'; aviso.textContent = T.deshecho;
  } }, T.deshacer);
  const reiniciar = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-reiniciar', onClick: () => {
    if (P.terminado || !P.giros) return;
    SFX.tap(); vibrate(10);
    P.estado = t.inicio; P.giros = 0; P.reinicios++; historial.length = 0;
    tab.poner(P.estado, !QUIETO);
    pintar(); unir();
    aviso.className = 'aviso-rt'; aviso.textContent = T.reiniciado;
  } }, T.reiniciar);
  // Etapa lista: las líneas brillan, y viene la siguiente o el resultado
  const terminar = () => {
    P.terminado = true;
    P.hechas.push({ giros: P.giros, minimo: t.minimo });
    // La última: el reloj se detiene aquí, no cuando aparece el resultado
    if (P.hechas.length === ETAPAS.length) { P.segundos = usado(); clearInterval(P.reloj); }
    tab.caja.classList.add('bloqueado');
    // Reiniciar y Rendirse se van con la etapa hecha: rendirse en la pausa no tiene sentido
    acciones.remove();
    setTimeout(() => {
      tab.caja.classList.add('resuelto');
      aviso.className = 'aviso-rt bien';
      aviso.textContent = fmt(P.giros <= t.minimo ? T.etapaPerfecta : T.etapaLista, { n: P.etapa + 1 });
      cabeza.querySelector('.etapas').replaceWith(progreso());
      SFX.reveal();
    }, QUIETO ? 0 : 500);
    setTimeout(() => {
      if (P.acabado) return;
      if (P.etapa + 1 < ETAPAS.length) { P.etapa++; jugar(); } else acabar('completa');
    }, QUIETO ? 1000 : 2300);
  };
  // Rendirse: con un segundo toque, como la ayuda de Pintaminas; cuentan las etapas ya hechas
  let armado = false, armadoTimer = null;
  const rendirse = el('button', { type: 'button', class: 'btn btn--ghost btn--sm rendirse', id: 'btn-rendirse', onClick: () => {
    if (P.acabado) return;
    if (!armado) {
      armado = true; SFX.tap(); vibrate(15); rendirse.textContent = T.rendirseSeguro; rendirse.classList.add('armado');
      clearTimeout(armadoTimer);
      armadoTimer = setTimeout(() => { armado = false; rendirse.textContent = T.rendirse; rendirse.classList.remove('armado'); }, 3000);
      return;
    }
    clearTimeout(armadoTimer);
    acabar('rendido');
  } }, T.rendirse);
  tab.poner(P.estado, false);
  // Sin el título mientras se juega (#360): la barra de arriba ya muestra 🚇, y así Reiniciar y Rendirse se ven sin bajar en un celular chico
  const acciones = el('div', { class: 'acciones-rt' }, deshacer, reiniciar, rendirse);
  vista.replaceChildren(cabeza, el('div', { class: 'fila-marcador' }, reloj, marcador), tab.caja, aviso, acciones);
  tic();
  pintar(); unir();
  pieComentario('juego');
}

/** Se acaba la partida: completa, por tiempo o porque se rindió. */
function acabar(motivo) {
  if (P.acabado) return;
  P.acabado = true; P.terminado = true;
  clearInterval(P.reloj);
  if (motivo !== 'completa') P.segundos = Math.min(LIMITE_S, usado());
  if (motivo === 'tiempo') { SFX.error(); vibrate([60, 40, 60]); }
  resultado(motivo);
}

/** El link de una partida: su semilla. */
const enlace = semilla => (semilla ? `?seed=${encodeURIComponent(semilla)}` : '');

function resultado(motivo = 'completa') {
  const { t } = P;
  const r = puntajePartida(P.hechas, P.segundos), s = r.total, ms = P.segundos * 1000;
  trackFinish({ detalle: `${s}/100 · ${motivo} · ${P.hechas.length}/${ETAPAS.length} etapas · ${P.hechas.map(h => `${h.giros}/${h.minimo}`).join(' ')} · ${P.reinicios} reinicios · ${mmss(ms)}` });
  if (motivo === 'completa') SFX.win();
  if (!QUIETO && s >= 70) confetti({ count: 160, duration: 2400 });
  pie.replaceChildren();
  const perfecto = r.completa && P.hechas.every(h => h.giros <= h.minimo);
  // Las tres capas del puntaje, y después cada etapa
  const lineas = [fmt(T.capas.etapas, { n: P.hechas.length, t: ETAPAS.length, p: r.base }),
    r.completa ? fmt(T.capas.rapidez, { t: mmss(ms), p: r.ptsVelocidad }) : fmt(T.capas.sinRapidez, { t: ETAPAS.length })];
  if (P.hechas.length) lineas.push(fmt(T.capas.giros, { g: r.giros, m: r.minimos, p: r.ptsGiros }));
  const capas = lineas.length;
  lineas.push(...P.hechas.map((h, k) => fmt(T.filaEtapa, { c: h.giros <= h.minimo ? '🟩' : '🟨', n: k + 1, g: h.giros, m: h.minimo })));
  if (P.reinicios) lineas.push(fmt(T.reinicios[P.reinicios === 1 ? 0 : 1], { n: P.reinicios }));
  const fin = crearTablero(t);
  fin.caja.classList.add('chico');
  if (motivo === 'completa') fin.caja.classList.add('resuelto');
  fin.poner(P.estado, false);
  // Para compartir: los giros de cada etapa contra su mínimo, sin delatar los tableros
  // Las etapas que faltaron también van, con ⬛ (no se ve si se rindió o se le acabó el tiempo)
  const tarjeta = ETAPAS.map((e, k) => { const h = P.hechas[k]; return h ? `${h.giros <= h.minimo ? '🟩' : '🟨'} ${k + 1}: ${h.giros}/${h.minimo}` : `⬛ ${k + 1}: —`; }).join('\n');
  vista.replaceChildren(el('div', { class: 'resultado' },
    fin.caja,
    el('p', { class: `sello-rt${motivo === 'completa' ? '' : ' mal'}` }, motivo === 'completa' ? (perfecto ? T.fin.perfecto : T.fin.listo) : T.finPor[motivo]),
    el('div', { class: 'score-big', id: 'puntaje' }, `${s}/100`),
    // Las capas del puntaje, y aparte (con aire) el detalle de cada etapa
    el('ul', { class: 'desglose muted', id: 'desglose' }, ...lineas.map((x, k) => el('li', { class: k === capas && k < lineas.length ? 'aparte' : '' }, x))),
    // Completas, el tiempo ya lo dice la rapidez (U-8)
    r.completa ? null : el('p', { class: 'lead', style: 'margin:0' }, fmt(T.tiempo, { t: mmss(ms) })),
    botonResultadoSolo({ C: COMMON.es, emoji: '🚇', juego: T.nombre, puntaje: `${s}/100`, tiempo: mmss(ms), tarjeta, url: `${SITIO}labs/routes/${enlace(SEMILLA_URL)}`, alTocar: () => SFX.tap() }),
    el('a', { class: 'btn btn--yellow', id: 'btn-otro', href: enlace(Math.random().toString(36).slice(2, 8)) }, T.otraVez),
    SEMILLA_URL ? el('a', { class: 'btn btn--ghost btn--sm', id: 'btn-de-hoy', href: location.pathname }, T.deHoy) : null,
    el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.laboratorio),
    // Una línea separa lo del juego del comentario para quienes lo prueban, como en Agentes
    el('hr', { class: 'divisor' }),
    formularioComentario({ T: T.comentario, contexto: contexto('resultado') })));
  scrollTo(0, 0);
}

document.getElementById('sound-slot').append(soundToggle());
initSound();
sparkles();
portada();
window.__rutas = { P, girar: r => { /* para las pruebas: un giro como si se arrastrara */ document.getElementById('tablero')?.dispatchEvent(new CustomEvent('girar', { detail: r })); } };

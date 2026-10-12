/**
 * Pintaminas — prototipo de laboratorio (D-289), inspirado en ColorSweeper (ARRKKA): un Buscaminas de
 * colores. Cada casilla se pinta (de un color que cambia con cada tablero) o no, y su número dice
 * cuántas de sus 8 vecinas son como ella; al pintarlo entero aparece un dibujo. Solo en español, para probar con amigos. Sin
 * `?seed=` es el tablero de hoy, el mismo para todos. El motor está en engine.js y los dibujos en
 * dibujos.js.
 */
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { COMMON, SITIO } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { fechaLocal } from '../../assets/js/uno-al-dia.js';
import { cuentaRegresiva } from '../../assets/js/cuenta-regresiva.js';
import { generar, estado, puntaje, tarjeta, numero, LADO, RESTA_ERROR } from './engine.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'pintaminas';
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLORSWEEPER = 'https://store.steampowered.com/app/3128730/ColorSweeper/';
const T = {
  nombre: 'Pintaminas',
  lema: 'Pinta la grilla y descubre el dibujo escondido. Cada número cuenta cuántas de sus vecinas son como ella: pintadas o no.',
  hoy: 'El tablero de hoy es el mismo para todos.',
  como: [
    ['🔢', 'Cada número dice cuántas de sus 8 vecinas son como ella: pintadas o sin pintar.'],
    ['🖌️', 'Elige «Pinta» o «No pinta» y toca una casilla. Si aciertas, aparece su número y te da más pistas.'],
    ['🧠', `Nunca hay que adivinar: todo se deduce. Cada error resta ${RESTA_ERROR}.`],
  ],
  empezar: '🖌️ Empezar', aJugar: '¡A pintar!',
  // Los pinceles (pedido del dueño): «Pinta» con el color del tablero, y «No pinta», gris como las que no se pintan
  tinta: 'Pinta {c}', fondo: 'No pinta', pincel: 'Pincel',
  errores: ['Sin errores', '1 error', '{n} errores'], quedan: 'Faltan {n}',
  mal: { 1: '❌ Se pintaba de {c}: −{pts}.', 0: '❌ No se pintaba: −{pts}.' },
  fin: { perfecto: '¡Perfecto!', listo: '¡Pintado!' }, era: '¡Era {d}!',
  desglose: ['Sin errores: 100 puntos.', ['1 error: −{pts}.', '{n} errores: −{pts}.']],
  tiempo: 'Tiempo: {t}.',
  otraVez: '🔁 Otro tablero', deHoy: '📅 El de hoy', laboratorio: '‹ Volver al laboratorio',
  comentarAbrir: '💬 Dejar un comentario',
  comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si se entendían los números, si en algún momento tuviste que adivinar y qué le cambiarías.', ph: 'Por ejemplo: al principio no sabía por dónde empezar.', nombre: 'Tu nombre (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', contexto: 'Lo que se envía junto', cancelar: 'Cancelar', cerrar: 'Cerrar' },
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const nErrores = n => (n === 0 ? T.errores[0] : n === 1 ? T.errores[1] : fmt(T.errores[2], { n }));

const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const params = new URLSearchParams(location.search);
const SEMILLA_URL = (params.get('seed') || '').trim();
const P = { semilla: '', t: null, jugadas: [], desde: 0, pincel: 1 };

function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, semilla: P.semilla, dibujo: P.t?.dibujo.nombre, jugadas: P.jugadas.length,
  url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

const tituloJuego = () => el('h1', { class: 'titulo-pm' },
  el('span', { class: 'brocha', 'aria-hidden': 'true' }, '🖌️'), el('span', { class: 'display display--lg rainbow' }, T.nombre));
/** De dónde viene el juego, con el link a su página (como Agentes con Codenames). */
const credito = () => el('p', { class: 'credito' }, 'Inspirado en ',
  el('a', { href: COLORSWEEPER, target: '_blank', rel: 'noopener', id: 'link-colorsweeper' }, 'ColorSweeper'), ', de ARRKKA.');

/** Una grilla de casillas (el tablero, la portada y el final usan la misma). */
function grilla(t, { conocidas = new Set(t.sol.keys()), numeros = true, clase = '' } = {}) {
  return el('div', { class: `grilla ${clase}`, style: `--tinta:${t.dibujo.color}` }, ...t.sol.map((k, i) => {
    const sabe = conocidas.has(i);
    return el('span', { class: `casilla${sabe ? (k ? ' tinta' : ' fondo') : ''}`, 'data-i': i, style: `--k:${i}` }, sabe && numeros ? String(numero(t.sol, i)) : '');
  }));
}

// La portada: un tablero chico que se va pintando solo hasta mostrar su dibujo, y vuelve a empezar
let demoVez = 0;
function portada() {
  const t = generar('portada-demo');
  const caja = el('div', { class: 'demo', 'aria-hidden': 'true' });
  vista.replaceChildren(...[
    el('div', { class: 'portada' }, tituloJuego(), el('p', { class: 'lead', style: 'margin:0' }, T.lema), credito(), caja),
    el('div', { class: 'panel' }, el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ico), el('span', {}, x))))),
    SEMILLA_URL ? null : el('p', { class: 'muted center', style: 'margin:0' }, `📅 ${T.hoy}`),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); empezar(); } }, T.empezar),
  ].filter(Boolean));
  pieComentario('portada');
  const vez = ++demoVez;
  const orden = [...t.dadas, ...t.sol.keys()].filter((i, k, a) => a.indexOf(i) === k);
  if (QUIETO) { caja.replaceChildren(grilla(t, { clase: 'chica' })); return; }
  let n = t.dadas.length;
  const paso = () => {
    if (vez !== demoVez || !caja.isConnected) return;
    caja.replaceChildren(grilla(t, { conocidas: new Set(orden.slice(0, n)), clase: `chica${n >= orden.length ? ' revelada' : ''}` }));
    n = n >= orden.length ? t.dadas.length : n + 1;
    setTimeout(paso, n === t.dadas.length ? 2600 : 90);
  };
  paso();
}

function empezar() {
  P.semilla = SEMILLA_URL || `dia:${fechaLocal()}`;
  P.t = generar(P.semilla);
  P.jugadas = [];
  P.pincel = 1;
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  // El 3, 2, 1 de La Copa (D-105): el tablero se arma con el "¡A pintar!", y el tiempo corre desde ahí
  vista.replaceChildren(); pie.replaceChildren();
  cuentaRegresiva({ titulo: '🖌️ Pintaminas', ya: T.aJugar }).then(() => { P.desde = Date.now(); jugar(); });
}

function jugar() {
  const { t } = P;
  const marcador = el('p', { class: 'marcador', id: 'marcador' });
  const aviso = el('p', { class: 'aviso-pm', 'aria-live': 'polite' }, '');
  const tablero = el('div', { class: 'grilla tablero', id: 'tablero', style: `--tinta:${t.dibujo.color}` });
  const casillas = t.sol.map((_, i) => el('button', { type: 'button', class: 'casilla', 'data-i': i, onClick: () => tocar(i) }));
  tablero.append(...casillas);
  const botonPincel = k => el('button', {
    type: 'button', class: `pincel pincel--${k ? 'tinta' : 'fondo'}`, id: k ? 'btn-tinta' : 'btn-fondo',
    style: `--tinta:${t.dibujo.color}`, onClick: () => { SFX.tap(); P.pincel = k; dibujar(); },
  }, k ? fmt(T.tinta, { c: t.dibujo.pintura }) : T.fondo);
  const pinceles = el('div', { class: 'pinceles', role: 'group', 'aria-label': T.pincel }, botonPincel(1), botonPincel(0));
  const dibujar = () => {
    const e = estado(t, P.jugadas);
    casillas.forEach((b, i) => {
      const sabe = e.conocidas.has(i), k = t.sol[i];
      b.className = 'casilla' + (sabe ? (k ? ' tinta' : ' fondo') : '') + (e.errores.has(i) ? ' error' : '');
      b.textContent = sabe ? String(numero(t.sol, i)) : '';
      b.disabled = sabe || e.fin;
      b.setAttribute('aria-label', sabe ? `${k ? `pintada de ${t.dibujo.pintura}` : 'sin pintar'}, ${numero(t.sol, i)}` : 'por descubrir');
    });
    pinceles.querySelectorAll('.pincel').forEach((b, k) => b.setAttribute('aria-pressed', String((1 - k) === P.pincel)));
    marcador.textContent = `${nErrores(e.errores.size)} · ${fmt(T.quedan, { n: t.sol.length - e.conocidas.size })}`;
    return e;
  };
  const tocar = i => {
    const e0 = estado(t, P.jugadas);
    if (e0.fin || e0.conocidas.has(i)) return;
    P.jugadas.push({ i, color: P.pincel });
    const e = dibujar();
    const b = casillas[i];
    if (e.errores.has(i)) {
      SFX.error(); vibrate([60, 40, 60]);
      aviso.className = 'aviso-pm mal'; aviso.textContent = fmt(T.mal[t.sol[i]], { pts: RESTA_ERROR, c: t.dibujo.pintura });
      b.classList.add('shake');
    } else {
      SFX.letterHit(); vibrate(12);
      aviso.className = 'aviso-pm'; aviso.textContent = '';
      if (!QUIETO) b.classList.add('pop');
    }
    if (e.fin) revelar(e);
  };
  // Al terminar: los números se van, el fondo se apaga, la tinta brilla y se dice qué era
  const revelar = e => {
    tablero.classList.add('revelada');
    pinceles.remove();
    aviso.className = 'aviso-pm era'; aviso.textContent = `${t.dibujo.emoji} ${fmt(T.era, { d: t.dibujo.nombre.toLowerCase() })}`;
    SFX.reveal();
    setTimeout(() => resultado(e), QUIETO ? 600 : 2200);
  };
  vista.replaceChildren(tituloJuego(), marcador, tablero, aviso, pinceles);
  dibujar();
  pieComentario('juego');
}

function resultado(e) {
  const { t } = P;
  const s = puntaje(e), ms = Date.now() - P.desde;
  trackFinish({ detalle: `${s}/100 · ${e.errores.size} errores · ${t.dibujo.nombre} · ${mmss(ms)}` });
  SFX.win();
  if (!QUIETO && s >= 70) confetti({ count: 160, duration: 2400 });
  pie.replaceChildren();
  const n = e.errores.size;
  const lineas = [n === 0 ? T.desglose[0] : fmt(T.desglose[1][n === 1 ? 0 : 1], { n, pts: Math.min(100, RESTA_ERROR * n) })];
  vista.replaceChildren(el('div', { class: 'resultado' },
    el('div', { class: 'dibujo-fin' }, grilla(t, { numeros: false, clase: 'revelada fin' })),
    el('h2', { class: 'display display--lg', style: 'margin:0' }, `${t.dibujo.emoji} ${t.dibujo.nombre}`),
    el('p', { class: 'sello-pm' }, n === 0 ? T.fin.perfecto : T.fin.listo),
    el('div', { class: 'score-big', id: 'puntaje' }, `${s}/100`),
    el('ul', { class: 'desglose muted' }, ...lineas.map(x => el('li', {}, x))),
    el('p', { class: 'lead', style: 'margin:0' }, fmt(T.tiempo, { t: mmss(ms) })),
    botonResultadoSolo({ C: COMMON.es, emoji: '🖌️', juego: T.nombre, puntaje: `${s}/100`, tiempo: mmss(ms), tarjeta: tarjeta(t, e), url: `${SITIO}labs/paint-mines/${SEMILLA_URL ? `?seed=${encodeURIComponent(SEMILLA_URL)}` : ''}`, alTocar: () => SFX.tap() }),
    el('a', { class: 'btn btn--yellow', id: 'btn-otro', href: `?seed=${Math.random().toString(36).slice(2, 8)}` }, T.otraVez),
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
window.__pintaminas = { P, estado: () => (P.t ? estado(P.t, P.jugadas) : null) };

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
import { generar, estado, puntaje, maximo, tarjeta, numero, ayuda, RESTA_ERROR, RESTA_AYUDA, PREMIO_DIFICIL } from './engine.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'pintaminas';
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLORSWEEPER = 'https://store.steampowered.com/app/3128730/ColorSweeper/';
const T = {
  nombre: 'Pintaminas',
  lema: 'Pinta la grilla y descubre el dibujo escondido.',  // la regla de los números la dice el paso 1 (U-8)
  hoy: 'El tablero de hoy es el mismo para todos.',
  como: [
    ['🔢', 'Cada número dice cuántas de sus 8 vecinas son como ella: pintadas o sin pintar.'],
    ['🖌️', 'Elige «Pinta» o «No pinta» y toca una casilla. Si aciertas, aparece su número y te da más pistas.'],
    ['🧠', `Nunca hay que adivinar: todo se deduce. Cada error resta ${RESTA_ERROR}.`],
  ],
  empezar: '🖌️ Empezar', aJugar: '¡A pintar!',
  // El modo difícil: un interruptor de palanca que al activarse se electrifica (pedido del dueño)
  dificil: 'Modo difícil', dificilEstado: ['Apagado', 'Encendido'], dificilSub: 'Dos colores · puntaje ×{x}', dificilJuego: '⚡ Modo difícil ×{x}',
  // Los pinceles (pedido del dueño): «Pinta» con el color del tablero, y «No pinta», gris como las que no se pintan
  tinta: 'Pinta {c}', fondo: 'No pinta', pincel: 'Pincel',
  errores: ['Sin errores', '1 error', '{n} errores'], quedan: 'Faltan {n}',
  // La ayuda (D-292): señala una casilla que se puede deducir y los números que lo explican, sin decir el color
  ayuda: '💡 Ayuda (−{pts})', ayudaDice: '💡 La casilla que late se deduce de los números marcados.', ayudas: ['💡 1 ayuda: −{pts}.', '💡 {n} ayudas: −{pts}.'],
  mal: { 1: '❌ Se pintaba de {c}: −{pts}.', 0: '❌ No se pintaba: −{pts}.' },
  fin: { perfecto: '¡Perfecto!', listo: '¡Pintado!' }, era: '¡Era {d}!',
  desglose: ['Sin errores: 100 puntos.', ['1 error: −{pts}.', '{n} errores: −{pts}.']], desglosePremio: '⚡ Modo difícil: ×{x}.',
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
// El modo difícil viene en el link (?colors=2) o lo deja el interruptor; el celular lo recuerda
const GUARDADO = 'juegos-de-salon:pintaminas:dificil';
const leerDificil = () => { try { return localStorage.getItem(GUARDADO) === '1'; } catch { return false; } };
const P = { semilla: '', t: null, jugadas: [], desde: 0, pincel: 1, dificil: params.get('colors') === '2' || (!params.has('colors') && leerDificil()) };
const colores = () => (P.dificil ? 2 : 1);

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

/** Los colores del tablero, como variables (--p1, --p2) para las casillas y los pinceles. */
const estiloPinturas = t => t.dibujo.pinturas.map((p, k) => `--p${k + 1}:${p.color}`).join(';');
const claseColor = k => (k ? ` tinta p${k}` : ' fondo');
/** Una grilla de casillas (el tablero, la portada y el final usan la misma). */
function grilla(t, { conocidas = new Set(t.sol.keys()), numeros = true, clase = '' } = {}) {
  return el('div', { class: `grilla ${clase}`, style: estiloPinturas(t) }, ...t.sol.map((k, i) => {
    const sabe = conocidas.has(i);
    return el('span', { class: `casilla${sabe ? claseColor(k) : ''}`, 'data-i': i, style: `--k:${i}` }, sabe && numeros ? String(numero(t.sol, i)) : '');
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
    interruptor(),
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

/**
 * El interruptor del modo difícil: una palanca sobre una placa. Al subirla, la placa se electrifica
 * (chispas y un brillo que titila) y el juego pasa a dos colores con el puntaje ×1.5.
 */
function interruptor() {
  // Lo que dice si está encendido: la palanca sola no lo deja claro
  const estado = el('span', { class: 'estado', 'aria-hidden': 'true' }, T.dificilEstado[+P.dificil]);
  const caja = el('button', {
    type: 'button', class: `interruptor${P.dificil ? ' on' : ''}`, id: 'btn-dificil', role: 'switch', 'aria-checked': String(P.dificil),
    onClick: () => {
      P.dificil = !P.dificil;
      try { localStorage.setItem(GUARDADO, P.dificil ? '1' : '0'); } catch { /* sin almacenamiento: solo esta vez */ }
      caja.classList.toggle('on', P.dificil); caja.setAttribute('aria-checked', String(P.dificil));
      estado.textContent = T.dificilEstado[+P.dificil];
      if (P.dificil) { SFX.error(); vibrate([15, 30, 15, 30, 40]); caja.classList.remove('chispa'); void caja.offsetWidth; caja.classList.add('chispa'); parpadear(caja); }
      else { SFX.tap(); vibrate(10); }
    },
  },
  el('span', { class: 'placa', 'aria-hidden': 'true' },
    el('span', { class: 'rayo r1' }, '⚡'), el('span', { class: 'rayo r2' }, '⚡'), el('span', { class: 'rayo r3' }, '⚡'),
    el('span', { class: 'palanca' }, el('span', { class: 'mango' })), el('span', { class: 'eje' })),
  el('span', { class: 'rotulo' }, el('b', {}, `⚡ ${T.dificil}`), el('span', { class: 'muted' }, fmt(T.dificilSub, { x: PREMIO_DIFICIL })), estado));
  if (P.dificil) parpadear(caja);
  return caja;
}

/**
 * Mientras el modo difícil está encendido, el brillo del interruptor sube y baja a destiempo: a veces
 * se sostiene, a veces da una ráfaga de chispazos, a veces casi se apaga (pedido del dueño). Con
 * movimiento reducido queda encendido y quieto.
 */
let parpadeoVez = 0;
function parpadear(caja) {
  const vez = ++parpadeoVez;
  if (QUIETO) return;
  const paso = () => {
    if (vez !== parpadeoVez || !caja.isConnected || !P.dificil) { caja.style.removeProperty('--brillo'); return; }
    const r = Math.random();
    // Casi siempre encendido; de vez en cuando un bajón o una ráfaga corta
    const brillo = r < 0.12 ? 0.05 + Math.random() * 0.2 : r < 0.3 ? 1 : 0.45 + Math.random() * 0.45;
    caja.style.setProperty('--brillo', brillo.toFixed(2));
    const espera = r < 0.3 ? 40 + Math.random() * 90 : 120 + Math.random() * 900;
    setTimeout(paso, espera);
  };
  // Parte en el cuadro siguiente: al cargar la portada, el interruptor todavía no está en la página
  setTimeout(paso, 30);
}

function empezar() {
  P.semilla = SEMILLA_URL || `dia:${fechaLocal()}`;
  P.t = generar(P.semilla, { colores: colores() });
  P.jugadas = [];
  P.pincel = 1;
  trackStart({ game: GAME_ID, mode: P.dificil ? 'dificil' : 'solo', players: 1 });
  // El 3, 2, 1 de La Copa (D-105): el tablero se arma con el "¡A pintar!", y el tiempo corre desde ahí
  vista.replaceChildren(); pie.replaceChildren();
  cuentaRegresiva({ titulo: '🖌️ Pintaminas', ya: T.aJugar }).then(() => { P.desde = Date.now(); jugar(); });
}

function jugar() {
  const { t } = P;
  const marcador = el('p', { class: 'marcador', id: 'marcador' });
  const aviso = el('p', { class: 'aviso-pm', 'aria-live': 'polite' }, '');
  const tablero = el('div', { class: `grilla tablero${t.colores === 2 ? ' dificil' : ''}`, id: 'tablero', style: estiloPinturas(t) });
  const casillas = t.sol.map((_, i) => el('button', { type: 'button', class: 'casilla', 'data-i': i, onClick: () => tocar(i) }));
  tablero.append(...casillas);
  // Un pincel por color, y «No pinta» al final
  const botonPincel = k => el('button', {
    type: 'button', class: `pincel ${k ? `pincel--tinta p${k}` : 'pincel--fondo'}`, id: k ? (k === 1 ? 'btn-tinta' : `btn-tinta${k}`) : 'btn-fondo', 'data-k': k,
    onClick: () => { SFX.tap(); P.pincel = k; dibujar(); },
  }, k ? fmt(T.tinta, { c: t.dibujo.pinturas[k - 1].nombre }) : T.fondo);
  const pinceles = el('div', { class: `pinceles${t.colores === 2 ? ' tres' : ''}`, role: 'group', 'aria-label': T.pincel, style: estiloPinturas(t) },
    ...[...t.dibujo.pinturas.keys()].map(k => botonPincel(k + 1)), botonPincel(0));
  const botonAyuda = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-ayuda', onClick: () => pedirAyuda() }, fmt(T.ayuda, { pts: RESTA_AYUDA }));
  const dibujar = () => {
    const e = estado(t, P.jugadas);
    casillas.forEach((b, i) => {
      const sabe = e.conocidas.has(i), k = t.sol[i];
      b.className = 'casilla' + (sabe ? claseColor(k) : '') + (e.errores.has(i) ? ' error' : '');
      b.textContent = sabe ? String(numero(t.sol, i)) : '';
      b.disabled = sabe || e.fin;
      b.setAttribute('aria-label', sabe ? `${k ? `pintada de ${t.dibujo.pinturas[k - 1].nombre}` : 'sin pintar'}, ${numero(t.sol, i)}` : 'por descubrir');
    });
    pinceles.querySelectorAll('.pincel').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.k === P.pincel)));
    // Cada parte entera en su línea: a 320 px no se corta «Faltan 23» en dos
    const partes = [t.colores === 2 ? fmt(T.dificilJuego, { x: PREMIO_DIFICIL }) : null, nErrores(e.errores.size), fmt(T.quedan, { n: t.sol.length - e.conocidas.size })].filter(Boolean);
    marcador.replaceChildren(...partes.flatMap((x, j) => [j ? ' · ' : '', el('span', { class: 'parte' }, x)]));
    return e;
  };
  // La ayuda: marca la casilla que se puede deducir y los números que la explican, y resta
  const pedirAyuda = () => {
    const e0 = estado(t, P.jugadas);
    if (e0.fin) return;
    const a = ayuda(t.sol, e0.conocidas);
    if (!a) return;
    SFX.tap(); vibrate(10);
    P.jugadas.push({ ayuda: true });
    dibujar();
    casillas[a.celda].classList.add('pista-objetivo');
    for (const i of a.por) casillas[i].classList.add('pista-razon');
    aviso.className = 'aviso-pm ayuda'; aviso.textContent = T.ayudaDice;
  };
  const tocar = i => {
    const e0 = estado(t, P.jugadas);
    if (e0.fin || e0.conocidas.has(i)) return;
    P.jugadas.push({ i, color: P.pincel });
    const e = dibujar();
    const b = casillas[i];
    if (e.errores.has(i)) {
      SFX.error(); vibrate([60, 40, 60]);
      aviso.className = 'aviso-pm mal'; aviso.textContent = fmt(T.mal[t.sol[i] ? 1 : 0], { pts: RESTA_ERROR, c: t.sol[i] ? t.dibujo.pinturas[t.sol[i] - 1].nombre : '' });
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
    pinceles.remove(); botonAyuda.remove();
    aviso.className = 'aviso-pm era'; aviso.textContent = `${t.dibujo.emoji} ${fmt(T.era, { d: t.dibujo.nombre.toLowerCase() })}`;
    SFX.reveal();
    setTimeout(() => resultado(e), QUIETO ? 600 : 2200);
  };
  vista.replaceChildren(tituloJuego(), marcador, tablero, aviso, pinceles, botonAyuda);
  dibujar();
  pieComentario('juego');
}

/** El link de un tablero: su semilla y, si es difícil, `colors=2`. */
const enlace = semilla => {
  const q = new URLSearchParams();
  if (semilla) q.set('seed', semilla);
  if (P.t?.colores === 2) q.set('colors', '2');
  return q.toString() ? `?${q}` : '';
};

function resultado(e) {
  const { t } = P;
  const s = puntaje(e, { colores: t.colores }), max = maximo(t.colores), ms = Date.now() - P.desde;
  trackFinish({ detalle: `${s}/${max}${t.colores === 2 ? ' · difícil' : ''} · ${e.errores.size} errores · ${e.ayudas} ayudas · ${t.dibujo.nombre} · ${mmss(ms)}` });
  SFX.win();
  if (!QUIETO && s >= 0.7 * max) confetti({ count: 160, duration: 2400 });
  pie.replaceChildren();
  const n = e.errores.size;
  const lineas = [n === 0 ? T.desglose[0] : fmt(T.desglose[1][n === 1 ? 0 : 1], { n, pts: Math.min(100, RESTA_ERROR * n) })];
  if (e.ayudas) lineas.push(fmt(T.ayudas[e.ayudas === 1 ? 0 : 1], { n: e.ayudas, pts: RESTA_AYUDA * e.ayudas }));
  if (t.colores === 2) lineas.push(fmt(T.desglosePremio, { x: PREMIO_DIFICIL }));
  vista.replaceChildren(el('div', { class: 'resultado' },
    el('div', { class: 'dibujo-fin' }, grilla(t, { numeros: false, clase: 'revelada fin' })),
    el('h2', { class: 'display display--lg', style: 'margin:0' }, `${t.dibujo.emoji} ${t.dibujo.nombre}`),
    // ¡Perfecto! es sin errores y sin ayudas: con una ayuda no es perfecto (U-1)
    el('p', { class: 'sello-pm' }, n === 0 && !e.ayudas ? T.fin.perfecto : T.fin.listo),
    el('div', { class: 'score-big', id: 'puntaje' }, `${s}/${max}`),
    el('ul', { class: 'desglose muted' }, ...lineas.map(x => el('li', {}, x))),
    el('p', { class: 'lead', style: 'margin:0' }, fmt(T.tiempo, { t: mmss(ms) })),
    botonResultadoSolo({ C: COMMON.es, emoji: '🖌️', juego: T.nombre, puntaje: `${s}/${max}`, tiempo: mmss(ms), tarjeta: tarjeta(t, e), url: `${SITIO}labs/paint-mines/${enlace(SEMILLA_URL)}`, alTocar: () => SFX.tap() }),
    el('a', { class: 'btn btn--yellow', id: 'btn-otro', href: enlace(Math.random().toString(36).slice(2, 8)) || '?' }, T.otraVez),
    SEMILLA_URL ? el('a', { class: 'btn btn--ghost btn--sm', id: 'btn-de-hoy', href: location.pathname + enlace('') }, T.deHoy) : null,
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

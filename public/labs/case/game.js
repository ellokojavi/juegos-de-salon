/**
 * El caso — la pantalla del prototipo de laboratorio (D-256). Solo en español: es para que lo
 * prueben amigos antes de decidir si entra como juego (y ahí van los cuatro idiomas, C-3).
 *
 * Sin `?c=` es el caso del día (el mismo para todos ese día); con `?c=CODIGO`, ese caso. Lo jugado
 * se guarda por caso en el celular (C-6): marcas, equivocaciones, tiempo y pistas tachadas.
 */
import { $, el, vibrate, sparkles, confetti, keepAwake } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { compartir, cabecera } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { fechaLocal } from '../../assets/js/uno-al-dia.js';
import { N, COLS, FILAS, LETRAS_COL, coord, generar, estado, marcar, semillaDelDia } from './engine.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'caso';
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const params = new URLSearchParams(location.search);
const codigo = (params.get('c') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
const hoy = fechaLocal();
const semilla = codigo || semillaDelDia(hoy);
const caso = generar(semilla);
const CLAVE = `juegos-de-salon:${GAME_ID}:${semilla}`;

const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const fechaBonita = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
const nombreCaso = codigo ? `Caso ${codigo}` : `Caso del ${fechaBonita(hoy)}`;

/* ---------- La partida guardada (C-6) ---------- */
function cargar() {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE));
    if (g && Array.isArray(g.marcas)) return { marcas: g.marcas, errores: g.errores || [], ms: g.ms || 0, tachadas: g.tachadas || [], done: !!g.done, empezo: !!g.empezo };
  } catch (_) { /* sin memoria, de cero */ }
  return { marcas: [], errores: [], ms: 0, tachadas: [], done: false, empezo: false };
}
const P = cargar();
const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(P)); } catch (_) { /* sin memoria igual se juega */ } };

/* ---------- El reloj: solo corre con la página a la vista ---------- */
let desde = null;
const correr = () => { if (!P.done && desde === null && document.visibilityState === 'visible') desde = Date.now(); };
const parar = () => { if (desde !== null) { P.ms += Date.now() - desde; desde = null; guardar(); } };
const tiempo = () => P.ms + (desde !== null ? Date.now() - desde : 0);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') correr(); else parar(); });

let elegida = null;   // la celda tocada
let mensaje = null;   // { tipo, texto } de la última marca
let nuevas = [];      // las pistas que acaban de aparecer, para destacarlas

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
function render() {
  const e = estado(caso, P.marcas);
  renderMarcador();
  renderGrilla(e);
  renderAccion(e);
  renderPistas(e);
  if (e.terminado) renderFin();
}

function renderMarcador() {
  $('#marcador').replaceChildren(
    el('span', {}, '✅ ', el('b', {}, `${P.marcas.length + 1}/${N}`)),
    el('span', {}, '✕ ', el('b', { id: 'errores' }, P.errores.length), P.errores.length === 1 ? ' error' : ' errores'),
    el('span', {}, '⏱ ', el('b', { id: 'reloj' }, mmss(tiempo()))),
  );
}

function renderGrilla(e) {
  const g = $('#grilla');
  g.replaceChildren(el('span', {}), ...LETRAS_COL.map(l => el('span', { class: 'etq' }, l)));
  for (let f = 0; f < FILAS; f++) {
    g.append(el('span', { class: 'etq' }, f + 1));
    for (let c = 0; c < COLS; c++) {
      const i = f * COLS + c;
      const sabe = e.x[i] !== -1;
      const of = caso.oficios.find(o => o.id === caso.oficioDe[i]);
      const clases = ['persona', sabe ? (e.x[i] ? 'criminal' : 'inocente') : '', sabe ? 'marcada' : '', elegida === i ? 'elegida' : '', P.errores.includes(i) ? 'equivoco' : ''];
      g.append(el('button', {
        class: clases.filter(Boolean).join(' '), 'data-i': i, disabled: P.done && !sabe,
        'aria-label': `${caso.nombres[i]}, ${of.uno}, ${coord(i)}${sabe ? (e.x[i] ? ', criminal' : ', inocente') : ''}`,
        onClick: ev => { ev.stopPropagation(); tocar(i, sabe); },
      },
      el('span', { class: 'emo' }, sabe ? (e.x[i] ? '🔪' : '😇') : of.emoji),
      el('span', { class: 'nom' }, caso.nombres[i]),
      el('span', { class: 'ofi' }, of.uno),
      sabe ? el('span', { class: 'dice', 'aria-hidden': 'true' }, '💬') : null));
    }
  }
}

function renderAccion(e) {
  const box = $('#accion');
  box.replaceChildren();
  if (e.terminado) return;
  if (elegida !== null && e.x[elegida] === -1) {
    const n = caso.nombres[elegida];
    // Lo que pasó al intentar marcarla (un error, o que todavía no se puede saber) queda arriba (C-8b)
    if (mensaje) box.append(el('p', { class: `msg ${mensaje.tipo}` }, mensaje.texto));
    // El botón dice sobre quién actúa (C-8): "😇 Ana es inocente"
    box.append(el('div', { class: 'btn-row' },
      el('button', { class: 'btn marca-inocente', id: 'btn-inocente', onClick: ev => { ev.stopPropagation(); intentar(0); } }, `😇 ${n} es inocente`),
      el('button', { class: 'btn marca-criminal', id: 'btn-criminal', onClick: ev => { ev.stopPropagation(); intentar(1); } }, `🔪 ${n} es criminal`)));
  } else if (mensaje) {
    box.append(el('p', { class: `msg ${mensaje.tipo}` }, mensaje.texto));
  } else {
    box.append(el('p', { class: 'msg' }, 'Toca a alguien para marcarlo.'));
  }
}

function renderPistas(e) {
  // La más nueva arriba: el orden en que se fueron sabiendo, al revés
  const orden = [caso.inicio, ...P.marcas].reverse();
  $('#pistas').replaceChildren(el('h2', {}, `💬 Pistas (${orden.length})`), ...orden.map(i => el('button', {
    class: 'pista' + (nuevas.includes(i) ? ' nueva' : '') + (P.tachadas.includes(i) ? ' tachada' : ''),
    'data-de': i, title: 'Toca para tacharla cuando ya la usaste',
    onClick: ev => {
      ev.stopPropagation();
      P.tachadas = P.tachadas.includes(i) ? P.tachadas.filter(x => x !== i) : [...P.tachadas, i];
      guardar(); SFX.tap(); renderPistas(estado(caso, P.marcas));
    },
  }, el('span', { class: 'de' }, `${caso.nombres[i]}:`), el('span', {}, caso.pistas[i].texto))));
}

/* ------------------------------------------------------------------ */
/* Jugadas                                                             */
/* ------------------------------------------------------------------ */
function tocar(i, sabe) {
  if (P.done) return;
  correr();
  if (sabe) {
    // Tocar a alguien que ya se sabe lleva a su pista
    const p = document.querySelector(`.pista[data-de="${i}"]`);
    if (p) { p.scrollIntoView({ behavior: 'smooth', block: 'center' }); p.classList.add('nueva'); setTimeout(() => p.classList.remove('nueva'), 1200); }
    return;
  }
  elegida = elegida === i ? null : i;
  mensaje = null;
  SFX.tap(); vibrate(10);
  render();
}

function intentar(valor) {
  const i = elegida;
  if (i === null) return;
  if (!P.empezo) { P.empezo = true; trackStart({ game: GAME_ID, mode: 'solo', players: 1 }); }
  const n = caso.nombres[i];
  const r = marcar(caso, P.marcas, i, valor);
  if (r === 'falta') {
    mensaje = { tipo: 'falta', texto: `Con las pistas que hay, todavía no se puede saber qué es ${n}.` };
    SFX.error(); vibrate([20, 30, 20]);
  } else if (r === 'error') {
    if (!P.errores.includes(i)) P.errores.push(i);
    mensaje = { tipo: 'error', texto: `${n} no es ${valor ? 'criminal' : 'inocente'}. Revisa las pistas.` };
    SFX.letterMiss(); vibrate([40, 40, 40]);
    const card = document.querySelector(`.persona[data-i="${i}"]`);
    card?.classList.remove('sacude'); void card?.offsetWidth; card?.classList.add('sacude');
    guardar();
    renderMarcador(); renderAccion(estado(caso, P.marcas));
    return;
  } else if (r === 'ok') {
    P.marcas.push(i);
    nuevas = [i];
    elegida = null;
    mensaje = { tipo: 'ok', texto: `¡Bien! ${n} es ${valor ? 'criminal' : 'inocente'}, y dio su pista.` };
    SFX.letterHit(); vibrate(25);
    if (estado(caso, P.marcas).terminado) { parar(); P.done = true; }
  }
  guardar();
  render();
}

/* ------------------------------------------------------------------ */
/* El final                                                            */
/* ------------------------------------------------------------------ */
/** La tarjeta para compartir: una fila de cuadrados por fila de la grilla; rojo donde hubo error. */
const tarjeta = () => Array.from({ length: FILAS }, (_, f) => Array.from({ length: COLS }, (_, c) => (P.errores.includes(f * COLS + c) ? '🟥' : '🟩')).join('')).join('\n');
const textoErrores = n => (n === 0 ? 'sin errores' : n === 1 ? 'con 1 error' : `con ${n} errores`);

let celebrado = false;
function renderFin() {
  const box = $('#fin');
  box.hidden = false;
  const url = codigo ? `${location.origin}${location.pathname}?c=${codigo}` : `${location.origin}${location.pathname}`;
  box.replaceChildren(
    el('div', { class: 'trofeo' }, P.errores.length ? '🔍' : '🏆'),
    el('h2', { class: 'display display--lg' }, '¡Caso resuelto!'),
    el('p', { class: 'resumen' }, `${textoErrores(P.errores.length)[0].toUpperCase()}${textoErrores(P.errores.length).slice(1)}, en ${mmss(P.ms)}.`),
    el('div', { class: 'tarjeta', 'aria-hidden': 'true' }, ...tarjeta().split('\n').map(r => el('div', {}, r))),
    el('button', {
      class: 'btn btn--cyan', id: 'btn-compartir',
      onClick: async e => {
        SFX.tap();
        const texto = [cabecera({ emoji: '🔍', titulo: 'El caso', contexto: nombreCaso }), `Resuelto ${textoErrores(P.errores.length)} en ${mmss(P.ms)}.`, tarjeta(), '¿Lo resuelves con menos errores?'].join('\n\n');
        const r = await compartir({ titulo: 'El caso', texto, url });
        if (r === 'copied') { e.target.textContent = '✅ Copiado'; setTimeout(() => { e.target.textContent = '📤 Compartir el resultado'; }, 2500); }
      },
    }, '📤 Compartir el resultado'),
    el('a', { class: 'btn btn--yellow', id: 'btn-otro', href: `?c=${Array.from({ length: 5 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('')}` }, '🔍 Otro caso'),
    codigo ? el('a', { class: 'btn btn--ghost', href: location.pathname }, '📅 El caso del día') : null,
    el('a', { class: 'btn btn--ghost', href: '../' }, '‹ Volver al laboratorio'),
  );
  if (!celebrado) {
    celebrado = true;
    if (!P.reportado) { P.reportado = true; guardar(); trackFinish({ detalle: `${nombreCaso} · ${P.errores.length} errores · ${mmss(P.ms)}` }); }
    SFX.win(); confetti({ count: 200, duration: 3000 });
    setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }
}

/* ------------------------------------------------------------------ */
/* Arranque                                                            */
/* ------------------------------------------------------------------ */
$('#caso-nombre').textContent = nombreCaso;
$('#sound-slot').append(soundToggle());
initSound();
sparkles(8);
keepAwake();
// Un toque fuera suelta a la persona elegida (C-8)
document.addEventListener('click', e => { if (elegida !== null && !e.target.closest('.persona, .accion')) { elegida = null; render(); } });
correr();
render();
setInterval(() => { const r = document.getElementById('reloj'); if (r && !P.done) r.textContent = mmss(tiempo()); }, 1000);

// Ventana al estado para las pruebas (C-14)
window.__caso = { caso: () => caso, partida: () => P, estado: () => estado(caso, P.marcas) };

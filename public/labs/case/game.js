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
// `?dia=AAAA-MM-DD`: el caso de ese día, para que el link compartido abra el mismo caso al día siguiente (#273)
const diaLink = /^\d{4}-\d{2}-\d{2}$/.test(params.get('dia') || '') ? params.get('dia') : null;
const hoy = diaLink || fechaLocal();
const semilla = codigo || semillaDelDia(hoy);
const caso = generar(semilla);
// v2: desde D-259 el prototipo usa el motor de La Copa y el caso de una semilla cambió; lo guardado antes es de otro caso
const CLAVE = `juegos-de-salon:${GAME_ID}:v2:${semilla}`;

const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const fechaBonita = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
const nombreCaso = codigo ? `Caso ${codigo}` : `Caso del ${fechaBonita(hoy)}`;

/* ---------- La partida guardada (C-6) ---------- */
function cargar() {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE));
    if (g && Array.isArray(g.marcas)) return { marcas: g.marcas, errores: g.errores || [], ms: g.ms || 0, tachadas: g.tachadas || [], done: !!g.done, empezo: !!g.empezo, reportado: !!g.reportado };
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
let nuevas = [];      // la pista que acaba de aparecer, para que entre animada

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
/**
 * La grilla se arma una sola vez y después solo cambian sus clases: así el zoom de la elegida, el
 * sello de un acierto y la sacudida de un error se animan, en vez de redibujarse de golpe.
 */
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cartas = [];
let foco = null;      // la pista tocada: ilumina en la grilla a las personas de las que habla

function armarGrilla() {
  const g = $('#grilla');
  g.replaceChildren(el('span', {}), ...LETRAS_COL.map(l => el('span', { class: 'etq' }, l)));
  for (let f = 0; f < FILAS; f++) {
    g.append(el('span', { class: 'etq' }, f + 1));
    for (let c = 0; c < COLS; c++) {
      const i = f * COLS + c;
      const of = caso.oficios.find(o => o.id === caso.oficioDe[i]);
      const emo = el('span', { class: 'emo' }, of.emoji);
      const carta = el('button', {
        class: 'persona', 'data-i': i, onClick: ev => { ev.stopPropagation(); tocar(i); },
      }, el('span', { class: 'giro' },
        el('span', { class: 'cara frente' }, emo, el('span', { class: 'nom' }, caso.nombres[i]), el('span', { class: 'ofi' }, of.uno),
          el('span', { class: 'dice', 'aria-hidden': 'true' }, '💬')),
        el('span', { class: 'cara dorso', 'aria-hidden': 'true' }, '🔍')));
      carta.emo = emo; carta.oficio = of;
      cartas[i] = carta;
      g.append(carta);
    }
  }
}

/**
 * "Girar para descubrir": al abrir, las cartas parten de espaldas y se dan vuelta en ola.
 * Devuelve cuánto dura (ms), para que el reloj parta cuando ya se ven todas (U-20).
 */
function descubrir() {
  if (QUIETO) return 0;
  cartas.forEach(c => c.classList.add('tapada'));
  void $('#grilla').offsetWidth;
  const paso = i => 250 + (Math.floor(i / COLS) + (i % COLS)) * 90;
  cartas.forEach((c, i) => setTimeout(() => {
    c.classList.remove('tapada');
    if (i % 4 === 0) SFX.tap();
  }, paso(i)));
  return paso(N - 1) + 550;   // la última carta empieza a girar, más lo que dura el giro
}

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
  const p = foco !== null ? caso.pistas[foco] : null;
  const enFoco = new Set(p ? [...p.a, ...(p.b || [])] : []);
  $('#grilla').classList.toggle('enfoque', !!p);
  cartas.forEach((carta, i) => {
    const sabe = e.x[i] !== -1;
    const t = carta.classList;
    t.toggle('inocente', sabe && !e.x[i]);
    t.toggle('criminal', sabe && !!e.x[i]);
    t.toggle('marcada', sabe);
    t.toggle('elegida', elegida === i);
    t.toggle('equivoco', P.errores.includes(i));
    t.toggle('foco', enFoco.has(i));
    t.toggle('habla', foco === i);
    carta.disabled = P.done && !sabe;
    carta.emo.textContent = sabe ? (e.x[i] ? '🔪' : '😇') : carta.oficio.emoji;
    carta.setAttribute('aria-label', `${caso.nombres[i]}, ${carta.oficio.uno}, ${coord(i)}${sabe ? (e.x[i] ? ', criminal' : ', inocente') : ''}`);
    carta.setAttribute('aria-pressed', String(elegida === i));
  });
}

/** Un sello que cae sobre la carta: 😇 o 🔪 si acertó, ❌ si no. */
function sellar(i, emoji, clase) {
  const carta = cartas[i];
  if (!carta) return;
  carta.classList.remove('acierto', 'fallo');
  void carta.offsetWidth;
  carta.classList.add(clase);
  if (QUIETO) return;
  const sello = el('span', { class: 'sello', 'aria-hidden': 'true' }, emoji);
  carta.append(sello);
  setTimeout(() => { sello.remove(); carta.classList.remove(clase); }, 900);
}

/** El texto de una pista con quien la dice, como se muestra bajo la grilla. */
const dice = i => `${caso.nombres[i]} es ${caso.v[i] ? 'criminal' : 'inocente'} y dice: «${caso.pistas[i].texto}»`;

function renderAccion(e) {
  const box = $('#accion');
  box.replaceChildren();
  if (e.terminado) return;
  // Un mensaje con pista se puede tocar para iluminar a quiénes nombra
  const msg = m => el('button', {
    class: `msg ${m.tipo}${m.de !== undefined && foco === m.de ? ' activa' : ''}`, type: 'button',
    onClick: ev => { ev.stopPropagation(); if (m.de !== undefined) enfocar(m.de); },
  }, m.texto, m.de !== undefined ? el('span', { class: 'ver' }, foco === m.de ? '👁 Volver a ver a todos' : '👁 Ver a quiénes nombra') : null);
  if (elegida !== null && e.x[elegida] === -1) {
    const n = caso.nombres[elegida];
    // Lo que pasó al intentar marcarla (un error, o que todavía no se puede saber) queda arriba (C-8b)
    if (mensaje) box.append(msg(mensaje));
    // El botón dice sobre quién actúa (C-8): "😇 Ana es inocente"
    box.append(el('div', { class: 'btn-row' },
      el('button', { class: 'btn marca-inocente', id: 'btn-inocente', onClick: ev => { ev.stopPropagation(); intentar(0); } }, `😇 ${n} es inocente`),
      el('button', { class: 'btn marca-criminal', id: 'btn-criminal', onClick: ev => { ev.stopPropagation(); intentar(1); } }, `🔪 ${n} es criminal`)));
  } else if (mensaje) {
    box.append(msg(mensaje));
  } else {
    // Las pistas están justo abajo, la última destacada: aquí no se repiten
    box.append(el('p', { class: 'msg-sub' }, 'Toca a alguien para marcarlo.'));
  }
}

function enfocar(i) {
  foco = foco === i ? null : i;
  SFX.tap(); vibrate(8);
  const e = estado(caso, P.marcas);
  renderGrilla(e); renderAccion(e); renderPistas(e);
  if (foco !== null) $('#grilla').scrollIntoView({ behavior: QUIETO ? 'auto' : 'smooth', block: 'nearest' });
}

function renderPistas(e) {
  // La más nueva arriba, destacada; las demás en el orden en que se fueron sabiendo, al revés
  const orden = [caso.inicio, ...P.marcas].reverse();
  $('#pistas').replaceChildren(
    el('h2', {}, `💬 Pistas (${orden.length})`),
    ...orden.map((i, k) => el('div', {
      class: 'pista' + (k === 0 ? ' ultima' : '') + (nuevas.includes(i) ? ' entra' : '') + (P.tachadas.includes(i) ? ' tachada' : '') + (foco === i ? ' activa' : ''),
      'data-de': i,
    },
    el('button', { class: 'texto', type: 'button', onClick: ev => { ev.stopPropagation(); enfocar(i); } },
      k === 0 ? el('span', { class: 'nueva-tag' }, 'Última') : null,
      el('span', { class: 'de' }, `${caso.nombres[i]}:`), ' ', el('span', {}, caso.pistas[i].texto)),
    el('button', {
      class: 'tachar', type: 'button', 'aria-label': P.tachadas.includes(i) ? 'Destachar la pista' : 'Tachar la pista', 'aria-pressed': String(P.tachadas.includes(i)),
      onClick: ev => {
        ev.stopPropagation();
        P.tachadas = P.tachadas.includes(i) ? P.tachadas.filter(x => x !== i) : [...P.tachadas, i];
        guardar(); SFX.tap(); renderPistas(estado(caso, P.marcas));
      },
    }, '✓'))));
  nuevas = [];
}

/* ------------------------------------------------------------------ */
/* Jugadas                                                             */
/* ------------------------------------------------------------------ */
function tocar(i) {
  if (P.done) return;
  correr();
  const sabe = estado(caso, P.marcas).x[i] !== -1;
  if (sabe) {
    // Tocar a alguien que ya se sabe muestra su pista bajo la grilla e ilumina a quiénes nombra (#271)
    elegida = null;
    mensaje = { tipo: 'dato', texto: dice(i), de: i };
    foco = i;
    SFX.tap();
    render();
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
    sellar(i, '❔', 'duda');
  } else if (r === 'error') {
    if (!P.errores.includes(i)) P.errores.push(i);
    mensaje = { tipo: 'error', texto: `${n} no es ${valor ? 'criminal' : 'inocente'}. Revisa las pistas.` };
    SFX.letterMiss(); vibrate([40, 40, 40]);
    guardar();
    renderMarcador(); renderGrilla(estado(caso, P.marcas)); renderAccion(estado(caso, P.marcas));
    sellar(i, '❌', 'fallo');
    return;
  } else if (r === 'ok') {
    P.marcas.push(i);
    nuevas = [i];
    elegida = null;
    foco = null;
    mensaje = { tipo: 'ok', texto: `¡Bien! ${caso.nombres[i]} es ${valor ? 'criminal' : 'inocente'}.` };
    SFX.letterHit(); vibrate(25);
    if (estado(caso, P.marcas).terminado) { parar(); P.done = true; }
    guardar();
    render();
    sellar(i, valor ? '🔪' : '😇', 'acierto');
    return;
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
  const url = `${location.origin}${location.pathname}${codigo ? `?c=${codigo}` : `?dia=${hoy}`}`;
  box.replaceChildren(
    el('div', { class: 'trofeo' }, P.errores.length ? '🔍' : '🏆'),
    el('h2', { class: 'display display--lg' }, '¡Caso resuelto!'),
    el('p', { class: 'resumen' }, `${textoErrores(P.errores.length)[0].toUpperCase()}${textoErrores(P.errores.length).slice(1)}, en ${mmss(P.ms)}.`),
    el('div', { class: 'tarjeta', 'aria-hidden': 'true' }, ...tarjeta().split('\n').map(r => el('div', {}, r))),
    el('button', {
      class: 'btn btn--cyan', id: 'btn-compartir',
      onClick: async e => {
        SFX.tap();
        const reto = P.errores.length ? '🎯 ¿Lo resuelves con menos errores?' : '🎯 ¿Lo resuelves más rápido?';
        const texto = [cabecera({ emoji: '🔍', titulo: 'El caso', contexto: nombreCaso }), `✅ Resuelto ${textoErrores(P.errores.length)} en ${mmss(P.ms)}.`, tarjeta(), reto].join('\n\n');
        const r = await compartir({ titulo: 'El caso', texto, url });
        if (r === 'copied') { e.target.textContent = '✅ Copiado'; setTimeout(() => { e.target.textContent = '📤 Compartir el resultado'; }, 2500); }
      },
    }, '📤 Compartir el resultado'),
    el('a', { class: 'btn btn--yellow', id: 'btn-otro', href: `?c=${Array.from({ length: 5 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('')}` }, '🔍 Otro caso'),
    codigo || (diaLink && diaLink !== fechaLocal()) ? el('a', { class: 'btn btn--ghost', href: location.pathname }, '📅 El caso de hoy') : null,
    el('a', { class: 'btn btn--ghost', href: '../' }, '‹ Volver al laboratorio'),
  );
  if (!celebrado) {
    celebrado = true;
    if (!P.reportado) { P.reportado = true; guardar(); trackFinish({ detalle: `${nombreCaso} · ${P.errores.length} errores · ${mmss(P.ms)}` }); }
    SFX.win(); confetti({ count: 200, duration: 3000 });
    // Una ola por la grilla resuelta
    if (!QUIETO) cartas.forEach((c, i) => setTimeout(() => c.classList.add('ola'), (Math.floor(i / COLS) + (i % COLS)) * 70));
    setTimeout(() => box.scrollIntoView({ behavior: QUIETO ? 'auto' : 'smooth', block: 'start' }), 300);
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
// Un toque fuera suelta a la persona elegida y apaga la pista iluminada (C-8)
document.addEventListener('click', e => {
  if ((elegida !== null || foco !== null) && !e.target.closest('.persona, .accion, .pista')) { elegida = null; foco = null; render(); }
});
// "¿Cómo se juega?" arriba abre las reglas, que están al final
$('#ir-reglas').addEventListener('click', ev => {
  // Abre las reglas y baja hasta ellas con un scroll suave (sin el salto del ancla, ni con movimiento reducido)
  ev.preventDefault();
  const reglas = $('#reglas');
  reglas.open = true;
  SFX.tap();
  reglas.scrollIntoView({ behavior: QUIETO ? 'auto' : 'smooth', block: 'start' });
  reglas.querySelector('summary')?.focus({ preventScroll: true });
});
armarGrilla();
render();
// El reloj parte cuando las cartas ya se dieron vuelta (U-20); tocar a alguien antes lo hace partir igual
const intro = !P.marcas.length && !P.done ? descubrir() : 0;
if (intro) setTimeout(correr, intro); else correr();
setInterval(() => { const r = document.getElementById('reloj'); if (r && !P.done) r.textContent = mmss(tiempo()); }, 1000);

// Ventana al estado para las pruebas (C-14)
window.__caso = { caso: () => caso, partida: () => P, estado: () => estado(caso, P.marcas) };

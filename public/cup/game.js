/**
 * La Copa — pantallas. Lo único que toca el DOM (C-2).
 *
 * Una copa es un torneo de 3 o 7 días: cada día un juego igual para todos que se juega
 * una vez (ver docs/games/cup.md). Las reglas del torneo viven en engine.js; los datos en
 * el almacén (Firebase, o el de prueba con `?test`); cada juego se dibuja con su
 * módulo de juegos/ui-*.js.
 *
 * URL: /cup/ (portada) · /cup/?K7Q2X (una copa) · /cup/?K7Q2X&test (sin Firebase).
 * La misma pantalla sirve los juegos sueltos de la portada en /queens/ (D-149, D-162, D-198).
 */
import { crearArrastre } from '../assets/js/arrastre.js';
import { $, $$, el, con, conEmoji, vibrate, sparkles, keepAwake, confetti } from '../assets/js/ui.js';
import { applyStatic, COMMON, SITIO, LANGS, getLang, langToggle, withLang } from '../assets/js/i18n.js';
import { compartir as compartirAlChat, cabecera, lamina, laminaResultado, aArchivo, nombreArchivo, puntajeYTiempo, botonResultadoSolo, MARCO } from '../assets/js/compartir.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { trackStart, versionOf, countryOf, trackVisit, trackFinish } from '../assets/js/transport/stats.js';
import { gameById, MODO_UNO_AL_DIA, slugDe, idDeSlug, esNuevo } from '../assets/js/games.js';
import { labAccess } from '../assets/js/lab-access.js';
import { param, tiene, nombres, BANDERAS, ALIAS as PARAMS_ANTES } from '../assets/js/parametros.js';
import {
  POZO, VARIANTES, entradaCal, varianteDelDia, calendarioAlAzar, calendario, MAX_JUGADORES, COPA_MAX, aliasLimpio, esAlias, CODIGO, esCodigo, codigoAlAzar, pidAlAzar, limpiarNombre, claveNombre, esPin, hashPin,
  fechaEn, sumarDias, nuevaMeta, diaActual, abierto, cerrado, terminada, inscripcionAbierta, estadoDia, comodinDe, moverInicio, sinEmpezar, pasarDia, MAX_DIAS_INICIO, faltaGente,
  medianoche, menosJuegos, provisoria, ultimoDiaVisto, marcaDelDia, puedeComodin, multiplicador, posicionesDelDia, tabla, desempate, faltan, fuera, enRiesgo, medallas, evolucion, visibleDia, reloj, pausaDeLectura, mmss, juegoDelDia, esFinal, finalRounds, diaDeCal, activos, ZONA, zonaDeIdioma,
  conCierre, cerradaAntes, anulado, puedeCerrar, semanaAlAzar, ESTILOS_SEMANA,
} from './engine.js';
import { GAME_ID, LOCALES, juegosCopa, rondasFinal, conVariante, JUEGOS_COPA as JUEGOS_COPA_ES } from './rules.js';
import { createCuenta, juntarCopas } from './cuenta.js';
import { JUEGOS } from './games/index.js';
import { audienciaDe } from './games/audiencia.js';
import { desglose } from './desglose.js';
import { planilla } from './planilla.js';
import { bloqueJugador, bloqueRanking, avisoPartida, bloqueCampeones } from '../assets/js/ranking.js';
import { jugador, leerYo, rankingsVisibles } from '../assets/js/jugador.js';
import { podioDe } from '../assets/js/records.js';
import { crearAvisos } from './avisos.js';
import { fechaLocal, juegoDel, semillaDel, anotar as anotarUnoAlDia, leer as leerUnoAlDia } from '../assets/js/uno-al-dia.js';
import { tarjetaResultado, rutaHoy } from '../assets/js/uno-al-dia-ui.js';
import { salidasFin } from '../assets/js/fin.js';
import { formularioComentario, abrirComentario, campoCorreo } from '../assets/js/labs-idioma.js';
import { enlaceBuzon, ponerBuzon, sinDoble } from '../assets/js/buzon.js';
import { cuentaRegresiva as cuentaComun } from '../assets/js/cuenta-regresiva.js';

// Cuenta la visita al abrir la página, aunque nadie llegue a jugar (D-208)
trackVisit();

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

// La pantalla va en el idioma de quien mira (D-170). Las palabras de Conexiones y de Palabra van
// en el de la copa (`palabrasDe`), que es el mismo para todos.
const LANG = getLang();
const T = LOCALES[LANG] || LOCALES.es;
const JUEGOS_COPA = juegosCopa(LANG);
const RONDAS_FINAL = rondasFinal(LANG);
/** El idioma de las palabras de una copa; las de antes de D-170 no lo dicen y son en español. */
const palabrasDe = meta => meta?.lang || 'es';
/** "3º", o "#3" en inglés. */
const ord = n => fmt(T.ord, { n });
/** Los textos de los rankings, compartidos con /records/ (D-212). */
const RK = (COMMON[LANG] || COMMON.es).rk;
const fmt = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));

/* ------------------------------------------------------------------ */
/* Arranque                                                            */
/* ------------------------------------------------------------------ */

// Los parámetros van en inglés (C-18, D-266); los de antes (`?prueba`, `?semilla=`) se leen igual
const busqueda = location.search.slice(1).split('&').filter(Boolean);
const PRUEBA = tiene('test');
// ?labs: se llegó desde el laboratorio, con la semilla a la vista y el botón para volver (D-101).
// La Copa de 3 días (D-100) se ofrece solo con ?three o en el modo de prueba (D-262).
// La página de un juego del laboratorio (/labs/case/, D-267) es del laboratorio sin que el link lo diga
const LABS = busqueda.includes('labs') || location.pathname.includes('/labs/');
const TRES = PRUEBA || tiene('three');
/** Las banderas de la URL, en inglés y como eran antes: ninguna es un juego ni el link de una copa. */
const BANDERAS_URL = ['labs', 'lab', ...Object.entries(BANDERAS).flat()];
// Los juegos sueltos de la portada viven en /<slug>/ (D-149, D-162, D-192, D-198): la misma
// pantalla, pero fuera de una copa el link no dice "copa". Cada uno tiene su página, que dice cuál
// es en `<body data-suelto="reinas">`, para que el link compartido traiga su propia tarjeta
// social. /cup/?practice=<juego>&labs queda para el laboratorio. En la URL, el juego va con su
// nombre en inglés (`queens`, D-266); el id de antes (`reinas`) se entiende igual.
const SUELTO = document.body.hasAttribute('data-suelto');
const PRACTICA = SUELTO
  ? document.body.dataset.suelto || idDeSlug(busqueda.find(x => !x.includes('=') && !BANDERAS_URL.includes(x)) || '')
  : (p => p && idDeSlug(p))(param('practice'));
/** La raíz del sitio, desde donde esté la página (las de cada juego van un nivel más abajo). */
const RAIZ = new URL('../', import.meta.url).href;
const SEMILLA = (param('seed') || '').toUpperCase();
/**
 * Uno al día (D-230): `?today` juega el desafío de hoy, el mismo para todos. La fecha y el juego los
 * calcula la página (no vienen en el link), así un link viejo abre el de hoy.
 */
const HOY = SUELTO && tiene('today');
/**
 * Dónde vive un juego suelto: su página, o la genérica si no tiene. Desde el laboratorio
 * también se juega ahí (D-164), con `?labs` y su semilla: así el link que se copia de la barra
 * trae la tarjeta del juego y no la de La Copa.
 */
const paginaSuelta = (id, { semilla, zipSeg, modo } = {}) => {
  const q = [LABS && !gameById(id)?.labs && 'labs', PRUEBA && 'test', semilla && `seed=${semilla}`, modo && `mode=${modo}`, zipSeg && `timer=${zipSeg}`].filter(Boolean).join('&');
  return gameById(id)?.suelto ? `${RAIZ}${gameById(id).path}${q ? `?${q}` : ''}` : `${RAIZ}cup/suelto/?${[slugDe(id), q].filter(Boolean).join('&')}`;
};
const semillaUrl = { semilla: SEMILLA, zipSeg: param('timer'), modo: param('mode') };
// Un link viejo (/cup/?practica=reinas, o /cup/suelto/?reinas) se va a su lugar nuevo. Los del
// laboratorio que no tienen página (Línea Relámpago, el número, la final) siguen en /cup/.
if (!SUELTO && PRACTICA && (!LABS || gameById(PRACTICA)?.suelto)) location.replace(paginaSuelta(PRACTICA, semillaUrl));
if (SUELTO && !document.body.dataset.suelto && gameById(PRACTICA)?.suelto) location.replace(paginaSuelta(PRACTICA, semillaUrl));
// En la genérica, el juego queda con su nombre en inglés: `?linea&hoy` → `?timeline-flash&today` (D-266)
if (SUELTO && !document.body.dataset.suelto && PRACTICA) {
  const q = location.search.slice(1).split('&').map(x => (!x.includes('=') && idDeSlug(x) === PRACTICA ? slugDe(PRACTICA) : x)).join('&');
  if (`?${q}` !== location.search) history.replaceState(history.state, '', `${location.pathname}?${q}${location.hash}`);
}
// Las demos (D-110): solo en el modo de prueba, con el almacén local. La escena va en inglés (`&demo=podium`)
const DEMO = PRUEBA ? param('demo') : null;
const codigoUrl = (busqueda.find(x => CODIGO.test(x.toUpperCase()) && x.length === 5) || new URLSearchParams(location.search).get('c') || '').toUpperCase();
/** Palabras de la URL que no pueden ser el link de una copa: las banderas y los parámetros, en inglés y como eran antes. */
const RESERVADAS = [...BANDERAS_URL, ...Object.entries(PARAMS_ANTES).flat(), 'demo', 'copa', 'cup'];
// Un link propio: la palabra de la URL que no es un código ni un parámetro (D-121)
const aliasUrl = busqueda.filter(y => !y.includes('=') && !(CODIGO.test(y.toUpperCase()) && y.length === 5))
  .map(y => aliasLimpio(decodeURIComponent(y))).find(a => esAlias(a) && !RESERVADAS.includes(a)) || '';

const cuenta = createCuenta({ prueba: PRUEBA });
let store = null;
// La app instalada en iPhone abre con la copa y el jugador en la dirección, nunca el PIN (D-223)
const appPid = new URLSearchParams(location.search).get('app') || '';
// Un aviso abre la copa en su día (`&day=3`), o la silencia (`&mute`, el botón del aviso en
// Android, D-229). Se leen al cargar: el link propio de la copa reemplaza la dirección.
const diaAviso = Number(param('day')) || 0;
const silenciarAviso = tiene('mute');

async function abrirStore() {
  if (store) return store;
  store = PRUEBA
    ? (await import('./store-local.js')).createLocalStore()
    : (await import('./store-firebase.js')).createFirebaseStore();
  return store;
}

/** Estado de la pantalla: la copa abierta, quién soy en ella y qué se está mirando. */
const S = { code: null, L: null, yo: null, reentrar: null, pantalla: null, off: null, juego: null, tic: null, reloj: null };

// El link de una copa: su nombre propio si lo tiene (?pirata), si no su código. Sin &labs: la
// copa ya sabe por dentro si es del laboratorio (D-121)
const enlace = code => (S.code === code && S.L?.meta?.alias) || code;
const urlCopa = code => `${location.origin}${location.pathname}?${enlace(code)}${PRUEBA ? '&test' : ''}`;
const urlPublica = code => (PRUEBA ? urlCopa(code) : `https://juegosdesalon.cl/cup/?${enlace(code)}`);

// On a day's cover the top-left button goes back to the cup, and says so ("‹ La Copa")
function rotuloMenu() {
  $('#btn-menu').textContent = S.antesala ? `‹\u00a0${T.toBoard}` : LABS ? T.backToLabsShort : T.menu;
  // That button already names the cup: the "🏆 La Copa" chip steps aside, or at 320 px it is cut to "🏆 …" (U-12)
  document.body.classList.toggle('antesala', !!S.antesala);
}

function mostrar(id) {
  S.pantalla = id;
  S.antesala = false;
  rotuloMenu();
  // Cada juego a pantalla completa (¿Dónde queda?) la pide de nuevo al montarse
  pantallaCompleta(false);
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === `screen-${id}`));
  window.scrollTo(0, 0);
}

/**
 * Un juego a pantalla completa (D-203) ocupa la ventana entera: la barra, el reloj y las reglas
 * plegadas flotan encima de él en vez de ir arriba y abajo de su caja.
 */
function pantallaCompleta(si) {
  document.body.classList.toggle('pantalla-completa', !!si);
  // The play head goes inside the bar, between back and sound: centered in the window it sat
  // over "‹ Laboratorio" (C-8). Outside full screen it goes back on top of the play screen.
  const head = $('#jugar-head'), barra = $('.topbar');
  if (si) barra.insertBefore(head, $('.tools', barra));
  else if (head.parentNode === barra) $('#screen-jugar').prepend(head);
  ajustarCabeza();
}

/**
 * The elapsed-time clock in the play head, only for a game whose speed scores and that has no
 * countdown of its own (`export const clock = true` in its ui.js, D-384); null for the rest (D-379).
 */
function mostrarReloj(head, mod, leer) {
  clearInterval(S.reloj);
  if (!mod.clock) return null;
  const cron = el('span', { class: 'cron' }, fmt(T.timer, { t: mmss(leer()) }));
  head.append(cron);
  S.reloj = setInterval(() => { if (S.pantalla === 'jugar') cron.textContent = fmt(T.timer, { t: mmss(leer()) }); }, 1000);
  return cron;
}

/** The board ended: the clock stops on the time it keeps. */
function pararMuestra(cron, leer) {
  clearInterval(S.reloj);
  if (cron) cron.textContent = fmt(T.timer, { t: mmss(leer()) });
}

/** If the head does not fit in the bar, the test pill shrinks to 🧪 and, if still not, goes. */
function ajustarCabeza() {
  const head = $('#jugar-head');
  head.classList.remove('justo', 'sin-chip');
  if (!document.body.classList.contains('pantalla-completa')) return;
  for (const c of ['justo', 'sin-chip']) {
    if (head.scrollWidth <= head.clientWidth) return;
    head.classList.add(c);
  }
}
addEventListener('resize', ajustarCabeza);

function errorDe(e) {
  const code = e?.code || e?.message;
  const mapa = {
    pin: 'errPinWrong', 'nombre-repetido': 'errRepetido', llena: 'errLlena', 'no-existe': 'errNoExiste',
    ventana: 'errVentana', 'ya-jugado': 'errYaJugado', comodin: 'errComodin', permiso: 'errPermiso',
    config: 'errConfig', offline: 'errOffline', busy: 'errOffline', cerrada: 'errCerrada',
    reporte: 'errReport', empezada: 'errEmpezada', terminada: 'errTerminada', faltan: 'needSecond', alias: 'errAlias', fin: 'errFin',
  };
  if (!mapa[code]) console.error(e);
  return T[mapa[code] || 'errNet'];
}

/** Un aviso de error que se queda hasta que se toca (C-8b). */
function avisoError(caja, texto) {
  caja.textContent = texto;
  caja.classList.remove('shake'); void caja.offsetWidth; caja.classList.add('shake');
  SFX.error(); vibrate([40, 40, 40]);
}

// Las fechas en el idioma de quien mira o, en lo que va al grupo, en el de la copa (D-170).
// En inglés y en alemán la coma va ("Thursday, October 1", "Donnerstag, 1. Oktober"); en español y portugués se saca
const LOCALE = { es: 'es-CL', en: 'en-US', pt: 'pt-BR', de: 'de-DE' };
const fechaLarga = (ms, tz = ZONA, lang = LANG) => { const f = new Intl.DateTimeFormat(LOCALE[lang] || LOCALE.es, { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(ms)); return lang === 'en' || lang === 'de' ? f : f.replace(',', ''); };
/** El nombre de la zona horaria de una copa, para decirlo en palabras (D-113). */
const zonaTexto = tz => T.zones[tz] || fmt(T.zoneOther, { tz });
const fechaCorta = (ms, tz = ZONA) => new Intl.DateTimeFormat(LOCALE[LANG] || LOCALE.es, { timeZone: tz, weekday: 'short', day: 'numeric' }).format(new Date(ms));

function faltaPara(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return fmt(T.inMin, { m });
  const h = Math.floor(m / 60);
  return h < 48 ? fmt(T.inHours, { h, m: m % 60 }) : fmt(T.inDays, { d: Math.floor(h / 24) });
}

/* ------------------------------------------------------------------ */
/* Portada                                                             */
/* ------------------------------------------------------------------ */

function portada() {
  mostrar('intro');
  const body = $('#intro-body');
  body.innerHTML = '';
  const err = el('div', { class: 'form-error', role: 'alert' });
  const input = el('input', { class: 'code', maxlength: '5', placeholder: T.codePlaceholder, autocomplete: 'off', autocapitalize: 'characters', 'aria-label': T.codeLabel });
  const ir = () => {
    const c = input.value.trim().toUpperCase();
    if (!esCodigo(c)) { avisoError(err, T.errCodigo); return; }
    location.search = `?${c}${PRUEBA ? '&test' : ''}${LABS ? '&labs' : ''}`;
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') ir(); });

  // "Tus copas": las de este celular de una; las del jugador que entró llegan después (D-220).
  // Las terminadas llevan su etiqueta y se esconden tras un interruptor que parte apagado (D-234)
  const mias = el('div', { class: 'panel', id: 'tus-copas' });
  let verTerminadas = false;
  const pintarMias = lista => {
    mias.hidden = !lista.length;
    mias.innerHTML = '';
    const ahora = Date.now();
    const terminada = c => !!c.fin && ahora >= c.fin;
    const nTerminadas = lista.filter(terminada).length;
    // Prendido, las terminadas van al pie, junto al interruptor: las en curso no se mueven
    const visibles = [...lista.filter(c => !terminada(c)), ...(verTerminadas ? lista.filter(terminada).sort((a, b) => b.fin - a.fin) : [])];
    const interruptor = el('input', { type: 'checkbox', role: 'switch', id: 'ver-terminadas' });
    interruptor.checked = verTerminadas;
    interruptor.addEventListener('change', () => { SFX.tap(); verTerminadas = interruptor.checked; pintarMias(lista); document.getElementById('ver-terminadas')?.focus(); });
    poner(mias,
      el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.mine),
      visibles.length ? null : el('p', { class: 'muted mias-vacia' }, T.mineNone),
      el('div', { class: 'mias' }, visibles.map(c => el('a', { class: 'mia' + (terminada(c) ? ' terminada' : ''), href: urlCopa(c.code) },
        el('b', {}, c.copa || c.code, terminada(c) ? el('span', { class: 'etiqueta-fin' }, T.mineOver) : null),
        el('small', {}, `${c.nombre} · ${c.code}`), el('span', { class: 'go' }, '›')))),
      nTerminadas ? el('label', { class: 'hoja-switch mias-switch', for: 'ver-terminadas' },
        el('span', {}, fmt(T.mineShowOver, { n: nTerminadas })), interruptor) : null);
  };
  pintarMias(cuenta.mias());
  if (leerYo()) copasDelJugador().then(delJugador => {
    if (mias.isConnected && delJugador.length) pintarMias(juntarCopas(cuenta.mias(), delJugador));
  }).catch(() => {});
  poner(body, 
    // El idioma se elige a mano, como en todos los juegos (C-3)
    el('div', { class: 'center' }, langToggle()),
    el('button', { class: 'btn btn--yellow', id: 'btn-crear', onClick: () => { SFX.tap(); crearCopa(); } }, T.create),
    mias,
    el('div', { class: 'panel' },
      el('div', { class: 'field' }, el('label', {}, T.haveCode), input),
      el('button', { class: 'btn btn--cyan btn--sm', style: 'width:100%', onClick: ir }, T.go),
      err),
    el('details', { class: 'panel' },
      el('summary', {}, T.howTitle),
      el('ol', { class: 'como' }, T.howItems.map(x => el('li', {}, x)))),
    // Los campeones de las copas terminadas (D-212): al final, para no empujar lo de crear o entrar
    rankingsVisibles() ? bloqueCampeones() : null,
  );
}

/**
 * Las copas del jugador que entró, de cualquier celular (D-220), como las de "Tus copas". Las que
 * este celular ya conoce no se leen de nuevo; una copa que su admin borró sale de la lista.
 */
async function copasDelJugador() {
  const [J, st] = await Promise.all([jugador(), abrirStore()]);
  await st.listo();
  const conocidas = new Set(cuenta.mias().map(c => c.code));
  const suyas = (await J.copas()).filter(c => !conocidas.has(c.code));
  return Promise.all(suyas.map(async ({ code, p }) => {
    try {
      const Lc = await st.leer(code);
      if (!Lc?.meta) { J.olvidarCopa(code).catch(() => {}); return null; }
      return { code, nombre: Lc.players?.[p]?.name || '?', copa: Lc.meta.name, fin: Lc.fin || Lc.meta.end };
    } catch (_) { return null; }
  }));
}

/* ------------------------------------------------------------------ */
/* Formularios de cuenta                                               */
/* ------------------------------------------------------------------ */

/**
 * Un campo con su etiqueta. Si tiene largo máximo y `contador`, muestra cuántos caracteres van
 * ("24 / 40") para que el límite se vea antes de chocar con él (D-119).
 */
function campo(label, attrs = {}, { contador = false } = {}) {
  const input = el('input', { autocomplete: 'off', ...attrs });
  const max = Number(attrs.maxlength) || 0;
  const cuenta = contador && max ? el('small', { class: 'contador muted', 'aria-live': 'polite' }) : null;
  const pintar = () => { if (!cuenta) return; const n = input.value.length; cuenta.textContent = `${n} / ${max}`; cuenta.classList.toggle('lleno', n >= max); };
  input.addEventListener('input', pintar);
  pintar();
  return { input, nodo: el('div', { class: 'field' }, el('label', {}, label), input, cuenta) };
}
const campoPin = label => campo(label, { inputmode: 'numeric', pattern: '[0-9]*', maxlength: '4', type: 'password', class: 'pin' });

/**
 * Un grupo de opciones sin nada elegido de entrada (C-8, D-38). `inicial` solo para lo que tiene
 * una respuesta obvia y se ve antes de confirmar nada: el idioma de las palabras (D-170).
 */
function opciones(items, onChange, { inicial = null } = {}) {
  let valor = inicial;
  const botones = items.map(it => el('button', {
    type: 'button', class: 'opcion' + (it.valor === inicial ? ' on' : ''), 'aria-pressed': String(it.valor === inicial),
    onClick: () => {
      SFX.tap();
      valor = it.valor;
      botones.forEach((b, i) => { const on = items[i].valor === valor; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      onChange?.(valor);
    },
  }, el('b', {}, it.emoji ? el('span', { class: 'opcion-emoji' }, it.emoji) : null, it.titulo), it.sub ? el('small', {}, it.sub) : null));
  return { nodo: el('div', { class: 'opciones' }, botones), get valor() { return valor; } };
}

/**
 * A game's variants as options (D-331). The name's emoji goes on a line of its own in both cards,
 * so «⚡💧 Servicios» and «🔢 Números» look alike at 320 px instead of one wrapping its emoji (U-12).
 */
const opcionesVariante = (J, vs) => vs.map(v => {
  const nombre = J.variantes?.[v]?.nombre || v;
  const [, emoji, titulo] = nombre.match(/^([\p{Extended_Pictographic}\uFE0F\u200D]+)\s+(.+)$/u) || [null, null, nombre];
  return { valor: v, emoji, titulo, sub: J.variantes?.[v]?.sub };
});

/** Un selector de fecha, de hoy a 30 días más (D-115). Parte oculto. */
function campoFecha(hoy) {
  const max = sumarDias(hoy, MAX_DIAS_INICIO);
  const input = el('input', { type: 'date', class: 'fecha', min: hoy, max, value: sumarDias(hoy, 2), 'aria-label': T.startOther });
  const nodo = el('div', { class: 'field fecha-campo', hidden: true }, input);
  return { nodo, input, valida: () => /^\d{4}-\d{2}-\d{2}$/.test(input.value) && input.value >= hoy && input.value <= max };
}

/**
 * Los juegos de la copa y su orden (D-163), con la mano y la línea de Línea de Tiempo (D-102):
 * arriba los que quedan fuera, abajo la semana. Un día se arrastra a otro lugar de la semana, y un
 * juego de fuera se arrastra hasta el día que reemplaza; tocando se llega a lo mismo (el juego y
 * después dónde va). Parte con una propuesta al azar, para quien no quiere pensarlo. La final no
 * se toca: siempre el último día.
 */
function elegirJuegos() {
  // `sel`: lo elegido, { zona: 'dia' | 'fuera', id }. `destino`: dónde va ('s<k>' la ranura k,
  // al tocar; 'm<k>' el lugar k de la semana, al arrastrar un día; 'r<i>' el día i que se reemplaza)
  let cal = [], sel = null, destino = null, arrastrando = false;
  // The variant of each game that has them (D-331): it goes with the game, not with the day, so moving a day keeps it
  const variantes = {};
  // La familia se compara en español: la misma semana al azar cualquiera sea el idioma
  const familia = id => JUEGOS_COPA_ES[id].habilidad;
  // La ayuda larga no cambia; lo que cambia con lo elegido es una línea de alto fijo: si la
  // página se moviera al elegir, el día de destino se correría bajo el dedo que arrastra. Los tres
  // textos van apilados en la misma celda y solo se ve uno: el alto es el del más largo a cualquier
  // ancho (a 320 px uno ocupa tres líneas y los otros dos, una o dos)
  // Tocando se dice "toca"; con el juego en el aire, "suéltalo"
  const AYUDAS = { nada: T.gamesPick, dia: T.gamesPickedDay, fuera: T.gamesPickedOut, 'arr-dia': T.gamesDragDay, 'arr-fuera': T.gamesDragOut };
  const estado = el('p', { class: 'cal-estado', 'aria-live': 'polite' },
    Object.entries(AYUDAS).map(([k, txt]) => el('span', { 'data-ayuda': k }, txt)));
  const mano = el('div', { class: 'hand', id: 'cal-fuera' });
  const linea = el('div', { class: 'line cal-linea', id: 'cal-elegir' });
  const dias = () => cal.slice(0, -1);
  const fueraDe = () => POZO.filter(id => !cal.includes(id));
  // Una ranura junto al día que se mueve lo dejaría donde está: no se ofrece
  const ranuraSirve = k => !arrastrando && sel?.zona === 'dia' && k !== dias().indexOf(sel.id) && k !== dias().indexOf(sel.id) + 1;
  /** La semana con el día elegido en el lugar k. */
  const movido = k => { const d = dias(); d.splice(d.indexOf(sel.id), 1); d.splice(k, 0, sel.id); return d; };
  // Arrastrando un día, los demás se corren para hacerle lugar: la lista no cambia de alto bajo el dedo
  const moviendo = () => arrastrando && sel?.zona === 'dia';
  const vista = () => (moviendo() && destino ? movido(Number(destino.slice(1))) : dias());

  const aplicar = clave => {
    const n = Number(clave.slice(1));
    if (clave[0] === 'r' && sel.zona === 'fuera') cal[n] = sel.id;
    if (clave[0] === 'm' && sel.zona === 'dia') cal = [...movido(n), 'final'];
    if (clave[0] === 's' && sel.zona === 'dia') {
      const d = dias(), i = d.indexOf(sel.id);
      d.splice(i, 1); d.splice(n > i ? n - 1 : n, 0, sel.id);
      cal = [...d, 'final'];
    }
  };
  const tocarFuera = id => {
    if (sel?.zona === 'dia') { cal[cal.indexOf(sel.id)] = id; sel = null; } else sel = sel?.id === id ? null : { zona: 'fuera', id };
    SFX.tap(); pintar();
  };
  const tocarDia = i => {
    if (sel?.zona === 'fuera') { cal[i] = sel.id; sel = null; } else sel = sel?.id === cal[i] ? null : { zona: 'dia', id: cal[i] };
    SFX.tap(); pintar();
  };
  const tocarRanura = k => { aplicar(`s${k}`); sel = null; SFX.tap(); pintar(); };

  const nombreJ = (id, sub = JUEGOS_COPA[id].habilidad) => el('span', { class: 't' }, JUEGOS_COPA[id].nombre, el('small', {}, sub));
  const ranura = k => el('div', { class: 'slot', 'data-slot': k, 'data-clave': `s${k}`, onClick: () => tocarRanura(k) }, el('span', {}, T.gamesSlot));

  function marcar() {
    linea.querySelectorAll('[data-clave]').forEach(x => x.classList.toggle('on', x.dataset.clave === destino));
  }
  function pintar() {
    mano.innerHTML = ''; linea.innerHTML = '';
    poner(mano, fueraDe().map(id => el('button', {
      type: 'button', class: `card${sel?.id === id ? (arrastrando ? ' hueco' : ' sel') : ''}`, 'data-juego': id, 'aria-pressed': String(sel?.id === id), onClick: () => tocarFuera(id),
    }, el('span', { class: con('em', JUEGOS_COPA[id].emoji) }, JUEGOS_COPA[id].emoji), el('span', { class: 't' }, JUEGOS_COPA[id].nombre))));
    mano.classList.toggle('dim', sel?.zona === 'fuera');
    linea.classList.toggle('blanco', sel?.zona === 'fuera');
    vista().forEach((id, i) => {
      if (ranuraSirve(i)) linea.append(ranura(i));
      linea.append(el('button', {
        type: 'button', class: `event${sel?.id === id ? (arrastrando ? ' hueco' : ' sel') : ''}`, 'data-dia': i, 'data-juego': id, 'data-clave': `${moviendo() ? 'm' : 'r'}${i}`,
        'aria-pressed': String(sel?.id === id), onClick: () => tocarDia(i),
      }, el('span', { class: 'y' }, fmt(T.gamesDay, { d: i + 1 })), el('span', { class: con('em', JUEGOS_COPA[id].emoji) }, JUEGOS_COPA[id].emoji), nombreJ(id),
      el('span', { class: 'agarre', 'aria-hidden': 'true' }, '⠿')));
    });
    if (ranuraSirve(dias().length)) linea.append(ranura(dias().length));
    linea.append(el('div', { class: 'event fija' }, el('span', { class: 'y' }, fmt(T.gamesDay, { d: cal.length })),
      el('span', { class: 'em' }, JUEGOS_COPA.final.emoji), nombreJ('final', T.gamesFinal)));
    marcar();
    pintarVariantes();
    const ayuda = !sel ? 'nada' : arrastrando ? `arr-${sel.zona}` : sel.zona;
    estado.querySelectorAll('[data-ayuda]').forEach(x => x.classList.toggle('oculta', x.dataset.ayuda !== ayuda));
  }
  const sortear = n => { cal = calendarioAlAzar(n, { familia }); sel = null; pintar(); };

  // Below the week, one row per game of the week that has variants (D-331): the admin picks which
  // one everybody plays that day. Not inside the day's card, which is a button that is dragged.
  const cajaVariantes = el('div', { class: 'cal-variantes', id: 'cal-variantes' });
  function pintarVariantes() {
    const conV = dias().map((id, i) => ({ id, i })).filter(x => VARIANTES[x.id]);
    cajaVariantes.replaceChildren();
    cajaVariantes.hidden = !conV.length;
    if (!conV.length) return;
    cajaVariantes.append(el('div', { class: 'field' }, el('label', {}, T.gamesVariants), el('small', { class: 'muted' }, T.gamesVariantsHint)));
    for (const { id, i } of conV) {
      const J = JUEGOS_COPA[id];
      const o = opciones(opcionesVariante(J, VARIANTES[id]),
        v => { variantes[id] = v; }, { inicial: variantes[id] || VARIANTES[id][0] });
      o.nodo.classList.add('dos', 'variantes');
      o.nodo.dataset.variantes = id;
      cajaVariantes.append(el('div', { class: 'cal-variante' },
        el('p', { class: 'cal-variante-t' }, el('span', { class: 'y' }, fmt(T.gamesDay, { d: i + 1 })), ' ', conEmoji(J.emoji, J.nombre)), o.nodo));
    }
  }

  const nodo = el('div', { class: 'panel', id: 'crear-juegos', hidden: true },
    el('div', { class: 'field' }, el('label', {}, T.fGames), el('small', { class: 'muted' }, T.gamesHint)), estado,
    el('div', { class: 'hand-title' }, el('b', {}, T.gamesOut)), mano,
    el('div', { class: 'line-wrap' }, linea),
    cajaVariantes,
    el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-azar', onClick: () => { SFX.tap(); sortear(cal.length); } }, T.gamesShuffle));

  // Arrastrar es elegir y soltar (D-85): el mismo estado al que se llega tocando. Nada se
  // confirma hasta Crear la copa.
  crearArrastre({
    fuentes: [
      { contenedor: mano, item: '.card', eje: 'vertical', nombre: 'fuera' },
      { contenedor: linea, item: '.event[data-dia]', eje: 'libre', nombre: 'dia' },
    ],
    activo: () => nodo.isConnected && !nodo.hidden,
    vibrar: vibrate,
    avatar: item => el('div', { class: 'vilo-carta' }, el('span', { class: con('em', JUEGOS_COPA[item.dataset.juego].emoji) }, JUEGOS_COPA[item.dataset.juego].emoji), el('span', { class: 't' }, JUEGOS_COPA[item.dataset.juego].nombre)),
    alAlzar: (item, zona) => {
      sel = { zona, id: item.dataset.juego }; destino = null; arrastrando = true; pintar();
    },
    medir: () => [...linea.querySelectorAll('.event[data-dia]')].map(x => {
      const r = x.getBoundingClientRect();
      return { clave: x.dataset.clave, y: r.top + r.height / 2 + window.scrollY };
    }),
    sobre: clave => { destino = clave; if (moviendo()) pintar(); else marcar(); },
    soltar: (clave, { cancelado }) => {
      if (!cancelado && clave) { aplicar(clave); SFX.tap(); }
      sel = null; destino = null; arrastrando = false; pintar();
    },
  });
  // Un toque fuera de la lista suelta lo elegido (C-8). Con la ruta del evento, no con
  // `contains`: el botón tocado ya se redibujó y quedó fuera del árbol.
  document.addEventListener('click', ev => { if (sel && nodo.isConnected && !ev.composedPath().includes(nodo)) { sel = null; pintar(); } });
  return { nodo, sortear, get cal() { return cal.map(id => entradaCal(id, variantes[id])); } };
}

/**
 * The new create screen (D-425), for now only with a lab key. lab: #seccion-copa-crear
 * In the test store (`?test`) the scripts see the screen of before unless the URL says `&lab`.
 */
const formularioNuevo = () => (PRUEBA && !tiene('lab') ? Promise.resolve(false) : labAccess());
/** Two cup games are a lighter version of a home page game: their tagline is that game's. */
const DE_PORTADA = { linea: 'linea-de-tiempo', numero: 'toque-y-fama' };
const juegoPortada = id => gameById(DE_PORTADA[id] || id);
const lemaDe = id => juegoPortada(id)?.tagline?.[LANG] || juegoPortada(id)?.tagline?.es || '';
/** A cup's day ('2026-10-23') in words, "jueves 23 de octubre". */
const fechaDia = f => fechaLarga(Date.parse(`${f}T12:00:00Z`), 'UTC');
/** Its day of the week, short and without the dot: "jue", "Thu", "qui", "Do". */
const diaCorto = f => new Intl.DateTimeFormat(LOCALE[LANG] || LOCALE.es, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${f}T12:00:00Z`)).replace('.', '');

/**
 * The week of the new create screen (D-425): in view from the start, drawn by the 🎲 in one of the
 * week styles; the die draws the whole week again, with a short slot-machine roll on the cards (the
 * owner's review took the 🔒 locks out: a game
 * can still be changed or moved by hand). Tapping a game opens a sheet with the whole pool, each with its tagline: picking
 * one that is already in the week swaps the two days, and the sheet also moves the day and picks
 * its version. A day is still dragged by its ⠿ grip, as a shortcut (D-85: dragging is choosing).
 */
function armarSemana() {
  let dias = 7, cal = [], estilo = 'equilibrada', ultimo = 'equilibrada', sel = null, destino = null, arrastrando = false, capa = null;
  const variantes = {};
  // The skill is compared in Spanish: the same rules whatever the screen's language
  const familia = id => JUEGOS_COPA_ES[id].habilidad;
  const nuevos = POZO.filter(id => esNuevo(juegoPortada(id)));
  const estilos = Object.keys(ESTILOS_SEMANA).filter(e => e !== 'nuevo' || nuevos.length);
  const semana = () => cal.slice(0, -1);
  const movido = k => { const d = semana(); d.splice(d.indexOf(sel), 1); d.splice(k, 0, sel); return d; };
  const vista = () => (arrastrando && destino ? movido(Number(destino.slice(1))) : semana());
  const nombreVariante = id => VARIANTES[id] && (JUEGOS_COPA[id].variantes?.[variantes[id] || VARIANTES[id][0]]?.nombre || '').replace(/^[\p{Extended_Pictographic}️‍]+\s*/u, '');

  const tirar = ({ animar = true } = {}) => {
    estilo = ultimo;
    cal = semanaAlAzar(dias, { familia, estilo, nuevos });
    pintar();
    if (animar) { aLaVista(); barajar(); }
  };
  /**
   * On a small phone the week starts below the 🎲 (the owner's request, D-425): if any day is out of
   * view, the page scrolls so the 🎲 sits at the top and the roll is seen.
   */
  function aLaVista() {
    const r = lista.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= innerHeight) return;
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({ top: dado.getBoundingClientRect().top + scrollY - 12, behavior: suave ? 'smooth' : 'auto' });
  }
  /**
   * The roll, as a slot machine (the owner's request, D-425): each card runs through random games of
   * the pool and stops on its own, top to bottom, in under a second. The week is already drawn and
   * painted underneath (each card's `data-juego` is the real one), so a tap meanwhile acts on it.
   */
  let rueda = null;
  function barajar() {
    clearInterval(rueda);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cartas = [...lista.querySelectorAll('.semana-dia')].map(f => {
      const em = f.querySelector('.em'), b = f.querySelector('.semana-juego b'), small = f.querySelector('.semana-juego small');
      return { f, em, b, small, real: [em.textContent, em.className, b.textContent, small.textContent], quieta: false };
    });
    // Each card keeps the height of the game it lands on: a longer name passing by does not wrap
    // and push the rows below (it is cut on one line while it spins, C-8)
    cartas.forEach(c => { c.f.style.height = `${c.f.offsetHeight}px`; });
    const t0 = performance.now();
    const paso = () => {
      const t = performance.now() - t0;
      let giran = 0;
      cartas.forEach((c, i) => {
        if (c.quieta) return;
        if (t >= 300 + i * 90) {
          [c.em.textContent, c.em.className, c.b.textContent, c.small.textContent] = c.real;
          c.f.classList.remove('baraja'); c.f.style.height = ''; c.f.classList.add('cae'); c.quieta = true;
          return;
        }
        giran++;
        const G = JUEGOS_COPA[POZO[Math.floor(Math.random() * POZO.length)]];
        c.em.textContent = G.emoji; c.em.className = con('em', G.emoji); c.b.textContent = G.nombre; c.small.textContent = G.habilidad;
        c.f.classList.add('baraja');
      });
      if (!giran) clearInterval(rueda);
    };
    paso();
    rueda = setInterval(paso, 70);
  }
  /** A change by hand: the week no longer matches a style, and the die goes back to the last one. */
  const aMano = w => { cal = [...w, 'final']; estilo = null; };

  const dado = el('button', { type: 'button', class: 'btn-dado', id: 'btn-dado', onClick: () => { SFX.tap(); vibrate(15); tirar(); } }, T.weekDice);
  const chips = el('div', { class: 'semana-estilos', id: 'semana-estilos', role: 'group', 'aria-label': T.weekStylesLabel });
  const lista = el('div', { class: 'semana-dias', id: 'semana-dias' });
  const finalFila = el('div', { class: 'semana-dia semana-final' });
  const mezcla = el('div', { class: 'semana-mezcla', id: 'semana-mezcla', 'aria-label': T.weekMix });

  function fila(id, i) {
    const J = JUEGOS_COPA[id];
    const sub = [J.habilidad, nombreVariante(id)].filter(Boolean).join(' · ');
    return el('div', { class: `semana-dia${arrastrando && sel === id ? ' hueco' : ''}${destino === `m${i}` ? ' on' : ''}`, 'data-dia': i, 'data-juego': id, 'data-clave': `m${i}` },
      el('span', { class: 'cab' }, el('span', { class: 'y' }, fmt(T.gamesDay, { d: i + 1 })), el('span', { class: con('em', J.emoji) }, J.emoji)),
      el('button', { type: 'button', class: 'semana-juego', onClick: () => { SFX.tap(); hoja(i); } }, el('b', {}, J.nombre), el('small', {}, sub)),
      el('span', { class: 'agarre', 'aria-hidden': 'true' }, '⠿'));
  }
  function pintar() {
    chips.replaceChildren(...estilos.map(e => el('button', {
      type: 'button', class: 'estilo' + (estilo === e ? ' on' : ''), 'data-estilo': e, 'aria-pressed': String(estilo === e),
      onClick: () => { SFX.tap(); ultimo = e; tirar(); },
    }, T.weekStyles[e])));
    lista.replaceChildren(...vista().map(fila));
    finalFila.replaceChildren(el('span', { class: 'cab' }, el('span', { class: 'y' }, fmt(T.gamesDay, { d: cal.length })), el('span', { class: 'em' }, JUEGOS_COPA.final.emoji)),
      el('span', { class: 'semana-juego' }, el('b', {}, JUEGOS_COPA.final.nombre), el('small', {}, fmt(T.weekFinal, { n: cal.length - 1 }))));
    const cuenta = {};
    for (const id of semana()) (cuenta[familia(id)] ||= { n: 0, nombre: JUEGOS_COPA[id].habilidad }).n++;
    // More than two of one skill is marked, unless the style asked for it (Puzzles, Trivia and words)
    const tema = estilo && ESTILOS_SEMANA[estilo];
    mezcla.replaceChildren(...Object.values(cuenta).sort((a, b) => b.n - a.n).map(x => el('span', { class: x.n > 2 && !tema ? 'muchas' : '' }, `${x.n} ${x.nombre}`)));
  }

  const cerrarHoja = () => { capa?.remove(); capa = null; document.removeEventListener('keydown', alEscape); };
  const alEscape = ev => { if (ev.key === 'Escape') cerrarHoja(); };
  function hoja(i) {
    cerrarHoja();
    const w = semana(), actual = w[i], J = JUEGOS_COPA[actual];
    const listo = () => { cerrarHoja(); pintar(); };
    const mover = (d, texto) => {
      const b = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', 'data-mover': d, onClick: () => { SFX.tap(); const x = semana(); [x[i], x[i + d]] = [x[i + d], x[i]]; aMano(x); listo(); } }, texto);
      b.disabled = i + d < 0 || i + d >= w.length;
      return b;
    };
    const version = VARIANTES[actual] ? (() => {
      const o = opciones(opcionesVariante(J, VARIANTES[actual]), v => { variantes[actual] = v; pintar(); }, { inicial: variantes[actual] || VARIANTES[actual][0] });
      o.nodo.classList.add('dos', 'variantes');
      return el('div', { class: 'field' }, el('label', {}, T.weekVariant), o.nodo);
    })() : null;
    const juegos = POZO.map(id => {
      const k = w.indexOf(id), G = JUEGOS_COPA[id];
      const etiqueta = id === actual ? T.weekThisDay : k >= 0 ? fmt(T.weekOtherDay, { d: k + 1 }) : nuevos.includes(id) ? T.weekNew : '';
      return el('button', {
        type: 'button', class: 'hoja-juego' + (id === actual ? ' actual' : ''), 'data-juego': id, 'aria-pressed': String(id === actual),
        onClick: () => {
          SFX.tap();
          if (id !== actual) { const x = semana(); if (k >= 0) x[k] = actual; x[i] = id; aMano(x); }
          listo();
        },
      }, el('span', { class: con('em', G.emoji) }, G.emoji), el('span', { class: 't' }, el('b', {}, G.nombre), el('small', {}, lemaDe(id))),
      etiqueta ? el('span', { class: 'etiqueta' + (k < 0 && id !== actual ? ' nueva' : '') }, etiqueta) : null);
    });
    const cerrar = el('button', { type: 'button', class: 'btn btn--yellow btn--sm hoja-listo', id: 'hoja-listo', onClick: () => { SFX.tap(); cerrarHoja(); } }, T.weekClose);
    capa = el('div', { class: 'hoja-capa', id: 'semana-hoja' },
      el('div', { class: 'hoja-fondo', onClick: () => cerrarHoja() }),
      el('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-label': fmt(T.gamesDay, { d: i + 1 }) },
        el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
        el('div', { class: 'hoja-cabeza' }, el('h3', {}, fmt(T.gamesDay, { d: i + 1 }), ' · ', ...conEmoji(J.emoji, J.nombre)), cerrar),
        el('div', { class: 'hoja-mover' }, mover(-1, T.weekEarlier), mover(1, T.weekLater)),
        version,
        el('div', { class: 'field' }, el('label', {}, T.weekSwap)),
        el('div', { class: 'hoja-juegos' }, juegos)));
    document.body.append(capa);
    document.addEventListener('keydown', alEscape);
    cerrar.focus({ preventScroll: true });
  }

  const nodo = el('div', { class: 'panel', id: 'crear-semana' },
    el('div', { class: 'semana-cabeza' }, el('b', { class: 'semana-titulo' }, T.weekTitle), dado),
    chips, lista, finalFila, mezcla, el('small', { class: 'muted semana-ayuda' }, T.weekHint));

  // Dragging a day is choosing where it goes (D-85), the same as the sheet's arrows
  crearArrastre({
    fuentes: [{ contenedor: lista, item: '.semana-dia', eje: 'libre', nombre: 'dia' }],
    activo: () => nodo.isConnected && !capa,
    vibrar: vibrate,
    avatar: item => el('div', { class: 'vilo-carta' }, el('span', { class: con('em', JUEGOS_COPA[item.dataset.juego].emoji) }, JUEGOS_COPA[item.dataset.juego].emoji), el('span', { class: 't' }, JUEGOS_COPA[item.dataset.juego].nombre)),
    alAlzar: item => { sel = item.dataset.juego; destino = null; arrastrando = true; pintar(); },
    medir: () => [...lista.querySelectorAll('.semana-dia')].map(x => {
      const r = x.getBoundingClientRect();
      return { clave: x.dataset.clave, y: r.top + r.height / 2 + window.scrollY };
    }),
    sobre: clave => { destino = clave; pintar(); },
    soltar: (clave, { cancelado }) => {
      if (!cancelado && clave && clave !== `m${semana().indexOf(sel)}`) { aMano(movido(Number(clave.slice(1)))); SFX.tap(); }
      sel = null; destino = null; arrastrando = false; pintar();
    },
  });
  tirar({ animar: false });
  return {
    nodo,
    get cal() { return cal.map(id => entradaCal(id, variantes[id])); },
    /** The 3-day cup (tests and the lab, D-100): another length, another week. */
    dias(n) { dias = n; tirar({ animar: false }); },
  };
}

async function crearCopa() {
  const nuevo = await formularioNuevo();
  mostrar('crear');
  const body = $('#crear-body');
  body.innerHTML = '';
  const err = el('div', { class: 'form-error', role: 'alert' });
  const nombre = campo(T.fCopa, { placeholder: T.fCopaPh, maxlength: String(COPA_MAX) }, { contador: true });
  // La Copa de 3 días es solo para probar con amigos (D-100): se ofrece con ?three en la URL
  // o en el modo de prueba, nunca en la portada.
  const juegos = nuevo ? armarSemana() : elegirJuegos();
  // The new screen (D-425) starts at seven days with the week in view: the 3-day cup goes under "More options"
  const modo = nuevo && !TRES ? { valor: 7, nodo: null } : opciones([
    TRES ? { valor: 3, titulo: T.mode3, sub: T.mode3Sub } : null,
    { valor: 7, titulo: T.mode7, sub: T.mode7Sub },
  ].filter(Boolean), dias => {
    if (nuevo) { juegos.dias(dias); fechas(); return; }
    juegos.nodo.hidden = false; juegos.sortear(dias);
  }, { inicial: nuevo ? 7 : null });
  // El idioma de las palabras de Conexiones y de Palabra (D-170): parte en el de quien la crea
  const mayuscula = x => x[0].toUpperCase() + x.slice(1);
  // La hora de la copa sigue al idioma de sus palabras (D-194): en alemán, la de Europa central
  const notaZona = el('small', { class: 'muted', id: 'crear-zona' }, fmt(T.startZone, { zona: zonaTexto(zonaDeIdioma(LANG)) }));
  const idioma = opciones(LANGS.map(l => ({ valor: l, titulo: mayuscula(T.langNames[l]) })),
    l => { notaZona.textContent = fmt(T.startZone, { zona: zonaTexto(zonaDeIdioma(l)) }); resumir(); fechas(); }, { inicial: LANG });
  // El público (D-187): global, Chile o Brasil. Parte en el del idioma de quien la crea
  const PUBLICOS = { global: T.audGlobal, cl: T.audCl, br: T.audBr };
  const alcance = opciones(Object.entries(PUBLICOS).map(([valor, titulo]) => ({ valor, titulo })), () => resumir(),
    { inicial: { es: 'cl', pt: 'br' }[LANG] || 'global' });
  alcance.nodo.classList.add('tres');
  // Hoy, mañana u otra fecha de un calendario, hasta 30 días desde hoy (D-115)
  const hoyCrear = fechaEn(Date.now(), zonaDeIdioma(idioma.valor));
  const otraFecha = campoFecha(hoyCrear);
  // On the new screen (D-425, the owner's review) Today is Now, and each says its day of the week: "Ahora (jue)"
  const conDia = (titulo, n) => (nuevo ? `${titulo} (${diaCorto(sumarDias(hoyCrear, n))})` : titulo);
  const inicio = opciones([{ valor: 0, titulo: conDia(nuevo ? T.startNow : T.startToday, 0) }, { valor: 1, titulo: conDia(T.startTomorrow, 1) }, { valor: 'otra', titulo: T.startOther }],
    v => { otraFecha.nodo.hidden = v !== 'otra'; if (v === 'otra') otraFecha.input.focus(); fechas(); });
  inicio.nodo.classList.add('tres');
  otraFecha.input.addEventListener('change', () => fechas());
  const yo = campo(T.fYou, { placeholder: T.fYouPh, maxlength: '20', value: cuenta.nombre.get() || leerYo()?.n || '' }, { contador: true });
  // The new screen asks for the PIN once, with 👁 to see it (D-425)
  const pin1 = campoPin(T.fPin), pin2 = nuevo ? null : campoPin(T.fPin2);
  if (nuevo) {
    const ojo = el('button', { type: 'button', class: 'ver-pin', id: 'ver-pin', 'aria-label': T.pinShow, 'aria-pressed': 'false' }, '👁');
    ojo.addEventListener('click', () => {
      const ver = pin1.input.type === 'password';
      pin1.input.type = ver ? 'text' : 'password';
      ojo.setAttribute('aria-pressed', String(ver)); ojo.setAttribute('aria-label', ver ? T.pinHide : T.pinShow);
    });
    const filaPin = el('div', { class: 'pin-fila' });
    pin1.input.replaceWith(filaPin);
    filaPin.append(pin1.input, ojo);
  }
  const boton = el('button', { class: 'btn btn--yellow', id: 'btn-crear-go' }, T.createGo);
  // Under the button, when the cup starts and ends, in words (D-425)
  const lineaFechas = el('small', { class: 'muted crear-fechas', id: 'crear-fechas', 'aria-live': 'polite' });
  function fechas() {
    if (!nuevo) return;
    const hoy = fechaEn(Date.now(), zonaDeIdioma(idioma.valor));
    const desde = inicio.valor === 'otra' ? (otraFecha.valida() ? otraFecha.input.value : null) : inicio.valor === null ? null : sumarDias(hoy, inicio.valor);
    lineaFechas.textContent = desde ? fmt(T.startsLine, { inicio: fechaDia(desde), fin: fechaDia(sumarDias(desde, modo.valor - 1)) }) : '';
  }
  // "More options", folded, says in one line what is chosen inside
  const resumen = el('small', { class: 'muted', id: 'crear-resumen' });
  function resumir() {
    const a = link.input.value.trim() ? `?${aliasLimpio(link.input.value)}` : T.moreNoLink;
    resumen.textContent = [mayuscula(T.langNames[idioma.valor]), PUBLICOS[alcance.valor], a].join(' · ');
  }
  // El link propio, opcional (D-121): se ve cómo queda y si está libre mientras se escribe
  const link = campo(T.fLink, { placeholder: T.fLinkPh, maxlength: '20', id: 'crear-link', autocapitalize: 'none', spellcheck: 'false' });
  const linkEstado = el('small', { class: 'muted link-estado', id: 'link-estado', 'aria-live': 'polite' }, T.fLinkHint);
  link.nodo.append(linkEstado);
  let linkTimer = null, linkLibre = null;
  const revisarLink = async () => {
    const a = aliasLimpio(link.input.value);
    linkLibre = null;
    if (!link.input.value.trim()) { linkEstado.textContent = T.fLinkHint; linkEstado.className = 'muted link-estado'; return; }
    const url = `juegosdesalon.cl/cup/?${a}`;
    if (!esAlias(a) || RESERVADAS.includes(a)) { linkEstado.textContent = fmt(T.fLinkBad, { url }); linkEstado.className = 'link-estado mal'; return; }
    linkEstado.textContent = fmt(T.fLinkChecking, { url }); linkEstado.className = 'muted link-estado';
    try {
      const st = await abrirStore(); await st.listo();
      const x = await st.alias(a);
      if (aliasLimpio(link.input.value) !== a) return;
      linkLibre = !(x && x.hasta > st.now());
      linkEstado.textContent = fmt(linkLibre ? T.fLinkFree : T.fLinkTaken, { url });
      linkEstado.className = 'link-estado ' + (linkLibre ? 'ok' : 'mal');
    } catch (_) { linkEstado.textContent = fmt(T.fLinkChecking, { url }); }
  };
  link.input.addEventListener('input', () => { clearTimeout(linkTimer); linkTimer = setTimeout(revisarLink, 350); resumir(); });

  boton.addEventListener('click', async () => {
    SFX.tap();
    const n = limpiarNombre(nombre.input.value, COPA_MAX), quien = limpiarNombre(yo.input.value);
    if (!n) return avisoError(err, T.errCopa);
    if (!modo.valor) return avisoError(err, TRES ? T.errMode : T.errMode7);
    if (inicio.valor === null) return avisoError(err, T.errStart);
    if (inicio.valor === 'otra' && !otraFecha.valida()) return avisoError(err, fmt(T.errStartDate, { n: MAX_DIAS_INICIO }));
    if (!quien) return avisoError(err, T.errNombre);
    const pinCrear = sinPinDeCopa() ? pinAlAzar() : pin1.input.value;
    if (!sinPinDeCopa()) {
      if (!esPin(pin1.input.value)) return avisoError(err, T.errPin);
      if (pin2 && pin1.input.value !== pin2.input.value) return avisoError(err, T.errPin2);
    }
    const alias = link.input.value.trim() ? aliasLimpio(link.input.value) : null;
    if (alias && (!esAlias(alias) || RESERVADAS.includes(alias))) { if (mas) mas.open = true; return avisoError(err, fmt(T.fLinkBad, { url: `juegosdesalon.cl/cup/?${alias}` })); }
    boton.disabled = true; boton.textContent = T.creating; err.textContent = '';
    try {
      const st = await abrirStore();
      await st.listo();
      let code = null;
      for (let i = 0; i < 8 && !code; i++) { const c = codigoAlAzar(); if (!(await st.existe(c))) code = c; }
      if (!code) throw Object.assign(new Error('busy'), { code: 'busy' });
      const pid = pidAlAzar();
      const now = st.now();
      if (alias) { const x = await st.alias(alias); if (x && x.hasta > now) throw Object.assign(new Error('alias'), { code: 'alias' }); }
      const zona = zonaDeIdioma(idioma.valor);
      const fechaInicio = inicio.valor === 'otra' ? otraFecha.input.value : sumarDias(fechaEn(now, zona), inicio.valor);
      // Las copas del laboratorio (y las de prueba) llevan la marca que deja pasar de día (D-115)
      const meta = nuevaMeta({ nombre: n, dias: modo.valor, inicio: fechaInicio, tz: zona, admin: pid, creada: now, lab: LABS || PRUEBA, alias, cal: juegos.cal, lang: idioma.valor, aud: alcance.valor });
      await st.crear(code, meta, { pid, name: quien, at: now, pinHash: await hashPin(code, pid, pinCrear), co: miPais() });
      cuenta.nombre.set(quien);
      cuenta.recordar(code, pid, { nombre: quien, copa: n, fin: meta.end });
      entrarComoJugador(quien, pinCrear);
      history.replaceState(null, '', `${location.pathname}?${alias || code}${PRUEBA ? '&test' : ''}`);
      await abrirCopa(code, { recienCreada: true });
    } catch (e) {
      avisoError(err, errorDe(e));
      boton.disabled = false; boton.textContent = T.createGo;
    }
  });

  const volver = el('button', { class: 'btn btn--ghost btn--sm', onClick: () => portada() }, '‹ ' + T.menu.replace('‹ ', ''));
  const campoIdioma = el('div', { class: 'field' }, el('label', {}, T.fLang), idioma.nodo, el('small', { class: 'muted' }, T.fLangHint));
  const campoAlcance = el('div', { class: 'field', id: 'crear-alcance' }, el('label', {}, T.fScope), alcance.nodo, el('small', { class: 'muted' }, T.fScopeHint));
  const mas = nuevo ? el('details', { class: 'panel mas-opciones', id: 'crear-mas' },
    el('summary', {}, el('span', { class: 'mas-t' }, T.moreOptions, resumen)),
    modo.nodo ? el('div', { class: 'field' }, el('label', {}, T.fMode), modo.nodo) : null,
    campoIdioma, campoAlcance, link.nodo) : null;
  resumir();
  if (nuevo) return poner(body,
    el('div', { class: 'panel' }, nombre.nodo,
      el('div', { class: 'field' }, el('label', {}, T.fStart), inicio.nodo, otraFecha.nodo, notaZona)),
    juegos.nodo,
    el('div', { class: 'panel' }, yo.nodo, ...camposPin(pin1, pin2)),
    mas, err, boton, lineaFechas, volver);
  poner(body, 
    el('div', { class: 'panel' }, nombre.nodo,
      el('div', { class: 'field' }, el('label', {}, T.fMode), modo.nodo),
      el('div', { class: 'field' }, el('label', {}, T.fStart), inicio.nodo, otraFecha.nodo, notaZona)),
    juegos.nodo,
    el('div', { class: 'panel' }, campoIdioma, campoAlcance),
    el('div', { class: 'panel' }, link.nodo),
    el('div', { class: 'panel' }, yo.nodo, ...camposPin(pin1, pin2)),
    err, boton, volver,
  );
}

/* ------------------------------------------------------------------ */
/* Abrir una copa                                                      */
/* ------------------------------------------------------------------ */

function espera(texto, { error = false, reintentar = null } = {}) {
  mostrar('espera');
  const body = $('#espera-body');
  body.innerHTML = '';
  poner(body, el('div', { class: error ? 'form-error' : 'waiting' }, texto));
  if (reintentar) poner(body, el('button', { class: 'btn btn--cyan', onClick: reintentar }, T.retry));
  if (error) poner(body, el('a', { class: 'btn btn--ghost btn--sm', href: location.pathname + (PRUEBA ? '?test' : '') }, T.menu));
}

async function abrirCopa(code, { recienCreada = false, pantalla = null } = {}) {
  S.code = code;
  espera('…');
  let st;
  try { st = await abrirStore(); await st.listo(); } catch (e) { espera(errorDe(e), { error: true, reintentar: () => location.reload() }); return; }
  if (S.off) S.off();
  let primera = true;
  S.off = st.escuchar(code, L => {
    const habia = !!S.L?.meta;
    // Si el admin la terminó antes (D-161), la copa se ve cerrada desde esa hora
    L = conCierre(L);
    S.L = L;
    if (!L || !L.meta) {
      // La borró su admin (D-117): quien la tenía abierta se entera, y este celular la olvida
      if (S.eliminando) return;
      if (habia) { cuenta.olvidar(code); espera(T.copaDeleted, { error: true }); return; }
      espera(T.errNoExiste, { error: true }); return;
    }
    if (primera) {
      primera = false;
      // Si la copa tiene link propio, la dirección lo muestra aunque se haya entrado por el código
      // (la lista de tus copas, un link viejo): así lo que se copie de la barra es el link bonito (D-121)
      const q = new URLSearchParams(location.search);
      if (L.meta.alias && !q.has('demo')) {
        history.replaceState(null, '', `${location.pathname}?${L.meta.alias}${PRUEBA ? '&test' : ''}`);
      } else if (tiene('day', q) || tiene('mute', q)) {
        // Lo que pidió el aviso se hace una vez: recargar no vuelve a silenciar ni a abrir el día (D-229)
        for (const k of [...nombres('day'), ...nombres('mute')]) q.delete(k);
        history.replaceState(null, '', `${location.pathname}?${q.toString().replace(/=(?=&|$)/g, '')}`);
      }
      const pid = cuenta.quien(code);
      if (pid && L.players?.[pid]) {
        S.yo = pid;
        vincularJugador(L);
        cuenta.recordar(code, pid, { nombre: L.players[pid].name, copa: L.meta.name, fin: L.meta.end });
        // Recién creada, el admin parte en Administrar, con la guía de la primera vez (D-110)
        if (recienCreada) { S.bienvenida = true; admin(); } else if (pantalla === 'admin') admin(); else desdeAviso();
      } else sentarseSolo(L).then(listo => { if (!listo) entrar(); });
      return;
    }
    vincularJugador(L);
    // Lo que llega mientras se mira algo que depende de la copa, se redibuja
    if (S.pantalla === 'tablero') tablero();
    else if (S.pantalla === 'admin') admin();
    else if (S.pantalla === 'resultado' && S.verDia) resultado(S.verDia);
    else if (S.pantalla === 'entrar') entrar({ mantener: true });
  }, e => espera(errorDe(e), { error: true, reintentar: () => location.reload() }));
}

/**
 * La copa y los rankings (D-212). Si en este celular hay un jugador, el de la copa queda
 * enlazado a él y la copa, en su lista (D-220); los de la copa que también lo están pasan a ser sus amigos; y cuando la copa
 * termina, su podio se guarda una vez para el medallero. Todo es de adorno: nunca frena la copa.
 */
let podioGuardado = false;

/** A phone whose player is linked to one of this cup's players sits as them, with no PIN (D-359). */
async function sentarseSolo(Lc) {
  const yo = leerYo();
  if (!yo || !rankingsVisibles()) return false;
  const pid = Object.keys(Lc.players || {}).find(p => !Lc.players[p].out && Lc.players[p].j === yo.jid);
  if (!pid) return false;
  try {
    await store.sentarseComoJugador(S.code, pid, yo.jid);
    S.yo = pid;
    cuenta.recordar(S.code, pid, { nombre: Lc.players[pid].name, copa: Lc.meta.name, fin: Lc.meta.end });
    vincularJugador(Lc);
    desdeAviso();
    return true;
  } catch (_) { return false; }
}

/**
 * Someone who joins a cup with no player on this phone, but with their usual name and PIN, is that
 * player (D-358): the cup PIN they typed is tried as the player's PIN, and if it opens a player with
 * that name, this phone enters as them and the cup adds to their history. Nothing is created, and a
 * PIN that opens no player changes nothing.
 */
/** Under the cup PIN, with no player on this phone: the usual name and PIN carry the history (D-358). */
/**
 * With a player on this phone, La Copa asks no cup PIN (D-359): the player's PIN already says who
 * it is. The cup still keeps a key for that cup player, a random one nobody needs to know, so the
 * seat works as before and the admin can still give a new PIN.
 */
const sinPinDeCopa = () => !!leerYo() && rankingsVisibles();
function pinAlAzar() {
  const x = new Uint32Array(1); crypto.getRandomValues(x);
  return String(x[0] % 10000).padStart(4, '0');
}

/** The cup PIN fields, or nothing when this phone's player stands in for them (D-359). */
const camposPin = (a, b) => (sinPinDeCopa()
  ? [el('small', { class: 'muted', id: 'sin-pin-copa' }, fmt(T.noCupPin, { name: leerYo().n }))]
  : [a.nodo, b?.nodo, el('small', { class: 'muted' }, T.pinHint), consejoJugador()]);

const consejoJugador = () => (leerYo() || !rankingsVisibles() ? null : el('small', { class: 'muted', id: 'consejo-jugador' }, T.pinPlayerTip));

/**
 * The linked player's seat was lost with the anonymous session (D-416): their player's PIN seats
 * the phone as the player again, and then as the cup player with no cup PIN, as D-359. A PIN that
 * is not the player's may be a new cup PIN from the admin, so it is tried as that. 'pin' if neither.
 */
async function sentarseConPinJugador(pid, pin) {
  try {
    await (await jugador()).reseat(pin);
  } catch (e) {
    if (e?.code !== 'pin') throw e;
    await store.sentarse(S.code, pid, await hashPin(S.code, pid, pin));
    return;
  }
  await store.sentarseComoJugador(S.code, pid, leerYo().jid);
}

async function entrarComoJugador(nombre, pin) {
  try {
    if (leerYo() || !rankingsVisibles()) return;
    const J = await jugador();
    const r = await J.entrar(nombre, pin);
    if (r.estado !== 'dentro') return;
    toast(fmt(T.playerJoined, { name: J.yo().n }));
    if (S.L) vincularJugador(S.L);
  } catch (_) { /* sin red: la copa sigue igual */ }
}

async function vincularJugador(Lc) {
  try {
    if (!Lc?.meta || !S.yo || !Lc.players?.[S.yo]) return;
    const J = await jugador();
    J.conocer(Object.fromEntries(Object.values(Lc.players).filter(p => p?.j).map(p => [p.j, p.name])));
    const yo = leerYo();
    if (yo && S.enlazado !== yo.jid) {
      S.enlazado = yo.jid;
      if (Lc.players[S.yo].j !== yo.jid) await store.enlazar(S.code, S.yo, yo.jid);
      // Y la copa queda en la lista del jugador, para verla desde cualquier celular (D-220)
      await J.anotarCopa(S.code, S.yo);
      // A podium saved while this cup player had no player of their own now carries theirs (D-358)
      await J.firmarPodio(S.code, S.yo).catch(() => {});
    }
    if (!podioGuardado && !Lc.meta.lab && terminada(Lc.meta, ahora()) && activos(Lc).length >= 2) {
      podioGuardado = true;
      const fin = Lc.meta.end;
      await J.guardarPodio(S.code, {
        name: Lc.meta.name, end: Math.min(fin, ahora()), de: activos(Lc).length, dias: Lc.meta.days, por: S.yo,
        p: podioDe(tabla(Lc, null, fin), Lc.players),
      });
    }
  } catch (_) { /* sin red o sin permiso: la copa sigue igual */ }
}

const L = () => S.L;
const ahora = () => store.now();
const nombreDe = pid => L().players?.[pid]?.name || '?';

/* ------------------------------------------------------------------ */
/* Entrar: inscribirse o sentarse                                      */
/* ------------------------------------------------------------------ */

let entrarModo = null;

function entrar({ mantener = false } = {}) {
  const { meta, players = {} } = L();
  const body = $('#entrar-body');
  // Si alguien está escribiendo, no se le borra el formulario por una actualización
  if (mantener && body.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  mostrar('entrar');
  body.innerHTML = '';
  const now = ahora();
  const d = diaActual(meta, now);
  const jug = activos(L());
  // "7 días · Parte el viernes 25 de septiembre · 3 jugadores inscritos" (D-120)
  const inscritos = fmt(jug.length === 1 ? T.signedUpOne : T.signedUp, { n: jug.length });
  const info = d === 0
    ? fmt(T.inviteInfo, { dias: meta.days, fecha: fechaLarga(meta.win[1].a, meta.tz), inscritos })
    : terminada(meta, now) ? fmt(T.inviteEnded, { dias: meta.days, inscritos })
    : fmt(T.inviteStarted, { dias: meta.days, d: Math.min(d, meta.days), n: meta.days, inscritos });
  const err = el('div', { class: 'form-error', role: 'alert' });
  const puedeEntrar = inscripcionAbierta(meta, now, L().closed) && jug.length < MAX_JUGADORES;
  // El jugador de este celular, si la copa ya lo tiene enlazado (D-220)
  const yoJ = leerYo();
  const deVuelta = S.reentrar && players[S.reentrar] && !players[S.reentrar].out ? S.reentrar : null;
  const mio = deVuelta || (appPid && players[appPid] && !players[appPid].out ? appPid : null)
    || (yoJ && Object.keys(players).find(pid => !players[pid].out && players[pid].j === yoJ.jid));

  const caja = el('div', { class: 'stack' });
  const nuevo = () => {
    entrarModo = 'nuevo';
    caja.innerHTML = '';
    const yo = campo(T.fYou, { placeholder: T.fYouPh, maxlength: '20', value: cuenta.nombre.get() || leerYo()?.n || '' }, { contador: true });
    const p1 = campoPin(T.fPin), p2 = campoPin(T.fPin2);
    const b = el('button', { class: 'btn btn--yellow', id: 'btn-inscribir' }, T.joinGo);
    b.addEventListener('click', async () => {
      SFX.tap();
      const n = limpiarNombre(yo.input.value);
      if (!n) return avisoError(err, T.errNombre);
      const sinPin = sinPinDeCopa();
      if (!sinPin) {
        if (!esPin(p1.input.value)) return avisoError(err, T.errPin);
        if (p1.input.value !== p2.input.value) return avisoError(err, T.errPin2);
      }
      // Un nombre que ya está: si el PIN es el suyo, cuenta como entrar, sin volver a escribirlo (D-120)
      const existente = Object.entries(L().players || {}).find(([, x]) => !x.out && claveNombre(x.name) === claveNombre(n));
      if (existente) {
        const [pid, x] = existente;
        // With a player and no cup PIN, only the cup player linked to them is theirs (D-359)
        if (sinPin && x.j !== leerYo().jid) return avisoError(err, T.errRepetido);
        b.disabled = true; b.textContent = T.joining;
        try {
          if (sinPin) await store.sentarseComoJugador(S.code, pid, leerYo().jid);
          else await store.sentarse(S.code, pid, await hashPin(S.code, pid, p1.input.value));
          cuenta.recordar(S.code, pid, { nombre: x.name, copa: meta.name, fin: meta.end });
          S.yo = pid;
          if (!sinPin) entrarComoJugador(x.name, p1.input.value);
          vincularJugador(L());
          SFX.reveal(); toast(fmt(T.welcomeBack, { name: x.name }));
          tablero();
        } catch (e) {
          avisoError(err, e?.code === 'pin' ? fmt(T.errRepetidoPin, { name: x.name }) : errorDe(e));
          b.disabled = false; b.textContent = T.joinGo;
        }
        return;
      }
      if (Object.values(L().players || {}).some(p => claveNombre(p.name) === claveNombre(n))) return avisoError(err, T.errRepetido);
      b.disabled = true; b.textContent = T.joining;
      try {
        const pid = pidAlAzar();
        const pin = sinPin ? pinAlAzar() : p1.input.value;
        await store.inscribir(S.code, { pid, name: n, at: ahora(), pinHash: await hashPin(S.code, pid, pin), co: miPais() });
        cuenta.nombre.set(n);
        cuenta.recordar(S.code, pid, { nombre: n, copa: meta.name, fin: meta.end });
        S.yo = pid;
        if (!sinPin) entrarComoJugador(n, pin);
        vincularJugador(L());
        SFX.reveal();
        tablero();
      } catch (e) { avisoError(err, errorDe(e)); b.disabled = false; b.textContent = T.joinGo; }
    });
    poner(caja, el('div', { class: 'panel' }, yo.nodo, ...camposPin(p1, p2)),
      d > 2 ? el('p', { class: 'muted center' }, T.lateJoin) : null, err, b);
  };
  const inscrito = () => {
    entrarModo = 'inscrito';
    caja.innerHTML = '';
    let elegido = null;
    const p = campoPin(T.fPin);
    const b = el('button', { class: 'btn btn--yellow', id: 'btn-sentarse', disabled: true }, T.pickName);
    // The cup player linked to this phone's player sits with no PIN (D-359)
    const esMio = pid => !!(yoJ && rankingsVisibles() && players[pid]?.j === yoJ.jid);
    const pistaCopa = el('small', { class: 'muted', id: 'pista-pin-copa' }, T.pinCopaHint);
    // The linked player's seat can be lost too (same anonymous session): then their PIN is asked
    // for here, the player's, or a new cup PIN from the admin (D-416)
    let conPinJugador = false;
    const pistaJugador = el('small', { class: 'muted', id: 'pista-pin-jugador' });
    const verPin = () => {
      const mia = esMio(elegido);
      p.nodo.hidden = mia && !conPinJugador;
      pistaCopa.hidden = mia;
      pistaJugador.hidden = !(mia && conPinJugador);
      if (yoJ) pistaJugador.textContent = fmt(T.playerPinHint, { name: yoJ.n });
    };
    const nombres = el('div', { class: 'nombres' }, Object.entries(players).filter(([, x]) => !x.out)
      .sort((a, b2) => a[1].name.localeCompare(b2[1].name, 'es'))
      .map(([pid, x]) => el('button', {
        type: 'button', class: 'chip-btn', 'data-pid': pid,
        onClick: ev => {
          SFX.tap(); elegido = pid;
          $$('.chip-btn', nombres).forEach(c => c.classList.toggle('on', c === ev.currentTarget));
          b.disabled = false; b.textContent = fmt(T.loginGo, { name: x.name });
          verPin();
          if (!p.nodo.hidden) p.input.focus();
        },
      }, x.name)));
    const pedirPinJugador = () => {
      conPinJugador = true;
      err.textContent = '';
      lead.id = 'sesion-jugador-perdida';
      lead.textContent = fmt(T.playerSeatLost, { name: yoJ.n });
      verPin();
      p.input.focus();
    };
    // Quien llega desde las copas de su jugador (D-220) ya tiene su nombre elegido: falta el PIN
    if (mio) {
      elegido = mio;
      $$('.chip-btn', nombres).forEach(c => c.classList.toggle('on', c.dataset.pid === mio));
      b.disabled = false; b.textContent = fmt(T.loginGo, { name: players[mio].name });
      verPin();
    }
    b.addEventListener('click', async () => {
      SFX.tap();
      if (!elegido) return;
      const mia = esMio(elegido);
      const conPin = !mia || conPinJugador;
      if (conPin && !esPin(p.input.value)) return avisoError(err, T.errPin);
      b.disabled = true;
      try {
        if (mia && conPinJugador) await sentarseConPinJugador(elegido, p.input.value);
        else if (mia) await store.sentarseComoJugador(S.code, elegido, yoJ.jid);
        else await store.sentarse(S.code, elegido, await hashPin(S.code, elegido, p.input.value));
        cuenta.recordar(S.code, elegido, { nombre: players[elegido].name, copa: meta.name, fin: meta.end });
        S.yo = elegido;
        S.reentrar = null;
        if (!mia) entrarComoJugador(players[elegido].name, p.input.value);
        vincularJugador(L());
        SFX.reveal();
        tablero();
      } catch (e) {
        b.disabled = false;
        // Linked, but the rules no longer see this phone as the player: not a wrong PIN (D-416)
        if (mia && !conPinJugador && e?.code === 'pin') return pedirPinJugador();
        avisoError(err, e?.code !== 'pin' ? errorDe(e)
          : mia ? fmt(T.errPlayerPin, { name: yoJ.n }) : fmt(T.errPinWrong, { name: players[elegido].name }));
      }
    });
    // Con un jugador en este celular hay dos PIN: aquí va el de la copa (D-96, D-220)
    // Desde la app instalada en iPhone (D-223): ya se sabe quién es, falta solo el PIN
    const desdeApp = appPid && elegido === appPid;
    // Este celular dejó de estar sentado como su jugador: se le dice por qué le piden el PIN
    const lead = deVuelta && elegido === deVuelta ? el('p', { class: 'lead', id: 'sentarse-de-nuevo' }, fmt(T.seatLost, { name: players[deVuelta].name }))
      : el('p', { class: 'lead', id: desdeApp ? 'bienvenida-app' : null }, desdeApp ? fmt(T.avAppWelcome, { name: players[appPid].name }) : T.pickName);
    poner(caja, el('div', { class: 'panel' }, lead, nombres, p.nodo,
      yoJ ? pistaCopa : consejoJugador(), pistaJugador), err, b);
    verPin();
    // Back from a lost seat as the linked player: both seats hung from the same session (D-416)
    if (deVuelta && elegido === deVuelta && esMio(deVuelta)) pedirPinJugador();
  };

  const tabs = el('div', { class: 'seg' },
    puedeEntrar ? el('button', { type: 'button', id: 'tab-nuevo', onClick: ev => { SFX.tap(); marcar(ev); nuevo(); } }, T.imNew) : null,
    el('button', { type: 'button', id: 'tab-inscrito', onClick: ev => { SFX.tap(); marcar(ev); inscrito(); } }, T.imIn));
  const marcar = ev => $$('button', tabs).forEach(x => x.classList.toggle('on', x === ev.currentTarget));

  poner(body, 
    el('div', { class: 'intro-hero' }, el('span', { class: 'icon' }, '🏆'),
      el('p', { class: 'muted', style: 'margin:0' }, T.inviteTitle),
      el('h1', { class: 'display display--lg rainbow' }, meta.name),
      el('p', { class: 'lead' }, info),
      avisoPalabras(meta),
      avisoAudiencia(meta),
      el('div', { style: 'margin-top:6px' }, langToggle())),
    el('div', { class: 'cal-mini' }, calendario(meta).map(j => el('span', { title: JUEGOS_COPA[j].nombre, class: con('', JUEGOS_COPA[j].emoji) }, JUEGOS_COPA[j].emoji))),
    // Por qué no puede inscribirse: terminó, la cerró el administrador, está llena o ya va en la final
    puedeEntrar ? null : el('p', { class: 'muted center' }, terminada(meta, now) ? T.closedEnded
      : !inscripcionAbierta(meta, now) ? T.errCerrada : L().closed ? T.closedByAdmin : T.errLlena),
    tabs, caja,
  );
  if (!puedeEntrar || entrarModo === 'inscrito' || (mio && entrarModo !== 'nuevo')) $('#tab-inscrito').click();
  else $('#tab-nuevo').click();
  // Quien perdió su asiento llega desde Empezar: el porqué y su PIN quedan a la vista, no bajo
  // "Te invitaron a una copa", que en un celular chico los deja fuera de la pantalla
  if (deVuelta && !mantener) caja.scrollIntoView({ block: 'center' });
}

/**
 * Las reglas dejaron de reconocer a este celular como su jugador (perdió su sesión anónima, o el
 * admin le dio un PIN nuevo): se vuelve a entrar con el PIN, con el nombre ya elegido. El intento
 * del día no se pierde: se guarda por jugador y se retoma al volver.
 */
function sentarseDeNuevo() {
  S.reentrar = S.yo;
  S.yo = null;
  entrarModo = 'inscrito';
  entrar();
}

/* ------------------------------------------------------------------ */
/* Tablero                                                             */
/* ------------------------------------------------------------------ */

function esAdmin() { return L()?.meta?.admin === S.yo; }

/** Hasta cuándo se puede jugar un día, dicho como lo entiende una persona. */
function hastaCuando(d, est, now) {
  const { meta } = L();
  const falta = faltaPara(meta.win[d].b - now);
  if (est === 'jugado') return fmt(T.closesIn, { t: falta });
  if (est === 'gracia' || esFinal(meta, d)) return fmt(T.untilTonight, { t: falta });
  return T.untilTomorrowNight;
}

/**
 * La píldora ×2: dorada para el comodín, cian para la final, que vale doble para todos. Así no se
 * confunden: un ×2 de la final no es un comodín, y los dos nunca se suman (D-151).
 */
const claseX2 = final => `chip ${final ? 'chip--final' : 'chip--gold'}`;

function tarjetaDia(d, rotulo) {
  const Lc = L(), { meta } = Lc;
  const id = juegoDelDia(meta, d), J = juegoDia(meta, d);
  const now = ahora();
  const est = estadoDia(Lc, d, S.yo, now);
  const x2 = multiplicador(Lc, d, S.yo) === 2;
  const jugaron = activos(Lc).filter(j => Lc.results?.[d]?.[j.pid]);
  const falta = faltan(Lc, d, now);
  let accion;
  if (est === 'jugado') accion = el('button', { class: 'btn btn--cyan btn--sm', onClick: () => { SFX.tap(); resultado(d); } }, T.seeResult);
  // Out of the cup (D-347): nothing left to play; the notice on top says why
  else if (fuera(Lc, S.yo, now)) accion = null;
  // Con el admin solo no se juega (D-118): falta con quién competir
  else if ((est === 'hoy' || est === 'gracia') && faltaGente(Lc)) accion = el('div', { class: 'aviso', id: 'falta-gente' }, T.needSecond);
  else if (est === 'hoy' || est === 'gracia') accion = el('button', { class: 'btn btn--yellow', 'data-dia': d, onClick: () => { SFX.tap(); antesDeJugar(d); } }, `${J.emoji} ${T.play}`);
  else if (est === 'en-curso') accion = el('button', { class: 'btn btn--yellow', 'data-dia': d, onClick: () => { SFX.tap(); jugar(d); } }, `${J.emoji} ${T.resume}`);
  return el('div', { class: `panel dia-card ${est}` },
    el('div', { class: 'dia-top' },
      el('span', { class: 'chip' + (rotulo === T.today ? ' chip--hot' : '') }, rotulo),
      el('span', { class: 'muted' }, `${fmt(T.dayOf, { d, n: meta.days })} · ${fechaCorta(meta.win[d].a, meta.tz)}`),
      x2 ? el('span', { class: claseX2(esFinal(meta, d)) }, esFinal(meta, d) ? T.x2 : `${T.x2} ${T.wildUsed}`) : null),
    el('div', { class: 'dia-juego' }, el('span', { class: con('dia-emoji', J.emoji) }, J.emoji), el('div', {}, el('b', {}, J.nombre, J.varianteNombre ? el('span', { class: 'dia-variante' }, ` · ${J.varianteNombre}`) : null), el('small', { class: 'muted' }, est !== 'jugado' && fuera(Lc, S.yo, now) ? T.outTitle : hastaCuando(d, est, now)))),
    est === 'jugado' ? el('p', { class: 'ok' }, `✅ ${T.played}`) : null,
    accion,
    el('p', { class: 'muted quienes' }, jugaron.length ? fmt(T.whoPlayed, { names: jugaron.map(j => j.name).join(', ') }) : T.nobodyPlayed),
    falta.length && jugaron.length ? el('p', { class: 'muted quienes' }, fmt(T.missing, { names: falta.map(j => j.name).join(', ') })) : null,
  );
}

/**
 * La tabla con un bloque por día de la copa, los siete (D-131): con puntos si ya se ven, ✓ si
 * jugó pero todavía no los puedes ver, "por jugar" si el día está abierto y no ha jugado, "–" si
 * se cerró sin jugarlo, y vacío si el día todavía no abre. Out of the cup (D-347, D-376): the days
 * after the last one they played become a single "Eliminado" pill, in the same columns.
 */
function vistaTabla(filas, { dias, meta, now }) {
  const bloque = (f, d) => {
    const x = f.dias[d];
    if (!x) return el('span', { class: 'pd pendiente', title: T.blockPending }, '');
    if (x.oculto) return x.jugo ? el('span', { class: 'pd oculto', title: T.blockHidden }, '✓') : el('span', { class: 'pd abierto', title: T.blockOpen }, '•');
    if (!x.jugo) return abierto(meta, d, now) ? el('span', { class: 'pd abierto', title: T.blockOpen }, '•') : el('span', { class: 'pd perdido', title: T.blockMissed }, '–');
    return el('span', { class: 'pd' + (x.x === 2 ? ' doble' : '') + (x.pos === 1 ? ' oro' : '') }, String(x.pts));
  };
  const bloques = f => {
    if (!f.fuera) return dias.map(d => bloque(f, d));
    const ultimo = dias.reduce((u, d, i) => (f.dias[d]?.jugo ? i : u), -1);
    const resto = dias.length - ultimo - 1;
    // At least as wide as the blocks it replaces (each one 1.9em of its 0.72rem letter, with the 4px
    // gap between them), and wider if the word needs it: a single day left, or German
    return [...dias.slice(0, ultimo + 1).map(d => bloque(f, d)),
      resto ? el('span', { class: 'pd eliminado', style: `min-width:calc(${resto} * 1.368rem + ${resto - 1} * 4px)` }, T.outBadge) : null];
  };
  return el('div', { class: 'tabla' }, filas.map(f => el('div', { class: 'fila' + (f.pid === S.yo ? ' yo' : '') + (f.fuera ? ' fuera' : '') },
    // Out of the cup (D-347): a door instead of a place, and faded (D-376)
    el('span', { class: 'lugar', title: f.fuera ? fmt(T.outAdmin, { a: f.fuera.desde, b: f.fuera.hasta }) : null }, f.fuera ? '🚪' : String(f.lugar)),
    el('span', { class: 'flecha ' + (f.flecha > 0 ? 'sube' : f.flecha < 0 ? 'baja' : '') }, f.flecha > 0 ? '▲' : f.flecha < 0 ? '▼' : ''),
    el('div', { class: 'quien' },
      el('b', {}, f.name, f.pid === S.yo ? el('small', { class: 'muted' }, ` (${T.you})`) : null),
      el('div', { class: 'puntitos' }, bloques(f))),
    el('span', { class: 'total' }, String(f.total), el('small', {}, ` ${T.pts}`)))));
}

/**
 * Tus días, de arriba abajo (LIG-38): los pasados con su resultado y deshabilitados para
 * jugar (tocarlos muestra el resultado), el de hoy abierto como tarjeta grande, el de ayer
 * habilitado mientras dure su día de gracia, y los que vienen deshabilitados.
 */
function misDias(d, now) {
  const Lc = L(), { meta } = Lc;
  const pids = activos(Lc).map(j => j.pid);
  const w = comodinDe(Lc, S.yo);
  const afuera = !!fuera(Lc, S.yo, now);
  const filas = [];
  for (let k = 1; k <= meta.days; k++) {
    if (k === d) { filas.push(tarjetaDia(k, T.today)); continue; }
    const J = JUEGOS_COPA[juegoDelDia(meta, k)];
    const est = estadoDia(Lc, k, S.yo, now);
    const x2 = esFinal(meta, k) || w === k;
    let detalle, accion = null, clase = est;
    if (est === 'jugado') {
      const r = Lc.results[k][S.yo];
      const pos = posicionesDelDia(Lc.results[k], pids)[S.yo];
      detalle = visibleDia(Lc, k, S.yo, now) && pos ? `${r.r || r.s} · ${ord(pos.pos)} · +${pos.pts * multiplicador(Lc, k, S.yo)} ${T.pts}` : `${r.r || r.s}`;
    } else if (est === 'gracia') {
      detalle = T.lastDay;
      accion = faltaGente(Lc) || afuera ? null : el('button', { class: 'btn btn--yellow btn--sm', 'data-dia': k, onClick: () => { SFX.tap(); antesDeJugar(k); } }, `${J.emoji} ${T.play}`);
    } else if (est === 'en-curso') {
      detalle = T.lastDay;
      accion = el('button', { class: 'btn btn--yellow btn--sm', 'data-dia': k, onClick: () => { SFX.tap(); jugar(k); } }, `${J.emoji} ${T.resume}`);
    } else if (est === 'perdido') detalle = T.notPlayed;
    else if (est === 'anulado') detalle = T.dayCancelled;
    else detalle = fmt(T.opensOn, { fecha: fechaCorta(meta.win[k].a, meta.tz) });
    const contenido = [
      el('span', { class: 'md-dia' }, el('b', {}, fmt(T.dayShort, { d: k })), el('small', {}, fechaCorta(meta.win[k].a, meta.tz))),
      el('span', { class: con('md-emoji', J.emoji) }, J.emoji),
      el('span', { class: 'md-info' }, el('b', {}, J.nombre, x2 ? el('span', { class: `${claseX2(esFinal(meta, k))} md-x2` }, T.x2) : null), el('small', {}, detalle)),
      est === 'jugado' ? el('span', { class: 'md-go' }, '›') : accion,
    ];
    filas.push(est === 'jugado'
      ? el('button', { type: 'button', class: `md-fila ${clase}`, onClick: () => { SFX.tap(); resultado(k); } }, ...contenido)
      : el('div', { class: `md-fila ${clase}`, 'aria-disabled': accion ? null : 'true' }, ...contenido));
  }
  return el('div', { class: 'panel mis-dias' }, el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.myDays), filas);
}

/**
 * Tu posición día a día: una línea por jugador, la tuya de color y el resto en gris, con el
 * 1º arriba. Solo los días que ya puedes ver (los que jugaste o los cerrados), así el gráfico
 * tampoco delata el día de hoy. Tocar un punto muestra quién era y en qué lugar iba.
 */
/** Un color por jugador en el gráfico (D-125): los de la app, bien distintos entre sí. */
const COLORES_GRAFICO = ['#2ee6d6', '#ffd23f', '#ff2e88', '#9dff3a', '#ff7a1a', '#a78bff', '#5ab0ff', '#ff9ecb', '#e8e8e8', '#c7a36b'];

/** Los jugadores por orden de inscripción, y el color fijo de cada uno (D-125). */
const llegada = Lc => Object.entries(Lc.players || {}).sort((a, b) => (a[1].at || 0) - (b[1].at || 0)).map(([pid]) => pid);
const colorDe = (Lc, pid) => COLORES_GRAFICO[Math.max(0, llegada(Lc).indexOf(pid)) % COLORES_GRAFICO.length];

function grafico(now) {
  const Lc = L(), { meta } = Lc;
  const ev = evolucion(Lc, S.yo, now);
  if (!ev.dias.length) return null;
  // "(-1J)" junto a quien lleva menos juegos, como en la imagen que se comparte (D-126)
  const filasTabla = tabla(Lc, S.yo, now);
  const menos = menosJuegos(filasTabla);
  // Out of the cup (D-347): their line, faded, and 🚪 after their name (D-376)
  const afuera = new Set(filasTabla.filter(f => f.fuera).map(f => f.pid));
  const n = ev.filas.length;
  const W = 320, fila = 24, arriba = 14, abajo = 26, izq = 26, der = 92; // espacio a la derecha para "Nombre 3º (-1J)"
  const H = arriba + (n - 1) * fila + abajo;
  const x = k => izq + (meta.days === 1 ? 0 : ((k - 1) * (W - izq - der)) / (meta.days - 1));
  const y = lugar => arriba + (lugar - 1) * fila;
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}, ...hijos) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    hijos.forEach(h => e.append(h));
    return e;
  };
  const leyenda = el('p', { class: 'muted grafico-nota', 'aria-live': 'polite' }, T.progressHint);
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafico', role: 'img', 'aria-label': T.progressTitle });
  for (let l = 1; l <= n; l++) {
    svg.append(svgEl('line', { x1: izq, x2: W - der, y1: y(l), y2: y(l), class: 'g-grid' }));
    svg.append(svgEl('text', { x: izq - 8, y: y(l) + 4, class: 'g-eje', 'text-anchor': 'end' }, ord(l)));
  }
  for (let k = 1; k <= meta.days; k++) svg.append(svgEl('text', { x: x(k), y: H - 6, class: 'g-eje', 'text-anchor': 'middle' }, fmt(T.dayShort, { d: k })));
  // Cada jugador con su color (D-125), fijo por orden de inscripción; tu línea, más gruesa y encima
  const porLlegada = llegada(Lc);
  const color = pid => colorDe(Lc, pid);
  const orden = [...ev.filas.filter(f => f.pid !== S.yo), ...ev.filas.filter(f => f.pid === S.yo)];
  const grupos = {};
  // Empatados en el mismo lugar: sus nombres se apilan en vez de encimarse (el lugar siguiente
  // queda vacío en un empate, así que hay espacio)
  const enLugar = {};
  for (const f of orden) {
    const mia = f.pid === S.yo;
    const g = svgEl('g', { class: 'g-jugador' + (mia ? ' mia' : '') + (afuera.has(f.pid) ? ' fuera' : ''), 'data-pid': f.pid, style: `--c:${color(f.pid)}` });
    grupos[f.pid] = g;
    const pts = f.lugares.map((l, i) => [x(ev.dias[i]), y(l)]);
    if (pts.length > 1) g.append(svgEl('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'g-linea' }));
    pts.forEach(([px, py], i) => {
      const texto = fmt(T.progressPoint, { d: ev.dias[i], name: f.name, pos: ord(f.lugares[i]) });
      g.append(svgEl('circle', { cx: px, cy: py, r: mia ? 5 : 4, class: 'g-punto' }));
      const blanco = svgEl('circle', { cx: px, cy: py, r: 11, class: 'g-toque' }, svgEl('title', {}, texto));
      blanco.addEventListener('click', () => { leyenda.textContent = texto; destacar(f.pid); });
      g.append(blanco);
    });
    if (pts.length) {
      const [px, py] = pts[pts.length - 1];
      const corto = f.name.length > 10 ? `${f.name.slice(0, 9)}…` : f.name;
      const marca = afuera.has(f.pid) ? ' 🚪' : menos[f.pid] > 0 ? ` (-${menos[f.pid]}J)` : '';
      const ultimo = f.lugares[f.lugares.length - 1];
      const k = (enLugar[ultimo] = (enLugar[ultimo] ?? -1) + 1);
      g.append(svgEl('text', { x: px + 9, y: py + 4 + k * 11, class: 'g-rotulo' }, `${corto} ${ord(ultimo)}${marca}`));
    }
    svg.append(g);
  }
  // Tocar un nombre (o un punto) destaca su línea y apaga las demás; tocarlo otra vez, todas
  let destacado = null;
  const destacar = pid => {
    destacado = destacado === pid ? null : pid;
    svg.classList.toggle('con-destacado', !!destacado);
    Object.entries(grupos).forEach(([p, g]) => g.classList.toggle('destacado', p === destacado));
    chips.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.pid === destacado));
  };
  const chips = el('div', { class: 'grafico-chips' }, ev.filas.slice().sort((a, b) => porLlegada.indexOf(a.pid) - porLlegada.indexOf(b.pid)).map(f =>
    el('button', { type: 'button', class: 'g-chip' + (f.pid === S.yo ? ' mia' : '') + (afuera.has(f.pid) ? ' fuera' : ''), 'data-pid': f.pid, style: `--c:${color(f.pid)}`, onClick: () => { SFX.tap(); destacar(f.pid); } },
      el('span', { class: 'g-color', 'aria-hidden': 'true' }), nombreConJuegos(f.pid === S.yo ? fmt(T.progressYou, { name: f.name }) : f.name, menos[f.pid]), afuera.has(f.pid) ? ' 🚪' : null)));
  const notaJuegos = Object.values(menos).some(x => x > 0) ? el('p', { class: 'muted grafico-nota', id: 'nota-juegos' }, T.fewerGamesNote) : null;
  return el('div', { class: 'panel' }, el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.progressTitle), svg, chips, notaJuegos, leyenda,
    // Once over, the podium's Share the summary does the same: one share button per screen (C-19)
    terminada(L().meta, now) ? null : el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-imagen', onClick: async ev2 => {
      SFX.tap(); const b = ev2.currentTarget; b.disabled = true;
      try { await compartirTabla(); } catch (e) { toast(errorDe(e)); } finally { b.disabled = false; }
    } }, `📤 ${T.shareImage}`));
}

/**
 * El tablero, o lo que pidió el aviso que abrió la copa (D-229): silenciarla, o el día que avisaba,
 * listo para empezar, si todavía se puede jugar. Si no, el tablero de siempre.
 */
function desdeAviso() {
  const Lc = L();
  if (silenciarAviso) { tablero(); avisos().silenciar(); return; }
  const est = diaAviso >= 1 && diaAviso <= Lc.meta.days && !anulado(Lc.meta, diaAviso) ? estadoDia(Lc, diaAviso, S.yo, ahora()) : null;
  if ((est === 'hoy' || est === 'gracia') && !faltaGente(Lc)) antesDeJugar(diaAviso);
  else tablero();
}

let buzonPodio;   // the inbox link under the podium, decided once per page (D-345)
function tablero() {
  const Lc = L();
  if (!Lc || !S.yo) return;
  if (!Lc.players?.[S.yo]) { cuenta.olvidar(S.code); S.yo = null; entrar(); return; }
  anotarPais(Lc);
  mostrar('tablero');
  const { meta } = Lc;
  const now = ahora();
  const d = diaActual(meta, now);
  const body = $('#tablero-body');
  body.innerHTML = '';
  // Los días que no alcanzaron a abrirse porque el admin terminó la copa antes no van en la tabla
  const dias = Array.from({ length: meta.days }, (_, i) => i + 1).filter(k => !anulado(meta, k));

  let estadoTxt;
  if (d === 0) estadoTxt = fmt(T.before, { fecha: fechaLarga(meta.win[1].a, meta.tz) });
  else if (d > meta.days) estadoTxt = cerradaAntes(meta) ? fmt(T.overEarly, { fecha: fechaLarga(meta.end, meta.tz) }) : T.over;
  // El día de la copa y la fecha, para que se lea igual que el calendario (D-120)
  else estadoTxt = `${fmt(T.dayOf, { d, n: meta.days })} · ${fechaLarga(meta.win[d].a, meta.tz)}`;

  poner(body, el('div', { class: 'copa-head' },
    el('h1', { class: 'display display--md rainbow' }, `🏆 ${meta.name}`),
    el('p', { class: 'lead', style: 'margin:0' }, estadoTxt),
    avisoAudiencia(meta),
    el('div', { class: 'btn-row' },
      // Invitar tiene sentido antes de que parta; después, el admin lo tiene en Administrar
      d === 0 && !L().closed ? el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-invitar', onClick: () => { SFX.tap(); invitar(); } }, T.shareInvite) : null,
      esAdmin() ? el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-admin', onClick: () => { SFX.tap(); admin(); } }, T.adminTab) : null,
      terminada(meta, now) ? null : avisos().boton())));
  // Los avisos al celular (D-223): al abrir desde la app instalada, o antes de que parta
  if (!terminada(meta, now)) {
    avisos().revisar();
    const oferta = avisos().abiertaDesdeApp() ? avisos().tarjeta({ app: true })
      : d === 0 ? avisos().tarjeta({ fecha: fechaLarga(meta.win[1].a, meta.tz) }) : null;
    if (oferta) poner(body, oferta);
  }

  if (terminada(meta, now)) poner(body, podio());
  if (d === 0 && faltaGente(L())) poner(body, el('div', { class: 'panel center' }, el('p', { class: 'lead' }, T.needSecond)));

  // Out of the cup, or one missed day away from it (D-347): said before the days
  const yoFuera = terminada(meta, now) ? null : fuera(Lc, S.yo, now);
  const riesgo = yoFuera || terminada(meta, now) ? 0 : enRiesgo(Lc, S.yo, now);
  if (yoFuera) poner(body, el('div', { class: 'panel aviso-fuera', id: 'aviso-fuera' },
    el('p', { class: 'lead', style: 'margin:0 0 6px' }, T.outTitle), el('p', { class: 'muted', style: 'margin:0' }, fmt(T.outText, { a: yoFuera.desde, b: yoFuera.hasta }))));
  else if (riesgo) poner(body, el('p', { class: 'aviso', id: 'aviso-riesgo' }, fmt(T.outRisk, { p: riesgo - 1, d: riesgo })));

  // Tus días: el historial, el de hoy habilitado y los que vienen deshabilitados
  poner(body, misDias(d, now));

  if (d >= 1) {
    const filas = tabla(Lc, S.yo, now);
    const bloques = filas.flatMap(f => Object.values(f.dias));
    const hayOcultos = bloques.some(x => x.oculto);
    const hayOro = bloques.some(x => x.jugo && !x.oculto && x.pos === 1);
    const hayDoble = bloques.some(x => x.jugo && !x.oculto && x.x === 2);
    // La leyenda de los bloques (D-131): oro y doble solo si ya hay alguno en la tabla (D-152)
    const leyenda = el('div', { class: 'tabla-leyenda' },
      el('span', {}, el('span', { class: 'pd' }, '6'), T.legendPoints),
      hayOro ? el('span', {}, el('span', { class: 'pd oro' }, '10'), T.legendWon) : null,
      hayDoble ? el('span', {}, el('span', { class: 'pd doble' }, '12'), T.legendDouble) : null,
      hayOcultos ? el('span', {}, el('span', { class: 'pd oculto' }, '✓'), T.legendHidden) : null,
      el('span', {}, el('span', { class: 'pd abierto' }, '•'), T.legendOpen),
      el('span', {}, el('span', { class: 'pd perdido' }, '–'), T.legendMissed),
      el('span', {}, el('span', { class: 'pd pendiente' }, ''), T.legendPending));
    poner(body, el('div', { class: 'panel' },
      el('p', { class: 'lead', style: 'margin-bottom:8px' }, provisoria(Lc, filas, now) ? T.tableTitleProvisional : T.tableTitle),
      vistaTabla(filas, { dias, meta, now }),
      leyenda,
      hayOcultos ? el('small', { class: 'muted' }, T.tableHidden) : null));
    poner(body, grafico(now));
  } else {
    const jug = activos(Lc);
    poner(body, el('div', { class: 'panel' },
      el('p', { class: 'lead', style: 'margin-bottom:8px' }, fmt(T.players, { n: jug.length, max: MAX_JUGADORES })),
      el('div', { class: 'nombres' }, jug.map(j => el('span', { class: 'chip' + (j.pid === S.yo ? ' chip--hot' : '') }, j.name)))));
  }

  // The finished Cup's inbox link, at the very end (D-345); kept for the page: the board redraws every minute
  if (terminada(meta, now) && buzonPodio === undefined) buzonPodio = enlaceBuzon({ juego: 'copa', contexto: { copa: S.code, pantalla: 'podio' } });
  poner(body, botonReporte(), el('button', {
    class: 'link-btn', onClick: () => {
      if (!confirm(T.leaveConfirm)) return;
      cuenta.olvidar(S.code); S.yo = null; entrar();
    },
  }, T.leave));

  if (terminada(meta, now) && buzonPodio) { poner(body, buzonPodio); sinDoble(body); }

  clearInterval(S.tic);
  S.tic = setInterval(() => { if (S.pantalla === 'tablero' && !document.hidden) tablero(); }, 60000);
}

/* ------------------------------------------------------------------ */
/* Podio                                                               */
/* ------------------------------------------------------------------ */

let celebrado = false;

/** "⚖️ Empate en 68 puntos: desempató quien ganó más días.", si el 1.° y el 2.° empatan en puntos (#79). */
function lineaDesempate(TT, filas) {
  const e = desempate(filas);
  return e ? fmt(e.criterio === 'dias' ? TT.tieDays : TT.tieFinal, { pts: e.pts }) : '';
}

function podio() {
  const Lc = L();
  const m = medallas(Lc);
  const filas = tabla(Lc, S.yo, Lc.meta.end);
  const top = filas.slice(0, 3);
  const titulo = m.campeon?.length === 1 ? fmt(T.podiumTitle, { name: m.campeon[0].name }) : T.podiumTie;
  if (!celebrado) { celebrado = true; setTimeout(() => { confetti(); SFX.win(); }, 300); }
  const medalla = (rotulo, lista, extra = '') => (lista?.length ? el('div', { class: 'medalla' }, el('b', {}, rotulo), el('span', {}, lista.map(f => f.name).join(', ') + extra)) : null);
  return el('div', { class: 'panel podio' },
    el('h2', { class: 'display display--md center' }, titulo),
    el('div', { class: 'escalones' }, [1, 0, 2].map(i => top[i] ? el('div', { class: `escalon e${i + 1}` },
      el('span', { class: 'medal' }, ['🥇', '🥈', '🥉'][i]), el('b', {}, top[i].name), el('small', {}, `${top[i].total} ${T.pts}`)) : null)),
    desempate(filas) ? el('p', { class: 'center', id: 'podio-desempate', style: 'margin:0' }, lineaDesempate(T, filas)) : null,
    // A single champion is already the title and the 🥇: the line only names a shared one (C-19)
    m.campeon?.length > 1 ? medalla(T.medalChamp, m.campeon) : null,
    medalla(T.medalWins, m.ganador?.filas, m.ganador ? ` (${m.ganador.n})` : ''),
    medalla(T.medalComeback, m.remontada?.filas, m.remontada ? ` (+${m.remontada.n})` : ''),
    medalla(T.medalLast, m.farolito),
    el('button', { class: 'btn btn--cyan btn--sm', style: 'width:100%', id: 'btn-resumen', onClick: ev => conBoton(ev, compartirTabla) }, T.shareSummary),
    // The Cup is over: its way out, right under the podium (C-19)
    salidasFin('podio', { lang: LANG, raiz: RAIZ }));
}

/* ------------------------------------------------------------------ */
/* Mensajes para el grupo (D-99)                                       */
/* ------------------------------------------------------------------ */

/**
 * Todo lo que comparte la copa sale por aquí (D-165): el texto con la cabecera de la copa y el
 * link en su línea al final (D-124), y la imagen si la hay. Sin menú del sistema, el texto queda
 * copiado (y la imagen, descargada).
 */
async function compartir(texto, imagen = null) {
  const r = await compartirAlChat({ titulo: L().meta.name, texto, url: withLang(urlPublica(S.code), G().lang), imagen });
  if (r === 'copied') toast(T.copied);
  if (r === 'downloaded') toast(T.imageDownloaded);
}

/**
 * Lo que va al grupo va en el idioma de la copa (D-170): los mensajes, la imagen, la planilla y el
 * link. Cada uno ve la pantalla en su idioma, pero el chat del grupo es uno solo.
 */
const G = () => {
  const lang = palabrasDe(L()?.meta);
  return { lang, T: LOCALES[lang] || LOCALES.es, J: juegosCopa(lang) };
};

/** La cabecera de todo lo que la copa comparte, la misma en el texto y en la imagen (D-165). */
const cabCopa = (emoji, contexto) => ({ emoji, titulo: fmt(G().T.shareHead, { copa: L().meta.name }), contexto });

/** El mensaje entero: la cabecera y, separado por una línea, lo que dice. */
const mensajeCopa = (cab, ...partes) => [cabecera(cab), ...partes].filter(Boolean).join('\n\n');

/** Un botón que arma algo antes de compartir (una imagen tarda): se apaga mientras tanto. */
async function conBoton(ev, fn) {
  SFX.tap();
  const b = ev.currentTarget; b.disabled = true;
  try { await fn(); } catch (e) { toast(errorDe(e)); } finally { b.disabled = false; }
}

/** Los avisos al celular de la copa abierta (D-223): la campana, la tarjeta y sus hojas. */
let avisosCopa = null;
const avisos = () => (avisosCopa ||= crearAvisos({
  T, lang: LANG, cuenta, fmt, toast,
  store: () => store,
  copa: () => ({ code: S.code, pid: S.yo, nombre: L()?.meta?.name || '', url: urlPublica(S.code) }),
  redibujar: () => { if (S.pantalla === 'resultado' && S.verDia) resultado(S.verDia); else if (S.pantalla === 'tablero') tablero(); },
  tap: () => SFX.tap(),
}));

function toast(texto) {
  const t = el('div', { class: 'toast', role: 'status' }, texto);
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}

/**
 * La invitación promocional (D-127): el reto, cuándo parte, cuánto toma y quiénes ya están.
 * Los juegos no se nombran: son sorpresa.
 */
function mensajeInvitacion() {
  const Lc = L(), { meta } = Lc;
  const nombres = activos(Lc).map(j => j.name);
  const lista = nombres.length > 1 ? fmt(G().T.listAnd, { a: nombres.slice(0, -1).join(', '), b: nombres.at(-1) }) : nombres[0] || '';
  // Ya partida (D-176): dice en qué día va y, si ya cerró alguno, que esos quedan en 0. El día 1
  // cierra recién al empezar el 3: en el 2 todavía está en su día de gracia
  const d = diaActual(meta, ahora());
  const cuando = d === 0
    ? fmt(G().T.shareInviteStart, { fecha: fechaLarga(meta.win[1].a, meta.tz, G().lang) })
    : [fmt(G().T.shareInviteGoing, { d, n: meta.days }), d > 2 ? G().T.lateJoin : ''].filter(Boolean).join(' ');
  return mensajeCopa(cabCopa('🏆', G().T.ctxInvite), fmt(G().T.shareInviteText, {
    dias: meta.days, cuando,
    inscritos: nombres.length ? fmt(nombres.length === 1 ? G().T.shareInviteJoinedOne : G().T.shareInviteJoined, { names: lista }) : '',
  }).replace(/\n{3,}/g, '\n\n'));
}

function invitar() {
  return compartir(mensajeInvitacion());
}

/**
 * El recordatorio del admin (LIG-25): sirve cualquier día. Antes de empezar recuerda cuándo
 * parte; durante la copa dice qué toca hoy, hasta cuándo, si queda el de ayer en su día de
 * gracia y quién falta.
 */
function mensajeHoy() {
  const Lc = L(), { meta } = Lc;
  const now = ahora();
  const d = diaActual(meta, now);
  if (d === 0) {
    const J1 = G().J[juegoDelDia(meta, 1)];
    return mensajeCopa(cabCopa('🏆', fmt(G().T.ctxBefore, { fecha: fechaLarga(meta.win[1].a, meta.tz, G().lang) })),
      fmt(Lc.closed ? G().T.shareBeforeClosed : G().T.shareBeforeText, { emoji: J1.emoji, juego: J1.nombre }));
  }
  const hoy = Math.min(d, meta.days);
  const J = G().J[juegoDelDia(meta, hoy)];
  const hasta = esFinal(meta, hoy) ? G().T.untilToday : G().T.untilTomorrow;
  const partes = [fmt(G().T.shareTodayText, { emoji: J.emoji, juego: J.nombre, hasta })];
  if (hoy > 1 && abierto(meta, hoy - 1, now) && faltan(Lc, hoy - 1, now).length) {
    const Ja = G().J[juegoDelDia(meta, hoy - 1)];
    partes.push(fmt(G().T.shareTodayGrace, { juego: Ja.nombre }));
  }
  const falta = faltan(Lc, hoy, now);
  if (falta.length && falta.length < activos(Lc).length) partes.push(fmt(falta.length === 1 ? G().T.shareTodayMissingOne : G().T.shareTodayMissing, { names: falta.map(j => j.name).join(', ') }));
  return mensajeCopa(cabCopa('🏆', fmt(G().T.ctxDay, { d: hoy, n: meta.days })), partes.join('\n'));
}

/**
 * La cabecera de la tabla, la misma en el texto y en la imagen (D-165): "📊 … · Tabla de
 * posiciones · día 3 de 7", con "(provisoria)" si alguien todavía puede cambiarla (D-147), y
 * "🏁 … · Tabla final" al terminar. El día es el último que muestra la tabla, no el de hoy si
 * quien comparte todavía no lo juega (#67).
 */
function cabTabla(Lc, filas, now) {
  const { meta } = Lc;
  if (terminada(meta, now)) return cabCopa('🏁', G().T.ctxFinal);
  const d = ultimoDiaVisto(filas) || Math.min(Math.max(diaActual(meta, now), 1), meta.days);
  return cabCopa('📊', fmt(provisoria(Lc, filas, now) ? G().T.ctxTableProvisional : G().T.ctxTable, { d, n: meta.days }));
}

/**
 * Compartir la tabla, desde donde sea (el gráfico del tablero, el podio, Administrar): siempre
 * la imagen y el texto juntos, con la misma cabecera (D-165). Mientras se juega, la tabla
 * parcial; terminada, el resumen final.
 */
async function compartirTabla() {
  const Lc = L(), now = ahora();
  const texto = terminada(Lc.meta, now) ? mensajeFinal() : mensajeTabla();
  await compartir(texto, await imagenTabla());
}

/**
 * El texto que acompaña a la imagen de la tabla parcial: la cabecera y quién falta hoy. La tabla
 * misma no se escribe: ya la dice la imagen (D-171).
 */
function mensajeTabla() {
  const Lc = L(), { meta } = Lc;
  const now = ahora();
  const d = Math.min(diaActual(meta, now), meta.days);
  // La tabla que se comparte es la que ve el admin: no delata días que él no ha jugado
  const filas = tabla(Lc, S.yo, now);
  const falta = faltan(Lc, d, now);
  // La cabecera lleva el último día que muestra la tabla; el aviso de abajo, el día que corre (#67)
  return mensajeCopa(cabTabla(Lc, filas, now), falta.length ? fmt(falta.length === 1 ? G().T.shareTableMissingOne : G().T.shareTableMissing, { d, names: falta.map(j => j.name).join(', ') }) : '');
}

/** "Tomario (-1J)": el nombre con cuántos juegos menos lleva (D-126). */
const nombreConJuegos = (name, n) => (n > 0 ? fmt(T.fewerGames, { name, n }) : name);

/** Oro, plata y bronce para el podio de la tabla final (D-153): degradado, borde y tinta grabada. */
const METALES = {
  1: { luz: '#fff6c2', medio: '#ffd23f', sombra: '#b8860b', borde: '#7a5500', tinta: '#3a2400' },
  2: { luz: '#ffffff', medio: '#d3dae6', sombra: '#8d97aa', borde: '#566074', tinta: '#1d2230' },
  3: { luz: '#ffd9b8', medio: '#d98a4e', sombra: '#9a5424', borde: '#5e2f10', tinta: '#2a1204' },
};

/**
 * La tabla parcial como imagen para compartir (D-126, D-141, D-153): a la izquierda, el gráfico
 * de posiciones con una columna por cada día que ya se ve (todos, sin saltarse ninguno); a la
 * derecha, la tabla. Gráfico y tabla comparten el eje: la línea de cada jugador termina en su
 * fila, así cada nombre aparece una sola vez. Cada punto dice qué pasó ese día: los puntos que
 * sacó (con anillo dorado si usó el comodín, cian en la final), "–" si no jugó un día que cerró
 * y "?" si todavía puede jugarlo. Con la copa terminada, el podio va en galvanos. Se dibuja en
 * un canvas de 1080 × 1350 (4:5) con las fuentes de la app, dentro del marco de toda imagen que
 * se comparte: arriba la misma cabecera del texto, abajo el link (D-165). Devuelve el archivo.
 */
async function imagenTabla() {
  const Lc = L(), { meta } = Lc;
  const now = ahora();
  const filas = tabla(Lc, S.yo, now);
  const fin = terminada(meta, now);
  // Terminada, nadie tiene juegos por jugar: sin pills ni su nota
  const menos = fin ? {} : menosJuegos(filas);
  const conPills = Object.values(menos).some(x => x > 0);
  const ev = evolucion(Lc, S.yo, now);
  // El último día que muestra la tabla, no el de hoy si quien comparte todavía no lo juega (#67)
  const d = ultimoDiaVisto(filas) || Math.min(Math.max(diaActual(meta, now), 1), meta.days);
  const n = filas.length;
  const url = urlPublica(S.code);
  const W = 1080, ALTO = 1350; // hasta 4:5: se ve entera en WhatsApp y en el feed de Instagram
  // De arriba abajo (D-154): títulos, filas, rótulos de los días, leyenda y link. Las filas
  // crecen hasta llenar el 4:5, con tope para que pocos jugadores no queden gigantes; entonces la
  // imagen se acorta a lo que necesita, sin bajar de cuadrada. Lo que aún sobra se reparte
  // arriba y abajo del bloque, así nada queda pegado ni suelto
  const { arriba: ARRIBA, abajo: ABAJO } = MARCO, EJE = 60, HUECO = 40, LEYENDA = conPills ? 96 : 40;
  const resto = EJE + HUECO + LEYENDA;
  const fila = Math.max(60, Math.min(128, (ALTO - ARRIBA - ABAJO - resto) / Math.max(1, n)));
  const H = Math.max(W, ARRIBA + n * fila + resto + ABAJO);
  const g0 = ARRIBA + (H - ARRIBA - ABAJO - (n * fila + resto)) / 2;
  // El marco: el fondo, la cabecera del texto (el nombre de la copa y "Tabla de posiciones · día 3
  // de 7") y el link abajo
  const { cv, c } = await lamina({ alto: H, cab: cabTabla(Lc, filas, now), url });
  const fuente = (peso, px, familia = 'Nunito, system-ui, sans-serif') => `${peso} ${px}px ${familia}`;
  const caja = (x0, y0, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x0, y0, w, h, r); else c.rect(x0, y0, w, h); };
  const circulo = (cx, cy, r) => { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); };
  const TINTA = '#1a0f33'; // el número dentro de un punto, y el fondo de los puntos huecos
  // El eje que comparten: el centro de la fila i (0 = arriba) es también la altura del lugar i+1
  const yFila = i => g0 + (i + 0.5) * fila;
  const color = pid => colorDe(Lc, pid);
  const izq = 70, tabla0 = 530, derTabla = W - 40; // el gráfico va de izq a tabla0 - 40
  const m = ev.dias.length;
  const x = i => (m <= 1 ? izq : izq + (i * (tabla0 - 40 - izq)) / (m - 1));
  // El radio de los puntos: que quepa un número de dos cifras y no choquen con el vecino
  const R = Math.max(10, Math.min(22, m <= 1 ? 22 : (tabla0 - 40 - izq) / (m - 1) / 2 - 7, fila * 0.2));
  // Una guía por fila y el rótulo de cada día que se ve; la final dice "Final ×2" y sigue hacia la tabla
  c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.10)';
  for (let i = 0; i < n; i++) { c.beginPath(); c.moveTo(izq, yFila(i)); c.lineTo(tabla0, yFila(i)); c.stroke(); }
  c.font = fuente(800, m > 10 ? 22 : 28);
  ev.dias.forEach((dia, i) => {
    const laFinal = esFinal(meta, dia);
    c.fillStyle = laFinal ? '#2ee6d6' : 'rgba(255,255,255,0.7)'; c.textAlign = laFinal ? 'left' : 'center';
    c.fillText(laFinal ? G().T.imageFinal : fmt(G().T.dayShort, { d: dia }), laFinal ? x(i) - R - 4 : x(i), g0 + n * fila + 44);
  });
  // Las filas de la tabla, detrás de las líneas que llegan a ellas. Terminada, el podio en galvanos.
  const filaDe = Object.fromEntries(filas.map((f, i) => [f.pid, i]));
  // Out of the cup (D-347): their line, dots and row faded, 🚪 for a place and "Eliminado" (D-376)
  const afuera = new Set(filas.filter(f => f.fuera).map(f => f.pid));
  const TENUE = 0.35;
  const metal = f => (fin ? METALES[f.lugar] : null);
  filas.forEach((f, i) => {
    const y0 = yFila(i) - fila * 0.43, h = fila * 0.86, w = derTabla - tabla0, mia = f.pid === S.yo, mt = metal(f);
    if (mt) {
      const brillo = c.createLinearGradient(0, y0, 0, y0 + h);
      brillo.addColorStop(0, mt.luz); brillo.addColorStop(0.45, mt.medio); brillo.addColorStop(1, mt.sombra);
      c.fillStyle = brillo; caja(tabla0, y0, w, h, 14); c.fill();
      c.lineWidth = 3; c.strokeStyle = mt.borde; c.stroke();
      // El filete interior y los cuatro remaches de la placa
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.65)'; caja(tabla0 + 7, y0 + 7, w - 14, h - 14, 9); c.stroke();
      c.fillStyle = mt.borde;
      for (const [rx, ry] of [[14, 14], [w - 14, 14], [14, h - 14], [w - 14, h - 14]]) { circulo(tabla0 + rx, y0 + ry, 3); c.fill(); }
      if (mia) { c.lineWidth = 4; c.strokeStyle = '#2ee6d6'; caja(tabla0 - 5, y0 - 5, w + 10, h + 10, 18); c.stroke(); }
      return;
    }
    c.fillStyle = mia ? 'rgba(46,230,214,0.18)' : 'rgba(0,0,0,0.28)';
    caja(tabla0, y0, w, h, 18); c.fill();
    if (mia) { c.lineWidth = 4; c.strokeStyle = '#2ee6d6'; c.stroke(); }
  });
  // Qué pasó con cada uno cada día (D-153)
  const marcas = Object.fromEntries(filas.map(f => [f.pid, ev.dias.map(dia => marcaDelDia(Lc, f, dia, now))]));
  // Los empatados comparten lugar: sus líneas van lado a lado, como las de un plano de metro,
  // en el orden de la tabla de hoy, con aire para que sus puntos no se tapen
  const junto = ev.dias.map((_, i) => {
    const grupos = {};
    ev.filas.filter(f => f.lugares[i]).sort((a, b) => (filaDe[a.pid] ?? n) - (filaDe[b.pid] ?? n))
      .forEach(f => (grupos[f.lugares[i]] ||= []).push(f.pid));
    const r = {};
    for (const g of Object.values(grupos)) {
      const paso = Math.min(R * 2 + 4, fila / g.length);
      // Si el grupo no cabe con puntos enteros, sus puntos se achican: juntos, pero sin taparse
      g.forEach((pid, k) => { r[pid] = { dy: (k - (g.length - 1) / 2) * paso, r: g.length > 1 ? Math.max(9, Math.min(R, paso / 2 - 1)) : R }; });
    }
    return r;
  });
  // Las líneas: una columna por día visto; el último punto cae en la fila del jugador y de ahí
  // sigue derecho hasta ella. La tuya, más gruesa y encima. El tramo que llega a un día que
  // todavía puede jugar va punteado: de ahí sale lo provisorio.
  const orden = [...ev.filas.filter(f => f.pid !== S.yo), ...ev.filas.filter(f => f.pid === S.yo)]
    .filter(f => f.lugares.length && filaDe[f.pid] !== undefined);
  const puntos = f => f.lugares.map((l, i) => [x(i), (i === m - 1 ? yFila(filaDe[f.pid]) : yFila(l - 1) + junto[i][f.pid].dy)]);
  const PUNTEADO = [2, 14];
  for (const f of orden) {
    const pts = puntos(f), mia = f.pid === S.yo, mk = marcas[f.pid];
    c.globalAlpha = afuera.has(f.pid) ? TENUE : 1;
    c.strokeStyle = color(f.pid); c.lineWidth = mia ? 10 : 6; c.lineJoin = 'round'; c.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) {
      c.setLineDash(mk[i]?.tipo === 'falta' ? PUNTEADO : []);
      c.beginPath(); c.moveTo(...pts[i - 1]); c.lineTo(...pts[i]); c.stroke();
    }
    const [ux, uy] = pts[pts.length - 1];
    c.setLineDash(mk[pts.length - 1]?.tipo === 'falta' ? PUNTEADO : []);
    c.beginPath(); c.moveTo(ux, uy); c.lineTo(tabla0 + 6, uy); c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 1;
  }
  // Los puntos, encima de todas las líneas
  const pildora = (cx, cy, txt) => {
    c.font = fuente(900, Math.round(R * 0.62)); const w = c.measureText(txt).width + 10, h = R * 0.78;
    c.fillStyle = '#ffd23f'; caja(cx - w / 2, cy - h / 2, w, h, h / 2); c.fill();
    c.fillStyle = TINTA; c.textAlign = 'center'; c.fillText(txt, cx, cy + h * 0.3);
  };
  // Un punto: lo usa el gráfico y la leyenda, así los dos se ven iguales
  const punto = (cx, cy, r, mk, col) => {
    c.textAlign = 'center';
    if (mk.tipo === 'falta') {
      c.fillStyle = TINTA; circulo(cx, cy, r); c.fill();
      c.setLineDash([5, 5]); c.lineWidth = 3; c.strokeStyle = col; c.stroke(); c.setLineDash([]);
      c.fillStyle = col; c.font = fuente(900, r * 0.95); c.fillText('?', cx, cy + r * 0.34);
    } else if (mk.tipo === 'no') {
      c.fillStyle = TINTA; circulo(cx, cy, r * 0.72); c.fill();
      const a0 = c.globalAlpha; // multiplied, so a faded player's dot stays faded (D-376)
      c.globalAlpha = a0 * 0.55; c.lineWidth = 3; c.strokeStyle = col; c.stroke();
      c.fillStyle = col; c.font = fuente(900, r * 0.8); c.fillText('–', cx, cy + r * 0.28);
      c.globalAlpha = a0;
    } else {
      c.fillStyle = col; circulo(cx, cy, r); c.fill();
      if (mk.tipo === 'comodin' || mk.final) { c.lineWidth = 4; c.strokeStyle = mk.tipo === 'comodin' ? '#ffd23f' : '#2ee6d6'; circulo(cx, cy, r + 4); c.stroke(); }
      const t = String(mk.pts);
      c.fillStyle = TINTA; c.font = fuente(900, t.length > 1 ? r * 0.88 : r); c.fillText(t, cx, cy + r * 0.33);
    }
  };
  for (const f of orden) {
    const mia = f.pid === S.yo;
    puntos(f).forEach(([px, py], i) => {
      const base = i === m - 1 ? R : junto[i][f.pid].r; // el último cae en su fila, sin apretura
      const mk = marcas[f.pid][i], r = mia ? base + 2 : base;
      c.globalAlpha = afuera.has(f.pid) ? TENUE : 1;
      punto(px, py, r, mk, color(f.pid));
      if (mk.tipo === 'comodin') pildora(px + r * 0.95, py - r * 0.95, G().T.x2);
      c.globalAlpha = 1;
    });
  }
  // La pill de juegos por jugar: borde punteado, como el punto "?"; devuelve su ancho
  const pill = (x0, cy, k, px) => {
    c.font = fuente(900, px); const txt = fmt(G().T.fewerGamesPill, { n: k });
    const w = c.measureText(txt).width + px * 1.1, h = px * 1.55;
    c.fillStyle = 'rgba(255,255,255,0.10)'; caja(x0, cy - h / 2, w, h, h / 2); c.fill();
    c.setLineDash([4, 4]); c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke(); c.setLineDash([]);
    c.fillStyle = '#ffffff'; c.textAlign = 'left'; c.fillText(txt, x0 + px * 0.55, cy + px * 0.36);
    return w;
  };
  const anchoPill = (k, px) => { c.font = fuente(900, px); return c.measureText(fmt(G().T.fewerGamesPill, { n: k })).width + px * 1.1; };
  // "Eliminado" after the name of whoever is out of the cup (D-376): a plain outline, not the dashed "-1J"
  const ELIMINADO = G().T.outBadge.toUpperCase();
  const anchoFuera = px => { c.font = fuente(900, px); return c.measureText(ELIMINADO).width + px * 1.3; };
  const pillFuera = (x0, cy, px) => {
    const w = anchoFuera(px), h = px * 1.6;
    c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,0.8)'; caja(x0, cy - h / 2, w, h, h / 2); c.stroke();
    c.fillStyle = '#ffffff'; c.textAlign = 'left'; c.font = fuente(900, px); c.fillText(ELIMINADO, x0 + px * 0.65, cy + px * 0.36);
  };
  // El texto de cada fila: lugar, flecha, nombre (con su pill o la copa del campeón) y puntos
  const tamFila = Math.round(Math.min(42, fila * 0.4));
  // Lugar, flecha y nombre se corren con la letra
  const xLugar = tabla0 + tamFila * 1.1, xFlecha = tabla0 + tamFila * 2.15, xNombre = tabla0 + tamFila * 2.75;
  filas.forEach((f, i) => {
    const y = yFila(i) + tamFila * 0.36, mt = metal(f), out = afuera.has(f.pid);
    c.globalAlpha = out ? 0.5 : 1;
    // En el galvano, letra grabada: tinta oscura con un reflejo claro abajo
    const escribir = (t, px, color) => {
      if (mt) { c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillText(t, px, y + 2); c.fillStyle = mt.tinta; } else c.fillStyle = color;
      c.fillText(t, px, y);
    };
    c.textAlign = 'center'; c.font = fuente(900, tamFila);
    escribir(out ? '🚪' : String(f.lugar), xLugar, '#ffd23f');
    if (f.flecha) { c.font = fuente(900, tamFila * 0.6); c.fillStyle = f.flecha > 0 ? '#9dff3a' : '#ff2e88'; c.fillText(f.flecha > 0 ? '▲' : '▼', xFlecha, y - 2); }
    c.textAlign = 'right'; c.font = fuente(900, tamFila);
    const total = `${f.total} ${G().T.pts}`;
    escribir(total, derTabla - 22, '#ffd23f');
    // Lo que va después del nombre: la copa del campeón o la pill; el nombre achica la letra
    // para que todo quepa antes de los puntos y, si aún no cabe, se corta con "…"
    const copa = fin && f.lugar === 1, k = menos[f.pid] || 0;
    const extra = t => (copa ? 14 + t * 1.15 : out ? 16 + anchoFuera(Math.round(t * 0.5)) : k ? 16 + anchoPill(k, Math.round(t * 0.62)) : 0);
    const libre = derTabla - 22 - c.measureText(total).width - 20 - xNombre;
    const peso = mt ? 900 : 800;
    let nombre = f.name, t = tamFila;
    const ancho = () => { c.font = fuente(peso, t); return c.measureText(nombre).width + extra(t); };
    while (ancho() > libre && t > 20) t -= 2;
    while (ancho() > libre && nombre.length > 1) nombre = `${nombre.replace(/…$/, '').slice(0, -1)}…`;
    c.font = fuente(peso, t); c.textAlign = 'left';
    escribir(nombre, xNombre, '#ffffff');
    const tras = xNombre + c.measureText(nombre).width + 14;
    if (copa) { c.font = fuente(900, t); c.fillText('🏆', tras, y); }
    if (out) pillFuera(tras + 2, yFila(i), Math.round(t * 0.5));
    else if (k) pill(tras + 2, yFila(i), k, Math.round(t * 0.62));
    c.globalAlpha = 1;
  });
  // La leyenda: los mismos puntos del gráfico, solo los que aparecen en él
  const hay = new Set(Object.values(marcas).flat().map(mk => mk.tipo));
  const items = [
    ['pts', { tipo: 'pts', pts: 12 }, G().T.imageLegendPts], ['comodin', { tipo: 'comodin', pts: 10 }, G().T.imageLegendWild],
    ['no', { tipo: 'no' }, G().T.imageLegendMissed], ['falta', { tipo: 'falta' }, G().T.imageLegendPending],
  ].filter(([tipo]) => hay.has(tipo));
  // La leyenda va justo bajo los rótulos de los días, no pegada al link
  const ly = g0 + n * fila + EJE + HUECO + 17, rl = 17;
  c.font = fuente(800, 26);
  const anchos = items.map(([, , txt]) => rl * 2 + 12 + c.measureText(txt).width);
  let lx = (W - anchos.reduce((a, b) => a + b, 0) - 36 * Math.max(0, items.length - 1)) / 2;
  items.forEach(([tipo, mk, txt], k) => {
    punto(lx + rl, ly, rl, mk, '#ffffff');
    c.textAlign = 'left'; c.font = fuente(800, 26); c.fillStyle = tipo === 'comodin' ? '#ffd23f' : 'rgba(255,255,255,0.85)';
    c.fillText(txt, lx + rl * 2 + 12, ly + 9);
    lx += anchos[k] + 36;
  });
  if (conPills) {
    c.font = fuente(700, 26);
    const wp = anchoPill(1, 22), wn = c.measureText(G().T.imagePillNote).width, x0 = (W - wp - 14 - wn) / 2;
    pill(x0, ly + 50, 1, 22);
    c.font = fuente(700, 26); c.fillStyle = 'rgba(255,255,255,0.6)'; c.textAlign = 'left';
    c.fillText(G().T.imagePillNote, x0 + wp + 14, ly + 59);
  }
  return aArchivo(cv, nombreArchivo('copa', meta.alias || S.code, fin ? 'tabla-final' : `dia-${d}`));
}

/** La tabla final como planilla CSV (D-161): se descarga, para abrirla en Excel o en Google Sheets. */
function descargarPlanilla() {
  const Lc = L(), { meta } = Lc;
  const csv = planilla(Lc, { T: G().T, juegos: G().J, fmt, fecha: ms => fechaLarga(ms, meta.tz, G().lang) });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `copa-${meta.alias || S.code.toLowerCase()}-tabla-final.csv` });
  document.body.append(a); a.click(); a.remove();
  toast(T.exportDone);
}

/**
 * El texto que acompaña a la imagen de la tabla final: la cabecera y las medallas, que la imagen no
 * trae. El campeón y el podio no se escriben: los dice la imagen con sus galvanos (D-171).
 */
function mensajeFinal() {
  const Lc = L();
  const m = medallas(Lc);
  const extras = [
    lineaDesempate(G().T, tabla(Lc, null, Lc.meta.end)),
    m.ganador && `${G().T.medalWins}: ${m.ganador.filas.map(f => f.name).join(', ')} (${m.ganador.n})`,
    m.remontada && `${G().T.medalComeback}: ${m.remontada.filas.map(f => f.name).join(', ')}`,
    m.farolito && `${G().T.medalLast}: ${m.farolito.map(f => f.name).join(', ')}`,
  ].filter(Boolean).join('\n');
  return mensajeCopa(cabCopa('🏁', G().T.ctxFinal), extras);
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

function admin({ forzar = false } = {}) {
  if (!esAdmin()) { tablero(); return; }
  const Lc = L(), { meta } = Lc;
  const body = $('#admin-body');
  // Si alguien escribe (un nombre, un PIN) no se le borra el campo por una actualización; el calendario no cuenta
  if (!forzar && S.pantalla === 'admin' && body.contains(document.activeElement) && document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'date') return;
  mostrar('admin');
  body.innerHTML = '';
  const now = ahora();
  const d = diaActual(meta, now);
  // La tabla y el resumen van con su imagen, como desde el tablero y el podio (D-165)
  const msg = (rotulo, fn, id) => el('button', { class: 'btn btn--cyan btn--sm', id, onClick: ev => conBoton(ev, () => (fn === mensajeTabla || fn === mensajeFinal ? compartirTabla() : compartir(fn()))) }, `📤 ${rotulo}`);
  const jug = activos(Lc);
  const err = el('div', { class: 'form-error', role: 'alert' });
  // La primera vez (recién creada, o mientras el admin siga solo): qué hacer ahora (D-110)
  if ((S.bienvenida || jug.length <= 1) && d === 0) {
    poner(body, el('div', { class: 'panel stack bienvenida', id: 'admin-bienvenida' },
      el('p', { class: 'lead', style: 'margin:0' }, `🎉 ${T.adminWelcomeTitle}`),
      el('ol', { class: 'como' },
        el('li', {}, T.adminWelcome1),
        el('li', {}, T.adminWelcome2),
        // Con link propio, cerrar la inscripción deja de ser opcional, y el paso dice por qué (#102)
        el('li', {}, meta.alias ? T.adminWelcomeAlias : T.adminWelcome3))));
  }
  const accion = (rotulo, id, fn, clase = 'btn btn--ghost btn--sm', caja = err) => el('button', { class: clase, id, onClick: async ev => {
    SFX.tap(); ev.currentTarget.disabled = true;
    const b = ev.currentTarget;
    try { await fn(); caja.textContent = ''; } catch (e) { if (e?.code !== 'cancelado') avisoError(caja, errorDe(e)); }
    // Lo que cambia la copa redibuja Administrar; exportar no, y el botón tiene que seguir sirviendo
    b.disabled = false;
  } }, rotulo);
  poner(body, el('div', { class: 'panel stack' },
    el('p', { class: 'lead', style: 'margin:0' }, T.adminMsgs),
    // Cada mensaje, solo cuando tiene sentido (D-116): la invitación mientras alguien nuevo pueda
    // entrar, también ya partida (D-176); la tabla parcial mientras se juega; el resumen, al terminar
    inscripcionAbierta(meta, now, Lc.closed) && jug.length < MAX_JUGADORES ? msg(T.msgInvite, mensajeInvitacion, 'msg-invitar') : null,
    !terminada(meta, now) ? msg(T.msgToday, mensajeHoy, 'msg-hoy') : null,
    d >= 1 && !terminada(meta, now) ? msg(T.msgTable, mensajeTabla, 'msg-tabla') : null,
    terminada(meta, now) ? msg(T.msgFinal, mensajeFinal, 'msg-final') : null));

  // Terminada (sola o por el admin), la tabla final se exporta: imagen y planilla (D-161)
  if (terminada(meta, now)) {
    const errExportar = el('div', { class: 'form-error', role: 'alert' });
    poner(body, el('div', { class: 'panel stack', id: 'admin-exportar' },
      el('p', { class: 'lead', style: 'margin:0' }, T.exportTitle),
      el('p', { class: 'muted', style: 'margin:0' }, T.exportLead),
      accion(`📤 ${T.exportImage}`, 'btn-exportar-imagen', () => compartirTabla(), 'btn btn--cyan btn--sm', errExportar),
      accion(`⬇️ ${T.exportSheet}`, 'btn-exportar-planilla', async () => { descargarPlanilla(); }, 'btn btn--cyan btn--sm', errExportar),
      errExportar));
  }


  // El nombre de la copa se puede cambiar mientras no termine (D-148); el link sigue igual
  if (!terminada(meta, now)) {
    // Sin etiqueta a la vista: el título del panel ya lo dice
    const nombre = campo('', { value: meta.name, maxlength: String(COPA_MAX), 'aria-label': T.fCopa }, { contador: true });
    nombre.nodo.querySelector('label').remove();
    const nombreErr = el('div', { class: 'form-error', role: 'alert' });
    nombre.nodo.hidden = true;
    const cambiar = el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-nombre', onClick: () => {
      SFX.tap(); nombre.nodo.hidden = false; cambiar.hidden = true; nombre.input.focus(); nombre.input.select();
    } }, `✏️ ${T.nameEdit}`);
    nombre.nodo.append(el('div', { class: 'btn-row' },
      accion(T.nameSave, 'btn-nombre-ok', async () => {
        const n = limpiarNombre(nombre.input.value, COPA_MAX);
        if (!n) { avisoError(nombreErr, T.errCopa); throw { code: 'cancelado' }; }
        if (n !== meta.name) await store.renombrarCopa(S.code, n);
        admin({ forzar: true });
        if (n !== meta.name) { SFX.reveal(); toast(fmt(T.nameDone, { copa: n })); }
      }, 'btn btn--yellow btn--sm'),
      el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-nombre-no', onClick: () => { SFX.tap(); admin({ forzar: true }); } }, T.nameCancel)),
      nombreErr);
    poner(body, el('div', { class: 'panel stack', id: 'admin-nombre' },
      el('p', { class: 'lead', style: 'margin:0' }, T.fCopa),
      el('p', { class: 'muted', style: 'margin:0' }, fmt(T.nameIs, { copa: meta.name })),
      cambiar, nombre.nodo));
  }

  // El inicio se puede mover a hoy o mañana mientras nadie haya jugado (D-110)
  if (sinEmpezar(Lc) && !terminada(meta, now)) {
    const hoy = fechaEn(now, meta.tz), manana = sumarDias(hoy, 1);
    const quedanHoy = medianoche(manana, meta.tz) - now;
    let alerta = null;
    if (d >= 1) alerta = T.startPassed;
    else if (meta.start === hoy && quedanHoy < 6 * 3600000) alerta = T.startLate;
    const moverA = async fecha => {
      if (!confirm(fmt(T.startMoveConfirm, { fecha: fechaLarga(medianoche(fecha, meta.tz), meta.tz) }))) throw { code: 'cancelado' };
      await store.reprogramar(S.code, moverInicio(meta, fecha));
      // El calendario tiene el foco (y en Chrome no lo suelta con blur), y con un campo enfocado
      // Administrar no se redibuja: aquí se fuerza
      admin({ forzar: true });
      SFX.reveal(); toast(fmt(T.startMoved, { fecha: fechaLarga(medianoche(fecha, meta.tz), meta.tz) }));
    };
    const mover = (fecha, rotulo, id) => meta.start === fecha
      ? el('button', { class: 'btn btn--yellow btn--sm', id, disabled: true }, `✓ ${rotulo}`)
      : accion(rotulo, id, () => moverA(fecha));
    // Otra fecha: un calendario de hoy a 30 días más (D-115)
    const otra = campoFecha(hoy);
    const esOtra = meta.start !== hoy && meta.start !== manana;
    if (esOtra && meta.start > hoy) otra.input.value = meta.start;
    const otraErr = el('div', { class: 'form-error', role: 'alert' });
    otra.nodo.append(accion(T.startOtherGo, 'btn-inicio-otra-ok', async () => {
      if (!otra.valida()) { avisoError(otraErr, fmt(T.errStartDate, { n: MAX_DIAS_INICIO })); throw { code: 'cancelado' }; }
      await moverA(otra.input.value);
    }, 'btn btn--yellow btn--sm'), otraErr);
    const botonOtra = el('button', { class: 'btn btn--ghost btn--sm' + (esOtra ? ' on' : ''), id: 'btn-inicio-otra', onClick: () => {
      SFX.tap(); otra.nodo.hidden = !otra.nodo.hidden; if (!otra.nodo.hidden) otra.input.focus();
    } }, `📅 ${T.startOther}`);
    poner(body, el('div', { class: 'panel stack', id: 'admin-inicio' },
      el('p', { class: 'lead', style: 'margin:0' }, T.startTitle),
      el('p', { class: 'muted', style: 'margin:0' }, fmt(d >= 1 ? T.startWas : T.startIs, { fecha: fechaLarga(meta.win[1].a, meta.tz) })),
      el('p', { class: 'muted', id: 'admin-zona', style: 'margin:0' }, fmt(T.startZone, { zona: zonaTexto(meta.tz) })),
      alerta ? el('div', { class: 'aviso' }, alerta) : null,
      el('div', { class: 'btn-row tres' }, mover(hoy, T.startTodayBtn, 'btn-inicio-hoy'), mover(manana, T.startTomorrowBtn, 'btn-inicio-manana'), botonOtra),
      otra.nodo));
  }

  // Solo en las copas del laboratorio: pasar al día siguiente para probar sin esperar (D-115)
  if (meta.lab && !terminada(meta, now)) {
    const siguiente = Math.min(d + 1, meta.days + 1);
    poner(body, el('div', { class: 'panel stack lab-panel', id: 'admin-lab' },
      el('p', { class: 'lead', style: 'margin:0' }, `🧪 ${T.labTitle}`),
      el('p', { class: 'muted', style: 'margin:0' }, T.labLead),
      faltaGente(Lc) ? el('div', { class: 'aviso', id: 'lab-falta-gente' }, T.labNeedSecond) : null,
      faltaGente(Lc) ? null : accion(`⏭️ ${siguiente > meta.days ? T.labEnd : fmt(T.labNext, { d: siguiente })}`, 'btn-pasar-dia', async () => {
        if (!confirm(siguiente > meta.days ? T.labEndConfirm : fmt(T.labNextConfirm, { d: siguiente }))) throw { code: 'cancelado' };
        await store.reprogramar(S.code, pasarDia(meta));
        SFX.reveal(); toast(siguiente > meta.days ? T.labEndDone : fmt(T.labNextDone, { d: siguiente }));
      }, 'btn btn--ghost')));
  }

  // Cerrar o reabrir la inscripción, mientras todavía se pueda entrar (hasta la final)
  if (inscripcionAbierta(meta, now)) {
    poner(body, el('div', { class: 'panel stack', id: 'admin-inscripcion' },
      el('p', { class: 'lead', style: 'margin:0' }, T.joinTitle),
      el('p', { class: 'muted', style: 'margin:0' }, Lc.closed ? T.joinIsClosed : fmt(T.joinIsOpen, { n: jug.length, max: MAX_JUGADORES })),
      Lc.closed
        ? accion(`🔓 ${T.joinReopen}`, 'btn-reabrir', () => store.cerrarInscripcion(S.code, false))
        : accion(`🔒 ${T.joinClose}`, 'btn-cerrar-inscripcion', async () => {
          if (!confirm(T.joinCloseConfirm)) throw { code: 'cancelado' };
          await store.cerrarInscripcion(S.code, true);
        })));
  }

  // Terminar la copa antes (D-161): por ejemplo, si el último no va a jugar la final
  if (puedeCerrar(meta, now)) {
    const hoy = Math.min(d, meta.days);
    const quienes = [hoy - 1, hoy].filter(k => k >= 1).map(k => ({ k, falta: faltan(Lc, k, now) })).filter(x => x.falta.length);
    const quedan = hoy < meta.days;
    const errTerminar = el('div', { class: 'form-error', role: 'alert' });
    poner(body, el('div', { class: 'panel stack', id: 'admin-terminar' },
      el('p', { class: 'lead', style: 'margin:0' }, T.endTitle),
      el('p', { class: 'muted', style: 'margin:0' }, T.endLead),
      quienes.map(x => el('div', { class: 'aviso' }, fmt(x.falta.length === 1 ? T.endMissingOne : T.endMissing, { d: x.k, names: x.falta.map(j => j.name).join(', ') }))),
      quedan ? el('p', { class: 'muted', style: 'margin:0' }, T.endCancelled) : null,
      accion(`🏁 ${T.endGo}`, 'btn-terminar', async () => {
        if (!confirm(fmt(T.endConfirm, { copa: meta.name }))) throw { code: 'cancelado' };
        await store.terminarCopa(S.code);
        SFX.reveal(); toast(T.endDone);
      }, 'btn btn--ghost', errTerminar),
      errTerminar));
  }

  const lista = el('div', { class: 'admin-jugadores' });
  const fila = (pid, p) => {
    const fueraPor = fuera(Lc, pid, now);
    const acciones = el('div', { class: 'acciones' });
    const editar = (rotulo, attrs, guardar) => {
      acciones.innerHTML = '';
      const input = el('input', { class: 'mini', ...attrs });
      poner(acciones, input, el('button', {
        class: 'btn btn--yellow btn--sm', onClick: async () => {
          try { await guardar(input.value); err.textContent = ''; admin(); } catch (e) { avisoError(err, typeof e === 'string' ? e : errorDe(e)); }
        },
      }, '✓'), el('button', { class: 'btn btn--ghost btn--sm', onClick: () => admin() }, '✕'));
      input.focus();
    };
    const esElAdmin = pid === meta.admin;
    // Renombrar va a la derecha del nombre, en la misma línea (no gasta alto); el resto, debajo
    const renombrar = el('button', { class: 'mini-btn', onClick: () => editar(T.rename, { value: p.name, maxlength: '20', 'aria-label': fmt(T.renamePrompt, { name: p.name }) }, async v => {
        const n = limpiarNombre(v);
        if (!n) throw T.errNombre;
        if (Object.entries(Lc.players).some(([q, x]) => q !== pid && claveNombre(x.name) === claveNombre(n))) throw T.errRepetido;
        await store.renombrar(S.code, pid, n);
      }) }, T.rename);
    poner(acciones,
      esElAdmin ? null : el('button', { class: 'mini-btn', onClick: () => editar(T.newPin, { inputmode: 'numeric', maxlength: '4', 'aria-label': fmt(T.pinPrompt, { name: p.name }) }, async v => {
        if (!esPin(v)) throw T.errPin;
        await store.cambiarPin(S.code, pid, await hashPin(S.code, pid, v));
        toast(fmt(T.pinDone, { name: p.name, pin: v }));
      }) }, T.newPin),
      // Terminada la copa, sacar a alguien cambiaría el podio: ya no se ofrece
      esElAdmin || terminada(meta, now) ? null : el('button', { class: 'mini-btn', onClick: async () => {
        if (!p.out && !confirm(fmt(T.kickConfirm, { name: p.name }))) return;
        try { await store.sacar(S.code, pid, !p.out); } catch (e) { avisoError(err, errorDe(e)); }
      } }, p.out ? T.unkick : T.kick),
      // Out for missing two days in a row (D-347): the admin can bring them back
      fueraPor && !terminada(meta, now) ? el('button', { class: 'mini-btn', onClick: async () => {
        if (!confirm(fmt(T.bringBackConfirm, { name: p.name }))) return;
        try { await store.devolver(S.code, pid); } catch (e) { avisoError(err, errorDe(e)); }
      } }, T.bringBack) : null);
    const nombre = el('div', { class: 'admin-nombre' },
      el('b', {}, p.name, esElAdmin ? el('small', { class: 'muted' }, ` (${T.youAdmin})`) : null, p.out ? el('small', { class: 'muted' }, ` (${T.kicked})`) : null,
        fueraPor ? el('small', { class: 'muted' }, ` (${fmt(T.outAdmin, { a: fueraPor.desde, b: fueraPor.hasta })})`) : null), renombrar);
    return el('div', { class: 'admin-fila' + (p.out || fueraPor ? ' fuera' : '') }, nombre, acciones);
  };
  Object.entries(Lc.players || {}).sort((a, b) => (a[1].at || 0) - (b[1].at || 0)).forEach(([pid, p]) => poner(lista, fila(pid, p)));
  poner(body, el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.adminPlayers), lista, err),
    el('button', { class: 'btn btn--ghost', onClick: () => { SFX.tap(); S.bienvenida = false; tablero(); } }, T.toBoard));

  // Eliminar la copa (D-117): al final, en rojo, con dos confirmaciones (la segunda, escribir el nombre)
  const errBorrar = el('div', { class: 'form-error', role: 'alert' });
  poner(body, el('div', { class: 'panel stack peligro', id: 'admin-eliminar' },
    el('p', { class: 'lead', style: 'margin:0' }, T.deleteTitle),
    el('p', { class: 'muted', style: 'margin:0' }, T.deleteLead),
    el('button', { class: 'btn btn--red', id: 'btn-eliminar', onClick: async ev => {
      SFX.tap();
      if (!confirm(fmt(T.deleteConfirm1, { copa: meta.name }))) return;
      const escrito = prompt(fmt(T.deleteConfirm2, { copa: meta.name }));
      if (escrito === null) return;
      if (claveNombre(escrito, COPA_MAX) !== claveNombre(meta.name, COPA_MAX)) { avisoError(errBorrar, T.deleteMismatch); return; }
      const b = ev.currentTarget; b.disabled = true;
      S.eliminando = true;
      try {
        await store.eliminar(S.code);
        const nombre = meta.name;
        cuenta.olvidar(S.code);
        if (S.off) { S.off(); S.off = null; }
        S.code = null; S.yo = null; S.L = null;
        history.replaceState(null, '', `${location.pathname}${PRUEBA ? '?test' : LABS ? '?labs' : ''}`);
        SFX.splash();
        eliminada(nombre);
      } catch (e) { S.eliminando = false; b.disabled = false; avisoError(errBorrar, errorDe(e)); }
    } }, `🗑️ ${T.deleteGo}`),
    errBorrar));
}

/** La confirmación al admin de que su copa se borró (D-117). */
function eliminada(nombre) {
  mostrar('espera');
  const body = $('#espera-body');
  body.innerHTML = '';
  poner(body, el('div', { class: 'stack center', id: 'copa-eliminada' },
    el('div', { class: 'result-hero' }, el('span', { class: 'trophy pop' }, '🗑️'),
      el('h2', { class: 'display display--md' }, T.deletedTitle)),
    el('div', { class: 'aviso bien' }, fmt(T.deletedDone, { copa: nombre })),
    el('button', { class: 'btn btn--yellow', onClick: () => { SFX.tap(); S.eliminando = false; portada(); } }, T.deletedBack)));
}

/* ------------------------------------------------------------------ */
/* Antes de jugar: cómo se juega y el comodín                          */
/* ------------------------------------------------------------------ */

function antesDeJugar(d) {
  const Lc = L(), { meta } = Lc;
  const id = juegoDelDia(meta, d), J = juegoDia(meta, d), variante = varianteDelDia(meta, d);
  mostrar('jugar');
  S.antesala = true;
  rotuloMenu();
  $('#jugar-head').innerHTML = '';
  const body = $('#jugar-body');
  body.innerHTML = '';
  const err = el('div', { class: 'form-error', role: 'alert' });
  const now = ahora();
  const w = comodinDe(Lc, S.yo);
  let comodin;
  if (esFinal(meta, d)) comodin = el('p', { class: 'muted' }, T.wildFinal);
  else if (w === d) comodin = el('p', { class: 'ok' }, `🃏 ${T.wildOn}`);
  else if (w) comodin = el('p', { class: 'muted' }, fmt(T.wildGone, { d: w }));
  else if (puedeComodin(Lc, d, S.yo, now)) {
    comodin = el('div', {},
      el('p', { class: 'muted' }, T.wildOff),
      el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-comodin', onClick: async ev => {
        if (!confirm(fmt(T.wildConfirm, { d }))) return;
        ev.currentTarget.disabled = true;
        try { await store.comodin(S.code, d, S.yo); SFX.king(); antesDeJugar(d); } catch (e) { avisoError(err, errorDe(e)); ev.currentTarget.disabled = false; }
      } }, `🃏 ${T.wildUse}`));
  }
  const sinGente = faltaGente(Lc);
  const empezar = el('button', { class: 'btn btn--yellow', id: 'btn-empezar', disabled: sinGente }, `${J.emoji} ${T.start}`);
  if (sinGente) avisoError(err, T.needSecond);
  precalentar(id,
    () => JUEGOS[id].generar(S.code, d, { lang: LANG, palabras: palabrasDe(meta), aud: audienciaDe(meta), variante, rondas: finalRounds(meta) }),
    () => JUEGOS[id].ensayo(S.code, d, { lang: LANG, palabras: palabrasDe(meta), aud: audienciaDe(meta), variante, rondas: finalRounds(meta) }));
  empezar.addEventListener('click', async () => {
    SFX.tap();
    empezar.disabled = true;
    try {
      await store.empezar(S.code, d, S.yo);
      // Una copa de ?test es de mentira (vive en este navegador): no suma en las estadísticas.
      // Las del laboratorio sí: hoy son las copas reales con amigos (D-101).
      if (!PRUEBA) trackStart({ game: GAME_ID, mode: GAME_ID, players: 1 });
      jugar(d);
    } catch (e) {
      if (e?.code === 'permiso') { sentarseDeNuevo(); return; }
      avisoError(err, errorDe(e)); empezar.disabled = false;
    }
  });
  poner(body, el('div', { class: 'stack' },
    el('div', { class: 'intro-hero' }, heroe(id, J),
      el('p', { class: 'muted', style: 'margin:0' }, fmt(T.dayOf, { d, n: meta.days })),
      tituloAntesala(id, J), rotuloVariante(J)),
    CON_PALABRAS.includes(id) ? avisoPalabras(meta) : null,
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.howToPlay), dibujo(id, variante), el('ol', { class: 'como' }, J.como.map(x => el('li', {}, x))),
      // The final names its rounds, the games of this week (D-418)
      id === 'final' ? [el('p', { class: 'lead', style: 'margin:10px 0 4px' }, T.finalRounds), listaRondas()] : null,
      el('p', { class: 'lead', style: 'margin:10px 0 4px' }, T.scoring), el('p', { class: 'muted' }, puntajeTexto(J))),
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.wildTitle), comodin),
    JUEGOS[id].ensayo ? [el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-ensayo', onClick: () => { SFX.tap(); ensayo(d); } }, `🧪 ${T.tryFirst}`),
      el('p', { class: 'muted center', id: 'nota-ensayo', style: 'margin:0' }, notaPrueba(id))] : null,
    el('p', { class: 'muted center' }, T.startWarn), err, empezar));
}

/* ------------------------------------------------------------------ */
/* Jugar                                                               */
/* ------------------------------------------------------------------ */

/**
 * Cuenta de 3 a 1 y "¡A jugar!" antes de un juego con reloj (D-105): todos los de La Copa lo
 * tienen, porque el tiempo desempata. El reloj parte cuando aparece "¡A jugar!", y ese cartel se
 * desvanece solo sobre el tablero. Resuelve la promesa en ese momento.
 */
/** Los juegos que se juegan con palabras del idioma de la copa (D-170). */
const CON_PALABRAS = ['conexiones', 'agentes', 'letras', 'final'];
/** "Las palabras de esta copa van en inglés", solo si no es el idioma en que se está mirando. */
/** El público de la copa se dice en la invitación y en el tablero (D-186, D-187). */
const avisoAudiencia = meta => {
  const aud = audienciaDe(meta);
  return aud ? el('p', { class: 'muted center', id: 'aviso-aud', 'data-aud': aud, style: 'margin:0' }, T[{ global: 'audNoteGlobal', cl: 'audNoteCl', br: 'audNoteBr' }[aud]]) : null;
};
const avisoPalabras = meta => (palabrasDe(meta) === LANG ? null
  : el('p', { class: 'muted center aviso-palabras', style: 'margin:0' }, fmt(T.wordsIn, { idioma: T.langNames[palabrasDe(meta)] })));

/** Lo de arriba de la antesala: la portada animada del juego si la tiene (el globo de ¿Dónde queda?), si no su emoji. */
const heroe = (id, J) => JUEGOS[id]?.portada?.({ variante: J.variante || null }) ?? el('span', { class: con('icon', J.emoji) }, J.emoji);

/**
 * Un juego que tarda en armarse (`caro`, El caso, D-260) se arma mientras se lee la antesala, sin
 * apuro: así tocar Empezar o Probar primero no deja el botón trabado. Lo armado queda guardado en el
 * motor y el juego lo reusa. Si no alcanza, se arma igual al empezar.
 */
function precalentar(id, ...armar) {
  if (!JUEGOS[id]?.caro) return;
  const luego = globalThis.requestIdleCallback || (f => setTimeout(f, 300));
  for (const f of armar) luego(() => { try { f(); } catch (_) { /* se arma al empezar */ } });
}

/** How the score was reached (D-106): the game's own breakdown if it brings one (D-331), if not desglose.js. */
const detalle = (id, estado, o) => (JUEGOS[id]?.desglose && estado ? JUEGOS[id].desglose(estado, o) : desglose(id, estado, o));

/**
 * The game of day d as it is played that day (D-331): with its variant's steps and scoring.
 */
const juegoDia = (meta, d) => conVariante(JUEGOS_COPA[juegoDelDia(meta, d)], varianteDelDia(meta, d));
/** The variant's name under the game's name in the waiting room, if it has one. */
const rotuloVariante = J => (J?.varianteNombre ? el('p', { class: 'variante-dia', id: 'variante-dia' }, J.varianteNombre) : null);

/** Lo que dice la antesala de la prueba: en El caso no es más corta, es un caso completo. */
const notaPrueba = id => (JUEGOS[id]?.pruebaCompleta ? T.trialNoteFull : T.trialNote);

/** El nombre del juego en la antesala: el suyo si lo trae (El caso: la lupa y los colores, D-257), si no el de siempre. */
const tituloAntesala = (id, J) => JUEGOS[id]?.titulo?.({ el, J }) ?? el('h2', { class: 'display display--lg' }, J.nombre);

/** El dibujo que explica el juego antes del texto, si lo tiene (Reinas, Tango y Zip). */
const dibujo = (id, variante = null) => JUEGOS[id]?.ejemplo?.({ el, T, variante }) ?? null;

/**
 * Las reglas del juego, plegadas debajo del tablero (D-133): no molestan mientras se juega y
 * están a mano ante la duda. Son las mismas de la pantalla de antes de jugar, con las palabras
 * de los botones que se ven al jugar. En la final, además, sus rondas (D-418).
 */
/** Cómo se puntúa; el desempate solo dentro de una copa, donde hay con quién empatar (dilema #72). */
const puntajeTexto = (J, copa = true) => (copa && J.desempate ? `${J.puntaje} ${J.desempate}` : J.puntaje);

/** The rounds of the final being played (D-418): this cup's, or the five fixed ones in the lab's practice. */
const rondasDeLaFinal = () => finalRounds(S.juego?.practica || !S.code ? null : L()?.meta);
/** The final's rounds as a list: each game's name, and with `detalle` how its round is played. */
const listaRondas = ({ detalle = false } = {}) => el('ul', { class: 'como', id: 'rondas-final' }, rondasDeLaFinal().map(x => {
  const { id: r, variante: v } = diaDeCal(x), R = conVariante(JUEGOS_COPA[r], v);
  return el('li', {}, detalle && RONDAS_FINAL[r] ? `${R.emoji} ${R.nombre}: ${RONDAS_FINAL[r]}` : `${R.emoji} ${R.nombre}`);
}));
/** One line, above the detailed list, for the rounds played whole (instead of repeating it per round). */
const notaRondasEnteras = () => (rondasDeLaFinal().some(x => !RONDAS_FINAL[diaDeCal(x).id]) ? el('p', { class: 'muted', id: 'nota-enteras' }, T.finalWholeNote) : null);
/** The final outside a cup (the lab's practice and its trial) has no week: its five fixed rounds' texts (D-418). */
const reglasDe = (id, J) => (id === 'final' && S.juego?.practica && J?.comoSuelta ? { ...J, como: J.comoSuelta, puntaje: J.puntajeSuelto } : J);

function panelReglas(id, { copa = true, prueba = false, variante = null } = {}) {
  const J = reglasDe(id, conVariante(JUEGOS_COPA[id], variante));
  const caja = $('#jugar-reglas');
  caja.innerHTML = '';
  if (!J) return;
  poner(caja, el('details', { class: 'panel reglas', id: 'reglas' },
    el('summary', {}, `📖 ${fmt(T.rulesOf, { juego: J.nombre })}`),
    // En la sesión de prueba de un día, que es más corta y no cuenta
    prueba ? el('p', { class: 'muted', id: 'nota-ensayo' }, notaPrueba(id)) : null,
    rotuloVariante(J),
    dibujo(id, variante),
    el('ol', { class: 'como' }, J.como.map(x => el('li', {}, x))),
    id === 'final' ? [el('p', { class: 'lead' }, T.finalRounds), notaRondasEnteras(),
      listaRondas({ detalle: true })] : null,
    el('p', { class: 'lead' }, T.scoring),
    el('p', { class: 'muted' }, puntajeTexto(J, copa))));
}

/**
 * El 3, 2, 1, ¡A jugar! antes de cada juego (D-105), el de assets/js/cuenta-regresiva.js. Devuelve
 * cuánto falta para que se vaya la capa: el reloj parte recién ahí.
 */
function cuentaRegresiva(J) {
  // La Gran Final no la lleva: cada ronda ya parte con su propia presentación
  if (J === JUEGOS_COPA.final) return Promise.resolve(0);
  $('#jugar-head').replaceChildren(el('span', { class: 'jugar-titulo' }, conEmoji(J.emoji, J.nombre)));
  $('#jugar-body').innerHTML = '';
  return cuentaComun({ titulo: conEmoji(J.emoji, J.nombre), ya: T.letsPlay });
}

async function jugar(d) {
  const Lc = L(), { meta } = Lc;
  const id = juegoDelDia(meta, d), J = juegoDia(meta, d), mod = JUEGOS[id], variante = varianteDelDia(meta, d);
  const guardado = cuenta.intento.leer(S.code, d, S.yo) || {};
  // Si ya había terminado pero no se alcanzó a guardar el resultado, se reintenta de una
  if (guardado.fin) { enviar(d, guardado.fin); return; }
  mostrar('jugar');
  keepAwake();
  // La cuenta va solo al empezar: si se retoma una partida, el tablero vuelve de una
  const espera = guardado.reloj ? 0 : await cuentaRegresiva(J);
  // Conexiones necesita saber cuándo empezó su día, para no cambiar de grilla a mitad (D-128)
  // Los textos en el idioma de quien juega y las palabras en el de la copa (D-170)
  // El público de la copa decide qué contenido local entra (D-187)
  const p = mod.generar(S.code, d, { lang: LANG, palabras: palabrasDe(meta), aud: audienciaDe(meta), variante, rondas: finalRounds(meta), ...(id === 'conexiones' ? { desde: meta.win[d].a } : {}) });
  const now = ahora();
  // El reloj se detiene cuando el tablero termina, no cuando se toca "Ver resultado" (D-130).
  // Detenido, queda así aunque se recargue la página.
  let detenido = !!guardado.detenido;
  // Uno nuevo parte cuando se fue la cuenta y terminó la entrada del juego (las cartas de El caso
  // que se dan vuelta): ni la cuenta ni la entrada son tiempo de juego
  let rel = guardado.reloj ? (detenido ? guardado.reloj : reloj.seguir(guardado.reloj, now)) : reloj.nuevo(now + espera + (mod.entrada?.() || 0));
  let jugadas = guardado.jugadas;
  // El resultado se envía apenas termina el tablero, no al tocar "Ver resultado" (D-150): si el
  // jugador cierra sin tocarlo y el día cierra, igual cuenta
  let fin = null, envio = null;
  const persistir = () => cuenta.intento.guardar(S.code, d, S.yo, { jugadas, reloj: reloj.pausar(rel, ahora()), detenido, ...(fin ? { fin } : {}) });
  const cerrar = estado => {
    const r = mod.resultado(estado);
    fin = { s: r.s, ms: r.ms ?? Math.round(reloj.leer(rel, ahora())), t: r.t, resumen: r.resumen, det: detalle(id, estado, { T, fmt, mmss, lang: LANG }) };
    persistir();
    envio = mandar(d, fin);
    // Si falla, "Ver resultado" lo reintenta y lo dice en pantalla; aquí no hay nada que mostrar
    envio.catch(() => {});
  };
  persistir();

  const head = $('#jugar-head');
  head.innerHTML = '';
  head.append(el('span', { class: 'jugar-titulo' }, conEmoji(J.emoji, J.nombre)));
  // No clock in the header while playing (D-379), except in a game whose speed scores and that has
  // no countdown of its own (`clock` in its ui.js, D-384). The end-to-end scripts read the time
  // here to check that it stops with the board (D-130)
  head.reloj = () => mmss(reloj.leer(rel, ahora()));
  const cron = mostrarReloj(head, mod, () => reloj.leer(rel, ahora()));
  S.visibilidad && document.removeEventListener('visibilitychange', S.visibilidad);
  // Mientras se lee el dato de un error el reloj está en pausa, y volver a la pestaña no lo anda (D-277)
  let leyendo = null;
  S.visibilidad = () => {
    if (detenido) return;
    rel = document.hidden || leyendo ? reloj.pausar(rel, ahora()) : reloj.seguir(rel, ahora());
    persistir();
  };
  document.addEventListener('visibilitychange', S.visibilidad);

  const body = $('#jugar-body');
  body.innerHTML = '';
  panelReglas(id, { variante });
  S.juego = { d, id };
  pantallaCompleta(mod.pantallaCompleta);
  mod.montar(body, {
    p, jugadas, T, fmt, el, SFX, vibrate, lang: LANG, pantallaCompleta,
    guardar(j) { jugadas = j; persistir(); },
    tiempo: () => Math.round(reloj.leer(rel, ahora())),
    pausa(ms) {
      if (detenido) return () => {};
      leyendo?.();
      leyendo = pausaDeLectura({ ms,
        pausar: () => { rel = reloj.pausar(rel, ahora()); persistir(); },
        seguir: () => { leyendo = null; if (!detenido && !document.hidden) rel = reloj.seguir(rel, ahora()); },
        alCambiar: p => cron?.classList.toggle('en-pausa', p) });
      return leyendo;
    },
    // Cada juego lo llama cuando su tablero termina (resuelto, perdido o sin tiempo): el tiempo
    // queda ahí, y lo que se tarde en tocar "Ver resultado" no cuenta (D-130). Con el estado
    // final, además, el resultado sale en ese momento (D-150)
    pararReloj(estado) {
      if (!detenido) { rel = reloj.pausar(rel, ahora()); detenido = true; persistir(); }
      pararMuestra(cron, () => reloj.leer(rel, ahora()));
      if (estado && !fin) cerrar(estado);
    },
    terminar(estado) {
      clearInterval(S.reloj);
      document.removeEventListener('visibilitychange', S.visibilidad);
      if (!fin) cerrar(estado);
      enviar(d, fin, envio);
    },
  });
}

/** Escribe el resultado en la copa. Que ya estuviera guardado cuenta como enviado. */
async function mandar(d, fin) {
  const t = String(fin.t || '').slice(0, 300);
  try {
    await store.resultado(S.code, d, S.yo, { s: fin.s, ms: fin.ms, t, r: String(fin.resumen || '').slice(0, 30) });
  } catch (e) {
    if (e?.code !== 'ya-jugado') throw e;
  }
}

/** La pantalla de resultado: espera el envío (el que ya salió al terminar el tablero, o uno nuevo). */
async function enviar(d, fin, envio = null) {
  mostrar('resultado');
  const body = $('#resultado-body');
  body.innerHTML = '';
  poner(body, el('div', { class: 'waiting center' }, T.sending));
  try {
    await (envio || mandar(d, fin));
  } catch (e) {
    if (e?.code === 'permiso') { sentarseDeNuevo(); return; }
    body.innerHTML = '';
    const err = el('div', { class: 'form-error', role: 'alert' });
    poner(body, err, el('button', { class: 'btn btn--yellow', onClick: () => enviar(d, fin) }, T.retry),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => tablero() }, T.toBoard));
    avisoError(err, e?.code === 'ventana' ? T.errVentana : `${errorDe(e)} ${T.sendFail}`);
    return;
  }
  cuenta.intento.borrar(S.code, d, S.yo);
  // El puntaje del día cuenta para el ranking de ese juego, pestaña "Copa" (D-212). No se espera.
  if (leerYo() && !L().meta.lab) jugador().then(J => J.anotar({ juego: juegoDelDia(L().meta, d), variante: 'copa', s: fin.s, ms: fin.ms })).catch(() => {});
  SFX.win(); vibrate([30, 50, 30]);
  // La copa llega por el oyente; si todavía no trae el resultado, se dibuja con el propio
  const Lc = L();
  if (!Lc.results?.[d]?.[S.yo]) {
    Lc.results ||= {}; Lc.results[d] ||= {};
    Lc.results[d][S.yo] = { s: fin.s, ms: fin.ms, t: fin.t, r: fin.resumen };
  }
  resultado(d, { recien: true, det: fin.det });
}

/* ------------------------------------------------------------------ */
/* Resultado del día                                                   */
/* ------------------------------------------------------------------ */

function resultado(d, { recien = false, det = null } = {}) {
  const Lc = L(), { meta } = Lc;
  const mio = Lc.results?.[d]?.[S.yo];
  if (!mio) { tablero(); return; }
  S.verDia = d;
  mostrar('resultado');
  const id = juegoDelDia(meta, d), J = juegoDia(meta, d);
  const now = ahora();
  const jug = activos(Lc);
  const pos = posicionesDelDia(Lc.results[d], jug.map(j => j.pid));
  const n = Object.keys(pos).length;
  const x = multiplicador(Lc, d, S.yo);
  const yo = pos[S.yo];
  const body = $('#resultado-body');
  body.innerHTML = '';
  const ranking = jug.filter(j => pos[j.pid]).sort((a, b) => pos[a.pid].pos - pos[b.pid].pos);
  poner(body, 
    el('div', { class: 'result-hero' },
      el('span', { class: con('trophy' + (recien ? ' pop' : ''), J.emoji) }, J.emoji),
      el('h2', { class: 'display display--md' }, fmt(T.resultTitle, { d, juego: J.nombre })),
      el('p', { class: 'muted', style: 'margin:0' }, T.yourScore),
      el('div', { class: 'score-big' }, mio.r || String(mio.s)),
      ...bajoElPuntaje(mio.t, mio.ms, id)),
    el('p', { class: 'lead center' }, cerrado(meta, d, now) || terminada(meta, now)
      ? fmt(T.finalPos, { pos: ord(yo.pos), n, pts: yo.pts * x })
      : fmt(T.provisional, { pos: ord(yo.pos), n })),
    // The end-screen order (C-19): the way back to the board first, then share and the next-day
    // notice (share before the notice: the notice's card is tall and pushed share under the fold
    // in German and Portuguese at 320 px); the breakdown folded and the day table below (C-8)
    el('button', { class: 'btn btn--yellow', id: 'btn-volver', onClick: () => { SFX.tap(); S.verDia = null; tablero(); } }, T.toBoard),
    el('button', { class: 'btn btn--cyan', id: 'btn-tarjeta', onClick: ev => conBoton(ev, () => compartirResultado(d)) }, T.shareCard),
    // Ofrece avisar del próximo día que todavía no se abre: no siempre es d + 1 (un día viejo, o
    // jugado con el siguiente ya abierto)
    diaActual(meta, now) < meta.days && !terminada(meta, now) ? avisos().tarjeta({ dia: diaActual(meta, now) + 1 }) : null,
    explicacion(J, { s: mio.s, ms: mio.ms, det, x, final: esFinal(meta, d) }),
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.dayTable),
      el('div', { class: 'tabla' }, ranking.map(j => el('div', { class: 'fila' + (j.pid === S.yo ? ' yo' : '') },
        el('span', { class: 'lugar' }, `${pos[j.pid].pos}`),
        el('span', { class: 'flecha' }),
        // Quien usó el comodín (o todos, en la final) lleva "×2" junto al nombre: explica por qué
        // sus puntos no calzan con su lugar. El de la final va en otro color (D-151)
        el('div', { class: 'quien' }, multiplicador(Lc, d, j.pid) === 2
          ? el('div', { class: 'con-x2' }, el('b', {}, j.name), el('span', { class: `${claseX2(esFinal(meta, d))} md-x2` }, T.x2))
          : el('b', {}, j.name), el('small', { class: 'muted' }, `${Lc.results[d][j.pid].r || Lc.results[d][j.pid].s} · ⏱ ${mmss(Lc.results[d][j.pid].ms)}`),
          // En la final, las rondas de cada uno (⏳75 🔢85 …), para comparar ronda a ronda (#259)
          id === 'final' && Lc.results[d][j.pid].t ? el('small', { class: 'muted rondas' }, Lc.results[d][j.pid].t) : null),
        el('span', { class: 'total' }, `+${pos[j.pid].pts * multiplicador(Lc, d, j.pid)}`))))),
    botonReporte({ juego: id, dia: d }),
  );
}

/**
 * El resultado del día, completo (D-124) y con su imagen (D-165): la cabecera de la copa con el
 * día ("🏆 *La Copa: …* · Día 3 de 7"), el juego, quién lo jugó, cómo le fue y la tarjeta de
 * colores. La imagen dice lo mismo, en el mismo orden.
 */
async function compartirResultado(d) {
  const Lc = L(), { meta } = Lc;
  const mio = Lc.results[d][S.yo];
  const J = G().J[juegoDelDia(meta, d)];
  const cab = cabCopa('🏆', fmt(G().T.ctxDay, { d, n: meta.days }));
  const puntaje = mio.r || String(mio.s), tiempo = mmss(mio.ms);
  // El juego, quién, el puntaje, el tiempo y la tarjeta van en la imagen: el texto no los repite (D-171)
  const texto = mensajeCopa(cab);
  const imagen = await laminaResultado({
    cab, url: urlPublica(S.code), juego: J, nombre: nombreDe(S.yo), puntaje,
    detalle: puntajeYTiempo('', tiempo, mio.t), tarjeta: mio.t,
    archivo: nombreArchivo('copa', meta.alias || S.code, 'dia', d, nombreDe(S.yo)),
  });
  await compartir(texto, imagen);
}

/**
 * Lo que va bajo el puntaje (D-114): la tarjeta para compartir y el tiempo, pero el tiempo solo
 * si la tarjeta no lo trae ya (la de Reinas es "👑 ⏱ 1:23 ✅"): se veía dos veces.
 */
/** Games whose share card only repeats the score (Desenredo's 🧶 🟩🟩): it goes in the shared text, not on the result screen. */
const SIN_TARJETA_EN_RESULTADO = new Set(['desenredo']);
function bajoElPuntaje(t, ms, id = null) {
  return [
    t && !SIN_TARJETA_EN_RESULTADO.has(id) ? el('pre', { class: 'tarjeta' }, t) : null,
    String(t || '').includes('⏱') ? null : el('p', { class: 'muted' }, `⏱ ${mmss(ms)}`),
  ];
}

/**
 * Cómo se calculó el puntaje (D-106). Recién terminado trae el desglose línea por línea; si se
 * mira después (el desglose no se guarda en la copa), la regla del juego. En la copa suma cómo el
 * lugar del día se vuelve puntos, y si ese día valía el doble.
 */
function explicacion(J, { s, ms, det, x = 1, final = false, copa = true }) {
  const lineas = det?.length ? det : [puntajeTexto(J, copa)];
  // Folded and after the exits, everywhere (C-19); on its own the score and the time are already above it,
  // so neither is said again here
  return el('details', { class: 'panel explicacion', id: 'explicacion' },
    el('summary', { class: 'lead' }, `🧮 ${T.bdTitle}`),
    el('ul', {}, lineas.map(t => el('li', {}, t))),
    copa && det?.length ? el('p', { class: 'explicacion-total' }, fmt(s === 1 ? T.bdTotalOne : T.bdTotal, { s })) : null,
    !copa || J === JUEGOS_COPA.zip || J === JUEGOS_COPA.desenredo ? null : el('p', { class: 'muted' }, fmt(T.bdTime, { t: mmss(ms) })),
    copa ? el('p', { class: 'muted' }, T.bdPlaces) : null,
    copa && x > 1 ? el('p', { class: 'ok' }, final ? T.bdFinal : T.bdWild) : null);
}

/* ------------------------------------------------------------------ */
/* Práctica: un juego suelto, sin copa ni Firebase (LIG-41)        */
/* ------------------------------------------------------------------ */

/**
 * `/cup/?practice=<juego>` juega un juego suelto con contenido al azar, para probar su
 * mecánica antes de armar una copa. La semilla se muestra al final y va en la URL
 * (`&seed=K7Q2X`): con ella se repite exactamente la misma partida para reportar un error.
 */
/**
 * Desde la portada (D-142) la práctica es el juego suelto: vuelve al menú, no ofrece la sesión
 * de prueba (jugar otra vez ya es probar) ni muestra la semilla, y manda su señal de uso. Desde el
 * laboratorio llega con `&labs` y queda como estaba.
 */
const volverDePractica = () => (LABS
  ? el('a', { class: 'btn btn--ghost btn--sm', href: `${RAIZ}labs/` }, T.backToLabs)
  : salidasFin('suelto', { lang: LANG, raiz: RAIZ }));

/**
 * The variant of a standalone game (D-331): the link's (`?mode=hard`; Pintaminas' `?colors=2`
 * from the lab too), or the one this phone remembers, or the default one.
 */
const claveVariante = id => `juegos-de-salon:${id}:variant`;
function varianteSuelta(id) {
  const vs = JUEGOS[id]?.variantes;
  if (!vs) return null;
  const url = param('mode') || (id === 'pintaminas' && param('colors') === '2' ? 'hard' : null);
  if (vs.includes(url)) { guardarVariante(id, url); return url; }
  let guardada = null;
  try { guardada = localStorage.getItem(claveVariante(id)); } catch (_) { /* sin almacenamiento: la de siempre */ }
  return vs.includes(guardada) ? guardada : vs[0];
}
function guardarVariante(id, v) { try { localStorage.setItem(claveVariante(id), v); } catch (_) { /* solo esta vez */ } }
/** The ranking table of a variant (D-331): the default one is the game's own, the others go apart. */
const varianteRk = (id, v) => (v && v !== JUEGOS[id]?.variantes?.[0] ? v : '');

/**
 * The variant picker of the waiting room (D-331): the game's own if it brings one (Pintaminas' lever),
 * if not two buttons like the cup's options. Picking one redraws the waiting room with its steps.
 */
function selectorVariante(id, variante, cambiar) {
  const J = JUEGOS_COPA[id], mod = JUEGOS[id];
  const propio = mod.selector?.({ el, T, SFX, vibrate, variante, cambiar });
  if (propio) return propio;
  const o = opciones(opcionesVariante(J, mod.variantes), cambiar, { inicial: variante });
  o.nodo.classList.add('dos', 'variantes');
  o.nodo.id = 'selector-variante';
  return o.nodo;
}

function practica(id, varianteElegida = null) {
  const mod = JUEGOS[id];
  if (!JUEGOS_COPA[id] || !mod) { if (SUELTO) location.replace(RAIZ); else portada(); return; }
  // Uno al día is the same challenge for everyone (D-334): always the default variant, without the picker
  const variante = HOY ? (mod.variantes?.[0] ?? null) : varianteElegida || varianteSuelta(id);
  const J = conVariante(JUEGOS_COPA[id], variante);
  // La página propia de un juego (también la del laboratorio, /labs/case/) lleva su nombre en la pestaña
  if (!LABS || SUELTO) document.title = `${J.nombre} ${J.emoji} · ${(COMMON[LANG] || COMMON.es).appTitle}`;
  // En el laboratorio, "‹ Laboratorio" es largo: bajo 400 px el chip queda solo con el emoji (U-12)
  if (SUELTO) $('#chip-juego').replaceChildren(el('span', { class: con('', J.emoji) }, J.emoji), el('span', { class: LABS ? 'chip-txt chip-txt--lab' : 'chip-txt' }, ` ${J.nombre}`));
  if (HOY) {
    // Si hoy toca otro juego (un link de ayer, o pasó la medianoche), se va al de hoy
    const fecha = fechaLocal(), deHoy = juegoDel(fecha);
    if (deHoy !== id) { location.replace(RAIZ + rutaHoy(deHoy)); return; }
    S.hoy = { fecha, ya: !!leerUnoAlDia().dias[fecha] };
  }
  // Un juego `diario` (El caso, D-267), sin semilla en el link, es el del día: el mismo para todos
  const delDia = !HOY && !esCodigo(SEMILLA) && !!gameById(id)?.diario;
  const semilla = HOY ? semillaDel(S.hoy.fecha) : esCodigo(SEMILLA) ? SEMILLA : delDia ? semillaDel(fechaLocal()) : codigoAlAzar();
  precalentar(id, () => JUEGOS[id].generar(semilla, 1, { lang: LANG, variante }), () => JUEGOS[id].ensayo?.(semilla, 1, { lang: LANG, variante }));
  const zipSeg = param('timer');
  // Suelto, la semilla no va a la vista (D-142): el link queda en /queens/. Desde el
  // laboratorio sí, para poder repetir la partida.
  // El del día no: el link queda limpio y mañana abre el de mañana
  if (SUELTO && LABS && !HOY && !delDia) history.replaceState(null, '', paginaSuelta(id, { semilla, zipSeg, modo: varianteRk(id, variante) }));
  else if (!SUELTO) history.replaceState(null, '', `${location.pathname}?practice=${slugDe(id)}&seed=${semilla}${PRUEBA ? '&test' : ''}${LABS ? '&labs' : ''}${zipSeg ? `&timer=${zipSeg}` : ''}`);
  S.juego = { d: 1, id, practica: true, semilla, variante };
  const Jr = reglasDe(id, J);
  mostrar('jugar');
  $('#jugar-head').innerHTML = '';
  $('#jugar-reglas').innerHTML = ''; // en la antesala las reglas ya están a la vista
  const body = $('#jugar-body');
  body.innerHTML = '';
  poner(body, el('div', { class: 'stack' },
    el('div', { class: 'intro-hero' }, heroe(id, J),
      // En el laboratorio no se rotula "Práctica en el laboratorio": el chip y el botón de volver ya lo dicen
      tituloAntesala(id, J),
      el('div', { style: 'margin-top:6px' }, langToggle())),
    // The variant is picked here, before the steps, which are the variant's (D-331)
    variante && !HOY ? selectorVariante(id, variante, v => { guardarVariante(id, v); SFX.tap(); practica(id, v); }) : null,
    // Uno al día: una línea arriba, y nada más; cómo se juega es lo del juego (U-18)
    HOY ? el('p', { class: 'aviso uad-intro', id: 'uad-intro' }, S.hoy.ya ? UAD().introRepite : UAD().intro) : null,
    delDia ? el('p', { class: 'aviso uad-intro', id: 'diario-intro' }, `📅 ${T.casoDelDia}`) : null,
    // La misma antesala que un día de la copa (D-109): la sesión de prueba se elige antes de jugar
    mod.ensayo && LABS ? el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-ensayo', onClick: () => { SFX.tap(); ensayoPractica(id, semilla, variante); } }, `🧪 ${T.tryFirst}`) : null,
    // Suelto no hace falta decir que no cuenta para una copa: no hay copa a la vista
    // Un juego `diario` (El caso, D-267) no: lo abre un amigo que no sabe de copas, y arriba ya dice qué caso es (U-8)
    LABS && !gameById(id)?.diario ? el('p', { class: 'muted center' }, T.practiceHint) : null,
    el('button', { class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); jugarPractica(id, semilla, variante); } }, `${J.emoji} ${T.start}`),
    volverDePractica(),
    // Entrar, pegado a Empezar y a Volver (D-249): sin jugador, la partida no queda en ningún
    // ranking. Arriba de las reglas, o entre los dos, bajaba los botones en alemán (C-8)
    rankea(id) ? bloqueJugador({ destacado: true, alTocar: () => SFX.tap() }) : null,
    // How to play goes after Empezar, so the button is seen without scrolling on a small phone (U-39)
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.howToPlay), dibujo(id, variante), el('ol', { class: 'como' }, Jr.como.map(x => el('li', {}, x))),
      el('p', { class: 'lead', style: 'margin:10px 0 4px' }, T.scoring), el('p', { class: 'muted' }, puntajeTexto(Jr, false))),
    rankea(id) ? bloqueRanking({ juego: tablaRk(id, variante), titulo: tituloRk(J), pestanas: varianteRk(id, variante) ? ['semana', 'siempre', 'amigos'] : ['semana', 'siempre', 'amigos', 'copa'], alTocar: () => SFX.tap() }) : null));
  pieComentario({ juego: id, semilla, pantalla: 'antesala' });
}

/**
 * ¿Esta partida cuenta para los rankings (D-212)? Los juegos sueltos de la portada, jugados como
 * cualquiera los juega: sin el laboratorio y sin una semilla elegida, que dejaría repetir el mismo
 * tablero hasta sacarle el máximo.
 */
/** The table a standalone game ranks in (D-331): `pintaminas`, or `pintaminas_hard` for its other variant. */
const tablaRk = (id, v) => (varianteRk(id, v) ? `${id}_${varianteRk(id, v)}` : id);
const tituloRk = J => fmt(RK.titleOf, { game: J.varianteNombre ? `${J.nombre} · ${J.varianteNombre}` : J.nombre });
const rankea = id => !LABS && !SEMILLA && !(HOY && S.hoy?.ya) && !!gameById(id)?.suelto && rankingsVisibles();
/** Los textos de Uno al día, en el idioma de quien juega. */
const UAD = () => (COMMON[LANG] || COMMON.es).uad;

function jugarPractica(id, semilla, variante = null) {
  // Suelto, todo va en el idioma de quien juega: no hay con quién jugar lo mismo (D-170)
  const p = JUEGOS[id].generar(semilla, 1, { lang: LANG, variante });
  // Solo en el modo de prueba: `&timer=8` acorta el reloj de Zip, Desenredo y Rutas rotas para los guiones de punta a punta
  const seg = Number(param('timer'));
  if (PRUEBA && (id === 'zip' || id === 'desenredo' || id === 'rutas') && seg > 0) p.tiempo = seg * 1000;
  // Señal de uso para el panel (D-44): el suelto se cuenta como su propio juego; el laboratorio no
  // El caso cuenta también desde el laboratorio: es lo que se quiere medir (D-267)
  if ((!LABS || gameById(id)?.diario) && !PRUEBA) trackStart({ game: id, mode: HOY ? MODO_UNO_AL_DIA : 'solo', players: 1 });
  // Un juego `diario` sigue donde iba al recargar (D-267): las jugadas y el tiempo, por caso
  const guardado = gameById(id)?.diario && !HOY ? partidaGuardada(id, semilla) : null;
  jugarSinPuntaje(id, p, r => resultadoPractica(id, semilla, r, variante), { variante, ...(guardado ? { guardado } : {}) });
}

/**
 * El link al formulario de comentarios, al final de cada vista de un juego del laboratorio (D-268):
 * la antesala, la prueba y el juego; en el resultado el formulario ya va abierto al final. Durante la
 * cuenta del 3, 2, 1 no está (`pieComentario(null)`). Vive al final de la pantalla, debajo de las reglas.
 */
function pieComentario(extra) {
  const pantalla = $('#screen-jugar');
  let pie = document.getElementById('comentario-pie');
  if (!pie) { pie = el('div', { id: 'comentario-pie', class: 'center', style: 'padding:14px 0 6px' }); pantalla.append(pie); }
  pie.replaceChildren();
  // Solo en la página de un juego del laboratorio (/labs/case/); la práctica de /cup/?labs tiene su 🐞
  if (!LABS || !extra || !gameById(extra.juego)?.labs) return;
  pie.append(el('button', {
    class: 'link-btn reporte-btn', id: 'btn-comentario', type: 'button',
    onClick: () => {
      SFX.tap();
      abrirComentario({ T: TB(), enviar: enviarComentario(), contexto: { ...extra, url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160) } });
    },
  }, TB().abrir));
}

/** En el modo de prueba, el comentario queda en el almacén local, como los reportes; si no, va a Firebase. */
/** The form's texts: the inbox's, one wording for everything (D-345). */
const TB = () => (COMMON[LANG] || COMMON.es).buzon;
const enviarComentario = () => (PRUEBA ? async r => (await abrirStore()).reportar(r) : undefined);

/**
 * La partida de un juego `diario` en este celular (D-267): `{ jugadas, ms }` por juego y semilla, para
 * seguir donde iba al recargar. Si el almacenamiento está bloqueado, se juega igual sin guardar.
 */
function partidaGuardada(id, semilla) {
  const clave = `juegos-de-salon:diario:${id}:${semilla}`;
  let previa = null;
  try { previa = JSON.parse(localStorage.getItem(clave) || 'null'); } catch (_) { /* de cero */ }
  return {
    jugadas: Array.isArray(previa?.jugadas) && previa.jugadas.length ? previa.jugadas : undefined,
    ms: Number(previa?.ms) || 0,
    guardar(jugadas, ms) { try { localStorage.setItem(clave, JSON.stringify({ jugadas, ms })); } catch (_) { /* sin memoria */ } },
  };
}

/** "🧪 Prueba", con la palabra aparte: en la barra de la pantalla completa puede quedar solo el 🧪. */
const chipPrueba = () => {
  const [ico, ...txt] = T.trialChip.split(' ');
  return el('span', { class: 'chip chip--gold', title: T.trialChip }, ico, el('span', { class: 'chip-txt' }, ` ${txt.join(' ')}`));
};

/**
 * Juega un juego sin que cuente: la práctica del laboratorio y la sesión de prueba antes de
 * un día de la copa (D-103). Nada se guarda ni se envía; el reloj corre igual, para que se vea.
 */
async function jugarSinPuntaje(id, p, alTerminar, { ensayo = false, guardado = null, variante = null } = {}) {
  const J = conVariante(JUEGOS_COPA[id], variante), mod = JUEGOS[id];
  // Una partida a medias sigue sin la cuenta ni la entrada: el tablero ya se conoce (D-267)
  const sigue = !!guardado?.jugadas;
  pieComentario(null);   // durante la cuenta, nada más que la cuenta
  const espera = sigue ? 0 : await cuentaRegresiva(J);
  // Como en la copa: el reloj parte con la pantalla de juego a la vista, no con la cuenta
  let rel = { ...reloj.nuevo(Date.now() + espera + (sigue ? 0 : mod.entrada?.() || 0)), ms: guardado?.ms || 0 };
  const head = $('#jugar-head');
  head.innerHTML = '';
  poner(head, el('span', { class: 'jugar-titulo' }, conEmoji(J.emoji, J.nombre)), ensayo ? chipPrueba() : null);
  head.reloj = () => mmss(reloj.leer(rel, Date.now()));   // as in the cup (D-379, D-384)
  const cron = mostrarReloj(head, mod, () => reloj.leer(rel, Date.now()));
  S.visibilidad && document.removeEventListener('visibilitychange', S.visibilidad);
  let detenido = false;
  let leyendo = null;
  S.visibilidad = () => { if (!detenido) rel = document.hidden || leyendo ? reloj.pausar(rel, Date.now()) : reloj.seguir(rel, Date.now()); };
  document.addEventListener('visibilitychange', S.visibilidad);
  const body = $('#jugar-body');
  body.innerHTML = '';
  panelReglas(id, { copa: false, prueba: ensayo && !S.juego?.practica, variante });
  pantallaCompleta(mod.pantallaCompleta);
  mod.montar(body, {
    p, jugadas: guardado?.jugadas, T, fmt, el, SFX, vibrate, lang: LANG, pantallaCompleta,
    textoFin: ensayo ? T.trialEnd : undefined,
    // No cuenta para nada; solo un juego `diario` lo guarda en el celular, para seguir al recargar
    guardar(jugadas) { guardado?.guardar(jugadas, Math.round(reloj.leer(rel, Date.now()))); },
    tiempo: () => Math.round(reloj.leer(rel, Date.now())),
    pausa(ms) {
      if (detenido) return () => {};
      leyendo?.();
      leyendo = pausaDeLectura({ ms,
        pausar: () => { rel = reloj.pausar(rel, Date.now()); },
        seguir: () => { leyendo = null; if (!detenido && !document.hidden) rel = reloj.seguir(rel, Date.now()); },
        alCambiar: p => cron?.classList.toggle('en-pausa', p) });
      return leyendo;
    },
    pararReloj() {
      if (!detenido) { rel = reloj.pausar(rel, Date.now()); detenido = true; }
      pararMuestra(cron, () => reloj.leer(rel, Date.now()));
    },
    terminar(estado) {
      clearInterval(S.reloj);
      document.removeEventListener('visibilitychange', S.visibilidad);
      const r = mod.resultado(estado);
      alTerminar({ ...r, ms: r.ms ?? Math.round(reloj.leer(rel, Date.now())), det: detalle(id, estado, { T, fmt, mmss, copa: false, lang: LANG }) });
    },
  });
  pieComentario(S.juego?.practica ? { juego: id, semilla: S.juego.semilla, pantalla: ensayo ? 'prueba' : 'juego' } : null);
}

/** La sesión de prueba de un día: otro contenido, la misma mecánica, y de vuelta a Empezar. */
function ensayo(d) {
  const id = juegoDelDia(L().meta, d), variante = varianteDelDia(L().meta, d);
  mostrar('jugar');
  S.juego = { d, id, ensayo: true };
  jugarSinPuntaje(id, JUEGOS[id].ensayo(S.code, d, { lang: LANG, palabras: palabrasDe(L().meta), aud: audienciaDe(L().meta), variante, rondas: finalRounds(L().meta) }), r => resultadoEnsayo(id, r, () => antesDeJugar(d), variante), { ensayo: true, variante });
}

/** La sesión de prueba desde la práctica del laboratorio: la misma que antes de un día (D-109). */
function ensayoPractica(id, semilla, variante = null) {
  mostrar('jugar');
  S.juego = { d: 1, id, practica: true, ensayo: true, semilla, variante };
  jugarSinPuntaje(id, JUEGOS[id].ensayo(semilla, 1, { lang: LANG, variante }), r => resultadoEnsayo(id, r, () => practica(id, variante), variante), { ensayo: true, variante });
}

/** Fin de la sesión de prueba: cómo le fue, cómo se calcula, y de vuelta a la antesala. */
function resultadoEnsayo(id, r, volver, variante = null) {
  mostrar('resultado');
  SFX.reveal();
  const body = $('#resultado-body');
  body.innerHTML = '';
  poner(body,
    el('div', { class: 'result-hero' }, el('span', { class: 'trophy pop' }, '🧪'),
      el('h2', { class: 'display display--md' }, T.trialDoneTitle)),
    el('div', { class: 'aviso' }, fmt(T.trialDone, { resumen: r.resumen || r.s })),
    explicacion(conVariante(JUEGOS_COPA[id], variante), { s: r.s, ms: r.ms, det: r.det, copa: false }),
    el('button', { class: 'btn btn--yellow', id: 'btn-volver-ensayo', onClick: () => { SFX.tap(); volver(); } }, T.trialBack));
}

function resultadoPractica(id, semilla, r, variante = null) {
  const J = conVariante(JUEGOS_COPA[id], variante), rk = varianteRk(id, variante);
  // Uno al día: el primer intento queda como el resultado de hoy; los demás son práctica
  const hoy = HOY ? anotarUnoAlDia(S.hoy.fecha, { j: id, s: r.s, ms: r.ms }) : null;
  // Los rankings (D-212): se anota si hay jugador; si entra recién aquí, esta partida igual cuenta.
  // De Uno al día, solo el primer intento: después el tablero ya se conoce (D-230)
  const cuentaRk = rankea(id) && (!hoy || hoy.primera);
  // En Uno al día, el ranking que se ve es el de Uno al día (su tarjeta): el del juego no se muestra
  const ranking = cuentaRk && !hoy ? bloqueRanking({ juego: tablaRk(id, variante), titulo: tituloRk(J), pestanas: ['semana', 'siempre', 'amigos'], alTocar: () => SFX.tap() }) : null;
  const aviso = el('div', {});
  let anotada = false;
  const anotar = () => {
    if (!cuentaRk || anotada || !leerYo()) return;
    anotada = true;
    aviso.replaceChildren(avisoPartida({ juego: id, variante: rk, s: r.s, ms: r.ms, alAnotar: () => ranking?.recargar() }));
  };
  if (cuentaRk) {
    // Plegado: los botones del final tienen que verse sin desplazar (C-8)
    // En Uno al día, entrar ya lo ofrece su tarjeta (con la racha): no se ofrece dos veces
    if (leerYo()) anotar(); else if (!hoy) aviso.append(bloqueJugador({ destacado: true, alTocar: () => SFX.tap() }));
    jugador().then(Jg => { const off = Jg.escuchar(() => { if (S.pantalla !== 'resultado') { off(); return; } anotar(); }); }).catch(() => {});
  }
  // How it went, for the panel (D-210); with the variant first when the game has one (D-331): "hard · 80/100 · 2:30"
  trackFinish({ detalle: `${variante ? `${variante} · ` : ''}${r.s}/100${r.ms ? ` · ${mmss(r.ms)}` : ''}` });
  mostrar('resultado');
  SFX.win();
  // Un juego `diario` (D-267): "otra" es otro caso al azar, y si no era el de hoy, se ofrece el de hoy
  const diario = !!gameById(id)?.diario && !hoy;
  const otra = diario ? paginaSuelta(id, { semilla: codigoAlAzar() })
    : SUELTO ? paginaSuelta(id) : `${location.pathname}?practice=${slugDe(id)}${PRUEBA ? '&test' : ''}${LABS ? '&labs' : ''}`;
  const deHoy = diario && semilla !== semillaDel(fechaLocal());
  const enLab = LABS && !!gameById(id)?.labs;
  const body = $('#resultado-body');
  body.innerHTML = '';
  poner(body,
    el('div', { class: 'result-hero' },
      el('span', { class: con('trophy pop', J.emoji) }, J.emoji),
      el('h2', { class: 'display display--md' }, J.nombre),
      el('p', { class: 'muted', style: 'margin:0' }, T.yourScore),
      el('div', { class: 'score-big' }, r.resumen || String(r.s)),
      ...bajoElPuntaje(r.t, r.ms, id)),
    // Uno al día: la racha, compartir sin decir el juego, jugar otro o ver todo (D-230)
    hoy ? tarjetaResultado({ lang: LANG, fecha: S.hoy.fecha, primera: hoy.primera, dia: hoy.dia, raiz: RAIZ, alTocar: () => SFX.tap(), mmss }) : null,
    aviso,
    // Suelto se comparte como cualquier juego jugado solo, con su página (D-162, D-165)
    // El de un juego `diario` lleva su semilla: quien lo recibe juega el mismo caso, también mañana
    (!LABS || diario) && !hoy && gameById(id)?.suelto ? botonResultadoSolo({ C: COMMON[LANG] || COMMON.es, emoji: J.emoji, juego: J.varianteNombre ? `${J.nombre} · ${J.varianteNombre}` : J.nombre, puntaje: r.resumen || String(r.s), tiempo: mmss(r.ms), tarjeta: r.t, url: withLang(`${SITIO}${gameById(id).path}${[diario && `seed=${semilla}`, rk && `mode=${rk}`].filter(Boolean).join('&').replace(/^./, c => `?${c}`)}`, LANG), alTocar: () => SFX.tap() }) : null,
    hoy ? null : el('a', { class: 'btn btn--yellow', id: 'btn-otra', href: otra }, diario ? T.casoOtro : T.practiceAgain),
    deHoy ? el('a', { class: 'btn btn--ghost btn--sm', id: 'btn-de-hoy', href: paginaSuelta(id) }, `📅 ${T.casoDeHoy}`) : null,
    LABS && !hoy && !diario ? el('a', { class: 'btn btn--cyan btn--sm', id: 'btn-repetir', href: `${otra}${otra.includes('?') ? '&' : '?'}seed=${semilla}` }, T.practiceSame) : null,
    // One a Day's exits are in its card (C-19); the rest go back to the menu (or the lab), before 🐞
    hoy ? null : volverDePractica(),
    // The long detail, folded, after the actions and the exits (C-19)
    explicacion(J, { s: r.s, ms: r.ms, det: r.det, copa: false }),
    // El de un juego `diario` no: su semilla ya va en el link de compartir y en el comentario
    LABS && !hoy && !diario ? el('p', { class: 'muted center' }, fmt(T.practiceSeed, { semilla })) : null,
    ranking,
    enLab ? null : botonReporte({ juego: id, semilla, puntaje: r.s, resumen: r.resumen }),
    // En la página de un juego del laboratorio, el comentario va abierto y al final de todo (D-265, D-268)
    enLab ? formularioComentario({ T: TB(), enviar: enviarComentario(), contexto: {
      juego: id, semilla, puntaje: r.s, resumen: r.resumen, tiempo: mmss(r.ms), url: location.pathname + location.search,
      pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
    } }) : null);
  // Outside the lab, the quiet inbox link after everything (D-345): minigames and One a Day
  if (!enLab) ponerBuzon(body, { juego: id, contexto: { semilla, resumen: r.resumen ?? r.s, ...(hoy ? { dia: hoy.dia } : {}) } });
}

/* ------------------------------------------------------------------ */
/* Reportar un problema o dejar un comentario (LIG-42)                 */
/* ------------------------------------------------------------------ */

/**
 * El nombre de quien reporta queda en este dispositivo (no en la cuenta: en el laboratorio no la
 * hay), para no escribirlo en cada reporte. Si el almacenamiento está bloqueado, no pasa nada.
 */
const NOMBRE_REPORTE = 'juegos-de-salon:copa:reporte-nombre';
const nombreReporte = {
  leer() { try { return localStorage.getItem(NOMBRE_REPORTE) || ''; } catch (_) { return ''; } },
  guardar(n) { try { if (n) localStorage.setItem(NOMBRE_REPORTE, n); else localStorage.removeItem(NOMBRE_REPORTE); } catch (_) { /* nada */ } },
};

/** El botón que lleva al formulario, con lo que se sabe de dónde se apretó. */
function botonReporte(extra = {}) {
  return el('button', { class: 'link-btn reporte-btn', id: 'btn-reporte', onClick: () => { SFX.tap(); reportar(extra); } }, T.reportButton);
}

/**
 * El país de este celular en dos letras (`CL`), del huso horario y si no del idioma, igual que
 * el de las salas (D-79). Va al inscribirse y en los reportes, para que el panel del dueño sepa
 * dónde se juega (D-207). Si no se sabe, vacío: mejor sin bandera que con una inventada.
 */
function miPais() {
  try { return countryOf({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone, lang: navigator.language }); } catch (_) { return ''; }
}

/**
 * Quien se inscribió antes de que la copa guardara el país (D-207) lo anota la próxima vez que
 * abre su copa, una sola vez y sin esperar: el panel del dueño pone la bandera junto a cada
 * nombre (D-209). Si no se sabe o falla, nada: quien juega no se entera.
 */
let paisAnotado = false;
function anotarPais(Lc) {
  if (paisAnotado || !S.yo || Lc.players?.[S.yo]?.co) return;
  paisAnotado = true;
  const co = miPais();
  if (co) store.ponerPais?.(S.code, S.yo, co).catch(() => { /* mejor esfuerzo */ });
}

/**
 * El formulario va en su propia pantalla y vuelve a la que se estaba mirando. Además del
 * texto se manda el contexto (copa, día, pantalla, versión y navegador), sin mostrarlo: es para
 * el dueño (D-306). Nunca el PIN ni lo que se está jugando.
 */
function reportar(extra = {}) {
  const volverA = S.pantalla;
  const contexto = {
    // El país va arriba: el contexto se corta a 500 letras y lo de abajo es lo que se pierde
    copa: S.code || null, jugador: S.yo ? nombreDe(S.yo) : null, pais: miPais() || null, pantalla: volverA,
    dia: S.verDia || S.juego?.d || null, ...extra,
    url: location.pathname + location.search, navegador: navigator.userAgent.slice(0, 160),
  };
  const volver = () => {
    if (volverA === 'tablero') tablero();
    else if (volverA === 'resultado' && S.verDia) resultado(S.verDia);
    else mostrar(volverA || 'intro');
  };
  mostrar('reporte');
  const body = $('#reporte-body');
  body.innerHTML = '';
  const err = el('div', { class: 'form-error', role: 'alert' });
  const texto = el('textarea', { class: 'reporte-texto', maxlength: '1000', rows: '3', placeholder: T.reportPlaceholder, 'aria-label': T.reportTitle });
  const nombre = el('input', { class: 'mini', id: 'reporte-nombre', maxlength: '40', autocomplete: 'given-name', placeholder: T.reportNamePh, value: nombreReporte.leer() || contexto.jugador || cuenta.nombre.get() || '', 'aria-label': T.reportNamePh });
  const correo = campoCorreo({}, 'reporte-correo');
  const enviarBtn = el('button', { class: 'btn btn--yellow', id: 'btn-enviar-reporte' }, T.reportSend);
  enviarBtn.addEventListener('click', async () => {
    const t = texto.value.trim();
    if (!t) { avisoError(err, T.reportEmpty); return; }
    const c = correo.valor();
    if (c === null) { avisoError(err, correo.malo); correo.input.focus(); return; }
    nombreReporte.guardar(nombre.value.trim().slice(0, 40));
    enviarBtn.disabled = true; enviarBtn.textContent = T.sending2;
    try {
      // Sin cuenta (D-104): en la práctica no se abre el almacén ni su sesión anónima
      const reportar = PRUEBA ? (await abrirStore()).reportar : (await import('./reportes.js')).enviarReporte;
      await reportar({
        texto: t.slice(0, 1000), nombre: nombre.value.trim().slice(0, 40), ...(c ? { correo: c } : {}),
        contexto: JSON.stringify(contexto).slice(0, 500),
        v: versionOf(document.getElementById('importmap')?.textContent || '') || 'dev',
      });
      body.innerHTML = '';
      SFX.reveal();
      poner(body, el('div', { class: 'aviso bien' }, T.reportThanks),
        el('button', { class: 'btn btn--yellow', id: 'btn-reporte-volver', onClick: () => { SFX.tap(); volver(); } }, T.reportBack));
    } catch (e) {
      // No se pudo enviar, pero quedó en el dispositivo y se reenvía solo (D-109)
      if (e?.guardado) {
        body.innerHTML = '';
        poner(body, el('div', { class: 'aviso' }, T.reportQueued),
          el('button', { class: 'btn btn--yellow', id: 'btn-reporte-volver', onClick: () => { SFX.tap(); volver(); } }, T.reportBack));
        return;
      }
      avisoError(err, errorDe(e));
      enviarBtn.disabled = false; enviarBtn.textContent = T.reportSend;
    }
  });
  poner(body,
    el('h2', { class: 'display display--md center' }, T.reportTitle),
    el('p', { class: 'muted' }, T.reportLead),
    el('div', { class: 'panel stack' }, texto,
      el('label', { class: 'lead', for: 'reporte-nombre', style: 'margin:0' }, T.reportNameLabel), nombre,
      el('p', { class: 'muted', style: 'margin:0' }, T.reportNameKeep), correo.input, correo.nota),
    err, enviarBtn,
    el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { SFX.tap(); volver(); } }, T.reportCancel));
  texto.focus();
}

/* ------------------------------------------------------------------ */
/* Inicio                                                              */
/* ------------------------------------------------------------------ */

sparkles();
initSound();
applyStatic(T);
document.documentElement.lang = LANG;
document.title = `${T.title} 🏆 · ${(COMMON[LANG] || COMMON.es).appTitle}`;
$('#sound-slot').append(soundToggle());
// Desde el laboratorio (?labs), "volver" es volver ahí; si no, al menú (D-175)
if (LABS) {
  $('#btn-menu').setAttribute('href', `${RAIZ}labs/`);
  $('#btn-menu').textContent = T.backToLabsShort;
}
// In a day's cover (before playing), the top-left button goes back to the cup's board, not to
// the app's menu: it replaces the "Back to the cup" button that closed the screen
$('#btn-menu').addEventListener('click', ev => {
  if (S.pantalla !== 'jugar' || !S.antesala) return;
  ev.preventDefault();
  SFX.tap();
  tablero();
});
// Los reportes que no alcanzaron a enviarse se reintentan al abrir (D-109). En el modo de prueba
// no hay barra para adelantar el reloj (D-112): las demos y los guiones lo hacen por su cuenta.
if (!PRUEBA) import('./reportes.js').then(m => m.reenviarPendientes()).catch(() => { /* la próxima vez */ });

// Gancho de solo lectura para las pruebas (C-14)
window.__copa = {
  get estado() { return { pantalla: S.pantalla, code: S.code, yo: S.yo, copa: S.L ? JSON.parse(JSON.stringify(S.L)) : null, juego: S.juego }; },
  get store() { return store; },
  prueba: PRUEBA,
};

/** Abrir una copa por su link propio (?pirata, D-121). La URL se queda como está. */
async function abrirPorAlias(a) {
  espera('…');
  try {
    const st = await abrirStore(); await st.listo();
    const x = await st.alias(a);
    if (!x?.code) { espera(fmt(T.errNoAlias, { a }), { error: true }); return; }
    await abrirCopa(x.code);
  } catch (e) { espera(errorDe(e), { error: true, reintentar: () => location.reload() }); }
}

/** Una demo: siembra la escena, deja la sesión de quien mira y la abre. */
async function demo(nombre) {
  const st = await abrirStore();
  await st.listo();
  st.reiniciarReloj();
  const { sembrar } = await import('./demo.js');
  const e = sembrar(nombre, { now: st.now(), uid: st.uid });
  if (!e) { portada(); return; }
  if (e.pid) cuenta.recordar(e.code, e.pid, { nombre: e.nombre, copa: e.meta.name, fin: e.meta.end });
  history.replaceState(null, '', `${location.pathname}?test&${e.code}`);
  await abrirCopa(e.code, { recienCreada: e.recien, pantalla: e.pantalla });
}

if (SUELTO) practica(PRACTICA);
else if (PRACTICA) { if (LABS) practica(PRACTICA); }
else if (DEMO) demo(DEMO);
else if (codigoUrl && esCodigo(codigoUrl)) abrirCopa(codigoUrl);
else if (aliasUrl) abrirPorAlias(aliasUrl);
else portada();

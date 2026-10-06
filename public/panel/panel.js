/**
 * Panel del dueño (D-44, D-207): entra con Google, lee las salas vivas, `stats/<env>/days` y las
 * copas de `torneos/`, y dibuja lo que arman `aggregate.js` y `copas.js`.
 *
 * Se navega como un sitio (D-207): cuatro secciones —Ahora, La Copa, Juegos y Audiencia— y una
 * ficha por cada cosa que existe (una copa, un juego, una sala). Toda vista queda en el `#` de la
 * URL (`rutas.js`), así que Atrás, una recarga o un enlace guardado vuelven al mismo lugar. Las
 * horas son las del Pacífico, las mismas con que La Copa parte sus días. Solo en español: no es
 * una pantalla de jugador (excepción a C-3, anotada en docs/PANEL.md).
 *
 * Nada de acá escribe en la base. Las reglas solo dejan leer al UID del dueño; si la
 * cuenta que entra no es esa, la página lo dice y muestra el UID para ponerlo en las reglas.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  getDatabase, ref, onValue, query, orderByChild, orderByKey, startAt,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { GAMES, SUELTOS, gameById, gameLabel as etiquetaRegistro, isTorneo, MODES, MODE_IDS, ROOM_MODE, modeIcon } from '../assets/js/games.js';
import { JUEGOS_COPA } from '../cup/rules.js';
import { LANGS } from '../assets/js/i18n.js';
import { ENVS } from '../assets/js/transport/stats.js';
import { $, el } from '../assets/js/ui.js';
import { copaDe, copasEnCurso, resumenCopas, bitacoraCopas, fichaCopa, buscarCopa, paisDe, pct, duracion, inicioLabel } from './copas.js';
import {
  ROOM_TTL, liveRooms, connections, summarize, top, tzLabel, ago, dayOf, codesOfDays, splitByEnv, liveLocal, roomLog,
  paginate, flagOf, whenLabel, horaLabel, fechaLabel, diaPanel, ZONA_PANEL, ZONA_NOMBRE, RANGOS, RANGO_POR_DEFECTO, rangeOf,
  groupDays, localLog, paisesDeSalas, paisesDelRango, salaDe, mediana, idiomasDeSalas, idiomasDelRango, trafico, origenesAgrupados, origenLabel, dayLabel,
  avisosDelRango, AVISO_TIPOS, vueltaAtrasada, unoAlDiaDelRango,
} from './aggregate.js';
import { SECCIONES, leerRuta, rutaA, seccionDe } from './rutas.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/** El torneo del registro (La Copa): su nombre y su emoji salen de `games.js`, no de acá (C-16). */
const TORNEO = GAMES.find(g => g.torneo) || null;
const ENV_DEFECTO = ENVS[0];

const S = {
  user: null, env: ENV_DEFECTO, range: RANGO_POR_DEFECTO, ruta: leerRuta(location.hash),
  rooms: {}, days: {}, daysLoaded: false, torneos: {}, torneosLoaded: false, push: null,
  // Uno al día (D-230): la historia de quienes entraron con jugador, las invitaciones y las rachas
  uad: { historia: {}, invitados: {}, rachas: {} },
  unsubRooms: null, unsubDays: null, unsubTorneos: null, unsubPush: null, unsubUad: [], tick: null,
  // Desde qué día está bajado `days`: un rango más largo obliga a pedir de nuevo, uno más corto no
  desdeDia: null,
  // Lo que se eligió dentro de una vista. No va en la URL: es de esta visita, no del lugar.
  logPage: 1, logSolas: false, filtroAhora: 'todo', filtroCopas: 'todas', fichaTab: 'tabla', sinRedTodas: false,
};
if (S.ruta.r && RANGOS.some(r => r.id === S.ruta.r)) S.range = S.ruta.r;
if (S.ruta.e) S.env = S.ruta.e;

const POR_PAGINA = 20;
const SIN_RED_VISIBLES = 20;

/* ------------------------------------------------------------------ */
/* Entrar                                                              */
/* ------------------------------------------------------------------ */
function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }

/**
 * Las fallas de la primera vez tienen una causa única y se pueden nombrar; lo demás sale
 * con su código de Firebase, que es lo que permite diagnosticar lo inesperado (canon C-14).
 * Son ajustes que se hacen una sola vez y no le cambian nada a quienes juegan.
 */
const LOGIN_ERRORES = {
  'auth/operation-not-allowed': 'Falta habilitar el acceso con Google en la consola de Firebase, en Authentication y luego Sign-in method. Se hace una sola vez.',
  'auth/unauthorized-domain': 'Este dominio no está en la lista de Authorized domains del proyecto, en Authentication y luego Settings. Hay que agregarlo una sola vez.',
  'auth/network-request-failed': 'No se pudo hablar con Firebase. Puede ser tu internet o que el servicio esté con problemas. Intenta nuevamente en unos minutos.',
};

async function login() {
  const provider = new GoogleAuthProvider();
  // Siempre preguntar con qué cuenta: sin esto Google usa la sesión que ya esté abierta y
  // entra sin avisar. Acá importa más que en otras partes, porque el panel es de una cuenta
  // concreta y entrar con la equivocada no se ve: muestra un UID válido, pero el de otra.
  provider.setCustomParameters({ prompt: 'select_account' });
  try { await signInWithPopup(auth, provider); }
  catch (e) {
    // En algunos celulares la ventana emergente no abre: se va y se vuelve.
    if (/popup/.test(e?.code || '')) { await signInWithRedirect(auth, provider); return; }
    const code = e?.code || '';
    $('#login-msg').textContent = LOGIN_ERRORES[code] || `No se pudo entrar (${code || e?.message || 'error'}).`;
  }
}

function renderUser() {
  const slot = $('#user-slot'); slot.innerHTML = '';
  if (!S.user) return;
  slot.append(el('span', { class: 'user' },
    S.user.photoURL ? el('img', { src: S.user.photoURL, alt: '', referrerpolicy: 'no-referrer' }) : null,
    el('button', { onClick: () => signOut(auth) }, 'Salir'),
  ));
}

onAuthStateChanged(auth, user => {
  S.user = user;
  renderUser();
  if (!user) { stopListening(); showScreen('screen-login'); $('#uid-help').hidden = true; return; }
  $('#uid').textContent = user.uid;
  showScreen('screen-panel');
  listen();
});

/* ------------------------------------------------------------------ */
/* Lecturas en vivo                                                    */
/* ------------------------------------------------------------------ */
function denied(e) {
  if (!/permission|denied/i.test(e?.message || e?.code || '')) { console.error(e); return; }
  stopListening();
  showScreen('screen-login');
  $('#login-msg').textContent = 'Entraste, pero esta cuenta no puede leer el panel.';
  $('#uid-help').hidden = false;
}

function stopListening() {
  if (S.unsubRooms) { S.unsubRooms(); S.unsubRooms = null; }
  if (S.unsubDays) { S.unsubDays(); S.unsubDays = null; }
  if (S.unsubTorneos) { S.unsubTorneos(); S.unsubTorneos = null; }
  if (S.unsubPush) { S.unsubPush(); S.unsubPush = null; }
  for (const f of S.unsubUad) f();
  S.unsubUad = [];
  if (S.tick) { clearInterval(S.tick); S.tick = null; }
}

function listen() {
  stopListening();
  // Se bajan las salas de las últimas 6 horas —el tope duro, que es lo que el índice por
  // createdAt sabe filtrar— y `liveRooms` descarta después las que llevan media hora sin latir
  // (D-89). Cada jugada llega como delta.
  const since = Date.now() - ROOM_TTL;
  S.unsubRooms = onValue(query(ref(db, 'rooms'), orderByChild('createdAt'), startAt(since)), snap => { S.rooms = snap.val() || {}; render(); }, denied);
  // Se baja solo hasta donde llega el rango elegido y nunca menos de lo que ya estaba bajado
  // (D-80): mirar un año son 365 días de registros, y no hay por qué pagarlos mientras se
  // mira la semana. Cambiar a un rango más corto no vuelve a pedir nada.
  const desde = Math.min(rangeOf(S.range).from, S.desdeDia ?? Infinity);
  S.desdeDia = desde;
  S.unsubDays = onValue(query(ref(db, `stats/${S.env}/days`), orderByKey(), startAt(String(desde))), snap => { S.days = snap.val() || {}; S.daysLoaded = true; render(); }, denied);
  // Las copas se bajan enteras: son pocas y cada una es chica. Cada resultado llega como delta,
  // así que "jugando ahora" y la tabla se mueven solos.
  S.unsubTorneos = onValue(ref(db, 'torneos'), snap => { S.torneos = snap.val() || {}; S.torneosLoaded = true; render(); }, denied);
  // Lo que deja avisar.mjs en cada vuelta: la hora y las suscripciones vivas (D-233)
  S.unsubPush = onValue(ref(db, `stats/${S.env}/push`), snap => { S.push = snap.val() || {}; render(); }, denied);
  // Uno al día (D-230): son de todos los entornos (la historia vive fuera de stats/). Sin permiso
  // (reglas viejas), queda vacío y el resto del panel sigue
  for (const [clave, ruta] of [['historia', 'unoAlDia'], ['invitados', 'invitados'], ['rachas', 'records/uno-al-dia-racha/siempre']]) {
    S.unsubUad.push(onValue(ref(db, ruta), snap => { S.uad = { ...S.uad, [clave]: snap.val() || {} }; render(); }, () => {}));
  }
  S.tick = setInterval(render, 30000); // "hace 3 min" se actualiza solo
}

/* ------------------------------------------------------------------ */
/* Nombres y colores                                                   */
/* ------------------------------------------------------------------ */
/**
 * Nada de listas copiadas acá (C-16). Los juegos, los modos y su ícono salen de `games.js`;
 * los entornos, de `transport/stats.js`; los idiomas, de `i18n.js`. Lo que no está en ninguna
 * de esas listas igual se dibuja, con su clave cruda por nombre: puede ser un juego, un modo
 * o un idioma que el código ya manda y esta página todavía no conoce.
 */
const ENV_VIEJOS = { lab: 'Laboratorio' };            // salió con el laboratorio (D-67)
const ENV_NOMBRE = { prod: 'Publicado', dev: 'Pruebas locales', ...ENV_VIEJOS };
const envLabel = env => ENV_NOMBRE[env] || env;
const ENV_OPCIONES = [...ENVS, ...Object.keys(ENV_VIEJOS).filter(e => !ENVS.includes(e))];

/**
 * Un idioma con su nombre en español. Se lo pregunta al navegador en vez de mantener una
 * tabla: un idioma nuevo en `i18n.js` aparece nombrado sin tocar el panel.
 */
const nombreDeIdioma = (() => {
  let dn = null;
  try { dn = new Intl.DisplayNames(['es'], { type: 'language' }); } catch (_) { /* nada */ }
  return code => {
    if (code === 'desconocido') return 'Sin idioma';
    let nombre = '';
    try { nombre = dn?.of(code) || ''; } catch (_) { /* clave rara: se muestra tal cual */ }
    if (!nombre || nombre === code) return code;
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  };
})();

/** Un país con su nombre en español, también preguntado al navegador. */
const nombreDePais = (() => {
  let dn = null;
  try { dn = new Intl.DisplayNames(['es'], { type: 'region' }); } catch (_) { /* nada */ }
  return co => { if (!co || co === 'desconocido') return 'Sin país conocido'; try { return dn?.of(co) || co; } catch (_) { return co; } };
})();

/**
 * Colores de las barras, en el orden de los modos. Se reparten por posición y no por nombre:
 * un modo nuevo toma el siguiente color en vez de quedar sin uno (C-16).
 */
const PALETA = ['var(--cyan)', 'var(--yellow)', 'var(--pink)', 'var(--lime)', 'var(--purple)'];
let MODOS = [...MODE_IDS];   // los conocidos, más los que traiga la base (lo pone la vista de juegos)
const modeColor = mode => PALETA[Math.max(0, MODOS.indexOf(mode)) % PALETA.length];

/** Colores de las barras que no son de modo: el total, lo que se juega sin red y los idiomas. */
const C_TOTAL = 'var(--cyan)', C_SIN_RED = 'var(--yellow)', C_IDIOMA = 'var(--lime)', C_TORNEO = 'var(--pink)';

/** Un juego de la copa con su emoji y su nombre, del registro de la copa; uno que no está, por su clave. */
const miniLabel = id => (JUEGOS_COPA[id] ? `${JUEGOS_COPA[id].emoji} ${JUEGOS_COPA[id].nombre}` : String(id || '?'));
const miniEmoji = id => JUEGOS_COPA[id]?.emoji || '·';
const esJuego = id => !isTorneo(id);
const torneoNombre = TORNEO ? TORNEO.name.es : 'el torneo';
const torneoLabel = TORNEO ? gameLabel(TORNEO.id) : '🏆 Torneo';

/**
 * El nombre de un juego con su emoji. Un juego de La Copa jugado suelto (Conexiones, Toque y Fama:
 * Palabra…) manda su id de la copa; está en el registro de sueltos o en el de la copa, no en el de
 * juegos, y antes salía con su clave cruda (`letras`). Uno que no está en ninguno, por su id (C-16).
 */
function gameLabel(id) {
  if (gameById(id)) return etiquetaRegistro(id);
  const s = SUELTOS.find(x => x.id === id);
  if (s) return `${s.emoji} ${s.name.es}`;
  if (JUEGOS_COPA[id]) return miniLabel(id);
  return etiquetaRegistro(id);
}
const nombreJuego = id => gameLabel(id).replace(/^\S+\s/, '');
const emojiJuego = id => (gameLabel(id) !== id ? gameLabel(id).split(' ')[0] : '🎲');

/** Idiomas conocidos primero, en el orden de la app; detrás, lo que haya llegado. */
const ordenIdiomas = pares => [
  ...LANGS.map(l => pares.find(([k]) => k === l)).filter(Boolean),
  ...pares.filter(([k]) => !LANGS.includes(k)),
];

const n = v => Number(v || 0).toLocaleString('es-CL');
/**
 * Lo que pasó en una sala, con nombre completo (D-138): las jugadas de las personas por un lado
 * y el chat por otro. "176 msjs" se leía como conversación y eran disparos.
 */
const jugadasDe = k => (k === 0 ? 'Sin jugadas todavía' : k === 1 ? '1 jugada' : `${n(k)} jugadas`);
const chatDe = k => (k === 0 ? 'Sin chat' : k === 1 ? '1 mensaje de chat' : `${n(k)} mensajes de chat`);
const minutos = ms => { const m = Math.round(ms / 60000); return m < 1 ? 'menos de 1 min' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */
/** La dirección de una vista, conservando el rango y el entorno elegidos. */
const ir = (sec, args = []) => rutaA(sec, args, { r: S.range, e: S.env, rDefecto: RANGO_POR_DEFECTO, eDefecto: ENV_DEFECTO });
const enlace = (sec, args, attrs, ...hijos) => el('a', { href: ir(sec, args), ...attrs }, ...hijos);

/** La bandera de un país, con su nombre al pasar el dedo. Sin país conocido no va nada: un hueco es mejor que inventar uno. */
const bandera = co => (co ? el('span', { class: 'flag', title: nombreDePais(co) }, ` ${flagOf(co)}`) : null);

/** Un nombre con la bandera de su país (D-207): saber dónde se juega es lo que pidió el dueño. */
const quien = (name, co) => el('span', { class: 'quien' }, name, bandera(co));

/**
 * El idioma en que se jugó, como etiqueta corta (`ES`) con su nombre al pasar el dedo (D-211).
 * Una lista se dice una vez cada uno; sin idioma conocido (lo de antes) no va nada.
 */
const idiomaTag = langs => {
  const ls = [...new Set((Array.isArray(langs) ? langs : [langs]).filter(Boolean))];
  return ls.length ? el('span', { class: 'idioma', title: `Se jugó en ${ls.map(nombreDeIdioma).join(' y ')}` }, ls.map(l => l.toUpperCase()).join(' · ')) : null;
};

/** Una cifra. Si lleva `href` u `onClick`, se abre en la lista que la suma: toda cifra se puede revisar. */
function tile(value, label, { hot = false, href = null, onClick = null, pressed = null, info = '' } = {}) {
  const hijos = [el('b', {}, typeof value === 'string' ? value : n(value)), el('small', {}, label), info ? el('span', { class: 'i' }, info) : null];
  const cls = `tile${hot ? ' tile--hot' : ''}${href || onClick ? ' tile--link' : ''}`;
  if (href) return el('a', { class: cls, href }, ...hijos);
  if (onClick) return el('button', { type: 'button', class: cls, onClick, 'aria-pressed': pressed === null ? null : String(pressed) }, ...hijos);
  return el('div', { class: cls }, ...hijos);
}

/**
 * Una barra con sus segmentos y el total. Cada segmento trae su color ya resuelto: los de
 * modo salen de `segModo`, que lo saca del registro, y los demás de un color fijo. Así
 * ningún nombre de modo queda escrito acá (C-16).
 */
function bar(label, segments, max, { note = '', sub = '', detail = '', cifra = null, href = null } = {}) {
  // La cifra de la derecha es la suma de los segmentos, salvo que la barra diga otra: en los
  // juegos de la copa, el gris de los que quedaron sin terminar se dibuja pero no se cuenta como jugado.
  const total = cifra ?? segments.reduce((s, x) => s + x.value, 0);
  const track = el('div', { class: 'track' });
  for (const x of segments) if (x.value > 0) track.append(el('div', { class: 'fill', style: `width:${max ? (x.value / max) * 100 : 0}%;background:${x.color}`, title: `${x.title || ''} ${n(x.value)}`.trim() }));
  return el(href ? 'a' : 'div', { class: `bar${href ? ' bar--link' : ''}`, href },
    el('span', { class: 'label', title: sub ? `${label} · ${sub}` : label }, label, sub ? el('small', {}, sub) : null),
    track, el('span', { class: 'n' }, n(total), note ? el('span', { class: 'modes' }, ` ${note}`) : null),
    detail ? el('span', { class: 'detail' }, detail) : null);
}

/** Un segmento de un modo (color e ícono del registro) y uno de color fijo. */
const segModo = (mode, value) => ({ color: modeColor(mode), value, title: modeIcon(mode) });
const seg = (color, value) => ({ color, value });

function lista(rows, emptyText = 'Nada todavía.', cls = 'rooms') {
  return rows.length ? el('div', { class: cls }, ...rows) : el('p', { class: 'empty' }, emptyText);
}

/** Un bloque con título y, si hace falta, una nota que dice qué cuenta. */
const bloque = (titulo, nota, ...hijos) => el('div', { class: 'panel' },
  el('p', { class: 'lead' }, titulo), nota ? el('p', { class: 'muted small' }, nota) : null, ...hijos);

/** Botones de filtro: uno marcado. Cada uno de 44 px como mínimo (C-8). */
const filtros = (opciones, actual, elegir, label) => el('div', { class: 'chips', role: 'group', 'aria-label': label },
  ...opciones.map(([v, l]) => el('button', { type: 'button', 'aria-pressed': String(v === actual), onClick: () => elegir(v) }, l)));

/** El título de una sección, y debajo una línea que dice de cuándo es lo que se ve. */
const titulo = (texto, nota) => [el('h2', { class: 'display display--md' }, texto), nota ? el('p', { class: 'muted small' }, nota) : null];

/** Las migas de una ficha: de dónde se llegó, para volver. */
const migas = (...pasos) => el('nav', { class: 'migas', 'aria-label': 'Estás en' },
  ...pasos.flatMap(([l, sec, args], i) => [i ? el('span', { 'aria-hidden': 'true' }, ' › ') : null, sec ? enlace(sec, args || [], {}, l) : el('span', {}, l)]));

/** Pares dato–valor de la cabecera de una ficha. */
const datos = pares => el('dl', { class: 'datos' }, ...pares.filter(Boolean).map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v ?? '—'))));

/** El título del rango, con "cargando" mientras falta algo: un año a medio bajar no es un año vacío (C-14). */
function tituloRango() {
  const rango = rangeOf(S.range);
  const falta = S.daysLoaded && S.desdeDia !== null && rango.from < S.desdeDia;
  return rango.titulo + (S.daysLoaded && !falta && S.torneosLoaded ? '' : ' · cargando…');
}

/** Las salas vivas del entorno mirado, con el país de cada jugador; y aparte las de otro entorno (D-45). */
function salasVivas(now) {
  const vivas = liveRooms(S.rooms, now, paisesDeSalas(S.days, now), idiomasDeSalas(S.days, now));
  return splitByEnv(vivas, codesOfDays(S.days, now), { loaded: S.daysLoaded });
}

/* ------------------------------------------------------------------ */
/* Filas                                                               */
/* ------------------------------------------------------------------ */
/** Una sala viva: se abre en su ficha. */
function filaSala(r, now) {
  return enlace('sala', [r.code], { class: `room${r.active ? ' active' : ''}` },
    el('div', {}, el('div', { class: 'code' }, r.code), el('div', { class: 'meta', style: 'text-align:left' }, gameLabel(r.game), ' ', idiomaTag(r.players.map(p => p.lang)))),
    el('div', { class: 'who' }, r.players.map(p => el('span', {}, el('i', { class: p.online ? 'on' : '' }), quien(p.name, p.co)))),
    el('div', { class: 'meta' }, jugadasDe(r.jugadas), el('br'), chatDe(r.chat), el('br'),
      r.lastPlayAt ? `última jugada ${ago(r.lastPlayAt, now)}` : `actividad ${ago(r.lastAt, now)}`, el('br'), `creada ${ago(r.createdAt, now)}`),
  );
}

/**
 * Una partida sin red que se está jugando (D-140): el juego, el modo con su nombre completo,
 * cuántos juegan en ese celular, de qué país es y, si la app lo sabe, quién juega (D-210).
 */
function filaSinRed(p, now) {
  const modo = MODES[p.mode] ? `${modeIcon(p.mode)} ${MODES[p.mode].label}` : p.mode;
  const cuantos = p.n === 1 ? '1 jugador' : `${n(p.n)} jugadores`;
  return enlace('juego', [p.game], { class: 'room active' },
    el('div', { class: 'code' }, emojiJuego(p.game)),
    el('div', { class: 'cuerpo' },
      el('div', { class: 'cname' }, nombreJuego(p.game)),
      // Quién juega, si la app lo sabe (D-210); si no, solo su bandera
      el('div', { class: 'who' }, el('span', {}, el('i', { class: 'on' }), p.name ? quien(p.name, p.co) : ['sin nombre', bandera(p.co)])),
      el('div', { class: 'sub' }, `${modo} · ${cuantos} `, idiomaTag(p.lang))),
    el('div', { class: 'meta' }, `empezó ${ago(p.at, now)}`, el('br'), `última señal ${ago(p.beat, now)}`),
  );
}

/**
 * Una copa en curso: en qué día va, qué juego toca, quién ya lo jugó (✓) y quién lo está
 * jugando en este momento (punto verde). Se abre en su ficha.
 */
function filaCopa(c, now) {
  const hoy = c.hoy;
  const enCurso = c.estado === 'en-curso';
  const cuando = enCurso ? `Día ${c.dia} de ${c.days}: ${miniLabel(hoy.juego)}` : `Empieza el ${inicioLabel(c.start)}, ${c.days} días`;
  const atrasados = c.jugando.filter(x => !hoy || x.dia !== hoy.dia);
  const gente = hoy
    ? hoy.jugadores.map(j => el('span', { class: j.jugo ? 'ok' : '', title: j.jugo ? 'Ya jugó el de hoy' : j.jugando ? 'Lo está jugando ahora' : 'Todavía no lo juega' },
      el('i', { class: j.jugando ? 'on' : '' }), quien(j.name, j.co), j.jugo ? ' ✓' : ''))
    : [el('span', {}, `${n(c.jugadores)} ${c.jugadores === 1 ? 'inscrito' : 'inscritos'}`)];
  return enlace('torneo', [c.code], { class: `room copa${c.jugando.length ? ' active' : ''}` },
    el('div', {}, el('div', { class: 'code' }, c.code), c.alias ? el('div', { class: 'meta', style: 'text-align:left' }, `/${c.alias}`) : null),
    el('div', { class: 'cuerpo' },
      el('div', { class: 'cname' }, c.name, ' ', idiomaTag(c.lang), c.lab ? el('span', { class: 'tag', title: 'Creada desde el laboratorio: su admin puede adelantar los días para probar' }, 'laboratorio') : null),
      el('div', { class: 'sub' }, cuando),
      el('div', { class: 'who' }, ...gente),
      atrasados.length ? el('div', { class: 'sub' }, 'Jugando ahora un día anterior: ', ...atrasados.flatMap((x, i) => [i ? ', ' : '', quien(x.name, x.co), ` (día ${x.dia}, ${miniLabel(x.juego)})`])) : null,
    ),
    el('div', { class: 'meta' },
      hoy ? `jugaron ${hoy.jugaron} de ${hoy.jugadores.length}` : (c.inscripcion ? 'inscripción abierta' : 'inscripción cerrada'), el('br'),
      c.ultimo ? `último resultado ${ago(c.ultimo, now)}` : 'sin resultados', el('br'),
      c.primero ? ['va primero ', quien(c.primero.name, c.primero.co), `${c.primero.empatados > 1 ? ` y ${c.primero.empatados - 1} más` : ''} (${n(c.primero.total)})`] : '',
    ),
  );
}

const estadoTexto = c => (c.estado === 'terminada' ? (c.fin ? 'terminada antes' : 'terminada') : c.estado === 'por-empezar' ? 'por empezar' : `día ${c.dia} de ${c.days}`);

/** Una copa del rango en la lista de La Copa: cuándo, cuánta gente, cuánto se jugó y quién gana. */
function filaCopaLog(c) {
  const p = pct(c.participacion);
  const otros = c.primero?.empatados > 1 ? ` y ${c.primero.empatados - 1} más` : '';
  const quienVa = !c.primero ? el('span', { class: 'none' }, '—')
    : c.estado === 'terminada' ? el('span', { class: 'won' }, '🏆 ', quien(c.primero.name, c.primero.co), otros)
      : el('span', { class: 'va', title: 'Va primero en la tabla' }, '▲ ', quien(c.primero.name, c.primero.co), otros);
  return enlace('torneo', [c.code], { class: 'log-row' },
    el('div', { class: 'when' }, inicioLabel(c.start), el('br'), el('span', { class: 'code' }, c.code)),
    el('div', { class: 'game' }, c.name, ' ', idiomaTag(c.lang), c.lab ? el('span', { class: 'tag' }, 'laboratorio') : null),
    el('div', { class: 'who' },
      el('span', { class: 'q' }, estadoTexto(c)),
      el('span', { class: 'q' }, `${n(c.jugadores)} ${c.jugadores === 1 ? 'jugador' : 'jugadores'}`),
      el('span', { class: 'q', title: 'Juegos jugados de los que se podían jugar, en los días que ya cerraron' }, p === null ? 'sin días cerrados' : `participación ${p}%`),
    ),
    el('div', { class: 'win' }, quienVa),
  );
}

/** Una sala jugada en la bitácora (D-79): cuándo, quiénes con su bandera, qué juego y quién ganó. */
function filaSalaLog(f) {
  const ganador = f.winner ? el('span', { class: 'won' }, '🏆 ', quien(f.winnerName, f.players.find(p => p.role === f.winner)?.co))
    : f.empate ? el('span', { class: 'tie' }, '🤝 Empate')
      : el('span', { class: 'none', title: 'Esta sala terminó sin que quedara registro de quién ganó' }, '—');
  return enlace('sala', [f.code, f.day], { class: 'log-row' },
    el('div', { class: 'when' }, whenLabel(f.at), el('br'), el('span', { class: 'code' }, f.code)),
    el('div', { class: 'game' }, gameLabel(f.game), ' ', idiomaTag(f.langs)),
    el('div', { class: 'who' }, ...f.players.map(p => el('span', { class: 'q' }, quien(p.name, p.co)))),
    el('div', { class: 'win' }, ganador),
  );
}

/**
 * Una partida sin red ya jugada (D-140, D-210): cuándo, el juego si se pide, quién jugó con su
 * bandera (o "sin nombre", si la app no lo sabía), el modo y cómo terminó.
 */
function filaSinRedLog(p, { conJuego = false } = {}) {
  const modo = MODES[p.mode] ? `${modeIcon(p.mode)} ${MODES[p.mode].label}` : p.mode;
  const fin = p.fin;
  const resultado = !fin ? el('span', { class: 'none', title: 'No llegó al final, o es de antes de que se anotara (D-210)' }, `al menos ${minutos(p.minMs)}`)
    : fin.empate ? el('span', { class: 'tie' }, '🤝 Empate')
      : fin.ganador ? el('span', { class: 'won' }, '🏆 ', quien(fin.ganador, p.co))
        : el('span', { class: 'va' }, '✓ terminó');
  return el('div', { class: 'log-row' },
    el('div', { class: 'when' }, whenLabel(p.at), p.v ? [el('br'), `v${p.v}`] : null),
    el('div', { class: 'game' }, conJuego ? [gameLabel(p.game), ' ', idiomaTag(p.lang), el('br')] : null, el('small', {}, modo, conJuego ? null : [' ', idiomaTag(p.lang)])),
    el('div', { class: 'who' },
      el('span', { class: 'q' }, p.name ? quien(p.name, p.co) : ['sin nombre', bandera(p.co)]),
      p.n > 1 && !p.name ? el('span', { class: 'q' }, `${n(p.n)} jugadores`) : null,
      fin?.detalle ? el('span', { class: 'q' }, fin.detalle) : null,
      fin ? el('span', { class: 'q' }, `duró ${minutos(p.minMs)}`) : null),
    el('div', { class: 'win' }, resultado));
}

/** El paginado de una lista: anterior, cuántas y siguiente. */
function paginado(page, pages, desde, cuantas, total, nombre, cambiar) {
  if (!total) return null;
  return el('div', { class: 'pager' },
    el('button', { class: 'btn btn--ghost btn--sm', disabled: page <= 1, onClick: () => cambiar(page - 1) }, '‹ Anterior'),
    el('span', { class: 'muted small' }, `${desde + 1}–${Math.min(desde + cuantas, total)} de ${n(total)} ${nombre(total)}`),
    el('button', { class: 'btn btn--ghost btn--sm', disabled: page >= pages, onClick: () => cambiar(page + 1) }, 'Siguiente ›'),
  );
}

/* ------------------------------------------------------------------ */
/* Ahora                                                               */
/* ------------------------------------------------------------------ */
/** Lo que está en juego en este momento. No depende del rango. */
function vistaAhora(now) {
  const { propias: live, ajenas } = salasVivas(now);
  const active = live.filter(r => r.active);
  const sinRed = liveLocal(S.days, now);
  const copas = copasEnCurso(S.torneos, now);
  const enCurso = copas.filter(c => c.estado === 'en-curso');
  const porEmpezar = copas.filter(c => c.estado === 'por-empezar');
  const jugandoMini = copas.reduce((k, c) => k + c.jugando.length, 0);

  // Cada cifra filtra la lista de abajo: lo que suma está a un toque (D-207)
  const filtrar = f => () => { S.filtroAhora = S.filtroAhora === f ? 'todo' : f; render(); };
  const tiles = el('div', { class: 'tiles' },
    tile(active.length, `salas en juego · ${n(live.length)} vivas`, { hot: active.length > 0, onClick: filtrar('sala'), pressed: S.filtroAhora === 'sala', info: 'ver cuáles' }),
    tile(sinRed.length, 'partidas sin red ahora', { hot: sinRed.length > 0, onClick: filtrar('sinred'), pressed: S.filtroAhora === 'sinred', info: 'ver cuáles' }),
    tile(enCurso.length, `copas en curso · ${n(jugandoMini)} jugando un juego de la copa`, { hot: jugandoMini > 0, onClick: filtrar('torneo'), pressed: S.filtroAhora === 'torneo', info: 'ver cuáles' }),
    tile(connections(live), 'celulares conectados', { info: 'tope del plan gratuito: ~100' }),
  );

  // Una sola lista, de lo que dio señal más recién a lo más quieto
  const señalCopa = c => Math.max(c.ultimo || 0, c.createdAt || 0, ...c.jugando.map(j => j.desde));
  const items = [
    ...enCurso.map(c => ({ t: 'torneo', at: señalCopa(c), fila: filaCopa(c, now) })),
    ...live.map(r => ({ t: 'sala', at: r.lastAt, fila: filaSala(r, now) })),
    ...sinRed.map(p => ({ t: 'sinred', at: p.beat, fila: filaSinRed(p, now) })),
  ].sort((a, b) => b.at - a.at);
  const cuantos = t => items.filter(x => x.t === t).length;
  const visibles = items.filter(x => S.filtroAhora === 'todo' || x.t === S.filtroAhora);
  const cargando = !S.daysLoaded || !S.torneosLoaded;
  const vacio = cargando ? 'Cargando…' : { todo: 'No hay nada en juego en este momento.', copa: 'No hay copas en curso.', sala: 'No hay salas vivas en este momento.', sinred: 'Nadie está jugando sin red en este momento.' }[S.filtroAhora];

  const enJuego = bloque('En juego', 'De lo que dio señal más recién a lo más quieto. En las copas, ✓ es quien ya jugó el juego de hoy y el punto verde quien lo está jugando. En las salas, el punto verde es quien está conectado; una sala se ve hasta media hora sin movimiento.',
    filtros([['todo', `Todo · ${items.length}`], ['torneo', `Copas · ${cuantos('torneo')}`], ['sala', `Salas · ${cuantos('sala')}`], ['sinred', `Sin red · ${cuantos('sinred')}`]], S.filtroAhora, v => { S.filtroAhora = v; render(); }, 'Qué mostrar'),
    lista(visibles.map(x => x.fila), vacio));
  // Nunca esconder en silencio: una sala puede quedar fuera por ser de otro entorno, pero
  // también porque su registro de señales falló, que es mejor esfuerzo y falla callado (C-14).
  if (ajenas.length && (S.filtroAhora === 'todo' || S.filtroAhora === 'sala')) {
    const una = ajenas.length === 1;
    enJuego.append(el('p', { class: 'empty', style: 'margin-top:8px' },
      `${una ? 'Hay una sala abierta que no es' : `Hay ${n(ajenas.length)} salas abiertas que no son`} de ${envLabel(S.env)}, así que no ${una ? 'se cuenta' : 'se cuentan'} acá: ${ajenas.map(r => r.code).join(', ')}. `
      + 'Suelen ser partidas de prueba hechas en el computador, en la red de la casa o por Tailscale, y se borran solas a la media hora de quedar quietas.'));
  }

  return [
    ...titulo('Ahora', 'Lo que se está jugando en este momento. No depende del rango y se actualiza solo.'),
    tiles, enJuego,
    porEmpezar.length ? bloque('Por empezar', 'Copas que todavía no parten.', lista(porEmpezar.map(c => filaCopa(c, now)))) : null,
  ];
}

/* ------------------------------------------------------------------ */
/* La Copa                                                             */
/* ------------------------------------------------------------------ */
/** Barras por idioma, en el orden de la app y con su nombre (D-211). */
function porIdioma(titulo, nota, cuenta) {
  const pares = ordenIdiomas(Object.entries(cuenta || {}).filter(([, v]) => v > 0));
  const max = Math.max(0, ...pares.map(([, v]) => v));
  return bloque(titulo, nota, lista(pares.map(([k, v]) => bar(`${k.toUpperCase()} · ${nombreDeIdioma(k)}`, [seg(C_IDIOMA, v)], max)), 'Nada todavía.', 'bars'));
}

function vistaCopa(now) {
  const rango = rangeOf(S.range);
  const rc = resumenCopas(S.torneos, rango, now);
  const part = pct(rc.participacion);
  const cargando = S.torneosLoaded ? null : 'Cargando las copas…';

  const todas = bitacoraCopas(S.torneos, rango, now);
  const ESTADOS = [['todas', 'Todas'], ['en-curso', 'En curso'], ['por-empezar', 'Por empezar'], ['terminada', 'Terminadas'], ['lab', 'Laboratorio']];
  const es = (c, v) => v === 'todas' || (v === 'lab' ? c.lab : c.estado === v);
  const periodosM = groupDays(rc.porDia, rango.grano);
  const maxM = Math.max(0, ...rc.porJuego.map(m => m.jugadas + m.abandonos));
  const maxMD = Math.max(0, ...periodosM.map(d => d.total));
  const verTodas = () => { S.filtroCopas = 'todas'; render(); };

  return [
    ...titulo(`${torneoLabel} · ${tituloRango()}`, 'Las copas que estuvieron abiertas en el rango, también las de prueba: no se separan por entorno.'),
    el('div', { class: 'tiles' },
      tile(rc.copas, 'copas activas', { onClick: verTodas }),
      tile(rc.nuevas, 'copas nuevas'),
      tile(rc.inscripciones, 'jugadores inscritos'),
      tile(rc.jugadas, 'juegos jugados'),
      tile(part === null ? '—' : `${part}%`, 'participación', { info: 'jugados de los que se podían jugar, en días cerrados' }),
      tile(rc.abandonos, 'juegos sin terminar'),
    ),
    bloqueAvisos(rango, now),
    porIdioma('Copas por idioma', 'El idioma que eligió quien creó la copa: en ese idioma la juegan todos.', todas.reduce((m, c) => ({ ...m, [c.lang]: (m[c.lang] || 0) + 1 }), {})),
    bloque('Copas', 'De la más nueva a la más vieja. Toca una para ver su tabla, cada día y su historia.',
      filtros(ESTADOS.map(([v, l]) => [v, `${l} · ${todas.filter(c => es(c, v)).length}`]), S.filtroCopas, v => { S.filtroCopas = v; render(); }, 'Qué copas mostrar'),
      lista(todas.filter(c => es(c, S.filtroCopas)).map(filaCopaLog), cargando || 'Ninguna copa así en este rango.', 'log')),
    bloque('Por juego', 'Juegos terminados en el rango y, en gris, los que alguien empezó y dejó sin terminar. El tiempo típico es la mediana: no lo mueve quien dejó el celular media hora encendido.',
      lista(rc.porJuego.map(m => bar(miniLabel(m.id), [seg(C_TORNEO, m.jugadas), seg('rgba(255,255,255,0.25)', m.abandonos)], maxM, {
        cifra: m.jugadas,
        detail: [
          m.promedio === null ? null : `puntaje promedio ${m.promedio}/100`,
          m.medianaMs ? `tiempo típico ${duracion(m.medianaMs)}` : null,
          m.abandonos ? `${n(m.abandonos)} sin terminar` : null,
          `en ${n(m.copas)} copa${m.copas === 1 ? '' : 's'}`,
        ].filter(Boolean).join(' · '),
      })), cargando || 'Ningún juego jugado en este rango.', 'bars')),
    bloque({ dia: 'Juegos por día', semana: 'Juegos por semana', mes: 'Juegos por mes' }[rango.grano], `Días UTC.${rango.grano === 'semana' ? ' La fecha es el lunes de cada semana.' : ''}`,
      lista(periodosM.map(d => bar(d.label, [seg(C_TORNEO, d.total)], maxMD)), 'Nada todavía.', 'bars')),
  ];
}

const AVISO_LABEL = {
  dia: '📅 Se abrió el día', plazo: '⏳ Se acaba el plazo', final: '🏁 La Gran Final', fin: '🥇 Terminó la copa',
  insc: '✍️ Alguien se inscribió (al admin)', copas: '🎲 Días de varias copas', prueba: '🧪 De prueba',
  // Uno al día (D-230)
  'uad-dia': '📅 Uno al día: el de hoy', 'uad-racha': '🔥 Uno al día: la racha', 'uad-semana': '📊 Uno al día: la semana', 'uad-adios': '👋 Uno al día: el último',
};
const PWA_LABEL = { android: 'Android', ios: 'iPhone / iPad', otro: 'Otro (computador)' };

/**
 * Los avisos al celular (D-233): si los manda el workflow, cuántos llegan, cuántos se tocan y
 * cuántos abren la app instalada. Mandados y vueltas son del sitio publicado; los tocados, del
 * entorno elegido.
 */
function bloqueAvisos(rango, now) {
  const a = avisosDelRango(S.days, { from: rango.from, to: rango.to });
  const p = S.push || {};
  const atrasada = S.push !== null && vueltaAtrasada(p.vuelta, now);
  const tipos = [...AVISO_TIPOS, ...Object.keys({ ...a.mandados, ...a.tocados }).filter(k => !AVISO_TIPOS.includes(k))]
    .filter(k => a.mandados[k] || a.tocados[k]);
  const maxT = Math.max(0, ...tipos.map(k => Math.max(a.mandados[k] || 0, a.tocados[k] || 0)));
  const pwa = Object.entries(a.pwa).sort((x, y) => y[1] - x[1]);
  const maxP = Math.max(0, ...pwa.map(([, v]) => v));
  return bloque('🔔 Avisos al celular',
    'Los manda GitHub cada 15 minutos. Mandados: los que el servicio del celular aceptó. Tocados: los que abrieron la app desde el aviso. En las barras, rosado, tocados; celeste, mandados sin tocar. Días UTC.',
    el('div', { class: 'tiles' },
      tile(p.vivas ?? '—', 'celulares con avisos', { info: 'suscripciones vivas en la última vuelta' }),
      tile(a.totalMandados, 'avisos mandados'),
      tile(porcentaje(a.totalTocados, a.totalMandados), `tocados · ${n(a.totalTocados)}`),
      tile(a.totalPwa, 'aperturas de la app instalada'),
      tile(p.vuelta ? horaLabel(p.vuelta) : '—', `última vuelta${p.vuelta ? ` · ${ago(p.vuelta, now)}` : ''}${atrasada ? ' · ¿se apagó el workflow?' : ''}`, { hot: atrasada, info: atrasada ? 'GitHub apaga los workflows programados tras 60 días sin commits' : '' }),
    ),
    el('div', { class: 'grid2' },
      el('div', {}, el('h3', { class: 'small' }, 'Por tipo'),
        lista(tipos.map(k => bar(AVISO_LABEL[k] || k, [seg(C_TORNEO, a.tocados[k] || 0), seg(C_TOTAL, Math.max(0, (a.mandados[k] || 0) - (a.tocados[k] || 0)))], maxT, {
          cifra: a.mandados[k] || 0,
          detail: `${n(a.mandados[k] || 0)} mandados · ${n(a.tocados[k] || 0)} tocados`,
        })), 'Ningún aviso en este rango.', 'bars')),
      el('div', {}, el('h3', { class: 'small' }, 'App instalada'),
        lista(pwa.map(([k, v]) => bar(PWA_LABEL[k] || k, [seg(C_IDIOMA, v)], maxP)), 'Nadie la abrió desde el ícono en este rango.', 'bars'))));
}

/** Una casilla de la grilla jugador × día de una copa. */
function casillaCelda(c) {
  const x2 = c.x2 ? el('small', { class: 'x2', title: c.comodin ? 'Día de comodín: vale doble' : 'La final vale doble' }, c.comodin ? '🃏 ×2' : '×2') : null;
  switch (c.tipo) {
    case 'jugo': return el('td', { class: 'c-jugo', title: `${c.s} de 100 en ${duracion(c.ms)}${c.pts !== null ? `, ${c.pts} puntos en la tabla` : ''}` },
      el('b', {}, c.s), el('small', {}, duracion(c.ms)), c.pts !== null ? el('small', {}, `+${c.pts}`) : null, x2);
    case 'jugando': return el('td', { class: 'c-jugando', title: `Lo está jugando: empezó a las ${horaLabel(c.desde)}` }, '● jugando', x2);
    case 'sin-terminar': return el('td', { class: 'c-sin', title: `Empezó a las ${horaLabel(c.desde)} y no terminó` }, 'sin terminar', x2);
    case 'abierto': return el('td', { class: 'c-abierto', title: 'El día está abierto y todavía no lo empieza' }, '…', x2);
    case 'no-jugo': return el('td', { class: 'c-no', title: 'El día cerró sin que lo jugara' }, '✗', x2);
    case 'no-debia': return el('td', { class: 'c-nada', title: 'Se inscribió después de que este día cerró' }, '—');
    case 'anulado': return el('td', { class: 'c-nada', title: 'El admin terminó la copa antes de este día' }, 'anulado');
    default: return el('td', { class: 'c-futuro', title: 'Todavía no abre' }, '·', x2);
  }
}

const ICONO_EVENTO = { creada: '✨', inscripcion: '✍️', empezo: '▶️', termino: '✅', 'sin-terminar': '⏸', abrio: '📅', cerro: '🌙', fin: '🏁', comodin: '🃏', retiro: '🚪', cerrada: '🔒' };

/** Un evento de la historia de una copa, con la bandera junto al nombre de quien lo hizo. */
function filaEvento(L, e) {
  const p = e.pid ? L.players[e.pid] : null;
  const texto = p && e.texto.startsWith(p.name)
    ? [quien(p.name, paisDe(L, e.pid)), e.texto.slice(p.name.length)]
    : [e.texto];
  const detalle = [
    e.tipo === 'abrio' ? `toca ${miniLabel(e.juego)}` : e.juego && e.tipo !== 'cerro' ? miniLabel(e.juego) : null,
    e.tipo === 'termino' ? `${e.s} de 100 en ${duracion(e.ms)}` : null,
  ].filter(Boolean).join(' · ');
  return el('div', { class: 'evento' },
    el('span', { class: 'hora' }, e.at ? horaLabel(e.at) : '—'),
    el('span', { class: 'ico', 'aria-hidden': 'true' }, ICONO_EVENTO[e.tipo] || '·'),
    el('span', { class: 'que' }, ...texto, detalle ? el('small', {}, detalle) : null));
}

/** La ficha de una copa: cabecera, tabla, cada día y su historia. */
function vistaFichaCopa(code, now) {
  if (!S.torneosLoaded) return [migas([torneoLabel, 'torneo'], [code]), el('p', { class: 'empty' }, 'Cargando las copas…')];
  const L = copaDe(code, S.torneos[code]);
  if (!L) return [migas([torneoLabel, 'torneo'], [code]), ...titulo(code), el('p', { class: 'empty' }, `No hay una copa con el código ${code}. Puede que se haya eliminado.`)];
  const f = fichaCopa(L, now);
  const m = L.meta;
  const inscripcion = f.closed ? 'cerrada por el admin' : f.inscripcion ? `abierta hasta el ${whenLabel(f.joinUntil ?? m.win[m.days].a)}` : 'cerrada';
  const cierra = f.abiertos.length ? f.abiertos.map(d => `día ${d}: ${whenLabel(m.win[d].b)}`).join(' · ') : null;
  // Una copa en alemán parte sus días a medianoche de Berlín: se dice, para que la hora del Pacífico no confunda
  const otraZona = m.tz && m.tz !== ZONA_PANEL ? ` · sus días van con la hora de ${tzLabel(m.tz.replace(/\//g, '__')).city}` : '';

  const cabecera = [
    migas([torneoLabel, 'torneo'], [f.name]),
    el('div', { class: 'ficha-titulo' },
      el('h2', { class: 'display display--md' }, code),
      el('span', { class: `estado estado--${f.estado}` }, estadoTexto(f)),
      f.lab ? el('span', { class: 'tag' }, 'laboratorio') : null),
    datos([
      ['Nombre', f.name],
      ['Link propio', f.alias ? `/${f.alias}` : null],
      ['Admin', quien(f.admin.name, f.admin.co)],
      ['Idioma', nombreDeIdioma(f.lang)],
      f.aud ? ['Audiencia', f.aud] : null,
      ['Días', `${f.days}, desde el ${inicioLabel(f.start)}${otraZona}`],
      ['Creada', f.createdAt ? whenLabel(f.createdAt) : null],
      cierra ? ['Cierra', cierra] : null,
      [f.estado === 'terminada' ? 'Terminó' : 'Termina', whenLabel(m.end)],
      ['Inscripción', inscripcion],
      ['Jugadores', [`${f.jugadores}`, ...(f.retirados.length ? [' · retirados: ', ...f.retirados.flatMap((r, i) => [i ? ', ' : '', quien(r.name, r.co)])] : [])]],
    ]),
    el('a', { class: 'btn btn--ghost btn--sm abrir', href: `../cup/?${f.alias || code}`, target: '_blank', rel: 'noopener' }, 'Abrir la copa ↗'),
  ];

  const TABS = [['tabla', 'Tabla'], ['dias', 'Día a día'], ['historia', 'Historia']];
  const pestañas = el('div', { class: 'subtabs', role: 'tablist', 'aria-label': 'Qué ver de la copa' },
    ...TABS.map(([v, l]) => el('button', { type: 'button', role: 'tab', 'aria-selected': String(S.fichaTab === v), onClick: () => { S.fichaTab = v; render(); } }, l)));

  let cuerpo;
  if (S.fichaTab === 'dias') {
    const cab = el('tr', {}, el('th', { scope: 'col' }, 'Jugador'),
      ...f.dias.map(x => el('th', { scope: 'col', title: `${miniLabel(x.juego)} · abre ${whenLabel(x.a)} · cierra ${whenLabel(x.b)}` },
        `Día ${x.d}`, el('br'), miniEmoji(x.juego), x.final ? ' 🏁' : '', el('br'),
        el('small', {}, x.estado === 'futuro' ? fechaLabel(x.a) : x.estado === 'anulado' ? 'anulado' : `${x.jugaron}/${x.de}`))),
      el('th', { scope: 'col' }, 'Total'));
    const filas = f.grilla.map(j => el('tr', {}, el('th', { scope: 'row' }, quien(j.name, j.co)), ...j.casillas.map(casillaCelda), el('td', { class: 'c-total' }, n(j.total))));
    cuerpo = bloque('Día a día', 'Puntaje de 0 a 100, tiempo y los puntos que le dio en la tabla. Arriba de cada día, cuántos jugaron de los que les tocaba. Pasa el dedo por una casilla para ver el detalle.',
      f.grilla.length ? el('div', { class: 'grilla' }, el('table', {}, el('thead', {}, cab), el('tbody', {}, ...filas))) : el('p', { class: 'empty' }, 'Nadie inscrito todavía.'),
      el('p', { class: 'muted small leyenda' }, '● jugando ahora · sin terminar: empezó y no dejó resultado · … el día está abierto · ✗ el día cerró sin que jugara · — se inscribió después · ×2 vale doble: la final o su comodín 🃏'));
  } else if (S.fichaTab === 'historia') {
    const { eventos, sinHora } = f.historia;
    const grupos = [];
    for (const e of eventos) {
      const d = diaPanel(e.at);
      if (!grupos.length || grupos[grupos.length - 1].d !== d) grupos.push({ d, label: fechaLabel(e.at), evs: [] });
      grupos[grupos.length - 1].evs.push(e);
    }
    cuerpo = bloque('Historia', `Del más nuevo al más viejo, en ${ZONA_NOMBRE}.`,
      eventos.length ? el('div', { class: 'historia' }, ...grupos.flatMap(g => [el('p', { class: 'dia-grupo' }, g.label), ...g.evs.map(e => filaEvento(L, e))])) : el('p', { class: 'empty' }, 'Nada todavía.'),
      sinHora.length ? el('div', { class: 'historia' }, el('p', { class: 'dia-grupo' }, 'Sin hora'), el('p', { class: 'muted small' }, 'La base guarda estos cambios sin la hora en que pasaron.'), ...sinHora.map(e => filaEvento(L, e))) : null);
  } else {
    cuerpo = bloque('Tabla', 'Como quedará: incluye los días que los jugadores todavía no pueden ver.',
      lista(f.grilla.map(j => el('div', { class: 'puesto' },
        el('span', { class: 'lugar' }, j.lugar ?? '—'),
        el('span', { class: 'nombre' }, quien(j.name, j.co), j.comodin ? el('small', {}, ` · comodín el día ${j.comodin}`) : null),
        el('span', { class: 'pts' }, n(j.total), el('small', {}, ' pts')))), 'Nadie inscrito todavía.', 'tabla'));
  }
  return [...cabecera, pestañas, cuerpo];
}

/* ------------------------------------------------------------------ */
/* Juegos                                                              */
/* ------------------------------------------------------------------ */
function vistaJuegos() {
  const rango = rangeOf(S.range);
  const hoyDia = dayOf(Date.now());
  const s = summarize(S.days, { from: rango.from, to: rango.to, incluye: esJuego });
  const hoy = summarize(S.days, { from: hoyDia, to: hoyDia, incluye: esJuego });
  MODOS = s.modes;
  const games = Object.entries(s.byGame).sort((a, b) => b[1].total - a[1].total);
  const maxGame = Math.max(0, ...games.map(([, g]) => g.total));
  // La leyenda es de los juegos de una partida: el modo del torneo tiene su propia sección
  const leyenda = `Toca un juego para ver su ficha. Por modo: ${MODE_IDS.filter(m => !MODES[m].torneo).map(m => `${modeIcon(m)} ${MODES[m].label}`).join(' · ')}`;
  const verSolas = () => { S.logSolas = true; S.logPage = 1; render(); document.getElementById('salas-jugadas')?.scrollIntoView({ block: 'start' }); };

  return [
    ...titulo(`🎲 Juegos · ${tituloRango()}`, 'Los juegos de una partida, sin La Copa. Una partida se cuenta cuando empieza, aunque no se termine; las de dos celulares, solo si entró alguien más. Los días son UTC.'),
    el('div', { class: 'tiles' },
      tile(s.partidas, 'partidas empezadas'),
      tile(s.online, 'en dos celulares'),
      tile(s.local, 'sin red'),
      tile(s.devices, 'entradas de un celular a una partida'),
      tile(hoy.partidas, 'partidas hoy (día UTC)'),
      tile(s.sinRival, 'salas donde nunca entró nadie más', { onClick: verSolas, info: 'ver cuáles' }),
    ),
    bloque('Partidas por juego', leyenda,
      lista(games.map(([id, g]) => bar(gameLabel(id), MODOS.map(m => segModo(m, g[m] || 0)), maxGame,
        { note: MODOS.filter(m => g[m]).map(m => `${modeIcon(m)}${n(g[m])}`).join(' '), href: ir('juego', [id]) })), 'Nada todavía.', 'bars')),
    graficosJuego(s, rango),
    bloqueUnoAlDia(rango),
    sinRedRecientes(rango),
    bitacora(rango),
  ];
}

/**
 * Uno al día (D-230): las partidas del modo `uno-al-dia` (de todos), y de quienes entraron con
 * jugador, cuántos jugaron, cuántos volvieron al día siguiente y a la semana, sus rachas y las
 * invitaciones aceptadas. Los avisos van en el bloque de avisos de La Copa, como `uad-*`.
 */
function bloqueUnoAlDia(rango) {
  const u = unoAlDiaDelRango({ days: S.days, ...S.uad }, { from: rango.from, to: rango.to, hoy: dayOf(Date.now()) });
  const periodos = groupDays(u.porDia, rango.grano);
  const maxD = Math.max(0, ...periodos.map(d => d.total));
  const juegos = Object.entries(u.porJuego).sort((a, b) => b[1] - a[1]);
  const maxJ = Math.max(0, ...juegos.map(([, v]) => v));
  const maxR = Math.max(0, ...u.tramos.map(([, v]) => v));
  const pct = p => (p === null ? '—' : `${p} %`);
  const de = base => (base ? ` · de ${n(base)} días` : '');
  return bloque('📅 Uno al día',
    'Las partidas son de todos (cada una se cuenta al empezar). Jugadores, vuelta, rachas e invitaciones, solo de quienes entraron con su nombre y PIN. "Volvió al día siguiente": de los días jugados cuyo día siguiente ya pasó, en cuántos jugó también el siguiente. Días UTC.',
    el('div', { class: 'tiles' },
      tile(u.partidas, 'partidas de Uno al día'),
      tile(u.jugadores, 'jugadores con jugador'),
      tile(pct(u.d1), `volvió al día siguiente${de(u.base.d1)}`),
      tile(pct(u.d7), `volvió a los 7 días${de(u.base.d7)}`),
      tile(u.aceptadas, 'invitaciones aceptadas'),
    ),
    el('div', { class: 'grid2' },
      el('div', {}, el('h3', { class: 'small' }, { dia: 'Por día', semana: 'Por semana', mes: 'Por mes' }[rango.grano]),
        lista(periodos.map(d => bar(d.label, [seg(C_TORNEO, d.total)], maxD)), 'Nadie jugó Uno al día en este rango.', 'bars')),
      el('div', {}, el('h3', { class: 'small' }, 'Por juego'),
        lista(juegos.map(([id, v]) => bar(gameLabel(id), [seg(C_TORNEO, v)], maxJ)), 'Nada todavía.', 'bars'))),
    el('div', { style: 'margin-top:16px' }, el('h3', { class: 'small' }, 'Mejores rachas'),
      lista(u.tramos.map(([label, v]) => bar(`🔥 ${label}`, [seg(C_SIN_RED, v)], maxR)), 'Nadie con racha todavía.', 'bars')));
}

/** Las partidas sin red de todos los juegos (sin La Copa): ahí están quienes juegan solos (D-210). */
function sinRedRecientes(rango) {
  const todas = localLog(S.days, { from: rango.from, to: rango.to }).filter(p => esJuego(p.game));
  const visibles = S.sinRedTodas ? todas : todas.slice(0, SIN_RED_VISIBLES);
  return bloque('Partidas sin red', NOTA_SIN_RED,
    lista(visibles.map(p => filaSinRedLog(p, { conJuego: true })), 'Ninguna en este rango.', 'log'),
    todas.length > SIN_RED_VISIBLES ? el('button', { type: 'button', class: 'btn btn--ghost btn--sm mas', onClick: () => { S.sinRedTodas = !S.sinRedTodas; render(); } }, S.sinRedTodas ? 'Ver menos' : `Ver las ${n(todas.length)}`) : null);
}

/** Qué dice cada partida sin red, y desde cuándo (D-140, D-210). */
const NOTA_SIN_RED = 'Contra el celular, en un solo celular o en solitario, de la más nueva a la más vieja. Con hora desde la versión 0.64.7 (D-140); con nombre y resultado desde la 0.99.2 (D-210). El nombre es el que la persona ya escribió en la app; si nunca puso uno, sale "sin nombre". Sin final, "al menos" va desde que empezó hasta su última señal.';

/** Jugadores por partida y partidas por día: los mismos en la vista de juegos y en la ficha de uno. */
function graficosJuego(s, rango) {
  const players = Object.entries(s.byPlayers).sort((a, b) => Number(a[0]) - Number(b[0]));
  const maxP = Math.max(0, ...players.map(([, v]) => v));
  // Por día en los rangos cortos, por semana o por mes en los largos: 365 barras no se leen
  const periodos = groupDays(s.byDay, rango.grano);
  const maxDay = Math.max(0, ...periodos.map(d => d.total));
  return el('div', { class: 'grid2' },
    bloque('Jugadores por partida', null, lista(players.map(([k, v]) => bar(k === '1' ? '1 jugador' : `${k} jugadores`, [seg(C_SIN_RED, v)], maxP)), 'Nada todavía.', 'bars')),
    bloque({ dia: 'Por día', semana: 'Por semana', mes: 'Por mes' }[rango.grano],
      `${modeIcon(ROOM_MODE)} En dos celulares y, en amarillo, sin red. Días UTC.${rango.grano === 'semana' ? ' La fecha es el lunes de cada semana.' : ''}`,
      lista(periodos.map(d => bar(d.label, [segModo(ROOM_MODE, d.online), seg(C_SIN_RED, d.local)], maxDay)), 'Nada todavía.', 'bars')),
  );
}

/** La bitácora de salas jugadas del rango (D-79), de un juego o de todos. */
function bitacora(rango, game = null) {
  const filas = roomLog(S.days, { from: rango.from, to: rango.to, soloJugadas: !S.logSolas }).filter(f => !game || f.game === game);
  const { rows, page, pages, total, desde } = paginate(filas, { page: S.logPage, perPage: POR_PAGINA });
  S.logPage = page;
  return el('div', { class: 'panel', id: 'salas-jugadas' },
    el('p', { class: 'lead' }, game ? `Salas de ${nombreJuego(game)}` : 'Salas jugadas'),
    el('p', { class: 'muted small' }, `Las del rango, de la más nueva a la más vieja, en ${ZONA_NOMBRE}. Toca una para ver su ficha. Las partidas de prueba corren en el entorno de pruebas: para verlas, cambia el entorno arriba.`),
    el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: S.logSolas || null, onChange: e => { S.logSolas = e.target.checked; S.logPage = 1; render(); } }), ' Incluir salas donde nunca entró nadie más'),
    lista(rows.map(filaSalaLog), S.logSolas ? 'Ninguna sala en este rango.' : 'Ninguna sala jugada en este rango.', 'log'),
    paginado(page, pages, desde, rows.length, total, k => (k === 1 ? 'sala' : 'salas'), p => { S.logPage = p; render(); }));
}

/** La ficha de un juego: sus modos, cuánta gente, cuánto duran sus salas, sus salas y sus partidas sin red. */
function vistaFichaJuego(id) {
  const rango = rangeOf(S.range);
  const nombre = gameLabel(id);
  const s = summarize(S.days, { from: rango.from, to: rango.to, incluye: g => g === id });
  MODOS = s.modes;
  const fila = s.byGame[id] || { total: 0 };
  const salas = roomLog(S.days, { from: rango.from, to: rango.to, soloJugadas: true }).filter(f => f.game === id);
  const durTipica = mediana(salas.filter(f => f.durMs).map(f => f.durMs));
  const sinRed = localLog(S.days, { from: rango.from, to: rango.to, game: id });
  const modos = MODOS.filter(m => fila[m]);
  const maxM = Math.max(0, ...modos.map(m => fila[m]));
  const visibles = S.sinRedTodas ? sinRed : sinRed.slice(0, SIN_RED_VISIBLES);
  const modoDe = m => (MODES[m] ? `${modeIcon(m)} ${MODES[m].label}` : m);

  return [
    migas(['🎲 Juegos', 'juegos'], [nombre]),
    ...titulo(`${nombre} · ${tituloRango()}`, `Los conteos van por día UTC; las horas, en ${ZONA_NOMBRE}.`),
    el('div', { class: 'tiles' },
      tile(fila.total, 'partidas empezadas'),
      tile(s.online, 'en dos celulares'),
      tile(s.local, 'sin red'),
      tile(s.sinRival, 'salas sin rival'),
      tile(durTipica ? minutos(durTipica) : '—', 'duración típica de las salas que terminaron', { info: 'desde que se creó hasta que alguien ganó: incluye la espera del rival' }),
    ),
    el('div', { class: 'grid2' },
      bloque('Por modo', null, lista(modos.map(m => bar(modoDe(m), [segModo(m, fila[m])], maxM)), 'Nada en este rango.', 'bars')),
      porIdioma('En qué idioma', 'Una vez por jugador de cada sala y una vez por partida sin red. Se anota desde D-211.', idiomasDelRango(S.days, { from: rango.from, to: rango.to, incluye: g => g === id }))),
    graficosJuego(s, rango),
    bitacora(rango, id),
    bloque('Partidas sin red', NOTA_SIN_RED,
      lista(visibles.map(p => filaSinRedLog(p)), 'Ninguna en este rango.', 'log'),
      sinRed.length > SIN_RED_VISIBLES ? el('button', { type: 'button', class: 'btn btn--ghost btn--sm mas', onClick: () => { S.sinRedTodas = !S.sinRedTodas; render(); } }, S.sinRedTodas ? 'Ver menos' : `Ver las ${n(sinRed.length)}`) : null),
  ];
}

/** La ficha de una sala: lo que quedó registrado y, si sigue viva, lo que está pasando. */
function vistaSala(code, dia, now) {
  const day = dia ? Number(dia) : null;
  const reg = salaDe(S.days, code, day);
  // Una sala viva se muestra aunque sea de otro entorno: la ficha la pidió por su código
  const { propias, ajenas } = salasVivas(now);
  const viva = (!day || day >= dayOf(now) - 1) ? [...propias, ...ajenas].find(r => r.code === code) || null : null;
  const game = reg?.game || viva?.game || null;
  const pasos = [['🎲 Juegos', 'juegos'], ...(game ? [[gameLabel(game), 'juego', [game]]] : []), [`Sala ${code}`]];
  if (!S.daysLoaded) return [migas(...pasos), el('p', { class: 'empty' }, 'Cargando…')];
  if (!reg && !viva) return [migas(...pasos), ...titulo(code), el('p', { class: 'empty' }, `No hay una sala ${code} en ${envLabel(S.env)} en ${rangeOf(S.range).titulo.toLowerCase()}. Prueba un rango más largo o el otro entorno.`)];

  const jugadores = reg?.players?.length ? reg.players : (viva?.players || []);
  const enLinea = role => viva?.players.find(p => p.role === role)?.online;
  const ganador = reg?.winner ? quien(reg.winnerName, reg.players.find(p => p.role === reg.winner)?.co) : reg?.empate ? '🤝 Empate' : null;
  return [
    migas(...pasos),
    el('div', { class: 'ficha-titulo' },
      el('h2', { class: 'display display--md' }, code),
      el('span', { class: `estado ${viva ? 'estado--en-curso' : 'estado--terminada'}` }, viva ? 'viva' : 'cerrada'),
      reg?.v ? el('span', { class: 'tag' }, `v${reg.v}`) : null),
    datos([
      ['Juego', game ? enlace('juego', [game], {}, gameLabel(game)) : '?'],
      ['Idioma', (reg?.langs?.length ? reg.langs : (viva?.players || []).map(p => p.lang).filter(Boolean)).map(nombreDeIdioma).filter((x, i, a) => a.indexOf(x) === i).join(' y ') || 'sin dato (de antes de D-211)'],
      ['Creada', whenLabel(reg?.at || viva.createdAt)],
      reg?.endAt ? ['Terminó', whenLabel(reg.endAt)] : null,
      reg?.durMs ? ['Duró', minutos(reg.durMs)] : null,
      ['Ganó', ganador ?? (viva ? 'todavía se juega' : 'sin registro')],
      viva ? ['Jugadas', n(viva.jugadas)] : null,
      viva ? ['Chat', chatDe(viva.chat)] : null,
      viva ? ['Última jugada', viva.lastPlayAt ? ago(viva.lastPlayAt, now) : 'ninguna'] : null,
    ]),
    bloque('Jugadores', null, lista(jugadores.map(p => el('div', { class: 'puesto' },
      el('span', { class: 'lugar' }, p.role),
      el('span', { class: 'nombre' }, quien(p.name, p.co), ' ', idiomaTag(p.lang)),
      el('span', { class: 'pts' }, viva ? (enLinea(p.role) ? el('span', { class: 'on-txt' }, '● conectado') : 'desconectado') : reg?.winner === p.role ? '🏆' : ''))), 'Sin jugadores.', 'tabla')),
    el('p', { class: 'muted small' }, viva
      ? 'La sala sigue viva: se borra sola a la media hora sin movimiento. Del chat solo se cuenta cuántos mensajes hubo.'
      : 'La sala ya se borró. De ella quedan el juego, los nombres, el país de cada celular, la versión y quién ganó (D-79). Las jugadas y el chat se cuentan solo mientras vive.'),
  ];
}

/* ------------------------------------------------------------------ */
/* Tráfico del sitio (D-208)                                           */
/* ------------------------------------------------------------------ */
/**
 * Una página por su carpeta, con el nombre del juego que vive ahí: el registro dice la carpeta de
 * cada juego (`path`) y de cada juego suelto (`slug`), así que uno nuevo se nombra solo (C-16).
 */
function paginaLabel(p) {
  if (p === 'inicio') return '🏠 Portada';
  if (p === 'labs') return '🧪 Laboratorio';
  const g = GAMES.find(x => x.path === `${p}/`);
  if (g) return gameLabel(g.id);
  const s = SUELTOS.find(x => x.slug === p);
  if (s) return `${s.emoji} ${s.name.es}`;
  return `/${p}/`;
}

/** Cómo se llama un canal: la marca que la app pone en lo que comparte, o la que vino en el enlace. */
const canalLabel = k => (k === 'link' ? '🔗 Link compartido desde la app' : k);
const porcentaje = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');

function vistaTrafico(now) {
  const rango = rangeOf(S.range);
  const t = trafico(S.days, { from: rango.from, to: rango.to });
  const hoy = trafico(S.days, { from: dayOf(now), to: dayOf(now) });
  const nota = 'Visitas al sitio, jueguen o no. Una visita es una pestaña: cuenta una vez, en la página donde empezó, y cada página que abre después suma una vista. Sin IP, sin cookies y sin identificar a nadie: del lugar de donde vino solo se guarda el dominio. Días UTC.';
  if (t.desde === null) {
    return [...titulo(`📈 Tráfico · ${tituloRango()}`, nota),
      el('p', { class: 'empty' }, S.daysLoaded ? 'Todavía no hay visitas registradas en este rango: se empezaron a contar con D-208. Las partidas y La Copa siguen en sus secciones.' : 'Cargando…')];
  }
  const periodos = groupDays(t.porDia, rango.grano);
  const maxD = Math.max(0, ...periodos.map(d => d.visitas));
  const origenes = top(origenesAgrupados(t.ref), 15);
  const maxO = Math.max(0, ...origenes.map(([, v]) => v));
  // Bajo cada origen, los dominios que junta: "Google" puede ser google.cl y google.com
  const dominiosDe = nombre => Object.keys(t.ref).filter(k => origenLabel(k) === nombre && k !== 'directo').map(k => k.replace(/_/g, '.')).join(', ');
  const canales = top(t.via, 10);
  const maxC = Math.max(0, ...canales.map(([, v]) => v));
  const paginas = Object.entries(t.paginas).sort((a, b) => b[1].entradas - a[1].entradas || b[1].vistas - a[1].vistas);
  const maxP = Math.max(0, ...paginas.map(([, p]) => p.vistas));
  const disp = top(t.disp, 5);
  const maxDi = Math.max(0, ...disp.map(([, v]) => v));
  const ret = [['nueva', 'Primera vez'], ['vuelve', 'Ya había venido']].map(([k, l]) => [l, t.retorno[k] || 0]);
  const maxR = Math.max(0, ...ret.map(([, v]) => v));
  const paises = top(t.pais, 15);
  const maxPa = Math.max(0, ...paises.map(([, v]) => v));
  const C_JUEGAN = 'var(--lime)';

  return [
    ...titulo(`📈 Tráfico · ${tituloRango()}`, nota),
    t.desde > rango.from ? el('p', { class: 'muted small' }, `Se cuenta desde el ${dayLabel(t.desde)}: antes de eso no hay visitas registradas.`) : null,
    el('div', { class: 'tiles' },
      tile(t.visitas, 'visitas'),
      tile(t.vistas, `páginas vistas · ${t.visitas ? (t.vistas / t.visitas).toLocaleString('es-CL', { maximumFractionDigits: 1 }) : '—'} por visita`),
      tile(porcentaje(t.juegan, t.visitas), `llegaron a jugar · ${n(t.juegan)} visitas`, { info: 'empezaron una partida o un juego de la copa' }),
      tile(porcentaje(t.retorno.nueva || 0, t.visitas), 'visitas de primera vez', { info: 'una marca en el navegador: no identifica a nadie' }),
      tile(hoy.visitas, 'visitas hoy (día UTC)'),
    ),
    bloque({ dia: 'Visitas por día', semana: 'Visitas por semana', mes: 'Visitas por mes' }[rango.grano],
      `En verde, las que llegaron a jugar.${rango.grano === 'semana' ? ' La fecha es el lunes de cada semana.' : ''}`,
      lista(periodos.map(d => bar(d.label, [seg(C_JUEGAN, d.juegan), seg(C_TOTAL, Math.max(0, d.visitas - d.juegan))], maxD, { cifra: d.visitas })), 'Nada todavía.', 'bars')),
    el('div', { class: 'grid2' },
      bloque('De dónde llegan', 'El sitio desde el que tocaron el link. WhatsApp y casi todas las apps de chat no lo dicen: esas visitas caen en "Directo o sin dato", junto con quien escribió la dirección o la tenía guardada.',
        lista(origenes.map(([k, v]) => bar(k, [seg(C_TOTAL, v)], maxO, { sub: dominiosDe(k) })), 'Nada todavía.', 'bars')),
      bloque('Por qué link', 'Lo que la app comparte lleva su marca (?de=link): así se sabe cuántas visitas llegaron por una invitación aunque el chat no lo diga. También cuenta utm_source o ?de= si se los pones a mano a un link.',
        lista(canales.map(([k, v]) => bar(canalLabel(k), [seg(C_TORNEO, v)], maxC)), 'Ninguna visita con marca en este rango.', 'bars'),
        t.visitas ? el('p', { class: 'muted small', style: 'margin-top:8px' }, `Sin marca: ${n(Math.max(0, t.visitas - canales.reduce((k, [, v]) => k + v, 0)))} visitas.`) : null),
    ),
    bloque('Páginas', 'Vistas de cada página y, al lado, cuántas visitas empezaron ahí y cuántas de esas llegaron a jugar.',
      lista(paginas.map(([k, p]) => bar(paginaLabel(k), [seg(C_TOTAL, p.vistas)], maxP, {
        detail: p.entradas ? `${n(p.entradas)} visita${p.entradas === 1 ? '' : 's'} empezaron acá · ${porcentaje(p.juegan, p.entradas)} llegaron a jugar` : 'ninguna visita empezó acá',
      })), 'Nada todavía.', 'bars')),
    el('div', { class: 'grid2' },
      bloque('Aparato', null, lista(disp.map(([k, v]) => bar(k.charAt(0).toUpperCase() + k.slice(1), [seg(C_IDIOMA, v)], maxDi)), 'Nada todavía.', 'bars')),
      bloque('Primera vez o vuelve', 'Por visita. "Ya había venido" sale de una marca que deja el navegador; quien borra los datos o usa modo privado cuenta como primera vez.',
        lista(ret.map(([l, v]) => bar(l, [seg(C_IDIOMA, v)], maxR)), 'Nada todavía.', 'bars')),
    ),
    bloque('País de las visitas', 'Del huso horario del celular, como en las salas (D-79).',
      lista(paises.map(([k, v]) => bar(`${flagOf(k)} ${nombreDePais(k)}`.trim(), [seg(C_TORNEO, v)], maxPa)), 'Nada todavía.', 'bars')),
  ];
}

/* ------------------------------------------------------------------ */
/* Audiencia                                                           */
/* ------------------------------------------------------------------ */
function vistaAudiencia(now) {
  const today = dayOf(now);
  const rango = rangeOf(S.range);
  const s = summarize(S.days, { from: rango.from, to: rango.to, incluye: esJuego });
  const hoy = summarize(S.days, { from: today, to: today, incluye: esJuego });
  const todo = summarize(S.days, { from: rango.from, to: rango.to });
  const rc = resumenCopas(S.torneos, rango, now);
  const miniHoy = rc.porDia.find(d => d.day === today)?.total || 0;

  const tipos = [[torneoLabel, C_TORNEO, rc.jugadas, 'juegos jugados', ir('torneo')], ['🎲 Otros juegos', C_TOTAL, s.partidas, 'partidas', ir('juegos')]];
  const maxT = Math.max(0, ...tipos.map(t => t[2]));
  const juntos = s.byDay.map((d, i) => ({ day: d.day, juegos: d.total, torneo: rc.porDia[i]?.total || 0 }));
  const periodosT = groupDays(juntos, rango.grano);
  const maxK = Math.max(0, ...periodosT.map(d => d.juegos + d.torneo));
  const origin = top(todo.origin, 15);
  const maxO = Math.max(0, ...origin.map(([, v]) => v));
  const paises = top(paisesDelRango(S.days, { from: rango.from, to: rango.to, incluye: esJuego }), 15);
  const maxPa = Math.max(0, ...paises.map(([, v]) => v));
  const lang = top(todo.lang, 10);
  const maxL = Math.max(0, ...lang.map(([, v]) => v));
  // El del navegador dice de dónde es la persona; este dice en cuál prefiere jugar (D-46)
  const appL = ordenIdiomas(top(todo.applang, 10));
  const maxA = Math.max(0, ...appL.map(([, v]) => v));
  const maxH = Math.max(1, ...todo.hour);

  return [
    ...titulo(`🌎 Audiencia · ${tituloRango()}`, 'Cuánto y desde dónde se juega. Días UTC: en el Pacífico el día cambia a las 17:00 (a las 16:00 en invierno).'),
    el('div', { class: 'tiles' },
      tile(s.partidas, 'partidas de juegos empezadas', { href: ir('juegos') }),
      tile(rc.jugadas, `juegos de ${torneoNombre}`, { href: ir('torneo') }),
      tile(rc.copas, 'copas activas', { href: ir('torneo') }),
      tile(todo.devices, 'entradas de un celular a una partida'),
      tile(hoy.partidas + miniHoy, 'partidas y juegos de la copa hoy'),
    ),
    el('div', { class: 'grid2' },
      bloque('Torneo y otros juegos', 'Un juego del torneo es la partida de un jugador en un día de su copa.',
        lista(tipos.map(([label, color, v, sub, href]) => bar(label, [seg(color, v)], maxT, { sub, href })), 'Nada todavía.', 'bars')),
      bloque({ dia: 'Por día', semana: 'Por semana', mes: 'Por mes' }[rango.grano],
        `Celeste, partidas de juegos; rosado, juegos de ${torneoNombre}.${rango.grano === 'semana' ? ' La fecha es el lunes de cada semana.' : ''}`,
        lista(periodosT.map(d => bar(d.label, [seg(C_TOTAL, d.juegos), seg(C_TORNEO, d.torneo)], maxK)), 'Nada todavía.', 'bars')),
    ),
    el('div', { class: 'grid2' },
      bloque('De dónde', 'Zona horaria del celular. Cuenta cada vez que un celular empezó o entró a una partida o a un juego: el mismo celular suma una vez por partida, así que no son personas distintas.',
        lista(origin.map(([k, v]) => { const { city, region } = tzLabel(k); return bar(city, [seg(C_TOTAL, v)], maxO, { sub: region }); }), 'Nada todavía.', 'bars')),
      bloque('País de los jugadores de salas', 'Una vez por jugador de cada sala con rival. Sale del huso horario del celular (D-79).',
        lista(paises.map(([k, v]) => bar(`${flagOf(k)} ${nombreDePais(k)}`.trim(), [seg(C_TORNEO, v)], maxPa)), 'Nada todavía.', 'bars')),
    ),
    el('div', { class: 'grid2' },
      bloque('Idioma del navegador', null, lista(lang.map(([k, v]) => bar(k === 'desconocido' ? 'Sin idioma' : k, [seg(C_IDIOMA, v)], maxL)), 'Nada todavía.', 'bars')),
      bloque('Idioma elegido para jugar', null, lista(appL.map(([k, v]) => bar(nombreDeIdioma(k), [seg(C_IDIOMA, v)], maxA)), 'Nada todavía.', 'bars')),
    ),
    bloque('A qué hora se juega', 'Hora local de cada celular.',
      el('div', { class: 'hours' }, ...todo.hour.map((v, h) => el('div', { class: 'h', style: `height:${Math.max(2, (v / maxH) * 100)}%`, title: `${h}:00 · ${n(v)}`, 'data-h': h % 6 === 0 ? h : null })))),
    bloque('Cuota del plan gratuito', 'Desde el navegador no se lee el uso de Firebase. Los celulares conectados de Ahora son la mejor aproximación a las conexiones simultáneas (tope ~100). El detalle está en la consola:',
      el('a', { class: 'btn btn--ghost btn--sm', href: 'https://console.firebase.google.com/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/usage', target: '_blank', rel: 'noopener' }, 'Uso en Firebase ↗')),
  ];
}

/* ------------------------------------------------------------------ */
/* Navegación                                                          */
/* ------------------------------------------------------------------ */
/** Ícono y nombre de cada sección. El de La Copa sale del registro de juegos (C-16). */
const SECCION = {
  ahora: ['🟢', 'Ahora'],
  torneo: TORNEO ? [TORNEO.emoji, TORNEO.name.es] : ['🏆', 'Torneo'],
  juegos: ['🎲', 'Juegos'],
  trafico: ['📈', 'Tráfico'],
  audiencia: ['🌎', 'Audiencia'],
};

function renderNav(now) {
  const actual = seccionDe(S.ruta);
  // Un punto verde en Ahora cuando hay algo en juego: se ve desde cualquier sección
  const algo = liveLocal(S.days, now).length > 0 || copasEnCurso(S.torneos, now).some(c => c.jugando.length) || salasVivas(now).propias.some(r => r.active);
  $('#nav').replaceChildren(...SECCIONES.map(sec => {
    const [ico, nombre] = SECCION[sec] || ['·', sec];
    return enlace(sec, [], { 'aria-current': sec === actual ? 'page' : null },
      el('span', { class: 'ico', 'aria-hidden': 'true' }, ico), el('span', { class: 'nombre' }, nombre),
      sec === 'ahora' && algo ? el('span', { class: 'vivo', title: 'Hay algo en juego' }) : null);
  }));
}

function render() {
  const now = Date.now();
  const { sec, args } = S.ruta;
  let nodos;
  if (sec === 'torneo' && args[0]) nodos = vistaFichaCopa(args[0].toUpperCase(), now);
  else if (sec === 'torneo') nodos = vistaCopa(now);
  else if (sec === 'juego') nodos = vistaFichaJuego(args[0]);
  else if (sec === 'sala') nodos = vistaSala(args[0].toUpperCase(), args[1], now);
  else if (sec === 'juegos') nodos = vistaJuegos();
  else if (sec === 'audiencia') nodos = vistaAudiencia(now);
  else if (sec === 'trafico') nodos = vistaTrafico(now);
  else nodos = vistaAhora(now);
  $('#vista').replaceChildren(...nodos.flat().filter(Boolean));
  renderNav(now);
  $('#updated').textContent = `Actualizado ${horaLabel(now)} · ${ZONA_NOMBRE}`;
}

/** La URL cambió (un enlace, Atrás, una dirección pegada): se dibuja esa vista desde arriba. */
function alCambiarRuta() {
  const antes = S.ruta;
  S.ruta = leerRuta(location.hash);
  if (S.ruta.r && S.ruta.r !== S.range && RANGOS.some(r => r.id === S.ruta.r)) cambiarRango(S.ruta.r, false);
  if (!S.ruta.r && S.range !== RANGO_POR_DEFECTO && antes.r) cambiarRango(RANGO_POR_DEFECTO, false);
  if ((S.ruta.e || ENV_DEFECTO) !== S.env) cambiarEntorno(S.ruta.e || ENV_DEFECTO, false);
  const otra = antes.sec !== S.ruta.sec || antes.args.join('/') !== S.ruta.args.join('/');
  if (otra) {
    S.logPage = 1; S.sinRedTodas = false;
    if (S.ruta.args[0] !== antes.args[0]) S.fichaTab = 'tabla';
  }
  $('#buscar-msg').hidden = true;
  render();
  if (otra) window.scrollTo(0, 0);
}

/** Deja la URL al día con el rango y el entorno, sin sumar un paso al historial. */
function anotarEnUrl() {
  try { history.replaceState(null, '', ir(S.ruta.sec, S.ruta.args)); } catch (_) { /* sin historia: igual se cambia */ }
  S.ruta = leerRuta(location.hash);
}

/** Cambia el rango: si llega más atrás de lo que está bajado, se pide de nuevo desde ahí (D-80). */
function cambiarRango(id, anotar = true) {
  S.range = id;
  S.logPage = 1;
  $('#range').value = id;
  if (S.user && S.desdeDia !== null && rangeOf(id).from < S.desdeDia) { S.daysLoaded = false; listen(); }
  if (anotar) { anotarEnUrl(); render(); }
}

function cambiarEntorno(env, anotar = true) {
  S.env = env; S.days = {}; S.daysLoaded = false; S.logPage = 1; S.desdeDia = null;
  $('#env').value = env;
  if (S.user) listen();
  if (anotar) { anotarEnUrl(); render(); }
}

/**
 * Buscar por código o link (D-207): cinco letras o un link propio es una copa, cuatro letras una
 * sala. No se busca por nombre de jugador: juntar todo lo de una persona en una pantalla es
 * seguirla, y el panel mira señales, no personas (D-44).
 */
function buscar(q) {
  const t = String(q || '').trim();
  const msg = $('#buscar-msg');
  if (!t) return;
  const copa = buscarCopa(S.torneos, t);
  if (copa) { location.hash = ir('torneo', [copa.code]); return; }
  if (/^[A-Za-z]{4}$/.test(t)) { location.hash = ir('sala', [t.toUpperCase()]); return; }
  msg.textContent = `No hay una copa ni una sala con «${t}». Una sala tiene 4 letras; una copa, 5 o su link propio.`;
  msg.hidden = false;
}

/**
 * El selector de entornos y de rangos se arman con lo que dice el código, no con lo que
 * alguien escribió en el HTML: un entorno nuevo aparece en el panel el mismo día que empieza a
 * mandar señales (C-16).
 */
function renderControls() {
  $('#env').replaceChildren(...ENV_OPCIONES.map(e => el('option', { value: e, selected: e === S.env ? '' : null }, envLabel(e))));
  $('#range').replaceChildren(...RANGOS.map(r => el('option', { value: r.id, selected: r.id === S.range ? '' : null }, r.etiqueta)));
}
renderControls();
render();

$('#btn-login').addEventListener('click', login);
window.addEventListener('hashchange', alCambiarRuta);
$('#env').addEventListener('change', e => cambiarEntorno(e.target.value));
$('#range').addEventListener('change', e => cambiarRango(e.target.value));
$('#buscar').addEventListener('submit', e => { e.preventDefault(); buscar($('#buscar-q').value); });

// Gancho de solo lectura para pruebas (C-14): permite dibujar con datos sembrados sin entrar.
// `vista` es una ruta (`/torneo/OFICI`) o, como antes, el nombre de una vista (`torneo`).
window.__panel = {
  get state() { return S; },
  seed({ rooms = {}, days = {}, torneos = {}, push = null, uad = null, daysLoaded = true, vista }) {
    stopListening();
    S.rooms = rooms; S.days = days; S.daysLoaded = daysLoaded; S.torneos = torneos; S.torneosLoaded = true; S.push = push;
    if (uad) S.uad = { historia: {}, invitados: {}, rachas: {}, ...uad };
    S.desdeDia = rangeOf(S.range).from;
    showScreen('screen-panel');
    if (vista) {
      const hash = `#${vista}`;
      if (location.hash !== hash) { location.hash = hash; return; }  // `hashchange` dibuja
    }
    alCambiarRuta();
  },
};

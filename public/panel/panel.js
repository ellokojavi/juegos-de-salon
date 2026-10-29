/**
 * Panel del dueño (D-44, D-207): entra con Google, lee las salas vivas, `stats/<env>/days` y las
 * copas de `torneos/`, y dibuja lo que arman `aggregate.js` y `copas.js`.
 *
 * Se navega como un sitio (D-207): cuatro secciones —Ahora, The Cup, Juegos y Audiencia— y una
 * ficha por cada cosa que existe (una copa, un juego, una sala). Toda vista queda en el `#` de la
 * URL (`rutas.js`), así que Atrás, una recarga o un enlace guardado vuelven al mismo lugar. Las
 * horas son las del Pacífico, las mismas con que The Cup parte sus días. English only (D-350): it
 * is not a player screen (exception to C-3, noted in docs/PANEL.md).
 *
 * Nada de acá escribe en la base. Las reglas solo dejan leer al UID del dueño; si la
 * cuenta que entra no es esa, la página lo dice y muestra el UID para ponerlo en las reglas.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  getDatabase, ref, onValue, get, query, orderByChild, orderByKey, startAt, equalTo, set,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { watchRooms, shallowCodes } from './rooms-watch.js';
import { GAMES, SUELTOS, gameById, gameLabel as etiquetaRegistro, isTorneo, MODES, MODE_IDS, ROOM_MODE, modeIcon, isIndividualMode } from '../assets/js/games.js';
import { juegosCopa } from '../cup/rules.js';
import { LANGS } from '../assets/js/i18n.js';
import { ENVS, notCounted, setNotCounted } from '../assets/js/transport/stats.js';
import { UAD_DIAS, UAD_INDICE, historiaDeDias } from '../assets/js/uad-days.js';
import { $, el } from '../assets/js/ui.js';
import { copaDe, copasEnCurso, resumenCopas, bitacoraCopas, fichaCopa, buscarCopa, paisDe, pct, duracion, inicioLabel } from './copas.js';
import {
  DAY, ROOM_TTL, liveRooms, connections, summarize, top, tzLabel, ago, dayOf, codesOfDays, splitByEnv, liveLocal, roomLog,
  paginate, flagOf, whenLabel, horaLabel, fechaLabel, diaPanel, ZONA_PANEL, ZONA_NOMBRE, RANGOS, RANGO_POR_DEFECTO, rangeOf,
  groupDays, periodLabel, localLog, paisesDeSalas, paisesDelRango, salaDe, mediana, idiomasDeSalas, idiomasDelRango, trafico, origenesAgrupados, origenLabel, dayLabel,
  avisosDelRango, AVISO_TIPOS, vueltaAtrasada, unoAlDiaDelRango, salud, TRAMOS, navegadorLabel,
} from './aggregate.js';
import { keyEvents, periods as periodosClave, periodOf, byHour, countKinds, KINDS, pacificRange } from './timeline.js';
import { CAMPAIGNS, ACTIVE as SPLASH_ACTIVE, REGULARS } from '../assets/js/splash.js';
import { TEXTS as SUPPORT_TEXTS } from '../assets/js/support.js';
import { switches, status as campaignStatus, overlaps, move, toRemote, cleanLabel, span, todayOf, dayPlus, campaignStats, supportStats, EARLY_DAYS, skinRows, skinToRemote } from './campaigns.js';
import { TEMPLATES as SKINS } from '../assets/season/templates.js';
import { FLAGS, stateOf as flagState } from '../assets/js/flags.js';
import { SECCIONES, leerRuta, rutaA, rutaEnIngles, seccionDe } from './rutas.js';
import {
  rangoAnterior, variacion, partidasDominio, finales, embudoSalas, dificultad, versiones, versionesEn, usuarios, cohortes,
  senales, ordenTramos, embudoCopas, aCsv,
} from './dominios.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/** El torneo del registro (The Cup): su nombre y su emoji salen de `games.js`, no de acá (C-16). */
const TORNEO = GAMES.find(g => g.torneo) || null;
const ENV_DEFECTO = ENVS[0];
/** The panel is English only (D-350): game and country names in English, numbers in US format. */
const PANEL_LANG = 'en';
const LOCALE = 'en-US';
/** The Cup's games with their English names (D-350). */
const JUEGOS_COPA = juegosCopa(PANEL_LANG);

const S = {
  user: null, env: ENV_DEFECTO, range: RANGO_POR_DEFECTO, ruta: leerRuta(location.hash),
  rooms: {}, days: {}, daysLoaded: false, torneos: {}, torneosLoaded: false, push: null,
  // Cups older than the period, read one by one when opened by code or link (D-473)
  torneosSueltos: {}, renderTimer: null,
  // Uno al día (D-230): la historia de quienes entraron con jugador, las invitaciones y las rachas
  uad: { historia: {}, invitados: {}, rachas: {} },
  // The timeline (D-408): feedback messages, and what is picked in that view
  feedback: {}, unsubFeedback: null,
  // 📣 Campaigns (D-454): Firebase `splash/` (undefined until it answers, null if never saved) and the last save's outcome
  splash: undefined, unsubSplash: null, splashMsg: '',
  // 🧩 Site features and 🎨 skins (D-477): Firebase `controls/` (undefined until it answers), the tab shown and the last save
  controls: undefined, unsubControls: null, flags: undefined, unsubFlags: null, controlsMsg: '', campTab: 'splash', campOpen: new Set(), campPeek: new Set(), campStats: null, tlGrain: null, tlKinds: null, tlPeriod: null, tlAll: false,
  unsubRooms: null, unsubDays: null, unsubTorneos: null, unsubPush: null, unsubUad: [], tick: null,
  // Desde qué día está bajado `days`: un rango más largo obliga a pedir de nuevo, uno más corto no
  desdeDia: null,
  // Lo que se eligió dentro de una vista. No va en la URL: es de esta visita, no del lugar.
  logPage: 1, logSolas: false, filtroAhora: 'todo', filtroCopas: 'todas', fichaTab: 'tabla', sinRedTodas: false, erroresTodos: false,
};
if (S.ruta.r && RANGOS.some(r => r.id === S.ruta.r)) S.range = S.ruta.r;
if (S.ruta.e) S.env = S.ruta.e;

const POR_PAGINA = 20;
const DAY_MS = 86400000;
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
  'auth/operation-not-allowed': 'Google sign-in is not enabled in the Firebase console: Authentication, then Sign-in method. It is done once.',
  'auth/unauthorized-domain': 'This domain is not in the project\'s Authorized domains list: Authentication, then Settings. Add it once.',
  'auth/network-request-failed': 'Could not reach Firebase. It may be your connection or the service is having problems. Try again in a few minutes.',
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
    $('#login-msg').textContent = LOGIN_ERRORES[code] || `Could not sign in (${code || e?.message || 'error'}).`;
  }
}

function renderUser() {
  const slot = $('#user-slot'); slot.innerHTML = '';
  if (!S.user) return;
  slot.append(el('span', { class: 'user' },
    S.user.photoURL ? el('img', { src: S.user.photoURL, alt: '', referrerpolicy: 'no-referrer' }) : null,
    el('button', { onClick: () => signOut(auth) }, 'Sign out'),
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
  $('#login-msg').textContent = 'You are signed in, but this account cannot read the panel.';
  $('#uid-help').hidden = false;
}

function stopListening() {
  S.listenGen = (S.listenGen || 0) + 1; // a pending read of the Uno al día index attaches nothing (D-475)
  if (S.unsubRooms) { S.unsubRooms(); S.unsubRooms = null; }
  if (S.unsubDays) { S.unsubDays(); S.unsubDays = null; }
  if (S.unsubTorneos) { S.unsubTorneos(); S.unsubTorneos = null; }
  if (S.unsubPush) { S.unsubPush(); S.unsubPush = null; }
  if (S.unsubFeedback) { S.unsubFeedback(); S.unsubFeedback = null; }
  if (S.unsubSplash) { S.unsubSplash(); S.unsubSplash = null; }
  if (S.unsubControls) { S.unsubControls(); S.unsubControls = null; }
  if (S.unsubFlags) { S.unsubFlags(); S.unsubFlags = null; }
  for (const f of S.unsubUad) f();
  S.unsubUad = [];
  if (S.tick) { clearInterval(S.tick); S.tick = null; }
}

function listen() {
  stopListening();
  // The rooms without their messages: each one keeps its own counters (D-474). Updates still
  // redraw the panel at most once a second (D-473).
  S.unsubRooms = watchRooms({
    fb: { db, ref, onValue },
    codes: async () => shallowCodes(firebaseConfig.databaseURL, await auth.currentUser.getIdToken()),
    since: () => Date.now() - ROOM_TTL,
    onChange: rooms => { S.rooms = rooms; renderSoon(); },
    onError: denied,
  });
  // Se baja solo hasta donde llega el rango elegido y nunca menos de lo que ya estaba bajado
  // (D-80): mirar un año son 365 días de registros, y no hay por qué pagarlos mientras se
  // mira la semana. Cambiar a un rango más corto no vuelve a pedir nada.
  // And the period before it, so every number can say how it changed (D-348)
  const desde = Math.min(rangoAnterior(rangeOf(S.range)).from, S.desdeDia ?? Infinity);
  S.desdeDia = desde;
  S.unsubDays = onValue(query(ref(db, `stats/${S.env}/days`), orderByKey(), startAt(String(desde))), snap => { S.days = snap.val() || {}; S.daysLoaded = true; render(); }, denied);
  // The cups that were still alive on the first day loaded (D-473): every number of a period
  // (and of the one before it) only looks at cups that ended on or after its first day, so the
  // older ones, which only grow in number, are not downloaded. Two days of margin for the
  // Pacific-time timeline. A cup opened by its code or link is read on its own (`copaSuelta`).
  // Each result still arrives as a delta, so "playing now" and the table move on their own.
  const desdeMs = (desde - 2) * DAY_MS;
  S.unsubTorneos = onValue(query(ref(db, 'torneos'), orderByChild('meta/end'), startAt(desdeMs)), snap => { S.torneos = { ...S.torneosSueltos, ...(snap.val() || {}) }; S.torneosLoaded = true; render(); }, denied);
  // Lo que deja notify.mjs en cada vuelta: la hora y las suscripciones vivas (D-233)
  S.unsubPush = onValue(ref(db, `stats/${S.env}/push`), snap => { S.push = snap.val() || {}; render(); }, denied);
  // Uno al día (D-230): son de todos los entornos (la historia vive fuera de stats/). Sin permiso
  // (reglas viejas), queda vacío y el resto del panel sigue
  // The history comes from the index by day (D-475), from the first day loaded on, once the migration
  // marked it complete (`unoAlDiaIndice`); before that, the whole history, as before
  const vuelta = (S.listenGen = (S.listenGen || 0) + 1);
  get(ref(db, UAD_INDICE)).then(m => {
    if (S.listenGen !== vuelta) return; // a newer listen() took over
    const h = m.exists()
      ? onValue(query(ref(db, UAD_DIAS), orderByKey(), startAt(String(desde))), snap => { S.uad = { ...S.uad, historia: historiaDeDias(snap.val() || {}) }; render(); }, () => {})
      : onValue(ref(db, 'unoAlDia'), snap => { S.uad = { ...S.uad, historia: snap.val() || {} }; render(); }, () => {});
    S.unsubUad.push(h);
  }).catch(() => {});
  for (const [clave, ruta] of [['invitados', 'invitados'], ['rachas', 'records/uno-al-dia-racha/siempre']]) {
    S.unsubUad.push(onValue(ref(db, ruta), snap => { S.uad = { ...S.uad, [clave]: snap.val() || {} }; render(); }, () => {}));
  }
  // Feedback for the timeline (D-408): the 🐞 reports and the inbox at the end of every game
  // Only the messages from the first day loaded on (D-473): the timeline is the only one that reads them
  S.unsubFeedback = onValue(query(ref(db, 'feedback'), orderByChild('at'), startAt(desdeMs)), snap => { S.feedback = snap.val() || {}; render(); }, () => {});
  // 📣 Campaigns (D-454): the switches the home page reads
  S.unsubSplash = onValue(ref(db, 'splash'), snap => { S.splash = snap.val(); render(); }, () => { S.splash = null; });
  S.unsubControls = onValue(ref(db, 'controls'), snap => { S.controls = snap.val() || {}; render(); }, () => { S.controls = {}; });
  S.unsubFlags = onValue(ref(db, 'flags'), snap => { S.flags = snap.val() || {}; render(); }, () => { S.flags = {}; });
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
const ENV_VIEJOS = { lab: 'Lab' };                    // went away with the lab (D-67)
const ENV_NOMBRE = { prod: 'Live', dev: 'Local tests', owner: 'My devices', ...ENV_VIEJOS };
const envLabel = env => ENV_NOMBRE[env] || env;
const ENV_OPCIONES = [...ENVS, ...Object.keys(ENV_VIEJOS).filter(e => !ENVS.includes(e))];

/**
 * A language with its English name (D-350). Se lo pregunta al navegador en vez de mantener una
 * tabla: un idioma nuevo en `i18n.js` aparece nombrado sin tocar el panel.
 */
const nombreDeIdioma = (() => {
  let dn = null;
  try { dn = new Intl.DisplayNames([PANEL_LANG], { type: 'language' }); } catch (_) { /* nada */ }
  return code => {
    if (code === 'desconocido') return 'No language';
    let nombre = '';
    try { nombre = dn?.of(code) || ''; } catch (_) { /* clave rara: se muestra tal cual */ }
    if (!nombre || nombre === code) return code;
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  };
})();

/** A country with its English name, also asked of the browser. */
const nombreDePais = (() => {
  let dn = null;
  try { dn = new Intl.DisplayNames([PANEL_LANG], { type: 'region' }); } catch (_) { /* nada */ }
  return co => { if (!co || co === 'desconocido') return 'Unknown country'; try { return dn?.of(co) || co; } catch (_) { return co; } };
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
// A cup game may come with its variant, 'pintaminas:hard' (D-331): "🖌️ Pintaminas · ⚡ Difícil"
const miniLabel = x => {
  const [id, v] = String(x || '?').split(':');
  const J = JUEGOS_COPA[id];
  if (!J) return String(x || '?');
  return `${J.emoji} ${J.nombre}${v ? ` · ${J.variantes?.[v]?.nombre || v}` : ''}`;
};
const miniEmoji = id => JUEGOS_COPA[String(id).split(':')[0]]?.emoji || '·';
const esJuego = id => !isTorneo(id);
const torneoNombre = TORNEO ? TORNEO.name[PANEL_LANG] || TORNEO.name.es : 'the tournament';
const torneoLabel = TORNEO ? gameLabel(TORNEO.id) : '🏆 Tournament';

/**
 * El nombre de un juego con su emoji. Un juego de The Cup jugado suelto (Conexiones, Toque y Fama:
 * Palabra…) manda su id de la copa; está en el registro de sueltos o en el de la copa, no en el de
 * juegos, y antes salía con su clave cruda (`letras`). Uno que no está en ninguno, por su id (C-16).
 */
function gameLabel(id) {
  if (gameById(id)) return etiquetaRegistro(id, PANEL_LANG);
  const s = SUELTOS.find(x => x.id === id);
  if (s) return `${s.emoji} ${s.name[PANEL_LANG] || s.name.es}`;
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

const n = v => Number(v || 0).toLocaleString(LOCALE);
/**
 * Lo que pasó en una sala, con nombre completo (D-138): las jugadas de las personas por un lado
 * y el chat por otro. "176 msjs" se leía como conversación y eran disparos.
 */
const jugadasDe = k => (k === 0 ? 'No moves yet' : k === 1 ? '1 move' : `${n(k)} moves`);
const chatDe = k => (k === 0 ? 'No chat' : k === 1 ? '1 chat message' : `${n(k)} chat messages`);
const minutos = ms => { const m = Math.round(ms / 60000); return m < 1 ? 'under 1 min' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };

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
  return ls.length ? el('span', { class: 'idioma', title: `Played in ${ls.map(nombreDeIdioma).join(' and ')}` }, ls.map(l => l.toUpperCase()).join(' · ')) : null;
};

/** Una cifra. Si lleva `href` u `onClick`, se abre en la lista que la suma: toda cifra se puede revisar. */
function tile(value, label, { hot = false, href = null, onClick = null, pressed = null, info = '', cambio, menosEsMejor = false } = {}) {
  const hijos = [el('b', {}, typeof value === 'string' ? value : n(value)), el('small', {}, label), cambio === undefined ? null : marcaCambio(cambio, menosEsMejor), info ? el('span', { class: 'i' }, info) : null];
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

function lista(rows, emptyText = 'Nothing yet.', cls = 'rooms') {
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
const migas = (...pasos) => el('nav', { class: 'migas', 'aria-label': 'You are in' },
  ...pasos.flatMap(([l, sec, args], i) => [i ? el('span', { 'aria-hidden': 'true' }, ' › ') : null, sec ? enlace(sec, args || [], {}, l) : el('span', {}, l)]));

/** Pares dato–valor de la cabecera de una ficha. */
const datos = pares => el('dl', { class: 'datos' }, ...pares.filter(Boolean).map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v ?? '—'))));

/* ------------------------------------------------------------------ */
/* Reading a number (D-348): change, bands, versions and CSV           */
/* ------------------------------------------------------------------ */

/** "▲ 12 % vs. the period before", green when it improves and pink when it worsens. */
function marcaCambio(c, menosEsMejor = false) {
  if (c === null) return el('span', { class: 'cambio' }, 'new in the period');
  if (c === 0) return el('span', { class: 'cambio' }, '= previous period');
  const mejor = menosEsMejor ? c < 0 : c > 0;
  return el('span', { class: `cambio ${mejor ? 'cambio--bien' : 'cambio--mal'}` }, `${c > 0 ? '▲' : '▼'} ${Math.abs(c)} % vs. previous period`);
}

/** The three bands of every domain: operational, tactical, strategic (D-348). */
const FRANJAS = {
  pulso: ['🩺 Pulse', 'operational: how today and the range are going, against the previous period'],
  diag: ['🔍 Diagnosis', 'tactical: where to look to adjust a game, a text or a notification'],
  tend: ['🧭 Trend', 'strategic: where it is heading, by week or month; pick 90 days or more'],
};
const franja = k => el('div', { class: 'franja' }, el('h3', {}, FRANJAS[k][0]), el('small', {}, FRANJAS[k][1]));

/** Downloads rows as a CSV named after the block and the range. */
function descargarCsv(nombre, filas) {
  const blob = new Blob([aCsv(filas)], { type: 'text/csv;charset=utf-8' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `panel-${nombre}-${S.range}.csv` });
  document.body.append(a); a.click(); a.remove();
}
/** A block with its "⬇︎ CSV" button: every table of the panel can leave it (D-348). */
const conCsv = (nodo, nombre, filas) => {
  if (filas?.length) nodo.append(el('button', { type: 'button', class: 'btn btn--ghost btn--sm csv', onClick: () => descargarCsv(nombre, typeof filas === 'function' ? filas() : filas) }, '⬇︎ CSV'));
  return nodo;
};

/** The versions that first showed up in a period, for its bar (D-348): "we changed X" next to "Y happened". */
let MARCAS = [];
const subVersion = (d, grano) => {
  const hasta = grano === 'mes' ? d.day + 30 : grano === 'semana' ? d.day + 6 : d.day;
  const vs = versionesEn(MARCAS, d.day, hasta);
  return vs.length ? `🚀 ${vs.length > 2 ? `${vs[0]} … ${vs.at(-1)}` : vs.join(', ')}` : '';
};

/** A timeline: one bar per period with its segments and the versions that came out in it. */
function serie(titulo, nota, byDay, rango, campos, nombre) {
  const periodos = groupDays(byDay, rango.grano);
  const max = Math.max(0, ...periodos.map(d => campos.reduce((k, [c]) => k + (d[c] || 0), 0)));
  const nodo = bloque(titulo, `${nota ? `${nota} ` : ''}🚀 marks the versions released in that period.${rango.grano === 'semana' ? ' The date is the Monday of each week.' : ''}`,
    lista(periodos.map(d => bar(d.label, campos.map(([c, color]) => seg(color, d[c] || 0)), max, { sub: subVersion(d, rango.grano) })), 'Nothing yet.', 'bars'));
  return conCsv(nodo, nombre, periodos.map(({ label, day, ...x }) => ({ periodo: label, ...x })));
}

/** El título del rango, con "cargando" mientras falta algo: un año a medio bajar no es un año vacío (C-14). */
function tituloRango() {
  const rango = rangeOf(S.range);
  const falta = S.daysLoaded && S.desdeDia !== null && rango.from < S.desdeDia;
  return rango.titulo + (S.daysLoaded && !falta && S.torneosLoaded ? '' : ' · loading…');
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
      r.lastPlayAt ? `last move ${ago(r.lastPlayAt, now)}` : `activity ${ago(r.lastAt, now)}`, el('br'), `created ${ago(r.createdAt, now)}`),
  );
}

/**
 * Una partida sin red que se está jugando (D-140): el juego, el modo con su nombre completo,
 * cuántos juegan en ese celular, de qué país es y, si la app lo sabe, quién juega (D-210).
 */
function filaSinRed(p, now) {
  const modo = MODES[p.mode] ? `${modeIcon(p.mode)} ${MODES[p.mode].label}` : p.mode;
  const cuantos = p.n === 1 ? '1 player' : `${n(p.n)} players`;
  return enlace('juego', [p.game], { class: 'room active' },
    el('div', { class: 'code' }, emojiJuego(p.game)),
    el('div', { class: 'cuerpo' },
      el('div', { class: 'cname' }, nombreJuego(p.game)),
      // Quién juega, si la app lo sabe (D-210); si no, solo su bandera
      el('div', { class: 'who' }, el('span', {}, el('i', { class: 'on' }), p.name ? quien(p.name, p.co) : ['no name', bandera(p.co)])),
      el('div', { class: 'sub' }, `${modo} · ${cuantos} `, idiomaTag(p.lang))),
    el('div', { class: 'meta' }, `started ${ago(p.at, now)}`, el('br'), `last signal ${ago(p.beat, now)}`),
  );
}

/**
 * Una copa en curso: en qué día va, qué juego toca, quién ya lo jugó (✓) y quién lo está
 * jugando en este momento (punto verde). Se abre en su ficha.
 */
function filaCopa(c, now) {
  const hoy = c.hoy;
  const enCurso = c.estado === 'en-curso';
  const cuando = enCurso ? `Day ${c.dia} of ${c.days}: ${miniLabel(hoy.juego)}` : `Starts ${inicioLabel(c.start)}, ${c.days} days`;
  const atrasados = c.jugando.filter(x => !hoy || x.dia !== hoy.dia);
  const gente = hoy
    ? hoy.jugadores.map(j => el('span', { class: j.jugo ? 'ok' : '', title: j.jugo ? 'Already played today\'s' : j.jugando ? 'Playing it now' : 'Has not played it yet' },
      el('i', { class: j.jugando ? 'on' : '' }), quien(j.name, j.co), j.jugo ? ' ✓' : ''))
    : [el('span', {}, `${n(c.jugadores)} ${c.jugadores === 1 ? 'player signed up' : 'players signed up'}`)];
  return enlace('torneo', [c.code], { class: `room copa${c.jugando.length ? ' active' : ''}` },
    el('div', {}, el('div', { class: 'code' }, c.code), c.alias ? el('div', { class: 'meta', style: 'text-align:left' }, `/${c.alias}`) : null),
    el('div', { class: 'cuerpo' },
      el('div', { class: 'cname' }, c.name, ' ', idiomaTag(c.lang), c.lab ? el('span', { class: 'tag', title: 'Created from the lab: its admin can fast-forward the days to test' }, 'lab') : null),
      el('div', { class: 'sub' }, cuando),
      el('div', { class: 'who' }, ...gente),
      atrasados.length ? el('div', { class: 'sub' }, 'Playing an earlier day now: ', ...atrasados.flatMap((x, i) => [i ? ', ' : '', quien(x.name, x.co), ` (day ${x.dia}, ${miniLabel(x.juego)})`])) : null,
    ),
    el('div', { class: 'meta' },
      hoy ? `${hoy.jugaron} of ${hoy.jugadores.length} played` : (c.inscripcion ? 'sign-up open' : 'sign-up closed'), el('br'),
      c.ultimo ? `last result ${ago(c.ultimo, now)}` : 'no results', el('br'),
      c.primero ? ['leading: ', quien(c.primero.name, c.primero.co), `${c.primero.empatados > 1 ? ` and ${c.primero.empatados - 1} more` : ''} (${n(c.primero.total)})`] : '',
    ),
  );
}

const estadoTexto = c => (c.estado === 'terminada' ? (c.fin ? 'ended early' : 'finished') : c.estado === 'por-empezar' ? 'not started' : `day ${c.dia} of ${c.days}`);

/** Una copa del rango en la lista de The Cup: cuándo, cuánta gente, cuánto se jugó y quién gana. */
function filaCopaLog(c) {
  const p = pct(c.participacion);
  const otros = c.primero?.empatados > 1 ? ` and ${c.primero.empatados - 1} more` : '';
  const quienVa = !c.primero ? el('span', { class: 'none' }, '—')
    : c.estado === 'terminada' ? el('span', { class: 'won' }, '🏆 ', quien(c.primero.name, c.primero.co), otros)
      : el('span', { class: 'va', title: 'Leading the standings' }, '▲ ', quien(c.primero.name, c.primero.co), otros);
  return enlace('torneo', [c.code], { class: 'log-row' },
    el('div', { class: 'when' }, inicioLabel(c.start), el('br'), el('span', { class: 'code' }, c.code)),
    el('div', { class: 'game' }, c.name, ' ', idiomaTag(c.lang), c.lab ? el('span', { class: 'tag' }, 'lab') : null),
    el('div', { class: 'who' },
      el('span', { class: 'q' }, estadoTexto(c)),
      el('span', { class: 'q' }, `${n(c.jugadores)} ${c.jugadores === 1 ? 'player' : 'players'}`),
      el('span', { class: 'q', title: 'Games played out of those that could be played, on days already closed' }, p === null ? 'no closed days' : `participation ${p}%`),
    ),
    el('div', { class: 'win' }, quienVa),
  );
}

/** Una sala jugada en la bitácora (D-79): cuándo, quiénes con su bandera, qué juego y quién ganó. */
function filaSalaLog(f) {
  const ganador = f.winner ? el('span', { class: 'won' }, '🏆 ', quien(f.winnerName, f.players.find(p => p.role === f.winner)?.co))
    : f.empate ? el('span', { class: 'tie' }, '🤝 Tie')
      : el('span', { class: 'none', title: 'This room ended with no record of who won' }, '—');
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
  const resultado = !fin ? el('span', { class: 'none', title: 'It did not reach the end, or it predates recording that (D-210)' }, `at least ${minutos(p.minMs)}`)
    : fin.empate ? el('span', { class: 'tie' }, '🤝 Tie')
      : fin.ganador ? el('span', { class: 'won' }, '🏆 ', quien(fin.ganador, p.co))
        : el('span', { class: 'va' }, '✓ finished');
  return el('div', { class: 'log-row', 'data-mode': p.mode || '' },
    el('div', { class: 'when' }, whenLabel(p.at), p.v ? [el('br'), `v${p.v}`] : null),
    el('div', { class: 'game' }, conJuego ? [gameLabel(p.game), ' ', idiomaTag(p.lang), el('br')] : null, el('small', {}, modo, conJuego ? null : [' ', idiomaTag(p.lang)])),
    el('div', { class: 'who' },
      el('span', { class: 'q' }, p.name ? quien(p.name, p.co) : ['no name', bandera(p.co)]),
      p.n > 1 && !p.name ? el('span', { class: 'q' }, `${n(p.n)} players`) : null,
      fin?.detalle ? el('span', { class: 'q' }, fin.detalle) : null,
      fin ? el('span', { class: 'q' }, `lasted ${minutos(p.minMs)}`) : null),
    el('div', { class: 'win' }, resultado));
}

/** El paginado de una lista: anterior, cuántas y siguiente. */
function paginado(page, pages, desde, cuantas, total, nombre, cambiar) {
  if (!total) return null;
  return el('div', { class: 'pager' },
    el('button', { class: 'btn btn--ghost btn--sm', disabled: page <= 1, onClick: () => cambiar(page - 1) }, '‹ Previous'),
    el('span', { class: 'muted small' }, `${desde + 1}–${Math.min(desde + cuantas, total)} of ${n(total)} ${nombre(total)}`),
    el('button', { class: 'btn btn--ghost btn--sm', disabled: page >= pages, onClick: () => cambiar(page + 1) }, 'Next ›'),
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
    tile(active.length, `rooms in play · ${n(live.length)} alive`, { hot: active.length > 0, onClick: filtrar('sala'), pressed: S.filtroAhora === 'sala', info: 'see which' }),
    tile(sinRed.length, 'offline games now', { hot: sinRed.length > 0, onClick: filtrar('sinred'), pressed: S.filtroAhora === 'sinred', info: 'see which' }),
    tile(enCurso.length, `cups in progress · ${n(jugandoMini)} playing a cup game`, { hot: jugandoMini > 0, onClick: filtrar('torneo'), pressed: S.filtroAhora === 'torneo', info: 'see which' }),
    tile(connections(live), 'phones connected', { info: 'free plan cap: ~100' }),
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
  const vacio = cargando ? 'Loading…' : { todo: 'Nothing is in play right now.', torneo: 'No cups in progress.', sala: 'No rooms alive right now.', sinred: 'Nobody is playing offline right now.' }[S.filtroAhora];

  const enJuego = bloque('In play', 'From the most recent signal to the quietest. In cups, ✓ is who already played today\'s game and the green dot who is playing it. In rooms, the green dot is who is connected; a room shows for up to half an hour without activity.',
    filtros([['todo', `All · ${items.length}`], ['torneo', `Cups · ${cuantos('torneo')}`], ['sala', `Rooms · ${cuantos('sala')}`], ['sinred', `Offline · ${cuantos('sinred')}`]], S.filtroAhora, v => { S.filtroAhora = v; render(); }, 'What to show'),
    lista(visibles.map(x => x.fila), vacio));
  // Nunca esconder en silencio: una sala puede quedar fuera por ser de otro entorno, pero
  // también porque su registro de señales falló, que es mejor esfuerzo y falla callado (C-14).
  if (ajenas.length && (S.filtroAhora === 'todo' || S.filtroAhora === 'sala')) {
    const una = ajenas.length === 1;
    enJuego.append(el('p', { class: 'empty', style: 'margin-top:8px' },
      `${una ? 'There is an open room that is not' : `There are ${n(ajenas.length)} open rooms that are not`} from ${envLabel(S.env)}, so ${una ? 'it is' : 'they are'} not counted here: ${ajenas.map(r => r.code).join(', ')}. `
      + 'They are usually test games played on the computer, on the home network or over Tailscale, and they delete themselves after half an hour idle.'));
  }

  return [
    ...titulo('Now', 'What is being played right now. It does not depend on the range and updates itself.'),
    tiles, enJuego,
    porEmpezar.length ? bloque('Not started', 'Cups that have not started yet.', lista(porEmpezar.map(c => filaCopa(c, now)))) : null,
  ];
}

/* ------------------------------------------------------------------ */
/* The Cup                                                             */
/* ------------------------------------------------------------------ */
/** Barras por idioma, en el orden de la app y con su nombre (D-211). */
function porIdioma(titulo, nota, cuenta) {
  const pares = ordenIdiomas(Object.entries(cuenta || {}).filter(([, v]) => v > 0));
  const max = Math.max(0, ...pares.map(([, v]) => v));
  return bloque(titulo, nota, lista(pares.map(([k, v]) => bar(`${k.toUpperCase()} · ${nombreDeIdioma(k)}`, [seg(C_IDIOMA, v)], max)), 'Nothing yet.', 'bars'));
}

function vistaCopa(now) {
  const rango = rangeOf(S.range);
  const rc = resumenCopas(S.torneos, rango, now);
  const part = pct(rc.participacion);
  const cargando = S.torneosLoaded ? null : 'Loading the cups…';

  const todas = bitacoraCopas(S.torneos, rango, now);
  const ESTADOS = [['todas', 'All'], ['en-curso', 'In progress'], ['por-empezar', 'Not started'], ['terminada', 'Finished'], ['lab', 'Lab']];
  const es = (c, v) => v === 'todas' || (v === 'lab' ? c.lab : c.estado === v);
  const periodosM = groupDays(rc.porDia, rango.grano);
  const maxM = Math.max(0, ...rc.porJuego.map(m => m.jugadas + m.abandonos));
  const maxMD = Math.max(0, ...periodosM.map(d => d.total));
  const verTodas = () => { S.filtroCopas = 'todas'; render(); };
  // The period before and the funnel (D-348); who was left out of a cup (D-347)
  const rca = resumenCopas(S.torneos, rangoAnterior(rango), now);
  const ec = embudoCopas(S.torneos, rango, now);
  const pasos = [['Created', ec.creadas], ['With 2 or more players', ec.conGente], ['Started', ec.partieron], ['Finished with 2 or more', ec.terminadas]];
  const maxDia = Math.max(0, ...ec.porDia.map(d => d.esperado));

  return [
    ...titulo(`${torneoLabel} · ${tituloRango()}`, 'The cups that were open in the range, test ones included: they are not split by environment.'),
    franja('pulso'),
    el('div', { class: 'tiles' },
      tile(rc.copas, 'active cups', { onClick: verTodas, cambio: variacion(rc.copas, rca.copas) }),
      tile(rc.nuevas, 'new cups', { cambio: variacion(rc.nuevas, rca.nuevas) }),
      tile(rc.inscripciones, 'players signed up'),
      tile(rc.jugadas, 'games played', { cambio: variacion(rc.jugadas, rca.jugadas) }),
      tile(part === null ? '—' : `${part}%`, 'participation', { info: 'played out of those that could be played, on closed days' }),
      tile(rc.abandonos, 'games left unfinished'),
    ),
    franja('diag'),
    el('div', { class: 'grid2' },
      conCsv(bloque('Cups, step by step', `Of the cups created in the range. Median size: ${ec.tamano ?? '—'} players. Left out for missing 2 days in a row: ${n(ec.fuera)}; brought back by the admin: ${n(ec.devueltos)} (D-347).`,
        lista(pasos.map(([l, v]) => bar(l, [seg(C_TORNEO, v)], ec.creadas, { detail: ec.creadas ? `${pctTxt(pctDe(v, ec.creadas))} of those created` : '' })), 'No cups created in this range.', 'bars')),
        'torneo-embudo', pasos.map(([paso, copas]) => ({ paso, copas }))),
      conCsv(bloque('Participation by cup day', 'On closed days: how many played (pink) out of those who could. Where it drops is where people fall off.',
        lista(ec.porDia.map(d => bar(`Day ${d.dia}`, [seg(C_TORNEO, d.jugado), seg('rgba(255,255,255,0.25)', d.esperado - d.jugado)], maxDia, { cifra: d.jugado, detail: pctTxt(pctDe(d.jugado, d.esperado)) })), 'No closed days yet.', 'bars')),
        'torneo-participacion', ec.porDia),
    ),
    bloqueAvisos(rango, now),
    porIdioma('Cups by language', 'The language chosen by whoever created the cup: everyone plays it in that language.', todas.reduce((m, c) => ({ ...m, [c.lang]: (m[c.lang] || 0) + 1 }), {})),
    bloque('Cups', 'Newest to oldest. Tap one to see its standings, each day and its history.',
      filtros(ESTADOS.map(([v, l]) => [v, `${l} · ${todas.filter(c => es(c, v)).length}`]), S.filtroCopas, v => { S.filtroCopas = v; render(); }, 'Which cups to show'),
      lista(todas.filter(c => es(c, S.filtroCopas)).map(filaCopaLog), cargando || 'No such cups in this range.', 'log')),
    bloque('By game', 'Games finished in the range and, in grey, those someone started and left unfinished. The typical time is the median: someone leaving the phone on for half an hour does not move it.',
      lista(rc.porJuego.map(m => bar(miniLabel(m.id), [seg(C_TORNEO, m.jugadas), seg('rgba(255,255,255,0.25)', m.abandonos)], maxM, {
        cifra: m.jugadas,
        detail: [
          m.promedio === null ? null : `average score ${m.promedio}/100`,
          m.medianaMs ? `typical time ${duracion(m.medianaMs)}` : null,
          m.abandonos ? `${n(m.abandonos)} unfinished` : null,
          `in ${n(m.copas)} cup${m.copas === 1 ? '' : 's'}`,
        ].filter(Boolean).join(' · '),
      })), cargando || 'No games played in this range.', 'bars')),
    bloque({ dia: 'Games per day', semana: 'Games per week', mes: 'Games per month' }[rango.grano], `UTC days.${rango.grano === 'semana' ? ' The date is the Monday of each week.' : ''}`,
      lista(periodosM.map(d => bar(d.label, [seg(C_TORNEO, d.total)], maxMD)), 'Nothing yet.', 'bars')),
  ];
}

const AVISO_LABEL = {
  dia: '📅 The day opened', plazo: '⏳ Time is running out', final: '🏁 The Grand Final', fin: '🥇 The cup ended',
  insc: '✍️ Someone signed up (to the admin)', copas: '🎲 Days of several cups', prueba: '🧪 Test',
  // Uno al día (D-230)
  uaddia: '📅 One a Day: today\'s is out', uadracha: '🔥 One a Day: streak about to break', uadsemana: '📊 One a Day: your week', uadadios: '👋 One a Day: 30 days without playing',
};
const PWA_LABEL = { android: 'Android', ios: 'iPhone / iPad', otro: 'Other (computer)' };

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
  return bloque('🔔 Push notifications',
    'GitHub sends them every 15 minutes. Sent: those the phone\'s push service accepted. Tapped: those that opened the app from the notification. In the bars, pink is tapped; cyan, sent and not tapped. UTC days.',
    el('div', { class: 'tiles' },
      tile(p.vivas ?? '—', 'phones with notifications', { info: 'live subscriptions in the last run' }),
      tile(a.totalMandados, 'notifications sent'),
      tile(porcentaje(a.totalTocados, a.totalMandados), `tapped · ${n(a.totalTocados)}`),
      tile(a.totalPwa, 'installed app opens'),
      tile(p.vuelta ? horaLabel(p.vuelta) : '—', `last run${p.vuelta ? ` · ${ago(p.vuelta, now)}` : ''}${atrasada ? ' · did the workflow turn off?' : ''}`, { hot: atrasada, info: atrasada ? 'GitHub disables scheduled workflows after 60 days without commits' : '' }),
    ),
    el('div', { class: 'grid2' },
      el('div', {}, el('h3', { class: 'small' }, 'By type'),
        lista(tipos.map(k => bar(AVISO_LABEL[k] || k, [seg(C_TORNEO, a.tocados[k] || 0), seg(C_TOTAL, Math.max(0, (a.mandados[k] || 0) - (a.tocados[k] || 0)))], maxT, {
          cifra: a.mandados[k] || 0,
          detail: `${n(a.mandados[k] || 0)} sent · ${n(a.tocados[k] || 0)} tapped`,
        })), 'No notifications in this range.', 'bars')),
      el('div', {}, el('h3', { class: 'small' }, 'Installed app'),
        lista(pwa.map(([k, v]) => bar(PWA_LABEL[k] || k, [seg(C_IDIOMA, v)], maxP)), 'Nobody opened it from the icon in this range.', 'bars'))));
}

/** Una casilla de la grilla jugador × día de una copa. */
function casillaCelda(c) {
  const x2 = c.x2 ? el('small', { class: 'x2', title: c.comodin ? 'Wildcard day: counts double' : 'The final counts double' }, c.comodin ? '🃏 ×2' : '×2') : null;
  switch (c.tipo) {
    case 'jugo': return el('td', { class: 'c-jugo', title: `${c.s} of 100 in ${duracion(c.ms)}${c.pts !== null ? `, ${c.pts} points in the standings` : ''}` },
      el('b', {}, c.s), el('small', {}, duracion(c.ms)), c.pts !== null ? el('small', {}, `+${c.pts}`) : null, x2);
    case 'jugando': return el('td', { class: 'c-jugando', title: `Playing it: started at ${horaLabel(c.desde)}` }, '● playing', x2);
    case 'sin-terminar': return el('td', { class: 'c-sin', title: `Started at ${horaLabel(c.desde)} and did not finish` }, 'unfinished', x2);
    case 'abierto': return el('td', { class: 'c-abierto', title: 'The day is open and they have not started it yet' }, '…', x2);
    case 'no-jugo': return el('td', { class: 'c-no', title: 'The day closed without them playing it' }, '✗', x2);
    case 'no-debia': return el('td', { class: 'c-nada', title: 'Signed up after this day closed' }, '—');
    case 'anulado': return el('td', { class: 'c-nada', title: 'The admin ended the cup before this day' }, 'voided');
    default: return el('td', { class: 'c-futuro', title: 'Not open yet' }, '·', x2);
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
    e.tipo === 'abrio' ? `plays ${miniLabel(e.juego)}` : e.juego && e.tipo !== 'cerro' ? miniLabel(e.juego) : null,
    e.tipo === 'termino' ? `${e.s} of 100 in ${duracion(e.ms)}` : null,
  ].filter(Boolean).join(' · ');
  return el('div', { class: 'evento' },
    el('span', { class: 'hora' }, e.at ? horaLabel(e.at) : '—'),
    el('span', { class: 'ico', 'aria-hidden': 'true' }, ICONO_EVENTO[e.tipo] || '·'),
    el('span', { class: 'que' }, ...texto, detalle ? el('small', {}, detalle) : null));
}

/** La ficha de una copa: cabecera, tabla, cada día y su historia. */
function vistaFichaCopa(code, now) {
  if (!S.torneosLoaded) return [migas([torneoLabel, 'torneo'], [code]), el('p', { class: 'empty' }, 'Loading the cups…')];
  const L = copaDe(code, S.torneos[code]);
  // Not in the period: read it on its own, once (D-473)
  if (!L && !(code in S.torneosSueltos) && S.user) {
    S.torneosSueltos[code] = null;
    copaSuelta(code).then(render);
    return [migas([torneoLabel, 'torneo'], [code]), el('p', { class: 'empty' }, 'Loading the cup…')];
  }
  if (!L) return [migas([torneoLabel, 'torneo'], [code]), ...titulo(code), el('p', { class: 'empty' }, `There is no cup with code ${code}. It may have been deleted.`)];
  const f = fichaCopa(L, now);
  const m = L.meta;
  const inscripcion = f.closed ? 'closed by the admin' : f.inscripcion ? `open until ${whenLabel(f.joinUntil ?? m.win[m.days].a)}` : 'closed';
  const cierra = f.abiertos.length ? f.abiertos.map(d => `day ${d}: ${whenLabel(m.win[d].b)}`).join(' · ') : null;
  // Una copa en alemán parte sus días a medianoche de Berlín: se dice, para que la hora del Pacífico no confunda
  const otraZona = m.tz && m.tz !== ZONA_PANEL ? ` · its days follow the time in ${tzLabel(m.tz.replace(/\//g, '__')).city}` : '';

  const cabecera = [
    migas([torneoLabel, 'torneo'], [f.name]),
    el('div', { class: 'ficha-titulo' },
      el('h2', { class: 'display display--md' }, code),
      el('span', { class: `estado estado--${f.estado}` }, estadoTexto(f)),
      f.lab ? el('span', { class: 'tag' }, 'lab') : null),
    datos([
      ['Name', f.name],
      ['Own link', f.alias ? `/${f.alias}` : null],
      ['Admin', quien(f.admin.name, f.admin.co)],
      ['Language', nombreDeIdioma(f.lang)],
      f.aud ? ['Audience', f.aud] : null,
      ['Days', `${f.days}, from ${inicioLabel(f.start)}${otraZona}`],
      ['Created', f.createdAt ? whenLabel(f.createdAt) : null],
      cierra ? ['Closes', cierra] : null,
      [f.estado === 'terminada' ? 'Ended' : 'Ends', whenLabel(m.end)],
      ['Sign-up', inscripcion],
      ['Players', [`${f.jugadores}`, ...(f.retirados.length ? [' · withdrawn: ', ...f.retirados.flatMap((r, i) => [i ? ', ' : '', quien(r.name, r.co)])] : [])]],
    ]),
    el('a', { class: 'btn btn--ghost btn--sm abrir', href: `../cup/?${f.alias || code}`, target: '_blank', rel: 'noopener' }, 'Open the cup ↗'),
  ];

  const TABS = [['tabla', 'Standings'], ['dias', 'Day by day'], ['historia', 'History']];
  const pestañas = el('div', { class: 'subtabs', role: 'tablist', 'aria-label': 'What to see of the cup' },
    ...TABS.map(([v, l]) => el('button', { type: 'button', role: 'tab', 'aria-selected': String(S.fichaTab === v), onClick: () => { S.fichaTab = v; render(); } }, l)));

  let cuerpo;
  if (S.fichaTab === 'dias') {
    const cab = el('tr', {}, el('th', { scope: 'col' }, 'Player'),
      ...f.dias.map(x => el('th', { scope: 'col', title: `${miniLabel(x.juego)} · opens ${whenLabel(x.a)} · closes ${whenLabel(x.b)}` },
        `Day ${x.d}`, el('br'), miniEmoji(x.juego), x.final ? ' 🏁' : '', el('br'),
        el('small', {}, x.estado === 'futuro' ? fechaLabel(x.a) : x.estado === 'anulado' ? 'voided' : `${x.jugaron}/${x.de}`))),
      el('th', { scope: 'col' }, 'Total'));
    const filas = f.grilla.map(j => el('tr', {}, el('th', { scope: 'row' }, quien(j.name, j.co)), ...j.casillas.map(casillaCelda), el('td', { class: 'c-total' }, n(j.total))));
    cuerpo = bloque('Day by day', 'Score from 0 to 100, time and the points it gave in the standings. Above each day, how many played out of those due. Hover over a cell for the detail.',
      f.grilla.length ? el('div', { class: 'grilla' }, el('table', {}, el('thead', {}, cab), el('tbody', {}, ...filas))) : el('p', { class: 'empty' }, 'Nobody signed up yet.'),
      el('p', { class: 'muted small leyenda' }, '● playing now · unfinished: started and left no result · … the day is open · ✗ the day closed without them playing · — signed up later · ×2 counts double: the final or their wildcard 🃏'));
  } else if (S.fichaTab === 'historia') {
    const { eventos, sinHora } = f.historia;
    const grupos = [];
    for (const e of eventos) {
      const d = diaPanel(e.at);
      if (!grupos.length || grupos[grupos.length - 1].d !== d) grupos.push({ d, label: fechaLabel(e.at), evs: [] });
      grupos[grupos.length - 1].evs.push(e);
    }
    cuerpo = bloque('History', `Newest to oldest, in ${ZONA_NOMBRE}.`,
      eventos.length ? el('div', { class: 'historia' }, ...grupos.flatMap(g => [el('p', { class: 'dia-grupo' }, g.label), ...g.evs.map(e => filaEvento(L, e))])) : el('p', { class: 'empty' }, 'Nothing yet.'),
      sinHora.length ? el('div', { class: 'historia' }, el('p', { class: 'dia-grupo' }, 'No time'), el('p', { class: 'muted small' }, 'The database keeps these changes without the time they happened.'), ...sinHora.map(e => filaEvento(L, e))) : null);
  } else {
    cuerpo = bloque('Standings', 'As it will end up: includes the days players cannot see yet.',
      lista(f.grilla.map(j => el('div', { class: 'puesto' },
        el('span', { class: 'lugar' }, j.lugar ?? '—'),
        el('span', { class: 'nombre' }, quien(j.name, j.co), j.comodin ? el('small', {}, ` · wildcard on day ${j.comodin}`) : null),
        el('span', { class: 'pts' }, n(j.total), el('small', {}, ' pts')))), 'Nobody signed up yet.', 'tabla'));
  }
  return [...cabecera, pestañas, cuerpo];
}

/* ------------------------------------------------------------------ */
/* Juegos                                                              */
/* ------------------------------------------------------------------ */

/**
 * Uno al día (D-230): las partidas del modo `uno-al-dia` (de todos), y de quienes entraron con
 * jugador, cuántos jugaron, cuántos volvieron al día siguiente y a la semana, sus rachas y las
 * invitaciones aceptadas. Los avisos van en el bloque de avisos al celular, como `uad<tipo>`.
 */
function bloqueUnoAlDia(rango) {
  const u = unoAlDiaDelRango({ days: S.days, ...S.uad }, { from: rango.from, to: rango.to, hoy: dayOf(Date.now()) });
  const periodos = groupDays(u.porDia, rango.grano);
  const maxD = Math.max(0, ...periodos.map(d => d.total));
  const juegos = Object.entries(u.porJuego).sort((a, b) => b[1] - a[1]);
  const maxJ = Math.max(0, ...juegos.map(([, v]) => v));
  const maxR = Math.max(0, ...u.tramos.map(([, v]) => v));
  const pct = p => (p === null ? '—' : `${p}%`);
  const de = base => (base ? ` · of ${n(base)} days` : '');
  return bloque('📅 One a Day',
    'Games are everyone\'s and each one counts when it starts. The other figures are only of those who signed in with their name and PIN. "Came back the next day" looks at played days whose next day has passed and counts how many also had the next one played; "after 7 days", the same with the seventh. Streaks count each player by their best streak, all time. UTC days.',
    el('div', { class: 'tiles' },
      tile(u.partidas, 'One a Day games'),
      tile(u.jugadores, 'players with name and PIN'),
      tile(pct(u.d1), `came back the next day${de(u.base.d1)}`),
      tile(pct(u.d7), `came back after 7 days${de(u.base.d7)}`),
      tile(u.aceptadas, 'invitations accepted'),
      tile(u.vistas, 'views of /today/'),
      tile(u.entradas, 'visits that came in through /today/', { info: 'a shared link, a notification or an invitation' }),
    ),
    el('div', { class: 'grid2' },
      el('div', {}, el('h3', { class: 'small' }, { dia: 'By day', semana: 'By week', mes: 'By month' }[rango.grano]),
        lista(periodos.map(d => bar(d.label, [seg(C_TORNEO, d.total)], maxD)), 'Nobody played One a Day in this range.', 'bars')),
      el('div', {}, el('h3', { class: 'small' }, 'By game'),
        lista(juegos.map(([id, v]) => bar(gameLabel(id), [seg(C_TORNEO, v)], maxJ)), 'Nothing yet.', 'bars'))),
    el('div', { class: 'grid2', style: 'margin-top:16px' },
      el('div', {}, el('h3', { class: 'small' }, 'What people do'), actividad(USO_UAD)),
      el('div', {}, el('h3', { class: 'small' }, 'Notifications'), actividad(AVISOS_UAD))),
    el('div', { style: 'margin-top:16px' }, el('h3', { class: 'small' }, 'Players by their best streak, all time'),
      lista(u.tramos.map(([label, v]) => bar(`🔥 ${label} ${label === '1' ? 'day' : 'days'}`, [seg(C_SIN_RED, v)], maxR)), 'Nobody with a streak yet.', 'bars')));

  function actividad(rotulos) {
    const filas = Object.entries(rotulos).map(([k, label]) => [label, u.eventos[k] || 0]);
    const max = Math.max(0, ...filas.map(([, v]) => v));
    return lista(filas.filter(([, v]) => v).map(([label, v]) => bar(label, [seg(C_IDIOMA, v)], max)), 'Nothing in this range.', 'bars bars--rotulo-largo');
  }
}

/** Qué cuenta cada señal de Uno al día (`uad/<evento>`, EVENTOS_UAD en stats.js), en el orden en que pasa. */
const USO_UAD = {
  boton: '📅 Tapped the button', dado: '🎲 Rolled the day\'s die', jugado: '✅ Finished today\'s', repite: '🔁 Replayed it',
  compartir: '📤 Shared it', otro: '🎲 Rolled for another game', invitar: '👋 Tapped Invite',
  invitacion: '✉️ Opened an invitation', aceptada: '🧊 Accepted (wildcard for the inviter)',
};
const AVISOS_UAD = {
  oferta: '🔔 Notifications offered', hora: '🕘 Picked a time', activos: '✅ Turned on',
  ahorano: '🙅 "Not now"', silencio: '🔕 Muted them',
};

/**
 * The offline games of one domain (D-210, D-348): Group gets vs. the phone and one phone, Individual
 * gets solo and One a Day, so each log matches the numbers above it. The Cup is not here.
 */
function sinRedRecientes(rango, dominio) {
  const todas = localLog(S.days, { from: rango.from, to: rango.to })
    .filter(p => esJuego(p.game) && (isIndividualMode(p.mode) ? 'individual' : 'grupo') === dominio);
  const visibles = S.sinRedTodas ? todas : todas.slice(0, SIN_RED_VISIBLES);
  return bloque('Offline games', NOTA_SIN_RED[dominio],
    lista(visibles.map(p => filaSinRedLog(p, { conJuego: true })), 'None in this range.', 'log'),
    todas.length > SIN_RED_VISIBLES ? el('button', { type: 'button', class: 'btn btn--ghost btn--sm mas', onClick: () => { S.sinRedTodas = !S.sinRedTodas; render(); } }, S.sinRedTodas ? 'Show fewer' : `Show all ${n(todas.length)}`) : null);
}

/** What each offline game says, and since when (D-140, D-210); a game's card lists all its modes. */
const NOTA_COMUN = 'Newest to oldest. With time since version 0.64.7 (D-140); with name and result since 0.99.2 (D-210). The name is the one the person already typed in the app; if they never set one, it shows "no name". With no ending, "at least" runs from the start to its last signal.';
const NOTA_SIN_RED = {
  grupo: `Vs. the phone and on one phone. ${NOTA_COMUN}`,
  individual: `Solo and One a Day. ${NOTA_COMUN}`,
  todas: `Vs. the phone, on one phone or solo. ${NOTA_COMUN}`,
};

/** Jugadores por partida y partidas por día: los mismos en la vista de juegos y en la ficha de uno. */
function graficosJuego(s, rango) {
  const players = Object.entries(s.byPlayers).sort((a, b) => Number(a[0]) - Number(b[0]));
  const maxP = Math.max(0, ...players.map(([, v]) => v));
  // Por día en los rangos cortos, por semana o por mes en los largos: 365 barras no se leen
  const periodos = groupDays(s.byDay, rango.grano);
  const maxDay = Math.max(0, ...periodos.map(d => d.total));
  return el('div', { class: 'grid2' },
    bloque('Players per game', null, lista(players.map(([k, v]) => bar(k === '1' ? '1 player' : `${k} players`, [seg(C_SIN_RED, v)], maxP)), 'Nothing yet.', 'bars')),
    bloque({ dia: 'By day', semana: 'By week', mes: 'By month' }[rango.grano],
      `${modeIcon(ROOM_MODE)} On two phones and, in yellow, offline. UTC days.${rango.grano === 'semana' ? ' The date is the Monday of each week.' : ''}`,
      lista(periodos.map(d => bar(d.label, [segModo(ROOM_MODE, d.online), seg(C_SIN_RED, d.local)], maxDay)), 'Nothing yet.', 'bars')),
  );
}

/** La bitácora de salas jugadas del rango (D-79), de un juego o de todos. */
function bitacora(rango, game = null) {
  const filas = roomLog(S.days, { from: rango.from, to: rango.to, soloJugadas: !S.logSolas }).filter(f => !game || f.game === game);
  const { rows, page, pages, total, desde } = paginate(filas, { page: S.logPage, perPage: POR_PAGINA });
  S.logPage = page;
  return el('div', { class: 'panel', id: 'salas-jugadas' },
    el('p', { class: 'lead' }, game ? `${nombreJuego(game)} rooms` : 'Rooms played'),
    el('p', { class: 'muted small' }, `Those in the range, newest to oldest, in ${ZONA_NOMBRE}. Tap one to see its card. Test games run in the test environment: to see them, change the environment above.`),
    el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: S.logSolas || null, onChange: e => { S.logSolas = e.target.checked; S.logPage = 1; render(); } }), ' Include rooms nobody else ever joined'),
    lista(rows.map(filaSalaLog), S.logSolas ? 'No rooms in this range.' : 'No rooms played in this range.', 'log'),
    paginado(page, pages, desde, rows.length, total, k => (k === 1 ? 'room' : 'rooms'), p => { S.logPage = p; render(); }));
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
    migas(['👥 Group', 'grupo'], [nombre]),
    ...titulo(`${nombre} · ${tituloRango()}`, `Counts go by UTC day; times, in ${ZONA_NOMBRE}.`),
    el('div', { class: 'tiles' },
      tile(fila.total, 'games started'),
      tile(s.online, 'on two phones'),
      tile(s.local, 'offline'),
      tile(s.sinRival, 'rooms with no opponent'),
      tile(durTipica ? minutos(durTipica) : '—', 'typical length of rooms that finished', { info: 'from creation until someone won: includes waiting for the opponent' }),
    ),
    el('div', { class: 'grid2' },
      bloque('By mode', null, lista(modos.map(m => bar(modoDe(m), [segModo(m, fila[m])], maxM)), 'Nothing in this range.', 'bars')),
      porIdioma('In which language', 'Once per player in each room and once per offline game. Recorded since D-211.', idiomasDelRango(S.days, { from: rango.from, to: rango.to, incluye: g => g === id }))),
    graficosJuego(s, rango),
    bitacora(rango, id),
    bloque('Offline games', NOTA_SIN_RED.todas,
      lista(visibles.map(p => filaSinRedLog(p)), 'None in this range.', 'log'),
      sinRed.length > SIN_RED_VISIBLES ? el('button', { type: 'button', class: 'btn btn--ghost btn--sm mas', onClick: () => { S.sinRedTodas = !S.sinRedTodas; render(); } }, S.sinRedTodas ? 'Show fewer' : `Show all ${n(sinRed.length)}`) : null),
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
  const pasos = [['👥 Group', 'grupo'], ...(game ? [[gameLabel(game), 'juego', [game]]] : []), [`Room ${code}`]];
  if (!S.daysLoaded) return [migas(...pasos), el('p', { class: 'empty' }, 'Loading…')];
  if (!reg && !viva) return [migas(...pasos), ...titulo(code), el('p', { class: 'empty' }, `There is no room ${code} in ${envLabel(S.env)} in ${rangeOf(S.range).titulo.toLowerCase()}. Try a longer range or the other environment.`)];

  const jugadores = reg?.players?.length ? reg.players : (viva?.players || []);
  const enLinea = role => viva?.players.find(p => p.role === role)?.online;
  const ganador = reg?.winner ? quien(reg.winnerName, reg.players.find(p => p.role === reg.winner)?.co) : reg?.empate ? '🤝 Tie' : null;
  return [
    migas(...pasos),
    el('div', { class: 'ficha-titulo' },
      el('h2', { class: 'display display--md' }, code),
      el('span', { class: `estado ${viva ? 'estado--en-curso' : 'estado--terminada'}` }, viva ? 'alive' : 'closed'),
      reg?.v ? el('span', { class: 'tag' }, `v${reg.v}`) : null),
    datos([
      ['Game', game ? enlace('juego', [game], {}, gameLabel(game)) : '?'],
      ['Language', (reg?.langs?.length ? reg.langs : (viva?.players || []).map(p => p.lang).filter(Boolean)).map(nombreDeIdioma).filter((x, i, a) => a.indexOf(x) === i).join(' and ') || 'no data (before D-211)'],
      ['Created', whenLabel(reg?.at || viva.createdAt)],
      reg?.endAt ? ['Ended', whenLabel(reg.endAt)] : null,
      reg?.durMs ? ['Lasted', minutos(reg.durMs)] : null,
      ['Won', ganador ?? (viva ? 'still playing' : 'no record')],
      viva ? ['Moves', n(viva.jugadas)] : null,
      viva ? ['Chat', chatDe(viva.chat)] : null,
      viva ? ['Last move', viva.lastPlayAt ? ago(viva.lastPlayAt, now) : 'none'] : null,
    ]),
    bloque('Players', null, lista(jugadores.map(p => el('div', { class: 'puesto' },
      el('span', { class: 'lugar' }, p.role),
      el('span', { class: 'nombre' }, quien(p.name, p.co), ' ', idiomaTag(p.lang)),
      el('span', { class: 'pts' }, viva ? (enLinea(p.role) ? el('span', { class: 'on-txt' }, '● connected') : 'disconnected') : reg?.winner === p.role ? '🏆' : ''))), 'No players.', 'tabla')),
    el('p', { class: 'muted small' }, viva
      ? 'The room is still alive: it deletes itself after half an hour without activity. Of the chat only the number of messages is counted.'
      : 'The room is already deleted. What remains is the game, the names, each phone\'s country, the version and who won (D-79). Moves and chat are counted only while it is alive.'),
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
  if (p === 'inicio') return '🏠 Home';
  if (p === 'labs') return '🧪 Lab';
  const g = GAMES.find(x => x.path === `${p}/`);
  if (g) return gameLabel(g.id);
  const s = SUELTOS.find(x => x.slug === p);
  if (s) return `${s.emoji} ${s.name[PANEL_LANG] || s.name.es}`;
  return `/${p}/`;
}

/** Cómo se llama un canal: la marca que la app pone en lo que comparte, o la que vino en el enlace. */
const canalLabel = k => (k === 'link' ? '🔗 Link shared from the app' : k);
const porcentaje = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');

/** What was shared and how many visits the shared links brought (D-348). */
function bloqueCompartidos(rango) {
  const sg = senales(S.days, rango);
  const t = trafico(S.days, rango);
  const que = Object.entries(sg.comparte).sort((a, b) => b[1] - a[1]);
  const max = Math.max(0, ...que.map(([, v]) => v));
  const llegan = t.via.link || 0;
  return conCsv(bloque('What gets shared', `Each time someone tapped Share and did not cancel (since D-348). Each share brought ${sg.compartidos ? (llegan / sg.compartidos).toLocaleString(LOCALE, { maximumFractionDigits: 2 }) : '—'} visits with the link\'s mark: the viral factor.`,
    lista(que.map(([k, v]) => bar(k, [seg(C_TORNEO, v)], max)), 'Nothing shared in this range.', 'bars')), 'compartidos', que.map(([k, v]) => ({ que: k, veces: v })));
}

function vistaTrafico(now) {
  const rango = rangeOf(S.range);
  const t = trafico(S.days, { from: rango.from, to: rango.to });
  const hoy = trafico(S.days, { from: dayOf(now), to: dayOf(now) });
  const nota = 'Visits to the site, whether they play or not. A visit is a tab: it counts once, on the page where it started, and each page it opens afterwards adds a view. No IP, no cookies and no identifying anyone: of where it came from only the domain is kept. UTC days.';
  if (t.desde === null) {
    return [...titulo(`📈 Traffic · ${tituloRango()}`, nota),
      el('p', { class: 'empty' }, S.daysLoaded ? 'No visits recorded in this range yet: counting started with D-208. Games and The Cup are in their sections.' : 'Loading…')];
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
  const ret = [['nueva', 'First time'], ['vuelve', 'Had come before']].map(([k, l]) => [l, t.retorno[k] || 0]);
  const maxR = Math.max(0, ...ret.map(([, v]) => v));
  const paises = top(t.pais, 15);
  const maxPa = Math.max(0, ...paises.map(([, v]) => v));
  const C_JUEGAN = 'var(--lime)';

  return [
    ...titulo(`📈 Traffic · ${tituloRango()}`, nota),
    t.desde > rango.from ? el('p', { class: 'muted small' }, `Counted since ${dayLabel(t.desde)}: no visits are recorded before that.`) : null,
    el('div', { class: 'tiles' },
      tile(t.visitas, 'visits'),
      tile(t.vistas, `pages viewed · ${t.visitas ? (t.vistas / t.visitas).toLocaleString(LOCALE, { maximumFractionDigits: 1 }) : '—'} per visit`),
      tile(porcentaje(t.juegan, t.visitas), `went on to play · ${n(t.juegan)} visits`, { info: 'started a game or a cup game' }),
      tile(porcentaje(t.retorno.nueva || 0, t.visitas), 'first-time visits', { info: 'a mark in the browser: it identifies nobody' }),
      tile(hoy.visitas, 'visits today (UTC day)'),
    ),
    bloque({ dia: 'Visits per day', semana: 'Visits per week', mes: 'Visits per month' }[rango.grano],
      `In green, those that went on to play.${rango.grano === 'semana' ? ' The date is the Monday of each week.' : ''}`,
      lista(periodos.map(d => bar(d.label, [seg(C_JUEGAN, d.juegan), seg(C_TOTAL, Math.max(0, d.visitas - d.juegan))], maxD, { cifra: d.visitas })), 'Nothing yet.', 'bars')),
    el('div', { class: 'grid2' },
      bloque('Where they come from', 'The site where they tapped the link. WhatsApp and almost every chat app do not say: those visits fall under "Direct or no data", along with whoever typed the address or had it saved.',
        lista(origenes.map(([k, v]) => bar(k, [seg(C_TOTAL, v)], maxO, { sub: dominiosDe(k) })), 'Nothing yet.', 'bars')),
      bloque('Through which link', 'What the app shares carries its mark (?from=link): that tells how many visits came from an invitation even if the chat does not say. It also counts utm_source or ?from= if you add them to a link by hand.',
        lista(canales.map(([k, v]) => bar(canalLabel(k), [seg(C_TORNEO, v)], maxC)), 'No marked visits in this range.', 'bars'),
        t.visitas ? el('p', { class: 'muted small', style: 'margin-top:8px' }, `Unmarked: ${n(Math.max(0, t.visitas - canales.reduce((k, [, v]) => k + v, 0)))} visits.`) : null),
    ),
    bloque('Pages', 'Views of each page and, beside them, how many visits started there and how many of those went on to play.',
      lista(paginas.map(([k, p]) => bar(paginaLabel(k), [seg(C_TOTAL, p.vistas)], maxP, {
        detail: p.entradas ? `${n(p.entradas)} visit${p.entradas === 1 ? '' : 's'} started here · ${porcentaje(p.juegan, p.entradas)} went on to play` : 'no visit started here',
      })), 'Nothing yet.', 'bars')),
    el('div', { class: 'grid2' },
      bloque('Device', null, lista(disp.map(([k, v]) => bar(k.charAt(0).toUpperCase() + k.slice(1), [seg(C_IDIOMA, v)], maxDi)), 'Nothing yet.', 'bars')),
      bloque('First time or returning', 'Per visit. "Had come before" comes from a mark the browser keeps; whoever clears their data or uses private mode counts as first time.',
        lista(ret.map(([l, v]) => bar(l, [seg(C_IDIOMA, v)], maxR)), 'Nothing yet.', 'bars')),
    ),
    bloqueCompartidos(rango),
    bloque('Country of visits', 'From the phone\'s time zone, as in rooms (D-79).',
      lista(paises.map(([k, v]) => bar(`${flagOf(k)} ${nombreDePais(k)}`.trim(), [seg(C_TORNEO, v)], maxPa)), 'Nothing yet.', 'bars')),
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

  const tipos = [[torneoLabel, C_TORNEO, rc.jugadas, 'games played', ir('torneo')], ['🎲 Other games', C_TOTAL, s.partidas, 'games', ir('grupo')]];
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
    ...titulo(`🌎 Audience · ${tituloRango()}`, 'How much and from where people play. UTC days: in Pacific time the day changes at 17:00 (16:00 in winter).'),
    el('div', { class: 'tiles' },
      tile(s.partidas, 'games started', { href: ir('grupo') }),
      tile(rc.jugadas, `${torneoNombre} games`, { href: ir('torneo') }),
      tile(rc.copas, 'active cups', { href: ir('torneo') }),
      tile(todo.devices, 'phone joins to a game'),
      tile(hoy.partidas + miniHoy, 'games and cup games today'),
    ),
    el('div', { class: 'grid2' },
      bloque('Tournament and other games', 'A tournament game is one player\'s game on one day of their cup.',
        lista(tipos.map(([label, color, v, sub, href]) => bar(label, [seg(color, v)], maxT, { sub, href })), 'Nothing yet.', 'bars')),
      bloque({ dia: 'By day', semana: 'By week', mes: 'By month' }[rango.grano],
        `Cyan, games; pink, ${torneoNombre} games.${rango.grano === 'semana' ? ' The date is the Monday of each week.' : ''}`,
        lista(periodosT.map(d => bar(d.label, [seg(C_TOTAL, d.juegos), seg(C_TORNEO, d.torneo)], maxK)), 'Nothing yet.', 'bars')),
    ),
    el('div', { class: 'grid2' },
      bloque('From where', 'The phone\'s time zone. It counts each time a phone started or joined a game: the same phone adds once per game, so these are not distinct people.',
        lista(origin.map(([k, v]) => { const { city, region } = tzLabel(k); return bar(city, [seg(C_TOTAL, v)], maxO, { sub: region }); }), 'Nothing yet.', 'bars')),
      bloque('Country of room players', 'Once per player in each room with an opponent. From the phone\'s time zone (D-79).',
        lista(paises.map(([k, v]) => bar(`${flagOf(k)} ${nombreDePais(k)}`.trim(), [seg(C_TORNEO, v)], maxPa)), 'Nothing yet.', 'bars')),
    ),
    el('div', { class: 'grid2' },
      bloque('Browser language', null, lista(lang.map(([k, v]) => bar(k === 'desconocido' ? 'No language' : k, [seg(C_IDIOMA, v)], maxL)), 'Nothing yet.', 'bars')),
      bloque('Language chosen to play', null, lista(appL.map(([k, v]) => bar(nombreDeIdioma(k), [seg(C_IDIOMA, v)], maxA)), 'Nothing yet.', 'bars')),
    ),
    bloque('What time people play', 'Local time of each phone.',
      el('div', { class: 'hours' }, ...todo.hour.map((v, h) => el('div', { class: 'h', style: `height:${Math.max(2, (v / maxH) * 100)}%`, title: `${h}:00 · ${n(v)}`, 'data-h': h % 6 === 0 ? h : null })))),
    bloque('Free plan quota', 'Firebase usage cannot be read from the browser. The phones connected in Now are the best approximation of simultaneous connections (cap ~100). The detail is in the console:',
      el('a', { class: 'btn btn--ghost btn--sm', href: 'https://console.firebase.google.com/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/usage', target: '_blank', rel: 'noopener' }, 'Usage in Firebase ↗')),
  ];
}

/* ------------------------------------------------------------------ */
/* Salud: lo que le falla a quien juega (D-251)                        */
/* ------------------------------------------------------------------ */
const TIPO_FALLA = {
  arranque: ['⛔', 'Did not start', 'after 20 s the page had not loaded its modules'],
  recurso: ['📦', 'A file did not load', 'a script or a stylesheet did not arrive'],
  js: ['💥', 'Error', 'an uncaught error'],
  promesa: ['⚠️', 'Rejected promise', 'an unhandled rejected promise'],
};
const C_TRAMO = { s1: 'var(--lime)', s3: 'var(--cyan)', s6: 'var(--yellow)', s10: 'var(--pink)', mas: 'var(--purple)' };
const listaDe = (obj, label, max = 4) => {
  const pares = top(obj, 50);
  const vistos = pares.slice(0, max).map(([k, v]) => `${label(k)}${pares.length > 1 ? ` (${n(v)})` : ''}`);
  return vistos.join(', ') + (pares.length > max ? ` and ${pares.length - max} more` : '');
};

/** Un error, juntado por qué es: dónde, en qué páginas, en qué navegadores y versiones, y cuándo. */
/**
 * The vigía writes what failed to load in Spanish (`vigia.js`, stored as data): read in English here,
 * old records included (D-350). "módulo que no cargó (el de la página)" → "module that did not load (the page's own)".
 */
const RECURSO_EN = { 'módulo': 'module', script: 'script', 'hoja de estilos': 'stylesheet' };
const mensajeEn = m => String(m || '').replace(/^(módulo|script|hoja de estilos) que no cargó( \(el de la página\))?$/,
  (_, tipo, propio) => `${RECURSO_EN[tipo]} that did not load${propio ? " (the page's own)" : ''}`).replace(/^\(sin detalle\)$/, '(no detail)');

function filaError(g) {
  const [ico, nombre] = TIPO_FALLA[g.k] || ['·', g.k];
  const dias = g.primero === g.ultimo ? dayLabel(g.ultimo) : `${dayLabel(g.primero)} to ${dayLabel(g.ultimo)}`;
  const versiones = Object.keys(g.versiones).sort().join(', ');
  return el('div', { class: `err-row${g.viejo ? ' err-row--viejo' : ''}` },
    el('div', { class: 'err-ico', title: nombre, role: 'img', 'aria-label': nombre }, ico),
    el('div', { class: 'err-cuerpo' },
      el('p', { class: 'err-msg' }, mensajeEn(g.m)),
      g.f ? el('p', { class: 'err-lugar' }, el('code', {}, g.f)) : null,
      el('div', { class: 'err-meta' },
        el('span', { class: 'q' }, listaDe(g.paginas, paginaLabel)),
        el('span', { class: 'q' }, listaDe(g.navegadores, navegadorLabel)),
        versiones ? el('span', { class: 'q' }, `v${versiones}`) : null,
        el('span', { class: 'q' }, dias),
        g.viejo ? el('span', { class: 'q q--ok', title: 'The newest version in the range did not have it' }, `not seen after v${g.ultimaVersion}`) : null)),
    el('div', { class: 'err-n', title: 'Loads that saw it' }, n(g.n)));
}

/** Un porcentaje que no esconde lo poco: 2 de 674 es 0,3 %, no 0 %. */
const pctFino = (a, b) => (!b ? '—' : a && a / b < 0.01 ? `${((a / b) * 100).toLocaleString(LOCALE, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%` : porcentaje(a, b));

function vistaSalud(now) {
  const rango = rangeOf(S.range);
  const s = salud(S.days, { from: rango.from, to: rango.to });
  const hoy = salud(S.days, { from: dayOf(now), to: dayOf(now) });
  const nota = 'What fails for whoever opens the site: pages that did not start, errors and how long until they can play. Each phone records it, once per load and type, with no IP or full address (D-251). A load is an opened page: those that started are the views in Traffic. UTC days.';
  if (s.desde === null) {
    return [...titulo(`🩺 Health · ${tituloRango()}`, nota),
      el('p', { class: 'empty' }, S.daysLoaded ? 'Nothing recorded in this range yet: recording started with D-251.' : 'Loading…')];
  }
  const t = s.total;
  const periodos = groupDays(s.porDia, rango.grano);
  const maxD = Math.max(0, ...periodos.map(d => d.alguna));
  const paginas = Object.entries(s.paginas).filter(([, p]) => p.alguna).sort((a, b) => (b[1].alguna / (b[1].cargas || 1)) - (a[1].alguna / (a[1].cargas || 1)) || b[1].cargas - a[1].cargas);
  const lentas = Object.entries(s.paginas).filter(([, p]) => p.medidas).sort((a, b) => b[1].lentas / b[1].medidas - a[1].lentas / a[1].medidas || b[1].medidas - a[1].medidas);
  const tiposTotal = ['arranque', 'recurso', 'js', 'promesa'].map(k => [k, t[k]]);
  const maxTipo = Math.max(0, ...tiposTotal.map(([, v]) => v));
  const navegadores = {};
  for (const g of s.errores) for (const [b, v] of Object.entries(g.navegadores)) navegadores[b] = (navegadores[b] || 0) + v;
  const navs = top(navegadores, 10);
  const maxN = Math.max(0, ...navs.map(([, v]) => v));
  const VISIBLES = 30;
  const errores = S.erroresTodos ? s.errores : s.errores.slice(0, VISIBLES);

  return [
    ...titulo(`🩺 Health · ${tituloRango()}`, nota),
    s.desde > rango.from ? el('p', { class: 'muted small' }, `Recorded since ${dayLabel(s.desde)}: there is no data before that.`) : null,
    el('div', { class: 'tiles' },
      tile(pctFino(t.arranque, t.cargas), `did not start · ${n(t.arranque)} of ${n(t.cargas)} loads`, { hot: t.arranque > 0, info: TIPO_FALLA.arranque[2] }),
      tile(pctFino(t.alguna, t.cargas), `loads with some failure · ${n(t.alguna)}`, { hot: t.alguna > 0 }),
      tile(pctFino(t.lentas, t.medidas), 'took 6 s or more to start', { info: `of ${n(t.medidas)} measured loads, those visible the whole time` }),
      tile(s.errores.length, 'distinct errors'),
      tile(hoy.total.alguna, 'loads with failures today (UTC day)', { hot: hoy.total.arranque > 0 }),
    ),
    el('div', { class: 'grid2' },
      bloque({ dia: 'Loads with failures per day', semana: 'Loads with failures per week', mes: 'Loads with failures per month' }[rango.grano],
        `In pink, those that did not start.${rango.grano === 'semana' ? ' The date is the Monday of each week.' : ''}`,
        lista(periodos.map(d => bar(d.label, [seg(C_TORNEO, d.arranque), seg('var(--yellow)', Math.max(0, d.alguna - d.arranque))], maxD, {
          cifra: d.alguna, detail: d.cargas ? `${porcentaje(d.alguna, d.cargas)} of ${n(d.cargas)} loads` : '',
        })), 'Nothing yet.', 'bars')),
      bloque('What failed', 'Loads that had each thing. A load can have more than one.',
        lista(tiposTotal.map(([k, v]) => bar(`${TIPO_FALLA[k][0]} ${TIPO_FALLA[k][1]}`, [seg(k === 'arranque' ? C_TORNEO : 'var(--yellow)', v)], maxTipo, { detail: TIPO_FALLA[k][2] })), 'Nothing yet.', 'bars')),
    ),
    bloque('Errors', `Grouped by which error they are: the same one on another line or with another number counts once. The figure is how many loads saw it. In grey, those the newest version in the range (v${s.versionActual}) no longer had.`,
      lista(errores.map(filaError), 'No errors in this range.', 'errs'),
      s.errores.length > VISIBLES ? el('button', { class: 'btn btn--ghost btn--sm', style: 'margin-top:10px', onClick: () => { S.erroresTodos = !S.erroresTodos; render(); } },
        S.erroresTodos ? 'Show fewer' : `Show all ${n(s.errores.length)}`) : null),
    el('div', { class: 'grid2' },
      bloque('Pages with failures', 'Of each page\'s loads, how many had some failure.',
        lista(paginas.map(([k, p]) => bar(paginaLabel(k), [seg(C_TORNEO, p.arranque), seg('var(--yellow)', Math.max(0, p.alguna - p.arranque))], Math.max(1, p.cargas), {
          cifra: p.alguna, note: pctFino(p.alguna, p.cargas), detail: `of ${n(p.cargas)} loads${p.arranque ? ` · ${n(p.arranque)} did not start` : ''}`,
        })), 'No pages with failures in this range.', 'bars')),
      bloque('Browser of the errors', 'Family and major version, never the full browser. On iPhone and iPad they are all Safari inside: it shows the iOS version.',
        lista(navs.map(([k, v]) => bar(navegadorLabel(k), [seg('var(--yellow)', v)], maxN)), 'No errors in this range.', 'bars')),
    ),
    bloque('How long until they can play', `From requesting the page until its modules ran, in loads visible the whole time. Green to purple: ${TRAMOS.map(([, l]) => l).join(' · ')}.`,
      lista(lentas.map(([k, p]) => bar(paginaLabel(k), TRAMOS.map(([tr, l]) => ({ ...seg(C_TRAMO[tr], p.listo[tr] || 0), title: l })), p.medidas, {
        note: porcentaje(p.lentas, p.medidas), detail: `${n(p.lentas)} of ${n(p.medidas)} measured loads took 6 s or more`,
      })), 'Nothing yet.', 'bars')),
  ];
}

/* ------------------------------------------------------------------ */
/* The domains (D-348): Summary, Group, Individual, Uno al día, Users  */
/* ------------------------------------------------------------------ */

/** The range and the one before it, with what each domain counts in both. */
function periodos() {
  const r = rangeOf(S.range), a = rangoAnterior(r);
  return { r, a };
}
const terminadasSalas = e => Object.values(e).reduce((k, g) => k + g.terminadas, 0);
const pctDe = (a, b) => (b ? Math.round((a / b) * 100) : null);
const pctTxt = p => (p === null ? '—' : `${p}%`);

/**
 * The analyst's front page (D-348): the main metric (games finished), one card per domain with
 * its headline and its change against the period before, and what is being played now.
 */
function vistaResumen(now) {
  const { r, a } = periodos();
  const pd = partidasDominio(S.days, r), pda = partidasDominio(S.days, a);
  const f = finales(S.days, r), fa = finales(S.days, a);
  const rc = resumenCopas(S.torneos, r, now), rca = resumenCopas(S.torneos, a, now);
  const norte = f.terminadas + terminadasSalas(embudoSalas(S.days, r)) + rc.jugadas;
  const norteA = fa.terminadas + terminadasSalas(embudoSalas(S.days, a)) + rca.jugadas;
  const u = usuarios(S.days, r), ua = usuarios(S.days, a);
  const t = trafico(S.days, r), ta = trafico(S.days, a);
  const sg = senales(S.days, r), sga = senales(S.days, a);
  const h = salud(S.days, r), ha = salud(S.days, a);
  const uad = unoAlDiaDelRango({ days: S.days, ...S.uad }, { from: r.from, to: r.to, hoy: dayOf(now) });
  const uada = unoAlDiaDelRango({ days: S.days, ...S.uad }, { from: a.from, to: a.to, hoy: a.to });
  const fallas = pctDe(h.total.alguna, h.total.cargas), fallasA = pctDe(ha.total.alguna, ha.total.cargas);
  const vivas = salasVivas(now).propias.filter(x => x.active).length;
  const sinRed = liveLocal(S.days, now).length;
  const jugandoCopa = copasEnCurso(S.torneos, now).reduce((k, c) => k + c.jugando.length, 0);
  const tarjeta = (sec, cifra, label, cambio, extra = '', menosEsMejor = false) => {
    const [ico, nombre] = SECCION[sec];
    return tile(cifra, `${ico} ${nombre} · ${label}`, { href: ir(sec), cambio, info: extra, menosEsMejor });
  };
  const porDia = pd.grupo.byDay.map((d, i) => ({ day: d.day, grupo: d.total, individual: pd.individual.byDay[i].total, torneo: rc.porDia[i]?.total || 0 }));
  return [
    ...titulo(`📊 Summary · ${tituloRango()}`, 'The analyst\'s front page (D-348): the main metric, one card per domain against the previous period of the same length, and what is being played now. Each domain has three bands: pulse, diagnosis and trend. UTC days.'),
    franja('pulso'),
    el('div', { class: 'tiles' },
      tile(norte, '⭐ games finished', { cambio: variacion(norte, norteA), info: 'main metric: rooms with an ending, offline games finished and The Cup games' }),
      tile(u.semana || '—', 'browsers active in 7 days', { href: ir('usuarios'), cambio: u.semana ? variacion(u.semana, usuarios(S.days, { from: a.to - 6, to: a.to }).semana) : undefined, info: 'since D-349' }),
      tile(vivas + sinRed + jugandoCopa, '🟢 playing now', { href: ir('ahora'), info: `${n(vivas)} rooms · ${n(sinRed)} offline · ${n(jugandoCopa)} in cups` }),
    ),
    el('div', { class: 'tiles' },
      tarjeta('grupo', pd.grupo.total, 'games', variacion(pd.grupo.total, pda.grupo.total)),
      tarjeta('individuales', pd.individual.total, 'games', variacion(pd.individual.total, pda.individual.total), 'One a Day included'),
      tarjeta('torneo', rc.jugadas, 'games played', variacion(rc.jugadas, rca.jugadas), `participation ${pctTxt(pct(rc.participacion))}`),
      tarjeta('unoaldia', uad.partidas, 'games', variacion(uad.partidas, uada.partidas), `back the next day ${pctTxt(uad.d1)}`),
      tarjeta('usuarios', u.diario || '—', 'active per day', u.diario ? variacion(u.diario, ua.diario) : undefined, u.pegajosidad === null ? '' : `stickiness ${u.pegajosidad}%`),
      tarjeta('trafico', t.visitas, 'visits', variacion(t.visitas, ta.visitas), `${pctTxt(pctDe(t.juegan, t.visitas))} go on to play · ${n(sg.compartidos)} shares`),
      tarjeta('salud', pctTxt(fallas), 'loads with failures', fallas === null || fallasA === null ? undefined : fallas - fallasA, h.total.arranque ? `⛔ ${n(h.total.arranque)} did not start` : 'all started', true),
    ),
    franja('tend'),
    serie('Games per period', 'Cyan, group; yellow, individual; pink, The Cup games.', porDia, r,
      [['grupo', C_TOTAL], ['individual', C_SIN_RED], ['torneo', C_TORNEO]], 'resumen'),
  ];
}

/** Group games (D-348): rooms, one phone and against the phone. */
function vistaGrupo(now) {
  const { r, a } = periodos();
  const pd = partidasDominio(S.days, r).grupo, pda = partidasDominio(S.days, a).grupo;
  const e = embudoSalas(S.days, r), ea = embudoSalas(S.days, a);
  const f = finales(S.days, r);
  const s = summarize(S.days, { from: r.from, to: r.to, incluye: esJuego, modo: m => !isIndividualMode(m) });
  MODOS = s.modes;
  const sum = k => Object.values(e).reduce((x, g) => x + g[k], 0);
  const conRival = sum('conRival'), creadas = sum('creadas'), term = sum('terminadas');
  const conRivalA = Object.values(ea).reduce((x, g) => x + g.conRival, 0);
  const juegos = Object.entries(pd.byGame).sort((x, y) => y[1] - x[1]);
  const maxJ = Math.max(0, ...juegos.map(([, v]) => v));
  const salas = Object.entries(e).sort((x, y) => y[1].creadas - x[1].creadas);
  const maxS = Math.max(0, ...salas.map(([, g]) => g.creadas));
  const terminan = Object.entries(f.porJuego).filter(([, g]) => g.grupo).sort((x, y) => y[1].finGrupo - x[1].finGrupo);
  const maxT = Math.max(0, ...terminan.map(([, g]) => g.finGrupo));
  const modos = Object.entries(pd.byMode).sort((x, y) => y[1] - x[1]);
  const maxM = Math.max(0, ...modos.map(([, v]) => v));
  const players = Object.entries(s.byPlayers).filter(([k]) => k !== '1').sort((x, y) => Number(x[0]) - Number(y[0]));
  const maxP = Math.max(0, ...players.map(([, v]) => v));
  return [
    ...titulo(`👥 Group · ${tituloRango()}`, 'Games for several people: on two phones (rooms), on one phone and vs. the phone. A game counts when it starts; a room, only if an opponent joined. UTC days.'),
    franja('pulso'),
    el('div', { class: 'tiles' },
      tile(pd.total, 'group games', { cambio: variacion(pd.total, pda.total) }),
      tile(conRival, 'rooms with an opponent', { cambio: variacion(conRival, conRivalA) }),
      tile(pctTxt(pctDe(conRival, creadas)), 'rooms an opponent joined', { info: `${n(creadas - conRival)} were left alone` }),
      tile(pctTxt(pctDe(term, conRival)), 'rooms that reached the end', { info: 'with a winner or a tie' }),
      tile(f.otras, 'rematches and "again"', { info: 'all offline games: not split by domain' }),
    ),
    franja('diag'),
    conCsv(bloque('Games by game', `Tap a game to see its card. Its modes: ${MODE_IDS.filter(m => !MODES[m].torneo && !MODES[m].individual).map(m => `${modeIcon(m)} ${MODES[m].label}`).join(' · ')}.`,
      lista(juegos.map(([id, v]) => bar(gameLabel(id), [seg(C_TOTAL, v)], maxJ, { href: ir('juego', [id]) })), 'Nothing yet.', 'bars')), 'grupo-juegos', juegos.map(([id, v]) => ({ juego: id, partidas: v }))),
    el('div', { class: 'grid2' },
      conCsv(bloque('Rooms, step by step', 'Created → an opponent joined (cyan) → reached the end (green). The length is the median of those that finished.',
        lista(salas.map(([id, g]) => bar(gameLabel(id), [seg('var(--lime)', g.terminadas), seg(C_TOTAL, g.conRival - g.terminadas), seg('rgba(255,255,255,0.25)', g.creadas - g.conRival)], maxS, {
          cifra: g.creadas, detail: `${pctTxt(pctDe(g.conRival, g.creadas))} with opponent · ${pctTxt(pctDe(g.terminadas, g.conRival))} to the end${g.medianaMs ? ` · lasts ${minutos(g.medianaMs)}` : ''}`,
        })), 'No rooms in this range.', 'bars')), 'grupo-salas', salas.map(([id, g]) => ({ juego: id, ...g }))),
      conCsv(bloque('Finished on one phone', 'Offline group games that reached the end, against those started (D-348: counted since this version).',
        lista(terminan.map(([id, g]) => bar(gameLabel(id), [seg(C_SIN_RED, g.finGrupo)], maxT, { cifra: g.finGrupo, detail: `${pctTxt(pctDe(g.finGrupo, g.grupo))} of ${n(g.grupo)} started` })), 'Nothing yet.', 'bars')),
        'grupo-terminadas', terminan.map(([id, g]) => ({ juego: id, ...g }))),
    ),
    el('div', { class: 'grid2' },
      bloque('By mode', null, lista(modos.map(([m, v]) => bar(`${modeIcon(m)} ${MODES[m]?.label || m}`, [segModo(m, v)], maxM)), 'Nothing yet.', 'bars')),
      bloque('Players per game', null, lista(players.map(([k, v]) => bar(`${k} players`, [seg(C_SIN_RED, v)], maxP)), 'Nothing yet.', 'bars')),
    ),
    franja('tend'),
    serie('Group games per period', null, pd.byDay, r, [['total', C_TOTAL]], 'grupo-serie'),
    sinRedRecientes(r, 'grupo'),
    bitacora(r),
  ];
}

/** Individual games (D-348): solo and Uno al día, with their real difficulty. */
function vistaIndividuales(now) {
  const { r, a } = periodos();
  const pd = partidasDominio(S.days, r).individual, pda = partidasDominio(S.days, a).individual;
  const f = finales(S.days, r);
  const dif = dificultad(S.days, r, now);
  const term = Object.values(f.porJuego).reduce((k, g) => k + g.finIndividual, 0);
  const ab = dif.reduce((k, g) => k + g.abandonos, 0), emp = dif.reduce((k, g) => k + g.empezadas, 0);
  const juegos = Object.entries(pd.byGame).sort((x, y) => y[1] - x[1]);
  const maxJ = Math.max(0, ...juegos.map(([, v]) => v));
  const maxD = Math.max(0, ...dif.map(g => g.empezadas));
  const q = xs => (xs[1] === null ? '—' : `${xs[0]}–${xs[1]}–${xs[2]}`);
  const qT = xs => (xs[1] === null ? '—' : xs.map(x => `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`).join('–'));
  return [
    ...titulo(`🧍 Individual · ${tituloRango()}`, 'Games for one person: The Cup\'s standalone games, the solo ones and One a Day. UTC days.'),
    franja('pulso'),
    el('div', { class: 'tiles' },
      tile(pd.total, 'individual games', { cambio: variacion(pd.total, pda.total) }),
      tile(pctTxt(pctDe(term, pd.total)), 'finished', { info: 'since D-348' }),
      tile(pctTxt(pctDe(ab, emp)), 'abandoned halfway', { info: 'no ending and an hour without signal', hot: emp > 0 && ab / emp > 0.3 }),
      tile(f.otras, '"again"', { info: 'all offline games: not split by domain' }),
    ),
    franja('diag'),
    conCsv(bloque('Real difficulty', 'Of finished games: the score (0 to 100) and the time in quartiles, the low, middle and high one. A game with a very high middle is easy; one with many abandoned halfway, frustrating. A variant counts separately.',
      lista(dif.map(g => bar(g.variante ? `${gameLabel(g.game)} · ${g.variante}` : gameLabel(g.game), [seg(C_SIN_RED, g.terminadas), seg('rgba(255,255,255,0.25)', g.empezadas - g.terminadas)], maxD, {
        cifra: g.empezadas, detail: `score ${q(g.puntaje)} · time ${qT(g.tiempo)} · ${pctTxt(pctDe(g.abandonos, g.empezadas))} abandoned`,
      })), 'Nothing yet.', 'bars')),
      'individuales-dificultad', dif.map(g => ({ juego: g.k, empezadas: g.empezadas, terminadas: g.terminadas, abandonos: g.abandonos, puntaje_p25: g.puntaje[0], puntaje_p50: g.puntaje[1], puntaje_p75: g.puntaje[2], seg_p25: g.tiempo[0], seg_p50: g.tiempo[1], seg_p75: g.tiempo[2] }))),
    conCsv(bloque('Games by game', null, lista(juegos.map(([id, v]) => bar(gameLabel(id), [seg(C_SIN_RED, v)], maxJ, { href: ir('juego', [id]) })), 'Nothing yet.', 'bars')),
      'individuales-juegos', juegos.map(([id, v]) => ({ juego: id, partidas: v }))),
    franja('tend'),
    serie('Individual games per period', null, pd.byDay, r, [['total', C_SIN_RED]], 'individuales-serie'),
    sinRedRecientes(r, 'individual'),
  ];
}

/** Uno al día as its own domain (D-348): the block it had in Games, with the bands. */
function vistaUnoAlDia(now) {
  const { r, a } = periodos();
  const u = unoAlDiaDelRango({ days: S.days, ...S.uad }, { from: r.from, to: r.to, hoy: dayOf(now) });
  const ua = unoAlDiaDelRango({ days: S.days, ...S.uad }, { from: a.from, to: a.to, hoy: a.to });
  return [
    ...titulo(`📅 One a Day · ${tituloRango()}`, 'The game of the day, the same for everyone (D-230). UTC days.'),
    franja('pulso'),
    el('div', { class: 'tiles' },
      tile(u.partidas, 'games', { cambio: variacion(u.partidas, ua.partidas) }),
      tile(u.jugadores, 'players with a name', { cambio: variacion(u.jugadores, ua.jugadores) }),
      tile(pctTxt(u.d1), 'back the next day'),
      tile(pctTxt(u.d7), 'back after 7 days'),
    ),
    franja('diag'),
    bloqueUnoAlDia(r),
    franja('tend'),
    serie('One a Day games per period', null, u.porDia, r, [['total', C_SIN_RED]], 'uno-al-dia-serie'),
  ];
}

const VUELTA_LABEL = { nueva: 'First time', d1: 'The next day', 'd2-7': 'Between 2 and 7 days', 'd8-30': 'Between 8 and 30 days', d31: 'More than 30 days' };
const FREC_LABEL = { f1: '1 day of 28', 'f2-3': '2 to 3 days', 'f4-7': '4 to 7 days', 'f8-14': '8 to 14 days', f15: '15 days or more' };

/**
 * Users (D-348, D-349): active browsers, new and returning, cohorts, frequency, and where they
 * are from and in which language they play (what Audience showed).
 */
function vistaUsuarios(now) {
  const { r, a } = periodos();
  const u = usuarios(S.days, r), ua = usuarios(S.days, a);
  const sg = senales(S.days, r);
  const co = cohortes(S.days, { hoy: Math.min(r.to, dayOf(now)) });
  const vuelta = ordenTramos(sg.vuelta), frec = ordenTramos(sg.frec);
  const maxV = Math.max(0, ...vuelta.map(([, v]) => v)), maxF = Math.max(0, ...frec.map(([, v]) => v));
  const audiencia = vistaAudiencia(now).slice(3);
  const desde = u.desde === null ? 'No browsers counted yet: they are counted since D-349.' : u.desde > r.from ? `Counted since ${dayLabel(u.desde)} (D-349).` : '';
  return [
    ...titulo(`🌎 Users · ${tituloRango()}`, 'A user is a browser: a random number that lives in it and says nothing about the person, no name, no IP and never matched with anything (D-349). Whoever clears their data or uses private mode counts as new. UTC days.'),
    desde ? el('p', { class: 'muted small' }, desde) : null,
    franja('pulso'),
    el('div', { class: 'tiles' },
      tile(u.diario, 'active per day', { cambio: u.diario ? variacion(u.diario, ua.diario) : undefined }),
      tile(u.semana, 'active in 7 days'),
      tile(u.mes, 'active in 30 days'),
      tile(u.pegajosidad === null ? '—' : `${u.pegajosidad}%`, 'stickiness', { info: 'active per day over active in 30 days' }),
      tile(pctTxt(pctDe(u.porDia.reduce((k, d) => k + d.jugaron, 0), u.porDia.reduce((k, d) => k + d.activos, 0))), 'of the active ones played'),
    ),
    franja('diag'),
    el('div', { class: 'grid2' },
      conCsv(bloque('When they last came', 'Per visit: how many days since the previous one. The browser works it out and sends only the bracket.',
        lista(vuelta.map(([k, v]) => bar(VUELTA_LABEL[k] || k, [seg(C_IDIOMA, v)], maxV)), 'Nothing yet.', 'bars')), 'usuarios-vuelta', vuelta.map(([k, v]) => ({ tramo: k, visitas: v }))),
      conCsv(bloque('Frequency', 'Once per browser and day: how many of the last 28 days it came. A lot at the top is a habit.',
        lista(frec.map(([k, v]) => bar(FREC_LABEL[k] || k, [seg(C_TORNEO, v)], maxF)), 'Nothing yet.', 'bars')), 'usuarios-frecuencia', frec.map(([k, v]) => ({ tramo: k, navegadores_dia: v }))),
    ),
    serie('Active per day', 'Cyan, active ones who had come before; green, new (seen for the first time in what was downloaded).',
      u.porDia.map(d => ({ day: d.day, vuelven: d.activos - d.nuevos, nuevos: d.nuevos })), r, [['vuelven', C_TOTAL], ['nuevos', C_IDIOMA]], 'usuarios-activos'),
    franja('tend'),
    conCsv(bloque('Cohorts by week', 'Those who arrived each week (seen for the first time in what was downloaded) and what share came back exactly 1, 7 and 30 days later. "—" means it cannot be known yet. For long cohorts, pick 90 days or more.',
      co.length ? el('table', { class: 'cohortes' },
        el('thead', {}, el('tr', {}, ...['Week', 'Arrived', 'Day 1', 'Day 7', 'Day 30'].map(x => el('th', {}, x)))),
        el('tbody', {}, ...co.map(c => el('tr', {}, el('td', {}, periodLabel(c.semana, 'semana')), el('td', {}, n(c.tamano)), ...[c.d1, c.d7, c.d30].map(p => el('td', { style: p === null ? null : `background:rgba(46,230,214,${Math.min(0.6, p / 100)})` }, pctTxt(p))))))) : el('p', { class: 'empty' }, 'Nothing yet.')),
      'usuarios-cohortes', co.map(c => ({ semana: periodLabel(c.semana, 'semana'), ...c }))),
    ...audiencia,
  ];
}

/* ------------------------------------------------------------------ */
/* Timeline: the key events (D-408)                                    */
/* ------------------------------------------------------------------ */
/** Each kind of key event: icon, name and color. The kinds and their order come from `timeline.js`. */
const KIND = {
  'cup-game': ['🏆', 'La Copa games', C_TORNEO],
  room: ['📡', 'Room games', C_TOTAL],
  offline: ['🎮', 'Offline games', C_SIN_RED],
  daily: ['📅', 'One a Day', C_IDIOMA],
  'cup-new': ['✨', 'Cups created', 'var(--purple)'],
  'cup-join': ['✍️', 'Cup sign-ups', 'var(--purple)'],
  'cup-end': ['🏁', 'Cups finished', C_TORNEO],
  feedback: ['💬', 'Feedback', 'var(--yellow)'],
};
const TL_GRAINS = [['day', 'By day'], ['week', 'By week'], ['month', 'By month']];
const GRANO_TL = { dia: 'day', semana: 'week', mes: 'month' };
const TL_VISIBLES = 100;
const FEEDBACK_TIPO = { sugerencia: 'a suggestion', problema: 'a problem report', idea: 'an idea', otro: 'a message' };

/** "Javi", "Javi and Cata", "Ana, Leo and Bia", each with their flag; no name is "Someone". */
const quienes = who => {
  const xs = who.map(w => (w.name ? quien(w.name, w.co) : el('span', { class: 'quien' }, 'Someone', bandera(w.co))));
  return xs.flatMap((x, i) => [i === 0 ? '' : i === xs.length - 1 ? ' and ' : ', ', x]);
};
const copaTxt = c => [`La Copa (${c.name})`, c.lab ? el('span', { class: 'tag' }, 'lab') : null];

/** One key event as a sentence: who did what, and a second line with how it went. */
function frase(e) {
  const modo = e.mode && MODES[e.mode] ? ` ${MODES[e.mode].label}` : '';
  const empezo = e.startedAt ? `started ${horaLabel(e.startedAt)}` : '';
  const gano = e.tie ? '🤝 tie' : e.winner ? `🏆 ${e.winner} won` : '';
  switch (e.kind) {
    case 'cup-game': return [[...quienes(e.who), ' played ', ...copaTxt(e.cup), `, day ${e.cup.day}: `, miniLabel(e.game)],
      [`${e.s} of 100 in ${duracion(e.ms)}`, empezo].filter(Boolean).join(' · ')];
    case 'room': return [[...quienes(e.who), ' played ', gameLabel(e.game), ' on two phones'], [gano, empezo].filter(Boolean).join(' · ')];
    case 'offline': return [[...quienes(e.who), ' finished ', gameLabel(e.game), modo ? `,${modo}` : ''], [gano, e.detail, empezo].filter(Boolean).join(' · ')];
    case 'daily': return [[...quienes(e.who), ' finished their One a Day: ', gameLabel(e.game)], [e.detail, empezo].filter(Boolean).join(' · ')];
    case 'cup-new': return [[...quienes(e.who), ' created ', ...copaTxt(e.cup)], `${e.cup.days} days`];
    case 'cup-join': return [[...quienes(e.who), ' joined ', ...copaTxt(e.cup)], ''];
    case 'cup-end': return [[...copaTxt(e.cup), ' finished: ', e.tie ? 'tied at the top, ' : '🏆 ', quien(e.who[0].name, e.who[0].co), e.tie ? ' among them' : ' won'], e.detail];
    case 'feedback': return [[...quienes(e.who), ` sent ${FEEDBACK_TIPO[e.tipo] || 'feedback'}`, e.tester ? el('span', { class: 'tag' }, 'lab') : null],
      `“${e.text.length > 160 ? `${e.text.slice(0, 157)}…` : e.text}”`];
    default: return [[e.kind], ''];
  }
}

function filaClave(e) {
  const [ico] = KIND[e.kind] || ['·'];
  const [texto, detalle] = frase(e);
  const cuerpo = [el('span', { class: 'hora' }, horaLabel(e.at)), el('span', { class: 'ico', 'aria-hidden': 'true' }, ico),
    el('span', { class: 'que' }, ...texto, detalle ? el('small', {}, detalle) : null)];
  return e.to ? enlace(e.to[0], e.to[1], { class: 'evento evento--link' }, ...cuerpo) : el('div', { class: 'evento' }, ...cuerpo);
}

/**
 * The moments of truth, one by one (D-408): every game that reached its end, every cup created,
 * joined or finished, and every feedback message, with who and when. Filtered by kind, counted by
 * day, week or month and by hour; tapping a period shows only its events.
 */
function vistaTimeline(now) {
  const { r, a } = periodos();
  const todos = keyEvents({ days: S.days, torneos: S.torneos, feedback: S.feedback }, r, now);
  const antes = keyEvents({ days: S.days, torneos: S.torneos, feedback: S.feedback }, a, now);
  const kinds = S.tlKinds || new Set(KINDS);
  const grano = S.tlGrain || GRANO_TL[r.grano] || 'day';
  const evs = todos.filter(e => kinds.has(e.kind));
  const cuenta = countKinds(todos), cuentaA = countKinds(antes);
  const per = periodosClave(evs, r, grano, now);
  const maxP = Math.max(0, ...per.map(p => p.total));
  const horas = byHour(evs);
  const maxH = Math.max(0, ...horas.map(h => h.total));
  const elegido = per.find(p => p.key === S.tlPeriod) || null;
  const enLista = elegido ? evs.filter(e => periodOf(e.day, grano) === elegido.key) : evs;
  const visibles = S.tlAll ? enLista : enLista.slice(0, TL_VISIBLES);
  const alternar = k => {
    const s = new Set(kinds);
    if (s.has(k) && s.size === 1) KINDS.forEach(x => s.add(x)); // the last one off turns them all back on
    else if (s.size === KINDS.length) { s.clear(); s.add(k); }  // from all, a tap shows only that kind
    else if (s.has(k)) s.delete(k); else s.add(k);
    S.tlKinds = s.size === KINDS.length ? null : s; S.tlAll = false; render();
  };
  const segs = byKind => KINDS.filter(k => kinds.has(k)).map(k => ({ ...seg(KIND[k][2], byKind[k] || 0), title: KIND[k][0] }));
  const pr = pacificRange(r, now);
  const grupos = [];
  for (const e of visibles) { if (grupos.at(-1)?.day !== e.day) grupos.push({ day: e.day, evs: [] }); grupos.at(-1).evs.push(e); }
  const total = todos.filter(e => kinds.has(e.kind)).length;
  const totalA = antes.filter(e => kinds.has(e.kind)).length;
  const csv = () => enLista.map(e => ({ date: e.day, time: horaLabel(e.at), kind: e.kind, who: e.who.map(w => w.name || 'Someone').join(' + '),
    game: e.game || '', cup: e.cup?.name || '', detail: frase(e)[1] || '' }));

  return [
    ...titulo(`🕑 Timeline · ${tituloRango()}`, `The moments of truth, one by one: every game that reached its end, every cup created, joined or finished, and every feedback message. Opening a page, starting a game or leaving it halfway is not here. Rooms and offline games follow the environment above; cups and feedback have none. ${ZONA_NOMBRE}, Pacific dates.`),
    el('div', { class: 'tiles' },
      tile(total, `⭐ key events${kinds.size < KINDS.length ? ' (filtered)' : ''}`, { cambio: variacion(total, totalA), info: `${n(evs.filter(e => ['cup-game', 'room', 'offline', 'daily'].includes(e.kind)).length)} games finished` }),
      ...KINDS.map(k => tile(cuenta[k], `${KIND[k][0]} ${KIND[k][1]}`, { onClick: () => alternar(k), pressed: kinds.has(k), cambio: variacion(cuenta[k], cuentaA[k]) }))),
    el('p', { class: 'muted small' }, 'Tap a kind to see only it; tap more to add them; tap the last one again to see them all.'),
    el('div', { class: 'grid2' },
      bloque('When', elegido ? `Showing ${elegido.label} below. Tap it again to see the whole range.` : 'Tap a period to see only its events below.',
        filtros(TL_GRAINS, grano, v => { S.tlGrain = v; S.tlPeriod = null; render(); }, 'Group by'),
        lista(per.map(p => {
          const b = bar(p.label, segs(p.byKind), maxP);
          return el('button', { type: 'button', class: `bar-btn${p.key === S.tlPeriod ? ' bar-btn--on' : ''}`, 'aria-pressed': String(p.key === S.tlPeriod),
            onClick: () => { S.tlPeriod = p.key === S.tlPeriod ? null : p.key; S.tlAll = false; render(); } }, b);
        }), 'Nothing yet.', 'bars')),
      bloque('Time of day', `When the key events happen, by hour, ${ZONA_NOMBRE}.`,
        lista(horas.filter(h => h.total || (h.hour >= 7 && h.hour <= 23)).map(h => bar(`${String(h.hour).padStart(2, '0')}:00`, [seg(C_TOTAL, h.total)], maxH)), 'Nothing yet.', 'bars'))),
    conCsv(bloque(elegido ? `Key events · ${elegido.label}` : 'Key events', `Newest first. Tap one to open its room, game or cup. From ${periodLabelDia(pr.from)} to ${periodLabelDia(pr.to)}.`,
      grupos.length ? el('div', { class: 'historia' }, ...grupos.flatMap(g => [el('p', { class: 'dia-grupo' }, fechaLabel(Date.parse(`${g.day}T12:00:00Z`))), ...g.evs.map(filaClave)]))
        : el('p', { class: 'empty' }, 'No key events in this range.'),
      enLista.length > TL_VISIBLES ? el('button', { type: 'button', class: 'btn btn--ghost btn--sm mas', onClick: () => { S.tlAll = !S.tlAll; render(); } }, S.tlAll ? 'Show fewer' : `Show all ${n(enLista.length)}`) : null),
    'timeline', csv),
  ];
}
const periodLabelDia = d => new Date(d * DAY).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });

/* ------------------------------------------------------------------ */
/* 📣 Campaigns (D-454)                                                */
/* ------------------------------------------------------------------ */
const ESTADO_CAMPANA = { live: ['🟢', 'Showing'], scheduled: ['🕒', 'Scheduled'], ended: ['⏹', 'Ended'], off: ['⚪', 'Off'] };
const STRIP_DAYS = 30;
const diaCorto = d => new Date(`${d}T12:00:00`).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });

/** Saves every switch at once: what the home page reads on its next visit. */
async function guardarCampanas(rows) {
  S.splashMsg = 'Saving…'; render();
  try { await set(ref(db, 'splash'), toRemote(rows)); S.splashMsg = `Saved ✓ ${horaLabel(Date.now())}: players get it on their next visit to the home page.`; }
  catch (e) { S.splashMsg = `Not saved (${e?.code || e?.message || 'error'}). Nothing changed for players.`; }
  render();
}

/**
 * How each campaign did in the range (D-461): reach, taps and closes against the days it was shown.
 * One row per campaign shown in the range; tapping one opens its days below.
 */
const C_PLAY = 'var(--lime)', C_CLOSE = 'var(--cyan)', C_REST = 'rgba(255, 255, 255, 0.28)';
const tasa = x => (x === null ? '—' : `${Math.round(x * 100)}%`);
const unDecimal = x => (x === null ? '—' : x.toLocaleString(LOCALE, { maximumFractionDigits: 1 }));
function bloqueResultados(rows) {
  const rango = rangeOf(S.range);
  const todas = rows.map(s => campaignStats(S.days, s.id, rango)).filter(Boolean);
  const nombre = id => `${CAMPAIGNS[id]?.emoji || ''} ${S.splash?.[id]?.label || (CAMPAIGNS[id]?.title?.[PANEL_LANG] || CAMPAIGNS[id]?.title?.es) || id}`.trim();
  const nota = `${tituloRango()}, UTC days; previews never count. Reach: phones that saw it for the first time. Tapped: taps on its Play link over reach. Finished a game: in the same tab, within 2 hours of the tap. Only the days it was shown count, so switching it off and on is fine.`;
  if (!todas.length) return bloque('📊 How they did', nota, el('p', { class: 'empty' }, S.daysLoaded ? 'No campaign was shown in this range.' : 'Loading…'));
  const elegida = todas.find(c => c.id === S.campStats) || todas[0];
  const maxR = Math.max(0, ...todas.map(c => c.reach));
  const filas = todas.map(c => {
    const b = bar(nombre(c.id), [seg(C_PLAY, c.play), seg(C_REST, Math.max(0, c.reach - c.play))], maxR,
      { cifra: c.reach, detail: `${tasa(c.ctr)} tapped · ${tasa(c.conversion)} converted · ${n(c.exposed)} ${c.exposed === 1 ? 'day' : 'days'} shown · ${unDecimal(c.reach / c.exposed)} new phones a day` });
    return el('button', { type: 'button', class: 'campana-fila', 'aria-pressed': String(c === elegida), onClick: () => { S.campStats = c.id; render(); } }, b);
  });

  const c = elegida;
  const caida = c.early && c.late !== null ? Math.round(((c.late - c.early) / c.early) * 100) : null;
  const antes = c.clipped ? ' It was already showing when this range starts: pick a longer range to count from its first day.' : '';
  const saturacion = (c.late === null
    ? `Shown ${n(c.exposed)} ${c.exposed === 1 ? 'day' : 'days'} so far: too soon to tell whether it still finds new phones.`
    : `First ${EARLY_DAYS} days shown: ${unDecimal(c.early)} new phones a day; since then ${unDecimal(c.late)} a day (${caida > 0 ? '+' : ''}${caida}%). Half its reach came in its first ${n(c.halfDays)} ${c.halfDays === 1 ? 'day' : 'days'} shown.`) + antes;
  const maxD = Math.max(0, ...c.series.map(r => r.shown));
  const dias = c.series.map(r => bar(periodLabelDia(r.day), r.off ? [] : [seg(C_PLAY, r.play), seg(C_CLOSE, r.close), seg(C_REST, Math.max(0, r.shown - r.play - r.close))], maxD,
    { cifra: r.shown, sub: r.off ? 'not shown' : `day ${r.n}`, detail: r.off ? '' : `${n(r.reach)} new phones · ${n(r.finish)} finished a game · ${tasa(r.home ? r.shown / r.home : null)} of home views` }));
  const detalle = el('div', { class: 'campana-resultado' },
    el('p', { class: 'lead' }, nombre(c.id)),
    el('div', { class: 'tiles' },
      tile(c.reach, 'phones reached', { info: `${unDecimal(c.perPhone)} windows per phone` }),
      tile(tasa(c.ctr), `tapped · ${n(c.play)}`, { info: 'of phones reached' }),
      tile(tasa(c.finishRate), `finished a game · ${n(c.finish)}`, { info: `of taps · ${tasa(c.startRate)} started one` }),
      tile(tasa(c.conversion), 'converted', { info: 'finished a game, of phones reached' }),
      tile(tasa(c.closeRate), `closed · ${n(c.close)}`, { info: 'of phones reached' }),
      tile(tasa(c.coverage), 'of home page views', { info: 'on the days it was shown' }),
      tile(tasa(c.stay3), 'stayed 3 s or more', { info: `${tasa(c.stay10)} 10 s or more` }),
      tile(c.exposed, c.exposed === 1 ? 'day shown' : 'days shown', { info: `${periodLabelDia(c.firstDay)} – ${periodLabelDia(c.lastDay)}` })),
    el('p', { class: 'muted small' }, saturacion),
    el('p', { class: 'muted small leyenda' }, el('span', { style: `color:${C_PLAY}` }, '■'), ' tapped · ', el('span', { style: `color:${C_CLOSE}` }, '■'), ' closed · ', el('span', { style: `color:${C_REST}` }, '■'), ' left without answering. Each bar is the windows shown that day.'),
    lista(dias, 'Nothing yet.', 'bars'));
  return conCsv(bloque('📊 How they did', nota, lista(filas, '', 'bars'), detalle), `campaign-${c.id}`,
    () => c.series.map(r => ({ day: new Date(r.day * DAY).toISOString().slice(0, 10), shown_day: r.n ?? '', shown: r.shown, reach: r.reach, play: r.play, start: r.start, finish: r.finish, close: r.close, under3s: r.t0, s3to10: r.t1, over10s: r.t2, home_views: r.home })));
}

/**
 * ☕ Buy me a coffee, as an always-on campaign (D-448): its funnel in the range, from invitation to
 * payment, and its days. It has no switch here: it is always in the home footer and at some endings.
 */
const C_OPEN = 'var(--yellow)';
function bloqueApoyo() {
  const c = supportStats(S.days, rangeOf(S.range));
  const nota = `${tituloRango()}, UTC days; ?test never counts. Always on: the home footer link (not counted as shown) and an invitation at the end of some games (shown). Opened counts both.`;
  if (!c) return bloque("📊 How it did", nota, el('p', { class: 'empty' }, S.daysLoaded ? 'Nothing counted in this range.' : 'Loading…'));
  const maxD = Math.max(0, ...c.series.map(r => Math.max(r.shown, r.open)));
  const dias = c.series.map(r => bar(periodLabelDia(r.day), [seg(C_OPEN, r.open), seg(C_REST, Math.max(0, r.shown - r.open))], maxD,
    { cifra: r.open, sub: `${n(r.shown)} shown`, detail: `${n(r.pay)} to Stripe · ${n(r.thanks)} paid` }));
  return conCsv(bloque("📊 How it did", nota,
    el('div', { class: 'tiles' },
      tile(c.shown, 'invitations shown', { info: 'at the end of games' }),
      tile(c.open, `card opened · ${tasa(c.openRate)}`, { info: 'of invitations (the footer opens it too)' }),
      tile(c.pay, `went to Stripe · ${tasa(c.payRate)}`, { info: 'of cards opened' }),
      tile(c.thanks, `paid · ${tasa(c.thanksRate)}`, { info: 'of those who went to Stripe' })),
    el('p', { class: 'muted small leyenda' }, el('span', { style: `color:${C_OPEN}` }, '■'), ' card opened · ', el('span', { style: `color:${C_REST}` }, '■'), ' the rest of the invitations shown. The number is the cards opened that day, from the footer too.'),
    lista(dias, 'Nothing yet.', 'bars')), 'support',
  () => c.series.map(r => ({ day: new Date(r.day * DAY).toISOString().slice(0, 10), shown: r.shown, open: r.open, pay: r.pay, thanks: r.thanks })));
}

function vistaSplash(today) {
  const rows = switches({ remote: S.splash, active: SPLASH_ACTIVE, campaigns: CAMPAIGNS });
  const cambiar = (id, cambio) => guardarCampanas(rows.map(s => (s.id === id ? { ...s, ...cambio } : s)));
  const vivas = rows.filter(s => campaignStatus(s, today) === 'live');
  // The owner's label first, else the title players read
  const nombreDe = id => rows.find(r => r.id === id)?.label || CAMPAIGNS[id].title?.[PANEL_LANG] || CAMPAIGNS[id].title?.es || id;
  const cruces = overlaps(rows, today, 60);

  const resumen = el('div', { class: 'panel campanas-hoy' },
    el('p', { class: 'lead' }, vivas.length ? `Today the home page shows ${vivas.length === 1 ? 'one campaign' : `${vivas.length} campaigns, one per visit, in this order`}` : 'Today the home page shows no campaign'),
    vivas.length ? el('ol', { class: 'campanas-cola' }, vivas.map(s => el('li', {}, `${CAMPAIGNS[s.id].emoji || ''} ${nombreDe(s.id)}`))) : null,
    ...cruces.map(c => el('p', { class: 'campanas-cruce' }, `⚠️ ${c.from === c.to ? diaCorto(c.from) : `${diaCorto(c.from)}–${diaCorto(c.to)}`}: ${c.ids.length} on together. A player sees ${c.ids.map(id => `${CAMPAIGNS[id].emoji || ''} ${nombreDe(id)}`.trim()).join(', then ')}, one per visit.`)),
    S.splash === null ? el('p', { class: 'muted small' }, 'Not saved from here yet: the home page uses the list in splash.js until the first change.') : null,
    S.splashMsg ? el('p', { class: 'campanas-msg', role: 'status' }, S.splashMsg) : null);

  // The next 30 days, one row per campaign that is on: overlaps are seen at a glance
  const tiras = rows.filter(s => span(s, today, STRIP_DAYS));
  const tira = tiras.length ? el('div', { class: 'panel campanas-tira' },
    el('div', { class: 'tira-ejes muted small' }, el('span', {}, 'Today'), el('span', {}, diaCorto(dayPlus(today, 14))), el('span', {}, diaCorto(dayPlus(today, STRIP_DAYS - 1)))),
    tiras.map(s => {
      const sp = span(s, today, STRIP_DAYS);
      return el('div', { class: 'tira-fila', title: s.id },
        el('span', { class: 'tira-emoji', 'aria-hidden': 'true' }, CAMPAIGNS[s.id].emoji || '·'),
        el('span', { class: 'tira-pista' }, el('span', { class: `tira-barra${sp.open ? ' abierta' : ''}`, style: `left:${(sp.start / STRIP_DAYS) * 100}%;width:${((sp.end - sp.start + 1) / STRIP_DAYS) * 100}%` })));
    })) : null;

  const tarjetas = rows.map((s, i) => {
    const c = CAMPAIGNS[s.id];
    const st = campaignStatus(s, today);
    const [ico, txt] = ESTADO_CAMPANA[st];
    const nombre = nombreDe(s.id);
    const titulo = c.title?.[PANEL_LANG] || c.title?.es || s.id;
    const renombrar = () => {
      const t = window.prompt('Your name for this campaign (only you see it; empty goes back to its title):', s.label || titulo);
      if (t !== null) cambiar(s.id, { label: cleanLabel(t) === titulo ? null : cleanLabel(t) });
    };
    const abrir = () => { S.campOpen.add(s.id); render(); };
    const cerrar = () => { S.campOpen.delete(s.id); render(); };
    // An off campaign folds to its emoji and title; a tap opens it (the owner's request). It stays open for this visit
    if (!s.on && !S.campOpen.has(s.id)) {
      return el('button', { type: 'button', class: 'campana-plegada', 'aria-expanded': 'false', onClick: abrir },
        el('span', { class: 'campana-emoji', 'aria-hidden': 'true' }, c.emoji || '📣'),
        el('strong', { class: 'campana-titulo' }, nombre),
        el('span', { class: 'campana-renombrar', role: 'button', tabindex: '0', 'aria-label': `Rename ${nombre}`, title: 'Rename',
          onClick: e => { e.stopPropagation(); renombrar(); }, onKeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); renombrar(); } } }, '✏️'),
        el('span', { class: 'campana-chev', 'aria-hidden': 'true' }, '›'));
    }
    const detalle = st === 'scheduled' ? `starts ${diaCorto(s.from)}` : st === 'live' ? (s.until ? `until ${diaCorto(s.until)}` : 'no end day')
      : st === 'ended' ? `ended ${diaCorto(s.until)}` : '';
    // A day is a pill with the native picker laid over it: one tap opens the phone's calendar
    const dia = (campo, label, vacio) => el('div', { class: `campana-dia${s[campo] ? ' puesto' : ''}` },
      el('span', { class: 'campana-dia-label' }, label),
      el('span', { class: 'campana-dia-valor' }, s[campo] ? diaCorto(s[campo]) : vacio),
      el('input', { type: 'date', value: s[campo] || '', 'aria-label': `${label}: ${s[campo] ? diaCorto(s[campo]) : vacio}`,
        min: campo === 'until' ? s.from || null : null, max: campo === 'from' ? s.until || null : null,
        onChange: e => cambiar(s.id, { [campo]: e.target.value || null }) }),
      s[campo] ? el('button', { type: 'button', class: 'campana-dia-x', 'aria-label': `${label}: ${vacio}`, title: vacio, onClick: () => cambiar(s.id, { [campo]: null }) }, '✕') : null);
    const base = s.from && s.from > today ? s.from : today;
    return el('article', { class: `campana campana--${st}` },
      el('header', { class: 'campana-cabeza' },
        el('span', { class: 'campana-emoji', 'aria-hidden': 'true' }, c.emoji || '📣'),
        el('div', { class: 'campana-nombre' },
          el('span', { class: 'campana-titulo-fila' },
            s.on ? el('strong', { class: 'campana-titulo' }, nombre)
              : el('button', { type: 'button', class: 'campana-titulo campana-plegar', 'aria-expanded': 'true', onClick: cerrar }, nombre),
            el('button', { type: 'button', class: 'campana-renombrar', 'aria-label': `Rename ${nombre}`, title: 'Rename', onClick: renombrar }, '✏️')),
          s.label ? el('span', { class: 'campana-langs' }, `Players see: ${titulo}`) : null,
          el('span', { class: `campana-estado estado-${st}` }, `${ico} ${txt}`, detalle ? el('span', { class: 'campana-detalle' }, ` · ${detalle}`) : null),
          c.langs ? el('span', { class: 'campana-langs' }, `${c.langs.join(' · ').toUpperCase()} only`) : null,
          // A campaign for regulars reaches fewer phones than "live" suggests (D-458)
          c.audience === 'regulars' ? el('span', { class: 'campana-langs' }, `Regulars only: ${REGULARS.days}+ days in 4 weeks${REGULARS.games ? `, ${REGULARS.games}+ games` : ''}, not paid`) : null),
        el('label', { class: 'interruptor' },
          el('input', { type: 'checkbox', role: 'switch', checked: s.on, 'aria-label': `${nombre} on`, onChange: e => cambiar(s.id, { on: e.target.checked }) }),
          el('span', { class: 'interruptor-pista', 'aria-hidden': 'true' }))),
      el('div', { class: 'campana-dias' }, dia('from', 'Starts', 'Now'), el('span', { class: 'campana-flecha', 'aria-hidden': 'true' }, '→'), dia('until', 'Ends', 'Never')),
      el('div', { class: 'campana-segmento', role: 'group', 'aria-label': 'End in' },
        ...[[7, '1 week'], [14, '2 weeks'], [30, '1 month']].map(([d, t]) => {
          const fin = dayPlus(base, d - 1);
          return el('button', { type: 'button', 'aria-pressed': s.until === fin ? 'true' : 'false', onClick: () => cambiar(s.id, { on: true, until: fin }) }, t);
        })),
      el('footer', { class: 'campana-pie' },
        el('span', { class: 'campana-orden' },
          el('button', { type: 'button', class: 'icono-btn', disabled: i === 0, 'aria-label': 'Move up', onClick: () => guardarCampanas(move(rows, s.id, -1)) }, '↑'),
          el('span', { class: 'campana-pos' }, `${i + 1} of ${rows.length}`),
          el('button', { type: 'button', class: 'icono-btn', disabled: i === rows.length - 1, 'aria-label': 'Move down', onClick: () => guardarCampanas(move(rows, s.id, 1)) }, '↓')),
        el('span', { class: 'campana-vistas' },
          el('button', { type: 'button', class: 'campana-preview vistazo-btn', 'aria-expanded': S.campPeek.has(s.id) ? 'true' : 'false',
            onClick: () => { S.campPeek.has(s.id) ? S.campPeek.delete(s.id) : S.campPeek.add(s.id); render(); } }, 'Quick look 👀'),
          el('a', { class: 'campana-preview', href: `../?splash=${encodeURIComponent(s.id)}`, target: '_blank', rel: 'noopener' }, 'Live Preview 🔎'))),
      S.campPeek.has(s.id) ? vistazo(s.id, nombre) : null);
  });

  return [
    el('p', { class: 'muted small' }, 'The splash over the home page. Each player sees a campaign once; with several on, one per visit, top first. New campaigns are made by asking Claude; here they are switched, dated, ordered and renamed (✏️, only you see the name).'),
    resumen, tira, bloqueResultados(rows), tarjetas,
  ];
}

/* A quick look at a splash without leaving the panel: the real home page with that campaign forced
   (`?splash=`, which records nothing), drawn at phone size and shrunk. Opened by Quick look 👀 in the card's footer;
   it stays open across re-renders for this visit */
function vistazo(id, nombre) {
  return el('div', { class: 'vistazo-marco' },
    el('iframe', { src: `../?splash=${encodeURIComponent(id)}`, title: `${nombre}: splash preview`, tabindex: '-1' }));
}

/* 🧩 Site features and 🎨 skins (D-477): `controls/`, read by the site through assets/js/controls.js */
async function guardarControl(path, value) {
  S.controlsMsg = 'Saving…'; render();
  try { await set(ref(db, `controls/${path}`), value); S.controlsMsg = `Saved ✓ ${horaLabel(Date.now())}: players get it on their next visit to the home page.`; }
  catch (e) { S.controlsMsg = `Not saved (${e?.code || e?.message || 'error'}). Nothing changed for players.`; }
  render();
}
const msgControles = () => (S.controlsMsg ? el('p', { class: 'campanas-msg', role: 'status' }, S.controlsMsg) : null);
const interruptor = (on, label, cambiar) => el('label', { class: 'interruptor' },
  el('input', { type: 'checkbox', role: 'switch', checked: on, 'aria-label': label, onChange: e => cambiar(e.target.checked) }),
  el('span', { class: 'interruptor-pista', 'aria-hidden': 'true' }));

/** The site's fixed features, each part with its own switch. Only ☕ today; a new one is a row here and in controls.js. */
const FUNCIONES = {
  support: {
    emoji: '☕', name: () => SUPPORT_TEXTS[PANEL_LANG].title, lab: '../?support=open',
    parts: [['footer', 'Home page footer link', 'Under 💬 Suggestions and comments, on every visit.'],
      ['endings', 'Invitation at the end of games', 'After 5 games, at most once a week, never with the inbox link. Follows the switch from the player’s next home page visit.']],
  },
};
function vistaFunciones() {
  const tarjetas = Object.entries(FUNCIONES).map(([id, f]) => {
    const saved = S.controls?.features?.[id] || {};
    const on = p => saved[p] !== false;
    const vivas = f.parts.filter(([p]) => on(p)).length;
    const st = vivas ? 'live' : 'off';
    const cambiar = (p, v) => guardarControl(`features/${id}`, { ...Object.fromEntries(f.parts.map(([q]) => [q, on(q)])), [p]: v, at: Date.now() });
    return el('article', { class: `campana campana--${st}` },
      el('header', { class: 'campana-cabeza' },
        el('span', { class: 'campana-emoji', 'aria-hidden': 'true' }, f.emoji),
        el('div', { class: 'campana-nombre' },
          el('strong', { class: 'campana-titulo' }, f.name()),
          el('span', { class: `campana-estado estado-${st}` }, vivas ? `🟢 Always on · ${vivas} of ${f.parts.length} places` : '⚪ Off everywhere'))),
      ...f.parts.map(([p, label, nota]) => el('div', { class: 'control-parte' },
        el('div', {}, el('strong', {}, label), el('p', { class: 'muted small' }, nota)),
        interruptor(on(p), `${label} on`, v => cambiar(p, v)))),
      el('footer', { class: 'campana-pie' }, el('span'), el('a', { class: 'campana-preview', href: f.lab, target: '_blank', rel: 'noopener' }, 'Live Preview 🔎')));
  });
  return [el('p', { class: 'muted small' }, 'Permanent parts of the site: switch each place they show on or off. How they did is below.'),
    msgControles(), ...tarjetas, bloqueApoyo()];
}

const MODO_SKIN = [['yearly', 'Every year'], ['dates', 'These days'], ['off', 'Off']];
const mmddCorto = d => diaCorto(`2026-${d}`);
function vistaSkins(today) {
  const rows = skinRows({ remote: S.controls?.skins, templates: SKINS, today });
  const guardar = (s, cambio) => guardarControl(`skins/${s.id}`, skinToRemote({ ...s, ...cambio }));
  const tarjetas = rows.map(s => {
    const t = SKINS[s.id];
    const [ico, txt] = ESTADO_CAMPANA[s.status];
    const nombre = s.id[0].toUpperCase() + s.id.slice(1);
    const detalle = !s.days ? '' : s.status === 'live' ? (s.days.to ? `until ${diaCorto(s.days.to)}` : 'no end day')
      : s.status === 'scheduled' ? `starts ${diaCorto(s.days.from)}` : `ended ${diaCorto(s.days.to)}`;
    const dia = (campo, label, vacio) => el('div', { class: `campana-dia${s[campo] ? ' puesto' : ''}` },
      el('span', { class: 'campana-dia-label' }, label),
      el('span', { class: 'campana-dia-valor' }, s[campo] ? diaCorto(s[campo]) : vacio),
      el('input', { type: 'date', value: s[campo] || '', 'aria-label': `${label}: ${s[campo] ? diaCorto(s[campo]) : vacio}`,
        min: campo === 'until' ? s.from || null : null, max: campo === 'from' ? s.until || null : null,
        onChange: e => guardar(s, { [campo]: e.target.value || null }) }));
    // "These days" starts from its next yearly run, so one tap keeps the dates it already had
    const elegir = m => guardar(s, m === 'dates' && !s.from ? { mode: m, from: s.days?.from || today, until: s.days?.to || null } : { mode: m });
    return el('article', { class: `campana campana--${s.status}` },
      el('header', { class: 'campana-cabeza' },
        el('span', { class: 'campana-emoji', 'aria-hidden': 'true' }, t.icon?.emoji || '🎨'),
        el('div', { class: 'campana-nombre' },
          el('strong', { class: 'campana-titulo' }, nombre),
          el('span', { class: `campana-estado estado-${s.status}` }, `${ico} ${txt}`, detalle ? el('span', { class: 'campana-detalle' }, ` · ${detalle}`) : null),
          el('span', { class: 'campana-langs' }, `Its days: ${mmddCorto(s.yearly.from)} – ${mmddCorto(s.yearly.to)}, every year`),
          s.public ? null : el('span', { class: 'campana-langs' }, '🧪 In the lab: only lab key holders see it'))),
      el('div', { class: 'campana-segmento', role: 'group', 'aria-label': 'When' },
        ...MODO_SKIN.map(([m, l]) => el('button', { type: 'button', 'aria-pressed': String(s.mode === m), onClick: () => elegir(m) }, l))),
      s.mode === 'dates' ? el('div', { class: 'campana-dias' }, dia('from', 'Starts', 'Today'), el('span', { class: 'campana-flecha', 'aria-hidden': 'true' }, '→'), dia('until', 'Ends', 'Never')) : null,
      el('footer', { class: 'campana-pie' }, el('span'), el('a', { class: 'campana-preview', href: `../?season=${encodeURIComponent(s.id)}`, target: '_blank', rel: 'noopener' }, 'Live Preview 🔎')));
  });
  return [el('p', { class: 'muted small' }, 'The home page dressed for a date (D-457), never the games. Each skin comes on by its own days every year; move it or switch it off here. New ones: ask Claude.'),
    msgControles(), ...tarjetas];
}

/* 🚩 Lab flags (D-498): `flags/`, read by the site through assets/js/flags.js */
const MODO_FLAG = [['lab', '🧪 Lab'], ['all', '🚀 Everyone'], ['off', '⚪ Off']];
const ESTADO_FLAG = { lab: ['🧪', 'In the lab: only lab key holders'], all: ['🟢', 'Live for everyone'], off: ['⚪', 'Off for everyone, the lab too'] };
async function guardarFlag(id, state) {
  S.controlsMsg = 'Saving…'; render();
  try { await set(ref(db, `flags/${id}`), { state, at: Date.now() }); S.controlsMsg = `Saved ✓ ${horaLabel(Date.now())}: players get it the next time they open that page.`; }
  catch (e) { S.controlsMsg = `Not saved (${e?.code || e?.message || 'error'}). Nothing changed for players.`; }
  render();
}
function vistaFlags() {
  const tarjetas = Object.entries(FLAGS).map(([id, nombre]) => {
    const st = flagState(S.flags, id);
    const [ico, txt] = ESTADO_FLAG[st];
    const at = S.flags?.[id]?.at;
    return el('article', { class: `campana campana--${st === 'all' ? 'live' : 'off'}` },
      el('header', { class: 'campana-cabeza' },
        el('span', { class: 'campana-emoji', 'aria-hidden': 'true' }, '🚩'),
        el('div', { class: 'campana-nombre' },
          el('strong', { class: 'campana-titulo' }, nombre),
          el('span', { class: `campana-estado estado-${st === 'all' ? 'live' : 'off'}` }, `${ico} ${txt}`, at ? el('span', { class: 'campana-detalle' }, ` · since ${diaCorto(todayOf(at))}`) : null))),
      el('div', { class: 'campana-segmento', role: 'group', 'aria-label': 'Who gets it' },
        ...MODO_FLAG.map(([m, l]) => el('button', { type: 'button', 'aria-pressed': String(st === m), onClick: () => guardarFlag(id, m) }, l))),
      el('footer', { class: 'campana-pie' }, el('span'), el('a', { class: 'campana-preview', href: `../labs/#seccion-${id}`, target: '_blank', rel: 'noopener' }, 'Its lab card 🧪')));
  });
  return [el('p', { class: 'muted small' }, 'What is being tried on pages players visit. 🚀 Everyone publishes it at once, no PR; 🧪 Lab takes it back. A cleanup PR later removes the gates that stayed on Everyone.'),
    msgControles(), ...tarjetas];
}

/**
 * 📣 Campaigns: the one place for everything temporary or switchable on the site (D-477), in three
 * tabs, with today's state of all three on top.
 */
function vistaCampanas(now) {
  const today = todayOf(now);
  if (S.splash === undefined || S.controls === undefined || S.flags === undefined) return [el('p', { class: 'muted' }, 'Loading…')];
  const splashVivas = switches({ remote: S.splash, active: SPLASH_ACTIVE, campaigns: CAMPAIGNS }).filter(s => campaignStatus(s, today) === 'live').length;
  const skinViva = skinRows({ remote: S.controls?.skins, templates: SKINS, today }).filter(s => s.status === 'live');
  const funciones = Object.entries(FUNCIONES).map(([id, f]) => [f, f.parts.filter(([p]) => S.controls?.features?.[id]?.[p] !== false).length]);
  const TABS = [
    ['splash', '📣 Splash screens', splashVivas ? `${splashVivas} showing` : 'none showing'],
    ['features', '🧩 Site features', funciones.map(([f, k]) => `${f.emoji} ${k ? 'on' : 'off'}`).join(' · ')],
    ['skins', '🎨 Site skins', skinViva.length ? skinViva.map(s => `${SKINS[s.id].icon?.emoji || '🎨'} on`).join(' · ') : 'none on'],
    ['flags', '🚩 Lab flags', `${Object.keys(FLAGS).filter(id => flagState(S.flags, id) === 'all').length} of ${Object.keys(FLAGS).length} for everyone`],
  ];
  const tab = TABS.some(([k]) => k === S.campTab) ? S.campTab : 'splash';
  const pestanas = el('div', { class: 'campanas-tabs', role: 'tablist', 'aria-label': 'Kind' },
    ...TABS.map(([k, l, hoy]) => el('button', { type: 'button', role: 'tab', 'aria-selected': String(k === tab), onClick: () => { S.campTab = k; render(); } },
      el('span', { class: 'campanas-tab-nombre' }, l), el('span', { class: 'campanas-tab-hoy' }, hoy))));
  const cuerpo = tab === 'features' ? vistaFunciones() : tab === 'skins' ? vistaSkins(today) : tab === 'flags' ? vistaFlags() : vistaSplash(today);
  return [...titulo('📣 Campaigns', 'Everything temporary or switchable on the site, in one place. Each tab says what is on today.'), pestanas, ...cuerpo];
}

/* ------------------------------------------------------------------ */
/* Navegación                                                          */
/* ------------------------------------------------------------------ */
/** Ícono y nombre de cada sección. El de The Cup sale del registro de juegos (C-16). */
const SECCION = {
  resumen: ['📊', 'Summary'],
  timeline: ['🕑', 'Timeline'],
  grupo: ['👥', 'Group'],
  individuales: ['🧍', 'Individual'],
  torneo: TORNEO ? [TORNEO.emoji, TORNEO.name[PANEL_LANG] || TORNEO.name.es] : ['🏆', 'Tournament'],
  unoaldia: ['📅', 'One a Day'],
  usuarios: ['🌎', 'Users'],
  trafico: ['📈', 'Traffic'],
  salud: ['🩺', 'Health'],
  campanas: ['📣', 'Campaigns'],
};

function renderNav(now) {
  const actual = seccionDe(S.ruta);
  // Un punto verde en Ahora cuando hay algo en juego: se ve desde cualquier sección
  const algo = liveLocal(S.days, now).length > 0 || copasEnCurso(S.torneos, now).some(c => c.jugando.length) || salasVivas(now).propias.some(r => r.active);
  // Un punto rojo en Salud si hoy o ayer alguna página no arrancó (D-251)
  const noArranca = salud(S.days, { from: dayOf(now) - 1, to: dayOf(now) }).total.arranque > 0;
  $('#nav').replaceChildren(...SECCIONES.map(sec => {
    const [ico, nombre] = SECCION[sec] || ['·', sec];
    return enlace(sec, [], { 'aria-current': sec === actual ? 'page' : null },
      el('span', { class: 'ico', 'aria-hidden': 'true' }, ico), el('span', { class: 'nombre' }, nombre),
      sec === 'resumen' && algo ? el('span', { class: 'vivo', title: 'Something is in play' }) : null,
      sec === 'salud' && noArranca ? el('span', { class: 'vivo vivo--alerta', title: 'A page did not start today or yesterday' }) : null);
  }), el('a', { href: '../labs/' },
    el('span', { class: 'ico', 'aria-hidden': 'true' }, '🧪'), el('span', { class: 'nombre' }, 'Labs')));
}

/** A redraw within the second, not one per message: a live room sends many (D-473). */
function renderSoon() {
  if (S.renderTimer) return;
  S.renderTimer = setTimeout(() => { S.renderTimer = null; render(); }, 1000);
}

/**
 * A cup the period's query did not bring (it ended before it), read once by its code or its own
 * link (D-473). Resolves to its code, or null if there is none.
 */
async function copaSuelta(q) {
  const t = String(q || '').trim().replace(/^\//, '');
  try {
    if (/^[A-Za-z]{5}$/.test(t)) {
      const code = t.toUpperCase();
      const x = (await get(ref(db, `torneos/${code}`))).val();
      if (x) {
        S.torneosSueltos[code] = x; S.torneos = { ...S.torneos, [code]: x };
        return code;
      }
    }
    const found = (await get(query(ref(db, 'torneos'), orderByChild('meta/alias'), equalTo(t.toLowerCase())))).val() || {};
    Object.assign(S.torneosSueltos, found); S.torneos = { ...S.torneos, ...found };
    return Object.keys(found)[0] || null;
  } catch (_) { return null; }
}

function render() {
  const now = Date.now();
  // A date being picked is not redrawn under the finger: it saves on change, and that redraws
  if (S.ruta.sec === 'campanas' && document.activeElement?.closest?.('#vista input')) return;
  MARCAS = versiones(S.days);
  const { sec, args } = S.ruta;
  let nodos;
  if (sec === 'torneo' && args[0]) nodos = vistaFichaCopa(args[0].toUpperCase(), now);
  else if (sec === 'torneo') nodos = vistaCopa(now);
  else if (sec === 'juego') nodos = vistaFichaJuego(args[0]);
  else if (sec === 'sala') nodos = vistaSala(args[0].toUpperCase(), args[1], now);
  else if (sec === 'grupo') nodos = vistaGrupo(now);
  else if (sec === 'individuales') nodos = vistaIndividuales(now);
  else if (sec === 'unoaldia') nodos = vistaUnoAlDia(now);
  else if (sec === 'usuarios') nodos = vistaUsuarios(now);
  else if (sec === 'ahora') nodos = vistaAhora(now);
  else if (sec === 'trafico') nodos = vistaTrafico(now);
  else if (sec === 'salud') nodos = vistaSalud(now);
  else if (sec === 'timeline') nodos = vistaTimeline(now);
  else if (sec === 'campanas') nodos = vistaCampanas(now);
  else nodos = vistaResumen(now);
  $('#vista').replaceChildren(...nodos.flat().filter(Boolean));
  renderNav(now);
  $('#updated').textContent = `Updated ${horaLabel(now)} · ${ZONA_NOMBRE}`;
}

/** La URL cambió (un enlace, Atrás, una dirección pegada): se dibuja esa vista desde arriba. */
function alCambiarRuta() {
  enIngles();
  const antes = S.ruta;
  S.ruta = leerRuta(location.hash);
  if (S.ruta.r && S.ruta.r !== S.range && RANGOS.some(r => r.id === S.ruta.r)) cambiarRango(S.ruta.r, false);
  if (!S.ruta.r && S.range !== RANGO_POR_DEFECTO && antes.r) cambiarRango(RANGO_POR_DEFECTO, false);
  if ((S.ruta.e || ENV_DEFECTO) !== S.env) cambiarEntorno(S.ruta.e || ENV_DEFECTO, false);
  const otra = antes.sec !== S.ruta.sec || antes.args.join('/') !== S.ruta.args.join('/');
  if (otra) {
    S.logPage = 1; S.sinRedTodas = false; S.erroresTodos = false; S.tlPeriod = null; S.tlAll = false;
    if (S.ruta.args[0] !== antes.args[0]) S.fichaTab = 'tabla';
  }
  $('#buscar-msg').hidden = true;
  render();
  if (otra) window.scrollTo(0, 0);
}

/** Una dirección de antes (`#/torneo/OFICI`) queda escrita en inglés, sin sumar un paso (C-18, D-266). */
function enIngles() {
  const nueva = rutaEnIngles(location.hash);
  if (nueva && nueva !== location.hash) try { history.replaceState(history.state, '', nueva); } catch (_) { /* queda como venía */ }
}
enIngles();

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
  if (S.user && S.desdeDia !== null && rangoAnterior(rangeOf(id)).from < S.desdeDia) { S.daysLoaded = false; listen(); }
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
  // A cup older than the period is not downloaded: ask for it (D-473)
  if (S.user) {
    copaSuelta(t).then(code => {
      if (code) { location.hash = ir('torneo', [code]); return; }
      msg.textContent = `There is no cup or room with “${t}”. A room has 4 letters; a cup, 5 or its own link.`;
      msg.hidden = false;
    });
    return;
  }
  msg.textContent = `There is no cup or room with “${t}”. A room has 4 letters; a cup, 5 or its own link.`;
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

// "Don't count this browser": its live play goes to `owner`, not to Live (D-471).
{
  const box = $('#no-contar');
  box.checked = notCounted();
  box.addEventListener('change', () => setNotCounted(box.checked));
}
$('#buscar').addEventListener('submit', e => { e.preventDefault(); buscar($('#buscar-q').value); });

// Gancho de solo lectura para pruebas (C-14): permite dibujar con datos sembrados sin entrar.
// `vista` es una ruta (`/torneo/OFICI`) o, como antes, el nombre de una vista (`torneo`).
window.__panel = {
  get state() { return S; },
  seed({ rooms = {}, days = {}, torneos = {}, push = null, uad = null, feedback = {}, splash = null, controls = {}, flags = {}, campTab = null, daysLoaded = true, vista }) {
    stopListening();
    S.feedback = feedback;
    S.splash = splash;
    S.controls = controls;
    S.flags = flags;
    if (campTab) S.campTab = campTab;
    S.rooms = rooms; S.days = days; S.daysLoaded = daysLoaded; S.torneos = torneos; S.torneosLoaded = true; S.push = push;
    if (uad) S.uad = { historia: {}, invitados: {}, rachas: {}, ...uad };
    S.desdeDia = rangoAnterior(rangeOf(S.range)).from;
    showScreen('screen-panel');
    if (vista) {
      const hash = `#${vista}`;
      if (location.hash !== hash) { location.hash = hash; return; }  // `hashchange` dibuja
    }
    alCambiarRuta();
  },
};

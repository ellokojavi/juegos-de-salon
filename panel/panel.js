/**
 * Panel del dueño (D-44): entra con Google, lee las salas vivas y `stats/<env>/days`,
 * y dibuja lo que arma `aggregate.js`. Solo en español: no es una pantalla de jugador
 * (excepción a C-3, anotada en docs/PANEL.md).
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
import { gameLabel, MODES, MODE_IDS, ROOM_MODE, modeIcon } from '../assets/js/games.js';
import { LANGS } from '../assets/js/i18n.js';
import { ENVS } from '../assets/js/transport/stats.js';
import { $, el } from '../assets/js/ui.js';
import { DAY, ROOM_TTL, liveRooms, connections, summarize, top, tzLabel, ago, dayLabel, dayOf, codesOfDays, splitByEnv, roomLog, paginate, flagOf, whenLabel } from './aggregate.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const S = { user: null, env: 'prod', range: 7, rooms: {}, days: {}, daysLoaded: false, unsubRooms: null, unsubDays: null, denied: false, tick: null,
  // Bitácora de salas (D-79): en qué página va y si se muestran las salas donde no entró nadie
  logPage: 1, logSolas: false };

const POR_PAGINA = 20;

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
  S.denied = false;
  showScreen('screen-panel');
  listen();
});

/* ------------------------------------------------------------------ */
/* Lecturas en vivo                                                    */
/* ------------------------------------------------------------------ */
function denied(e) {
  if (!/permission|denied/i.test(e?.message || e?.code || '')) { console.error(e); return; }
  S.denied = true;
  stopListening();
  showScreen('screen-login');
  $('#login-msg').textContent = 'Entraste, pero esta cuenta no puede leer el panel.';
  $('#uid-help').hidden = false;
}

function stopListening() {
  if (S.unsubRooms) { S.unsubRooms(); S.unsubRooms = null; }
  if (S.unsubDays) { S.unsubDays(); S.unsubDays = null; }
  if (S.tick) { clearInterval(S.tick); S.tick = null; }
}

function listen() {
  stopListening();
  // Salas de las últimas 6 horas (índice por createdAt en las reglas). Cada jugada llega como delta.
  const since = Date.now() - ROOM_TTL;
  S.unsubRooms = onValue(query(ref(db, 'rooms'), orderByChild('createdAt'), startAt(since)), snap => { S.rooms = snap.val() || {}; renderNow(); }, denied);
  // Días del rango más largo que se puede pedir (30), así cambiar el rango no vuelve a bajar nada.
  const from = String(dayOf(Date.now()) - 30);
  S.unsubDays = onValue(query(ref(db, `stats/${S.env}/days`), orderByKey(), startAt(from)), snap => { S.days = snap.val() || {}; S.daysLoaded = true; renderRange(); renderNow(); }, denied);
  S.tick = setInterval(renderNow, 30000); // "hace 3 min" se actualiza solo
}

/* ------------------------------------------------------------------ */
/* Dibujo                                                              */
/* ------------------------------------------------------------------ */
/**
 * Nada de listas copiadas acá (C-16). Los juegos, los modos y su ícono salen de `games.js`;
 * los entornos, de `transport/stats.js`; los idiomas, de `i18n.js`. Lo que no está en ninguna
 * de esas listas igual se dibuja, con su clave cruda por nombre: puede ser un juego, un modo
 * o un idioma que el código ya manda y esta página todavía no conoce.
 */

/** Los entornos que el selector ofrece: los que la app emite hoy, más los que quedaron guardados. */
const ENV_VIEJOS = { lab: 'Laboratorio' };            // salió con el laboratorio (D-67)
const ENV_NOMBRE = { prod: 'Publicado', dev: 'Pruebas locales', ...ENV_VIEJOS };
const envLabel = env => ENV_NOMBRE[env] || env;
const ENV_OPCIONES = [...ENVS, ...Object.keys(ENV_VIEJOS).filter(e => !ENVS.includes(e))];

/**
 * El idioma elegido para jugar, con nombre en español. Se lo pregunta al navegador en vez de
 * mantener una tabla: un idioma nuevo en `i18n.js` aparece nombrado sin tocar el panel.
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

/**
 * Colores de las barras, en el orden de los modos. Se reparten por posición y no por nombre:
 * un modo nuevo toma el siguiente color en vez de quedar sin uno (C-16).
 */
const PALETA = ['var(--cyan)', 'var(--yellow)', 'var(--pink)', 'var(--lime)', 'var(--purple)'];
let MODOS = [...MODE_IDS];   // los conocidos, más los que traiga la base (lo pone renderRange)
const modeColor = mode => PALETA[Math.max(0, MODOS.indexOf(mode)) % PALETA.length];

/** Colores de las barras que no son de modo: el total, lo que se juega sin red y los idiomas. */
const C_TOTAL = 'var(--cyan)', C_SIN_RED = 'var(--yellow)', C_IDIOMA = 'var(--lime)';

/** Idiomas conocidos primero, en el orden de la app; detrás, lo que haya llegado. */
const ordenIdiomas = pares => [
  ...LANGS.map(l => pares.find(([k]) => k === l)).filter(Boolean),
  ...pares.filter(([k]) => !LANGS.includes(k)),
];

const n = v => Number(v || 0).toLocaleString('es-CL');
/** Una sala recién creada no tiene jugadas: decir "0 msj" se lee como un error de la página. */
const msjs = k => (k === 0 ? 'Sin msjs' : k === 1 ? '1 msj' : `${n(k)} msjs`);

function tile(value, label, hot = false) {
  return el('div', { class: `tile${hot ? ' tile--hot' : ''}` }, el('b', {}, n(value)), el('small', {}, label));
}

/**
 * Una barra con sus segmentos y el total. Cada segmento trae su color ya resuelto: los de
 * modo salen de `segModo`, que lo saca del registro, y los demás de un color fijo. Así
 * ningún nombre de modo queda escrito acá (C-16).
 */
function bar(label, segments, max, { note = '', sub = '' } = {}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const track = el('div', { class: 'track' });
  for (const x of segments) if (x.value > 0) track.append(el('div', { class: 'fill', style: `width:${max ? (x.value / max) * 100 : 0}%;background:${x.color}`, title: `${x.title || ''} ${n(x.value)}`.trim() }));
  return el('div', { class: 'bar' },
    el('span', { class: 'label', title: sub ? `${label} · ${sub}` : label }, label, sub ? el('small', {}, sub) : null),
    track, el('span', { class: 'n' }, n(total), note ? el('span', { class: 'modes' }, ` ${note}`) : null));
}

/** Un segmento de un modo (color e ícono del registro) y uno de color fijo. */
const segModo = (mode, value) => ({ color: modeColor(mode), value, title: modeIcon(mode) });
const seg = (color, value) => ({ color, value });

function fill(box, rows, emptyText = 'Nada todavía.') {
  box.innerHTML = '';
  if (!rows.length) { box.append(el('p', { class: 'empty' }, emptyText)); return; }
  rows.forEach(r => box.append(r));
}

function renderNow() {
  const now = Date.now();
  // `rooms/` no está separado por entorno: se cruza por código con lo que registró
  // `stats/<env>` para no contar las pruebas como si fueran gente jugando (D-45).
  const { propias: live, ajenas } = splitByEnv(liveRooms(S.rooms, now), codesOfDays(S.days, now), { loaded: S.daysLoaded });
  const active = live.filter(r => r.active);
  const tiles = $('#tiles-now'); tiles.innerHTML = '';
  tiles.append(
    tile(active.length, 'salas en juego', active.length > 0),
    tile(connections(live), 'celulares conectados'),
    tile(live.length, 'salas de las últimas 6 h'),
    tile(new Set(active.map(r => r.game)).size, 'juegos en curso'),
  );
  const box = $('#rooms');
  fill(box, live.map(r => el('div', { class: `room${r.active ? ' active' : ''}` },
    el('div', {}, el('div', { class: 'code' }, r.code), el('div', { class: 'meta', style: 'text-align:left' }, gameLabel(r.game))),
    el('div', { class: 'who' }, r.players.map(p => el('span', {}, el('i', { class: p.online ? 'on' : '' }), p.name))),
    el('div', { class: 'meta' }, msjs(r.messages), el('br'), ago(r.lastAt, now), el('br'), `creada ${ago(r.createdAt, now)}`),
  )), 'No hay salas vivas en este momento.');
  // Nunca esconder en silencio: una sala puede quedar fuera por ser de otro entorno, pero
  // también porque su registro de señales falló, que es mejor esfuerzo y falla callado (C-14).
  if (ajenas.length) {
    const cuales = ajenas.map(r => r.code).join(', ');
    const una = ajenas.length === 1;
    const cuantas = una
      ? 'Hay una sala abierta que no es'
      : `Hay ${n(ajenas.length)} salas abiertas que no son`;
    box.append(el('p', { class: 'empty', style: 'margin-top:8px' },
      `${cuantas} de ${envLabel(S.env)}, así que no ${una ? 'se cuenta' : 'se cuentan'} acá: ${cuales}. `
      + 'Suelen ser partidas de prueba hechas en el computador o en el laboratorio, y se borran solas a las seis horas.'));
  }
  $('#updated').textContent = `Actualizado ${new Date(now).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
}

function renderRange() {
  const today = dayOf(Date.now());
  const s = summarize(S.days, { from: today - S.range + 1, to: today });
  $('#range-title').textContent = `Últimos ${S.range} días`;

  const tiles = $('#tiles-range'); tiles.innerHTML = '';
  const hoy = summarize(S.days, { from: today, to: today });
  tiles.append(
    tile(s.partidas, 'partidas'),
    tile(s.online, 'en dos celulares'),
    tile(s.local, 'sin red'),
    tile(s.devices, 'celulares que jugaron'),
    tile(hoy.partidas, 'partidas hoy'),
  );

  // Por juego y por modo, con lo que haya: un juego o un modo que esta página no conoce se
  // dibuja igual, con su clave por nombre (C-16).
  MODOS = s.modes;
  const games = Object.entries(s.byGame).sort((a, b) => b[1].total - a[1].total);
  const maxGame = Math.max(0, ...games.map(([, g]) => g.total));
  fill($('#by-game'), games.map(([id, g]) => bar(gameLabel(id), MODOS.map(m => segModo(m, g[m] || 0)), maxGame,
    { note: MODOS.filter(m => g[m]).map(m => `${modeIcon(m)}${n(g[m])}`).join(' ') })));

  const players = Object.entries(s.byPlayers).sort((a, b) => Number(a[0]) - Number(b[0]));
  const maxP = Math.max(0, ...players.map(([, v]) => v));
  fill($('#by-players'), players.map(([k, v]) => bar(k === '1' ? '1 jugador' : `${k} jugadores`, [seg(C_SIN_RED, v)], maxP)));

  const maxDay = Math.max(0, ...s.byDay.map(d => d.total));
  fill($('#by-day'), s.byDay.map(d => bar(dayLabel(d.day), [segModo(ROOM_MODE, d.online), seg(C_SIN_RED, d.local)], maxDay)));

  const origin = top(s.origin, 15);
  const maxO = Math.max(0, ...origin.map(([, v]) => v));
  fill($('#origin'), origin.map(([k, v]) => { const { city, region } = tzLabel(k); return bar(city, [seg(C_TOTAL, v)], maxO, { sub: region }); }));

  const lang = top(s.lang, 10);
  const maxL = Math.max(0, ...lang.map(([, v]) => v));
  fill($('#lang'), lang.map(([k, v]) => bar(k === 'desconocido' ? 'Sin idioma' : k, [seg(C_IDIOMA, v)], maxL)));
  // El del navegador dice de dónde es la persona; este dice en cuál prefiere jugar (D-46)
  const app = ordenIdiomas(top(s.applang, 10));
  const maxA = Math.max(0, ...app.map(([, v]) => v));
  fill($('#applang'), app.map(([k, v]) => bar(nombreDeIdioma(k), [seg(C_IDIOMA, v)], maxA)),
    'Nada todavía: se empieza a contar desde esta versión.');

  const hours = $('#hours'); hours.innerHTML = '';
  const maxH = Math.max(1, ...s.hour);
  s.hour.forEach((v, h) => hours.append(el('div', { class: 'h', style: `height:${Math.max(2, (v / maxH) * 100)}%`, title: `${h}:00 · ${n(v)}`, 'data-h': h % 6 === 0 ? h : null })));

  renderLog();
}

/**
 * La lista de salas jugadas (D-79): cuándo, quiénes con su bandera, qué juego y quién ganó.
 *
 * El país y el ganador se empezaron a anotar con esta versión, así que las salas de antes los
 * muestran en guion. No se esconden ni se completan a ojo: una sala vieja es una sala de la
 * que se sabe menos, no una sala que no pasó.
 */
function renderLog() {
  const today = dayOf(Date.now());
  const filas = roomLog(S.days, { from: today - S.range + 1, to: today, soloJugadas: !S.logSolas });
  const { rows, page, pages, total, desde } = paginate(filas, { page: S.logPage, perPage: POR_PAGINA });
  S.logPage = page;

  const quien = p => el('span', { class: 'q' }, p.co ? el('i', { class: 'flag', title: p.co }, flagOf(p.co)) : null, p.name);
  const ganador = f => {
    if (f.winner) return el('span', { class: 'won' }, '🏆 ', f.winnerName);
    if (f.empate) return el('span', { class: 'tie' }, '🤝 Empate');
    return el('span', { class: 'none', title: 'Esta sala terminó sin que quedara registro de quién ganó' }, '—');
  };

  fill($('#room-log'), rows.map(f => el('div', { class: 'log-row' },
    el('div', { class: 'when' }, whenLabel(f.at), el('br'), el('span', { class: 'code' }, f.code)),
    el('div', { class: 'game' }, gameLabel(f.game)),
    el('div', { class: 'who' }, ...f.players.map(quien)),
    el('div', { class: 'win' }, ganador(f)),
  )), S.logSolas ? 'Ninguna sala en este rango.' : 'Ninguna sala jugada en este rango.');

  const pager = $('#room-pager');
  pager.innerHTML = '';
  if (!total) return;
  const hasta = Math.min(desde + rows.length, total);
  const ir = d => () => { S.logPage = page + d; renderLog(); };
  pager.append(
    el('button', { class: 'btn btn--ghost btn--sm', disabled: page <= 1, onClick: ir(-1) }, '‹ Anterior'),
    el('span', { class: 'muted small' }, `${desde + 1}–${hasta} de ${n(total)} ${total === 1 ? 'sala' : 'salas'}`),
    el('button', { class: 'btn btn--ghost btn--sm', disabled: page >= pages, onClick: ir(1) }, 'Siguiente ›'),
  );
}

/* ------------------------------------------------------------------ */
/* Controles                                                           */
/* ------------------------------------------------------------------ */
/**
 * El selector de entornos y la leyenda de modos se arman con lo que dice el código, no con
 * lo que alguien escribió en el HTML: un entorno o un modo nuevo aparece en el panel el
 * mismo día que empieza a mandar señales (C-16).
 */
function renderControls() {
  const env = $('#env');
  env.innerHTML = '';
  ENV_OPCIONES.forEach(e => env.append(el('option', { value: e, selected: e === S.env ? '' : null }, envLabel(e))));
  $('#modes-legend').textContent = `Por modo: ${MODE_IDS.map(m => `${modeIcon(m)} ${MODES[m].label}`).join(' · ')}`;
}
renderControls();

$('#btn-login').addEventListener('click', login);
$('#env').addEventListener('change', e => { S.env = e.target.value; S.days = {}; S.daysLoaded = false; S.logPage = 1; renderRange(); renderNow(); if (S.user) listen(); });
// Cambiar el rango o el entorno empieza la lista de nuevo: la página 3 de otra cosa no existe
$('#range').addEventListener('change', e => { S.range = Number(e.target.value); S.logPage = 1; renderRange(); });
$('#log-solas').addEventListener('change', e => { S.logSolas = e.target.checked; S.logPage = 1; renderLog(); });

// Gancho de solo lectura para pruebas (C-14): permite dibujar con datos sembrados sin entrar.
window.__panel = {
  get state() { return S; },
  seed({ rooms = {}, days = {}, daysLoaded = true }) { stopListening(); S.rooms = rooms; S.days = days; S.daysLoaded = daysLoaded; showScreen('screen-panel'); renderNow(); renderRange(); },
};

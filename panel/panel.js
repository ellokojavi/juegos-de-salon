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
import { GAMES } from '../assets/js/games.js';
import { $, el } from '../assets/js/ui.js';
import { DAY, ROOM_TTL, liveRooms, connections, summarize, top, tzLabel, ago, dayLabel, dayOf, codesOfDays, splitByEnv } from './aggregate.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const GAME_LABEL = Object.fromEntries(GAMES.map(g => [g.id, `${g.emoji} ${g.name.es}`]));
const gameLabel = id => GAME_LABEL[id] || id;
const MODE_ICON = { online: '📡', local: '📱', cpu: '🤖', solo: '🧍' };

const S = { user: null, env: 'prod', range: 7, rooms: {}, days: {}, daysLoaded: false, unsubRooms: null, unsubDays: null, denied: false, tick: null };

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
const n = v => Number(v || 0).toLocaleString('es-CL');

function tile(value, label, hot = false) {
  return el('div', { class: `tile${hot ? ' tile--hot' : ''}` }, el('b', {}, n(value)), el('small', {}, label));
}

/** Una barra con segmentos por modo (o uno solo) y su total. */
function bar(label, segments, max, { note = '', sub = '' } = {}) {
  const total = segments.reduce((s, [, v]) => s + v, 0);
  const track = el('div', { class: 'track' });
  for (const [mode, v] of segments) if (v > 0) track.append(el('div', { class: `fill fill--${mode}`, style: `width:${max ? (v / max) * 100 : 0}%`, title: `${MODE_ICON[mode] || ''} ${n(v)}` }));
  return el('div', { class: 'bar' },
    el('span', { class: 'label', title: sub ? `${label} · ${sub}` : label }, label, sub ? el('small', {}, sub) : null),
    track, el('span', { class: 'n' }, n(total), note ? el('span', { class: 'modes' }, ` ${note}`) : null));
}

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
    el('div', { class: 'meta' }, `${n(r.messages)} msj`, el('br'), ago(r.lastAt, now), el('br'), `creada ${ago(r.createdAt, now)}`),
  )), 'No hay salas vivas en este momento.');
  // Nunca esconder en silencio: una sala puede quedar fuera por ser de otro entorno, pero
  // también porque su registro de señales falló, que es mejor esfuerzo y falla callado (C-14).
  if (ajenas.length) {
    box.append(el('p', { class: 'empty', style: 'margin-top:8px' },
      ajenas.length === 1
        ? `1 sala viva no quedó registrada en ${S.env} y no se muestra acá: ${ajenas[0].code}.`
        : `${n(ajenas.length)} salas vivas no quedaron registradas en ${S.env} y no se muestran acá: ${ajenas.map(r => r.code).join(', ')}.`));
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

  // Por juego, en el orden del menú, con los que no están en el registro al final
  const games = Object.entries(s.byGame).sort((a, b) => b[1].total - a[1].total);
  const maxGame = Math.max(0, ...games.map(([, g]) => g.total));
  fill($('#by-game'), games.map(([id, g]) => bar(gameLabel(id), ['online', 'local', 'cpu', 'solo'].map(m => [m, g[m]]), maxGame,
    { note: ['online', 'local', 'cpu', 'solo'].filter(m => g[m]).map(m => `${MODE_ICON[m]}${n(g[m])}`).join(' ') })));

  const players = Object.entries(s.byPlayers).sort((a, b) => Number(a[0]) - Number(b[0]));
  const maxP = Math.max(0, ...players.map(([, v]) => v));
  fill($('#by-players'), players.map(([k, v]) => bar(k === '1' ? '1 jugador' : `${k} jugadores`, [['local', v]], maxP)));

  const maxDay = Math.max(0, ...s.byDay.map(d => d.total));
  fill($('#by-day'), s.byDay.map(d => bar(dayLabel(d.day), [['online', d.online], ['local', d.local]], maxDay)));

  const origin = top(s.origin, 15);
  const maxO = Math.max(0, ...origin.map(([, v]) => v));
  fill($('#origin'), origin.map(([k, v]) => { const { city, region } = tzLabel(k); return bar(city, [['online', v]], maxO, { sub: region }); }));

  const lang = top(s.lang, 10);
  const maxL = Math.max(0, ...lang.map(([, v]) => v));
  fill($('#lang'), lang.map(([k, v]) => bar(k === 'desconocido' ? 'Sin idioma' : k, [['solo', v]], maxL)));

  const hours = $('#hours'); hours.innerHTML = '';
  const maxH = Math.max(1, ...s.hour);
  s.hour.forEach((v, h) => hours.append(el('div', { class: 'h', style: `height:${Math.max(2, (v / maxH) * 100)}%`, title: `${h}:00 · ${n(v)}`, 'data-h': h % 6 === 0 ? h : null })));
}

/* ------------------------------------------------------------------ */
/* Controles                                                           */
/* ------------------------------------------------------------------ */
$('#btn-login').addEventListener('click', login);
$('#env').addEventListener('change', e => { S.env = e.target.value; S.days = {}; S.daysLoaded = false; renderRange(); renderNow(); if (S.user) listen(); });
$('#range').addEventListener('change', e => { S.range = Number(e.target.value); renderRange(); });

// Gancho de solo lectura para pruebas (C-14): permite dibujar con datos sembrados sin entrar.
window.__panel = {
  get state() { return S; },
  seed({ rooms = {}, days = {}, daysLoaded = true }) { stopListening(); S.rooms = rooms; S.days = days; S.daysLoaded = daysLoaded; showScreen('screen-panel'); renderNow(); renderRange(); },
};

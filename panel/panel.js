/**
 * Panel del dueño (D-44): entra con Google, lee las salas vivas, `stats/<env>/days` y las
 * copas de `torneos/`, y dibuja lo que arman `aggregate.js` y `copas.js`. Tres vistas: el
 * resumen, el torneo (La Copa y sus minijuegos) y los juegos de una partida. Solo en español: no es una pantalla de jugador
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
import { GAMES, gameLabel, isTorneo, MODES, MODE_IDS, ROOM_MODE, modeIcon } from '../assets/js/games.js';
import { MINIJUEGOS } from '../copa/rules.js';
import { LANGS } from '../assets/js/i18n.js';
import { ENVS } from '../assets/js/transport/stats.js';
import { $, el } from '../assets/js/ui.js';
import { copasEnCurso, resumenCopas, bitacoraCopas, pct, duracion, inicioLabel } from './copas.js';
import { DAY, ROOM_TTL, liveRooms, connections, summarize, top, tzLabel, ago, dayLabel, dayOf, codesOfDays, splitByEnv, roomLog, paginate, flagOf, whenLabel, RANGOS, RANGO_POR_DEFECTO, rangeOf, groupDays } from './aggregate.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/**
 * Las vistas del panel. El id va en la URL (`#torneo`) para poder volver directo a una. El
 * nombre del torneo sale del registro de juegos, no de acá (C-16).
 */
const TORNEO = GAMES.find(g => g.torneo) || null;
const VISTAS = [
  { id: 'resumen', label: '📊 Resumen' },
  ...(TORNEO ? [{ id: 'torneo', label: gameLabel(TORNEO.id) }] : []),
  { id: 'juegos', label: '🎲 Juegos' },
];
const vistaDeUrl = () => { const h = location.hash.slice(1); return VISTAS.some(v => v.id === h) ? h : VISTAS[0].id; };

const S = { user: null, env: 'prod', range: RANGO_POR_DEFECTO, vista: vistaDeUrl(), rooms: {}, days: {}, daysLoaded: false, torneos: {}, torneosLoaded: false,
  unsubRooms: null, unsubDays: null, unsubTorneos: null, denied: false, tick: null,
  // Desde qué día está bajado `days`: un rango más largo obliga a pedir de nuevo, uno más corto no
  desdeDia: null,
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
  if (S.unsubTorneos) { S.unsubTorneos(); S.unsubTorneos = null; }
  if (S.tick) { clearInterval(S.tick); S.tick = null; }
}

function listen() {
  stopListening();
  // Se bajan las salas de las últimas 6 horas —el tope duro, que es lo que el índice por
  // createdAt sabe filtrar— y `liveRooms` descarta después las que llevan media hora sin latir
  // (D-89). Cada jugada llega como delta.
  const since = Date.now() - ROOM_TTL;
  S.unsubRooms = onValue(query(ref(db, 'rooms'), orderByChild('createdAt'), startAt(since)), snap => { S.rooms = snap.val() || {}; renderNow(); }, denied);
  // Se baja solo hasta donde llega el rango elegido y nunca menos de lo que ya estaba bajado
  // (D-80): mirar un año son 365 días de registros, y no hay por qué pagarlos mientras se
  // mira la semana. Cambiar a un rango más corto no vuelve a pedir nada.
  const desde = Math.min(rangeOf(S.range).from, S.desdeDia ?? Infinity);
  S.desdeDia = desde;
  S.unsubDays = onValue(query(ref(db, `stats/${S.env}/days`), orderByKey(), startAt(String(desde))), snap => { S.days = snap.val() || {}; S.daysLoaded = true; renderRange(); renderNow(); }, denied);
  // Las copas se bajan enteras: son pocas y cada una es chica. Cada resultado llega como delta,
  // así que "jugando ahora" y la tabla se mueven solos.
  S.unsubTorneos = onValue(ref(db, 'torneos'), snap => { S.torneos = snap.val() || {}; S.torneosLoaded = true; renderRange(); renderNow(); }, denied);
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
const C_TOTAL = 'var(--cyan)', C_SIN_RED = 'var(--yellow)', C_IDIOMA = 'var(--lime)', C_TORNEO = 'var(--pink)';

/** El minijuego con su emoji y su nombre, del registro de la copa; uno que no está, por su clave. */
const miniLabel = id => (MINIJUEGOS[id] ? `${MINIJUEGOS[id].emoji} ${MINIJUEGOS[id].nombre}` : String(id || '?'));
const esJuego = id => !isTorneo(id);
const torneoNombre = TORNEO ? TORNEO.name.es : 'el torneo';

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

function tile(value, label, hot = false) {
  return el('div', { class: `tile${hot ? ' tile--hot' : ''}` }, el('b', {}, typeof value === 'string' ? value : n(value)), el('small', {}, label));
}

/**
 * Una barra con sus segmentos y el total. Cada segmento trae su color ya resuelto: los de
 * modo salen de `segModo`, que lo saca del registro, y los demás de un color fijo. Así
 * ningún nombre de modo queda escrito acá (C-16).
 */
function bar(label, segments, max, { note = '', sub = '', detail = '', cifra = null } = {}) {
  // La cifra de la derecha es la suma de los segmentos, salvo que la barra diga otra: en los
  // minijuegos, el gris de los que quedaron sin terminar se dibuja pero no se cuenta como jugado.
  const total = cifra ?? segments.reduce((s, x) => s + x.value, 0);
  const track = el('div', { class: 'track' });
  for (const x of segments) if (x.value > 0) track.append(el('div', { class: 'fill', style: `width:${max ? (x.value / max) * 100 : 0}%;background:${x.color}`, title: `${x.title || ''} ${n(x.value)}`.trim() }));
  return el('div', { class: 'bar' },
    el('span', { class: 'label', title: sub ? `${label} · ${sub}` : label }, label, sub ? el('small', {}, sub) : null),
    track, el('span', { class: 'n' }, n(total), note ? el('span', { class: 'modes' }, ` ${note}`) : null),
    detail ? el('span', { class: 'detail' }, detail) : null);
}

/** Un segmento de un modo (color e ícono del registro) y uno de color fijo. */
const segModo = (mode, value) => ({ color: modeColor(mode), value, title: modeIcon(mode) });
const seg = (color, value) => ({ color, value });

function fill(box, rows, emptyText = 'Nada todavía.') {
  box.innerHTML = '';
  if (!rows.length) { box.append(el('p', { class: 'empty' }, emptyText)); return; }
  rows.forEach(r => box.append(r));
}

/**
 * Qué bloque se ve en qué vista: cada uno dice las suyas en `data-en`. Lo que es de todas
 * (los filtros, los títulos) no lo lleva.
 */
function renderVista() {
  document.querySelectorAll('[data-en]').forEach(b => { b.hidden = !b.dataset.en.split(' ').includes(S.vista); });
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.vista === S.vista)));
}

/** Sala viva o copa en curso: una fila de la lista de "Ahora". */
function filaSala(r, now) {
  return el('div', { class: `room${r.active ? ' active' : ''}` },
    el('div', {}, el('div', { class: 'code' }, r.code), el('div', { class: 'meta', style: 'text-align:left' }, gameLabel(r.game))),
    el('div', { class: 'who' }, r.players.map(p => el('span', {}, el('i', { class: p.online ? 'on' : '' }), p.name))),
    el('div', { class: 'meta' }, jugadasDe(r.jugadas), el('br'), chatDe(r.chat), el('br'),
      r.lastPlayAt ? `última jugada ${ago(r.lastPlayAt, now)}` : `actividad ${ago(r.lastAt, now)}`, el('br'), `creada ${ago(r.createdAt, now)}`),
  );
}

/**
 * Una copa en curso: en qué día va, qué minijuego toca, quién ya lo jugó (✓) y quién lo está
 * jugando en este momento (punto verde). El de ayer se puede jugar hasta el fin de hoy, así que
 * alguien puede estar jugando un día que no es el último: eso va en su propia línea.
 */
function filaCopa(c, now) {
  const hoy = c.hoy;
  const enCurso = c.estado === 'en-curso';
  const cuando = enCurso ? `Día ${c.dia} de ${c.days}: ${miniLabel(hoy.juego)}` : `Empieza el ${inicioLabel(c.start)}, ${c.days} días`;
  const atrasados = c.jugando.filter(x => !hoy || x.dia !== hoy.dia);
  const gente = hoy
    ? hoy.jugadores.map(j => el('span', { class: j.jugo ? 'ok' : '', title: j.jugo ? 'Ya jugó el de hoy' : j.jugando ? 'Lo está jugando ahora' : 'Todavía no lo juega' },
      el('i', { class: j.jugando ? 'on' : '' }), j.name, j.jugo ? ' ✓' : ''))
    : [el('span', {}, `${n(c.jugadores)} ${c.jugadores === 1 ? 'inscrito' : 'inscritos'}`)];
  return el('div', { class: `room copa${c.jugando.length ? ' active' : ''}` },
    el('div', {}, el('div', { class: 'code' }, c.code), c.alias ? el('div', { class: 'meta', style: 'text-align:left' }, `/${c.alias}`) : null),
    el('div', { class: 'cuerpo' },
      el('div', { class: 'cname' }, c.name, c.lab ? el('span', { class: 'tag', title: 'Creada desde el laboratorio: su admin puede adelantar los días para probar' }, 'laboratorio') : null),
      el('div', { class: 'sub' }, cuando),
      el('div', { class: 'who' }, ...gente),
      atrasados.length ? el('div', { class: 'sub' }, 'Jugando ahora un día anterior: ', atrasados.map(x => `${x.name} (día ${x.dia}, ${miniLabel(x.juego)})`).join(', ')) : null,
    ),
    el('div', { class: 'meta' },
      hoy ? `jugaron ${hoy.jugaron} de ${hoy.jugadores.length}` : (c.inscripcion ? 'inscripción abierta' : ''), el('br'),
      c.ultimo ? `último resultado ${ago(c.ultimo, now)}` : 'sin resultados', el('br'),
      c.primero ? `va primero ${c.primero.name}${c.primero.empatados > 1 ? ` y ${c.primero.empatados - 1} más` : ''} (${n(c.primero.total)})` : '',
    ),
  );
}

function renderNow() {
  const now = Date.now();
  // `rooms/` no está separado por entorno: se cruza por código con lo que registró
  // `stats/<env>` para no contar las pruebas como si fueran gente jugando (D-45).
  const { propias: live, ajenas } = splitByEnv(liveRooms(S.rooms, now), codesOfDays(S.days, now), { loaded: S.daysLoaded });
  const active = live.filter(r => r.active);
  const copas = copasEnCurso(S.torneos, now);
  const enCurso = copas.filter(c => c.estado === 'en-curso');
  const jugandoMini = copas.reduce((k, c) => k + c.jugando.length, 0);
  const jugaronHoy = enCurso.reduce((k, c) => k + c.hoy.jugaron, 0);
  const deHoy = enCurso.reduce((k, c) => k + c.hoy.jugadores.length, 0);

  const tiles = $('#tiles-now'); tiles.innerHTML = '';
  if (S.vista === 'resumen') tiles.append(
    tile(active.length, 'salas en juego', active.length > 0),
    tile(enCurso.length, 'copas en curso', enCurso.length > 0),
    tile(jugandoMini, 'jugando un minijuego ahora', jugandoMini > 0),
    tile(connections(live), 'celulares conectados'),
  );
  if (S.vista === 'torneo') tiles.append(
    tile(enCurso.length, 'copas en curso', enCurso.length > 0),
    tile(jugandoMini, 'jugando un minijuego ahora', jugandoMini > 0),
    tile(deHoy ? `${n(jugaronHoy)}/${n(deHoy)}` : '—', 'jugaron el minijuego de hoy'),
    tile(copas.length - enCurso.length, 'por empezar'),
  );
  if (S.vista === 'juegos') tiles.append(
    tile(active.length, 'salas en juego', active.length > 0),
    tile(connections(live), 'celulares conectados'),
    tile(live.length, 'salas vivas'),
    tile(new Set(active.map(r => r.game)).size, 'juegos en curso'),
  );

  fill($('#copas-vivas'), copas.map(c => filaCopa(c, now)), S.torneosLoaded ? 'No hay copas en curso.' : 'Cargando las copas…');

  const box = $('#rooms');
  fill(box, live.map(r => filaSala(r, now)), 'No hay salas vivas en este momento.');
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
      + 'Suelen ser partidas de prueba hechas en el computador, en la red de la casa o por Tailscale, y se borran solas a la media hora de quedar quietas.'));
  }
  $('#updated').textContent = `Actualizado ${new Date(now).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
}

function renderRange() {
  const now = Date.now();
  const today = dayOf(now);
  const rango = rangeOf(S.range);
  // Los juegos de una partida por un lado y el torneo por otro: el torneo manda una señal por
  // día jugado y se mide mejor con sus propios datos (`torneos/`), que dicen qué minijuego fue.
  const s = summarize(S.days, { from: rango.from, to: rango.to, incluye: esJuego });
  const hoy = summarize(S.days, { from: today, to: today, incluye: esJuego });
  const todo = summarize(S.days, { from: rango.from, to: rango.to });
  const rc = resumenCopas(S.torneos, rango, now);
  const miniHoy = rc.porDia.find(d => d.day === today)?.total || 0;
  // Mientras no llegue el snapshot del rango recién pedido, el título lo dice: un año a medio
  // bajar se ve igual que un año sin partidas, y son cosas muy distintas (C-14).
  const falta = S.daysLoaded && S.desdeDia !== null && rango.from < S.desdeDia;
  $('#range-title').textContent = rango.titulo + (S.daysLoaded && !falta && S.torneosLoaded ? '' : ' · cargando…');

  const tiles = $('#tiles-range'); tiles.innerHTML = '';
  const part = pct(rc.participacion);
  // Los rótulos dicen exactamente qué se cuenta (D-138): una partida se anota al empezar y no al
  // terminar, un mismo celular suma una vez por cada partida, y el día es el de UTC.
  if (S.vista === 'resumen') tiles.append(
    tile(s.partidas, 'partidas de juegos empezadas'),
    tile(rc.jugadas, `minijuegos de ${torneoNombre}`),
    tile(rc.copas, 'copas activas'),
    tile(todo.devices, 'entradas de un celular a una partida'),
    tile(hoy.partidas + miniHoy, 'partidas y minijuegos hoy'),
  );
  if (S.vista === 'torneo') tiles.append(
    tile(rc.copas, 'copas activas'),
    tile(rc.nuevas, 'copas nuevas'),
    tile(rc.inscripciones, 'jugadores inscritos'),
    tile(rc.jugadas, 'minijuegos jugados'),
    tile(part === null ? '—' : `${part}%`, 'participación'),
    tile(rc.abandonos, 'minijuegos sin terminar'),
  );
  if (S.vista === 'juegos') tiles.append(
    tile(s.partidas, 'partidas empezadas'),
    tile(s.online, 'en dos celulares'),
    tile(s.local, 'sin red'),
    tile(s.devices, 'entradas de un celular a una partida'),
    tile(hoy.partidas, 'partidas hoy (día UTC)'),
    tile(s.sinRival, 'salas donde nunca entró un rival'),
  );

  // --- Resumen: el torneo contra los demás juegos -------------------------
  const tipos = [[gameLabel(TORNEO?.id), C_TORNEO, rc.jugadas, 'minijuegos jugados'], ['🎲 Otros juegos', C_TOTAL, s.partidas, 'partidas']];
  const maxT = Math.max(0, ...tipos.map(t => t[2]));
  fill($('#by-kind'), tipos.map(([label, color, v, sub]) => bar(label, [seg(color, v)], maxT, { sub })));
  const juntos = s.byDay.map((d, i) => ({ day: d.day, juegos: d.total, torneo: rc.porDia[i]?.total || 0 }));
  const periodosT = groupDays(juntos, rango.grano);
  const maxK = Math.max(0, ...periodosT.map(d => d.juegos + d.torneo));
  fill($('#by-day-kind'), periodosT.map(d => bar(d.label, [seg(C_TOTAL, d.juegos), seg(C_TORNEO, d.torneo)], maxK)));
  $('#by-day-kind-title').textContent = { dia: 'Por día', semana: 'Por semana', mes: 'Por mes' }[rango.grano];
  $('#kind-legend').replaceChildren(
    el('i', { class: 'sw', style: `background:${C_TOTAL}` }), ' Partidas de juegos  ',
    el('i', { class: 'sw', style: `background:${C_TORNEO}` }), ` Minijuegos de ${torneoNombre}`,
    rango.grano === 'semana' ? '. La fecha es el lunes de cada semana.' : '');

  // --- El torneo: minijuegos y copas --------------------------------------
  const maxM = Math.max(0, ...rc.porMinijuego.map(m => m.jugadas + m.abandonos));
  fill($('#by-mini'), rc.porMinijuego.map(m => bar(miniLabel(m.id), [seg(C_TORNEO, m.jugadas), seg('rgba(255,255,255,0.25)', m.abandonos)], maxM, {
    cifra: m.jugadas,
    detail: [
      m.promedio === null ? null : `puntaje promedio ${m.promedio}/100`,
      m.medianaMs ? `tiempo típico ${duracion(m.medianaMs)}` : null,
      m.abandonos ? `${n(m.abandonos)} sin terminar` : null,
      `en ${n(m.copas)} copa${m.copas === 1 ? '' : 's'}`,
    ].filter(Boolean).join(' · '),
  })), S.torneosLoaded ? 'Ningún minijuego jugado en este rango.' : 'Cargando las copas…');
  const periodosM = groupDays(rc.porDia, rango.grano);
  const maxMD = Math.max(0, ...periodosM.map(d => d.total));
  fill($('#mini-by-day'), periodosM.map(d => bar(d.label, [seg(C_TORNEO, d.total)], maxMD)));
  $('#mini-by-day-title').textContent = { dia: 'Minijuegos por día', semana: 'Minijuegos por semana', mes: 'Minijuegos por mes' }[rango.grano];
  renderCopaLog(now);

  // --- Los juegos de una partida ------------------------------------------
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

  // Por día en los rangos cortos, por semana o por mes en los largos: 365 barras no se leen
  const periodos = groupDays(s.byDay, rango.grano);
  const maxDay = Math.max(0, ...periodos.map(d => d.total));
  fill($('#by-day'), periodos.map(d => bar(d.label, [segModo(ROOM_MODE, d.online), seg(C_SIN_RED, d.local)], maxDay)));
  $('#by-day-title').textContent = { dia: 'Por día', semana: 'Por semana', mes: 'Por mes' }[rango.grano];
  // La semana necesita una aclaración; el día y el mes se explican solos
  $('#by-day-note').textContent = rango.grano === 'semana' ? 'La fecha es el lunes de cada semana.' : '';

  // --- Quiénes: del celular, no de un juego -------------------------------
  const origin = top(todo.origin, 15);
  const maxO = Math.max(0, ...origin.map(([, v]) => v));
  fill($('#origin'), origin.map(([k, v]) => { const { city, region } = tzLabel(k); return bar(city, [seg(C_TOTAL, v)], maxO, { sub: region }); }));

  const lang = top(todo.lang, 10);
  const maxL = Math.max(0, ...lang.map(([, v]) => v));
  fill($('#lang'), lang.map(([k, v]) => bar(k === 'desconocido' ? 'Sin idioma' : k, [seg(C_IDIOMA, v)], maxL)));
  // El del navegador dice de dónde es la persona; este dice en cuál prefiere jugar (D-46)
  const app = ordenIdiomas(top(todo.applang, 10));
  const maxA = Math.max(0, ...app.map(([, v]) => v));
  fill($('#applang'), app.map(([k, v]) => bar(nombreDeIdioma(k), [seg(C_IDIOMA, v)], maxA)),
    'Nada todavía: se empieza a contar desde esta versión.');

  const hours = $('#hours'); hours.innerHTML = '';
  const maxH = Math.max(1, ...todo.hour);
  todo.hour.forEach((v, h) => hours.append(el('div', { class: 'h', style: `height:${Math.max(2, (v / maxH) * 100)}%`, title: `${h}:00 · ${n(v)}`, 'data-h': h % 6 === 0 ? h : null })));

  renderLog();
}

/**
 * Las copas del rango: cuándo empezaron, cuánta gente, cuánto se jugó de lo que había para
 * jugar y quién ganó (o quién va primero, si todavía no termina).
 */
function renderCopaLog(now) {
  const filas = bitacoraCopas(S.torneos, rangeOf(S.range), now);
  const estado = c => (c.estado === 'terminada' ? 'terminada' : c.estado === 'por-empezar' ? 'por empezar' : `día ${c.dia} de ${c.days}`);
  const quien = c => {
    if (!c.primero) return el('span', { class: 'none' }, '—');
    const otros = c.primero.empatados > 1 ? ` y ${c.primero.empatados - 1} más` : '';
    return c.estado === 'terminada'
      ? el('span', { class: 'won' }, `🏆 ${c.primero.name}${otros}`)
      : el('span', { class: 'va', title: 'Va primero en la tabla' }, `▲ ${c.primero.name}${otros}`);
  };
  fill($('#copa-log'), filas.map(c => {
    const p = pct(c.participacion);
    return el('div', { class: 'log-row' },
      el('div', { class: 'when' }, inicioLabel(c.start), el('br'), el('span', { class: 'code' }, c.code)),
      el('div', { class: 'game' }, c.name, c.lab ? el('span', { class: 'tag' }, 'laboratorio') : null),
      el('div', { class: 'who' },
        el('span', { class: 'q' }, estado(c)),
        el('span', { class: 'q' }, `${n(c.jugadores)} ${c.jugadores === 1 ? 'jugador' : 'jugadores'}`),
        el('span', { class: 'q', title: 'Minijuegos jugados de los que se podían jugar, en los días que ya cerraron' }, p === null ? 'sin días cerrados' : `participación ${p}%`),
      ),
      el('div', { class: 'win' }, quien(c)),
    );
  }), S.torneosLoaded ? 'Ninguna copa en este rango.' : 'Cargando las copas…');
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
  const rango = rangeOf(S.range);
  const filas = roomLog(S.days, { from: rango.from, to: rango.to, soloJugadas: !S.logSolas });
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
  const rango = $('#range');
  rango.innerHTML = '';
  RANGOS.forEach(r => rango.append(el('option', { value: r.id, selected: r.id === S.range ? '' : null }, r.etiqueta)));
  // La leyenda es de los juegos de una partida: el modo del torneo tiene su propia vista
  $('#modes-legend').textContent = `Por modo: ${MODE_IDS.filter(m => !MODES[m].torneo).map(m => `${modeIcon(m)} ${MODES[m].label}`).join(' · ')}`;
  const tabs = $('#tabs');
  tabs.innerHTML = '';
  VISTAS.forEach(v => tabs.append(el('button', { type: 'button', role: 'tab', 'data-vista': v.id, onClick: () => irA(v.id) }, v.label)));
  renderVista();
}

/** Cambia de vista y la deja en la URL, para que recargar o guardar el enlace vuelva a la misma. */
function irA(vista) {
  S.vista = vista;
  try { history.replaceState(null, '', `#${vista}`); } catch (_) { /* sin historia: igual se cambia */ }
  renderVista(); renderNow(); renderRange();
}
renderControls();

$('#btn-login').addEventListener('click', login);
window.addEventListener('hashchange', () => { const v = vistaDeUrl(); if (v !== S.vista) irA(v); });
$('#env').addEventListener('change', e => { S.env = e.target.value; S.days = {}; S.daysLoaded = false; S.logPage = 1; S.desdeDia = null; renderRange(); renderNow(); if (S.user) listen(); });
// Cambiar el rango o el entorno empieza la lista de nuevo: la página 3 de otra cosa no existe.
// Y si el rango nuevo llega más atrás de lo que está bajado, se pide de nuevo desde ahí (D-80).
$('#range').addEventListener('change', e => {
  S.range = e.target.value;
  S.logPage = 1;
  const necesita = rangeOf(S.range).from;
  if (S.user && S.desdeDia !== null && necesita < S.desdeDia) { S.daysLoaded = false; listen(); }
  renderRange();
});
$('#log-solas').addEventListener('change', e => { S.logSolas = e.target.checked; S.logPage = 1; renderLog(); });

// Gancho de solo lectura para pruebas (C-14): permite dibujar con datos sembrados sin entrar.
window.__panel = {
  get state() { return S; },
  seed({ rooms = {}, days = {}, torneos = {}, daysLoaded = true, vista }) {
    stopListening();
    S.rooms = rooms; S.days = days; S.daysLoaded = daysLoaded; S.torneos = torneos; S.torneosLoaded = true;
    if (vista) { irA(vista); } else { renderVista(); }
    showScreen('screen-panel'); renderNow(); renderRange();
  },
};

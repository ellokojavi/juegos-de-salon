/**
 * Registro de uso para el panel del dueño (canon C-7, D-44).
 *
 * Son señales para ver cuánto y desde dónde se juega, no para identificar a nadie: no viaja
 * ninguna IP, ningún secreto ni el chat, y de los modos sin red no sale ni un nombre. Lo que
 * se apunta, por día y por entorno, en `stats/<env>/days/<día>`:
 *
 *   rooms/<CÓDIGO>: { game, at, v, players: { A: 'Javi' },     solo dos celulares: la sala ya
 *                     co: { A: 'CL' }, end: { winner, name, at } }  tiene esos nombres, y al
 *                                                             panel solo lo lee el dueño.
 *                                                             `co` es el país del celular y
 *                                                             `end` quién ganó (D-79).
 *   local/<juego>/<modo>/<n>: cuántas partidas sin red, por modo y jugadores
 *   applang/<idioma>: en qué idioma se eligió jugar (distinto del idioma del navegador)
 *   origin/<zona horaria>: celulares que empezaron o entraron a una partida
 *   lang/<idioma del navegador>: ídem
 *   hour/<hora local 0–23>: ídem
 *   live/<id>: { game, mode, n, at, beat, v, co }   una partida sin red que se está jugando:
 *                                                   `beat` sube cada minuto mientras alguien
 *                                                   toca la pantalla (D-140)
 *
 * Va por la REST API con un `fetch` y `keepalive`: los modos sin red no cargan el SDK de
 * Firebase ni abren una conexión persistente, así que no pesan en la carga ni gastan la
 * cuota de conexiones simultáneas (D-41). Todo es mejor esfuerzo: si falla, nadie se entera
 * y la partida sigue igual. Las reglas (firebase/database.rules.json) solo dejan crear cada
 * registro una vez y subir cada contador de a uno.
 *
 * Todo lo de afuera entra por parámetro (`api`, `fingerprint`) para poder probar esto con
 * node sin Firebase ni navegador.
 */
import { firebaseConfig } from '../firebase-config.js';
import { dayOf } from './cleanup.js';
import { getLang } from '../i18n.js';
import { isLocalMode, MAX_PLAYERS, MODES } from '../games.js';

// 'lab' salió con el laboratorio (D-67); queda en el panel para leer lo que quedó guardado
export const ENVS = ['prod', 'dev'];
// Los modos viven en `games.js` (C-16): acá solo se pregunta si el que llegó sube contador.

/** Valores que resuelve el servidor (REST): hora y suma de a uno. */
const STAMP = { '.sv': 'timestamp' };
const INC = { '.sv': { increment: 1 } };

/**
 * Entorno según la URL: pruebas o app publicada.
 *
 * Pruebas es todo lo que no se sirve desde internet: el computador, la red de la casa
 * (10/8, 172.16/12, 192.168/16, `.local`) y Tailscale (`*.ts.net`, que es como se prueba en un
 * celular de verdad, D-67). Antes solo el computador contaba como prueba, y las partidas hechas
 * por Tailscale llegaban al panel como gente jugando (D-138).
 */
export function envOf({ hostname = '' } = {}) {
  const h = String(hostname).toLowerCase();
  if (/^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0)$/.test(h)) return 'dev';
  if (/^(10\.\d+|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+$/.test(h)) return 'dev';
  if (/(^|\.)(ts\.net|local)$/.test(h)) return 'dev';
  return 'prod';
}

/** Versión de la app, leída del import map que estampa set-version.py (C-11). */
export function versionOf(importmapText) {
  const m = /\?v=(\d+\.\d+\.\d+)/.exec(importmapText || '');
  return m ? m[1] : '0';
}

/**
 * Zona horaria como clave de Firebase, acotada. La barra no puede ir en una clave y el
 * guion bajo ya lo usan los nombres (`America/Sao_Paulo`), así que `/` pasa a `__` y el
 * panel lo deshace sin ambigüedad.
 */
export function tzKey(tz) {
  const k = String(tz || '').replace(/\//g, '__').replace(/[^A-Za-z0-9_+-]/g, '_').slice(0, 40);
  return k || 'desconocida';
}

/**
 * Países que se saben reconocer por el huso horario. No es una tabla de husos: es la lista de
 * a qué países preguntarle cuáles son los suyos. Están los de la audiencia real de la app y
 * los grandes; un país fuera de la lista cae en el país del idioma del navegador, y si el
 * idioma tampoco lo dice, la sala queda sin bandera. Es una señal, no un padrón (D-79).
 */
export const PAISES = [
  'CL', 'AR', 'BR', 'PE', 'BO', 'PY', 'UY', 'CO', 'EC', 'VE', 'MX', 'CR', 'PA', 'GT', 'HN',
  'SV', 'NI', 'CU', 'DO', 'PR', 'US', 'CA', 'ES', 'PT', 'GB', 'IE', 'FR', 'DE', 'IT', 'NL',
  'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'GR', 'RO', 'RU', 'TR', 'IL', 'AE',
  'IN', 'CN', 'JP', 'KR', 'ID', 'PH', 'TH', 'VN', 'AU', 'NZ', 'ZA', 'NG', 'KE', 'EG', 'MA',
];

/** Los husos de un país, según el navegador. Si no sabe responder, ninguno. */
const husosDe = region => { try { return new Intl.Locale('und-' + region).getTimeZones?.() || []; } catch (_) { return []; } };

/**
 * `America/Santiago` → `CL`, armando el mapa una sola vez y solo si hace falta.
 * El caché va por función y no en una variable suelta: si no, la primera llamada real deja
 * el mapa puesto y una prueba que pasa husos de mentira nunca los vería (la prueba pasaba
 * sola o fallaba según el orden, que es la peor clase de prueba).
 */
const mapas = new Map();
function paisDelHuso(tz, zonesOf) {
  if (!tz) return '';
  let mapa = mapas.get(zonesOf);
  if (!mapa) {
    mapa = new Map();
    for (const cc of PAISES) for (const z of zonesOf(cc)) mapa.set(z, cc);
    mapas.set(zonesOf, mapa);
  }
  return mapa.get(tz) || '';
}

/** `es-CL` → `CL`. Solo sirve cuando el idioma trae país, que no siempre lo trae. */
export function regionOfLang(lang) {
  const m = /^[A-Za-z]{2,3}[-_]([A-Za-z]{2})(?:[-_]|$)/.exec(String(lang || ''));
  return m ? m[1].toUpperCase() : '';
}

/**
 * País del celular en dos letras, para la lista de salas del panel (D-79).
 *
 * Sale del **huso horario** y no del idioma: un celular chileno puesto en inglés dice `en-US`
 * y lo daría por estadounidense. El idioma queda de respaldo, para los países que no están en
 * `PAISES` o para un navegador que no sepa decir qué husos tiene cada país. Si ninguno de los
 * dos lo dice, se devuelve vacío y la sala se muestra sin bandera: preferimos un hueco a
 * inventar un país.
 */
export function countryOf({ tz, lang } = {}, zonesOf = husosDe) {
  const cc = paisDelHuso(tz, zonesOf) || regionOfLang(lang);
  return /^[A-Z]{2}$/.test(cc) ? cc : '';
}

/** Idioma del navegador como clave, acotado. */
export function langKey(lang) {
  const k = String(lang || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 12);
  return k || 'desconocido';
}

/**
 * Lo que se sabe del celular sin preguntarle nada a nadie.
 *
 * Van dos idiomas y no son el mismo: `lang` es el del navegador, que dice de dónde es la
 * persona, y `app` es el que eligió en el juego, que dice en cuál prefiere jugar. Un celular
 * en `es-CL` jugando en inglés es información que solo se ve teniendo los dos.
 */
export function fingerprint({ loc = globalThis.location, nav = globalThis.navigator, doc = globalThis.document, now = new Date(), app = getLang() } = {}) {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) { /* nada */ }
  return {
    env: envOf(loc || {}),
    v: versionOf(doc?.getElementById?.('importmap')?.textContent),
    tz: tzKey(tz),
    co: countryOf({ tz, lang: nav?.language }),
    lang: langKey(nav?.language),
    app: langKey(app),
    hour: now.getHours(),
  };
}

/**
 * Cambios de los contadores que suben con cada celular que empieza o entra a una partida.
 *
 * El modo se acepta por forma y no por lista (C-16): un modo nuevo empieza a contarse el día
 * en que un juego lo manda, sin tocar esto, sin tocar las reglas de la base y sin tocar el
 * panel. El único que no sube contador es el de la sala, que se cuenta por sala.
 * El tope de jugadores sale del juego más numeroso del registro, no de un 6 escrito acá.
 */
export function startChanges(fp, { game, mode, players } = {}) {
  const changes = { [`origin/${fp.tz}`]: INC, [`lang/${fp.lang}`]: INC, [`applang/${fp.app}`]: INC, [`hour/${fp.hour}`]: INC };
  if (isLocalMode(mode)) {
    const n = Math.min(MAX_PLAYERS, Math.max(1, Number(players) || 1));
    changes[`local/${game}/${mode}/${n}`] = INC;
  }
  return changes;
}

/** Registro de una sala nueva (dos celulares), con el nombre y el país de quien la creó. */
export function roomRecord(fp, { game, role, name }) {
  const r = { game, at: STAMP, v: fp.v, players: { [role]: String(name || '').slice(0, 20) } };
  if (fp.co) r.co = { [role]: fp.co };
  return r;
}

/**
 * Quién ganó la sala (D-79). Va el rol y el nombre: el rol para cruzarlo con los jugadores
 * del registro, el nombre para que la lista se lea aunque ese jugador nunca haya alcanzado a
 * quedar apuntado. Un empate se apunta como `tie` y sin nombre.
 */
export function endRecord({ role, name }) {
  const winner = /^[A-F]$/.test(String(role || '')) ? String(role) : 'tie';
  const end = { winner, at: STAMP };
  if (winner !== 'tie' && name) end.name = String(name).slice(0, 20);
  return end;
}

export const dayPath = (env, day) => `stats/${env}/days/${day}`;

/**
 * Acceso por REST a la base. Un solo método: `patch(ruta, cambios)`, que es un
 * update de varias rutas a la vez. `keepalive` deja que el envío termine aunque la
 * página se cierre, que es justo lo que pasa cuando alguien empieza a jugar y se va.
 */
export function restApi(baseUrl = firebaseConfig.databaseURL, doFetch = globalThis.fetch) {
  return {
    patch(path, changes) {
      return doFetch(`${baseUrl}/${path}.json`, { method: 'PATCH', body: JSON.stringify(changes), keepalive: true });
    },
  };
}

/** Corre un envío sin que nada de lo que falle salga de acá: ni lanzar ni rechazar. */
const quiet = send => { try { return Promise.resolve(send()).catch(() => { /* mejor esfuerzo */ }); } catch (_) { return Promise.resolve(); } };

/**
 * Empezó una partida sin red (un celular, contra el celular o solitario), o este celular
 * creó o entró a una sala. `players` es cuántas personas juegan en este celular.
 */
export function noteStart(api, fp, { game, mode, players, now = Date.now() }) {
  // La hora es la de ahora, no la que quedó en la huella al abrir la página: una pestaña que
  // pasa la noche abierta (la Copa, "Otra vez" en Cuarto Rey) anotaba todo a la hora de entrar.
  const ahora = { ...fp, hour: new Date(now).getHours() };
  return quiet(() => api.patch(dayPath(fp.env, dayOf(now)), startChanges(ahora, { game, mode, players })));
}

/** Se creó una sala: queda su registro en el día en que el servidor la creó. */
export function noteRoom(api, fp, { code, createdAt, game, role, name }) {
  return quiet(() => api.patch(dayPath(fp.env, dayOf(createdAt)), { [`rooms/${code}`]: roomRecord(fp, { game, role, name }) }));
}

/** Alguien entró a una sala ajena con un rol nuevo: se suman su nombre y su país. */
export function notePlayer(api, fp, { code, createdAt, role, name }) {
  const cambios = { [`rooms/${code}/players/${role}`]: String(name || '').slice(0, 20) };
  if (fp.co) cambios[`rooms/${code}/co/${role}`] = fp.co;
  return quiet(() => api.patch(dayPath(fp.env, dayOf(createdAt)), cambios));
}

/**
 * Se terminó la partida de una sala: queda quién ganó (D-79). Lo manda cada celular que llega
 * a la pantalla final, y las reglas solo dejan escribirlo una vez: el primero que llegue lo
 * deja puesto y los demás rebotan sin que nadie se entere, que es como se manda todo acá.
 */
export function noteEnd(api, fp, { code, createdAt, role, name }) {
  return quiet(() => api.patch(dayPath(fp.env, dayOf(createdAt)), { [`rooms/${code}/end`]: endRecord({ role, name }) }));
}

/**
 * Partidas sin red en vivo (D-140). Una sala se ve viva porque existe en `rooms/`; una partida
 * contra el celular o en un solo celular no deja nada en la base mientras se juega, así que el
 * panel no sabía que alguien estaba jugando. Ahora cada una deja un registro al empezar y le
 * manda un latido cada `LATIDO_MS` mientras la pantalla está a la vista y alguien la tocó hace
 * menos de `QUIETO_MS`. El celular olvidado en la pantalla final deja de latir solo.
 *
 * Los días de La Copa no: el panel ya sabe quién está jugando un minijuego por `torneos/`.
 */
export const LATIDO_MS = 60 * 1000;
export const QUIETO_MS = 5 * 60 * 1000;

/** Identificador de una partida en vivo: diez letras y números al azar, sin nada del jugador. */
export function liveId(rand = Math.random) {
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) id += abc[Math.floor(rand() * abc.length)];
  return id;
}

/** ¿Este modo se muestra en vivo? Los sin red, menos el día jugado de un torneo. */
export const esEnVivo = mode => isLocalMode(mode) && !MODES[mode]?.torneo;

/** Registro de una partida sin red que empieza: juego, modo, cuántos juegan y el país, sin nombres. */
export function liveRecord(fp, { game, mode, players }) {
  const n = Math.min(MAX_PLAYERS, Math.max(1, Number(players) || 1));
  const r = { game, mode, n, at: STAMP, beat: STAMP, v: fp.v };
  if (fp.co) r.co = fp.co;
  return r;
}

/**
 * Arranca el latido de una partida sin red y devuelve con qué pararlo. Todo lo de afuera
 * (reloj, documento, temporizador) entra por parámetro para probarlo con node.
 */
export function startLive(api, fp, { game, mode, players }, {
  id = liveId(), now = Date.now, doc = globalThis.document,
  every = (f, ms) => setInterval(f, ms), stopEvery = clearInterval,
} = {}) {
  const path = dayPath(fp.env, dayOf(now()));
  quiet(() => api.patch(path, { [`live/${id}`]: liveRecord(fp, { game, mode, players }) }));
  let tocado = now();
  const toque = () => { tocado = now(); };
  const opts = { capture: true, passive: true };
  doc?.addEventListener?.('pointerdown', toque, opts);
  doc?.addEventListener?.('keydown', toque, opts);
  const timer = every(() => {
    if (doc?.visibilityState === 'hidden' || now() - tocado > QUIETO_MS) return;
    quiet(() => api.patch(path, { [`live/${id}/beat`]: STAMP }));
  }, LATIDO_MS);
  return () => {
    stopEvery(timer);
    doc?.removeEventListener?.('pointerdown', toque, opts);
    doc?.removeEventListener?.('keydown', toque, opts);
  };
}

/** Lo que usan los juegos y el transporte: la API real y la huella del navegador, de una. */
let shared = null;
export function stats() {
  if (!shared) shared = { api: restApi(), fp: fingerprint() };
  return shared;
}

/** Atajo para el transporte: apunta al ganador de una sala. Nunca lanza ni se espera. */
export function trackEnd(info) {
  try { const s = stats(); return noteEnd(s.api, s.fp, info); } catch (_) { return Promise.resolve(); }
}

/**
 * Atajo para los juegos: `trackStart({ game, mode, players })`. Nunca lanza ni se espera.
 * En un modo sin red arranca además el latido en vivo; una partida nueva ("Otra vez") para
 * el de la anterior, así el mismo celular nunca se ve jugando dos a la vez.
 */
let pararVivo = null;
export function trackStart(info) {
  try {
    const s = stats();
    if (pararVivo) { pararVivo(); pararVivo = null; }
    if (esEnVivo(info?.mode)) pararVivo = startLive(s.api, s.fp, info);
    return noteStart(s.api, s.fp, info);
  } catch (_) { return Promise.resolve(); }
}

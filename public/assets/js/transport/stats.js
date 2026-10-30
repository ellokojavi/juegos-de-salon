/**
 * Registro de uso para el panel del dueño (canon C-7, D-44).
 *
 * Son señales para ver cuánto y desde dónde se juega, no para identificar a nadie: no viaja
 * ninguna IP, ningún secreto ni el chat. De los modos sin red sale solo el nombre que la persona
 * ya escribió en la app, si lo hay (D-210). Lo que
 * se apunta, por día y por entorno, en `stats/<env>/days/<día>`:
 *
 *   (envs: `prod` the live site, `dev` tests, previews and the home network (`envOf`), and
 *   `owner` a live browser the owner marked as not counted from the panel (`envFor`, D-471))
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
 *   live/<id>: { game, mode, n, at, beat, v, co,    una partida sin red que se está jugando:
 *                name, fin }                        `beat` sube cada minuto mientras alguien
 *                                                   toca la pantalla (D-140). `name` es quién
 *                                                   juega, si la app lo sabe, y `fin` cómo
 *                                                   terminó (D-210)
 *
 * Y el tráfico del sitio (D-208), aunque nadie juegue:
 *
 *   vistas/<página>: cada vez que se abre una página (`hangman`, `cup`, `inicio`…)
 *   entradas/<página>: visitas, por la página donde empezaron (una por pestaña)
 *   ref/<dominio>: de dónde llegó la visita (`google_com`, `directo`); solo el dominio
 *   via/<canal>: la marca del enlace (`?from=link`, `utm_source`), si traía una
 *   retorno/<nueva|vuelve>: si este navegador ya había venido (una marca local, sin id)
 *   disp/<celular|tableta|computador>, pais/<CL>: de la visita
 *   juegan/<página>: visitas que llegaron a empezar algo, por su página de entrada
 *   viaJuegan/<canal>: of those, the ones whose link carried a mark (`via/`), by mark
 *
 * Usage captures (D-348, D-349):
 *
 *   fin/<game>/<mode>: a local (no-network) game that reached its end
 *   otra/<game>: a replay ("Otra vez", "Revancha"): the same game started again after finishing
 *   comparte/<what>: something shared (`app`, `copa`, `resultado-<page>`, `otro`)
 *   vuelta/<nueva|d1|d2-7|d8-30|d31>: days since this browser's last visit, once per visit
 *   frec/<f1|f2-3|f4-7|f8-14|f15>: distinct days visited in the last 28, once per device per day
 *   activos/<device id>: 1 visited, 2 started something. The id is a random pseudonym kept in
 *                        this browser, never tied to a name, an IP or anything else (D-349, amends D-44)
 *
 * Written by other modules into the same day: `support/<event>` (support.js, D-448) and
 * `splash/<campaign>/<event>` (splash.js: shown, reach, play, close, t0–t2 time open; D-461; start and finish of the game its Play opened, D-466).
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
import { param, tiene, nombres, normalizarUrl, AVISO_CLAVE } from '../parametros.js';
import { backGuard } from '../back-guard.js';

// 'lab' salió con el laboratorio (D-67); queda en el panel para leer lo que quedó guardado
export const ENVS = ['prod', 'dev', 'owner'];

/**
 * A browser the owner marked from the panel as not counted (D-471): its play and visits on the
 * live site go to `stats/owner/` instead of `stats/prod/`, so the Live numbers are other people's.
 * Only the published site changes: tests stay `dev`. A per-browser mark, nothing tied to a name.
 */
export const NOT_COUNTED_KEY = 'juegos-de-salon:not-counted';
export function notCounted(storage = globalThis.localStorage) {
  try { return storage?.getItem(NOT_COUNTED_KEY) === '1'; } catch (_) { return false; }
}
export function setNotCounted(on, storage = globalThis.localStorage) {
  try { if (on) storage.setItem(NOT_COUNTED_KEY, '1'); else storage.removeItem(NOT_COUNTED_KEY); } catch (_) { /* no storage */ }
}
/** The environment this browser writes to: `envOf`, with a not-counted browser's live visits as `owner`. */
export const envFor = (loc, storage) => { const e = envOf(loc || {}); return e === 'prod' && notCounted(storage) ? 'owner' : e; };
// Los modos viven en `games.js` (C-16): acá solo se pregunta si el que llegó sube contador.

/** Valores que resuelve el servidor (REST): hora y suma de a uno. */
const STAMP = { '.sv': 'timestamp' };
const INC = { '.sv': { increment: 1 } };

/** Where PR previews are served, under the owner's github.io (D-429). */
export const PREVIEWS = '/juegos-de-salon-previews/';

/**
 * Entorno según la URL: pruebas o app publicada.
 *
 * Pruebas es todo lo que no se sirve desde internet: el computador, la red de la casa
 * (10/8, 172.16/12, 192.168/16, `.local`) y Tailscale (`*.ts.net`, que es como se prueba en un
 * celular de verdad, D-67). Antes solo el computador contaba como prueba, y las partidas hechas
 * por Tailscale llegaban al panel como gente jugando (D-138).
 * What a browser actually writes to is `envFor`, which turns a not-counted `prod` into `owner` (D-471).
 */
export function envOf({ hostname = '', pathname = '' } = {}) {
  const h = String(hostname).toLowerCase();
  // A PR's preview (D-429): the owner trying a change before it merges, not people playing
  if (h.endsWith('.github.io') && String(pathname).startsWith(PREVIEWS)) return 'dev';
  if (/^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0)$/.test(h)) return 'dev';
  if (/^(10\.\d+|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+$/.test(h)) return 'dev';
  if (/(^|\.)(ts\.net|local)$/.test(h)) return 'dev';
  return 'prod';
}

/** The app's version, from the release meta set-version.py writes (`0.98.1-09eb4db`, C-11, D-467). */
export function versionOf(release) {
  const m = /^(\d+\.\d+\.\d+)/.exec(release || '');
  return m ? m[1] : '0';
}

/** The page's release meta, or '' outside a published copy. */
export const releaseOf = doc => doc?.querySelector?.('meta[name="release"]')?.content || '';

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
export function fingerprint({ storage = globalThis.localStorage, loc = globalThis.location, nav = globalThis.navigator, doc = globalThis.document, now = new Date(), app = getLang() } = {}) {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) { /* nada */ }
  return {
    env: envFor(loc, storage),
    v: versionOf(releaseOf(doc)),
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

/** El idioma en que se juega, en dos letras (`es`), o vacío si la app no lo sabe (D-211). */
export const idiomaDe = fp => (/^[a-z]{2}$/.test(fp?.app || '') ? fp.app : '');

/** Registro de una sala nueva (dos celulares), con el nombre y el país de quien la creó. */
export function roomRecord(fp, { game, role, name }) {
  const r = { game, at: STAMP, v: fp.v, players: { [role]: String(name || '').slice(0, 20) } };
  if (fp.co) r.co = { [role]: fp.co };
  // En qué idioma juega cada uno (D-211): el que eligió en la app, no el del navegador
  if (idiomaDe(fp)) r.l = { [role]: idiomaDe(fp) };
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
  if (idiomaDe(fp)) cambios[`rooms/${code}/l/${role}`] = idiomaDe(fp);
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
 * Los días de La Copa no: el panel ya sabe quién está jugando un juego por `torneos/`.
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

/**
 * Quién juega en este celular, si la app ya lo sabe (D-210): los nombres que el juego tiene para
 * esta partida (los de un celular pasándose), o si no, el último que la persona escribió en este
 * juego, en La Copa o en cualquier otro. Nunca se pide uno para esto: si no hay, va vacío.
 */
export const NOMBRE_MAX = 60;
export function nombreDelCelular(game, storage = globalThis.localStorage) {
  const leer = k => { try { return storage?.getItem(k) || ''; } catch (_) { return ''; } };
  const propio = leer(`juegos-de-salon:${game}:name`);
  if (propio) return propio;
  let copa = '';
  try { copa = JSON.parse(leer('juegos-de-salon:copa:nombre') || '""') || ''; } catch (_) { /* nada */ }
  if (copa) return String(copa);
  try {
    for (let i = 0; i < (storage?.length || 0); i++) {
      const k = storage.key(i);
      if (/^juegos-de-salon:[^:]+:name$/.test(k || '') && leer(k)) return leer(k);
    }
  } catch (_) { /* nada */ }
  return '';
}

/** Los nombres de una partida en una línea: "Javi, Cata", sin repetidos ni vacíos, acotada. */
export function nombresDe(lista) {
  const vistos = [...new Set((lista || []).map(x => String(x || '').replace(/\s+/g, ' ').trim()).filter(Boolean))];
  return vistos.join(', ').slice(0, NOMBRE_MAX);
}

/** Registro de una partida sin red que empieza: juego, modo, cuántos juegan, el país y, si se sabe, quién (D-210). */
export function liveRecord(fp, { game, mode, players, name = '' }) {
  const n = Math.min(MAX_PLAYERS, Math.max(1, Number(players) || 1));
  const r = { game, mode, n, at: STAMP, beat: STAMP, v: fp.v };
  if (fp.co) r.co = fp.co;
  if (idiomaDe(fp)) r.l = idiomaDe(fp);
  if (name) r.name = String(name).slice(0, NOMBRE_MAX);
  return r;
}

/**
 * Cómo terminó una partida sin red (D-210): quién ganó (`g`), si fue empate (`e`) y un detalle
 * corto ("7 intentos en 2:31"). Jugando solo no hay ganador: va el detalle.
 */
export function finRecord({ ganador = '', empate = false, detalle = '' } = {}) {
  const f = { at: STAMP };
  if (empate) f.e = true;
  else if (ganador) f.g = String(ganador).slice(0, 20);
  if (detalle) f.d = String(detalle).slice(0, 40);
  return f;
}

/**
 * Arranca el latido de una partida sin red y devuelve con qué pararlo. Todo lo de afuera
 * (reloj, documento, temporizador) entra por parámetro para probarlo con node.
 */
export function startLive(api, fp, { game, mode, players, name = '' }, {
  id = liveId(), now = Date.now, doc = globalThis.document,
  every = (f, ms) => setInterval(f, ms), stopEvery = clearInterval,
} = {}) {
  const path = dayPath(fp.env, dayOf(now()));
  quiet(() => api.patch(path, { [`live/${id}`]: liveRecord(fp, { game, mode, players, name }) }));
  let tocado = now();
  const toque = () => { tocado = now(); };
  const opts = { capture: true, passive: true };
  doc?.addEventListener?.('pointerdown', toque, opts);
  doc?.addEventListener?.('keydown', toque, opts);
  const timer = every(() => {
    if (doc?.visibilityState === 'hidden' || now() - tocado > QUIETO_MS) return;
    quiet(() => api.patch(path, { [`live/${id}/beat`]: STAMP }));
  }, LATIDO_MS);
  let terminada = false;
  const parar = () => {
    stopEvery(timer);
    doc?.removeEventListener?.('pointerdown', toque, opts);
    doc?.removeEventListener?.('keydown', toque, opts);
  };
  // Terminar: deja cómo salió, una sola vez, y deja de latir
  parar.terminar = info => {
    if (terminada) return Promise.resolve();
    terminada = true;
    parar();
    return quiet(() => api.patch(path, { [`live/${id}/fin`]: finRecord(info) }));
  };
  return parar;
}

/**
 * A campaign seen, for the panel's timeline: who saw which one and when. `c` is the splash
 * campaign's id, or `support` for the donation card (the Keanu one) when it opens. The name is the
 * one this phone already knows (`nombreDelCelular`); none is asked for. One row per view, in
 * `seen/<id>` of the day, deleted with the other names at 24 months (stats-retention.mjs).
 */
export function seenRecord(fp, { c, name = '' }) {
  const r = { c: String(c).slice(0, 40), at: STAMP };
  if (fp.co) r.co = fp.co;
  if (name) r.name = String(name).slice(0, NOMBRE_MAX);
  return r;
}
export function noteSeen(c, { api, fp } = stats(), { id = liveId(), now = Date.now(), name = nombreDelCelular('') } = {}) {
  return quiet(() => api.patch(dayPath(fp.env, dayOf(now)), { [`seen/${id}`]: seenRecord(fp, { c, name }) }));
}

/** Lo que usan los juegos y el transporte: la API real y la huella del navegador, de una. */
let shared = null;
export function stats() {
  if (!shared) shared = { api: restApi(), fp: fingerprint() };
  return shared;
}

/**
 * A splash campaign's conversion (D-466): tapping its Play leaves `{ id, at }` in this tab's
 * sessionStorage (splash.js); the first game started here afterwards counts `splash/<id>/start` and
 * the first one finished `splash/<id>/finish`, each once, within SPLASH_VIA_MS of the tap.
 */
export const SPLASH_VIA_KEY = 'juegos-de-salon:splash-via';
export const SPLASH_VIA_MS = 2 * 60 * 60 * 1000;
/** The change for `step` ('start' | 'finish'), marking it done; empty when there is nothing to count. */
export function splashStepChange(step, sesion = globalThis.sessionStorage, now = Date.now()) {
  try {
    const via = JSON.parse(leer(sesion, SPLASH_VIA_KEY) || 'null');
    if (!via || !/^[a-z0-9-]{1,40}$/.test(via.id || '') || !(now - via.at < SPLASH_VIA_MS) || via[step]) return {};
    // A finish without a start in this tab (a page that never called trackStart) still counts both
    const steps = step === 'finish' && !via.start ? ['start', 'finish'] : [step];
    poner(sesion, SPLASH_VIA_KEY, JSON.stringify({ ...via, ...Object.fromEntries(steps.map(k => [k, 1])) }));
    return Object.fromEntries(steps.map(k => [`splash/${via.id}/${k}`, INC]));
  } catch (_) { return {}; }
}
function noteSplashStep(step) {
  const c = splashStepChange(step);
  if (!Object.keys(c).length) return;
  const s = stats();
  quiet(() => s.api.patch(dayPath(s.fp.env, dayOf(Date.now())), c));
}

/** Atajo para el transporte: apunta al ganador de una sala. Nunca lanza ni se espera. */
export function trackEnd(info) {
  try { backGuard().disarm(); } catch (_) { /* the guard never stops the signal */ }
  try { noteSplashStep('finish'); } catch (_) { /* best effort */ }
  try { const s = stats(); return noteEnd(s.api, s.fp, info); } catch (_) { return Promise.resolve(); }
}

/**
 * Atajo para los juegos: `trackStart({ game, mode, players })`. Nunca lanza ni se espera.
 * En un modo sin red arranca además el latido en vivo; una partida nueva ("Otra vez") para
 * el de la anterior, así el mismo celular nunca se ve jugando dos a la vez.
 */
let pararVivo = null;
/** The previous start in this page: its game, and whether its live game was finished (replay detection). */
let anterior = null;
/** Is this start a replay? Same game as the previous start in this page, and that one had finished. */
export const esOtraVez = (prev, game) => !!(prev && game && prev.game === game && prev.finished);
export function trackStart(info) {
  // A back swipe mid-game asks before leaving (D-432); a replay arms it again
  try { backGuard().arm(); } catch (_) { /* the guard never stops the signal */ }
  try {
    const s = stats();
    if (pararVivo) { pararVivo(); pararVivo = null; }
    if (esOtraVez(anterior, info?.game)) trackReplay(info.game);
    anterior = { game: info?.game, mode: info?.mode, finished: false };
    // Quién juega: los nombres de la partida o, si no los hay, el que este celular ya conoce (D-210)
    const name = nombresDe(info?.nombres) || nombreDelCelular(info?.game);
    if (esEnVivo(info?.mode)) pararVivo = startLive(s.api, s.fp, { ...info, name });
    notePlayed(s.api, s.fp);
    noteActive(s.api, s.fp, { level: 2 });
    noteSplashStep('start');
    return noteStart(s.api, s.fp, info);
  } catch (_) { return Promise.resolve(); }
}

/* ------------------------------------------------------------------ */
/* Tráfico del sitio (D-208)                                           */
/* ------------------------------------------------------------------ */
/**
 * Cuánta gente entra al sitio y de dónde llega, aunque no juegue. Mismas reglas que lo demás
 * (D-44): contadores por día, sin IP, sin la dirección completa de donde vino (solo el dominio)
 * y sin ningún identificador (since D-349, one random id per browser, counted apart in `activos/`). "Vuelve" es una marca en el navegador que dice "ya vine", y no viaja.
 *
 * Una visita es una pestaña: se cuenta una vez, en la página donde empezó, con su origen. Cada
 * página que se abre después suma una vista. Si en esa visita se empieza algo, suma `juegan`
 * en su página de entrada: así se ve qué entradas terminan en partidas.
 */
export const VISITA_KEY = 'juegos-de-salon:visita';    // sessionStorage: la página donde empezó esta visita
export const JUGO_KEY = 'juegos-de-salon:visita-jugo'; // sessionStorage: esta visita ya empezó algo
export const VIA_KEY = 'juegos-de-salon:visita-via';   // sessionStorage: the link mark this visit came with, for viaJuegan
export const VINO_KEY = 'juegos-de-salon:vino';        // localStorage: este navegador ya había venido
export const REF_KEY = 'juegos-de-salon:ref';           // sessionStorage: el origen, guardado por una página puente

/** Lo que cabe en una clave de la base: minúsculas, números y guiones, acotado. */
const clave = (x, max = 40) => String(x || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, max);

/** La página, por su primera carpeta: `/hangman/` → `hangman`, `/` → `inicio`. */
export function paginaDe(pathname = '/') {
  const primera = String(pathname).split('/').filter(Boolean)[0] || '';
  return clave(primera.replace(/\.html?$/, '').replace(/^index$/, '')) || 'inicio';
}

/**
 * El dominio de donde llegó, como clave (`www.google.com` → `google_com`), o `directo` si no
 * hay o si es el mismo sitio. Los puntos no caben en una clave de la base: van como `_`, que
 * ningún dominio usa. Los prefijos que solo distinguen versiones de un mismo sitio se quitan
 * (`m.`, `l.`, `lm.` de Facebook e Instagram). Lo que viene de una app de Android
 * (`android-app://com.google.android.gm`) se queda con el nombre de la app.
 */
export function origenDe(referrer, propio = '') {
  let host = '';
  try { host = new URL(String(referrer || '')).hostname.toLowerCase(); } catch (_) { return 'directo'; }
  if (!host) return 'directo';
  const sinPrefijo = h => h.replace(/^(www\d?|m|l|lm|mobile|amp)\./, '');
  if (propio && sinPrefijo(host) === sinPrefijo(String(propio).toLowerCase())) return 'directo';
  const k = sinPrefijo(host).replace(/[^a-z0-9.-]/g, '').replace(/\./g, '_').slice(0, 60);
  return k || 'directo';
}

/** La marca del enlace: `?from=link` (o `?de=` de un link viejo, D-266) o `?utm_source=instagram`. Vacía si no trae. */
export function canalDe(search = '') {
  let q;
  try { q = new URLSearchParams(String(search || '')); } catch (_) { return ''; }
  return clave(param('from', q) || q.get('utm_source') || '', 20);
}

/**
 * El aviso que abrió esta página (`?notif=day`, D-233, D-266): lo pone notify.mjs en la
 * dirección de cada aviso, así el panel cuenta cuántos se tocan, por tipo. Devuelve la clave del
 * panel, que sigue siendo la de antes (`notif=deadline` → 'plazo'), y lee también los links viejos
 * (`?aviso=plazo`). Vacío si no viene de uno.
 */
// Los de Uno al día (D-230) van con `uad` pegado, sin guion: las reglas piden solo letras
export const TIPOS_AVISO = ['dia', 'plazo', 'final', 'fin', 'insc', 'copas', 'prueba', 'uaddia', 'uadracha', 'uadsemana', 'uadadios'];
export function avisoDe(search = '') {
  let q;
  try { q = new URLSearchParams(String(search || '')); } catch (_) { return ''; }
  const t = AVISO_CLAVE[clave(param('notif', q), 12)] || '';
  return TIPOS_AVISO.includes(t) ? t : '';
}

/**
 * Si la abrió la app instalada (el `start_url` de los manifests es `./?pwa`, D-233), en qué
 * sistema: `android`, `ios` u `otro`. Vacío si no.
 */
export function pwaDe(search = '', ua = '') {
  let q;
  try { q = new URLSearchParams(String(search || '')); } catch (_) { return ''; }
  if (!q.has('pwa')) return '';
  return /Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod|Macintosh/i.test(ua) ? 'ios' : 'otro';
}

/** La búsqueda sin `pwa` ni `notif`: contadas una vez, salen de la dirección para que recargar o volver no las sume de nuevo. */
export function sinMarcas(search = '') {
  let q;
  try { q = new URLSearchParams(String(search || '')); } catch (_) { return String(search || ''); }
  if (!q.has('pwa') && !tiene('notif', q)) return String(search || '');
  for (const k of ['pwa', ...nombres('notif')]) q.delete(k);
  // Sin '=' de más: `?K7Q2X` sigue siendo `?K7Q2X`, no `?K7Q2X=`
  const s = [...q].map(([k, v]) => (v === '' ? encodeURIComponent(k) : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)).join('&');
  return s ? `?${s}` : '';
}

/** Qué aparato es, a grandes rasgos. Un iPad moderno dice ser Mac: se le nota por la pantalla táctil. */
export function dispositivoDe({ ua = '', platform = '', touch = 0 } = {}) {
  if (/iPad|Tablet/i.test(ua) || (/Mac/.test(platform) && touch > 1)) return 'tableta';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'celular';
  return 'computador';
}

/**
 * Los contadores que suben al abrir una página. `primera` dice si es la primera página de la
 * visita: solo esa cuenta la entrada, el origen, el canal, si vuelve, el aparato y el país.
 */
export function visitChanges(fp, { pagina, primera, origen, canal, vuelve, disp, aviso, pwa }) {
  const c = { [`vistas/${pagina}`]: INC };
  // Un aviso tocado o la app instalada abren una página, sea o no la primera de la visita (D-233)
  if (aviso) c[`aviso/${aviso}`] = INC;
  if (pwa) c[`pwa/${pwa}`] = INC;
  if (!primera) return c;
  c[`entradas/${pagina}`] = INC;
  c[`ref/${origen || 'directo'}`] = INC;
  if (canal) c[`via/${canal}`] = INC;
  c[`retorno/${vuelve ? 'vuelve' : 'nueva'}`] = INC;
  c[`disp/${disp}`] = INC;
  c[`pais/${fp.co || 'desconocido'}`] = INC;
  return c;
}

/** Lee y escribe una clave del almacenamiento sin que un navegador que lo bloquea rompa nada. */
const leer = (st, k) => { try { return st?.getItem(k) ?? null; } catch (_) { return null; } };
const poner = (st, k, v) => { try { st?.setItem(k, v); } catch (_) { /* privado o lleno */ } };
const sacar = (st, k) => { try { st?.removeItem(k); } catch (_) { /* nada */ } };

/**
 * Anota la visita a esta página. Todo lo de afuera entra por parámetro para probarlo con node.
 * El panel no se cuenta: es el dueño mirando, no tráfico.
 */
export function noteVisit(api, fp, {
  loc = globalThis.location, doc = globalThis.document, nav = globalThis.navigator,
  sesion = globalThis.sessionStorage, local = globalThis.localStorage, now = Date.now(), hist = globalThis.history,
} = {}) {
  const pagina = paginaDe(loc?.pathname);
  if (pagina === 'panel') return Promise.resolve();
  const entrada = leer(sesion, VISITA_KEY);
  const primera = !entrada;
  let datos = { pagina, primera, aviso: avisoDe(loc?.search), pwa: pwaDe(loc?.search, nav?.userAgent) };
  if (datos.aviso || datos.pwa) {
    try { hist?.replaceState(hist.state, '', `${loc.pathname}${sinMarcas(loc.search)}${loc.hash || ''}`); } catch (_) { /* queda la dirección */ }
  }
  if (primera) {
    // Una página puente o de idioma redirige en el acto y se lleva el origen: lo deja guardado
    const puente = leer(sesion, REF_KEY);
    sacar(sesion, REF_KEY);
    const vuelve = !!leer(local, VINO_KEY);
    datos = {
      ...datos, vuelve,
      origen: origenDe(puente ?? doc?.referrer, loc?.hostname),
      canal: canalDe(loc?.search),
      disp: dispositivoDe({ ua: nav?.userAgent, platform: nav?.platform, touch: nav?.maxTouchPoints }),
    };
    poner(sesion, VISITA_KEY, pagina);
    if (datos.canal) poner(sesion, VIA_KEY, datos.canal);
    poner(local, VINO_KEY, '1');
  }
  const cambios = visitChanges(fp, datos);
  if (primera) Object.assign(cambios, habitChanges(local, dayOf(now)));
  Object.assign(cambios, activeChange({ level: 1, local, now }));
  return quiet(() => api.patch(dayPath(fp.env, dayOf(now)), cambios));
}

/** Esta visita empezó algo: suma una sola vez, en su página de entrada. */
export function notePlayed(api, fp, { sesion = globalThis.sessionStorage, now = Date.now() } = {}) {
  const entrada = leer(sesion, VISITA_KEY);
  if (!entrada || leer(sesion, JUGO_KEY)) return Promise.resolve();
  poner(sesion, JUGO_KEY, '1');
  const c = { [`juegan/${clave(entrada)}`]: INC };
  // Which channels bring players, not only visits: `?from=reddit-chile` that went on to play
  const via = leer(sesion, VIA_KEY);
  if (via) c[`viaJuegan/${clave(via, 20)}`] = INC;
  return quiet(() => api.patch(dayPath(fp.env, dayOf(now)), c));
}

/**
 * Lo que se hace en Uno al día (D-230), para el panel: cuántas veces por día se tocó el botón, rodó
 * el dado, se terminó el de hoy (o se repitió), se compartió, se tiró por otro juego, se invitó, se
 * abrió una invitación o se aceptó, y cómo les fue a los avisos (ofrecidos, hora elegida, activados,
 * "Ahora no", silenciados). Solo cuenta: no dice quién.
 */
export const EVENTOS_UAD = ['boton', 'dado', 'jugado', 'repite', 'compartir', 'otro', 'invitar', 'invitacion', 'aceptada', 'oferta', 'hora', 'activos', 'ahorano', 'silencio'];
export function trackUnoAlDia(evento) {
  try {
    if (!EVENTOS_UAD.includes(evento)) return Promise.resolve();
    const s = stats();
    return quiet(() => s.api.patch(dayPath(s.fp.env, dayOf(Date.now())), { [`uad/${evento}`]: INC }));
  } catch (_) { return Promise.resolve(); }
}

/**
 * Atajo para las páginas: `trackVisit()` al cargar. Nunca lanza ni se espera. Le avisa además al
 * vigía (`vigia.js`, D-251) que la página arrancó: si llegó hasta acá, sus módulos cargaron y corrieron.
 */
export function trackVisit() {
  try { globalThis.__vigia?.listo?.(); } catch (_) { /* sin vigía, nada */ }
  // Un link viejo (`?sala=`, `?prueba`) queda escrito en inglés en la barra (D-266)
  normalizarUrl();
  try { const s = stats(); return noteVisit(s.api, s.fp); } catch (_) { return Promise.resolve(); }
}

/**
 * Atajo para los juegos: la partida sin red que se está jugando terminó (D-210). En sala no hace
 * nada: ahí el ganador va por `trackEnd`. Nunca lanza ni se espera.
 */
export function trackFinish(info) {
  try { backGuard().disarm(); } catch (_) { /* the guard never stops the signal */ }
  try {
    const p = pararVivo;
    if (!p?.terminar) return Promise.resolve();
    pararVivo = null;
    const prev = anterior;
    if (prev) prev.finished = true;
    try { const l = globalThis.localStorage; l?.setItem(PARTIDAS_KEY, String((Number(l.getItem(PARTIDAS_KEY)) || 0) + 1)); } catch (_) { /* no storage: nothing counted */ }
    try { noteSplashStep('finish'); } catch (_) { /* best effort */ }
    if (prev?.game && isLocalMode(prev.mode)) {
      const st = stats();
      quiet(() => st.api.patch(dayPath(st.fp.env, dayOf(Date.now())), finChanges(prev)));
    }
    return p.terminar(info);
  } catch (_) { return Promise.resolve(); }
}

/* ------------------------------------------------------------------ */
/* Usage captures (D-348, D-349)                                              */
/* ------------------------------------------------------------------ */
export const ULTIMA_KEY = 'juegos-de-salon:ultima';            // localStorage: last visit day (dayOf)
export const DIAS_KEY = 'juegos-de-salon:dias';                // localStorage: distinct visit days, last 28, comma-separated
export const DISPOSITIVO_KEY = 'juegos-de-salon:dispositivo';  // localStorage: pseudonymous device id
export const ACTIVO_KEY = 'juegos-de-salon:activo';            // localStorage: `<day>:<level>` already written
export const PARTIDAS_KEY = 'juegos-de-salon:partidas';        // localStorage: finished games of every game, on the phone only (D-502)
export const VENTANA_DIAS = 28;

/** A finished local game: `fin/<game>/<mode>`. */
export const finChanges = ({ game, mode }) => ({ [`fin/${game}/${mode}`]: INC });

/** Band of days since the last visit; '' on the same day. */
export function vueltaBand(last, today) {
  if (last == null || !Number.isFinite(Number(last))) return 'nueva';
  const d = today - Number(last);
  if (d <= 0) return '';
  if (d === 1) return 'd1';
  if (d <= 7) return 'd2-7';
  if (d <= 30) return 'd8-30';
  return 'd31';
}

/** Band of distinct days visited in the last 28, today included. */
export function frecBand(n) {
  if (n <= 1) return 'f1';
  if (n <= 3) return 'f2-3';
  if (n <= 7) return 'f4-7';
  if (n <= 14) return 'f8-14';
  return 'f15';
}

/** The stored day list with today added and anything older than the window pruned. */
export function diasConHoy(texto, today) {
  const dias = new Set(String(texto || '').split(',').map(Number).filter(d => Number.isInteger(d) && d > today - VENTANA_DIAS && d <= today));
  dias.add(today);
  return [...dias].sort((a, b) => a - b);
}

/**
 * `vuelta/` and `frec/` for the first page of a visit, updating the local marks. `vuelta` only
 * when the day changed (or first time); `frec` only on the first visit of the day.
 */
export function habitChanges(local, today) {
  const c = {};
  const ultima = leer(local, ULTIMA_KEY);
  const band = vueltaBand(ultima == null ? null : Number(ultima), today);
  if (band) {
    c[`vuelta/${band}`] = INC;
    const dias = diasConHoy(leer(local, DIAS_KEY), today);
    c[`frec/${frecBand(dias.length)}`] = INC;
    poner(local, DIAS_KEY, dias.join(','));
  }
  poner(local, ULTIMA_KEY, String(today));
  return c;
}

/** The pseudonymous device id, created once. Empty if storage is blocked (then nothing is sent). */
export function deviceId(local = globalThis.localStorage, rand = Math.random) {
  const id = leer(local, DISPOSITIVO_KEY);
  if (/^[a-z0-9]{10}$/.test(id || '')) return id;
  const nuevo = liveId(rand);
  poner(local, DISPOSITIVO_KEY, nuevo);
  return leer(local, DISPOSITIVO_KEY) === nuevo ? nuevo : '';
}

/**
 * `activos/<id>` = 1 (visited) or 2 (started something), once per day and level, never lowered.
 * An idempotent set, not an increment. Empty when already written today or without storage.
 */
export function activeChange({ level, local = globalThis.localStorage, now = Date.now() } = {}) {
  try {
    const day = dayOf(now);
    const [d, l] = String(leer(local, ACTIVO_KEY) || '').split(':').map(Number);
    if (d === day && l >= level) return {};
    const id = deviceId(local);
    if (!id) return {};
    poner(local, ACTIVO_KEY, `${day}:${level}`);
    return { [`activos/${id}`]: level };
  } catch (_) { return {}; }
}

export function noteActive(api, fp, { level, local = globalThis.localStorage, now = Date.now() } = {}) {
  const c = activeChange({ level, local, now });
  if (!Object.keys(c).length) return Promise.resolve();
  return quiet(() => api.patch(dayPath(fp.env, dayOf(now)), c));
}

/** A replay ("Otra vez", "Revancha"). trackStart detects them on its own. Never throws. */
export function trackReplay(game) {
  try {
    const g = clave(game);
    if (!g) return Promise.resolve();
    const s = stats();
    return quiet(() => s.api.patch(dayPath(s.fp.env, dayOf(Date.now())), { [`otra/${g}`]: INC }));
  } catch (_) { return Promise.resolve(); }
}

/** What a share is about, as a key: lowercase, digits and dashes, `otro` if nothing is left. */
export const shareKey = what => (/^[a-z0-9-]{1,40}$/.test(clave(what)) ? clave(what) : 'otro');

/** Something was shared. Never throws. */
export function trackShare(what) {
  try {
    const s = stats();
    return quiet(() => s.api.patch(dayPath(s.fp.env, dayOf(Date.now())), { [`comparte/${shareKey(what)}`]: INC }));
  } catch (_) { return Promise.resolve(); }
}

/** The default share key from the page: home → `app`, the Cup → `copa`, a game → `resultado-<page>`. */
export function shareKeyOfPage(pathname = '/') {
  const p = paginaDe(pathname);
  if (p === 'inicio') return 'app';
  if (p === 'cup' || p === 'copa') return 'copa';
  if (p === 'panel') return '';
  return shareKey(`resultado-${p}`);
}

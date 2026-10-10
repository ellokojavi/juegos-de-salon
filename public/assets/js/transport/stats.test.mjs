// Ejecutar: node public/assets/js/transport/stats.test.mjs
import assert from 'node:assert/strict';
import {
  envOf, versionOf, tzKey, langKey, fingerprint, startChanges, roomRecord, dayPath,
  noteStart, noteRoom, notePlayer, noteEnd, endRecord, countryOf, regionOfLang, restApi,
  liveId, liveRecord, startLive, esEnVivo, LATIDO_MS, QUIETO_MS,
  paginaDe, origenDe, canalDe, dispositivoDe, avisoDe, pwaDe, sinMarcas, visitChanges, noteVisit, notePlayed, VISITA_KEY, VINO_KEY, REF_KEY,
  nombreDelCelular, nombresDe, finRecord,
} from './stats.js';
import { readFileSync } from 'node:fs';

const INC = { '.sv': { increment: 1 } };
const DAY = 24 * 60 * 60 * 1000;

/** API falsa: anota cada patch. Con `fail` rechaza, como Firebase cuando la regla dice que no. */
function fakeApi({ fail = false } = {}) {
  const calls = [];
  return { calls, patch(path, changes) { calls.push({ path, changes }); return fail ? Promise.reject(new Error('permission-denied')) : Promise.resolve(); } };
}

// Entorno según la URL
assert.equal(envOf({ hostname: 'localhost', pathname: '/bulls-and-cows/' }), 'dev');
assert.equal(envOf({ hostname: '127.0.0.1' }), 'dev');
assert.equal(envOf({ hostname: 'ellokojavi.github.io', pathname: '/juegos-de-salon/timeline/' }), 'prod');
assert.equal(envOf({ hostname: 'ellokojavi.github.io', pathname: '/juegos-de-salon/bulls-and-cows/' }), 'prod');
assert.equal(envOf({}), 'prod');
// Tailscale y la red de la casa también son pruebas (D-138)
assert.equal(envOf({ hostname: 'mac-mini.tail1234.ts.net' }), 'dev');
assert.equal(envOf({ hostname: '192.168.1.40' }), 'dev');
assert.equal(envOf({ hostname: '10.0.0.7' }), 'dev');
assert.equal(envOf({ hostname: '172.20.3.4' }), 'dev');
assert.equal(envOf({ hostname: 'mac-mini.local' }), 'dev');
assert.equal(envOf({ hostname: 'juegosdesalon.cl' }), 'prod');
assert.equal(envOf({ hostname: '172.40.3.4' }), 'prod');

// Versión desde el import map
assert.equal(versionOf('{"imports": {"../assets/js/ui.js": "../assets/js/ui.js?v=0.19.0"}}'), '0.19.0');
assert.equal(versionOf(''), '0');
assert.equal(versionOf(undefined), '0');

// Claves seguras para Firebase
assert.equal(tzKey('America/Santiago'), 'America__Santiago');
assert.equal(tzKey('America/Sao_Paulo'), 'America__Sao_Paulo');
assert.equal(tzKey('America/Port-au-Prince'), 'America__Port-au-Prince');
assert.equal(tzKey('Etc/GMT+3'), 'Etc__GMT+3');
assert.equal(tzKey(''), 'desconocida');
assert.equal(tzKey('x'.repeat(80)).length, 40);
assert.equal(langKey('es-CL'), 'es-CL');
assert.equal(langKey('pt.BR#$'), 'ptBR');
assert.equal(langKey(undefined), 'desconocido');

// Huella sin navegador: no revienta y queda con valores vagos
const fp0 = fingerprint({ loc: null, nav: null, doc: null, now: new Date(2026, 8, 11, 21, 5), app: null });
assert.equal(fp0.env, 'prod');
assert.equal(fp0.v, '0');
assert.equal(fp0.lang, 'desconocido');
assert.equal(fp0.app, 'desconocido');
// Los dos idiomas son distintos y se registran aparte: el del navegador dice de dónde es la
// persona, el del juego dice en cuál prefiere jugar (D-46).
const fpEn = fingerprint({ loc: null, nav: { language: 'es-CL' }, doc: null, now: new Date(), app: 'en' });
assert.equal(fpEn.lang, 'es-CL');
assert.equal(fpEn.app, 'en');
assert.equal(fp0.hour, 21);
assert.ok(typeof fp0.tz === 'string' && fp0.tz.length > 0);

const fp = { env: 'prod', v: '0.20.0', tz: 'America__Santiago', lang: 'es-CL', app: 'en', hour: 21 };

// Contadores por inicio de partida
assert.deepEqual(startChanges(fp, { game: 'toque-y-fama', mode: 'cpu', players: 1 }), {
  'origin/America__Santiago': INC, 'lang/es-CL': INC, 'applang/en': INC, 'hour/21': INC, 'local/toque-y-fama/cpu/1': INC,
});
assert.deepEqual(startChanges(fp, { game: 'linea-de-tiempo', mode: 'local', players: 4 })['local/linea-de-tiempo/local/4'], INC);
// jugadores fuera de rango se acotan a lo que aceptan las reglas (1 a 6)
assert.ok('local/cuarto-rey/local/6' in startChanges(fp, { game: 'cuarto-rey', mode: 'local', players: 9 }));
assert.ok('local/x/solo/1' in startChanges(fp, { game: 'x', mode: 'solo', players: 0 }));
// dos celulares: solo los contadores generales, la partida queda en rooms/
const online = startChanges(fp, { game: 'toque-y-fama', mode: 'online', players: 1 });
assert.deepEqual(Object.keys(online).sort(), ['applang/en', 'hour/21', 'lang/es-CL', 'origin/America__Santiago']);

// Registro de sala
assert.deepEqual(roomRecord(fp, { game: 'batalla-naval', role: 'A', name: 'Javi' }), {
  game: 'batalla-naval', at: { '.sv': 'timestamp' }, v: '0.20.0', players: { A: 'Javi' }, l: { A: 'en' },
}, 'con el idioma en que juega quien la creó (D-211)');
assert.equal('l' in roomRecord({ ...fp, app: 'desconocido' }, { game: 'x', role: 'A', name: 'n' }), false, 'sin idioma sabido, no va');
assert.equal(roomRecord(fp, { game: 'x', role: 'A', name: 'n'.repeat(30) }).players.A.length, 20);

// Rutas por día y entorno
const now = 20342 * DAY + 5 * 60 * 60 * 1000;
assert.equal(dayPath('prod', 20342), 'stats/prod/days/20342');

// noteStart apunta en el día de hoy del entorno
{
  const api = fakeApi();
  await noteStart(api, fp, { game: 'toque-y-fama', mode: 'local', players: 2, now });
  assert.equal(api.calls.length, 1);
  assert.equal(api.calls[0].path, 'stats/prod/days/20342');
  assert.deepEqual(api.calls[0].changes['local/toque-y-fama/local/2'], INC);
}

// La hora se toma al empezar, no la que quedó en la huella al abrir la página (D-138)
{
  const api = fakeApi();
  const tarde = new Date(2026, 8, 25, 23, 10).getTime();
  await noteStart(api, { ...fp, hour: 8 }, { game: 'copa', mode: 'copa', players: 1, now: tarde });
  assert.deepEqual(api.calls[0].changes['hour/23'], INC);
  assert.equal(api.calls[0].changes['hour/8'], undefined);
}

// noteRoom usa el día en que el servidor creó la sala, no el de hoy
{
  const api = fakeApi();
  const createdAt = 20341 * DAY + 23 * 60 * 60 * 1000;
  await noteRoom(api, { ...fp, env: 'dev' }, { code: 'ABCD', createdAt, game: 'linea-de-tiempo', role: 'A', name: 'Cata' });
  assert.equal(api.calls[0].path, 'stats/dev/days/20341');
  assert.deepEqual(api.calls[0].changes['rooms/ABCD'].players, { A: 'Cata' });
  await notePlayer(api, { ...fp, env: 'dev' }, { code: 'ABCD', createdAt, role: 'B', name: 'Fausto' });
  assert.deepEqual(api.calls[1].changes, { 'rooms/ABCD/players/B': 'Fausto', 'rooms/ABCD/l/B': 'en' });
}

// Mejor esfuerzo: un rechazo de las reglas no se propaga
{
  const api = fakeApi({ fail: true });
  await noteStart(api, fp, { game: 'x', mode: 'cpu', players: 1, now });
  await noteRoom(api, fp, { code: 'ABCD', createdAt: now, game: 'x', role: 'A', name: 'a' });
  await notePlayer(api, fp, { code: 'ABCD', createdAt: now, role: 'B', name: 'b' });
  const broken = { patch() { throw new Error('sin fetch'); } };
  await noteStart(broken, fp, { game: 'x', mode: 'cpu', players: 1, now });
}

// La API REST arma la URL y el cuerpo, con keepalive
{
  const sent = [];
  const api = restApi('https://db.example', (url, opts) => { sent.push({ url, opts }); return Promise.resolve({ ok: true }); });
  await api.patch('stats/prod/days/20342', { 'hour/3': INC });
  assert.equal(sent[0].url, 'https://db.example/stats/prod/days/20342.json');
  assert.equal(sent[0].opts.method, 'PATCH');
  assert.equal(sent[0].opts.keepalive, true);
  assert.deepEqual(JSON.parse(sent[0].opts.body), { 'hour/3': INC });
}

// ---------------------------------------------------------------- país (D-79)
{
  // Los husos los responde el navegador; acá se le pasa uno de mentira para no depender del ICU
  const husos = cc => ({ CL: ['America/Santiago', 'Pacific/Easter'], BR: ['America/Sao_Paulo'] })[cc] || [];
  assert.equal(countryOf({ tz: 'America/Santiago', lang: 'en-US' }, husos), 'CL',
    'manda el huso: un celular chileno puesto en inglés no es de Estados Unidos');
  assert.equal(countryOf({ tz: 'Pacific/Easter', lang: '' }, husos), 'CL');
  assert.equal(countryOf({ tz: 'America/Sao_Paulo', lang: 'pt-BR' }, husos), 'BR');
  // Huso que el navegador no sabe de quién es: queda el país del idioma
  assert.equal(countryOf({ tz: 'Europe/Madrid', lang: 'es-ES' }, husos), 'ES');
  // Ni huso conocido ni idioma con país: mejor sin bandera que con una inventada
  assert.equal(countryOf({ tz: 'Europe/Madrid', lang: 'es' }, husos), '');
  assert.equal(countryOf({}, husos), '');
  assert.equal(regionOfLang('pt-BR'), 'BR');
  assert.equal(regionOfLang('es-419'), '', 'una región que no es un país no es un país');
  assert.equal(regionOfLang('es'), '');
}

// El país viaja pegado a la sala: en el registro nuevo y al entrar alguien más
{
  const fp = { env: 'prod', v: '1.0.0', co: 'CL' };
  const r = roomRecord(fp, { game: 'dudo', role: 'A', name: 'Javi' });
  assert.deepEqual(r.co, { A: 'CL' });
  assert.deepEqual(roomRecord({ ...fp, co: '' }, { game: 'dudo', role: 'A', name: 'Javi' }).co, undefined,
    'sin país no se manda la llave: la regla exige dos letras');

  const api = fakeApi();
  const now = 20342 * DAY;
  await notePlayer(api, { ...fp, co: 'BR' }, { code: 'ABCD', createdAt: now, role: 'B', name: 'Ana' });
  assert.deepEqual(api.calls[0].changes, { 'rooms/ABCD/players/B': 'Ana', 'rooms/ABCD/co/B': 'BR' });
}

// ---------------------------------------------------------------- ganador (D-79)
{
  const e = endRecord({ role: 'B', name: 'Cata' });
  assert.equal(e.winner, 'B');
  assert.equal(e.name, 'Cata');
  assert.deepEqual(e.at, { '.sv': 'timestamp' }, 'la hora la pone el servidor, no el celular');
  assert.equal(endRecord({ role: 'Z', name: 'x' }).winner, 'tie', 'un rol que no existe no es un ganador');
  assert.equal(endRecord({}).winner, 'tie');
  assert.equal(endRecord({}).name, undefined, 'un empate no tiene nombre que anotar');
  assert.equal(endRecord({ role: 'A', name: 'x'.repeat(40) }).name.length, 20, 'el nombre va acotado, como en la sala');

  const api = fakeApi();
  const createdAt = 20342 * DAY + 3600000;
  await noteEnd(api, { env: 'prod', v: '1' }, { code: 'ABCD', createdAt, role: 'A', name: 'Javi' });
  assert.equal(api.calls[0].path, dayPath('prod', 20342), 'se anota en el día en que nació la sala, no en el de hoy');
  assert.equal(api.calls[0].changes['rooms/ABCD/end'].winner, 'A');

  // Mejor esfuerzo: si la regla dice que no (ya estaba escrito), nadie se entera
  await noteEnd(fakeApi({ fail: true }), { env: 'prod', v: '1' }, { code: 'ABCD', createdAt, role: 'A', name: 'Javi' });
}

// ---------------------------------------------------------------- partidas sin red en vivo (D-140)
{
  assert.match(liveId(), /^[a-z0-9]{10}$/, 'la forma que exige la regla');
  assert.equal(esEnVivo('cpu'), true);
  assert.equal(esEnVivo('local'), true);
  assert.equal(esEnVivo('online'), false, 'las salas ya se ven por rooms/');
  assert.equal(esEnVivo('copa'), false, 'La Copa se ve por torneos/');

  const r = liveRecord({ v: '0.65.0', co: 'CL' }, { game: 'batalla-naval', mode: 'cpu', players: 1 });
  assert.deepEqual(r, { game: 'batalla-naval', mode: 'cpu', n: 1, at: { '.sv': 'timestamp' }, beat: { '.sv': 'timestamp' }, v: '0.65.0', co: 'CL' });
  assert.equal('co' in liveRecord({ v: '1' }, { game: 'x', mode: 'cpu' }), false, 'sin país no se manda la llave');
  assert.equal(JSON.stringify(r).includes('name'), false, 'de un modo sin red no sale ningún nombre');

  // Un reloj, un documento y un temporizador de mentira
  let t = 20342 * DAY + 5000;
  const oyentes = {};
  const doc = { visibilityState: 'visible', addEventListener: (k, f) => { oyentes[k] = f; }, removeEventListener: k => { delete oyentes[k]; } };
  let tic = null, parado = false;
  const api = fakeApi();
  const parar = startLive(api, { env: 'prod', v: '1' }, { game: 'batalla-naval', mode: 'cpu', players: 1 },
    { id: 'abcdefghij', now: () => t, doc, every: f => { tic = f; return 1; }, stopEvery: () => { parado = true; } });
  assert.equal(api.calls[0].path, dayPath('prod', 20342));
  assert.equal(api.calls[0].changes['live/abcdefghij'].game, 'batalla-naval', 'al empezar queda el registro');

  t += LATIDO_MS; tic();
  assert.deepEqual(api.calls[1], { path: dayPath('prod', 20342), changes: { 'live/abcdefghij/beat': { '.sv': 'timestamp' } } }, 'late cada minuto');

  doc.visibilityState = 'hidden'; t += LATIDO_MS; tic();
  assert.equal(api.calls.length, 2, 'con la pantalla escondida no late');
  doc.visibilityState = 'visible';

  t += QUIETO_MS; tic();
  assert.equal(api.calls.length, 2, 'si nadie tocó la pantalla en cinco minutos, no late');
  oyentes.pointerdown(); tic();
  assert.equal(api.calls.length, 3, 'un toque lo despierta');

  t += DAY; oyentes.keydown(); tic();
  assert.equal(api.calls[3].path, dayPath('prod', 20342), 'late en el día en que empezó, aunque pase la medianoche');

  parar();
  assert.equal(parado, true);
  assert.equal(oyentes.pointerdown, undefined, 'al parar suelta los oyentes');

  // Mejor esfuerzo: si la base dice que no, nadie se entera
  startLive(fakeApi({ fail: true }), { env: 'prod', v: '1' }, { game: 'x', mode: 'cpu' }, { now: () => t, doc: null, every: () => 0, stopEvery: () => {} })();
}

// --- Tráfico del sitio (D-208) ---------------------------------------------
assert.equal(paginaDe('/'), 'inicio');
assert.equal(paginaDe('/hangman/'), 'hangman');
assert.equal(paginaDe('/labs/case/'), 'labs', 'la página es su primera carpeta');
assert.equal(paginaDe('/index.html'), 'inicio');
assert.equal(origenDe('', 'juegosdesalon.cl'), 'directo');
assert.equal(origenDe('https://juegosdesalon.cl/hangman/', 'juegosdesalon.cl'), 'directo', 'pasar de una página a otra no es un origen');
assert.equal(origenDe('https://www.google.com/search?q=juegos', 'juegosdesalon.cl'), 'google_com', 'solo el dominio, nunca lo que se buscó');
assert.equal(origenDe('https://l.instagram.com/?u=https%3A%2F%2Fjuegosdesalon.cl', 'x'), 'instagram_com');
assert.equal(origenDe('https://lm.facebook.com/l.php?u=x', 'x'), 'facebook_com');
assert.equal(origenDe('android-app://com.google.android.gm/', 'x'), 'com_google_android_gm');
assert.equal(origenDe('no es una url', 'x'), 'directo');
assert.equal(canalDe('?oficina&de=link'), 'link');
assert.equal(canalDe('?utm_source=Instagram&utm_medium=bio'), 'instagram');
assert.equal(canalDe('?de=<script>'), 'script', 'lo raro se limpia');
assert.equal(canalDe(''), '');
assert.equal(dispositivoDe({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile' }), 'celular');
assert.equal(dispositivoDe({ ua: 'Mozilla/5.0 (Linux; Android 14) Mobile' }), 'celular');
assert.equal(dispositivoDe({ ua: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', touch: 5 }), 'tableta', 'un iPad que dice ser Mac');
assert.equal(dispositivoDe({ ua: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', touch: 0 }), 'computador');

// Las claves que salen caben en las reglas de la base
{
  const reglas = JSON.parse(readFileSync(new URL('../../../../firebase/database.rules.json', import.meta.url), 'utf8')).rules.stats.$env.days.$day;
  const patron = (cat, v) => new RegExp(/.*\.matches\(\/(.+?)\/\)$/.exec(reglas[cat][`$${v}`]['.write'])[1]);
  for (const k of ['inicio', 'hangman', 'connections']) assert.match(k, patron('vistas', 'pagina'));
  for (const k of ['google_com', 'directo', 'com_google_android_gm']) assert.match(k, patron('ref', 'ref'));
  assert.match('link', patron('via', 'via'));
  for (const k of ['nueva', 'vuelve']) assert.match(k, patron('retorno', 'retorno'));
  for (const k of ['celular', 'tableta', 'computador']) assert.match(k, patron('disp', 'disp'));
  for (const k of ['CL', 'desconocido']) assert.match(k, patron('pais', 'pais'));
}

// Una visita: la primera página cuenta la entrada y su origen; las siguientes, solo la vista
{
  const fp = { env: 'prod', co: 'CL' };
  assert.deepEqual(visitChanges(fp, { pagina: 'cup', primera: false }), { 'vistas/cup': INC });
  assert.deepEqual(visitChanges(fp, { pagina: 'cup', primera: true, origen: 'google_com', canal: 'link', vuelve: true, disp: 'celular' }),
    { 'vistas/cup': INC, 'entradas/cup': INC, 'ref/google_com': INC, 'via/link': INC, 'retorno/vuelve': INC, 'disp/celular': INC, 'pais/CL': INC });
  assert.deepEqual(visitChanges({ env: 'prod' }, { pagina: 'x', primera: true, disp: 'celular' })['pais/desconocido'], INC);
}
{
  const almacen = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };
  const sesion = almacen(), local = almacen();
  const now = 20000 * DAY + 1000;
  const ctx = (pathname, extra = {}) => ({ loc: { pathname, search: '', hostname: 'juegosdesalon.cl', ...extra.loc }, doc: { referrer: extra.ref ?? '' },
    nav: { userAgent: 'Android Mobile' }, sesion, local, now });
  const api = fakeApi();
  // Llegó por una página puente, que dejó guardado el origen antes de redirigir
  sesion.setItem(REF_KEY, 'https://www.instagram.com/');
  await noteVisit(api, { env: 'prod', co: 'AR' }, ctx('/liars-dice/', { ref: 'https://juegosdesalon.cl/dudo/' }));
  assert.equal(api.calls[0].path, 'stats/prod/days/20000');
  assert.deepEqual(Object.keys(api.calls[0].changes).sort(), ['disp/celular', 'entradas/liars-dice', 'pais/AR', 'ref/instagram_com', 'retorno/nueva', 'vistas/liars-dice']);
  assert.equal(sesion.getItem(REF_KEY), null, 'el origen guardado se usa una vez');
  assert.equal(local.getItem(VINO_KEY), '1');
  // Otra página de la misma visita: solo la vista
  await noteVisit(api, { env: 'prod' }, ctx('/', { ref: 'https://juegosdesalon.cl/liars-dice/' }));
  assert.deepEqual(api.calls[1].changes, { 'vistas/inicio': INC });
  // Empezó una partida: suma una vez, en su página de entrada
  await notePlayed(api, { env: 'prod' }, { sesion, now });
  await notePlayed(api, { env: 'prod' }, { sesion, now });
  assert.deepEqual(api.calls.slice(2).map(c => c.changes), [{ 'juegan/liars-dice': INC }], 'una visita juega una vez');
  // Otra pestaña otro día: vuelve
  sesion.m.clear();
  await noteVisit(api, { env: 'prod' }, { ...ctx('/cup/'), loc: { pathname: '/cup/', search: '?oficina&de=link', hostname: 'juegosdesalon.cl' } });
  assert.deepEqual(api.calls.at(-1).changes['retorno/vuelve'], INC);
  assert.deepEqual(api.calls.at(-1).changes['via/link'], INC);
  assert.deepEqual(api.calls.at(-1).changes['ref/directo'], INC);
  // Un aviso tocado y la app instalada se cuentan aunque no sea la primera página de la visita (D-233)
  const hist = { state: null, url: '', replaceState(_s, _t, u) { this.url = u; } };
  await noteVisit(api, { env: 'prod' }, { ...ctx('/cup/'), loc: { pathname: '/cup/', search: '?oficina&dia=3&aviso=dia', hostname: 'juegosdesalon.cl' }, hist });
  assert.deepEqual(api.calls.at(-1).changes['aviso/dia'], INC);
  assert.equal(hist.url, '/cup/?oficina&dia=3', 'contado, sale de la dirección');
  await noteVisit(api, { env: 'prod' }, { ...ctx('/cup/'), loc: { pathname: '/cup/', search: '?pwa', hostname: 'juegosdesalon.cl' } });
  assert.deepEqual(api.calls.at(-1).changes['pwa/android'], INC);
  // El panel no es tráfico
  const antes = api.calls.length;
  await noteVisit(api, { env: 'prod' }, ctx('/panel/'));
  assert.equal(api.calls.length, antes);
  // Sin almacenamiento (privado, bloqueado) igual cuenta, sin romper nada
  const roto = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  await noteVisit(fakeApi({ fail: true }), { env: 'prod' }, { ...ctx('/'), sesion: roto, local: roto });
  assert.equal(sesion.getItem(VISITA_KEY), 'cup');
}

// Toda página con la que se entra al sitio cuenta su visita (D-208): un juego nuevo no puede olvidarlo
{
  const { readdirSync, existsSync } = await import('node:fs');
  const raiz = new URL('../../../', import.meta.url);
  const leer = r => readFileSync(new URL(r, raiz), 'utf8');
  for (const d of readdirSync(raiz)) {
    const g = `${d}/game.js`;
    if (existsSync(new URL(g, raiz))) assert.match(leer(g), /\ntrackVisit\(\);/, `${g} no cuenta la visita (trackVisit)`);
  }
  assert.match(leer('index.html'), /trackVisit\(\)/, 'la portada no cuenta la visita');
  assert.match(leer('labs/index.html'), /trackVisit\(\)/, 'el laboratorio no cuenta la visita');
  assert.doesNotMatch(leer('panel/panel.js'), /trackVisit/, 'el panel no es tráfico');
}

// --- Quién juega sin red y cómo terminó (D-210) ------------------------------
{
  const almacen = obj => ({ getItem: k => (k in obj ? obj[k] : null), key: i => Object.keys(obj)[i], get length() { return Object.keys(obj).length; } });
  assert.equal(nombreDelCelular('toque-y-fama', almacen({ 'juegos-de-salon:toque-y-fama:name': 'Javi', 'juegos-de-salon:copa:nombre': '"Otro"' })), 'Javi', 'primero el de este juego');
  assert.equal(nombreDelCelular('toque-y-fama', almacen({ 'juegos-de-salon:copa:nombre': '"Cata"' })), 'Cata', 'si no, el de La Copa');
  assert.equal(nombreDelCelular('toque-y-fama', almacen({ 'juegos-de-salon:dudo:name': 'Pancho', 'juegos-de-salon:dudo:session': '{}' })), 'Pancho', 'si no, el de cualquier juego');
  assert.equal(nombreDelCelular('toque-y-fama', almacen({})), '', 'nunca se inventa uno');
  assert.equal(nombreDelCelular('x', { getItem() { throw new Error('bloqueado'); } }), '');
  assert.equal(nombresDe(['Javi', ' Cata ', '', 'Javi', null]), 'Javi, Cata');
  assert.equal(nombresDe([]), '');
  assert.equal(liveRecord({ v: '1' }, { game: 'dudo', mode: 'cpu', players: 1, name: 'Javi' }).name, 'Javi');
  assert.equal('name' in liveRecord({ v: '1' }, { game: 'dudo', mode: 'cpu', players: 1 }), false, 'sin nombre no va el campo');
  assert.deepEqual(finRecord({ ganador: 'Javi', detalle: '7 intentos' }), { at: { '.sv': 'timestamp' }, g: 'Javi', d: '7 intentos' });
  assert.deepEqual(finRecord({ empate: true, ganador: 'x' }), { at: { '.sv': 'timestamp' }, e: true }, 'un empate no tiene ganador');
  assert.deepEqual(finRecord({ detalle: '80/100 · 2:31' }), { at: { '.sv': 'timestamp' }, d: '80/100 · 2:31' });
  // El final se anota una vez y deja de latir
  const api = fakeApi();
  let latidos = 0;
  const parar = startLive(api, { env: 'prod', v: '1' }, { game: 'dudo', mode: 'cpu', players: 1, name: 'Javi' },
    { id: 'abcdefghij', now: () => 20000 * DAY, doc: null, every: () => 7, stopEvery: () => { latidos++; } });
  assert.equal(api.calls[0].changes['live/abcdefghij'].name, 'Javi');
  await parar.terminar({ ganador: 'Javi' });
  await parar.terminar({ ganador: 'Otro' });
  const fines = api.calls.filter(c => 'live/abcdefghij/fin' in c.changes);
  assert.equal(fines.length, 1, 'una sola vez');
  assert.equal(fines[0].changes['live/abcdefghij/fin'].g, 'Javi');
  assert.ok(latidos >= 1, 'al terminar deja de latir');
  // Las claves nuevas caben en las reglas
  const reglas = JSON.parse(readFileSync(new URL('../../../../firebase/database.rules.json', import.meta.url), 'utf8')).rules.stats.$env.days.$day.live.$id;
  assert.ok(reglas.name && reglas.fin?.g && reglas.fin?.d && reglas.fin?.e, 'las reglas aceptan name y fin');
}

// --- El idioma de cada partida (D-211) ------------------------------------------
{
  const api = fakeApi();
  await notePlayer(api, { env: 'prod', app: 'pt', co: 'BR' }, { code: 'ABCD', createdAt: 20000 * DAY, role: 'B', name: 'Ana' });
  assert.equal(api.calls[0].changes['rooms/ABCD/l/B'], 'pt', 'quien entra anota su idioma');
  assert.equal(liveRecord({ v: '1', app: 'de' }, { game: 'dudo', mode: 'cpu', players: 1 }).l, 'de');
  const reglas = JSON.parse(readFileSync(new URL('../../../../firebase/database.rules.json', import.meta.url), 'utf8')).rules.stats.$env.days.$day;
  assert.ok(reglas.rooms.$code.l?.$p && reglas.live.$id.l, 'las reglas aceptan el idioma');
}

{
  // D-233: qué aviso abrió la página y si la abrió la app instalada
  assert.equal(avisoDe('?pirata&dia=3&aviso=plazo'), 'plazo');
  assert.equal(avisoDe('?aviso=otro'), '', 'solo los tipos que manda avisar.mjs');
  assert.equal(avisoDe(''), '');
  assert.equal(pwaDe('?pwa', 'Mozilla/5.0 (Linux; Android 14)'), 'android');
  assert.equal(pwaDe('?pwa', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X)'), 'ios');
  assert.equal(pwaDe('?pwa', 'Mozilla/5.0 (Windows NT 10.0)'), 'otro');
  assert.equal(pwaDe('?K7Q2X', 'Android'), '');
  assert.equal(sinMarcas('?pirata&dia=3&aviso=dia'), '?pirata&dia=3');
  assert.equal(sinMarcas('?pwa'), '');
  assert.equal(sinMarcas('?K7Q2X&lang=pt'), '?K7Q2X&lang=pt', 'sin marcas, queda igual');
  const reglas = JSON.parse(readFileSync(new URL('../../../../firebase/database.rules.json', import.meta.url), 'utf8')).rules.stats.$env;
  for (const k of ['aviso', 'pwa', 'mandados']) assert.ok(reglas.days.$day[k], `las reglas tienen ${k}`);
  assert.ok(reglas.push, 'las reglas tienen stats/<env>/push');
}

// Los avisos de Uno al día se cuentan aparte, con `uad` pegado (D-230)
assert.equal(avisoDe('?aviso=uaddia'), 'uaddia');
assert.equal(avisoDe('?aviso=uad-dia'), '', 'con guion, no: las reglas piden solo letras');

console.log('stats.test.mjs: todo en verde');

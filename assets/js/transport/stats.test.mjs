// Ejecutar: node assets/js/transport/stats.test.mjs
import assert from 'node:assert/strict';
import {
  envOf, versionOf, tzKey, langKey, fingerprint, startChanges, roomRecord, dayPath,
  noteStart, noteRoom, notePlayer, restApi,
} from './stats.js';

const INC = { '.sv': { increment: 1 } };
const DAY = 24 * 60 * 60 * 1000;

/** API falsa: anota cada patch. Con `fail` rechaza, como Firebase cuando la regla dice que no. */
function fakeApi({ fail = false } = {}) {
  const calls = [];
  return { calls, patch(path, changes) { calls.push({ path, changes }); return fail ? Promise.reject(new Error('permission-denied')) : Promise.resolve(); } };
}

// Entorno según la URL
assert.equal(envOf({ hostname: 'localhost', pathname: '/toque-y-fama/' }), 'dev');
assert.equal(envOf({ hostname: '127.0.0.1' }), 'dev');
assert.equal(envOf({ hostname: 'ellokojavi.github.io', pathname: '/juegos-de-salon/linea-de-tiempo/' }), 'prod');
assert.equal(envOf({ hostname: 'ellokojavi.github.io', pathname: '/juegos-de-salon/toque-y-fama/' }), 'prod');
assert.equal(envOf({}), 'prod');

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
  game: 'batalla-naval', at: { '.sv': 'timestamp' }, v: '0.20.0', players: { A: 'Javi' },
});
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

// noteRoom usa el día en que el servidor creó la sala, no el de hoy
{
  const api = fakeApi();
  const createdAt = 20341 * DAY + 23 * 60 * 60 * 1000;
  await noteRoom(api, { ...fp, env: 'dev' }, { code: 'ABCD', createdAt, game: 'linea-de-tiempo', role: 'A', name: 'Cata' });
  assert.equal(api.calls[0].path, 'stats/dev/days/20341');
  assert.deepEqual(api.calls[0].changes['rooms/ABCD'].players, { A: 'Cata' });
  await notePlayer(api, { ...fp, env: 'dev' }, { code: 'ABCD', createdAt, role: 'B', name: 'Fausto' });
  assert.deepEqual(api.calls[1].changes, { 'rooms/ABCD/players/B': 'Fausto' });
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

console.log('stats.test.mjs: todo en verde');

// Offline mode end to end (D-538, docs/OFFLINE.md, PR 7), with the flag on (localhost holds the lab
// key): the phone stores the site while online; with the network cut, offline-capable games, the home
// page and Uno al día's page open from the phone, the chip and the once-only sheet show, links that
// need signal are dimmed; a game finished offline is queued, and when the network is back it uploads
// once, the toast says so and the game counter moves by exactly one.
import { output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { COMMON } from '../../public/assets/js/i18n.js';
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 9447, dir: `${OUT}/p`, out: OUT });
const bad = msg => { console.log(`✗ ${msg}`); process.exitCode = 1; };
const ok = msg => console.log(`✓ ${msg}`);
const T = COMMON.es.offline;

await b.send('Network.enable');
const network = on => b.send('Network.emulateNetworkConditions', {
  offline: !on, latency: 0, downloadThroughput: on ? -1 : 0, uploadThroughput: on ? -1 : 0,
});
const until = async (expr, ms = 20000) => {
  for (let t = 0; t < ms; t += 250) { if (await b.evaluate(expr).catch(() => false)) return true; await sleep(250); }
  return false;
};

// Online: the service worker stores this release's files (precache.json) in the background
await network(true);
await b.go(`${SITE}/?lang=es`, 1500);
const stored = await until(`(async () => {
  for (const k of await caches.keys()) {
    if (!k.startsWith('jds-release-')) continue;
    const c = await caches.open(k);
    if (await c.match('/zip/') && await c.match('/today/')) return true;
  }
  return false;
})()`, 45000);
if (!stored) bad('the phone did not store the offline-capable pages (/zip/, /today/) within 45 s'); else ok('the site is stored for offline');

// A player on this phone (localhost uses the local store, no Firebase)
const jid = await b.evaluate(`(async () => {
  const { jugador } = await import('/assets/js/jugador.js');
  const J = await jugador();
  return (J.yo() || await J.crear('Offline E2E', '4321')).jid;
})()`);
if (!jid) bad('could not create a player');

// Offline: pages open from the phone
await network(false);
for (const route of ['/zip/', '/today/', '/']) {
  await b.go(`${SITE}${route}?lang=es`, 1200);
  const opened = await until(`document.body && document.body.children.length > 2 && !document.title.includes('ERR')`, 6000);
  if (!opened) { bad(`${route} did not open offline`); continue; }
  const off = await until(`document.documentElement.classList.contains('offline')`, 8000);
  if (!off) bad(`${route}: offline mode did not switch on`);
  else ok(`${route} opens offline, in offline mode`);
}

// A game's cover takes the offline palette (the owner, 2026-11-07); its play screens do not
await b.go(`${SITE}/battleship/?lang=es`, 1500);
if (!(await until(`document.documentElement.classList.contains('offline-shell')`, 6000))) bad('the battleship cover does not take the offline palette');
else ok('a game cover takes the offline palette');

// The random game works offline: it lands on a game this phone keeps, which opens
await b.go(`${SITE}/?lang=es`, 1500);
await b.evaluate(`localStorage.setItem('juegos-de-salon:offline-sheet-seen', '1'); document.querySelector('.btn-azar').click()`);
const landed = await until(`location.pathname !== '/' && document.documentElement.classList.contains('offline') && document.querySelectorAll('.screen').length > 0`, 15000);
if (!landed) bad(`the random game did not open offline (at ${await b.evaluate('location.href').catch(() => '?')})`);
else ok(`the random game opens offline (${await b.evaluate('location.pathname')})`);
await b.go(`${SITE}/?lang=es`, 1200);

// The sheet showed once (on the first offline page), and not again
const sheetAgain = await b.evaluate(`!!document.getElementById('hoja-offline')`);
const sheetSeen = await b.evaluate(`localStorage.getItem('juegos-de-salon:offline-sheet-seen') === '1'`);
if (!sheetSeen) bad('the once-only sheet was never shown');
else if (sheetAgain) bad('the sheet showed again on a later page');
else ok('the sheet showed once');

// The chip and the dimmed links
if (!(await until(`(document.querySelector('.offline-chip')?.textContent || '').includes(${JSON.stringify(T.chip)})`, 4000))) bad('no "Sin conexión" chip on the home page');
if (!(await until(`document.querySelectorAll('.needs-signal').length > 0`, 4000))) bad('nothing is dimmed on the home page (La Copa, Rankings…)');
else ok('the chip shows and what needs signal is dimmed');
if (await b.evaluate(`!![...document.querySelectorAll('a.needs-signal')].find(a => /\\/today\\/?$/.test(new URL(a.href).pathname))`)) bad('Uno al día\'s page is dimmed, but it is kept offline');

// A game finished offline is queued on the phone
const queued = await b.evaluate(`(async () => (await import('/assets/js/jugador.js')).guardarPendienteLocal({ juego: 'zip', s: 100, ms: 61000 }))()`);
if (!queued) bad('a finished game was not queued offline');
await b.go(`${SITE}/?lang=es`, 1200);
if (!(await until(`(document.querySelector('.offline-chip')?.textContent || '').includes(${JSON.stringify(T.pending.replace('{n}', 1))})`, 8000))) bad('the chip does not say "1 por subir"');
else ok('the chip counts the queued game');

// Back online: it uploads once, the toast says so, and the counter moved by exactly one
const counter = `(async () => (await (await import('/assets/js/jugador-local.js')).crearAlmacenLocal().get('jugadores/${jid}/juegos/zip/n')) || 0)()`;
const before = await b.evaluate(counter);
await network(true);
// The page uploads on its own when offline mode ends (about 10 s of steady signal)
if (!(await until(`(async () => (await (await import('/assets/js/jugador.js')).jugador()).pendientes().length === 0)()`, 40000))) bad('the queued game did not upload');
if (!(await until(`(document.querySelector('.offline-toast')?.textContent || '').includes(${JSON.stringify(T.uploaded1)})`, 6000))) bad(`no "${T.uploaded1}" toast`);
// Asked again, nothing more goes up
await b.evaluate(`(async () => { const { jugador } = await import('/assets/js/jugador.js'); await (await jugador()).subirPendientes(); })()`);
const after = await b.evaluate(counter);
if (after !== before + 1) bad(`the game counter moved from ${before} to ${after}, expected exactly +1`);
else ok('back online it uploaded once, with its toast');

await sleep(200);
const errors = b.errors.filter(e => !/ERR_INTERNET_DISCONNECTED|Failed to fetch|NetworkError|net::/.test(JSON.stringify(e)));
if (errors.length) bad(`page errors: ${JSON.stringify(errors).slice(0, 600)}`);
b.close();
if (!process.exitCode) console.log('✓ offline mode end to end: stored, opened offline, explained once, queued and uploaded once');

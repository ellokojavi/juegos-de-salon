// Ejecutar: node public/assets/js/vigia.test.mjs
// El vigía (D-251) corre en un navegador de mentira armado con node:vm: es un script clásico.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { envOf, paginaDe } from './transport/stats.js';
import { firebaseConfig } from './firebase-config.js';
import { dayOf } from './transport/cleanup.js';

const fuente = readFileSync(new URL('./vigia.js', import.meta.url), 'utf8');
const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  instagram: 'Mozilla/5.0 (Linux; Android 13; SM-A536E) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.0.0 Mobile Safari/537.36 Instagram 350.0.0.0',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  firefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
};

/** Un navegador de mentira: oyentes, relojes, fetch anotado y la página que se pida. */
function navegador({ url = 'https://juegosdesalon.cl/hangman/?K7Q2X', ua = UA.android, oculta = false, ahora = 1000, importmap = '' } = {}) {
  const oyentes = {}, envios = [], relojes = [];
  const on = quien => (tipo, f) => { (oyentes[`${quien}:${tipo}`] ||= []).push(f); };
  const loc = new URL(url);
  const doc = {
    visibilityState: oculta ? 'hidden' : 'visible',
    addEventListener: on('doc'),
    getElementById: id => (id === 'importmap' && importmap ? { textContent: importmap } : null),
  };
  const win = {
    addEventListener: on('win'),
    performance: { now: () => ahora },
  };
  const ctx = {
    window: win, document: doc, navigator: { userAgent: ua },
    location: { pathname: loc.pathname, hostname: loc.hostname, host: loc.host, protocol: loc.protocol, href: loc.href },
    fetch: (u, o) => { envios.push({ url: u, cambios: JSON.parse(o.body) }); return Promise.resolve(); },
    setTimeout: (f, ms) => { relojes.push({ f, ms }); return relojes.length; },
    clearTimeout: id => { if (relojes[id - 1]) relojes[id - 1].f = null; },
    Math, Date, JSON, String, RegExp, Object,
  };
  ctx.performance = win.performance;
  vm.runInNewContext(fuente, ctx);
  const disparar = (quien, tipo, e = {}) => (oyentes[`${quien}:${tipo}`] || []).forEach(f => f(e));
  const V = win.__vigia;
  return {
    V, envios, relojes, doc, win, set ahora(v) { ahora = v; },
    error: e => disparar('win', 'error', { target: win, ...e }),
    rechazo: reason => disparar('win', 'unhandledrejection', { reason }),
    recurso: target => disparar('win', 'error', { target }),
    ocultar: () => { doc.visibilityState = 'hidden'; disparar('doc', 'visibilitychange'); },
    salir: () => disparar('win', 'pagehide'),
    vencer: () => relojes.forEach(r => r.f && r.f()),
    cambios: () => Object.assign({}, ...envios.map(x => x.cambios)),
  };
}

const INC = { '.sv': { increment: 1 } };
const { _ } = navegador().V;

// --- Dice lo mismo que el resto del sitio --------------------------------------
assert.equal(_.BASE, firebaseConfig.databaseURL, 'la base del vigía es la de firebase-config.js');
for (const h of ['localhost', '127.0.0.1', '[::1]', '0.0.0.0', '192.168.1.40', '10.0.0.7', '172.20.1.1', 'mac.tail1.ts.net', 'mac.local', 'juegosdesalon.cl', 'ellokojavi.github.io', '172.32.0.1']) {
  assert.equal(_.entorno(h), envOf({ hostname: h }), `entorno de ${h}`);
}
for (const p of ['/', '/hangman/', '/cup/suelto/', '/index.html', '/labs/', '/Today/', '']) assert.equal(_.pagina(p), paginaDe(p), `página de ${p}`);
{
  const b = navegador({ ahora: 500 });
  b.error({ message: 'x', filename: 'https://juegosdesalon.cl/a.js', lineno: 1 });
  assert.match(b.envios[0].url, new RegExp(`^${firebaseConfig.databaseURL}/stats/prod/days/${dayOf(Date.now())}\\.json$`), 'manda al día UTC de stats.js');
}

// --- El navegador, por familia y versión mayor, nunca el texto entero ----------
assert.equal(_.navegador(UA.iphone), 'ios16');
assert.equal(_.navegador(UA.android), 'chrome129');
assert.equal(_.navegador(UA.instagram), 'instagram');
assert.equal(_.navegador(UA.mac), 'safari17');
assert.equal(_.navegador(UA.samsung), 'samsung25');
assert.equal(_.navegador(UA.firefox), 'firefox131');
assert.equal(_.navegador(UA.edge), 'edge129');
assert.equal(_.navegador(''), 'otro');
const reglas = JSON.parse(readFileSync(new URL('../../../firebase/database.rules.json', import.meta.url), 'utf8')).rules.stats.$env.days.$day;
const formaB = new RegExp(/matches\(\/(.+?)\/\)/.exec(reglas.err.$firma.d.b['.validate'])[1]);
for (const ua of Object.values(UA)) assert.match(_.navegador(ua), formaB, 'el navegador cabe en las reglas');

// --- Direcciones sin `?` ni `#`: ahí van los códigos de sala y de copa ----------
assert.equal(_.ruta('https://juegosdesalon.cl/hangman/game.js?v=1.2.3'), '/hangman/game.js');
assert.equal(_.ruta('https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js'), 'www.gstatic.com/firebasejs/10.0.0/firebase-app.js');
assert.equal(_.ruta('https://juegosdesalon.cl/cup/?K7Q2X#dia'), '/cup/');
assert.equal(_.limpio('Failed to fetch https://juegosdesalon.cl/cup/?OFICI   now'), 'Failed to fetch /cup/ now');
assert.equal(_.limpio('x'.repeat(300)).length, 160);
assert.equal(_.limpio('Uncaught TypeError: x'), 'TypeError: x', 'sin el "Uncaught" de Chrome: el mismo error en Safari no lo trae');
assert.equal(_.lugarDelStack('TypeError: x\n    at f (https://juegosdesalon.cl/hangman/game.js:120:7)\n    at g (https://juegosdesalon.cl/a.js:1:1)'), '/hangman/game.js:120');
assert.equal(_.lugarDelStack('f@https://juegosdesalon.cl/hangman/ui.js:33:2\ng@https://otro.com/x.js:1:1'), '/hangman/ui.js:33');
assert.equal(_.lugarDelStack('at f (https://otro.com/x.js:1:1)'), '', 'una línea de otro sitio no dice dónde está el error de la app');
assert.equal(_.tramo(400), 's1'); assert.equal(_.tramo(2999), 's3'); assert.equal(_.tramo(5000), 's6'); assert.equal(_.tramo(9999), 's10'); assert.equal(_.tramo(10000), 'mas');
assert.match(_.firma(['a', 'b']), /^[a-z0-9]{1,12}$/);
assert.equal(_.firma(['a', 'b']), _.firma(['a', 'b']), 'la firma es estable');

// --- Un error sin atrapar --------------------------------------------------------
{
  const b = navegador({ importmap: '{"imports":{"../a.js":"../a.js?v=0.128.1-abc1234"}}' });
  b.error({ message: 'TypeError: x is undefined', filename: 'https://juegosdesalon.cl/hangman/game.js?v=0.128.1', lineno: 88, error: { name: 'TypeError' } });
  const c = b.cambios();
  assert.deepEqual(c['falla/js/hangman'], INC);
  assert.deepEqual(c['falla/alguna/hangman'], INC);
  const [clave] = Object.keys(c).filter(k => k.endsWith('/d'));
  const d = c[clave];
  assert.equal(d.k, 'js'); assert.equal(d.p, 'hangman'); assert.equal(d.b, 'chrome129'); assert.equal(d.v, '0.128.1');
  assert.equal(d.m, 'TypeError: x is undefined', 'no repite el nombre del error');
  assert.equal(d.f, '/hangman/game.js:88');
  assert.deepEqual(c[clave.replace(/\/d$/, '/n')], INC);
  assert.equal(b.envios.length, 2, 'la cuenta y el detalle van en envíos distintos: el detalle lo rechaza la regla desde el segundo');
  assert.ok(!b.envios[0].cambios[clave], 'la cuenta no va con el detalle');
  // El mismo error otra vez en la misma carga no suma
  b.error({ message: 'TypeError: x is undefined', filename: 'https://juegosdesalon.cl/hangman/game.js', lineno: 88 });
  assert.equal(b.envios.length, 2);
  // Otro error de JS en la misma carga: suma su firma, pero no vuelve a contar la carga
  b.error({ message: 'otro', filename: 'https://juegosdesalon.cl/hangman/ui.js', lineno: 3 });
  assert.equal(b.envios.length, 4);
  assert.ok(!('falla/js/hangman' in b.envios[2].cambios) && !('falla/alguna/hangman' in b.envios[2].cambios), 'una carga cuenta una vez por tipo');
  // Las claves caben en las reglas
  for (const k of Object.keys(c)) {
    const [cat, a, bb] = k.split('/');
    assert.ok(reglas[cat], `las reglas tienen ${cat}`);
    if (cat === 'err') assert.match(a, /^[a-z0-9]{1,12}$/);
    if (cat === 'falla') { assert.match(a, /^[a-z]{1,12}$/); assert.match(bb, /^[a-z0-9-]{1,40}$/); }
  }
  for (const k of Object.keys(d)) assert.ok(reglas.err.$firma.d[k], `las reglas aceptan ${k} en el detalle`);
  for (const k of reglas.err.$firma.d['.validate'].match(/'(\w+)'/g).map(x => x.slice(1, -1))) assert.ok(k in d, `el detalle trae ${k}, que las reglas piden`);
}

// --- Los números no separan errores, la versión de la línea tampoco ---------------
{
  const a = navegador(), b = navegador();
  a.error({ message: 'índice 3 fuera de rango', filename: 'https://juegosdesalon.cl/zip/x.js', lineno: 10 });
  b.error({ message: 'índice 4 fuera de rango', filename: 'https://juegosdesalon.cl/zip/x.js', lineno: 12 });
  const firmaDe = x => Object.keys(x.cambios()).find(k => k.startsWith('err/')).split('/')[1];
  assert.equal(firmaDe(a), firmaDe(b), 'mismo error, misma firma');
  const c = navegador({ ua: UA.iphone });
  c.error({ message: 'índice 3 fuera de rango', filename: 'https://juegosdesalon.cl/zip/x.js', lineno: 10 });
  assert.notEqual(firmaDe(a), firmaDe(c), 'en otro navegador es otra firma: se ve en qué navegadores falla');
}

// --- Una promesa rechazada sin atrapar -----------------------------------------------
{
  const b = navegador({ url: 'https://juegosdesalon.cl/cup/' });
  b.rechazo({ name: 'Error', message: 'PERMISSION_DENIED: Permission denied', stack: 'Error\n    at x (https://juegosdesalon.cl/cup/store.js:40:2)' });
  const c = b.cambios();
  const d = Object.entries(c).find(([k]) => k.endsWith('/d'))[1];
  assert.equal(d.k, 'promesa'); assert.equal(d.m, 'PERMISSION_DENIED: Permission denied'); assert.equal(d.f, '/cup/store.js:40');
  assert.deepEqual(c['falla/promesa/cup'], INC);
  b.rechazo({ name: 'AbortError', message: 'aborted' });
  b.rechazo('texto suelto');
  assert.deepEqual([...b.V.fallas].map(f => f.mensaje), ['PERMISSION_DENIED: Permission denied', 'texto suelto'], 'un fetch cancelado no es una falla; un rechazo con un texto suelto sí');
}

// --- Un recurso que no llegó ----------------------------------------------------------
{
  const b = navegador();
  b.recurso({ tagName: 'SCRIPT', type: 'module', src: '' });
  b.recurso({ tagName: 'LINK', rel: 'stylesheet', href: 'https://juegosdesalon.cl/assets/css/base.css?v=1' });
  b.recurso({ tagName: 'IMG', src: 'https://juegosdesalon.cl/x.png' });
  b.recurso({ tagName: 'LINK', rel: 'icon', href: 'https://juegosdesalon.cl/icon.svg' });
  const det = Object.values(b.cambios()).filter(v => v.k);
  assert.deepEqual(det.map(d => [d.m, d.f]), [['módulo que no cargó (el de la página)', '/hangman/'], ['hoja de estilos que no cargó', '/assets/css/base.css']]);
  assert.deepEqual(b.cambios()['falla/recurso/hangman'], INC);
}

// --- El ruido no es de la app ------------------------------------------------------------
{
  const b = navegador();
  b.error({ message: 'Script error.', filename: '' });
  b.error({ message: 'x', filename: 'chrome-extension://abc/content.js', lineno: 1 });
  b.error({ message: 'ResizeObserver loop completed with undelivered notifications.' });
  assert.equal(b.envios.length, 0);
}

// --- Un tope por carga, y nada al irse -----------------------------------------------
{
  const b = navegador();
  for (let i = 0; i < 30; i++) b.error({ message: `error ${'abcdefghijklmnopqrstuvwxyz1234'[i]}`, filename: 'https://juegosdesalon.cl/a.js', lineno: i });
  assert.equal(b.V.fallas.length, 10, 'como mucho diez errores por carga');
  const s = navegador();
  s.salir();
  s.error({ message: 'x', filename: 'https://juegosdesalon.cl/a.js' });
  assert.equal(s.envios.length, 0, 'lo que se corta al cerrar la pestaña no se anota');
}

// --- Arrancó, y cuánto tardó --------------------------------------------------------------
{
  const b = navegador({ ahora: 2400 });
  b.V.listo();
  assert.deepEqual(b.cambios(), { 'listo/hangman/s3': INC });
  b.vencer();
  assert.equal(b.envios.length, 1, 'arrancó: el reloj de los 20 s no cuenta nada');
  b.V.listo();
  assert.equal(b.envios.length, 1, 'se cuenta una vez');
}
{
  const b = navegador();
  assert.equal(b.relojes[0].ms, 20000);
  b.vencer();
  assert.deepEqual(b.cambios(), { 'falla/arranque/hangman': INC, 'falla/alguna/hangman': INC }, 'no arrancó a los 20 s');
  b.ahora = 25000;
  b.V.listo();
  assert.equal(b.envios.length, 1, 'si arranca después, ya contó como que no arrancó');
}
{
  const b = navegador();
  b.error({ message: 'x', filename: 'https://juegosdesalon.cl/a.js' });
  b.vencer();
  assert.ok(!('falla/alguna/hangman' in b.envios.at(-1).cambios), 'una carga con un error que además no arranca cuenta una vez en "alguna"');
}
{
  const b = navegador();
  b.ocultar();
  b.vencer();
  b.V.listo();
  assert.equal(b.envios.length, 0, 'una pestaña que se fue al fondo no cuenta: ni falla de arranque ni tiempo');
  const c = navegador({ oculta: true });
  c.vencer();
  assert.equal(c.envios.length, 0, 'tampoco una que abrió al fondo');
}

// --- Va en cada página que arranca con trackVisit, y antes de las hojas de estilo ----------
const PUBLIC = new URL('../../', import.meta.url).pathname;
const paginas = [];
(function recorrer(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (f === 'index.html') paginas.push(p);
  }
})(PUBLIC);
let conVigia = 0;
for (const p of paginas) {
  const html = readFileSync(p, 'utf8');
  const rel = p.slice(PUBLIC.length);
  const modulos = html.includes('type="module"');
  if (rel.startsWith('panel/') || !modulos) {
    assert.ok(!html.includes('vigia.js'), `${rel}: el vigía no va en el panel ni en las páginas puente`);
    continue;
  }
  const prefijo = '../'.repeat(rel.split('/').length - 1);
  const tag = `<script src="${prefijo}assets/js/vigia.js"></script>`;
  assert.ok(html.includes(tag), `${rel}: falta ${tag} (D-251)`);
  assert.ok(html.indexOf(tag) < html.indexOf('<link rel="stylesheet"'), `${rel}: el vigía va antes de las hojas de estilo`);
  assert.ok(html.indexOf(tag) < html.indexOf('type="module"'), `${rel}: el vigía va antes de los módulos`);
  conVigia++;
}
assert.ok(conVigia >= 20, `el vigía está en ${conVigia} páginas`);

// --- Sin sintaxis que un navegador viejo no lea: es el que tiene que avisar cuando lo demás falla ---
const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/'(?:[^'\\]|\\.)*'/g, "''");
for (const [re, que] of [[/\?\./, '?.'], [/\?\?/, '??'], [/\b(let|const|class|async|await)\b/, 'let/const/class/async'], [/=>/, 'funciones flecha'], [/`/, 'plantillas'], [/\bimport\b|\bexport\b/, 'import/export']]) {
  assert.ok(!re.test(codigo), `vigia.js usa ${que}`);
}

console.log('vigia.test.mjs: todo en verde');

// Los avisos de La Copa en Chrome (D-223), con el almacén de prueba (?prueba) y sin red. La clave
// VAPID es la de vapid.js (D-225; si estuviera vacía, una de prueba), y el
// servicio de avisos del navegador se reemplaza por uno falso: ninguna suscripción sale del Chrome.
// Recorre la campana en sus estados, la tarjeta ("Avisarme" y "Ahora no"), el aviso de prueba, los
// ajustes, silenciar, y el camino de iPhone: agregar a inicio, otra app, y la app instalada que
// abre con el nombre ya elegido.
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, sleep } from '../cdp.mjs';
import { parVapid } from '../../push/vapid.mjs';

const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2] || mkdtempSync(join(tmpdir(), 'avisos-'));
const BASE = `${SITIO}/cup/`;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };

const b = await launch({ port: 9497, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const texto = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const hoja = () => ev(`document.querySelector('.hoja')?.id || null`);
const estadoCampana = () => ev(`document.getElementById('btn-avisos')?.dataset.estado || null`);

const { publica } = parVapid();
const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  instagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0',
};

/**
 * Antes de cada página: la clave de prueba, el servicio de avisos falso y, para el iPhone, un
 * navegador sin avisos (Safari fuera de la app instalada no tiene PushManager).
 */
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `
  try { localStorage.setItem('juegos-de-salon:vapid-prueba', ${JSON.stringify(publica)}); } catch (_) {}
  (() => {
    const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/prueba-e2e', async unsubscribe() { sessionStorage.removeItem('e2e:suscrito'); sessionStorage.setItem('e2e:anulada', '1'); return true; }, toJSON() { return { endpoint: this.endpoint, expirationTime: null, keys: { p256dh: 'BPRUEBA', auth: 'aPRUEBA' } }; } };
    const k = 'e2e:suscrito';
    if (window.PushManager) {
      PushManager.prototype.subscribe = async function (op) { sessionStorage.setItem('e2e:veces', String(Number(sessionStorage.getItem('e2e:veces') || 0) + 1)); sessionStorage.setItem('e2e:clave', String(op && op.applicationServerKey && op.applicationServerKey.length)); sessionStorage.setItem(k, '1'); return sub; };
      PushManager.prototype.getSubscription = async function () { return sessionStorage.getItem(k) ? sub : null; };
    }
    if (/iPhone/.test(navigator.userAgent) && !/standalone/.test(location.search)) { delete window.PushManager; }
    if (/standalone/.test(location.search)) Object.defineProperty(navigator, 'standalone', { get: () => true });
  })();
` });
const permitir = () => b.send('Browser.grantPermissions', { origin: SITIO, permissions: ['notifications'] });
const como = ua => b.send('Emulation.setUserAgentOverride', { userAgent: ua });
const preparar = () => ev(`(()=>{const st=document.createElement('style');st.textContent='.prueba-barra{display:none!important}';document.head.append(st);return 1})()`);

/* ---------- Android: antes de que parta, la tarjeta y "Ahora no" ---------- */
await como(UA.android);
await b.go(`${BASE}?prueba&demo=espera`, 2000); await preparar();
ok(await estadoCampana() === 'apagado', 'antes de partir: la campana dice "Activar avisos"');
ok(/parte el/i.test(await texto('#aviso-oferta')), 'antes de partir: la tarjeta ofrece avisar el día que parte');
const codeEspera = await ev('__copa.estado.code');
await click('#btn-ahora-no'); await sleep(400);
ok(!await ev(`!!document.getElementById('aviso-oferta')`), '"Ahora no" saca la tarjeta');
await b.go(`${BASE}?prueba&${codeEspera}`, 1800); await preparar();
ok(!await ev(`!!document.getElementById('aviso-oferta')`) && await estadoCampana() === 'apagado', 'la tarjeta no vuelve en esa copa, la campana sigue');

/* ---------- Android: activar desde la campana ---------- */
await permitir();
await b.go(`${BASE}?prueba&demo=jugador`, 2000); await preparar();
ok(await estadoCampana() === 'apagado', 'día 4: la campana parte apagada');
await click('#btn-avisos'); await sleep(1500);
ok(await estadoCampana() === 'activo', 'con el permiso dado, un toque activa los avisos');
ok(await ev(`sessionStorage.getItem('e2e:clave')`) === '65', 'la suscripción usa la clave VAPID (65 bytes)');
const avisosGuardados = await ev(`(async()=>JSON.stringify(await __copa.store.avisosDe(__copa.estado.code)))()`).catch(() => null);
ok(avisosGuardados && /"dia":true/.test(avisosGuardados) && /prueba-e2e/.test(avisosGuardados), 'la copa anota la suscripción con sus dos avisos');
const notis = await ev(`(async()=>{const r=await navigator.serviceWorker.ready;return (await r.getNotifications()).map(n=>n.title+' | '+n.body)})()`);
ok(notis.some(n => /La Copa/.test(n) && /Listo/.test(n)), `llega el aviso de confirmación (${notis.join(' / ') || 'ninguno'})`);
await b.shot('campana-activa');

/* ---------- La base rechaza la suscripción (otra identidad del mismo celular): se pide otra ---------- */
await b.go(`${BASE}?prueba&demo=jugador`, 2000); await preparar();
await ev(`(()=>{sessionStorage.setItem('e2e:veces','0');const st=__copa.store;const orig=st.guardarAvisos.bind(st);let una=true;st.guardarAvisos=async(...a)=>{if(una){una=false;throw Object.assign(new Error('permiso'),{code:'permiso'})}return orig(...a)};return 1})()`);
await click('#btn-avisos'); await sleep(1500);
ok(await estadoCampana() === 'activo' && await ev(`sessionStorage.getItem('e2e:anulada')`) === '1' && Number(await ev(`sessionStorage.getItem('e2e:veces')`)) >= 1, 'si la base rechaza la suscripción, se anula, se pide otra y queda activa');

/* ---------- Los ajustes ---------- */
await click('#btn-avisos'); await sleep(400);
ok(await hoja() === 'hoja-ajustes', 'la campana activa abre los ajustes');
await b.shot('hoja-ajustes');
await click('#av-plazo'); await sleep(800);
const tras = await ev(`(async()=>JSON.stringify(await __copa.store.avisosDe(__copa.estado.code)))()`).catch(() => '');
ok(/"plazo":false/.test(tras), 'apagar "Antes del cierre" queda anotado');
await click('#btn-silenciar'); await sleep(800);
ok(await hoja() === null && await estadoCampana() === 'apagado', '"Silenciar esta copa" la apaga');

/* ---------- Lo que abre un aviso (D-229): el día, o silenciar desde el botón de Android ---------- */
const codeAviso = await ev('__copa.estado.code');
const hoyDemo = await ev(`(()=>{const m=__copa.estado.copa.meta;return Object.keys(m.win).map(Number).find(k=>Date.now()>=m.win[k].a&&Date.now()<m.win[k].b&&!(__copa.estado.copa.results?.[k]?.[__copa.estado.yo]))||0})()`).catch(() => 0);
await b.go(`${BASE}?prueba&${codeAviso}&dia=${hoyDemo}`, 2000); await preparar();
ok(hoyDemo && await ev('__copa.estado.pantalla') === 'jugar', `el aviso del día ${hoyDemo} abre ese día, listo para empezar`);
await b.go(`${BASE}?prueba&${codeAviso}&dia=99`, 2000); await preparar();
ok(await ev('__copa.estado.pantalla') === 'tablero', 'un día que no se puede jugar abre el tablero');
await click('#btn-avisos'); await sleep(1500);
ok(await estadoCampana() === 'activo', 'se vuelven a activar');
await b.go(`${BASE}?prueba&${codeAviso}&silenciar`, 2000); await preparar(); await sleep(600);
ok(await estadoCampana() === 'apagado' && await ev('__copa.estado.pantalla') === 'tablero', 'el botón "Silenciar esta copa" del aviso la silencia');

/* ---------- Bloqueados ---------- */
await b.send('Browser.resetPermissions');
await b.send('Browser.setPermission', { origin: SITIO, permission: { name: 'notifications' }, setting: 'denied' });
await b.go(`${BASE}?prueba&demo=jugador`, 2000); await preparar();
ok(await estadoCampana() === 'bloqueado', 'con el permiso negado, la campana dice "Avisos bloqueados"');
await click('#btn-avisos'); await sleep(400);
ok(await hoja() === 'hoja-bloqueados' && /Permisos/.test(await texto('.hoja')), 'y explica cómo desbloquearlos en Android');
await b.shot('hoja-bloqueados');
await b.send('Browser.resetPermissions');

/* ---------- iPhone en Safari: agregar a inicio ---------- */
await como(UA.iphone);
await b.go(`${BASE}?prueba&demo=jugador`, 2000); await preparar();
ok(await estadoCampana() === 'apagado', 'iPhone en Safari: la campana se ofrece');
await click('#btn-avisos'); await sleep(400);
ok(await hoja() === 'hoja-instalar', 'el toque abre los pasos para agregar a inicio');
ok((await texto('.hoja')).includes(await ev('__copa.estado.code')), 'los pasos dan el código de la copa: iOS abre la app en la portada (D-227)');
ok(/[?&]app=[a-z0-9]{6}/.test(await ev('location.search')), 'la dirección lleva al jugador para la app instalada (sin el PIN)');
await b.shot('hoja-instalar');
await click('#btn-ya-agregue'); await sleep(300);
ok(/PIN/.test(await texto('.hoja')), '"Ya la agregué" dice que la app pedirá el PIN');

/* ---------- iPhone dentro de Instagram ---------- */
await como(UA.instagram);
await b.go(`${BASE}?prueba&demo=jugador`, 2000); await preparar();
await click('#btn-avisos'); await sleep(400);
ok(await hoja() === 'hoja-otra-app' && /Safari/.test(await texto('.hoja')), 'dentro de otra app: pide abrir en Safari');
await b.shot('hoja-otra-app');

/* ---------- La app instalada: abre con el nombre elegido y ofrece los avisos ---------- */
await como(UA.iphone);
await b.go(`${BASE}?prueba&demo=jugador`, 2000);
const code = await ev('__copa.estado.code'), pid = await ev('__copa.estado.yo');
// Un celular nuevo: sin asiento en la copa (la app instalada no ve lo que guardó Safari)
// En el modo de prueba, la sesión y el uid de cada "celular" viven en sessionStorage
await ev(`(()=>{sessionStorage.clear();return 1})()`);
await b.go(`${BASE}?prueba&${code}&app=${pid}&standalone`, 2200); await preparar();
ok(await ev('__copa.estado.pantalla') === 'entrar', 'la app instalada, sin asiento, pide entrar');
const elegido = await ev(`document.querySelector('.chip-btn.on')?.dataset.pid || null`);
ok(elegido === pid, 'la app instalada abre "Ya estoy inscrito" con su nombre elegido: falta solo el PIN');
ok(/PIN/.test(await texto('#bienvenida-app')), 'y lo dice: "Eres … en esta copa. Escribe tu PIN para seguir."');

const errores = b.errors.filter(e => !/firebase|gstatic/i.test(e));
ok(!errores.length, `sin errores en la página${errores.length ? ': ' + errores.join(' | ') : ''}`);
b.close();
if (!process.exitCode) console.log('✓ avisos de La Copa: campana, tarjeta, hojas y app instalada');

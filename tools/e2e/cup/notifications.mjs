// La Copa's notifications in Chrome (D-223), with the test store (?test) and no network. The VAPID
// key is the one in vapid.js (D-225; if it were empty, a test one), and the browser's push
// service is replaced by a fake one: no subscription leaves Chrome.
// Walks through the bell in its states, the card ("Avisarme" and "Ahora no"), the test notification,
// the settings, muting, and the iPhone path: add to home screen, another app, and the installed app
// that opens with the name already picked.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { vapidPair } from '../../push/vapid.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const BASE = `${SITE}/cup/`;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };

const b = await launch({ port: 9497, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const sheet = () => ev(`document.querySelector('.hoja')?.id || null`);
const bellState = () => ev(`document.getElementById('btn-avisos')?.dataset.estado || null`);

const { publicKey: publica } = vapidPair();
const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  instagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0',
};

/**
 * Before each page: the test key, the fake push service and, for the iPhone, a browser without
 * notifications (Safari outside the installed app has no PushManager).
 */
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `
  try { localStorage.setItem('juegos-de-salon:vapid-prueba', ${JSON.stringify(publica)}); } catch (_) {}
  (() => {
    const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/test-e2e', async unsubscribe() { sessionStorage.removeItem('e2e:subscribed'); sessionStorage.setItem('e2e:revoked', '1'); return true; }, toJSON() { return { endpoint: this.endpoint, expirationTime: null, keys: { p256dh: 'BTEST', auth: 'aTEST' } }; } };
    const k = 'e2e:subscribed';
    if (window.PushManager) {
      PushManager.prototype.subscribe = async function (op) { sessionStorage.setItem('e2e:times', String(Number(sessionStorage.getItem('e2e:times') || 0) + 1)); sessionStorage.setItem('e2e:key', String(op && op.applicationServerKey && op.applicationServerKey.length)); sessionStorage.setItem(k, '1'); return sub; };
      PushManager.prototype.getSubscription = async function () { return sessionStorage.getItem(k) ? sub : null; };
    }
    if (/iPhone/.test(navigator.userAgent) && !/standalone/.test(location.search)) { delete window.PushManager; }
    if (/standalone/.test(location.search)) Object.defineProperty(navigator, 'standalone', { get: () => true });
  })();
` });
const allow = () => b.send('Browser.grantPermissions', { origin: SITE, permissions: ['notifications'] });
const as = ua => b.send('Emulation.setUserAgentOverride', { userAgent: ua });
const prepare = () => ev(`(()=>{const st=document.createElement('style');st.textContent='.prueba-barra{display:none!important}';document.head.append(st);return 1})()`);

/* ---------- Android: before it starts, the card and "Ahora no" ---------- */
await as(UA.android);
await b.go(`${BASE}?test&demo=waiting`, 2000); await prepare();
ok(await bellState() === 'apagado', 'before it starts: the bell says "Activar avisos"');
ok(/parte el/i.test(await text('#aviso-oferta')), 'before it starts: the card offers to notify on the day it starts');
const waitingCode = await ev('__copa.estado.code');
await click('#btn-ahora-no'); await sleep(400);
ok(!await ev(`!!document.getElementById('aviso-oferta')`), '"Ahora no" removes the card');
await b.go(`${BASE}?test&${waitingCode}`, 1800); await prepare();
ok(!await ev(`!!document.getElementById('aviso-oferta')`) && await bellState() === 'apagado', 'the card does not come back in that cup, the bell stays');

/* ---------- Android: turning them on from the bell ---------- */
await allow();
await b.go(`${BASE}?test&demo=player`, 2000); await prepare();
ok(await bellState() === 'apagado', 'day 4: the bell starts off');
await click('#btn-avisos'); await sleep(1500);
ok(await bellState() === 'activo', 'with permission granted, one tap turns notifications on');
ok(await ev(`sessionStorage.getItem('e2e:key')`) === '65', 'the subscription uses the VAPID key (65 bytes)');
const savedNotifications = await ev(`(async()=>JSON.stringify(await __copa.store.avisosDe(__copa.estado.code)))()`).catch(() => null);
ok(savedNotifications && /"dia":true/.test(savedNotifications) && /test-e2e/.test(savedNotifications), 'the cup records the subscription with its two notifications');
const shown = await ev(`(async()=>{const r=await navigator.serviceWorker.ready;return (await r.getNotifications()).map(n=>n.title+' | '+n.body)})()`);
ok(shown.some(n => /La Copa/.test(n) && /Listo/.test(n)), `the confirmation notification arrives (${shown.join(' / ') || 'none'})`);
await b.shot('bell-active');

/* ---------- The database rejects the subscription (another identity on the same phone): another one is requested ---------- */
await b.go(`${BASE}?test&demo=player`, 2000); await prepare();
await ev(`(()=>{sessionStorage.setItem('e2e:times','0');const st=__copa.store;const orig=st.guardarAvisos.bind(st);let once=true;st.guardarAvisos=async(...a)=>{if(once){once=false;throw Object.assign(new Error('permiso'),{code:'permiso'})}return orig(...a)};return 1})()`);
await click('#btn-avisos'); await sleep(1500);
ok(await bellState() === 'activo' && await ev(`sessionStorage.getItem('e2e:revoked')`) === '1' && Number(await ev(`sessionStorage.getItem('e2e:times')`)) >= 1, 'if the database rejects the subscription, it is revoked, another is requested and it ends up active');

/* ---------- The settings ---------- */
await click('#btn-avisos'); await sleep(400);
ok(await sheet() === 'hoja-ajustes', 'the active bell opens the settings');
await b.shot('sheet-settings');
await click('#av-plazo'); await sleep(800);
const after = await ev(`(async()=>JSON.stringify(await __copa.store.avisosDe(__copa.estado.code)))()`).catch(() => '');
ok(/"plazo":false/.test(after), 'turning off "Antes del cierre" is recorded');
await click('#btn-silenciar'); await sleep(800);
ok(await sheet() === null && await bellState() === 'apagado', '"Silenciar esta copa" turns it off');

/* ---------- What a notification opens (D-229): the day, or muting from the Android button ---------- */
const notificationCode = await ev('__copa.estado.code');
const demoToday = await ev(`(()=>{const m=__copa.estado.copa.meta;return Object.keys(m.win).map(Number).find(k=>Date.now()>=m.win[k].a&&Date.now()<m.win[k].b&&!(__copa.estado.copa.results?.[k]?.[__copa.estado.yo]))||0})()`).catch(() => 0);
await b.go(`${BASE}?test&${notificationCode}&day=${demoToday}`, 2000); await prepare();
ok(demoToday && await ev('__copa.estado.pantalla') === 'jugar', `the day ${demoToday} notification opens that day, ready to start`);
await b.shot('notification-day');
ok(!/[?&](day|mute|dia|silenciar)\b/.test(await ev('location.search')), 'the address no longer carries the notification\'s day: reloading does not repeat it');
// With the name from before D-266 (`&dia=`): an old notification still reads the same
await b.go(`${BASE}?test&${notificationCode}&dia=99`, 2000); await prepare();
ok(await ev('__copa.estado.pantalla') === 'tablero', 'a day that cannot be played opens the board');
await click('#btn-avisos'); await sleep(1500);
ok(await bellState() === 'activo', 'they are turned on again');
await b.go(`${BASE}?test&${notificationCode}&mute`, 2000); await prepare(); await sleep(600);
await b.shot('notification-mute');
ok(await bellState() === 'apagado' && await ev('__copa.estado.pantalla') === 'tablero', 'the notification\'s "Silenciar esta copa" button mutes it');

/* ---------- Blocked ---------- */
await b.send('Browser.resetPermissions');
await b.send('Browser.setPermission', { origin: SITE, permission: { name: 'notifications' }, setting: 'denied' });
await b.go(`${BASE}?test&demo=player`, 2000); await prepare();
ok(await bellState() === 'bloqueado', 'with permission denied, the bell says "Avisos bloqueados"');
await click('#btn-avisos'); await sleep(400);
ok(await sheet() === 'hoja-bloqueados' && /Permisos/.test(await text('.hoja')), 'and explains how to unblock them on Android');
await b.shot('sheet-blocked');
await b.send('Browser.resetPermissions');

/* ---------- iPhone in Safari: add to home screen ---------- */
await as(UA.iphone);
await b.go(`${BASE}?test&demo=player`, 2000); await prepare();
ok(await bellState() === 'apagado', 'iPhone in Safari: the bell is offered');
await click('#btn-avisos'); await sleep(400);
ok(await sheet() === 'hoja-instalar', 'the tap opens the steps to add to home screen');
ok((await text('.hoja')).includes(await ev('__copa.estado.code')), 'the steps give the cup code: iOS opens the app on the home page (D-227)');
ok(/[?&]app=[a-z0-9]{6}/.test(await ev('location.search')), 'the address carries the player for the installed app (without the PIN)');
await b.shot('sheet-install');
await click('#btn-ya-agregue'); await sleep(300);
ok(/PIN/.test(await text('.hoja')), '"Ya la agregué" says the app will ask for the PIN');

/* ---------- iPhone inside Instagram ---------- */
await as(UA.instagram);
await b.go(`${BASE}?test&demo=player`, 2000); await prepare();
await click('#btn-avisos'); await sleep(400);
ok(await sheet() === 'hoja-otra-app' && /Safari/.test(await text('.hoja')), 'inside another app: asks to open in Safari');
await b.shot('sheet-other-app');

/* ---------- The installed app: opens with the name picked and offers notifications ---------- */
await as(UA.iphone);
await b.go(`${BASE}?test&demo=player`, 2000);
const code = await ev('__copa.estado.code'), pid = await ev('__copa.estado.yo');
// A new phone: no seat in the cup (the installed app does not see what Safari saved)
// In test mode, each "phone"'s session and uid live in sessionStorage
await ev(`(()=>{sessionStorage.clear();return 1})()`);
await b.go(`${BASE}?test&${code}&app=${pid}&standalone`, 2200); await prepare();
ok(await ev('__copa.estado.pantalla') === 'entrar', 'the installed app, without a seat, asks to sign in');
const picked = await ev(`document.querySelector('.chip-btn.on')?.dataset.pid || null`);
ok(picked === pid, 'the installed app opens "Ya estoy inscrito" with their name picked: only the PIN is missing');
ok(/PIN/.test(await text('#bienvenida-app')), 'and says so: "Eres … en esta copa. Escribe tu PIN para seguir."');

const errors = b.errors.filter(e => !/firebase|gstatic/i.test(e));
ok(!errors.length, `no errors on the page${errors.length ? ': ' + errors.join(' | ') : ''}`);
b.close();
if (!process.exitCode) console.log('✓ La Copa notifications: bell, card, sheets and installed app');

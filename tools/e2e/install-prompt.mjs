// The home page bubble that invites adding the app to the home screen (D-232), in Chrome with each
// person's phone: the steps for Safari and Chrome on iPhone, for Chrome and Samsung on Android,
// Chrome's own dialog, "open the link in Safari" inside another app, the ✕ that turns it off for
// good, and that it fits at 320 px in the four languages.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { COMMON, IDIOMAS } from '../../public/assets/js/i18n.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };

const b = await launch({ port: 9498, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const bubble = () => ev(`document.getElementById('globo-instalar')?.dataset.pasos || null`);
const sheet = () => ev(`document.querySelector('.hoja')?.id || null`);

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1',
  whatsapp: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0 Mobile Safari/537.36',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
};
const as = ua => b.send('Emulation.setUserAgentOverride', { userAgent: ua });
/** A new phone: without the earlier ✕ or a chosen language, on the home page, and the bubble already showed. */
const home = async (ua, q = '') => {
  await as(ua);
  await b.go(`${SITE}/${q}`, 600);
  await ev(`(()=>{localStorage.removeItem('juegos-de-salon:instalar:no');localStorage.removeItem('juegos-de-salon:lang');return 1})()`);
  await b.go(`${SITE}/${q}`, 3400);
};

/* ---------- iPhone with Safari ---------- */
await home(UA.iphone);
ok(await bubble() === 'ios-safari', 'iPhone with Safari: the bubble shows after a few seconds');
ok(/como app/.test(await text('#globo-instalar')), 'and says "Juegos de Salón como app"');
await b.shot('bubble-iphone');
await click('#btn-globo-agregar'); await sleep(400);
ok(await sheet() === 'hoja-agregar', '"Agregar" opens the sheet with the steps');
const safariSteps = await text('.hoja');
ok(await ev(`document.querySelectorAll('.hoja .hoja-paso').length`) === 3, 'there are three steps');
ok(/Compartir/.test(safariSteps) && /Safari/.test(safariSteps) && /Agregar a inicio/.test(safariSteps) && /iOS 26/.test(safariSteps), "Safari's: Compartir, Agregar a inicio, and iOS 26's ⋯");
await b.shot('sheet-iphone');
await click('.hoja-fondo'); await sleep(300);
ok(await sheet() === null && await bubble() === 'ios-safari', 'closing the sheet leaves the bubble');
await click('#btn-globo-agregar'); await sleep(300);
await click('#btn-ya-agregue'); await sleep(400);
ok(/ícono/.test(await text('.hoja')) && !await ev(`!!document.getElementById('btn-ya-agregue')`), '"Ya la agregué" says it opens from the icon');
ok(await bubble() === null || await sleep(300) || await bubble() === null, 'and the bubble goes away');
await b.go(`${SITE}/`, 3400);
ok(await bubble() === null, 'it doesn\'t come back after "Ya la agregué"');

/* ---------- The ✕ ---------- */
await home(UA.iphone);
await click('#btn-globo-cerrar'); await sleep(400);
ok(await bubble() === null, 'the ✕ removes it');
ok(await ev(`localStorage.getItem('juegos-de-salon:instalar:no')`) === '1', 'and it stays recorded on the phone');
await b.go(`${SITE}/`, 3400);
ok(await bubble() === null, "it doesn't show again after the ✕");
await b.go(`${SITE}/?lang=en`, 3400);
ok(await bubble() === null, 'not in another language either');

/* ---------- iPhone with Chrome ---------- */
await home(UA.iphoneChrome);
ok(await bubble() === 'ios-chrome', 'iPhone with Chrome: it shows with its own steps');
await click('#btn-globo-agregar'); await sleep(300);
ok(/barra de direcciones/.test(await text('.hoja')), 'Compartir is in the address bar');

/* ---------- iPhone inside WhatsApp ---------- */
await home(UA.whatsapp);
ok(await bubble() === 'otra-app-ios', 'inside WhatsApp: it shows anyway');
await click('#btn-globo-agregar'); await sleep(300);
ok(await sheet() === 'hoja-otra-app-portada' && /Safari/.test(await text('.hoja')), 'and asks to open the link in Safari');
ok((await text('.hoja-link')) === 'juegosdesalon.cl/', `with the home page link (${await text('.hoja-link')})`);
await b.shot('sheet-other-app');

/* ---------- Android with Chrome: without and with its own dialog ---------- */
await home(UA.android);
ok(await bubble() === 'android', 'Android with Chrome: it shows');
await click('#btn-globo-agregar'); await sleep(300);
ok(/⋮/.test(await text('.hoja')) && /Instalar/.test(await text('.hoja')), "without Chrome's dialog, the steps of the ⋮ menu");
await b.shot('sheet-android');
await click('.hoja-fondo'); await sleep(300);
// Chrome offers to install: "Agregar" opens its dialog, and if accepted, the bubble goes away for good
await ev(`(()=>{const e=new Event('beforeinstallprompt');e.prompt=async()=>{window.__dialogo=true};e.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(e);return 1})()`);
await click('#btn-globo-agregar'); await sleep(500);
ok(await ev('window.__dialogo === true') && await sheet() === null, 'with Chrome\'s dialog, "Agregar" opens that dialog');
ok(await bubble() === null && await ev(`localStorage.getItem('juegos-de-salon:instalar:no')`) === '1', 'installed from the dialog, the bubble goes away for good');

/* ---------- Samsung ---------- */
await home(UA.samsung);
await click('#btn-globo-agregar'); await sleep(300);
ok(await bubble() === 'samsung' && /☰/.test(await text('.hoja')), "Samsung Internet: the steps of its ☰ menu");

/* ---------- Computer and installed app: it doesn't show ---------- */
await home(UA.mac);
ok(await bubble() === null, "on the computer it doesn't show");
await as(UA.iphone);
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `if (/standalone/.test(location.search)) Object.defineProperty(navigator, 'standalone', { get: () => true });` });
await home(UA.iphone, '?standalone');
ok(await bubble() === null, "in the already installed app it doesn't show");

/* ---------- The four languages at 320 px ---------- */
await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
for (const lang of IDIOMAS) {
  await home(UA.iphone, `?lang=${lang}`);
  const m = await ev(`(()=>{const g=document.getElementById('globo-instalar');if(!g)return null;const r=g.getBoundingClientRect();const bs=[...g.querySelectorAll('button')].map(x=>x.getBoundingClientRect());return {left:r.left,right:r.right,width:innerWidth,scroll:document.documentElement.scrollWidth,buttons:bs.map(x=>Math.round(Math.min(x.width,x.height)))}})()`);
  ok(m && m.left >= 0 && m.right <= m.width && m.scroll <= m.width, `${lang}: the bubble fits at 320 px without sideways scroll`);
  ok(m && m.buttons.every(x => x >= 44), `${lang}: its buttons measure 44 px or more (${m?.buttons})`);
  ok((await text('#globo-instalar')).includes(COMMON[lang].ins.title), `${lang}: "${COMMON[lang].ins.title}"`);
  await b.shot(`bubble-320-${lang}`);
  await click('#btn-globo-agregar'); await sleep(400);
  const h = await ev(`(()=>{const p=document.querySelector('.hoja');return p?{scroll:document.documentElement.scrollWidth,width:innerWidth,height:p.scrollHeight,seen:p.clientHeight}:null})()`);
  ok(h && h.scroll <= h.width, `${lang}: the sheet fits at 320 px`);
  if (lang === 'pt') await b.shot('sheet-320-pt');
}

const errors = b.errors.filter(e => !/firebase|gstatic/i.test(e));
ok(!errors.length, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
b.close();
if (!process.exitCode) console.log(`✓ the add-to-home-screen bubble: each phone's steps, the ✕ and the languages (screenshots in ${OUT})`);

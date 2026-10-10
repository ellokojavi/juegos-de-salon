// El globo de la portada que invita a agregar la app a inicio (D-232), en Chrome con el celular de
// cada uno: los pasos de Safari y Chrome en iPhone, de Chrome y Samsung en Android, el diálogo
// propio de Chrome, "abre el link en Safari" dentro de otra app, la ✕ que lo apaga para siempre, y
// que a 320 px quepa en los cuatro idiomas.
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, sleep } from './cdp.mjs';
import { COMMON, IDIOMAS } from '../../public/assets/js/i18n.js';

const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2] || mkdtempSync(join(tmpdir(), 'instalar-'));
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };

const b = await launch({ port: 9498, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const texto = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const globo = () => ev(`document.getElementById('globo-instalar')?.dataset.pasos || null`);
const hoja = () => ev(`document.querySelector('.hoja')?.id || null`);

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1',
  whatsapp: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0 Mobile Safari/537.36',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
};
const como = ua => b.send('Emulation.setUserAgentOverride', { userAgent: ua });
/** Un celular nuevo: sin la ✕ de antes ni idioma elegido, en la portada, y el globo ya salió. */
const portada = async (ua, q = '') => {
  await como(ua);
  await b.go(`${SITIO}/${q}`, 600);
  await ev(`(()=>{localStorage.removeItem('juegos-de-salon:instalar:no');localStorage.removeItem('juegos-de-salon:lang');return 1})()`);
  await b.go(`${SITIO}/${q}`, 3400);
};

/* ---------- iPhone con Safari ---------- */
await portada(UA.iphone);
ok(await globo() === 'ios-safari', 'iPhone con Safari: el globo sale a los segundos');
ok(/como app/.test(await texto('#globo-instalar')), 'y dice "Juegos de Salón como app"');
await b.shot('globo-iphone');
await click('#btn-globo-agregar'); await sleep(400);
ok(await hoja() === 'hoja-agregar', '"Agregar" abre la hoja con los pasos');
const pasosSafari = await texto('.hoja');
ok(await ev(`document.querySelectorAll('.hoja .hoja-paso').length`) === 3, 'son tres pasos');
ok(/Compartir/.test(pasosSafari) && /Safari/.test(pasosSafari) && /Agregar a inicio/.test(pasosSafari) && /iOS 26/.test(pasosSafari), 'los de Safari: Compartir, Agregar a inicio, y el ⋯ de iOS 26');
await b.shot('hoja-iphone');
await click('.hoja-fondo'); await sleep(300);
ok(await hoja() === null && await globo() === 'ios-safari', 'cerrar la hoja deja el globo');
await click('#btn-globo-agregar'); await sleep(300);
await click('#btn-ya-agregue'); await sleep(400);
ok(/ícono/.test(await texto('.hoja')) && !await ev(`!!document.getElementById('btn-ya-agregue')`), '"Ya la agregué" dice que se abre con el ícono');
ok(await globo() === null || await sleep(300) || await globo() === null, 'y el globo se va');
await b.go(`${SITIO}/`, 3400);
ok(await globo() === null, 'no vuelve después de "Ya la agregué"');

/* ---------- La ✕ ---------- */
await portada(UA.iphone);
await click('#btn-globo-cerrar'); await sleep(400);
ok(await globo() === null, 'la ✕ lo saca');
ok(await ev(`localStorage.getItem('juegos-de-salon:instalar:no')`) === '1', 'y queda anotado en el celular');
await b.go(`${SITIO}/`, 3400);
ok(await globo() === null, 'no vuelve a salir después de la ✕');
await b.go(`${SITIO}/?lang=en`, 3400);
ok(await globo() === null, 'tampoco en otro idioma');

/* ---------- iPhone con Chrome ---------- */
await portada(UA.iphoneChrome);
ok(await globo() === 'ios-chrome', 'iPhone con Chrome: sale con sus propios pasos');
await click('#btn-globo-agregar'); await sleep(300);
ok(/barra de direcciones/.test(await texto('.hoja')), 'Compartir está en la barra de direcciones');

/* ---------- iPhone dentro de WhatsApp ---------- */
await portada(UA.whatsapp);
ok(await globo() === 'otra-app-ios', 'dentro de WhatsApp: sale igual');
await click('#btn-globo-agregar'); await sleep(300);
ok(await hoja() === 'hoja-otra-app-portada' && /Safari/.test(await texto('.hoja')), 'y pide abrir el link en Safari');
ok((await texto('.hoja-link')) === 'juegosdesalon.cl/', `con el link de la portada (${await texto('.hoja-link')})`);
await b.shot('hoja-otra-app');

/* ---------- Android con Chrome: sin y con el diálogo propio ---------- */
await portada(UA.android);
ok(await globo() === 'android', 'Android con Chrome: sale');
await click('#btn-globo-agregar'); await sleep(300);
ok(/⋮/.test(await texto('.hoja')) && /Instalar/.test(await texto('.hoja')), 'sin el diálogo de Chrome, los pasos del menú ⋮');
await b.shot('hoja-android');
await click('.hoja-fondo'); await sleep(300);
// Chrome ofrece instalar: "Agregar" abre su diálogo, y si se acepta, el globo se va para siempre
await ev(`(()=>{const e=new Event('beforeinstallprompt');e.prompt=async()=>{window.__dialogo=true};e.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(e);return 1})()`);
await click('#btn-globo-agregar'); await sleep(500);
ok(await ev('window.__dialogo === true') && await hoja() === null, 'con el diálogo de Chrome, "Agregar" abre ese diálogo');
ok(await globo() === null && await ev(`localStorage.getItem('juegos-de-salon:instalar:no')`) === '1', 'instalada desde el diálogo, el globo se va para siempre');

/* ---------- Samsung ---------- */
await portada(UA.samsung);
await click('#btn-globo-agregar'); await sleep(300);
ok(await globo() === 'samsung' && /☰/.test(await texto('.hoja')), 'Samsung Internet: los pasos de su menú ☰');

/* ---------- Computador y app instalada: no sale ---------- */
await portada(UA.mac);
ok(await globo() === null, 'en el computador no sale');
await como(UA.iphone);
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `if (/standalone/.test(location.search)) Object.defineProperty(navigator, 'standalone', { get: () => true });` });
await portada(UA.iphone, '?standalone');
ok(await globo() === null, 'en la app ya instalada no sale');

/* ---------- Los cuatro idiomas a 320 px ---------- */
await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
for (const lang of IDIOMAS) {
  await portada(UA.iphone, `?lang=${lang}`);
  const m = await ev(`(()=>{const g=document.getElementById('globo-instalar');if(!g)return null;const r=g.getBoundingClientRect();const bs=[...g.querySelectorAll('button')].map(x=>x.getBoundingClientRect());return {izq:r.left,der:r.right,ancho:innerWidth,scroll:document.documentElement.scrollWidth,botones:bs.map(x=>Math.round(Math.min(x.width,x.height)))}})()`);
  ok(m && m.izq >= 0 && m.der <= m.ancho && m.scroll <= m.ancho, `${lang}: el globo cabe a 320 px sin scroll de lado`);
  ok(m && m.botones.every(x => x >= 44), `${lang}: sus botones miden 44 px o más (${m?.botones})`);
  ok((await texto('#globo-instalar')).includes(COMMON[lang].ins.title), `${lang}: "${COMMON[lang].ins.title}"`);
  await b.shot(`globo-320-${lang}`);
  await click('#btn-globo-agregar'); await sleep(400);
  const h = await ev(`(()=>{const p=document.querySelector('.hoja');return p?{scroll:document.documentElement.scrollWidth,ancho:innerWidth,alto:p.scrollHeight,ve:p.clientHeight}:null})()`);
  ok(h && h.scroll <= h.ancho, `${lang}: la hoja cabe a 320 px`);
  if (lang === 'de') await b.shot('hoja-320-de');
}

const errores = b.errors.filter(e => !/firebase|gstatic/i.test(e));
ok(!errores.length, `sin errores en la página${errores.length ? ': ' + errores.join(' | ') : ''}`);
b.close();
if (!process.exitCode) console.log(`✓ el globo de agregar a inicio: pasos de cada celular, la ✕ y los idiomas (capturas en ${OUT})`);

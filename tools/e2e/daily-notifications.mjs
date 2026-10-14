// Uno al día's notifications (D-230), end to end with a fake notification service and the test
// store: the second time you finish, the card offers the time; choosing it subscribes the phone
// and saves what it asked for (pushDia); the /today/ bell shows the time, changes the switches and
// the time, and silences; an iPhone without the app installed sees the steps to add it, inside
// WhatsApp it asks to open in Safari, and with notifications blocked it explains how to unblock
// them. The clock is fixed on October 6, 2026, day no. 1, when Desenredo is due.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { juegoDel as gameOf } from '../../public/assets/js/uno-al-dia.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const DB = 'juegos-de-salon:prueba:records-db';
if (gameOf('2026-10-06') !== 'desenredo') { console.log("✗ 2026-10-06 no longer gets Desenredo: change the script's date"); process.exit(1); }

const b = await launch({ port: 9523, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };
const pushDia = () => ev(`(()=>{const d=JSON.parse(localStorage.getItem('${DB}')||'{}');const k=Object.keys(d.pushDia||{})[0];return k?{k,...d.pushDia[k],sub:!!d.push?.[k]}:null})()`);

const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  whatsapp: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24',
};
const as = ua => b.send('Emulation.setUserAgentOverride', { userAgent: ua });

// The clock, the fake notification service (as in cup/notifications.mjs) and, on an iPhone in Safari, no notifications
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{const D=Date,dif=new D(2026,9,6,12,0,0).getTime()-D.now();
  class F extends D{constructor(...a){a.length?super(...a):super(D.now()+dif)} static now(){return D.now()+dif}}
  window.Date=F;
  const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/prueba-uad', async unsubscribe() { sessionStorage.removeItem('e2e:suscrito'); return true; }, toJSON() { return { endpoint: this.endpoint, expirationTime: null, keys: { p256dh: 'BPRUEBA', auth: 'aPRUEBA' } }; } };
  if (window.PushManager) {
    PushManager.prototype.subscribe = async function () { sessionStorage.setItem('e2e:suscrito', '1'); return sub; };
    PushManager.prototype.getSubscription = async function () { return sessionStorage.getItem('e2e:suscrito') ? sub : null; };
  }
  if (/iPhone/.test(navigator.userAgent)) { delete window.PushManager; }
})()` });
const permission = setting => b.send('Browser.setPermission', { permission: { name: 'notifications' }, setting, origin: SITE });

/* ---------- Android: the second time you finish, the offer ---------- */
await as(UA.android);
await permission('granted');
await b.go(`${SITE}/`, 600);
await ev(`(()=>{localStorage.clear();localStorage.setItem('juegos-de-salon:instalar:no','1');
  localStorage.setItem('juegos-de-salon:uno-al-dia', JSON.stringify({dias:{'2026-10-05':{j:'reinas',s:70,ms:1,at:1,n:1}}}));return 1})()`);
await b.go(`${SITE}/untangle/?today&test&timer=3`, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
await click('#btn-empezar');
await waitFor(`!!document.getElementById('btn-fin')`, 80);
await click('#btn-fin');
ok(await waitFor(`!!document.getElementById('uad-oferta')`, 30), 'the second time you finish, the card offers the notifications');
ok(/¿Te avisamos cada día para jugar\?/.test(await text('#uad-oferta')), `"${(await text('#uad-oferta')).split('\n')[0]}"`);
const times = await ev(`[...document.querySelectorAll('#uad-oferta .uad-horas button')].map(b=>b.textContent).join(' / ')`);
ok(times === 'Mañana · 9:00 / Almuerzo · 13:00 / Tarde · 19:00', `with three times (${times})`);
await b.shot('offer');
await click('#uad-oferta [data-h="13"]');
ok(await waitFor(`/Te avisaremos cada día a las 13:00/.test(document.getElementById('uad-oferta')?.innerText||'')`, 30), 'choosing 13:00 turns them on and says so');
let q = await pushDia();
ok(q?.h === 13 && q.d && q.r && q.w && q.sub, `it saves the subscription and what it asked for (${JSON.stringify(q)})`);
ok(q?.c === 2 && q.sp === 's2026-41' && q.sn === 2, "and its streak and its week (the 5th and the 6th, both in the same week), for the notification's text");

/* ---------- The /today/ bell ---------- */
await b.go(`${SITE}/today/`, 2000);
ok(await waitFor(`document.getElementById('btn-uad-avisos')?.dataset.estado === 'activo'`), '/today/: the bell says they are on');
ok(/13:00/.test(await text('#btn-uad-avisos')), `with the time (${await text('#btn-uad-avisos')})`);
await click('#btn-uad-avisos');
ok(await waitFor(`!!document.getElementById('hoja-uad-ajustes')`), "tapping it opens the notifications' sheet");
await b.shot('sheet-settings');
await click('#uad-av-racha');
await waitFor(`JSON.parse(localStorage.getItem('${DB}')).pushDia && Object.values(JSON.parse(localStorage.getItem('${DB}')).pushDia)[0].r === false`);
ok((await pushDia())?.r === false, 'turning off "Se corta la racha" stays saved');
await click('#hoja-uad-ajustes [data-h="19"]');
await waitFor(`Object.values(JSON.parse(localStorage.getItem('${DB}')).pushDia||{})[0]?.h === 19`);
ok((await pushDia())?.h === 19, 'changing the time to 19:00 stays saved');
await click('#btn-uad-silenciar');
ok(await waitFor(`!Object.keys(JSON.parse(localStorage.getItem('${DB}')).pushDia||{}).length`), 'Silenciar turns them off in the database');
ok(await waitFor(`/no te llegan más avisos/.test(document.body.innerText)`), 'and says so');
ok(await ev(`!!document.querySelector('#uad-avisos .uad-horas')`), 'and the bell offers the time again');
ok(!await ev(`!!document.getElementById('btn-uad-calendario')`) && !/calendario/i.test(await text('#uad-avisos')), 'the reminder is the daily notification: there is no calendar reminder');

/* ---------- Blocked ---------- */
await permission('denied');
await b.go(`${SITE}/today/`, 1800);
ok(await waitFor(`document.getElementById('btn-uad-avisos')?.dataset.estado === 'bloqueado'`), 'with the permission denied, the bell says "Avisos bloqueados"');
await click('#btn-uad-avisos');
ok(await waitFor(`!!document.getElementById('hoja-uad-bloqueados')`), 'and explains how to unblock them');

/* ---------- iPhone in Safari and inside WhatsApp ---------- */
await permission('prompt');
await as(UA.iphone);
await b.go(`${SITE}/today/`, 1800);
await waitFor(`!!document.querySelector('#uad-avisos .uad-horas')`);
await click('#uad-avisos [data-h="9"]');
ok(await waitFor(`!!document.getElementById('hoja-uad-instalar')`), 'iPhone in Safari: tapping a time shows the steps to add the app');
ok(/Uno al día/.test(await text('#hoja-uad-instalar')) && /elige la hora otra vez/.test(await text('#hoja-uad-instalar')), 'and step 3 leads to Uno al día and to choosing the time (the "Activar avisos" button doesn\'t exist here)');
await b.shot('sheet-install');
await as(UA.whatsapp);
await b.go(`${SITE}/today/`, 1800);
await waitFor(`!!document.querySelector('#uad-avisos .uad-horas')`);
await click('#uad-avisos [data-h="9"]');
ok(await waitFor(`!!document.getElementById('hoja-uad-otra-app')`), 'inside WhatsApp: it asks to open the link in Safari');
ok(/elige la hora otra vez/.test(await text('#hoja-uad-otra-app')) && !/Activar avisos/.test(await text('#hoja-uad-otra-app')), 'and says the time is chosen again there');
await b.shot('sheet-other-app');

await b.close?.();
console.log(`Screenshots in ${OUT}`);

// Los avisos de Uno al día (D-230), de punta a punta con un servicio de avisos falso y el almacén
// de prueba: la segunda vez que se termina, la tarjeta ofrece la hora; elegirla suscribe el celular y
// guarda lo que pidió (pushDia); la campana de /today/ muestra la hora, cambia los interruptores y la
// hora, y silencia; un iPhone sin la app instalada ve los pasos para agregarla, dentro de WhatsApp se
// pide abrir en Safari, y con los avisos bloqueados se explica cómo desbloquearlos. El reloj se fija
// en el 6 de octubre de 2026, el día n.° 1, cuando toca Desenredo.
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, sleep } from './cdp.mjs';
import { juegoDel } from '../../public/assets/js/uno-al-dia.js';

const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2] || mkdtempSync(join(tmpdir(), 'uno-al-dia-avisos-'));
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const DB = 'juegos-de-salon:prueba:records-db';
if (juegoDel('2026-10-06') !== 'desenredo') { console.log('✗ el 2026-10-06 ya no toca Desenredo: cambia la fecha del guion'); process.exit(1); }

const b = await launch({ port: 9523, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const texto = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const esperar = async (cond, tope = 40) => { for (let i = 0; i < tope && !await ev(cond); i++) await sleep(250); return ev(cond); };
const pushDia = () => ev(`(()=>{const d=JSON.parse(localStorage.getItem('${DB}')||'{}');const k=Object.keys(d.pushDia||{})[0];return k?{k,...d.pushDia[k],sub:!!d.push?.[k]}:null})()`);

const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  whatsapp: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24',
};
const como = ua => b.send('Emulation.setUserAgentOverride', { userAgent: ua });

// El reloj, el servicio de avisos falso (como en cup/avisos.mjs) y, en un iPhone en Safari, sin avisos
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
const permiso = setting => b.send('Browser.setPermission', { permission: { name: 'notifications' }, setting, origin: SITIO });

/* ---------- Android: la segunda vez que termina, la oferta ---------- */
await como(UA.android);
await permiso('granted');
await b.go(`${SITIO}/`, 600);
await ev(`(()=>{localStorage.clear();localStorage.setItem('juegos-de-salon:instalar:no','1');
  localStorage.setItem('juegos-de-salon:uno-al-dia', JSON.stringify({dias:{'2026-10-05':{j:'reinas',s:70,ms:1,at:1,n:1}}}));return 1})()`);
await b.go(`${SITIO}/untangle/?today&test&timer=3`, 1200);
await esperar(`!!document.getElementById('btn-empezar')`);
await click('#btn-empezar');
await esperar(`!!document.getElementById('btn-fin')`, 80);
await click('#btn-fin');
ok(await esperar(`!!document.getElementById('uad-oferta')`, 30), 'la segunda vez que termina, la tarjeta ofrece los avisos');
ok(/¿Te avisamos cada día para jugar\?/.test(await texto('#uad-oferta')), `"${(await texto('#uad-oferta')).split('\n')[0]}"`);
const horas = await ev(`[...document.querySelectorAll('#uad-oferta .uad-horas button')].map(b=>b.textContent).join(' / ')`);
ok(horas === 'Mañana · 9:00 / Almuerzo · 13:00 / Tarde · 19:00', `con tres horas (${horas})`);
await b.shot('oferta');
await click('#uad-oferta [data-h="13"]');
ok(await esperar(`/Te avisaremos cada día a las 13:00/.test(document.getElementById('uad-oferta')?.innerText||'')`, 30), 'elegir 13:00 los activa y lo dice');
let q = await pushDia();
ok(q?.h === 13 && q.d && q.r && q.w && q.sub, `guarda la suscripción y lo que pidió (${JSON.stringify(q)})`);
ok(q?.c === 2 && q.sp === 's2026-41' && q.sn === 2, 'y su racha y su semana (el 5 y el 6, los dos de la misma semana), para el texto del aviso');

/* ---------- La campana de /today/ ---------- */
await b.go(`${SITIO}/today/`, 2000);
ok(await esperar(`document.getElementById('btn-uad-avisos')?.dataset.estado === 'activo'`), '/today/: la campana dice que están activos');
ok(/13:00/.test(await texto('#btn-uad-avisos')), `con la hora (${await texto('#btn-uad-avisos')})`);
await click('#btn-uad-avisos');
ok(await esperar(`!!document.getElementById('hoja-uad-ajustes')`), 'tocarla abre la hoja de los avisos');
await b.shot('hoja-ajustes');
await click('#uad-av-racha');
await esperar(`JSON.parse(localStorage.getItem('${DB}')).pushDia && Object.values(JSON.parse(localStorage.getItem('${DB}')).pushDia)[0].r === false`);
ok((await pushDia())?.r === false, 'apagar "Se corta la racha" queda guardado');
await click('#hoja-uad-ajustes [data-h="19"]');
await esperar(`Object.values(JSON.parse(localStorage.getItem('${DB}')).pushDia||{})[0]?.h === 19`);
ok((await pushDia())?.h === 19, 'cambiar la hora a las 19:00 queda guardado');
await click('#btn-uad-silenciar');
ok(await esperar(`!Object.keys(JSON.parse(localStorage.getItem('${DB}')).pushDia||{}).length`), 'Silenciar los apaga en la base');
ok(await esperar(`/no te llegan más avisos/.test(document.body.innerText)`), 'y lo dice');
ok(await ev(`!!document.querySelector('#uad-avisos .uad-horas')`), 'y la campana vuelve a ofrecer la hora');
ok(!await ev(`!!document.getElementById('btn-uad-calendario')`) && !/calendario/i.test(await texto('#uad-avisos')), 'el recordatorio es el aviso diario: no hay recordatorio en el calendario');

/* ---------- Bloqueados ---------- */
await permiso('denied');
await b.go(`${SITIO}/today/`, 1800);
ok(await esperar(`document.getElementById('btn-uad-avisos')?.dataset.estado === 'bloqueado'`), 'con el permiso negado, la campana dice "Avisos bloqueados"');
await click('#btn-uad-avisos');
ok(await esperar(`!!document.getElementById('hoja-uad-bloqueados')`), 'y explica cómo desbloquearlos');

/* ---------- iPhone en Safari y dentro de WhatsApp ---------- */
await permiso('prompt');
await como(UA.iphone);
await b.go(`${SITIO}/today/`, 1800);
await esperar(`!!document.querySelector('#uad-avisos .uad-horas')`);
await click('#uad-avisos [data-h="9"]');
ok(await esperar(`!!document.getElementById('hoja-uad-instalar')`), 'iPhone en Safari: tocar una hora muestra los pasos para agregar la app');
ok(/Uno al día/.test(await texto('#hoja-uad-instalar')) && /elige la hora otra vez/.test(await texto('#hoja-uad-instalar')), 'y el paso 3 lleva a Uno al día y a elegir la hora (el botón "Activar avisos" no existe aquí)');
await b.shot('hoja-instalar');
await como(UA.whatsapp);
await b.go(`${SITIO}/today/`, 1800);
await esperar(`!!document.querySelector('#uad-avisos .uad-horas')`);
await click('#uad-avisos [data-h="9"]');
ok(await esperar(`!!document.getElementById('hoja-uad-otra-app')`), 'dentro de WhatsApp: pide abrir el link en Safari');
ok(/elige la hora otra vez/.test(await texto('#hoja-uad-otra-app')) && !/Activar avisos/.test(await texto('#hoja-uad-otra-app')), 'y dice que ahí se elige la hora otra vez');
await b.shot('hoja-otra-app');

await b.close?.();
console.log(`Capturas en ${OUT}`);

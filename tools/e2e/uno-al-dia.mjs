// Uno al día (D-230), de punta a punta: el botón de la portada, el dado que cae en el juego de hoy,
// la línea de la intro, la tarjeta del resultado (racha, compartir sin decir el juego, jugar otro),
// el segundo intento como práctica, el botón "Listo" y la página /today/ con su racha, su
// calendario y cómo le va en cada juego, a 320 px y en los cuatro idiomas. El reloj de la página se
// fija en el 6 de octubre de 2026 a mediodía, el día n.° 1, cuando toca Desenredo. En el sitio local
// Uno al día sale sin pasar por /labs/.
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, sleep } from './cdp.mjs';
import { COMMON, IDIOMAS } from '../../public/assets/js/i18n.js';
import { juegoDel, KEY } from '../../public/assets/js/uno-al-dia.js';

const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2] || mkdtempSync(join(tmpdir(), 'uno-al-dia-'));
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const HOY = '2026-10-06';
if (juegoDel(HOY) !== 'desenredo') { console.log(`✗ el ${HOY} ya no toca Desenredo (toca ${juegoDel(HOY)}): cambia la fecha del guion`); process.exit(1); }

const b = await launch({ port: 9512, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const texto = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const memoria = () => ev(`JSON.parse(localStorage.getItem('${KEY}')||'{"dias":{}}')`);
const esperar = async (cond, tope = 40) => { for (let i = 0; i < tope && !await ev(cond); i++) await sleep(250); return ev(cond); };
const sinDesborde = () => ev(`document.documentElement.scrollWidth <= innerWidth + 1`);

// El reloj de todas las páginas: el 6 de octubre de 2026 a las 12:00, y corre desde ahí
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{const D=Date,dif=new D(2026,9,6,12,0,0).getTime()-D.now();
  class F extends D{constructor(...a){a.length?super(...a):super(D.now()+dif)} static now(){return D.now()+dif}}
  window.Date=F;window.__compartido=[];navigator.share=async d=>{window.__compartido.push(d)};navigator.canShare=()=>true;})()` });

/* ---------- La portada ---------- */
await b.go(`${SITIO}/`, 600);
await ev(`(()=>{localStorage.clear();localStorage.setItem('juegos-de-salon:instalar:no','1');return 1})()`);
await b.go(`${SITIO}/`, 1500);
ok(await esperar(`!!document.getElementById('btn-uno-al-dia')`), 'la portada tiene la tarjeta de Uno al día');
ok(await ev(`document.getElementById('btn-uno-al-dia').parentElement.querySelector('.game-card.torneo') !== null`), 'va en la misma fila que La Copa, mitad y mitad (D-239)');
ok(/Jugar el de hoy/.test(await texto('#btn-uno-al-dia .uad-card-estado')), `dice "Jugar el de hoy", sin racha todavía (${await texto('#btn-uno-al-dia .uad-card-estado')})`);
ok((await texto('.azar-slot .btn-azar')).replace(/\s+/g, ' ').trim() === '🎲 Juego al azar', `y el dado sigue diciendo "🎲 Juego al azar" (${await texto('.azar-slot .btn-azar')})`);
ok(await ev(`(()=>{const s=[...document.querySelectorAll('.game-card.torneo .meta > span')];return s.length===2&&s[0].getBoundingClientRect().top===s[1].getBoundingClientRect().top})()`), 'jugadores y duración de La Copa, en una línea');
ok(/abrir el juego de hoy/.test(await ev(`document.getElementById('btn-uno-al-dia').getAttribute('aria-label')`)), 'lo que hace va en aria-label');
ok(await ev(`!!document.querySelector('#btn-uno-al-dia .btn-uad-punto')`), 'y un punto brilla: hoy no se ha jugado');
ok(await sinDesborde(), 'la portada no se sale de lado');
await b.shot('portada');

/* ---------- El dado ---------- */
await click('#btn-uno-al-dia');
ok(await esperar(`!!document.querySelector('.azar-capa')`, 12), 'tocarlo tira el dado');
ok(await esperar(`/Hoy te toca/.test(document.querySelector('.azar-nombre')?.innerText||'')`, 16), `el dado dice el número y el juego (${(await texto('.azar-nombre')).replace(/\n/g, ' ')})`);
ok(/n\.° 1/.test(await texto('.azar-nombre')) && /Desenredo/.test(await texto('.azar-nombre')), 'Uno al día n.° 1, Desenredo');
await b.shot('dado');
ok(await esperar(`location.pathname === '/untangle/' && location.search === '?hoy'`, 20), `y abre el juego de hoy (${await ev('location.pathname + location.search')})`);
ok(await esperar(`!!document.getElementById('uad-intro')`), 'la intro lleva la línea de Uno al día');
ok(/hoy todos juegan el mismo desafío/.test(await texto('#uad-intro')), `"${await texto('#uad-intro')}"`);

/* ---------- Un link de otro juego lleva al de hoy ---------- */
await b.go(`${SITIO}/queens/?hoy`, 1500);
ok(await esperar(`location.pathname === '/untangle/'`), 'un link de Uno al día de otro juego se va al de hoy');

/* ---------- Jugar el de hoy (el reloj de Desenredo, acortado, se acaba) ---------- */
const jugar = async () => {
  await b.go(`${SITIO}/untangle/?hoy&prueba&zipSeg=3`, 1200);
  await esperar(`!!document.getElementById('btn-empezar')`);
  ok(await ev(`__copa.estado.juego?.semilla`) === await ev(`(async()=>{const m=await import('/assets/js/uno-al-dia.js');return m.semillaDel('${HOY}')})()`), 'el contenido sale de la semilla del día');
  await click('#btn-empezar');
  await esperar(`!!document.getElementById('btn-fin') || document.querySelector('.screen.active')?.id === 'screen-resultado'`, 80);
  await click('#btn-fin');
  return esperar(`!!document.getElementById('uad-tarjeta')`, 20);
};
ok(await jugar(), 'al terminar, el resultado trae la tarjeta de Uno al día');
const tarjeta = await texto('#uad-tarjeta');
ok(/Racha: 1 día/.test(tarjeta) && /día 2/.test(tarjeta) && /Hoy: \d+ puntos/.test(tarjeta), `la tarjeta: racha, vuelve mañana y el puntaje (${tarjeta.replace(/\n/g, ' / ')})`);
ok(!await ev(`!!document.getElementById('btn-otra')`) && !await ev(`!!document.getElementById('btn-compartir-resultado')`), 'sin "Jugar otra vez" ni el compartir de siempre');
ok(!await ev(`!!document.querySelector('.rk-ranking[data-tabla="desenredo"]')`), 'ni el ranking del juego: el que se ve es el de Uno al día');
let m = await memoria();
ok(m.dias[HOY]?.j === 'desenredo' && m.dias[HOY].n === 1, `queda anotado en el celular (${JSON.stringify(m.dias[HOY])})`);
await b.shot('resultado');

// Compartir: ni el texto ni la imagen dicen el juego (#215)
await click('#btn-compartir-uad');
await esperar(`window.__compartido.length > 0`, 20);
const comp = await ev(`JSON.stringify(window.__compartido[0] ? {text: window.__compartido[0].text, files: (window.__compartido[0].files||[]).length} : null)`).then(JSON.parse);
ok(comp && /Uno al día n\.° 1/.test(comp.text) && /Racha: 1 día/.test(comp.text) && /juegosdesalon\.cl\/today\//.test(comp.text), `se comparte la cabecera, la racha y el link (${comp?.text?.replace(/\n/g, ' / ')})`);
ok(comp && !/Desenredo|🧶/.test(comp.text), 'el texto no dice qué juego tocó');
ok(comp?.files === 1, 'y va con la imagen');

/* ---------- El segundo intento es práctica ---------- */
const s1 = m.dias[HOY].s;
await jugar();
ok(/práctica/.test(await texto('#uad-tarjeta')), 'el segundo intento dice que fue práctica');
m = await memoria();
ok(m.dias[HOY].n === 2 && m.dias[HOY].s === s1, 'y el resultado del día queda el del primero');
await b.go(`${SITIO}/untangle/?hoy`, 1200);
ok(/práctica/.test(await texto('#uad-intro')), 'la intro de un segundo intento avisa que es práctica');

/* ---------- La portada después de jugar ---------- */
await b.go(`${SITIO}/`, 1500);
await esperar(`!!document.getElementById('btn-uno-al-dia')`);
ok(await ev(`document.getElementById('btn-uno-al-dia').classList.contains('hecho')`) && /✅/.test(await texto('#btn-uno-al-dia')) && /🔥 1/.test(await texto('#btn-uno-al-dia')), `el botón queda cian, con ✅ y la racha (${(await texto('#btn-uno-al-dia')).replace(/\n/g, ' ')})`);
ok(/Racha: 1 día/.test(await ev(`document.getElementById('btn-uno-al-dia').getAttribute('aria-label')`)), 'y la racha también en aria-label');
ok(!await ev(`!!document.querySelector('#btn-uno-al-dia .btn-uad-punto')`), 'y ya no brilla el punto');
await click('#btn-uno-al-dia');
ok(await esperar(`location.pathname === '/today/'`, 12), 'tocarlo abre /today/ (sin dado)');

/* ---------- /today/ ---------- */
await esperar(`!!document.getElementById('uad-hoy')`);
ok(/Desenredo/.test(await texto('#uad-hoy')) && /El próximo sale en 1[12]\sh/.test(await texto('#uad-hoy')), `hoy: el juego, el puntaje y cuánto falta (${(await texto('#uad-hoy')).replace(/\n/g, ' / ')})`);
ok(/🔥 1/.test(await texto('#uad-trio')), 'la racha');
ok(await ev(`[...document.querySelectorAll('.uad-bloque h2')].some(h => h.textContent === 'Calendario')`), 'el calendario del mes se titula "Calendario"');
ok(await ev(`document.querySelectorAll('#uad-cal span.hoy').length`) === 1 && /🧶/.test(await texto('#uad-cal span.hoy')), 'el calendario marca hoy con el emoji del juego');
ok(await ev(`!!document.querySelector('#uad-por-juego [data-id="desenredo"]')`), 'y Desenredo en "Por juego"');

// Con historia: una racha larga, días de otros meses y una tendencia
await ev(`(()=>{const d=JSON.parse(localStorage.getItem('${KEY}'));
  const f=n=>{const x=new Date(2026,9,6-n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
  const reinas=[50,55,60,62,65,80,85,90];
  for(let n=1;n<=8;n++)d.dias[f(n)]={j:'reinas',s:reinas[8-n],ms:60000,at:1,n:1};
  for(let n=12;n<=14;n++)d.dias[f(n)]={j:'anio',s:40,ms:1,at:1,n:1};
  localStorage.setItem('${KEY}',JSON.stringify(d));return 1})()`);
await b.go(`${SITIO}/today/`, 1500);
ok(/🔥 9/.test(await texto('#uad-trio')) && /\b9\b/.test(await texto('#uad-trio')), `racha de 9 y mejor racha de 9 (${(await texto('#uad-trio')).replace(/\n/g, ' ')})`);
ok(/En Reinas vas mejorando/.test(await texto('#uad-tendencia')), `la tendencia en palabras (${await texto('#uad-tendencia')})`);
await ev(`document.querySelector('#uad-cal').previousElementSibling.firstElementChild.click(); 1`); await sleep(300);
ok(/septiembre/i.test(await texto('.uad-cal-cab')) && /👑/.test(await texto('#uad-cal')), 'el mes anterior muestra los días de septiembre');
await b.shot('today');

/* ---------- La forma de antes, a prueba desde /labs/: el botón al lado del dado ---------- */
await b.go(`${SITIO}/labs/`, 1500);
ok(await esperar(`!!document.querySelector('#uad-formas [data-forma="boton"]')`), 'el laboratorio deja elegir dónde va en la portada');
ok(await ev(`document.querySelector('#uad-formas [data-forma="tarjeta"]').getAttribute('aria-pressed')`) === 'true', 'por defecto, junto a La Copa');
await click('#uad-formas [data-forma="boton"]');
await b.go(`${SITIO}/`, 1500);
await esperar(`!!document.getElementById('btn-uno-al-dia')`);
ok(await ev(`!!document.querySelector('.azar-slot #btn-uno-al-dia') && !document.querySelector('.fila-alta')`), 'con "Al lado del dado", es un botón en la fila de Juego al azar');
ok((await texto('.azar-slot .btn-azar')).replace(/\s+/g, ' ').trim() === '🎲 Al azar' && await sinDesborde(), 'y el dado se acorta a "🎲 Al azar"');
await b.shot('portada-boton');
await b.go(`${SITIO}/labs/`, 1200);
await click('#uad-formas [data-forma="tarjeta"]');

/* ---------- 320 px y los cuatro idiomas ---------- */
await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
for (const lang of IDIOMAS) {
  const U = COMMON[lang].uad;
  await b.go(`${SITIO}/?lang=${lang}`, 1500);
  await esperar(`!!document.getElementById('btn-uno-al-dia')`);
  const r = await ev(`JSON.stringify((()=>{const e=document.getElementById('btn-uno-al-dia').getBoundingClientRect();return [e.left,e.right]})())`).then(JSON.parse);
  ok(r[0] >= 0 && r[1] <= 320 && await sinDesborde(), `${lang}: la tarjeta de la portada cabe a 320 px (${r.map(Math.round)})`);
  const m = await ev(`JSON.stringify((()=>{const c=document.querySelector('.game-card.torneo').getBoundingClientRect(),s=[...document.querySelectorAll('.game-card.torneo .meta > span')].map(x=>x.getBoundingClientRect());return [s.length,s[0].top===s[1].top,Math.max(...s.map(x=>x.right))<=c.right]})())`).then(JSON.parse);
  ok(m[0] === 2 && m[1] && m[2], `${lang}: en La Copa, jugadores y duración en una línea y adentro (${m})`);
  ok((await ev(`document.querySelector('#btn-uno-al-dia h2').textContent`)).includes(U.nombre), `${lang}: se llama "${U.nombre}"`);
  await b.go(`${SITIO}/today/?lang=${lang}`, 1500);
  ok(await sinDesborde(), `${lang}: /today/ no se sale a lo ancho`);
  ok(!/undefined|NaN|\{\w+\}/.test(await ev('document.body.innerText')), `${lang}: /today/ sin textos a medio armar`);
  await b.shot(`today-320-${lang}`);
}

await b.close?.();
console.log(`Capturas en ${OUT}`);

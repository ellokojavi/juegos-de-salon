// Uno al día (D-230), end to end: the home page button, the die that lands on today's game, the
// intro line, the result card (streak, sharing without naming the game, play another), the second
// attempt as practice, the "Listo" button and the /today/ page with its streak, its calendar and
// how each game is going, at 320 px and in the four languages. The page clock is fixed at noon on
// October 6, 2026, day no. 1, when Desenredo is due.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { COMMON, IDIOMAS } from '../../public/assets/js/i18n.js';
import { juegoDel as gameOf, KEY } from '../../public/assets/js/uno-al-dia.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const TODAY = '2026-10-06';
if (gameOf(TODAY) !== 'desenredo') { console.log(`✗ ${TODAY} no longer gets Desenredo (it gets ${gameOf(TODAY)}): change the script's date`); process.exit(1); }

const b = await launch({ port: 9512, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const memory = () => ev(`JSON.parse(localStorage.getItem('${KEY}')||'{"dias":{}}')`);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };
const noOverflow = () => ev(`document.documentElement.scrollWidth <= innerWidth + 1`);

// The clock of every page: October 6, 2026 at 12:00, and it runs from there
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{const D=Date,dif=new D(2026,9,6,12,0,0).getTime()-D.now();
  class F extends D{constructor(...a){a.length?super(...a):super(D.now()+dif)} static now(){return D.now()+dif}}
  window.Date=F;window.__compartido=[];navigator.share=async d=>{window.__compartido.push(d)};navigator.canShare=()=>true;})()` });

/* ---------- The home page ---------- */
await b.go(`${SITE}/`, 600);
await ev(`(()=>{localStorage.clear();localStorage.setItem('juegos-de-salon:instalar:no','1');return 1})()`);
await b.go(`${SITE}/`, 1500);
ok(await waitFor(`!!document.getElementById('btn-uno-al-dia')`), 'the home page has the Uno al día card');
await waitFor(`!!document.getElementById('btn-uad-chip')`, 4); // with the lab key (localhost), the two-destination card replaces it
ok(await ev(`document.getElementById('btn-uno-al-dia').parentElement.querySelector('.game-card.torneo') !== null`), 'it goes in the same row as La Copa, half and half (D-239)');
ok(/Jugar hoy/.test(await text('#btn-uno-al-dia .meta')), `it says "Jugar hoy", no streak yet (${await text('#btn-uno-al-dia .meta')})`);
// Two destinations (lab, D-414; localhost has the lab key): the card opens /today/, its chip plays
ok(await ev(`!!document.querySelector('#btn-uno-al-dia > a.uad-card-link[href$="today/"]') && document.querySelector('#btn-uad-chip')?.tagName === 'BUTTON' && !document.querySelector('a #btn-uad-chip, button #btn-uad-chip')`), 'the card is a link to /today/ and «▶ Jugar hoy» a separate button beside it');
ok(await ev(`document.getElementById('btn-uad-chip').getBoundingClientRect().height >= 44`), 'the chip is a 44 px target');
ok((await text('.azar-slot .btn-azar')).replace(/\s+/g, ' ').trim() === '🎲 Juego al azar', `and the die still says "🎲 Juego al azar" (${await text('.azar-slot .btn-azar')})`);
ok(await ev(`(()=>{const s=[...document.querySelectorAll('.game-card.torneo .meta > span')];return s.length===2&&s[0].getBoundingClientRect().top===s[1].getBoundingClientRect().top})()`), "La Copa's players and duration, on one line");
ok(/tus puntos y el juego de hoy/.test(await ev(`(document.querySelector('#btn-uno-al-dia .uad-card-link') || document.getElementById('btn-uno-al-dia')).getAttribute('aria-label')`)), 'what it does goes in aria-label');
ok(await ev(`!!document.querySelector('#btn-uno-al-dia .btn-uad-punto')`), "and a dot shines: today hasn't been played");
ok(await noOverflow(), "the home page doesn't overflow sideways");
await b.shot('home');

/* ---------- The chip plays today's game straight away (lab, D-414) ---------- */
await click('#btn-uad-chip');
ok(await waitFor(`!!document.querySelector('.azar-capa')`, 12) && await waitFor(`location.pathname === '/untangle/' && location.search === '?today'`, 20), `«▶ Jugar hoy» rolls today's die and opens the game (${await ev('location.pathname + location.search')})`);
await b.go(`${SITE}/`, 1500);
await waitFor(`!!document.getElementById('btn-uad-chip')`);

/* ---------- The card opens Uno al día; its Jugar rolls the die (D-414) ---------- */
await ev(`document.getElementById('btn-uad-abrir').click(); 1`);
ok(await waitFor(`location.pathname === '/today/' && !!document.getElementById('btn-uad-jugar')`, 12), 'tapping it opens /today/, with the season and a Jugar button');
ok(/Temporada de octubre/.test(await text('#uad-puntos')) && /quedan 26 días/.test(await text('#uad-puntos')), `the season box says the month and the days left (${(await text('#uad-puntos')).replace(/\n/g, ' · ')})`);
await b.shot('today-before');
await click('#btn-uad-jugar');
ok(await waitFor(`!!document.querySelector('.azar-capa')`, 12), 'Jugar rolls the die');
ok(await waitFor(`/Hoy te toca/.test(document.querySelector('.azar-nombre')?.innerText||'')`, 16), `the die says the number and the game (${(await text('.azar-nombre')).replace(/\n/g, ' ')})`);
ok(/n\.° 1/.test(await text('.azar-nombre')) && /Desenredo/.test(await text('.azar-nombre')), 'Uno al día no. 1, Desenredo');
await b.shot('die');
ok(await waitFor(`location.pathname === '/untangle/' && location.search === '?today'`, 20), `and it opens today's game (${await ev('location.pathname + location.search')})`);
ok(await waitFor(`!!document.getElementById('uad-intro')`), 'the intro carries the Uno al día line');
ok(/hoy todos juegan el mismo desafío/.test(await text('#uad-intro')), `"${await text('#uad-intro')}"`);

/* ---------- A link to another game leads to today's ---------- */
await b.go(`${SITE}/queens/?today`, 1500);
ok(await waitFor(`location.pathname === '/untangle/'`), "a Uno al día link to another game goes to today's");

/* ---------- Playing today (Desenredo's clock, shortened, runs out) ---------- */
const play = async () => {
  await b.go(`${SITE}/untangle/?today&test&timer=3`, 1200);
  await waitFor(`!!document.getElementById('btn-empezar')`);
  ok(await ev(`__copa.estado.juego?.semilla`) === await ev(`(async()=>{const m=await import('/assets/js/uno-al-dia.js');return m.semillaDel('${TODAY}')})()`), "the content comes from the day's seed");
  await click('#btn-empezar');
  await waitFor(`!!document.getElementById('btn-fin') || document.querySelector('.screen.active')?.id === 'screen-resultado'`, 80);
  await click('#btn-fin');
  return waitFor(`!!document.getElementById('uad-tarjeta')`, 20);
};
ok(await play(), 'at the end, the result carries the Uno al día card');
const card = await text('#uad-tarjeta');
ok(/Racha: 1 día/.test(card) && /día 2/.test(card) && !/Hoy: \d+ puntos/.test(card), `the card: streak and come back tomorrow, without repeating the score (C-19) (${card.replace(/\n/g, ' / ')})`);
ok(!await ev(`!!document.getElementById('btn-otra')`) && !await ev(`!!document.getElementById('btn-compartir-resultado')`), 'without "Jugar otra vez" or the usual share');
await sleep(1500);   // the Sign in offer arrives with the network, above the buttons
for (const id of ['btn-compartir-uad', 'btn-uad-otro', 'btn-fin-hoy']) {
  const bottom = await ev(`Math.round(document.getElementById('${id}')?.getBoundingClientRect().bottom ?? 9999)`);
  ok(bottom <= 812, `#${id} shows without scrolling on an 812 px phone (C-8, C-19): bottom at ${bottom}`);
}
ok(!await ev(`!!document.getElementById('btn-fin-menu')`), 'no second way to the menu: the header has it (C-19)');
ok(!await ev(`!!document.querySelector('.rk-ranking[data-tabla="desenredo"]')`), "nor the game's ranking: the one shown is Uno al día's");
let m = await memory();
ok(m.dias[TODAY]?.j === 'desenredo' && m.dias[TODAY].n === 1, `it stays recorded on the phone (${JSON.stringify(m.dias[TODAY])})`);
await b.shot('result');

// Sharing: neither the text nor the image names the game (#215)
await click('#btn-compartir-uad');
await waitFor(`window.__compartido.length > 0`, 20);
const shared = await ev(`JSON.stringify(window.__compartido[0] ? {text: window.__compartido[0].text, files: (window.__compartido[0].files||[]).length} : null)`).then(JSON.parse);
ok(shared && /Uno al día n\.° 1/.test(shared.text) && /Racha: 1 día/.test(shared.text) && /juegosdesalon\.cl\/today\//.test(shared.text), `the header, the streak and the link are shared (${shared?.text?.replace(/\n/g, ' / ')})`);
ok(shared && !/Desenredo|🧶/.test(shared.text), "the text doesn't say which game came up");
ok(shared?.files === 1, 'and it goes with the image');

/* ---------- The second attempt is practice ---------- */
const s1 = m.dias[TODAY].s;
await play();
ok(/práctica/.test(await text('#uad-tarjeta')), 'the second attempt says it was practice');
m = await memory();
ok(m.dias[TODAY].n === 2 && m.dias[TODAY].s === s1, "and the day's result stays the first one's");
await b.go(`${SITE}/untangle/?today`, 1200);
ok(/práctica/.test(await text('#uad-intro')), "a second attempt's intro warns it is practice");

/* ---------- The home page after playing ---------- */
await b.go(`${SITE}/`, 1500);
await waitFor(`!!document.getElementById('btn-uno-al-dia')`);
ok(await ev(`document.getElementById('btn-uno-al-dia').classList.contains('hecho')`) && /\d+\s*pts/.test(await text('#btn-uno-al-dia')) && /🔥 1/.test(await text('#btn-uno-al-dia')), `the button turns cyan, with the points and the streak (${(await text('#btn-uno-al-dia')).replace(/\n/g, ' ')})`);
ok(/Racha: 1 día/.test(await ev(`(document.querySelector('#btn-uno-al-dia .uad-card-link') || document.getElementById('btn-uno-al-dia')).getAttribute('aria-label')`)), 'and the streak in aria-label too');
ok(!await ev(`!!document.querySelector('#btn-uno-al-dia .btn-uad-punto')`), 'and the dot no longer shines');
ok(/\d+\s*pts/.test(await text('#btn-uad-chip')) && /today\/$/.test(await ev(`document.getElementById('btn-uad-chip').getAttribute('href') || ''`)), 'played, the chip shows the points of the month and opens /today/');
await click('#btn-uad-abrir, button#btn-uno-al-dia');
ok(await waitFor(`location.pathname === '/today/'`, 12), 'tapping it opens /today/ (no die)');

/* ---------- /today/ ---------- */
await waitFor(`!!document.getElementById('uad-hoy')`);
ok(/🧶 Desenredo: \d+ puntos/.test(await text('#uad-hoy')) && /Próximo juego en 1[12]\sh/.test(await text('#uad-hoy')), `today: the game, the score and how long is left (${(await text('#uad-hoy')).replace(/\n/g, ' / ')})`);
// The streak is drawn after "Hoy" (in CI sometimes an instant later): wait for it
ok(await waitFor(`/🔥 1/.test(document.getElementById('uad-trio')?.textContent || '')`, 20), `the streak (${await text('#uad-trio')})`);
ok(await ev(`[...document.querySelectorAll('.uad-bloque h2')].some(h => h.textContent === 'Calendario')`), 'the month calendar is titled "Calendario"');
ok(await ev(`document.querySelectorAll('#uad-cal .hoy').length`) === 1 && /🧶/.test(await text('#uad-cal .hoy')), "the calendar marks today with the game's emoji");
ok(/^\d+$/.test(await text('#uad-cal .hoy .cal-pts')), `and the points it added in a pill: the game plus the streak bonus (${await text('#uad-cal .hoy .cal-pts')})`);
ok(/Hoy sumaste \d+ pts/.test(await text('#uad-puntos')), `the season box says what today added (${(await text('#uad-puntos')).replace(/\n/g, ' · ')})`);
ok(!await ev(`!!document.getElementById('uad-por-juego')`), 'no "Por juego" block (owner\'s request)');
ok(!await ev(`!!document.getElementById('btn-compartir-uad')`), 'nor «Compartir mi resultado» on /today/ (owner\'s request)');

// With history: a long streak, days from other months and a trend
await ev(`(()=>{const d=JSON.parse(localStorage.getItem('${KEY}'));
  const f=n=>{const x=new Date(2026,9,6-n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
  const queens=[50,55,60,62,65,80,85,100];
  for(let n=1;n<=8;n++)d.dias[f(n)]={j:'reinas',s:queens[8-n],ms:60000,at:1,n:1};
  for(let n=12;n<=14;n++)d.dias[f(n)]={j:'anio',s:40,ms:1,at:1,n:1};
  localStorage.setItem('${KEY}',JSON.stringify(d));return 1})()`);
await b.go(`${SITE}/today/`, 1500);
ok(/🔥 9/.test(await text('#uad-trio')) && /\b9\b/.test(await text('#uad-trio')), `streak of 9 and best streak of 9 (${(await text('#uad-trio')).replace(/\n/g, ' ')})`);
await ev(`document.querySelector('#uad-cal').previousElementSibling.firstElementChild.click(); 1`); await sleep(300);
ok(/septiembre/i.test(await text('.uad-cal-cab')) && /👑/.test(await text('#uad-cal')), "the previous month shows September's days");
await b.shot('today');

/* ---------- The earlier form, with ?daily=button: the button next to the die ---------- */
await b.go(`${SITE}/?daily=button`, 1500);
await waitFor(`!!document.getElementById('btn-uno-al-dia')`);
ok(await ev(`!!document.querySelector('.azar-slot #btn-uno-al-dia') && !document.querySelector('.fila-alta')`), 'with "Al lado del dado", it is a button in the Juego al azar row');
ok((await text('.azar-slot .btn-azar')).replace(/\s+/g, ' ').trim() === '🎲 Al azar' && await noOverflow(), 'and the die shortens to "🎲 Al azar"');
await b.shot('home-button');

/* ---------- 320 px and the four languages ---------- */
await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
for (const lang of IDIOMAS) {
  const U = COMMON[lang].uad;
  await b.go(`${SITE}/?lang=${lang}`, 1500);
  await waitFor(`!!document.getElementById('btn-uno-al-dia')`);
  const r = await ev(`JSON.stringify((()=>{const e=document.getElementById('btn-uno-al-dia').getBoundingClientRect();return [e.left,e.right]})())`).then(JSON.parse);
  ok(r[0] >= 0 && r[1] <= 320 && await noOverflow(), `${lang}: the home page card fits at 320 px (${r.map(Math.round)})`);
  const m = await ev(`JSON.stringify((()=>{const c=document.querySelector('.game-card.torneo').getBoundingClientRect(),s=[...document.querySelectorAll('.game-card.torneo .meta > span')].map(x=>x.getBoundingClientRect());return [s.length,s[0].top===s[1].top,Math.max(...s.map(x=>x.right))<=c.right]})())`).then(JSON.parse);
  ok(m[0] === 2 && m[1] && m[2], `${lang}: in La Copa, players and duration on one line and inside (${m})`);
  ok((await ev(`document.querySelector('#btn-uno-al-dia h2').textContent`)).includes(U.nombre), `${lang}: it is called "${U.nombre}"`);
  await b.go(`${SITE}/today/?lang=${lang}`, 1500);
  ok(await noOverflow(), `${lang}: /today/ doesn't overflow sideways`);
  ok(!/undefined|NaN|\{\w+\}/.test(await ev('document.body.innerText')), `${lang}: /today/ without half-built texts`);
  await b.shot(`today-320-${lang}`);
  // The calendar, with three digits (yesterday, 100 + its bonus): each pill reads whole inside its day
  const cal = await ev(`JSON.stringify((()=>{document.getElementById('uad-cal').scrollIntoView({block:'center'});const p=[...document.querySelectorAll('#uad-cal .cal-pts')];return {n:p.length,hundred:p.some(x=>x.textContent.length>=3),inside:p.every(x=>{const a=x.getBoundingClientRect(),c=x.parentElement.getBoundingClientRect();return a.left>=c.left&&a.right<=c.right&&x.scrollWidth<=x.clientWidth+1})}})())`).then(JSON.parse);
  ok(cal.n >= 2 && cal.hundred && cal.inside, `${lang}: at 320 px, the calendar's score (three digits too) fits in its day (${JSON.stringify(cal)})`);
  await b.shot(`today-320-${lang}-calendar`);
}

await b.close?.();
console.log(`Screenshots in ${OUT}`);

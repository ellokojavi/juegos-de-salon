// Leaving a game midway (D-432, D-433), with the lab open as on localhost: a back swipe or «‹ Menú»
// asks «¿Salir de la partida?» and Seguir jugando stays; Uno al día's first attempt counts from its start,
// so a group game left halfway counts 0, a solo game left halfway goes on where it was (the home
// page's Uno al día goes straight to it, without the die), and a day
// that ended unfinished counts 0. The back swipe is `history.back()`: the phone's gesture does the
// same, and no automated Chrome can make the gesture itself (D-86).
import { output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { COMMON } from '../../public/assets/js/i18n.js';
import { LOCALES } from '../../public/cup/rules.js';
import { juegoDel, KEY, STARTED_KEY, LANZAMIENTO, sumarDias } from '../../public/assets/js/uno-al-dia.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const U = COMMON.es.uad, G = COMMON.es.backGuard;
// A day of El Ahorcado and a day of Reinas, the first after that one
const dayOf = (id, from = sumarDias(LANZAMIENTO, 20)) => { for (let i = 0; i < 400; i++) { const f = sumarDias(from, i); if (juegoDel(f) === id) return f; } return null; };
const HANGMAN = dayOf('ahorcado'), QUEENS = dayOf('reinas', sumarDias(HANGMAN, 1));
ok(HANGMAN && QUEENS, `El Ahorcado and Reinas come up in the deck (${HANGMAN}, ${QUEENS})`);

const b = await launch({ dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.disabled)return false;e.click();return true})()`);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const memory = () => ev(`JSON.parse(localStorage.getItem('${KEY}')||'{"dias":{}}')`);
const started = () => ev(`JSON.parse(localStorage.getItem('${STARTED_KEY}')||'null')`);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };

// The clock of every page: noon of the day saved in `__reloj`, and it runs from there
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{let f=null;try{f=localStorage.getItem('__reloj')}catch(_){}
  if(!f)return;const [y,m,d]=f.split('-').map(Number);const D=Date,dif=new D(y,m-1,d,12,0,0).getTime()-D.now();
  class F extends D{constructor(...a){a.length?super(...a):super(D.now()+dif)} static now(){return D.now()+dif}}
  window.Date=F;})()` });
await b.go(`${SITE}/`, 600);
await ev(`(()=>{localStorage.clear();localStorage.setItem('juegos-de-salon:instalar:no','1');return 1})()`);
const clock = f => ev(`localStorage.setItem('__reloj','${f}'); 1`);

/* ---------- A group game: the rule, the back swipe, and 0 for leaving ---------- */
await clock(HANGMAN);
await b.go(`${SITE}/hangman/?today`, 1500);
ok(await waitFor(`(document.getElementById('uad-intro')?.innerText||'').includes(${JSON.stringify(U.lockRule)})`), `the intro says the first attempt counts ("${await text('#uad-intro')}")`);
ok(await click('#btn-uad-jugar'), 'Jugar hoy starts the game');
ok(await waitFor(`!!localStorage.getItem('${STARTED_KEY}')`), 'starting leaves the marker on the phone');
ok((await started())?.fecha === HANGMAN && (await started())?.j === 'ahorcado', `for today's game (${JSON.stringify(await started())})`);
await sleep(600);
await ev(`history.back(); 1`);
ok(await waitFor(`!!document.getElementById('back-guard')`), 'a back swipe mid-game asks before leaving (D-432)');
ok((await text('#back-guard h2')) === G.title, `"${G.title}"`);
await b.shot('back-guard');
await click('#btn-back-guard-stay');
await sleep(400);
ok(await ev(`!document.getElementById('back-guard') && location.pathname === '/hangman/'`), 'Seguir jugando stays in the game');
await ev(`history.back(); 1`);
ok(await waitFor(`!!document.getElementById('back-guard')`), 'a second swipe asks again');
await click('#btn-back-guard-stay');
await sleep(300);
// «‹ Menú» is the same wish to leave: it asks the same
await click('#btn-menu');
ok(await waitFor(`!!document.getElementById('back-guard')`), '«‹ Menú» mid-game asks the same');
await click('#btn-back-guard-stay');
await sleep(400);
ok(await ev(`location.pathname === '/hangman/'`), 'and Seguir jugando stays');

// Leaving anyway (a reload, as closing the tab and coming back): it counts 0, and this one is practice
await b.go(`${SITE}/hangman/?today`, 1500);
ok(await waitFor(`(document.getElementById('uad-intro')?.innerText||'').includes(${JSON.stringify(U.lockLost)})`), `coming back says the attempt counts 0 ("${await text('#uad-intro')}")`);
const d = (await memory()).dias[HANGMAN];
ok(d?.s === 0 && d?.j === 'ahorcado' && d.ms >= 0, `the day is recorded with 0 (${JSON.stringify(d)})`);
ok(!await started(), 'and the marker is gone');

/* ---------- A solo game: it goes on where it was, and a day that ends unfinished counts 0 ---------- */
await clock(QUEENS);
await b.go(`${SITE}/queens/?today`, 1500);
ok(await waitFor(`!document.getElementById('btn-empezar')?.disabled && (document.getElementById('uad-intro')?.innerText||'').includes(${JSON.stringify(U.lockRule)})`), `Reinas: the intro says the first attempt counts ("${await text('#uad-intro')}")`);
ok(await click('#btn-empezar'), 'Empezar starts it');
ok(await waitFor(`!!localStorage.getItem('${STARTED_KEY}')`, 60), 'and leaves the marker');
await sleep(4500);   // the 3, 2, 1
await b.go(`${SITE}/queens/?today`, 1500);
ok(await waitFor(`(document.getElementById('uad-intro')?.innerText||'') === ${JSON.stringify(U.lockResume)}`), `coming back the same day goes on ("${await text('#uad-intro')}")`);
const label = await ev(`document.getElementById('btn-empezar')?.textContent || ''`);
ok(label.includes(LOCALES.es.resume), `the button says "${LOCALES.es.resume}" (${label})`);
ok(!(await memory()).dias[QUEENS], 'nothing recorded yet');
// From the home page, Uno al día goes straight to the game left halfway: no die
await b.go(`${SITE}/`, 1500);
ok(await waitFor(`(document.getElementById('btn-uad-chip')?.textContent||'').includes(${JSON.stringify(G.stay)})`), `the home page's button says "${G.stay}" (${await ev(`document.getElementById('btn-uad-chip')?.textContent`)})`);
await click('#btn-uad-chip');
ok(await waitFor(`location.pathname === '/queens/'`, 12), 'and goes straight to the game');
ok(!await ev(`!!document.querySelector('.azar-capa')`), 'without the die');
ok(await waitFor(`!document.getElementById('btn-empezar')?.disabled && (document.getElementById('btn-empezar')?.textContent||'').includes(${JSON.stringify(LOCALES.es.resume)})`), 'where it offers to keep playing');
await click('#btn-empezar');
ok(await waitFor(`document.querySelector('.screen.active')?.id === 'screen-jugar' && !document.getElementById('cuenta')`, 12), 'it goes on without the countdown');

// The day ends with it unfinished: tomorrow, it counts 0 for that day
await clock(sumarDias(QUEENS, 1));
await b.go(`${SITE}/today/`, 2000);
const q = (await memory()).dias[QUEENS];
ok(q?.s === 0 && q?.j === 'reinas', `the day that ended unfinished counts 0 (${JSON.stringify(q)})`);

await b.close();

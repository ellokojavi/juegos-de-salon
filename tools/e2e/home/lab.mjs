// The home page's experiments in the lab (D-361, D-363, D-369, D-372) end to end: the lab's three groups (the
// splash among the improvements, the home page experiments in La Bodega), /labs/home/ landing on the real home page
// with its bar, the filters sticking on scroll, the language, and no bar for players. Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/home-lab');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 320, height: 640 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const labels = `[...document.querySelectorAll('.game-card')].filter(c => c.querySelector('.popular')).map(c => c.dataset.id)`;

// The lab: games, improvements and La Bodega apart; the home page's experiments, the splash among them, one card (D-389)
await b.go(`${SITE}/labs/?test`);
ok(await ev(`!!document.querySelector('#mejoras #seccion-portada #btn-portada') && !document.querySelector('#bodega #seccion-portada')`), 'the home page experiments are among the improvements');
ok(await ev(`!document.getElementById('seccion-splash') && /Splash/.test(document.getElementById('seccion-portada').textContent)`), 'the splash is one of them, not a card of its own');
ok(await ev(`!!document.querySelector('#activos #seccion-agentes') && !document.querySelector('#activos #seccion-portada')`), 'the games being tried are apart from the improvements');

// /labs/home/ opens the real home page, without a frame (D-363), with the bar: ‹ Lab, a checkbox per
// experiment (D-389) and the language; the filters still stick when the page scrolls
await b.go(`${SITE}/labs/home/?test`);
ok(await waitFor(`location.pathname === '/' && new URLSearchParams(location.search).has('lab') && !!document.getElementById('barra')`), '/labs/home/ opens the home page itself with the experiments bar');
ok(await ev(`getComputedStyle(document.getElementById('barra')).position === 'fixed' && !!document.querySelector('#barra a[href$="/labs/"]')`), 'the bar floats and leads back to the lab');
ok(await ev(`!!document.querySelector('#barra [data-exp="search"]') && !!document.querySelector('#barra [data-exp^="splash:"]')`), 'a checkbox for 🔎 Buscar and one for the splash');
// It opens with the newest experiment on, first in the bar (D-399); untick it to start from none
ok(await ev(`(b => b[0].dataset.exp === 'search' && b[0].checked && b.slice(1).every(x => !x.checked))([...document.querySelectorAll('#barra input[type=checkbox]')]) && new URLSearchParams(location.search).has('search')`), 'it opens with the newest experiment, 🔎 Buscar, on and first');
await ev(`document.querySelector('#barra [data-exp="search"]').click(); 1`);
ok(await waitFor(`!new URLSearchParams(location.search).has('search') && !!document.getElementById('barra') && [...document.querySelectorAll('#barra input[type=checkbox]')].every(x => !x.checked)`), 'unticking it leaves none on');
// Several at once: Buscar, then the splash, both stay on
await ev(`document.querySelector('#barra [data-exp="search"]').click(); 1`);
ok(await waitFor(`new URLSearchParams(location.search).has('search') && !!document.getElementById('buscar')`), 'ticking Buscar reloads with the search box');
await ev(`document.querySelector('#barra [data-exp^="splash:"]').click(); 1`);
ok(await waitFor(`new URLSearchParams(location.search).has('splash') && new URLSearchParams(location.search).has('search') && !!document.getElementById('buscar') && !!document.querySelector('.splash, [class*=splash]')`), 'ticking the splash too keeps Buscar on and opens the splash');
ok(await ev(`[...document.querySelectorAll('#barra input[type=checkbox]')].every(x => x.checked)`), 'both boxes show ticked');
await ev(`document.querySelector('#barra [data-exp="search"]').click(); 1`);
ok(await waitFor(`!new URLSearchParams(location.search).has('search') && new URLSearchParams(location.search).has('splash') && !!document.querySelector('#barra [data-exp^="splash:"]')`), 'unticking Buscar leaves the splash on');
await b.shot('bar-splash');
await ev(`document.querySelector('#barra [data-exp^="splash:"]').click(); 1`);
ok(await waitFor(`!new URLSearchParams(location.search).has('splash') && !!document.getElementById('barra')`), 'and none is the home page as players see it');
await ev(`scrollTo(0, 1500); 1`);
ok(await waitFor(`document.getElementById('filtros-barra').classList.contains('pegada') && Math.abs(document.getElementById('filtros-barra').getBoundingClientRect().top - parseFloat(getComputedStyle(document.getElementById('filtros-barra')).top)) < 2`), 'scrolling down, the filters stay stuck on top');
await ev(`const s = document.getElementById('idioma'); s.value = 'de'; s.dispatchEvent(new Event('change')); 1`);
ok(await waitFor(`document.documentElement.lang.startsWith('de') && !!document.getElementById('barra')`), 'changing the language keeps the bar');

// A filter rewrites the address without the empty `=` of the flags: `?test&lab`, not `?test=&lab=`
await b.go(`${SITE}/?test&lab&search`);
await waitFor(`!!document.querySelector('.tipos button[data-tipo="logic"]')`);
await ev(`document.querySelector('.tipos button[data-tipo="logic"]').click(); 1`);
ok(await waitFor(`location.search.includes('type=logic')`) && await ev(`!/=(&|$)/.test(location.search)`), 'a filter keeps the flags bare in the address');

// Players never see the bar
await b.go(`${SITE}/?test`);
ok(await waitFor(`document.querySelectorAll('.game-card').length > 3`) && await ev(`!document.getElementById('barra')`), 'the home page alone has no lab bar');

b.close();
console.log(failures ? `✗ ${failures} failure(s)` : '✓ home/lab.mjs');
process.exit(failures ? 1 : 0);

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

// The lab: games, improvements and La Bodega apart; the splash among the improvements, the home page in La Bodega (D-372)
await b.go(`${SITE}/labs/?test`);
ok(await ev(`!!document.querySelector('#mejoras #seccion-splash') && !document.querySelector('#mejoras #seccion-portada')`), 'the lab offers the splash under Mejoras en prueba');
ok(await ev(`!!document.querySelector('#bodega #seccion-portada.plegada details #btn-portada')`), 'the home page experiments are kept in La Bodega, folded to their title');
ok(await ev(`!document.querySelector('#activos #seccion-splash') && !!document.querySelector('#activos #seccion-agentes')`), 'the games being tried are apart from the improvements');

// /labs/home/ opens the real home page, without a frame (D-363), with the bar: ‹ Lab and the language (no
// experiment is being tried since D-369); the filters still stick when the page scrolls
await b.go(`${SITE}/labs/home/?test`);
ok(await waitFor(`location.pathname === '/' && new URLSearchParams(location.search).has('lab') && !!document.getElementById('barra')`), '/labs/home/ opens the home page itself with the experiments bar');
ok(await ev(`getComputedStyle(document.getElementById('barra')).position === 'fixed' && !!document.querySelector('#barra a[href$="/labs/"]')`), 'the bar floats and leads back to the lab');
await ev(`scrollTo(0, 1500); 1`);
ok(await waitFor(`document.getElementById('filtros-barra').classList.contains('pegada') && Math.abs(document.getElementById('filtros-barra').getBoundingClientRect().top - parseFloat(getComputedStyle(document.getElementById('filtros-barra')).top)) < 2`), 'scrolling down, the filters stay stuck on top');
await ev(`const s = document.getElementById('idioma'); s.value = 'de'; s.dispatchEvent(new Event('change')); 1`);
ok(await waitFor(`document.documentElement.lang.startsWith('de') && !!document.getElementById('barra')`), 'changing the language keeps the bar');

// Players never see the bar
await b.go(`${SITE}/?test`);
ok(await waitFor(`document.querySelectorAll('.game-card').length > 3`) && await ev(`!document.getElementById('barra')`), 'the home page alone has no lab bar');

b.close();
console.log(failures ? `✗ ${failures} failure(s)` : '✓ home/lab.mjs');
process.exit(failures ? 1 : 0);

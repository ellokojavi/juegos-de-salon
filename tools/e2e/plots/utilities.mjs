// Loteo in the lab, the «Servicios» mode (D-311), end to end at /labs/plots/: the cover's selector
// changes the tagline, the steps and the demo (a 4×4 of ⚡ and 💧 that solves itself), is remembered
// on return and shows in the link; `?mode=utilities` goes straight in. In the game, «Lotes de n
// casillas» above the board and the engine's icons; a plot of the wrong size, missing a utility or
// with one too many is rejected with its notice; a valid one is painted; with the engine's solution
// all 5 boards are solved, the score is the engine's and the ending names the mode; «Otro tablero» and
// «El de hoy» keep it. Prints ✗ if anything fails. `WIDTH=320` runs it at 320 px.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/plots-utilities');
const WIDTH = +process.env.WIDTH || 375;
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: WIDTH, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEED = 'e2e1';
const { generarEtapaServicios, validar, puntajePartida, ETAPAS_SERVICIOS, ICONOS } = await import('../../../public/labs/plots/engine.js');
const draw = r => ev(`window.__loteo.dibujar(${JSON.stringify(r)}); 1`);
const notice = () => ev(`document.getElementById('aviso').textContent`);
const plots = () => ev(`document.querySelectorAll('#tablero .lote').length`);
const steps = () => ev(`[...document.querySelectorAll('.pasos li')].map(l => l.textContent).join(' | ')`);

// The cover, in numbers mode (the usual one): the selector, with Números chosen
await b.go(`${SITE}/labs/plots/?test`, 1200);
await ev(`localStorage.removeItem('juegos-de-salon:loteo:modo'); 1`);
await b.go(`${SITE}/labs/plots/?test`, 1200);
ok(await waitFor(`!!document.getElementById('selector-modo')`), 'the cover has the mode selector');
ok(await ev(`document.getElementById('modo-numeros').getAttribute('aria-checked')`) === 'true', 'Números by default');
ok(await ev(`[...document.querySelectorAll('#selector-modo [role=radio]')].every(x => x.getBoundingClientRect().height >= 44)`), 'both options are 44 px or taller');
const numbersSteps = await steps();
ok(/número/.test(numbersSteps), 'the steps are the numbers ones');

// Servicios: the tagline, steps and demo change; the link says so
await ev(`document.getElementById('modo-servicios').click(); 1`); await sleep(200);
ok(await ev(`document.getElementById('modo-servicios').getAttribute('aria-checked')`) === 'true', 'tapping Servicios selects it');
ok(/⚡/.test(await ev(`document.getElementById('lema').textContent`)), 'the tagline changes');
const utilitiesSteps = await steps();
ok(utilitiesSteps !== numbersSteps && /un ⚡ y un 💧, ni más ni menos/.test(utilitiesSteps) && /del tamaño que dice arriba/.test(utilitiesSteps) && /deja una casilla sin lote posible/.test(utilitiesSteps), `the steps change (${utilitiesSteps})`);
ok(await ev(`document.querySelectorAll('.pasos li').length`) === 3, 'three steps');
ok(await ev(`location.search.includes('mode=utilities')`), 'the link names the mode (?mode=utilities)');
ok(await waitFor(`document.querySelectorAll('.demo .num[data-servicio=luz]').length === 4`, 3000), 'the demo has ⚡ and 💧 (4×4 in plots of 4)');
ok(/Lotes de 4 casillas/.test(await ev(`document.querySelector('.demo-tam')?.textContent || ''`)), 'and states the size of its plots');
ok(await waitFor(`document.querySelectorAll('.demo .lote').length >= 2`, 8000), 'the demo solves itself: the plots get painted');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `no sideways scroll at ${WIDTH} px`);
await b.shot('01-cover-utilities');
ok(await waitFor(`document.querySelector('.demo-rotulo.ve')?.textContent === '¡Listo!'`, 20000), 'when the demo ends it says «¡Listo!»');

// It is remembered: coming back without the parameter, still Servicios
await b.go(`${SITE}/labs/plots/?test`, 1200);
ok(await waitFor(`document.getElementById('modo-servicios')?.getAttribute('aria-checked') === 'true'`), 'on return, the phone remembers Servicios');
// And back to Números
await ev(`document.getElementById('modo-numeros').click(); 1`); await sleep(200);
ok(await steps() === numbersSteps && !(await ev(`location.search.includes('mode=')`)), 'going back to Números brings its steps and drops the mode from the link');
ok(await waitFor(`document.querySelectorAll('.demo .num:not(.icono)').length === 25`, 3000), 'and its 5×5 demo');
await b.shot('01b-cover-numbers');

// ?mode=utilities goes straight in, even if the phone remembers Números
await b.go(`${SITE}/labs/plots/?seed=${SEED}&mode=utilities&test`, 1200);
ok(await waitFor(`document.getElementById('modo-servicios')?.getAttribute('aria-checked') === 'true'`), '?mode=utilities enters Servicios');
await ev(`document.getElementById('btn-empezar').click(); 1`);
const t = generarEtapaServicios(SEED, 0);
ok(await waitFor(`document.querySelectorAll('#tablero .num').length === ${t.lado * t.lado} && !document.getElementById('cuenta')`, 8000), `board 1 is ${t.lado}×${t.lado}`);
ok(await ev(`window.__loteo.P.modo`) === 'servicios', 'in utilities mode');
ok(await ev(`document.getElementById('tam')?.textContent`) === `Lotes de ${t.tam} casillas`, `above the board: «Lotes de ${t.tam} casillas»`);
ok(JSON.stringify(await ev(`[...document.querySelectorAll('#tablero .num')].map(n => n.textContent)`)) === JSON.stringify(t.iconos.map(x => (x ? ICONOS[x] : ''))), 'the icons are the engine\'s');
ok(await ev(`(() => { const r = document.querySelector('#tablero .num[data-servicio]').getBoundingClientRect(); return r.height >= 18; })()`), 'the icons look big');

// The invalid plots, with their notice
const L = t.lado, all = [];
for (let f1 = 0; f1 < L; f1++) for (let f2 = f1; f2 < L; f2++) for (let c1 = 0; c1 < L; c1++) for (let c2 = c1; c2 < L; c2++) all.push({ f1, c1, f2, c2 });
const wrongSize = all.find(r => validar(t, r).motivo === 'tam' && validar(t, r).area > 1);
await draw(wrongSize); await sleep(60);
const vt = validar(t, wrongSize);
ok(await ev(`document.querySelector('#tablero .seleccion').classList.contains('mal')`) && await notice() === `Ese lote tiene ${vt.area} casillas; cada lote tiene ${t.tam}.`, `one of the wrong size shakes red and says so (${await notice()})`);
ok(await plots() === 0, 'and is not painted');
const missing = all.find(r => validar(t, r).motivo === 'falta');
await draw(missing); await sleep(60);
ok(await notice() === `Le falta ${ICONOS[validar(t, missing).servicio]}.`, `one missing a utility says so (${await notice()})`);
const extra = all.find(r => validar(t, r).motivo === 'sobra' && validar(t, r).cuantos === 2);
await draw(extra); await sleep(60);
ok(await notice() === `Tiene 2 ${ICONOS[validar(t, extra).servicio]}: cada lote lleva uno.`, `one with two of the same says so (${await notice()})`);
await draw(t.solucion[0]); await sleep(80);
ok(await plots() === 1 && await ev(`!!document.querySelector('#tablero .lote').style.getPropertyValue('--c')`), 'a valid one is painted in its color');
await b.shot('02-game-utilities');
await ev(`document.getElementById('btn-borrar').click(); document.getElementById('btn-borrar').click(); 1`); await sleep(60);

// With the engine's solution all five get solved
for (let n = 0; n < ETAPAS_SERVICIOS.length; n++) {
  const tt = generarEtapaServicios(SEED, n);
  ok(await waitFor(`document.querySelectorAll('#tablero .num').length === ${tt.lado * tt.lado} && !window.__loteo.P.terminado && document.getElementById('tam')?.textContent === 'Lotes de ${tt.tam} casillas'`, 5000), `board ${n + 1} is ${tt.lado}×${tt.lado}, in plots of ${tt.tam}`);
  if (n === 4) { await sleep(400); await b.shot('02c-board-hard'); }
  // On reaching the hard ones, the notice says how to think about them (owner's request)
  if (n === 2) ok(/Difíciles: si un lote deja una casilla sin lote posible/.test(await ev(`document.getElementById('aviso').textContent`)), 'board 3 warns the hard ones are coming and how to think about them');
  if (n === 3) ok(!/Difíciles:/.test(await ev(`document.getElementById('aviso').textContent`)), 'and only on reaching them');
  for (const r of tt.solucion) { await draw(r); await sleep(25); }
  ok(await waitFor(`/listo/.test(document.getElementById('aviso')?.textContent || '') || !!document.getElementById('puntaje')`, 2000), `board ${n + 1} solved`);
}
ok(await waitFor(`!!document.getElementById('puntaje')`, 4000), 'after the fifth, straight to the result');
const secs = await ev(`window.__loteo.P.segundos`);
const expected = puntajePartida(ETAPAS_SERVICIOS.length, secs, 0).total;
ok(await ev(`document.getElementById('puntaje').textContent`) === `${expected}/100`, `the score is the engine's: ${expected}/100 in ${secs.toFixed(1)} s`);
ok(await ev(`document.getElementById('modo-fin')?.textContent`) === '⚡💧 Servicios' && /Todo loteado/i.test(await ev(`document.querySelector('.sello-lt').textContent`)), 'the ending names the mode and «¡Todo loteado!»');
const another = await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`);
ok(/seed=/.test(another) && /mode=utilities/.test(another) && !another.includes(SEED), `"Otro tablero" keeps the mode (${another})`);
ok(/mode=utilities/.test(await ev(`document.getElementById('btn-de-hoy')?.getAttribute('href') || ''`)), '"El de hoy" too');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `no sideways scroll at ${WIDTH} px`);
await sleep(1500);
await b.shot('03-final-utilities');
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ loteo utilities (labs)');

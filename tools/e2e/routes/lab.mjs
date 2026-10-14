// Rutas rotas in the lab (D-293, D-294, D-295) end to end, at /labs/routes/: the lab offers it under
// Active projects with the credit to Junction Nine, which is also on the cover; Empezar goes through
// the 3, 2, 1 countdown and starts at stage 1 of 5; dragging marks a rectangle and releasing turns it
// half a turn (the pieces move as the engine says); restarting goes back to the start and doesn't
// count the turns; in each of the five stages, undoing the scramble joins all the lines and the next
// one arrives, and the result gives the engine's layered score, the breakdown, share, another board
// and the comment after a line; giving up asks for a second tap, and with a 12 s test clock the
// stages done count. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { girar, puntajePartida, ETAPAS, PUNTOS_ETAPA } from '../../../public/labs/routes/engine.js';
const OUT = output('/tmp/routes-lab');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEED = 'e2e1';

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-rutas #btn-rutas')?.getAttribute('href')`) === 'routes/', 'the lab offers Rutas rotas under Active projects');
ok(await ev(`/Junction Nine/.test(document.querySelector('#seccion-rutas a[href*="junction"]')?.textContent || '')`), 'and credits Junction Nine, with its link');

await b.go(`${SITE}/labs/routes/?test`, 1200);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the cover has Empezar');
ok(/Inspirado en Junction Nine/.test(await ev(`document.querySelector('.credito')?.textContent || ''`)), 'the cover credits Junction Nine');
ok(await ev(`document.querySelectorAll('.tablero-rt .pieza').length`) === 9, 'and shows a 9-piece board');
await b.shot('01-cover');

await b.go(`${SITE}/labs/routes/?seed=${SEED}&test`, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`/3|2|1/.test(document.querySelector('#cuenta .cuenta-num')?.textContent || '')`, 2000), 'Empezar opens the 3, 2, 1 countdown');
ok(await waitFor(`document.querySelectorAll('#tablero .pieza').length === 9 && !document.getElementById('cuenta')`, 8000), 'and then the board');
const t = await ev(`JSON.stringify(window.__rutas.P.t)`).then(JSON.parse);
ok(/Mínimo: \d/.test(await ev(`document.getElementById('marcador').textContent`)), `the scoreboard shows the minimum (${t.minimo})`);
ok(/Etapa 1 de 5/.test(await ev(`document.getElementById('etapa').textContent`)) && t.minimo === ETAPAS[0].minimo, 'starts at stage 1 of 5, with its minimum');
ok(await ev(`document.getElementById('btn-reiniciar').disabled`), 'with no turns, Restart is off');
ok(/⏱ [67]:\d\d/.test(await ev(`document.getElementById('reloj').textContent`)), 'the clock starts at 7 minutes and counts down');
const positions = () => ev(`JSON.stringify([...document.querySelectorAll('#tablero .pieza')].map(n => [+n.dataset.p, +n.dataset.lugar]))`).then(JSON.parse);
// What is shown is what the engine says: each flipped piece (v) is drawn turned half a turn
const matchesEngine = async (sel, state) => (await ev(`JSON.stringify([...document.querySelectorAll('${sel} .pieza')].map(n => [+n.dataset.lugar, (n.firstChild.style.transform.includes('180') ? 1 : 0)]))`).then(JSON.parse)).every(([l, v]) => state[l].v === v);
ok(await matchesEngine('#tablero', t.inicio), 'at the start, each piece is drawn as the engine says (the flipped ones, turned)');
// Drag from the top-left corner to the center: turns that 2×2 block
const drag = (c1, f1, c2, f2) => ev(`(()=>{const t=document.getElementById('tablero'),b=t.getBoundingClientRect(),at=(c,f)=>({clientX:b.left+b.width*(c+0.5)/3,clientY:b.top+b.height*(f+0.5)/3,bubbles:true,pointerId:1});t.dispatchEvent(new PointerEvent('pointerdown',at(${c1},${f1})));t.dispatchEvent(new PointerEvent('pointermove',at(${c2},${f2})));t.dispatchEvent(new PointerEvent('pointerup',at(${c2},${f2})));return 1})()`);
await drag(0, 0, 1, 1);
await sleep(600);
const expected = girar(t.inicio, { f1: 0, c1: 0, f2: 1, c2: 1 });
const actual = await positions();
ok(actual.every(([p, l]) => expected[l].p === p) && await matchesEngine('#tablero', expected), 'dragging marks a rectangle and releasing turns it: each piece ends where and how the engine says');
ok(/Giros: 1/.test(await ev(`document.getElementById('marcador').textContent`)), 'and counts the turn');
await b.shot('02-game');
// Undo: goes back to the state before the turn, which doesn't count
ok(!await ev(`document.getElementById('btn-deshacer').disabled`), 'with one turn, Undo turns on');
await ev(`document.getElementById('btn-deshacer').click(); 1`); await sleep(600);
ok(/Giros: 0/.test(await ev(`document.getElementById('marcador').textContent`)) && (await positions()).every(([p, l]) => t.inicio[l].p === p) && await matchesEngine('#tablero', t.inicio), 'undo goes back to how it was, and the turn doesn\'t count');
ok(await ev(`document.getElementById('btn-deshacer').disabled`), 'and with no more turns, Undo turns off');
ok(await ev(`[...document.querySelectorAll('.acciones-rt .btn')].map(b => b.id).join()`) === 'btn-deshacer,btn-reiniciar,btn-rendirse', 'the buttons are in order: Undo, Restart, Give up');
await drag(0, 0, 1, 1); await sleep(600);
await ev(`document.getElementById('btn-reiniciar').click(); 1`); await sleep(500);
ok(/Giros: 0/.test(await ev(`document.getElementById('marcador').textContent`)) && (await positions()).every(([p, l]) => t.inicio[l].p === p) && await matchesEngine('#tablero', t.inicio), 'restart goes back to the start with 0 turns');
// Each stage: undoing its scramble in reverse joins all the lines, and moves to the next
for (let k = 0; k < ETAPAS.length; k++) {
  if (k) ok(await waitFor(`document.getElementById('etapa')?.textContent.includes('Etapa ${k + 1} de 5')`, 5000), `stage ${k + 1} arrives`);
  await sleep(200);
  const te = await ev(`JSON.stringify(window.__rutas.P.t)`).then(JSON.parse);
  for (const r of [...te.revuelta].reverse()) { await ev(`document.getElementById('tablero').dispatchEvent(new CustomEvent('girar', { detail: ${JSON.stringify(r)} })); 1`); await sleep(60); }
  ok(await waitFor(`document.getElementById('tablero')?.classList.contains('resuelto')`, 3000), `stage ${k + 1}: all the lines join (minimum ${te.minimo}, ${te.colores.length} lines)`);
}
// The layered score (D-295): what the engine says with what the game recorded and the time it took
const P = await ev(`JSON.stringify({ done: window.__rutas.P.hechas, seconds: window.__rutas.P.segundos })`).then(JSON.parse);
const exp = puntajePartida(P.done, P.seconds);
ok(P.done.length === 5 && exp.completa, `the 5 stages recorded (${P.done.map(h => `${h.giros}/${h.minimo}`).join(' ')}, in ${Math.round(P.seconds)} s)`);
ok(await waitFor(`document.getElementById('puntaje')?.textContent === '${exp.total}/100'`, 6000), `the result: ${exp.total}/100 = ${exp.base} + ${exp.ptsVelocidad} for speed + ${exp.ptsGiros} for turns`);
ok(/Etapas \(5 de 5\): \+85/.test(await ev(`document.getElementById('desglose').textContent`)) && /Rapidez/.test(await ev(`document.getElementById('desglose').textContent`)), 'the breakdown shows the three layers');
ok(await ev(`document.querySelectorAll('#desglose li').length`) >= 5, 'the breakdown shows each stage');
ok(/Reiniciaste 1 vez/.test(await ev(`document.querySelector('.desglose').textContent`)), 'the breakdown counts the restart');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'the result can be shared');
ok(/seed=/.test(await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`)), '"Otro tablero" opens a new one');
ok(await ev(`(()=>{const k=[...document.querySelector('.resultado').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario') && k.at(-2)?.classList.contains('divisor')})()`), 'the comment comes last, separated by a line');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll at 375 px');
await b.shot('03-final');

// Giving up: asks for a second tap, and the stages done count (no speed bonus)
await b.go(`${SITE}/labs/routes/?seed=${SEED}&test`, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
await waitFor(`!!document.getElementById('btn-rendirse') && !document.getElementById('cuenta')`, 8000);
// The clock pauses while the screen is hidden (U-20): the hidden time doesn't count
const hidden = v => ev(`Object.defineProperty(document, 'hidden', { configurable: true, get: () => ${v} }); document.dispatchEvent(new Event('visibilitychange')); 1`);
const d0 = await ev(`window.__rutas.P.desde`); await hidden(true); await sleep(1500); await hidden(false);
ok(await ev(`window.__rutas.P.desde`) - d0 >= 1400, 'with the screen hidden, the clock pauses');
await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(150);
ok(/Seguro/.test(await ev(`document.getElementById('btn-rendirse').textContent`)) && !await ev(`!!document.getElementById('puntaje')`), 'giving up asks for a second tap');
await ev(`document.getElementById('btn-rendirse').click(); 1`);
ok(await waitFor(`document.getElementById('puntaje')?.textContent === '0/100'`, 4000) && /Te rendiste/.test(await ev(`document.querySelector('.sello-rt').textContent`)), 'and with the second it ends: 0/100 with no stages, «Te rendiste»');

// The clock: when it runs out, the stages done count (here, with a 12 s test clock and one stage)
await b.go(`${SITE}/labs/routes/?seed=${SEED}&test&time=12`, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
await waitFor(`!!document.getElementById('tablero') && !document.getElementById('cuenta')`, 8000);
const t1 = await ev(`JSON.stringify(window.__rutas.P.t)`).then(JSON.parse);
for (const r of [...t1.revuelta].reverse()) { await ev(`document.getElementById('tablero').dispatchEvent(new CustomEvent('girar', { detail: ${JSON.stringify(r)} })); 1`); await sleep(60); }
ok(await waitFor(`/Se acabó el tiempo/.test(document.querySelector('.sello-rt')?.textContent || '')`, 16000), 'when the clock runs out the game ends');
const h1 = await ev(`JSON.stringify(window.__rutas.P.hechas)`).then(JSON.parse);
ok(await ev(`document.getElementById('puntaje').textContent`) === `${puntajePartida(h1, 12).total}/100` && h1.length >= 1, `and the stages done count: ${puntajePartida(h1, 12).total}/100 with ${h1.length} (${PUNTOS_ETAPA} each, no speed)`);
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ rutas (labs)');

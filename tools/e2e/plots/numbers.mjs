// Loteo in the lab (D-310) end to end, at /labs/plots/: the lab offers it under Active projects with
// the credit to Shikaku; the cover says so and its 5×5 solves itself (the plots get painted); Empezar
// goes through the 3, 2, 1 countdown and builds board 1 of 5 with the engine's numbers; a rectangle
// with no number, with two numbers or with the wrong area is rejected (the frame shakes red) and says
// why; a valid one is painted in its color and tapping it erases it; the 💡 hint asks for a second tap
// and places a plot from the solution; Undo removes it; Undo, Clear and Give up sit in one row (the
// hint apart), Clear asks for a second tap, empties the board and Undo brings it back, and arming one
// of those buttons disarms the others; with the engine's solution all 5 boards are solved and the
// score is the engine's with the time the game recorded; the result has share, another board, today's
// board and the comment after a line; giving up asks for a second tap and counts the boards done.
// Prints ✗ if anything fails. `WIDTH=320` runs it at 320 px.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/plots-lab');
const WIDTH = +process.env.WIDTH || 375;
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: WIDTH, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEED = 'e2e1';
const { generarEtapa, validar, puntajePartida, ETAPAS, PUNTOS_ETAPA } = await import('../../../public/labs/plots/engine.js');
const draw = r => ev(`window.__loteo.dibujar(${JSON.stringify(r)}); 1`);
const tap = (row, col) => ev(`window.__loteo.tocar(${row}, ${col}); 1`);
const notice = () => ev(`document.getElementById('aviso').textContent`);
const plots = () => ev(`document.querySelectorAll('#tablero .lote').length`);
const start = async () => {
  await b.go(`${SITE}/labs/plots/?seed=${SEED}&test`, 1200);
  await waitFor(`!!document.getElementById('btn-empezar')`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  return waitFor(`document.querySelectorAll('#tablero .num').length === 25 && !document.getElementById('cuenta')`, 8000);
};

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-loteo #btn-loteo')?.getAttribute('href')`) === 'plots/', 'the lab offers Loteo under Active projects');
ok(await ev(`/Shikaku/.test(document.querySelector('#seccion-loteo a[href*="wikipedia.org/wiki/Shikaku"]')?.textContent || '')`), 'and says it is inspired by Shikaku, with its link');

await b.go(`${SITE}/labs/plots/?test`, 1200);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the cover has Empezar');
ok(/Inspirado en Shikaku/.test(await ev(`document.querySelector('.credito')?.textContent || ''`)) && /wikipedia/.test(await ev(`document.getElementById('link-shikaku')?.href || ''`)), 'the cover credits Shikaku with its link');
ok(await waitFor(`document.querySelectorAll('.demo .lote').length >= 2`, 8000), 'the cover 5×5 solves itself: the plots get painted');
ok(/mismo para todos/.test(await ev(`document.body.textContent`)), 'without a seed it is today\'s board');
ok(await ev(`document.querySelectorAll('.pasos li').length`) === 3, 'three steps');
await b.shot('01-cover');
ok(await waitFor(`document.querySelector('.demo-rotulo.ve')?.textContent === '¡Listo!'`, 20000), 'when the demo ends it says «¡Listo!»');
await b.shot('01b-cover-done');

ok(await (async () => {
  await b.go(`${SITE}/labs/plots/?seed=${SEED}&test`, 1200);
  await waitFor(`!!document.getElementById('btn-empezar')`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  return waitFor(`/3|2|1/.test(document.querySelector('#cuenta .cuenta-num')?.textContent || '')`, 2000);
})(), 'Empezar opens the 3, 2, 1 countdown');
ok(await waitFor(`document.querySelectorAll('#tablero .num').length === 25 && !document.getElementById('cuenta')`, 8000), 'and then the 5×5 board');
ok(/Tablero 1 de 5/.test(await ev(`document.getElementById('etapa').textContent`)), '«Tablero 1 de 5»');
const t = generarEtapa(SEED, 0);
ok(JSON.stringify(await ev(`[...document.querySelectorAll('#tablero .num')].map(n => +n.textContent || 0)`)) === JSON.stringify(t.numeros), 'the numbers are the engine\'s');

// The invalid rectangles: no number, two numbers, wrong area
const L = t.lado, all = [];
for (let f1 = 0; f1 < L; f1++) for (let f2 = f1; f2 < L; f2++) for (let c1 = 0; c1 < L; c1++) for (let c2 = c1; c2 < L; c2++) all.push({ f1, c1, f2, c2 });
const noNumber = all.find(r => validar(t, r).motivo === 'sin-numero');
await draw(noNumber); await sleep(60);
ok(await ev(`document.querySelector('#tablero .seleccion').classList.contains('mal')`) && await notice() === 'Ese rectángulo no tiene número.', `one with no number shakes red and says so (${await notice()})`);
ok(await plots() === 0, 'and is not painted');
await draw({ f1: 0, c1: 0, f2: L - 1, c2: L - 1 }); await sleep(60);
ok(/^Tiene \d+ números: cada uno va en su propio lote\.$/.test(await notice()), `one with several numbers says so (${await notice()})`);
const wrongArea = all.find(r => validar(t, r).motivo === 'area');
const v = validar(t, wrongArea);
await draw(wrongArea); await sleep(60);
ok(await notice() === `El ${v.n} pide ${v.n} ${v.n === 1 ? 'casilla' : 'casillas'}; ese tiene ${v.area}.`, `one with the wrong area says how many it needs (${await notice()})`);

// A valid one gets painted; tapping it erases it
const [s0] = t.solucion;
await draw(s0); await sleep(80);
ok(await plots() === 1 && await ev(`!!document.querySelector('#tablero .lote').style.getPropertyValue('--c')`), 'a valid one is painted in its color');
ok(await ev(`document.querySelector('#tablero .num.cubierto') !== null`), 'and its number stays on top, dark');
await b.shot('02-game');
await tap(s0.f1, s0.c1); await sleep(60);
ok(await plots() === 0 && /borrado/.test(await notice()), 'tapping it erases it');

// The hint: two taps, places a plot from the solution; Undo removes it
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(80);
ok(/Toca de nuevo/.test(await ev(`document.getElementById('btn-ayuda').textContent`)) && await plots() === 0, 'the first hint tap asks to confirm, without charging');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(120);
ok(await plots() === 1 && await ev(`!!document.querySelector('#tablero .lote.ayudado')`) && await ev(`window.__loteo.P.ayudas`) === 1, 'the second places a plot from the solution, marked, and counts one hint');
const placed = await ev(`JSON.stringify((({f1,c1,f2,c2}) => ({f1,c1,f2,c2}))(window.__loteo.P.parcelas[0]))`);
ok(t.solucion.some(r => JSON.stringify(r) === placed), 'that plot is from the solution');
await ev(`document.getElementById('btn-deshacer').click(); 1`); await sleep(60);
ok(await plots() === 0, 'Undo removes it');
ok(await ev(`[...document.querySelectorAll('.acciones-lt .btn')].map(b => b.id).join()`) === 'btn-deshacer,btn-borrar,btn-rendirse', 'below: Undo, Clear and Give up, in one row; the hint, apart');
// Clearing the board (owner's request): with a second tap, and Undo brings it back
for (const r of t.solucion.slice(0, 2)) { await draw(r); await sleep(40); }
ok(await plots() === 2, 'two plots placed');
await ev(`document.getElementById('btn-borrar').click(); 1`); await sleep(80);
ok(/Seguro/.test(await ev(`document.getElementById('btn-borrar').textContent`)) && await plots() === 2, 'Clear asks for a second tap');
await ev(`document.getElementById('btn-borrar').click(); 1`); await sleep(80);
ok(await plots() === 0 && await ev(`document.getElementById('btn-borrar').disabled`), 'with the second, the board is empty and Clear turns off');
await ev(`document.getElementById('btn-deshacer').click(); 1`); await sleep(80);
ok(await plots() === 2, 'Undo brings back what was cleared');
await ev(`document.getElementById('btn-borrar').click(); document.getElementById('btn-rendirse').click(); 1`); await sleep(80);
ok(await ev(`!document.getElementById('btn-borrar').classList.contains('armado') && document.getElementById('btn-rendirse').classList.contains('armado')`), 'one «¿Seguro?» at a time: arming Give up disarms Clear');
await ev(`document.querySelector('#tablero').click(); 1`); await sleep(3100);

// With the engine's solution (another game, no hints) all five get solved
await start();
for (let n = 0; n < ETAPAS.length; n++) {
  const tt = generarEtapa(SEED, n);
  ok(await waitFor(`document.querySelectorAll('#tablero .num').length === ${tt.lado * tt.lado} && !window.__loteo.P.terminado`, 5000), `board ${n + 1} is ${tt.lado}×${tt.lado}`);
  if (n === 4) await b.shot('02c-board-8x8');
  for (const r of tt.solucion) { await draw(r); await sleep(30); }
  ok(await waitFor(`/listo/.test(document.getElementById('aviso')?.textContent || '') || !!document.getElementById('puntaje')`, 2000), `board ${n + 1} solved`);
  if (n === 1) await b.shot('02b-board-done');
}
ok(await waitFor(`!!document.getElementById('puntaje')`, 4000), 'after the fifth, straight to the result');
const secs = await ev(`window.__loteo.P.segundos`);
const expected = puntajePartida(ETAPAS.length, secs, 0).total;
ok(await ev(`document.getElementById('puntaje').textContent`) === `${expected}/100`, `the score is the engine's: ${expected}/100 in ${secs.toFixed(1)} s`);
ok(/Todo loteado/i.test(await ev(`document.querySelector('.sello-lt').textContent`)), '«¡Todo loteado!»');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'the result can be shared');
const another = await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`);
ok(/seed=/.test(another) && !another.includes(SEED), `"Otro tablero" opens a new one (${another})`);
ok(await ev(`!!document.getElementById('btn-de-hoy')`), 'and since it was not today\'s, it offers today\'s');
ok(await ev(`(()=>{const k=[...document.querySelector('.resultado').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario') && k.at(-2)?.classList.contains('divisor')})()`), 'the comment comes last, separated by a line');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `no sideways scroll at ${WIDTH} px`);
await sleep(1500);
await b.shot('03-final');

// Giving up: a second tap, and the boards done count
await start();
for (const r of generarEtapa(SEED, 0).solucion) { await draw(r); await sleep(30); }
ok(await waitFor(`document.querySelectorAll('#tablero .num').length === 36 && !window.__loteo.P.terminado`, 5000), 'moves to board 2');
await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(80);
ok(/Seguro/.test(await ev(`document.getElementById('btn-rendirse').textContent`)), 'giving up asks for a second tap');
await ev(`document.getElementById('btn-rendirse').click(); 1`);
ok(await waitFor(`document.getElementById('puntaje')?.textContent === '${PUNTOS_ETAPA}/100'`, 4000) && /Te rendiste/.test(await ev(`document.querySelector('.sello-lt').textContent`)), `the finished board counts: ${PUNTOS_ETAPA}/100, «Te rendiste»`);
ok(/Así se resolvía el tablero 2/.test(await ev(`document.querySelector('.resultado').textContent`)) && await ev(`document.querySelectorAll('.resultado .lote').length`) === generarEtapa(SEED, 1).solucion.length, 'and shows how it was solved');
await b.shot('04-gave-up');
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ loteo (labs)');

// Loteo, 🔢 Numbers (its default variant), end to end on its own page /plots/ (D-331; born in the lab,
// D-310): the waiting room has the board that solves itself, the name with the credit to Shikaku and its
// link, the variant picker with Numbers on, the drawing and three steps; `?mode=numbers` wins over the
// variant this phone remembers. Start goes through the 3, 2, 1 countdown and builds board 1 of 5 with
// the engine's numbers (the cup's code and day 1). A drag shows the live size and a real drag draws a
// plot; a rectangle with no number, with two numbers or with the wrong area shakes in red and says why;
// a valid one is painted and tapping it erases it; the 💡 hint asks for a second tap and places a plot
// from the solution, which ↩️ Undo removes; Undo, Clear and Give up sit in one row with the hint apart;
// Clear asks for a second tap, empties the board and Undo brings it back; one armed button at a time.
// With the engine's solution the 5 boards are solved, the clock stops, «¡Todo loteado!» and See result
// give the engine's score with the card and the breakdown. Giving up asks for a second tap, shows how
// the board was solved and counts the boards done. The cup's practice opens it too.
// Prints ✗ if anything fails. `WIDTH=320` runs it at 320 px.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/plots-numbers');
const WIDTH = +process.env.WIDTH || 375;
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: WIDTH, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const { generarDia, validar, puntajePartida, ETAPAS, PUNTOS_ETAPA } = await import('../../../public/cup/games/plots/engine.js');
const draw = r => ev(`window.__loteo.dibujar(${JSON.stringify(r)}); 1`);
const tap = (row, col) => ev(`window.__loteo.tocar(${row}, ${col}); 1`);
const notice = () => ev(`document.getElementById('lt-aviso')?.textContent`);
const plots = () => ev(`document.querySelectorAll('#lt-tablero .lt-lote').length`);
const P = expr => ev(`(()=>{const P=window.__loteo.P;return ${expr}})()`);
const KEY = 'juegos-de-salon:loteo:variant';
const PAGE = `${SITE}/plots/?test`;
const start = async (url = PAGE) => {
  await b.go(url, 1200);
  await waitFor(`!!document.getElementById('btn-empezar')`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  return waitFor(`!!document.getElementById('lt-tablero') && !document.getElementById('cuenta')`, 9000);
};
const solve = async () => { for (const r of JSON.parse(await P(`JSON.stringify(P.t.solucion)`))) { await draw(r); await sleep(30); } };

// The waiting room: utilities remembered, but the link says numbers
await b.go(PAGE, 800);
await ev(`localStorage.setItem('${KEY}', 'utilities'); 1`);
await b.go(`${PAGE}&mode=numbers`, 1500);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the waiting room has Start');
ok(/Números/.test(await ev(`document.querySelector('#selector-variante .opcion.on')?.textContent || ''`)), '?mode=numbers wins over the remembered variant: Numbers is on');
ok(/Inspirado en Shikaku, de Nikoli/.test(await ev(`document.getElementById('lt-credito')?.textContent || ''`)) && /wikipedia\.org\/wiki\/Shikaku/.test(await ev(`document.getElementById('link-shikaku')?.href || ''`)), 'the name carries the credit to Shikaku with its link');
ok(await waitFor(`document.querySelectorAll('.lt-demo .lt-lote').length >= 2`, 8000), 'the 5×5 on top solves itself: the plots get painted');
ok(await ev(`document.querySelectorAll('.lt-demo .lt-num').length`) === 25, 'it is a 5×5 of numbers');
ok(await ev(`document.querySelectorAll('.panel .como li').length`) === 3 && /un 6 puede ser de 2×3/.test(await ev(`document.querySelector('.panel .como').textContent`)), 'three steps, the numbers ones');
ok(await ev(`document.querySelectorAll('.lt-ejemplo figure').length`) === 2, 'the drawing: a right board and a wrong plot');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `no sideways scroll in the waiting room at ${WIDTH} px`);
await b.shot('01-lobby');
ok(await waitFor(`document.querySelector('.lt-demo-rotulo.ve')?.textContent === '¡Listo!'`, 20000), 'when the demo ends it says «¡Listo!»');

// Start: the countdown, then board 1 of 5 with the engine's numbers
await b.go(PAGE, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!document.getElementById('cuenta')`, 3000), 'Start opens the 3, 2, 1 countdown');
ok(await waitFor(`!!document.getElementById('lt-tablero') && !document.getElementById('cuenta')`, 9000), 'and then the board');
ok(/Tablero 1 de 5/.test(await ev(`document.getElementById('lt-etapa').textContent`)), '«Tablero 1 de 5»');
const seed = await P(`P.p.semilla`);
const t = generarDia(seed.split(':')[0], 1, { variante: 'numbers' }).tableros[0];
ok(JSON.stringify(await ev(`[...document.querySelectorAll('#lt-tablero .lt-num')].map(n => +n.textContent || 0)`)) === JSON.stringify(t.numeros), `the numbers are the engine's for the seed ${seed}`);
ok(await P(`P.variante`) === 'numbers' && await P(`P.p.tableros.length`) === 5, 'the variant is Numbers, with 5 boards');
ok(await ev(`/Reglas de Loteo/.test(document.getElementById('reglas')?.textContent || '')`), 'the rules are folded below');
ok(JSON.stringify(await ev(`['btn-deshacer','btn-borrar','btn-rendirse','btn-ayuda'].map(i => document.getElementById(i).textContent)`)) === JSON.stringify(['↩️ Deshacer', '🧹 Borrar todo', '🏳️ Rendirse', '💡 Ayuda (−10)']), 'the controls, with the cup\'s words');

// The live size while dragging, with pointer events on the board
const L = t.lado;
const sizeShown = await ev(`(()=>{const c=document.getElementById('lt-tablero'),b=c.getBoundingClientRect(),s=b.width/${L};
  const at=(f,k)=>({clientX:b.left+(k+0.5)*s,clientY:b.top+(f+0.5)*s,pointerId:7,isPrimary:true,bubbles:true});
  c.dispatchEvent(new PointerEvent('pointerdown',at(0,0)));c.dispatchEvent(new PointerEvent('pointermove',at(1,2)));
  const x=document.getElementById('lt-aviso').textContent;c.dispatchEvent(new PointerEvent('pointercancel',at(1,2)));return x})()`);
ok(sizeShown === '3×2 = 6', `dragging shows the size live (${sizeShown})`);

// The invalid rectangles: no number, two numbers, wrong area
const all = [];
for (let f1 = 0; f1 < L; f1++) for (let f2 = f1; f2 < L; f2++) for (let c1 = 0; c1 < L; c1++) for (let c2 = c1; c2 < L; c2++) all.push({ f1, c1, f2, c2 });
await draw(all.find(r => validar(t, r).motivo === 'sin-numero')); await sleep(60);
ok(await ev(`document.querySelector('#lt-tablero .lt-seleccion').classList.contains('mal')`) && await notice() === 'Ese rectángulo no tiene número.', `one with no number shakes red and says so (${await notice()})`);
ok(await plots() === 0, 'and is not painted');
await draw({ f1: 0, c1: 0, f2: L - 1, c2: L - 1 }); await sleep(60);
ok(/^Tiene \d+ números: cada uno va en su propio lote\.$/.test(await notice()), `one with several numbers says so (${await notice()})`);
const wrong = all.find(r => validar(t, r).motivo === 'area' && validar(t, r).n > 1), v = validar(t, wrong);
await draw(wrong); await sleep(60);
ok(await notice() === `El ${v.n} pide ${v.n} casillas; ese tiene ${v.area}.`, `one with the wrong area says how many it needs (${await notice()})`);

// A valid one, with a real drag: painted in its color; tapping it erases it
const s0 = t.solucion.find(r => r.f1 !== r.f2 || r.c1 !== r.c2);
const box = JSON.parse(await ev(`JSON.stringify(document.getElementById('lt-tablero').getBoundingClientRect())`)), cell = box.width / L;
const px = (f, c) => [box.left + (c + 0.5) * cell, box.top + (f + 0.5) * cell];
await b.drag(...px(s0.f1, s0.c1), ...px(s0.f2, s0.c2));
ok(await plots() === 1 && await ev(`!!document.querySelector('#lt-tablero .lt-lote').style.getPropertyValue('--c')`), 'a real drag draws a valid plot, in its color');
ok(await ev(`document.querySelector('#lt-tablero .lt-num.cubierto') !== null`), 'and its number stays on top, dark');
await b.shot('02-game');
await b.tap(...px(s0.f1, s0.c1));
ok(await plots() === 0 && await notice() === 'Lote borrado.', 'a real tap on it erases it');
const one = t.pistas.find(x => x.n === 1);
if (one) {
  await tap(Math.floor(one.i / L), one.i % L); await sleep(60);
  ok(await plots() === 1, 'tapping a 1 draws it');
  await ev(`document.getElementById('btn-deshacer').click(); 1`); await sleep(60);
} else console.log('· this board has no 1 to tap');
const free = all.find(r => r.f1 === r.f2 && r.c1 === r.c2 && !t.numeros[r.f1 * L + r.c1]);
await tap(free.f1, free.c1); await sleep(60);
ok(await notice() === 'Arrastra de una esquina a otra para dibujar un lote.', 'tapping an empty square reminds the gesture');

// The hint: two taps, places a plot from the solution; Undo removes it and the hint stays counted
ok(await ev(`[...document.querySelectorAll('.lt-acciones .btn')].map(b => b.id).join()`) === 'btn-deshacer,btn-borrar,btn-rendirse' && await ev(`!document.querySelector('.lt-acciones #btn-ayuda') && !!document.getElementById('btn-ayuda')`), 'below: Undo, Clear and Give up in one row; the hint apart');
ok(await ev(`(()=>{const r=[...document.querySelectorAll('.lt-acciones .btn')].map(b=>b.getBoundingClientRect().top);return Math.max(...r)-Math.min(...r)<2})()`), 'the three on the same line');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(80);
ok(/Toca de nuevo \(−10\)/.test(await ev(`document.getElementById('btn-ayuda').textContent`)) && await plots() === 0, 'the first hint tap asks to confirm, without charging');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(120);
ok(await plots() === 1 && await ev(`!!document.querySelector('#lt-tablero .lt-lote.ayudado')`) && await P(`P.ayudas`) === 1, 'the second places a plot from the solution, dashed, and counts one hint');
ok(await notice() === '💡 Ese lote va así.', 'and says so');
const placed = await P(`JSON.stringify((({f1,c1,f2,c2}) => ({f1,c1,f2,c2}))(P.parcelas[0]))`);
ok(t.solucion.some(r => JSON.stringify(r) === placed), 'that plot is from the solution');
await ev(`document.getElementById('btn-deshacer').click(); 1`); await sleep(80);
ok(await plots() === 0 && await P(`P.ayudas`) === 1, 'Undo removes it; the hint still counts');

// Clear: a second tap, and Undo brings it back
for (const r of t.solucion.slice(0, 2)) { await draw(r); await sleep(40); }
ok(await plots() === 2, 'two plots placed');
await ev(`document.getElementById('btn-borrar').click(); 1`); await sleep(80);
ok(/Seguro/.test(await ev(`document.getElementById('btn-borrar').textContent`)) && await plots() === 2, 'Clear asks for a second tap');
await b.shot('03-clear-armed');
await ev(`document.getElementById('btn-borrar').click(); 1`); await sleep(80);
ok(await plots() === 0 && await ev(`document.getElementById('btn-borrar').disabled`) && /Deshacer lo trae de vuelta/.test(await notice()), 'with the second the board is empty, Clear turns off and the notice says Undo brings it back');
await ev(`document.getElementById('btn-deshacer').click(); 1`); await sleep(80);
ok(await plots() === 2 && await notice() === 'Deshiciste la última jugada.', 'Undo brings back what was cleared');
await ev(`document.getElementById('btn-borrar').click(); document.getElementById('btn-rendirse').click(); 1`); await sleep(80);
ok(await ev(`!document.getElementById('btn-borrar').classList.contains('armado') && document.getElementById('btn-rendirse').classList.contains('armado')`), 'one «¿Seguro?» at a time: arming Give up disarms Clear');
await sleep(3200);
ok(await ev(`!document.getElementById('btn-rendirse').classList.contains('armado') && /Rendirse/.test(document.getElementById('btn-rendirse').textContent)`), 'and it disarms by itself after 3 seconds');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `no sideways scroll in the game at ${WIDTH} px`);

// The five boards with the engine's solution (another game, no hints)
await start();
const day = generarDia((await P(`P.p.semilla`)).split(':')[0], 1);
for (let n = 0; n < ETAPAS.length; n++) {
  const tt = day.tableros[n];
  ok(await waitFor(`document.querySelectorAll('#lt-tablero .lt-num').length === ${tt.lado * tt.lado} && window.__loteo.P.etapa === ${n} && !document.querySelector('#lt-tablero.bloqueado')`, 5000), `board ${n + 1} is ${tt.lado}×${tt.lado}`);
  if (n === 4) { ok(await ev(`/Rendirse/.test(document.getElementById('btn-rendirse').textContent) && /Ayuda/.test(document.getElementById('btn-ayuda').textContent)`), 'a new board brings its controls with their words'); await b.shot('04-board-8x8'); }
  await solve();
  ok(await waitFor(`/listo/.test(document.getElementById('lt-aviso')?.textContent || '') || !!document.getElementById('btn-fin')`, 2000), `board ${n + 1} solved`);
  if (n === 1) await b.shot('05-board-done');
}
ok(await waitFor(`!!document.getElementById('btn-fin')`, 3000), 'after the fifth: See result');
ok(/Todo loteado/.test(await ev(`document.getElementById('lt-sello').textContent`)) && await ev(`document.querySelector('#lt-tablero').classList.contains('resuelto')`), '«¡Todo loteado!» over the last board, shining');
const clock = await ev(`document.querySelector('#jugar-head').reloj()`);
await sleep(1300);
ok(await ev(`document.querySelector('#jugar-head').reloj()`) === clock, `the clock stopped when the last board was solved (${clock})`);
ok(await ev(`document.getElementById('btn-fin').getBoundingClientRect().bottom <= innerHeight`), 'See result is in sight without scrolling');
await b.shot('06-all-done');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`!!document.querySelector('#resultado-body .score-big')`, 4000), 'the result');
const lines = await ev(`[...document.querySelectorAll('#explicacion li')].map(l => l.textContent)`);
const speed = /^⏱ Rapidez \((\d+):(\d\d)\): \+(\d+)\.$/.exec(lines[1] || '') || [];
const secs = +speed[1] * 60 + +speed[2], bonus = +speed[3];
ok(lines[0] === '📐 Tableros (5 de 5): +60.' && speed.length > 0, `the breakdown: boards and speed (${lines.join(' | ')})`);
ok(Math.abs(60 + bonus - puntajePartida(5, secs, 0).total) <= 1 && await ev(`document.querySelector('#resultado-body .score-big').textContent`) === `${60 + bonus}/100`, `the score is the engine's: ${60 + bonus}/100 in ${secs} s`);
ok(/✅ 5×5  ✅ 6×6  ✅ 7×7  ✅ 7×7  ✅ 8×8/.test(await ev(`document.getElementById('resultado-body').textContent`)), 'the card shows the five boards');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'the result can be shared');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `no sideways scroll in the result at ${WIDTH} px`);
await b.shot('07-result');

// Giving up: a second tap, the solution of the board, and the boards done count
await start();
await solve();
ok(await waitFor(`window.__loteo.P.etapa === 1 && !document.querySelector('#lt-tablero.bloqueado')`, 5000), 'moves on to board 2');
await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(80);
ok(/Seguro/.test(await ev(`document.getElementById('btn-rendirse').textContent`)) && !await P(`P.terminado`), 'giving up asks for a second tap');
await ev(`document.getElementById('btn-rendirse').click(); 1`);
ok(await waitFor(`!!document.getElementById('btn-fin')`, 3000) && /Te rendiste/.test(await ev(`document.getElementById('lt-sello').textContent`)), '«Te rendiste.»');
ok(/Así se resolvía el tablero 2/.test(await ev(`document.getElementById('lt-asi-se').textContent`)) && await plots() === await P(`P.t.solucion.length`), 'and the board shows how it was solved');
await b.shot('08-gave-up');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`document.querySelector('#resultado-body .score-big')?.textContent === '${PUNTOS_ETAPA}/100'`, 4000), `the finished board counts: ${PUNTOS_ETAPA}/100`);
ok(/Rapidez: \+0/.test(await ev(`document.getElementById('explicacion').textContent`)), 'no speed without the five');

// The cup's practice opens the same game
await b.go(`${SITE}/cup/?practice=plots&test`, 1500);
ok(await waitFor(`!!document.getElementById('selector-variante') && !!document.getElementById('lt-credito')`, 6000), 'the cup\'s practice has the variant picker and the credit');

ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ loteo (numbers)');

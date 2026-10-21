// Loteo, ⚡💧 Utilities (D-311, D-312, a variant since D-331), end to end on its own page /plots/: in the
// waiting room, picking Utilities changes the steps, the drawing and the board on top (a 4×4 of ⚡ and 💧
// in plots of 4, which solves itself) and the ranking's name; the phone remembers it, and
// `?mode=utilities` goes straight in. In the game, «Lotes de n casillas» above the board and the
// engine's icons; a plot of the wrong size, missing a utility or with two of the same is rejected with
// its notice; a valid one is painted; with the engine's solution all 5 boards are solved (6×6 of 3,
// 6×6 of 4, 6×6 of 6 and two 8×8 of 8), board 3 warns the hard ones are coming and board 4 no longer
// does; the score is the engine's and the card shows the variant's boards.
// Prints ✗ if anything fails. `WIDTH=320` runs it at 320 px.
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
const { generarDia, validar, puntajePartida, ETAPAS_SERVICIOS, ICONOS } = await import('../../../public/cup/games/plots/engine.js');
const draw = r => ev(`window.__loteo.dibujar(${JSON.stringify(r)}); 1`);
const notice = () => ev(`document.getElementById('lt-aviso')?.textContent`);
const plots = () => ev(`document.querySelectorAll('#lt-tablero .lt-lote').length`);
const P = expr => ev(`(()=>{const P=window.__loteo.P;return ${expr}})()`);
const steps = () => ev(`[...document.querySelectorAll('.panel .como li')].map(l => l.textContent).join(' | ')`);
const on = () => ev(`document.querySelector('#selector-variante .opcion.on')?.textContent || ''`);
const PAGE = `${SITE}/plots/?test`;

// The waiting room, in Numbers (the default)
await b.go(PAGE, 800);
await ev(`localStorage.removeItem('juegos-de-salon:loteo:variant'); 1`);
await b.go(PAGE, 1500);
ok(await waitFor(`!!document.getElementById('selector-variante')`), 'the waiting room has the variant picker');
ok(/Números/.test(await on()), 'Numbers by default');
ok(await ev(`[...document.querySelectorAll('#selector-variante .opcion')].every(x => x.getBoundingClientRect().height >= 44)`), 'both options are 44 px or taller');
const numbersSteps = await steps();

// Utilities: the steps, the drawing, the demo and the ranking change
// Switching redraws the waiting room: the title must not move while the new demo board loads
// (it jumped 180 px with the demo box empty, and 32 px between variants; owner's report)
const titleTops = i => ev(`new Promise(r => { const h = () => Math.round(document.querySelector('.lt-titulo h2').getBoundingClientRect().top);
  const tops = [h()], t0 = performance.now(); document.querySelectorAll('#selector-variante .opcion')[${i}].click();
  const tick = () => { tops.push(h()); performance.now() - t0 < 1200 ? requestAnimationFrame(tick) : r([...new Set(tops)]); }; tick(); })`);
const toUtilities = await titleTops(1);
ok(toUtilities.length === 1, `the title stays put while switching to Utilities (${toUtilities} px)`);
ok(/Servicios/.test(await on()) && /Un ⚡ y un 💧 por lote/.test(await on()), 'tapping Utilities picks it, with its second line');
const utilitiesSteps = await steps();
ok(utilitiesSteps !== numbersSteps && /un ⚡ y un 💧, ni más ni menos/.test(utilitiesSteps) && /del tamaño que dice arriba/.test(utilitiesSteps) && /deja una casilla sin lote posible/.test(utilitiesSteps), `the steps change (${utilitiesSteps})`);
ok(await ev(`document.querySelectorAll('.panel .como li').length`) === 3, 'three steps');
ok(/Dos ⚡ en un lote/.test(await ev(`document.querySelector('.lt-ejemplo').textContent`)) && await ev(`document.querySelectorAll('.lt-ejemplo .lt-icono[data-servicio]').length`) > 0, 'the drawing is the utilities one');
ok(await waitFor(`document.querySelectorAll('.lt-demo .lt-icono[data-servicio=luz]').length === 4`, 3000), 'the demo has ⚡ and 💧 (4×4 in plots of 4)');
ok(/Lotes de 4 casillas/.test(await ev(`document.querySelector('.lt-demo-tam')?.textContent || ''`)), 'and states the size of its plots');
ok(await waitFor(`document.querySelectorAll('.lt-demo .lt-lote').length >= 2`, 8000), 'the demo solves itself: the plots get painted');
ok(/Loteo · ⚡💧 Servicios/.test(await ev(`document.getElementById('jugar-body').textContent`)), 'the ranking is the variant\'s');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `no sideways scroll at ${WIDTH} px`);
await b.shot('01-lobby-utilities');

// It is remembered: coming back without the parameter, still Utilities; ?mode=utilities goes straight in
await b.go(PAGE, 1500);
ok(await waitFor(`/Servicios/.test(document.querySelector('#selector-variante .opcion.on')?.textContent || '')`), 'on return, the phone remembers Utilities');
const toNumbers = await titleTops(0);
ok(toNumbers.length === 1 && toNumbers[0] === toUtilities[0], `and back to Numbers, at the same height (${toNumbers} px)`);
ok(await steps() === numbersSteps && await waitFor(`document.querySelectorAll('.lt-demo .lt-num:not(.lt-icono)').length === 25`, 3000), 'back to Numbers: its steps and its 5×5 demo');
await b.go(`${PAGE}&mode=utilities`, 1500);
ok(await waitFor(`/Servicios/.test(document.querySelector('#selector-variante .opcion.on')?.textContent || '')`), '?mode=utilities enters Utilities');

// The game
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!document.getElementById('lt-tablero') && !document.getElementById('cuenta')`, 9000), 'Start: the countdown and the board');
const day = generarDia((await P(`P.p.semilla`)).split(':')[0], 1, { variante: 'utilities' });
const t = day.tableros[0];
ok(await P(`P.variante`) === 'utilities', 'in the Utilities variant');
ok(await ev(`document.getElementById('lt-tam')?.textContent`) === `Lotes de ${t.tam} casillas`, `above the board: «Lotes de ${t.tam} casillas»`);
ok(JSON.stringify(await ev(`[...document.querySelectorAll('#lt-tablero .lt-num')].map(n => n.textContent)`)) === JSON.stringify(t.iconos.map(x => (x ? ICONOS[x] : ''))), 'the icons are the engine\'s');
ok(await ev(`document.querySelector('#lt-tablero .lt-num[data-servicio]').getBoundingClientRect().height >= 18`), 'the icons look big');

// The invalid plots, with their notice
const L = t.lado, all = [];
for (let f1 = 0; f1 < L; f1++) for (let f2 = f1; f2 < L; f2++) for (let c1 = 0; c1 < L; c1++) for (let c2 = c1; c2 < L; c2++) all.push({ f1, c1, f2, c2 });
const wrongSize = all.find(r => validar(t, r).motivo === 'tam' && validar(t, r).area > 1), vt = validar(t, wrongSize);
await draw(wrongSize); await sleep(60);
ok(await ev(`document.querySelector('#lt-tablero .lt-seleccion').classList.contains('mal')`) && await notice() === `Ese lote tiene ${vt.area} casillas; cada lote tiene ${t.tam}.`, `one of the wrong size shakes red and says so (${await notice()})`);
await draw({ f1: 0, c1: 0, f2: 0, c2: 0 }); await sleep(60);
ok(await notice() === `Ese lote tiene 1 casilla; cada lote tiene ${t.tam}.`, `one square says it in the singular (${await notice()})`);
ok(await plots() === 0, 'and is not painted');
const missing = all.find(r => validar(t, r).motivo === 'falta');
await draw(missing); await sleep(60);
ok(await notice() === `Le falta ${ICONOS[validar(t, missing).servicio]}.`, `one missing a utility says so (${await notice()})`);
const extra = all.find(r => validar(t, r).motivo === 'sobra' && validar(t, r).cuantos === 2);
await draw(extra); await sleep(60);
ok(await notice() === `Tiene 2 ${ICONOS[validar(t, extra).servicio]}: cada lote lleva uno.`, `one with two of the same says so (${await notice()})`);
await draw(t.solucion[0]); await sleep(80);
ok(await plots() === 1 && await ev(`!!document.querySelector('#lt-tablero .lt-lote').style.getPropertyValue('--c')`), 'a valid one is painted in its color');
await b.shot('02-game-utilities');

// With the engine's solution all five get solved
for (let n = 0; n < ETAPAS_SERVICIOS.length; n++) {
  const tt = day.tableros[n];
  ok(await waitFor(`window.__loteo.P.etapa === ${n} && !document.querySelector('#lt-tablero.bloqueado') && document.querySelectorAll('#lt-tablero .lt-num').length === ${tt.lado * tt.lado} && document.getElementById('lt-tam')?.textContent === 'Lotes de ${tt.tam} casillas'`, 5000), `board ${n + 1} is ${tt.lado}×${tt.lado}, in plots of ${tt.tam}`);
  // On reaching the hard ones, the notice says how to think about them (the owner's request)
  if (n === 2) ok(/Difíciles: si un lote deja una casilla sin lote posible/.test(await notice()), 'board 3 warns the hard ones are coming and how to think about them');
  if (n === 3) ok(!/Difíciles:/.test(await notice()), 'and only on reaching them');
  if (n === 4) { await sleep(300); await b.shot('03-board-hard'); }
  for (const r of tt.solucion) { await draw(r); await sleep(25); }
  ok(await waitFor(`/listo/.test(document.getElementById('lt-aviso')?.textContent || '') || !!document.getElementById('btn-fin')`, 2000), `board ${n + 1} solved`);
}
ok(await waitFor(`!!document.getElementById('btn-fin')`, 3000) && /Todo loteado/.test(await ev(`document.getElementById('lt-sello').textContent`)), '«¡Todo loteado!» and See result');
await b.shot('04-all-done');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`!!document.querySelector('#resultado-body .score-big')`, 4000), 'the result');
const lines = await ev(`[...document.querySelectorAll('#explicacion li')].map(l => l.textContent)`);
const speed = /^⏱ Rapidez \((\d+):(\d\d)\): \+(\d+)\.$/.exec(lines[1] || '') || [];
const secs = +speed[1] * 60 + +speed[2], bonus = +speed[3];
ok(lines[0] === '📐 Tableros (5 de 5): +60.' && speed.length > 0, `the breakdown (${lines.join(' | ')})`);
ok(Math.abs(60 + bonus - puntajePartida(5, secs, 0).total) <= 1 && await ev(`document.querySelector('#resultado-body .score-big').textContent`) === `${60 + bonus}/100`, `the score is the engine's: ${60 + bonus}/100 in ${secs} s`);
ok(/✅ 6×6  ✅ 6×6  ✅ 6×6  ✅ 8×8  ✅ 8×8/.test(await ev(`document.getElementById('resultado-body').textContent`)), 'the card shows the variant\'s boards');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `no sideways scroll at ${WIDTH} px`);
await b.shot('05-result-utilities');
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ loteo (utilities)');

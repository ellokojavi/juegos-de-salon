// Artilugio in the lab end to end, at /labs/contraption/: the lab offers it under Active projects with its
// credit; the cover has the tagline, the credit, «Cómo se juega», the language toggle, the levels (1 open,
// the rest locked) and a yellow Jugar; Jugar opens level 1's board with its tray; Probar with no parts ends
// on the spikes and says so; a ramp placed by real taps on the board (pick it in the tray, tap a cell),
// turned and moved, solves it: «¡Funciona!» with 3 stars; the next level opens and level 2 is unlocked on
// the cover; in English the cover is in English; at 320 px no sideways scroll. Prints ✗ if anything fails.
import fs from 'node:fs';
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/contraption-lab');
fs.rmSync(`${OUT}/p`, { recursive: true, force: true }); fs.rmSync(`${OUT}/p320`, { recursive: true, force: true });   // a fresh phone: no stars, Spanish
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 390, height: 844 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
// A tap on a cell of the board, as a finger would
const TAP = (c, r) => /* a tap in the middle of a cell, as a finger */ `(() => { const k = document.getElementById('lienzo'), b = k.getBoundingClientRect();
  const o = { bubbles: true, cancelable: true, pointerId: 9, pointerType: 'touch', clientX: b.left + (${c} + 0.5) * b.width / 8, clientY: b.top + (${r} + 0.5) * b.height / 11 };
  k.dispatchEvent(new PointerEvent('pointerdown', o)); k.dispatchEvent(new PointerEvent('pointerup', o)); return 1; })()`;

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-artilugio #btn-artilugio')?.getAttribute('href')`) === 'contraption/', 'the lab offers Artilugio under Active projects');
ok(/The Incredible Machine/.test(await ev(`document.getElementById('seccion-artilugio')?.textContent || ''`)), 'and names the game it is like');

await b.go(`${SITE}/labs/contraption/?test`, 1000);
ok(await waitFor(`!!document.getElementById('btn-jugar')?.textContent`), 'the cover has Jugar');
ok(/Arma la máquina/.test(await ev(`document.getElementById('lema').textContent`)), 'the tagline');
ok(/The Incredible Machine/.test(await ev(`document.getElementById('credito').textContent`)) && /wikipedia/.test(await ev(`document.getElementById('link-tim')?.href || ''`)), 'the credit, with its link');
ok(await ev(`document.querySelectorAll('#pasos li').length`) === 3, 'three steps under «Cómo se juega»');
ok(await ev(`document.getElementById('progreso')?.textContent`) === 'Nivel 1' && /Aprendiendo/.test(await ev(`document.getElementById('niveles').textContent`)), 'the run: «Nivel 1», learning');
ok(await ev(`!!(document.getElementById('lang-slot').compareDocumentPosition(document.getElementById('btn-jugar')) & Node.DOCUMENT_POSITION_FOLLOWING)`), 'the language toggle comes before Jugar (C-5)');
ok(await ev(`(() => { const r = document.getElementById('btn-jugar').getBoundingClientRect(); return r.bottom <= innerHeight; })()`), 'Jugar in the first screen');
await b.shot('01-cover');

await ev(`document.getElementById('btn-jugar').click(); 1`);
ok(await waitFor(`document.getElementById('s-juego').classList.contains('active')`), 'Jugar opens the board');
ok(await ev(`document.getElementById('nivel').textContent`) === 'Nivel 1', 'level 1');
ok(await ev(`document.querySelector('#bandeja [data-pieza="ramp"]')?.textContent.includes('×1')`), 'the tray: one ramp');
ok(await ev(`(() => { const r = document.getElementById('btn-probar').getBoundingClientRect(); return r.bottom <= innerHeight; })()`), 'Probar in view with the board');
await ev(`document.getElementById('btn-probar').click(); 1`);
ok(await waitFor(`/Pinchazo/.test(document.getElementById('mensaje').textContent)`, 6000), 'with no parts the ball ends on the spikes, and it says so');
// Past the basket, down to the floor: it blows up, and only then it says the stage failed
await ev(`document.getElementById('btn-probar').click(); __artilugio.run.ball.x = 7.5; 1`);
ok(await waitFor(`__artilugio.run?.state === 'boom'`, 4000), 'a ball that touches the bottom blows up');
ok(await ev(`document.getElementById('mensaje').textContent`) === '', 'the explosion plays out first, with no verdict yet');
await sleep(250); await b.shot('02-boom');
ok(await waitFor(`/Bum/.test(document.getElementById('mensaje').textContent)`, 3000), 'then «¡Bum! 💥 Tocó el fondo»');

// Real drags, as a mouse makes them: press, a few moves, let go (x, y in cells of the board; null = off the board)
const DRAG = (from, to) => `(async () => {
  const k = document.getElementById('lienzo'), b = k.getBoundingClientRect(), w = t => new Promise(r => setTimeout(r, t));
  const at = p => p ? [b.left + p[0] * b.width / 8, b.top + p[1] * b.height / 11] : [b.right + 60, b.top + 40];
  const src = typeof ${JSON.stringify(from)} === 'string' ? document.querySelector(${JSON.stringify(from)}) : k;
  const [x0, y0] = typeof ${JSON.stringify(from)} === 'string' ? (r => [r.left + r.width / 2, r.top + r.height / 2])(src.getBoundingClientRect()) : at(${JSON.stringify(from)});
  const [x1, y1] = at(${JSON.stringify(to)}), o = { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'mouse' };
  src.dispatchEvent(new PointerEvent('pointerdown', { ...o, clientX: x0, clientY: y0 }));
  for (let i = 1; i <= 8; i++) { (document.elementFromPoint(x0 + (x1 - x0) * i / 8, y0 + (y1 - y0) * i / 8) || document.body).dispatchEvent(new PointerEvent('pointermove', { ...o, clientX: x0 + (x1 - x0) * i / 8, clientY: y0 + (y1 - y0) * i / 8 })); await w(16); }
  document.body.dispatchEvent(new PointerEvent('pointerup', { ...o, clientX: x1, clientY: y1 }));
  return 1; })()`;
const PART = `JSON.stringify(__artilugio.board.placed.map(p => [p.c, p.r, p.dir]))`;

await ev(DRAG('#bandeja [data-pieza="ramp"]', [3, 3.5]));
ok(await ev(PART) === '[[2,3,1]]' && await ev(`document.querySelector('#bandeja [data-pieza="ramp"]').disabled`), 'dragging the ramp from the tray places it where it is let go, and the tray is empty');
await ev(TAP(2, 3)); await sleep(100);
ok(await ev(PART) === '[[2,3,-1]]', 'one tap on it turns it round');
ok(!await ev(`document.getElementById('btn-quitar').hidden`) && !await ev(`document.getElementById('btn-girar').hidden`), 'and it shows Girar and Quitar');
await ev(TAP(2, 3)); await sleep(100);
ok(await ev(PART) === '[[2,3,1]]', 'another tap turns it back');
await ev(DRAG([2.5, 3.5], [1, 4.5]));
ok(await ev(PART) === '[[0,4,1]]', 'dragging it moves it, snapped to the grid');
await ev(`document.getElementById('btn-deshacer').click(); 1`);
ok(await ev(PART) === '[[2,3,1]]', 'Deshacer puts it back where it was');
await ev(DRAG([2.5, 3.5], null));
ok(await ev(PART) === '[]' && await ev(`document.querySelector('#bandeja [data-pieza="ramp"]').textContent.includes('×1')`), 'dropped off the board, it goes back to the tray');
await ev(`document.getElementById('btn-deshacer').click(); 1`);
await ev(DRAG([2.5, 3.5], [1, 4.5]));
ok(await ev(PART) === '[[0,4,1]]', 'undone and dragged again');
await b.shot('02-board');
await ev(`document.getElementById('btn-probar').click(); 1`);
ok(await waitFor(`!document.getElementById('resultado').hidden`, 8000), 'Probar: the ball runs into the basket');
ok(await ev(`document.getElementById('res-titulo').textContent`) === '¡Funciona!' && await ev(`document.getElementById('res-estrellas').textContent`) === '★★★', '«¡Funciona!» with three stars');
ok(await ev(`document.querySelector('#res-salidas a')?.getAttribute('href')`) === '../../labs/', 'and the way back to the lab');
await b.shot('03-won');
await ev(`document.getElementById('btn-siguiente').click(); 1`);
ok(await waitFor(`document.getElementById('nivel').textContent === 'Nivel 2'`), 'Siguiente opens level 2');

await b.go(`${SITE}/labs/contraption/?lang=en&test`, 1000);
ok(await waitFor(`/Build the machine/.test(document.getElementById('lema').textContent)`), 'in English, the cover is in English');
ok(await ev(`document.getElementById('progreso')?.textContent`) === 'Level 2' && /★ 3/.test(await ev(`document.getElementById('estrellas-total')?.textContent || ''`)), 'the run and its stars are kept: Level 2, ★ 3');
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();

const s = await launch({ dir: `${OUT}/p320`, out: OUT, width: 320, height: 568 });
await s.go(`${SITE}/labs/contraption/?test`, 1000);
ok(await s.evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll at 320 px');
await s.evaluate(`document.getElementById('btn-jugar').click(); 1`); await sleep(500);
ok(await s.evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'nor on the board');
await s.shot('04-board-320');
// Further on: a level dealt at random from its tier, and 🎲 Otro deals another of the same difficulty
await s.evaluate(`localStorage.setItem('juegos-de-salon:artilugio', JSON.stringify({ n: 9, stars: {}, seen: [], id: null })); 1`);
await s.go(`${SITE}/labs/contraption/?test`, 1000);
ok(await s.evaluate(`document.getElementById('progreso')?.textContent`) === 'Nivel 9', 'the cover picks the run up at Nivel 9');
await s.evaluate(`document.getElementById('btn-jugar').click(); 1`); await sleep(400);
const first = await s.evaluate(`__artilugio.level.id`);
ok(/^t2-/.test(first) && await s.evaluate(`document.getElementById('dificultad').textContent`) === 'Fácil +', `level 9 is dealt from the second tier (${first}), «Fácil +»`);
ok(!await s.evaluate(`document.getElementById('btn-otro').hidden`), '🎲 Otro is offered');
await s.evaluate(`document.getElementById('btn-otro').click(); 1`); await sleep(300);
const second = await s.evaluate(`__artilugio.level.id`);
ok(second !== first && /^t2-/.test(second) && await s.evaluate(`document.getElementById('nivel').textContent`) === 'Nivel 9', `🎲 Otro deals another of the same tier (${second}), still Nivel 9`);
await s.shot('06-dealt-320');
ok(!s.errors.length, `no errors at 320 px ${JSON.stringify(s.errors)}`);
s.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ artilugio (labs)');

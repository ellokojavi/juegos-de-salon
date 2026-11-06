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
const TAP = (c, r) => `(() => { const k = document.getElementById('lienzo'), b = k.getBoundingClientRect();
  k.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: b.left + (${c} + 0.5) * b.width / 8, clientY: b.top + (${r} + 0.5) * b.height / 11 })); return 1; })()`;

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-artilugio #btn-artilugio')?.getAttribute('href')`) === 'contraption/', 'the lab offers Artilugio under Active projects');
ok(/The Incredible Machine/.test(await ev(`document.getElementById('seccion-artilugio')?.textContent || ''`)), 'and names the game it is like');

await b.go(`${SITE}/labs/contraption/?test`, 1000);
ok(await waitFor(`!!document.getElementById('btn-jugar')?.textContent`), 'the cover has Jugar');
ok(/Arma la máquina/.test(await ev(`document.getElementById('lema').textContent`)), 'the tagline');
ok(/The Incredible Machine/.test(await ev(`document.getElementById('credito').textContent`)) && /wikipedia/.test(await ev(`document.getElementById('link-tim')?.href || ''`)), 'the credit, with its link');
ok(await ev(`document.querySelectorAll('#pasos li').length`) === 3, 'three steps under «Cómo se juega»');
ok(await ev(`document.querySelectorAll('#niveles button').length`) === 6 && await ev(`document.querySelectorAll('#niveles button:disabled').length`) === 5, 'six levels, the first open');
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

await ev(`document.querySelector('#bandeja [data-pieza="ramp"]').click(); 1`);
await ev(TAP(2, 2));
ok(await ev(`__artilugio.board.placed.length`) === 1 && await ev(`document.querySelector('#bandeja [data-pieza="ramp"]').disabled`), 'a tap on the board places the ramp, and the tray is empty');
ok(!await ev(`document.getElementById('acciones-pieza').hidden`), 'the placed part shows Girar and Quitar');
await ev(`document.getElementById('btn-girar').click(); 1`);
ok(await ev(`__artilugio.board.placed[0].dir`) === -1, 'Girar turns it');
await ev(`document.getElementById('btn-girar').click(); 1`);
await ev(TAP(0, 4));
ok(await ev(`__artilugio.board.placed[0].c === 0 && __artilugio.board.placed[0].r === 4`), 'a tap on another cell moves it');
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
ok(await ev(`document.querySelector('#niveles button[data-nivel="1"]').textContent.includes('★★★') && !document.querySelector('#niveles button[data-nivel="2"]').disabled`), 'the stars are kept and level 2 is open');
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();

const s = await launch({ dir: `${OUT}/p320`, out: OUT, width: 320, height: 568 });
await s.go(`${SITE}/labs/contraption/?test`, 1000);
ok(await s.evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll at 320 px');
await s.evaluate(`document.getElementById('btn-jugar').click(); 1`); await sleep(500);
ok(await s.evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'nor on the board');
await s.shot('04-board-320');
ok(!s.errors.length, `no errors at 320 px ${JSON.stringify(s.errors)}`);
s.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ artilugio (labs)');

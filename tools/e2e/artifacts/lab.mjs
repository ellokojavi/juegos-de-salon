// Artefactos in the lab end to end, at /labs/artifacts/: the lab offers it with its credit; the cover has
// the tagline, the credit, «Cómo se juega» (four steps), the language toggle, the format (5 etapas · 6:00)
// and a yellow Jugar in the first screen; Jugar starts stage 1 of 5 with its difficulty, the five dots and
// the clock running; Probar with no parts fails and says so; the tray, one-tap turning, dragging to move,
// Deshacer and dropping off the board work by real drags; each of the five stages is solved with its
// known answer, placed by drags: a summary per stage that stops the clock, then the next stage, harder;
// after the fifth, the result: the total, a row per stage, the speed and the total, «Jugar otra vez» and
// the way back to the lab; the best is kept; in English the cover is in English; at 320 px no sideways
// scroll, and a game whose clock runs out ends with «¡Se acabó el tiempo!». Prints ✗ if anything fails.
import fs from 'node:fs';
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/artifacts-lab');
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
ok(await ev(`document.querySelector('#activos #seccion-artifacts #btn-artifacts')?.getAttribute('href')`) === 'artifacts/', 'the lab offers Artefactos under Active projects');
ok(/The Incredible Machine/.test(await ev(`document.getElementById('seccion-artifacts')?.textContent || ''`)), 'and names the game it is like');
ok(await ev(`document.querySelector('#seccion-artifacts h2')?.textContent`) === '⚙️ Artefactos', 'its card is called Artefactos');

await b.go(`${SITE}/labs/artifacts/?test`, 1000);
ok(await waitFor(`!!document.getElementById('btn-jugar')?.textContent`), 'the cover has Jugar');
ok(await ev(`document.querySelector('h1').textContent`) === 'Artefactos' && /^Artefactos/.test(await ev(`document.title`)), 'the title: Artefactos');
ok(/Arma la máquina/.test(await ev(`document.getElementById('lema').textContent`)), 'the tagline');
ok(/The Incredible Machine/.test(await ev(`document.getElementById('credito').textContent`)) && /wikipedia/.test(await ev(`document.getElementById('link-tim')?.href || ''`)), 'the credit, with its link');
ok(await ev(`document.querySelectorAll('#pasos li').length`) === 4, 'four steps under «Cómo se juega»');
ok(await ev(`document.getElementById('formato')?.textContent`) === '5 etapas · 6:00', 'the format: «5 etapas · 6:00»');
ok(await ev(`!!(document.getElementById('lang-slot').compareDocumentPosition(document.getElementById('btn-jugar')) & Node.DOCUMENT_POSITION_FOLLOWING)`), 'the language toggle comes before Jugar (C-5)');
ok(await ev(`(() => { const r = document.getElementById('btn-jugar').getBoundingClientRect(); return r.bottom <= innerHeight; })()`), 'Jugar in the first screen');
await b.shot('01-cover');

await ev(`document.getElementById('btn-jugar').click(); 1`);
ok(await waitFor(`document.getElementById('s-juego').classList.contains('active')`), 'Jugar opens the board');
ok(await ev(`document.getElementById('nivel').textContent`) === 'Etapa 1 de 5' && await ev(`document.getElementById('dificultad').textContent`) === 'Fácil', '«Etapa 1 de 5», Fácil');
ok(await ev(`document.querySelectorAll('#etapas span').length`) === 5 && await ev(`document.querySelectorAll('#etapas .ahora').length`) === 1, 'the five stages as dots, the first one lit');
const c0 = await ev(`__artifacts.game.left`); await sleep(1300);
ok(await ev(`__artifacts.game.left`) < c0 - 900 && /^[56]:\d\d$/.test(await ev(`document.getElementById('reloj').textContent`)), `the clock runs (${await ev(`document.getElementById('reloj').textContent`)})`);
ok(await ev(`(() => { const r = document.getElementById('btn-probar').getBoundingClientRect(); return r.bottom <= innerHeight; })()`), 'Probar in view with the board');
await ev(`document.getElementById('btn-probar').click(); 1`);
ok(await waitFor(`/Prueba otra cosa/.test(document.getElementById('mensaje').textContent)`, 8000), 'with no parts the ball does not make it, and it says why');

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
const PART = `JSON.stringify(__artifacts.board.placed.map(p => [p.c, p.r, p.dir]))`;

// The parts by hand on stage 1: drag from the tray, one tap turns, drag to move, Deshacer, drop off to remove
const sol1 = await ev(`JSON.stringify(__artifacts.level.solution)`).then(JSON.parse);
const t1 = sol1[0].type;
await ev(DRAG(`#bandeja [data-pieza="${t1}"]`, [3, 3.5]));
ok(await ev(`__artifacts.board.placed.length`) === 1 && await ev(PART).then(p => JSON.parse(p)[0].slice(0, 2).join()) === '2,3', 'dragging a part from the tray places it where it is let go');
const d0 = await ev(`__artifacts.board.placed[0].dir`);
await ev(TAP(2, 3)); await sleep(100);
ok(t1 !== 'ramp' && t1 !== 'fan' || await ev(`__artifacts.board.placed[0].dir`) === -d0, 'one tap on a ramp or a fan turns it round');
await ev(DRAG([2.5, 3.5], [1, 4.5]));
ok(await ev(PART).then(p => JSON.parse(p)[0].slice(0, 2).join()) === '0,4', 'dragging it moves it, snapped to the grid');
await ev(`document.getElementById('btn-deshacer').click(); 1`);
ok(await ev(PART).then(p => JSON.parse(p)[0].slice(0, 2).join()) === '2,3', 'Deshacer puts it back');
await ev(DRAG([2.5, 3.5], null));
ok(await ev(`__artifacts.board.placed.length`) === 0, 'dropped off the board, it goes back to the tray');
await b.shot('02-board');

// The five stages, each with its known answer placed by drags (and a tap to turn what faces left)
const PLAY = async () => {
  const sol = await ev(`JSON.stringify(__artifacts.level.solution)`).then(JSON.parse);
  for (const p of sol) {
    await ev(DRAG(`#bandeja [data-pieza="${p.type}"]`, [p.c + 1, p.r + 0.5]));
    if ((p.dir ?? 1) === -1) { await ev(TAP(p.c, p.r)); await sleep(80); }
  }
  const got = await ev(`JSON.stringify(__artifacts.board.placed.map(p => [p.type, p.c, p.r, p.type === 'ramp' || p.type === 'fan' ? p.dir : 1]).sort())`);
  const want = JSON.stringify(sol.map(p => [p.type, p.c, p.r, p.type === 'ramp' || p.type === 'fan' ? p.dir ?? 1 : 1]).sort());
  await ev(`document.getElementById('btn-probar').click(); 1`);
  return got === want;
};
const DIFF = ['Fácil', 'Fácil +', 'Medio', 'Difícil', 'Experto'];
for (let i = 0; i < 5; i++) {
  ok(await ev(`document.getElementById('nivel').textContent`) === `Etapa ${i + 1} de 5` && await ev(`document.getElementById('dificultad').textContent`) === DIFF[i], `stage ${i + 1}: ${DIFF[i]}`);
  ok(await PLAY(), `stage ${i + 1}: its answer placed by drags`);
  ok(await waitFor(`!document.getElementById('resultado').hidden`, 15000), `stage ${i + 1}: the ball rests in the basket`);
  ok(await ev(`document.getElementById('res-titulo').textContent`) === `¡Etapa ${i + 1} superada!` && await ev(`document.getElementById('res-estrellas').textContent`) === '★★★', `«¡Etapa ${i + 1} superada!» with three stars`);
  if (i === 0) {
    const t = await ev(`__artifacts.game.left`); await sleep(1200);
    ok(await ev(`__artifacts.game.left`) === t, 'the summary stops the clock');
    await b.shot('03-stage');
  }
  ok(await ev(`document.getElementById('btn-siguiente').textContent`) === (i < 4 ? 'Siguiente etapa ›' : 'Ver el resultado ›'), i < 4 ? '«Siguiente etapa ›»' : '«Ver el resultado ›» after the fifth');
  await ev(`document.getElementById('btn-siguiente').click(); 1`); await sleep(200);
}
ok(await waitFor(`document.getElementById('s-fin').classList.contains('active')`), 'the result');
const total = +await ev(`document.getElementById('fin-puntos').textContent`);
ok(total >= 75 && total <= 85, `the total: 5 × (10 + 5) plus speed (${total})`);
ok(await ev(`document.querySelectorAll('#fin-tabla tbody tr').length`) === 7 && /Rapidez/.test(await ev(`document.getElementById('fin-tabla').textContent`)), 'a row per stage, the speed and the total');
ok(/Nuevo récord/.test(await ev(`document.getElementById('fin-sello').textContent`)), 'a first game is a new best');
ok(await ev(`document.getElementById('btn-otra').textContent`) === 'Jugar otra vez' && await ev(`document.querySelector('#fin-salidas a')?.getAttribute('href')`) === '../../labs/', 'Jugar otra vez, and the way back to the lab');
await b.shot('04-result');
const day = await ev(`JSON.stringify(__artifacts.game.stages.map(l => l.id))`);
await ev(`document.getElementById('btn-otra').click(); 1`);
ok(await waitFor(`document.getElementById('nivel').textContent === 'Etapa 1 de 5'`) && await ev(`JSON.stringify(__artifacts.game.stages.map(l => l.id))`) !== day, 'Jugar otra vez: a new game, five other stages');

await b.go(`${SITE}/labs/artifacts/?lang=en&test`, 1000);
ok(await waitFor(`/Build the machine/.test(document.getElementById('lema').textContent)`), 'in English, the cover is in English');
ok(new RegExp(`Best: ${total}`).test(await ev(`document.getElementById('mejor')?.textContent || ''`)), 'and the best is kept');
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();

const s = await launch({ dir: `${OUT}/p320`, out: OUT, width: 320, height: 568 });
await s.go(`${SITE}/labs/artifacts/?test`, 1000);
ok(await s.evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll at 320 px');
await s.evaluate(`document.getElementById('btn-jugar').click(); 1`); await sleep(500);
ok(await s.evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'nor on the board');
await s.shot('05-board-320');
// The clock runs out: the game ends where it is
await s.evaluate(`__artifacts.game.left = 1200; 1`);
ok(await (async () => { for (let t = 0; t < 5000; t += 100) { if (await s.evaluate(`document.getElementById('s-fin').classList.contains('active')`)) return true; await sleep(100); } return false; })(), 'at 0:00 the game ends');
ok(/Se acabó el tiempo/.test(await s.evaluate(`document.getElementById('fin-sello').textContent`)) && await s.evaluate(`document.getElementById('fin-puntos').textContent`) === '0', '«¡Se acabó el tiempo!», 0 points');
await s.shot('06-time-320');
ok(!s.errors.length, `no errors at 320 px ${JSON.stringify(s.errors)}`);
s.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ artefactos (labs)');

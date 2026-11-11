// #️⃣ Sudoku, out of the lab (D-517's way), end to end at its standalone page /sudoku/: the waiting room
// with the drawn icon, the demo board solving itself and the level lever; Empezar through the countdown to
// the 6×6 board; a wrong digit in red costs 10, a hint fills a cell (−15), the board filled through the hook
// ends the game, and «Ver resultado» gives the score with its breakdown and share card. Then the lever up:
// the 9×9 board, the red-violet page, and giving up (0 points, the solution shown). The languages: the
// waiting room in en and pt. At 320 px nothing scrolls sideways. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/sudoku-page');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const noSideScroll = () => ev(`document.documentElement.scrollWidth <= innerWidth`);
const P = `window.__sudoku`;
const S = `${P}.state()`;

// Until its launch (flags/sudoku), the page sends a visitor home: the phone's copy of the flags says it is out
await b.go(`${SITE}/sudoku/?test`, 800);
await ev(`localStorage.setItem('juegos-de-salon:flags', JSON.stringify({ ...JSON.parse(localStorage.getItem('juegos-de-salon:flags') || '{}'), sudoku: { state: 'all' } })); 1`);

// The waiting room, easy
await b.go(`${SITE}/sudoku/?test&lang=es`, 1500);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the waiting room has Empezar');
ok(await waitFor(`!!document.querySelector('.sd-portada .sd-logo') && document.querySelectorAll('.sd-demo .sd-dcell').length === 36`), 'with the drawn icon and the 6×6 demo board');
const cap0 = await ev(`document.getElementById('sd-demo-caption').textContent`);
await sleep(2100);
ok(await ev(`document.getElementById('sd-demo-caption').textContent`) !== cap0, 'the demo goes on by itself');
ok(await ev(`document.getElementById('btn-level')?.getAttribute('aria-checked') === 'false'`), 'the lever starts on easy');
ok(await ev(`!document.body.classList.contains('sd-hard')`), 'and the page is the usual night');
ok(await noSideScroll(), 'no sideways scroll in the waiting room');
await b.shot('01-lobby');

// The game, easy
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!document.getElementById('sd-board') && !document.getElementById('cuenta') && !!${P}`, 9000), 'Empezar opens the board after the countdown');
ok(await ev(`document.querySelectorAll('#sd-board .sd-cell').length === 36 && document.querySelectorAll('#sd-pad .sd-key').length === 6`), 'a 6×6 board and a pad of 6');
ok(/100/.test(await ev(`document.getElementById('sd-puntos').textContent`)), 'the score starts at 100');
const i = await ev(`${S}.cells.findIndex(d => !d)`);
const wrong = await ev(`(${S}.solution[${i}] % 6) + 1`);
await ev(`document.querySelector('#sd-board .sd-cell[data-i="${i}"]').click(); document.getElementById('sd-key-${wrong}').click(); 1`);
ok(await ev(`document.querySelector('#sd-board .sd-cell[data-i="${i}"]').classList.contains('bad')`), 'a wrong digit turns red');
ok(/90/.test(await ev(`document.getElementById('sd-puntos').textContent`)) && /−10/.test(await ev(`document.getElementById('sd-line').textContent`)), 'and costs 10');
await ev(`document.getElementById('btn-hint').click(); 1`);
ok(/¿Seguro\?/.test(await ev(`document.getElementById('btn-hint').textContent`)), 'the hint asks twice');
await ev(`document.getElementById('btn-hint').click(); 1`);
ok(await waitFor(`${S}.hints === 1 && ${S}.cells[${i}] === ${S}.solution[${i}]`, 2000), 'the second tap fills the selected cell');
ok(/75/.test(await ev(`document.getElementById('sd-puntos').textContent`)), 'at 15 points');
await b.shot('02-game');
await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true }); await sleep(300);
ok(await noSideScroll(), 'no sideways scroll in the game at 320 px');
await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
await ev(`${P}.solveAllBut(0); 1`);
ok(await waitFor(`!!document.getElementById('btn-fin')`, 3000), 'the full board ends the game');
ok(/¡Resuelto!/.test(await ev(`document.getElementById('sd-sello').textContent`)), 'and says it is solved');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`/75/.test(document.querySelector('#screen-resultado.active .score-big')?.textContent || '')`, 5000), 'the result: 75 points');
ok(/mal puesto/.test(await ev(`document.getElementById('explicacion')?.textContent || ''`)), 'the breakdown counts the wrong digit');
ok(/🟢 6×6/u.test(await ev(`document.querySelector('#screen-resultado pre.tarjeta')?.textContent || ''`)), 'the share card says the board');
ok(await noSideScroll(), 'no sideways scroll in the result');
await b.shot('03-result');

// Hard: the lever up, the 9×9 board, the page red-violet, and giving up
await b.go(`${SITE}/sudoku/?test&lang=es`, 1500);
await waitFor(`!!document.getElementById('btn-level')`);
await ev(`document.getElementById('btn-level').click(); 1`);
ok(await waitFor(`document.getElementById('btn-level')?.getAttribute('aria-checked') === 'true' && document.querySelectorAll('.sd-demo .sd-dcell').length === 81`), 'the lever up turns to hard: the 9×9 demo');
ok(await waitFor(`document.body.classList.contains('sd-hard')`, 2000), 'and the page red-violet');
await b.shot('04-lobby-hard');
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!document.getElementById('sd-board') && !document.getElementById('cuenta') && document.querySelectorAll('#sd-board .sd-cell').length === 81`, 9000), 'hard plays a 9×9 board');
await ev(`document.getElementById('btn-give-up').click(); document.getElementById('btn-give-up').click(); 1`);
ok(await waitFor(`!!document.getElementById('btn-fin') && /Te rendiste/.test(document.getElementById('sd-sello').textContent)`, 3000), 'giving up asks twice and ends the game');
ok(await ev(`[...document.querySelectorAll('#sd-board .sd-cell')].every(c => c.textContent)`), 'showing the solution');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`/^0/.test(document.querySelector('#screen-resultado.active .score-big')?.textContent || '')`, 5000), 'given up, 0 points');

// The languages
for (const [lang, start] of [['en', /Start/], ['pt', /Começar/]]) {
  await b.go(`${SITE}/sudoku/?test&lang=${lang}`, 1500);
  ok(await waitFor(`!!document.getElementById('btn-empezar')`), `${lang}: the waiting room`);
  ok(start.test(await ev(`document.getElementById('btn-empezar').textContent`)), `${lang}: Empezar in ${lang}`);
  ok(/mode|Modo/.test(await ev(`document.getElementById('btn-level').textContent`)), `${lang}: the lever in ${lang}`);
  await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true }); await sleep(300);
  ok(await noSideScroll(), `${lang}: no sideways scroll at 320 px`);
  await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
}

ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ sudoku/page.mjs');

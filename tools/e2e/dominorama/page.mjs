// 🎲 Dominorama, out of the lab (D-517's way), end to end at its standalone page /dominorama/: without its
// flag the page sends a visitor home; with it, the waiting room with the swaying domino, the credit to NYT's
// Pips and the demo board; Empezar through the countdown to board 1 of 3; a domino chosen with a tap and laid
// on a cell, the help (asks twice, −10), the three boards solved through the hook, «Ver resultado» with the
// score, its breakdown and the share card; giving up (asks twice). The languages: the waiting room and the
// board in en and pt. At 320 px nothing scrolls sideways. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/dominorama-page');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 390, height: 844 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const noSideScroll = () => ev(`document.documentElement.scrollWidth <= innerWidth`);
const P = `window.__dominorama`;
const narrow = async () => { await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true }); await sleep(300); };
const wide = () => b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
const setFlag = state => ev(`localStorage.setItem('juegos-de-salon:flags', JSON.stringify({ ...JSON.parse(localStorage.getItem('juegos-de-salon:flags') || '{}'), dominorama: { state: '${state}' } })); 1`);

// Until its launch (flags/dominorama) the page sends a visitor home: the phone's copy of the flags says it is out
// (the shared LANZA path in cup/game.js, the same as Sudoku's)
await b.go(`${SITE}/dominorama/?test`, 800);
await setFlag('all');
await b.go(`${SITE}/dominorama/?test&lang=es`, 1500);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the waiting room has Empezar');
ok(await waitFor(`!!document.querySelector('.dm-titulo .dm-logo') && !!document.querySelector('.dm-demo .dm-board')`), 'with the domino by the name and the demo board');
ok(await ev(`/Pips/.test(document.getElementById('link-nyt')?.textContent || '') && /nytimes\\.com\\/games\\/pips/.test(document.getElementById('link-nyt').href) && /New York Times/.test(document.getElementById('dm-credito').textContent)`), 'and the credit to NYT\'s Pips');
ok(await waitFor(`document.querySelectorAll('.dm-demo .dm-puesta').length > 0`, 4000), 'the demo lays its dominoes by itself');
ok(await noSideScroll(), 'no sideways scroll in the waiting room');
await b.shot('01-lobby');
await narrow();
ok(await noSideScroll(), 'nor at 320 px');
await b.shot('01-lobby-320');
await wide();

// The game
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!document.getElementById('dm-tablero') && !document.getElementById('cuenta') && !!${P}`, 9000), 'Empezar opens board 1 after the countdown');
ok(/Tablero 1 de 3 · fácil/.test(await ev(`document.getElementById('dm-marcador').textContent`)), 'the heading says board 1 of 3, easy');
ok(await ev(`document.querySelectorAll('#dm-bandeja .dm-ficha').length === 4`), 'with 4 dominoes in the tray');
// A tap chooses (and turns) a domino; a tap on a cell lays it there if it fits
await ev(`document.querySelector('#dm-bandeja .dm-ficha[data-f="0"]').click(); 1`);
ok(await ev(`document.querySelector('#dm-bandeja .dm-ficha[data-f="0"]').classList.contains('sel')`), 'a tap chooses a domino');
const placed = await ev(`(() => { for (const c of document.querySelectorAll('#dm-tablero .dm-celda')) { c.click(); if (document.querySelector('#dm-tablero .dm-puesta[data-f="0"]')) return true; } return false; })()`);
ok(placed, 'and a tap on a cell lays it');
ok(await ev(`${P}.state().puestas.filter(Boolean).length === 1`), 'the laid domino is saved');
ok(await ev(`[...document.querySelectorAll('#dm-tablero .dm-puesta .dm-mitad')].every(m => { const r = m.getBoundingClientRect(); return Math.abs(r.width - r.height) < 1; })`), 'a laid domino is two squares, not stretched');
await ev(`document.getElementById('btn-ayuda').click(); 1`);
ok(/Toca de nuevo/.test(await ev(`document.getElementById('btn-ayuda').textContent`)), 'the help asks twice');
await ev(`document.getElementById('btn-ayuda').click(); 1`);
ok(await waitFor(`${P}.state().ayudas === 1 && !!document.querySelector('#dm-tablero .dm-puesta.pista')`, 2000), 'the second tap lays one domino of the solution');
ok(await noSideScroll(), 'no sideways scroll in the game');
await b.shot('02-game');
await narrow();
ok(await noSideScroll(), 'nor at 320 px');
await b.shot('02-game-320');
await wide();
for (const [k, nivel] of [[1, 'medio'], [2, 'difícil']]) {
  await ev(`${P}.solveBoard(); 1`);
  ok(await waitFor(`${P}.state().k === ${k} && new RegExp('Tablero ${k + 1} de 3 · ${nivel}').test(document.getElementById('dm-marcador')?.textContent || '')`, 5000), `board ${k} solved, board ${k + 1} (${nivel}) comes`);
}
await ev(`${P}.solveBoard(); 1`);
ok(await waitFor(`!!document.getElementById('btn-fin')`, 5000), 'the third board ends the game');
ok(/Los tres/.test(await ev(`document.getElementById('dm-sello').textContent`)), 'and says all three');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`!!document.querySelector('#screen-resultado.active .score-big')`, 5000), 'the result');
const score = await ev(`parseInt(document.querySelector('#screen-resultado.active .score-big').textContent, 10)`);
ok(score === 90, `quick with one help: 100 − 10 = 90 (${score})`);
ok(/1 ayuda/.test(await ev(`document.getElementById('explicacion')?.textContent || ''`)), 'the breakdown counts the help');
ok(/✅✅✅ 3\/3 · 💡 1/u.test(await ev(`document.querySelector('#screen-resultado pre.tarjeta')?.textContent || ''`)), 'the share card has the three marks and the help');
ok(await noSideScroll(), 'no sideways scroll in the result');
await b.shot('03-result');

// Giving up
await b.go(`${SITE}/dominorama/?test&lang=es&seed=RENDIRSE`, 1500);
await waitFor(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
await waitFor(`!!document.getElementById('dm-tablero') && !document.getElementById('cuenta')`, 9000);
await ev(`document.getElementById('btn-rendirse').click(); 1`);
ok(/¿Seguro\?/.test(await ev(`document.getElementById('btn-rendirse').textContent`)), 'giving up asks twice');
await ev(`document.getElementById('btn-rendirse').click(); 1`);
ok(await waitFor(`!!document.getElementById('btn-fin') && /Te rendiste/.test(document.getElementById('dm-sello').textContent)`, 3000), 'and ends the game');

// The languages
for (const [lang, start, head] of [['en', /Start/, /Board 1 of 3 · easy/], ['pt', /Começar/, /Tabuleiro 1 de 3 · fácil/]]) {
  await b.go(`${SITE}/dominorama/?test&lang=${lang}&seed=LANGS`, 1500);
  ok(await waitFor(`!!document.getElementById('btn-empezar')`), `${lang}: the waiting room`);
  ok(start.test(await ev(`document.getElementById('btn-empezar').textContent`)), `${lang}: Empezar in ${lang}`);
  ok(/Pips/.test(await ev(`document.getElementById('dm-credito').textContent`)), `${lang}: the credit`);
  await narrow();
  ok(await noSideScroll(), `${lang}: no sideways scroll at 320 px`);
  await wide();
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  ok(await waitFor(`!!document.getElementById('dm-marcador') && !document.getElementById('cuenta')`, 9000) && head.test(await ev(`document.getElementById('dm-marcador').textContent`)), `${lang}: the board's heading`);
  await b.shot(`04-game-${lang}`);
}

ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ dominorama/page.mjs');

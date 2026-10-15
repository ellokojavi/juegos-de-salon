// 🖌️ Pintaminas end to end on its standalone page, /paint-mines/ (D-289, D-331): the waiting room
// credits ColorSweeper with its link and its cover paints itself; the lever switches to the hard
// variant (a flash, the night-blue background, a two-color cover) and back (no flash, the usual
// background). An easy game, played against the engine: a hit shows its number, a miss subtracts 15
// and uncovers the true color, the 💡 hint asks for a second tap, marks a cell and the numbers that
// explain it, and is seen again for free; at the end the drawing appears, "See results" gives 75/100
// with the breakdown and the share card. At 320 px nothing scrolls sideways. The hard variant from
// the link (?mode=hard, and the lab's ?colors=2): two colors and three brushes, and with no errors
// 100/100, the background night blue up to the result. Giving up asks for a second tap and scores
// the painted part. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { numero } from '../../../public/cup/games/paint-mines/engine.js';
const OUT = output('/tmp/paint-mines-game');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const KEY = 'juegos-de-salon:pintaminas:variant';
const cell = i => `document.querySelector('#pm-tablero .pm-casilla[data-i="${i}"]')`;
const brush = k => (k === 0 ? 'btn-fondo' : k === 1 ? 'btn-tinta' : 'btn-tinta2');
const paint = async (i, k) => { await ev(`document.getElementById('${brush(k)}').click(); ${cell(i)}.click(); 1`); await sleep(40); };
const noSideScroll = () => ev(`document.documentElement.scrollWidth <= innerWidth`);
const viewport = (width, height = 812) => b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true });
/** Starts the game from the waiting room and returns the board, as the engine made it. */
const start = async () => {
  await waitFor(`!!document.getElementById('btn-empezar')`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  const countdown = await waitFor(`!!document.getElementById('cuenta')`, 3000);
  const board = await waitFor(`document.querySelectorAll('#pm-tablero .pm-casilla').length === 49 && !document.getElementById('cuenta')`, 9000);
  return { countdown, board, t: board ? JSON.parse(await ev(`JSON.stringify(window.__pintaminas.p)`)) : null };
};
const free = t => t.sol.map((_, i) => i).filter(i => !t.dadas.includes(i));

// The waiting room, in the easy variant
await b.go(`${SITE}/paint-mines/?test`, 600);
await ev(`localStorage.removeItem('${KEY}'); 1`);
await b.go(`${SITE}/paint-mines/?test`, 1200);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the waiting room has Start');
ok(/ColorSweeper/.test(await ev(`document.querySelector('.pm-credito')?.textContent || ''`)) && /store\.steampowered\.com/.test(await ev(`document.getElementById('link-colorsweeper')?.href || ''`)), 'it credits ColorSweeper, with its link');
ok(await waitFor(`document.querySelectorAll('.pm-demo .pm-casilla.tinta').length > 6`, 8000), 'the cover game paints itself');
ok(await ev(`document.getElementById('btn-dificil')?.getAttribute('aria-checked')`) === 'false' && await ev(`document.getElementById('btn-dificil').getAttribute('role')`) === 'switch', 'the lever is a switch, and starts on easy');
ok(await ev(`!!document.querySelector('.pm-placa .pm-ranura')`), 'the plate has the ball\'s track engraved');
ok(!await ev(`document.body.classList.contains('modo-dificil')`), 'with the usual background');
ok(await noSideScroll(), 'no sideways scroll in the waiting room at 375 px');
await b.shot('01-lobby');

// The lever: up, a flash, the night-blue background, the hard steps and a two-color cover
await ev(`window.__flashes = 0; new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.classList?.contains('pm-relampago')) window.__flashes++; }))).observe(document.body, { childList: true }); 1`);
await ev(`document.getElementById('btn-dificil').click(); 1`); await sleep(400);
ok(await ev(`document.getElementById('btn-dificil').getAttribute('aria-checked') === 'true' && document.getElementById('btn-dificil').classList.contains('on')`), 'flipping the lever turns hard on and electrifies it');
ok(await ev(`window.__flashes`) === 1, 'a flash covers the whole view');
ok(await ev(`document.body.classList.contains('modo-dificil')`), 'and the page goes night blue');
ok(/difícil/i.test(await ev(`document.querySelector('#btn-dificil .pm-rotulo').textContent`)), 'the label says «⚡ Modo difícil»');
ok(/dos colores/.test(await ev(`document.querySelector('ol.como').textContent`)), 'the steps are the hard variant\'s');
ok(await ev(`localStorage.getItem('${KEY}')`) === 'hard', 'the phone remembers it');
ok(await waitFor(`document.querySelectorAll('.pm-demo .pm-casilla.pm-p2').length > 0`, 6000), 'and the cover game is in two colors');
await b.shot('02-lobby-hard');
await ev(`document.getElementById('btn-dificil').click(); 1`); await sleep(300);
ok(await ev(`document.getElementById('btn-dificil').getAttribute('aria-checked') === 'false' && !document.body.classList.contains('modo-dificil')`), 'back down, it is easy with the usual background');
ok(await ev(`window.__flashes`) === 1, 'going back to easy has no flash');

// An easy game: one mistake and one hint, 75/100
const g = await start();
ok(g.countdown, 'Start goes through the 3, 2, 1 countdown');
ok(g.board, 'and then the 7×7 board');
const { t } = g;
ok(t.colores === 1 && t.variante === 'easy' && await ev(`document.querySelectorAll('.pm-pinceles .pm-pincel').length`) === 2, 'easy: one color and two brushes');
ok(await ev(`document.querySelectorAll('#pm-tablero .pm-casilla.tinta, #pm-tablero .pm-casilla.fondo').length`) === t.dadas.length, `the given cells show painted (${t.dadas.length})`);
const L = free(t);
await paint(L[0], t.sol[L[0]]);
ok(await ev(`${cell(L[0])}.textContent`) === String(numero(t.sol, L[0])), 'a hit shows the cell\'s number');
ok(await ev(`document.getElementById('${brush(t.sol[L[0]])}').getAttribute('aria-pressed')`) === 'true', 'the chosen brush shows');
await paint(L[1], 1 - t.sol[L[1]]);
ok(await ev(`${cell(L[1])}.classList.contains('error') && ${cell(L[1])}.classList.contains('${t.sol[L[1]] ? 'tinta' : 'fondo'}')`), 'a miss uncovers the true color, marked as a mistake');
ok(/(Se pintaba de \p{L}+|No se pintaba): −15/u.test(await ev(`document.querySelector('.pm-aviso').textContent`)) && /1 error/.test(await ev(`document.getElementById('pm-marcador').textContent`)), 'and says so: −15, 1 error');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
ok(/Toca de nuevo/.test(await ev(`document.getElementById('btn-ayuda').textContent`)) && !await ev(`!!document.querySelector('.pm-pista-objetivo')`), 'the first hint tap asks to confirm, without charging');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
const target = await ev(`[...document.querySelectorAll('.pm-pista-objetivo')].map(b => +b.dataset.i)`);
ok(target.length === 1 && await ev(`document.querySelectorAll('.pm-pista-razon').length`) > 0 && !t.dadas.includes(target[0]), 'the second one marks an unknown cell and the numbers that explain it');
ok(/se deduce de los números marcados/.test(await ev(`document.querySelector('.pm-aviso').textContent`)), 'and says so');
await b.shot('03-game-hint');
const other = L.find(i => i !== target[0] && i !== L[0] && i !== L[1]);
await paint(other, t.sol[other]);
ok(/Ver la ayuda/.test(await ev(`document.getElementById('btn-ayuda').textContent`)), 'afterwards, the button offers to see the same hint');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
ok(await ev(`${cell(target[0])}.classList.contains('pm-pista-objetivo')`) && await ev(`window.__pintaminas.estado().ayudas`) === 1, 'and shows it again without charging another');
// 320 px (C-8): the board, the brushes and the buttons fit
await viewport(320, 640); await sleep(300);
ok(await noSideScroll(), 'no sideways scroll in the game at 320 px');
ok(await ev(`[...document.querySelectorAll('.pm-pincel, .pm-acciones .btn')].every(x => x.getBoundingClientRect().height >= 44)`), 'the brushes and buttons are 44 px or more at 320 px');
await b.shot('04-game-320');
await viewport(375);
for (const i of L) if (i !== L[0] && i !== L[1] && i !== other) await paint(i, t.sol[i]);
ok(await waitFor(`document.getElementById('pm-tablero').classList.contains('revelada')`, 3000), 'painted whole, the drawing is revealed');
ok(/^\p{Extended_Pictographic}.* (¡Era|¡Eran)/u.test(await ev(`document.querySelector('.pm-aviso.era')?.textContent || ''`)), `and it says what it was (${await ev(`document.querySelector('.pm-aviso.era')?.textContent`)})`);
ok(/Pintado/.test(await ev(`document.querySelector('.pm-sello')?.textContent || ''`)), 'with a mistake and a hint the stamp says ¡Pintado!, not ¡Perfecto!');
ok(!await ev(`!!document.querySelector('.pm-pinceles')`), 'the brushes go');
await b.shot('05-revealed');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`document.querySelector('#screen-resultado.active .score-big')?.textContent === '75/100'`, 5000), `the result: 75/100 with one mistake and one hint (${await ev(`document.querySelector('.score-big')?.textContent`)})`);
const breakdown = await ev(`document.getElementById('explicacion')?.textContent || ''`);
ok(/1 error: −15/.test(breakdown) && /1 ayuda: −10/.test(breakdown), 'the breakdown counts the mistake and the hint');
ok(/🟥/.test(await ev(`document.querySelector('#screen-resultado pre.tarjeta')?.textContent || ''`)), 'the share card marks the mistake with 🟥');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'the result can be shared');
ok(await noSideScroll(), 'no sideways scroll in the result');
await b.shot('06-result');

// The hard variant from the link: two colors, three brushes, and with no errors 100/100
await b.go(`${SITE}/paint-mines/?test&mode=hard`, 1200);
ok(await waitFor(`document.getElementById('btn-dificil')?.getAttribute('aria-checked') === 'true'`), 'with ?mode=hard the lever comes on');
ok(await ev(`document.body.classList.contains('modo-dificil')`), 'and the background night blue');
const h = await start();
ok(h.board && await ev(`document.body.classList.contains('modo-dificil')`), 'the hard board, still night blue');
const t2 = h.t;
ok(t2.colores === 2 && t2.sol.includes(2) && await ev(`document.querySelectorAll('.pm-pinceles .pm-pincel').length`) === 3, `two colors and three brushes (${t2.dibujo.pinturas.map(p => p.id).join(' and ')})`);
ok(await ev(`getComputedStyle(document.querySelector('#btn-tinta2')).backgroundImage.includes('gradient')`), 'the second color\'s brush carries stripes (#349)');
await viewport(320, 640); await sleep(300);
ok(await noSideScroll(), 'no sideways scroll in the hard game at 320 px');
await b.shot('07-hard-320');
await viewport(375);
for (const i of free(t2)) await paint(i, t2.sol[i]);
ok(await waitFor(`/Perfecto/.test(document.querySelector('.pm-sello')?.textContent || '')`, 3000), 'with no mistakes or hints: ¡Perfecto!');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`document.querySelector('#screen-resultado.active .score-big')?.textContent === '100/100'`, 5000), `with no errors, hard scores 100/100 (${await ev(`document.querySelector('.score-big')?.textContent`)})`);
ok(await ev(`document.body.classList.contains('modo-dificil')`), 'and the result is night blue too');
await b.shot('08-hard-result');

// The lab's old link (?colors=2) is the hard variant too
await ev(`localStorage.removeItem('${KEY}'); 1`);
await b.go(`${SITE}/paint-mines/?test&colors=2`, 1200);
ok(await waitFor(`document.getElementById('btn-dificil')?.getAttribute('aria-checked') === 'true'`), 'the lab\'s ?colors=2 comes on in hard');

// Giving up (D-296): asks for a second tap, uncovers the drawing and the score is worth the painted part
await ev(`localStorage.setItem('${KEY}', 'easy'); 1`);
await b.go(`${SITE}/paint-mines/?test`, 1200);
const r = await start();
const t3 = r.t, L3 = free(t3);
for (const i of L3.slice(0, 10)) await paint(i, t3.sol[i]);
ok(await ev(`[...document.querySelectorAll('.pm-acciones .btn')].map(b => b.id).join()`) === 'btn-ayuda,btn-rendirse', 'under the brushes: the hint and Give up, in one row');
await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(150);
ok(/Seguro/.test(await ev(`document.getElementById('btn-rendirse').textContent`)) && !await ev(`document.getElementById('pm-tablero').classList.contains('revelada')`), 'giving up asks for a second tap');
await ev(`document.getElementById('btn-rendirse').click(); 1`);
ok(await waitFor(`document.getElementById('pm-tablero').classList.contains('revelada') && document.querySelectorAll('#pm-tablero .pm-casilla.sin-hacer').length === ${L3.length - 10}`, 3000), 'with the second, the drawing is uncovered and what was missing shows dimmed');
ok(/rendiste/.test(await ev(`document.querySelector('.pm-sello')?.textContent || ''`)), 'the stamp says «Te rendiste»');
await ev(`document.getElementById('btn-fin').click(); 1`);
const exp3 = Math.round(100 * 10 / L3.length);
ok(await waitFor(`document.querySelector('#screen-resultado.active .score-big')?.textContent === '${exp3}/100'`, 5000), `the score is worth the painted part: ${exp3}/100`);
ok(/Te rendiste con el \d+ % pintado/.test(await ev(`document.getElementById('explicacion')?.textContent || ''`)), 'and the breakdown says so');
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ pintaminas');

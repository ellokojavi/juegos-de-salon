// Pintaminas in the lab (D-289) end to end, at /labs/paint-mines/: the lab offers it under Active
// projects with the credit to ColorSweeper; the cover says so and paints itself; Empezar goes through
// the 3, 2, 1 countdown; with a seed it's played through, compared with the engine: a hit shows the
// number, a miss subtracts and uncovers the true color, the brush changes; at the end the drawing
// appears and the result has the score, share, another board and the comment after a line. Hard mode
// (D-291): the switch turns it on, and with two colors and no errors it pays 150. The hint (D-292)
// marks a deducible cell and subtracts 10. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/paint-mines-lab');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEED = 'e2e1';

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-pintaminas #btn-pintaminas')?.getAttribute('href')`) === 'paint-mines/', 'the lab offers Pintaminas under Active projects');
ok(await ev(`/ColorSweeper/.test(document.querySelector('#seccion-pintaminas a[href*="ColorSweeper"]')?.textContent || '')`), 'and says it is inspired by ColorSweeper, with its link');

await b.go(`${SITE}/labs/paint-mines/?test`, 1200);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the cover has Empezar');
ok(/Inspirado en ColorSweeper/.test(await ev(`document.querySelector('.credito')?.textContent || ''`)) && !!await ev(`document.getElementById('link-colorsweeper')?.href`), 'the cover credits ColorSweeper with its link');
ok(await waitFor(`document.querySelectorAll('.demo .casilla.tinta').length > 3`, 6000), 'the cover board paints itself');
ok(/mismo para todos/.test(await ev(`document.body.textContent`)), 'without a seed it is today\'s board');
// The hard mode switch: goes up, electrifies, and goes down
await ev(`localStorage.removeItem('juegos-de-salon:pintaminas:dificil'); 1`);
await b.go(`${SITE}/labs/paint-mines/?test`, 1200);
ok(await ev(`document.getElementById('btn-dificil')?.getAttribute('aria-checked')`) === 'false', 'hard mode starts off');
ok(/Modo fácil/.test(await ev(`document.querySelector('#btn-dificil .rotulo').textContent`)) && await ev(`!!document.querySelector('#btn-dificil .recorrido .ranura')`), 'the lever says «Modo fácil» and the plate has its track engraved');
// The flash lasts 0.6 s: it's counted when it appears, so as not to depend on seeing it in time
await ev(`window.__flashes = 0; new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.classList?.contains('relampago')) window.__flashes++; }))).observe(document.body, { childList: true }); 1`);
await ev(`document.getElementById('btn-dificil').click(); 1`); await sleep(200);
ok(await ev(`document.getElementById('btn-dificil').getAttribute('aria-checked') === 'true' && document.getElementById('btn-dificil').classList.contains('on')`), 'the switch turns it on and electrifies');
ok(await ev(`document.body.classList.contains('modo-dificil')`), 'and changes the page background');
ok(await ev(`window.__flashes`) === 1, 'and a flash covers the whole view');
ok(/Modo difícil/.test(await ev(`document.querySelector('#btn-dificil .rotulo').textContent`)), 'and the label becomes «⚡ Modo difícil»');
ok(await waitFor(`document.querySelectorAll('.demo .casilla.p2').length > 0`, 9000), 'and the cover game switches to two colors');
await b.shot('01b-hard');
await ev(`document.getElementById('btn-dificil').click(); 1`); await sleep(100);
ok(await ev(`document.getElementById('btn-dificil').getAttribute('aria-checked') === 'false' && !document.body.classList.contains('modo-dificil')`), 'and turns it off, with the usual background');
ok(await ev(`window.__flashes`) === 1, 'going back to easy mode has no flash');
await b.shot('01-cover');

await b.go(`${SITE}/labs/paint-mines/?seed=${SEED}&test`, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
ok(!await ev(`document.getElementById('vista').textContent.includes('null')`), 'with a seed, the cover does not write "null"');
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`/3|2|1/.test(document.querySelector('#cuenta .cuenta-num')?.textContent || '')`, 2000), 'Empezar opens the 3, 2, 1 countdown');
ok(await waitFor(`document.querySelectorAll('#tablero .casilla').length === 49 && !document.getElementById('cuenta')`, 8000), 'and then the 7×7 board');
const t = await ev(`JSON.stringify(window.__pintaminas.P.t)`).then(JSON.parse);
const { numero } = await import('../../../public/labs/paint-mines/engine.js');
const cell = i => `document.querySelector('#tablero .casilla[data-i="${i}"]')`;
ok(await ev(`[...document.querySelectorAll('#tablero .casilla.tinta, #tablero .casilla.fondo')].length`) === t.dadas.length, `the given cells show painted (${t.dadas.length})`);
const paint = async (i, color) => { await ev(`document.getElementById('${color ? 'btn-tinta' : 'btn-fondo'}').click(); ${cell(i)}.click(); 1`); await sleep(40); };
const free = t.sol.map((_, i) => i).filter(i => !t.dadas.includes(i));
// A hit shows its number; a miss subtracts and uncovers the true color
await paint(free[0], t.sol[free[0]]);
ok(await ev(`${cell(free[0])}.textContent`) === String(numero(t.sol, free[0])), 'a hit shows the cell\'s number');
ok(await ev(`document.getElementById('btn-${t.sol[free[0]] ? 'tinta' : 'fondo'}').getAttribute('aria-pressed')`) === 'true', 'the chosen brush shows');
await paint(free[1], 1 - t.sol[free[1]]);
ok(await ev(`${cell(free[1])}.classList.contains('error') && ${cell(free[1])}.classList.contains('${t.sol[free[1]] ? 'tinta' : 'fondo'}')`), 'a miss uncovers the true color, marked as an error');
ok(/(Se pintaba de \p{L}+|No se pintaba): −15/u.test(await ev(`document.querySelector('.aviso-pm').textContent`)) && /1 error/.test(await ev(`document.getElementById('marcador').textContent`)), 'and says so: −15, 1 error');
// The hint: marks the deducible cell and the numbers that explain it, without painting it, and subtracts
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
// The first tap only asks to confirm (#351): it neither marks nor charges
ok(/Toca de nuevo/.test(await ev(`document.getElementById('btn-ayuda').textContent`)) && !await ev(`!!document.querySelector('#tablero .pista-objetivo')`), 'the first hint tap asks to confirm, without charging');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
const target = await ev(`[...document.querySelectorAll('#tablero .casilla.pista-objetivo')].map(b => +b.dataset.i)`);
ok(target.length === 1 && await ev(`document.querySelectorAll('#tablero .casilla.pista-razon').length`) > 0 && !await ev(`${cell(target[0] ?? 0)}.classList.contains('tinta') || ${cell(target[0] ?? 0)}.classList.contains('fondo')`), 'the hint marks an unpainted cell and the numbers that explain it');
ok(/se deduce de los números marcados/.test(await ev(`document.querySelector('.aviso-pm').textContent`)), 'and says so');
// Painting another cell removes the marks, and seeing it again doesn't charge again
const otherFree = free.find(i => i !== target[0] && !t.dadas.includes(i));
await paint(otherFree, t.sol[otherFree]);
ok(/Ver la ayuda/.test(await ev(`document.getElementById('btn-ayuda').textContent`)), 'afterwards, the button offers to see the same hint');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
ok(await ev(`${cell(target[0])}.classList.contains('pista-objetivo')`) && /1 error|Sin errores/.test(await ev(`document.getElementById('marcador').textContent`)), 'and shows it again without charging another');
await b.shot('02-game');
for (const i of free.slice(2)) await paint(i, t.sol[i]);
ok(await waitFor(`document.getElementById('tablero')?.classList.contains('revelada')`, 2000), 'at the end the drawing appears');
ok((await ev(`document.querySelector('.aviso-pm').textContent`)).includes(t.dibujo.nombre.toLowerCase()), `and says what it was: ${t.dibujo.nombre}`);
ok(await waitFor(`document.getElementById('puntaje')?.textContent === '75/100'`, 5000), 'the result: 75/100 with one error and one hint');
ok(/1 ayuda: −10/.test(await ev(`document.querySelector('.desglose').textContent`)), 'the breakdown counts the hint');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'the result can be shared');
const another = await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`);
ok(/seed=/.test(another) && !another.includes(SEED), `"Otro tablero" opens a new one (${another})`);
ok(await ev(`!!document.getElementById('btn-de-hoy')`), 'and since it was not today\'s, it offers today\'s');
ok(await ev(`(()=>{const k=[...document.querySelector('.resultado').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario') && k.at(-2)?.classList.contains('divisor')})()`), 'the comment comes last, separated by a line');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll at 375 px');
await b.shot('03-final');

// Hard mode from the link: two colors, three brushes, and with no errors it pays 150
await b.go(`${SITE}/labs/paint-mines/?seed=${SEED}&colors=2&test`, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
ok(await ev(`document.getElementById('btn-dificil').getAttribute('aria-checked')`) === 'true', 'with colors=2 in the link, hard mode comes on');
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`document.querySelectorAll('#tablero .casilla').length === 49 && !document.getElementById('cuenta')`, 8000), 'the hard board');
const t2 = await ev(`JSON.stringify(window.__pintaminas.P.t)`).then(JSON.parse);
ok(t2.colores === 2 && t2.sol.includes(2) && await ev(`document.querySelectorAll('.pinceles .pincel').length`) === 3, `two colors and three brushes (${t2.dibujo.pinturas.map(p => p.nombre).join(' and ')})`);
ok(/Modo difícil ×1.5/.test(await ev(`document.getElementById('marcador').textContent`)), 'the scoreboard says so');
const button = k => (k === 0 ? 'btn-fondo' : k === 1 ? 'btn-tinta' : 'btn-tinta2');
for (const i of t2.sol.map((_, i) => i).filter(i => !t2.dadas.includes(i))) { await ev(`document.getElementById('${button(t2.sol[i])}').click(); document.querySelector('#tablero .casilla[data-i="${i}"]').click(); 1`); await sleep(30); }
ok(await waitFor(`document.getElementById('puntaje')?.textContent === '150/150'`, 5000), 'with no errors, hard mode pays 150/150');
ok(/colors=2/.test(await ev(`document.getElementById('btn-otro').getAttribute('href')`)), '"Otro tablero" stays in hard mode');
await b.shot('04-hard');

// Giving up (D-296): asks for a second tap, uncovers the drawing and the score is worth the painted part
await b.go(`${SITE}/labs/paint-mines/?seed=${SEED}&colors=1&test`, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
await waitFor(`!!document.getElementById('btn-rendirse') && !document.getElementById('cuenta')`, 8000);
const t3 = await ev(`JSON.stringify(window.__pintaminas.P.t)`).then(JSON.parse);
const free3 = t3.sol.map((_, i) => i).filter(i => !t3.dadas.includes(i));
for (const i of free3.slice(0, 10)) await paint(i, t3.sol[i]);
ok(await ev(`[...document.querySelectorAll('.acciones-pm .btn')].map(b => b.id).join()`) === 'btn-ayuda,btn-rendirse', 'under the brushes: the hint and Give up, in one row');
await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(150);
ok(/Seguro/.test(await ev(`document.getElementById('btn-rendirse').textContent`)) && !await ev(`document.getElementById('tablero').classList.contains('revelada')`), 'giving up asks for a second tap');
await ev(`document.getElementById('btn-rendirse').click(); 1`);
ok(await waitFor(`document.getElementById('tablero')?.classList.contains('revelada') && document.querySelectorAll('#tablero .casilla.sin-hacer').length === ${free3.length - 10}`, 3000), 'with the second, the drawing is uncovered and what was missing shows dimmed');
const exp3 = Math.round(100 * 10 / free3.length);
ok(await waitFor(`document.getElementById('puntaje')?.textContent === '${exp3}/100'`, 5000) && /Te rendiste/.test(await ev(`document.querySelector('.sello-pm').textContent`)), `the score is worth the painted part: ${exp3}/100, «Te rendiste»`);
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ pintaminas (labs)');

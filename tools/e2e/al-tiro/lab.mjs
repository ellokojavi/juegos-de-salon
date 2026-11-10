// ¡Al tiro! in the lab end to end, at /labs/al-tiro/: the lab offers it under Games being tried, crediting
// WarioWare; the cover has Jugar, the credit and the site footer; Jugar shows the three ways to play (Toca,
// Arrastra, Desliza) one at a time with their gesture, three dots and ¡A jugar!; ¡A jugar! starts a run of 10
// different microgames, with the HUD, a mark per game and the first intro wearing its type's gesture; a single
// game (¡Calcula!, answered right) ends on the run's summary with stars, Otra corrida and Inicio, and the best
// is kept; at 320 px no sideways scroll. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/al-tiro-lab');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#seccion-al-tiro #btn-al-tiro')?.getAttribute('href')`) === 'al-tiro/', 'the lab offers ¡Al tiro! under Games being tried');
ok(/WarioWare/.test(await ev(`document.querySelector('#seccion-al-tiro a[href*="WarioWare"]')?.textContent || ''`)), 'and says it is inspired by WarioWare, with its link');

await b.go(`${SITE}/labs/al-tiro/?test`, 1000);
ok(await waitFor(`!!document.getElementById('btn-jugar')`), 'the cover has Jugar');
ok(/WarioWare/.test(await ev(`document.getElementById('link-warioware')?.textContent || ''`)), 'the cover credits WarioWare');
ok(await ev(`!!document.querySelector('#pie #btn-comentario')`), 'the cover ends with the site footer and its comment');
ok(await ev(`__alTiro.ids.length`) === 30, 'thirty microgames');
await b.shot('01-cover');

await ev(`document.getElementById('btn-jugar').click(); 1`);
ok(await waitFor(`/TOCA/.test(document.getElementById('hc')?.textContent || '')`, 2000), 'Jugar shows the first way to play: Toca, with its gesture');
ok(await ev(`document.querySelectorAll('#hd button').length`) === 3 && await ev(`!!document.querySelector('#hc .gstage .hand')`), 'three dots, and the finger on the card');
await ev(`document.querySelectorAll('#hd button')[1].click(); 1`);
ok(/ARRASTRA/.test(await ev(`document.getElementById('hc').textContent`)), 'a dot jumps to Arrastra');
await ev(`document.querySelectorAll('#hd button')[2].click(); 1`);
ok(/DESLIZA/.test(await ev(`document.getElementById('hc').textContent`)), 'and to Desliza');
await b.shot('02-how');

await ev(`document.getElementById('hgo').click(); 1`);
ok(await waitFor(`!document.getElementById('hud').hidden && !!__alTiro.game`, 2000), '¡A jugar! starts the run, with the HUD');
const order = await ev(`__alTiro.order`);
ok(order.length === 10 && new Set(order).size === 10, `ten different microgames (${order.join(', ')})`);
ok(await ev(`document.querySelectorAll('#runbar i').length`) === 10, 'a mark per game in the run');
ok(await ev(`!!document.querySelector('#screen .gest .gstage') && !!document.getElementById('demo').dataset.kind`), 'the first intro shows its type\'s gesture, the stage framed in its color');
await b.shot('03-run');

// One game on its own: ¡Calcula!, answered right
await ev(`__alTiro.only('calcula'); 1`);
ok(await waitFor(`!!document.querySelector('.opts3.low button')`, 6000), '¡Calcula! asks, with three answers at the bottom');
ok(await ev(`!document.getElementById('demo').dataset.kind`), 'the frame comes off while playing');
await ev(`(() => { const op = document.querySelector('.op').textContent.replace('−', '-').replace('×', '*'); const r = Function('return ' + op)(); document.querySelector('.opts3.low button[data-v="' + r + '"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); })(); 1`);
ok(await waitFor(`!!document.getElementById('btn-otra')`, 6000), 'the run ends on its summary');
ok(/★/.test(await ev(`document.querySelector('.runsum')?.textContent || ''`)) && await ev(`__alTiro.total`) >= 1, 'with the stars it got');
ok(!!(await ev(`document.getElementById('btn-portada')`)), 'Otra corrida and Inicio');
ok(+(await ev(`localStorage.getItem('al-tiro:best')`)) >= 1, 'the best is kept');
await b.shot('04-end');

b.close();
const s = await launch({ dir: `${OUT}/p320`, out: OUT, width: 320, height: 640 });
await s.go(`${SITE}/labs/al-tiro/?test`, 1000);
ok(await s.evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'at 320 px, no sideways scroll on the cover');
await s.evaluate(`document.getElementById('btn-jugar').click(); 1`); await sleep(400);
ok(await s.evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'nor on the three ways to play');
s.close();
if (failures) { console.log(`✗ ${failures} failed`); process.exit(1); }
console.log('✓ ¡Al tiro! in the lab');

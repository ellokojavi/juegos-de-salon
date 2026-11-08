// 🐤 Aletazo, out of the lab (D-517's way), end to end at its standalone page /flap/: the waiting room
// with the bird flying the course by itself and the credit to Flappy Bird with its link; Empezar goes
// through the countdown to the bird hovering with «Toca para aletear»; a real tap flaps it up; crossing
// gates scores; hiding the page pauses and the tap back only resumes; losing the lives ends the game, and
// «Continuar» gives the points, with the breakdown and the share card. At 320 px nothing scrolls sideways.
// Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/flap-game');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const noSideScroll = () => ev(`document.documentElement.scrollWidth <= innerWidth`);
const P = `window.__aletazo`;

// The waiting room
await b.go(`${SITE}/flap/?test`, 1500);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the waiting room has Empezar');
ok(await waitFor(`!!document.querySelector('.fl-demo')`), 'with the cover\'s flight');
await sleep(600);
await ev(`window.__shot = document.querySelector('.fl-demo').toDataURL(); 1`);
await sleep(1200);
ok(await ev(`document.querySelector('.fl-demo').toDataURL() !== window.__shot`), 'the cover\'s bird flies by itself');
ok(/Inspirado en Flappy Bird, de Dong Nguyen/.test(await ev(`document.getElementById('fl-credito')?.textContent || ''`)) && /wikipedia\.org\/wiki\/Flappy_Bird/.test(await ev(`document.getElementById('link-flappy-bird')?.href || ''`)), 'it credits Flappy Bird, with its link');
ok(await noSideScroll(), 'no sideways scroll in the waiting room');
await b.shot('01-lobby');

// The game
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!document.getElementById('fl-escenario') && !document.getElementById('cuenta')`, 9000), 'Empezar opens the stage after the countdown');
ok(await ev(`document.getElementById('fl-marcador').textContent`) === '0', 'the score starts at 0');
ok(/Toca para aletear/.test(await ev(`document.getElementById('fl-pista').textContent`)), 'and says to tap to flap');
ok(await ev(`${P}.g.mode === 'ready' && document.querySelectorAll('#fl-vidas span').length === 3`), 'the bird hovers, with 3 lives');
const r = await ev(`document.getElementById('fl-escenario').getBoundingClientRect().toJSON()`);
await b.tap(r.x + r.width / 2, r.y + r.height / 2);
ok(await waitFor(`${P}.g.mode === 'play' && ${P}.g.bird.vy < 0`, 2000), 'a real tap starts the flight and flaps up');
// A perfect pilot: the engine's autopilot flies through a few gates
await ev(`(async () => { const { autopilot } = await import('/cup/games/flap/engine.js'); window.__auto = setInterval(() => { const g = ${P}.g; if (g.mode === 'play') { g.mode = 'demo'; autopilot(g); g.mode = 'play'; } }, 8); })(); 1`);
ok(await waitFor(`${P}.g.passed >= 2`, 15000), 'crossing gates scores');
ok(Number(await ev(`document.getElementById('fl-marcador').textContent`)) >= 2, 'the score shows it');
await b.shot('02-game');

// Paused: the tap back only resumes
await ev(`clearInterval(window.__auto); ${P}.pausar(); 1`);
ok(await ev(`!document.getElementById('fl-pausa').hidden`), 'a hidden page pauses the game');
const y0 = await ev(`${P}.g.bird.y`);
await sleep(600);
ok(await ev(`${P}.g.bird.y`) === y0, 'nothing moves while paused');
await b.tap(r.x + r.width / 2, r.y + r.height / 2);
ok(await ev(`document.getElementById('fl-pausa').hidden`), 'a tap resumes');

// 320 px
await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true }); await sleep(300);
ok(await noSideScroll(), 'no sideways scroll in the game at 320 px');
await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });

// The end: no more flaps, the bird falls and loses its lives on the ground
ok(await waitFor(`/Se acabó/.test(document.getElementById('fl-aviso')?.textContent || '')`, 20000), 'losing the lives says Se acabó');
ok(await waitFor(`!!document.getElementById('btn-fin')`, 4000), 'and «Continuar» follows');
ok(!!(await ev(`document.getElementById('fl-veredicto')?.textContent`)), 'with a line about how it went');
ok(await ev(`getComputedStyle(document.getElementById('jugar-reglas')).display === 'none'`), 'no rules under the finished game');
const pts = Number(await ev(`${P}.g.score`));
await b.shot('03-end');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`Number(document.querySelector('#screen-resultado.active .score-big')?.textContent) === ${pts}`, 5000), `the result: the game's points (${pts}), no /100`);
ok(/aros y huecos cruzados|aro o hueco cruzado/.test(await ev(`document.getElementById('explicacion')?.textContent || ''`)), 'the breakdown counts the gates');
ok(/[⭕🎯]/u.test(await ev(`document.querySelector('#screen-resultado pre.tarjeta')?.textContent || ''`)), 'the share card shows the gates');
ok(await noSideScroll(), 'no sideways scroll in the result');
await b.shot('04-result');
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ flap/game.mjs');

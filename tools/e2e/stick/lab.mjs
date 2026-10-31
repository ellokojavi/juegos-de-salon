// The lab's Stick Ninja (D-446) end to end, at /labs/stick/: the lab offers it under Juegos en prueba with the
// credit to Ketchapp's Stick Hero, which the English cover gives too, with its English leaderboard under Play; the cover plays itself; Play opens the
// night with "Hold to stretch"; a real press stretches the stick; a stick on the flag is a perfect (+2, then +3
// in a row, the pulse, "Perfect ×n", the streak chip and the achievements); a plain landing is +1 and breaks
// the streak; there are no stars; a pause in the middle of a hold keeps the stick, and the tap back does
// not drop it; a stick too long costs one of the three lives and the ninja climbs a rope back onto its pillar, and the
// third fall ends the run, with the result (score, new best kept
// on the phone, breakdown, share, Play again, the leaderboard, the comment after a line); a real short hold falls, and the
// second run, three real quick taps, shows today's runs on this phone. Moving pillars, from the 10th on, slide and say so, and aiming
// where they will be is a perfect (Moving target). At 375 px. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/stick-lab');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const P = 'window.__stick', G = `${P}.S.g`;

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-stick #btn-stick')?.getAttribute('href')`) === 'stick/', 'the lab offers Stick Ninja under Juegos en prueba');
ok(await ev(`/Stick Hero/.test(document.querySelector('#seccion-stick a[href*="ketchapp"]')?.textContent || '')`), 'and says it is inspired by Ketchapp\'s Stick Hero, with its link');

// A clean phone: no best, no runs today, no flip seen yet (the profile folder may be a rerun's)
await b.go(`${SITE}/labs/stick/?test&seed=42`, 600);
await ev(`['stick-best', 'stick-today', 'stick-moving'].forEach(k => localStorage.removeItem('juegos-de-salon:' + k)); 1`);
await b.go(`${SITE}/labs/stick/?test&seed=42`, 1200);
ok(await waitFor(`!!document.getElementById('btn-jugar')`), 'the cover has Play');
// The game's ranking under Play, in English like the page, with signing in (D-212, D-249)
ok(await waitFor(`/Shinobi leaderboard/.test(document.querySelector('.rk-ranking')?.textContent || '') && /All time/.test(document.querySelector('.rk-seg')?.textContent || '')`, 4000), 'the cover has the Shinobi leaderboard, in English');
ok(await ev(`document.getElementById('btn-jugar').nextElementSibling?.classList.contains('rk-ranking') && !!document.querySelector('.rk-jugador')`), 'right under Play, with signing in after it');
ok(await ev(`document.documentElement.lang`) === 'en', 'the page is in English');
ok(/Inspired by Stick Hero, by Ketchapp/.test(await ev(`document.querySelector('.credito')?.textContent || ''`)), 'the cover credits Ketchapp\'s Stick Hero');
ok(await ev(`document.querySelectorAll('.pasos li').length`) === 3, 'three steps under Play');
ok(/same for everyone/.test(await ev(`document.querySelector('.hoy-nota')?.textContent || ''`)), 'and says today\'s course is the same for everyone');
await ev(`window.__shot = document.querySelector('.demo-ninja').toDataURL(); 1`);
await sleep(1500);
ok(await ev(`document.querySelector('.demo-ninja').toDataURL() !== window.__shot`), 'the cover plays itself');
ok(await ev(`document.documentElement.scrollWidth <= 375`), 'no sideways scroll on the cover');
await b.shot('1-cover');

// Play: the night, the score at 0, and the hint
await ev(`document.getElementById('btn-jugar').click(); 1`);
ok(await waitFor(`!!document.getElementById('escenario')`), 'Play opens the night');
ok(await ev(`document.getElementById('marcador').textContent`) === '0', 'the score starts at 0');
ok(/Hold to stretch/.test(await ev(`document.getElementById('aviso').textContent`)), 'and says to hold');
ok(await ev(`!!document.querySelector('.cabeza-ninja .titulo-ninja') && document.getElementById('mejor-juego').textContent === ''`), 'a heading with the name, and no best yet');
ok(await ev(`!!document.getElementById('btn-comentario')`), 'and the comment link under it');
const r = await ev(`document.getElementById('escenario').getBoundingClientRect().toJSON()`);
const cx = Math.round(r.x + r.width / 2), cy = Math.round(r.y + r.height / 2);
await b.shot('2-game');

// A real press stretches the stick; it is let go at the flag's length
await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1, buttons: 1 });
await sleep(150);
ok(await ev(`${G}.phase`) === 'growing', 'a real press stretches the stick');
await ev(`${P}.S.soltar(${G}.hold + ${P}.sostener()); 1`);
await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1, buttons: 0 });
ok(await waitFor(`/Perfect!/.test(document.getElementById('aviso').textContent)`, 3000), 'the tip on the flag says Perfect!');
ok(await ev(`document.getElementById('escenario').classList.contains('pulso')`), 'and the night pulses');
await sleep(120);
await b.shot('3-perfect');
ok(await waitFor(`document.getElementById('marcador').textContent === '2'`, 3000), 'a perfect is worth 2');
ok(await waitFor(`/Bullseye/.test(document.getElementById('logros').textContent)`, 2000), 'the first flag is an achievement: Bullseye!');

/** One bridge with the stick's tip `off` from the flag, as a finger would, and waits until it is over. */
const puente = async (off = 0) => {
  await waitFor(`${G}.phase === 'ready'`, 4000);
  await ev(`(() => { const t = performance.now(); ${P}.S.presionar(t); ${P}.S.soltar(t + ${P}.sostener(${off}, t)); })(); 1`);
  await waitFor(`${G}.phase !== 'walking'`, 5000);
};
await puente(0); await puente(0);
ok(await ev(`${G}.score`) === 2 + 3 + 4, `perfects in a row are worth more: 2 + 3 + 4 (${await ev(`${G}.score`)})`);
ok(/×3/.test(await ev(`document.getElementById('racha').textContent`)) && await ev(`!document.getElementById('racha').hidden`), 'the streak chip says ×3');
ok(await waitFor(`/On fire/.test(document.getElementById('logros').textContent)`, 5000), 'three in a row: On fire');

// A plain landing: +1, and the streak is gone
const antes = await ev(`${G}.score`);
await puente(7);
ok(await ev(`${G}.score`) === antes + 1 && await ev(`${G}.streak`) === 0, 'a landing off the flag is +1 and breaks the streak');
ok(await ev(`document.getElementById('racha').hidden`), 'the streak chip goes');

// A pause in the middle of a hold: the stick stays, the tap back only takes the pause off
await ev(`${P}.S.presionar(performance.now()); 1`);
await sleep(200);
await ev(`window.dispatchEvent(new Event('blur')); 1`);
ok(await ev(`!document.getElementById('pausa').hidden && ${G}.phase === 'held'`), 'losing focus in the middle of a hold pauses, the stick stopped');
const largo = await ev(`${G}.held`);
await sleep(600);
await b.tap(cx, cy);
ok(await ev(`document.getElementById('pausa').hidden && ${G}.phase === 'held' && ${G}.held === ${largo}`), 'the tap back takes the pause off and does not drop the stick');
ok(/keep stretching/.test(await ev(`document.getElementById('aviso').textContent`)), 'and says to hold to keep stretching');
await ev(`(() => { const t = performance.now(); ${P}.S.presionar(t); ${P}.S.soltar(t + ${P}.sostener(0, t)); })(); 1`);
await waitFor(`${G}.phase !== 'walking'`, 5000);
ok(await ev(`${G}.kinds.at(-1)`) === 'perfect', 'the next press goes on from where it stopped: a perfect');

// Moving pillars, later in the run: it says so, it slides, and aiming where it will be is a perfect
for (let k = 0; k < 30 && !(await ev(`!!${G}.pillars[${G}.i + 1]?.move`)); k++) await puente(0);
ok(await ev(`!!${G}.pillars[${G}.i + 1]?.move && ${G}.i + 1 >= 10`), `a moving pillar comes, from the 10th on (pillar ${await ev(`${G}.i + 1`)})`);
ok(/aim where it will be/.test(await ev(`document.getElementById('aviso').textContent`)), 'and the hint says to aim where it will be');
const x1 = await ev(`${P}.columna(${G}.i + 1).x`);
await sleep(400);
ok(Math.abs(await ev(`${P}.columna(${G}.i + 1).x`) - x1) > 0.5, 'it slides');
await puente(0);
ok(await ev(`${G}.kinds.at(-1)`) === 'perfect', 'aiming where it will be when the stick lands is a perfect');
ok(await waitFor(`/Moving target/.test(document.getElementById('logros').textContent)`, 8000), 'a flag on a moving pillar: Moving target');

// No stars anywhere on the course, and a tap while running does nothing
ok(await ev(`${G}.pillars.every(p => !('star' in p))`) && !(await ev(`/star/i.test(document.querySelector('.pasos')?.textContent || '')`)), 'no stars on the course');

// Three lives: a stick too long costs one, and the ninja is back on the same pillar; the third ends the run
const final = await ev(`${G}.score`), aqui = await ev(`${G}.i`);
ok(await ev(`document.querySelectorAll('#vidas span').length === 3 && !document.querySelector('#vidas .perdida')`), 'three lives to start');
await puente(`${G}.pillars[${G}.i + 1].w / 2 + 6`);
ok(await waitFor(`/Too long/.test(document.getElementById('aviso')?.textContent || '')`, 3000), 'a stick past the pillar: Too long!');
ok(/2 lives left/.test(await ev(`document.getElementById('aviso').textContent`)) && await ev(`document.querySelectorAll('#vidas .perdida').length`) === 1, 'a heart goes dark: 2 lives left');
await b.shot('3b-life-lost');
ok(await waitFor(`${G}.phase === 'ready'`, 4000) && await ev(`${G}.i`) === aqui && await ev(`${G}.score`) === final && !(await ev(`!!document.getElementById('puntaje')`)), 'the ninja is back on the same pillar, the score kept');
await puente(`${G}.pillars[${G}.i + 1].w / 2 + 6`);
ok(await waitFor(`/Last life/.test(document.getElementById('aviso')?.textContent || '')`, 3000), 'the second fall: Last life!');
await puente(`${G}.pillars[${G}.i + 1].w / 2 + 6`);
ok(await waitFor(`!!document.getElementById('puntaje')`, 4000), 'and the result follows');
ok(await ev(`document.getElementById('puntaje').textContent`) === String(final), `the result is the score: ${final}`);
ok(/New best/.test(await ev(`document.querySelector('.sello-ninja').textContent`)), 'a first game is a new best');
ok(await ev(`localStorage.getItem('juegos-de-salon:stick-best')`) === String(final), 'kept on the phone');
ok(/flags: \+\d+ bonus/.test(await ev(`document.querySelector('.desglose').textContent`)) && !/star/.test(await ev(`document.querySelector('.desglose').textContent`)), 'the breakdown counts the flags and their bonus, and no stars');
ok(await ev(`!!document.getElementById('btn-compartir-resultado') && !!document.getElementById('btn-otra') && !!document.querySelector('.resultado .divisor')`), 'share, Play again, and the comment form after a line');
ok(await ev(`!document.getElementById('hoy')`), 'one run: no list of today\'s runs yet');
ok(await ev(`!!document.querySelector('.resultado .rk-ranking') && !document.querySelector('.resultado .rk-contar')`), 'the result has the leaderboard, and a ?seed= course does not offer to count');
ok(await ev(`document.documentElement.scrollWidth <= 375`), 'no sideways scroll on the result');
await b.shot('4-result');

// Play again: a real short hold falls; the second run shows today's runs
await ev(`document.getElementById('btn-otra').click(); 1`);
ok(await waitFor(`document.getElementById('marcador')?.textContent === '0'`), 'Play again starts at 0');
ok(new RegExp(`Best: ${final}`).test(await ev(`document.getElementById('mejor-juego').textContent`)), `the heading shows the best: ${final}`);
for (let k = 0; k < 3; k++) { await waitFor(`${G}.phase === 'ready'`, 4000); await b.tap(cx, cy); await waitFor(`${G}.phase !== 'walking'`, 4000); }
ok(await waitFor(`/Too short/.test(document.getElementById('aviso')?.textContent || '')`, 3000), 'a real quick tap is a stick too short');
ok(await waitFor(`!!document.getElementById('puntaje')`, 4000), 'and the result follows');
ok(new RegExp(`Your best: ${final}`).test(await ev(`document.getElementById('mejor')?.textContent || ''`)), 'it shows the best');
ok(await ev(`document.querySelectorAll('#hoy .corridas li').length`) === 2 && await ev(`document.querySelector('#hoy .tope')?.textContent`) === String(final), 'and today\'s two runs on this phone, the best lit');
await b.shot('5-result-again');

const errores = b.errors.filter(e => !/firebase|network|Failed to fetch/i.test(e));
ok(!errores.length, `no errors on the page${errores.length ? `: ${errores.join(' | ')}` : ''}`);
b.close();
console.log(failures ? `✗ ${failures} failure(s)` : '✓ stick/lab.mjs');

// Aletazo in the lab end to end, at /labs/flap/: the lab offers it under Active projects; the cover
// has the tagline, three steps, the language toggle and a yellow Jugar over a demo that flies itself, above
// the card on a tall phone; Jugar runs the 3, 2, 1… ¡A jugar! over the bird flying blurred, then waits
// for the first tap («Toca para aletear») and the tap starts the game; real taps on the stage, timed like a player's,
// get it through a level (the «Nivel 2» banner, the HUD's level and score); without taps the bird
// falls, loses its three lives and the result card shows the stamp, the score, a line about how it
// went, Jugar otra vez and the way back to the lab; Jugar otra vez starts again; the best is kept;
// in English the cover is in English; at 320 px no sideways scroll and the steps fold under
// «Cómo se juega ▾». Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/flap-lab');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const TAP = `document.getElementById('escenario').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))`;
// Plays in the page like a careful player: a tap whenever the bird drops below the next opening
const PLAY = (until, ms) => `(async () => {
  const w = t => new Promise(r => setTimeout(r, t)), t0 = performance.now();
  while (performance.now() - t0 < ${ms}) {
    const g = __aletazo.g; if (g.mode !== 'play' || (${until})) break;
    const n = g.gates.find(h => h.x > g.bird.x - 0.02);
    if (n && g.bird.vy > 0 && g.bird.y > n.y + 0.015) ${TAP};
    await w(16);
  }
  return __aletazo.g.passed;
})()`;

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-aletazo #btn-aletazo')?.getAttribute('href')`) === 'flap/', 'the lab offers Aletazo under Active projects');
ok(/Flappy Bird/.test(await ev(`document.querySelector('#seccion-aletazo a[href*="Flappy_Bird"]')?.textContent || ''`)), 'and says it is inspired by Flappy Bird, with its link');

await b.go(`${SITE}/labs/flap/?test`, 1200);
ok(await waitFor(`!!document.getElementById('btn-jugar')?.textContent`), 'the cover has Jugar');
ok(/Un toque, un aletazo/.test(await ev(`document.getElementById('lema').textContent`)), 'the tagline');
ok(/Inspirado en Flappy Bird, de Dong Nguyen/.test(await ev(`document.getElementById('credito').textContent`)) && /wikipedia\.org\/wiki\/Flappy_Bird/.test(await ev(`document.getElementById('link-flappy-bird')?.href || ''`)), 'the cover credits Flappy Bird, with its link');
ok(await ev(`document.querySelectorAll('#pasos li').length`) === 3 && await ev(`getComputedStyle(document.getElementById('pasos')).display`) !== 'none', 'three steps, in view on a tall phone');
ok(await ev(`document.getElementById('btn-jugar').classList.contains('btn--yellow')`), 'Jugar is yellow');
ok(await ev(`!!(document.getElementById('lang-slot').compareDocumentPosition(document.getElementById('btn-jugar')) & Node.DOCUMENT_POSITION_FOLLOWING)`), 'the language toggle comes before Jugar (C-5)');
ok(await ev(`(() => { const r = document.querySelector('.titulo-aletazo .rainbow'), t = document.querySelector('.titulo-aletazo'); return r.scrollWidth <= r.clientWidth + 1; })()`), 'the title is not clipped');
ok(await ev(`(() => { const g = __aletazo.g, s = document.getElementById('escenario').getBoundingClientRect(), c = document.getElementById('tarjeta-portada').getBoundingClientRect(), top = (c.top - s.top) / s.height;
  return !!g.band && g.gates.every(h => h.y + h.r < top) && g.bird.y < top; })()`), 'the demo flies above the card, whole');
const y0 = await ev(`__aletazo.g.bird.y`), x0 = await ev(`__aletazo.g.gates[0].x`);
await sleep(700);
ok(await ev(`__aletazo.g.mode`) === 'demo' && await ev(`__aletazo.g.gates[0].x`) < x0 && await ev(`__aletazo.g.bird.y`) !== y0, 'behind it, the demo flies itself');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll at 375 px');
await b.shot('01-cover');

await ev(`document.getElementById('btn-jugar').click(); 1`);
ok(await waitFor(`!!document.getElementById('cuenta') && document.getElementById('portada').hidden`, 1500), 'Jugar starts the 3, 2, 1…');
ok(await ev(`__aletazo.g.mode`) === 'demo' && await ev(`getComputedStyle(document.getElementById('lienzo')).filter`).then(f => /blur/.test(f)), 'with the bird flying on its own behind it, blurred');
await ev(`${TAP}; 1`);
ok(await ev(`__aletazo.g.mode`) === 'demo' && await ev(`__aletazo.g.score`) === 0, 'a tap during the countdown does nothing');
ok(await waitFor(`/¡A jugar!/.test(document.getElementById('cuenta')?.textContent || '')`, 4500), '… ¡A jugar!');
ok(await waitFor(`!document.getElementById('cuenta')`, 2000) && !await ev(`document.getElementById('hud').hidden`), 'the countdown leaves and the HUD shows');
ok(await ev(`__aletazo.g.mode`) === 'ready' && await ev(`!document.getElementById('pista').hidden && !document.getElementById('pista').classList.contains('fuera')`) && /Toca para aletear/.test(await ev(`document.getElementById('pista').textContent`)), 'and waits for the first tap: «👆 Toca para aletear»');
ok(await ev(`document.querySelectorAll('#vidas span:not(.off)').length`) === 3, 'with 3 lives');
await ev(`${TAP}; 1`);
ok(await ev(`__aletazo.g.mode`) === 'play' && await ev(`__aletazo.g.bird.vy`) < 0, 'the tap starts it and the bird goes up');
ok(await ev(`document.getElementById('pista').classList.contains('fuera')`), 'and the hint leaves');

const passed = await ev(PLAY(`g.passed >= 6`, 40000));
ok(passed >= 6, `taps get it through the gates (${passed})`);
ok(await waitFor(`/Nivel 2/.test(document.getElementById('aviso').textContent)`, 1500) || await ev(`__aletazo.g.level`) >= 2, 'a new level after 5 gates, announced');
ok(await ev(`document.getElementById('nivel').textContent`) === 'Nivel 2' || await ev(`__aletazo.g.level`) > 2, 'the HUD says the level');
ok(+await ev(`document.getElementById('marcador').textContent`) === await ev(`__aletazo.g.score`) && await ev(`__aletazo.g.score`) >= passed, 'and the score: +1 a gate, +2 through the middle');
await b.shot('02-play');

// No more taps: the ground takes the lives, the bird falls and the result shows
ok(await waitFor(`!document.getElementById('resultado').hidden`, 12000), 'without taps it loses its 3 lives and the result shows');
const score = await ev(`__aletazo.g.score`);
ok(+await ev(`document.getElementById('res-puntos').textContent`) === score, `the score (${score})`);
ok(/Nuevo récord/.test(await ev(`document.getElementById('res-sello').textContent`)), 'a first game is a new best');
ok((await ev(`document.getElementById('res-veredicto').textContent`)).length > 5, `a line about how it went («${await ev(`document.getElementById('res-veredicto').textContent`)}»)`);
ok(await ev(`document.getElementById('btn-otra').textContent`) === 'Jugar otra vez', 'Jugar otra vez');
ok(await ev(`document.querySelector('#res-salidas a')?.getAttribute('href')`) === '../../labs/', 'and the way back to the lab');
await b.shot('03-result');

await ev(`document.getElementById('btn-otra').click(); 1`);
ok(await waitFor(`!!document.getElementById('cuenta') && document.getElementById('resultado').hidden`, 1500), 'Jugar otra vez runs the countdown again');
ok(await waitFor(`__aletazo.g.mode === 'ready' && !document.getElementById('cuenta') && !document.getElementById('pista').classList.contains('fuera')`, 6000), 'and starts again, with the hint');
await ev(`${TAP}; 1`);
ok(await waitFor(`!document.getElementById('resultado').hidden`, 12000) && /Tu mejor: \d+/.test(await ev(`document.getElementById('res-mejor').textContent`)), 'a worse game shows «Tu mejor»');

await b.go(`${SITE}/labs/flap/?lang=en&test`, 1200);
ok(await waitFor(`/One tap, one flap/.test(document.getElementById('lema').textContent)`), 'in English, the cover is in English');
ok(/Inspired by Flappy Bird, by Dong Nguyen/.test(await ev(`document.getElementById('credito').textContent`)), 'the credit too');
ok(/Best: \d+/.test(await ev(`document.getElementById('mejor-portada').textContent`)), 'and shows the best kept on this phone');

ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();

// A short phone: 320 × 568
const s = await launch({ dir: `${OUT}/p320`, out: OUT, width: 320, height: 568 });
await s.go(`${SITE}/labs/flap/?test`, 1200);
ok(await s.evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll at 320 px');
ok(await s.evaluate(`(() => { const r = document.getElementById('btn-jugar').getBoundingClientRect(); return r.bottom <= innerHeight && r.height >= 44; })()`), 'Jugar is in view and 44 px tall on a short phone');
ok(await s.evaluate(`getComputedStyle(document.getElementById('pasos')).display === 'none' && getComputedStyle(document.getElementById('btn-como')).display !== 'none'`), 'the steps fold under «Cómo se juega ▾»');
await s.evaluate(`document.getElementById('btn-como').click(); 1`); await sleep(500);
ok(await s.evaluate(`(() => { const p = document.getElementById('pasos'), l = document.getElementById('lang-slot').getBoundingClientRect(), s = document.getElementById('escenario').getBoundingClientRect();
  return getComputedStyle(p).display !== 'none' && document.getElementById('btn-como').getAttribute('aria-expanded') === 'true' && l.bottom <= s.bottom && l.top >= s.top; })()`), 'opened, the steps show and the language toggle stays in view');
await s.shot('05-steps-320');
await s.shot('04-cover-320');
ok(!s.errors.length, `no errors at 320 px ${JSON.stringify(s.errors)}`);
s.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ aletazo (labs)');

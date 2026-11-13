// ¡Al toque! in the lab end to end, at /labs/microgames/: the lab offers it under Games being tried, crediting
// WarioWare; the cover is as tall as its content and fits above the fold; it shows the three ways to play at once (each with its moving gesture) above Jugar, the credit, no folded rules (D-550 exception), the ranking,
// the sound button and the site footer; Jugar starts a run of 10
// different microgames, with the HUD, a mark per game and the first intro wearing its type's gesture; a single
// game (¡Calcula!, answered right) ends on the run's summary with points, stars, Otra corrida and the way back to
// the lab, and the best is kept; a seed gives the same run twice; the 29 start without errors; a hidden page
// pauses and Seguir replays the game; the end offers Reta a alguien; the cover and games in English; at 320 px no sideways scroll. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { coverGapsOff } from '../cover-gaps.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/microgames-lab');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#seccion-microgames #btn-microgames')?.getAttribute('href')`) === 'microgames/', 'the lab offers ¡Al toque! under Games being tried');
ok(/WarioWare/.test(await ev(`document.querySelector('#seccion-microgames a[href*="WarioWare"]')?.textContent || ''`)), 'and says it is inspired by WarioWare, with its link');

await b.go(`${SITE}/labs/microgames/?test`, 1000);
ok(await waitFor(`!!document.getElementById('btn-jugar')`), 'the cover has Jugar');
ok(await ev(`[...document.querySelectorAll('#screen .kinds .kind')].filter(k => k.querySelector('.gstage .hand')).length`) === 3, 'the three ways to play at once, each with its finger doing the gesture');
ok(await ev(`(() => { const k = document.querySelector('#screen .kinds').getBoundingClientRect(), j = document.getElementById('btn-jugar').getBoundingClientRect(); return k.bottom <= j.top; })()`), 'and Jugar under them');
ok(await ev(`document.getElementById('demo').getBoundingClientRect().bottom - document.querySelector('.credit').getBoundingClientRect().bottom < 48`), 'the cover ends where its content ends: no empty band');
ok(/WarioWare/.test(await ev(`document.getElementById('link-warioware')?.textContent || ''`)), 'the cover credits WarioWare');
ok(await ev(`!!document.querySelector('#pie #btn-comentario')`), 'the cover ends with the site footer and its comment');
ok(await ev(`__microgames.ids.length`) === 29, "twenty-nine microgames");
await b.shot('01-cover');

ok(await ev(`document.querySelectorAll('.kinds .kind').length === 3 && document.querySelectorAll('.kinds .gstage .hand').length === 3`), 'the cover shows the three ways to play, each with its finger (instead of folded rules)');
ok(await (async () => { let inside = true; for (let k = 0; k < 10; k++) { inside = inside && await ev(`(()=>{const g=document.querySelector('.kind .g-desliza').getBoundingClientRect(), h=document.querySelector('.kind .g-desliza .hand').getBoundingClientRect(); return h.top >= g.top - 1 && h.bottom <= g.bottom + 1 && h.left >= g.left - 1 && h.right <= g.right + 1})()`); await sleep(200); } return inside; })(), 'and Desliza\'s hand stays inside its box all along its path');
ok(await ev(`(()=>{const g=document.querySelector('.kind .g-desliza').getBoundingClientRect(), p=document.querySelector('.kind .g-desliza .gpath').getBoundingClientRect(); return p.top - g.top >= 8})()`), 'and its line keeps clear of the box\'s top edge');
ok(await ev(`document.querySelector('.demo').getBoundingClientRect().bottom <= innerHeight`), 'the cover fits above the fold ' + await ev(`document.querySelector('.demo').getBoundingClientRect().bottom + '/' + innerHeight + ' scroll ' + scrollY`));
ok(await ev(`!!document.querySelector('#sound-slot .sound-toggle')`), 'a sound button in the top bar (C-4)');
await ev(`document.getElementById('btn-jugar').click(); 1`);
ok(await waitFor(`!document.getElementById('hud').hidden && !!__microgames.game && !document.getElementById('ranking').children.length`, 2000), 'Jugar starts the run, with the HUD, and the ranking goes away');
const order = await ev(`__microgames.order`);
ok(order.length === 10 && new Set(order).size === 10, `ten different microgames (${order.join(', ')})`);
ok(await ev(`document.querySelectorAll('#runbar i').length`) === 10, 'a mark per game in the run');
ok(await ev(`!!document.querySelector('#screen .gest .gstage') && !!document.getElementById('demo').dataset.kind`), 'the first intro shows its type\'s gesture, the stage framed in its color');
await b.shot('03-run');

// One game on its own: ¡Calcula!, answered right
await ev(`__microgames.only('calcula'); 1`);
ok(await waitFor(`!!document.querySelector('.opts3.low button')`, 6000), '¡Calcula! asks, with three answers at the bottom');
ok(await ev(`!document.getElementById('demo').dataset.kind`), 'the frame comes off while playing');
await ev(`(() => { const op = document.querySelector('.op').textContent.replace('−', '-').replace('×', '*'); const r = Function('return ' + op)(); document.querySelector('.opts3.low button[data-v="' + r + '"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); })(); 1`);
ok(await waitFor(`!!document.getElementById('btn-otra')`, 6000), 'the run ends on its summary');
ok(/★/.test(await ev(`document.querySelector('.runsum')?.textContent || ''`)) && await ev(`__microgames.total`) >= 1, 'with the stars it got');
ok(await ev(`document.querySelector('#btn-fin-lab')?.getAttribute('href')`) === '../../labs/', 'Otra corrida and the way back to the lab, from fin.js (C-19)');
ok(/pts/.test(await ev(`document.getElementById('screen').textContent`)), 'and the run\'s points');
ok(+(await ev(`localStorage.getItem('microgames:best-points')`)) >= 1, 'the best is kept');

// A shared run: the same seed, the same ten games on every phone
const runOf = async () => { await b.go(`${SITE}/labs/microgames/?test&seed=K7Q2X`, 800); await ev(`document.getElementById('btn-jugar').click(); 1`); return (await ev(`__microgames.order`)).join(); };
const r1 = await runOf(), r2 = await runOf();
ok(r1 === r2, `a seed gives the same run twice (${r1})`);
await b.shot('04-end');

// Every microgame starts without an error (a broken one used to show only when it came up in a run)
await b.go(`${SITE}/labs/microgames/?test`, 800);
await ev(`window.__errs = []; addEventListener('error', e => __errs.push(__microgames.game + ': ' + e.message)); 1`);
for (const id of await ev(`__microgames.ids`)) { await ev(`__microgames.only('${id}'); 1`); await sleep(2600); }
const errs = await ev(`__errs`);
ok(!errs.length, `the 29 microgames start without errors${errs.length ? `: ${errs.join(' · ')}` : ''}`);

// The phone locks mid-game: the game stops and waits for Seguir, then the same game starts again
await ev(`__microgames.only('calcula'); 1`); await sleep(2600);
await ev(`Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); 1`);
ok(await ev(`__microgames.paused && !!document.getElementById('btn-seguir')`), 'hidden mid-game: it pauses, with Seguir');
await ev(`Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.getElementById('btn-seguir').click(); 1`);
ok(await waitFor(`!__microgames.paused && __microgames.game === 'calcula' && __microgames.idx === 1`, 2000), 'Seguir starts the same game again');

// The end offers a challenge with the run's code
ok(await waitFor(`!!document.querySelector('.opts3.low button')`, 6000), 'it plays on');
await ev(`document.querySelector('.opts3.low button').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); 1`);
ok(await waitFor(`!!document.getElementById('btn-retar')`, 6000) && /^[A-HJ-NP-Z]{5}$/.test(await ev(`__microgames.code`)), 'the end has Reta a alguien, and every run a code');

// In English
await b.go(`${SITE}/labs/microgames/?test&lang=en`, 800);
ok(/microgames in a row/.test(await ev(`document.getElementById('screen').textContent`)) && /SWIPE/.test(await ev(`document.querySelector('.kinds').textContent`)), 'in English, the cover and its three ways');
await ev(`__microgames.only('cuenta'); 1`); await sleep(300);
ok(/COUNT!/.test(await ev(`document.getElementById('screen').textContent`)), 'and the microgames');
// ¡Pinball! (the owner, 2026-11-13): no taps saves none, holding a side down saves none, and tapping when a ball
// reaches its flipper saves at least one; a ball counts once a flipper has hit it
const pinball = async mode => {
  await b.go(`${SITE}/labs/microgames/?test`, 800);
  await ev(`__microgames.only('pinball'); 1`);
  await waitFor(`__microgames.active && !!window.__pinball`, 6000);
  await ev(`(() => { const demo = document.getElementById('demo'), r = demo.getBoundingClientRect(), held = [0, 0];
    const at = side => ({ bubbles: true, pointerId: side + 5, clientX: r.x + r.width * (side ? 0.75 : 0.25), clientY: r.y + r.height * 0.9 });
    if ('${mode}' === 'hold') { demo.dispatchEvent(new PointerEvent('pointerdown', at(0))); return 1; }
    if ('${mode}' !== 'bot') return 1;
    const iv = setInterval(() => { const P = window.__pinball; if (!P || !__microgames.active) { clearInterval(iv); return; }
      for (const side of [0, 1]) if (!held[side] && P.balls.some(q => q.live && q.trail.length && q.vy > 0 && q.y > P.fy - P.H * 0.07 && q.y < P.fy + 10 && (side ? q.x > P.W / 2 : q.x < P.W / 2))) {
        demo.dispatchEvent(new PointerEvent('pointerdown', at(side))); held[side] = 1;
        setTimeout(() => dispatchEvent(new PointerEvent('pointerup', at(side))), 140); setTimeout(() => { held[side] = 0; }, 420); } }, 16);
    return 1; })()`);
  let saved = 0; for (let k = 0; k < 80 && await ev(`__microgames.active`); k++) { saved = await ev(`window.__pinball.saved`); await sleep(100); }
  return { saved, taps: await ev(`window.__pinball.taps`) };
};
const p0 = await pinball('none'), ph = await pinball('hold');
let best = 0, tapsUsed = 0; for (let k = 0; k < 3 && best < 1; k++) { const r = await pinball('bot'); best = Math.max(best, r.saved); tapsUsed = r.taps; }
ok(p0.saved === 0 && ph.saved === 0, `¡Pinball!: no taps saves none, nor holding a side down (${p0.saved}, ${ph.saved})`);
ok(best >= 1 && tapsUsed >= 3, `¡Pinball!: tapping when a ball reaches its flipper saves some (${best} with ${tapsUsed} taps)`);
await b.shot('pinball');

b.close();
const s = await launch({ dir: `${OUT}/p320`, out: OUT, width: 320, height: 640 });
await s.go(`${SITE}/labs/microgames/?test`, 1000);
ok(await s.evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'at 320 px, no sideways scroll on the cover');
ok(await s.evaluate(`!document.getElementById('reglas') && document.querySelector('#ranking').children.length > 0`), 'no folded rules (the cover shows the three ways), and the ranking under the stage');
ok(await s.evaluate(`document.getElementById('ranking').getBoundingClientRect().top - document.getElementById('demo').getBoundingClientRect().bottom === 12`), 'the ranking sits 12 px under the stage, like every block of a cover (ranking.css)');
ok(await s.evaluate(coverGapsOff) === '[]', 'every block of the cover is 12 px from the next');
await s.evaluate(`document.querySelector('.tr-tab')?.click(); 1`); await sleep(300);
ok(await s.evaluate(`document.querySelectorAll('.tr-mg-b').length === __microgames.ids.length`), 'the tester tab offers every microgame (D-551)');
s.close();
if (failures) { console.log(`✗ ${failures} failed`); process.exit(1); }
console.log('✓ ¡Al toque! in the lab');

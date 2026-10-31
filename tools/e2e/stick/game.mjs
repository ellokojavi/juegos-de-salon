// 🥷 Ninja (id `stick`), out of the lab, end to end at its standalone page /ninja/: the waiting room with
// the self-playing demo and the credit to Stick Hero (Ketchapp) with its link; Empezar goes to the night with the score, the
// three lives and the hint. A real tap (a stick far too short) costs a life and the ninja climbs back;
// three flags in a row through the page's own hook score 2 + 3 + 4 and show the streak chip; a hidden
// page pauses (the run freezes, a tap takes it off); the last lives go, the run ends with «Ver
// resultado» and the result has the share card with its 🎯. At 320 × 568, in the three languages,
// nothing scrolls sideways. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const OUT = output('/tmp/stick-game');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

let b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.textContent || ''`);
const STAGE = `!!document.getElementById('sn-escenario') && !document.getElementById('cuenta')`;
const READY = `window.__stick && window.__stick.g.phase === 'ready'`;
/** One stick through the hook, as a finger would: held for the tip to land `off` from the next pillar's center. */
const stick = off => ev(`(()=>{const s=window.__stick,t=performance.now();s.presionar(t);s.soltar(t+s.sostener(${off},t));return 1})()`);
const SHORT = `-(window.__stick.columna(window.__stick.g.i+1).w/2+12)`;

async function start(url) {
  await b.open(url, 2500);
  ok(await b.until(`document.getElementById('btn-empezar')`, 6000), `${url.replace(SITE, '')}: the waiting room has Empezar`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  return b.until(STAGE, 9000);
}

try {
  // ——— The waiting room ———
  await b.open(`${SITE}/ninja/?test`, 2500);
  ok(await b.until(`document.getElementById('btn-empezar')`, 6000), 'the standalone page /ninja/ opens its waiting room');
  ok(await b.until(`!!document.querySelector('canvas.sn-demo')`, 4000), 'with the self-playing demo on the cover');
  ok(/Stick Hero/.test(await text('#sn-credito')) && await ev(`!!document.querySelector('#sn-credito a[href*="ketchappgames.com"]')`), 'it credits Stick Hero, by Ketchapp, with its link');
  ok(/Ninja/.test(await ev(`document.body.innerText`)), 'its name is Ninja');
  await b.shot('01-waiting-room');

  // ——— A run ———
  ok(await start(`${SITE}/ninja/?test&seed=NINJA`), 'Empezar goes to the night');
  ok(await b.until(READY, 4000), 'the ninja waits on its pillar');
  ok(await ev(`document.querySelectorAll('#sn-vidas span').length`) === 3, 'three lives');
  ok((await text('#sn-aviso')).length > 0, `the hint: «${await text('#sn-aviso')}»`);
  await b.shot('02-night');

  // A real tap: a stick far too short, a life gone, and the climb back
  const [x, y] = await ev(`(()=>{const r=document.getElementById('sn-escenario').getBoundingClientRect();return [Math.round(r.left+r.width/2),Math.round(r.top+r.height/2)]})()`);
  await b.tap(x, y);
  ok(await b.until(`window.__stick.g.lives === 2`, 4000), 'a real tap drops a short stick and costs a life');
  ok(await b.until(`document.querySelectorAll('#sn-vidas .sn-perdida').length === 1`, 2000), 'a heart goes dark');
  ok(await b.until(READY, 7000), 'the ninja climbs back onto the same pillar');

  // Three flags in a row: 2 + 3 + 4
  for (let k = 0; k < 3; k++) {
    await stick(0);
    ok(await b.until(`window.__stick.g.bridges === ${k + 1} && window.__stick.g.phase === 'ready'`, 5000), `flag ${k + 1}`);
  }
  ok(await ev(`window.__stick.g.score`) === 9, `three flags in a row score 2 + 3 + 4: ${await ev(`window.__stick.g.score`)}`);
  ok(await text('#sn-marcador') === '9', 'the score on screen');
  ok(await ev(`!document.getElementById('sn-racha').hidden`), `the streak chip: «${await text('#sn-racha')}»`);
  await b.shot('03-streak');

  // A hidden page pauses; a tap takes it off
  await ev(`window.__stick.pausar(); 1`);
  ok(await ev(`!document.getElementById('sn-pausa').hidden`), 'paused: the notice is over the night');
  await sleep(1500);
  await b.tap(x, y);
  ok(await b.until(`document.getElementById('sn-pausa').hidden`, 2000), 'a tap takes the pause off');
  ok(await ev(`window.__stick.g.phase`) === 'ready', 'and that tap drops no stick');

  // The last two lives
  for (let k = 0; k < 2; k++) {
    await b.until(READY, 7000);
    await ev(`(()=>{const s=window.__stick,t=performance.now();s.presionar(t);s.soltar(t+s.sostener(${SHORT},t));return 1})()`);
    await b.until(`window.__stick.g.lives === ${1 - k}`, 5000);
  }
  ok(await b.until(`!!document.getElementById('btn-fin')`, 6000), 'the last life ends the run with its button');
  ok(await text('#sn-puntaje') === '9', `the end shows the points: ${await text('#sn-puntaje')}`);
  ok(/3/.test(await text('.sn-desglose')), `and how they came: «${await text('.sn-desglose')}»`);
  await b.shot('04-end');
  await ev(`document.getElementById('btn-fin').click(); 1`);
  ok(await b.until(`/🎯🎯🎯/.test(document.body.innerText)`, 6000), 'the result has the share card with the three flags');
  await b.shot('05-result');

  // ——— 320 px, three languages ———
  await b.close();
  b = await launch({ dir: `${OUT}/p320`, out: OUT, width: 320, height: 568 });
  for (const lang of ['es', 'en', 'pt']) {
    await b.open(`${SITE}/ninja/?test&lang=${lang}&seed=L${lang}`, 2500);
    await b.until(`document.getElementById('btn-empezar')`, 6000);
    ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `${lang}: no sideways scroll in the waiting room`);
    await ev(`document.getElementById('btn-empezar').click(); 1`);
    ok(await b.until(STAGE, 9000), `${lang}: the night opens`);
    ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `${lang}: no sideways scroll in the game`);
    await b.shot(`06-320-${lang}`);
  }
} catch (e) {
  ok(false, `the script failed: ${e.message}`);
} finally {
  await b.close();
  console.log(failures ? `✗ ${failures} failed` : '✓ Ninja end to end');
  process.exit(failures ? 1 : 0);
}

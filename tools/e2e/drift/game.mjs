// Drift (lab): the grey-box drive to the result (docs/rally/core.md, section 13). On the three-gate test
// stage (?test), «Jugar» double-tapped (one run, C-14), the shared countdown, then the hook
// window.__drift switches on the autopilot and the page's own loop drives the stage: the HUD counts the
// gates, the result shows the time and the exits back to the lab, at 375 and 320 px with no sideways
// scroll. It asserts on __drift.g, never on pixels or frame rate (CI's Chrome draws in software).
// Then: a touch on one half steers that way, the page hidden pauses, a reload offers to continue.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { doubleTap } from '../double-tap.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const URL = SITE + '/labs/drift/?test';
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };

for (const width of [375, 320]) {
  const b = await launch({ port: 0, dir: OUT + '/p' + width, out: OUT, width, height: 700 });
  await b.go(URL); await b.evaluate('localStorage.clear(); sessionStorage.clear(); 1'); await b.go(URL);
  await b.shot(`cover-${width}`);
  await doubleTap(b, '#btn-play');
  ok(await b.until("document.querySelector('#screen-play.active') && !!window.__drift.g", 2000), `${width}: «Jugar» opens the stage`);
  ok(await b.evaluate("document.querySelectorAll('#cuenta').length <= 1"), `${width}: a double tap starts one countdown`);
  ok(await b.until("!document.getElementById('cuenta')", 6000), `${width}: the countdown ends`);
  if (width === 375) {
    // A finger on the right half steers right (clockwise: the heading goes down)
    const h0 = await b.evaluate('window.__drift.g.car.h');
    const box = JSON.parse(await b.evaluate("JSON.stringify(document.getElementById('stage').getBoundingClientRect())"));
    await b.evaluate(`(() => { const s = document.getElementById('stage'), o = { pointerId: 7, clientX: ${box.x + box.width * 0.8}, clientY: ${box.y + box.height * 0.6}, bubbles: true, button: 0 };
      s.dispatchEvent(new PointerEvent('pointerdown', o)); window.__up = () => s.dispatchEvent(new PointerEvent('pointerup', o)); return 1 })()`);
    await sleep(700);
    const h1 = await b.evaluate('window.__drift.g.car.h');
    await b.evaluate('window.__up(); 1');
    ok(h1 < h0 - 0.05, `${width}: holding the right half turns the car right (${h0.toFixed(2)} → ${h1.toFixed(2)})`);
    ok(await b.evaluate("document.getElementById('hint').classList.contains('fuera')"), `${width}: the first touch sends the hint away`);
    // Back to the start line for a clean autopilot run
    await b.evaluate('window.__drift.reset(); 1');
  }
  await b.evaluate('window.__drift.autopilot(true); 1');
  await sleep(1500);
  ok(await b.evaluate("window.__drift.g.mode === 'play' && window.__drift.g.t > 0"), `${width}: the clock runs`);
  await b.shot(`stage-${width}`);
  ok(await b.until('window.__drift.g.gate >= 1', 15000), `${width}: the first gate is passed`);
  ok(/Puerta 2 de 3/.test(await b.evaluate("document.getElementById('gate').textContent")), `${width}: the HUD counts the gates`);
  ok(await b.until("document.querySelector('#screen-result.active')", 30000), `${width}: the run reaches the result`);
  const g = JSON.parse(await b.evaluate('JSON.stringify({ mode: window.__drift.g.mode, gates: window.__drift.g.splits.length, t: window.__drift.g.t })'));
  ok(g.mode === 'done' && g.gates === 3, `${width}: three gates and the finish (${g.gates}, ${g.mode})`);
  ok(/^\d:\d\d\.\d{3}$/.test(await b.evaluate("document.getElementById('result-time').textContent")), `${width}: the result shows the time as m:ss.mmm`);
  ok(await b.evaluate("!!document.querySelector('#fin-salidas a[href$=\"labs/\"]')"), `${width}: the result goes back to the lab (C-19)`);
  ok(await b.evaluate('!!document.getElementById("btn-share") && !!document.getElementById("btn-again")'), `${width}: the result offers to play again and to share`);
  ok(await b.evaluate('document.documentElement.scrollWidth <= innerWidth'), `${width}: no sideways scroll`);
  await b.shot(`result-${width}`);
  ok(!b.errors.length, `${width}: no console errors` + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));

  if (width === 375) {
    // Paused when hidden, and a reload offers to continue the run
    await b.evaluate("document.getElementById('btn-again').click(); 1");
    ok(await b.until("!document.getElementById('cuenta') && window.__drift.S.live", 7000), `${width}: «Jugar otra vez» starts a new run`);
    await b.evaluate('window.__drift.pause(); 1');
    ok(await b.evaluate("!document.getElementById('pause').hidden && window.__drift.S.paused"), `${width}: hiding the page pauses the run`);
    const t = await b.evaluate('window.__drift.g.t'); await sleep(500);
    ok(await b.evaluate('window.__drift.g.t') === t, `${width}: the clock stops while paused`);
    await b.shot(`pause-${width}`);
    await b.go(URL);
    ok(await b.until("document.querySelector('#resume-slot .btn')", 2500), `${width}: after a reload the cover offers to continue`);
    await b.evaluate("document.getElementById('btn-resume').click(); 1");
    ok(await b.until("document.querySelector('#screen-play.active')", 2000), `${width}: «Continuar» goes back to the stage`);
  }
  b.close();
}
process.exit(failures ? 1 : 0);

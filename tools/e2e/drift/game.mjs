// Drift (lab): the grey-box drive to the result (docs/rally/core.md, section 13). On the three-gate test
// stage (?test), «Jugar» double-tapped (one run, C-14), the shared countdown, then the hook
// window.__drift switches on the autopilot and the page's own loop drives the stage: the HUD counts the
// gates, the result shows the time and the exits back to the lab, at 375 and 320 px with no sideways
// scroll. It asserts on __drift.g, never on pixels or frame rate (CI's Chrome draws in software).
// Touch through the real controls: wheel and pedal at 375 (accelerate, steer, brake while turning),
// one finger at 320. Then: the page hidden pauses, a reload offers to continue.
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
  await b.go(URL); await b.evaluate('localStorage.clear(); sessionStorage.clear(); 1');
  // The 320 run plays the one-finger scheme, as the tuning panel saves it
  if (width === 320) await b.evaluate(`localStorage.setItem('juegos-de-salon:drift:tuning', JSON.stringify({ tuning: {}, view: { scheme: 'stick' } })); 1`);
  await b.go(URL);
  await b.shot(`cover-${width}`);
  await doubleTap(b, '#btn-play');
  ok(await b.until("document.querySelector('#screen-play.active') && !!window.__drift.g", 2000), `${width}: «Jugar» opens the stage`);
  ok(await b.evaluate("document.querySelectorAll('#cuenta').length <= 1"), `${width}: a double tap starts one countdown`);
  ok(await b.until("!document.getElementById('cuenta')", 6000), `${width}: the countdown ends`);
  // Touch, through the page's real controls: pointer events on the stage, relative to where each thumb lands
  const box = JSON.parse(await b.evaluate("JSON.stringify(document.getElementById('stage').getBoundingClientRect())"));
  const finger = (id, x, y) => b.evaluate(`(() => { const s = document.getElementById('stage'), o = { pointerId: ${id}, clientX: ${x}, clientY: ${y}, bubbles: true, button: 0 };
    s.dispatchEvent(new PointerEvent('pointerdown', o)); return 1 })()`);
  const move = (id, x, y) => b.evaluate(`(() => { document.getElementById('stage').dispatchEvent(new PointerEvent('pointermove', { pointerId: ${id}, clientX: ${x}, clientY: ${y}, bubbles: true })); return 1 })()`);
  const lift = id => b.evaluate(`(() => { document.getElementById('stage').dispatchEvent(new PointerEvent('pointerup', { pointerId: ${id}, bubbles: true })); return 1 })()`);
  const car = async () => JSON.parse(await b.evaluate('JSON.stringify({ h: window.__drift.g.car.h, v: window.__drift.g.car.speed, mode: window.__drift.g.mode })'));
  const lx = box.x + box.width * 0.25, rx = box.x + box.width * 0.75, y = box.y + box.height * 0.6;
  ok((await car()).mode === 'ready', `${width}: after the countdown the car waits for the throttle`);
  if (width === 375) {
    // Wheel and pedal (the default): the right thumb held accelerates and starts the clock
    await finger(8, rx, y); await sleep(900);
    const a = await car();
    ok(a.mode === 'play' && a.v > 3, `${width}: wheel and pedal: holding the right thumb accelerates (${a.v.toFixed(1)} m/s)`);
    ok(await b.evaluate("document.querySelectorAll('.dr-touch').length === 1"), `${width}: the thumb's pedal gauge shows`);
    ok(await b.evaluate(`document.querySelector('.dr-touch--pedal').getBoundingClientRect().bottom < ${y} - 40`), `${width}: the pedal gauge sits above the thumb, where the thumb does not cover it`);
    ok(await b.evaluate("document.getElementById('hint').classList.contains('fuera')"), `${width}: the first touch sends the hint away`);
    // The left thumb lands and slides right: the car turns right (clockwise: the heading goes down)
    await finger(7, lx, y); await move(7, lx + 60, y); await sleep(600);
    const b1 = await car();
    ok(b1.h < a.h - 0.05, `${width}: sliding the left thumb right turns the car right (${a.h.toFixed(2)} → ${b1.h.toFixed(2)})`);
    // Braking while turning: the pedal slid down
    await move(8, rx, y + 70); await sleep(500);
    const c = await car();
    ok(await b.evaluate('window.__drift.g.car.brake > 0.5 && window.__drift.g.car.steer > 0.5'), `${width}: the car knows the brake and the wheel applied (its brake lights and front wheels)`);
    const knob = JSON.parse(await b.evaluate("JSON.stringify([document.querySelector('.dr-touch--pedal').getBoundingClientRect(), document.querySelector('.dr-touch--pedal .dr-touch-dot').getBoundingClientRect()])"));
    ok(knob[1].y + knob[1].height / 2 > knob[0].y + knob[0].height * 0.6, `${width}: the pedal's knob goes down the bar into the brake`);
    ok(c.v < b1.v - 1 && c.h < b1.h, `${width}: the pedal slid down brakes, and the car still turns (${b1.v.toFixed(1)} → ${c.v.toFixed(1)} m/s)`);
    await lift(7); await lift(8); await sleep(100);
    ok(await b.evaluate("document.querySelectorAll('.dr-touch').length === 0"), `${width}: lifting the thumbs clears their gauges`);
  } else {
    // One finger, chosen in the tuning panel: up accelerates, sideways steers, down brakes
    await finger(9, lx, y); await move(9, lx, y - 60); await sleep(900);
    const a = await car();
    ok(a.mode === 'play' && a.v > 3, `${width}: one finger: sliding up accelerates (${a.v.toFixed(1)} m/s)`);
    await move(9, lx - 50, y - 60); await sleep(500);
    const b1 = await car();
    ok(b1.h > a.h + 0.05, `${width}: one finger: sliding left turns left (${a.h.toFixed(2)} → ${b1.h.toFixed(2)})`);
    await move(9, lx, y + 60); await sleep(500);
    ok((await car()).v < b1.v - 1, `${width}: one finger: sliding down brakes`);
    await lift(9);
  }
  // Back to the start line for a clean autopilot run
  await b.evaluate('window.__drift.reset(); 1');
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

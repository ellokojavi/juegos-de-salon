// Liar's Dice: shaking the phone to roll and the turn's clock (D-447).
// Against the phone with the shake on by default and the clock turned on: the dice come face down and a shake (synthetic
// devicemotion events) rolls them on screen while it lasts, and they land once it stops; running out of time costs a die
// with no reveal. Then, on a page that never hears from a sensor, a button rolls them.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 320, height: 700 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let fails = 0;
const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) fails++; };
const switches = () => ev(`[...document.querySelectorAll('#setup-form .toggle-row b')].map(b=>b.textContent).join(' | ')`);
const jolt = i => ev(`window.dispatchEvent(new DeviceMotionEvent('devicemotion', { acceleration: { x: ${i % 2 ? -22 : 22}, y: 4, z: 1 }, accelerationIncludingGravity: { x: 22, y: 13, z: 1 }, interval: 16 })); 1`);
/** The shaking box right now: 3D dice or flat ones, how big, and where the dice are. */
const tray = () => ev(`(()=>{const m=document.querySelector('.agite-caja .agite-mesa');if(!m||!m.isConnected)return null;const c=[...m.querySelectorAll('.dado3d')];const one=m.firstElementChild;return{three:c.length>0,cubes:c.length,size:one?Math.round(one.getBoundingClientRect().width):0,moves:c.map(d=>d.style.transform).join('|'),faces:[...m.querySelectorAll('.die')].map(d=>d.querySelectorAll('i').length).join('')}})()`);
let tumbled = null, buzzes = 0, stillRolling = null;
const shake = async () => {
  // Counts the phone's vibrations: headless Chrome has none of its own
  await ev(`window.__buzz = 0; navigator.vibrate = () => { window.__buzz++; return true; }; 1`);
  await jolt(0); await sleep(150);
  // Mid-shake the dice roll on screen: 3D cubes, moving frame to frame
  const a = await tray(); if (tumbled === null) await b.shot('02-rolling'); await sleep(60); const c = await tray();
  tumbled = !!(a?.three && a.cubes > 0 && a.moves !== c.moves);
  // Shaking on and on, well past the three jolts that are the minimum: they keep rolling
  for (let i = 1; i < 9; i++) { await jolt(i); await sleep(200); }
  stillRolling = await ev(`!window.__dudo.session().rolling && !!document.querySelector('#mine.agitando .dado3d')`);
  buzzes = await ev(`window.__buzz`);
  await sleep(3400);   // the hand still (350 ms), the dice running out their spin (up to 1.5 s), a breath, and the cloth turning into the hand (480 ms)
};
const covered = () => ev(`!!document.querySelector('#mine.agitando .agite-caja')`);
const myDice = () => ev(`document.querySelectorAll('#mine .dice-row .die').length`);
const overlay = () => ev(`document.getElementById('handoff').hidden === false`);
const proceed = () => ev(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'no';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`);
const setName = n => ev(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);

await b.go(`${SITE}/`);
await ev(`localStorage.clear(); 1`);

/* ---------- Against the phone, both switches on ---------- */
await b.go(`${SITE}/liars-dice/`);
await ev(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(500);
const labels = await switches();
console.log('switches:', labels);
check(/Agitar/.test(labels) && /segundos/.test(labels), 'setup offers shaking and the clock');
check(await ev(`(()=>{const r=[...document.querySelectorAll('#setup-form .toggle-row')];const on=t=>r.find(x=>t.test(x.textContent))?.querySelector('.switch').classList.contains('on');return on(/Agitar/)===true&&on(/segundos/)===false})()`), 'the shake starts on and the clock off');
await setName('Javi');
await ev(`[...document.querySelectorAll('#setup-form .toggle-row')].filter(r=>/segundos/.test(r.textContent)).forEach(r=>r.querySelector('.switch').click()); 1`);
await b.shot('01-setup-switches');
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(300);
// A phone streams readings even when still: one calm reading says there is a sensor
await ev(`window.dispatchEvent(new DeviceMotionEvent('devicemotion', { acceleration: { x: 0.1, y: 0, z: 0.2 }, interval: 16 })); 1`);
await sleep(300);

check(await covered(), 'the round starts with the dice face down');
const box = await tray();
check(box?.faces === '00000', 'no face shows before shaking: they wait face down on the cloth');
check(await ev(`document.querySelectorAll('#mine .mine-label, #mine > .dice-row').length === 0`), 'the cloth is the only panel: the hand is not drawn beside it');
check(/Tira tus dados/.test(await ev(`document.getElementById('actions').textContent`)), 'no bid buttons before rolling');
check(await ev(`!document.getElementById('turn-clock').hidden`), 'the clock runs on my turn, rolling included');
await b.shot('02-face-down');
await shake();
check(tumbled, 'while the phone shakes, 3D dice tumble on screen');
check(buzzes >= 5, `and the phone rattles with them: ${buzzes} vibrations`);
check(stillRolling, 'while the phone keeps shaking they keep rolling: they settle only once it stops');
check(!(await covered()) && (await myDice()) === 5, `then they land in the hand: ${await myDice()} dice`);
check((await tray()) === null && !(await ev(`document.getElementById('mine').classList.contains('agitando')`)), 'and the cloth turned back into the hand');
const hand = await ev(`Math.round(document.querySelector('#mine .dice-row .die').getBoundingClientRect().width)`);
check(box?.size > hand, `the cloth's dice were bigger than the hand's (${box?.size} px against ${hand})`);
check(await ev(`document.querySelectorAll('.pinta').length === 6`), 'and the bid buttons show');
await b.shot('03-clock');

// Out of time: the clock is moved to its last second instead of waiting 30
await ev(`window.__dudo.session().turn.used = 29700; 1`); await sleep(700);
check(await overlay(), 'out of time, a screen says so');
const said = await ev(`document.getElementById('handoff').textContent`);
console.log('time up:', said);
check(/se le acabó el tiempo/.test(said) && /pierde un dado/.test(said), 'it names who ran out and that they lose a die');
check(await ev(`!document.querySelector('#handoff .reveal-table')`), 'and the table stays covered');
await b.shot('04-time-up');
await proceed(); await sleep(600);
check(await ev(`window.__dudo.view().st.A.dice === 4 && window.__dudo.view().st.B.dice === 5`), 'Javi has 4 dice, the phone 5');
check(await covered(), 'a new round, new dice to roll');
await shake();
check((await myDice()) === 4, `shaking again: ${await myDice()} dice`);
// A bid: the phone answers within its own time, and the clock starts over for the next turn
await ev(`document.querySelectorAll('.pinta')[5].click(); document.querySelector('#actions .btn--yellow').click(); 1`);
await sleep(300);
check(await ev(`document.getElementById('turn-clock').hidden`), 'the clock hides on the phone’s turn');
await sleep(1300);
if (await ev(`window.__dudo.view().current === 'A'`)) {
  const used = await ev(`window.__dudo.session().turn.used`);
  check(used < 3000, `back on my turn, the clock started over (${Math.round(used)} ms used)`);
}
const hist = await ev(`window.__dudo.view().history.map(h=>h.type).join(',')`);
check(hist.startsWith('timeout'), `the history keeps the timeout: ${hist}`);

/* ---------- No sensor: a button rolls them ---------- */
await ev(`localStorage.clear(); 1`);
await b.go(`${SITE}/liars-dice/`);
await ev(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(500);
await setName('Cata');
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(1400);
// Chrome, like an iPhone, can ask for the motion permission: silent, the page asks first
if (await ev(`!!document.getElementById('btn-permiso')`)) {
  await b.shot('05-permission');
  await ev(`document.getElementById('btn-permiso').click(); 1`); await sleep(1400);
}
check(await ev(`!!document.getElementById('btn-tirar')`), 'with no reading from a sensor, a button rolls instead');
check(await ev(`document.getElementById('turn-clock').hidden`), 'with the clock off, no clock');
await b.shot('06-no-sensor');
await ev(`document.getElementById('btn-tirar').click(); 1`); await sleep(300);
check((await tray())?.three, 'the button rolls them in 3D too');
await sleep(3000);
check((await myDice()) === 5, 'the button rolls the dice');

await b.close();
console.log(fails ? `✗ ${fails} check(s) failed` : '✓ shaking and the clock work');
process.exit(fails ? 1 : 0);

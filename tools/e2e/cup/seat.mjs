// A phone that stopped being seated as its player (it lost its anonymous session, or the admin
// gave it a new PIN), with the day open: tapping Empezar must not tell it the day closed.
// It asks for the PIN with its name already picked, and with that it plays. Test store (?test), no network.
//
// Usage: python3 -m http.server 8765 -d public (in another terminal) and node tools/e2e/cup/seat.mjs [folder]
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const BASE = `${SITE}/cup/`;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };

const b = await launch({ port: 9517, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.disabled)return false;e.click();return true})()`);
const screen = () => ev('__copa.estado.pantalla');

try {
  // Javi, seated in the demo cup, with day 4 open
  await b.go(`${BASE}?test&demo=player`, 1500);
  await ev('window.confirm=()=>true; 1');
  const code = await ev('__copa.estado.code');
  // The phone loses its seat: Javi's PIN becomes 4321 and no phone stays seated
  await ev(`(async()=>{const { hashPin } = await import('./engine.js');
    const k='juegos-de-salon:copa:prueba', db=JSON.parse(localStorage.getItem(k));
    db['${code}']._keys.javi02 = await hashPin('${code}', 'javi02', '4321');
    db['${code}']._seats.javi02 = {};
    localStorage.setItem(k, JSON.stringify(db)); return 1})()`);
  // Arrives through the day's notification, as on the phone: straight to "Cómo se juega"
  await b.go(`${BASE}?${code}&test&day=4`, 1500);
  await ev('window.confirm=()=>true; 1');
  ok(await screen() === 'jugar', 'the notification opens day 4');
  ok(await click('#btn-empezar'), 'Empezar can be tapped');
  await sleep(600);
  ok(await screen() === 'entrar', 'without a seat, Empezar leads to signing in again');
  ok(!/se terminó|ya se term/i.test(await ev('document.body.innerText')), 'it does not say the day\'s time is over');
  ok(/Javi/.test(await ev(`document.getElementById('sentarse-de-nuevo')?.innerText || ''`)), 'it explains why the PIN is asked for, with their name');
  ok(await ev(`document.querySelector('.chip-btn.on')?.dataset.pid`) === 'javi02', 'their name is already picked');
  await b.shot('sit-again');
  await ev(`document.querySelector('#entrar-body input.pin').value='4321'; 1`);
  ok(await click('#btn-sentarse'), 'signs in with their PIN');
  await sleep(600);
  ok(await screen() === 'tablero', 'back to the board');
  ok(await ev('__copa.estado.yo') === 'javi02', 'seated again as Javi');
  ok(await click('[data-dia="4"]'), 'day 4 can be played');
  await sleep(300);
  ok(await click('#btn-empezar'), 'taps Empezar again');
  await sleep(800);
  ok(!!(await ev(`__copa.estado.copa.started?.[4]?.javi02`)), 'this time the day starts');
} finally {
  await b.close();
}

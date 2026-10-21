// Toque y Fama, playing solo: tapping a box chooses where the next digit goes (#604), only with a lab
// key (D-395; on localhost the lab opens by itself). The other boxes fill from the chosen one onward,
// a gap in the middle cannot be confirmed, and ⌫ clears the chosen box.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const SITE = process.env.SITE || 'http://localhost:8765';
const b = await launch({ dir: `${OUT}/profile`, out: OUT });
let fails = 0;
const check = (what, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fails++; console.log(`${ok ? '✓' : '✗'} ${what}: ${JSON.stringify(got)}${ok ? '' : ` (expected ${JSON.stringify(want)})`}`); };
await b.go(`${SITE}/bulls-and-cows/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/bulls-and-cows/?test`);
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
await b.evaluate(`document.getElementById('btn-solo-empezar').click(); 1`); await sleep(800);
const boxes = () => b.evaluate(`[...document.querySelectorAll('#solo-body .entry .box')].map(x=>x.textContent||'·').join('')`);
const active = () => b.evaluate(`[...document.querySelectorAll('#solo-body .entry .box')].findIndex(x=>x.classList.contains('active'))`);
const tapBox = i => b.evaluate(`document.querySelectorAll('#solo-body .entry .box')[${i}].click(); 1`);
const key = d => b.evaluate(`document.querySelector('#solo-body .keypad button[data-d="${d}"]').click(); 1`);
const disabled = d => b.evaluate(`document.querySelector('#solo-body .keypad button[data-d="${d}"]').disabled`);
const okOff = () => b.evaluate(`document.querySelector('#solo-body .keypad .ok').disabled`);
check('the boxes can be chosen', await b.evaluate(`!!document.querySelector('#solo-body .entry--elegir')`), true);
await tapBox(3); await key('9');
check('the digit goes in the chosen box', await boxes(), '···9');
check('then the first empty box is chosen', await active(), 0);
await key('1');
check('after 1, the next box', await boxes(), '1··9');
check('a gap cannot be confirmed', await okOff(), true);
await tapBox(2); await key('5');
check('filling the gap', await boxes(), '1·59');
check('the empty one left', await active(), 1);
check('a digit already written is off', await disabled('9'), true);
await key('0');
check('all four', await boxes(), '1059');
check('ready to confirm', await okOff(), false);
await b.shot('01-chosen');
await tapBox(1); await b.evaluate(`document.querySelector('#solo-body .keypad .del').click(); 1`);
check('⌫ clears the chosen box', await boxes(), '1·59');
await key('7'); await b.evaluate(`document.querySelector('#solo-body .keypad .ok').click(); 1`); await sleep(700);
check('the guess went in', await b.evaluate(`__tyf.guardada()?.jugadas?.i`), ['1759']);
check('the boxes start empty again', await boxes(), '····');
await b.close?.();
if (fails) { console.log(`❌ ${fails} check(s) failed`); process.exit(1); }
console.log('✅ choosing the box works');

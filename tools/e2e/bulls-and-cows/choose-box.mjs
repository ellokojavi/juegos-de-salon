// Toque y Fama, playing solo: deduction notes (at the end) and tapping a box chooses where the next digit goes (#604; validated in
// the lab and published for everyone, D-409). The other boxes fill from the chosen one onward,
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

// Deduction notes (#895, D-483, lab; on localhost the lab key opens by itself): with ✏️ Notes on,
// a tap cycles the digit's mark (🚫 → ? → ★ → none) instead of typing it; off, typing works again
// and the marks stay for the game. Here so as not to start one more Chrome (D-307 groups).
{
await b.go(`${SITE}/bulls-and-cows/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/bulls-and-cows/?test`);
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
await b.evaluate(`document.getElementById('btn-solo-empezar').click(); 1`); await sleep(800);
const q = s => `document.querySelector('#solo-body ${s}')`;
const boxes = () => b.evaluate(`[...document.querySelectorAll('#solo-body .entry .box')].map(x=>x.textContent||'·').join('')`);
const key = d => b.evaluate(`${q(`.keypad button[data-d="${d}"]`)}.click(); 1`);
const mark = d => b.evaluate(`(k => k.classList.contains('blocked') ? 'x' : k.classList.contains('mark-maybe') ? '?' : k.classList.contains('mark-sure') ? '★' : '')(${q(`.keypad button[data-d="${d}"]`)})`);
const toggle = () => b.evaluate(`${q('.marcas-toggle')}.click(); 1`);
check('the ✏️ Notes toggle is under the keypad', await b.evaluate(`${q('.marcas-toggle')}?.textContent`), '✏️ Notas');
await key('1');
check('off: a tap types', await boxes(), '1···');
await toggle();
check('on: its label says how to go back', await b.evaluate(`${q('.marcas-toggle')}.textContent`), '⌨️ Volver a escribir');
check('on: the hint shows', await b.evaluate(`!${q('.marcas-hint')}.hidden`), true);
check('on: ⌫ is off', await b.evaluate(`${q('.keypad .del')}.disabled`), true);
await key('2');
check('a tap does not type', await boxes(), '1···');
check('first tap: 🚫', await mark('2'), 'x');
await key('2'); check('second tap: ?', await mark('2'), '?');
await key('2'); check('third tap: ★', await mark('2'), '★');
await key('2'); check('fourth tap: no mark', await mark('2'), '');
await key('1');
check('striking a typed digit takes it out', await boxes(), '····');
await key('3'); await key('3');
await key('5'); await key('5'); await key('5');
await b.shot('01-notes-on');
await toggle();
check('off again: the hint hides', await b.evaluate(`${q('.marcas-hint')}.hidden`), true);
check('a struck digit does not type', (await key('1'), await boxes()), '····');
await b.evaluate(`document.querySelectorAll('#solo-body .entry .box')[0].click(); 1`);
await key('3'); await key('5'); await key('6'); await key('7');
check('? and ★ still type', await boxes(), '3567');
await b.evaluate(`${q('.keypad .ok')}.click(); 1`); await sleep(700);
check('the marks are saved with the game', (await b.evaluate(`__tyf.guardada()?.jugadas?.n`)).sort(), ['1', '?3', '★5'].sort());
check('and survive the next guess', [await mark('1'), await mark('3'), await mark('5')], ['x', '?', '★']);
await b.shot('02-after-guess');
}
await b.close?.();
if (fails) { console.log(`❌ ${fails} check(s) failed`); process.exit(1); }
console.log('✅ choosing the box and the deduction notes work');

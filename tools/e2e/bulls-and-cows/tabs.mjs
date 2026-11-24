// Toque y Fama: 🔢 Número and 🔤 Palabra are two tabs of one page (#767 follow-up): the toggle swaps
// the game in place (no page load, `assets/js/bulls-and-cows-tabs.js`), the URL follows, and Back swaps back.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const SITE = process.env.SITE || 'http://localhost:8765';
const b = await launch({ dir: `${OUT}/profile`, out: OUT });
let fails = 0;
const check = (what, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fails++; console.log(`${ok ? '✓' : '✗'} ${what}: ${JSON.stringify(got)}${ok ? '' : ` (expected ${JSON.stringify(want)})`}`); };
const screen = () => b.evaluate(`document.querySelector('.screen.active')?.id || null`);
const path = () => b.evaluate(`location.pathname`);
const tap = i => b.evaluate(`document.querySelectorAll('#selector-variante .opcion')[${i}].click(); 1`);
await b.go(`${SITE}/bulls-and-cows/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/bulls-and-cows/?test`);
await sleep(600);
await b.evaluate(`window.__sameDocument = true; 1`);
await tap(1); await sleep(1500);
check('Palabra: its URL', await path(), '/word/');
check('Palabra: its waiting room', await screen(), 'screen-jugar');
check('Palabra: the same document, no page load', await b.evaluate(`window.__sameDocument === true`), true);
check('Palabra: its toggle shows Palabra on', await b.evaluate(`document.querySelectorAll('#selector-variante .opcion')[1].classList.contains('on')`), true);
await b.shot('01-word');
await tap(0); await sleep(1500);
check('Número: back on its URL', await path(), '/bulls-and-cows/');
check('Número: its modes', await b.evaluate(`document.querySelectorAll('#modes .mode').length`), 3);
check('Número: still the same document', await b.evaluate(`window.__sameDocument === true`), true);
await b.evaluate(`history.back(); 1`); await sleep(1500);
check('Back: Palabra again', [await path(), await screen()], ['/word/', 'screen-jugar']);
await b.evaluate(`document.getElementById('btn-empezar').click(); 1`); await sleep(3500);   // after its title card
check('Palabra plays after the swap', await b.evaluate(`!!document.querySelector('#jugar-body .keypad') && !document.getElementById('btn-empezar')`), true);
await b.shot('02-word-playing');
await b.close?.();
if (fails) { console.log(`✗ ${fails} failed`); process.exit(1); }
console.log('✓ tabs');

// The card the player chose is the one placed, and no other (D-38).
// Played in solo mode, the ⏳ Lightning Line (D-142), which uses cup/games/timeline/ui.js.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const BASE = process.argv[3] || process.env.SITE || 'http://localhost:8765';
const b = await launch({ port: Number(process.env.CDP_PORT) || 9495, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const state = () => b.evaluate(`JSON.stringify({
  chosen: document.querySelector('#solo-juego .hand .card.sel')?.dataset.card || null,
  marked: document.querySelector('#solo-juego .hand .card.sel')?.innerText.replace(/\\n/g,' ') || null,
  button: (()=>{const x=document.getElementById('btn-colocar');return !x ? 'missing' : x.disabled ? 'disabled' : 'enabled'})(),
  buttonText: document.getElementById('btn-colocar')?.innerText.replace(/\\n/g,' · ') || '',
  moves: window.__ldt.solo().jugadas.length,
})`).then(JSON.parse);

await b.go(`${BASE}/timeline/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/timeline/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
await b.evaluate(`document.getElementById('btn-solo-empezar').click(); 1`); await sleep(1200);

// 1) Nobody chose anything: the app must not choose for the player
console.log('at start →', JSON.stringify(await state()));
// The tap on the card turned into a scroll and the player goes straight to the slot
await b.evaluate(`document.querySelectorAll('#solo-juego .line .slot')[0].click(); 1`); await sleep(250);
const noCard = await state();
console.log('taps only the slot →', JSON.stringify(noCard));
console.log(noCard.button === 'disabled' && noCard.chosen === null ? '  ✅ nothing can be placed without choosing' : '  ❌ can place without having chosen');

// 2) Chooses the third card of the strip: that one and no other is placed
const third = await b.evaluate(`(()=>{const c=document.querySelectorAll('#solo-juego .hand .card')[2];return JSON.stringify({id: c.dataset.card, text: c.querySelector('.t').textContent})})()`).then(JSON.parse);
await b.evaluate(`document.querySelectorAll('#solo-juego .hand .card')[2].click(); 1`); await sleep(200);
await b.evaluate(`document.querySelectorAll('#solo-juego .line .slot')[1].click(); 1`); await sleep(250);
const ready = await state();
console.log('chooses the third card →', JSON.stringify({ chosen: ready.chosen, button: ready.button, buttonText: ready.buttonText }));
console.log('  the button names the chosen card:', ready.buttonText.includes(third.text.slice(0, 18)));
await b.shot('choice-button');
await b.evaluate(`document.getElementById('btn-colocar').click(); 1`); await sleep(1400);
// The verdict shows the card that was placed; the saved move says which one it was
const placed = await b.evaluate(`(()=>{const j=window.__ldt.solo().jugadas;return JSON.stringify({id: j[j.length-1].c, text: document.querySelector('#handoff .card-big .t')?.textContent || ''})})()`).then(JSON.parse);
console.log('placed:', JSON.stringify(placed.text));
console.log(placed.id === third.id ? '  ✅ the chosen card was placed' : `  ❌ another one was placed: chose "${third.text}" and got "${placed.text}"`);
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

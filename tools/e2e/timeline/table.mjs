// All cards face up: full table from the first turn and no refills (D-43)
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const BASE = process.argv[3] || process.env.SITE || 'http://localhost:8765';
const b = await launch({ port: 9498, dir: `${OUT}/m`, out: OUT, width: 375, height: 812 });
const v = () => b.evaluate(`(()=>{const s=window.__ldt.view();return JSON.stringify({done:s.done,current:s.current,shared:s.shared,target:s.target,table:s.table,scores:s.scores,winner:s.winner})})()`).then(JSON.parse);
const screen = () => b.evaluate(`JSON.stringify({
  title: document.getElementById('hand-title')?.textContent,
  cards: document.querySelectorAll('#hand .card').length,
  left: document.getElementById('pool-left')?.textContent,
  width: document.documentElement.scrollWidth - document.documentElement.clientWidth,
})`).then(JSON.parse);
const closeOverlay = async () => { await b.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return;const btn=h.querySelector('.btn');if(btn)btn.click();else h.click();})()`); await sleep(450); };
/** Places the first card on the table; with `right: false` it deliberately puts it in the wrong slot. */
const play = async (right = true) => {
  const info = await b.evaluate(`(()=>{const s=window.__ldt.view();const card=s.hands[s.current][0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at,wrong:at===0?s.line.length:0,card,p:s.current})})()`).then(JSON.parse);
  await b.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(120);
  await b.evaluate(`document.querySelectorAll('#line .slot')[${right ? info.at : info.wrong}]?.click(); 1`); await sleep(120);
  await b.evaluate(`(()=>{const x=document.querySelector('#place-row .btn');if(x&&!x.disabled)x.click();})(); 1`);
  await sleep(900); await closeOverlay();
  return info;
};

await b.go(`${BASE}/timeline/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/timeline/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
console.log('setup opens on →', await b.evaluate(`document.querySelector('#setup-form .seg--cards button.on')?.textContent`), '(must be all face up)');
console.log('card options:', await b.evaluate(`[...document.querySelectorAll('#setup-form .seg--cards button')].map(x=>x.textContent).join(' | ')`));
console.log('size label:', await b.evaluate(`[...document.querySelectorAll('#setup-form label')].map(l=>l.textContent).join(' | ')`));
const hint = () => b.evaluate(`document.querySelector('#setup-form p.muted')?.textContent`);
console.log('hint with target 5:', await hint());
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('#setup-form .seg button')].find(e=>/7$/.test(e.textContent.trim()));x.click();return 1})()`); await sleep(200);
console.log('hint with target 7 (must say 14):', await hint());
await b.shot('table-01-setup');

// Two players, target 3 → table of 6
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('#setup-form .seg button')].find(e=>/3$/.test(e.textContent.trim()));x.click();return 1})()`); await sleep(150);
await b.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form .player-row input');['Javi','Cata'].forEach((n,i)=>{xs[i].value=n;xs[i].dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')][0].click(); 1`); await sleep(1200);
await closeOverlay();

let s = await v();
console.log('starts → target:', s.target, '| cards on the table:', s.table.length, '(must be 6)');
console.log('screen →', JSON.stringify(await screen()));
await b.shot('table-02-full-table');

// One hit and one miss: both times the table shrinks and nothing new comes in
const before = s.table.slice();
const hit = await play(true);
s = await v();
console.log('after a hit → table:', s.table.length, '| no new card came in:', s.table.every(c => before.includes(c)),
  '| the remaining ones keep their order:', JSON.stringify(s.table) === JSON.stringify(before.filter(c => c !== hit.card)));
const before2 = s.table.slice();
const miss = await play(false);
s = await v();
console.log('after a miss → table:', s.table.length, '| the missed one doesn\'t come back:', !s.table.includes(miss.card),
  '| no new one came in:', s.table.every(c => before2.includes(c)), '| score:', JSON.stringify(s.scores));
console.log('screen →', JSON.stringify(await screen()));
await b.shot('table-03-shrunk');

// To the end: either someone reaches the target, or the table runs empty
let guard = 0;
while (guard++ < 20) {
  s = await v();
  if (s.done) break;
  if (!(await b.evaluate(`!!document.querySelector('#place-row .btn')`))) { await closeOverlay(); continue; }
  await play(true);
}
s = await v();
console.log('final → done:', s.done, '| table:', s.table.length, '| score:', JSON.stringify(s.scores), '| winner:', JSON.stringify(s.winner));
console.log('screen:', await b.active());
console.log('ranking:', await b.evaluate(`[...document.querySelectorAll('#result-ranking li')].map(li=>li.innerText.replace(/\\n/g,' · ')).join(' | ')`));
await b.shot('table-04-result');

// The all-face-up solitaire is gone: playing solo is now ⏳ Línea Relámpago (D-142),
// which has its own script (timeline/solo.mjs).
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

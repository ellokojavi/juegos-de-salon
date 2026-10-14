// Línea de Tiempo: the round is played out and a tie goes to whoever answered faster (D-31)
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const BASE = process.argv[3] || process.env.SITE || 'http://localhost:8765';
const b = await launch({ port: 9494, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const v = () => b.evaluate(`(()=>{const s=window.__ldt.view();return JSON.stringify({done:s.done,current:s.current,hand:Object.fromEntries(Object.entries(s.hands).map(([k,h])=>[k,h.length])),winner:s.winner,times:s.times})})()`).then(JSON.parse);
const closeOverlay = async () => { await b.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'no';const btn=h.querySelector('.btn');if(btn){btn.click();return 'btn'}h.click();return 'tap'})()`); await sleep(500); };
/** Plays the right card for the player on turn, waiting `pause` ms before confirming. */
const play = async pause => {
  const info = await b.evaluate(`(()=>{const s=window.__ldt.view();const p=s.current;const card=s.hands[p][0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at,p})})()`).then(JSON.parse);
  await b.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(120);
  await b.evaluate(`document.querySelectorAll('#line .slot')[${info.at}]?.click(); 1`); await sleep(120);
  if (pause) await sleep(pause);
  const r = await b.evaluate(`(()=>{const x=document.querySelector('#place-row .btn');if(!x||x.disabled)return 'no';x.click();return 'ok'})()`);
  return `${info.p}:${r}`;
};

await b.go(`${BASE}/timeline/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/timeline/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
await b.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form input');xs[0].value='Javi';xs[0].dispatchEvent(new Event('input',{bubbles:true}));xs[1].value='Cata';xs[1].dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('.seg button')].find(e=>/Mano propia|Own hand/.test(e.textContent));if(x)x.click();return 1})()`); await sleep(150);
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('.seg button')].find(e=>/3$/.test(e.textContent.trim()));if(x)x.click();return 1})()`);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')][0].click(); 1`); await sleep(1200);
await closeOverlay();

// Javi (A) answers right away, Cata (B) takes her time
let guard = 0, states = [];
while (guard++ < 14) {
  const s = await v();
  if (s.done) break;
  if (!(await b.evaluate(`!!document.querySelector('#place-row .btn')`))) { await closeOverlay(); continue; }
  const pause = s.current === 'B' ? 1600 : 0;
  await play(pause);
  await sleep(900);
  const after = await v();
  states.push({ played: s.current, hand: after.hand, done: after.done, next: after.current });
  await closeOverlay();
}
console.log('plays:');
for (const e of states) console.log('  ', JSON.stringify(e));
const end = await v();
const firstOutOfCards = states.find(e => Object.values(e.hand).includes(0));
console.log('when the first one ran out of cards → done:', firstOutOfCards?.done, '(must be false) | next:', firstOutOfCards?.next);
console.log('final:', JSON.stringify(end));
console.log('screen:', await b.active());
console.log('title:', await b.evaluate(`document.getElementById('result-title').textContent`));
console.log('note:', await b.evaluate(`(()=>{const n=document.getElementById('result-note');return n.hidden?'(hidden)':n.textContent})()`));
console.log('ranking:', await b.evaluate(`[...document.querySelectorAll('#result-ranking li')].map(li=>li.innerText.replace(/\\n/g,' · ')).join(' | ')`));
await b.shot('tie-result');
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

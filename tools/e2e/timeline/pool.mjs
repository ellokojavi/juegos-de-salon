// Línea de Tiempo with a shared pool: a single strip in everyone's view (D-32)
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const BASE = process.argv[3] || process.env.SITE || 'http://localhost:8765';
const b = await launch({ port: 9496, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const v = () => b.evaluate(`(()=>{const s=window.__ldt.view();return JSON.stringify({done:s.done,current:s.current,shared:s.shared,target:s.target,table:s.table,scores:s.scores,winner:s.winner,pool:s.poolLeft})})()`).then(JSON.parse);
const screen = () => b.evaluate(`JSON.stringify({
  title: document.getElementById('hand-title')?.textContent,
  cards: document.querySelectorAll('#hand .card').length,
  score: [...document.querySelectorAll('#score .p')].map(x=>x.textContent),
  deck: document.getElementById('pool-left')?.textContent,
})`).then(JSON.parse);
const closeOverlay = async () => { await b.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return;const btn=h.querySelector('.btn');if(btn)btn.click();else h.click();})()`); await sleep(450); };
const play = async () => {
  const info = await b.evaluate(`(()=>{const s=window.__ldt.view();const card=s.hands[s.current][0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at,card,p:s.current})})()`).then(JSON.parse);
  await b.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(120);
  await b.evaluate(`document.querySelectorAll('#line .slot')[${info.at}]?.click(); 1`); await sleep(120);
  await b.evaluate(`(()=>{const x=document.querySelector('#place-row .btn');if(x&&!x.disabled)x.click();})(); 1`);
  return info;
};

await b.go(`${BASE}/timeline/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/timeline/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
// Setup opens on "all face up" (D-43): own hand has to be asked for on purpose
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('.seg button')].find(e=>/Mano propia|Own hand/.test(e.textContent));x.click();return 1})()`); await sleep(300);
console.log('setup with own hand → labels:', await b.evaluate(`[...document.querySelectorAll('#setup-form label')].map(l=>l.textContent).join(' | ')`));
await b.shot('pool-01-setup-hand');
// Switch to shared pool
await b.evaluate(`(()=>{const b=[...document.querySelectorAll('.seg button')].find(x=>/Pozo|Shared/.test(x.textContent));b.click();return 1})()`); await sleep(300);
console.log('with shared pool → labels:', await b.evaluate(`[...document.querySelectorAll('#setup-form label')].map(l=>l.textContent).join(' | ')`));
console.log('hint:', await b.evaluate(`[...document.querySelectorAll('#setup-form p.muted')].map(p=>p.textContent).join(' ')`));
await b.shot('pool-02-setup-pool');
// Three players, target 3
await b.evaluate(`(()=>{document.querySelector('#setup-form .btn--ghost').click();return 1})()`); await sleep(200);
await b.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form input');['Javi','Cata','Nico'].forEach((n,i)=>{xs[i].value=n;xs[i].dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('.seg button')].find(e=>/3$/.test(e.textContent.trim()));if(x)x.click();return 1})()`);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')][0].click(); 1`); await sleep(1200);
await closeOverlay();

let s = await v();
console.log('starts →', JSON.stringify({ shared: s.shared, target: s.target, table: s.table.length, pool: s.pool }));
console.log('screen →', JSON.stringify(await screen()));
await b.shot('pool-03-table');
const tableBefore = s.table.slice();
const played = await play(); await sleep(1000); await closeOverlay();
s = await v();
console.log('after', played.p, 'plays → the card left the table:', !s.table.includes(played.card), '| size:', s.table.length,
  '| the others keep the same order:', JSON.stringify(s.table.slice(0, 5)) === JSON.stringify(tableBefore.filter(c => c !== played.card)),
  '| the new one came in at the end:', !tableBefore.includes(s.table[5]));
console.log('score:', JSON.stringify((await screen()).score));

let guard = 0;
while (guard++ < 20) {
  s = await v();
  if (s.done) break;
  if (!(await b.evaluate(`!!document.querySelector('#place-row .btn')`))) { await closeOverlay(); continue; }
  await play(); await sleep(900); await closeOverlay();
}
s = await v();
console.log('final →', JSON.stringify({ done: s.done, scores: s.scores, winner: s.winner, table: s.table.length }));
console.log('screen:', await b.active());
console.log('ranking:', await b.evaluate(`[...document.querySelectorAll('#result-ranking li')].map(li=>li.innerText.replace(/\\n/g,' · ')).join(' | ')`));
await b.shot('pool-04-result');

// --- The setting travels with the room: whoever joins plays with the host's pool ---
const B = await launch({ port: 9497, dir: `${OUT}/pB`, out: OUT, width: 375, height: 812 });
const hostBase = BASE, guestBase = BASE.includes('localhost') ? BASE.replace('localhost', '127.0.0.1') : BASE;
await b.go(`${hostBase}/timeline/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${hostBase}/timeline/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('.seg button')].find(e=>/Pozo|Shared/.test(e.textContent));x.click();return 1})()`); await sleep(200);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Crear|Create/.test(x.textContent)).click(); 1`); await sleep(5000);
const code = await b.evaluate(`document.querySelector('.code-big')?.textContent`);
await B.go(`${guestBase}/timeline/?room=${code}`, 2000); await B.evaluate(`localStorage.clear(); 1`);
await B.go(`${guestBase}/timeline/?room=${code}`, 2000);
await B.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Cata';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await B.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Unirse|Join/.test(x.textContent)).click(); 1`); await sleep(5000);
await b.evaluate(`[...document.querySelectorAll('#lobby-box .btn')].find(x=>/Empezar|Start/.test(x.textContent))?.click(); 1`); await sleep(4000);
const cfgA = await b.evaluate(`JSON.stringify(window.__ldt.match().config)`);
const cfgB = await B.evaluate(`JSON.stringify(window.__ldt.match().config)`);
const tableA = await b.evaluate(`JSON.stringify(window.__ldt.view().table)`);
const tableB = await B.evaluate(`JSON.stringify(window.__ldt.view().table)`);
console.log('room:', code, '| the host chose a shared pool:', JSON.parse(cfgA).shared, '| the one who joined got:', JSON.parse(cfgB).shared);
console.log('both see the same strip:', tableA === tableB, '|', tableA);
console.log('title for the one who joined:', await B.evaluate(`document.getElementById('hand-title')?.textContent`));
await B.shot('pool-05-online-guest');
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
console.log('errors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
b.close(); B.close();

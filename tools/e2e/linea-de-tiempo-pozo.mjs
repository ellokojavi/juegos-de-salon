// Línea de Tiempo con pozo común: una sola tira a la vista de todos (D-32)
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:8765';
const b = await launch({ port: 9496, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const v = () => b.evaluate(`(()=>{const s=window.__ldt.view();return JSON.stringify({done:s.done,current:s.current,shared:s.shared,target:s.target,mesa:s.table,scores:s.scores,winner:s.winner,pozo:s.poolLeft})})()`).then(JSON.parse);
const pantalla = () => b.evaluate(`JSON.stringify({
  titulo: document.getElementById('hand-title')?.textContent,
  cartas: document.querySelectorAll('#hand .card').length,
  marcador: [...document.querySelectorAll('#score .p')].map(x=>x.textContent),
  mazo: document.getElementById('pool-left')?.textContent,
})`).then(JSON.parse);
const closeOverlay = async () => { await b.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return;const btn=h.querySelector('.btn');if(btn)btn.click();else h.click();})()`); await sleep(450); };
const play = async () => {
  const info = await b.evaluate(`(()=>{const s=window.__ldt.view();const card=s.hands[s.current][0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at,card,p:s.current})})()`).then(JSON.parse);
  await b.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(120);
  await b.evaluate(`document.querySelectorAll('#line .slot')[${info.at}]?.click(); 1`); await sleep(120);
  await b.evaluate(`(()=>{const x=document.querySelector('#place-row .btn');if(x&&!x.disabled)x.click();})(); 1`);
  return info;
};

await b.go(`${BASE}/linea-de-tiempo/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/linea-de-tiempo/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
// El setup abre en "todas a la vista" (D-43): hay que pedir mano propia a propósito
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('.seg button')].find(e=>/Mano propia|Own hand/.test(e.textContent));x.click();return 1})()`); await sleep(300);
console.log('setup con mano propia → etiquetas:', await b.evaluate(`[...document.querySelectorAll('#setup-form label')].map(l=>l.textContent).join(' | ')`));
await b.shot('pozo-01-setup-mano');
// Cambiar a pozo común
await b.evaluate(`(()=>{const b=[...document.querySelectorAll('.seg button')].find(x=>/Pozo|Shared/.test(x.textContent));b.click();return 1})()`); await sleep(300);
console.log('con pozo común → etiquetas:', await b.evaluate(`[...document.querySelectorAll('#setup-form label')].map(l=>l.textContent).join(' | ')`));
console.log('pista:', await b.evaluate(`[...document.querySelectorAll('#setup-form p.muted')].map(p=>p.textContent).join(' ')`));
await b.shot('pozo-02-setup-pozo');
// Tres jugadores, meta 3
await b.evaluate(`(()=>{document.querySelector('#setup-form .btn--ghost').click();return 1})()`); await sleep(200);
await b.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form input');['Javi','Cata','Nico'].forEach((n,i)=>{xs[i].value=n;xs[i].dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('.seg button')].find(e=>/3$/.test(e.textContent.trim()));if(x)x.click();return 1})()`);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')][0].click(); 1`); await sleep(1200);
await closeOverlay();

let s = await v();
console.log('empieza →', JSON.stringify({ shared: s.shared, target: s.target, mesa: s.mesa.length, pozo: s.pozo }));
console.log('pantalla →', JSON.stringify(await pantalla()));
await b.shot('pozo-03-mesa');
const mesaAntes = s.mesa.slice();
const jugada = await play(); await sleep(1000); await closeOverlay();
s = await v();
console.log('tras jugar', jugada.p, '→ la carta salió de la mesa:', !s.mesa.includes(jugada.card), '| tamaño:', s.mesa.length,
  '| las demás siguen en el mismo orden:', JSON.stringify(s.mesa.slice(0, 5)) === JSON.stringify(mesaAntes.filter(c => c !== jugada.card)),
  '| la nueva entró al final:', !mesaAntes.includes(s.mesa[5]));
console.log('marcador:', JSON.stringify((await pantalla()).marcador));

let guard = 0;
while (guard++ < 20) {
  s = await v();
  if (s.done) break;
  if (!(await b.evaluate(`!!document.querySelector('#place-row .btn')`))) { await closeOverlay(); continue; }
  await play(); await sleep(900); await closeOverlay();
}
s = await v();
console.log('final →', JSON.stringify({ done: s.done, scores: s.scores, winner: s.winner, mesa: s.mesa.length }));
console.log('pantalla:', await b.active());
console.log('ranking:', await b.evaluate(`[...document.querySelectorAll('#result-ranking li')].map(li=>li.innerText.replace(/\\n/g,' · ')).join(' | ')`));
await b.shot('pozo-04-resultado');

// --- El ajuste viaja en la sala: el que se une juega con el pozo del anfitrión ---
const B = await launch({ port: 9497, dir: `${OUT}/pB`, out: OUT, width: 375, height: 812 });
const hostBase = BASE, guestBase = BASE.includes('localhost') ? BASE.replace('localhost', '127.0.0.1') : BASE;
await b.go(`${hostBase}/linea-de-tiempo/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${hostBase}/linea-de-tiempo/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('.seg button')].find(e=>/Pozo|Shared/.test(e.textContent));x.click();return 1})()`); await sleep(200);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Crear|Create/.test(x.textContent)).click(); 1`); await sleep(5000);
const code = await b.evaluate(`document.querySelector('.code-big')?.textContent`);
await B.go(`${guestBase}/linea-de-tiempo/?sala=${code}`, 2000); await B.evaluate(`localStorage.clear(); 1`);
await B.go(`${guestBase}/linea-de-tiempo/?sala=${code}`, 2000);
await B.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Cata';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await B.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Unirse|Join/.test(x.textContent)).click(); 1`); await sleep(5000);
await b.evaluate(`[...document.querySelectorAll('#lobby-box .btn')].find(x=>/Empezar|Start/.test(x.textContent))?.click(); 1`); await sleep(4000);
const cfgA = await b.evaluate(`JSON.stringify(window.__ldt.match().config)`);
const cfgB = await B.evaluate(`JSON.stringify(window.__ldt.match().config)`);
const mesaA = await b.evaluate(`JSON.stringify(window.__ldt.view().table)`);
const mesaB = await B.evaluate(`JSON.stringify(window.__ldt.view().table)`);
console.log('sala:', code, '| el anfitrión eligió pozo común:', JSON.parse(cfgA).shared, '| el que se unió recibió:', JSON.parse(cfgB).shared);
console.log('los dos ven la misma tira:', mesaA === mesaB, '|', mesaA);
console.log('título en el que se unió:', await B.evaluate(`document.getElementById('hand-title')?.textContent`));
await B.shot('pozo-05-online-invitado');
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
console.log('errors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
b.close(); B.close();

// Línea de Tiempo: la ronda se termina y el empate lo gana quien respondió más rápido (D-31)
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:8765';
const b = await launch({ port: 9494, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const v = () => b.evaluate(`(()=>{const s=window.__ldt.view();return JSON.stringify({done:s.done,current:s.current,mano:Object.fromEntries(Object.entries(s.hands).map(([k,h])=>[k,h.length])),winner:s.winner,times:s.times})})()`).then(JSON.parse);
const closeOverlay = async () => { await b.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'no';const btn=h.querySelector('.btn');if(btn){btn.click();return 'btn'}h.click();return 'tap'})()`); await sleep(500); };
/** Juega la carta correcta del jugador de turno, esperando `pausa` ms antes de confirmar. */
const play = async pausa => {
  const info = await b.evaluate(`(()=>{const s=window.__ldt.view();const p=s.current;const card=s.hands[p][0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at,p})})()`).then(JSON.parse);
  await b.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(120);
  await b.evaluate(`document.querySelectorAll('#line .slot')[${info.at}]?.click(); 1`); await sleep(120);
  if (pausa) await sleep(pausa);
  const r = await b.evaluate(`(()=>{const x=document.querySelector('#place-row .btn');if(!x||x.disabled)return 'no';x.click();return 'ok'})()`);
  return `${info.p}:${r}`;
};

await b.go(`${BASE}/linea-de-tiempo/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/linea-de-tiempo/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
await b.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form input');xs[0].value='Javi';xs[0].dispatchEvent(new Event('input',{bubbles:true}));xs[1].value='Cata';xs[1].dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('.seg button')].find(e=>/3$/.test(e.textContent.trim()));if(x)x.click();return 1})()`);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')][0].click(); 1`); await sleep(1200);
await closeOverlay();

// Javi (A) responde al tiro, Cata (B) se demora
let guard = 0, estados = [];
while (guard++ < 14) {
  const s = await v();
  if (s.done) break;
  if (!(await b.evaluate(`!!document.querySelector('#place-row .btn')`))) { await closeOverlay(); continue; }
  const pausa = s.current === 'B' ? 1600 : 0;
  await play(pausa);
  await sleep(900);
  const tras = await v();
  estados.push({ jugó: s.current, mano: tras.mano, done: tras.done, sigue: tras.current });
  await closeOverlay();
}
console.log('jugadas:');
for (const e of estados) console.log('  ', JSON.stringify(e));
const fin = await v();
const primeroSinCartas = estados.find(e => Object.values(e.mano).includes(0));
console.log('cuando el primero se quedó sin cartas → done:', primeroSinCartas?.done, '(debe ser false) | seguía:', primeroSinCartas?.sigue);
console.log('final:', JSON.stringify(fin));
console.log('pantalla:', await b.active());
console.log('título:', await b.evaluate(`document.getElementById('result-title').textContent`));
console.log('nota:', await b.evaluate(`(()=>{const n=document.getElementById('result-note');return n.hidden?'(oculta)':n.textContent})()`));
console.log('ranking:', await b.evaluate(`[...document.querySelectorAll('#result-ranking li')].map(li=>li.innerText.replace(/\\n/g,' · ')).join(' | ')`));
await b.shot('empate-resultado');
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

// Todas las cartas a la vista: mesa completa desde el primer turno y sin reposición (D-43)
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:8765';
const b = await launch({ port: 9498, dir: `${OUT}/m`, out: OUT, width: 375, height: 812 });
const v = () => b.evaluate(`(()=>{const s=window.__ldt.view();return JSON.stringify({done:s.done,current:s.current,shared:s.shared,target:s.target,mesa:s.table,scores:s.scores,winner:s.winner})})()`).then(JSON.parse);
const pantalla = () => b.evaluate(`JSON.stringify({
  titulo: document.getElementById('hand-title')?.textContent,
  cartas: document.querySelectorAll('#hand .card').length,
  quedan: document.getElementById('pool-left')?.textContent,
  ancho: document.documentElement.scrollWidth - document.documentElement.clientWidth,
})`).then(JSON.parse);
const closeOverlay = async () => { await b.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return;const btn=h.querySelector('.btn');if(btn)btn.click();else h.click();})()`); await sleep(450); };
/** Coloca la primera carta de la mesa; con `bien: false` la pone a propósito en la ranura equivocada. */
const play = async (bien = true) => {
  const info = await b.evaluate(`(()=>{const s=window.__ldt.view();const card=s.hands[s.current][0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at,mal:at===0?s.line.length:0,card,p:s.current})})()`).then(JSON.parse);
  await b.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(120);
  await b.evaluate(`document.querySelectorAll('#line .slot')[${bien ? info.at : info.mal}]?.click(); 1`); await sleep(120);
  await b.evaluate(`(()=>{const x=document.querySelector('#place-row .btn');if(x&&!x.disabled)x.click();})(); 1`);
  await sleep(900); await closeOverlay();
  return info;
};

await b.go(`${BASE}/linea-de-tiempo/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/linea-de-tiempo/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
console.log('el setup abre en →', await b.evaluate(`document.querySelector('#setup-form .seg--cards button.on')?.textContent`), '(debe ser todas a la vista)');
console.log('opciones de cartas:', await b.evaluate(`[...document.querySelectorAll('#setup-form .seg--cards button')].map(x=>x.textContent).join(' | ')`));
console.log('etiqueta del tamaño:', await b.evaluate(`[...document.querySelectorAll('#setup-form label')].map(l=>l.textContent).join(' | ')`));
const pista = () => b.evaluate(`document.querySelector('#setup-form p.muted')?.textContent`);
console.log('pista con meta 5:', await pista());
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('#setup-form .seg button')].find(e=>/7$/.test(e.textContent.trim()));x.click();return 1})()`); await sleep(200);
console.log('pista con meta 7 (debe decir 14):', await pista());
await b.shot('mesa-01-setup');

// Dos jugadores, meta 3 → mesa de 6
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('#setup-form .seg button')].find(e=>/3$/.test(e.textContent.trim()));x.click();return 1})()`); await sleep(150);
await b.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form .player-row input');['Javi','Cata'].forEach((n,i)=>{xs[i].value=n;xs[i].dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')][0].click(); 1`); await sleep(1200);
await closeOverlay();

let s = await v();
console.log('empieza → meta:', s.target, '| cartas en la mesa:', s.mesa.length, '(debe ser 6)');
console.log('pantalla →', JSON.stringify(await pantalla()));
await b.shot('mesa-02-mesa-completa');

// Un acierto y un error: las dos veces la mesa se achica y no entra nada nuevo
const antes = s.mesa.slice();
const ok = await play(true);
s = await v();
console.log('tras acertar → mesa:', s.mesa.length, '| no entró ninguna carta nueva:', s.mesa.every(c => antes.includes(c)),
  '| las que quedan mantienen el orden:', JSON.stringify(s.mesa) === JSON.stringify(antes.filter(c => c !== ok.card)));
const antes2 = s.mesa.slice();
const mal = await play(false);
s = await v();
console.log('tras fallar → mesa:', s.mesa.length, '| la fallada no vuelve:', !s.mesa.includes(mal.card),
  '| no entró ninguna nueva:', s.mesa.every(c => antes2.includes(c)), '| marcador:', JSON.stringify(s.scores));
console.log('pantalla →', JSON.stringify(await pantalla()));
await b.shot('mesa-03-achicada');

// Hasta el final: o alguien llega a la meta, o se vacía la mesa
let guard = 0;
while (guard++ < 20) {
  s = await v();
  if (s.done) break;
  if (!(await b.evaluate(`!!document.querySelector('#place-row .btn')`))) { await closeOverlay(); continue; }
  await play(true);
}
s = await v();
console.log('final → done:', s.done, '| mesa:', s.mesa.length, '| marcador:', JSON.stringify(s.scores), '| ganó:', JSON.stringify(s.winner));
console.log('pantalla:', await b.active());
console.log('ranking:', await b.evaluate(`[...document.querySelectorAll('#result-ranking li')].map(li=>li.innerText.replace(/\\n/g,' · ')).join(' | ')`));
await b.shot('mesa-04-resultado');

// --- Solitario: vaciar la mesa sin llegar a la meta no es récord ---
await b.go(`${BASE}/linea-de-tiempo/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/linea-de-tiempo/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
await b.evaluate(`(()=>{const i=document.querySelector('#setup-form .name');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('#setup-form .seg button')].find(e=>/3$/.test(e.textContent.trim()));x.click();return 1})()`); await sleep(150);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')][0].click(); 1`); await sleep(1200);
await closeOverlay();
guard = 0;
while (guard++ < 12) {
  s = await v();
  if (s.done) break;
  if (!(await b.evaluate(`!!document.querySelector('#place-row .btn')`))) { await closeOverlay(); continue; }
  await play(false);
}
console.log('solitario fallando todo → título:', await b.evaluate(`document.getElementById('result-title')?.textContent`));
console.log('  resumen:', await b.evaluate(`document.getElementById('result-sub')?.textContent`));
console.log('  trofeo:', await b.evaluate(`document.getElementById('result-trophy')?.textContent`), '(no debe ser 🏆)');
console.log('  récords guardados:', await b.evaluate(`localStorage.getItem('juegos-de-salon:linea-de-tiempo:record')`), '(debe ser null)');
await b.shot('mesa-05-solitario-sin-cartas');
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

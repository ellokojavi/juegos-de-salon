import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9456, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const v = () => b.evaluate(`(()=>{const s=window.__ldt.view();return JSON.stringify({line:s.line.length,mano:s.hands.A.length,done:s.done,intentos:s.history.length,ok:s.history.filter(h=>h.ok).length})})()`).then(JSON.parse);
const play = async (correct) => {
  const info = await b.evaluate(`(()=>{const s=window.__ldt.view();const card=s.hands.A[0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at, wrong: at===0? s.line.length : 0})})()`).then(JSON.parse);
  await b.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(80);
  await b.evaluate(`document.querySelectorAll('#line .slot')[${correct ? info.at : info.wrong}].click(); 1`); await sleep(80);
  await click('#place-row .btn'); await sleep(600);
  await b.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(300);
};
const start = async () => {
  await b.go('http://localhost:8765/linea-de-tiempo/', 1200);
  console.log('modos:', await b.evaluate(`[...document.querySelectorAll('.mode b')].map(x=>x.textContent).join(' | ')`));
  await b.evaluate(`[...document.querySelectorAll('.mode')].find(m=>/solo/i.test(m.textContent)).click(); 1`); await sleep(300);
  console.log('setup sin nivel del celular:', await b.evaluate(`!/Nivel del celular|Phone level/.test(document.getElementById('setup-form').innerText)`));
  await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
  await b.evaluate(`(()=>{const x=[...document.querySelectorAll('#setup-form .seg button')].find(e=>/Mano propia|Own hand/.test(e.textContent));if(x)x.click();return 1})()`); await sleep(150);
  await b.evaluate(`[...document.querySelectorAll('#setup-form .seg button')].find(x=>/Corta/.test(x.textContent)).click(); 1`);
  await click('#setup-actions .btn'); await sleep(700);
};
await b.go('http://localhost:8765/linea-de-tiempo/'); await b.evaluate(`localStorage.clear(); 1`);
await start();
console.log('inicio:', JSON.stringify(await v()), '| título:', await b.evaluate(`document.getElementById('status-who').textContent`), '| marcador oculto:', await b.evaluate(`document.getElementById('score').children.length === 0`));
await b.shot('solo-play');
await play(false); console.log('tras error:', JSON.stringify(await v()), '| estado:', await b.evaluate(`document.getElementById('status-sub').textContent`));
let g = 0; while (g++ < 12 && !(await v()).done) await play(true);
console.log('fin:', JSON.stringify(await v()), '| pantalla:', await b.active());
console.log('resultado 1:', await b.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent + ' | ranking oculto: ' + document.getElementById('result-ranking').parentElement.hidden`));
await b.shot('solo-result');
// segunda partida perfecta: debe batir el récord
await start(); console.log('récord visible en el estado:', await b.evaluate(`document.getElementById('status-sub').textContent`));
g = 0; while (g++ < 12 && !(await v()).done) await play(true);
console.log('resultado 2:', await b.evaluate(`document.getElementById('result-sub').textContent`));
// tercera igual de larga: no es récord
await start(); g = 0; while (g++ < 12 && !(await v()).done) await play(true);
console.log('resultado 3:', await b.evaluate(`document.getElementById('result-sub').textContent`));
// guardado y retomado
await start(); await play(true);
await b.go('http://localhost:8765/linea-de-tiempo/', 1200); console.log('retomar ofrece:', await b.evaluate(`document.querySelector('#resume-slot .muted')?.textContent`));
await click('#resume-slot .btn'); await sleep(800); console.log('retomado:', JSON.stringify(await v()));
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

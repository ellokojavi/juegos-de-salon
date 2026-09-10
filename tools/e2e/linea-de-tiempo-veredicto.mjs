// El veredicto habla en tercera persona cuando se equivocó otro jugador (D-36)
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const BASE = process.argv[3];
const hosts = BASE ? [BASE, BASE] : ['http://localhost:8765', 'http://127.0.0.1:8765'];
const A = await launch({ port: 9468, dir: `${OUT}/vA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9469, dir: `${OUT}/vB`, out: OUT, width: 375, height: 812 });
const overlay = d => d.evaluate(`(()=>{const h=document.getElementById('handoff');return JSON.stringify({
  visible: !h.hidden, rojo: h.classList.contains('bad'),
  titulo: h.querySelector('.verdict .big')?.textContent || '',
  nota: h.querySelector('.verdict .note')?.textContent || '',
  porque: h.querySelector('.verdict .why')?.innerText.replace(/\\n+/g, ' ') || '',
})})()`).then(JSON.parse);
const jugar = async (d, { bien }) => {
  const info = await d.evaluate(`(()=>{const s=window.__ldt.view();const card=s.hands[s.current][0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at, malo: at===0 ? s.line.length : 0})})()`).then(JSON.parse);
  await d.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(120);
  await d.evaluate(`document.querySelectorAll('#line .slot')[${bien ? info.at : info.malo}].click(); 1`); await sleep(120);
  await d.evaluate(`(()=>{const x=document.querySelector('#place-row .btn');if(x&&!x.disabled)x.click();})(); 1`);
};

for (const [i, d] of [A, B].entries()) { await d.go(hosts[i] + '/linea-de-tiempo/', 1500); await d.evaluate(`localStorage.clear(); 1`); }
await A.go(hosts[0] + '/linea-de-tiempo/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
await A.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await A.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Crear|Create/.test(x.textContent)).click(); 1`); await sleep(5000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
await B.go(`${hosts[1]}/linea-de-tiempo/?sala=${code}`, 2000);
await B.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Cata';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await B.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Unirse|Join/.test(x.textContent)).click(); 1`); await sleep(5000);
await A.evaluate(`[...document.querySelectorAll('#lobby-box .btn')].find(x=>/Empezar|Start/.test(x.textContent))?.click(); 1`); await sleep(4000);

const turno = await A.evaluate(`window.__ldt.view().current`);
const quienJuega = turno === 'A' ? A : B;
const quienMira = turno === 'A' ? B : A;
const nombre = turno === 'A' ? 'Javi' : 'Cata';
console.log('sala', code, '| parte', nombre);

// Se equivoca a propósito
await jugar(quienJuega, { bien: false }); await sleep(2500);
console.log('el que se equivocó ve →', JSON.stringify(await overlay(quienJuega)));
console.log('el otro ve          →', JSON.stringify(await overlay(quienMira)));
await quienJuega.shot('veredicto-propio'); await quienMira.shot('veredicto-ajeno');
await quienJuega.evaluate(`document.getElementById('handoff').click(); 1`);
await quienMira.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(800);

// Y ahora un acierto del otro
const turno2 = await A.evaluate(`window.__ldt.view().current`);
const juega2 = turno2 === 'A' ? A : B;
const mira2 = turno2 === 'A' ? B : A;
await jugar(juega2, { bien: true }); await sleep(2500);
console.log('el que acertó ve    →', JSON.stringify(await overlay(juega2)));
console.log('el otro ve          →', JSON.stringify(await overlay(mira2)));
await mira2.shot('veredicto-ajeno-acierto');
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs));
console.log('errors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
A.close(); B.close();

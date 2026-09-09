// Línea de Tiempo con tres celulares contra Firebase real
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const hosts = ['http://localhost:8765', 'http://127.0.0.1:8765', 'http://[::1]:8765'];
const A = await launch({ port: 9452, dir: `${OUT}/pA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9453, dir: `${OUT}/pB`, out: OUT, width: 375, height: 812 });
const C = await launch({ port: 9454, dir: `${OUT}/pC`, out: OUT, width: 375, height: 812 });
const devs = { A, B, C };
const click = (d, sel) => d.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (d, sel, re) => d.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}','i').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const setName = (d, n) => d.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const v = d => d.evaluate(`(()=>{const s=window.__ldt.view();return JSON.stringify({lobby:!!s.lobby,current:s.current,line:s.line?s.line.length:0,mano:s.hands?Object.fromEntries(Object.entries(s.hands).map(([k,h])=>[k,h.length])):null,done:s.done,winner:s.winner})})()`).then(JSON.parse);
const closeVerdict = async d => { await d.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(300); };
const play = async (d, role) => {
  const info = await d.evaluate(`(()=>{const s=window.__ldt.view();const card=s.hands['${role}'][0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at})})()`).then(JSON.parse);
  await d.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(120);
  const r = await d.evaluate(`(()=>{const sl=document.querySelectorAll('#line .slot');if(!sl[${info.at}])return 'no-slot';sl[${info.at}].click();return 'ok'})()`);
  if (r !== 'ok') return r;
  await sleep(120);
  return click(d, '#place-row .btn');
};

for (const [i, [k, d]] of Object.entries(devs).entries()) { await d.go(hosts[i] + '/linea-de-tiempo/', 1800); await d.evaluate(`localStorage.clear(); 1`); }
// A crea la sala
await A.go(hosts[0] + '/linea-de-tiempo/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
await setName(A, 'Javi');
await clickText(A, '#setup-actions .btn', 'Crear'); await sleep(5000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('sala:', code, '| pantalla A:', await A.active());
await A.shot('01-lobby-A');
// B y C se unen por el enlace
for (const [i, k] of [[1, 'B'], [2, 'C']]) {
  const d = devs[k];
  await d.go(`${hosts[i]}/linea-de-tiempo/?sala=${code}`, 2000);
  await setName(d, k === 'B' ? 'Cata' : 'Nico');
  await clickText(d, '#setup-actions .btn', 'Unirse'); await sleep(4500);
  console.log(`${k} entró → pantalla:`, await d.active(), '| rol:', await d.evaluate(`window.__ldt.session().role`));
}
await sleep(2500);
console.log('lobby de A:', await A.evaluate(`[...document.querySelectorAll('.lobby-players .p')].map(x=>x.textContent).join(', ')`));
console.log('lobby de C (sin botón de empezar):', await C.evaluate(`document.querySelector('#lobby-box .waiting')?.textContent || 'tiene botón'`));
await A.shot('02-lobby-3'); await C.shot('02-lobby-C');
// A empieza
await clickText(A, '#lobby-box .btn', 'Empezar'); await sleep(4000);
for (const k of ['A', 'B', 'C']) console.log(`${k} tras empezar:`, JSON.stringify(await v(devs[k])), '| pantalla:', await devs[k].active());
await A.shot('03-play-A'); await B.shot('03-play-B');
// jugar varias rondas
let guard = 0;
while (guard++ < 24) {
  const s = await v(A);
  if (s.done) break;
  const d = devs[s.current];
  if (!(await d.evaluate(`!!document.querySelector('#place-row .btn')`))) { await closeVerdict(d); await sleep(400); continue; }
  const r = await play(d, s.current);
  if (r !== 'ok') { console.log('no pudo jugar', s.current, r); break; }
  await sleep(2600);
  for (const k of ['A', 'B', 'C']) await closeVerdict(devs[k]);
  if (guard === 3) {
    await A.shot('04-mid-A'); await B.shot('04-mid-B');
    console.log('título de la mano en B:', await B.evaluate(`document.getElementById('hand-title').textContent`));
    // reconexión de C a mitad de partida
    await C.go(`${hosts[2]}/linea-de-tiempo/?sala=${code}`, 6000);
    console.log('C tras recargar:', await C.active(), JSON.stringify(await v(C)), '| rol:', await C.evaluate(`window.__ldt.session()?.role`));
    await C.shot('04-reconnect-C');
  }
}
const fin = await v(A);
console.log('estado final visto por A:', JSON.stringify(fin));
console.log('estado final visto por C:', JSON.stringify(await v(C)));
for (const k of ['A', 'B', 'C']) console.log(`${k} pantalla:`, await devs[k].active());
await A.shot('05-result-A'); await C.shot('05-result-C');
// revancha: la propone C y los demás se mueven solos
await click(C, '#result-actions .btn'); await sleep(9000);
for (const k of ['A', 'B', 'C']) console.log(`${k} tras revancha → pantalla:`, await devs[k].active(), '| sala:', await devs[k].evaluate(`window.__ldt.session()?.code`), '| rol:', await devs[k].evaluate(`window.__ldt.session()?.role`), '| en sala:', await devs[k].evaluate(`document.querySelectorAll('.lobby-players .p').length`));
await C.shot('06-rematch-C'); await A.shot('06-rematch-A');
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs));
console.log('errors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
console.log('errors C:', JSON.stringify(C.errors), JSON.stringify(C.logs));
A.close(); B.close(); C.close();

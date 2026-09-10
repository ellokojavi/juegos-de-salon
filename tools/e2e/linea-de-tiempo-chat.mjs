// Chat de sala en Línea de Tiempo: dos celulares contra Firebase real (canon C-15)
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
// Segundo argumento opcional: una base distinta (por ejemplo el sitio publicado), canon C-12.
const BASE = process.argv[3];
const hosts = BASE ? [BASE, BASE] : ['http://localhost:8765', 'http://127.0.0.1:8765'];
const A = await launch({ port: 9462, dir: `${OUT}/cA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9463, dir: `${OUT}/cB`, out: OUT, width: 375, height: 812 });
const devs = { A, B };
const clickText = (d, sel, re) => d.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}','i').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const setName = (d, n) => d.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const v = d => d.evaluate(`(()=>{const s=window.__ldt.view();return JSON.stringify({lobby:!!s.lobby,current:s.current,done:s.done})})()`).then(JSON.parse);
const chat = d => d.evaluate(`(()=>{const m=document.getElementById('chat');const b=document.querySelector('.chat-badge');return JSON.stringify({
  montado: !!document.querySelector('.chat-fab'), visible: m && !m.hidden,
  burbuja: !!document.querySelector('.chat-fab') && !document.querySelector('.chat-fab').hidden,
  abierta: !!document.querySelector('.chat-sheet') && !document.querySelector('.chat-sheet').hidden,
  noLeidos: b && !b.hidden ? b.textContent : '0',
  etiqueta: (()=>{const p=document.querySelector('.chat-peek');return p && !p.hidden ? p.textContent : null})(),
  mensajes: [...document.querySelectorAll('.chat-msg')].map(x=>x.textContent),
})})()`).then(JSON.parse);
const say = async (d, text) => {
  await d.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(200);
  const r = await d.evaluate(`(()=>{const i=document.querySelector('.chat-form input');if(!i)return 'no-input';i.value=${JSON.stringify(text)};i.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.chat-send').click();return document.querySelector('.chat-form input').value===''?'enviado':'bloqueado'})()`);
  return r;
};
const play = async (d, role) => {
  const info = await d.evaluate(`(()=>{const s=window.__ldt.view();const card=s.hands['${role}'][0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at})})()`).then(JSON.parse);
  await d.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(120);
  await d.evaluate(`document.querySelectorAll('#line .slot')[${info.at}]?.click(); 1`); await sleep(120);
  return d.evaluate(`(()=>{const b=document.querySelector('#place-row .btn');if(!b||b.disabled)return 'no';b.click();return 'ok'})()`);
};
const closeVerdict = async d => { await d.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(300); };

for (const [i, [, d]] of Object.entries(devs).entries()) { await d.go(hosts[i] + '/linea-de-tiempo/', 1500); await d.evaluate(`localStorage.clear(); 1`); }

// --- modo un celular: no debe haber chat ---
await A.go(hosts[0] + '/linea-de-tiempo/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
await A.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form input');xs[0].value='Javi';xs[0].dispatchEvent(new Event('input',{bubbles:true}));xs[1].value='Cata';xs[1].dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await clickText(A, '#setup-actions .btn', 'jugar'); await sleep(1200);
console.log('un celular → chat montado:', (await chat(A)).montado, '(debe ser false)');

// --- sala con dos celulares ---
await A.go(hosts[0] + '/linea-de-tiempo/', 1500);
await A.evaluate(`localStorage.clear(); 1`);
await A.go(hosts[0] + '/linea-de-tiempo/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
await setName(A, 'Javi');
await A.evaluate(`(()=>{const b=[...document.querySelectorAll('.seg button')].find(x=>/3$/.test(x.textContent.trim()));if(b)b.click();return 1})()`);
await clickText(A, '#setup-actions .btn', 'Crear'); await sleep(5000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('sala:', code);
await B.go(`${hosts[1]}/linea-de-tiempo/?sala=${code}`, 2000);
await setName(B, 'Cata');
await clickText(B, '#setup-actions .btn', 'Unirse'); await sleep(5000);
console.log('B entró como', await B.evaluate(`window.__ldt.session().role`), '| pantalla:', await B.active());
console.log('chat en la sala de espera → A:', JSON.stringify(await chat(A)));
await A.shot('chat-01-lobby');

// --- mensajes en la sala de espera ---
console.log('A escribe:', await say(A, 'Ya llegaron todos?'));
await sleep(2500);
let cB = await chat(B);
console.log('B (chat cerrado) → no leídos:', cB.noLeidos, '| etiqueta asomada:', JSON.stringify(cB.etiqueta), '| mensajes:', JSON.stringify(cB.mensajes));
await B.shot('chat-02-no-leidos');
await sleep(2800);
console.log('B unos segundos después → etiqueta:', JSON.stringify((await chat(B)).etiqueta), '(debe ser null)', '| no leídos:', (await chat(B)).noLeidos, '(sigue en 1)');
console.log('B responde:', await say(B, 'Estoy lista 💪'));
await sleep(2500);
console.log('B tras abrir → no leídos:', (await chat(B)).noLeidos, '(debe ser 0)');
console.log('A ve:', JSON.stringify((await chat(A)).mensajes));
await B.shot('chat-03-abierto');
// freno contra el spam: dos envíos pegados, sin pausa entre medio
console.log('B manda uno:', await say(B, 'otro mensaje'), '| y otro al tiro:', await say(B, 'y otro mas'), '(el segundo debe ser bloqueado)');
await sleep(1500);
console.log('B reintenta después:', await say(B, 'ahora si'), '(debe ser enviado)');
await sleep(2000);
await B.evaluate(`document.querySelector('.chat-x').click(); 1`); await sleep(200);

// --- durante la partida ---
await clickText(A, '#lobby-box .btn', 'Empezar'); await sleep(4000);
console.log('empezó la partida → A:', await A.active(), '| chat visible:', (await chat(A)).burbuja);
await A.shot('chat-04-partida');
console.log('A comenta la jugada:', await say(A, 'esa carta es fácil'));
await sleep(2500);
const cJuego = await chat(B);
console.log('B recibe durante la partida → no leídos:', cJuego.noLeidos, '| etiqueta:', JSON.stringify(cJuego.etiqueta));
await B.shot('chat-04b-etiqueta');
await B.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(300);
await B.shot('chat-05-en-partida');
await B.evaluate(`document.querySelector('.chat-x').click(); 1`); await sleep(200);

// --- el veredicto tapa el chat ---
let s = await v(A);
await play(devs[s.current], s.current); await sleep(2000);
const tapado = await A.evaluate(`(()=>{const f=document.querySelector('.chat-fab');if(!f)return 'sin burbuja';const r=f.getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return document.getElementById('handoff').hidden?'sin veredicto':(document.getElementById('handoff').contains(e)?'tapado por el veredicto':'visible: '+e.className)})()`);
console.log('con el veredicto en pantalla, la burbuja queda:', tapado);
await A.shot('chat-06-veredicto');
for (const k of ['A', 'B']) await closeVerdict(devs[k]);

// --- reconexión: vuelve la historia del chat, sin sonido ni globito ---
await B.go(`${hosts[1]}/linea-de-tiempo/?sala=${code}`, 8000);
const cRe = await chat(B);
console.log('B tras recargar → pantalla:', await B.active(), '| mensajes recuperados:', cRe.mensajes.length, '| no leídos:', cRe.noLeidos, '(debe ser 0)');
await B.shot('chat-06b-reconexion');
for (const k of ['A', 'B']) await closeVerdict(devs[k]);

// --- hasta el final: el chat sigue vivo en el resultado ---
let guard = 0;
while (guard++ < 30) {
  s = await v(A);
  if (s.done) break;
  const d = devs[s.current];
  if (!(await d.evaluate(`!!document.querySelector('#place-row .btn')`))) { await closeVerdict(d); await sleep(400); continue; }
  if ((await play(d, s.current)) !== 'ok') { await closeVerdict(d); continue; }
  await sleep(2400);
  for (const k of ['A', 'B']) await closeVerdict(devs[k]);
}
console.log('partida terminada:', JSON.stringify(await v(A)));
for (const k of ['A', 'B']) { const c = await chat(devs[k]); console.log(`${k} en el resultado → pantalla:`, await devs[k].active(), '| chat visible:', c.visible, '(debe ser true) | mensajes:', c.mensajes.length); }
// Se puede seguir hablando después del pitazo final (D-35)
console.log('A celebra en el resultado:', await say(A, 'te gane por un pelo'));
await sleep(2500);
const cFinal = await chat(B);
console.log('B lo recibe en su pantalla de resultado → no leídos:', cFinal.noLeidos, '| etiqueta:', JSON.stringify(cFinal.etiqueta));
await A.shot('chat-07-resultado');
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs));
console.log('errors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
A.close(); B.close();

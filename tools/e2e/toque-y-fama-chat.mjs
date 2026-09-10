// Chat de sala en Toque y Fama: dos celulares contra Firebase real (canon C-15)
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const BASE = process.argv[3];
const hosts = BASE ? [BASE, BASE] : ['http://localhost:8765', 'http://127.0.0.1:8765'];
const A = await launch({ port: 9466, dir: `${OUT}/cA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9467, dir: `${OUT}/cB`, out: OUT, width: 375, height: 812 });
const chat = d => d.evaluate(`(()=>{const m=document.getElementById('chat');const b=document.querySelector('.chat-badge');const p=document.querySelector('.chat-peek');return JSON.stringify({
  montado: !!document.querySelector('.chat-fab'), visible: m && !m.hidden,
  abierta: !!document.querySelector('.chat-sheet') && !document.querySelector('.chat-sheet').hidden,
  noLeidos: b && !b.hidden ? b.textContent : '0',
  etiqueta: p && !p.hidden ? p.textContent : null,
  mensajes: [...document.querySelectorAll('.chat-msg')].map(x=>x.textContent),
})})()`).then(JSON.parse);
const say = async (d, text) => {
  await d.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(200);
  return d.evaluate(`(()=>{const i=document.querySelector('.chat-form input');if(!i)return 'no-input';i.value=${JSON.stringify(text)};i.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.chat-send').click();return document.querySelector('.chat-form input').value===''?'enviado':'bloqueado'})()`);
};
const close = d => d.evaluate(`document.querySelector('.chat-x')?.click(); 1`);

await A.go(hosts[0] + '/toque-y-fama/', 1500); await A.evaluate(`localStorage.clear(); 1`);
await B.go(hosts[1] + '/toque-y-fama/', 1500); await B.evaluate(`localStorage.clear(); 1`);

// --- un celular: no debe haber chat ---
await A.go(hosts[0] + '/toque-y-fama/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
await A.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form input');xs[0].value='Javi';xs[1].value='Cata';return 1})()`);
await A.evaluate(`document.querySelector('#setup-actions .btn').click(); 1`); await sleep(900);
console.log('un celular → chat montado:', (await chat(A)).montado, '(debe ser false)');

// --- sala ---
await A.go(hosts[0] + '/toque-y-fama/', 1500); await A.evaluate(`localStorage.clear(); 1`);
await A.go(hosts[0] + '/toque-y-fama/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
await A.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await A.evaluate(`document.querySelectorAll('#setup-actions .btn')[0].click(); 1`); await sleep(4500);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('sala:', code, '| chat en la sala de espera:', JSON.stringify(await chat(A)));
await A.shot('tyf-chat-01-lobby');
await B.go(`${hosts[1]}/toque-y-fama/?sala=${code}`, 2000);
await B.evaluate(`(()=>{document.querySelector('#setup-form input').value='Cata';return 1})()`);
await B.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(b=>/Unirse|Join/.test(b.textContent)).click(); 1`); await sleep(4500);
console.log('B entró:', await B.active(), '| rol:', await B.evaluate(`__tyf.session().role`));

// --- mensajes mientras se eligen los números ---
console.log('A escribe:', await say(A, 'ya elegí el mío'));
await sleep(2500);
let cB = await chat(B);
console.log('B (chat cerrado) → no leídos:', cB.noLeidos, '| etiqueta:', JSON.stringify(cB.etiqueta), '| mensajes:', JSON.stringify(cB.mensajes));
await B.shot('tyf-chat-02-secreto');
await close(A);
console.log('A secret:', await A.typeNum('1234')); await sleep(800);
console.log('B secret:', await B.typeNum('5678')); await sleep(3500);
console.log('en juego → A:', await A.active(), '| chat:', JSON.stringify(await chat(A)));

// --- durante la partida ---
console.log('B pica:', await say(B, 'no le achuntas ni una'));
await sleep(2500);
const cA = await chat(A);
console.log('A recibe en partida → no leídos:', cA.noLeidos, '| etiqueta:', JSON.stringify(cA.etiqueta));
await A.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(300);
await A.shot('tyf-chat-03-partida');
await close(A); await close(B);

// --- hasta el final: el chat muere con la partida ---
let guard = 0;
while (guard++ < 14) {
  const vA = await A.view(); if (!vA || vA.phase === 'done') break;
  const dev = vA.expected === 'A' ? A : B;
  const role = vA.expected;
  if (!(await dev.hasPad())) { await sleep(800); continue; }
  const mine = await dev.evaluate(`__tyf.match().guesses.filter(g=>g.from==='${role}').length`);
  const guess = role === 'A' ? (mine === 0 ? '5687' : '5678') : (mine === 0 ? '1243' : '1234');
  await dev.typeNum(guess);
  await sleep(3200);
}
await sleep(3000);
for (const [k, d] of [['A', A], ['B', B]]) {
  const c = await chat(d);
  console.log(`${k} en el resultado → pantalla:`, await d.active(), '| chat visible:', c.visible, '(debe ser false) | mensajes guardados:', c.mensajes.length);
}
await A.shot('tyf-chat-04-resultado');
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs));
console.log('errors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
A.close(); B.close();

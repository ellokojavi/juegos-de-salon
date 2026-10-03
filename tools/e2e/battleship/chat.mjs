// Chat de sala en Batalla Naval: dos celulares contra Firebase real (canon C-15, D-138)
// Uso: SITIO=http://localhost:87xx PUERTO_CDP=94xx node tools/e2e/batalla-naval-chat.mjs <salida>
// Usa PUERTO_CDP y el siguiente, uno por celular (D-135).
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const SITIO = process.env.SITIO || 'http://localhost:8765';
// Dos orígenes distintos para que cada celular tenga su propio localStorage
const hosts = [SITIO, SITIO.replace('localhost', '127.0.0.1')];
const CDP = Number(process.env.PUERTO_CDP) || 9482;
const A = await launch({ port: CDP, dir: `${OUT}/cA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: CDP + 1, dir: `${OUT}/cB`, out: OUT, width: 375, height: 812 });
const bv = d => d.evaluate(`JSON.stringify(window.__bn.view())`).then(JSON.parse);
const click = (d, sel) => d.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (d, sel, re) => d.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>/${re}/.test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const tapCell = (d, name) => d.evaluate(`(()=>{const r=parseInt('${name}'.slice(1))-1,c='ABCDEFGHIJ'.indexOf('${name}'[0]);const x=document.querySelector('#enemy-grid .cell[data-r="'+r+'"][data-c="'+c+'"]');if(!x)return 'no';x.click();return 'ok'})()`);
const fireAt = async (d, name) => { await tapCell(d, name); const r = await click(d, '#fire-btn'); await sleep(300); return r; };
const shipCells = (d, role) => d.evaluate(`(()=>{const L=__bn.session().layouts['${role}'].layout;const S={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2};const out=[];for(const [id,p] of Object.entries(L)){for(let i=0;i<S[id];i++){const r=p.dir==='h'?p.r:p.r+i,c=p.dir==='h'?p.c+i:p.c;out.push('ABCDEFGHIJ'[c]+(r+1))}}return JSON.stringify(out)})()`).then(JSON.parse);
const chat = d => d.evaluate(`(()=>{const m=document.getElementById('chat');const b=document.querySelector('.chat-badge');const p=document.querySelector('.chat-peek');return JSON.stringify({
  montado: !!document.querySelector('.chat-fab'), visible: !!m && !m.hidden,
  noLeidos: b && !b.hidden ? b.textContent : '0',
  etiqueta: p && !p.hidden ? p.textContent : null,
  mensajes: [...document.querySelectorAll('.chat-msg')].map(x=>x.textContent),
})})()`).then(JSON.parse);
const say = async (d, text) => {
  await d.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(200);
  return d.evaluate(`(()=>{const i=document.querySelector('.chat-form input');if(!i)return 'no-input';i.value=${JSON.stringify(text)};document.querySelector('.chat-send').click();return i.value===''?'enviado':'bloqueado'})()`);
};
const close = d => d.evaluate(`document.querySelector('.chat-x')?.click(); 1`);
// ¿La burbuja tapa algún botón de la pantalla activa? (C-8)
const tapa = d => d.evaluate(`(()=>{const f=document.querySelector('.chat-fab');if(!f||f.offsetParent===null)return '[]';const a=f.getBoundingClientRect();window.scrollTo(0,document.body.scrollHeight);const b=f.getBoundingClientRect();
  const hits=[...document.querySelectorAll('.screen.active button, .screen.active a.btn')].filter(x=>{const r=x.getBoundingClientRect();return r.width&&!(r.right<b.left||r.left>b.right||r.bottom<b.top||r.top>b.bottom)}).map(x=>x.textContent.trim().slice(0,30));window.scrollTo(0,0);return JSON.stringify(hits)})()`).then(JSON.parse);

for (const [d, h] of [[A, hosts[0]], [B, hosts[1]]]) { await d.go(h + '/batalla-naval/', 1500); await d.evaluate(`localStorage.clear(); 1`); }

// --- un celular: no hay chat ---
await A.go(hosts[0] + '/batalla-naval/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
await A.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form input');xs[0].value='Javi';xs[1].value='Cata';return 1})()`);
await clickText(A, '#setup-actions .btn', 'jugar'); await sleep(900);
console.log('un celular → chat montado:', (await chat(A)).montado, '(debe ser false)');
await A.evaluate(`localStorage.clear(); 1`);

// --- sala ---
await A.go(hosts[0] + '/batalla-naval/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(300);
await A.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await clickText(A, '#setup-actions .btn', 'Crear'); await sleep(4500);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('sala:', code, '| chat en la sala de espera:', JSON.stringify(await chat(A)), '| tapa:', JSON.stringify(await tapa(A)));
await A.shot('bn-chat-01-lobby');
await B.go(`${hosts[1]}/batalla-naval/?sala=${code}`, 1800);
await B.evaluate(`(()=>{document.querySelector('#setup-form input').value='Cata';return 1})()`);
await clickText(B, '#setup-actions .btn', 'Unirse'); await sleep(4500);
console.log('B entró:', await B.active());

// --- colocación: mientras uno arma su flota el chat se guarda; esperando al rival, vuelve ---
console.log('B colocando → chat visible:', (await chat(B)).visible, '(debe ser false)');
await clickText(A, '#place-actions .btn', 'azar'); await click(A, '#place-sail .btn'); await sleep(1500);
console.log('A esperando la flota rival → chat visible:', (await chat(A)).visible, '(debe ser true)');
console.log('A escribe:', await say(A, 'escondí bien mis barcos'));
await sleep(2500);
let cB = await chat(B);
console.log('B (colocando) → no leídos:', cB.noLeidos, '(debe ser 1) | chat visible:', cB.visible);
await A.shot('bn-chat-02-espera');
await close(A);
await clickText(B, '#place-actions .btn', 'azar'); await click(B, '#place-sail .btn'); await sleep(3500);
cB = await chat(B);
console.log('B en batalla → chat visible:', cB.visible, '| no leídos:', cB.noLeidos, '(debe ser 1)');
const vA = await bv(A);
console.log('en juego →', vA.phase, '| tira:', vA.shooter);

// --- durante la batalla: un mensaje no redibuja ni cambia la partida ---
const antes = JSON.stringify(await bv(A));
console.log('B pica:', await say(B, 'te voy a hundir el portaaviones'));
await sleep(2500);
const cA = await chat(A);
console.log('A recibe en batalla → no leídos:', cA.noLeidos, '| etiqueta:', JSON.stringify(cA.etiqueta), '| partida intacta:', antes === JSON.stringify(await bv(A)));
console.log('tapa en batalla (A):', JSON.stringify(await tapa(A)), '| (B):', JSON.stringify(await tapa(B)));
await A.shot('bn-chat-03-batalla');
await close(B);

// --- recarga: el chat vuelve desde la sala, sin globito ---
await A.go(`${hosts[0]}/batalla-naval/?sala=${code}`, 6000);
const cR = await chat(A);
console.log('A tras recargar → mensajes:', cR.mensajes.length, '(debe ser 2) | no leídos:', cR.noLeidos, '(debe ser 0)');

// --- hasta el final: quien tira hunde todo ---
const starter = (await bv(A)).shooter;
const [tirador, blanco] = starter === 'A' ? [A, B] : [B, A];
for (const t of await shipCells(blanco, starter === 'A' ? 'B' : 'A')) {
  const v = await bv(tirador); if (v.phase !== 'play') break;
  if ((await fireAt(tirador, t)) !== 'ok') { console.log('fallo disparo', t); break; }
  await sleep(2200);
}
await sleep(6000);
for (const [k, d] of [['A', A], ['B', B]]) {
  const c = await chat(d);
  console.log(`${k} en el resultado → pantalla:`, await d.active(), '| chat visible:', c.visible, '(debe ser true) | tapa:', JSON.stringify(await tapa(d)));
}
console.log('B comenta:', await say(B, 'revancha altiro'));
await sleep(2500);
console.log('A lo recibe en el resultado → etiqueta:', JSON.stringify((await chat(A)).etiqueta));
await A.shot('bn-chat-04-resultado');
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs));
console.log('errors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
A.close(); B.close();

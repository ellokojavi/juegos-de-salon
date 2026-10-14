// Room chat in Batalla Naval: two phones against real Firebase (canon C-15, D-138)
// Usage: SITE=http://localhost:87xx node tools/e2e/battleship/chat.mjs <output>
// One Chrome per phone; the system picks their ports (D-213), or CDP_PORT and the next one.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const SITE = process.env.SITE || 'http://localhost:8765';
// Two different origins so each phone has its own localStorage
const hosts = [SITE, SITE.replace('localhost', '127.0.0.1')];
const CDP = Number(process.env.CDP_PORT) || 9482;
const A = await launch({ port: CDP, dir: `${OUT}/cA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: CDP + 1, dir: `${OUT}/cB`, out: OUT, width: 375, height: 812 });
const bv = d => d.evaluate(`JSON.stringify(window.__bn.view())`).then(JSON.parse);
const click = (d, sel) => d.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (d, sel, re) => d.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>/${re}/.test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const tapCell = (d, name) => d.evaluate(`(()=>{const r=parseInt('${name}'.slice(1))-1,c='ABCDEFGHIJ'.indexOf('${name}'[0]);const x=document.querySelector('#enemy-grid .cell[data-r="'+r+'"][data-c="'+c+'"]');if(!x)return 'no';x.click();return 'ok'})()`);
const fireAt = async (d, name) => { await tapCell(d, name); const r = await click(d, '#fire-btn'); await sleep(300); return r; };
const shipCells = (d, role) => d.evaluate(`(()=>{const L=__bn.session().layouts['${role}'].layout;const S={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2};const out=[];for(const [id,p] of Object.entries(L)){for(let i=0;i<S[id];i++){const r=p.dir==='h'?p.r:p.r+i,c=p.dir==='h'?p.c+i:p.c;out.push('ABCDEFGHIJ'[c]+(r+1))}}return JSON.stringify(out)})()`).then(JSON.parse);
const chat = d => d.evaluate(`(()=>{const m=document.getElementById('chat');const b=document.querySelector('.chat-badge');const p=document.querySelector('.chat-peek');return JSON.stringify({
  mounted: !!document.querySelector('.chat-fab'), visible: !!m && !m.hidden,
  unread: b && !b.hidden ? b.textContent : '0',
  label: p && !p.hidden ? p.textContent : null,
  messages: [...document.querySelectorAll('.chat-msg')].map(x=>x.textContent),
})})()`).then(JSON.parse);
const say = async (d, text) => {
  await d.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(200);
  return d.evaluate(`(()=>{const i=document.querySelector('.chat-form input');if(!i)return 'no-input';i.value=${JSON.stringify(text)};document.querySelector('.chat-send').click();return i.value===''?'sent':'blocked'})()`);
};
const close = d => d.evaluate(`document.querySelector('.chat-x')?.click(); 1`);
// Does the bubble cover any button on the active screen? (C-8)
const covers = d => d.evaluate(`(()=>{const f=document.querySelector('.chat-fab');if(!f||f.offsetParent===null)return '[]';const a=f.getBoundingClientRect();window.scrollTo(0,document.body.scrollHeight);const b=f.getBoundingClientRect();
  const hits=[...document.querySelectorAll('.screen.active button, .screen.active a.btn')].filter(x=>{const r=x.getBoundingClientRect();return r.width&&!(r.right<b.left||r.left>b.right||r.bottom<b.top||r.top>b.bottom)}).map(x=>x.textContent.trim().slice(0,30));window.scrollTo(0,0);return JSON.stringify(hits)})()`).then(JSON.parse);

for (const [d, h] of [[A, hosts[0]], [B, hosts[1]]]) { await d.go(h + '/battleship/', 1500); await d.evaluate(`localStorage.clear(); 1`); }

// --- one phone: no chat ---
await A.go(hosts[0] + '/battleship/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
await A.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form input');xs[0].value='Javi';xs[1].value='Cata';return 1})()`);
await clickText(A, '#setup-actions .btn', 'jugar'); await sleep(900);
console.log('one phone → chat mounted:', (await chat(A)).mounted, '(should be false)');
await A.evaluate(`localStorage.clear(); 1`);

// --- room ---
await A.go(hosts[0] + '/battleship/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(300);
await A.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await clickText(A, '#setup-actions .btn', 'Crear'); await sleep(4500);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('room:', code, '| chat in the waiting room:', JSON.stringify(await chat(A)), '| covers:', JSON.stringify(await covers(A)));
await A.shot('bn-chat-01-lobby');
await B.go(`${hosts[1]}/battleship/?room=${code}`, 1800);
await B.evaluate(`(()=>{document.querySelector('#setup-form input').value='Cata';return 1})()`);
await clickText(B, '#setup-actions .btn', 'Unirse'); await sleep(4500);
console.log('B joined:', await B.active());

// --- placement: while one sets up their fleet the chat is put away; waiting for the rival, it comes back ---
console.log('B placing → chat visible:', (await chat(B)).visible, '(should be false)');
await clickText(A, '#place-actions .btn', 'azar'); await click(A, '#place-sail .btn'); await sleep(1500);
console.log('A waiting for the rival fleet → chat visible:', (await chat(A)).visible, '(should be true)');
console.log('A writes:', await say(A, 'escondí bien mis barcos'));
await sleep(2500);
let cB = await chat(B);
console.log('B (placing) → unread:', cB.unread, '(should be 1) | chat visible:', cB.visible);
await A.shot('bn-chat-02-waiting');
await close(A);
await clickText(B, '#place-actions .btn', 'azar'); await click(B, '#place-sail .btn'); await sleep(3500);
cB = await chat(B);
console.log('B in battle → chat visible:', cB.visible, '| unread:', cB.unread, '(should be 1)');
const vA = await bv(A);
console.log('in game →', vA.phase, '| shooting:', vA.shooter);

// --- during the battle: a message neither redraws nor changes the game ---
const before = JSON.stringify(await bv(A));
console.log('B teases:', await say(B, 'te voy a hundir el portaaviones'));
await sleep(2500);
const cA = await chat(A);
console.log('A receives in battle → unread:', cA.unread, '| label:', JSON.stringify(cA.label), '| game intact:', before === JSON.stringify(await bv(A)));
console.log('covers in battle (A):', JSON.stringify(await covers(A)), '| (B):', JSON.stringify(await covers(B)));
await A.shot('bn-chat-03-battle');
await close(B);

// --- reload: the chat comes back from the room, with no badge ---
await A.go(`${hosts[0]}/battleship/?room=${code}`, 6000);
const cR = await chat(A);
console.log('A after reloading → messages:', cR.messages.length, '(should be 2) | unread:', cR.unread, '(should be 0)');

// --- to the end: whoever shoots sinks everything ---
const starter = (await bv(A)).shooter;
const [shooter, target] = starter === 'A' ? [A, B] : [B, A];
for (const t of await shipCells(target, starter === 'A' ? 'B' : 'A')) {
  const v = await bv(shooter); if (v.phase !== 'play') break;
  if ((await fireAt(shooter, t)) !== 'ok') { console.log('shot failed', t); break; }
  await sleep(2200);
}
await sleep(6000);
for (const [k, d] of [['A', A], ['B', B]]) {
  const c = await chat(d);
  console.log(`${k} on the result → screen:`, await d.active(), '| chat visible:', c.visible, '(should be true) | covers:', JSON.stringify(await covers(d)));
}
console.log('B comments:', await say(B, 'revancha altiro'));
await sleep(2500);
console.log('A gets it on the result → label:', JSON.stringify((await chat(A)).label));
await A.shot('bn-chat-04-result');
// A tap on "Revancha" right under the label asks for the rematch, it doesn't open the chat (dilemma #48)
const under = JSON.parse(await A.evaluate(`(()=>{const p=document.querySelector('.chat-peek');const b=[...document.querySelectorAll('.screen.active .btn')].find(x=>/Revancha/.test(x.textContent));
  if(!p||p.hidden||!b)return JSON.stringify({});const P=p.getBoundingClientRect(),B=b.getBoundingClientRect();
  const x=Math.round((Math.max(P.left,B.left)+Math.min(P.right,B.right))/2),y=Math.round((Math.max(P.top,B.top)+Math.min(P.bottom,B.bottom))/2);
  const overlaps=!(P.right<B.left||P.left>B.right||P.bottom<B.top||P.top>B.bottom);const e=document.elementFromPoint(x,y);
  return JSON.stringify({overlaps,x,y,lands:e&&e.closest('.btn')===b?'Revancha':e?.className})})()`));
if (under.overlaps) {
  await A.tap(under.x, under.y); await sleep(250);
  const r = await A.evaluate(`JSON.stringify({chat:!document.querySelector('.chat-sheet').hidden,asked:!!document.querySelector('.screen.active .waiting')||!document.querySelector('#screen-result.active')})`).then(JSON.parse);
  console.log('tap on Revancha under the label → lands on:', under.lands, '(should be Revancha) | chat open:', r.chat, '(should be false) | asked for rematch:', r.asked, '(should be true)');
} else console.log('tap under the label → the label does not cover Revancha in this game:', JSON.stringify(under));
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs));
console.log('errors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
A.close(); B.close();

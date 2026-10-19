// Room chat in Toque y Fama: two phones against real Firebase (canon C-15)
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each one serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const BASE = process.argv[3];
const hosts = BASE ? [BASE, BASE] : ['localhost', '127.0.0.1', '[::1]'].map(h => SITE.replace('localhost', h)).slice(0, 2);
const A = await launch({ port: 9466, dir: `${OUT}/cA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9467, dir: `${OUT}/cB`, out: OUT, width: 375, height: 812 });
const chat = d => d.evaluate(`(()=>{const m=document.getElementById('chat');const b=document.querySelector('.chat-badge');const p=document.querySelector('.chat-peek');return JSON.stringify({
  mounted: !!document.querySelector('.chat-fab'), visible: m && !m.hidden,
  open: !!document.querySelector('.chat-sheet') && !document.querySelector('.chat-sheet').hidden,
  unread: b && !b.hidden ? b.textContent : '0',
  label: p && !p.hidden ? p.textContent : null,
  messages: [...document.querySelectorAll('.chat-msg')].map(x=>x.textContent),
})})()`).then(JSON.parse);
const say = async (d, text) => {
  await d.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(200);
  return d.evaluate(`(()=>{const i=document.querySelector('.chat-form input');if(!i)return 'no-input';i.value=${JSON.stringify(text)};i.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.chat-send').click();return document.querySelector('.chat-form input').value===''?'sent':'blocked'})()`);
};
const close = d => d.evaluate(`document.querySelector('.chat-x')?.click(); 1`);

await A.go(hosts[0] + '/bulls-and-cows/', 1500); await A.evaluate(`localStorage.clear(); 1`);
await B.go(hosts[1] + '/bulls-and-cows/', 1500); await B.evaluate(`localStorage.clear(); 1`);

// --- one phone: there should be no chat ---
await A.go(hosts[0] + '/bulls-and-cows/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
await A.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form input');xs[0].value='Javi';xs[1].value='Cata';return 1})()`);
await A.evaluate(`document.querySelector('#setup-actions .btn').click(); 1`); await sleep(900);
console.log('one phone → chat mounted:', (await chat(A)).mounted, '(should be false)');

// --- room ---
await A.go(hosts[0] + '/bulls-and-cows/', 1500); await A.evaluate(`localStorage.clear(); 1`);
await A.go(hosts[0] + '/bulls-and-cows/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
await A.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await A.evaluate(`document.querySelectorAll('#setup-actions .btn')[0].click(); 1`); await sleep(4500);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('room:', code, '| chat in the waiting room:', JSON.stringify(await chat(A)));
await A.shot('tyf-chat-01-lobby');
await B.go(`${hosts[1]}/bulls-and-cows/?room=${code}`, 2000);
await B.evaluate(`(()=>{document.querySelector('#setup-form input').value='Cata';return 1})()`);
await B.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(b=>/Unirse|Join/.test(b.textContent)).click(); 1`); await sleep(4500);
console.log('B joined:', await B.active(), '| role:', await B.evaluate(`__tyf.session().role`));

// --- messages while the numbers are being chosen ---
console.log('A writes:', await say(A, 'ya elegí el mío'));
await sleep(2500);
let cB = await chat(B);
console.log('B (chat closed) → unread:', cB.unread, '| label:', JSON.stringify(cB.label), '| messages:', JSON.stringify(cB.messages));
await B.shot('tyf-chat-02-secret');
await close(A);
console.log('A secret:', await A.typeNum('1234')); await sleep(800);
console.log('B secret:', await B.typeNum('5678')); await sleep(3500);
console.log('in game → A:', await A.active(), '| chat:', JSON.stringify(await chat(A)));

// --- during the game ---
console.log('B teases:', await say(B, 'no le achuntas ni una'));
await sleep(2500);
const cA = await chat(A);
console.log('A receives mid-game → unread:', cA.unread, '| label:', JSON.stringify(cA.label));
await A.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(300);
await A.shot('tyf-chat-03-game');
await close(A); await close(B);

// --- to the end: the chat stays alive on the result ---
let guard = 0;
while (guard++ < 14) {
  const vA = await A.view(); if (!vA || vA.phase === 'done') break;
  // Both at once (D-367)
  for (const [role, dev] of [['A', A], ['B', B]]) {
    if (!(await dev.hasPad())) continue;
    const mine = await dev.evaluate(`__tyf.match().guesses.filter(g=>g.from==='${role}').length`);
    await dev.typeNum(role === 'A' ? (mine === 0 ? '5687' : '5678') : (mine === 0 ? '1243' : '1234'));
  }
  await sleep(3200);
}
await sleep(3000);
for (const [k, d] of [['A', A], ['B', B]]) {
  const c = await chat(d);
  console.log(`${k} on the result → screen:`, await d.active(), '| chat visible:', c.visible, '(should be true) | messages:', c.messages.length);
}
// You can keep talking after the final whistle (D-35)
console.log('B comments on the result:', await say(B, 'revancha altiro'));
await sleep(2500);
const cEnd = await chat(A);
console.log('A gets it on the result → unread:', cEnd.unread, '| label:', JSON.stringify(cEnd.label));
await A.shot('tyf-chat-04-result');
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs));
console.log('errors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
A.close(); B.close();

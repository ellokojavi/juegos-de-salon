// Room chat in Timeline: two phones against real Firebase (canon C-15)
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
// Optional second argument: a different base (for example the published site), canon C-12.
const BASE = process.argv[3];
const hosts = BASE ? [BASE, BASE] : ['localhost', '127.0.0.1', '[::1]'].map(h => SITE.replace('localhost', h)).slice(0, 2);
const A = await launch({ port: 9462, dir: `${OUT}/cA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9463, dir: `${OUT}/cB`, out: OUT, width: 375, height: 812 });
const devs = { A, B };
const clickText = (d, sel, re) => d.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}','i').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const setName = (d, n) => d.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const v = d => d.evaluate(`(()=>{const s=window.__ldt.view();return JSON.stringify({lobby:!!s.lobby,current:s.current,done:s.done})})()`).then(JSON.parse);
const chat = d => d.evaluate(`(()=>{const m=document.getElementById('chat');const b=document.querySelector('.chat-badge');return JSON.stringify({
  mounted: !!document.querySelector('.chat-fab'), visible: m && !m.hidden,
  bubble: !!document.querySelector('.chat-fab') && !document.querySelector('.chat-fab').hidden,
  open: !!document.querySelector('.chat-sheet') && !document.querySelector('.chat-sheet').hidden,
  unread: b && !b.hidden ? b.textContent : '0',
  peek: (()=>{const p=document.querySelector('.chat-peek');return p && !p.hidden ? p.textContent : null})(),
  messages: [...document.querySelectorAll('.chat-msg')].map(x=>x.textContent),
})})()`).then(JSON.parse);
const say = async (d, text) => {
  await d.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(200);
  const r = await d.evaluate(`(()=>{const i=document.querySelector('.chat-form input');if(!i)return 'no-input';i.value=${JSON.stringify(text)};i.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.chat-send').click();return document.querySelector('.chat-form input').value===''?'sent':'blocked'})()`);
  return r;
};
const play = async (d, role) => {
  const info = await d.evaluate(`(()=>{const s=window.__ldt.view();const card=s.hands['${role}'][0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at})})()`).then(JSON.parse);
  await d.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(120);
  await d.evaluate(`document.querySelectorAll('#line .slot')[${info.at}]?.click(); 1`); await sleep(120);
  return d.evaluate(`(()=>{const b=document.querySelector('#place-row .btn');if(!b||b.disabled)return 'no';b.click();return 'ok'})()`);
};
const closeVerdict = async d => { await d.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(300); };

for (const [i, [, d]] of Object.entries(devs).entries()) { await d.go(hosts[i] + '/timeline/', 1500); await d.evaluate(`localStorage.clear(); 1`); }

// --- one-phone mode: there must be no chat ---
await A.go(hosts[0] + '/timeline/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400);
await A.evaluate(`(()=>{const xs=document.querySelectorAll('#setup-form input');xs[0].value='Javi';xs[0].dispatchEvent(new Event('input',{bubbles:true}));xs[1].value='Cata';xs[1].dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await clickText(A, '#setup-actions .btn', 'jugar'); await sleep(1200);
console.log('one phone → chat mounted:', (await chat(A)).mounted, '(must be false)');

// --- room with two phones ---
await A.go(hosts[0] + '/timeline/', 1500);
await A.evaluate(`localStorage.clear(); 1`);
await A.go(hosts[0] + '/timeline/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
await setName(A, 'Javi');
await A.evaluate(`(()=>{const b=[...document.querySelectorAll('.seg button')].find(x=>/3$/.test(x.textContent.trim()));if(b)b.click();return 1})()`);
await clickText(A, '#setup-actions .btn', 'Crear'); await sleep(5000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('room:', code);
await B.go(`${hosts[1]}/timeline/?room=${code}`, 2000);
await setName(B, 'Cata');
await clickText(B, '#setup-actions .btn', 'Unirse'); await sleep(5000);
console.log('B joined as', await B.evaluate(`window.__ldt.session().role`), '| screen:', await B.active());
console.log('chat in the waiting room → A:', JSON.stringify(await chat(A)));
await A.shot('chat-01-lobby');

// --- messages in the waiting room ---
console.log('A writes:', await say(A, 'Ya llegaron todos?'));
await sleep(2500);
let cB = await chat(B);
console.log('B (chat closed) → unread:', cB.unread, '| peeking label:', JSON.stringify(cB.peek), '| messages:', JSON.stringify(cB.messages));
await B.shot('chat-02-unread');
await sleep(2800);
console.log('B a few seconds later → label:', JSON.stringify((await chat(B)).peek), '(must be null)', '| unread:', (await chat(B)).unread, '(still 1)');
console.log('B replies:', await say(B, 'Estoy lista 💪'));
await sleep(2500);
console.log('B after opening → unread:', (await chat(B)).unread, '(must be 0)');
console.log('A sees:', JSON.stringify((await chat(A)).messages));
await B.shot('chat-03-open');
// spam brake: two sends back to back, with no pause in between
console.log('B sends one:', await say(B, 'otro mensaje'), '| and another right away:', await say(B, 'y otro mas'), '(the second must be blocked)');
await sleep(1500);
console.log('B retries later:', await say(B, 'ahora si'), '(must be sent)');
await sleep(2000);
await B.evaluate(`document.querySelector('.chat-x').click(); 1`); await sleep(200);

// --- during the game ---
await clickText(A, '#lobby-box .btn', 'Empezar'); await sleep(4000);
console.log('game started → A:', await A.active(), '| chat visible:', (await chat(A)).bubble);
await A.shot('chat-04-game');
console.log('A comments on the move:', await say(A, 'esa carta es fácil'));
await sleep(2500);
const cGame = await chat(B);
console.log('B receives during the game → unread:', cGame.unread, '| label:', JSON.stringify(cGame.peek));
await B.shot('chat-04b-label');
await B.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(300);
await B.shot('chat-05-in-game');
await B.evaluate(`document.querySelector('.chat-x').click(); 1`); await sleep(200);

// --- the verdict covers the chat ---
let s = await v(A);
await play(devs[s.current], s.current); await sleep(2000);
const covered = await A.evaluate(`(()=>{const f=document.querySelector('.chat-fab');if(!f)return 'no bubble';const r=f.getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return document.getElementById('handoff').hidden?'no verdict':(document.getElementById('handoff').contains(e)?'covered by the verdict':'visible: '+e.className)})()`);
console.log('with the verdict on screen, the bubble is:', covered);
await A.shot('chat-06-verdict');
for (const k of ['A', 'B']) await closeVerdict(devs[k]);

// --- reconnection: the chat history comes back, with no sound or badge ---
await B.go(`${hosts[1]}/timeline/?room=${code}`, 8000);
const cRe = await chat(B);
console.log('B after reloading → screen:', await B.active(), '| recovered messages:', cRe.messages.length, '| unread:', cRe.unread, '(must be 0)');
await B.shot('chat-06b-reconnection');
for (const k of ['A', 'B']) await closeVerdict(devs[k]);

// --- to the end: the chat stays alive in the result ---
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
console.log('game over:', JSON.stringify(await v(A)));
for (const k of ['A', 'B']) { const c = await chat(devs[k]); console.log(`${k} in the result → screen:`, await devs[k].active(), '| chat visible:', c.visible, '(must be true) | messages:', c.messages.length); }
// Talking can go on after the final whistle (D-35)
console.log('A celebrates in the result:', await say(A, 'te gane por un pelo'));
await sleep(2500);
const cFinal = await chat(B);
console.log('B gets it on its result screen → unread:', cFinal.unread, '| label:', JSON.stringify(cFinal.peek));
await A.shot('chat-07-result');
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs));
console.log('errors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
A.close(); B.close();

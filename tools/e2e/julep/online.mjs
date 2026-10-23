// Julepe with three phones against real Firebase: room, sealed deal (D-81), turns over the
// network, seal of verified cards when the hand closes (C-10), reconnection and chat.
//
// Each "phone" is a Chrome with its own profile and its own origin, so they don't share
// localStorage (see this folder's README).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const hosts = ['localhost', '127.0.0.1', '[::1]'].map(h => SITE.replace('localhost', h));
const A = await launch({ port: 9390, dir: `${OUT}/pA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9391, dir: `${OUT}/pB`, out: OUT, width: 375, height: 812 });
const C = await launch({ port: 9392, dir: `${OUT}/pC`, out: OUT, width: 375, height: 812 });
const devs = { A, B, C };
const NAME = { A: 'Javi', B: 'Cata', C: 'Nico' };

const click = (d, sel) => d.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const setName = (d, n) => d.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const screen = d => d.evaluate(`document.querySelector('.screen.active')?.id`);
const roleOf = d => d.evaluate(`window.__julepe.session()?.role`);
const view = d => d.evaluate(`(()=>{const v=window.__julepe?.view();if(!v)return JSON.stringify({none:true});
  if(v.lobby)return JSON.stringify({lobby:true});
  return JSON.stringify({phase:v.phase,turn:v.turno,hand:v.manoN,pot:v.plato,trump:v.triunfo,done:v.done,
    knows:Object.keys(v.cartas),mine:v.cartas[window.__julepe.session().role]||null,
    decl:v.decl,tricks:v.bazas.length,winners:v.ganadores})})()`).then(JSON.parse);
const overlay = d => d.evaluate(`(()=>{const h=document.getElementById('handoff');return h.hidden?'':h.innerText.replace(/\\n/g,' | ').slice(0,160)})()`);
const closeOverlay = async d => { await d.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'none';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`); await sleep(400); };

/** That phone's turn, whatever the phase. Always goes in, so the table keeps moving. */
const play = d => d.evaluate(`(()=>{
  const v = window.__julepe.view(); if (!v) return 'no game';
  const btn = () => document.querySelector('#actions .btn--yellow');
  if (v.phase === 'declara') { const b = btn(); if (!b) return 'no'; b.click(); return 'go'; }
  if (v.phase === 'cambia') { const c = document.querySelector('#mine .pcard'); if (c) c.click(); const b = btn(); if (!b) return 'no'; b.click(); return 'exchange'; }
  if (v.phase === 'baza') {
    const c = document.querySelector('#mine .pcard:not(.off)'); if (!c) return 'no card';
    c.click(); const b = btn(); if (!b || b.disabled) return 'no button';
    const t = b.textContent.trim(); b.click(); return t;
  }
  if (v.phase === 'regala') {
    for (let i = 0; i < 12; i++) {
      const b = btn(); if (b && !b.disabled) { b.click(); return 'give'; }
      const plus = [...document.querySelectorAll('.give-pm button')].filter(x => x.textContent === '+' && !x.disabled)[0];
      if (!plus) return 'no plus';
      plus.click();
    }
  }
  return 'none';
})()`);

/* ---------------- Room ---------------- */
await A.go(`${hosts[0]}/labs/julep/`); await A.evaluate(`localStorage.clear(); 1`); await A.go(`${hosts[0]}/labs/julep/`);
await click(A, '.modes .mode:nth-child(2)'); await sleep(400);
await setName(A, NAME.A);
await click(A, '#setup-actions .btn--yellow'); await sleep(5000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('room:', code, '| A\'s screen:', await screen(A));

for (const [role, dev] of [['B', B], ['C', C]]) {
  const host = hosts[role === 'B' ? 1 : 2];
  // Joins through the invitation link, which is how it really arrives
  await dev.go(`${host}/labs/julep/?room=${code}`); await dev.evaluate(`localStorage.clear(); 1`);
  await dev.go(`${host}/labs/julep/?room=${code}`); await sleep(1200);
  await setName(dev, NAME[role]);
  await dev.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Unirse|Join|Entrar/i.test(x.textContent)).click(); 1`);
  await sleep(4500);
  console.log(`${role} joined →`, await screen(dev), '· role:', await roleOf(dev));
}
await sleep(1200);
console.log('in the room:', await A.evaluate(`document.querySelectorAll('#lobby-box .lobby-players .p').length`), 'players');
await A.shot('online-01-room');

await A.evaluate(`[...document.querySelectorAll('#lobby-box .btn--yellow')][0].click(); 1`); await sleep(3000);
console.log('started →', JSON.stringify(await view(A)));

/* ---------------- The deal arrives sealed (D-81) ---------------- */
{
  const message = await A.evaluate(`(()=>{const p=window.__julepe.match().plays.find(x=>x.t==='reparte');
    return p ? JSON.stringify({sealed:!!p.s,clear:!!p.m,envelopes:Object.keys(p.s||{}),length:(p.s?Object.values(p.s)[0].length:0)}) : 'null'})()`);
  console.log('deal message:', message);
  for (const role of ['A', 'B', 'C']) {
    const v = await view(devs[role]);
    console.log(`  ${role} knows the cards of:`, v.knows.join(',') || '(none)', '· their own:', (v.mine || []).join(' '));
  }
}
await B.shot('online-02-table');

/* ---------------- A full game over the network ---------------- */
let rounds = 0, seals = new Set(), reconnected = false;
while (rounds++ < 500) {
  const end = await Promise.all(['A', 'B', 'C'].map(r => screen(devs[r])));
  if (end.every(p => p === 'screen-result')) break;
  for (const role of ['A', 'B', 'C']) {
    const d = devs[role];
    const text = await overlay(d);
    if (text) {
      const s = await d.evaluate(`document.querySelector('#handoff .sello')?.textContent || ''`);
      if (s) seals.add(s);
      if (!reconnected && /JULEPE|salvaron/.test(text) && role === 'A') await d.shot('online-03-julepe');
      await closeOverlay(d);
      continue;
    }
    const v = await view(d);
    if (v.none || v.lobby || v.done) continue;
    if (v.turn !== role) continue;
    const r = await play(d);
    if (r === 'no card' || r === 'no button' || r === 'no plus') { console.log('⚠️ turn stuck on', role, r, v.phase); rounds = 999; break; }
    await sleep(260);
  }
  // Halfway through the second hand, B reloads: it has to come back to its room and its cards (C-6)
  const vb = await view(B);
  if (!reconnected && vb.hand === 1 && vb.phase === 'baza') {
    reconnected = true;
    await B.go(`${hosts[1]}/labs/julep/?room=${code}`); await sleep(9000);   // joining the room has a 12 s cap
    const now = await view(B);
    console.log('B reloaded →', await screen(B), '· hand', now.hand, '· their cards:', (now.mine || []).join(' ') || '⚠️ lost their hand');
    // If it did not return to the table, the first thing to know is whether the game was saved
    if ((await screen(B)) !== 'screen-play') {
      console.log('  what B had saved:', await B.evaluate(`(()=>{const r=localStorage.getItem('juegos-de-salon:julepe:session');
        if(!r)return 'none';const d=JSON.parse(r);return JSON.stringify({mode:d.mode,code:d.code,role:d.role,done:d.done,hands:Object.keys(d.private?.privadas||{}),key:!!d.private?.llave})})()`));
    }
  }
  await sleep(200);
}

for (const role of ['A', 'B', 'C']) {
  const v = await view(devs[role]);
  console.log(`${role} →`, await screen(devs[role]), '· hands:', v.hand, '· winners:', (v.winners || []).join(','));
}
console.log('seals seen:', [...seals].join(' / ') || '⚠️ none');
await A.shot('online-04-result');

/* ---------------- Room chat (C-15) ---------------- */
await A.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(300);
console.log('A sends:', await A.evaluate(`(()=>{const i=document.querySelector('.chat-form input');if(!i)return 'no-input';
  i.value='¡otra y el plato me lo tomo yo!';i.dispatchEvent(new Event('input',{bubbles:true}));
  document.querySelector('.chat-send').click();
  return document.querySelector('.chat-form input').value==='' ? 'sent' : 'blocked'})()`));
await sleep(1800);
console.log('chat on B:', await B.evaluate(`JSON.stringify({bubble:!!document.querySelector('.chat-fab'),
  unread:document.querySelector('.chat-badge')?.textContent||'0',
  messages:[...document.querySelectorAll('.chat-msg')].map(x=>x.textContent)})`));

const errors = [A, B, C].flatMap((d, i) => d.errors.map(e => `${'ABC'[i]}: ${e}`));
console.log('console errors:', errors.length ? errors.join(' | ') : 'none');
await A.close(); await B.close(); await C.close();
console.log('julepe (room): done');

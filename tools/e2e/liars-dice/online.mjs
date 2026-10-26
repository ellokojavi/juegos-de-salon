// Liar's Dice with three phones against real Firebase: room, turn-based bids, verified reveal
// (C-10), reconnection mid-game and rematch.
//
// Each "phone" is a Chrome with its own profile and its own origin, so they don't share
// localStorage (see this folder's README).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each one serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const hosts = ['localhost', '127.0.0.1', '[::1]'].map(h => SITE.replace('localhost', h));
const A = await launch({ port: 9386, dir: `${OUT}/pA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9387, dir: `${OUT}/pB`, out: OUT, width: 375, height: 812 });
const C = await launch({ port: 9388, dir: `${OUT}/pC`, out: OUT, width: 375, height: 812 });
const devs = { A, B, C };
const NAME = { A: 'Javi', B: 'Cata', C: 'Nico' };

const click = (d, sel) => d.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const setName = (d, n) => d.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const screen = d => d.evaluate(`document.querySelector('.screen.active')?.id`);
const state = d => d.evaluate(`(()=>{const s=window.__dudo?.view();if(!s)return JSON.stringify({none:true});
  if(s.lobby)return JSON.stringify({lobby:true});
  return JSON.stringify({phase:s.phase,current:s.current,round:s.round,done:s.done,winner:s.winner,
    bid:s.bid?s.bid.n+'×'+s.bid.p:null,waiting:s.waiting,
    dice:Object.fromEntries(Object.entries(s.st).map(([r,x])=>[r,x.dice]))})})()`).then(JSON.parse);
const overlay = d => d.evaluate(`(()=>{const h=document.getElementById('handoff');return h.hidden?'':h.innerText.replace(/\\n/g,' | ').slice(0,120)})()`);
const closeOverlay = async d => { await d.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'none';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`); await sleep(400); };

/** The move of whoever has the turn: bids the minimum with the first available face, or doubts. */
const play = async (d, doubt = false) => d.evaluate(`(()=>{
  if (${doubt}) { const b=[...document.querySelectorAll('#actions .btn')].find(x=>/Dudo/i.test(x.textContent)); if(!b)return 'no doubt button'; b.click(); return 'doubted'; }
  const p=[...document.querySelectorAll('.pinta')].filter(x=>!x.disabled); if(!p.length)return 'no faces';
  p[0].click();
  const ok=document.querySelector('#actions .btn--yellow'); if(!ok||ok.disabled)return 'no button';
  const t=ok.textContent; ok.click(); return t;
})()`);

/* ---------------- Room ---------------- */
await A.go(`${hosts[0]}/liars-dice/`); await A.evaluate(`localStorage.clear(); 1`); await A.go(`${hosts[0]}/liars-dice/`);
await click(A, '.modes .mode:nth-child(2)'); await sleep(400);
await setName(A, NAME.A);
await A.evaluate(`[...document.querySelectorAll('#setup-form .toggle-row')].find(r=>r.textContent.includes('🫨'))?.querySelector('.switch.on')?.click(); 1`);   // the shake (D-447) has its own script
await click(A, '#setup-actions .btn--yellow'); await sleep(5000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('room:', code, '| A screen:', await screen(A));

for (const [role, dev] of [['B', B], ['C', C]]) {
  const host = hosts[role === 'B' ? 1 : 2];
  // Joins through the invitation link, which is how it really arrives (RP-18)
  await dev.go(`${host}/liars-dice/?room=${code}`); await dev.evaluate(`localStorage.clear(); 1`);
  await dev.go(`${host}/liars-dice/?room=${code}`); await sleep(1200);
  await setName(dev, NAME[role]);
  await dev.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Unirse|Join|Entrar/i.test(x.textContent)).click(); 1`);
  await sleep(4500);
  console.log(`${role} joined →`, await screen(dev), '· role:', await dev.evaluate(`window.__dudo.session().role`));
}
await sleep(1200);
console.log('in the room:', await A.evaluate(`document.querySelectorAll('#lobby-box .lobby-players .p').length`), 'players');
await A.shot('online-01-room');

// Only the host starts the game
await A.evaluate(`[...document.querySelectorAll('#lobby-box .btn--yellow')][0].click(); 1`); await sleep(2500);
console.log('started →', JSON.stringify(await state(A)));

/* ---------------- One game ---------------- */
let turns = 0, reveals = 0, verified = 0, reconnected = false;
while (turns++ < 80) {
  const s = await state(A);
  if (s.done) break;
  // The reveal is looked at on all three and closed on all three
  for (const [role, dev] of Object.entries(devs)) {
    const o = await overlay(dev);
    if (o) {
      if (role === 'A' && !reveals) { await dev.shot('online-02-reveal'); console.log('reveal:', o); }
      if (/✅/.test(o)) verified++;
      if (role === 'A') reveals++;
      await closeOverlay(dev);
    }
  }
  const v = await state(A);
  if (v.done) break;
  // Mid-game, a phone reloads: it has to go back to its room with the dice it had
  if (!reconnected && v.round >= 3 && v.phase === 'bid') {
    reconnected = true;
    await B.go(`${hosts[1]}/liars-dice/?room=${code}`); await sleep(4500);
    const back = await state(B);
    console.log('B reloaded mid-game →', await screen(B), '· round', back.round, '· its dice:',
      await B.evaluate(`(()=>{const s=window.__dudo.session();const v=window.__dudo.view();return (s.secrets[v.round]?.dice||[]).join(',')||'(rolls them again)'})()`));
  }
  if (v.phase !== 'bid' || !v.current) { await sleep(500); continue; }
  const onTurn = devs[v.current];
  const r = await play(onTurn, turns % 3 === 0);
  if (/^no /.test(r)) await play(onTurn, true);
  await sleep(900);
}
const end = await state(A);
console.log('game →', JSON.stringify({ done: end.done, winner: end.winner, rounds: end.round, reveals, verified }));

/* ---------------- The winner notice to the panel (D-79) ---------------- */
// The transport is spied on, since that's as far as the game goes: whether the database accepts
// the field depends on the rules, which are published by hand in the console. What this test
// guards is that the game notifies, that it notifies only once and that it names the winner.
for (const dev of Object.values(devs)) {
  await dev.evaluate(`(()=>{const t=window.__dudo.session().transport;window.__winnerNotes=[];
    const orig=t.noteWinner.bind(t);t.noteWinner=x=>{window.__winnerNotes.push(x||{});return orig(x)};return 1})()`);
}

/* ---------------- To the end ---------------- */
let g2 = 0;
while (g2++ < 160) {
  for (const dev of Object.values(devs)) { if (await overlay(dev)) await closeOverlay(dev); }
  const v = await state(A);
  if (v.done) break;
  if (v.phase !== 'bid' || !v.current) { await sleep(400); continue; }
  const r = await play(devs[v.current], g2 % 2 === 0);
  if (/^no /.test(r)) await play(devs[v.current], true);
  await sleep(700);
}
const s3 = await state(A);
console.log('final →', JSON.stringify({ done: s3.done, winner: s3.winner, screen: await screen(A) }));
{
  const notices = JSON.parse(await A.evaluate(`JSON.stringify(window.__winnerNotes || [])`));
  const good = notices.length === 1 && notices[0]?.role === s3.winner;
  console.log('winner notice to the panel (D-79) →', JSON.stringify(notices),
    good ? '· only once and it is the winner' : '⚠️  does not match the winner');
}
if (s3.done) await A.shot('online-03-result');

/* ---------------- Rematch: new room and everyone in ---------------- */
if (s3.done) {
  await A.evaluate(`document.querySelector('#result-actions .btn--yellow').click(); 1`); await sleep(6000);
  const fresh = await A.evaluate(`window.__dudo.session()?.code`);
  console.log('rematch → new room:', fresh, '· different from the first:', fresh !== code, '· screen:', await screen(A));
  await sleep(3000);
  for (const [role, dev] of [['B', B], ['C', C]]) {
    await dev.evaluate(`document.querySelector('#result-actions .btn--yellow')?.click(); 1`); await sleep(4000);
    console.log(`${role} in the rematch →`, await screen(dev), '· room:', await dev.evaluate(`window.__dudo.session()?.code`));
  }
}

for (const [role, dev] of Object.entries(devs)) {
  const errs = dev.errors.concat(dev.logs.filter(l => !/vibrate|permission_denied/i.test(l)));
  console.log(`errors in ${role}:`, JSON.stringify(errs.slice(0, 2)));
}
A.close(); B.close(); C.close();

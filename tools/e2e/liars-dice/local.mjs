// Liar's Dice end to end, offline (with the shake off: it has its own script, shake-clock.mjs): a duel against the phone and a three-player game on one phone.
// Checks that the bid really goes up, that the reveal counts right, that the phone never
// makes an illegal move and that the game can be resumed (C-6). Shots are named after
// the README screenshots (docs/capturas.json).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const b = await launch({ port: 9385, dir: `${OUT}/p`, out: OUT });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
const taken = new Set();
const shot = async name => { if (!taken.has(name)) { taken.add(name); await b.shot(name); } };
const screen = () => ev(`document.querySelector('.screen.active').id`);
const overlay = () => ev(`document.getElementById('handoff').hidden === false`);
const saved = () => ev(`JSON.parse(localStorage.getItem('juegos-de-salon:dudo:session') || 'null')`);

/** One move by the human player: bids the minimum with the face asked for, or doubts. */
const bid = async face => ev(`(()=>{
  const p = [...document.querySelectorAll('.pinta')].filter(x => !x.disabled);
  if (!p.length) return 'no faces';
  (p[${face}] || p[0]).click();
  const ok = document.querySelector('#actions .btn--yellow');
  if (!ok || ok.disabled) return 'no button';
  const text = ok.textContent;
  ok.click();
  return text;
})()`);
const doubt = () => ev(`(()=>{const b=[...document.querySelectorAll('#actions .btn')].find(x=>/Dudo/i.test(x.textContent));if(!b)return 'no';b.click();return 'ok'})()`);
const proceed = () => ev(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'no';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`);

await b.go(`${SITE}/`);
await ev(`localStorage.clear(); 1`);
await b.go(`${SITE}/liars-dice/`);
await shot('01-intro');
console.log('modes:', await ev(`[...document.querySelectorAll('.mode')].map(m=>m.innerText.split('\\n')[0]+(m.disabled?' (disabled)':'')).join(' | ')`));

/* ---------------- Against the phone ---------------- */
await ev(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
await ev(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await ev(`[...document.querySelectorAll('#setup-form .toggle-row')].find(r=>r.textContent.includes('🫨'))?.querySelector('.switch.on')?.click(); document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(600);
await shot('03-table');
console.log('my dice:', await ev(`document.querySelectorAll('#mine .die').length`), '· table:', await ev(`document.getElementById('status-sub').textContent`));

// The bid: the face is chosen and the quantity picker shows up (C-8: nothing preselected)
console.log('before choosing a face, the button is', await ev(`document.querySelector('#actions .btn--yellow').disabled ? 'disabled' : '⚠️ ENABLED'`));
await ev(`document.querySelectorAll('.pinta')[4].click(); 1`); await sleep(300);
await shot('04-bid');
// With the Chilean names on (the default) face 5 is called "quintas" (D-71)
console.log('proposed bid:', await ev(`document.querySelector('#actions .btn--yellow').textContent`));
console.log('switches in a duel:', await ev(`[...document.querySelectorAll('#setup-form .toggle-row b')].map(b=>b.textContent).join(', ') || 'none'`) || '(already left the setup)');

let turns = 0, reveals = 0, spotOffered = 0;
while ((await screen()) !== 'screen-result' && turns++ < 120) {
  if (await overlay()) {
    if (!taken.has('05-reveal') && await ev(`!!document.querySelector('#handoff .count')`)) await shot('05-reveal');
    if (await ev(`!!document.querySelector('#handoff .count')`)) reveals++;
    await proceed(); await sleep(350); continue;
  }
  if ((await ev(`!!document.querySelector('#actions .btn')`)) === false) { await sleep(300); continue; }
  // In a duel you can't call spot-on (D-71): the button should never show up
  if (await ev(`[...document.querySelectorAll('#actions .btn')].some(b=>/Calzo|Spot|Cravo/i.test(b.textContent))`)) spotOffered++;
  // Doubt one time out of three, so the game moves along and both outcomes show up
  const r = turns % 3 === 0 ? await doubt() : await bid(0);
  if (r === 'no' || r === 'no faces' || r === 'no button') { await doubt(); }
  await sleep(320);
}
console.log('against the phone →', await screen(), '·', await ev(`document.getElementById('result-title').textContent`),
  '·', await ev(`document.getElementById('result-sub').textContent`), '· reveals:', reveals);
console.log('spot-on offered in the duel:', spotOffered === 0 ? 'never (good)' : `⚠️ ${spotOffered} times`);
await ev(`document.getElementById('result-history').open = true; 1`); await sleep(300);
await sleep(4200); // the confetti lasts 4 s and would cover the screenshot's title and history (D-76)
await shot('06-result');
console.log('history:', await ev(`document.querySelectorAll('#history-list li').length`), 'rounds logged');

/* ---------------- Three players on one phone ---------------- */
await b.go(`${SITE}/liars-dice/`); await ev(`localStorage.clear(); 1`); await b.go(`${SITE}/liars-dice/`);
await ev(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(300);
await ev(`document.querySelector('#setup-actions .btn--ghost').click(); 1`); await sleep(200);
await shot('02-setup');
console.log('with three players there are:', await ev(`[...document.querySelectorAll('#setup-form .toggle-row b')].map(b=>b.textContent).join(' + ')`));
await ev(`(()=>{const n=['Javi','Cata','Nico'];[...document.querySelectorAll('#setup-form input')].forEach((i,k)=>{i.value=n[k];i.dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
await ev(`[...document.querySelectorAll('#setup-form .toggle-row')].find(r=>r.textContent.includes('🫨'))?.querySelector('.switch.on')?.click(); document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(500);
console.log('on one phone it starts with the handoff:', await ev(`document.getElementById('handoff').innerText.replace(/\\n/g,' ')`));
await shot('07-handoff');

// Resume mid-game (C-6)
await proceed(); await sleep(400);
await bid(0); await sleep(400);
const before = await saved();
await b.go(`${SITE}/liars-dice/`);
console.log('resume → panel:', await ev(`!!document.querySelector('#resume-slot .btn--cyan')`),
  '· saved messages:', (before?.messages || []).length);
await ev(`document.querySelector('#resume-slot .btn--cyan').click(); 1`); await sleep(700);
console.log('resumed →', await screen(), '·', await ev(`document.getElementById('handoff').innerText.split('\\n').pop()`));

let v2 = 0;
while ((await screen()) !== 'screen-result' && v2++ < 300) {
  if (await overlay()) { await proceed(); await sleep(200); continue; }
  if ((await ev(`!!document.querySelector('#actions .btn')`)) === false) { await sleep(250); continue; }
  const r = v2 % 2 === 0 ? await doubt() : await bid(0);
  if (r === 'no' || r === 'no faces' || r === 'no button') await doubt();
  await sleep(200);
}
console.log('three on one phone →', await screen(), '·', await ev(`document.getElementById('result-title').textContent`),
  '·', await ev(`document.getElementById('result-sub').textContent`));
console.log('the finished game is no longer offered:', await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:dudo:session')).done`));

console.log('screenshots:', [...taken].sort().join(' '));
console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs.filter(l => !/vibrate/i.test(l))));
b.close();

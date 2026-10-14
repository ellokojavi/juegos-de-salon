import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
// SITE: another server, so as not to clash with another session testing in parallel (D-135); cdp.mjs picks the Chrome port (D-213)
const SITE = process.env.SITE || 'http://localhost:8765';
const b = await launch({ port: Number(process.env.CDP_PORT) || 9380, dir: `${OUT}/profile`, out: OUT });
await b.go(`${SITE}/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/`); await b.shot('00-menu');
await b.go(`${SITE}/bulls-and-cows/`); await b.shot('01-intro');
// ---- LOCAL MODE: Javi 1234, Cata 5678 ----
await b.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400); await b.shot('02-setup-local');
await b.evaluate(`(()=>{const i=document.querySelectorAll('#setup-form input');i[0].value='Javi';i[1].value='Cata';return 1})()`);
await b.evaluate(`document.querySelector('#setup-actions .btn').click(); 1`); await sleep(500); await b.shot('03-cover-secret-A');
await b.cover(); await b.shot('04-secret-A'); console.log('secret A:', await b.typeNum('1234')); await sleep(500);
await b.cover(); console.log('secret B:', await b.typeNum('5678')); await sleep(900);
await b.shot('06-handoff-start'); await b.handoff(); await b.shot('07-play-first');
let guard = 0, first = true;
while ((await b.active()) === 'screen-play' && guard++ < 14) {
  const v = await b.view();
  if (!(await b.hasPad())) { const hh = await b.evaluate(`document.getElementById('handoff').hidden`); if (hh === false) await b.handoff(); else await sleep(300); continue; }
  const mine = await b.evaluate(`__tyf.match().guesses.filter(g=>g.from==='${v.expected}').length`);
  const guess = v.expected === 'A' ? (mine === 0 ? '5687' : '5678') : (mine === 0 ? '1243' : '1234');
  console.log('turn', v.expected, '→', guess, await b.typeNum(guess));
  await sleep(700); await b.shot(`08-reply-${guard}`);
  // The reply and the handoff on a single screen (C-9): with a fixed name, because it's a README screenshot.
  if (first) { first = false; await b.shot('08-reply-and-pass'); }
  await b.handoff();
}
await sleep(700); await b.shot('09-result-local');
console.log('local result:', await b.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent + ' | ' + document.getElementById('result-secrets').innerText.replace(/\\n/g,' ')`));
// Local rematch
await b.evaluate(`document.querySelector('#result-actions .btn').click(); 1`); await sleep(600);
console.log('rematch → screen:', await b.active(), 'phase:', (await b.view()).phase);
// ---- PLAY SOLO (D-142): La Copa's 🔢 game, 10 attempts and 0 to 100 points ----
const TYF = `${SITE}/bulls-and-cows/`;
const numbers = [];
for (const a of '0123456789') for (const c of '0123456789') for (const d of '0123456789') for (const e of '0123456789') { const n = a + c + d + e; if (new Set(n).size === 4) numbers.push(n); }
const secretOf = () => b.evaluate(`(async()=>{const m=await import('../cup/games/number/engine.js');return m.generar(__tyf.guardada().codigo,1).secreto})()`);
const attempts = () => b.evaluate(`(__tyf.guardada()?.jugadas?.i||[]).length`);
const finish = async () => { await b.evaluate(`document.getElementById('btn-fin').click(); 1`); await sleep(4200); }; // after the confetti, which covers the record
const summary = () => b.evaluate(`document.getElementById('solo-result').innerText.replace(/\\n+/g,' / ')`);
// The final buttons, in view without scrolling on an 812 px phone (C-8)
const belowFold = () => b.evaluate(`[...document.querySelectorAll('#solo-actions .btn')].filter(x=>x.getBoundingClientRect().bottom+scrollY>812).map(x=>x.textContent)`);

// A game from the old solo mode (with messages) is not offered for resuming
await b.go(TYF); await b.evaluate(`localStorage.setItem('juegos-de-salon:toque-y-fama:session', JSON.stringify({v:1,game:'toque-y-fama',at:Date.now(),mode:'solo',config:{digits:4,solo:true},messages:[{t:'hello',from:'A',name:'A'}],done:false})); 1`);
await b.go(TYF); console.log('old solo offered for resuming:', await b.evaluate(`!!document.querySelector('#resume-slot .panel')`));

// 1) How to play, two failed attempts, reload halfway, resume and get it on the third: 80/100
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400); await b.shot('10-setup-solo');
await b.evaluate(`document.getElementById('btn-solo-empezar').click(); 1`); await sleep(600);
let secret = await secretOf();
const misses = numbers.filter(n => n !== secret && [...n].some(d => secret.includes(d))).slice(0, 2);
for (const g of misses) { await b.typeNum(g); await sleep(500); }
await sleep(1200); await b.shot('11-solo-play');
console.log('solo board:', await b.evaluate(`[...document.querySelectorAll('#solo-body .clue')].map(x=>x.innerText.replace(/\\n/g,' ')).join(' | ')`), '| clock:', await b.evaluate(`document.getElementById('solo-cron').textContent`));
await b.go(TYF);
console.log('resume offered:', await b.evaluate(`document.querySelector('#resume-slot')?.innerText.replace(/\\n+/g,' / ')`));
await b.evaluate(`document.querySelector('#resume-slot .btn--cyan').click(); 1`); await sleep(1200);
console.log('resumed on', await b.active(), 'with', await attempts(), 'attempts and clock', await b.evaluate(`document.getElementById('solo-cron').textContent`));
await b.typeNum(secret); await sleep(600); await b.shot('11-solo-fin');
await finish(); await b.shot('12-solo-result');
// With no player signed in, the ending offers to make the game count (D-274)
console.log(`${await b.evaluate(`!!document.querySelector('#solo-result .rk-contar')`) ? '✓' : '✗'} solo: do you want this game to count?, with name and PIN`);
console.log('solo result:', await summary(), '| below 812 px:', JSON.stringify(await belowFold()), '| saved done:', await b.evaluate(`__tyf.guardada().done`));

// 2) Play again and don't get it: 0/100, and the previous record in view
await b.evaluate(`document.querySelector('#solo-actions .btn--yellow').click(); 1`); await sleep(600);
secret = await secretOf();
for (const g of numbers.filter(n => n !== secret).slice(0, 10)) { await b.typeNum(g); await sleep(150); }
await sleep(500); await finish(); await b.shot('12-solo-result-2');
console.log('solo result 2:', await summary(), '| below 812 px:', JSON.stringify(await belowFold()));
await b.evaluate(`[...document.querySelectorAll('#solo-actions .btn')][1].click(); 1`); await sleep(1500);
console.log('change mode →', await b.active());
console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs));
b.close();

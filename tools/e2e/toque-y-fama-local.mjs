import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9380, dir: `${OUT}/profile`, out: OUT });
await b.go('http://localhost:8765/'); await b.evaluate(`localStorage.clear(); 1`); await b.go('http://localhost:8765/'); await b.shot('00-menu');
await b.go('http://localhost:8765/toque-y-fama/'); await b.shot('01-intro');
// ---- MODO LOCAL: Javi 1234, Cata 5678 ----
await b.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400); await b.shot('02-setup-local');
await b.evaluate(`(()=>{const i=document.querySelectorAll('#setup-form input');i[0].value='Javi';i[1].value='Cata';return 1})()`);
await b.evaluate(`document.querySelector('#setup-actions .btn').click(); 1`); await sleep(500); await b.shot('03-cover-secret-A');
await b.cover(); await b.shot('04-secret-A'); console.log('secret A:', await b.typeNum('1234')); await sleep(500);
await b.cover(); console.log('secret B:', await b.typeNum('5678')); await sleep(900);
await b.shot('06-handoff-start'); await b.handoff(); await b.shot('07-play-first');
let guard = 0;
while ((await b.active()) === 'screen-play' && guard++ < 14) {
  const v = await b.view();
  if (!(await b.hasPad())) { const hh = await b.evaluate(`document.getElementById('handoff').hidden`); if (hh === false) await b.handoff(); else await sleep(300); continue; }
  const mine = await b.evaluate(`__tyf.match().guesses.filter(g=>g.from==='${v.expected}').length`);
  const guess = v.expected === 'A' ? (mine === 0 ? '5687' : '5678') : (mine === 0 ? '1243' : '1234');
  console.log('turn', v.expected, '→', guess, await b.typeNum(guess));
  await sleep(700); await b.shot(`08-reply-${guard}`); await b.handoff();
}
await sleep(700); await b.shot('09-result-local');
console.log('local result:', await b.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent + ' | ' + document.getElementById('result-secrets').innerText.replace(/\\n/g,' ')`));
// Revancha local
await b.evaluate(`document.querySelector('#result-actions .btn').click(); 1`); await sleep(600);
console.log('rematch → screen:', await b.active(), 'phase:', (await b.view()).phase);
// ---- MODO CPU ----
await b.go('http://localhost:8765/toque-y-fama/'); await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(300); await b.shot('10-setup-cpu');
await b.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await b.evaluate(`document.querySelector('#setup-actions .btn').click(); 1`); await sleep(500);
console.log('cpu secret:', await b.typeNum('0192')); await sleep(3000); await b.shot('11-cpu-play');
guard = 0;
const cands = ['3456', '7890', '1357', '2468', '9876', '0123', '4567', '5678', '6789', '1029', '3847', '5612', '9034', '7821'];
while ((await b.active()) === 'screen-play' && guard++ < 30) {
  if (!(await b.hasPad())) { await sleep(700); continue; }
  await b.typeNum(cands[guard % cands.length]); await sleep(2400);
}
await sleep(800); await b.shot('12-cpu-result');
console.log('cpu result:', await b.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent`), '|', await b.evaluate(`[...document.querySelectorAll('.board .count')].map(x=>x.textContent).join(' / ')`));
console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs));
b.close();

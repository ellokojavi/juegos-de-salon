import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 9381, dir: `${OUT}/p`, out: OUT });
const bv = () => b.evaluate(`JSON.stringify(window.__bn.view())`).then(JSON.parse);
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (sel, re) => b.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>/${re}/.test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const tapCell = (grid, name) => b.evaluate(`(()=>{const {r,c}={r:parseInt('${name}'.slice(1))-1,c:'ABCDEFGHIJ'.indexOf('${name}'[0])};const x=document.querySelector('${grid} .cell[data-r="'+r+'"][data-c="'+c+'"]');if(!x)return 'no';x.click();return 'ok'})()`);
const fireAt = async name => { await tapCell('#enemy-grid', name); const r = await click('#fire-btn'); await sleep(250); return r; };
const shipCells = async role => b.evaluate(`(()=>{const L=__bn.session().layouts['${role}'].layout;const S={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2};const out=[];for(const [id,p] of Object.entries(L)){for(let i=0;i<S[id];i++){const r=p.dir==='h'?p.r:p.r+i,c=p.dir==='h'?p.c+i:p.c;out.push('ABCDEFGHIJ'[c]+(r+1))}}return JSON.stringify(out)})()`).then(JSON.parse);
const missCell = async role => { const cells = await shipCells(role); for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) { const n = 'ABCDEFGHIJ'[c] + (r + 1); if (!cells.includes(n)) return n; } };
const handoffBtn = async () => { await b.evaluate(`document.querySelector('#handoff .btn')?.click(); 1`); await sleep(450); };

await b.go(`${SITE}/battleship/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/battleship/`);
console.log('modes:', await b.evaluate(`[...document.querySelectorAll('.mode')].map(m=>m.disabled?'off':'on').join(',')`)); await b.shot('01-intro');
// ---- LOCAL ----
await click('.mode'); await sleep(300); await b.shot('02-setup');
await b.evaluate(`(()=>{const i=document.querySelectorAll('#setup-form input');i[0].value='Javi';i[1].value='Cata';return 1})()`);
await click('#setup-actions .btn'); await sleep(400); await b.shot('03-cover');
await b.cover(); await sleep(200); await b.shot('04-place-empty');
// place the carrier by hand at A1 horizontal, rotate the next one and put it vertical, then the rest at random
console.log('tap A1 (carrier):', await tapCell('#place-grid', 'A1'), '| placed:', await b.evaluate(`document.getElementById('place-count').textContent`));
await clickText('#place-actions .btn', 'Girar'); console.log('tap A3 vertical (battleship):', await tapCell('#place-grid', 'A3'), '| placed:', await b.evaluate(`document.getElementById('place-count').textContent`));
console.log('invalid tap A2 (overlapped by the vertical battleship A3..A6? no, A2 is free) →', await tapCell('#place-grid', 'J10'), 'placed:', await b.evaluate(`document.getElementById('place-count').textContent`));
await b.shot('05-place-partial');
// pick up the carrier by tapping it and put it back at C8
console.log('pick up A1:', await tapCell('#place-grid', 'B1'), '→', await b.evaluate(`document.getElementById('place-count').textContent`), '| sel:', await b.evaluate(`document.querySelector('.ship-chip.sel')?.textContent`));
await clickText('#place-actions .btn', 'Girar'); console.log('put at C8 horizontal:', await tapCell('#place-grid', 'C8'), '→', await b.evaluate(`document.getElementById('place-count').textContent`));
await clickText('#place-actions .btn', 'azar'); await sleep(200); console.log('at random →', await b.evaluate(`document.getElementById('place-count').textContent`), '| set sail enabled:', await b.evaluate(`!document.querySelector('#place-sail .btn').disabled`));
await b.shot('06-place-full');
await click('#place-sail .btn'); await sleep(600); await b.shot('07-cover-B');
await b.cover(); await clickText('#place-actions .btn', 'azar'); await click('#place-sail .btn'); await sleep(800);
console.log('phase:', (await bv()).phase, '| shooter:', (await bv()).shooter, '| handoff visible:', await b.evaluate(`!document.getElementById('handoff').hidden`));
await b.shot('08-handoff-start'); await handoffBtn(); await b.shot('09-play');
// B (Cata) starts: misses on purpose → passes to A
let v = await bv(); const missB = await missCell('A');
console.log('B fires a miss at', missB, await fireAt(missB)); await sleep(500); await b.shot('10-result-pass');
console.log('handoff text:', JSON.stringify(await b.evaluate(`document.getElementById('handoff').innerText.replace(/\\n/g,' | ')`)));
await handoffBtn(); v = await bv(); console.log('now shooting:', v.shooter);
const missA = await missCell('B'); console.log('A fires a miss at', missA, await fireAt(missA)); await sleep(500); await handoffBtn();
// B sinks everything with extra shots
const targets = await shipCells('A');
for (const t of targets) { const r = await fireAt(t); if (r !== 'ok') { console.log('failed to fire', t, r); break; } await sleep(150); const vv = await bv(); if (vv.phase !== 'play') break; }
await sleep(1200); await b.shot('11-result');
console.log('result:', await b.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent`), '| phase:', (await bv()).phase);
await b.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(500);
console.log('after closing the last shot\'s result → screen:', await b.active());
await b.evaluate(`document.querySelector('#result-replay summary').click(); 1`); await sleep(300); await b.shot('12-result-replay');
// ---- CPU ----
await b.go(`${SITE}/battleship/`); await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(300);
await b.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await click('#setup-actions .btn'); await sleep(400); await clickText('#place-actions .btn', 'azar'); await click('#place-sail .btn'); await sleep(2500);
console.log('cpu: phase', (await bv()).phase, 'shooter', (await bv()).shooter, 'shots', await b.evaluate(`__bn.match().shots.length`));
await b.shot('13-cpu-play');
// the human alternates: a hit (from the bot's fleet), then a miss, so the bot gets to play
const botCells = await shipCells('B'); let hitIdx = 0; let guard = 0; let missR = 0;
while (guard++ < 400) {
  const vv = await bv(); if (vv.phase !== 'play') break;
  if (vv.shooter !== 'A' || vv.pending) { await sleep(700); continue; }
  const useHit = (guard % 2 === 1) && hitIdx < botCells.length;
  let cell;
  if (useHit) cell = botCells[hitIdx++];
  else { do { cell = 'ABCDEFGHIJ'[missR % 10] + (Math.floor(missR / 10) + 1); missR++; } while (botCells.includes(cell) || (await b.evaluate(`__bn.match().shots.some(s=>s.from==='A'&&s.cell==='${cell}')`))); }
  await fireAt(cell); await sleep(300);
}
// The wait is long on purpose: the last ship takes 1.4 s to sink before the result shows up
// (D-93), and on top of that 3.5 s of confetti fall. The confetti is painted on a canvas, so
// `quieto()` doesn't see it and the shot came out with the screen covered in paper bits (D-76).
await sleep(6000); await b.shot('14-cpu-result');
console.log('cpu result:', await b.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent`), '| total shots:', await b.evaluate(`__bn.match().shots.length`));
// ---- CPU, won: the human only hits, so the title speaks to them, not "¡Ganó Javi!" (#503) ----
await b.go(`${SITE}/battleship/`); await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(300);
await click('#setup-actions .btn'); await sleep(400); await clickText('#place-actions .btn', 'azar'); await click('#place-sail .btn'); await sleep(2500);
const botCells2 = await shipCells('B'); let hitIdx2 = 0; guard = 0;
while (guard++ < 400 && hitIdx2 < botCells2.length) {
  const vv = await bv(); if (vv.phase !== 'play') break;
  if (vv.shooter !== 'A' || vv.pending) { await sleep(700); continue; }
  await fireAt(botCells2[hitIdx2++]); await sleep(300);
}
await sleep(6000);
const won = await b.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent`);
console.log(/^¡Ganaste!/.test(won) && !/Ganó/.test(won) ? '✓' : '✗', 'cpu won:', won);
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

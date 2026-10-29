// Battleship's Salvo mode (#894, lab): the switch, a volley entered with taps and one ¡Fuego!,
// its answers shown together, the volley shrinking with the ships lost, and the phone's volley.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const SITE = process.env.SITE || 'http://localhost:8765';
// The owner can turn the flag off for everyone from the panel (D-498): then there is no Salvo to try
const { loadFlags, stateOf } = await import('../../../public/assets/js/flags.js');
if (stateOf(await loadFlags({ store: null }), 'bn-salva') === 'off') { console.log('– bn-salva is off in the panel: nothing to try'); process.exit(0); }
const OUT = output();
const b = await launch({ dir: `${OUT}/p`, out: OUT });
let fails = 0;
const ok = (cond, what) => { console.log(`${cond ? '✓' : '✗'} ${what}`); if (!cond) fails++; };
const bv = () => b.evaluate(`JSON.stringify(window.__bn.view())`).then(JSON.parse);
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (sel, re) => b.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>/${re}/.test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const tapCell = (grid, name) => b.evaluate(`(()=>{const r=parseInt('${name}'.slice(1))-1,c='ABCDEFGHIJ'.indexOf('${name}'[0]);const x=document.querySelector('${grid} .cell[data-r="'+r+'"][data-c="'+c+'"]');if(!x)return 'no';x.click();return 'ok'})()`);
const shipCells = role => b.evaluate(`(()=>{const L=__bn.session().layouts['${role}'].layout;const S={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2};const out=[];for(const id of Object.keys(S)){const p=L[id];for(let i=0;i<S[id];i++){const r=p.dir==='h'?p.r:p.r+i,c=p.dir==='h'?p.c+i:p.c;out.push('ABCDEFGHIJ'[c]+(r+1))}}return JSON.stringify(out)})()`).then(JSON.parse);
const misses = async (role, n, skip = []) => { const cells = await shipCells(role); const out = []; for (let r = 9; r >= 0 && out.length < n; r--) for (let c = 9; c >= 0 && out.length < n; c--) { const x = 'ABCDEFGHIJ'[c] + (r + 1); if (!cells.includes(x) && !skip.includes(x)) out.push(x); } return out; };
const handoffBtn = async () => { await b.evaluate(`document.querySelector('#handoff .btn')?.click(); 1`); await sleep(450); };
const fireLabel = () => b.evaluate(`document.querySelector('#fire-btn')?.textContent || ''`);

// ---- Setup: the switch, and what it hides ----
await b.go(`${SITE}/battleship/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/battleship/`);
await click('.mode'); await sleep(500);
ok(await b.evaluate(`!!document.querySelector('#setup-form [data-key="salvo"]')`), 'a lab key holder (localhost) sees the Salvo switch');
await click('#setup-form [data-key="salvo"] .switch'); await sleep(200);
ok(await b.evaluate(`document.querySelector('#setup-form [data-key="extraShot"]').hidden && document.querySelector('#setup-form [data-key="confirmShot"]').hidden`), 'Salvo hides the extra shot and the per-shot confirm');
await b.shot('01-setup-salvo');
await b.evaluate(`(()=>{const i=document.querySelectorAll('#setup-form input');i[0].value='Javi';i[1].value='Cata';return 1})()`);
await click('#setup-actions .btn'); await sleep(400);
for (let i = 0; i < 2; i++) { await b.cover(); await clickText('#place-actions .btn', 'azar'); await click('#place-sail .btn'); await sleep(800); }
await handoffBtn();
let v = await bv();
ok(v.phase === 'play' && v.salvo && v.salvo.size === 5 && v.shooter === 'B', `Cata opens with a volley of five (${v.salvo?.size})`);
ok(/5/.test(await b.evaluate(`document.getElementById('status-sub').textContent`)), 'the status says how many cells to mark');

// ---- Cata's volley: four misses and a hit on the destroyer, then a sink ----
const aCells = await shipCells('A');
const volley1 = [...(await misses('A', 4)), aCells[15]];
for (const c of volley1.slice(0, 4)) await tapCell('#enemy-grid', c);
ok(await b.evaluate(`document.getElementById('fire-btn').disabled`), 'Fire waits for the fifth cell');
ok(/4\/5/.test(await fireLabel()), `the button counts the marks (${await fireLabel()})`);
await tapCell('#enemy-grid', volley1[4]);
const extra = (await misses('A', 6))[5];
await tapCell('#enemy-grid', extra);
ok((await b.evaluate(`document.querySelectorAll('#enemy-grid .cell.aim').length`)) === 5, 'a sixth mark is refused');
await b.shot('02-volley-marked');
await click('#fire-btn'); await sleep(900);
v = await bv();
ok(v.shooter === 'A' && v.salvo.previous.length === 5, 'the turn passes after the whole volley is answered');
const handoff = await b.evaluate(`document.getElementById('handoff').innerText`);
ok((handoff.match(/\d/g) || []).length >= 5 && /Javi/.test(handoff), 'the hand-off lists the volley and names who is next');
await b.shot('03-volley-result');
await handoffBtn();

// ---- Javi sinks Cata's destroyer: Cata's next volley is four ----
const bCells = await shipCells('B');
const volley2 = [bCells[15], bCells[16], ...(await misses('B', 3))];
for (const c of volley2) await tapCell('#enemy-grid', c);
await click('#fire-btn'); await sleep(900);
v = await bv();
ok(v.shooter === 'B' && v.salvo.size === 4, `Cata lost a ship: her volley is four (${v.salvo.size})`);
await b.shot('04-sunk-result');
await handoffBtn();
await b.shot('05-salvo-four');

// ---- Against the phone: the bot fires its whole volley ----
await b.go(`${SITE}/battleship/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/battleship/`); await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(500);
await click('#setup-form [data-key="salvo"] .switch'); await b.evaluate(`document.querySelector('#setup-form input').value='Javi'; 1`);
await click('#setup-actions .btn'); await sleep(400); await clickText('#place-actions .btn', 'azar'); await click('#place-sail .btn');
let guard = 0;
do { await sleep(500); v = await bv(); } while (guard++ < 20 && (!v || v.phase !== 'play' || v.shooter === 'B' || v.pending));
const botShots = await b.evaluate(`__bn.match().shots.filter(s=>s.from==='B').length`);
ok(botShots === 5 && v.shooter === 'A', `the phone fired a volley of five (${botShots}) and passed the turn`);
await b.shot('06-cpu-salvo');
// play it out: the human sinks everything, a volley at a time
const cpuCells = await shipCells('B'); let next = 0; guard = 0;
while (guard++ < 60) {
  v = await bv(); if (v.phase !== 'play') break;
  if (v.shooter !== 'A' || v.pending) { await sleep(600); continue; }
  const pick = cpuCells.slice(next, next + v.salvo.left); next += pick.length;
  if (pick.length < v.salvo.left) pick.push(...(await misses('B', v.salvo.left - pick.length, await b.evaluate(`JSON.stringify(__bn.match().shots.filter(s=>s.from==='A').map(s=>s.cell))`).then(JSON.parse))));
  for (const c of pick) await tapCell('#enemy-grid', c);
  await click('#fire-btn'); await sleep(700);
}
await sleep(6000);
v = await bv();
ok(v.winner === 'A', `the game ends with the human's win (${v.winner})`);
await b.shot('07-cpu-result');
await b.close?.();
if (fails) { console.log(`✗ ${fails} check(s) failed`); process.exit(1); }
console.log('✓ salvo: all checks passed');

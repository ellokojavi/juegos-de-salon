// Saving and resuming a game in progress (canon C-6), in Toque y Fama, Batalla Naval and Cuarto Rey.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
// With several sessions at once, each serves its worktree on its own port (D-135)
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 9371, dir: `${OUT}/p`, out: OUT });
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (sel, re) => b.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const resumeVisible = () => b.evaluate(`!!document.querySelector('#resume-slot .btn')`);
const key = g => b.evaluate(`(()=>{const raw=localStorage.getItem('juegos-de-salon:${g}:session');if(!raw)return null;const d=JSON.parse(raw);return JSON.stringify({mode:d.mode,msgs:(d.messages||[]).length,priv:Object.keys(d.private||{}),done:d.done,hasState:!!d.state})})()`);

// ---------- TOQUE Y FAMA, one phone ----------
await b.go(`${SITE}/bulls-and-cows/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/bulls-and-cows/`);
await click('.mode'); await sleep(300);
await b.evaluate(`(()=>{const i=document.querySelectorAll('#setup-form input');i[0].value='Javi';i[1].value='Cata';return 1})()`);
await click('#setup-actions .btn'); await sleep(400);
await b.cover(); await b.typeNum('1234'); await sleep(400); await b.cover(); await b.typeNum('5678'); await sleep(800); await b.handoff();
await b.typeNum('1243'); await sleep(800); await b.handoff();
console.log('TYF local saved:', await key('toque-y-fama'));
await b.go(`${SITE}/bulls-and-cows/`, 1500);
console.log('TYF after reload → continue button:', await resumeVisible());
await click('#resume-slot .btn'); await sleep(800);
console.log('TYF resumed → screen:', await b.active(), '| guesses:', await b.evaluate(`__tyf.match().guesses.length`), '| secrets:', await b.evaluate(`Object.keys(__tyf.session().secrets).join(',')`), '| handoff:', await b.evaluate(`!document.getElementById('handoff').hidden`));
await b.handoff(); await b.shot('tyf-resumed');
console.log('TYF still playable → keypad:', await b.evaluate(`!!document.querySelector('.screen.active .keypad')`));
// finish and check it no longer offers to continue
await b.typeNum('5678'); await sleep(900); await b.handoff(); await b.typeNum('1234'); await sleep(900); await b.handoff(); await sleep(600);
console.log('TYF end → screen:', await b.active(), '| saved:', await key('toque-y-fama'));
await b.go(`${SITE}/bulls-and-cows/`, 1500);
console.log('TYF after finishing → continue button:', await resumeVisible());

// ---------- BATALLA NAVAL, against the phone ----------
await b.go(`${SITE}/battleship/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/battleship/`);
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(300);
await b.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await click('#setup-actions .btn'); await sleep(400);
await clickText('#place-actions .btn', 'azar'); await sleep(200);
console.log('BN draft saved:', await key('batalla-naval'));
await b.go(`${SITE}/battleship/`, 1500);
console.log('BN after reload during placement → continue:', await resumeVisible());
await click('#resume-slot .btn'); await sleep(900);
console.log('BN resumed in placement → screen:', await b.active(), '| ships:', await b.evaluate(`document.getElementById('place-count').textContent`));
await click('#place-sail .btn'); await sleep(3000);
const cell = c => b.evaluate(`(()=>{const r=parseInt('${c}'.slice(1))-1,col='ABCDEFGHIJ'.indexOf('${c}'[0]);const x=document.querySelector('#enemy-grid .cell[data-r="'+r+'"][data-c="'+col+'"]');if(!x)return 'no';x.click();return 'ok'})()`);
await cell('A1'); await click('#fire-btn'); await sleep(2500);
console.log('BN in battle saved:', await key('batalla-naval'), '| shots:', await b.evaluate(`__bn.match().shots.length`));
await b.go(`${SITE}/battleship/`, 1500);
await click('#resume-slot .btn'); await sleep(1200);
console.log('BN resumed in battle → screen:', await b.active(), '| shots:', await b.evaluate(`__bn.match().shots.length`), '| own fleet:', await b.evaluate(`!!__bn.session().layouts.A`), '| shooter:', await b.evaluate(`__bn.view().shooter`));
await b.shot('bn-resumed');

// ---------- CUARTO REY (new format) ----------
await b.go(`${SITE}/labs/fourth-king/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/labs/fourth-king/`);
await click('#btn-go-setup'); await sleep(300);
await b.evaluate(`(()=>{const names=['Javi','Cata','Pancho','Fran'];[...document.querySelectorAll('#players-form input')].forEach((inp,i)=>{inp.value=names[i];inp.dispatchEvent(new Event('input',{bubbles:true}));});return 1})()`);
await click('#btn-start'); await sleep(500); await click('#card'); await sleep(1400);
console.log('CR saved:', await key('cuarto-rey'));
await b.go(`${SITE}/labs/fourth-king/`, 1500);
console.log('CR after reload → continue:', await resumeVisible());
await click('#resume-slot .btn'); await sleep(700);
console.log('CR resumed → screen:', await b.active(), '| cards left:', await b.evaluate(`document.getElementById('deck-count').textContent`),
  '| saved history:', await b.evaluate(`JSON.parse(localStorage.getItem('juegos-de-salon:cuarto-rey:session')).state.history.map(h=>h.rank+h.suit).join(' ')`)); // CR-18
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

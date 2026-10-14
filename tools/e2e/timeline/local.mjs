import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 9391, dir: `${OUT}/p`, out: OUT });
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (sel, re) => b.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}','i').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const v = () => b.evaluate(`(()=>{const s=window.__ldt.view();return JSON.stringify({current:s.current,line:s.line.length,hands:Object.fromEntries(Object.entries(s.hands).map(([k,h])=>[k,h.length])),pool:s.poolLeft,done:s.done,winner:s.winner})})()`).then(JSON.parse);
const handoff = async () => { await b.evaluate(`document.querySelector('#handoff .btn')?.click() ?? document.getElementById('handoff').click(); 1`); await sleep(500); };
// plays the current turn, getting it right or wrong on purpose
const playTurn = async (correct = true) => {
  const info = await b.evaluate(`(()=>{const s=window.__ldt.view();const me=s.current;const card=s.hands[me][0];
    let at=0; const y=s.byId[card].year; while(at<s.line.length && s.byId[s.line[at]].year<y) at++;
    const wrong = at===0 ? s.line.length : 0;
    return JSON.stringify({card,right:at,wrong,me})})()`).then(JSON.parse);
  const target = correct ? info.right : info.wrong;
  const r = await b.evaluate(`(()=>{const cards=[...document.querySelectorAll('#hand .card')];if(!cards.length)return 'no-hand';cards[0].click();return 'ok'})()`);
  if (r !== 'ok') return r;
  await sleep(120);
  const s2 = await b.evaluate(`(()=>{const slots=[...document.querySelectorAll('#line .slot')];if(!slots[${target}])return 'no-slot';slots[${target}].click();return 'ok'})()`);
  if (s2 !== 'ok') return s2;
  await sleep(120);
  await click('#place-row .btn');
  await sleep(700);
  return 'ok';
};

await b.go(`${SITE}/timeline/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/timeline/`);
console.log('modes:', await b.evaluate(`[...document.querySelectorAll('.mode')].map(m=>m.disabled?'off':'on').join(',')`));
await b.shot('01-intro');
// ---------- ONE PHONE, 3 players, music ----------
await click('.mode'); await sleep(300);
await clickText('.theme-card', 'Música'); await sleep(100);
await clickText('#setup-form .btn', 'Agregar'); await sleep(100);
await b.evaluate(`(()=>{const n=['Javi','Cata','Nico'];[...document.querySelectorAll('#setup-form .player-row input')].forEach((i,k)=>{i.value=n[k];i.dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('#setup-form .seg button')].find(e=>/Mano propia|Own hand/.test(e.textContent));if(x)x.click();return 1})()`); await sleep(150);
await clickText('#setup-form .seg button', 'Corta'); await sleep(100);
await b.shot('02-setup');
await click('#setup-actions .btn'); await sleep(700);
console.log('start:', JSON.stringify(await v()), '| handoff:', await b.evaluate(`!document.getElementById('handoff').hidden`));
await handoff(); await sleep(300); await b.shot('03-play');
console.log('turn 1 (hit):', await playTurn(true)); await b.shot('04-verdict');
console.log('after a hit:', JSON.stringify(await v()));
await handoff(); await sleep(300);
console.log('turn 2 (miss):', await playTurn(false)); await sleep(200); await b.shot('05-verdict-error');
console.log('after a miss:', JSON.stringify(await v()));
await handoff(); await sleep(300);
// persistence mid-game
console.log('saved:', await b.evaluate(`(()=>{const d=JSON.parse(localStorage.getItem('juegos-de-salon:linea-de-tiempo:session'));return JSON.stringify({mode:d.mode,msgs:d.messages.length,theme:d.config.theme,players:d.config.players,done:d.done})})()`));
await b.go(`${SITE}/timeline/`, 1200);
console.log('after reloading → continue:', await b.evaluate(`!!document.querySelector('#resume-slot .btn')`));
await click('#resume-slot .btn'); await sleep(900);
console.log('resumed:', JSON.stringify(await v()), '| screen:', await b.active());
await handoff(); await sleep(300);
// finish the game, always getting it right
let guard = 0;
while (guard++ < 60) {
  const s = await v(); if (s.done) break;
  const r = await playTurn(true);
  if (r !== 'ok') { console.log('stopped:', r, JSON.stringify(s)); break; }
  await handoff(); await sleep(150);
}
const end = await v();
console.log('local end:', JSON.stringify(end), '| screen:', await b.active());
await sleep(800); await b.shot('06-result');
console.log('result:', await b.evaluate(`document.getElementById('result-title').textContent+' | '+document.getElementById('result-sub').textContent+' | '+document.getElementById('result-ranking').innerText.replace(/\\n/g,' · ')`));
// Playing solo has its own script (timeline/solo.mjs): it's ⏳ Línea Relámpago (D-142)
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

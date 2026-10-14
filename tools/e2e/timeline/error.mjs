import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 9441, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const play = async (correct) => {
  const info = await b.evaluate(`(()=>{const s=window.__ldt.view();const card=s.hands.A[0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at, wrong: at===0? s.line.length : 0})})()`).then(JSON.parse);
  await b.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(100);
  await b.evaluate(`document.querySelectorAll('#line .slot')[${correct ? info.at : info.wrong}].click(); 1`); await sleep(100);
  await click('#place-row .btn'); await sleep(700);
};
const overlay = () => b.evaluate(`(()=>{const h=document.getElementById('handoff');return JSON.stringify({visible:!h.hidden,bad:h.classList.contains('bad'),text:h.innerText.replace(/\\n+/g,' | ').slice(0,260)})})()`).then(JSON.parse);
await b.go(`${SITE}/timeline/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/timeline/`);
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(300);
await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await click('#setup-actions .btn'); await sleep(900);
// correct: closes by itself
await play(true); console.log('correct →', JSON.stringify(await overlay()));
await sleep(1600); console.log('at 1.6 s the bot has not played yet (waits for the verdict):', await b.evaluate(`window.__ldt.view().history.length`));
await sleep(1200); console.log('correct at 2.8 s (closed by itself) →', JSON.stringify({visible:(await overlay()).visible}));
await sleep(1800); const bot = await overlay(); console.log('bot verdict →', JSON.stringify({visible: bot.visible, text: bot.text.slice(0, 60)}));
await sleep(2800); console.log('bot verdict closed by itself →', JSON.stringify({visible:(await overlay()).visible}));
// wrong: stays until tapped
for (let i = 0; i < 10 && !(await b.evaluate(`!!document.querySelector('#place-row .btn')`)); i++) await sleep(600);
await play(false); const w = await overlay(); console.log('wrong →', JSON.stringify(w)); await b.shot('error');
await sleep(5000); console.log('wrong 5 s later (still there, and the bot did not play) →', JSON.stringify({visible:(await overlay()).visible, bad:(await overlay()).bad, moves: await b.evaluate(`window.__ldt.view().history.length`)}));
await b.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(400);
console.log('after tapping →', JSON.stringify({visible:(await overlay()).visible, screen: await b.active()}));
await sleep(2200); console.log('now the bot plays →', JSON.stringify({visible:(await overlay()).visible, moves: await b.evaluate(`window.__ldt.view().history.length`)}));
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

// The verdict speaks in the third person when another player got it wrong (D-36)
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const BASE = process.argv[3];
const hosts = BASE ? [BASE, BASE] : ['localhost', '127.0.0.1', '[::1]'].map(h => SITE.replace('localhost', h)).slice(0, 2);
const A = await launch({ port: 9468, dir: `${OUT}/vA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9469, dir: `${OUT}/vB`, out: OUT, width: 375, height: 812 });
const overlay = d => d.evaluate(`(()=>{const h=document.getElementById('handoff');return JSON.stringify({
  visible: !h.hidden, red: h.classList.contains('bad'),
  title: h.querySelector('.verdict .big')?.textContent || '',
  note: h.querySelector('.verdict .note')?.textContent || '',
  why: h.querySelector('.verdict .why')?.innerText.replace(/\\n+/g, ' ') || '',
})})()`).then(JSON.parse);
const play = async (d, { right }) => {
  const info = await d.evaluate(`(()=>{const s=window.__ldt.view();const card=s.hands[s.current][0];let at=0;const y=s.byId[card].year;while(at<s.line.length&&s.byId[s.line[at]].year<y)at++;return JSON.stringify({at, wrong: at===0 ? s.line.length : 0})})()`).then(JSON.parse);
  await d.evaluate(`document.querySelectorAll('#hand .card')[0].click(); 1`); await sleep(120);
  await d.evaluate(`document.querySelectorAll('#line .slot')[${right ? info.at : info.wrong}].click(); 1`); await sleep(120);
  await d.evaluate(`(()=>{const x=document.querySelector('#place-row .btn');if(x&&!x.disabled)x.click();})(); 1`);
};

for (const [i, d] of [A, B].entries()) { await d.go(hosts[i] + '/timeline/', 1500); await d.evaluate(`localStorage.clear(); 1`); }
await A.go(hosts[0] + '/timeline/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
await A.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await A.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Crear|Create/.test(x.textContent)).click(); 1`); await sleep(5000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
await B.go(`${hosts[1]}/timeline/?room=${code}`, 2000);
await B.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Cata';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await B.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Unirse|Join/.test(x.textContent)).click(); 1`); await sleep(5000);
await A.evaluate(`[...document.querySelectorAll('#lobby-box .btn')].find(x=>/Empezar|Start/.test(x.textContent))?.click(); 1`); await sleep(4000);

const turn = await A.evaluate(`window.__ldt.view().current`);
const player = turn === 'A' ? A : B;
const watcher = turn === 'A' ? B : A;
const name = turn === 'A' ? 'Javi' : 'Cata';
console.log('room', code, '| starts', name);

// Gets it wrong on purpose
await play(player, { right: false }); await sleep(2500);
console.log('the one who got it wrong sees →', JSON.stringify(await overlay(player)));
console.log('the other one sees            →', JSON.stringify(await overlay(watcher)));
await player.shot('verdict-own'); await watcher.shot('verdict-other');
await player.evaluate(`document.getElementById('handoff').click(); 1`);
await watcher.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(800);

// And now a hit by the other one
const turn2 = await A.evaluate(`window.__ldt.view().current`);
const player2 = turn2 === 'A' ? A : B;
const watcher2 = turn2 === 'A' ? B : A;
await play(player2, { right: true }); await sleep(2500);
console.log('the one who got it right sees →', JSON.stringify(await overlay(player2)));
console.log('the other one sees            →', JSON.stringify(await overlay(watcher2)));
await watcher2.shot('verdict-other-hit');
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs));
console.log('errors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
A.close(); B.close();

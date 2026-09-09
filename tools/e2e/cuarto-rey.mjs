// Captura pantallas del juego con Chrome headless vía CDP (sin dependencias).
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.argv[2];
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9341', '--window-size=390,900', '--no-first-run', '--hide-scrollbars', `--user-data-dir=${OUT}/profile`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 30; i++) { try { targets = await (await fetch('http://localhost:9341/json')).json(); break; } catch { await sleep(500); } }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, 'base64')); console.log('shot', name); };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
const go = async url => { await send('Page.navigate', { url }); await sleep(1800); };


const errors = [];
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description||'')); });
await go('http://localhost:8765/'); await evaluate(`localStorage.clear(); 1`); await go('http://localhost:8765/');
console.log('menu sound btn:', await evaluate(`document.querySelector('.sound-toggle')?.textContent`));
await evaluate(`document.querySelector('.sound-toggle').click(); 1`);
console.log('after toggle:', await evaluate(`document.querySelector('.sound-toggle').textContent + ' muted=' + localStorage.getItem('juegos-de-salon:muted')`));
await evaluate(`document.querySelector('.sound-toggle').click(); 1`);
await shot('01-menu-sound');
await go('http://localhost:8765/cuarto-rey/');
console.log('game sound btn:', await evaluate(`document.querySelector('.sound-toggle')?.textContent`), 'audio ctx ok:', await evaluate(`typeof AudioContext`));
await shot('02-intro-sound');
await evaluate(`document.getElementById('btn-go-setup').click(); 1`); await sleep(300);
await evaluate(`(()=>{const names=['Javi','Cata','Pancho','Fran'];[...document.querySelectorAll('#players-form input')].forEach((inp,i)=>{inp.value=names[i];inp.dispatchEvent(new Event('input',{bubbles:true}));});return 1})()`);
await evaluate(`document.getElementById('btn-start').click(); 1`); await sleep(400);
for (let i = 0; i < 60; i++) {
  const active = await evaluate(`document.querySelector('.screen.active').id`);
  if (active !== 'screen-play') break;
  await evaluate(`document.getElementById('card').click(); 1`); await sleep(1300);
  const kind = await evaluate(`JSON.parse(localStorage.getItem('juegos-de-salon:cuarto-rey:session')).state.current?.card?.rank`);
  if (kind === '4') { await evaluate(`[...document.querySelectorAll('#result .helper button')][0].click(); 1`); await sleep(1500); }
  if (kind === '5' || kind === '7') { await evaluate(`[...document.querySelectorAll('#result button')].find(b=>/Otra/.test(b.textContent)).click(); 1`); }
  const ok = await evaluate(`(()=>{const res=document.getElementById('result');const btns=[...res.querySelectorAll('button')];let b=btns.find(x=>/siguiente|Cumplida|Nadie perdió|Ver el resultado/i.test(x.textContent));if(!b&&'${kind}'==='8'){const pk=res.querySelectorAll('.picker button');pk[0].click();pk[1].click();b=btns.find(x=>/Regalados/.test(x.textContent));}if(!b)return 'NO BUTTON';b.click();return 'ok'})()`);
  if (ok !== 'ok') { console.log('FAIL at', kind, ok); break; }
  await sleep(200);
  const hidden = await evaluate(`document.getElementById('handoff').hidden`);
  if (hidden === false) { await evaluate(`document.getElementById('handoff').click(); 1`); await sleep(100); await evaluate(`document.querySelector('#handoff .btn')?.click(); 1`); await sleep(350); }
}
console.log('final screen:', await evaluate(`document.querySelector('.screen.active').id`), 'errors:', JSON.stringify(errors));
ws.close(); chrome.kill();

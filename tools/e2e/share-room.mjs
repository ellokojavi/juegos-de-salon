// The share button in the room: the native dialog if navigator.share exists, copy if not.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
// With several sessions at once, each serves its worktree on its own port (D-135)
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 9480, dir: `${OUT}/p`, out: OUT });
const btnText = () => b.evaluate(`document.querySelector('#lobby-box .btn--cyan')?.textContent`);
await b.go(`${SITE}/timeline/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/timeline/`);
await b.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(300);
await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Crear/.test(x.textContent)).click(); 1`); await sleep(4500);
const code = await b.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('room:', code, '| without navigator.share, the button says:', await btnText());
// Simulate a phone with a native dialog
await b.evaluate(`navigator.share = async d => { window.__shared = d; }; 1`);
await b.go(`${SITE}/timeline/?room=${code}`, 4500);
await b.evaluate(`navigator.share = async d => { window.__shared = d; }; 1`);
// force a re-render of the room (presence) without touching the state
await b.evaluate(`window.__ldt.session().transport.onPresence(p => {}); 1`); await sleep(300);
await b.evaluate(`document.querySelector('#lobby-box .btn--cyan').click(); 1`); await sleep(400);
const shared = await b.evaluate(`JSON.stringify(window.__shared)`);
console.log('with navigator.share, the button says:', await btnText(), '| shared:', shared);
// The invitation says who invites, to which game and with which code (D-173)
console.log('the text names who invites:', /Javi/.test(shared),
  '| the game:', /Línea de Tiempo/.test(shared),
  '| the domain:', /juegosdesalon\.cl/.test(shared),
  '| and the code:', new RegExp(code).test(shared));
console.log('message:', JSON.parse(shared).text);
await b.shot('lobby-share');
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

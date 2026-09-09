import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9371, dir: `${OUT}/p`, out: OUT });
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (sel, re) => b.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const resumeVisible = () => b.evaluate(`!!document.querySelector('#resume-slot .btn')`);
const key = g => b.evaluate(`(()=>{const raw=localStorage.getItem('juegos-de-salon:${g}:session');if(!raw)return null;const d=JSON.parse(raw);return JSON.stringify({mode:d.mode,msgs:(d.messages||[]).length,priv:Object.keys(d.private||{}),done:d.done,hasState:!!d.state})})()`);

// ---------- TOQUE Y FAMA, un celular ----------
await b.go('http://localhost:8765/toque-y-fama/'); await b.evaluate(`localStorage.clear(); 1`); await b.go('http://localhost:8765/toque-y-fama/');
await click('.mode'); await sleep(300);
await b.evaluate(`(()=>{const i=document.querySelectorAll('#setup-form input');i[0].value='Javi';i[1].value='Cata';return 1})()`);
await click('#setup-actions .btn'); await sleep(400);
await b.cover(); await b.typeNum('1234'); await sleep(400); await b.cover(); await b.typeNum('5678'); await sleep(800); await b.handoff();
await b.typeNum('1243'); await sleep(800); await b.handoff();
console.log('TYF local guardado:', await key('toque-y-fama'));
await b.go('http://localhost:8765/toque-y-fama/', 1500);
console.log('TYF tras recargar → botón continuar:', await resumeVisible());
await click('#resume-slot .btn'); await sleep(800);
console.log('TYF retomado → pantalla:', await b.active(), '| intentos:', await b.evaluate(`__tyf.match().guesses.length`), '| secretos:', await b.evaluate(`Object.keys(__tyf.session().secrets).join(',')`), '| handoff:', await b.evaluate(`!document.getElementById('handoff').hidden`));
await b.handoff(); await b.shot('tyf-resumed');
console.log('TYF sigue jugable → teclado:', await b.evaluate(`!!document.querySelector('.screen.active .keypad')`));
// terminar y comprobar que ya no ofrece continuar
await b.typeNum('5678'); await sleep(900); await b.handoff(); await b.typeNum('1234'); await sleep(900); await b.handoff(); await sleep(600);
console.log('TYF fin → pantalla:', await b.active(), '| guardado:', await key('toque-y-fama'));
await b.go('http://localhost:8765/toque-y-fama/', 1500);
console.log('TYF tras terminar → botón continuar:', await resumeVisible());

// ---------- BATALLA NAVAL, contra el celular ----------
await b.go('http://localhost:8765/batalla-naval/'); await b.evaluate(`localStorage.clear(); 1`); await b.go('http://localhost:8765/batalla-naval/');
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(300);
await b.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await click('#setup-actions .btn'); await sleep(400);
await clickText('#place-actions .btn', 'azar'); await sleep(200);
console.log('BN borrador guardado:', await key('batalla-naval'));
await b.go('http://localhost:8765/batalla-naval/', 1500);
console.log('BN tras recargar en colocación → continuar:', await resumeVisible());
await click('#resume-slot .btn'); await sleep(900);
console.log('BN retomado en colocación → pantalla:', await b.active(), '| barcos:', await b.evaluate(`document.getElementById('place-count').textContent`));
await click('#place-sail .btn'); await sleep(3000);
const cell = c => b.evaluate(`(()=>{const r=parseInt('${c}'.slice(1))-1,col='ABCDEFGHIJ'.indexOf('${c}'[0]);const x=document.querySelector('#enemy-grid .cell[data-r="'+r+'"][data-c="'+col+'"]');if(!x)return 'no';x.click();return 'ok'})()`);
await cell('A1'); await click('#fire-btn'); await sleep(2500);
console.log('BN en batalla guardado:', await key('batalla-naval'), '| disparos:', await b.evaluate(`__bn.match().shots.length`));
await b.go('http://localhost:8765/batalla-naval/', 1500);
await click('#resume-slot .btn'); await sleep(1200);
console.log('BN retomado en batalla → pantalla:', await b.active(), '| disparos:', await b.evaluate(`__bn.match().shots.length`), '| flota propia:', await b.evaluate(`!!__bn.session().layouts.A`), '| tirador:', await b.evaluate(`__bn.view().shooter`));
await b.shot('bn-resumed');

// ---------- CUARTO REY (formato nuevo) ----------
await b.go('http://localhost:8765/cuarto-rey/'); await b.evaluate(`localStorage.clear(); 1`); await b.go('http://localhost:8765/cuarto-rey/');
await click('#btn-go-setup'); await sleep(300);
await b.evaluate(`(()=>{const names=['Javi','Cata','Pancho','Fran'];[...document.querySelectorAll('#players-form input')].forEach((inp,i)=>{inp.value=names[i];inp.dispatchEvent(new Event('input',{bubbles:true}));});return 1})()`);
await click('#btn-start'); await sleep(500); await click('#card'); await sleep(1400);
console.log('CR guardado:', await key('cuarto-rey'));
await b.go('http://localhost:8765/cuarto-rey/', 1500);
console.log('CR tras recargar → continuar:', await resumeVisible());
await click('#resume-slot .btn'); await sleep(700);
console.log('CR retomado → pantalla:', await b.active(), '| cartas restantes:', await b.evaluate(`document.getElementById('deck-count').textContent`));
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

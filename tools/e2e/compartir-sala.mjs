// Botón de compartir en la sala: diálogo nativo si existe navigator.share, copiar si no.
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9480, dir: `${OUT}/p`, out: OUT });
const btnText = () => b.evaluate(`document.querySelector('#lobby-box .btn--cyan')?.textContent`);
await b.go('http://localhost:8765/linea-de-tiempo/'); await b.evaluate(`localStorage.clear(); 1`); await b.go('http://localhost:8765/linea-de-tiempo/');
await b.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(300);
await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Crear/.test(x.textContent)).click(); 1`); await sleep(4500);
const code = await b.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('sala:', code, '| sin navigator.share, el botón dice:', await btnText());
// Simular un celular con diálogo nativo
await b.evaluate(`navigator.share = async d => { window.__shared = d; }; 1`);
await b.go(`http://localhost:8765/linea-de-tiempo/?sala=${code}`, 4500);
await b.evaluate(`navigator.share = async d => { window.__shared = d; }; 1`);
// forzar re-render de la sala (presencia) sin tocar el estado
await b.evaluate(`window.__ldt.session().transport.onPresence(p => {}); 1`); await sleep(300);
await b.evaluate(`document.querySelector('#lobby-box .btn--cyan').click(); 1`); await sleep(400);
console.log('con navigator.share, el botón dice:', await btnText(), '| se compartió:', await b.evaluate(`JSON.stringify(window.__shared)`));
await b.shot('lobby-share');
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

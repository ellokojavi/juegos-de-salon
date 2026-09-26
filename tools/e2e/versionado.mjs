import { launch, sleep } from './cdp.mjs';
const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2];
const b = await launch({ port: Number(process.env.PUERTO_CDP) || 9354, dir: `${OUT}/p`, out: OUT });
const urls = async () => b.evaluate(`performance.getEntriesByType('resource').map(r=>r.name.replace(location.origin,'')).filter(u=>/\\.(js|css)/.test(u))`);
await b.go(`${SITIO}/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITIO}/`);
console.log('menú → tarjetas:', await b.evaluate(`document.querySelectorAll('.game-card').length`), '| recursos:', JSON.stringify(await urls()));
await b.shot('menu');
await b.go(`${SITIO}/cuarto-rey/`);
console.log('cuarto-rey → reglas listadas:', await b.evaluate(`document.querySelectorAll('#rules-list li').length`), '| recursos:', JSON.stringify(await urls()));
await b.go(`${SITIO}/toque-y-fama/`);
console.log('toque-y-fama → modos:', await b.evaluate(`document.querySelectorAll('.mode').length`), '| recursos:', JSON.stringify(await urls()));
// modo online carga firebase.js por import() dinámico: debe salir versionado
await b.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(300);
await b.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await b.evaluate(`document.querySelectorAll('#setup-actions .btn')[0].click(); 1`); await sleep(5000);
console.log('online → sala:', await b.evaluate(`document.querySelector('.code-big')?.textContent`), '| firebase.js:', JSON.stringify((await urls()).filter(u=>u.includes('transport'))));
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

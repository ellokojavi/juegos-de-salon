// That every module loads with the import map's `?v=` (run it against a stamped copy, served and
// passed in SITE). It also takes the README's home page screenshots (docs/capturas.json).
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: Number(process.env.CDP_PORT || process.env.PUERTO_CDP) || 9354, dir: `${OUT}/p`, out: OUT });
const urls = async () => b.evaluate(`performance.getEntriesByType('resource').map(r=>r.name.replace(location.origin,'')).filter(u=>/\\.(js|css)/.test(u))`);
await b.go(`${SITE}/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/`);
// The promo splash (D-351), if a campaign is on, is closed as a player would: the screenshots show the home page
await b.evaluate(`document.querySelector('.splash-luego, .splash-cerrar')?.click(); 1`); await sleep(600);
console.log('menu → cards:', await b.evaluate(`document.querySelectorAll('.game-card').length`), '| resources:', JSON.stringify(await urls()));
await b.shot('menu');
// The share sheet (D-253), for the README (docs/capturas.json)
await b.evaluate(`document.querySelector('#share-slot button').click(); 1`); await sleep(700);
await b.shot('share');
await b.evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); 1`);
await b.go(`${SITE}/labs/fourth-king/`);
console.log('cuarto-rey → rules listed:', await b.evaluate(`document.querySelectorAll('#rules-list li').length`), '| resources:', JSON.stringify(await urls()));
await b.go(`${SITE}/bulls-and-cows/`);
console.log('toque-y-fama → modes:', await b.evaluate(`document.querySelectorAll('.mode').length`), '| resources:', JSON.stringify(await urls()));
// the online mode loads firebase.js through a dynamic import(): it must come out versioned
await b.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(300);
await b.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await b.evaluate(`document.querySelectorAll('#setup-actions .btn')[0].click(); 1`); await sleep(5000);
console.log('online → room:', await b.evaluate(`document.querySelector('.code-big')?.textContent`), '| firebase.js:', JSON.stringify((await urls()).filter(u=>u.includes('transport'))));
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();

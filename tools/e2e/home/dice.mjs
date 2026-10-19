// The home page's 🎲 Juego al azar (D-188, D-374) end to end: with the 🎲 Cartas/Dados filter on, the dice
// still picks among every game, and never La Copa nor a game that needs a group (Cuarto Rey). Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/home-dice');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 320, height: 640 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };

const landed = [];
for (let i = 0; i < 12; i++) {
  await b.go(`${SITE}/?test`, 1200);
  // The page fully loaded first: on a slow runner a tap during the load got lost with it
  await waitFor(`document.readyState === 'complete' && location.pathname === '/' && !!document.querySelector('.btn-azar') && !!document.querySelector('[data-tipo="tabletop"]')`, 15000);
  // The filter on, then the dice; a tap anywhere while it rolls opens the game at once
  await ev(`document.querySelector('[data-tipo="tabletop"]').click(); 1`);
  await ev(`document.querySelector('.btn-azar').click(); 1`);
  // On a slow runner the dice takes a while to appear and the game to load: tap once the dice is up,
  // then give the game its time (6 s was short on GitHub)
  if (await waitFor(`!!document.querySelector('.azar-capa:not(.velo)')`, 4000)) await ev(`document.querySelector('.azar-capa:not(.velo)')?.click(); 1`);
  await waitFor(`location.pathname !== '/'`, 15000);
  landed.push(await ev(`location.pathname`));
  // The game takes the dice's scene from sessionStorage when it loads (llegada.js); leaving before that
  // would hand it to the next home page, whose veil holds the dice for up to 4 s
  await waitFor(`document.readyState === 'complete' && !sessionStorage.getItem('azar-llega')`, 15000);
}
console.log(`  landed on: ${landed.join(' ')}`);
ok(landed.every(p => p !== '/'), 'every roll opened a game');
ok(landed.some(p => !/\/(liars-dice|generala|julep|fourth-king)\//.test(p)), 'with Cartas/Dados on, the dice still lands on games of other kinds');
ok(!landed.some(p => /\/(fourth-king|cup)\//.test(p)), 'never Cuarto Rey nor La Copa');
b.close();
if (failures) process.exit(1);

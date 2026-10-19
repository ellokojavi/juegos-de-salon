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
  await waitFor(`!!document.querySelector('.btn-azar') && !!document.querySelector('[data-tipo="tabletop"]')`);
  // The filter on, then the dice; a tap anywhere while it rolls opens the game at once
  await ev(`document.querySelector('[data-tipo="tabletop"]').click(); 1`);
  await ev(`document.querySelector('.btn-azar').click(); 1`);
  await sleep(300);
  await ev(`document.querySelector('.azar-capa')?.click(); 1`);
  await waitFor(`location.pathname !== '/'`, 6000);
  landed.push(await ev(`location.pathname`));
}
console.log(`  landed on: ${landed.join(' ')}`);
ok(landed.every(p => p !== '/'), 'every roll opened a game');
ok(landed.some(p => !/\/(liars-dice|generala|julep|fourth-king)\//.test(p)), 'with Cartas/Dados on, the dice still lands on games of other kinds');
ok(!landed.some(p => /\/(fourth-king|cup)\//.test(p)), 'never Cuarto Rey nor La Copa');
b.close();
if (failures) process.exit(1);

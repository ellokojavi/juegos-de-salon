// Julepe in La Bodega (D-434) end to end: the home page no longer offers it (not even as a dimmed
// card), the lab keeps it among La Bodega's kept games folded to its title, one tap opens it with its
// Jugar button, and both old routes (/julep/ and /julepe/) lead to /labs/julep/, keeping a room
// code, where the game still loads behind the lab's door. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/julep-lab');
const b = await launch({ port: 9395, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

// The home page does not offer it
await b.go(`${SITE}/?test`, 1500);
ok(await ev(`!document.querySelector('a[href*="julep"]') && ![...document.querySelectorAll('.game-card')].some(c => /Julepe/.test(c.textContent)) && !!document.querySelector('.game-card')`), 'the home page has no Julepe card, not even a dimmed one');

// The lab keeps it in La Bodega's kept games, folded
await b.go(`${SITE}/labs/`);
ok(await ev(`!!document.querySelector('#bodega-juegos #seccion-julepe') && !document.querySelector('#activos #seccion-julepe')`), 'Julepe is among La Bodega\'s kept games, not among the games being tried');
ok(await ev(`/^👋/.test(document.querySelector('#seccion-julepe .detalle p').textContent.trim())`), 'its text opens with 👋 Salió de la portada (D-422)');
ok(await ev(`!document.querySelector('#seccion-julepe details').open && !document.getElementById('btn-julepe').checkVisibility()`), 'it comes folded: only its title');
await ev(`document.querySelector('#seccion-julepe summary').click(); 1`); await sleep(100);
ok(await ev(`document.querySelector('#seccion-julepe details').open && document.getElementById('btn-julepe').checkVisibility()`), 'one tap on the title opens it and shows Jugar');
ok(await ev(`document.getElementById('btn-julepe').getAttribute('href')`) === 'julep/', 'Jugar opens /labs/julep/');

// The old routes lead there, an invitation's room code included
for (const old of ['/julep/', '/julepe/']) {
  await b.go(`${SITE}${old}?room=ABCD`, 1500);
  ok(await ev(`location.pathname + location.search`) === '/labs/julep/?room=ABCD', `${old}?room= leads to /labs/julep/?room= (${await ev('location.pathname + location.search')})`);
}

// And it still loads, behind the lab's door and not indexed
await b.go(`${SITE}/labs/julep/`, 1500);
ok(await ev(`document.querySelectorAll('.mode').length > 0 && !!window.__julepe`), 'the game loads at /labs/julep/');
ok(await ev(`document.querySelector('meta[name="robots"]')?.content`) === 'noindex, nofollow', 'the page is not indexed');
ok(await ev(`!!document.querySelector('script[src$="labs-puerta.js"]')`), 'the page is behind the lab\'s door');

console.log('errors:', JSON.stringify(b.errors));
ok(!b.errors.length, 'no errors on the page');
b.close();
if (failures) process.exit(1);

// Cuarto Rey in La Bodega (D-420) end to end, and La Bodega's two subgroups (D-422): the home page no longer offers it, the lab keeps it in
// La Bodega folded to its title, one tap opens it with its Jugar button, and both old routes
// (/fourth-king/ and /cuarto-rey/) lead to /labs/fourth-king/, where the game still plays.
// Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/fourth-king-lab');
const b = await launch({ port: 9393, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

// The home page does not offer it
await b.go(`${SITE}/?test`, 1500);
ok(await ev(`!document.querySelector('a[href*="fourth-king"]') && !!document.querySelector('.game-card')`), 'the home page has no Cuarto Rey card');

// The lab keeps it in La Bodega, folded
await b.go(`${SITE}/labs/`);
ok(await ev(`!!document.querySelector('#bodega #seccion-cuarto-rey') && !document.querySelector('#activos #seccion-cuarto-rey')`), 'Cuarto Rey is in La Bodega, not among the games being tried');
// La Bodega in two subgroups (D-422): the games kept, each tagged with why, and the improvements launched
ok(await ev(`['seccion-caso','seccion-clave','seccion-cuarto-rey'].every(id => document.querySelector('#bodega-juegos #' + id))`), 'La Bodega\'s games are under 🎲 Juegos guardados');
ok(await ev(`[...document.querySelectorAll('#bodega-juegos .detalle > p:first-child')].every(p => /^(💤|👋)/.test(p.textContent))`), 'each game kept says why it is there (💤 or 👋)');
ok(await ev(`[...document.querySelectorAll('#bodega-mejoras .seccion')].length >= 6 && [...document.querySelectorAll('#bodega-mejoras .seccion')].every(x => /🚀|💤/.test(x.textContent))`), 'the improvements sent to La Bodega (🚀 or 💤, D-511) are under ✨ Mejoras lanzadas');
ok(await ev(`[...document.querySelectorAll('#bodega .seccion')].every(x => x.closest('.subgrupo'))`), 'every card in La Bodega sits in a subgroup');
ok(await ev(`!document.querySelector('#seccion-cuarto-rey details').open && !document.getElementById('btn-cuarto-rey').checkVisibility()`), 'it comes folded: only its title');
await ev(`document.querySelector('#seccion-cuarto-rey summary').click(); 1`); await sleep(100);
ok(await ev(`document.querySelector('#seccion-cuarto-rey details').open && document.getElementById('btn-cuarto-rey').checkVisibility()`), 'one tap on the title opens it and shows Jugar');
ok(await ev(`document.getElementById('btn-cuarto-rey').getAttribute('href')`) === 'fourth-king/', 'Jugar opens /labs/fourth-king/');

// The old routes lead there
for (const old of ['/fourth-king/', '/cuarto-rey/']) {
  await b.go(`${SITE}${old}`, 1500);
  ok(await ev(`location.pathname`) === '/labs/fourth-king/', `${old} leads to /labs/fourth-king/ (${await ev('location.pathname')})`);
}

// And it still plays: the intro, behind the lab's door and not indexed
ok(await ev(`!!document.getElementById('btn-go-setup') && !!window.__cuartoRey`), 'the game loads at /labs/fourth-king/');
ok(await ev(`document.querySelector('meta[name="robots"]')?.content`) === 'noindex, nofollow', 'the page is not indexed');
ok(await ev(`!!document.querySelector('script[src$="labs-puerta.js"]')`), 'the page is behind the lab\'s door');

console.log('errors:', JSON.stringify(b.errors));
ok(!b.errors.length, 'no errors on the page');
b.close();
if (failures) process.exit(1);

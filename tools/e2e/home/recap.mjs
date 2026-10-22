// The recap of an ended cup over the home page (D-423) end to end, with La Copa's podium demo (`?recap=demo`): the window in the
// four languages at 320 px, its final table as the image the cup shares (D-427), the link to the cup, the ✕, the hidden frame that builds the
// table gone once it answered, nothing recorded by the demo, and its card in the lab. Then Uno al día's season (D-424,
// `?recap=season-demo`): the same window, week by week, with the player's place and the new season's line. Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { TEXTS, SEEN_KEY } from '../../../public/assets/js/recap.js';
const OUT = output('/tmp/home-recap');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 320, height: 640 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 10000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };

for (const lang of ['es', 'en', 'pt', 'de']) {
  await b.go(`${SITE}/?recap=demo&lang=${lang}`, 300);
  ok(await waitFor(`(i => !!i && i.complete && i.naturalWidth === 1080)(document.querySelector('.recap .recap-imagen'))`), `${lang}: the window opens with the demo cup's final table, as the cup shares it (D-427)`);
  await sleep(500);
  ok(await ev(`document.querySelector('.recap .splash-kicker').textContent`) === TEXTS[lang].cupKicker, `${lang}: it says the cup ended`);
  ok(await ev(`document.querySelector('.recap .recap-tabla').classList.contains('recap-oculto') && document.querySelectorAll('.recap-tabla tbody tr').length === 5 && (r => r.width > 250)(document.querySelector('.recap-imagen').getBoundingClientRect())`), `${lang}: the image in place of the rows, which stay for screen readers`);
  ok(await ev(`document.documentElement.scrollWidth <= innerWidth && document.querySelector('.recap').scrollWidth <= document.querySelector('.recap').clientWidth`), `${lang}: nothing wider than 320 px`);
  ok(await ev(`(r => r.top >= 0 && r.bottom <= innerHeight)(document.querySelector('.recap-ir').getBoundingClientRect())`), `${lang}: the button to the cup fits in the screen`);
  ok(await ev(`document.querySelectorAll('iframe').length === 0`), `${lang}: the hidden frame that built the table is gone`);
  await b.shot(`recap-${lang}`);
}

// The link opens the demo cup; the ✕ closes the window and the demo records nothing
ok(/\/cup\/\?test&demo=podium$/.test(await ev(`document.querySelector('.recap-ir').href`)), 'the button opens the demo cup');
await ev(`document.querySelector('.recap .splash-x').click(); 1`);
ok(await waitFor(`!document.querySelector('.splash-capa') && document.body.style.overflow === ''`, 2000), 'the ✕ closes it and the page scrolls again');
ok(await ev(`localStorage.getItem('${SEEN_KEY}') === null`), 'the demo is not recorded as seen');

// Uno al día's season (D-424): the made-up October, this phone 3rd of 8
for (const lang of ['es', 'en', 'pt', 'de']) {
  await b.go(`${SITE}/?recap=season-demo&lang=${lang}`, 300);
  ok(await waitFor(`!!document.querySelector('.recap .recap-tabla tbody tr')`), `${lang}: the season's window opens`);
  await sleep(500);
  ok(await ev(`document.querySelector('.recap .splash-kicker').textContent`) === TEXTS[lang].seasonKicker, `${lang}: it says the season ended`);
  ok(await ev(`document.querySelectorAll('.recap-tabla tbody tr').length === 8 && document.querySelector('.recap-tabla tr.mia .recap-lugar').textContent === '🥉'`), `${lang}: eight players, the player 3rd and marked`);
  ok(await ev(`document.querySelector('.recap-tabla th.recap-dias').textContent`) === TEXTS[lang].colWeeks, `${lang}: the line is week by week`);
  ok(await ev(`!!document.querySelector('.recap-nota') && document.querySelector('.recap-ir').href.endsWith('/today/')`), `${lang}: the new season's line, and the way to Uno al día`);
  ok(await ev(`document.documentElement.scrollWidth <= innerWidth && document.querySelector('.recap').scrollWidth <= document.querySelector('.recap').clientWidth`), `${lang}: nothing wider than 320 px`);
  await b.shot(`season-${lang}`);
}
await ev(`document.querySelector('.recap .splash-luego').click(); 1`);
ok(await waitFor(`!document.querySelector('.splash-capa')`, 2000) && await ev(`localStorage.getItem('juegos-de-salon:uno-al-dia:temporada-vista') === null`), 'Cerrar closes it, and the demo records nothing');

// With no cup due, the home page opens no frame (and the scripts never see a recap of their own)
await b.go(`${SITE}/?test`, 2500);
ok(await ev(`!document.querySelector('.recap') && document.querySelectorAll('iframe').length === 0`), 'no cup due: no window and no frame');

// Its card in the lab's improvements, with the demo's link (D-409)
await b.go(`${SITE}/labs/?test`);
ok(await ev(`document.querySelector('#mejoras #seccion-resumen-copa #btn-resumen-copa')?.getAttribute('href') === '../?recap=demo'`), 'the lab lists it among the improvements, with the demo');
ok(await ev(`document.querySelector('#mejoras #seccion-resumen-temporada #btn-resumen-temporada')?.getAttribute('href') === '../?recap=season-demo'`), "and Uno al día's season, with its demo");

console.log(failures ? `\n✗ ${failures} failure(s)` : '\n✓ recap: all green');
process.exit(failures ? 1 : 0);

// The home page's search box, a lab experiment (?search) end to end: it appears only with the
// parameter, narrows the list while typing, ignores accents, says when nothing matches and clears
// with "show all". Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/home-search');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 320, height: 640 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const type = async q => { await ev(`{ const i = document.getElementById('buscar'); i.value = ${JSON.stringify(q)}; i.dispatchEvent(new Event('input')); } 1`); await sleep(200); };
const visible = `window.__portada.visibles`;

await b.go(`${SITE}/?test`);
ok(await waitFor(`document.querySelectorAll('.game-card').length > 3`) && await ev(`!document.getElementById('buscar')`), 'players see no search box');

await b.go(`${SITE}/?test&search`);
ok(await waitFor(`!!document.getElementById('buscar')`), 'with ?search the box is on top of the filters');
await type('logica');
ok(await ev(`${visible}.includes('reinas') && !${visible}.includes('dudo')`), '"logica" (no accent) finds the logic games');
await type('dados');
ok(await ev(`${visible}.includes('dudo') && !${visible}.includes('reinas')`), '"dados" finds Dudo');
await type('toque');
ok(await ev(`${visible}.includes('toque-y-fama') && ${visible}.includes('letras')`), '"toque" finds both Toque y Fama');
await b.shot("toque");
await type('xyzzy');
ok(await ev(`${visible}.length === 0 && !document.querySelector('.buscar-nada').hidden`), 'nothing found says so');
await type('');
ok(await ev(`${visible}.length === document.querySelectorAll('#games .game-card[data-id]').length && document.querySelector('.buscar-nada').hidden`), 'an empty box shows every game');
await type('dados');
await ev(`document.querySelector('#filtros-cuenta .link-btn').click(); 1`);
ok(await waitFor(`document.getElementById('buscar').value === '' && ${visible}.length === document.querySelectorAll('#games .game-card[data-id]').length`), '"show all" clears the search');

b.close();
console.log(failures ? `✗ ${failures} failure(s)` : '✓ home/search.mjs');
process.exit(failures ? 1 : 0);

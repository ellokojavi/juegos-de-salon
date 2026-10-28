// 🚀 Publicar para todos on /labs/ (D-480): without the owner signed in, the page is as before
// (only the 🔑 link at its foot); for the owner, each card being tried gets the button, the sheet
// says it is not immediate, and each state of a request shows on its card with the PR, its checks
// and its preview. The owner's sign-in is not driven here: the states are drawn with render().
// Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/labs-publish');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 320, height: 720 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

await b.go(`${SITE}/labs/?test`, 1500);
ok(await ev(`!document.querySelector('.publicar')`), 'signed out, no card has the button');
ok(await ev(`!document.getElementById('publicar-dueno').hidden`), 'the 🔑 Entrar como dueño link waits at the foot');

// The owner's view: no request yet, then one card in each state
await ev(`import('/labs/publish.js').then(m => (window.__pub = m, m.render({}))), 1`); await sleep(300);
const cards = await ev(`document.querySelectorAll('#activos > .seccion, #mejoras > .seccion').length`);
ok(cards > 0 && await ev(`document.querySelectorAll('.publicar button').length`) === cards, `every card being tried has 🚀 Publicar para todos (${cards})`);
ok(await ev(`!document.querySelector('#bodega .publicar')`), 'La Bodega has none');

await ev(`__pub.ask(document.getElementById('seccion-copa-crear')), 1`); await sleep(400);
ok(await ev(`/No es inmediato/.test(document.querySelector('.hoja').textContent) && /Mac mini/.test(document.querySelector('.hoja').textContent)`), 'the sheet says it is not immediate and why');
ok(await ev(`/La Copa/.test(document.getElementById('publicar-titulo').nextElementSibling.textContent)`), 'and names the feature');
await b.shot('ask');
await ev(`[...document.querySelectorAll('.hoja button')].find(x => /Cancelar/.test(x.textContent)).click(), 1`);
ok(await ev(`!document.querySelector('.hoja')`), 'Cancelar closes it');

const ids = await ev(`[...document.querySelectorAll('#activos > .seccion, #mejoras > .seccion')].map(c => c.id)`);
const now = Date.now();
const states = { requested: { state: 'requested', at: now }, working: { state: 'working', at: now, started: now },
  pr: { state: 'pr', at: now, pr: 921, branch: 'publish-x' }, merged: { state: 'merged', at: now, pr: 921, done: now },
  failed: { state: 'failed', at: now, msg: 'la tarjeta no nombra código.' } };
const req = Object.fromEntries(Object.values(states).map((s, i) => [ids[i], s]));
await ev(`__pub.render(${JSON.stringify(req)}), 1`); await sleep(200);
const text = id => ev(`document.querySelector('#${id} .publicar-estado')?.textContent || ''`);
const hrefs = id => ev(`[...document.querySelectorAll('#${id} .publicar-estado a')].map(a => a.href)`);
ok(/No es inmediato/.test(await text(ids[0])) && /Cancelar el pedido/.test(await text(ids[0])), 'requested: the delay, and it can be cancelled');
ok((await hrefs(ids[0]))[0]?.includes(`head%3Apublish-${ids[0].replace('seccion-', '')}`), 'requested: a link finds its PR by its branch');
ok(/Claude está trabajando/.test(await text(ids[1])), 'working: says Claude is on it');
const pr = await hrefs(ids[2]);
ok(pr.some(h => h.endsWith('/pull/921')) && pr.some(h => h.endsWith('/pull/921/checks')) && pr.some(h => h.includes('juegos-de-salon-previews/publish-x/')), 'pr: the PR, its checks and its preview');
ok(/auto-merge/.test(await text(ids[2])), 'pr: says it merges on its own');
ok(/Fusionado/.test(await text(ids[3])), 'merged: says so');
ok(/No se pudo publicar: la tarjeta no nombra código/.test(await text(ids[4])) && /Volver a pedir/.test(await text(ids[4])), 'failed: why, and Volver a pedir');
ok(await ev(`[...document.querySelectorAll('.publicar-estado')].every(x => x.scrollWidth <= x.clientWidth + 1)`), 'nothing overflows at 320 px');
await ev(`document.querySelector('#${ids[0]}').scrollIntoView(), 1`); await b.shot('states');
await ev(`document.querySelector('#${ids[2]}').scrollIntoView(), 1`); await b.shot('states-pr');

console.log('errors:', JSON.stringify(b.errors));
ok(!b.errors.length, 'no errors on the page');
b.close();
if (failures) process.exit(1);

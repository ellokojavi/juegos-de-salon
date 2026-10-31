// 🚀 Publicar para todos on /labs/ (D-480): without the owner signed in, the page is as before
// (only the 🔑 link at its foot); for the owner, each card being tried gets the button, the sheet
// says it is not immediate, and each state of a request shows on its card with the PR, its checks
// and its preview. A card behind a runtime flag (D-498) says it is immediate and flips between
// 🧪 / 🟢 / ⚪ with a button to each other state instead (D-498: /labs/ is the one place). The owner's sign-in is not driven here: the states are drawn with render().
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
ok(cards > 0 && await ev(`[...document.querySelectorAll('#activos > .seccion, #mejoras > .seccion')].every(c => [...c.querySelectorAll('.publicar button')].some(x => /Publicar para todos/.test(x.textContent)))`), `every card being tried has 🚀 Publicar para todos (${cards})`);
ok(await ev(`[...document.querySelectorAll('#bodega .seccion')].every(c => !!c.querySelector('.publicar') === !!__pub.flagOf(c.id))`), 'in La Bodega only the cards behind a flag have buttons, inside their fold (D-510)');
ok(await ev(`!!document.querySelector('#seccion-copa-crear .detalle .publicar')`), 'a launched flag card keeps its switch in La Bodega');

await ev(`__pub.ask(document.getElementById('seccion-portada')), 1`); await sleep(400);
ok(await ev(`/No es inmediato/.test(document.querySelector('.hoja').textContent) && /Mac mini/.test(document.querySelector('.hoja').textContent)`), 'the sheet says it is not immediate and why');
ok(await ev(`/\\S/.test(document.getElementById('publicar-titulo').nextElementSibling.textContent)`), 'and names the feature');
await b.shot('ask');
await ev(`[...document.querySelectorAll('.hoja button')].find(x => /Cancelar/.test(x.textContent)).click(), 1`);
ok(await ev(`!document.querySelector('.hoja')`), 'Cancelar closes it');

// 📦 Enviar a La Bodega (D-511): on every card being tried, its sheet says how the card goes
ok(await ev(`[...document.querySelectorAll('#activos > .seccion, #mejoras > .seccion')].every(c => [...c.querySelectorAll('.publicar button')].some(x => /Enviar a La Bodega/.test(x.textContent)))`), 'every card being tried has 📦 Enviar a La Bodega');
ok(await ev(`!document.querySelector('#bodega .publicar') || ![...document.querySelectorAll('#bodega .publicar button')].some(x => /Enviar a La Bodega/.test(x.textContent))`), 'La Bodega has no 📦');
await ev(`__pub.askBodega(document.getElementById('seccion-portada')), 1`); await sleep(300);
ok(await ev(`/Enviar a La Bodega/.test(document.getElementById('publicar-titulo').textContent) && /No prosperó/.test(document.querySelector('.hoja').textContent)`), 'a card not live goes as 💤 No prosperó');
await b.shot('ask-bodega');
await ev(`[...document.querySelectorAll('.hoja button')].find(x => /Cancelar/.test(x.textContent)).click(), 1`);
const bid = await ev(`document.querySelector('#activos > .seccion, #mejoras > .seccion').id`);
await ev(`__pub.render({ [${JSON.stringify(bid)}]: { state: 'pr', kind: 'bodega', at: 1, pr: 5 } }), 1`); await sleep(200);
ok(/aparece en La Bodega/.test(await ev(`document.querySelector('#${bid} .publicar-estado')?.textContent || ''`)) && (await ev(`[...document.querySelectorAll('#${bid} .publicar-estado a')].map(a => a.href).join()`)).includes('previews/bodega-'), 'a 📦 request shows its PR from the bodega- branch');
await ev(`__pub.render({}, {}), 1`);

// A flagged card: immediate, then live with the way back, then off
await ev(`__pub.askFlag(document.getElementById('seccion-copa-crear'), 'copa-crear'), 1`); await sleep(300);
ok(await ev(`/Es inmediato/.test(document.querySelector('.hoja').textContent) && !document.querySelector('.hoja textarea')`), 'a flagged card: the sheet says it is immediate, no note');
ok(await ev(`/La Copa/.test(document.getElementById('publicar-titulo').nextElementSibling.textContent)`), 'and names the feature');
await b.shot('ask-flag');
await ev(`[...document.querySelectorAll('.hoja button')].find(x => /Cancelar/.test(x.textContent)).click(), 1`);
await ev(`__pub.render({}, { 'copa-crear': { state: 'all', at: ${Date.now()} } }), 1`); await sleep(200);
ok(/Publicado para todos/.test(await ev(`document.querySelector('#seccion-copa-crear .publicar-estado')?.textContent || ''`))
  && /Volver al laboratorio/.test(await ev(`document.querySelector('#seccion-copa-crear .publicar-estado button')?.textContent || ''`)), 'flag all: live, with ↩️ Volver al laboratorio');
await ev(`document.querySelector('#seccion-copa-crear').scrollIntoView(), 1`); await b.shot('flag-all');
await ev(`__pub.render({}, {}), 1`); await sleep(200);
ok(/En el laboratorio/.test(await ev(`document.querySelector('#seccion-copa-crear .publicar-estado')?.textContent || ''`)) && await ev(`document.querySelectorAll('#seccion-copa-crear .publicar-estado button').length`) === 2, 'flag lab: says so, with 🚀 and ⚪');
await ev(`__pub.render({}, { 'copa-crear': { state: 'off', at: 1 } }), 1`); await sleep(200);
ok(/Apagado/.test(await ev(`document.querySelector('#seccion-copa-crear .publicar-estado')?.textContent || ''`)), 'flag off: says so');
await ev(`__pub.render({}, {}), 1`);

const ids = await ev(`[...document.querySelectorAll('#activos > .seccion, #mejoras > .seccion')].map(c => c.id).filter(id => !__pub.flagOf(id))`);
const now = Date.now();
const states = { requested: { state: 'requested', at: now }, working: { state: 'working', at: now, started: now },
  pr: { state: 'pr', at: now, pr: 921, branch: 'publish-x' }, merged: { state: 'merged', at: now, pr: 921, done: now },
  failed: { state: 'failed', at: now, msg: 'la tarjeta no nombra código.' } };
// Each state is drawn on its own card when there are enough cards without a flag, and one at a time on the
// first card when there are fewer (the games launched by a flag, D-517, left only a few)
const text = id => ev(`document.querySelector('#${id} .publicar-estado')?.textContent || ''`);
const hrefs = id => ev(`[...document.querySelectorAll('#${id} .publicar-estado a')].map(a => a.href)`);
const card = k => ids[ids.length >= 4 ? k : 0];
const draw = async k => { const req = ids.length >= 4 ? Object.fromEntries(Object.values(states).slice(0, 4).map((s, i) => [ids[i], s])) : { [ids[0]]: Object.values(states)[k] };
  await ev(`__pub.render(${JSON.stringify(req)}), 1`); await sleep(200); };
await draw(0);
ok(/No es inmediato/.test(await text(card(0))) && /Cancelar el pedido/.test(await text(card(0))), 'requested: the delay, and it can be cancelled');
ok((await hrefs(card(0)))[0]?.includes(`head%3Apublish-${card(0).replace('seccion-', '')}`), 'requested: a link finds its PR by its branch');
await ev(`document.querySelector('#${card(0)}').scrollIntoView(), 1`); await b.shot('states');
await draw(1);
ok(/Claude está trabajando/.test(await text(card(1))), 'working: says Claude is on it');
await draw(2);
const pr = await hrefs(card(2));
ok(pr.some(h => h.endsWith('/pull/921')) && pr.some(h => h.endsWith('/pull/921/checks')) && pr.some(h => h.includes('juegos-de-salon-previews/publish-x/')), 'pr: the PR, its checks and its preview');
ok(/auto-merge/.test(await text(card(2))), 'pr: says it merges on its own');
await ev(`document.querySelector('#${card(2)}').scrollIntoView(), 1`); await b.shot('states-pr');
await draw(3);
ok(/Fusionado/.test(await text(card(3))), 'merged: says so');
ok(await ev(`[...document.querySelectorAll('.publicar-estado')].every(x => x.scrollWidth <= x.clientWidth + 1)`), 'nothing overflows at 320 px');
await ev(`__pub.render(${JSON.stringify({ [ids[0]]: states.failed })}), 1`); await sleep(200);
ok(/No se pudo publicar: la tarjeta no nombra código/.test(await text(ids[0])) && /Volver a pedir/.test(await text(ids[0])), 'failed: why, and Volver a pedir');

console.log('errors:', JSON.stringify(b.errors));
ok(!b.errors.length, 'no errors on the page');
b.close();
if (failures) process.exit(1);

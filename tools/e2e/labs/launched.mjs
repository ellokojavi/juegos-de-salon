// A flag on *all* moves its card to La Bodega when /labs/ opens (D-534): the page moves a card under
// ✨ Mejoras en prueba into ✨ Mejoras lanzadas, folded like the ones written there, dated by the day
// the flag went live, «🚀 Lanzado.» first and without the «Para verlo» sentence, and leaves a card
// whose flag is still in the lab where it is. Flags are given to move() here, not read from Firebase.
// Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/labs-launched');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 390, height: 844 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

await b.go(`${SITE}/labs/?test`, 1500);
// Two cards of our own under ✨ Mejoras en prueba, behind made-up flags: one launched, one still in the lab
await ev(`(() => {
  const g = document.getElementById('mejoras');
  for (const [id, title] of [['seccion-prueba-si', '🧪 Prueba lanzada'], ['seccion-prueba-no', '🧪 Prueba en el laboratorio']]) {
    const s = document.createElement('section'); s.className = 'panel seccion'; s.id = id;
    s.innerHTML = '<h2>' + title + '</h2><p class="muted" style="margin:0">Hace algo nuevo. Para verlo: <code>/cup/?test&amp;lab&amp;demo=decided</code>.</p><a class="btn btn--yellow" href="../cup/?test&amp;lab&amp;demo=decided">Ver</a>';
    g.append(s);
  }
})()`);
const at = new Date(2026, 10, 4, 12).getTime();
const moved = await ev(`import('/labs/launched.js').then(m => m.move(document, { 'prueba-si': { state: 'all', at: ${at} }, 'prueba-no': { state: 'lab', at: ${at} } }, { known: { 'prueba-si': 1, 'prueba-no': 1 } })).then(JSON.stringify)`);
ok(moved === '["seccion-prueba-si"]', `move() moves the launched card and only it (${moved})`);
ok(await ev(`!!document.querySelector('#bodega-mejoras #seccion-prueba-si')`), 'the launched card is in ✨ Mejoras lanzadas');
ok(await ev(`!!document.querySelector('#mejoras > #seccion-prueba-no')`), 'the card still in the lab stays under ✨ Mejoras en prueba');
ok(await ev(`document.getElementById('seccion-prueba-si').dataset.launched === '2026-11-04'`), 'dated by the day its flag went live');
ok(await ev(`document.getElementById('seccion-prueba-si').classList.contains('plegada') && !!document.querySelector('#seccion-prueba-si > details > summary > h2')`), 'folded like the cards written in La Bodega: its title in the summary');
const text = await ev(`document.querySelector('#seccion-prueba-si .detalle p').textContent`);
ok(text === '🚀 Lanzado. Hace algo nuevo.', `«🚀 Lanzado.» first and no «Para verlo» sentence (${JSON.stringify(text)})`);
ok(await ev(`document.querySelector('#seccion-prueba-si .detalle a').getAttribute('href') === '../cup/?test&demo=decided'`), 'its demo link no longer asks for the lab key');
ok(await ev(`document.querySelector('#seccion-prueba-si').closest('#bodega') && !document.querySelector('#seccion-prueba-si').closest('#mejoras')`), 'and nothing of it is left under ✨ Mejoras en prueba');
// Moved again, nothing changes
const again = await ev(`import('/labs/launched.js').then(m => m.move(document, { 'prueba-si': { state: 'all', at: ${at} } }, { known: { 'prueba-si': 1 } })).then(JSON.stringify)`);
ok(again === '[]', 'a second pass finds nothing left to move');
await ev(`document.getElementById('seccion-prueba-si').scrollIntoView({ block: 'center' }); document.querySelector('#seccion-prueba-si details').open = true`); await sleep(300);
await b.shot('launched-card');
b.close();
console.log(failures ? `✗ ${failures} failure(s)` : '✓ labs launched: a flag on all moves its card to La Bodega when the page opens');
process.exit(failures ? 1 : 0);

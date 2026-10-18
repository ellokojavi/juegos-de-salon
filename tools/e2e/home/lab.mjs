// The home page's experiments in the lab (D-361, D-362) end to end, at /labs/home/: the lab offers it under
// Mejoras en prueba (the splash beside it, the games apart), the demo shows the real home page with the
// experiments bar, 🔥 Populares starts on and labels three cards that are not La Copa nor "New", the
// switch turns it off and back, the language travels, and the home page alone shows no label. Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/home-lab');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 320, height: 640 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const frame = `document.getElementById('portada').contentDocument`;
const labels = `[...(${frame}?.querySelectorAll('.game-card') || [])].filter(c => c.querySelector('.popular')).map(c => c.dataset.id)`;

// The lab: games, improvements and La Bodega apart; the splash and the home page among the improvements
await b.go(`${SITE}/labs/?test`);
ok(await ev(`!!document.querySelector('#mejoras #seccion-portada #btn-portada') && !!document.querySelector('#mejoras #seccion-splash')`), 'the lab offers the home page experiments and the splash under Mejoras en prueba');
ok(await ev(`!document.querySelector('#activos #seccion-splash') && !!document.querySelector('#activos #seccion-agentes')`), 'the games being tried are apart from the improvements');

// The demo: the real home page behind and the bar, 🔥 Populares on from the start
await b.go(`${SITE}/labs/home/?test`);
ok(await waitFor(`(${labels}).length === 3`), 'with 🔥 Populares on, three cards carry the label');
ok(await ev(`document.querySelector('[data-exp=popular]').getAttribute('aria-pressed') === 'true'`), 'its switch shows as on');
ok(await ev(`(() => { const d = ${frame}; return (${labels}).every(id => { const c = d.querySelector('.game-card[data-id="' + id + '"]'); return !c.classList.contains('torneo') && !c.querySelector('.nuevo'); }); })()`), 'neither La Copa nor a "New" game carries it');
ok(await ev(`${frame}.documentElement.scrollWidth <= 320`), 'no sideways scroll at 320 px');

await ev(`document.querySelector('[data-exp=popular]').click(); 1`);
ok(await waitFor(`!/[?&]popular/.test(document.getElementById('portada').src) && ${frame}?.querySelectorAll('.game-card').length > 3 && (${labels}).length === 0`), 'the switch turns it off: the home page as players see it');
await ev(`document.querySelector('[data-exp=popular]').click(); const s = document.getElementById('idioma'); s.value = 'de'; s.dispatchEvent(new Event('change')); 1`);
ok(await waitFor(`(${labels}).length === 3 && ${frame}.querySelector('.popular').textContent.replace(/\s+/g, ' ').trim() === '🔥 Beliebt'`), 'back on, in German: 🔥 Beliebt');

// ✨ Nuevo and 🔥 Populares (D-362): a row above the types, each one filters, in every language at 320 px
for (const lang of ['es', 'en', 'pt', 'de']) {
  await b.go(`${SITE}/?test&popular&picks&lang=${lang}`);
  await waitFor(`document.querySelectorAll('.filtros .atajos button').length === 2`);
  const fila = await ev(`(() => { const a = document.querySelector('.filtros .atajos'), t = document.querySelector('.filtros .tipos'); const vis = [...a.querySelectorAll('button')].filter(x => !x.hidden); return { arriba: a.getBoundingClientRect().bottom <= t.getBoundingClientRect().top + 1, una: vis.every(x => Math.abs(x.getBoundingClientRect().top - vis[0].getBoundingClientRect().top) < 2), alto: vis.every(x => x.getBoundingClientRect().height >= 44), n: vis.length, ancho: document.documentElement.scrollWidth <= 320 }; })()`);
  ok(fila.arriba && fila.una && fila.alto && fila.ancho && fila.n >= 1, `${lang}: the row sits above the types, on one line, ≥44 px, no sideways scroll`);
}
await b.go(`${SITE}/?test&popular&picks`);
await waitFor(`!!document.querySelector('.atajos [data-tipo=popular]')`);
await ev(`document.querySelector('.atajos [data-tipo=popular]').click(); 1`);
ok(await waitFor(`[...document.querySelectorAll('.game-card[data-id]')].filter(c => !c.hidden).length === 3 && [...document.querySelectorAll('.game-card[data-id]')].filter(c => !c.hidden).every(c => c.querySelector('.popular')) && /type=popular/.test(location.search)`), '🔥 Populares shows only the three popular games, and the link keeps it');
if (await ev(`!document.querySelector('.atajos [data-tipo=new]').hidden`)) {
  await ev(`document.querySelector('.atajos [data-tipo=new]').click(); 1`);
  ok(await waitFor(`(() => { const v = [...document.querySelectorAll('.game-card[data-id]')].filter(c => !c.hidden); return v.length > 0 && v.every(c => c.querySelector('.nuevo')); })()`), '✨ Nuevo shows only the games that say "New"');
}
await b.go(`${SITE}/?test`);
ok(await waitFor(`document.querySelectorAll('.game-card').length > 3`) && await ev(`!document.querySelector('.filtros .atajos:not([hidden])')`), 'the home page alone has no Nuevo or Populares row');

// Players: no label on the home page without the preview
await b.go(`${SITE}/?test`);
ok(await waitFor(`document.querySelectorAll('.game-card').length > 3`) && await ev(`document.querySelectorAll('.popular').length === 0`), 'the home page alone shows no label (it is in the lab)');
await b.go(`${SITE}/?test&popular`);
ok(await waitFor(`document.querySelectorAll('.popular').length === 3`), '?popular previews it on the home page');

b.close();
console.log(failures ? `✗ ${failures} failure(s)` : '✓ home/lab.mjs');
process.exit(failures ? 1 : 0);

// The home page's 🔥 Popular label, ✨ Nuevos / 🔥 Populares filters and the name on the floating menu, as
// players see them since D-369 (tried in the lab as D-361, D-362 and D-364): three labelled cards that are
// neither La Copa nor "New", in German too; the chips above the types in every language at 320 px, each one
// filtering; ⭐ Favoritos beside them, centered when bare; the title only while the filters float, a tap back
// to the top; the space under the floating filters like the space above the title; and a tap on a floating filter
// keeps the menu floating, even on a short result, until the player scrolls up (D-371). Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/home-popular');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 320, height: 640 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const labels = `[...document.querySelectorAll('.game-card')].filter(c => c.querySelector('.popular')).map(c => c.dataset.id)`;

// The label: three cards, never La Copa nor a "New" game, translated
await b.go(`${SITE}/?test&lang=es`);
ok(await waitFor(`(${labels}).length === 3`), 'three cards carry the 🔥 Popular label');
ok(await ev(`(${labels}).every(id => { const c = document.querySelector('.game-card[data-id="' + id + '"]'); return !c.classList.contains('torneo') && !c.querySelector('.nuevo'); })`), 'neither La Copa nor a "New" game carries it');
ok(await ev(`document.documentElement.scrollWidth <= 320`), 'no sideways scroll at 320 px');
await b.go(`${SITE}/?test&lang=de`);
ok(await waitFor(`(${labels}).length === 3 && document.querySelector('.popular').textContent.replace(/\\s+/g, ' ').trim() === '🔥 Beliebt'`), 'in German: 🔥 Beliebt');

// ✨ Nuevos and 🔥 Populares (D-362): a row above the types, each one filters, in every language at 320 px
for (const lang of ['es', 'en', 'pt', 'de']) {
  await b.go(`${SITE}/?test&lang=${lang}`);
  // The row's own pills, the 🔎 among them (D-403); not the ✕ inside the folded search field
  await waitFor(`!!document.querySelector('.filtros .atajos .buscar-pill')`);
  const fila = await ev(`(() => { const a = document.querySelector('.filtros .atajos'), t = document.querySelector('.filtros .tipos'); const vis = [...a.querySelectorAll(':scope > button')].filter(x => !x.hidden); return { arriba: a.getBoundingClientRect().bottom <= t.getBoundingClientRect().top + 1, una: vis.every(x => Math.abs(x.getBoundingClientRect().top - vis[0].getBoundingClientRect().top) < 2), alto: vis.every(x => x.getBoundingClientRect().height >= 44), n: vis.length, ancho: document.documentElement.scrollWidth <= 320 }; })()`);
  ok(fila.arriba && fila.una && fila.alto && fila.ancho && fila.n >= 1, `${lang}: the row sits above the types, on one line, ≥44 px, no sideways scroll`);
}
await b.go(`${SITE}/?test`);
await waitFor(`!!document.querySelector('.atajos [data-tipo=popular]')`);
await ev(`document.querySelector('.atajos [data-tipo=popular]').click(); 1`);
ok(await waitFor(`[...document.querySelectorAll('.game-card[data-id]')].filter(c => !c.hidden).length === 3 && [...document.querySelectorAll('.game-card[data-id]')].filter(c => !c.hidden).every(c => c.querySelector('.popular')) && /type=popular/.test(location.search)`), '🔥 Populares shows only the three popular games, and the link keeps it');
if (await ev(`!document.querySelector('.atajos [data-tipo=new]').hidden`)) {
  await ev(`document.querySelector('.atajos [data-tipo=new]').click(); 1`);
  ok(await waitFor(`(() => { const v = [...document.querySelectorAll('.game-card[data-id]')].filter(c => !c.hidden); return v.length > 0 && v.every(c => c.querySelector('.nuevo')); })()`), '✨ Nuevos shows only the games that say "New"');
}
// The shortcuts outlined, the types filled; the chosen one the same cyan in both (D-407)
await b.go(`${SITE}/?test&lang=es`);
await waitFor(`!!document.querySelector('.filtros .atajos .buscar-pill')`);
const bg = sel => `getComputedStyle(document.querySelector('${sel}')).backgroundColor`;
ok(await ev(`${bg('.filtros .atajos [data-tipo=popular]')} === 'rgba(0, 0, 0, 0)' && ${bg('.filtros .atajos .buscar-pill')} === 'rgba(0, 0, 0, 0)' && ${bg('.filtros .tipos button')} !== 'rgba(0, 0, 0, 0)'`), 'the shortcuts are outlined and the types filled (D-407)');
await ev(`document.querySelector('.filtros .atajos [data-tipo=popular]').click(); 1`);
await sleep(400); // past the 0.15 s color transition
const onBg = await ev(bg('.filtros .atajos [data-tipo=popular]'));
await ev(`document.querySelector('.filtros .tipos button').click(); 1`);
await sleep(400);
ok(onBg === await ev(bg('.filtros .tipos button')) && onBg !== 'rgba(0, 0, 0, 0)', 'the chosen one is the same color in both rows: one choice');
// ⭐ Favoritos joins the Nuevo / Populares row (D-364), with its name from 360 px; the title tops the floating menu
await b.go(`${SITE}/?test&lang=es`);
await waitFor(`document.querySelectorAll('.game-card .fav').length > 3`);
await ev(`document.querySelector('.game-card + .fav, .fav').click(); 1`);
ok(await waitFor(`(() => { const f = [...document.querySelectorAll('.ficha-fav')].find(x => x.getBoundingClientRect().width > 0); if (!f) return false; const r = f.getBoundingClientRect(); return r.width >= 44 && r.right <= 320 && document.documentElement.scrollWidth <= 320; })()`), 'with a favorite at 320 px, ⭐ shows where it fits beside the 🔎 pill, and nothing overflows (D-364, D-396)');
ok(await ev(`document.documentElement.scrollWidth <= 320`), 'and the row still fits at 320 px');
ok(await ev(`(() => { const f = document.querySelector('.ficha-fav'), e = f.querySelector('.ficha-emoji').getBoundingClientRect(), a = f.getBoundingClientRect(); return !f.classList.contains('sola') || Math.abs((e.left - a.left) - (a.right - e.right)) <= 2 && Math.abs((e.top - a.top) - (a.bottom - e.bottom)) <= 2; })()`), 'the bare ⭐ sits centered in its chip');
ok(await ev(`getComputedStyle(document.querySelector('.barra-titulo')).display === 'none'`), 'the title is hidden while the filters sit in their place');
await ev(`scrollTo(0, 1500); 1`);
ok(await waitFor(`document.getElementById('filtros-barra').classList.contains('pegada') && getComputedStyle(document.querySelector('.barra-titulo')).display !== 'none' && document.querySelector('.barra-titulo').getBoundingClientRect().height >= 44`), 'floating, the menu carries the 🎲 Juegos de Salón title, 44 px tall');
await ev(`document.querySelector('.barra-titulo').click(); 1`);
ok(await waitFor(`scrollY < 5`, 4000), 'a tap on the title goes back to the top');
await ev(`document.querySelector('.ficha-fav')?.click(); 1`);
await ev(`document.querySelectorAll('.fav.on').forEach(x => x.click()); 1`);

// Nothing moves when the menu starts floating and the title appears (D-369): a card keeps its place
await b.go(`${SITE}/?test&lang=es`);
await waitFor(`document.querySelectorAll('.game-card').length > 3`);
const salto = await ev(`(async () => { const bar = document.getElementById('filtros-barra'), c = document.querySelectorAll('.game-card[data-id]')[6]; const tope = parseFloat(getComputedStyle(bar).top); const marca = document.getElementById('filtros-marca'); const y0 = marca.getBoundingClientRect().top + scrollY - tope; scrollTo(0, y0 - 3); await new Promise(r => setTimeout(r, 300)); const antes = c.getBoundingClientRect().top; const p0 = bar.classList.contains('pegada'); scrollTo(0, y0 + 3); await new Promise(r => setTimeout(r, 300)); const despues = c.getBoundingClientRect().top; return [p0, bar.classList.contains('pegada'), Math.round(antes - despues)]; })()`);
ok(!salto[0] && salto[1] && Math.abs(salto[2] - 6) <= 1, `the list does not jump when the menu starts floating (moved ${salto[2]} px for 6 px of scroll)`);

// The space under the floating filters matches the space above the title's letters (D-369)
await b.go(`${SITE}/?test&lang=es`);
await waitFor(`document.querySelectorAll('.game-card').length > 3`);
await ev(`scrollTo(0, 1500); 1`);
await waitFor(`document.getElementById('filtros-barra').classList.contains('pegada')`);
await sleep(300);
const gaps = await ev(`(() => { const bar = document.getElementById('filtros-barra'), t = bar.querySelector('.barra-titulo span:last-child'), r = document.createRange(); r.selectNodeContents(t); const top = r.getBoundingClientRect().top; const fondo = bar.getBoundingClientRect().bottom + parseFloat(getComputedStyle(bar, '::before').bottom) * -1; const ultima = Math.max(...[...bar.querySelectorAll('.atajos, .tipos, .favs:not([hidden])')].map(x => x.getBoundingClientRect().bottom)); return [Math.round(top), Math.round(fondo - ultima)]; })()`);
ok(Math.abs(gaps[0] - gaps[1]) <= 2, `the space under the floating filters (${gaps[1]} px) matches the one above the title (${gaps[0]} px)`);

// A tap on a floating filter keeps the menu floating (D-371): on a tall screen 🔥 Populares leaves a list too short to
// scroll that far, and an empty space under it holds the menu until the player scrolls up
const alto = await launch({ dir: `${OUT}/alto`, out: OUT, width: 390, height: 1400 });
const ev2 = e => alto.evaluate(e);
const estado = `(() => { const bar = document.getElementById('filtros-barra'), c = [...document.querySelectorAll('.game-card[data-id]')].find(x => !x.hidden); return { pegada: bar.classList.contains('pegada'), arriba: Math.abs(bar.getBoundingClientRect().top - parseFloat(getComputedStyle(bar).top)) < 2, tarjeta: c.getBoundingClientRect().top >= bar.getBoundingClientRect().bottom - 1, relleno: document.querySelector('.filtros-relleno').offsetHeight, y: scrollY }; })()`;
await alto.go(`${SITE}/?test&lang=es`);
for (let t = 0; t < 80 && !(await ev2(`document.querySelectorAll('.game-card').length > 3`)); t++) await sleep(100);
await ev2(`scrollTo(0, 3000); 1`); await sleep(400);
await ev2(`document.querySelector('.atajos [data-tipo=popular]').click(); 1`); await sleep(500);
const corto = await ev2(estado);
ok(corto.pegada && corto.arriba && corto.tarjeta && corto.relleno > 0, `on a short result the menu keeps floating over the first card (${corto.relleno} px of space under the list)`);
await ev2(`scrollBy(0, -40); 1`); await sleep(400);
const subio = await ev2(estado);
ok(!subio.pegada && corto.relleno - subio.relleno === 40, `scrolling up lets the menu go and gives the space back (${subio.relleno} px left)`);
await ev2(`scrollTo(0, 0); 1`); await sleep(300);
ok(await ev2(`document.querySelector('.filtros-relleno').offsetHeight === 0`), 'back on top, no space is left under the list');
alto.close();
// Half a pixel short of the line the menu dropped on any list: at 390 px, 🧩 with its many games
const ancho = await launch({ dir: `${OUT}/ancho`, out: OUT, width: 390, height: 844 });
await ancho.go(`${SITE}/?test&lang=es`);
for (let t = 0; t < 80 && !(await ancho.evaluate(`document.querySelectorAll('.game-card').length > 3`)); t++) await sleep(100);
await ancho.evaluate(`scrollTo(0, 3000); 1`); await sleep(400);
await ancho.evaluate(`document.querySelector('.tipos [data-tipo=logic]').click(); 1`); await sleep(500);
ok(await ancho.evaluate(`document.getElementById('filtros-barra').classList.contains('pegada')`), 'at 390 px, a tap on 🧩 Lógica keeps the menu floating');
ancho.close();

b.close();
console.log(failures ? `✗ ${failures} failure(s)` : '✓ home/popular.mjs');
process.exit(failures ? 1 : 0);

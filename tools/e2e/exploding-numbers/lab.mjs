// Números explosivos in the lab (D-297) end to end, at /labs/exploding-numbers/: the lab offers it
// under Active projects with the credit to Number Match; the cover says so and plays by itself (the
// pairs explode); Empezar goes through the 3, 2, 1 countdown and builds the 4-row board; a pair that
// doesn't join shakes and says why; one that joins explodes (sparks and 💥); the hint asks for a second
// tap and marks a pair; ➕ with pairs in view asks for a second tap and copies the remaining ones below;
// with the engine's order it's cleared entirely, the rows go away and it pays 100/100; the result has
// share, another board, today's and the comment after a line; giving up asks for a second tap and is
// worth the exploded part. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/exploding-numbers-lab');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEED = 'e2e1';
const { generar, nuevaPartida, une, pares, indice, quitar, PUNTOS_LIMPIO } = await import('../../../public/labs/exploding-numbers/engine.js');
const click = id => ev(`document.querySelector('#tablero [data-id="${id}"]').click(); 1`);
const notice = () => ev(`document.querySelector('.aviso-ne').textContent`);

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-explosivos #btn-explosivos')?.getAttribute('href')`) === 'exploding-numbers/', 'the lab offers Números explosivos under Active projects');
ok(await ev(`/Number Match/.test(document.querySelector('#seccion-explosivos a[href*="numbermatch"]')?.textContent || '')`), 'and says it is inspired by Number Match, with its link');

await b.go(`${SITE}/labs/exploding-numbers/?test`, 1200);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the cover has Empezar');
ok(/Inspirado en Number Match/.test(await ev(`document.querySelector('.credito')?.textContent || ''`)) && !!await ev(`document.getElementById('link-number-match')?.href`), 'the cover credits Number Match with its link');
ok(await waitFor(`document.querySelectorAll('.demo .num.fuera').length >= 2`, 8000), 'the cover board plays by itself: the pairs explode');
ok(/mismo para todos/.test(await ev(`document.body.textContent`)), 'without a seed it is today\'s board');
ok(await ev(`document.querySelectorAll('.pasos li').length`) === 3, 'three steps');
await b.shot('01-cover');

await b.go(`${SITE}/labs/exploding-numbers/?seed=${SEED}&test`, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`/3|2|1/.test(document.querySelector('#cuenta .cuenta-num')?.textContent || '')`, 2000), 'Empezar opens the 3, 2, 1 countdown');
ok(await waitFor(`document.querySelectorAll('#tablero .num').length === 36 && !document.getElementById('cuenta')`, 8000), 'and then the board of 4 rows of 9');
const t = generar(SEED);
ok(JSON.stringify(await ev(`[...document.querySelectorAll('#tablero .num')].map(n => +n.textContent)`)) === JSON.stringify(t.numeros), 'the numbers are the engine\'s');
ok(/Quedan 36/.test(await ev(`document.getElementById('marcador').textContent`)), 'the scoreboard: Quedan 36');

// A pair that doesn't join: shakes and says why
const p0 = nuevaPartida(t);
let bad = null;
for (let i = 0; i < 36 && !bad; i++) for (let j = i + 1; j < 36 && !bad; j++) if (!une(p0, i, j).ok) bad = [i, j, une(p0, i, j).motivo];
await click(bad[0]); await click(bad[1]); await sleep(100);
ok(await ev(`document.querySelector('#tablero [data-id="${bad[1]}"]').classList.contains('no')`) && /no son iguales|entre medio|No están en línea/.test(await notice()), `a pair that doesn't join shakes and says why (${bad[2]}: ${await notice()})`);
ok(await ev(`document.querySelectorAll('#tablero .num.sel').length`) === 0, 'and both are released: the next move starts from scratch');

// The hint: the first tap asks to confirm; the second marks a pair that joins
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(100);
ok(/Toca de nuevo/.test(await ev(`document.getElementById('btn-ayuda').textContent`)) && !await ev(`!!document.querySelector('#tablero .pista')`), 'the first hint tap asks to confirm, without charging');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
const hint = await ev(`[...document.querySelectorAll('#tablero .num.pista')].map(n => +n.dataset.i)`);
ok(hint.length === 2 && une(p0, hint[0], hint[1]).ok, 'the second marks two that join');
ok(/estallan juntos/.test(await notice()) && await ev(`window.__explosivos.P.p.ayudas`) === 1, 'and says so, and counts one hint');

// ➕ with pairs in view asks for a second tap
await ev(`document.getElementById('btn-mas').click(); 1`); await sleep(100);
ok(/Hay pares: ¿seguro\?/.test(await ev(`document.getElementById('btn-mas').textContent`)) && await ev(`document.querySelectorAll('#tablero .num').length`) === 36, '➕ with pairs in view asks for a second tap');

// With the engine's order (in another game, no hint or ➕) it's cleared entirely
await b.go(`${SITE}/labs/exploding-numbers/?seed=${SEED}&test`, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
await waitFor(`document.querySelectorAll('#tablero .num').length === 36 && !document.getElementById('cuenta')`, 8000);
const [a0, b0] = t.orden[0];
await click(a0); await click(b0); await sleep(60);
ok(await ev(`document.querySelectorAll('.chispas .chispa').length > 5 && !!document.querySelector('.chispas .kaboom')`), 'a pair that joins explodes: sparks and 💥');
ok(await ev(`document.querySelector('#tablero [data-id="${a0}"]').classList.contains('fuera')`) && /Quedan 34/.test(await ev(`document.getElementById('marcador').textContent`)), 'its shadow remains and the scoreboard drops to 34');
await b.shot('02-game');
let rows = 0;
for (const [a, c] of t.orden.slice(1)) {
  await waitFor(`!!document.querySelector('#tablero [data-id="${a}"]:not(.fuera)') && !window.__explosivos.P.ocupado`, 2000);
  await click(a); await click(c);
  await sleep(20);
  if (await ev(`window.__explosivos.P.ocupado`)) rows++;
  await sleep(40);
}
ok(rows > 0, `fully crossed-out rows explode and go away (${rows} times)`);
ok(await waitFor(`document.getElementById('puntaje')?.textContent === '100/100' && !document.getElementById('tablero')`, 1500), 'clean and without ➕: the summary appears right away, with no other screen before: 100/100');
ok(/Limpio/.test(await ev(`document.querySelector('.sello-ne').textContent`)), '«¡Limpio!»');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'the result can be shared');
const another = await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`);
ok(/seed=/.test(another) && !another.includes(SEED), `"Otro tablero" opens a new one (${another})`);
ok(await ev(`!!document.getElementById('btn-de-hoy')`), 'and since it was not today\'s, it offers today\'s');
ok(await ev(`(()=>{const k=[...document.querySelector('.resultado').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario') && k.at(-2)?.classList.contains('divisor')})()`), 'the comment comes last, separated by a line');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll at 375 px');
await b.shot('03-final');

// ➕ with no pairs in view, and giving up: a second tap, and it's worth the exploded part
await b.go(`${SITE}/labs/exploding-numbers/?seed=${SEED}&test`, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
await waitFor(`document.querySelectorAll('#tablero .num').length === 36 && !document.getElementById('cuenta')`, 8000);
const p = nuevaPartida(t);
for (const [a, c] of t.orden.slice(0, 5)) { await waitFor(`!window.__explosivos.P.ocupado`, 2000); await click(a); await click(c); quitar(p, indice(p, a), indice(p, c)); await sleep(40); }
await waitFor(`!window.__explosivos.P.ocupado`, 2000);
await ev(`document.getElementById('btn-mas').click(); 1`); await sleep(80);
if (pares(p).length) await ev(`document.getElementById('btn-mas').click(); 1`);
await sleep(200);
const n = p.celdas.filter(c => !c.fuera).length;
ok(await ev(`document.querySelectorAll('#tablero .num').length`) === p.celdas.length + n && /Agregar \(2\)/.test(await ev(`document.getElementById('btn-mas').textContent`)), `➕ copies the ${n} remaining below and 2 are left`);
ok(await ev(`[...document.querySelectorAll('.acciones-ne .btn')].map(b => b.id).join()`) === 'btn-mas,btn-ayuda,btn-rendirse', 'below: ➕, the hint and Give up, in one row');
await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(100);
ok(/Seguro/.test(await ev(`document.getElementById('btn-rendirse').textContent`)), 'giving up asks for a second tap');
await ev(`document.getElementById('btn-rendirse').click(); 1`);
const expected = Math.round(PUNTOS_LIMPIO * (10 / (36 + n)));
ok(await waitFor(`document.getElementById('puntaje')?.textContent === '${expected}/100'`, 6000) && /Te rendiste/.test(await ev(`document.querySelector('.sello-ne').textContent`)), `worth the exploded part, including what was added: ${expected}/100, «Te rendiste»`);
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ números explosivos (labs)');

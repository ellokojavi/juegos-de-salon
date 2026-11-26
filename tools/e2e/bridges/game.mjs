// 🚂 Tren en Vilo, out of the lab (D-456), end to end at its standalone page /bridges/: the waiting room
// in the house style (neon) with its demo bridge and the credit to Poly Bridge; Empezar goes to stage 1 of
// 5 with the deck already laid (it cannot be removed or cleared), the wood counter and its planks. A real
// drag lays a beam and spends wood; ↩ Undo takes it back. The catalog's bridge for each stage crosses: the
// summary opens with its wood, strain, time and points while the clock stands still, and goes on; after
// the five, the end stamp and the engine's score, then «Ver resultado» with the share card. A second game
// given up shows how its stage could be crossed. At 320 × 568, in the four languages, nothing scrolls
// sideways. The 💡 hint (flag bridges-hint, held off for players, so absent until this script turns it
// on): beside Undo, it ghosts the engine's beam of the known bridge, a second tap does not charge again,
// a tap on the ghost lays it, and it costs 3 points in the score and the breakdown; the four actions two
// by two, 44 px high, their text inside and in view at 390 × 844 and 320 × 568. Prints ✗ if anything fails.
import { readFileSync } from 'node:fs';
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { pista } from '../../../public/cup/games/bridges/engine.js';
import { puntajePartida } from '../../../public/cup/games/bridges/physics.js';

const OUT = output('/tmp/bridges-game');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

let b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.textContent || ''`);
const BOARD = `!!document.getElementById('btn-probar') && !document.getElementById('cuenta')`;
/** A grid point of the board, in page pixels (MARGEN is scene.js's 1.3 squares of cliff). */
const at = (x, y) => ev(`(()=>{const c=document.querySelector('.tv-juego .tv-lienzo'),r=c.getBoundingClientRect();return [Math.round(r.left+(${x}+1.3)*c._m.escala),Math.round(r.top+(c._v.arriba-(${y}))*c._m.escala)]})()`);

async function start(url) {
  await b.open(url, 2500);
  ok(await b.until(`document.getElementById('btn-empezar')`, 6000), `${url.replace(SITE, '')}: the waiting room has Empezar`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  return b.until(BOARD, 9000);
}

try {
  // ——— The waiting room ———
  await b.open(`${SITE}/bridges/?test`, 2500);
  ok(await b.until(`document.getElementById('btn-empezar')`, 6000), 'the standalone page /bridges/ opens its waiting room');
  ok(await ev(`document.documentElement.classList.contains('tv-neon')`), 'in the house style (neon), not the pixel art');
  ok(await ev(`!!document.querySelector('.tv-demo canvas')`), 'with the demo bridge on the cover');
  ok(/Poly Bridge/.test(await text('#tv-credito')) && await ev(`!!document.querySelector('#tv-credito a[href*="Poly_Bridge"]')`), 'the credit to Poly Bridge, with its link');
  await b.shot('01-waiting-room');

  // ——— A whole game with a seed ———
  const SEED = 'TRENES';
  ok(await start(`${SITE}/bridges/?test&seed=${SEED}`), 'Empezar goes to the board');
  ok(await ev(`window.__trenCopa.etapas.length`) === 5, 'five crossings');
  ok(/1/.test(await text('#tv-etapa')) && /5/.test(await text('#tv-etapa')), `the title is the stage: «${await text('#tv-etapa')}»`);
  const deck = await ev(`window.__trenCopa.J.vigas.length`), width = await ev(`window.__trenCopa.etapas[0].ancho`);
  ok(deck === width, `the deck is laid: ${deck} beams over a gap of ${width}`);
  ok(await ev(`document.getElementById('btn-borrar').disabled && !document.getElementById('btn-probar').disabled`), 'Clear is off (only the deck) and Test is on');
  ok(await ev(`document.querySelectorAll('.tv-tablones span').length`) > 0, 'the wood left is shown as planks');
  ok(!await ev(`!!document.getElementById('btn-pista')`), 'with the hint\'s flag off (as for players), no 💡 button');
  const wood0 = await text('#tv-cuenta');

  // A tap on the deck says it stays
  const [mx, my] = await at(0.5, 0);
  await b.tap(mx, my); await sleep(200);
  ok(/vía no se quita/.test(await text('.tv-aviso')), 'a tap on the deck says the track stays');
  ok(await ev(`window.__trenCopa.J.vigas.length`) === deck, 'and does not remove it');

  // A real drag from the bank lays a beam
  const [x0, y0] = await at(0, 0), [x1, y1] = await at(1, -1);
  await b.drag(x0, y0, x1, y1); await sleep(300);
  ok(await ev(`window.__trenCopa.J.vigas.length`) === deck + 1, 'a drag from the bank lays a beam');
  ok(await text('#tv-cuenta') !== wood0, `and spends wood (${wood0} → ${await text('#tv-cuenta')})`);
  await b.shot('02-board');
  await ev(`document.getElementById('btn-deshacer').click(); 1`); await sleep(200);
  ok(await ev(`window.__trenCopa.J.vigas.length`) === deck, '↩ Undo takes it back');

  // Each stage with the catalog's bridge
  for (let k = 0; k < 5; k++) {
    await b.until(BOARD, 6000);
    await ev(`(()=>{const t=window.__trenCopa,e=t.etapas[t.J.etapa];t.J.vigas=e.solucion.map(([a,b])=>({a,b}));document.getElementById('btn-probar').click();return 1})()`);
    const summary = await b.until(`!!document.querySelector('.tv-felicitacion')`, 25000);
    ok(summary, `stage ${k + 1}: the train crosses and its summary opens`);
    if (!summary) break;
    if (k === 0) {
      const s = await text('.tv-felicitacion');
      ok(/Madera|Acero/.test(s) && /Esfuerzo/.test(s) && /Tiempo/.test(s) && /Puntos/.test(s), 'the summary has the wood, the strain, the time and the points');
      // past one 250 ms tick first: the last tick before the pause may still show the second before
      await sleep(400); const c0 = await text('#tv-reloj'); await sleep(2200);
      ok(await text('#tv-reloj') === c0, `the clock stands still while it is open (${c0})`);
      await b.shot('03-summary');
    }
    await ev(`document.getElementById('btn-seguir').click(); 1`);
  }
  ok(await b.until(`!!document.getElementById('tv-sello')`, 6000) && /Todos los puentes/.test(await text('#tv-sello')), 'after the five: «¡Todos los puentes en pie!»');
  const score = await text('#tv-puntaje');
  ok(/^\d+\/100$/.test(score) && parseInt(score) >= 50, `with the score: ${score}`);
  await ev(`document.getElementById('btn-fin').click(); 1`);
  ok(await b.until(`/✅ 1 ✅ 2 ✅ 3 ✅ 4 ✅ 5/.test(document.body.innerText)`, 6000), 'the result has the share card ✅ 1 … ✅ 5');
  await b.shot('04-result');

  // ——— Given up: how the stage could be crossed ———
  ok(await start(`${SITE}/bridges/?test&seed=RENDIDO`), 'another game starts');
  await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(200);
  await ev(`document.getElementById('btn-rendirse').click(); 1`);
  ok(await b.until(`/Te rendiste/.test(document.getElementById('tv-sello')?.textContent || '')`, 4000), 'Give up (two taps) ends it');
  ok(await b.until(`!!document.querySelector('#tv-solucion canvas')`, 4000) && /etapa 1/.test(await text('#tv-solucion')), 'and shows how stage 1 could be crossed');
  await b.shot('05-solution');

  // ——— 💡 Hint (flag bridges-hint on): one beam of the known bridge, ghosted until laid, −3 ———
  b.flags({ 'bridges-hint': 'all' });
  ok(await start(`${SITE}/bridges/?test&seed=PISTAS`), 'with the flag on, a game starts');
  ok(await b.until(`document.getElementById('btn-deshacer')?.nextElementSibling?.id === 'btn-pista'`, 4000)
    && /💡 Pista \(−3\)/.test(await text('#btn-pista')), '«💡 Pista (−3)» sits beside Undo');
  {
    const e0 = await ev(`JSON.stringify(window.__trenCopa.etapas[0])`).then(JSON.parse);
    const v0 = await ev(`JSON.stringify(window.__trenCopa.J.vigas)`).then(JSON.parse);
    const want = pista(e0, v0);
    await ev(`document.getElementById('btn-pista').click(); 1`); await sleep(200);
    const J1 = await ev(`JSON.stringify(window.__trenCopa.J)`).then(JSON.parse);
    ok(want && JSON.stringify(J1.fantasma) === JSON.stringify(want), `it ghosts the engine's beam of the known bridge (${JSON.stringify(want)})`);
    ok(J1.pistas === 1 && J1.vigas.length === v0.length, 'counted once, and nothing laid yet');
    ok(/puente conocido/.test(await text('.tv-aviso')), 'it says the marked beam is part of the known bridge');
    await b.shot('07-hint');
    await ev(`document.getElementById('btn-pista').click(); 1`); await sleep(150);
    ok(await ev(`window.__trenCopa.J.pistas`) === 1, 'a second tap with the ghost still there does not charge again');
    // A tap in the middle of the ghost lays it
    const [gx, gy] = await at((want.a[0] + want.b[0]) / 2, (want.a[1] + want.b[1]) / 2);
    await b.tap(gx, gy); await sleep(250);
    const J2 = await ev(`JSON.stringify(window.__trenCopa.J)`).then(JSON.parse);
    ok(J2.fantasma === null && J2.vigas.length > v0.length, 'a tap on the ghost lays the beam, and the ghost goes');
  }
  // Stage 1 crossed with the known bridge, then given up: the score is the engine's minus 3
  await ev(`(()=>{const t=window.__trenCopa,e=t.etapas[t.J.etapa];t.J.vigas=e.solucion.map(([a,b])=>({a,b}));document.getElementById('btn-probar').click();return 1})()`);
  ok(await b.until(`!!document.querySelector('.tv-felicitacion')`, 25000), 'stage 1 crossed');
  await ev(`document.getElementById('btn-seguir').click(); 1`);
  await b.until(BOARD, 6000);
  ok(await ev(`!!document.getElementById('btn-pista') && !window.__trenCopa.J.fantasma`), 'stage 2 brings the button back, with no ghost');
  await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(200);
  await ev(`document.getElementById('btn-rendirse').click(); 1`);
  await b.until(`!!document.getElementById('btn-fin')`, 4000);
  {
    const Jh = await ev(`JSON.stringify(window.__trenCopa.J)`).then(JSON.parse);
    const lista = await ev(`JSON.stringify(window.__trenCopa.etapas)`).then(JSON.parse);
    const sin = puntajePartida(Jh.hechas.map(x => x.usada), Jh.seg, lista, Jh.hechas.map(x => x.pico)).total;
    ok(Jh.puntos.total === Math.max(0, sin - 3) && await text('#tv-puntaje') === `${Jh.puntos.total}/100`, `the hint takes 3 points off: ${sin} → ${Jh.puntos.total}`);
    await ev(`document.getElementById('btn-fin').click(); 1`);
    ok(await b.until(`/💡 1 pista: −3/.test(document.getElementById('explicacion')?.textContent || '')`, 5000), 'the breakdown says «💡 1 pista: −3.»');
    await b.shot('08-hint-result');
  }

  // ——— The hint measured: the four actions two by two, in view, at 390 × 844 ———
  await b.close();
  b = await launch({ dir: `${OUT}/p390`, out: OUT, width: 390, height: 844 });
  b.flags({ 'bridges-hint': 'all' });
  const actions = `JSON.stringify([...document.querySelectorAll('.tv-acciones .btn')].map(x=>{const r=x.getBoundingClientRect();return {id:x.id,top:Math.round(r.top),left:Math.round(r.left),h:r.height,bottom:r.bottom,right:r.right,fits:x.scrollWidth<=x.clientWidth+1}}))`;
  const measure = async (w, h, tag) => {
    const row = await ev(actions).then(JSON.parse);
    ok(row.map(x => x.id).join() === 'btn-deshacer,btn-pista,btn-borrar,btn-rendirse', `${tag}: Undo and 💡 Hint first, then Clear and Give up`);
    ok(row.length === 4 && row[0].top === row[1].top && row[2].top === row[3].top && row[2].top > row[0].top && row[0].left === row[2].left,
      `${tag}: two by two (${row.map(x => `${x.left},${x.top}`).join(' ')})`);
    ok(row.every(x => x.h >= 44 && x.fits), `${tag}: 44 px high, their text inside`);
    // At 390 × 844 all four are in view; at 320 × 568 the actions were already under the fold without the hint
    if (h >= 844) ok(row.every(x => x.bottom <= h && x.right <= w), `${tag}: all four in view without scrolling`);
    else ok(row.every(x => x.right <= w) && row[2].top - row[0].bottom >= 6, `${tag}: inside the width, the two rows apart (${Math.round(row[2].top - row[0].bottom)} px)`);
    ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `${tag}: no sideways scroll`);
  };
  await b.open(`${SITE}/bridges/?test&seed=MIDE`, 2500);
  await b.until(`document.getElementById('btn-empezar')`, 6000);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  ok(await b.until(`${BOARD} && !!document.getElementById('btn-pista')`, 9000), '390 px: the board with the 💡 hint');
  await measure(390, 844, 'es 390×844');
  await b.shot('09-hint-390');

  // ——— 320 px, four languages ———
  await b.close();
  b = await launch({ dir: `${OUT}/p320`, out: OUT, width: 320, height: 568 });
  b.flags({ 'bridges-hint': 'all' });
  for (const lang of ['es', 'en', 'pt']) {
    await b.open(`${SITE}/bridges/?test&lang=${lang}&seed=L${lang}`, 2500);
    await b.until(`document.getElementById('btn-empezar')`, 6000);
    ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `${lang}: no sideways scroll in the waiting room`);
    await ev(`document.getElementById('btn-empezar').click(); 1`);
    ok(await b.until(`${BOARD} && !!document.getElementById('btn-pista')`, 9000), `${lang}: the board opens, with the 💡 hint`);
    await measure(320, 568, `${lang} 320×568`);
    await b.shot(`06-320-${lang}`);
  }
} catch (e) {
  ok(false, `the script failed: ${e.message}`);
} finally {
  await b.close();
  console.log(failures ? `✗ ${failures} failed` : '✓ Tren en Vilo end to end');
  process.exit(failures ? 1 : 0);
}

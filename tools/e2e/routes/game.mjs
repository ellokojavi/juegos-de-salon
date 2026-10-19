// 🚇 Rutas rotas, out of the lab (D-331), end to end at its standalone page /routes/: the waiting room
// has the self-solving board on top, the drawing of a turn and the credit to Junction Nine with its
// link; Empezar goes through the 3, 2, 1 countdown and starts at stage 1 of 5 (the board the engine
// gives for the seed), with Undo and Restart off and the 7-minute countdown; a real drag marks a
// rectangle and on release it turns (each piece ends where and how the engine says) and counts, and a
// tap turns one piece; undo and restart go back without counting; the countdown pauses with the
// screen hidden; in each of the five stages, undoing the scramble joins all the lines and the next one
// arrives; the game stops La Copa's clock at once and «Ver resultado» gives the engine's layered
// score, its breakdown and the share card (one line per stage); giving up asks for a second tap and
// counts the stages done; when the 7 minutes run out (the page clock pushed forward) the stages done
// count; a game resumes from its moves (a reloaded cup day), also past its time; La Copa's practice
// plays it too, and its trial session is 2 stages in 2 minutes; and at 320 × 568, in the four languages, nothing scrolls sideways, the drawings sit
// side by side and the three buttons fit in one row in view; with reduced motion a turn lands at
// once and the cover stays solved. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { girar, resuelto, generarEtapa, puntajePartida, ETAPAS, PUNTOS_ETAPA, TIEMPO_S, RECTANGULOS } from '../../../public/cup/games/routes/engine.js';

const OUT = output('/tmp/routes-game');
const SITE = process.env.SITE || 'http://localhost:8765';
const SEED = 'KQRST';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

let b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.textContent || ''`);

/** Opens the page, taps Empezar and waits for the board, with the countdown gone. */
async function start(url) {
  await b.open(url, 2500);
  ok(await b.until(`document.getElementById('btn-empezar')`, 6000), `${url.replace(SITE, '')}: the waiting room has Empezar`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  return b.until(`document.querySelectorAll('#rr-tablero .rr-pieza').length === 9 && !document.getElementById('cuenta')`, 9000);
}
const board = () => ev(`JSON.stringify(window.__rutas.t)`).then(JSON.parse);
const turnByEvent = async r => { await ev(`window.__rutas.girar(${JSON.stringify(r)}); 1`); await sleep(60); };
const solveStage = async t => { for (const r of [...t.revuelta].reverse()) await turnByEvent(r); };
/** Each piece where the engine puts it, and drawn turned half a turn when flipped. */
const matchesEngine = async (sel, state) => (await ev(`JSON.stringify([...document.querySelectorAll('${sel} .rr-pieza')].map(n => [+n.dataset.p, +n.dataset.lugar, n.firstChild.style.transform.includes('180') ? 1 : 0]))`).then(JSON.parse))
  .every(([p, l, v]) => state[l].p === p && state[l].v === v);

try {
  // ——— The waiting room ———
  await b.open(`${SITE}/routes/?test`, 2500);
  ok(await b.until(`document.getElementById('btn-empezar')`, 6000), 'the standalone page /routes/ opens its waiting room');
  ok(await ev(`document.querySelectorAll('.intro-hero .rr-portada .rr-pieza').length`) === 9, 'on top, the 9-piece board of the cover');
  ok(await ev(`document.querySelectorAll('.rr-ejemplo .rr-ej').length`) === 2, 'the how-to has the drawing of a turn (before and after)');
  ok(/Inspirado en Junction Nine, de Bricks and Chips/.test(await text('#rr-credito')) && /junction-nine/.test(await ev(`document.getElementById('link-junction')?.href || ''`)), 'and the credit to Junction Nine, with its link');
  ok(/5 etapas en 7 minutos/.test(await text('.como')), 'the steps say the 5 stages and the 7 minutes');
  // The cover solves itself: its pieces move
  const cover = () => ev(`[...document.querySelectorAll('.rr-portada .rr-pieza')].map(n => n.dataset.lugar + n.firstChild.style.transform).join()`);
  const cover0 = await cover();
  await sleep(2600);
  ok(await cover() !== cover0, 'the cover board moves by itself');
  ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll in the waiting room');
  await b.shot('01-waiting-room');

  // ——— A whole game with a seed ———
  ok(await start(`${SITE}/routes/?test&seed=${SEED}`), 'Empezar goes through the countdown and then the board');
  const t = await board();
  const expected0 = generarEtapa(`${SEED}:1`, 0);
  ok(JSON.stringify(t.inicio) === JSON.stringify(expected0.inicio) && t.minimo === ETAPAS[0].minimo, `the board is the engine's for the seed (stage 1, minimum ${t.minimo})`);
  ok(/Etapa 1 de 5/.test(await text('#rr-etapa')), 'it starts at stage 1 of 5');
  ok(new RegExp(`Giros: 0 · Mínimo: ${t.minimo}`).test(await text('#rr-marcador')), 'the scoreboard shows the turns and the minimum');
  ok(await ev(`document.getElementById('btn-reiniciar').disabled && document.getElementById('btn-deshacer').disabled`), 'with no turns, Undo and Restart are off');
  ok(/⏳ [67]:\d\d/.test(await text('#rr-reloj')), 'the countdown starts at 7 minutes');
  ok(await ev(`[...document.querySelectorAll('.rr-acciones .btn')].map(b => b.id).join()`) === 'btn-deshacer,btn-reiniciar,btn-rendirse', 'the buttons are in order: Undo, Restart, Give up');
  ok(await matchesEngine('#rr-tablero', t.inicio), 'each piece is drawn as the engine says (the flipped ones, turned)');
  // A real drag, from the top-left piece to the center one: turns that 2×2 block
  const at = await ev(`JSON.stringify(document.getElementById('rr-tablero').getBoundingClientRect())`).then(JSON.parse);
  const cell = (c, f) => [Math.round(at.left + at.width * (c + 0.5) / 3), Math.round(at.top + at.height * (f + 0.5) / 3)];
  await b.drag(...cell(0, 0), ...cell(1, 1));
  await sleep(600);
  const afterDrag = girar(t.inicio, { f1: 0, c1: 0, f2: 1, c2: 1 });
  ok(await matchesEngine('#rr-tablero', afterDrag), 'dragging marks a rectangle and releasing turns it: each piece ends where and how the engine says');
  ok(/Giros: 1/.test(await text('#rr-marcador')), 'and counts the turn');
  await b.shot('02-game');
  // A tap turns a single piece
  await b.tap(...cell(2, 2)); await sleep(600);
  ok(await matchesEngine('#rr-tablero', girar(afterDrag, { f1: 2, c1: 2, f2: 2, c2: 2 })) && /Giros: 2/.test(await text('#rr-marcador')), 'a tap turns a single piece in its place');
  await ev(`document.getElementById('btn-deshacer').click(); 1`); await sleep(600);
  ok(/Giros: 1/.test(await text('#rr-marcador')) && await matchesEngine('#rr-tablero', afterDrag), 'Undo goes back one turn, which doesn\'t count');
  await ev(`document.getElementById('btn-reiniciar').click(); 1`); await sleep(500);
  ok(/Giros: 0/.test(await text('#rr-marcador')) && await matchesEngine('#rr-tablero', t.inicio), 'Restart goes back to the start with 0 turns');
  // The countdown pauses while the screen is hidden (U-20, D-95): the hidden time doesn't count
  const hidden = v => ev(`Object.defineProperty(document, 'hidden', { configurable: true, get: () => ${v} }); document.dispatchEvent(new Event('visibilitychange')); 1`);
  const left = async () => { const [m, s] = (await text('#rr-reloj')).match(/(\d+):(\d+)/).slice(1).map(Number); return 60 * m + s; };
  const l0 = await left(); await hidden(true); await sleep(2500); await hidden(false); await sleep(300);
  ok(l0 - await left() <= 1, 'with the screen hidden, the countdown pauses');
  // Each stage: undoing its scramble joins all the lines, and the next one arrives
  for (let k = 0; k < ETAPAS.length; k++) {
    if (k) ok(await b.until(`document.getElementById('rr-etapa')?.textContent.includes('Etapa ${k + 1} de 5')`, 5000), `stage ${k + 1} arrives`);
    const te = await board();
    ok(te.minimo === ETAPAS[k].minimo && te.colores.length === ETAPAS[k].lineas, `stage ${k + 1}: minimum ${te.minimo}, ${te.colores.length} lines`);
    await solveStage(te);
    if (k < ETAPAS.length - 1) ok(await b.until(`document.getElementById('rr-tablero')?.classList.contains('resuelto')`, 3000), `stage ${k + 1}: all the lines join`);
    if (k === 1) await b.shot('03-stage-done');
  }
  ok(await b.until(`document.getElementById('btn-fin')`, 3000), 'after the fifth, the end: «Ver resultado»');
  const J = await ev(`JSON.stringify(window.__rutas.J)`).then(JSON.parse);
  const perfect = J.hechas.filter(x => x.giros <= x.minimo).length;
  ok(new RegExp(perfect === 5 ? '¡Todas en el mínimo!' : '¡Rutas unidas!').test(await text('#rr-sello')), `the stamp says how it went (${J.hechas.map(x => `${x.giros}/${x.minimo}`).join(' ')})`);
  ok(await ev(`document.querySelectorAll('.rr-punto.perfecta').length`) === perfect && await ev(`document.querySelectorAll('.rr-punto.hecha').length`) === 5 - perfect, 'and the dots: green at the minimum, yellow with extra turns');
  const clock = await ev(`document.querySelector('#jugar-head').reloj()`);
  await sleep(1300);
  ok(await ev(`document.querySelector('#jugar-head').reloj()`) === clock, `La Copa's clock stopped when the board ended (${clock})`);
  await b.shot('04-end');
  const exp = puntajePartida(J.hechas, J.seg);
  await ev(`document.getElementById('btn-fin').click(); 1`);
  ok(await b.until(`document.querySelector('#resultado-body .score-big')`, 4000), 'the result screen arrives');
  ok(await text('#resultado-body .score-big') === `${exp.total}/100` && exp.completa, `the result is the engine's: ${exp.total}/100 = ${exp.base} + ${exp.ptsVelocidad} for speed + ${exp.ptsGiros} for turns (${Math.round(J.seg)} s)`);
  const bd = await text('#explicacion');
  ok(/Etapas \(5 de 5\): \+85/.test(bd) && /Rapidez/.test(bd) && /Giros \(\d+, mínimo \d+\)/.test(bd), 'the breakdown shows the three layers');
  ok(/Etapa 5: \d+ giros \(mínimo 5\)/.test(bd) && /Reiniciaste 1 vez/.test(bd), 'and each stage, and the restart');
  const card = await text('#resultado-body pre.tarjeta');
  ok(card.trim().split('\n').length === 5 && card.trim().split('\n').every((x, k) => x === `${J.hechas[k].giros <= J.hechas[k].minimo ? '🟩' : '🟨'} ${k + 1}: ${J.hechas[k].giros}/${J.hechas[k].minimo}`), 'the share card has one line per stage, turns against the minimum');
  ok(await ev(`!!document.getElementById('btn-otra')`), 'another board can be played');
  await b.shot('05-result');

  // ——— Giving up: a second tap, and the stages done count ———
  ok(await start(`${SITE}/routes/?test&seed=${SEED}`), 'a second game starts');
  await solveStage(await board());
  ok(await b.until(`document.getElementById('rr-etapa')?.textContent.includes('Etapa 2 de 5')`, 5000), 'stage 1 done, stage 2 arrives');
  await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(150);
  ok(/Seguro/.test(await text('#btn-rendirse')) && !await ev(`!!document.getElementById('btn-fin')`), 'giving up asks for a second tap');
  await b.shot('06-give-up-armed');
  await ev(`document.getElementById('btn-rendirse').click(); 1`);
  ok(await b.until(`document.getElementById('btn-fin')`, 3000) && /Te rendiste/.test(await text('#rr-sello')), 'and with the second the game ends: «Te rendiste»');
  const Jg = await ev(`JSON.stringify(window.__rutas.J)`).then(JSON.parse);
  await ev(`document.getElementById('btn-fin').click(); 1`);
  const gaveUp = puntajePartida(Jg.hechas, Jg.seg).total;
  ok(await b.until(`document.querySelector('#resultado-body .score-big')`, 4000) && await text('#resultado-body .score-big') === `${gaveUp}/100` && Jg.hechas.length === 1,
    `the stage done counts: ${gaveUp}/100 (${PUNTOS_ETAPA} + its turns, no speed)`);
  ok(/Rapidez: \+0 \(faltaron etapas\)/.test(await text('#explicacion')), 'the breakdown says there is no speed bonus');
  ok(/⬛ 5: —/.test(await text('#resultado-body pre.tarjeta')), 'the share card marks the missing stages with ⬛');

  // ——— Out of time: the page clock jumps 7 minutes ahead ———
  ok(await start(`${SITE}/routes/?test&seed=${SEED}`), 'a third game starts');
  await solveStage(await board());
  await b.until(`document.getElementById('rr-etapa')?.textContent.includes('Etapa 2 de 5')`, 5000);
  await ev(`(()=>{const real=Date.now.bind(Date);Date.now=()=>real()+${TIEMPO_S * 1000};return 1})()`);
  ok(await b.until(`/Se acabó el tiempo/.test(document.getElementById('rr-sello')?.textContent || '')`, 3000), 'when the 7 minutes run out the game ends: «Se acabó el tiempo»');
  ok(await ev(`!document.getElementById('btn-rendirse')`), 'and the buttons go away');
  await b.shot('07-time-up');
  const Jt = await ev(`JSON.stringify(window.__rutas.J)`).then(JSON.parse);
  await ev(`document.getElementById('btn-fin').click(); 1`);
  const late = puntajePartida(Jt.hechas, TIEMPO_S).total;
  ok(await b.until(`document.querySelector('#resultado-body .score-big')`, 4000) && await text('#resultado-body .score-big') === `${late}/100` && Jt.seg === TIEMPO_S && Jt.fin === 'tiempo',
    `the stages done count: ${late}/100 with ${Jt.hechas.length}`);

  // ——— Resuming (a cup day reloaded): the screen rebuilds the game from its moves ———
  const resumed = await ev(`(async()=>{
    const ui=await import('/cup/games/routes/ui.js'); const { LOCALES }=await import('/cup/rules.js'); const { el }=await import('/assets/js/ui.js');
    const fmt=(s,o={})=>String(s).replace(/\\{(\\w+)\\}/g,(_,k)=>o[k]??''); const noop=()=>{};
    const ctx=(jugadas,ms,out)=>({ p:{semilla:'${SEED}:1',etapas:5,tiempo:${TIEMPO_S * 1000}}, jugadas, T:LOCALES.es, fmt, el, SFX:new Proxy({},{get:()=>noop}), vibrate:noop, lang:'es',
      guardar:noop, tiempo:()=>ms, pausa:()=>noop, pararReloj:e=>{out.stopped=e}, terminar:noop });
    const r={}, raiz=document.createElement('div'); document.body.append(raiz);
    ui.montar(raiz, ctx({etapa:1,hechas:[{giros:2,minimo:2}],giros:[0,35],reinicios:1,fin:null,seg:0}, 30000, r));
    Object.assign(r, { etapa: raiz.querySelector('#rr-etapa').textContent, marcador: raiz.querySelector('#rr-marcador').textContent,
      lugares: [...raiz.querySelectorAll('.rr-pieza')].map(n=>[+n.dataset.p,+n.dataset.lugar,n.firstChild.style.transform.includes('180')?1:0]) });
    // Out of time on resume (the clock already past the 7 minutes): it ends at once with what was done
    const r2={}, raiz2=document.createElement('div'); document.body.append(raiz2);
    ui.montar(raiz2, ctx({etapa:1,hechas:[{giros:2,minimo:2}],giros:[],reinicios:0,fin:null,seg:0}, ${TIEMPO_S * 1000 + 5000}, r2));
    r.late = { sello: raiz2.querySelector('#rr-sello')?.textContent, fin: r2.stopped?.fin, hechas: r2.stopped?.hechas.length };
    raiz.remove(); raiz2.remove(); return JSON.stringify(r); })()`).then(JSON.parse);
  const t2 = generarEtapa(`${SEED}:1`, 1), st2 = [RECTANGULOS[0], RECTANGULOS[35]].reduce(girar, t2.inicio);
  ok(/Etapa 2 de 5/.test(resumed.etapa) && /Giros: 2/.test(resumed.marcador) && !resumed.stopped, 'a game resumes at its stage with its turns');
  ok(resumed.lugares.every(([p, l, v]) => st2[l].p === p && st2[l].v === v) && !resuelto(t2.piezas, st2), 'and its board as the moves left it');
  ok(resumed.late.sello === 'Se acabó el tiempo' && resumed.late.fin === 'tiempo' && resumed.late.hechas === 1, 'resumed after the 7 minutes, it ends at once and the stages done count');

  // ——— La Copa's practice plays the same screen ———
  ok(await start(`${SITE}/cup/?practice=routes&test`), 'La Copa\'s practice (/cup/?practice=routes) plays it');
  ok(/Etapa 1 de 5/.test(await text('#rr-etapa')), 'from stage 1 of 5');
  // The trial session (D-103): the same screen, shorter
  await b.open(`${SITE}/cup/?practice=routes&test&labs`, 2500);
  ok(await b.until(`document.getElementById('btn-ensayo')`, 6000), 'the practice offers the trial session');
  await ev(`document.getElementById('btn-ensayo').click(); 1`);
  ok(await b.until(`document.querySelectorAll('#rr-tablero .rr-pieza').length === 9 && !document.getElementById('cuenta')`, 9000)
    && /Etapa 1 de 2/.test(await text('#rr-etapa')) && /⏳ [12]:\d\d/.test(await text('#rr-reloj')), 'the trial is 2 stages in 2 minutes');
  for (let k = 0; k < 2; k++) { await b.until(`document.getElementById('rr-etapa')?.textContent.includes('Etapa ${k + 1} de 2')`, 5000); await solveStage(await board()); }
  ok(await b.until(`document.getElementById('btn-fin')`, 4000) && /Terminar la prueba/.test(await text('#btn-fin')), 'and it ends with «Terminar la prueba»');
  ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
  b.close();

  // ——— At 320 × 568, in the four languages ———
  b = await launch({ dir: `${OUT}/p320`, out: OUT, width: 320, height: 568 });
  for (const lang of ['es', 'en', 'pt', 'de']) {
    await b.open(`${SITE}/routes/?test&lang=${lang}`, 2500);
    await b.until(`document.getElementById('btn-empezar')`, 6000);
    ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `${lang} 320 px: no sideways scroll in the waiting room`);
    ok(await ev(`(()=>{const f=[...document.querySelectorAll('.rr-ejemplo figure')].map(x=>x.getBoundingClientRect().top);return f.length===2&&Math.abs(f[0]-f[1])<2})()`), `${lang} 320 px: the two drawings side by side`);
    if (lang === 'es') await b.shot('08-waiting-room-320');
    await ev(`document.getElementById('btn-empezar').click(); 1`);
    await b.until(`document.querySelectorAll('#rr-tablero .rr-pieza').length === 9 && !document.getElementById('cuenta')`, 9000);
    await sleep(300);
    const row = await ev(`JSON.stringify([...document.querySelectorAll('.rr-acciones .btn')].map(b=>{const r=b.getBoundingClientRect();return {top:Math.round(r.top),h:r.height,bottom:r.bottom,fits:b.scrollWidth<=b.clientWidth+1}}))`).then(JSON.parse);
    ok(row.length === 3 && row.every(x => x.top === row[0].top && x.h >= 44 && x.fits), `${lang} 320 px: the three buttons in one row, 44 px high, their text inside`);
    ok(row.every(x => x.bottom <= 568), `${lang} 320×568: the buttons are seen without scrolling`);
    ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `${lang} 320 px: no sideways scroll in the game`);
    await b.shot(`09-game-320-${lang}`);
  }
  // With reduced motion (C-8): the cover stays solved and a turn lands at once
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  ok(await start(`${SITE}/routes/?test&seed=${SEED}`), 'reduced motion: the game starts');
  const tq = await board();
  await turnByEvent({ f1: 0, c1: 0, f2: 1, c2: 1 });
  ok(await matchesEngine('#rr-tablero', girar(tq.inicio, { f1: 0, c1: 0, f2: 1, c2: 1 })), 'reduced motion: a turn lands at once, without the orbit');
  await b.open(`${SITE}/routes/?test`, 2500);
  const still = () => ev(`[...document.querySelectorAll('.rr-portada .rr-pieza')].map(n => n.dataset.lugar + n.firstChild.style.transform).join()`);
  const s0 = await still(); await sleep(2000);
  ok(await ev(`document.querySelector('.rr-portada')?.classList.contains('resuelto')`) && await still() === s0, 'reduced motion: the cover board stays solved');
  ok(!b.errors.length, `no errors on the page at 320 px ${JSON.stringify(b.errors)}`);
} finally {
  b.close();
}
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ rutas rotas');

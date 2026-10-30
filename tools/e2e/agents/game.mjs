// 🕵️ Agentes, out of the lab and into La Copa (D-421), end to end at its standalone page /agents/:
// the waiting room has the Clasificado stamp on the name, the drawing that plays a clue by itself
// (3 agents, then the assassin) and the credit to Codenames with its link; Empezar goes through the
// 3, 2, 1 countdown to the board the engine gives for the seed (15 cards, clue 1 of 4). Long presses
// mark 📌, then 🚫, then nothing, without turning the card over (the help line goes away), and a 🚫
// is not turned over by a tap. A game played through against the engine: an agent of the clue
// scores, an agent of another clue scores without cutting it, the assassin cuts it (Cortada stamp),
// completing a clue gives Completa and the next one arrives, an agent found earlier counts for its
// clue; on the last clue the button says Terminar, its first tap says how many agents are left and
// asks, the second ends it; the cards nobody touched turn over, the end stamp (the assassin's) and the
// trap explained (the assassin and the clue it looked like) show, La Copa's clock stops, and
// «Ver resultado» gives the engine's score, its breakdown and its share card. A game resumes from its
// moves (a reloaded cup day). La Copa's practice plays it, and its trial session is 2 clues. At
// 320 × 568, in the four languages, nothing scrolls sideways and every word fits in its card (at
// 375 × 812 the board and its button are seen without scrolling); with reduced motion the drawing stays solved. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { generarDia, estado, puntaje, base, tarjeta, RESTA_ASESINO, CUANTAS } from '../../../public/cup/games/agents/engine.js';

const OUT = output('/tmp/agents-game');
const SITE = process.env.SITE || 'http://localhost:8765';
const SEED = 'KQRST';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

let b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.textContent || ''`);
const BOARD_READY = n => `document.querySelectorAll('#ag-tablero .ag-carta').length === ${n} && !document.getElementById('cuenta')`;

/** Opens the page, taps Empezar and waits for the board, with the countdown gone. */
async function start(url, cards = 15) {
  await b.open(url, 2500);
  ok(await b.until(`document.getElementById('btn-empezar')`, 6000), `${url.replace(SITE, '')}: the waiting room has Empezar`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  return b.until(BOARD_READY(cards), 9000);
}
const card = i => `document.querySelector('#ag-tablero .ag-carta[data-i="${i}"]')`;
const cls = i => ev(`${card(i)}.className`);
const tap = async i => { await ev(`${card(i)}.click(); 1`); await sleep(250); };
const notice = () => text('.ag-aviso');
const stamp = () => text('#ag-pista .ag-sello--pista');
const longPress = async i => {
  await ev(`${card(i)}.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); 1`);
  await sleep(600);
  // The click that follows a long press does not turn the card over
  await ev(`(()=>{const b=${card(i)};b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));b.click();return 1})()`);
  await sleep(100);
};

try {
  // ——— The waiting room ———
  await b.open(`${SITE}/agents/?test`, 2500);
  ok(await b.until(`document.getElementById('btn-empezar')`, 6000), 'the standalone page /agents/ opens its waiting room');
  ok(/Clasificado/.test(await text('.ag-sello--titulo')), 'the name carries the Clasificado stamp');
  ok(await ev(`document.getElementById('link-codenames')?.href`) === 'https://czechgames.com/en/codenames/' && /Inspirado en Codenames, de Vlaada Chvátil/.test(await text('#ag-credito')), 'the credit to Codenames, with its link');
  ok(await ev(`document.querySelectorAll('.ag-demo .ag-dc').length`) === 6, 'the how-to drawing has six cards');
  ok(await b.until(`document.querySelectorAll('.ag-demo .ag-dc.agente').length === 3 && !!document.querySelector('.ag-demo .ag-dc.asesino')`, 9000), 'and plays a clue by itself: its 3 agents, then the assassin');
  ok(new RegExp(`Llegan ${CUANTAS} pistas`).test(await text('.como')), 'the steps say the 4 clues');
  ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll in the waiting room');
  await b.shot('01-waiting-room');

  // ——— A whole game with a seed, against the engine ———
  await b.open(`${SITE}/agents/?test&seed=${SEED}`, 2500);
  await b.until(`document.getElementById('btn-empezar')`, 6000);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  ok(await b.until(`/3|2|1/.test(document.querySelector('#cuenta .cuenta-num')?.textContent || '')`, 2500), 'Empezar opens the 3, 2, 1 countdown');
  ok(await b.until(BOARD_READY(15), 9000), 'and then the board of 15 cards');
  const t = await ev(`JSON.stringify(window.__agentes.t)`).then(JSON.parse);
  const expected = generarDia(SEED, 1, { lang: 'es' });
  ok(JSON.stringify(t) === JSON.stringify(expected), `the board is the engine's for the seed (clues ${t.pistas.map(p => `${p.pista} ${p.n}`).join(', ')})`);
  ok(await ev(`[...document.querySelectorAll('#ag-tablero .ag-carta')].map(b => b.textContent).join()`) === t.cartas.map(c => c.w).join(), 'each card shows its word, in grid order');
  const of = (p, type = 'agente') => t.cartas.map((c, i) => ({ ...c, i })).filter(c => c.tipo === type && (p == null || c.p === p)).map(c => c.i);
  const arrives = n => b.until(`(document.querySelector('#ag-pista .ag-palabra')?.textContent || '') === ${JSON.stringify(`${t.pistas[n].pista} · ${t.pistas[n].n}`)}`, 4000);
  ok(await arrives(0) && /Pista 1 de 4/.test(await text('#ag-pista .ag-de')), `clue 1 of 4 is ${t.pistas[0].pista} · ${t.pistas[0].n}, decoded`);
  ok(/⏭️ Siguiente pista/.test(await text('#btn-pasar')), 'the button passes to the next clue');
  ok(await ev(`(()=>{window.scrollTo(0,0);return document.getElementById('btn-pasar').getBoundingClientRect().bottom <= innerHeight})()`), 'at 375 × 812 the board and its button are seen without scrolling');
  await b.shot('02-board');

  // Marks: a long press marks 📌, another 🚫, another removes it; a 🚫 is not turned over by a tap
  ok(await ev(`!document.getElementById('ag-ayuda').hidden`), 'the board says how to mark');
  const m = of(null, 'neutral')[1];
  await longPress(m);
  ok(/marca-sospecha/.test(await cls(m)) && !/neutral/.test(await cls(m)), 'a long press marks 📌 without turning the card over');
  ok(/Marcada, sin destapar/.test(await notice()) && await ev(`document.getElementById('ag-ayuda').hidden`), 'it says so, and the help line goes away');
  await longPress(m);
  ok(/marca-descarte/.test(await cls(m)), 'another long press turns it into 🚫');
  await tap(m);
  ok(!/neutral/.test(await cls(m)) && /Descartada: mantenla apretada/.test(await notice()), 'a 🚫 is not turned over by a tap');
  await longPress(m);
  ok(!/marca-/.test(await cls(m)), 'and another long press leaves it unmarked');
  await longPress(m); await longPress(m);   // 🚫 until the end, so nothing below turns it over
  await b.shot('03-marks');

  // Clue 1: one of its agents, one of clue 3 (scores, does not cut) and the assassin (cuts)
  await tap(of(0)[0]);
  ok(/Es de los tuyos/.test(await notice()) && /\bg0\b/.test(await cls(of(0)[0])), 'an agent of the clue scores and takes its color');
  await tap(of(2)[0]);
  ok(/de otra pista: igual suma/.test(await notice()) && !await stamp() && /Te falta|Te faltan/.test(await text('#ag-pista .ag-falta')), 'an agent of another clue scores without cutting the clue');
  await tap(of(null, 'asesino')[0]);
  ok(/¡El asesino! −40/.test(await notice()) && await stamp() === 'Cortada', 'the assassin cuts the clue: the Cortada stamp');
  ok(/💀/.test(await text(`#ag-tablero .ag-carta[data-i="${of(null, 'asesino')[0]}"]`)), 'and turns over with its 💀');
  await b.shot('04-cut');
  ok(await arrives(1), 'the next clue comes in');
  // Clue 2: all its agents complete it
  for (const i of of(1)) await tap(i);
  ok(await stamp() === 'Completa', 'completing the clue gives it the Completa stamp');
  ok(await arrives(2), 'and the next one comes in');
  // Clue 3: one of its agents was found in clue 1, so the rest complete it
  for (const i of of(2).slice(1)) await tap(i);
  ok(await arrives(3), 'an agent found earlier counts for its clue: with the rest it is complete');
  // Clue 4, the last: one of its agents, then Terminar asks first
  await tap(of(3)[0]);
  ok(/🏁 Terminar/.test(await text('#btn-pasar')), 'on the last clue the button says Terminar');
  await ev(`document.getElementById('btn-pasar').click(); 1`); await sleep(200);
  const now = estado(t, await ev(`JSON.stringify(window.__agentes.P.jugadas)`).then(JSON.parse)), left = now.total - now.encontrados;
  ok(/Sí, terminar/.test(await text('#btn-pasar')) && new RegExp(left === 1 ? 'Queda 1 agente' : `Quedan ${left} agentes`).test(await notice()) && !await stamp(),
    `its first tap says ${left} agent(s) are left and asks`);
  await b.shot('05-finish-armed');
  await ev(`document.getElementById('btn-pasar').click(); 1`);
  ok(await b.until(`document.querySelectorAll('#ag-tablero .ag-carta.sin-tocar').length > 0`, 3000), 'the second ends it: the cards nobody touched turn over');
  const clock = await ev(`document.querySelector('#jugar-head').reloj?.() ?? null`);
  ok(await b.until(`!!document.getElementById('btn-fin')`, 6000), 'then «Ver resultado»');
  ok(await ev(`document.querySelector('#jugar-head').reloj?.() ?? null`) === clock, `La Copa's clock stopped when the board ended (${clock})`);
  ok(/Te descubrió el asesino/.test(await text('#ag-sello-fin')), 'with the assassin touched, the end stamp is «Te descubrió el asesino»');
  const assassin = t.cartas.find(c => c.tipo === 'asesino');
  const trap = await text('#ag-trampa');
  ok(/Caíste con/.test(trap) && trap.includes(assassin.w) && trap.includes(t.pistas[assassin.tienta].pista), `the trap is explained: ${trap}`);
  ok(await ev(`[...document.querySelectorAll('#ag-tablero .ag-carta.asesino .ag-de-pista')].map(x => x.textContent).join()`) === `≈ ${t.pistas[assassin.tienta].pista}`, 'and under the assassin, the clue it looked like');
  ok(await ev(`document.querySelectorAll('#ag-tablero .ag-de-pista').length`) === 15, 'every card says its clue');
  ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll at the end, not even while the stamp drops in');
  await b.shot('06-end');
  const moves = await ev(`JSON.stringify(window.__agentes.P.jugadas)`).then(JSON.parse);
  const e = estado(t, moves), score = puntaje(e);
  await ev(`document.getElementById('btn-fin').click(); 1`);
  ok(await b.until(`document.querySelector('#resultado-body .score-big')`, 4000), 'the result screen arrives');
  ok(await text('#resultado-body .score-big') === `${score}/100`, `the result is the engine's: ${score}/100 (${e.encontrados} of ${e.total}, the assassin)`);
  const bd = await text('#explicacion');
  ok(bd.includes(`Encontraste ${e.encontrados} de ${e.total} agentes: +${base(e)}`) && bd.includes(`Tocaste al asesino: −${RESTA_ASESINO}`) && !/neutral/.test(bd), 'the breakdown: the agents found and the assassin, no neutral');
  ok((await text('#resultado-body pre.tarjeta')).trim() === tarjeta(t, e), 'the share card is the engine\'s, one square per card');
  await b.shot('07-result');

  // ——— Resuming (a cup day reloaded): the screen rebuilds the game from its moves and marks ———
  const resumed = await ev(`(async()=>{
    const ui=await import('/cup/games/agents/ui.js'); const { LOCALES }=await import('/cup/rules.js');
    const fmt=(s,o={})=>String(s).replace(/\\{(\\w+)\\}/g,(_,k)=>o[k]??''); const noop=()=>{};
    const t=${JSON.stringify(t)};
    const raiz=document.createElement('div'); document.body.append(raiz);
    ui.montar(raiz, { p:t, jugadas:{ jugadas:[{i:${of(0)[0]}},{pasar:true}], marcas:{ ${of(null, 'neutral')[0]}:'sospecha' }, marcadas:1 }, T:LOCALES.es, fmt, SFX:new Proxy({},{get:()=>noop}), vibrate:noop,
      guardar:noop, pararReloj:noop, terminar:noop });
    await new Promise(r=>setTimeout(r,1200));
    const r={ palabra: raiz.querySelector('.ag-palabra')?.textContent, de: raiz.querySelector('.ag-de')?.textContent,
      agente: raiz.querySelector('.ag-carta[data-i="${of(0)[0]}"]').className, marca: raiz.querySelector('.ag-carta[data-i="${of(null, 'neutral')[0]}"]').className,
      ayuda: raiz.querySelector('#ag-ayuda')?.hidden };
    raiz.remove(); return JSON.stringify(r); })()`).then(JSON.parse);
  ok(resumed.palabra === `${t.pistas[1].pista} · ${t.pistas[1].n}` && /Pista 2 de 4/.test(resumed.de), 'a game resumes at its clue (the first passed)');
  ok(/agente/.test(resumed.agente) && /marca-sospecha/.test(resumed.marca) && resumed.ayuda, 'with its agent found, its 📌 mark and no help line');
  ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);

  // ——— La Copa's practice plays the same screen, and its trial is 2 clues ———
  ok(await start(`${SITE}/cup/?practice=agents&test`), 'La Copa\'s practice (/cup/?practice=agents) plays it');
  ok(/Pista 1 de 4/.test(await text('#ag-pista .ag-de')), 'from clue 1 of 4');
  await b.open(`${SITE}/cup/?practice=agents&test&labs`, 2500);
  ok(await b.until(`document.getElementById('btn-ensayo')`, 6000), 'the practice offers the trial session');
  await ev(`document.getElementById('btn-ensayo').click(); 1`);
  ok(await b.until(BOARD_READY(7), 9000) && await b.until(`/Pista 1 de 2/.test(document.querySelector('#ag-pista .ag-de')?.textContent || '')`, 3000), 'the trial is 2 clues on 7 cards');
  const tt = await ev(`JSON.stringify(window.__agentes.t)`).then(JSON.parse);
  for (const p of [0, 1]) {
    await b.until(`/Pista ${p + 1} de 2/.test(document.querySelector('#ag-pista .ag-de')?.textContent || '')`, 4000);
    for (const [i, c] of tt.cartas.entries()) if (c.tipo === 'agente' && c.p === p) await tap(i);
  }
  ok(await b.until(`document.getElementById('btn-fin')`, 6000) && /Terminar la prueba/.test(await text('#btn-fin')), 'and it ends with «Terminar la prueba»');
  ok(/Misión cumplida/.test(await text('#ag-sello-fin')), 'all the agents and no mistake: «¡Misión cumplida!»');
  ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
  b.close();

  // ——— At 320 × 568, in the four languages ———
  b = await launch({ dir: `${OUT}/p320`, out: OUT, width: 320, height: 568 });
  for (const lang of ['es', 'en', 'pt']) {
    await b.open(`${SITE}/agents/?test&lang=${lang}&seed=${SEED}`, 2500);
    await b.until(`document.getElementById('btn-empezar')`, 6000);
    ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `${lang} 320 px: no sideways scroll in the waiting room`);
    if (lang === 'es') await b.shot('08-waiting-room-320');
    await ev(`document.getElementById('btn-empezar').click(); 1`);
    await b.until(BOARD_READY(15), 9000);
    await sleep(900);
    const tl = await ev(`JSON.stringify(window.__agentes.t)`).then(JSON.parse);
    ok(JSON.stringify(tl) === JSON.stringify(generarDia(SEED, 1, { lang })), `${lang}: the board is the engine's in the language's own deck`);
    ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `${lang} 320 px: no sideways scroll in the game`);
    ok(await ev(`[...document.querySelectorAll('#ag-tablero .ag-carta')].every(c => c.scrollWidth <= c.clientWidth + 1)`), `${lang} 320 px: every word fits in its card`);
    await b.shot(`09-game-320-${lang}`);
  }
  // With reduced motion (C-8): the drawing stays solved from the start
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await b.open(`${SITE}/agents/?test`, 2500);
  await b.until(`document.getElementById('btn-empezar')`, 6000);
  const still = () => ev(`[...document.querySelectorAll('.ag-demo .ag-dc')].map(n => n.className + n.textContent).join()`);
  const s0 = await still(); await sleep(2000);
  ok(await ev(`document.querySelectorAll('.ag-demo .ag-dc.agente').length === 3`) && await still() === s0, 'reduced motion: the drawing stays solved');
  ok(!b.errors.length, `no errors on the page at 320 px ${JSON.stringify(b.errors)}`);
} finally {
  b.close();
}
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ agentes');

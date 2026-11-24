// The new-duel sheet of Duels (lab flag rivals): it opens straight on the quick duel, with 🛠️ the custom
// duel as a link under its button; the custom duel first picks how to win (most rounds won, most points),
// then how many rounds: odd for rounds won (3–9), any for points (2–9); its last step, each round's game, and
// 🎲 Mix rolling the rounds with La Copa's slot machine (D-425, assets/js/slot-roll.js): the real draw
// is painted underneath at once, every row spins through duel games, they stop on their own top to
// bottom, each row keeps its height meanwhile, a tap during the roll acts on the real game, and with
// reduced motion nothing spins. At 390 and 320 px: no sideways scroll. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = output('/tmp/duels-create');
mkdirSync(OUT, { recursive: true });
const b = await launch({ dir: `${OUT}/profile`, out: OUT, width: 390, height: 844, clock: true });
const SITE = process.env.SITE || 'http://localhost:8765';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const click = sel => ev(`(()=>{const x=document.querySelector(${JSON.stringify(sel)});if(!x)return 'missing';if(x.disabled)return 'disabled';x.click();return 'ok'})()`);
const rows = () => ev(`JSON.stringify([...document.querySelectorAll('.dl-ronda')].map(r=>r.querySelector('b').textContent))`).then(JSON.parse);

async function toRounds() {
  await b.go(`${SITE}/duels/`, 1500);
  await b.until(`!!document.getElementById('dl-medida')`, 6000);
  await click('#dl-medida');
  await b.until(`!!document.querySelector('#dl-rivales .chip-btn')`, 6000);
  await click('#dl-rivales .chip-btn');
  await click('#dl-siguiente'); await sleep(200);
  await click('#dl-rondas [data-n="5"]'); await sleep(100);
  await click('#dl-siguiente');
  await b.until(`document.querySelectorAll('.dl-ronda').length === 5`, 3000);
}

try {
  await b.go(`${SITE}/duels/`, 1500);
  await ev(`localStorage.clear(); sessionStorage.clear(); 1`);
  await ev(`import('/assets/js/jugador.js').then(async ({ jugador }) => { const J = await jugador(); await J.crear('Cata', '1111'); await J.anotar({ juego: 'reinas', s: 90, ms: 50000 }); J.salir(); await J.crear('Javi', '1234'); return 1; })`);
  // The entry point: the quick duel at once, the custom one a link right under its button
  await b.go(`${SITE}/duels/`, 1500);
  await b.until(`!!document.getElementById('dl-enviar')`, 6000);
  ok(await ev(`!!document.querySelector('#dl-hoja [data-v="bo3"]') && !!document.querySelector('#dl-hoja .dl-juego')`), 'the sheet opens on the quick duel: format and game');
  ok(await ev(`document.getElementById('dl-enviar').nextElementSibling?.id === 'dl-medida'`), '🛠️ the custom duel is the link right under the button');
  await b.shot('quick-390');
  await click('#dl-medida');
  await b.until(`!!document.querySelector('#dl-rivales .chip-btn')`, 6000);
  await click('#dl-rivales .chip-btn');
  // A size change eases instead of jumping: the sheet animates its height and the new step fades in
  const anim = () => ev(`JSON.stringify([...['#dl-hoja .hoja', '#dl-hoja .dl-sheet'].map(q => document.querySelector(q).getAnimations().filter(a => !(a instanceof CSSAnimation)).length)])`).then(JSON.parse);
  await click('#dl-siguiente');
  const [hAnim, fAnim] = await anim();
  ok(hAnim > 0 && fAnim > 0, `step 1 → 2: the sheet eases to its new height and the step fades in (${hAnim}, ${fAnim})`);
  await sleep(350);
  ok((await anim()).every(n => n === 0), 'and the animations end in a moment');
  const nums = () => ev(`JSON.stringify([...document.querySelectorAll('#dl-rondas [data-n]')].map(x=>x.textContent))`);
  ok(await ev(`document.querySelector('[data-modo="bo"]').classList.contains('on')`), 'how to win comes first: most rounds won by default');
  ok(await nums() === '["3","5","7","9"]', 'most rounds won: 3, 5, 7 or 9 rounds');
  await click('#dl-rondas [data-n="7"]'); await sleep(100);
  ok(/4 de 7/.test(await ev(`document.getElementById('dl-rondas').textContent`)), 'seven rounds: whoever wins 4 of 7');
  await click('[data-modo="pts"]'); await sleep(100);
  ok(await nums() === '["2","3","4","5","6","7","8","9"]', 'most points: any number, 2 to 9');
  await click('#dl-rondas [data-n="6"]'); await sleep(100);
  ok(/6 rondas/.test(await ev(`document.getElementById('dl-rondas').textContent`)), 'most points in six rounds');
  await b.shot('points-390');
  await click('[data-modo="bo"]'); await sleep(100);
  ok(await ev(`document.querySelector('#dl-rondas .on')?.dataset.n`) === '7', 'back to rounds won, six becomes seven (odd)');
  await b.shot('best-of-390');
  await click('#dl-siguiente');
  await b.until(`document.querySelectorAll('.dl-ronda').length === 7`, 3000);
  ok(await ev(`document.querySelectorAll('.dl-ronda').length`) === 7, 'best of 7: seven rounds to set');
  await click('#dl-rapido'); await sleep(200);
  ok(await ev(`!!document.querySelector('#dl-hoja .dl-juego') && document.querySelector('#dl-hoja [data-v="bo3"]').classList.contains('on')`), '⚡ back to the quick duel, at best of 3');

  for (const W of [390, 320]) {
    await b.resize(W, 844);
    await toRounds();
    ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: the rounds' step, no sideways scroll`);
    await b.shot(`rounds-${W}`);
  }

  // 🎲 Mix: every row spins, the rows land one after the other, on the rounds drawn
  await click('#dl-mezclar'); await sleep(40);
  const spinning = await ev(`document.querySelectorAll('.dl-ronda.slot-spin').length`);
  ok(spinning === 5, `pressing 🎲 Mix, the five rows spin (${spinning})`);
  ok(await ev(`[...document.querySelectorAll('.dl-ronda.slot-spin')].every(r=>r.style.height===r.offsetHeight+'px')`), 'each row keeps its height while it spins');
  ok(await ev(`[...document.querySelectorAll('.dl-ronda.slot-spin b')].every(x=>getComputedStyle(x).whiteSpace==='nowrap')`), 'a spinning name is cut on one line');
  // Sampled in the page every 20 ms until all are still: the rows stop in order, top first
  const trace = await ev(`new Promise(res=>{const t0=performance.now(),out=[];const id=setInterval(()=>{const st=[...document.querySelectorAll('.dl-ronda')].map(r=>r.classList.contains('slot-spin'));out.push(st);if(st.every(x=>!x)||performance.now()-t0>1500){clearInterval(id);res(JSON.stringify({out,ms:Math.round(performance.now()-t0)}))}},20)})`).then(JSON.parse);
  const ordered = trace.out.every(st => st.every((sp, i) => !sp || st.slice(i).every(Boolean)));
  const partial = trace.out.some(st => st.some(Boolean) && st.some(x => !x));
  ok(ordered && partial, `they land one after the other, top to bottom (all still by ~${trace.ms + 40} ms)`);
  await sleep(700);
  const still = await ev(`!document.querySelector('.slot-spin')`);
  const names = await rows();
  const real = await ev(`(async()=>{const {DUEL_GAMES}=await import('/assets/js/duels-ui.js');return JSON.stringify(DUEL_GAMES.map(g=>g.id))})()`).then(JSON.parse);
  ok(still && names.length === 5 && new Set(names).size === 5, `in under a second every row is still, five different games (${names.join(', ')})`);
  ok(real.length > 5, `the pool is the duel games (${real.length})`);
  await b.shot('mix-landed-320');

  await click('#dl-mezclar'); await sleep(40);
  await b.shot('mix-spinning-320');
  await sleep(900);
  // A tap during the roll acts on the real game: the row opens to change that round
  await click('#dl-mezclar'); await sleep(60);
  await click('.dl-ronda[data-ronda="4"]'); await sleep(100);
  ok(await ev(`!!document.querySelector('.dl-ronda.on[data-ronda="4"]') && !document.querySelector('.slot-spin')`), 'a tap during the roll opens that round, and the roll stops');

  // Reduced motion: nothing spins
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await sleep(400);   // the last tap's easing ends first
  await click('#dl-mezclar'); await sleep(40);
  ok(await ev(`!document.querySelector('.slot-spin')`), 'with reduced motion, 🎲 Mix draws without a roll');
  await click('.dl-ronda[data-ronda="0"]'); await sleep(40);
  ok(await ev(`document.querySelector('#dl-hoja .hoja').getAnimations().filter(a => !(a instanceof CSSAnimation)).length === 0`), 'with reduced motion, the sheet changes size without easing');
} catch (e) {
  console.log('✗', e.message); process.exitCode = 1;
} finally {
  await b.close();
}

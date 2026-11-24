// The new-duel sheet of Duels (lab flag rivals): a custom duel's last step, each round's game, and
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
  await click('.dl-modo[data-f="bo5"]'); await sleep(100);
  await click('#dl-siguiente');
  await b.until(`document.querySelectorAll('.dl-ronda').length === 5`, 3000);
}

try {
  await b.go(`${SITE}/duels/`, 1500);
  await ev(`localStorage.clear(); sessionStorage.clear(); 1`);
  await ev(`import('/assets/js/jugador.js').then(async ({ jugador }) => { const J = await jugador(); await J.crear('Cata', '1111'); await J.anotar({ juego: 'reinas', s: 90, ms: 50000 }); J.salir(); await J.crear('Javi', '1234'); return 1; })`);
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
  await click('#dl-mezclar'); await sleep(40);
  ok(await ev(`!document.querySelector('.slot-spin')`), 'with reduced motion, 🎲 Mix draws without a roll');
} catch (e) {
  console.log('✗', e.message); process.exitCode = 1;
} finally {
  await b.close();
}

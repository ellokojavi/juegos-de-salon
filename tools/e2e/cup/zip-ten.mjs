// Zip with all ten levels solved (D-250): the game ends before the clock, with 100 points,
// with no countdown or solution in view, and the measured time stays still.
//
// Usage: python3 -m http.server 8765 -d public (in another terminal) and node tools/e2e/cup/zip-ten.mjs <output-folder>
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = output('/tmp/zip-ten');
mkdirSync(OUT, { recursive: true });
const b = await launch({ port: Number(process.env.CDP_PORT) || 9391, dir: `${OUT}/profile`, out: OUT });
const SITE = process.env.SITE || 'http://localhost:8765';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const SEED = 'KQRST';

try {
  await b.go(`${SITE}/cup/?practice=zip&test&labs&seed=${SEED}`, 1200);
  for (let w = 0; w < 30 && !await ev(`!!document.getElementById('btn-empezar')`); w++) await sleep(200);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  for (let w = 0; w < 80 && !await ev(`!!document.querySelector('.zip-grid .zc')`); w++) await sleep(100);
  for (let w = 0; w < 80 && !await ev(`!document.getElementById('cuenta') || document.getElementById('cuenta').classList.contains('ya')`); w++) await sleep(100);
  ok(/de 10/.test(await ev(`document.querySelector('.zip-nivel')?.textContent || ''`)), 'Zip: the header says how many levels there are ("Nivel 1 de 10")');

  // All ten levels, each with its solution, step by step as the keyboard does it
  for (let k = 0; k < 10; k++) {
    const done = await ev(`(async()=>{const m=await import('/cup/games/zip/engine.js');const p=m.nivel('${SEED}',1,${k});
      const g=document.querySelector('.zip-grid');if(g.children.length-1!==p.n*p.n)return false;
      for(const i of p.sol)g.querySelector('.zc[data-i="'+i+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0}));return true})()`);
    if (!done) { ok(false, `Zip: level ${k + 1} appears on the grid`); break; }
    if (k === 8) await b.shot('zip-level-9');
    await sleep(k < 9 ? 650 : 300);
  }
  const end = await ev(`JSON.stringify({notice:document.querySelector('.zip-aviso')?.textContent||'',button:!!document.getElementById('btn-fin'),
    timer:!!document.querySelector('.zip-reloj'),solution:document.querySelector('.zip-grid').classList.contains('solucion'),clock:document.querySelector('#jugar-head').reloj?.()})`).then(JSON.parse);
  ok(/10 niveles/.test(end.notice) && end.button, `Zip: with all ten solved it ends before the clock and says so (${end.notice})`);
  ok(!/null|undefined/.test(end.notice), 'Zip: the final notice carries no extra text');
  ok(!end.timer && !end.solution, 'Zip: at the end there is no countdown and no "así se resolvía"');
  await sleep(1500);
  ok(await ev(`document.querySelector('#jugar-head').reloj?.()`) === end.clock, `Zip: the measured time stays still at ${end.clock}`);
  await b.shot('zip-ten');

  await ev(`document.getElementById('btn-fin').click(); 1`); await sleep(800);
  const result = await ev(`document.querySelector('.screen.active')?.textContent || ''`);
  ok(/100/.test(result), 'Zip: the result gives 100 points for the ten levels');
  await b.shot('zip-ten-result');
} finally {
  await b.close();
}

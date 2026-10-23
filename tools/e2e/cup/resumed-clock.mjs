// La Copa, a day resumed where its save is missing (D-433, lab): the `resumed` demo starts the day
// 4 minutes ago on another phone; «Seguir jugando» goes on with the clock from there and says so.
// Without `&lab` (the scripts' default in the test store) the clock starts at zero, as before.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { LOCALES } from '../../../public/cup/rules.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const T = LOCALES.es;
const b = await launch({ dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };
const seconds = t => { const [m, s] = String(t || '').split(':').map(Number); return m * 60 + s; };

for (const lab of [true, false]) {
  await b.go(`${SITE}/cup/?test${lab ? '&lab' : ''}&demo=resumed`, 2500);
  if (lab) ok(/&lab/.test(await ev('location.search')), 'the demo keeps &lab in the address');
  ok(await waitFor(`[...document.querySelectorAll('button[data-dia]')].some(x => x.textContent.includes(${JSON.stringify(T.resume)}))`), `${lab ? 'lab' : 'no lab'}: the day started elsewhere offers «${T.resume}»`);
  await ev(`[...document.querySelectorAll('button[data-dia]')].find(x => x.textContent.includes(${JSON.stringify(T.resume)})).click(); 1`);
  await waitFor(`!!document.getElementById('jugar-head')?.reloj && !document.getElementById('cuenta')`, 40);
  const t = seconds(await ev(`document.getElementById('jugar-head').reloj()`));
  const notice = await ev(`document.getElementById('aviso-otro-celular')?.textContent || ''`);
  if (lab) {
    ok(t >= 235 && t < 300, `the clock goes on from the start, about 4:00 (${t} s)`);
    ok(notice === T.resumedElsewhere, `and the screen says so ("${notice}")`);
    await b.shot('resumed-lab');
  } else {
    ok(t < 30, `without the lab, the clock starts at zero as before (${t} s)`);
    ok(!notice, 'and says nothing');
  }
}
b.close();

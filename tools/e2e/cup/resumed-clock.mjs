// La Copa, a day resumed where its save is missing (D-433): the `resumed` demo starts the day 4
// minutes ago on another phone; «Seguir jugando» goes on with the clock from there and says so.
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

await b.go(`${SITE}/cup/?test&demo=resumed`, 2500);
ok(await waitFor(`[...document.querySelectorAll('button[data-dia]')].some(x => x.textContent.includes(${JSON.stringify(T.resume)}))`), `the day started elsewhere offers «${T.resume}»`);
await ev(`[...document.querySelectorAll('button[data-dia]')].find(x => x.textContent.includes(${JSON.stringify(T.resume)})).click(); 1`);
await waitFor(`!!document.getElementById('jugar-head')?.reloj && !document.getElementById('cuenta')`, 40);
const t = seconds(await ev(`document.getElementById('jugar-head').reloj()`));
const notice = await ev(`document.getElementById('aviso-otro-celular')?.textContent || ''`);
ok(t >= 235 && t < 300, `the clock goes on from the start, about 4:00 (${t} s)`);
ok(notice === T.resumedElsewhere, `and the screen says so ("${notice}")`);
await b.shot('resumed');
b.close();

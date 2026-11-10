// La Copa's board ends with the site footer (U-38): «Report a problem» and «Leave this cup» are its
// tiles, with no general inbox and no loose links under the board; the leave tile still asks first.
// Runs with the lab flag `cup-footer` on: localhost holds the lab key.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { LOCALES } from '../../../public/cup/rules.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const b = await launch({ dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };

for (const lang of ['es', 'en', 'pt']) {
  const T = LOCALES[lang];
  await b.go(`${SITE}/cup/?test&demo=player&lang=${lang}`, 2000);
  ok(await waitFor(`!!document.querySelector('#screen-tablero .pie-sitio .tiles')`), `${lang}: the board ends with the site footer, as tiles`);
  const f = await ev(`(()=>{const s=document.querySelector('#screen-tablero .pie-sitio');const t=[...s.querySelectorAll('.footer-links > *')].map(x=>x.textContent.replace(/\\s+/g,' ').trim());
    return {t, last: s.parentElement.lastElementChild===s, inbox: !!s.querySelector('.op-buzon'), loose: document.querySelectorAll('#screen-tablero .link-btn:not(.pie-sitio *)').length, wide: document.documentElement.scrollWidth>innerWidth}})()`);
  const label = k => T[k].split(' ').slice(1).join(' ');
  ok(f.t.some(x => x.endsWith(label('reportTile'))) && f.t.some(x => x.endsWith(label('leaveTile'))), `${lang}: report and leave are tiles (${f.t.join(' | ')})`);
  ok(f.last && !f.inbox && f.loose === 0, `${lang}: the footer is last, no general inbox, no loose links`);
  ok(!f.wide, `${lang}: no sideways scroll`);
}
// Leaving still asks first; dismissing keeps the player in the cup
await ev(`window.confirm=()=>false; document.getElementById('btn-salir-copa').click()`);
await sleep(300);
ok(await ev(`document.getElementById('screen-tablero').classList.contains('active')`), 'leave asks first, and «Cancel» stays on the board');
await ev(`document.getElementById('btn-salir-copa').scrollIntoView({block:'center'})`);
await b.shot('cup-footer');
await b.close();

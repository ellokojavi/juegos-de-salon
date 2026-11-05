// The design system's components page (D-533, phase 3 of #1188) at /labs/design/: the lab offers
// it among the active projects; it reads the tokens from base.css (swatches, the three scales), shows
// every section (titles, buttons, chips, ranking, keyboard, escapes), nothing scrolls sideways at
// 320 px and every tappable thing measures 44 px or more (U-10). Its own stylesheet is layout only:
// the design lint reports zero on it. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { execFileSync } from 'node:child_process';

const OUT = output('/tmp/design-page');
const SITE = process.env.SITE || 'http://localhost:8765';
const ev = e => b.evaluate(e);
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 6000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };

const lint = execFileSync('node', ['tools/agents/design-lint.mjs', 'public/labs/design/style.css'], { encoding: 'utf8' });
ok(/^0 hits/m.test(lint), 'the page\'s own stylesheet has zero design-lint hits (layout only, on the tokens)');

for (const W of [320, 390]) {
  var b = await launch({ dir: `${OUT}/p${W}`, out: OUT, width: W, height: W === 320 ? 640 : 844 });
  await b.go(`${SITE}/labs/`);
  ok(await ev(`document.querySelector('#activos #seccion-design #btn-design')?.getAttribute('href')`) === 'design/', `${W}: the lab offers the design system among the active projects`);
  ok(await ev(`document.querySelector('#btn-design').getBoundingClientRect().height <= 64`), `${W}: the lab card's button label sits on one line (U-17)`);
  await b.go(`${SITE}/labs/design/`, 800);
  ok(await waitFor(`(window.__design?.tokens || 0) > 30`), `${W}: the tokens are read from base.css`);
  ok(await ev(`document.querySelectorAll('#ds-muestras .ds-muestra').length`) >= 16, `${W}: the colour swatches are drawn`);
  ok(await ev(`document.querySelectorAll('#ds-escala-espacio .ds-paso').length`) >= 12 && await ev(`document.querySelectorAll('#ds-escala-esquinas .ds-paso').length`) >= 7 && await ev(`document.querySelectorAll('#ds-escala-texto .ds-paso').length`) >= 9, `${W}: the three scales are drawn`);
  for (const id of ['ds-tipografia', 'ds-botones', 'ds-fichas', 'ds-ranking', 'ds-teclado', 'ds-escapes']) ok(await ev(`!!document.getElementById('${id}')?.offsetHeight`), `${W}: section #${id} shows`);
  ok(await ev(`!!document.querySelector('#ds-ranking .rk-seg button.on') && !!document.querySelector('#ds-ranking .rk-campo input.rk-pin') && !!document.querySelector('#ds-teclado .keypad .del')`), `${W}: the ranking tabs, the sign-in fields and the ⌫ key show`);
  ok(await ev(`[...document.querySelectorAll('.btn')].every(x => x.getBoundingClientRect().height <= 64)`), `${W}: no button label wraps (U-17)`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: no sideways scroll`);
  // `.back` (the topbar's link, 40 px tall in base.css) is the system's own debt, noted in DESIGN.md; #tr-tab is not the page's
  const small = await ev(`[...document.querySelectorAll('button, a.btn, .keypad button')].filter(x => x.offsetHeight && x.id !== 'tr-tab' && (x.getBoundingClientRect().height < 44 || x.getBoundingClientRect().width < 44)).map(x => x.className || x.tagName).join(', ')`);
  ok(!small, `${W}: every tappable thing is 44 px or more${small ? ` (${small})` : ''}`);
  ok(await ev(`[...document.querySelectorAll('.btn')].every(x => x.scrollWidth <= x.clientWidth + 1)`), `${W}: every button label fits (U-17)`);
  await b.shot(`design-${W}`);
  await b.close();
}
console.log(failures ? `✗ design page: ${failures} failure(s)` : '✓ design page');
process.exit(failures ? 1 : 0);

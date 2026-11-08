// The design system's components page (D-533, phase 3 of #1188) at /labs/design/: the lab offers
// it in La Bodega's Mejoras lanzadas; it reads the tokens from base.css (swatches, the three scales), shows
// every section (titles, buttons, chips, the game shell, ranking, keyboard, escapes), nothing scrolls sideways at
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
  ok(await ev(`document.querySelector('#bodega-mejoras #seccion-design #btn-design')?.getAttribute('href')`) === 'design/', `${W}: the lab offers the design system in La Bodega (Mejoras lanzadas)`);
  ok(await ev(`document.querySelector('#btn-design').getBoundingClientRect().height <= 64`), `${W}: the lab card's button label sits on one line (U-17)`);
  await b.go(`${SITE}/labs/design/`, 800);
  ok(await waitFor(`(window.__design?.tokens || 0) > 30`), `${W}: the tokens are read from base.css`);
  ok(await ev(`document.querySelectorAll('#ds-muestras .ds-muestra').length`) >= 16, `${W}: the colour swatches are drawn`);
  ok(await ev(`document.querySelectorAll('#ds-escala-espacio .ds-paso').length`) >= 12 && await ev(`document.querySelectorAll('#ds-escala-esquinas .ds-paso').length`) >= 7 && await ev(`document.querySelectorAll('#ds-escala-texto .ds-paso').length`) >= 9, `${W}: the three scales are drawn`);
  for (const id of ['ds-tipografia', 'ds-botones', 'ds-fichas', 'ds-armazon', 'ds-ranking', 'ds-teclado', 'ds-pantallas', 'ds-escapes']) ok(await ev(`!!document.getElementById('${id}')?.offsetHeight`), `${W}: section #${id} shows`);
  ok(await ev(`!!document.querySelector('#ds-ranking .rk-seg button.on') && !!document.querySelector('#ds-ranking .rk-campo input.rk-pin') && !!document.querySelector('#ds-teclado .keypad .del')`), `${W}: the ranking tabs, the sign-in fields and the ⌫ key show`);
  // Phase 3b (#1200): each full-screen piece drawn inside its phone frame, pinned there and not to the window
  const marcos = await ev(`JSON.stringify(window.__design.marcos)`).then(JSON.parse);
  const esperadas = ['handoff-bien', 'handoff-mal', 'cover', 'cuenta', 'hoja', 'chat-burbuja', 'chat-hoja', 'azar', 'uad', 'pie'];
  ok(esperadas.every(p => marcos.some(m => m.pieza === p)), `${W}: the ten full-screen pieces have their frame`);
  const malos = marcos.filter(m => !m.dibuja || !m.dentro).map(m => m.pieza).join(', ');
  ok(!malos, `${W}: every frame draws its piece inside it${malos ? ` (${malos})` : ''}`);
  ok(await ev(`[...document.querySelectorAll('.ds-telefono .ds-marco')].every(x => getComputedStyle(x).position === 'absolute')`), `${W}: .ds-marco pins each overlay to its frame, not the window`);
  ok(await ev(`[...document.querySelectorAll('.ds-telefono')].every(f => f.scrollWidth <= f.clientWidth + 1)`), `${W}: nothing in a frame is wider than it`);
  ok(await ev(`!!document.querySelector('[data-pieza="chat-hoja"] .chat-panel')?.offsetHeight && !!document.querySelector('[data-pieza="hoja"] .hoja')?.offsetHeight && !!document.querySelector('[data-pieza="cover"] .big')?.offsetHeight`), `${W}: the sheets are open and the cover says who gets the phone`);
  ok(await ev(`[...document.querySelectorAll('.btn')].every(x => x.getBoundingClientRect().height <= 64)`), `${W}: no button label wraps (U-17)`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: no sideways scroll`);
  // the tap area is the box, or its invisible ::before band when it has one (`.back`, `.switch` and the folding panel's summary, U-10); #tr-tab is not the page's
  const small = await ev(`[...document.querySelectorAll('button, a.btn, .topbar .back, .keypad button, details.panel > summary')].filter(x => {
    if (!x.offsetHeight || x.id === 'tr-tab') return false;
    const r = x.getBoundingClientRect(), c = getComputedStyle(x), p = getComputedStyle(x, '::before');
    let h = r.height, w = r.width;
    if (p.content !== 'none' && p.position === 'absolute') {
      h = Math.max(h, r.height - parseFloat(c.borderTopWidth) - parseFloat(c.borderBottomWidth) - parseFloat(p.top) - parseFloat(p.bottom));
      w = Math.max(w, r.width - parseFloat(c.borderLeftWidth) - parseFloat(c.borderRightWidth) - parseFloat(p.left) - parseFloat(p.right));
    }
    return h < 43.5 || w < 43.5;
  }).map(x => x.className || x.tagName).join(', ')`);
  ok(!small, `${W}: every tappable thing is 44 px or more${small ? ` (${small})` : ''}`);
  ok(await ev(`[...document.querySelectorAll('.btn')].every(x => x.scrollWidth <= x.clientWidth + 1)`), `${W}: every button label fits (U-17)`);
  await b.shot(`design-${W}`);
  await b.close();
}
console.log(failures ? `✗ design page: ${failures} failure(s)` : '✓ design page');
process.exit(failures ? 1 : 0);

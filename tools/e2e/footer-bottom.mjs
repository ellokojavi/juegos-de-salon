// Nothing under the footer (DESIGN.md §3, the owner 2026-11-21, «esto aplica a toda página»): every page with a footer
// ends in it down to the bottom edge of the screen, never above a band of the page's background. On Android the band is the browser's hidden bar:
// .app is built for the small height (svh, D-77), and the page grows to the large one when the bar hides. Headless
// Chrome has svh == dvh, so this simulates the phone D-77 measured (dvh 1016, svh 960): a TALL screen, the column made
// HIDDEN px shorter than it. A cover taller than the screen has no band to show, hence the tall phone.
// It measures the pixels, not the rule: scrolled to the end, the screen's last row must have the color of the footer's
// own last row. Returns null when it does, else what was found.
import { readFileSync } from 'node:fs';
import { decode } from './png.mjs';
import { SUELTOS } from '../../public/assets/js/games.js';

export const TALL = 1016, HIDDEN = 56;

/** La Copa's games whose cover is measured: the ones out of the lab (a lab one may not have its cover yet). */
export const COVER_GAMES = SUELTOS.filter(g => !g.labs && g.available !== false).map(g => g.slug);

/** The median color of one row of the screenshot, in CSS px (the shot is at 2×). */
const rowColor = (img, y) => {
  const r = Math.min(img.height - 1, Math.max(0, Math.round(y * 2))), ch = [[], [], []];
  for (let x = 0; x < img.width; x += 4) for (let c = 0; c < 3; c++) ch[c].push(img.data[(r * img.width + x) * 4 + c]);
  return ch.map(v => v.sort((a, b) => a - b)[v.length >> 1]);
};

export async function footerGapUnder(b, out, name) {
  await b.resize(390, TALL);
  await b.evaluate(`(() => { const s = document.createElement('style'); s.id = 'hidden-bar'; s.textContent = '.app { min-height: calc(100svh - ${HIDDEN}px - var(--safe-top) - var(--safe-bottom)) !important }'; document.head.append(s); scrollTo(0, document.documentElement.scrollHeight); return 1 })()`);
  const m = JSON.parse(await b.evaluate(`(() => {
    // The page's footer: the lowest one on screen, whatever its kind
    const f = [...document.querySelectorAll('footer')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
      .sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom)[0];
    return JSON.stringify(f ? { bottom: f.getBoundingClientRect().bottom, screen: innerHeight } : null);
  })()`));
  let r = null;
  if (!m) r = 'no footer on the screen';
  else if (m.screen - m.bottom > 1) {
    await b.shot(name);
    const img = decode(readFileSync(`${out}/${name}.png`));
    const a = rowColor(img, m.bottom - 2), z = rowColor(img, m.screen - 1);
    const d = Math.max(...a.map((v, i) => Math.abs(v - z[i])));
    if (d > 16) r = `${Math.round(m.screen - m.bottom)} px under the footer in another color (rgb ${z} against the footer's ${a})`;
  }
  await b.evaluate(`(document.getElementById('hidden-bar').remove(), scrollTo(0, 0), 1)`);
  await b.resize();
  return r;
}

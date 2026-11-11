// Every big splash (`hero`, D-355): its clip is flush with its card on top and both sides, or, on a wide
// short screen, beside the texts and flush with the card's top-left corner; and the whole window fits the screen. The
// owner found the Sudoku clip flush on top with gutters at the sides on a computer (2026-11-11).
// Usage: node tools/e2e/splash/margins.mjs <output-folder>
import { mkdirSync } from 'node:fs';
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { CAMPAIGNS } from '../../../public/assets/js/splash.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output('/tmp/splash-margins');
mkdirSync(OUT, { recursive: true });
const heroes = Object.keys(CAMPAIGNS).filter(id => CAMPAIGNS[id].hero);
// a phone, a short phone, a laptop and a big screen
const SCREENS = [[390, 844], [360, 640], [1280, 720], [1440, 900]];

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
for (const [width, height] of SCREENS) {
  const b = await launch({ port: 9498, dir: `${OUT}/profile-${width}`, out: OUT, width, height });
  for (const id of heroes) {
    await b.open(`${SITE}/?splash=${id}`, 1500);
    await b.settle(600);
    // the window fits itself again once its fonts and clip load (evenHeroMargins): measured after that
    await sleep(700);
    const m = JSON.parse(await b.evaluate(`(() => {
      const media = document.querySelector('.splash--hero .splash-media');
      const item = media?.closest('.splash-item');
      if (!media || !item) return 'null';
      const a = media.getBoundingClientRect(), c = item.getBoundingClientRect();
      const bw = parseFloat(getComputedStyle(item).borderLeftWidth) || 0, bt = parseFloat(getComputedStyle(item).borderTopWidth) || 0;
      return JSON.stringify({ top: a.top - c.top - bt, left: a.left - c.left - bw, right: c.right - bw - a.right, row: getComputedStyle(item).flexDirection === 'row', overflow: item.closest('.splash').scrollHeight - item.closest('.splash').clientHeight });
    })()`));
    if (!m) { ok(false, `${id} at ${width}×${height}: the window did not open`); continue; }
    const r = x => Math.round(x * 10) / 10;
    ok(m.overflow <= 2, `${id} at ${width}×${height}: the whole window fits the screen (${m.overflow} px over)`);
    if (m.row) {
      // a wide, short screen: the clip at the left of the texts, flush with the card's top-left corner
      ok(Math.abs(m.top) <= 1 && Math.abs(m.left) <= 1, `${id} at ${width}×${height}: clip beside the texts, flush top and left (${r(m.top)} / ${r(m.left)} px)`);
      continue;
    }
    ok(Math.abs(m.left - m.right) <= 1, `${id} at ${width}×${height}: as far from the left as from the right (${r(m.left)} / ${r(m.right)} px)`);
    ok(Math.abs(m.top - (m.left + m.right) / 2) <= 1, `${id} at ${width}×${height}: as far from the top as from the sides (${r(m.top)} / ${r(m.left)} px)`);
    if (Math.abs(m.top - m.left) > 1) await b.shot(`${id}-${width}`);
  }
  b.close?.();
}
console.log(failures ? `✗ ${failures} margins uneven` : '✓ every hero clip has even margins');
process.exit(failures ? 1 : 0);

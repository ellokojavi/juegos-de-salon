// Every big splash (`hero`, D-355): its clip sits with the same margin on every side of the card. A clip
// narrower than the card (a short screen, a square clip) has the same gap above it as on each side,
// never flush against the card's top edge; one as wide as the card is flush on all three sides. The
// owner found the Sudoku clip flush on top with gutters at the sides on a computer (2026-11-11).
// Usage: node tools/e2e/splash/margins.mjs <output-folder>
import { mkdirSync } from 'node:fs';
import { output } from '../output.mjs';
import { launch } from '../cdp.mjs';
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
    const m = JSON.parse(await b.evaluate(`(() => {
      const media = document.querySelector('.splash--hero .splash-media');
      const item = media?.closest('.splash-item');
      if (!media || !item) return 'null';
      const a = media.getBoundingClientRect(), c = item.getBoundingClientRect();
      const bw = parseFloat(getComputedStyle(item).borderLeftWidth) || 0, bt = parseFloat(getComputedStyle(item).borderTopWidth) || 0;
      return JSON.stringify({ top: a.top - c.top - bt, left: a.left - c.left - bw, right: c.right - bw - a.right });
    })()`));
    if (!m) { ok(false, `${id} at ${width}×${height}: the window did not open`); continue; }
    const r = x => Math.round(x * 10) / 10;
    ok(Math.abs(m.left - m.right) <= 1, `${id} at ${width}×${height}: as far from the left as from the right (${r(m.left)} / ${r(m.right)} px)`);
    ok(Math.abs(m.top - (m.left + m.right) / 2) <= 1, `${id} at ${width}×${height}: as far from the top as from the sides (${r(m.top)} / ${r(m.left)} px)`);
    if (Math.abs(m.top - m.left) > 1) await b.shot(`${id}-${width}`);
  }
  b.close?.();
}
console.log(failures ? `✗ ${failures} margins uneven` : '✓ every hero clip has even margins');
process.exit(failures ? 1 : 0);

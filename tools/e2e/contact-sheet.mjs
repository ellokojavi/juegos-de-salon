/**
 * Contact sheet: all the README screenshots, together, to look at them before publishing.
 *
 *   node tools/e2e/contact-sheet.mjs                 # one sheet per section
 *   node tools/e2e/contact-sheet.mjs cuarto-rey      # only that section
 *   node tools/e2e/contact-sheet.mjs --out /tmp/contact-sheet
 *
 * Why it exists: the screenshots are redone automatically (`tools/release/readme.py screenshots`),
 * but nobody looks at them one by one, and so a player list frozen mid-animation was published,
 * with the rows at different scales (D-76). Lined up and at the size the README shows them, a
 * different width or a screen that doesn't match its caption jumps out.
 *
 * It doesn't replace the eye: it builds the sheet and leaves it in a PNG. Looking at it is the job.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';

const args = process.argv.slice(2);
const flag = (n, def) => { const i = args.indexOf('--' + n); return i < 0 ? def : args[i + 1]; };
const out = flag('out', '/tmp/contact-sheet');
const requested = args.filter(a => !a.startsWith('--') && a !== out);

const ROOT = new URL('../../', import.meta.url).pathname;
// The catalog's fields (seccion, imagen, pie, toma) are renamed with docs/capturas.json and readme.py
const { capturas: shots } = JSON.parse(readFileSync(`${ROOT}docs/capturas.json`, 'utf8'));
const sections = [...new Set(shots.map(c => c.seccion))].filter(s => !requested.length || requested.includes(s));
if (!sections.length) { console.error(`Unknown sections. There are: ${[...new Set(shots.map(c => c.seccion))].join(', ')}`); process.exit(1); }

mkdirSync(out, { recursive: true });
const CARD_WIDTH = 200;   // the README shows the gallery at 180 px: look at it as it will be seen
const b = await launch({ port: 9461, dir: `${out}/profile`, out, width: 1200, height: 900 });

for (const section of sections) {
  const cards = shots.filter(c => c.seccion === section);
  const html = `<!doctype html><meta charset="utf-8"><style>
    body { margin: 0; padding: 18px; background: #11061f; color: #fff;
           font: 13px -apple-system, system-ui, sans-serif; }
    h1 { font-size: 16px; margin: 0 0 14px; letter-spacing: .04em; text-transform: uppercase; opacity: .8; }
    .sheet { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start; }
    figure { margin: 0; width: ${CARD_WIDTH}px; }
    img { width: 100%; display: block; border-radius: 10px; background: #000; }
    figcaption { margin-top: 6px; opacity: .75; line-height: 1.3; }
    b { display: block; opacity: .55; font-weight: 600; font-size: 11px; }
  </style><h1>${section} · ${cards.length} screenshots</h1><div class="sheet">${
    cards.map(f => `<figure><img src="file://${ROOT}${f.imagen}"><figcaption>${f.pie}<b>${f.toma}</b></figcaption></figure>`).join('')
  }</div>`;
  const file = `${out}/${section}.html`;
  writeFileSync(file, html);
  await b.go(`file://${file}`, 900);
  const height = await b.evaluate(`document.documentElement.scrollHeight`);
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1200, height, deviceScaleFactor: 1, mobile: false });
  await sleep(400);
  await b.shot(`contact-${section}`);
  console.log(`${out}/contact-${section}.png · ${cards.length} screenshots`);
}
b.close();

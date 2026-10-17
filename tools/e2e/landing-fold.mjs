/**
 * The start button is above the fold (U-39, D-??): on every game's landing page —the `intro` path
 * of each game in `paths.mjs`— the main action (the start button, or the first mode of the
 * picker in games that open with one) must be seen whole without scrolling, on a small phone
 * (320×568) and a common one (375×667), in every language (German is the longest).
 *
 *   node tools/e2e/landing-fold.mjs [<out folder>] [--only ahorcado,tango]
 *
 * It fails (✗) for each landing where the main button ends below the first viewport, and keeps
 * a screenshot of it. It was born from the owner's issue #464: the steps pushed the button down
 * and the player had to scroll to find how to start.
 */
import { mkdirSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';
import { output } from './output.mjs';
import { LANGS, EN_LABS, LABS_KEY } from '../../public/assets/js/i18n.js';
import { gameById } from '../../public/assets/js/games.js';
import { PATHS } from './paths.mjs';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output('/tmp/e2e/landing-fold');
mkdirSync(OUT, { recursive: true });
export const SIZES = [[320, 568], [375, 667]];
// Not a game's landing: the owner's panel and the lab's index
const NOT_LANDINGS = new Set(['panel', 'labs']);

const i = process.argv.indexOf('--only');
const only = i < 0 ? [] : process.argv[i + 1].split(',');
const games = Object.keys(PATHS).filter(g => PATHS[g].intro && !NOT_LANDINGS.has(g) && (!only.length || only.includes(g)));

/**
 * The main action of a landing: its Empezar button if it has one (a variant picker above it is not the action),
 * else the first mode of a picker if there is one, else the first
 * visible button of the screen that is not in the header (back, language, share).
 */
const MEASURE = `(()=>{
  const root = document.querySelector('.screen.active') || document.body;
  // getClientRects, not offsetParent: a fixed button has no offsetParent and is still on screen
  const visible = x => x.getClientRects().length > 0 && x.getBoundingClientRect().height > 0 && getComputedStyle(x).visibility !== 'hidden';
  const outside = x => !x.closest('header, nav, footer, details, dialog, .confirm, .lang-toggle, .sound-toggle, .back');
  const mode = [...root.querySelectorAll('.mode, .opcion-modo')].filter(visible).filter(outside)[0];
  const start = [...root.querySelectorAll('#btn-empezar')].filter(visible)[0];
  const main = start || mode || [...root.querySelectorAll('#btn-crear, #btn-go-setup, .btn--yellow, .btn, button')].filter(visible).filter(outside)[0];
  if (!main) return JSON.stringify({ none: true });
  const r = main.getBoundingClientRect();
  return JSON.stringify({ name: (main.textContent || main.id).trim().replace(/\\s+/g, ' ').slice(0, 30), bottom: Math.round(r.bottom + scrollY), fold: innerHeight });
})()`;

let failures = 0;
for (const [width, height] of SIZES) {
  const b = await launch({ dir: `${OUT}/profile-${width}`, out: OUT, width, height });
  for (const game of games) {
    const route = gameById(game)?.path || `${game}/`;
    for (const lang of LANGS) {
      const labs = EN_LABS.includes(lang) ? `localStorage.setItem('${LABS_KEY}', '${lang}');` : '';
      await b.open(`${SITE}/${route}`);
      await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); ${labs} 1`);
      await b.open(`${SITE}/${route}`);
      for (const step of PATHS[game].intro) { await b.evaluate(`(()=>{ ${step} ; return 1})()`); await sleep(700); }
      await b.settle(1000);
      const m = JSON.parse(await b.evaluate(MEASURE));
      const tag = `${game} ${width}×${height} ${lang}`;
      if (m.none) { console.log(`✗ ${tag}: no main button found`); failures++; continue; }
      if (m.bottom > m.fold) {
        failures++;
        console.log(`✗ ${tag}: «${m.name}» ends at ${m.bottom} px, ${m.bottom - m.fold} px below the fold`);
        await b.shot(`${game.replace(/\//g, '-')}-${width}-${lang}`);
      } else console.log(`✓ ${tag}: «${m.name}» ${m.fold - m.bottom} px to spare`);
    }
  }
  b.close();
}
console.log(failures ? `\n✗ ${failures} landing(s) with the main button below the fold` : '\n✓ every landing shows its main button without scrolling');
process.exit(failures ? 1 : 0);

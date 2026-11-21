// Every page with a footer ends in it down to the bottom edge, also with the browser's bar hidden (D-599; the owner,
// 2026-11-21: «esto aplica a toda página»). The game pages are measured by conformance.mjs (a game.json) and
// cup-games/footer-bottom.mjs (La Copa's games); this one measures the rest. Every page of the site is in one of the
// three or in NO_FOOTER, which footer-bottom.test.mjs checks, so a new page has to say where it goes.
// Usage: node tools/e2e/pages-footer-bottom.mjs [<output-folder>]. Prints ✗ if something fails.
import { output } from './output.mjs';
import { launch } from './cdp.mjs';
import { footerGapUnder, HIDDEN } from './footer-bottom.mjs';

/** The pages measured here: the home page in its languages, and every other page with a footer. */
export const PAGES = ['', 'en', 'pt', 'de', 'cup/suelto', 'records', 'today', 'labs', 'labs/home',
  'labs/artifacts', 'labs/chameleon', 'labs/code', 'labs/contraption', 'labs/dominorama', 'labs/exploding-numbers',
  'labs/flap', 'labs/memory', 'labs/pips', 'labs/stack', 'labs/sudoku'];

/** The pages with no footer of their own, each with why (R-4). */
export const NO_FOOTER = {
  case: 'a lab game of La Copa played full screen, no cover yet',
  'cup/cover': "a game's cover animation alone, framed by the home page's game sheet",
  'cup/recap': "La Copa's recap card, a single image-like screen",
  'labs/bridges/trains': "a lab demo of one piece of Tren en Vilo, no page around it",
  'labs/bridges/visitors': "a lab demo of one piece of Tren en Vilo, no page around it",
  'labs/case': 'a lab game played full screen, no cover yet',
  'labs/daily-score': "a lab study of Uno al día's scoring, no page around it",
  'labs/design': "the design system: its footers are samples inside a phone frame, not the page's own",
  'labs/footer': "the twelve footer variants side by side: samples, not the page's own",
  'labs/marquee': 'a lab strip shown alone, no page around it',
  'labs/pills': 'a lab row of filter pills shown alone, no page around it',
  'labs/splash': 'the launch splash, a full-screen moment',
  'labs/wobbles/easy': "a level of Tembleque played full screen; the game's cover has the footer",
  'labs/wobbles/hard': "a level of Tembleque played full screen; the game's cover has the footer",
  'making-of': 'a long article in its own layout, not the app',
  panel: "the owner's panel, not a player page",
  privacy: 'a text page in its own layout, not the app',
  wbr: "the owner's weekly business review, not a player page",
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const OUT = output('/tmp/pages-footer-bottom');
  const SITE = process.env.SITE || 'http://localhost:8765';
  let failures = 0;
  const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
  const b = await launch({ dir: `${OUT}/p`, out: OUT });
  for (const page of PAGES) {
    await b.open(`${SITE}/${page}${page ? '/' : ''}`, 2500);
    const under = await footerGapUnder(b, OUT, `${page.replace(/\//g, '-') || 'home'}-footer-bottom`);
    ok(!under, `/${page}: the footer reaches the bottom edge, also with the browser's bar hidden (${HIDDEN} px)${under ? ` (${under})` : ''}`);
  }
  await b.close();
  console.log(failures ? `✗ pages footer-bottom: ${failures} in red` : `pages footer-bottom: all ${PAGES.length} end in their footer`);
  process.exit(failures ? 1 : 0);
}

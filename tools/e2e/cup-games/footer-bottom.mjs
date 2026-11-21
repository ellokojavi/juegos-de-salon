// Every loose game's cover ends in its sunset down to the bottom edge, also with the browser's bar hidden (the owner,
// 2026-11-21: Reinas showed a dark band under its footer on Android). The measure is footer-bottom.mjs's, the same one
// conformance.mjs runs on the games with a game.json. A new one in SUELTOS joins on its own. Prints ✗ if something fails.
// Usage: node tools/e2e/cup-games/footer-bottom.mjs [<output-folder>] [--part <folder>]: with a part, only that game
// (queens, tango…), one GitHub job each, as cup-games/languages.mjs.
import { output } from '../output.mjs';
import { launch } from '../cdp.mjs';
import { SUELTOS } from '../../../public/assets/js/games.js';
import { footerGapUnder, HIDDEN, COVER_GAMES } from '../footer-bottom.mjs';

const OUT = output('/tmp/cup-footer-bottom');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const b = await launch({ dir: `${OUT}/p`, out: OUT });

const part = process.argv.includes('--part') ? process.argv[process.argv.indexOf('--part') + 1] : null;
if (part && !SUELTOS.some(m => m.slug === part)) throw new Error(`--part ${part}: not a standalone game (${SUELTOS.map(m => m.slug).join(', ')})`);
// A lab game's part has nothing to measure: its page is listed in pages-footer-bottom.mjs (NO_FOOTER or PAGES)
const games = SUELTOS.filter(g => COVER_GAMES.includes(g.slug) && (!part || g.slug === part));
for (const g of games) {
  await b.open(`${SITE}/${g.slug}/?lang=es`, 2500);
  const under = await footerGapUnder(b, OUT, `${g.slug}-footer-bottom`);
  ok(!under, `${g.slug}: the sunset reaches the bottom edge, also with the browser's bar hidden (${HIDDEN} px)${under ? ` (${under})` : ''}`);
}
await b.close();
console.log(failures ? `✗ cup footer-bottom: ${failures} in red` : !games.length ? `La Copa games: ${part} is in the lab, no cover to measure` : `La Copa games: ${part || `all ${games.length}`} end in the sunset`);
process.exit(failures ? 1 : 0);
